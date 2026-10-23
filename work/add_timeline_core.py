from pathlib import Path
p=Path('src/core/coverBuilder.ts');s=p.read_text(encoding='utf-8');s=s.replace('custom:validCustom(t.custom),sections,','custom:validCustom(t.custom),trim:validTrackTrim(t.trim,number(t.seconds,0,0,3600)),solo:t.solo===true,sections,');p.write_text(s,encoding='utf-8')
p=Path('src/core/studioMix.ts');s=p.read_text(encoding='utf-8');s="import {validTrackTrim,type TrackTrim} from './builderTimeline';\n"+s
s=s.replace('offset:number;sections?:BackingSection[];sectionFade?:number}[]','offset:number;sections?:BackingSection[];sectionFade?:number;trim?:TrackTrim}[]')
s=s.replace(' const frames=Math.max(...parts.map(p=>p.audio.length+Math.round(p.offset*rate)));',' const ranges=parts.map(p=>{if(p.trim&&!validTrackTrim(p.trim,p.audio.duration))throw Error(\'Choose a trim within the track.\');return p.trim??{start:0,end:p.audio.duration};});\n const frames=Math.max(...parts.map((p,i)=>Math.round(ranges[i].end*rate)+Math.round(p.offset*rate)));')
s=s.replace(' for(const part of parts){const shift=Math.round(part.offset*rate);const envelope=', ' for(const [index,part] of parts.entries()){const first=Math.round(ranges[index].start*rate),last=Math.min(part.audio.length,Math.round(ranges[index].end*rate));const shift=Math.round(part.offset*rate);const envelope=')
s=s.replace('for(let i=Math.max(0,-shift);i<data.length;i++)','for(let i=Math.max(first,-shift);i<last;i++)')
p.write_text(s,encoding='utf-8')
