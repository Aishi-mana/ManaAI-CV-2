"""Owned AudioSep strings/winds estimates; preserves the source through a residual.
Text-only CLAP inference matches the official Roberta pooler/projection/normalization.
AudioSep and bundled CLAP code: data/AudioSep/LICENSE and upstream source.
"""
from pathlib import Path
import os,sys,gc,json
import numpy as np
import librosa
import soundfile as sf
SR=24000
QUERIES={'strings-estimate':'String instruments, violin and cello playing music.',
         'winds-estimate':'Wind instruments, flute, clarinet and saxophone playing music.'}

def load_models(root,offline=True):
 import torch
 repo=root/'data/AudioSep';packages=root/'data/audiosep-packages'
 sys.path.insert(0,str(packages));sys.path.insert(0,str(repo))
 from models.resunet import ResUNet30
 from transformers import RobertaConfig,RobertaModel,RobertaTokenizer
 cache=root/'data/audiosep-model-cache'
 config=RobertaConfig.from_pretrained('roberta-base',cache_dir=str(cache),local_files_only=offline)
 tokenizer=RobertaTokenizer.from_pretrained('roberta-base',cache_dir=str(cache),local_files_only=offline)
 branch=RobertaModel(config).eval()
 projection=torch.nn.Sequential(torch.nn.Linear(768,512),torch.nn.ReLU(),torch.nn.Linear(512,512)).eval()
 ckpt=repo/'checkpoint/music_speech_audioset_epoch_15_esc_89.98.pt'
 weights=torch.load(ckpt,map_location='cpu',weights_only=False)
 weights=weights.get('state_dict',weights);weights={k.removeprefix('module.'):v for k,v in weights.items()}
 branch.load_state_dict({k.removeprefix('text_branch.'):v for k,v in weights.items() if k.startswith('text_branch.') and k!='text_branch.embeddings.position_ids'},strict=True)
 projection.load_state_dict({k.removeprefix('text_projection.'):v for k,v in weights.items() if k.startswith('text_projection.')},strict=True)
 del weights;gc.collect()
 device=torch.device('cuda' if torch.cuda.is_available() else 'cpu')
 branch.to(device);projection.to(device)
 model=ResUNet30(input_channels=1,output_channels=1,condition_size=512)
 weights=torch.load(repo/'checkpoint/audiosep_base_4M_steps.ckpt',map_location='cpu',weights_only=False)['state_dict']
 model.load_state_dict({k.removeprefix('ss_model.'):v for k,v in weights.items() if k.startswith('ss_model.')},strict=True)
 del weights;gc.collect();model.eval().to(device)
 print('AudioSep text-only inference ready on '+str(device),flush=True)
 return model,branch,projection,tokenizer,device

def extract(source,query,models):
 import torch
 model,branch,projection,tokenizer,device=models
 tokens=tokenizer([query],padding='max_length',truncation=True,max_length=512,return_tensors='pt')
 with torch.inference_mode():
  condition=torch.nn.functional.normalize(projection(branch(input_ids=tokens['input_ids'].to(device),attention_mask=tokens['attention_mask'].to(device)).pooler_output),dim=-1)
  audio=librosa.resample(source,orig_sr=SR,target_sr=32000)
  # 5s windows with 2s overlap, including short inputs and trailing audio.
  window=160000;stride=96000;output=np.zeros(len(audio));total=np.zeros(len(audio))
  for start in range(0,len(audio),stride):
   count=min(window,len(audio)-start);chunk=np.pad(audio[start:start+count],(0,window-count))
   result=model({'mixture':torch.tensor(chunk,dtype=torch.float32,device=device)[None,None,:],'condition':condition})['waveform'].squeeze().cpu().numpy()[:count]
   ramp=np.ones(count);overlap=min(32000,count//2)
   if start>0:ramp[:overlap]=np.linspace(.001,1,overlap)
   if start+window<len(audio):ramp[-overlap:]=np.linspace(1,.001,overlap)
   output[start:start+count]+=result*ramp;total[start:start+count]+=ramp
  output/=np.maximum(total,1e-6)
  output=librosa.resample(output,orig_sr=32000,target_sr=SR)
  output=np.pad(output,(0,max(0,len(source)-len(output))))[:len(source)]
  if not np.isfinite(output).all():raise ValueError('Separator produced invalid samples.')
  return output

def separate_parts(source,root,out,offline=True):
 models=load_models(root,offline);remaining=source.copy();parts=[]
 for name,query in QUERIES.items():
  print('Extracting '+name+' from remaining mixed audio…',flush=True)
  estimate=extract(remaining,query,models)
  # Preserve exact alignment and the untouched source sum. FLOAT avoids residual clipping.
  remaining-=estimate;path=out/(name+'.wav');sf.write(path,estimate,SR,subtype='FLOAT')
  parts.append(dict(name=name,path=str(path),gain=1,muted=False))
 sf.write(out/'other.wav',remaining,SR,subtype='FLOAT')
 parts.append(dict(name='other',path=str(out/'other.wav'),gain=1,muted=False))
 (out/'extraction.json').write_text(json.dumps({'model':'AudioSep','queries':QUERIES,'sequential':True,'estimated':True,'source_rms':float(np.sqrt(np.mean(source**2)))}),encoding='utf-8')
 return parts
