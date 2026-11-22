import {useId} from 'react';
import {SPRING_SCENERY,springFlowers,summerFlowers} from '../core/springScenery';
import {scenerySeason,sceneryDoorClearances} from '../core/seasonalScenery';
import type {OutdoorArea} from '../core/manaverseNavigation';
import {useTownWeather} from './TownWeather';

export default function FlowerScenery({area,season='spring'}:{area:OutdoorArea;season?:'spring'|'summer'}){
 const {weather,settings}=useTownWeather(),id=`${season}-${useId().replace(/:/g,'')}`;
 const summer=season==='summer',flowers=(summer?summerFlowers:springFlowers)(SPRING_SCENERY[area]);
 return <svg className={`${season}-scenery`} data-area={area} data-active={scenerySeason(weather,settings)===season} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
   <g id={`${id}-flower`}>
    <path className="spring-flower-leaves" d="M0 .7 Q-1.5 .8-1.1-.1 Q-.3-.3 0 .7 Q.6-.3 1.3-.1 Q1.4 .8 0 .7Z"/>
    {Array.from({length:summer?8:5},(_,index)=>index*(summer?45:72)).map(angle=><ellipse key={angle} cx="0" cy="-.55" rx={summer?'.28':'.4'} ry=".65" transform={`rotate(${angle})`}/>)}
    <circle className={summer?'summer-flower-center':'spring-flower-center'} r={summer?'.34':'.26'}/>
   </g>
   <mask id={`${id}-doors`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
    <rect width="100" height="100" fill="white"/>
    {sceneryDoorClearances(area).map((point,index)=><ellipse key={index} cx={point.x} cy={point.y} rx={point.rx} ry={point.ry} fill="black"/>)}
   </mask>
  </defs>
  <g mask={`url(#${id}-doors)`} className={summer?'summer-flower-beds':'spring-flower-beds'}>
   {flowers.map((flower,index)=><use key={index} href={`#${id}-flower`} fill={flower.color} transform={`translate(${flower.x} ${flower.y}) rotate(${flower.rotation}) scale(${flower.size} ${flower.size*.8})`}/>)}
  </g>
 </svg>;
}
