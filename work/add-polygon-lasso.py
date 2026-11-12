from pathlib import Path
p=Path('src/core/outfitPrototype.ts');s=p.read_text(encoding='utf-8-sig');s+='''
export function polygonLassoClosed(points:Point[]):boolean{return points.length>=4&&points[0].x===points[points.length-1].x&&points[0].y===points[points.length-1].y;}
export function closePolygonLasso(points:Point[]):Point[]{return points.length<3||polygonLassoClosed(points)?points:[...points,{...points[0]}];}
export function appendPolygonLasso(points:Point[],point:Point,tolerance:number):Point[]{if(polygonLassoClosed(points))return points;if(points.length>=3&&Math.hypot(point.x-points[0].x,point.y-points[0].y)<=tolerance)return closePolygonLasso(points);if(points.length&&Math.hypot(point.x-points[points.length-1].x,point.y-points[points.length-1].y)<.01)return points;return points.length<199?[...points,point]:points;}
''';p.write_text(s,encoding='utf-8')
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8-sig').replace('import {extendAtelierHistory,','import {appendPolygonLasso,closePolygonLasso,polygonLassoClosed,extendAtelierHistory,');s=s.replace("type Tool='zoom'", "type Tool='polygon'|'zoom'")
s=s.replace("if(tool==='outline'||tool==='hole'){", "if(tool==='polygon'){const rect=e.currentTarget.getBoundingClientRect(),onBody=e.currentTarget===preview.current,fit=onBody?fitOutfit(source!.naturalWidth,source!.naturalHeight,body!.naturalWidth,body!.naturalHeight,transform):null,scale=onBody?fit!.width/source!.naturalWidth*rect.width/body!.naturalWidth:rect.width/source!.naturalWidth;setPoints(old=>appendPolygonLasso(old,p,10/Math.max(.001,scale)));setCursor(null);return;}if(tool==='outline'||tool==='hole'){")
s=s.replace("const p=sourcePoint(e);if(selectionDrag.current", "const p=sourcePoint(e);if(tool==='polygon')setCursor(p);if(selectionDrag.current")
s=s.replace("['outline','Outline clothing'", "['polygon','Polygonal Lasso','M4 4h5M4 4v5M4 4l15 4-3 12-12-5zM16 20h4v-4'],\n ['outline','Outline clothing'")
# Source path live segment
s=s.replace("ctx.stroke();for(const p of points)", "if(tool==='polygon'&&cursor&&!polygonLassoClosed(points))ctx.lineTo(cursor.x,cursor.y);ctx.stroke();for(const p of points)",1)
# Body selection live preview and handles at screen-constant size
s=s.replace("p.lineTo(map(points[0]).x,map(points[0]).y);p.stroke();}", "p.lineTo(map(points[0]).x,map(points[0]).y);if(tool==='polygon'&&cursor&&!polygonLassoClosed(points))p.lineTo(map(cursor).x,map(cursor).y);p.stroke();if(tool==='polygon'){const k=out.width/(target.getBoundingClientRect().width||360);points.forEach((q,i)=>{const v=map(q),r=(i===0?5:3)*k;p.fillStyle=i===0?'#008b78':'white';p.fillRect(v.x-r,v.y-r,r*2,r*2);p.strokeRect(v.x-r,v.y-r,r*2,r*2);});}}",1)
needle="  if(!(e.ctrlKey||e.metaKey)||e.altKey||!['z','y'].includes(e.key.toLowerCase()))return;"
replacement="""  if(tool==='polygon'&&points.length&&!(e.target as HTMLElement).closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')){if(['Escape','Backspace','Enter'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='Escape'){setPoints([]);setCursor(null);}else if(e.key==='Backspace')setPoints(p=>p.slice(0,-1));else setPoints(closePolygonLasso(points));return;}}
"""+needle
assert needle in s;s=s.replace(needle,replacement)
s=s.replace('<div className="outfit-selection-actions"><p>', '''<div className="outfit-selection-actions">{tool==='polygon'&&<><p>Click points around the part. Click the first point or press Enter to close. Backspace removes the last point; Escape cancels.</p><button className="btn" disabled={points.length<3||polygonLassoClosed(points)} onClick={()=>{setPoints(closePolygonLasso(points));setCursor(null);}}>Close selection</button><button className="btn" disabled={!points.length} onClick={()=>{setPoints([]);setCursor(null);}}>Cancel selection</button></>}<p>''')
p.write_text(s,encoding='utf-8')
