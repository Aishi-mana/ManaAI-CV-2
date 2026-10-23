import type {GameProject} from './gameProject';
import {GAME_TILE_EXAMPLE} from './gameTileExample';
import {GAME_SPRITE_EXAMPLE} from './gameSpriteExample';
import {GAME_ASSET_EXAMPLE} from './gameAssetExample';
const player=`exports.create=(level,map,clips)=>{
 let box,state='idle',elapsed=0,moving=false;
 function reset(){box={x:level.offsetX+level.spawn.col*level.tileSize+4,y:level.offsetY+level.spawn.row*level.tileSize+4,w:12,h:12};state='idle';elapsed=0;}
 reset();
 return {reset,get box(){return box;},move(dt,keys){let dx=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0),dy=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);if(dx&&dy){dx*=Math.SQRT1_2;dy*=Math.SQRT1_2;}const old=box;box=map.move(box,dx*level.speed*dt,dy*level.speed*dt);moving=old.x!==box.x||old.y!==box.y;},draw(dt,won){const next=won?'react':moving?'walk':'idle';if(next!==state){state=next;elapsed=0;}else elapsed+=dt;const clip=clips[state],frame=api.animationFrame(elapsed,clip.fps,clip.frames,!won);api.sprite('character.png',frame*16,clip.row*16,16,16,box.x-2,box.y-4,16,16);}};
};`;
const main=`const level=require('./level.json'),clips=require('./animation.json');
const map=api.tileMap(level.rows,level.tileSize,level.offsetX,level.offsetY);
const player=require('./player').create(level,map,clips);
const saved=api.loadProgress({best:0,wins:0,unlocked:1,bright:false});
let progress={best:Number.isFinite(saved.best)?Math.max(0,saved.best):0,wins:Number.isFinite(saved.wins)?Math.max(0,saved.wins):0,unlocked:Number.isFinite(saved.unlocked)?Math.max(1,saved.unlocked):1,bright:saved.bright===true};
let scene='menu',score=0,coins=[],won=false,wasSpace=false;
const cell=(col,row)=>({x:level.offsetX+col*level.tileSize,y:level.offsetY+row*level.tileSize,w:level.tileSize,h:level.tileSize});
const goal=cell(level.goal.col,level.goal.row);
function start(){player.reset();score=0;won=false;coins=(level.stars??[]).map(p=>cell(p.col,p.row)).filter(c=>level.rows[(c.y-level.offsetY)/level.tileSize]?.[(c.x-level.offsetX)/level.tileSize]==='.');scene='play';}
function save(){api.saveProgress(progress);}
api.onFrame=(dt,keys)=>{
 api.clear(progress.bright?'#39466b':'#202637');
 if(scene==='menu'){
  api.text('Star maze - complete game check',85,35,'#ffffff');
  api.text('Best: '+progress.best+' | Wins: '+progress.wins+' | Unlocked: '+progress.unlocked,60,75,'#ffffff');
  if(api.button('Play',45,105,110,40))start();
  if(api.button('Theme',180,105,110,40)){progress.bright=!progress.bright;save();}
  if(api.button('Reset saves',315,105,130,40)){progress={best:0,wins:0,unlocked:1,bright:false};save();}
  api.text('Arrows move. Collect stars. Find the green goal.',30,185,'#ffffff');
  api.text('Edit the maze visually; apply before playing.',40,215,'#cccccc');
  api.text('Save status: '+api.progressStatus,40,250,'#cccccc');
  wasSpace=!!keys.Space;return;
 }
 if(keys.Space&&!wasSpace)start();wasSpace=!!keys.Space;
 if(api.button('Menu',370,6,100,32)){scene='menu';return;}
 let changed=false;
 if(!won){
  player.move(dt,keys);
  coins=coins.filter(c=>{if(api.overlaps(player.box,c)){score+=10;api.sound('chime.wav',0.35);return false;}return true;});
  if(api.overlaps(player.box,goal)){won=true;score+=20;progress.wins++;progress.unlocked=Math.max(progress.unlocked,2);api.sound('chime.wav',0.5);changed=true;}
  if(score>progress.best){progress.best=score;changed=true;}if(changed)save();
 }
 api.text(won?'Goal! Space: replay':'Score: '+score+' | Best: '+progress.best,10,24,'#ffffff');
 api.text('Arrows: move | Space: restart | Save: '+api.progressStatus,10,46,'#cccccc');
 map.draw('#546080');api.rect(goal.x,goal.y,goal.w,goal.h,'#50cc99');
 for(const c of coins)api.circle(c.x+c.w/2,c.y+c.h/2,4,'#ffc636');
 player.draw(dt,won);
};`;
export const GAME_INTEGRATION_EXAMPLE:GameProject={entry:'main.js',files:[{path:'main.js',content:main},{path:'player.js',content:player},...GAME_TILE_EXAMPLE.files.filter(f=>f.path==='level.json').map(f=>({...f,content:JSON.stringify({...JSON.parse(f.content),stars:[{col:4,row:1},{col:6,row:6},{col:15,row:1}]},null,2)})),...GAME_SPRITE_EXAMPLE.files.filter(f=>f.path==='animation.json')],assets:[...GAME_SPRITE_EXAMPLE.assets!,...GAME_ASSET_EXAMPLE.assets!.filter(a=>a.name==='chime.wav')]};
