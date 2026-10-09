import { useState } from 'react';
import type { SavedImage } from '../core/savedImages';
import { IMAGE_LIMIT, IMAGE_DATA_LIMIT } from '../core/savedImages';
export default function SavedImagesDrawer({images,editable,onDelete,onClose}:{images:SavedImage[];editable:boolean;onDelete:(id:string)=>void;onClose:()=>void}){
 const [query,setQuery]=useState('');const matches=images.filter(i=>i.filename.toLowerCase().includes(query.toLowerCase()));
 return <><div className="scrim" onClick={onClose}/><section className="drawer" role="dialog" aria-label="Saved images"><header className="drawer-head"><h2>Saved images</h2><button className="btn" onClick={onClose}>Close</button></header><div className="drawer-body">
 <p>{images.length}/{IMAGE_LIMIT} images · {(images.reduce((sum,i)=>sum+i.dataUrl.length,0)/1_000_000).toFixed(2)}/{IMAGE_DATA_LIMIT/1_000_000} MB image storage</p>
 <p>Saved copies are JPEGs up to 1280 pixels on the long edge. They survive restart and are included in backups. Deleting pixels removes the image from every linked chat/archive entry; descriptions remain. Older backup files may still contain deleted images.</p>
 <label className="field">Search images<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 {!matches.length&&<p>No saved images match.</p>}
 {matches.map(image=><article key={image.id} className="memory-card"><h3>{image.filename}</h3><img className="vision-preview" src={image.dataUrl} alt={image.filename}/><p>{new Date(image.createdAt).toLocaleString()}</p><button className="btn" disabled={!editable} onClick={()=>{if(window.confirm(`Delete saved pixels for ${image.filename}? Linked descriptions remain; older backups may retain the image.`))onDelete(image.id);}}>Delete image</button></article>)}
 </div></section></>;
}
