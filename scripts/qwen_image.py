"""Installed Qwen Rapid reference-art backend. No UI, server or custom-node startup."""
import base64,faulthandler,gc,io,json,logging,sys,time
from pathlib import Path

def avatar_reference(value):
    from PIL import Image
    if not isinstance(value,str) or len(value)>1_000_000 or not value.startswith('data:image/jpeg;base64,'):
        raise ValueError('Use a prepared JPEG avatar reference.')
    with Image.open(io.BytesIO(base64.b64decode(value.split(',',1)[1],validate=True))) as image:
        if image.format!='JPEG' or max(image.size)>1280:
            raise ValueError('Avatar reference must be a JPEG up to 1280 pixels per edge.')
        return image.convert('RGB')

def generate_qwen(request,directory,status):
    if request['cpu']:raise ValueError('Qwen currently requires the NVIDIA GPU. Turn off Use CPU.')
    output=Path(directory);started=time.monotonic()
    def mark(stage,**extra):
        data={'stage':stage,'elapsed_seconds':round(time.monotonic()-started,2),**extra}
        status(output,**data);print(data,flush=True)
    comfy=Path(request['comfy']);files={k:Path(v) for k,v in request['qwenFiles'].items()}
    reference=Path(request['qwenReference']) if request.get('qwenReference') else None
    if request.get('reference') and reference is not None:raise ValueError('Choose one Qwen character reference.')
    current_avatar=avatar_reference(request['reference']) if request.get('reference') else None
    if current_avatar is not None:current_avatar.save(output/'reference.jpg',quality=92)
    prompt=request['prompt'];negative=request['negative']
    for path in [*files.values(),*([reference] if reference else [])]:
        if not path.is_file():raise FileNotFoundError('A required Qwen model or character sheet is missing: '+str(path))
    sys.path.insert(0,str(comfy));sys.argv=[sys.argv[0]]
    import comfy.options
    comfy.options.enable_args_parsing()
    # The desktop starts this allocator explicitly; library imports alone leave
    # the legacy loader active and can duplicate this large model in host RAM.
    logging.basicConfig(level=logging.INFO,force=True)
    faulthandler.enable()
    import comfy_aimdo.control
    comfy_aimdo.control.init(simple_vram_headroom=None,nvml_pressure=True)
    import torch,numpy as np,comfy.sd,comfy.utils,comfy.sample,comfy.model_management as mm,node_helpers
    import comfy.model_patcher,comfy.memory_management
    from comfy.cli_args import args as comfy_args
    if not comfy_aimdo.control.init_devices((d.index,int(comfy_args.vram_headroom*1024**3)) for d in mm.get_all_torch_devices()):
        raise RuntimeError('The installed dynamic memory allocator could not initialize.')
    comfy_aimdo.control.set_log_info()
    comfy.model_patcher.CoreModelPatcher=comfy.model_patcher.ModelPatcherDynamic
    comfy.memory_management.aimdo_enabled=True
    mark('dynamic_memory_enabled')
    from PIL import Image
    from comfy_extras.nodes_qwen import TextEncodeQwenImageEditPlus
    from comfy_extras.nodes_model_advanced import ModelSamplingAuraFlow
    from comfy_extras.nodes_cfg import CFGNorm
    from nodes import EmptyLatentImage
    logging.basicConfig(level=logging.INFO)
    with torch.inference_mode():
        mark('loading_reference_encoders')
        vae=comfy.sd.VAE(sd=comfy.utils.load_torch_file(str(files['vae'])))
        clip=comfy.sd.load_clip([str(files['clip'])],embedding_directory=[],clip_type=comfy.sd.CLIPType.QWEN_IMAGE)
        pixels=None
        if reference is not None:
            with Image.open(reference) as source:
                pixels=torch.from_numpy(np.array(source.convert('RGB'),copy=True)).float().div(255).unsqueeze(0)
        elif current_avatar is not None:
            pixels=torch.from_numpy(np.array(current_avatar,copy=True)).float().div(255).unsqueeze(0)
            current_avatar.close()
        mark('encoding_reference')
        positive=TextEncodeQwenImageEditPlus.execute(clip,prompt,vae,image1=pixels)[0]
        negative_cond=TextEncodeQwenImageEditPlus.execute(clip,negative,vae,image1=pixels)[0]
        positive=node_helpers.conditioning_set_values(positive,{'reference_latents_method':'index_timestep_zero'})
        negative_cond=node_helpers.conditioning_set_values(negative_cond,{'reference_latents_method':'index_timestep_zero'})
        # Release the large visual text encoder before loading diffusion weights.
        mm.unload_all_models();del clip,pixels;gc.collect();mm.soft_empty_cache()
        mark('loading_diffusion')
        model=comfy.sd.load_diffusion_model(str(files['model']))
        lora=comfy.utils.load_torch_file(str(files['lora']),safe_load=True)
        model,_=comfy.sd.load_lora_for_models(model,None,lora,1,0);del lora
        model=ModelSamplingAuraFlow().patch_aura(model,3.1)[0]
        model=CFGNorm.execute(model,1.25,True)[0]
        latent=EmptyLatentImage().generate(request['width'],request['height'])[0]['samples']
        latent=comfy.sample.fix_empty_latent_channels(model,latent)
        noise=comfy.sample.prepare_noise(latent,request['seed'])
        mark('sampling',step=0,total=request['steps'])
        samples=comfy.sample.sample(model,noise,request['steps'],request['cfg'],'res_multistep','simple',positive,negative_cond,latent,denoise=1,callback=lambda step,*_:mark('sampling',step=step+1,total=request['steps']),disable_pbar=True,seed=request['seed'])
        mark('decoding')
        decoded=vae.decode(samples)
        # Qwen's video-shaped VAE can return [batch, time, height, width, RGB].
        # Match the core VAEDecode node's flattening of batch/time dimensions.
        decoded=decoded.reshape(-1,*decoded.shape[-3:])
        if decoded.shape[0]!=1 or decoded.shape[-1]!=3:
            raise RuntimeError(f'Expected one RGB image, received {tuple(decoded.shape)}')
        image=(decoded[0].detach().cpu().clamp(0,1)*255).to(torch.uint8).numpy()
        Image.fromarray(image).save(output/'image.png')
        Image.fromarray(image).save(output/'image.jpg',quality=92)
        metadata={key:value for key,value in request.items() if key!='reference'}
        metadata.update(sampler='res_multistep',scheduler='simple',shift=3.1,cfg_norm=1.25,pre_cfg=True,lora_strength=1,reference_method='index_timestep_zero',denoise=1,reference_used=reference is not None or current_avatar is not None,reference_source='avatar' if current_avatar is not None else 'sheet' if reference is not None else 'none',elapsed_seconds=round(time.monotonic()-started,2))
        (output/'generation.json').write_text(json.dumps(metadata,indent=2))
        mark('ready')
