import { validateWorkJson } from "./workValidation";
import { isRecord } from "./validation";
export interface Fighter {name:string;health:number;attack:number;inventory:string[]}
export interface BattleItem {name:string;type:string;damage?:number;heal?:number;effect?:unknown}
export interface GameData {characters:Fighter[];items:BattleItem[]}
export interface Battle {player:Fighter;enemy:Fighter;maxHealth:number;log:string[];turn:number}
export function battleData(text:string):GameData|null {
  const validation=validateWorkJson(text);
  if(!validation.gameData||validation.errors.length)return null;
  let value=JSON.parse(text.trim().replace(/^```json\s*\n([\s\S]*?)\n```$/i,"$1"));
  for(let i=0;i<4;i++) {if(!isRecord(value)||"characters" in value||"items" in value||!isRecord(value.content))break;value=value.content;}
  return value as GameData;
}
export function startBattle(player:Fighter,enemy:Fighter):Battle {
  return {player:{...player,inventory:[...player.inventory]},enemy:{...enemy,inventory:[...enemy.inventory]},maxHealth:player.health,log:[`${player.name} faces ${enemy.name}.`],turn:0};
}
export function numericEffect(item:BattleItem):{type:"damage"|"heal";amount:number}|null {
  if(item.type==="consumable"&&typeof item.heal==="number"&&Number.isFinite(item.heal)&&item.heal>0)return {type:"heal",amount:item.heal};
  if(item.type!=="skill")return null;
  if(typeof item.damage==="number"&&Number.isFinite(item.damage)&&item.damage>0)return {type:"damage",amount:item.damage};
  if(isRecord(item.effect)&&(item.effect.type==="damage"||item.effect.type==="heal")&&typeof item.effect.amount==="number"&&Number.isFinite(item.effect.amount)&&item.effect.amount>0)return {type:item.effect.type,amount:item.effect.amount};
  return null;
}
export function battleTurn(state:Battle,items:BattleItem[],slot:number|null=null):Battle {
  if(state.player.health<=0||state.enemy.health<=0)return state;
  const next:Battle={...state,player:{...state.player,inventory:[...state.player.inventory]},enemy:{...state.enemy,inventory:[...state.enemy.inventory]},log:[...state.log],turn:state.turn+1};
  if(slot===null){
    const weapon=items.find((item)=>item.type==="weapon"&&next.player.inventory.includes(item.name));
    const damage=Math.min(Number.MAX_VALUE,next.player.attack+(weapon?.damage??0));
    next.enemy.health=Math.max(0,next.enemy.health-damage);next.log.push(`${next.player.name} attacks for ${damage} damage.`);
  }else{
    const item=items.find((item)=>item.name===next.player.inventory[slot]);
    const effect=item?numericEffect(item):null;
    if(!item||!effect)return state;
    if(effect.type==="damage"){next.enemy.health=Math.max(0,next.enemy.health-effect.amount);next.log.push(`${next.player.name} uses ${item.name}: ${effect.amount} damage.`);}
    else {const before=next.player.health;next.player.health=Math.min(next.maxHealth,next.player.health+effect.amount);next.log.push(`${item.name} heals ${next.player.health-before} health.`);}
    if(item.type==="consumable")next.player.inventory.splice(slot,1);
  }
  if(next.enemy.health>0){next.player.health=Math.max(0,next.player.health-next.enemy.attack);next.log.push(`${next.enemy.name} counters for ${next.enemy.attack} damage.`);}
  if(next.enemy.health===0)next.log.push(`${next.enemy.name} is defeated.`);
  if(next.player.health===0)next.log.push(`${next.player.name} is defeated.`);
  next.log=next.log.slice(-40);
  return next;
}
