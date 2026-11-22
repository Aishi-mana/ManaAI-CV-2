import {useId} from 'react';
import {WINTER_SCENERY,winterClearances,winterSceneryActive,snowShrubPath} from '../core/winterScenery';
import type {OutdoorArea} from '../core/manaverseNavigation';
import {useTownWeather} from './TownWeather';

export default function WinterScenery({area}:{area:OutdoorArea}){
 const {weather,settings}=useTownWeather();
 const id=`winter-${useId().replace(/:/g,'')}`;
 const scene=WINTER_SCENERY[area],active=winterSceneryActive(weather,settings);
 return <svg className="winter-scenery" data-area={area} data-active={active} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <defs>
   <linearGradient id={`${id}-snow`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffffff"/><stop offset=".6" stopColor="#f3f9ff"/><stop offset="1" stopColor="#d3e3ee"/></linearGradient>
   <mask id={`${id}-doors`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="white"/>
    {winterClearances(area).map((point,index)=><ellipse key={index} cx={point.x} cy={point.y} rx={point.rx} ry={point.ry} fill="black"/>)}</mask>
  </defs>
  <g mask={`url(#${id}-doors)`}>
   <g className="winter-cap-shadow" transform="translate(0 .18)">{scene.caps.map((path,index)=><path key={index} d={path}/>)}</g>
   <g className="winter-roof-caps">{scene.caps.map((path,index)=><path key={index} d={path}/>)}</g>
   <g fill={`url(#${id}-snow)`} className="winter-shrub-caps">{scene.shrubs.map((point,index)=><path key={index} d={snowShrubPath(point)}/>)}</g>
   <g className="winter-path-edges">{scene.edges.map((path,index)=><path key={index} d={path}/>)}</g>
  </g>
 </svg>;
}
