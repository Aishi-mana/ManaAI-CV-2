import {townActors,trackedTownIds,type TownCharacter} from '../core/townCharacters';
import {useId,useRef,useState,type CSSProperties} from 'react';
import SceneViewport,{ScenePanContext,SceneZoomControls} from './SceneViewport';
import {districtBuildings,officeRooms,townHall} from '../core/manaverseStreet';


export const manaversePlaces={
 bedroom:'Mana’s Companion Room',
 living:'Mana’s Living Space',
 street:'Manaverse Street',
 library:'Lyra’s Library',
 'lyra-room':'Lyra’s Room',
 'luna-home':'Luna’s Home',
 park:'Manaverse Park',
 square:'Town Square',
 'town-hall':townHall.name,
 district:'Second Street',
 office:districtBuildings.office.name,
 'meeting-room':officeRooms['meeting-room'].name,
 'aishi-office':officeRooms['aishi-office'].name,
 'office-hallway':officeRooms['office-hallway'].name,
 pantry:officeRooms.pantry.name,
 'rest-area':officeRooms['rest-area'].name,
 cafe:districtBuildings.cafe.name,
 workshop:districtBuildings.workshop.name,
};

export type ManaverseArea=keyof typeof manaversePlaces;
const characterPortraits=Object.fromEntries(trackedTownIds.map(id=>[id,{name:townActors[id].name,image:townActors[id].mapImage}])) as Record<TownCharacter|'aishi',{name:string;image:string}>;
type MapCharacter={location:ManaverseArea;activity?:string;next?:{place:ManaverseArea;start?:string}};
type CharacterId=keyof typeof characterPortraits;
export type MapCharacters=Partial<Record<CharacterId,MapCharacter>>;

function mapLandmark(area:ManaverseArea){
 if(area==='bedroom')return 'living';
 if(area==='lyra-room')return 'library';
 if(Object.prototype.hasOwnProperty.call(officeRooms,area))return 'office';
 return area;
}

const mapLandmarks=[
 {id:'office',label:'Office',x:27,y:14},
 {id:'cafe',label:'Café',x:53,y:12},
 {id:'workshop',label:'Workshop',x:83,y:15},
 {id:'district',label:'Second Street',x:48,y:19},
 {id:'town-hall',label:'Town Hall',x:53,y:35},
 {id:'square',label:'Town Square',x:53,y:51},
 {id:'park',label:'Park',x:84,y:70},
 {id:'living',label:'Mana’s home',x:15,y:79},
 {id:'library',label:'Library',x:38,y:79},
 {id:'luna-home',label:'Luna’s home',x:61,y:79},
 {id:'street',label:'Manaverse Street',x:39,y:87},
] as const;

export default function ManaverseMap({area,characters,onChoose,diving}:{
 diving?:boolean;area:ManaverseArea;characters:MapCharacters;
 onChoose:(area:ManaverseArea)=>void;
}){
 const [zoom,setZoom]=useState(1);
 const [selected,setSelected]=useState<CharacterId>();
 const activityId=useId();
 const activityCard=useRef<HTMLElement>(null);
 const tracked=(Object.keys(characterPortraits) as CharacterId[]).flatMap(id=>{
  const character=characters[id];
  return character?[{id,...character,...characterPortraits[id]}]:[];
 });
 const current=tracked.find(character=>character.id===selected);
 const place=(id:ManaverseArea,label=manaversePlaces[id])=><button className="btn manaverse-map-place" type="button"
  aria-current={area===id?'location':undefined} onClick={()=>onChoose(id)}>
  <strong>{label}</strong>
  {tracked.filter(character=>character.location===id).map(character=><small key={character.id}>{character.name} is here</small>)}
  {area===id&&<small>You’re viewing</small>}
 </button>;

 return <div className="manaverse-map">
   <p>{diving?'Use nearby doors to travel as Aishi.':'Choose a place to look around. Mana stays where she is.'}</p>
   <SceneZoomControls zoom={zoom} onZoom={setZoom}/>
   <ScenePanContext.Provider value={()=>{}}><SceneViewport className={zoom>1?"phone-map-viewport phone-map-zoomed":"phone-map-viewport"}>
   <div className="manaverse-town-art" style={{'--phone-map-zoom':zoom} as CSSProperties}>
    <img className="manaverse-town-illustration" src="./companion-room/manaverse-town-map.webp"
     alt="Illustrated town overview from the residential street and pond park to the fountain square and Second Street." />
    {mapLandmarks.map(({id,label,x,y})=><button className="btn manaverse-map-pin" key={id} type="button"
     style={{left:`${x}%`,top:`${y}%`}} aria-label={manaversePlaces[id]} aria-current={area===id?'location':undefined}
     onClick={()=>onChoose(id)}>{label}</button>)}
    {mapLandmarks.map(({id,x,y})=>{
     const group=tracked.filter(character=>mapLandmark(character.location)===id);
     return group.length>0&&<div className="manaverse-map-characters" key={id} data-landmark={id} style={{left:`${x}%`,top:`${y}%`}}>
      {group.map(({id,name,image,location})=>{
       const label=`${name} · ${manaversePlaces[location]}`;
       return <button key={id} type="button" className={`manaverse-map-portrait manaverse-map-portrait-${id}`}
        aria-label={label} title={label} aria-expanded={selected===id} aria-controls={activityId}
        style={{backgroundImage:`url("${image}")`}}
        onClick={()=>{
         setSelected(id);
         requestAnimationFrame(()=>activityCard.current?.focus());
        }}/>;
      })}
     </div>;
    })}
   </div>
   </SceneViewport></ScenePanContext.Provider>
   {current&&<section className="manaverse-map-activity" id={activityId} ref={activityCard} tabIndex={-1} aria-label={`${current.name}’s activity`}>
    <h3>{current.name}</h3>
    <p>{manaversePlaces[current.location]}</p>
    {current.activity&&<p>{current.activity}</p>}
    {current.next&&<p><strong>Next</strong> · {manaversePlaces[current.next.place]}{current.next.start&&` at ${current.next.start}`}</p>}
   </section>}
   <section className="manaverse-map-district" aria-label="Manaverse Street and nearby destinations">
    {place('street')}
    <div className="manaverse-map-destinations">
    <section className="manaverse-map-home" aria-label="Mana’s home">
     {place('living','Living Space')}
     <span className="manaverse-map-route" aria-hidden="true"/>
     {place('bedroom','Bedroom')}
    </section>
    {place('library')}
    {place('lyra-room')}
    {place('luna-home')}
    {place('park','Park')}
    </div>
   </section>
   <section className="manaverse-map-district" aria-label="Town Square and nearby destinations">
    {place('square')}
    <div className="manaverse-map-destinations">{place('town-hall')}</div>
   </section>
   <section className="manaverse-map-district" aria-label="Second Street and nearby destinations">
    {place('district')}
    <div className="manaverse-map-destinations">
     <section className="manaverse-map-home manaverse-map-office" aria-label="AI Workforce Office rooms">
      {place('office')}
      <span className="manaverse-map-route" aria-hidden="true"/>
      <div>{place('meeting-room')}{place('office-hallway')}</div>
      <span className="manaverse-map-route" aria-hidden="true"/>
      <div aria-label="Rooms off the hallway">{place('pantry')}{place('rest-area')}{place('aishi-office')}</div>
     </section>
     {place('cafe')}{place('workshop')}
    </div>
   </section>
 </div>;
}
