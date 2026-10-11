"""Create an offline legacy-voice pilot; never starts training or changes chat settings."""
from pathlib import Path
import os, sys, json, hashlib, time
root=Path(__file__).resolve().parents[1]
out=root/'data/custom-voice/training-pilot'
out.mkdir(parents=True,exist_ok=True)
os.environ['HF_HUB_OFFLINE']='1'
os.environ['CUDA_VISIBLE_DEVICES']=''
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0,'C:/AI/Applio')
import numpy as np
import soundfile as sf
import torch
torch.set_num_threads(6)
from kokoro import KPipeline
from rvc.infer.infer import VoiceConverter

lines=[
 ('train','neutral','Hello, Eye-shee. I am here and ready to talk with you.'),
 ('train','neutral','We can work on one small task before taking a break.'),
 ('train','neutral','The blue notebook is beside the window on the wooden table.'),
 ('train','neutral','Please save our progress before closing the project tonight.'),
 ('train','cheerful','We did it! I am so glad our little experiment worked.'),
 ('train','cheerful','That is wonderful news! I cannot wait to see what happens next.'),
 ('train','cheerful','Come on, Eye-shee! Let us make something fun together today.'),
 ('train','thoughtful','Let me think for a moment. There may be another way to solve this.'),
 ('train','thoughtful','Perhaps we should compare both ideas before choosing our next step.'),
 ('train','thoughtful','I wonder why the first result sounds different from the second one.'),
 ('train','gentle','It is okay to rest. You do not have to finish everything tonight.'),
 ('train','gentle','Take your time, Eye-shee. I am happy you are here with me.'),
 ('train','gentle','We can try again tomorrow, when you feel a little more comfortable.'),
 ('train','neutral','A gentle breeze moved the bright green leaves outside the house.'),
 ('train','neutral','I found three useful examples, but the final choice is yours.'),
 ('train','neutral','Would you like a short explanation, or shall we explore the details?'),
 ('holdout','neutral','Eye-shee, the morning light is shining across the quiet room.'),
 ('holdout','cheerful','What a lovely surprise! Our adventure is just getting started.'),
 ('holdout','thoughtful','If we change the order, would the answer still be the same?'),
 ('holdout','gentle','You have done enough for today. Let us enjoy a peaceful moment.')
]
model=Path('C:/AI/ManaAI/assets/voices/mana/ManaVoicev1.pth')
index=Path('C:/AI/ManaAI/assets/voices/mana/ManaVoicev1.index')
profile=dict(kokoro='af_heart',pitch=9,index_rate=.85,f0_method='fcpe',protect=.33,volume_envelope=1.0,embedder_model='contentvec')
print('Loading legacy Kokoro and RVC models once on CPU.',flush=True)
pipeline=KPipeline(repo_id='hexgrad/Kokoro-82M',lang_code='a',device='cpu')
converter=VoiceConverter()
manifest=[]
for n,(split,intent,text) in enumerate(lines,1):
    folder=out/split;folder.mkdir(exist_ok=True)
    target=folder/f'mana-{n:03}.wav'
    guide=out/f'guide-{n:03}.wav'
    started=time.monotonic()
    chunks=[np.asarray(audio) for _,_,audio in pipeline(text,voice=profile['kokoro'])]
    if not chunks:raise RuntimeError('Kokoro returned no audio')
    sf.write(guide,np.concatenate(chunks),24000)
    converter.convert_audio(audio_input_path=str(guide),audio_output_path=str(target),model_path=str(model),index_path=str(index),**{k:v for k,v in profile.items() if k!='kokoro'})
    audio,sr=sf.read(target,always_2d=True)
    peak=float(np.max(np.abs(audio)))
    if peak<.001:raise RuntimeError(f'Silent conversion: {target}')
    row=dict(id=f'mana-{n:03}',file=str(target),split=split,intendedDelivery=intent,text=text,language='en',speaker='mana',seconds=round(len(audio)/sr,3),sampleRate=sr,channels=audio.shape[1],peak=peak,clippedFraction=float(np.mean(np.abs(audio)>=.999)),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),listeningApproved=False,transcriptVerified=False,generationSeconds=round(time.monotonic()-started,2))
    manifest.append(row)
    (out/'manifest.json').write_text(json.dumps(dict(source='Legacy Kokoro + trained Applio/RVC, offline dataset preparation only',profile=profile,model=str(model),index=str(index),trainingStarted=False,samples=manifest),indent=2),encoding='utf-8')
    print(f'{n}/{len(lines)}: {split} {intent}, {row["seconds"]}s',flush=True)
    guide.unlink()
# Deliberately not named training.list: generated words still need listening verification.
(out/'candidate-annotations.list').write_text('\n'.join(f'{r["file"]}|mana|en|{r["text"]}' for r in manifest if r['split']=='train')+'\n',encoding='utf-8')
(out/'heldout-annotations.list').write_text('\n'.join(f'{r["file"]}|mana|en|{r["text"]}' for r in manifest if r['split']=='holdout')+'\n',encoding='utf-8')
print('Pilot complete. Training has not started.',flush=True)
