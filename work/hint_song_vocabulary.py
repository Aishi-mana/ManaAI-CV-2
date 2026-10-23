from pathlib import Path
p=Path('src/core/whisper.ts');s=p.read_text(encoding='utf-8');s+='''
/** Whisper's context vocabulary is a hint, never a transcript replacement. Native limit is 500 UTF-8 bytes. */
export function recognitionPrompt(names:string[],songs:string[]=[]):string{
 const clean=(text:string)=>text.replace(/[\\r\\n\\t\\x00-\\x1f]/g,' ').replace(/\\s+/g,' ').trim();
 let prompt='Conversation';
 for(const name of names.slice(0,2)){const text=clean(name).slice(0,60);if(text&&new TextEncoder().encode(prompt+', '+text).length<=180)prompt+=', '+text;}
 prompt+='. Sing, hum. Song names:';
 const seen=new Set<string>();
 for(const raw of songs){const text=clean(raw);if(!text||text.length>100||seen.has(text.toLowerCase()))continue;seen.add(text.toLowerCase());const next=prompt+' '+text+';';if(new TextEncoder().encode(next).length<=440)prompt=next;}
 return prompt;
}
''';p.write_text(s,encoding='utf-8')
p=Path('src/core/useWhisper.ts');s=p.read_text(encoding='utf-8').replace('encodeWave,microphoneLevel','encodeWave,microphoneLevel,recognitionPrompt').replace('names:string[]){','names:string[],songNames:string[]=[]){');s=s.replace(' const nativePending=useRef(false);',' const vocabulary=useRef({names,songNames});vocabulary.current={names,songNames};\n const nativePending=useRef(false);');s=s.replace("prompt:names.map(n=>n.slice(0,60)).join(', ')", 'prompt:recognitionPrompt(vocabulary.current.names,vocabulary.current.songNames)');p.write_text(s,encoding='utf-8')
p=Path('src/components/ChatPanel.tsx');s=p.read_text(encoding='utf-8');old='else dictation.setReview(review);},[charName,userName]);';new='else dictation.setReview(review);},[charName,userName],validateMusicalState(initiative.music).songs.filter(s=>s.enabled).flatMap(s=>[...s.aliases,s.title]));';assert old in s;s=s.replace(old,new);p.write_text(s,encoding='utf-8')
