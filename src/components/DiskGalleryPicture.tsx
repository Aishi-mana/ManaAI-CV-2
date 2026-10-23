import {useEffect,useState} from 'react';
import type {SavedImage} from '../core/savedImages';
import {fullGalleryImage} from '../core/diskGallery';
import GeneratedPictureView from './GeneratedPictureView';
export default function DiskGalleryPicture({image}:{image:SavedImage}){
 const [full,setFull]=useState<SavedImage>(),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;setFull(undefined);setError('');void fullGalleryImage(image).then(value=>{if(active)setFull(value);}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[image.id,image.diskId,retry]);
 return full?<GeneratedPictureView image={full}/>:error?<div role="alert">{error}<button className="btn" onClick={()=>setRetry(n=>n+1)}>Retry loading picture</button></div>:<p role="status">Loading full picture from disk…</p>;
}
