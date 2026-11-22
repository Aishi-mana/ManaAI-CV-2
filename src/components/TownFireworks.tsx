import {useEffect,useRef} from 'react';
import {fireworkBurst,stepFirework,type FireworkSpark} from '../core/townFireworks';

const colors=['#ffe4a1','#f6a8c7','#a4d9ff','#c4b1ff','#b8e6cb'];
type Rocket={x:number;y:number;target:number;color:string};

export default function TownFireworks(){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const surface=canvas.current;
  const context=surface?.getContext('2d');
  if(!surface||!context)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,frame=0,last=performance.now(),nextBurst=0;
  let sparks:FireworkSpark[]=[],rockets:Rocket[]=[];
  function drawSpark(spark:FireworkSpark,previousX:number,previousY:number){
   context!.globalAlpha=Math.max(0,spark.life/spark.duration);
   context!.strokeStyle=spark.color;
   context!.shadowColor=spark.color;
   context!.shadowBlur=5;
   context!.lineWidth=Math.max(1.2,width/1000);
   context!.beginPath();context!.moveTo(previousX,previousY);context!.lineTo(spark.x,spark.y);context!.stroke();
  }
  function still(){
   context!.clearRect(0,0,width,height);
   for(const x of [.28,.72]){
    for(const spark of fireworkBurst(width*x,height*.3,Math.min(width,height),x<.5?colors[0]:colors[3])){
     spark.x+=spark.vx*.7;spark.y+=spark.vy*.7;
     drawSpark(spark,spark.x-spark.vx*.06,spark.y-spark.vy*.06);
    }
   }
  }
  function tick(now:number){
   if(document.visibilityState!=='visible'||motion.matches)return;
   const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;
   context!.clearRect(0,0,width,height);
   if(now>=nextBurst){
    rockets.push({x:width*(.17+Math.random()*.66),y:height*.97,target:height*(.2+Math.random()*.28),color:colors[Math.floor(Math.random()*colors.length)]});
    nextBurst=now+1900+Math.random()*1100;
   }
   for(const rocket of rockets){
    const previous=rocket.y;rocket.y-=height*.85*dt;
    context!.globalAlpha=.8;context!.strokeStyle=rocket.color;context!.shadowColor=rocket.color;context!.shadowBlur=5;
    context!.lineWidth=Math.max(1,width/1200);
    context!.beginPath();context!.moveTo(rocket.x,previous+height*.03);context!.lineTo(rocket.x,rocket.y);context!.stroke();
    if(rocket.y<=rocket.target)sparks.push(...fireworkBurst(rocket.x,rocket.y,Math.min(width,height),rocket.color));
   }
   rockets=rockets.filter(rocket=>rocket.y>rocket.target);
   for(const spark of sparks){
    const x=spark.x,y=spark.y;
    stepFirework(spark,dt,height*.12);drawSpark(spark,x,y);
   }
   sparks=sparks.filter(spark=>spark.life>0).slice(-180);
   frame=requestAnimationFrame(tick);
  }
  function resume(){
   cancelAnimationFrame(frame);
   if(motion.matches){still();return;}
   if(document.visibilityState==='visible'){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  function resize(){
   const bounds=surface!.getBoundingClientRect();
   width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);
   const scale=Math.min(window.devicePixelRatio||1,2,1800/width);
   surface!.width=Math.round(width*scale);surface!.height=Math.round(height*scale);
   context!.setTransform(scale,0,0,scale,0,0);
   sparks=[];rockets=[];nextBurst=0;
   resume();
  }
  const observer=new ResizeObserver(resize);observer.observe(surface);
  document.addEventListener('visibilitychange',resume);
  motion.addEventListener('change',resume);
  resize();
  return ()=>{
   cancelAnimationFrame(frame);observer.disconnect();
   document.removeEventListener('visibilitychange',resume);motion.removeEventListener('change',resume);
  };
 },[]);
 return <canvas ref={canvas} className="town-fireworks" aria-hidden="true"/>;
}
