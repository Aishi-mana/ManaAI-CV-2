import {invoke} from '@tauri-apps/api/core';
import type {Memory} from './character';

type Embed=(texts:string[])=>Promise<number[][]>;
const unit=(vector:number[]):number[]=>{
 const length=Math.sqrt(vector.reduce((sum,value)=>sum+value*value,0));
 if(!length||!Number.isFinite(length))throw Error('Invalid local embedding.');
 return vector.map(value=>value/length);
};
const bounded=(text:string)=>text.slice(0,500);
const lookup:Embed=texts=>invoke('memory_embeddings',{texts});
const abortIfNeeded=(signal?:AbortSignal)=>{if(signal?.aborted)throw new Error('Memory search cancelled.');};

export class SemanticMemorySearch{
 private readonly cache=new Map<string,{content:string;vector:number[]}>();
 constructor(private readonly embed:Embed=lookup){}
 async search(memories:Memory[],query:string,signal?:AbortSignal):Promise<Memory[]>{
  if(!memories.length||!query.trim())return [];
  abortIfNeeded(signal);
  const [question]=await this.embed(['Instruct: Retrieve saved personal facts and experiences that answer the question.\nQuery: '+bounded(query.trim())]);
  const queryVector=unit(question);
  const matches:{memory:Memory;score:number}[]=[];
  for(let from=0;from<memories.length;from+=8){
   abortIfNeeded(signal);
   const batch=memories.slice(from,from+8);
   const missing=batch.filter(note=>this.cache.get(note.id)?.content!==bounded(note.content));
   if(missing.length){
    const rows=await this.embed(missing.map(note=>bounded(note.content)));
    if(rows.length!==missing.length)throw Error('Incomplete local embeddings.');
    for(let i=0;i<missing.length;i++){
     const note=missing[i];
     if(this.cache.size>=1024&&!this.cache.has(note.id)){
      const oldest=this.cache.keys().next().value;
      if(oldest!==undefined)this.cache.delete(oldest);
     }
     this.cache.set(note.id,{content:bounded(note.content),vector:unit(rows[i])});
    }
   }
   for(const memory of batch){
    const vector=this.cache.get(memory.id)?.vector;
    if(!vector||vector.length!==queryVector.length)continue;
    const score=vector.reduce((sum,value,i)=>sum+value*queryVector[i],0);
    if(score>=.48)matches.push({memory,score});
   }
  }
  abortIfNeeded(signal);
  return matches.sort((a,b)=>b.score-a.score||Number(b.memory.pinned)-Number(a.memory.pinned)||b.memory.importance-a.memory.importance).map(({memory})=>memory);
 }
}

const search=new SemanticMemorySearch();
export const searchMemoriesByMeaning=(memories:Memory[],query:string,signal?:AbortSignal)=>search.search(memories,query,signal);

export function requestsMemoryRecall(text:string):boolean{
 return /\b(?:remember|recall|remind me|what did i tell you)\b/i.test(text)
  || /^\s*(?:what|which|when|where|who)\b[^?.!]{0,100}\b(?:my|your|our|did (?:i|we|you))\b/i.test(text);
}

export async function semanticReplyMemories(memories:Memory[],lexical:Memory[],query:string,signal:AbortSignal):Promise<Memory[]>{
 if(signal.aborted||!requestsMemoryRecall(query)||!memories.length)return lexical;
 const work=new AbortController();
 let timer:ReturnType<typeof setTimeout>|undefined;
 const cancel=()=>work.abort();
 signal.addEventListener('abort',cancel,{once:true});
 const candidates=[...memories].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,48);
 try{
  const stopped=new Promise<Memory[]>(resolve=>{work.signal.addEventListener('abort',()=>resolve([]),{once:true});timer=setTimeout(cancel,6500);});
  const semantic=await Promise.race([searchMemoriesByMeaning(candidates,query,work.signal).catch(()=>[]),stopped]);
  const selected:Memory[]=[];
  let budget=6000;
  for(const memory of [...lexical,...semantic.slice(0,3)]){
   if(selected.some(note=>note.id===memory.id))continue;
   const size=JSON.stringify(memory.content).length+150;
   if(size>budget)continue;
   selected.push(memory);budget-=size;
   if(selected.length>=8)break;
  }
  return selected;
 }finally{
  clearTimeout(timer);
  signal.removeEventListener('abort',cancel);
 }
}
