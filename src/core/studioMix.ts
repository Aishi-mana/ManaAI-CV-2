import {validTrackTrim,validateClips,clipFadeLevel,type BuilderClip,type TrackTrim} from './builderTimeline';
import {checkedSections,sectionEnvelope,type BackingSection} from './backingSections';
export function previewBackingSections(audio:AudioBuffer,sections:BackingSection[],fade=.15):ArrayBuffer{
 const ranges=checkedSections(sections,audio.duration);
 if(!ranges.length)throw Error('Add at least one backing section to preview.');
 const spans=ranges.map(r=>({first:Math.round(r.start*audio.sampleRate),last:Math.min(audio.length,Math.round(r.end*audio.sampleRate))}));
 const length=spans.reduce((sum,r)=>sum+r.last-r.first,0);
 if(length<=0)throw Error('Choose backing sections containing audio.');
 const envelope=sectionEnvelope(audio.length,audio.sampleRate,sections,fade);
 const channels=Array.from({length:audio.numberOfChannels},(_,channel)=>{
  const source=audio.getChannelData(channel),output=new Float32Array(length);let position=0;
  for(const span of spans){for(let i=span.first;i<span.last;i++)output[position++]=source[i]*envelope[i];}
  return output;
 });
 const preview={sampleRate:audio.sampleRate,length,duration:length/audio.sampleRate,numberOfChannels:channels.length,getChannelData:(channel:number)=>channels[channel]} as AudioBuffer;
 return mixStems([{audio:preview,gain:1}]);
}
// Encode an aligned stereo mix. Reduce both stems together only if peaks would clip.
export function mixWave(vocal:AudioBuffer,backing:AudioBuffer,vocalGain:number,backingGain:number):ArrayBuffer{
 return mixStems([{audio:vocal,gain:vocalGain},{audio:backing,gain:backingGain}]);
}
// Audition only the selected lead section, with the candidate harmony at zero
// relative offset. Draft track offsets are applied when adding it to the mix.
export function mixHarmonyPreview(lead:AudioBuffer,harmony:AudioBuffer,start:number,seconds:number,leadGain:number,harmonyGain:number):ArrayBuffer{
 if(!Number.isFinite(start)||start<0||!Number.isFinite(seconds)||seconds<1||seconds>3600||start+seconds>lead.duration+1/lead.sampleRate)throw Error('Choose a harmony section within the lead.');
 if(lead.sampleRate!==harmony.sampleRate||Math.abs(harmony.duration-seconds)>.2)throw Error('Harmony and lead section are not aligned.');
 const frames=Math.round(seconds*lead.sampleRate),first=Math.round(start*lead.sampleRate);
 const clip=(audio:AudioBuffer,offset:number)=>({sampleRate:audio.sampleRate,length:frames,duration:frames/audio.sampleRate,numberOfChannels:audio.numberOfChannels,getChannelData:(channel:number)=>audio.getChannelData(channel).subarray(offset,offset+frames)}) as AudioBuffer;
 return mixStems([{audio:clip(lead,first),gain:leadGain},{audio:clip(harmony,0),gain:harmonyGain}]);
}
export function mixStems(parts:{audio:AudioBuffer;gain:number}[]):ArrayBuffer{
 if(!parts.length||parts.some(p=>!Number.isFinite(p.gain)||p.gain<0||p.gain>1))throw Error('Use gains between 0 and 1.');
 const rate=parts[0].audio.sampleRate;
 if(parts.some(p=>p.audio.sampleRate!==rate||Math.abs(p.audio.duration-parts[0].audio.duration)>1))throw Error('The stems are not aligned. Choose stems from the same cover.');
 const frames=Math.max(...parts.map(p=>p.audio.length)),samples=new Float32Array(frames*2);let peak=1;
 for(let channel=0;channel<2;channel++){for(const part of parts){const data=part.audio.getChannelData(Math.min(channel,part.audio.numberOfChannels-1));for(let i=0;i<frames;i++)samples[i*2+channel]+=(data[i]||0)*part.gain;}}
 for(const sample of samples)peak=Math.max(peak,Math.abs(sample));
 const bytes=new ArrayBuffer(44+samples.length*2),view=new DataView(bytes);const text=(offset:number,value:string)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
 text(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
 samples.forEach((sample,i)=>view.setInt16(44+i*2,Math.round(sample/peak*32767),true));return bytes;
}
// Builder tracks can have independent lengths and positive delay / negative trim.
export function mixTimeline(parts:{audio:AudioBuffer;gain:number;offset:number;sections?:BackingSection[];sectionFade?:number;trim?:TrackTrim;clips?:BuilderClip[]}[]):ArrayBuffer{
 if(!parts.length||parts.length>16||parts.some(p=>!Number.isFinite(p.gain)||p.gain<0||p.gain>1||!Number.isFinite(p.offset)||Math.abs(p.offset)>3600))throw Error('Choose tracks with valid levels and timing offsets.');
 const rate=parts[0].audio.sampleRate;
 if(parts.some(p=>p.audio.sampleRate!==rate))throw Error('Track sample rates must match.');
 const lanes=parts.flatMap(p=>{
  if(p.clips!==undefined){const clips=validateClips(p.clips,p.audio.duration);if(clips.length!==p.clips.length)throw Error('Choose valid clips within the track.');return clips.map(c=>({...p,source:p,clip:c as BuilderClip|undefined,trim:{start:c.start,end:c.end},offset:p.offset+c.offset}));}
  if(p.trim&&!validTrackTrim(p.trim,p.audio.duration))throw Error('Choose a trim within the track.');
  return [{...p,source:p,clip:undefined,trim:p.trim??{start:0,end:p.audio.duration}}];
 });
 const frames=Math.max(0,...lanes.map(p=>Math.round(p.trim.end*rate)+Math.round(p.offset*rate)));
 if(frames<=0||frames>rate*3600)throw Error('The mixed timeline must contain audio and be at most one hour.');
 if(44+frames*4>256000000)throw Error('This timeline exceeds the 256 MB WAV limit. Trim the tracks or reduce their offsets.');
 const samples=new Float32Array(frames*2);let peak=1;
 // Reuse source envelopes for all clips of a track; no extra decoding.
 const envelopes=new Map(parts.map(p=>[p,p.sections===undefined?undefined:sectionEnvelope(p.audio.length,rate,p.sections,p.sectionFade??.15)]));
 for(const part of lanes){const first=Math.round(part.trim.start*rate),last=Math.min(part.audio.length,Math.round(part.trim.end*rate));const shift=Math.round(part.offset*rate);const envelope=envelopes.get(part.source);for(let c=0;c<2;c++){const data=part.audio.getChannelData(Math.min(c,part.audio.numberOfChannels-1));for(let i=Math.max(first,-shift);i<last;i++){const sample=data[i]*part.gain*(envelope?envelope[i]:1)*(part.clip?clipFadeLevel(part.clip,i/rate):1);if(!Number.isFinite(sample))throw Error('A track contains invalid audio.');samples[(i+shift)*2+c]+=sample;}}}
 for(const sample of samples)peak=Math.max(peak,Math.abs(sample));
 const bytes=new ArrayBuffer(44+samples.length*2),view=new DataView(bytes);
 const text=(offset:number,value:string)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
 text(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
 samples.forEach((sample,i)=>view.setInt16(44+i*2,Math.round(sample/peak*32767),true));return bytes;
}
