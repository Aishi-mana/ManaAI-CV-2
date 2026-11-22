import {manaverseDoorways} from './manaversePassage';
import type {OutdoorArea} from './manaverseNavigation';
import type {TownWeather,TownWeatherSettings} from './townWeather';

export const SCENERY_ART:Record<OutdoorArea,string>={street:'manaverse-street.webp',square:'manaverse-square.webp',district:'manaverse-second-street.webp',park:'manaverse-park-small-pond.webp'};
export function scenerySeason(weather:Pick<TownWeather,'season'>,settings:Pick<TownWeatherSettings,'mode'|'scenery'|'sceneryPreview'>){
 return settings.scenery===false?'none':settings.sceneryPreview??(settings.mode==='snow'?'winter':weather.season);
}
export function sceneryDoorClearances(area:OutdoorArea){
 return manaverseDoorways.flatMap(([from,exit,to,entry])=>from===area?[{...exit,rx:3,ry:4}]:to===area?[{...entry,rx:3,ry:4}]:[]);
}
