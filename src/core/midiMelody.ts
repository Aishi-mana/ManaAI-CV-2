/** Phase 3B: import user-supplied Standard MIDI Files; never infer pitches
 * from a recording or assert that a track is the original singer's melody. */
export const MIDI_MAX_BYTES=1_000_000;
export const MELODY_MAX_NOTES=128;
export const MELODY_MAX_TICKS=480*4*128;
export const MELODY_MAX_TEMPOS=24;
export interface MelodyNote{
 position:number;duration:number;tone:number;lyric:string;lineIndex:number;
}
export interface MelodyTempo{position:number;bpm:number}
export interface MelodySignature{beatPerBar:number;beatUnit:number}
export interface MidiPhraseTrack{
 trackIndex:number;name:string;notes:Pick<MelodyNote,'position'|'duration'|'tone'>[];
}
export interface MidiPhraseFile{
 tracks:MidiPhraseTrack[];tempos:MelodyTempo[];signature:MelodySignature;
}
export type MelodyRightsBasis='owned'|'licensed'|'public-domain';
export interface MelodyGuide{
 sourceName:string;trackName:string;rightsBasis:MelodyRightsBasis;reviewedAt:string;
 signature:MelodySignature;tempos:MelodyTempo[];
 notes:MelodyNote[];englishRevision:string;mappingReviewed:boolean;
}
const validInteger=(x:unknown,min:number,max:number):x is number=>
 typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
const validTime=(x:unknown):x is string=>typeof x==='string'&&
 Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const allowedBasis=(x:unknown):x is MelodyRightsBasis=>
 x==='owned'||x==='licensed'||x==='public-domain';
export const englishRevision=(lines:{english:string}[]):string=>
 lines.map(line=>line.english.trim().replace(/\s+/g,' ')).join('\n');
