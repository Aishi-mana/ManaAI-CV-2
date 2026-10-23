from pathlib import Path
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8')
line='<button className="btn" disabled={busy||reflecting} onClick={()=>{setChatPicture(undefined);setShowImageGeneration(true);}}>Create picture</button>'
assert line in s;s=s.replace(line,line+'\n          <button className="btn" disabled={busy||reflecting||!avatar.assets||showImageGeneration} onClick={()=>{setPrototypePicture(undefined);setShowOutfitPrototype(true);}}>Atelier</button>',1)
s=s.replace('if (showImageGeneration || showSinging || showSavedImages || showVision || busy', 'if (showOutfitPrototype || showImageGeneration || showSinging || showSavedImages || showVision || busy',1)
s=s.replace('storage.error,showVision,showSavedImages,showSinging,showImageGeneration]);','storage.error,showVision,showSavedImages,showSinging,showImageGeneration,showOutfitPrototype]);',1)
s=s.replace('!showImageGeneration && !showSavedImages}', '!showImageGeneration && !showOutfitPrototype && !showSavedImages}',1)
p.write_text(s,encoding='utf-8')
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8').replace('{(error||prepared.error)&&<p',"{embedded&&stage==='save'&&points.length>0&&<p role=\"status\">Return to Make and finish or undo the open outline before saving.</p>}{(error||prepared.error)&&<p",1);p.write_text(s,encoding='utf-8')
