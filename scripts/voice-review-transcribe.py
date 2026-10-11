from pathlib import Path
import os,json,sys
os.environ['CUDA_VISIBLE_DEVICES']='';os.environ['HF_HOME']=str(Path('data/music-cache/huggingface').resolve());cache=str(Path('data/seed-vc/checkpoints/hf_cache').resolve())
import numpy as np,torch,librosa,soundfile as sf
from transformers import WhisperProcessor,WhisperForConditionalGeneration
torch.set_num_threads(6)
root=Path(r'C:\Users\Admin\Downloads\Yuuki Voice');out=Path('exports/voice-review');out.mkdir(parents=True,exist_ok=True)
processor=WhisperProcessor.from_pretrained('openai/whisper-small',cache_dir=cache);model=WhisperForConditionalGeneration.from_pretrained('openai/whisper-small',cache_dir=cache).cpu().eval()
inputs=[('current-reference',Path('C:/AI/GPT-SoVITS/main_reference.wav'),0,10)]
for p in root.glob('*.mp3'):
 if 'Fractured' in p.name:inputs.extend([('trailer-start',p,0,30),('trailer-end',p,30,9)])
 elif p.name.startswith('Fight!'):inputs.append(('fight',p,0,16))
 elif 'Fatal Bullet_ Yuuki Voice' in p.name:inputs.append(('voice-compilation-start',p,0,30))
 elif 'AudioTrimmer' in p.name:inputs.extend([('bike-trim-start',p,0,30),('bike-trim-middle',p,150,30),('bike-trim-later',p,300,30)])
rows=[]
for name,path,start,seconds in inputs:
 y,sr=librosa.load(path,sr=16000,mono=True,offset=start,duration=seconds)
 features=processor(y,sampling_rate=16000,return_tensors='pt').input_features
 with torch.inference_mode():ids=model.generate(features,language='ja',task='transcribe',return_timestamps=True,max_new_tokens=256)
 text=processor.batch_decode(ids,skip_special_tokens=False)[0];rows.append({'id':name,'source':str(path),'start':start,'seconds':len(y)/sr,'automaticTranscriptWithTimestamps':text,'verified':False});(out/'source-transcripts.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');sf.write(out/f'{name}-review.wav',y,16000,subtype='PCM_16');print(name,'done',flush=True)
print('Saved',len(rows),'Japanese draft transcription excerpts.',flush=True)
