"""Preserve and inspect user-provided legacy Mana samples locally."""
from pathlib import Path
import os, json, shutil, hashlib
import numpy as np
import soundfile as sf

root=Path(__file__).resolve().parents[1]
out=root/'exports/legacy-voice-review';out.mkdir(parents=True,exist_ok=True)
os.environ['HF_HOME']=str(root/'data/music-cache/huggingface')
import torch, librosa
from transformers import WhisperProcessor, WhisperForConditionalGeneration
torch.set_num_threads(6)
cache=str(root/'data/seed-vc/checkpoints/hf_cache')
processor=WhisperProcessor.from_pretrained('openai/whisper-small',cache_dir=cache,local_files_only=True)
model=WhisperForConditionalGeneration.from_pretrained('openai/whisper-small',cache_dir=cache,local_files_only=True).eval()
model.generation_config.forced_decoder_ids=None
rows=[]
for name in ['tmpnlovkt7n.wav','tmpat5tll18.wav','tmp7_rgm8qd.wav']:
    source=Path('C:/Users/Admin/AppData/Local/Temp')/name
    target=out/name;shutil.copyfile(source,target)
    audio,sr=sf.read(target,always_2d=True)
    mono=audio.mean(axis=1)
    windows=np.array([np.sqrt(np.mean(mono[i:i+int(sr*.05)]**2)) for i in range(0,len(mono),int(sr*.05))])
    y=librosa.resample(mono,orig_sr=sr,target_sr=16000)
    features=processor(y,sampling_rate=16000,return_tensors='pt',return_attention_mask=True)
    with torch.inference_mode():ids=model.generate(features.input_features,attention_mask=features.attention_mask,language='en',task='transcribe',max_new_tokens=160)
    transcript=processor.batch_decode(ids,skip_special_tokens=True)[0].strip()
    row=dict(file=str(target),source=str(source),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),seconds=round(len(audio)/sr,3),sampleRate=sr,channels=audio.shape[1],peak=float(np.max(np.abs(audio))),rms=float(np.sqrt(np.mean(audio**2))),clippedFraction=float(np.mean(np.abs(audio)>=.999)),quietestWindowRms=float(windows.min()),quietWindowFraction=float(np.mean(windows<.01)),draftEnglish=transcript,transcriptVerified=False)
    rows.append(row)
    print(name+': '+transcript,flush=True)
(out/'report.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
