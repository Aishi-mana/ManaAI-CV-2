import type {ManaverseArea} from '../components/ManaverseMap';

type Point={x:number;y:number};
export const MANAVERSE_WALK_SPEED=130;

// Unzoomed reference dimensions for the scene art. A trip keeps its duration
// if the viewer pans, zooms, or leaves the map while the actor is walking.
const sceneSize:Record<ManaverseArea,readonly [number,number]>={
 bedroom:[799,698],living:[799,698],street:[1440,864],square:[1440,864],district:[1440,864],
 park:[2500,2500*7/12],library:[900,600],'lyra-room':[900,600],'luna-home':[900,600],
 'town-hall':[900,600],office:[1355.2,1355.2*2/3],'meeting-room':[960,640],
 'office-hallway':[1120,1120*2/3],pantry:[900,600],'rest-area':[900,600],'aishi-office':[900,900],
 cafe:[1120,746.67],workshop:[900,600],
};

export function walkTravelMs(from:Point,to:Point,speed=MANAVERSE_WALK_SPEED){
 return Math.hypot(to.x-from.x,to.y-from.y)*1000/speed;
}

export function sceneTravelMs(area:ManaverseArea,from:Point,to:Point){
 const [width,height]=sceneSize[area];
 return walkTravelMs({x:from.x*width/100,y:from.y*height/100},{x:to.x*width/100,y:to.y*height/100});
}

export function travelPoint(from:Point,to:Point,elapsed:number,duration:number):Point{
 const t=Math.max(0,Math.min(1,elapsed/Math.max(1,duration)));
 return t===1?to:{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};
}
