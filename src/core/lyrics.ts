export interface LyricWord {start:number;end:number;text:string}
export interface LyricLine {start:number;end:number;text:string;words?:LyricWord[]}
export function validateLyrics(value:unknown):LyricLine[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,2000).flatMap(item=>{
  if(!item||typeof item!=='object')return [];const v=item as Record<string,unknown>;
  if(typeof v.start!=='number'||!Number.isFinite(v.start)||v.start<0||typeof v.end!=='number'||!Number.isFinite(v.end)||v.end<=v.start||v.end>86400||typeof v.text!=='string'||!v.text.trim())return [];
  const line:LyricLine={start:v.start,end:v.end,text:v.text.trim().slice(0,500)};
  if(Array.isArray(v.words)&&v.words.length>0&&v.words.length<=200){
   const words:LyricWord[]=[];let valid=true,previous=line.start;
   for(const item of v.words){const w=item as Record<string,unknown>|null;
    if(!w||typeof w.start!=='number'||!Number.isFinite(w.start)||typeof w.end!=='number'||!Number.isFinite(w.end)||w.start<previous||w.end<=w.start||w.end>line.end||typeof w.text!=='string'||!w.text.trim()){valid=false;break;}
    words.push({start:w.start,end:w.end,text:w.text.trim()});previous=w.end;
   }
   if(valid&&words.map(w=>w.text).join(' ').replace(/\s+/g,' ')===line.text.replace(/\s+/g,' '))line.words=words;
  }
  return [line];
 }).sort((a,b)=>a.start-b.start);
}
export function activeLyric(lines:LyricLine[],time:number){return lines.findIndex(line=>time>=line.start&&time<line.end);}
export function activeLyricWord(line:LyricLine,time:number){return line.words?.findIndex(word=>time>=word.start&&time<word.end)??-1;}
export function excerptLyrics(value:unknown,start:number,seconds:number):LyricLine[]{
 return validateLyrics(value).filter(line=>line.end>start&&line.start<start+seconds).flatMap(line=>{
  const result:LyricLine={text:line.text,start:Math.max(0,line.start-start),end:Math.min(seconds,line.end-start)};
  if(line.words){const words=line.words.filter(w=>w.end>start&&w.start<start+seconds).map(w=>({...w,start:Math.max(0,w.start-start),end:Math.min(seconds,w.end-start)}));if(!words.length)return [];result.words=words;result.text=words.map(w=>w.text).join(' ');}
  return [result];
 });
}
function timestamp(time:number){const ms=Math.round(time*1000);return `${String(Math.floor(ms/60000)).padStart(2,'0')}:${((ms%60000)/1000).toFixed(3).padStart(6,'0')}`;}
export function lyricsToLrc(lines:LyricLine[]){return lines.map(line=>`[${timestamp(line.start)}]${line.words?line.words.map(w=>`<${timestamp(w.start)}>${w.text}<${timestamp(w.end)}>`).join(' '):line.text}`).join('\n');}
export function parseLrc(text:string,duration:number):LyricLine[]{
 const rows=text.split(/\r?\n/).filter(line=>line.trim());if(rows.length>2000)throw Error('Use at most 2,000 lyric lines.');
 const entries=rows.map(row=>{const m=row.match(/^\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]\s*(.+)$/);if(!m||Number(m[2])>=60)throw Error('Use [mm:ss.xx] followed by lyrics; optional <mm:ss.xxx> markers time individual words.');return {start:Number(m[1])*60+Number(m[2]),text:m[3].trim()};}).sort((a,b)=>a.start-b.start);
 if(entries.some((e,i)=>e.start>=duration||(i>0&&e.start===entries[i-1].start)))throw Error('Each lyric needs a unique time within the song.');
 return entries.map((e,i)=>{
  const end=entries[i+1]?.start??duration;
  const tags=[...e.text.matchAll(/<(\d{1,3}):(\d{2}(?:\.\d{1,3})?)>/g)];
  if(!tags.length){if(e.text.length>500)throw Error('Use at most 500 characters per lyric line.');return {...e,end};}
  if(e.text.slice(0,tags[0].index).trim())throw Error('Place a word timestamp before the first word.');
  const words:LyricWord[]=[];let previous=e.start;
  for(let n=0;n<tags.length;n++){
   const tag=tags[n],time=Number(tag[1])*60+Number(tag[2]);
   if(Number(tag[2])>=60||time<previous||time>end)throw Error('Word times must increase within their lyric line.');previous=time;
   const content=e.text.slice(tag.index!+tag[0].length,tags[n+1]?.index).trim();if(!content)continue;
   if(!tags[n+1])throw Error('Add a final word-end timestamp after the last word.');
   const next=Number(tags[n+1][1])*60+Number(tags[n+1][2]);if(next<=time)throw Error('Each word must have a positive duration.');
   words.push({start:time,end:next,text:content});
  }
  const line={start:e.start,end,text:words.map(w=>w.text).join(' '),words};
  const valid=validateLyrics([line])[0];if(!valid?.words)throw Error('Check word timing and use at most 500 characters per line.');return valid;
 });
}
