import {setMediaOccupied} from './mediaActivity';
import {ensureCustomVoice} from './customVoiceService';
import {CUSTOM_VOICE,loadCustomVoice,voiceReference,customSpeechText,customSpeechRate,waveBytes,audioMouth} from './customVoice';
import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { playbackMouth, speechMouthTrack } from './speechMouth';
import type { Vowel } from './avatar';
import { uid } from './types';
import { loadSpeechPreferences, saveSpeechPreferences, validateSpeechPreferences } from './speechPreferences';

export function useSpeech() {
  const [voices,setVoices]=useState<string[]>([]);
  const [preferences,setPreferences]=useState(loadSpeechPreferences);
  const voice=preferences.voice;
  function setVoice(voice:string){const next={...preferences,voice};setPreferences(next);saveSpeechPreferences(next);setError('');}
  function setAutomatic(automatic:boolean){const next={...preferences,automatic};setPreferences(next);saveSpeechPreferences(next);if(!automatic)void stop();}
  function setRate(rate:number){const next=validateSpeechPreferences({...preferences,rate});setPreferences(next);saveSpeechPreferences(next);}
  function setVolume(volume:number){const next=validateSpeechPreferences({...preferences,volume});setPreferences(next);saveSpeechPreferences(next);}
  const [speaking,setSpeaking]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [voiceStarting,setVoiceStarting]=useState(false);
  useEffect(()=>{
    if(voice!==CUSTOM_VOICE||!('__TAURI_INTERNALS__' in window))return;
    let active=true;setVoiceStarting(true);
    void ensureCustomVoice().catch(e=>{if(active)setError(String(e));}).finally(()=>{if(active)setVoiceStarting(false);});
    return()=>{active=false;setVoiceStarting(false);};
  },[voice]);
  const mounted=useRef(true);
  const pending=useRef(false);
  const stopRequested=useRef(false);
  const playbackId=useRef('');
  const customAudio=useRef<HTMLAudioElement|null>(null);
  const customUrl=useRef('');
  const mouthTimer=useRef<ReturnType<typeof setInterval>|null>(null);
  const [generating,setGenerating]=useState(false);
  const [musicPlaying,setMusicPlaying]=useState(false);
  function clearCustom(){setMediaOccupied(false);if(mounted.current)setMusicPlaying(false);customAudio.current?.pause();customAudio.current=null;if(customUrl.current)URL.revokeObjectURL(customUrl.current);customUrl.current='';if(mouthTimer.current)clearInterval(mouthTimer.current);mouthTimer.current=null;}
  const [mouth,setMouth]=useState<Vowel|null>(null);
  useEffect(()=>{
    mounted.current=true;
    if(!('__TAURI_INTERNALS__' in window)){setError('Read-aloud is available in the Windows desktop app.');setLoading(false);return;}
    let disposed=false;let unlisten:(()=>void)|undefined;
    void listen<{playbackId:string;viseme:number}>('speech-viseme',event=>{const shape=playbackMouth(playbackId.current,event.payload);if(!disposed&&shape!==undefined)setMouth(shape);}).then(fn=>{if(disposed)fn();else unlisten=fn;}).catch(e=>{if(!disposed)setError(`Mouth timing unavailable: ${String(e)}`);});
    void invoke<string[]>('speech_voices').then(v=>{if(!disposed){v=[...v,CUSTOM_VOICE];setVoices(v);const saved=loadSpeechPreferences();if(!saved.voice&&v.length){const next={...saved,voice:v[0]};setPreferences(next);saveSpeechPreferences(next);}else if(saved.voice&&!v.includes(saved.voice)){setError('The saved voice is unavailable. Choose an installed voice to resume playback.');}if(!v.length)setError('No enabled Windows speech voices found.');}}).catch(e=>{if(!disposed){setVoices([CUSTOM_VOICE]);if(loadSpeechPreferences().voice!==CUSTOM_VOICE)setError(String(e));}}).finally(()=>{if(!disposed)setLoading(false);});
    return ()=>{disposed=true;mounted.current=false;playbackId.current='';clearCustom();void invoke('custom_voice_stop').catch(()=>{});unlisten?.();void invoke('speech_stop').catch(()=>{});};
  },[]);
  useEffect(()=>{
    if(!speaking||voice===CUSTOM_VOICE||musicPlaying)return;
    const timer=setInterval(()=>{const checkedId=playbackId.current;void invoke<boolean>('speech_running').then(r=>{if(mounted.current&&checkedId===playbackId.current&&!r){playbackId.current='';setMouth(null);setSpeaking(false);}}).catch(e=>{if(mounted.current&&checkedId===playbackId.current){playbackId.current='';setMouth(null);setSpeaking(false);setError(String(e));}});},500);
    return ()=>clearInterval(timer);
  },[speaking,voice,musicPlaying]);
  async function playCustomAudio(bytes: Uint8Array, text: string, id: string, music = false) {
    const context = new AudioContext();
    let decoded: AudioBuffer;
    try {
      decoded = await context.decodeAudioData(bytes.slice().buffer as ArrayBuffer);
    } finally {
      await context.close();
    }
    if (playbackId.current !== id) return false;
    const samples = decoded.getChannelData(0);
    if (!samples.some(value => Math.abs(value) > 0.001)) throw Error("Voice service returned silence. Check custom-voice.log.");
    const mouthAt = music
      ? (seconds: number) => audioMouth(samples, seconds, decoded.sampleRate, text, decoded.duration)
      : speechMouthTrack(samples, decoded.sampleRate, text);
    customUrl.current = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: "audio/wav" }));
    const audio = new Audio(customUrl.current);
    customAudio.current = audio;
    audio.volume = preferences.volume / 100;
    function finish(error?: string) {
      if (playbackId.current !== id) return;
      clearCustom();
      playbackId.current = "";
      setMouth(null);
      setSpeaking(false);
      if (error) setError(error);
    }
    audio.onended = () => finish();
    audio.onerror = () => finish("Custom audio playback failed.");
    audio.onwaiting = () => { if (playbackId.current === id) setMouth(null); };
    await audio.play();
    if (playbackId.current !== id) return false;
    setGenerating(false);
    const updateMouth = () => {
      if (playbackId.current === id) {
        setMouth(audio.paused || audio.ended || audio.readyState < 3 ? null : mouthAt(audio.currentTime));
      }
    };
    updateMouth();
    mouthTimer.current = setInterval(updateMouth, music ? 40 : 20);
    return true;
  }
  async function playMusic(path:string){
    if(pending.current||speaking||preferences.volume===0)return false;
    pending.current=true;setMediaOccupied(true);const id=uid();playbackId.current=id;setError('');setMusicPlaying(true);setSpeaking(true);
    try{const data=await invoke<ArrayBuffer|number[]>('singing_audio',{path});if(!mounted.current||playbackId.current!==id)return false;const bytes=data instanceof ArrayBuffer?new Uint8Array(data):new Uint8Array(data);if(bytes.length<44||String.fromCharCode(...bytes.slice(0,4))!=='RIFF')throw Error('Musical clip is not WAV audio.');return await playCustomAudio(bytes,'uauauauauauau',id,true);}
    catch(e){if(playbackId.current===id){clearCustom();setSpeaking(false);setError(`Musical moment unavailable: ${String(e)}`);}return false;}
    finally{pending.current=false;if(stopRequested.current){stopRequested.current=false;await stop();}}
  }
  useEffect(()=>{if(musicPlaying&&preferences.volume===0)void stop();},[musicPlaying,preferences.volume]);
  async function stop(){playbackId.current='';clearCustom();setGenerating(false);setSpeaking(false);void invoke('custom_voice_stop').catch(()=>{});setMouth(null);if(pending.current){stopRequested.current=true;return;}pending.current=true;try{await invoke('speech_stop');setSpeaking(false);}catch(e){setError(String(e));}finally{pending.current=false;}}
  async function speak(text:string,emotion?:string|null){if(pending.current||!voices.includes(voice))return false;pending.current=true;setMediaOccupied(true);playbackId.current=uid();const requestId=playbackId.current;setMouth(null);setError('');try{if(voice===CUSTOM_VOICE){const id=playbackId.current;const config=loadCustomVoice();const spokenText=customSpeechText(text,config);setGenerating(true);setSpeaking(true);await invoke('custom_voice_generate',{voiceProfile:config.chatVoiceProfile,trainedVoice:config.trainedChat,port:config.port,text:spokenText,referencePath:voiceReference(config,emotion).path,referenceText:voiceReference(config,emotion).text,referenceLanguage:config.preset==='automatic'?'en':config.referenceLanguage,replyLanguage:config.replyLanguage,rate:customSpeechRate(preferences.rate,config)});let result:{done:boolean;audio?:string;error?:string}={done:false};const deadline=Date.now()+(config.trainedChat?300000:190000);while(!result.done){if(!mounted.current||playbackId.current!==id){await invoke('custom_voice_stop').catch(()=>{});return false;}if(Date.now()>deadline)throw Error('Custom voice timed out.');await new Promise(r=>setTimeout(r,250));if(playbackId.current!==id){await invoke('custom_voice_stop').catch(()=>{});return false;}result=await invoke('custom_voice_poll');}if(result.error)throw Error(result.error);return await playCustomAudio(waveBytes(result.audio??''),spokenText,id);}await invoke('speech_speak',{text,voice,rate:preferences.rate,volume:preferences.volume,playbackId:playbackId.current});if(mounted.current)setSpeaking(true);return true;}catch(e){if(playbackId.current!==requestId)return false;playbackId.current='';setMouth(null);if(mounted.current){setGenerating(false);setSpeaking(false);setError(String(e));}void invoke('custom_voice_stop').catch(()=>{});clearCustom();return false;}finally{pending.current=false;if(stopRequested.current){stopRequested.current=false;await stop();}}}
  return {voices,voice,setVoice,automatic:preferences.automatic,setAutomatic,rate:preferences.rate,setRate,volume:preferences.volume,setVolume,speaking,generating,musicPlaying,mouth,error,loading,voiceStarting,speak,playMusic,stop,available:!loading&&!voiceStarting&&voices.includes(voice)};
}
