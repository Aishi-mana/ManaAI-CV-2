from pathlib import Path
import sys,json,time,shutil,importlib.util
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
old=root/'exports/singing/1792874633232'
out=root/'exports/singing/country-roads-chat-reference-20261026';out.mkdir(parents=True,exist_ok=True)
request=json.loads((old/'request.json').read_text());request.update(reference=str(root/'data/custom-voice/references/mana-v2/default-r2.wav'),output=str(out),result=str(out/'result.json'),reuseSeparatedFrom=str(old))
(out/'request.json').write_text(json.dumps(request,indent=2),encoding='utf-8')
spec=importlib.util.spec_from_file_location('singing_job',root/'scripts/singing_job.py');job=importlib.util.module_from_spec(spec);spec.loader.exec_module(job)
result=job.run(dict(data_root=str(root),repo=str(root/'data/seed-vc'),source=str(old/'guide-vocals.wav'),reference=request['reference'],start=0,seconds=1,whole_song=True,separate=False,output=str(out),diffusion_steps=50,guidance=.7,seed=42,pitch_smoothing=True))
vocal,rate=sf.read(result['vocal'],always_2d=True);guide,gs=sf.read(old/'guide-vocals.wav',always_2d=True);backing,bs=sf.read(old/'instrumental.wav',always_2d=True)
assert rate==gs==bs and abs(len(vocal)-len(guide))<=rate and np.isfinite(vocal).all()
if vocal.shape[1]==1:vocal=np.repeat(vocal,2,axis=1)
length=min(len(vocal),len(backing),len(guide));vr=float(np.sqrt(np.mean(vocal[:length]**2)));gr=float(np.sqrt(np.mean(guide[:length]**2)))
mixed=vocal[:length]*gr/max(vr,1e-8)+backing[:length]*request['backing_gain'];peak=float(np.max(np.abs(mixed)))
if peak>.98:mixed*=.98/peak
mix=out/'Country Roads - Mana chat reference.wav';sf.write(mix,mixed,rate,subtype='PCM_16');shutil.copy2(old/'instrumental.wav',out/'instrumental.wav')
result.update(done=True,error='',mix=str(mix),extractor='mega-lead',reference=request['reference'],reusedSeparation=str(old),listeningApproved=False)
(out/'result.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result),flush=True)
