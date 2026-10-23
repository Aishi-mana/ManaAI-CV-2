import runpy,sys,types,tempfile,base64,io,json,time
from pathlib import Path
from PIL import Image
import torch
job=runpy.run_path('scripts/image_job.py',run_name='reference_test');checks=[];events=[]
job['generate'].__globals__['status']=lambda directory,**fields:events.append(fields)
clip=types.SimpleNamespace(tokenize=lambda s:s,encode_from_tokens_scheduled=lambda t:[[t,{}]])
class VAE:
 def encode(self,pixels):
  checks.append(('encode',tuple(pixels.shape)));return torch.full((1,16,16,16),0.25)
 def decode(self,latent):return torch.zeros((1,128,128,3))
comfy=types.ModuleType('comfy');comfy.__path__=[]
comfy.options=types.ModuleType('comfy.options');comfy.options.enable_args_parsing=lambda:None
comfy.sd=types.ModuleType('comfy.sd');comfy.sd.load_checkpoint_guess_config=lambda *a,**k:(object(),clip,VAE())
comfy.sample=types.ModuleType('comfy.sample');comfy.sample.prepare_noise=lambda latent,seed:torch.zeros_like(latent)
def sample(model,noise,steps,cfg,sampler,scheduler,positive,negative,latent,**kwargs):
 assert kwargs['denoise']==0.75 and kwargs['noise_mask'] is not None and latent.mean()==0.25
 checks.append(('sample',kwargs['denoise']));kwargs['callback'](0);return latent
comfy.sample.sample=sample
for name,module in [('comfy',comfy),('comfy.options',comfy.options),('comfy.sd',comfy.sd),('comfy.sample',comfy.sample)]:sys.modules[name]=module
folder=Path('work')/('reference-mock-'+str(time.time_ns()));folder.mkdir(exist_ok=True)
data=io.BytesIO();Image.new('RGB',(64,96),'white').save(data,format='JPEG')
request=dict(backend='neta',checkpoint='mock-no-model',comfy=str(folder),prompt='outfit',negative='',width=128,height=128,steps=1,cfg=4,seed=42,cpu=True,referenceStrength=.75,reference='data:image/jpeg;base64,'+base64.b64encode(data.getvalue()).decode())
mask=Image.new('L',(64,96),0);mask.paste(255,(0,48,64,96));buffer=io.BytesIO();mask.save(buffer,format='JPEG');request['referenceMask']='data:image/jpeg;base64,'+base64.b64encode(buffer.getvalue()).decode()
job['generate'](request,folder);assert (folder/'reference.jpg').is_file();assert json.loads((folder/'generation.json').read_text())['reference_used'] is True
assert checks==[('encode',(1,128,128,3)),('sample',0.75)]
assert events[-1]['stage']=='ready'
assert json.loads((folder/'generation.json').read_text())['clothing_mask_used'] is True
with Image.open(folder/'image.jpg') as result:
 assert min(result.getpixel((64,20)))>240 and max(result.getpixel((64,105)))<15
print('PASS: reference decode, pad, VAE encode and image-to-image route. Mock models only; no weights loaded.')
