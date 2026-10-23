export function parseMusicTime(text:string):number{
 const value=text.trim();
 if(/^\d+(?:\.\d+)?$/.test(value))return Number(value);
 const match=/^(\d+):([0-5]?\d(?:\.\d+)?)$/.exec(value);
 return match?Number(match[1])*60+Number(match[2]):NaN;
}
export function formatMusicTime(seconds:number):string{
 if(!Number.isFinite(seconds)||seconds<0)return '';
 const rounded=Math.round(seconds*1000)/1000;
 if(rounded<60)return String(rounded);
 const minutes=Math.floor(rounded/60),rest=Math.round((rounded-minutes*60)*1000)/1000;
 return `${minutes}:${rest<10?'0':''}${rest}`;
}
export function musicDuration(start:number,end:number):number{
 return Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start?Math.round((end-start)*1000)/1000:NaN;
}
