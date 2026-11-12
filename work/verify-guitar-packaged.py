from pathlib import Path
import sys,os,json,hashlib
root=Path.cwd();pack=root/'src-tauri/target/debug/scripts'
os.environ['NUMBA_CACHE_DIR']=str(root/'data/music-cache/numba');os.environ['TEMP']=os.environ['TMP']=str(root/'work')
for name in ['guitar_arrangement.py','guitar_transcription.py','arrangement_replacement.py','arrangement_job.py','cover_genre.py','singing_job.py']:
 assert hashlib.sha256((root/'scripts'/name).read_bytes()).digest()==hashlib.sha256((pack/name).read_bytes()).digest(),name
sys.path.insert(0,str(pack))
import soundfile as sf,numpy as np
from arrangement_job import run
out=root/'exports/singing/guitar-packaged-verification-20261108';out.mkdir(exist_ok=True)
source=root/'exports/singing/1794090410615'
p=dict(style='rock',start=18,seconds=10,vocal=str(source/'vc_mana-trained-v1.wav'),instrumental=str(source/'backing-extracted.wav'),data_root=str(root),output=str(out/'edit-tracks'))
result=run(p)
a,sr=sf.read(Path(result['vocal']).with_name('instrumental.wav'),always_2d=True)
assert a.shape==(10*sr,2) and np.isfinite(a).all() and abs(a).max()<=1
# Actual Cover Builder request with explicit note edits: no retranscription.
notes=[[.1,.5,60,.6],[.7,1.2,64,.8]]
builder=run(dict(style='replace-guitar-electric-guitar',source_name='guitar',bank='separate',start=0,seconds=2,
 vocal=str(source/'vc_mana-trained-v1.wav'),instrumental=str(source/'backing-extracted.wav'),
 guitar=str(root/'exports/singing/tsumugi-country-dynamics-20261108/Original guitar.wav'),data_root=str(root),output=str(out/'builder-notes'),notes=notes))
performed=json.loads((out/'builder-notes/notes.json').read_text(encoding='utf-8'))
assert [n[:3] for n in performed]==[n[:3] for n in notes]
report={'packaged_helper_hashes_match':True,'edit_tracks':result,'instrumental_channels':a.shape[1],
 'explicit_builder_notes_preserved':True,'builder':builder,'production_voice_regenerated':False}
(out/'checks.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
