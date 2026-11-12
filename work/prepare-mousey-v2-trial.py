"""Decode separate working copies; reserve disjoint endings and all singing for evaluation."""
from pathlib import Path
import json,hashlib
import soundfile as sf
import numpy as np
root=Path(__file__).resolve().parents[1]
folder=root/'assets/voice/training-mousey-v2'
out=root/'data/custom-voice/mousey-v2-rvc-trial-v1'
assert not (out/'manifest.json').exists(), 'Dataset already prepared; reuse its manifest.'
rows=[]
for source in sorted(folder.glob('*.mp3')):
    samples,sr=sf.read(source,always_2d=True,dtype='float32')
    assert samples.shape[1]==1 and np.isfinite(samples).all()
    audio=samples[:,0]
    original_hash=hashlib.sha256(source.read_bytes()).hexdigest()
    name=source.stem.replace('mana-mouseyv2-training-','')
    if name.startswith('sing-'):
        ranges=[('holdout',0,len(audio))]
        style='singing'
    else:
        main=name in ['01','02','03']
        style='neutral' if main else name.rsplit('-',1)[0]
        desired=len(audio)/sr-(20 if main else 12)
        # Pick a quiet 50ms window near the desired split, then leave a guard gap.
        window=round(sr*.05)
        starts=range(max(0,round((desired-2)*sr)),min(len(audio)-window,round((desired+2)*sr)),window)
        boundary=min(starts,key=lambda start:float(np.mean(audio[start:start+window]**2)))+window//2
        train_end=max(1,boundary-round(sr*.5))
        ranges=[('train',0,train_end),('holdout',boundary,len(audio))]
    for split,start,end in ranges:
        target=out/split/(name+'.wav')
        target.parent.mkdir(parents=True,exist_ok=True)
        sf.write(target,audio[start:end],sr,subtype='PCM_16')
        rows.append(dict(source=str(source),sourceSha256=original_hash,workingCopy=str(target),
                         sha256=hashlib.sha256(target.read_bytes()).hexdigest(),split=split,style=style,
                         startFrame=start,endFrame=end,sampleRate=sr,seconds=(end-start)/sr))
for source in {row['source'] for row in rows}:
    ranges=sorted((r['startFrame'],r['endFrame']) for r in rows if r['source']==source)
    assert all(a[1]<=b[0] for a,b in zip(ranges,ranges[1:])), 'Source-frame leakage'
manifest=dict(profile='mousey-v2-rvc-trial-v1',sources=rows,trainingStarted=False,
              status='prepared',userListeningApproved=True,originalsModified=False,activeVoiceChanged=False,
              splitMethod='Disjoint source-frame ranges at quiet boundaries; >=0.5s guard; entire singing clip excluded from training and index.',
              trainSeconds=round(sum(r['seconds'] for r in rows if r['split']=='train'),3),
              holdoutSeconds=round(sum(r['seconds'] for r in rows if r['split']=='holdout'),3))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k!='sources'},indent=2))
