import fs from 'node:fs';const cp='src/core/coverBuilder.ts';let s=fs.readFileSync(cp,'utf8').replace('validTrackTrim,type TrackTrim','validTrackTrim,validateClips,type BuilderClip,type TrackTrim').replace('trim?:TrackTrim;solo?:boolean','trim?:TrackTrim;clips?:BuilderClip[];solo?:boolean').replace('solo:t.solo===true,sections,','solo:t.solo===true,clips:t.clips===undefined?undefined:validateClips(t.clips,number(t.seconds,0,0,3600)),sections,');fs.writeFileSync(cp,s);
const mp='src/core/studioMix.ts';s=fs.readFileSync(mp,'utf8').replace('validTrackTrim,type TrackTrim','validTrackTrim,validateClips,type BuilderClip,type TrackTrim').replace('sectionFade?:number;trim?:TrackTrim}[]','sectionFade?:number;trim?:TrackTrim;clips?:BuilderClip[]}[]');const a=s.indexOf(' const ranges=parts.map('),b=s.indexOf(' for(const sample of samples)peak=',a);
s=s.slice(0,a)+` const lanes=parts.flatMap(p=>{
  if(p.clips!==undefined){const clips=validateClips(p.clips,p.audio.duration);if(clips.length!==p.clips.length)throw Error('Choose valid clips within the track.');return clips.map(c=>({...p,trim:{start:c.start,end:c.end},offset:p.offset+c.offset}));}
  if(p.trim&&!validTrackTrim(p.trim,p.audio.duration))throw Error('Choose a trim within the track.');
  return [{...p,trim:p.trim??{start:0,end:p.audio.duration}}];
 });
 const frames=Math.max(0,...lanes.map(p=>Math.round(p.trim.end*rate)+Math.round(p.offset*rate)));
 if(frames<=0||frames>rate*3600)throw Error('The mixed timeline must contain audio and be at most one hour.');
 if(44+frames*4>256000000)throw Error('This timeline exceeds the 256 MB WAV limit. Trim the tracks or reduce their offsets.');
 const samples=new Float32Array(frames*2);let peak=1;
 // Reuse source envelopes for all clips of a track; no extra decoding.
 const envelopes=new Map(parts.map(p=>[p.audio,p.sections===undefined?undefined:sectionEnvelope(p.audio.length,rate,p.sections,p.sectionFade??.15)]));
 for(const part of lanes){const first=Math.round(part.trim.start*rate),last=Math.min(part.audio.length,Math.round(part.trim.end*rate));const shift=Math.round(part.offset*rate);const envelope=envelopes.get(part.audio);for(let c=0;c<2;c++){const data=part.audio.getChannelData(Math.min(c,part.audio.numberOfChannels-1));for(let i=Math.max(first,-shift);i<last;i++){const sample=data[i]*part.gain*(envelope?envelope[i]:1);if(!Number.isFinite(sample))throw Error('A track contains invalid audio.');samples[(i+shift)*2+c]+=sample;}}}
`+s.slice(b);fs.writeFileSync(mp,s);
