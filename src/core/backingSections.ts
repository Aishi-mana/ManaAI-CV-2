export interface BackingSection{start:number;end:number}
export function checkedSections(value:BackingSection[],seconds:number):BackingSection[]{
 if(!Array.isArray(value)||value.length>32||!Number.isFinite(seconds)||seconds<=0)throw Error('Use up to 32 backing sections within this track.');
 const sorted=value.map(s=>{
  if(!s||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>seconds+.000001)throw Error('Each backing section needs a start before its end, within this track.');
  return {start:s.start,end:Math.min(seconds,s.end)};
 }).sort((a,b)=>a.start-b.start);
 const merged:BackingSection[]=[];
 for(const s of sorted){const last=merged[merged.length-1];if(last&&s.start<=last.end)last.end=Math.max(last.end,s.end);else merged.push({...s});}
 return merged;
}
export function sectionEnvelope(length:number,rate:number,sections:BackingSection[],fade=.15):Float32Array{
 if(!Number.isFinite(fade)||fade<0||fade>2)throw Error('Use a backing fade between 0 and 2 seconds.');
 const ranges=checkedSections(sections,length/rate),envelope=new Float32Array(length);
 for(const s of ranges){
  const first=Math.round(s.start*rate),last=Math.min(length,Math.round(s.end*rate));
  const edge=Math.min(Math.round(fade*rate),Math.floor((last-first)/2));
  envelope.fill(1,first,last);
  for(let i=0;i<edge;i++){const gain=Math.sin((i/edge)*Math.PI/2)**2;envelope[first+i]=gain;envelope[last-1-i]=gain;}
 }
 return envelope;
}
