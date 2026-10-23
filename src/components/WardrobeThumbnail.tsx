import {useEffect,useRef,useState} from 'react';
import type {Layer} from '../core/avatar';
import {alphaBounds,loadOutfitImage} from '../core/outfitPrototype';
export default function WardrobeThumbnail({layers,label,large=false}:{layers:Layer[];label:string;large?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),[unavailable,setUnavailable]=useState(false);
 const signature=layers.map(l=>l.key+'='+l.url).join('|');
 useEffect(()=>{let active=true;setUnavailable(false);const target=canvas.current;if(target)target.getContext('2d')?.clearRect(0,0,target.width,target.height);
 if(!layers.length){setUnavailable(true);return;}
 void Promise.all(layers.map(l=>loadOutfitImage(l.url))).then(images=>{if(!active||!canvas.current)return;const source=document.createElement('canvas');source.width=images[0].naturalWidth;source.height=images[0].naturalHeight;const c=source.getContext('2d')!;for(const image of images)c.drawImage(image,0,0,source.width,source.height);const bounds=alphaBounds(c.getImageData(0,0,source.width,source.height).data,source.width,source.height);if(!bounds){setUnavailable(true);return;}const out=canvas.current;out.width=large?512:256;out.height=large?768:288;const ctx=out.getContext('2d')!,padding=large?24:18,scale=Math.min((out.width-padding*2)/bounds.width,(out.height-padding*2)/bounds.height),w=bounds.width*scale,h=bounds.height*scale;ctx.clearRect(0,0,out.width,out.height);ctx.drawImage(source,bounds.x,bounds.y,bounds.width,bounds.height,(out.width-w)/2,(out.height-h)/2,w,h);}).catch(()=>{if(active)setUnavailable(true);});return()=>{active=false;};},[signature,large]);
 return <span className={'wardrobe-thumbnail checkerboard'+(large?' large':'')}><canvas ref={canvas} role="img" aria-label={label}/>{unavailable&&<span className="wardrobe-preview-missing">Preview unavailable</span>}</span>;
}
