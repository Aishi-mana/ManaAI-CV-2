import { hasSpokenWords } from '../core/handsFree';
import { useWhisper } from '../core/useWhisper';
import { open } from '@tauri-apps/plugin-dialog';
import { useDictation } from '../core/useDictation';
import { reviewedDraft } from '../core/dictation';
import ImageReportView from './ImageReportView';
import type { SavedImage } from '../core/savedImages';
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Msg } from "../core/types";
import { cleanReply } from "../core/emotion";
import { searchChat } from "../core/chatSearch";
import ExportChatButton from './ExportChatButton';
import { useSpeech } from '../core/useSpeech';
import { AutomaticSpeech } from '../core/speechPreferences';
import type { Vowel } from '../core/avatar';
import { prepareImage } from '../core/vision';
import type { ImageAttachment } from '../core/vision';

interface Props {
  savedImages:SavedImage[];
  avatarReferenceAvailable:boolean;
  imageStatus:string;
  imageError:string;
  onVoiceMouth: (mouth:Vowel|null|undefined)=>void;
  messages: Msg[];
  busy: boolean;
  ready: boolean;
  charName: string;
  userName: string;
  onSend: (text: string,image?:ImageAttachment,compareAvatar?:boolean) => Promise<boolean>;
  onStop: () => void;
  onDraftChange: (draft: string) => void;
  onCompare: (id: string) => void;
}

