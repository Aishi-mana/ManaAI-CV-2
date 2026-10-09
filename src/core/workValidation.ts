import { isRecord } from "./validation";
export interface WorkValidation { syntaxValid:boolean; gameData:boolean; errors:string[]; warnings:string[] }
export function validateWorkJson(content:string):WorkValidation {
  const result:WorkValidation={syntaxValid:false,gameData:false,errors:[],warnings:[]};
  let value:unknown;
  try{value=JSON.parse(content.trim().replace(/^```json\s*\n([\s\S]*?)\n```$/i,"$1"));}
  catch(e){result.errors.push(`JSON syntax: ${e instanceof Error?e.message:String(e)}`);return result;}
  result.syntaxValid=true;
  // Follow common design wrappers, without changing the saved artifact.
  let data=value;
  for(let i=0;i<4;i++) {
    if(!isRecord(data)||"characters" in data||"items" in data||!isRecord(data.content))break;
    data=data.content;
  }
  if(!isRecord(data)||!("characters" in data||"items" in data)) {
    result.warnings.push("Valid JSON. No recognizable characters/items game structure; game-data checks were not applied.");return result;
  }
  result.gameData=true;
  const characters=Array.isArray(data.characters)?data.characters:[];
  const items=Array.isArray(data.items)?data.items:[];
  if(!Array.isArray(data.characters))result.errors.push("characters must be an array.");
  if(!Array.isArray(data.items))result.errors.push("items must be an array.");
  const itemNames=new Set<string>();
  const characterNames=new Set<string>();
  const name=(entry:Record<string,unknown>,path:string,set:Set<string>)=>{
    if(typeof entry.name!=="string"||!entry.name.trim()){result.errors.push(`${path}.name must be a nonempty string.`);return;}
    if(set.has(entry.name))result.errors.push(`${path}.name duplicates ${JSON.stringify(entry.name)}.`);
    set.add(entry.name);
  };
  const number=(entry:Record<string,unknown>,key:string,path:string,required=false)=>{
    if(!required&&entry[key]===undefined)return;
    if(typeof entry[key]!=="number"||!Number.isFinite(entry[key])||entry[key]<0)result.errors.push(`${path}.${key} must be a finite nonnegative number.`);
  };
  items.forEach((item,index)=>{
    const path=`items[${index}]`;
    if(!isRecord(item)){result.errors.push(`${path} must be an object.`);return;}
    name(item,path,itemNames);
    if(typeof item.type!=="string"||!item.type.trim())result.errors.push(`${path}.type must be a nonempty string.`);
    for(const key of ["damage","heal","health","attack"])number(item,key,path);
    if(item.type==="weapon")number(item,"damage",path,true);
    if(item.type==="consumable"&&item.heal===undefined)result.warnings.push(`${path} is consumable but has no heal field; it may use a different effect.`);
    if(item.type==="skill"&&typeof item.effect==="string")result.warnings.push(`${path}.effect is descriptive text; behavior cannot be tested without an engine.`);
    if(item.type==="skill"&&isRecord(item.effect)){
      if(item.effect.type!=="damage"&&item.effect.type!=="heal")result.errors.push(`${path}.effect.type must be damage or heal for the preview.`);
      if(typeof item.effect.amount!=="number"||!Number.isFinite(item.effect.amount)||item.effect.amount<=0)result.errors.push(`${path}.effect.amount must be a finite positive number.`);
    }
  });
  characters.forEach((character,index)=>{
    const path=`characters[${index}]`;
    if(!isRecord(character)){result.errors.push(`${path} must be an object.`);return;}
    name(character,path,characterNames);
    number(character,"health",path,true);number(character,"attack",path,true);
    if(!Array.isArray(character.inventory)){result.errors.push(`${path}.inventory must be an array.`);return;}
    character.inventory.forEach((item,slot)=>{
      if(typeof item!=="string"||!item.trim())result.errors.push(`${path}.inventory[${slot}] must be a nonempty item name.`);
      else if(!itemNames.has(item))result.errors.push(`${path}.inventory[${slot}] references undefined item ${JSON.stringify(item)}.`);
    });
  });
  if(!characters.length)result.warnings.push("No characters defined.");
  if(!items.length)result.warnings.push("No items defined.");
  return result;
}
