import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { playbackMouth } from './speechMouth';
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
  const mounted=useRef(true);
  const pending=useRef(false);
  const stopRequested=useRef(false);
  const playbackId=useRef('');
  const [mouth,setMouth]=useState<Vowel|null>(null);
  useEffect(()=>{
    mounted.current=true;
    if(!('__TAURI_INTERNALS__' in window)){setError('Read-aloud is available in the Windows desktop app.');setLoading(false);return;}
    let disposed=false;let unlisten:(()=>void)|undefined;
    void listen<{playbackId:string;viseme:number}>('speech-viseme',event=>{const shape=playbackMouth(playbackId.current,event.payload);if(!disposed&&shape!==undefined)setMouth(shape);}).then(fn=>{if(disposed)fn();else unlisten=fn;}).catch(e=>{if(!disposed)setError(`Mouth timing unavailable: ${String(e)}`);});
    void invoke<string[]>('speech_voices').then(v=>{if(!disposed){setVoices(v);const saved=loadSpeechPreferences();if(!saved.voice&&v.length){const next={...saved,voice:v[0]};setPreferences(next);saveSpeechPreferences(next);}else if(saved.voice&&!v.includes(saved.voice)){setError('The saved voice is unavailable. Choose an installed voice to resume playback.');}if(!v.length)setError('No enabled Windows speech voices found.');}}).catch(e=>{if(!disposed)setError(String(e));}).finally(()=>{if(!disposed)setLoading(false);});
    return ()=>{disposed=true;mounted.current=false;playbackId.current='';unlisten?.();void invoke('speech_stop').catch(()=>{});};
  },[]);
  useEffect(()=>{
    if(!speaking)return;
    const timer=setInterval(()=>{const checkedId=playbackId.current;void invoke<boolean>('speech_running').then(r=>{if(mounted.current&&checkedId===playbackId.current&&!r){playbackId.current='';setMouth(null);setSpeaking(false);}}).catch(e=>{if(mounted.current&&checkedId===playbackId.current){playbackId.current='';setMouth(null);setSpeaking(false);setError(String(e));}});},500);
    return ()=>clearInterval(timer);
  },[speaking]);
  async function stop(){playbackId.current='';setMouth(null);if(pending.current){stopRequested.current=true;return;}pending.current=true;try{await invoke('speech_stop');setSpeaking(false);}catch(e){setError(String(e));}finally{pending.current=false;}}
  async function speak(text:string){if(pending.current||!voices.includes(voice))return false;pending.current=true;playbackId.current=uid();setMouth(null);setError('');try{await invoke('speech_speak',{text,voice,rate:preferences.rate,volume:preferences.volume,playbackId:playbackId.current});if(mounted.current)setSpeaking(true);return true;}catch(e){playbackId.current='';setMouth(null);if(mounted.current)setError(String(e));return false;}finally{pending.current=false;if(stopRequested.current){stopRequested.current=false;await stop();}}}
  return {voices,voice,setVoice,automatic:preferences.automatic,setAutomatic,rate:preferences.rate,setRate,volume:preferences.volume,setVolume,speaking,mouth,error,loading,speak,stop,available:!loading&&voices.includes(voice)};
}