export default function ChatPanel({ messages, busy, ready, charName, userName, onSend, onStop, onDraftChange, onCompare, onVoiceMouth,imageStatus,imageError,savedImages,avatarReferenceAvailable }: Props) {
  const [handsOn,setHandsOn]=useState(false),[handsStage,setHandsStage]=useState<'capture'|'waiting'|'launching'|'playing'|'cooldown'>('capture'),[handsError,setHandsError]=useState('');
  const handsActive=useRef(false),handsBaseline=useRef(new Set<string>()),handsTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const handsTranscript=useRef<((review:import('../core/dictation').DictationReview)=>void)|null>(null);
  const [compareAvatar,setCompareAvatar]=useState(true);
  const [draft, setDraft] = useState("");
  const [attachment,setAttachment]=useState<ImageAttachment|undefined>();
  const dictation=useDictation(text=>{try{const checked=reviewedDraft('',text);setDraft(current=>reviewedDraft(current,checked));}catch(e){setAttachmentError(String(e));}},[charName,userName]);
  const whisper=useWhisper(review=>{if(handsActive.current)handsTranscript.current?.(review);else dictation.setReview(review);},[charName,userName]);
  const [microphoneEngine,setMicrophoneEngine]=useState<'whisper'|'windows'>('whisper');
  const [whisperSetup,setWhisperSetup]=useState(false);
  const [inputOpen,setInputOpen]=useState(false);
  const micActive=dictation.listening||whisper.phase!=='idle';
  const [preparing,setPreparing]=useState(false);
  const [attachmentError,setAttachmentError]=useState('');
  const imageInput=useRef<HTMLInputElement>(null),imageSelection=useRef(0),draftCallback=useRef(onDraftChange);
  draftCallback.current=onDraftChange;
  useEffect(()=>{draftCallback.current(draft||attachment?.filename||(handsOn?'[Hands-free active]':dictation.review?'[Reviewing transcription]':micActive?'[Listening]':preparing?'[Preparing image]':''));},[draft,attachment,preparing,micActive,dictation.review,handsOn]);
  useEffect(()=>()=>{imageSelection.current++;},[]);
  async function chooseImage(file:File){const token=++imageSelection.current;setPreparing(true);setAttachment(undefined);setAttachmentError('');try{const dataUrl=await prepareImage(file);if(token===imageSelection.current)setAttachment({filename:file.name.slice(0,200),dataUrl});}catch(e){if(token===imageSelection.current)setAttachmentError(String(e));}finally{if(token===imageSelection.current)setPreparing(false);}}
  const speech=useSpeech();
  useEffect(()=>{onVoiceMouth(speech.available?speech.mouth:undefined);},[speech.available,speech.mouth,onVoiceMouth]);
  const [voiceOpen,setVoiceOpen]=useState(false);
  const autoSpeech=useRef<AutomaticSpeech|null>(null);
  if(!autoSpeech.current)autoSpeech.current=new AutomaticSpeech(messages);
  useEffect(()=>{
    const text=autoSpeech.current!.next(messages,busy,speech.automatic&&!handsOn,speech.available&&!speech.speaking&&!micActive,charName);
    if(text)void speech.speak(text);
  },[messages,busy,speech.automatic&&!handsOn,speech.available,speech.speaking,charName,micActive,handsOn]);
  function stopHandsFree(reason=''){handsActive.current=false;setHandsOn(false);setHandsError(reason);clearTimeout(handsTimer.current);void whisper.cancel();void speech.stop();if(handsStage==='waiting')onStop();}
  function enableHandsFree(){if(!ready||busy||micActive||draft.trim()||attachment||dictation.review||preparing||!speech.available||speech.speaking||speech.volume===0)return;handsActive.current=true;setHandsOn(true);setHandsStage('capture');setHandsError('');setMicrophoneEngine('whisper');void whisper.start({autoEnd:true});}
  handsTranscript.current=review=>{if(!handsActive.current)return;if(!hasSpokenWords(review.text)){stopHandsFree('No spoken words recognized. Background sound was not sent; try again when ready.');return;}if(!ready||busy||draft.trim()||attachment){dictation.setReview(review);stopHandsFree('Hands-free paused: review the transcription before sending.');return;}handsBaseline.current=new Set(messages.filter(m=>m.role==='assistant').map(m=>m.id));setHandsStage('waiting');followLatest.current=true;setShowLatest(false);void onSend(review.text).then(accepted=>{if(!accepted){dictation.setReview(review);stopHandsFree('Message was not sent. Review the transcription before retrying.');}}).catch(e=>{dictation.setReview(review);stopHandsFree(String(e));});};
  useEffect(()=>{if(!handsOn)return;if(!ready||whisper.error||speech.error){stopHandsFree(whisper.error||speech.error||'Hands-free stopped: model is unavailable.');return;}
    if(handsStage==='waiting'&&!busy){const reply=messages.filter(m=>m.role==='assistant'&&!handsBaseline.current.has(m.id)).slice(-1)[0];if(!reply)return;const text=cleanReply(reply.content,charName).text.trim();if(reply.error||!text){stopHandsFree(reply.error||'No reply to read aloud.');return;}setHandsStage('launching');void speech.speak(text).then(started=>{if(!handsActive.current)return;if(started)setHandsStage('playing');else stopHandsFree('Reply playback could not start.');});}
    else if(handsStage==='playing'&&!speech.speaking){setHandsStage('cooldown');handsTimer.current=setTimeout(()=>{if(handsActive.current){setHandsStage('capture');void whisper.start({autoEnd:true});}},700);}
  },[handsOn,handsStage,ready,busy,messages,speech.speaking,speech.error,whisper.error]);
  const stopHandsRef=useRef(stopHandsFree);stopHandsRef.current=stopHandsFree;
  useEffect(()=>{const hide=()=>{if(document.visibilityState==='hidden'&&handsActive.current)stopHandsRef.current('Hands-free stopped while the app was hidden.');};document.addEventListener('visibilitychange',hide);return ()=>{document.removeEventListener('visibilitychange',hide);handsActive.current=false;clearTimeout(handsTimer.current);};},[]);
  const endRef = useRef<HTMLDivElement>(null);
  const logRef=useRef<HTMLDivElement>(null);
  const followLatest=useRef(true);
  const [showLatest,setShowLatest]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [selectedMatch,setSelectedMatch]=useState<string|null>(null);
  const messageNodes=useRef(new Map<string,HTMLDivElement>());
  const matches=useMemo(()=>searchChat(messages,query,charName),[messages,query,charName]);
  const matchIndex=selectedMatch ? matches.indexOf(selectedMatch) : -1;

  function jumpMatch(index:number) {
    if(!matches.length)return;
    const id=matches[(index+matches.length)%matches.length];
    followLatest.current=false;setShowLatest(true);setSelectedMatch(id);
    messageNodes.current.get(id)?.scrollIntoView({block:'center'});
  }
  function latest() {
    setSelectedMatch(null);followLatest.current=true;setShowLatest(false);
    endRef.current?.scrollIntoView({block:'end'});
  }

  useEffect(() => {
    if(followLatest.current)endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function submit() {
    const text = draft.trim()||(attachment?'What do you notice in this image?':'');
    if (!text || busy || !ready||preparing||micActive||dictation.review||handsOn) return;
    followLatest.current=true;setShowLatest(false);
    const originalDraft=draft,originalAttachment=attachment;
    if(await onSend(text,originalAttachment,compareAvatar&&avatarReferenceAvailable)){
      setDraft(current=>current===originalDraft?'':current);
      setAttachment(current=>current===originalAttachment?undefined:current);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <>
      <div className="chat-search">
        <button className="btn" aria-expanded={voiceOpen} onClick={()=>setVoiceOpen(!voiceOpen)}>Voice</button>
        {speech.speaking&&<button className="btn" onClick={()=>handsOn?stopHandsFree():void speech.stop()}>Stop voice</button>}
        {voiceOpen&&<div className="voice-controls">
          <label>Read-aloud voice <select aria-label="Read-aloud voice" value={speech.voice} disabled={speech.loading||speech.speaking} onChange={e=>speech.setVoice(e.target.value)}>{!speech.voices.includes(speech.voice)&&<option value={speech.voice}>{speech.voice||'No voice selected'}</option>}{speech.voices.map(v=><option key={v}>{v}</option>)}</select></label>
          <label className="voice-auto"><input type="checkbox" checked={speech.automatic} onChange={e=>speech.setAutomatic(e.target.checked)}/> Automatically read new replies</label>
          <label>Speed: {speech.rate===0?'Normal':speech.rate<0?`Slower (${speech.rate})`:`Faster (+${speech.rate})`}<input aria-label="Speech speed" type="range" min={-10} max={10} step={1} value={speech.rate} onChange={e=>speech.setRate(Number(e.target.value))}/></label>
          <label>Volume: {speech.volume}%{speech.volume===0?' (muted)':''}<input aria-label="Speech volume" type="range" min={0} max={100} step={1} value={speech.volume} onChange={e=>speech.setVolume(Number(e.target.value))}/></label>
          <span className="hint-soft">{speech.loading?'Loading Windows voices…':'Saved settings · speed and volume apply to the next playback · old replies never replay automatically · no playback queue'}</span>
        </div>}
        {speech.error&&<span role="status">{speech.error}</span>}
        <ExportChatButton messages={messages} charName={charName} userName={userName} disabled={busy}/>
        <button className="btn" aria-expanded={searchOpen} onClick={()=>{
          setSearchOpen(!searchOpen);if(searchOpen){setQuery("");setSelectedMatch(null);}
        }}>{searchOpen ? 'Close search' : 'Search chat'}</button>
        {searchOpen&&<>
          <input aria-label="Search chat history" type="search" maxLength={200} value={query}
            placeholder="Search messages…" onChange={e=>{setQuery(e.target.value);setSelectedMatch(null);}}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();jumpMatch(matchIndex+1);}}}/>
          <span role="status">{query.trim() ? matches.length ? `${matchIndex>=0?matchIndex+1:'–'} of ${matches.length} matches` : 'No matches' : 'Enter text to search'}</span>
          <button className="btn" disabled={!matches.length} onClick={()=>jumpMatch(matchIndex<0?matches.length-1:matchIndex-1)}>Previous</button>
          <button className="btn" disabled={!matches.length} onClick={()=>jumpMatch(matchIndex+1)}>Next</button>
          <button className="btn" onClick={latest}>Latest</button>
        </>}
      </div>
      <div ref={logRef} className="messages" role="log" aria-live="polite" onScroll={()=>{const log=logRef.current;if(!log)return;const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<80;followLatest.current=nearBottom;setShowLatest(!nearBottom);}}>
        {messages.length === 0 && (
          <p className="empty">
            {ready
              ? `Say hi to ${charName}.`
              : "Start the model with the button above, then say hi."}
          </p>
        )}

        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} ref={node=>{if(node)messageNodes.current.set(m.id,node);else messageNodes.current.delete(m.id);}} className={`row me${selectedMatch===m.id?' search-selected':''}`}>
                <div className="bubble me">{m.content}{m.imageReport&&<ImageReportView report={m.imageReport} images={savedImages} disabled={handsOn||busy||preparing||!!attachment} onReuse={image=>{setAttachment({filename:image.filename,dataUrl:image.dataUrl});setAttachmentError('');}}/>}</div>
              </div>
            );
          }
          const { text, emotion } = cleanReply(m.content, charName);
          const waiting = busy && !text && !m.error;
          return (
            <div key={m.id} ref={node=>{if(node)messageNodes.current.set(m.id,node);else messageNodes.current.delete(m.id);}} className={`row mana${selectedMatch===m.id?' search-selected':''}`}>
              <div className="bubble mana">
                {waiting ? (
                  <span className="dots" aria-label={`${charName} is typing`}>
                    <i /> <i /> <i />
                  </span>
                ) : (
                  text
                )}
                {m.error && <div className="msg-error">{m.error}</div>}
                {!busy&&!m.error&&text.trim()&&speech.available&&<div><button className="btn" disabled={handsOn||speech.speaking||micActive} onClick={()=>void speech.speak(text)}>Speak</button></div>}
                {m.diagnostics && <details><summary>Reply diagnostics</summary>
                  <p className="hint-soft">Application checks can misfire. These attempts are debug evidence, not accepted chat or memory facts.</p>
                  {m.diagnostics.attempts.map((attempt, i) => <div key={i}><strong>Attempt {i + 1}: {attempt.issue === "capability" ? "Unsupported capability claim" : attempt.issue === "return-role" ? "Incorrect welcome-back roles" : attempt.issue === "repetition" ? "Repeated wording" : "Passed checks"}</strong><p className="memory-content">{attempt.text}</p></div>)}
                  <button className="btn" disabled={busy || !ready || !!draft.trim()} onClick={() => onCompare(m.id)}>Compare with simpler prompt</button>
                  <p className="hint-soft">Uses the same model and temperature, with this user message and a short prompt only. No history or saved context. Does not affect bond, mood, or memories.</p>
                  {m.diagnostics.comparison && <p className="memory-content">{m.diagnostics.comparison}</p>}
                </details>}
              </div>
              {emotion && !busy && <span className="tag">{emotion}</span>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showLatest&&<button className="btn jump-latest" onClick={latest}>Jump to latest</button>}
      {(attachment||preparing||attachmentError||imageError||imageStatus)&&<div className="chat-attachment">
        {attachment&&<><img src={attachment.dataUrl} alt={`Attached image: ${attachment.filename}`}/><span>{attachment.filename}</span><button className="btn" disabled={busy} onClick={()=>{imageSelection.current++;setAttachment(undefined);}}>Remove image</button><span className="hint-soft">The prepared image is saved locally after inspection.</span></>}
        {preparing&&<span role="status">Preparing image…</span>}
        {imageStatus&&<span role="status">{imageStatus}</span>}
        {(attachmentError||imageError)&&<span className="msg-error" role="alert">{attachmentError||imageError}</span>}
      </div>}
      <div className="input-toolbar">
        <button className="btn" disabled={!handsOn&&(!ready||busy||micActive||!!draft.trim()||!!attachment||!!dictation.review||preparing||!speech.available||speech.speaking||speech.volume===0)} onClick={()=>handsOn?stopHandsFree():enableHandsFree()}>{handsOn?'Stop hands-free':'Start hands-free'}</button>
        {handsError&&<span className="msg-error" role="alert">{handsError}</span>}
        <button className="btn" aria-expanded={inputOpen} aria-controls="voice-input-settings" onClick={()=>setInputOpen(!inputOpen)}>Voice input</button>
        {microphoneEngine==='windows'?<button className="btn" disabled={!micActive&&(!!dictation.review||busy||preparing||speech.speaking||!dictation.languages.length)} onClick={()=>void (dictation.listening?dictation.stop():dictation.start())}>{dictation.listening?'Cancel listening':'Microphone'}</button>:<><button className="btn" disabled={handsOn||busy||preparing||speech.speaking||!!dictation.review||whisper.phase!=='idle'} onClick={()=>void whisper.start()}>Record microphone</button>{!handsOn&&whisper.phase==='recording'&&<button className="btn" onClick={()=>void whisper.finish()}>Transcribe</button>}{!handsOn&&whisper.phase!=='idle'&&<button className="btn" onClick={()=>void whisper.cancel()}>Cancel</button>}</>}
        {whisper.phase==='recording'&&<div className="recording-meter"><span role="timer" aria-label="Recording time">{whisper.elapsed.toFixed(1)} / 15 s</span><meter aria-label="Microphone input level" min={0} max={1} value={whisper.level}/><span className="hint-soft">Input level</span></div>}
        <span className="hint-soft" role="status">{handsOn?handsStage==='waiting'?'Hands-free: waiting for reply…':handsStage==='launching'||handsStage==='playing'?'Hands-free: speaking…':handsStage==='cooldown'?'Hands-free: resuming…':whisper.phase==='transcribing'?'Hands-free: transcribing…':whisper.phase==='recording'&&whisper.elapsed<0.8?'Hands-free: calibrating background — wait briefly…':'Hands-free: listening for your pause…':whisper.phase==='transcribing'?'Transcribing locally…':whisper.phase==='starting'?'Opening microphone…':dictation.listening?'Listening…':dictation.review?'Review transcription below':!micActive?microphoneEngine==='whisper'?'Whisper · English':'Windows recognition':''}</span>
        {(microphoneEngine==='whisper'?whisper.error:dictation.error)&&<span className="msg-error" role="alert">{microphoneEngine==='whisper'?whisper.error:dictation.error}</span>}
      </div>
      {inputOpen&&<section id="voice-input-settings" className="input-settings" aria-label="Voice input settings"><label>Speech recognition <select aria-label="Speech recognition" value={microphoneEngine} disabled={handsOn||micActive||!!dictation.review} onChange={e=>setMicrophoneEngine(e.target.value as 'whisper'|'windows')}><option value="whisper">Local Whisper (English)</option><option value="windows">Windows recognition</option></select></label>
      {microphoneEngine==='windows'?<label>Microphone language <select aria-label="Microphone language" value={dictation.language} disabled={micActive||!dictation.languages.length} onChange={e=>dictation.setLanguage(e.target.value)}>{!dictation.languages.length&&<option value="">Unavailable</option>}{dictation.languages.map(v=><option key={v.id} value={v.id}>{v.language} — {v.name}</option>)}</select></label>:<><button className="btn" aria-expanded={whisperSetup} disabled={handsOn||micActive} onClick={()=>setWhisperSetup(!whisperSetup)}>Whisper setup</button>{whisperSetup&&<div className="whisper-paths">{(['exePath','modelPath'] as const).map(key=><label key={key}>{key==='exePath'?'whisper-cli executable':'Whisper GGML model'}<div className="input-path"><input value={whisper.settings[key]} disabled={micActive} onChange={e=>whisper.setSettings({...whisper.settings,[key]:e.target.value})}/><button className="btn" disabled={micActive} onClick={()=>void open({multiple:false,filters:[{name:key==='exePath'?'Executable':'Model',extensions:[key==='exePath'?'exe':'bin']}]}).then(path=>{if(typeof path==='string')whisper.setSettings({...whisper.settings,[key]:path});})}>Browse</button></div></label>)}</div>}</>}
      <p className="hint-soft">Hands-free automatically sends recognized speech and reads replies aloud. Stop ends the loop; it never starts automatically. Use headphones to reduce feedback. {microphoneEngine==='whisper'?'Record up to 15 seconds, then transcribe locally on CPU. Temporary audio is deleted after processing.':'Windows listens for one phrase; Cancel discards pending recognition.'} Outside hands-free, review before adding to the draft and Send manually.</p></section>}
      {attachment&&<label className="image-compare hint-soft"><input type="checkbox" checked={compareAvatar&&avatarReferenceAvailable} disabled={busy||!avatarReferenceAvailable} onChange={e=>setCompareAvatar(e.target.checked)}/> Compare with current avatar{!avatarReferenceAvailable?' (avatar unavailable)':' · resemblance only'}</label>}
      {dictation.review&&<div className="transcription-review"><label>Review transcription<textarea rows={3} aria-label="Review transcription" value={dictation.review.text} onChange={e=>dictation.setReview(current=>current?{...current,text:e.target.value}:null)}/></label><span className="hint-soft">{dictation.review.confidence===null?'Review the wording before adding':dictation.review.confidence<0.65?'Recognizer is uncertain — check wording':'Check wording before adding'}{dictation.review.confidence!==null?' · confidence is a recognizer score, not accuracy.':''}</span>{dictation.review.alternatives.map(text=><button className="btn" key={text} onClick={()=>dictation.setReview(current=>current?{...current,text}:null)}>{text}</button>)}<button className="btn" disabled={!dictation.review.text.trim()||busy} onClick={dictation.accept}>Add to draft</button><button className="btn" onClick={()=>dictation.setReview(null)}>Discard transcription</button></div>}
      <div className="composer">
        <input ref={imageInput} hidden type="file" accept="image/png,image/jpeg" aria-label="Attach image" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void chooseImage(file);}}/>
        <button className="btn" disabled={handsOn||busy||preparing} onClick={()=>imageInput.current?.click()}>Attach image</button>
        <textarea
          value={draft}
          readOnly={handsOn}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={ready ? `Message ${charName}  (Enter to send, Shift+Enter for a new line)` : "The model is not running yet"}
          aria-label="Message"
        />
        {busy ? (
          <button className="btn" onClick={()=>handsOn?stopHandsFree():onStop()}>
            Stop
          </button>
        ) : (
          <button className="btn primary" onClick={()=>void submit()} disabled={handsOn || !ready || preparing || micActive || !!dictation.review || (!draft.trim()&&!attachment)}>
            Send
          </button>
        )}
      </div>
    </>
  );
}
