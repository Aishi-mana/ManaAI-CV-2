import type {OutdoorArea} from './manaverseNavigation';

type Foliage={x:number;y:number;rx:number;ry:number};
type LeafPile={x:number;y:number;spread:number;count:number};
type AutumnScene={foliage:Foliage[];piles:LeafPile[]};
const foliage=(values:number[][])=>values.map(([x,y,rx,ry])=>({x,y,rx,ry}));
const piles=(values:number[][])=>values.map(([x,y,spread,count])=>({x,y,spread,count}));
export const AUTUMN_SCENERY:Record<OutdoorArea,AutumnScene>={
 street:{foliage:foliage([[5,4,15,13],[98,7,7,15],[28.5,18,3.2,6],[2,92,10,10],[98,92,8,12],[38.5,60,3.3,2.5],[62,57,3.2,2.3],[75,45,3,2]]),
  piles:piles([[4,74,3,14],[14,76,2.5,12],[34,71,2.6,12],[66,64,2.2,10],[94,58,2.3,10],[7,95,5,22],[95,93,4.2,20],[9,43.8,4.5,12],[60,18,3.5,8]])},
 square:{foliage:foliage([[5,5,12,8],[26,4,12,12],[35,24,5,7],[43,17,6,10],[53,20,4,7],[6,36,4,3],[17,38,4,3],[33,32,4,3],[95,37,3.6,3]]),
  piles:piles([[4,44.5,3,17],[18,42.5,3.2,15],[33,38.2,2,10],[39.5,44,1.6,9],[61,43.5,1.6,9],[86,42.2,3,15],[97,45,2,12],[13,19.2,3,8],[93,17.5,4,10]])},
 district:{foliage:foliage([[5,4,15,13],[98,6,6,14],[3,91,10,11],[98,91,7,12],[13.5,59,3.3,2.5],[31,58.5,3,2.6],[44,58,3,2.5],[61,58,3,2.4],[74,58,3,2.3],[93,56,3,2.5]]),
  piles:piles([[4,74,3,15],[18,73,2,10],[35,72.5,2,12],[41,70,2,10],[67,68,2.3,12],[95,67,2,12],[6,95,4.5,20],[96,94,4,18],[12,37.5,3,8],[60,36.5,3.2,9]])},
 park:{foliage:foliage([[4,13,10,13],[18,6,11,10],[38,1.5,10,5],[63,2,10,6],[81,7,11,11],[98,13,9,13],[5,73,10,12],[97,73,10,13],[21,94,11,10],[80,94,11,10],[35,93,5,5],[65,93,5,5]]),
  piles:piles([[17,22,3,16],[32,15.5,2.4,13],[67,15,2.4,13],[83,23,3,16],[4,41,2,12],[96,41,2,12],[4,59,2.2,12],[96,59,2.2,12],[18,83,4,20],[82,83,4,20],[39,92,3,16],[62,92,3,16]])},
};
const colors=['#bd763d','#d0a14b','#ad5f3b','#d2b16b'];
export function autumnLeaves(scene:AutumnScene){
 return scene.piles.flatMap((pile,index)=>Array.from({length:pile.count},(_,i)=>{
  const angle=i*2.399963+index*.7,radius=Math.sqrt((i+.5)/pile.count);
  return {x:pile.x+Math.cos(angle)*pile.spread*radius,y:pile.y+Math.sin(angle)*pile.spread*.28*radius,
   rotation:(i*137+index*31)%360,size:.23+(i%4)*.055,color:colors[(i+index)%colors.length]};
 }));
}
