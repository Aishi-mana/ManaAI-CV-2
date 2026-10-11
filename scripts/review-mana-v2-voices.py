"""Inspect supplied Mana v2 WAVs without modifying them; transcripts remain drafts."""
from pathlib import Path
import argparse, os, json, hashlib
import numpy as np
import soundfile as sf

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--file',type=Path)
parser.add_argument('--out',type=Path)
args=parser.parse_args()
out=args.out or root/'exports/mana-v2-voice-review';out.mkdir(parents=True,exist_ok=True)
os.environ['HF_HUB_OFFLINE']='1'
import torch, librosa
from transformers import WhisperProcessor, WhisperForConditionalGeneration
torch.set_num_threads(6)
cache=str(root/'data/seed-vc/checkpoints/hf_cache')
processor=WhisperProcessor.from_pretrained('openai/whisper-small',cache_dir=cache,local_files_only=True)
model=WhisperForConditionalGeneration.from_pretrained('openai/whisper-small',cache_dir=cache,local_files_only=True).eval()
model.generation_config.forced_decoder_ids=None
rows=[]
for path in ([args.file.resolve()] if args.file else sorted((root/'assets/voice').glob('*.wav'))):
    audio,sr=sf.read(path,always_2d=True)
    mono=audio.mean(axis=1)
    windows=np.array([np.sqrt(np.mean(mono[i:i+int(sr*.05)]**2)) for i in range(0,len(mono),int(sr*.05))])
    y=librosa.resample(mono,orig_sr=sr,target_sr=16000)
    features=processor(y,sampling_rate=16000,return_tensors='pt',return_attention_mask=True)
    with torch.inference_mode():ids=model.generate(features.input_features,attention_mask=features.attention_mask,language='en',task='transcribe',return_timestamps=True,max_new_tokens=180)
    transcript=processor.batch_decode(ids,skip_special_tokens=True)[0].strip()
    voiced=windows>.01
    nonquiet=np.flatnonzero(voiced)
    row=dict(file=str(path),filename=path.name,intendedEmotion=path.stem.replace('Mana v2 ','').lower(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),seconds=round(len(audio)/sr,3),sampleRate=sr,channels=audio.shape[1],subtype=sf.info(path).subtype,peak=round(float(np.max(np.abs(audio))),6),rms=round(float(np.sqrt(np.mean(audio**2))),6),clippedFraction=float(np.mean(np.abs(audio)>=.999)),quietWindowFraction=round(float(np.mean(~voiced)),3),leadingQuietSeconds=round(float(nonquiet[0]*.05),2) if len(nonquiet) else None,trailingQuietSeconds=round(max(0,len(audio)/sr-(nonquiet[-1]+1)*.05),2) if len(nonquiet) else None,draftEnglish=transcript,transcriptVerified=False,emotionVerified=False)
    rows.append(row)
    row['timestampDraft']=processor.batch_decode(ids,skip_special_tokens=False)[0]
    (out/'report.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
    print(path.name+': '+transcript,flush=True)
print('All originals unchanged; emotion labels are filename intent, not automated verification.',flush=True)
