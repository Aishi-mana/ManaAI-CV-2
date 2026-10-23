import {useRef,useState} from 'react';
import type {AvatarAssets,AvatarConfig} from '../core/avatar';
import type {ImageAttachment} from '../core/vision';
import {outfitDesignRequest} from '../core/imageGeneration';
import ImageGenerationDrawer from './ImageGenerationDrawer';
import OutfitPrototype from './OutfitPrototype';
type Stage='design'|'make'|'edit'|'save';
interface Props{onWardrobeSaved?:()=>void;assets:AvatarAssets;cfg:AvatarConfig;initial?:ImageAttachment;available:boolean;beforeGenerate:(cpu:boolean)=>Promise<()=>Promise<void>>;onSaveImage:(image:ImageAttachment)=>void|Promise<void>;onClose:()=>void}
export default function Atelier({assets,cfg,initial,available,beforeGenerate,onSaveImage,onClose,onWardrobeSaved}:Props){
 const [stage,setStage]=useState<Stage>(initial?'make':'design'),[picture,setPicture]=useState(initial),[version,setVersion]=useState(0);
 function usePicture(image:ImageAttachment){setPicture(image);setVersion(v=>v+1);setStage('make');}
 const uploadInput=useRef<HTMLInputElement|null>(null);
 const stages:Stage[]=['design','make','edit','save'];
 return <section className="atelier-workspace" role="dialog" aria-label="Atelier"><header className="drawer-head"><div><h2>Atelier</h2><p>Design a look, make its pieces, fit them, and save your outfit.</p></div><button className="btn" onClick={onClose}>Back to chat</button></header>
 <div className="atelier-upload-entry"><button className="btn" onClick={()=>{setStage('make');uploadInput.current?.click();}}>Upload your own outfit image</button><span className="hint-soft">PNG, JPEG or WebP · up to 10 MB · clean, fit and save it for her to wear</span></div><nav className="atelier-stages" aria-label="Atelier steps">{stages.map((value,i)=><button className={'btn'+(stage===value?' primary':'')} key={value} aria-current={stage===value?'step':undefined} onClick={()=>setStage(value)}>{i+1} · {value[0].toUpperCase()+value.slice(1)}</button>)}</nav>
 <div className="atelier-body"><div hidden={stage!=='design'}>{picture&&<p className="hint-soft">Using a new picture in Make starts a fresh editing draft. Switching steps keeps your current draft.</p>}<ImageGenerationDrawer embedded autoGenerate={false} initialRequest={outfitDesignRequest()} available={available} beforeGenerate={beforeGenerate} onClose={onClose} onSave={onSaveImage} onPrototype={usePicture}/></div>
 <div hidden={stage==='design'}><p className="hint-soft">{stage==='make'?'Choose or clean an outfit picture. Separate the top, bottoms and shoes into pieces.':stage==='edit'?'Choose a tool and edit the outfit directly on Mana. Space-drag moves the view.':'Review your transparent outfit and body preview. Save to Wardrobe to make it wearable, or save outfit.png and selection.json files.'}</p><OutfitPrototype uploadInputRef={uploadInput} key={version} embedded stage={stage==='design'?'make':stage} assets={assets} cfg={cfg} initial={picture} onClose={onClose} onWardrobeSaved={onWardrobeSaved}/></div></div>
 <footer className="atelier-footer"><button className="btn" disabled={stage==='design'} onClick={()=>setStage(stages[stages.indexOf(stage)-1])}>Previous</button>{stage!=='save'&&<button className="btn primary" onClick={()=>setStage(stages[stages.indexOf(stage)+1])}>Continue to {stages[stages.indexOf(stage)+1]}</button>}</footer></section>;
}
