// Encode an aligned stereo mix. Reduce both stems together only if peaks would clip.
export function mixWave(vocal:AudioBuffer,backing:AudioBuffer,vocalGain:number,backingGain:number):ArrayBuffer{
 return mixStems([{audio:vocal,gain:vocalGain},{audio:backing,gain:backingGain}]);
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
export function mixTimeline(parts:{audio:AudioBuffer;gain:number;offset:number}[]):ArrayBuffer{
 if(!parts.length||parts.length>16||parts.some(p=>!Number.isFinite(p.gain)||p.gain<0||p.gain>1||!Number.isFinite(p.offset)||Math.abs(p.offset)>3600))throw Error('Choose tracks with valid levels and timing offsets.');
 const rate=parts[0].audio.sampleRate;
 if(parts.some(p=>p.audio.sampleRate!==rate))throw Error('Track sample rates must match.');
 const frames=Math.max(...parts.map(p=>p.audio.length+Math.round(p.offset*rate)));
 if(frames<=0||frames>rate*3600)throw Error('The mixed timeline must contain audio and be at most one hour.');
 if(44+frames*4>256000000)throw Error('This timeline exceeds the 256 MB WAV limit. Trim the tracks or reduce their offsets.');
 const samples=new Float32Array(frames*2);let peak=1;
 for(const part of parts){const shift=Math.round(part.offset*rate);for(let c=0;c<2;c++){const data=part.audio.getChannelData(Math.min(c,part.audio.numberOfChannels-1));for(let i=Math.max(0,-shift);i<data.length;i++){const sample=data[i]*part.gain;if(!Number.isFinite(sample))throw Error('A track contains invalid audio.');samples[(i+shift)*2+c]+=sample;}}}
 for(const sample of samples)peak=Math.max(peak,Math.abs(sample));
 const bytes=new ArrayBuffer(44+samples.length*2),view=new DataView(bytes);
 const text=(offset:number,value:string)=>[...value].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
 text(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,samples.length*2,true);
 samples.forEach((sample,i)=>view.setInt16(44+i*2,Math.round(sample/peak*32767),true));return bytes;
}
