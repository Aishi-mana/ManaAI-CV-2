import {useRef} from 'react';
import type {ImageAttachment} from '../core/vision';
import {pictureDetails} from '../core/imageGeneration';

export default function GeneratedPictureView({image}:{image:ImageAttachment}){
 const viewer=useRef<HTMLDialogElement>(null);
 const details=pictureDetails(image.filename);
 return <>
  {details&&<p className="hint-soft">{details}</p>}
  <button type="button" aria-label="Enlarge generated image" onClick={()=>viewer.current?.showModal()} style={{display:'block',padding:0,border:0,background:'transparent',cursor:'zoom-in',maxWidth:480,width:'100%',marginTop:12}}>
   <img src={image.dataUrl} alt={`Generated picture: ${image.filename}`} style={{display:'block',width:'100%',borderRadius:12}}/>
  </button>
  <button type="button" className="btn" onClick={()=>viewer.current?.showModal()}>Enlarge image</button>
  <dialog ref={viewer} aria-label="Enlarged generated image" onClick={e=>{if(e.target===e.currentTarget)viewer.current?.close();}} style={{maxWidth:'94vw',maxHeight:'94vh',padding:20,border:'1px solid #d7c9f2',borderRadius:16,background:'#fff8fc'}}>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,marginBottom:12}}><span>{details||image.filename}</span><button type="button" className="btn" onClick={()=>viewer.current?.close()}>Close image</button></div>
   <img src={image.dataUrl} alt={`Enlarged picture: ${image.filename}`} style={{display:'block',maxWidth:'88vw',maxHeight:'76vh',objectFit:'contain',margin:'auto'}}/>
  </dialog>
 </>;
}
