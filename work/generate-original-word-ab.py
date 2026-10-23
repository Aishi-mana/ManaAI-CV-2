from pathlib import Path
import json,sys,subprocess,shutil
import soundfile as sf
import numpy as np
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
from original_song_job import run
out=root/'exports/singing/original-word-clarity-ab-2026-10-18';out.mkdir(exist_ok=True)
a=out/'A-current';b=out/'B-stronger-lyrics';a.mkdir(exist_ok=True);b.mkdir(exist_ok=True)
p=dict(kind='original',title='Quiet evening · word clarity comparison',prompt='A cozy, hopeful song about spending a quiet evening together.\nMood: Warm and hopeful.\nFeatured instruments: warm piano, fingerpicked guitar, soft strings.\nTempo: 92 BPM.\nSong structure: one short verse.',lyrics='[Verse]\nStay beside me in the light\nQuiet hearts will sing tonight\nLet the evening softly glow\nHere with you, I am home',style='gentle-piano',instrumental=False,duration=15,seed=42,previewOnly=True,output=str(a),result=str(a/'result.json'))
if not (a/'result.json').exists():
 (a/'request.json').write_text(json.dumps(p,indent=2),encoding='utf-8')
 print('A: current production settings',flush=True)
 result=run(p);(a/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
if not (b/'result.json').exists():
 plan=json.loads((a/'ace-request0.json').read_text(encoding='utf-8'));before=plan['guidance_scale'];plan['guidance_scale']=3.0
 (b/'comparison-request.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
 print('B: same codes and lyrics; synth guidance 1.0 -> 3.0',flush=True)
 subprocess.run(['C:/AI/acestep.cpp/build/Release/ace-synth.exe','--models','C:/AI/Manaverse-BGM-Generator/models','--request',str(b/'comparison-request.json'),'--vae-chunk','256'],cwd=b,check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 raw=b/'comparison-request0.wav';x,sr=sf.read(raw,always_2d=True)
 if len(x)>15*sr:
  x=x[:15*sr].copy();fade=int(.02*sr);x[-fade:]*=np.linspace(1,0,fade)[:,None];sf.write(b/'original-song.wav',x,sr,subtype='PCM_16')
 else:shutil.copyfile(raw,b/'original-song.wav')
 (b/'result.json').write_text(json.dumps(dict(mix=str(b/'original-song.wav'),seconds=sf.info(b/'original-song.wav').duration,guidance_scale=3.0),indent=2))
ra=json.loads((a/'ace-request0.json').read_text());rb=json.loads((b/'comparison-request.json').read_text());diff={key:[ra.get(key),rb.get(key)] for key in set(ra)|set(rb) if ra.get(key)!=rb.get(key)}
assert diff=={'guidance_scale':[1.0,3.0]},diff
report=dict(changed=diff,sharedSeed=42,sharedBpm=92,lyrics=p['lyrics'],sameAudioCodes=True,listeningApproved=False,productionChanged=False)
for name,folder in [('A',a),('B',b)]:
 x,sr=sf.read(folder/'original-song.wav',always_2d=True);assert np.isfinite(x).all() and np.max(np.abs(x))>0 and len(x)/sr<=15
 report[name]=dict(path=str(folder/'original-song.wav'),seconds=len(x)/sr,sampleRate=sr,channels=x.shape[1])
(out/'comparison.json').write_text(json.dumps(report,indent=2));print(json.dumps(report),flush=True)
