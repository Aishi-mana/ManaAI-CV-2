/** Pure bounded helpers, serialized into the isolated game worker. */
export function createTileTools(rect:(x:number,y:number,w:number,h:number,color:string)=>void){
 type Box={x:number;y:number;w:number;h:number};
 const valid=(b:Box)=>b&&[b.x,b.y,b.w,b.h].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=10000)&&b.w>0&&b.h>0;
 const overlaps=(a:Box,b:Box)=>{if(!valid(a)||!valid(b))throw Error('Use finite boxes {x,y,w,h} with positive sizes.');return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;};
 function tileMap(rows:string[],size:number,ox=0,oy=0){
  if(!Array.isArray(rows)||!rows.length||rows.length>32||typeof rows[0]!=='string'||!rows[0].length||rows[0].length>32||rows.length*rows[0].length>256||rows.some(r=>typeof r!=='string'||r.length!==rows[0].length||!/^[\x20-\x7e]+$/.test(r))||!Number.isFinite(size)||size<1||size>64||![ox,oy].every(n=>Number.isFinite(n)&&Math.abs(n)<=10000))throw Error('Use a rectangular ASCII tile map, at most 256 cells, 32 per side, tile size 1–64.');
  const grid=[...rows],width=grid[0].length*size,height=grid.length*size,walls:Box[]=[];
  grid.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(row[x]==='#')walls.push({x:ox+x*size,y:oy+y*size,w:size,h:size});});
  const fits=(b:Box)=>b.x>=ox&&b.y>=oy&&b.x+b.w<=ox+width&&b.y+b.h<=oy+height&&!walls.some(w=>overlaps(b,w));
  return {width,height,
   draw(color='#46536e'){if(!/^#[0-9a-f]{3,8}$/i.test(color))throw Error('Use a hex wall color.');grid.forEach((row,y)=>{let start=-1;for(let x=0;x<=row.length;x++){if(row[x]==='#'){if(start<0)start=x;}else if(start>=0){rect(ox+start*size,oy+y*size,(x-start)*size,size,color);start=-1;}}});},
   move(box:Box,dx:number,dy:number){
    if(!valid(box)||![dx,dy].every(n=>Number.isFinite(n)&&Math.abs(n)<=10000)||!fits(box))throw Error('Start the box inside the map, clear of walls, with finite movement.');
    let x=Math.max(ox,Math.min(ox+width-box.w,box.x+dx)),y=box.y;
    for(const wall of walls){if(box.y>=wall.y+wall.h||box.y+box.h<=wall.y)continue;if(dx>0&&box.x+box.w<=wall.x&&x+box.w>wall.x)x=wall.x-box.w;else if(dx<0&&box.x>=wall.x+wall.w&&x<wall.x+wall.w)x=wall.x+wall.w;}
    y=Math.max(oy,Math.min(oy+height-box.h,box.y+dy));
    for(const wall of walls){if(x>=wall.x+wall.w||x+box.w<=wall.x)continue;if(dy>0&&box.y+box.h<=wall.y&&y+box.h>wall.y)y=wall.y-box.h;else if(dy<0&&box.y>=wall.y+wall.h&&y<wall.y+wall.h)y=wall.y+wall.h;}
    return {x,y,w:box.w,h:box.h,hitX:Math.abs(x-box.x-dx)>1e-8,hitY:Math.abs(y-box.y-dy)>1e-8};
   }
  };
 }
 return {overlaps,tileMap};
}
