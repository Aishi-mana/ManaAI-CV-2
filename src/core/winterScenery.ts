import {scenerySeason} from './seasonalScenery';
export {sceneryDoorClearances as winterClearances} from './seasonalScenery';
import type {OutdoorArea} from './manaverseNavigation';
import type {TownWeather,TownWeatherSettings} from './townWeather';

type SnowCap={x:number;y:number;rx:number;ry:number};
type WinterScene={caps:string[];shrubs:SnowCap[];edges:string[]};
const shrubs=(points:readonly (readonly number[])[]):SnowCap[]=>points.map(([x,y,rx,ry])=>({x,y,rx,ry}));
// Coordinates follow the existing artwork in percentages. These are thin
// surface accents, not replacement maps or new navigation obstacles.
export const WINTER_SCENERY:Record<OutdoorArea,WinterScene>={
 street:{
  caps:['M12.7 17.6L24.6 14.3Q25.6 13.5 26.1 15.3','M26.2 16L34 41.6','M.5 43Q7 44.4 15 43.6','M16.6 48.2Q24.5 36 32.4 48.2',
   'M31 20.8Q35 9 40.5 5.3L46 4.8','M57.7 5Q62 9 66.9 16.4','M34.5 17.6L44.4 17.5','M58.4 17.5L67.4 17.5',
   'M71.4 12.1Q79 5.4 85.7 3','M86.1 5.5Q88.4 18 97.8 25','M67.8 27.4Q78 31 85.8 3.9','M79.2 31Q85 20 91.8 31','M6.2 16L11 16','M90.7 7.4L94.9 7.4'],
  shrubs:shrubs([[4,45.8,3,1],[12.5,62.2,3,1],[12,71.8,3.8,1.1],[38,59.5,3.4,1],[62.7,56.5,3.6,1],[75.5,44.5,3.2,1],[94.5,42.3,3,1],[97,51.5,2.8,1],[3,90,5,1.8],[96,90,5,1.6]]),
  edges:['M.5 75Q3 73.4 5.6 74.1','M7.5 98Q11 96.7 14 98','M88 97Q94 94.5 99 94'],
 },
 square:{
  caps:['M8 17.7L18.2 20','M55.8 9.2L64.5 5.8','M83.7 18Q92.5 17.7 99.6 14','M87.3 4.1L89.3 1','M96 1.5L99.4 9.4',
   'M42.3 38Q43.5 37.4 45 37.5','M55.4 37.4Q57.5 37.8 58.2 38','M21.7 31.2L23 31.2','M28.4 29.8L30.2 29.8','M37.9 31.1L39.5 31.1','M61.1 31.2L63 31.2'],
  shrubs:shrubs([[6.7,34.3,3.4,1.2],[16.3,36.3,4,1.1],[32.8,31,4,1],[57.2,40,2,1],[40.4,40.4,2.2,1],[68.7,33,3.6,1],[89.4,35.3,3.8,1.1],[95.4,36.5,2.7,1]]),
  edges:['M.4 44Q6 43.4 10.6 43.5','M12 42.5Q17 41.3 20.5 40.5','M32 37Q33.5 36.5 35 37','M84.5 39.3Q86.5 39.8 88 40','M98 43L99.5 43.7'],
 },
 district:{
  caps:['M1.2 37L15 37','M30.5 37L38.2 37','M9.5 16.1L15 16.1','M26 16.1L31 16.1','M15.1 13.7Q21 4.4 27 13.6',
   'M36 27L44 13','M55.8 9L68.2 27.8','M41.2 36L65 36','M69.4 29.6Q78 33 85.8 3.7','M87 5L98 28.7','M40 5L44.8 5','M90.5 6.3L94.5 6.3'],
  shrubs:shrubs([[13.5,57.8,3.5,1],[30.8,57.5,3.2,1],[13.5,67,3.4,1.1],[43,57.3,3,1],[60.7,57.4,3,1],[47,62.3,2.3,1],[59,63,2.2,1],[74.6,56.4,3,1],[93,55.7,3.4,1],[73,63.3,2.4,1],[3,89,5,1.5],[97,90,4.5,1.5]]),
  edges:['M.4 74.5Q3 73 5 74','M8.5 98Q12 96.4 15 98','M89.5 97.5Q94.5 95.4 99.5 95'],
 },
 park:{
  caps:['M24.1 19.7L29.8 17','M70.5 16.8L76.5 20.1','M20.6 75.4L28.2 80','M71.6 80L79.8 75.2','M40 49.5Q39.8 46 40.8 43.5','M59.5 43.9Q60.5 47 60 50.8'],
  shrubs:shrubs([[17,8.7,8,2],[39,1.5,9,2],[81.5,8.6,7,2],[3,14,8,2],[97,14,7,2],[35.5,16.5,3.7,1.3],[65.8,16.5,3.7,1.3],[7,33,3.7,1.4],[93.5,33,3.7,1.4],[2,39.5,5,1.5],[98,39.5,5,1.5],[2,59,5,1.7],[98,59,5,1.7],[8,74.5,7,2],[93,74.5,7,2],[24.5,91,8,2.3],[35.8,92.7,4.6,1.8],[65.8,92.3,4.7,1.8],[78,92,8,2]]),
  edges:['M.5 44.8L4.5 44.8','M95.5 44.8L99.5 44.8','M.5 55.5L4.5 55.5','M95.5 55.5L99.5 55.5','M43.4 93.5L45.2 93.6','M55.8 93.6L57.6 93.5'],
 },
};
export function winterSceneryActive(weather:Pick<TownWeather,'season'>,settings:Pick<TownWeatherSettings,'mode'|'scenery'|'sceneryPreview'>){
 return scenerySeason(weather,settings)==='winter';
}
export function snowShrubPath({x,y,rx,ry}:SnowCap){
 return `M${x-rx} ${y}Q${x-rx*.9} ${y-ry} ${x-rx*.45} ${y-ry*.65}Q${x} ${y-ry*1.8} ${x+rx*.4} ${y-ry*.7}Q${x+rx*.95} ${y-ry} ${x+rx} ${y}Q${x+rx*.4} ${y+ry*.5} ${x} ${y+ry*.2}Q${x-rx*.6} ${y+ry*.6} ${x-rx} ${y}Z`;
}
