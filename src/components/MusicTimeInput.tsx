import {useEffect,useRef,useState} from 'react';
import {parseMusicTime,formatMusicTime} from '../core/musicTime';
interface Props{value:number;onChange:(seconds:number)=>void;disabled?:boolean;min?:number;max?:number;step?:number}
export default function MusicTimeInput({value,onChange,disabled,min=0,max}:Props){
 const [text,setText]=useState(()=>formatMusicTime(value));const emitted=useRef(value),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(!Object.is(value,emitted.current)){emitted.current=value;setText(formatMusicTime(value));}},[value]);
 const parsed=parseMusicTime(text),valid=Number.isFinite(parsed)&&parsed>=min&&(max===undefined||parsed<=max);
 useEffect(()=>{input.current?.setCustomValidity(valid?'':'Enter seconds or minutes:seconds, for example 90 or 1:30.');},[valid]);
 return <input ref={input} type="text" placeholder="90 or 1:30" title="Position in the audio: seconds or minutes:seconds" disabled={disabled} value={text} aria-invalid={!valid} onChange={e=>{
  const next=e.target.value;setText(next);const n=parseMusicTime(next),result=Number.isFinite(n)&&n>=min&&(max===undefined||n<=max)?n:NaN;
  emitted.current=result;onChange(result);
 }} onBlur={()=>{if(valid)setText(formatMusicTime(parsed));else input.current?.reportValidity();}}/>;
}
