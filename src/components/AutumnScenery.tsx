import {useId} from 'react';
import {AUTUMN_SCENERY,autumnLeaves} from '../core/autumnScenery';
import {SCENERY_ART,scenerySeason,sceneryDoorClearances} from '../core/seasonalScenery';
import type {OutdoorArea} from '../core/manaverseNavigation';
import {useTownWeather} from './TownWeather';

export default function AutumnScenery({area}:{area:OutdoorArea}){
 const {weather,settings}=useTownWeather(),id=`autumn-${useId().replace(/:/g,'')}`;
 const scene=AUTUMN_SCENERY[area];
 return <svg className="autumn-scenery" data-area={area} data-active={scenerySeason(weather,settings)==='autumn'} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
   <filter id={`${id}-color`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".72 .48 .08 0 .03 .08 .64 .08 0 .015 .02 .16 .42 0 0 0 0 0 1 0"/></filter>
   <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".45"/></filter>
   <mask id={`${id}-foliage`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="black"/>
    <g fill="white" filter={`url(#${id}-soft)`}>{scene.foliage.map((point,index)=><ellipse key={index} cx={point.x} cy={point.y} rx={point.rx} ry={point.ry}/>)}</g>
   </mask>
   <mask id={`${id}-doors`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="white"/>
    {sceneryDoorClearances(area).map((point,index)=><ellipse key={index} cx={point.x} cy={point.y} rx={point.rx} ry={point.ry} fill="black"/>)}</mask>
  </defs>
  <g mask={`url(#${id}-doors)`}>
   <image className="autumn-foliage-color" href={`./companion-room/${SCENERY_ART[area]}`} x="0" y="0" width="100" height="100" preserveAspectRatio="none" filter={`url(#${id}-color)`} mask={`url(#${id}-foliage)`}/>
   <g className="autumn-leaf-piles">{autumnLeaves(scene).map((leaf,index)=><g key={index} fill={leaf.color} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotation}) scale(${leaf.size} ${leaf.size*.7})`}>
    <path d="M-1 0Q-.65-1.2 .2-.7Q1-.3 1 0Q.4.9-.3.65Q-1.4.4-1 0Z"/><path className="autumn-leaf-vein" d="M-.8.2Q0-.1.7-.2"/>
   </g>)}</g>
  </g>
 </svg>;
}
