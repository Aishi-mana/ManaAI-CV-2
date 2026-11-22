import type {OutdoorArea} from './manaverseNavigation';

type FlowerBed={x:number;y:number;spread:number;count:number};
const beds=(values:number[][]):FlowerBed[]=>values.map(([x,y,spread,count])=>({x,y,spread,count}));
// Accents sit in existing planters and planted borders, not on walking routes.
export const SPRING_SCENERY:Record<OutdoorArea,FlowerBed[]>={
 street:beds([[4,45.8,2.3,11],[12.5,62.2,2.4,13],[12,71.8,2.8,15],[38,59.5,2.6,13],[62.7,56.5,2.6,13],[75.5,44.5,2.4,11],[94.5,42.3,2.3,11],[97,51.5,1.8,9],[3,90,2.3,13],[96,90,2.5,13]]),
 square:beds([[6.7,34.3,2.6,15],[16.3,36.3,3,17],[32.8,31,3,17],[57.2,40,1.4,9],[40.4,40.4,1.5,9],[68.7,33,2.6,15],[89.4,35.3,2.8,15],[95.4,36.5,2,11]]),
 district:beds([[13.5,57.8,2.6,13],[30.8,57.5,2.4,13],[13.5,67,2.5,13],[43,57.3,2.2,11],[60.7,57.4,2.2,11],[47,62.3,1.6,9],[59,63,1.5,9],[74.6,56.4,2.2,11],[93,55.7,2.5,13],[73,63.3,1.6,9],[3,89,2.2,13],[97,90,2,11]]),
 park:beds([[17,8.7,5,21],[81.5,8.6,5,21],[35.5,16.5,2.6,13],[65.8,16.5,2.6,13],[7,33,2.4,13],[93.5,33,2.4,13],[2,39.5,1.4,9],[98,39.5,1.4,9],[2,59,1.4,9],[98,59,1.4,9],[8,74.5,4,19],[93,74.5,4,19],[24.5,91,5,21],[35.8,92.7,3,15],[65.8,92.3,3,15],[78,92,5,21]])
};
const PETAL_COLORS=['#f6bad4','#fff3d9','#dab9ed','#f9d6e3'];
export function springFlowers(beds:FlowerBed[]){
 return beds.flatMap((bed,index)=>Array.from({length:bed.count},(_,i)=>{
  const angle=i*2.399963+index*.8,radius=Math.sqrt((i+.5)/bed.count);
  return {x:bed.x+Math.cos(angle)*bed.spread*radius,y:bed.y+Math.sin(angle)*bed.spread*.3*radius,
   rotation:(i*137+index*29)%360,size:.2+(i%4)*.035,color:PETAL_COLORS[(i+index)%PETAL_COLORS.length]};
 }));
}

// Summer decorates the same planted borders with larger daisy heads.
export function summerFlowers(beds:FlowerBed[]){
 const colors=['#f5cf64','#f3a255','#f4db8e','#e9957f'];
 return springFlowers(beds).map((flower,index)=>({...flower,size:flower.size*1.4,color:colors[index%colors.length]}));
}
