export interface GameAsset{name:string;data:string}
export interface GameProject{assets?:GameAsset[];entry:string;files:{path:string;content:string}[]}
const prefix='/* Mana project v1 */\nconst __manaFiles=';
export function validateGameProject(value:unknown):GameProject{
 const p=value as GameProject;
 if(!p||!Array.isArray(p.files)||!p.files.length||p.files.length>12||p.entry!=='main.js')throw Error('Projects need main.js and 1–12 files.');
 const names=new Set<string>();let size=0;
 const files=p.files.map(f=>{if(!f||typeof f.path!=='string'||!/^[-a-zA-Z0-9_]+\.(js|json)$/.test(f.path)||names.has(f.path.toLowerCase())||typeof f.content!=='string')throw Error('Use unique file names ending in .js or .json, without folders.');names.add(f.path.toLowerCase());size+=f.content.length;return {path:f.path,content:f.content};});
 if(!files.some(f=>f.path==='main.js')||size>12000)throw Error('Keep main.js and at most 12,000 characters across files.');
 const assets=validateGameAssets(p.assets);
 return {...(assets.length?{assets}:{}),entry:'main.js',files:files.sort((a,b)=>a.path.localeCompare(b.path))};
}
export function bundleGameProject(value:unknown):string{
 const p=validateGameProject(value);
 const result=prefix+JSON.stringify(p)+';\n'+String.raw`(()=>{
 const cache=Object.create(null),files=__manaFiles.files;
 function load(name){
  const f=files.find(f=>f.path===name);if(!f)throw Error('Missing project file: '+name);
  if(cache[name])return cache[name].exports;
  const module={exports:{}};cache[name]=module;
  if(name.endsWith('.json'))module.exports=JSON.parse(f.content);
  else new Function('api','require','module','exports','"use strict";\n'+f.content)(api,request=>{
   if(typeof request!=='string'||!/^\.\/[-a-zA-Z0-9_]+(?:\.(?:js|json))?$/.test(request))throw Error('Require only local project files.');
   let target=request.slice(2);if(!/\.(js|json)$/.test(target))target+='.js';return load(target);
  },module,module.exports);
  return module.exports;
 }
 load(__manaFiles.entry);
})();`;
 if(result.length>180000)throw Error('Project is too large to run. Shorten its files.');return result;
}
export function readGameProject(source:string):GameProject|undefined{
 if(!source.startsWith(prefix))return;
 if(source.length>180000)return;
 try{const end=source.indexOf(';\n',prefix.length);const p=validateGameProject(JSON.parse(source.slice(prefix.length,end)));if(bundleGameProject(p)===source)return p;}catch{/* Ordinary source remains editable. */}
}
export const PROJECT_DRAFT_INSTRUCTIONS='Return only a JSON object {"entry":"main.js","files":[{"path":"main.js","content":"JavaScript source"}]}. Use 1–12 flat .js/.json files, at most 12000 total content characters. main.js is the entry. Use require("./player") and module.exports for local modules; JSON files can be required. No imports, packages, folders or external resources. Assets already imported are preserved by Mana; never return base64. Use api.image(name,x,y,width,height) and api.sound(name,volume) with existing asset names only. Sprite sheets use api.sprite(name,sx,sy,frameWidth,frameHeight,x,y,width,height) and api.animationFrame(elapsedSeconds,fps,frameCount,loop=true). For levels, api.tileMap(rows,size,ox,oy) provides draw(color) and move(box,dx,dy) returning a new box with hitX/hitY. # cells and map edges are solid; api.overlaps(a,b) checks box overlap. Keep maps <=256 cells and starting boxes outside walls. Return all complete files, no markdown. Keep the project small enough to finish the response.';

export function validateGameAssets(value:unknown):GameAsset[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>8)throw Error('Use up to 8 image or sound assets.');
 const seen=new Set<string>();let size=0;
 return value.map(a=>{
  if(!a||typeof a.name!=='string'||!/^[-a-zA-Z0-9_]+\.(png|jpg|jpeg|wav|mp3)$/i.test(a.name)||seen.has(a.name.toLowerCase())||typeof a.data!=='string'||!/^data:(image\/(png|jpeg)|audio\/(wav|mpeg));base64,[A-Za-z0-9+/]+={0,2}$/.test(a.data))throw Error('Use unique PNG, JPEG, WAV or MP3 assets.');
  const mime=a.data.slice(5,a.data.indexOf(';')),ext=a.name.split('.').pop().toLowerCase();
  if(!({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',wav:'audio/wav',mp3:'audio/mpeg'} as Record<string,string>)[ext]||({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',wav:'audio/wav',mp3:'audio/mpeg'} as Record<string,string>)[ext]!==mime)throw Error('Asset type does not match its name.');
  size+=a.data.length;if(size>80000)throw Error('Keep all assets under 60 KB combined (80,000 encoded characters).');seen.add(a.name.toLowerCase());return {name:a.name,data:a.data};
 });
}
