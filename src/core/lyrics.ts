export interface LyricLine {start:number;end:number;text:string}
export function validateLyrics(value:unknown):LyricLine[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,2000).flatMap(item=>{if(!item||typeof item!=='object')return [];const v=item as Record<string,unknown>;return typeof v.start==='number'&&Number.isFinite(v.start)&&v.start>=0&&typeof v.end==='number'&&Number.isFinite(v.end)&&v.end>v.start&&v.end<=86400&&typeof v.text==='string'&&v.text.trim()?[{start:v.start,end:v.end,text:v.text.trim().slice(0,500)}]:[];}).sort((a,b)=>a.start-b.start);
}
export function activeLyric(lines:LyricLine[],time:number){return lines.findIndex(line=>time>=line.start&&time<line.end);}
export function excerptLyrics(value:unknown,start:number,seconds:number):LyricLine[]{return validateLyrics(value).filter(line=>line.end>start&&line.start<start+seconds).map(line=>({text:line.text,start:Math.max(0,line.start-start),end:Math.min(seconds,line.end-start)}));}
export function lyricsToLrc(lines:LyricLine[]){return lines.map(line=>`[${String(Math.floor(line.start/60)).padStart(2,'0')}:${(line.start%60).toFixed(2).padStart(5,'0')}]${line.text}`).join('\n');}
export function parseLrc(text:string,duration:number):LyricLine[]{
 const rows=text.split(/\r?\n/).filter(line=>line.trim());if(rows.length>2000)throw Error('Use at most 2,000 lyric lines.');
 const entries=rows.map(row=>{const m=row.match(/^\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]\s*(.+)$/);if(!m||Number(m[2])>=60)throw Error('Use [mm:ss.xx] followed by the lyric on each line.');return {start:Number(m[1])*60+Number(m[2]),text:m[3].trim()};}).sort((a,b)=>a.start-b.start);
 if(entries.some((e,i)=>e.start>=duration||e.text.length>500||(i>0&&e.start===entries[i-1].start)))throw Error('Each lyric needs a unique time within the song and at most 500 characters.');
 return entries.map((e,i)=>({...e,end:entries[i+1]?.start??duration}));
}
