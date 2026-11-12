from pathlib import Path
p=Path('src-tauri/src/generated_outfits.rs');s=p.read_text(encoding='utf-8-sig');s+='''
fn wearable_schedule_root(base:&Path,category:&str)->Result<PathBuf,String>{if !matches!(category,"hair"|"accessory"){return Err("Choose hair or accessory".into())}Ok(base.join(format!("creation-{category}")))}
#[tauri::command]pub fn wearable_creation_schedule(app:tauri::AppHandle,category:String,frequency:Option<String>)->Result<OutfitSchedule,String>{let _g=QUEUE.lock().map_err(|e|e.to_string())?;configure_schedule(&wearable_schedule_root(&root(&app)?,&category)?,frequency.as_deref(),schedule_now()?)}
#[tauri::command]pub fn wearable_creation_claim(app:tauri::AppHandle,category:String)->Result<bool,String>{let _g=QUEUE.lock().map_err(|e|e.to_string())?;claim_schedule(&wearable_schedule_root(&root(&app)?,&category)?,schedule_now()?)}
#[tauri::command]pub fn wearable_creation_result(app:tauri::AppHandle,category:String,message:String)->Result<(),String>{let _g=QUEUE.lock().map_err(|e|e.to_string())?;let dir=wearable_schedule_root(&root(&app)?,&category)?;let mut s=read_schedule(&dir)?;s.last_message=message.chars().take(500).collect();write_schedule(&dir,&s)}
''';p.write_text(s,encoding='utf-8')
p=Path('src-tauri/src/lib.rs');s=p.read_text(encoding='utf-8-sig').replace('generated_outfits::generated_outfits_schedule,','generated_outfits::generated_outfits_schedule,\n            generated_outfits::wearable_creation_schedule,\n            generated_outfits::wearable_creation_claim,\n            generated_outfits::wearable_creation_result,');p.write_text(s,encoding='utf-8')
Path('src/core/creationQueue.ts').write_text('''// Synchronous lease shared by all occasional wearable creation timers.
let occupied=false;
export function claimCreationQueue(){if(occupied)return false;occupied=true;return true;}
export function releaseCreationQueue(){occupied=false;}
''',encoding='utf-8')
Path('src/components/useWearableSchedule.ts').write_text('''import {useEffect,useRef,useState} from 'react';
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
''',encoding='utf-8')
Path('src/components/WearableScheduleControls.tsx').write_text('''import type {CreationSchedule,Frequency} from './useWearableSchedule';
export default function WearableScheduleControls({category,schedule,onChange,disabled,error}:{category:string;schedule:CreationSchedule;onChange:(f:Frequency)=>void;disabled:boolean;error:string}){return <div className="wearable-schedule"><label className="field">Occasional {category} creation<select value={schedule.frequency} disabled={disabled} onChange={e=>onChange(e.target.value as Frequency)}><option value="off">Off</option><option value="weekly">Once a week</option><option value="twice-weekly">Twice a week</option></select></label><p className="hint-soft">While Mana is open, visible and idle. Always saved for review; never equips itself. Missed weeks do not create a backlog.{schedule.nextDue?' Next eligible: '+new Date(schedule.nextDue*1000).toLocaleString()+'.':''}</p>{schedule.lastMessage&&<p className="hint-soft">Last attempt: {schedule.lastMessage}</p>}{error&&<p className="msg-error">{error}</p>}</div>}
''',encoding='utf-8')
# Existing outfit scheduling joins the same synchronous gate.
p=Path('src/components/GeneratedOutfits.tsx');s=p.read_text(encoding='utf-8-sig');s="import {claimCreationQueue,releaseCreationQueue} from '../core/creationQueue';\n"+s;s=s.replace("document.visibilityState!=='visible')return;", "document.visibilityState!=='visible'||!claimCreationQueue())return;");s=s.replace('finally{autoChecking.current=false;}','finally{autoChecking.current=false;releaseCreationQueue();}');p.write_text(s,encoding='utf-8')
# Hair/accessory components remain mounted invisibly for their schedules.
for filename,category in [('GeneratedHair.tsx','hair'),('GeneratedAccessories.tsx','accessory')]:
 p=Path('src/components/'+filename);s=p.read_text(encoding='utf-8-sig');s="import {useWearableSchedule} from './useWearableSchedule';\nimport WearableScheduleControls from './WearableScheduleControls';\n"+s
 if category=='hair':s=s.replace('onCreated,onRunningChange}:{','onCreated,onRunningChange,background=false,canAutoCreate}:{')
 else:s=s.replace('onRunningChange,chooseIdea}:{','onRunningChange,chooseIdea,background=false,canAutoCreate}:{')
 s=s.replace('assets:AvatarAssets;cfg:AvatarConfig;', 'background?:boolean;canAutoCreate?:()=>boolean;assets:AvatarAssets;cfg:AvatarConfig;',1)
 s=s.replace(' async function create(){', " const scheduled=useWearableSchedule('"+category+"',background,available,canAutoCreate,()=>create(true));\n async function create(automatic=false){")
 if category=='hair':
  s=s.replace("let url='';", "let url='';const variation=automatic?['Soft silver waves','Silver layered lengths','Silver gentle curls','Silver straight lengths','Silver loose back braid','Silver soft bob'][Math.floor(Math.random()*6)]:name;const generationPrompt=HAIR_PROMPT+' Requested hairstyle: '+variation+'. Keep compact bangs, the original silver palette and thin linework.';")
  s=s.replace('prompt:HAIR_PROMPT','prompt:generationPrompt').replace("const title=name.trim()||'Soft silver waves'", "const title=variation.trim()||'Soft silver waves'")
 else:
  s=s.replace("if(designMode==='choose'){", "if(automatic||designMode==='choose'){")
 s=s.replace("await owned.complete();if(alive.current)", "await owned.complete();if(automatic)await invoke('wearable_creation_result',{category:'"+category+"',message:title+' is waiting for review.'});if(alive.current)")
 s=s.replace("}catch(e){if(alive.current)setError(String(e));}", "}catch(e){if(automatic)await invoke('wearable_creation_result',{category:'"+category+"',message:'Creation did not finish: '+String(e)}).catch(()=>{});if(alive.current)setError(String(e));}")
 s=s.replace(' return <section className="generated-outfits">',' if(background)return null;\n return <section className="generated-outfits">',1)
 marker='<h3>Let Mana create a '+('hairstyle' if category=='hair' else 'accessory')+'</h3>'
 if marker not in s:marker='<h3>Let Mana create an accessory</h3>'
 s=s.replace(marker,marker+'<WearableScheduleControls category="'+('hairstyle' if category=='hair' else 'accessory')+'" schedule={scheduled.schedule} error={scheduled.error} disabled={running} onChange={f=>void scheduled.save(f)}/>')
 p.write_text(s,encoding='utf-8')
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8-sig');s="import GeneratedHair from './components/GeneratedHair';\nimport GeneratedAccessories from './components/GeneratedAccessories';\n"+s
needle='      {avatar.assets&&<GeneratedOutfits';idx=s.index(needle)
shared="assets={avatar.assets} cfg={cfg} available={!autoOutfitRunning&&llama.status==='ready'&&!busy&&!reflecting&&!storage.error&&!showImageGeneration&&!showOutfitPrototype&&!showWardrobe&&!showSinging&&!showVision&&!showDiary&&!showSavedImages} canAutoCreate={()=>Date.now()-lastActivityAt.current>120000&&!hasChatDraft.current&&!abortRef.current&&!mediaOccupied()} onRunningChange={setAutoOutfitRunning} beforeGenerate={()=>llama.pauseForImage()} onCreated={()=>{void avatar.reload();}}"
s=s[:idx]+"      {avatar.assets&&<><GeneratedHair background "+shared+"/><GeneratedAccessories background chooseIdea={chooseAccessoryIdea} "+shared+"/></>}\n"+s[idx:];s=s.replace("available={llama.status==='ready'&&!busy", "available={!autoOutfitRunning&&llama.status==='ready'&&!busy");p.write_text(s,encoding='utf-8')
