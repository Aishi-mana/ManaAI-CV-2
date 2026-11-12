"""Read-only source audit. No training, conversion, or active profile changes."""
from pathlib import Path
import json,hashlib,re
import soundfile as sf
import numpy as np
root=Path(__file__).resolve().parents[1]
folder=root/'assets/voice/training-mousey-v2'
out=root/'exports/voice-review/mousey-v2-readiness'
out.mkdir(parents=True,exist_ok=True)
rows=[]
seen={}
for path in sorted(folder.glob('*.mp3')):
    audio,sr=sf.read(path,always_2d=True,dtype='float32')
    info=sf.info(path)
    mono=audio.mean(axis=1)
    window=max(1,round(sr*.05))
    levels=np.array([float(np.sqrt(np.mean(mono[i:i+window]**2))) for i in range(0,len(mono),window)])
    active=np.flatnonzero(levels>.01)
    longest=current=0
    for quiet in levels<=.01:
        current=current+1 if quiet else 0
        longest=max(longest,current)
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    row=dict(file=str(path),name=path.name,mainRecording=bool(re.search(r'training-0[123]\.mp3$',path.name)),
        seconds=round(len(audio)/sr,3),sampleRate=sr,channels=audio.shape[1],format=info.format,subtype=info.subtype,
        finite=bool(np.isfinite(audio).all()),peak=round(float(np.max(np.abs(audio))),6),
        rms=round(float(np.sqrt(np.mean(audio**2))),6),
        fullScaleSamplePercent=round(float(np.mean(np.abs(audio)>=.999))*100,5),
        quietPercent=round(float(np.mean(levels<=.01))*100,2),longestQuietSeconds=round(longest*.05,2),
        leadingQuietSeconds=round(float(active[0])*.05,2) if len(active) else None,
        trailingQuietSeconds=round(max(0,len(audio)/sr-(active[-1]+1)*.05),2) if len(active) else None,
        duplicateOf=seen.get(digest),sha256=digest,
        blockRms=[dict(start=i,seconds=min(10,len(mono)/sr-i),rms=round(float(np.sqrt(np.mean(mono[int(i*sr):int((i+10)*sr)]**2))),5))
                  for i in range(0,int(np.ceil(len(mono)/sr)),10)])
    if audio.shape[1]==2:
        row['stereoCorrelation']=float(np.corrcoef(audio.T)[0,1])
    seen[digest]=path.name
    rows.append(row)
report=dict(files=rows,totalSeconds=round(sum(r['seconds'] for r in rows),3),
            mainSeconds=round(sum(r['seconds'] for r in rows if r['mainRecording']),3),
            expressionSeconds=round(sum(r['seconds'] for r in rows if not r['mainRecording']),3),
            originalsModified=False,trainingStarted=False,identityListeningVerified=False,
            note='MP3 full-scale values can reflect encoding overshoot; measurements do not prove audible clipping, absence of music, or identity consistency.')
(out/'audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2))
for row in rows:
    print(json.dumps({k:row[k] for k in ['name','seconds','sampleRate','channels','peak','rms','quietPercent','longestQuietSeconds','duplicateOf','finite']}))