export function normalizeMelodyGuide(raw:unknown,lineCount:number):MelodyGuide|undefined{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!validInteger(lineCount,1,16))return;
 const p=raw as Record<string,unknown>,sig=p.signature as Record<string,unknown>|undefined;
 if(typeof p.sourceName!=='string'||!p.sourceName||p.sourceName.length>180||
  typeof p.trackName!=='string'||!p.trackName||p.trackName.length>120||
  !allowedBasis(p.rightsBasis)||!validTime(p.reviewedAt)||
  !sig||!validInteger(sig.beatPerBar,1,12)||![2,4,8,16].includes(Number(sig.beatUnit))||
  typeof p.englishRevision!=='string'||p.englishRevision.length>4500||
  !Array.isArray(p.tempos)||p.tempos.length<1||p.tempos.length>MELODY_MAX_TEMPOS||
  !Array.isArray(p.notes)||p.notes.length<1||p.notes.length>MELODY_MAX_NOTES)return;
 const tempos:MelodyTempo[]=[],notes:MelodyNote[]=[];
 for(const rawTempo of p.tempos){
  const t=rawTempo as Record<string,unknown>;
  if(!t||!validInteger(t.position,0,MELODY_MAX_TICKS)||
   typeof t.bpm!=='number'||!Number.isFinite(t.bpm)||t.bpm<30||t.bpm>300||
   (tempos.length&&t.position<=tempos[tempos.length-1].position))return;
  tempos.push({position:t.position,bpm:t.bpm});
 }
 if(tempos[0].position!==0)return;
 for(const rawNote of p.notes){
  const n=rawNote as Record<string,unknown>;
  if(!n||!validInteger(n.position,0,MELODY_MAX_TICKS)||
   !validInteger(n.duration,1,MELODY_MAX_TICKS)||
   !validInteger(n.tone,0,127)||n.position+n.duration>MELODY_MAX_TICKS||
   !validInteger(n.lineIndex,0,lineCount-1)||typeof n.lyric!=='string'||
   n.lyric.length>60||/[\r\n\x00-\x1f]/.test(n.lyric)||
   (notes.length&&n.position<notes[notes.length-1].position+notes[notes.length-1].duration))return;
  notes.push({position:n.position,duration:n.duration,tone:n.tone,
   lyric:n.lyric,lineIndex:n.lineIndex});
 }
 return {sourceName:p.sourceName,trackName:p.trackName,rightsBasis:p.rightsBasis,
  reviewedAt:p.reviewedAt,signature:{beatPerBar:Number(sig.beatPerBar),
   beatUnit:Number(sig.beatUnit)},tempos,notes,englishRevision:p.englishRevision,
  mappingReviewed:p.mappingReviewed===true};
}
export function createMelodyGuide(file:MidiPhraseFile,trackIndex:number,
 sourceName:string,rightsBasis:MelodyRightsBasis,acknowledged:boolean,
 lines:{english:string}[],now=new Date()):MelodyGuide{
 if(!acknowledged||!allowedBasis(rightsBasis)||
  !Number.isFinite(now.getTime()))throw Error('Review the melody or MIDI composition rights first.');
 const selected=file.tracks.find(track=>track.trackIndex===trackIndex);
 if(!selected)throw Error('Choose a monophonic MIDI melody track.');
 const guide={
  sourceName:sourceName.slice(0,180),trackName:selected.name.slice(0,120),
  rightsBasis,reviewedAt:now.toISOString(),signature:file.signature,tempos:file.tempos,
  notes:selected.notes.map(n=>({...n,lyric:'',lineIndex:0})),
  englishRevision:englishRevision(lines),mappingReviewed:false,
 };
 const valid=normalizeMelodyGuide(guide,lines.length);
 if(!valid)throw Error('The selected melody is not suitable for this guide.');
 return valid;
}
export function updateMelodyNote(guide:MelodyGuide,index:number,
 field:'lyric'|'lineIndex',value:string|number,lineCount:number):MelodyGuide{
 if(!validInteger(index,0,guide.notes.length-1))throw Error('That melody note was not found.');
 if(field==='lineIndex'?!validInteger(value,0,lineCount-1):
  typeof value!=='string'||value.length>60||/[\r\n\x00-\x1f]/.test(value))
  throw Error('Choose a valid English lyric or source line.');
 return {...guide,mappingReviewed:false,notes:guide.notes.map((note,i)=>
  i===index?{...note,[field]:value}:note)};
}
export function seedGuideWords(guide:MelodyGuide,lines:{english:string}[],fromLine:number,
 toLine:number):MelodyGuide{
 if(!validInteger(fromLine,0,lines.length-1)||!validInteger(toLine,fromLine,lines.length-1))
  throw Error('Choose a source line range for the MIDI phrase.');
 const all=lines.slice(fromLine,toLine+1).map((line,i)=>({
  lineIndex:i+fromLine,words:line.english.trim().split(/\s+/).filter(Boolean),
 })).filter(item=>item.words.length);
 const wordCount=all.reduce((n,item)=>n+item.words.length,0);
 if(!wordCount)throw Error('Write the English adaptation before mapping note lyrics.');
 if(wordCount>guide.notes.length)
  throw Error('The English phrase has more words than MIDI notes. Choose a longer phrase or shorten the adaptation.');
 // A rough, deliberately unverified mapping. Multi-syllable words and phrasing
 // must be fixed in OpenUtau or in the per-note editor. +~ holds a syllable.
 const words=all.flatMap(item=>item.words.map(word=>({lyric:word,lineIndex:item.lineIndex})));
 const last=words[words.length-1];
 const notes=guide.notes.map((note,i)=>({
  ...note,...(i<words.length?words[i]:{lyric:'+~',lineIndex:last.lineIndex}),
 }));
 return {...guide,notes,englishRevision:englishRevision(lines),mappingReviewed:false};
}
export function syncGuideEnglish(guide:MelodyGuide,lines:{english:string}[]):MelodyGuide{
 return {...guide,englishRevision:englishRevision(lines),mappingReviewed:false};
}
export function guideReady(guide:MelodyGuide|undefined,lines:{english:string}[]):boolean{
 return !!guide&&guide.mappingReviewed&&guide.englishRevision===englishRevision(lines)&&
  guide.notes.every(n=>!!n.lyric.trim())&&lines.some(x=>x.english.trim());
}
export function reviewGuideMapping(guide:MelodyGuide,lines:{english:string}[]):MelodyGuide{
 if(guide.englishRevision!==englishRevision(lines))
  throw Error('The English words have changed. Sync and review the note lyrics again.');
 if(!guide.notes.every(n=>n.lyric.trim())||!lines.some(line=>line.english.trim()))
  throw Error('Fill every note with a lyric, syllable, + or +~ before reviewing.');
 return {...guide,mappingReviewed:true};
}
/** Read a bounded SMF type 0/1, monophonic phrase tracks only. No guessing
 * which MIDI track represents the singer, no web or audio transcription. */
