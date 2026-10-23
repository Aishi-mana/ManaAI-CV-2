import type {GameProject} from './gameProject';
export interface MazeLevel{rows:string[];tileSize:number;offsetX:number;offsetY:number;speed:number;spawn:{col:number;row:number};goal:{col:number;row:number};stars?:{col:number;row:number}[];[key:string]:unknown}
export type LevelBrush='wall'|'floor'|'spawn'|'goal'|'star';
export function parseMazeLevel(content:string):MazeLevel{
 const p=JSON.parse(content) as MazeLevel;
 if(!p||!Array.isArray(p.rows)||!p.rows.length||p.rows.length>32||typeof p.rows[0]!=='string'||!p.rows[0].length||p.rows[0].length>32||p.rows.length*p.rows[0].length>256||p.rows.some(r=>typeof r!=='string'||r.length!==p.rows[0].length||!/^[#.]+$/.test(r)))throw Error('Visual editing needs rectangular rows using # and ., up to 256 cells.');
 if(!Number.isInteger(p.tileSize)||p.tileSize<16||p.tileSize>64||![p.offsetX,p.offsetY].every(n=>Number.isInteger(n)&&n>=0)||p.offsetX+p.rows[0].length*p.tileSize>480||p.offsetY+p.rows.length*p.tileSize>280||!Number.isFinite(p.speed)||p.speed<1||p.speed>1000)throw Error('Use tiles 16–64px, a map inside 480×280, and speed 1–1000.');
 for(const point of [p.spawn,p.goal])if(!point||!Number.isInteger(point.col)||!Number.isInteger(point.row)||point.row<0||point.row>=p.rows.length||point.col<0||point.col>=p.rows[0].length||p.rows[point.row][point.col]==='#')throw Error('Spawn and goal must occupy open map cells.');
 if(p.spawn.row===p.goal.row&&p.spawn.col===p.goal.col)throw Error('Spawn and goal need different cells.');
 if(p.stars!==undefined){if(!Array.isArray(p.stars)||p.stars.length>32)throw Error('Use up to 32 stars.');const seen=new Set<string>();for(const point of p.stars){if(!point||!Number.isInteger(point.col)||!Number.isInteger(point.row)||point.row<0||point.row>=p.rows.length||point.col<0||point.col>=p.rows[0].length||p.rows[point.row][point.col]==='#'||point.col===p.spawn.col&&point.row===p.spawn.row||point.col===p.goal.col&&point.row===p.goal.row||seen.has(point.row+','+point.col))throw Error('Stars need unique open cells, separate from spawn and goal.');seen.add(point.row+','+point.col);}}return p;
}
export function paintMazeLevel(level:MazeLevel,col:number,row:number,brush:LevelBrush):MazeLevel{
 if(!Number.isInteger(col)||!Number.isInteger(row)||row<0||row>=level.rows.length||col<0||col>=level.rows[0].length)throw Error('Choose a cell inside the level.');
 const spawn=level.spawn.col===col&&level.spawn.row===row,goal=level.goal.col===col&&level.goal.row===row;
 if(brush==='wall'&&(spawn||goal))throw Error('Move the spawn or goal before painting a wall here.');
 if(brush==='spawn'&&goal||brush==='goal'&&spawn)throw Error('Spawn and goal need different cells.');
 if(brush==='star'&&(spawn||goal))throw Error('Place stars away from spawn and goal.');
 let stars=level.stars?.filter(p=>p.col!==col||p.row!==row);if(brush==='star'){if((stars?.length??0)>=32)throw Error('Use up to 32 stars.');(stars??=[]).push({col,row});}
 const rows=level.rows.map((line,y)=>y===row?line.slice(0,col)+(brush==='wall'?'#':'.')+line.slice(col+1):line);
 return {...level,rows,...(stars?{stars}:{}),...(brush==='spawn'?{spawn:{...level.spawn,col,row}}:{}),...(brush==='goal'?{goal:{...level.goal,col,row}}:{})};
}
export function mazeHasRoute(level:MazeLevel){
 const queue=[level.spawn],seen=new Set([level.spawn.row+','+level.spawn.col]);
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const col=p.col+dx,row=p.row+dy,key=row+','+col;if(row>=0&&row<level.rows.length&&col>=0&&col<level.rows[0].length&&level.rows[row][col]!== '#'&&!seen.has(key)){seen.add(key);queue.push({col,row});}}}return seen.has(level.goal.row+','+level.goal.col)&&(level.stars??[]).every(p=>seen.has(p.row+','+p.col));
}

export const LEGACY_STAR_POSITIONS='[cell(4,1),cell(6,6),cell(15,1)]';
export function enableStarPlacement(project:GameProject):GameProject{
 const main=project.files.find(f=>f.path==='main.js'),file=project.files.find(f=>f.path==='level.json');
 if(!main?.content.includes('coins='+LEGACY_STAR_POSITIONS)||!file)throw Error('This project does not use the supported legacy star code.');
 const level=parseMazeLevel(file.content);if(level.stars===undefined)level.stars=[{col:4,row:1},{col:6,row:6},{col:15,row:1}].filter(p=>level.rows[p.row]?.[p.col]==='.'&&!(p.col===level.spawn.col&&p.row===level.spawn.row)&&!(p.col===level.goal.col&&p.row===level.goal.row));
 return {...project,files:project.files.map(f=>f.path==='main.js'?{...f,content:f.content.replace('coins='+LEGACY_STAR_POSITIONS,'coins=(level.stars??[]).map(p=>cell(p.col,p.row))')}:f.path==='level.json'?{...f,content:JSON.stringify(level,null,2)}:f)};
}
