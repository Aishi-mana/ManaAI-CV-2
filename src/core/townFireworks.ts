export type FireworkSpark={x:number;y:number;vx:number;vy:number;life:number;duration:number;color:string};
export function fireworkBurst(x:number,y:number,size:number,color:string,random=Math.random):FireworkSpark[]{
 return Array.from({length:36},(_,index)=>{
  const angle=index*Math.PI*2/36;
  const speed=size*(.15+random()*.19),duration=1.4+random()*.5;
  return {x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:duration,duration,color};
 });
}
export function stepFirework(spark:FireworkSpark,seconds:number,gravity:number){
 const dt=Math.max(0,Math.min(.05,seconds));
 spark.x+=spark.vx*dt;
 spark.y+=spark.vy*dt;
 spark.vy+=gravity*dt;
 const drag=Math.exp(-dt*.65);
 spark.vx*=drag;
 spark.life-=dt;
}
