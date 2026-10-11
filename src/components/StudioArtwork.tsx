export default function StudioArtwork({image,title,small=false}:{image:string;title:string;small?:boolean}){
 return <div className={`studio-art${small?' small':''}`}>{image?<img src={image} alt={`${title} cover art`}/>:<><span aria-hidden="true">♫</span>{!small&&<div><small>MANA MUSIC</small><strong>{title||'A little song, a little magic'}</strong></div>}</>}</div>;
}
