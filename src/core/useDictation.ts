import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {recognitionLanguages,dictationReview} from './dictation';
import type {RecognitionLanguage, DictationReview} from './dictation';
export function useDictation(onText:(text:string)=>void,names:string[]=[]){
 const [review,setReview]=useState<DictationReview|null>(null);
 const [languages,setLanguages]=useState<RecognitionLanguage[]>([]),[language,setLanguage]=useState(''),[listening,setListening]=useState(false),[error,setError]=useState('');
 const alive=useRef(true),pending=useRef(false),cancelled=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),callback=useRef(onText);callback.current=onText;
 useEffect(()=>{alive.current=true;void invoke('dictation_languages').then(value=>{if(!alive.current)return;const list=recognitionLanguages(value);setLanguages(list);setLanguage(list[0]?.id??'');if(!list.length)setError('No Windows speech recognizer installed. Install a speech language in Windows Settings.');}).catch(e=>{if(alive.current)setError(String(e));});return ()=>{alive.current=false;cancelled.current=true;clearTimeout(timer.current);void invoke('dictation_stop').catch(()=>{});};},[]);
 async function stop(){cancelled.current=true;clearTimeout(timer.current);try{await invoke('dictation_stop');}catch(e){if(alive.current)setError(String(e));}if(!pending.current&&alive.current)setListening(false);}
 async function poll(){if(!alive.current||cancelled.current)return;try{const result=await invoke<{done:boolean;text?:string;error?:string;confidence?:number;alternatives?:string[]}>('dictation_poll');if(!alive.current||cancelled.current)return;if(result.done){setListening(false);if(result.error)setError(result.error);else if(result.text)setReview(dictationReview(result));else setError('No speech recognized.');}else timer.current=setTimeout(()=>void poll(),300);}catch(e){if(alive.current&&!cancelled.current){setListening(false);setError(String(e));}void invoke('dictation_stop').catch(()=>{});}}
 async function start(){if(pending.current||listening||!languages.some(v=>v.id===language))return;pending.current=true;cancelled.current=false;setListening(true);setReview(null);setError('');try{await invoke('dictation_start',{id:language,names:names.map(n=>n.trim().slice(0,60)).filter(Boolean).slice(0,2)});if(cancelled.current||!alive.current){await invoke('dictation_stop');if(alive.current)setListening(false);}else void poll();}catch(e){if(alive.current){setListening(false);if(!cancelled.current)setError(String(e));}}finally{pending.current=false;}}
 return {review,setReview,accept:()=>{if(review){callback.current(review.text);setReview(null);}},languages,language,setLanguage,listening,error,start,stop};
}
