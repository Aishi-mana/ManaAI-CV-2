from pathlib import Path
import sys,json
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
from arrangement_job import run
p=root/'exports/singing/original-direction-preview-2026-10-18/issue-27s-stems/source-24-30s.wav';out=root/'work/note-editor-smoke';out.mkdir(exist_ok=True)
request=dict(data_root=str(root),vocal=str(p),instrumental=str(p),guitar=str(p),style='replace-guitar-piano',source_name='piano',start=0,seconds=1,previewOnly=True,bank='livehq',stems=[],custom={'pitch':0,'extension':0},notes=[[0,.25,60,.4],[.35,.8,64,.8]],output=str(out))
result=run(request)
import soundfile as sf,numpy as np
path=next(s['path'] for s in result['stems'] if s['name']=='replacement-piano');x,sr=sf.read(path)
assert len(x)==sr and np.isfinite(x).all() and np.max(np.abs(x))>0
assert json.loads((out/'notes.json').read_text())==request['notes']
print(json.dumps({'seconds':len(x)/sr,'sampleRate':sr,'notesPreserved':True,'nonSilent':True,'transcriptionUsed':False}))
