import {useState} from 'react';
import type {AvatarAssets,AvatarConfig} from '../core/avatar';
import {preferredLookNames,validateOutfitRoutine,type DailyChoices,type OutfitPeriod} from '../core/outfitRoutine';
import {resolveLoadout,wardrobePreviewLayers,type Entry,type Wardrobe} from '../core/wardrobe';
import WardrobeThumbnail from './WardrobeThumbnail';
import {referenceLayers} from '../core/avatarReference';

const periods = ['morning','night'] as const;
const emptyChoices:DailyChoices={outfits:[],hairstyles:[],accessories:[]};

export default function DailyOutfits({cfg,data,assets,timeZone,onChange}:{
 assets?:AvatarAssets;cfg:AvatarConfig;data:Wardrobe;timeZone?:string;onChange:(cfg:AvatarConfig)=>void;
}){
 const routine=validateOutfitRoutine(cfg.outfitRoutine);
 const [error,setError]=useState('');
 const [slot,setSlot]=useState<OutfitPeriod>('morning');
 const choices=routine.choices?.[slot]??emptyChoices;
 const looks=cfg.looks??[];
 const preferred=preferredLookNames(looks,routine);

 function update(next:typeof routine){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.morning)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.night)||next.morning>=next.night){
   setError('Set morning earlier than night.');
   return;
  }
  setError('');
  onChange({...cfg,outfitRoutine:next});
 }

 function toggleChoice(category:keyof DailyChoices,id:string){
  const items=choices[category];
  const next=items.includes(id)?items.filter(item=>item!==id):[...items,id];
  update({...routine,choices:{...routine.choices,[slot]:{...choices,[category]:next}}});
 }

 function togglePreferred(name:string){
  const next=preferred.includes(name)?preferred.filter(item=>item!==name):[...preferred,name];
  update({...routine,preferredLookNames:next,preferredSets:undefined});
 }

 function label(category:keyof DailyChoices,id:string,items:Entry[]){
  const alias=category==='outfits'?cfg.outfitNames?.[id]:cfg.itemNames?.[(category==='hairstyles'?'hair':'accessories')+':'+id];
  return alias??items.find(item=>item.name===id)?.label??id;
 }

 return <section>
  <h3>Morning &amp; night looks</h3>
  <p className="hint-soft">Approve what Mana can wear in each period. An empty category keeps what she is wearing.</p>
  <label className="check"><input type="checkbox" checked={routine.enabled} onChange={e=>update({...routine,enabled:e.target.checked})}/>Let Mana choose her daily look</label>
  <p className="hint-soft">Times use {timeZone??'your journal timezone'}. On reopening, Mana catches up to the current period once. Changes wait until you close wardrobe or background settings.</p>
  <div className="grid2">
   <label className="field">Morning<input type="time" value={routine.morning} onChange={e=>update({...routine,morning:e.target.value})}/></label>
   <label className="field">Night<input type="time" value={routine.night} onChange={e=>update({...routine,night:e.target.value})}/></label>
  </div>
  <div className="builder-actions" role="group" aria-label="Daily look period">
   {periods.map(period=><button className={'btn'+(slot===period?' primary':'')} aria-pressed={slot===period} key={period} onClick={()=>setSlot(period)}>{period==='morning'?'Morning':'Night'}</button>)}
  </div>
  {([
   {key:'outfits',title:'Outfits',items:data.outfits,preview:'outfit'},
   {key:'hairstyles',title:'Hairstyles',items:data.hairs,preview:'hair'},
   {key:'accessories',title:'Accessories',items:data.accessories,preview:'accessories'},
  ] as const).map(({key,title,items,preview})=><details className="wardrobe-fold" key={key}>
   <summary>{title} · {choices[key].length} approved</summary>
   <div className="wardrobe-fold-content daily-choice-grid">
    {items.filter(item=>item.unlocked||choices[key].includes(item.name)).map(item=>{
     const name=label(key,item.name,items);
     return <label className="wardrobe-item daily-choice-tile" key={item.name}>
      <span className="daily-choice-label"><input type="checkbox" checked={choices[key].includes(item.name)} onChange={()=>toggleChoice(key,item.name)}/>{name}{!item.unlocked?' (locked)':''}</span>
      {assets&&<span aria-hidden="true"><WardrobeThumbnail label={name} layers={wardrobePreviewLayers(assets,cfg,preview,item.name)}/></span>}
     </label>;
    })}
   </div>
  </details>)}
  <details className="wardrobe-fold">
   <summary>Preferred sets · {preferred.length}</summary>
   <div className="wardrobe-fold-content">
    <p className="hint-soft">Select saved looks Mana can wear as a set. When she picks a matching outfit, she may wear the full look or make her own combination. The saved hair and accessories must be approved for that period.</p>
    {!looks.length&&<p>Save a look in Wardrobe to add it here.</p>}
    <div className="wardrobe-inventory-grid">
     {looks.map(look=><label className="wardrobe-item" key={look.name}>
      <span className="daily-choice-label"><input type="checkbox" checked={preferred.includes(look.name)} onChange={()=>togglePreferred(look.name)}/>{look.name}</span>
      {assets&&<span aria-hidden="true"><WardrobeThumbnail label={look.name} layers={referenceLayers(assets,resolveLoadout({...cfg,backHairstyle:undefined,...look},data))}/></span>}
      <small>{label('outfits',look.outfit,data.outfits)} · {label('hairstyles',look.hairstyle,data.hairs)}</small>
     </label>)}
    </div>
   </div>
  </details>
  {routine.last&&<p role="status">Last choice: {routine.last.look} · {routine.last.period.replace(':',' · ')}</p>}
  {error&&<p role="alert" className="msg-error">{error}</p>}
 </section>;
}
