import DiskGalleryPicture from './DiskGalleryPicture';
import type { Msg } from '../core/types';
import type { SavedImage } from '../core/savedImages';
import {useState} from 'react';
import {fullGalleryImage} from '../core/diskGallery';
export default function ImageReportView({report,images,onReuse,disabled=false}:{report:NonNullable<Msg['imageReport']>;images:SavedImage[];onReuse?:(image:SavedImage)=>void;disabled?:boolean}){
 const image=images.find(i=>i.id===report.imageId);
 const [error,setError]=useState(''),[loading,setLoading]=useState(false),[opened,setOpened]=useState(false);
 async function reuse(){if(!image||!onReuse)return;setLoading(true);setError('');try{onReuse(await fullGalleryImage(image));}catch(e){setError(String(e));}finally{setLoading(false);}}
 return <div>{image&&<img src={image.dataUrl} alt={report.filename} style={{maxWidth:160,maxHeight:120,objectFit:'contain'}} loading="lazy"/>}<details onToggle={e=>setOpened(e.currentTarget.open)}><summary>Image: {report.filename}</summary>{image?<>{opened&&<DiskGalleryPicture image={image}/>}{onReuse&&<button className="btn" disabled={disabled||loading} onClick={()=>void reuse()}>Use image again</button>}</>:<p className="hint-soft">Image pixels unavailable: this entry predates image storage, or its saved image was deleted.</p>}{report.userConfirmedAvatar&&<p className="hint-soft">You confirmed this image depicts Mana when it was inspected.</p>}<p className="hint-soft">Local vision description; may contain mistakes.</p><p className="memory-content">{report.description}</p>{error&&<p role="alert" className="msg-error">{error}</p>}</details></div>;
}
