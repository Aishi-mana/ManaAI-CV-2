import { useMemo,useState } from "react";
import { battleData,startBattle,battleTurn,numericEffect } from "../core/battle";
import type { Battle } from "../core/battle";
import { makePlaytest } from "../core/playtests";
import type { Playtest } from "../core/playtests";
import type { WorkArtifact } from "../core/work";
export default function BattlePreview({content,artifact,onSave}:{content:string;artifact:WorkArtifact;onSave:(report:Playtest)=>void}) {
  const data=useMemo(()=>battleData(content),[content]);
  const [player,setPlayer]=useState(0);const [enemy,setEnemy]=useState(1);const [battle,setBattle]=useState<Battle|null>(null);
  const [notes,setNotes]=useState("");const [saved,setSaved]=useState(false);
  if(!data||data.characters.length<2)return <p className="hint-soft">Battle preview needs JSON passing game-data checks with at least two characters.</p>;
  const finished=!!battle&&(battle.player.health<=0||battle.enemy.health<=0);
  return <section><p className="hint-soft">Built-in preview rules: attack adds the first defined weapon carried in inventory; the enemy counters using its attack after each surviving turn. Healing consumes one item, capped at initial health. Numeric skills can be reused; no mana system. Descriptive effect text is ignored. No generated code is executed or progression awarded. Finished battles can be saved as playtest reports.</p>
    <p className="hint-soft">For a skill, use a numeric damage field or an effect such as {JSON.stringify({type:"damage",amount:30})}. Request an artifact revision to convert descriptive effects.</p>
    <label className="field"><span>Player</span><select value={player} onChange={(e)=>{setPlayer(Number(e.target.value));setBattle(null);}}>{data.characters.map((c,i)=><option key={c.name} value={i}>{c.name}</option>)}</select></label>
    <label className="field"><span>Opponent</span><select value={enemy} onChange={(e)=>{setEnemy(Number(e.target.value));setBattle(null);}}>{data.characters.map((c,i)=><option key={c.name} value={i}>{c.name}</option>)}</select></label>
    <button className="btn" disabled={player===enemy||data.characters[player].health<=0||data.characters[enemy].health<=0} onClick={()=>{setBattle(startBattle(data.characters[player],data.characters[enemy]));setSaved(false);setNotes("");}}>{battle?"Restart battle":"Start battle"}</button>
    {battle&&<><p><strong>{battle.player.name}: {battle.player.health} health · {battle.enemy.name}: {battle.enemy.health} health</strong></p>
      <button className="btn" disabled={finished} onClick={()=>setBattle(battleTurn(battle,data.items))}>Attack</button>
      <div className="chips">{battle.player.inventory.map((name,slot)=>{const item=data.items.find((i)=>i.name===name);const usable=!!item&&!!numericEffect(item);return <button className="btn" key={slot} disabled={finished||!usable} onClick={()=>setBattle(battleTurn(battle,data.items,slot))}>{name}{!usable?" (passive or unsupported effect)":""}</button>;})}</div>
      <details open><summary>Battle log · turn {battle.turn}</summary>{battle.log.map((line,i)=><p key={i}>{line}</p>)}</details>
      {finished&&<><label className="field"><span>Playtest notes / desired balance</span><textarea rows={3} value={notes} maxLength={1000} disabled={saved} onChange={(e)=>setNotes(e.target.value)} placeholder="For example: Hero should win with 10–30 health remaining using one potion." /></label><button className="btn" disabled={saved} onClick={()=>{onSave(makePlaytest(artifact,battle,data,notes));setSaved(true);}}>{saved?"Playtest report saved":"Save playtest report"}</button><p className="hint-soft">Records this finished battle against artifact v{artifact.version??1}. Restart to record another run. No points or goal completion are granted.</p></>}
    </>}
  </section>;
}
