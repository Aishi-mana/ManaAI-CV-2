from pathlib import Path
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');a=s.index("test('resize pointer-up records a filled outfit");b=s.index("\n});",a)+4;block=s[a:b];block=block.replace("test('resize pointer-up records a filled outfit before cleanup undo can remove it'", "test('locked layer ignores canvas arrow nudges and brush edits until unlocked'")
block=block.replace("18:{x:0,y:0,scale:1,frame:1}","9:[{id:'piece-1',name:'Locked dress',locked:true,regions:[{points:[{x:0,y:0},{x:843,y:0},{x:843,y:1264}],erase:false}],transform:{x:0,y:0,scale:1,frame:1}}],18:{x:0,y:0,scale:1,frame:1}")
a2=block.index('let tree=render();effects[4]();');block=block[:a2]+'''let tree=render();const picture=()=>nodes(tree).find(n=>n.props?.className==='checkerboard outfit-drag-preview');const event={key:'ArrowRight',shiftKey:false,preventDefault(){}};picture().props.onKeyDown(event);assert.equal(slots[18].x,0);const unlock=nodes(tree).find(n=>n.props?.children==='Unlock selected layer');assert.ok(unlock);unlock.props.onClick();tree=render();picture().props.onKeyDown(event);assert.equal(slots[18].x,1);nodes(tree).find(n=>n.props?.children==='Lock selected layer').props.onClick();tree=render();nodes(tree).find(n=>n.props?.['aria-label']==='Eraser').props?.onClick?.();slots[19]=true;slots[5]='eraser';tree=render();const before=JSON.stringify(slots[3]);picture().props.onPointerDown({button:0,pointerId:1,currentTarget:preview,clientX:300,clientY:500});assert.equal(JSON.stringify(slots[3]),before);assert.equal(slots[15],null);
});
'''
# tool lookup use actual toolbar label before accessing absent node
block=block.replace("nodes(tree).find(n=>n.props?.['aria-label']==='Eraser').props?.onClick?.();",'')
s+='\n'+block;p.write_text(s,encoding='utf-8')
