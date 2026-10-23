"""One local image job. No UI/server, plugins, downloads, or persistent model process."""
import json, os, sys, subprocess, time, logging, base64, io
from pathlib import Path
sys.dont_write_bytecode=True

def runtime_args(cpu):
    # Normal mode still offloads as needed; lowvram can force Gemma onto CPU.
    return ['--cpu'] if cpu else []

def sd_runtime_args(cpu):
    if cpu:
        return ['--backend', 'cpu', '--offload-to-cpu', '--mmap']
    # Keep text encoding off the GPU and cap managed GPU memory at 3 GiB.
    # An explicit budget enables graph splitting before the full UNet is resident.
    return ['--backend', 'diffusion=cuda0,te=cpu,vae=cuda0',
            '--max-vram', '3', '--batched-cfg', 'off', '--vae-tiling',
            '--offload-to-cpu', '--mmap']

def status(directory, **fields):
    target=directory/'progress.json'; temp=directory/'progress.tmp'
    temp.write_text(json.dumps(fields), encoding='utf-8'); os.replace(temp,target)

def generate(request, directory):
    if request.get('backend')=='qwen':
        from qwen_image import generate_qwen
        return generate_qwen(request,directory,status)
    started=time.monotonic(); timings={}
    def mark(name):
        timings[name]=round(time.monotonic()-started,2)
        print(f'{name}: {timings[name]}s elapsed',flush=True)
    from PIL import Image, ImageOps, ImageFilter
    directory=Path(directory); output=directory/'image.jpg'
    reference=None;mask=None;reference_size=None;layout=None
    strength=.65 if request.get('referenceStrength') is None else float(request['referenceStrength'])
    if not .2<=strength<=.8:raise ValueError('Reference variation must be 0.2–0.8.')
    if request.get('reference'):
        value=request['reference']
        if len(value)>1_000_000 or not value.startswith('data:image/jpeg;base64,'):raise ValueError('Invalid avatar reference.')
        with Image.open(io.BytesIO(base64.b64decode(value.split(',',1)[1],validate=True))) as source:
            if source.format!='JPEG' or source.width>1280 or source.height>1280:raise ValueError('Avatar reference is too large or not JPEG.')
            reference_size=source.size
            if request.get('referenceMask'):
                size=ImageOps.contain(source,(round(request['width']*.92),round(request['height']*.92))).size
                offset=((request['width']-size[0])//2,(request['height']-size[1])//2)
                reference=Image.new('RGB',(request['width'],request['height']),'white');reference.paste(source.convert('RGB').resize(size,Image.Resampling.LANCZOS),offset)
                layout={'source_size':source.size,'size':size,'offset':offset,'frame':.92}
            else:reference=ImageOps.pad(source.convert('RGB'),(request['width'],request['height']),method=Image.Resampling.LANCZOS,color='white')
        reference.save(directory/'reference.jpg',quality=92)
    if request.get('referenceMask'):
        value=request['referenceMask']
        if reference is None or len(value)>1_000_000 or not value.startswith('data:image/jpeg;base64,'):raise ValueError('Invalid clothing edit mask.')
        with Image.open(io.BytesIO(base64.b64decode(value.split(',',1)[1],validate=True))) as source:
            if source.format!='JPEG' or source.size!=reference_size:raise ValueError('Clothing mask must match the avatar reference dimensions.')
            mask=Image.new('L',(request['width'],request['height']),0);mask.paste(source.convert('L').resize(tuple(layout['size']),Image.Resampling.NEAREST),tuple(layout['offset']))
            mask=mask.point(lambda p:255 if p>=128 else 0).filter(ImageFilter.GaussianBlur(1.5))
        mask.save(directory/'clothing-mask.png')
    status(directory,stage='loading',step=0,total=request['steps'])
    if request['backend']=='sd':
        command=[request['engine'],'-m',request['checkpoint'],'-p',request['prompt'],'-n',request['negative'],'-W',str(request['width']),'-H',str(request['height']),'--steps',str(request['steps']),'--cfg-scale',str(request['cfg']),'-s',str(request['seed']),'--sampling-method','euler','-t',str(min(8,os.cpu_count() or 1)),*sd_runtime_args(request['cpu']),'-o',str(directory/'output.png')]
        if reference is not None:command+=['--init-img',str(directory/'reference.jpg'),'--strength',str(strength)]
        if mask is not None:command+=['--mask',str(directory/'clothing-mask.png')]
        subprocess.run(command,check=True)
        with Image.open(directory/'output.png') as image:
            result=image.convert('RGB')
            if mask is not None:result=Image.composite(result,reference,mask)
            result.save(output,quality=92)
    else:
        # The installed Comfy tensor/conditioning library supports this checkpoint's
        # Lumina2 + Gemma all-in-one layout. No nodes, server or custom plugins start.
        logging.basicConfig(level=logging.INFO)
        sys.path.insert(0,request['comfy']);sys.argv=[sys.argv[0],*runtime_args(request['cpu'])]
        import comfy.options
        comfy.options.enable_args_parsing()
        import torch, comfy.sd, comfy.sample
        if request['cpu']:torch.set_num_threads(min(8,os.cpu_count() or 1))
        model,clip,vae,*_=comfy.sd.load_checkpoint_guess_config(request['checkpoint'],output_vae=True,output_clip=True,embedding_directory=[])
        mark('checkpoint_loaded')
        if clip is None or vae is None: raise RuntimeError('The NetaYume checkpoint needs embedded text encoder and VAE.')
        status(directory,stage='encoding',step=0,total=request['steps'])
        with torch.inference_mode():
            positive=clip.encode_from_tokens_scheduled(clip.tokenize(request['prompt']))
            negative=clip.encode_from_tokens_scheduled(clip.tokenize(request['negative']))
        mark('prompts_encoded')
        if reference is not None:
            import numpy as np
            with torch.inference_mode():latent=vae.encode(torch.from_numpy(np.asarray(reference).copy()).float().div(255).unsqueeze(0))
        else:latent=torch.zeros([1,16,request['height']//8,request['width']//8],device='cpu')
        noise_mask=None
        if mask is not None:
            import numpy as np
            noise_mask=torch.from_numpy(np.asarray(mask).copy()).float().div(255).unsqueeze(0)
        noise=comfy.sample.prepare_noise(latent,request['seed'])
        def callback(step,*args): status(directory,stage='sampling',step=step+1,total=request['steps'])
        with torch.inference_mode():
            samples=comfy.sample.sample(model,noise,request['steps'],request['cfg'],'euler','normal',positive,negative,latent,denoise=strength if reference is not None else 1.0,noise_mask=noise_mask,callback=callback,disable_pbar=True,seed=request['seed'])
            mark('sampling_finished')
            status(directory,stage='decoding',step=request['steps'],total=request['steps'])
            pixels=(vae.decode(samples)[0].detach().cpu().clamp(0,1)*255).to(torch.uint8).numpy()
        result=Image.fromarray(pixels)
        if mask is not None:result=Image.composite(result,reference,mask)
        result.save(output,quality=92)
    mark('image_saved')
    metadata={k:request[k] for k in ['backend','checkpoint','prompt','negative','width','height','steps','cfg','seed','cpu']}
    metadata['elapsed_seconds']=timings
    metadata['reference_used']=reference is not None
    metadata['clothing_mask_used']=mask is not None
    metadata['reference_layout']=layout
    metadata['denoise']=strength if reference is not None else 1.0
    (directory/'generation.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    status(directory,stage='ready',step=request['steps'],total=request['steps'])

if __name__=='__main__':
    request_path=Path(sys.argv[1]).resolve(); request=json.loads(request_path.read_text(encoding='utf-8'))
    for key in ['HF_HUB_OFFLINE','TRANSFORMERS_OFFLINE','DIFFUSERS_OFFLINE']:os.environ[key]='1'
    os.environ['PYTHONIOENCODING']='utf-8'
    try:generate(request,request_path.parent)
    except Exception as error:
        log_path=request_path.parent/'job.log'
        log=log_path.read_text(encoding='utf-8',errors='replace').lower() if log_path.exists() else ''
        memory_error=any(term in (log+' '+str(error).lower()) for term in ['out of memory','cannot make enough memory','workspace capacity check','cuda error: memory'])
        message='The GPU ran out of memory while creating this picture. Stop other AI apps using the GPU, or choose Use CPU in image settings. The detailed log is saved with this image job.' if memory_error else 'Image generation failed. Details are saved in this image job’s job.log. '+str(error)[:300]
        status(request_path.parent,stage='error',error=message);raise
