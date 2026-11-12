import {useEffect,useRef,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {claimCreationQueue,releaseCreationQueue} from '../core/creationQueue';
export type Frequency='off'|'weekly'|'twice-weekly';
export interface CreationSchedule{frequency:Frequency;nextDue:number|null;lastMessage:string}
export function useWearableSchedule(category:'hair'|'accessory',background:boolean,available:boolean,canAutoCreate:(()=>boolean)|undefined,create:()=>Promise<void>){
 const [schedule,setSchedule]=useState<CreationSchedule>({frequency:'off',nextDue:null,lastMessage:''}),[error,setError]=useState('');
 const latest=useRef({available,canAutoCreate,create});latest.current={available,canAutoCreate,create};
 useEffect(()=>{let alive=true;void invoke<CreationSchedule>('wearable_creation_schedule',{category,frequency:null}).then(s=>{if(alive)setSchedule(s);}).catch(e=>{if(alive)setError(String(e));});return()=>{alive=false;};},[category]);
 useEffect(()=>{if(!background)return;let alive=true,checking=false;const tick=async()=>{const r=latest.current;if(checking||!r.available||!r.canAutoCreate?.()||document.visibilityState!=='visible'||!claimCreationQueue())return;checking=true;try{if(await invoke<boolean>('wearable_creation_claim',{category})){await r.create();}}catch(e){if(alive)setError(String(e));}finally{checking=false;releaseCreationQueue();}};void tick();const timer=window.setInterval(()=>void tick(),60000);return()=>{alive=false;window.clearInterval(timer);};},[category,background]);
 const save=async(frequency:Frequency)=>{try{setSchedule(await invoke<CreationSchedule>('wearable_creation_schedule',{category,frequency}));setError('');}catch(e){setError(String(e));}};
 return {schedule,error,save};
}