export function parseMidiFile(bytes:Uint8Array):MidiPhraseFile{
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<22||bytes.byteLength>MIDI_MAX_BYTES)
  throw Error('Choose a MIDI file smaller than 1 MB.');
 let pos=0;
 const take=(len:number)=>{if(!validInteger(len,0,bytes.length)||pos+len>bytes.length)
  throw Error('MIDI file is incomplete.');const start=pos;pos+=len;return start;};
 const u16=()=>{const p=take(2);return (bytes[p]<<8)|bytes[p+1];};
 const u32=()=>{const p=take(4);return (bytes[p]*0x1000000)+
  (bytes[p+1]<<16)+(bytes[p+2]<<8)+bytes[p+3];};
 const tag=()=>String.fromCharCode(...bytes.slice(take(4),pos));
 if(tag()!=='MThd')throw Error('This is not a Standard MIDI File.');
 const header=u32();
 if(header<6||header>64)throw Error('Invalid MIDI header.');
 const format=u16(),trackCount=u16(),division=u16();
 take(header-6);
 if(![0,1].includes(format)||trackCount<1||trackCount>32||
  (format===0&&trackCount!==1)||division&0x8000||division<24||division>9600)
  throw Error('Use a standard type 0/1 MIDI with ticks-per-beat timing and up to 32 tracks.');
 const scale=480/division;
 const events:{tick:number;micros:number}[]=[],signatures:({tick:number;n:number;d:number})[]=[];
 const all:MidiPhraseTrack[]=[];
 for(let trackIndex=0;trackIndex<trackCount;trackIndex++){
  if(tag()!=='MTrk')throw Error('Invalid MIDI track header.');
  const length=u32(),end=take(length)+length;
  const active=new Map<string,{tick:number;tone:number}>(),notes:{tick:number;end:number;tone:number}[]=[];
  let tick=0,status=0,name='Track '+(trackIndex+1),eventCount=0;
  const byte=()=>{if(pos>=end)throw Error('Truncated MIDI event.');return bytes[pos++];};
  const vlq=()=>{let result=0;for(let i=0;i<4;i++){
   const b=byte();result=result*128+(b&127);
   if(!(b&128))return result;
  }throw Error('Invalid MIDI event delta.');};
  while(pos<end){
   if(++eventCount>50000)throw Error('This MIDI has too many events.');
   tick+=vlq();
   if(tick>2_000_000_000)throw Error('MIDI timing exceeds the supported range.');
   let kind=byte(),first:number|undefined;
   if(kind<0x80){if(status<0x80||status>=0xf0)throw Error('Invalid MIDI running status.');
    first=kind;kind=status;}
   else if(kind<0xf0)status=kind;
   else status=0;
   if(kind===0xff){
    const meta=byte(),size=vlq();
    if(pos+size>end)throw Error('Truncated MIDI metadata.');
    const start=pos;pos+=size;
    if(meta===0x03&&size<=120){
     name=new TextDecoder('utf-8').decode(bytes.subarray(start,pos)).trim().slice(0,120)||name;
    }
    if(meta===0x51&&size===3){
     const micros=bytes[start]*65536+bytes[start+1]*256+bytes[start+2];
     if(!micros)throw Error('MIDI has an invalid tempo.');
     events.push({tick,micros});
    }
    if(meta===0x58&&size>=2){
     const n=bytes[start],d=2**bytes[start+1];
     if(n<1||n>12||![2,4,8,16].includes(d))throw Error('Unsupported MIDI time signature.');
     signatures.push({tick,n,d});
    }
    if(meta===0x2f)break;
   }else if(kind===0xf0||kind===0xf7){
    const n=vlq();if(pos+n>end)throw Error('Invalid MIDI SysEx.');pos+=n;
   }else if(kind>=0x80&&kind<0xf0){
    const type=kind&0xf0,channel=kind&0xf,raw1=first??byte();
    const raw2=type===0xc0||type===0xd0?0:byte();
    if(type===0x80||type===0x90){
     const key=channel+':'+raw1,playing=active.get(key);
     if(type===0x90&&raw2>0){
      if(playing)throw Error('Overlapping repeated MIDI note events are unsupported.');
      active.set(key,{tick,tone:raw1});
     }else if(playing){
      if(tick>playing.tick)notes.push({tick:playing.tick,end:tick,tone:playing.tone});
      active.delete(key);
     }
    }
   }else throw Error('Unsupported MIDI system event.');
  }
  pos=end;
  if(active.size)continue; // Require explicit note-off timing.
  notes.sort((a,b)=>a.tick-b.tick||a.tone-b.tone);
  if(!notes.length||notes.length>MELODY_MAX_NOTES)continue;
  const out:MidiPhraseTrack['notes']=[];let previousEnd=0,polyphonic=false;
  for(const n of notes){
   const position=Math.round(n.tick*scale),duration=Math.max(1,Math.round((n.end-n.tick)*scale));
   if(position<previousEnd||position+duration>MELODY_MAX_TICKS){polyphonic=true;break;}
   out.push({position,duration,tone:n.tone});previousEnd=position+duration;
  }
  if(!polyphonic)all.push({trackIndex,name,notes:out});
 }
 if(!all.length)throw Error('No short monophonic melody tracks were found. Export a lead-only MIDI phrase (1–128 notes).');
 const signaturesSorted=signatures.sort((a,b)=>a.tick-b.tick);
 const signature=signaturesSorted.length?
  {beatPerBar:signaturesSorted[0].n,beatUnit:signaturesSorted[0].d}:
  {beatPerBar:4,beatUnit:4};
 if(signaturesSorted.some(x=>x.n!==signature.beatPerBar||x.d!==signature.beatUnit))
  throw Error('Time-signature changes are not supported in this phrase. Export a single-meter MIDI.');
 const tempos=[{position:0,bpm:120}],tempoByTick=new Map<number,number>();
 for(const e of events){
  const bpm=Math.round(60_000_000/e.micros*100)/100;
  if(bpm<30||bpm>300)throw Error('MIDI tempo must be between 30 and 300 BPM.');
  const tick=Math.round(e.tick*scale);
  if(tick<=MELODY_MAX_TICKS)tempoByTick.set(tick,bpm);
 }
 const sorted=[...tempoByTick].sort((a,b)=>a[0]-b[0]);
 for(const [position,bpm] of sorted){if(position===0)tempos[0].bpm=bpm;
  else tempos.push({position,bpm});}
 if(tempos.length>MELODY_MAX_TEMPOS)throw Error('Too many MIDI tempo changes.');
 return {tracks:all,tempos,signature};
}
