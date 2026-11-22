import TownFireworks from './TownFireworks';
import type {DecorationObject} from '../core/townDecorationLayout';

export function DecorationArtwork({kind,animate=true}:{kind:DecorationObject['kind'];animate?:boolean}){
 if(kind==='christmas-tree')return <img className="town-christmas-tree" src="./companion-room/town-christmas-tree.png" alt="" draggable={false}/>;
 if(kind==='garlands')return <div className="town-festive-garland">{Array.from({length:9},(_,index)=><span key={index}/>)}</div>;
 if(kind==='lights')return <div className="town-festive-glow"/>;
 if(kind==='golden-display')return <div className="town-new-year-display"><span/><span/><span/></div>;
 return animate?<TownFireworks/>:<svg className="town-firework-preview" viewBox="0 0 100 60" aria-hidden="true">{[25,75].map((x,index)=><g key={x} transform={`translate(${x} ${index?20:35})`} stroke={index?'#baa1f5':'#edbd59'}>{Array.from({length:12},(_,i)=><path key={i} transform={`rotate(${i*30})`} d="M0 -5V-18"/>)}</g>)}</svg>;
}
export function decorationObjectStyle(object:DecorationObject){
 return {left:`${object.x}%`,top:`${object.y}%`,width:`${object.width}%`,height:`${object.height}%`,
  transform:`translate(-50%,-100%) rotate(${object.rotation}deg) scaleX(${object.flipped?-1:1})`,opacity:object.opacity,zIndex:object.layer};
}
export default function TownDecorationObjects({objects,animate=true}:{objects:readonly DecorationObject[];animate?:boolean}){
 return <>{objects.filter(object=>!object.hidden).map(object=><div key={object.id} className="town-decoration-object" data-kind={object.kind}
  style={decorationObjectStyle(object)}><DecorationArtwork kind={object.kind} animate={animate}/></div>)}</>;
}
