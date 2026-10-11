from pathlib import Path
import os,json,sys
sys.stdout.reconfigure(encoding='utf-8');sys.stderr.reconfigure(encoding='utf-8');cache=str(Path('data/seed-vc/checkpoints/hf_cache').resolve());os.environ['HF_HOME']=str(Path('data/music-cache/huggingface').resolve())
import torch,librosa
from transformers import WhisperProcessor,WhisperForConditionalGeneration
torch.set_num_threads(6);device='cuda' if torch.cuda.is_available() and torch.cuda.mem_get_info()[0]>2500000000 else 'cpu';p=WhisperProcessor.from_pretrained('openai/whisper-small',cache_dir=cache);m=WhisperForConditionalGeneration.from_pretrained('openai/whisper-small',cache_dir=cache,torch_dtype=torch.float16 if device=='cuda' else torch.float32).to(device).eval();m.generation_config.forced_decoder_ids=None
out=Path('exports/voice-review/longer');rows=json.loads((out/'candidates.json').read_text(encoding='utf-8'))
for start in range(0,len(rows),2):
 batch=rows[start:start+2];audio=[librosa.load(r['file'],sr=16000,mono=True)[0] for r in batch];features=p(audio,sampling_rate=16000,return_tensors='pt',return_attention_mask=True)
 with torch.inference_mode():ids=m.generate(features.input_features.to(device=device,dtype=m.dtype),attention_mask=features.attention_mask.to(device),language='ja',task='transcribe',return_timestamps=False,max_new_tokens=128)
 texts=p.batch_decode(ids,skip_special_tokens=True)
 for row,text in zip(batch,texts):row['draftJapanese']=text.strip();row['transcriptVerified']=False
 (out/'candidate-transcripts.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print(start+len(batch),'/',len(rows),flush=True)
