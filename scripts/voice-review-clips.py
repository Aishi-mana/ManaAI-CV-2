from pathlib import Path
import os,json,time,sys
sys.stdout.reconfigure(encoding='utf-8');sys.stderr.reconfigure(encoding='utf-8')
os.environ['HF_HOME']=str(Path('data/music-cache/huggingface').resolve());cache=str(Path('data/seed-vc/checkpoints/hf_cache').resolve())
import torch,librosa
from transformers import WhisperProcessor,WhisperForConditionalGeneration
torch.set_num_threads(6);device='cpu'
if torch.cuda.is_available() and torch.cuda.mem_get_info()[0]>2500000000:device='cuda'
print('Transcription device:',device,flush=True)
processor=WhisperProcessor.from_pretrained('openai/whisper-small',cache_dir=cache);model=WhisperForConditionalGeneration.from_pretrained('openai/whisper-small',cache_dir=cache,torch_dtype=torch.float16 if device=='cuda' else torch.float32).to(device).eval();model.generation_config.forced_decoder_ids=None
out=Path('exports/voice-review');rows=json.loads((out/'inventory.json').read_text(encoding='utf-8'));done={}
if (out/'clip-transcripts.json').exists():done={r['filename']:r for r in json.loads((out/'clip-transcripts.json').read_text(encoding='utf-8'))}
remaining=[r for r in rows if r['filename'] not in done]
for start in range(0,len(remaining),2):
 batch=remaining[start:start+2];audio=[librosa.load(r['file'],sr=16000,mono=True)[0] for r in batch];features=processor(audio,sampling_rate=16000,return_tensors='pt',return_attention_mask=True);x=features.input_features.to(device=device,dtype=model.dtype)
 with torch.inference_mode():ids=model.generate(x,attention_mask=features.attention_mask.to(device),language='ja',task='transcribe',return_timestamps=False,max_new_tokens=64)
 text=processor.batch_decode(ids,skip_special_tokens=True)
 for row,transcript in zip(batch,text):done[row['filename']]={'filename':row['filename'],'draftJapanese':transcript.strip(),'verified':False}
 (out/'clip-transcripts.json').write_text(json.dumps(list(done.values()),ensure_ascii=False,indent=2),encoding='utf-8')
 if start%20==0:print(len(done),'/',len(rows),'done',flush=True)
print('All clip drafts saved; short-clip hallucinations require review.',flush=True)
