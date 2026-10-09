import type { Msg } from '../core/types';
import type { SavedImage } from '../core/savedImages';
export default function ImageReportView({report,images,onReuse,disabled=false}:{report:NonNullable<Msg['imageReport']>;images:SavedImage[];onReuse?:(image:SavedImage)=>void;disabled?:boolean}){
 const image=images.find(i=>i.id===report.imageId);
 return <div>{image&&<img src={image.dataUrl} alt={report.filename} style={{maxWidth:160,maxHeight:120,objectFit:'contain'}} loading="lazy"/>}<details><summary>Image: {report.filename}</summary>{image?<><img className="vision-preview" src={image.dataUrl} alt={report.filename} loading="lazy"/>{onReuse&&<button className="btn" disabled={disabled} onClick={()=>onReuse(image)}>Use image again</button>}</>:<p className="hint-soft">Image pixels unavailable: this entry predates image storage, or its saved image was deleted.</p>}<p className="hint-soft">Local vision description; may contain mistakes.</p><p className="memory-content">{report.description}</p></details></div>;
}
