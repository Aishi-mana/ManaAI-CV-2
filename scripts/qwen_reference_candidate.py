"""Controlled standalone Qwen reference-art candidate; no server or workflow execution.
Uses only explicitly selected installed core operations and local model files.
"""
import argparse,faulthandler,gc,json,logging,os,sys,time
from pathlib import Path
os.environ.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',DIFFUSERS_OFFLINE='1')
sys.dont_write_bytecode=True

def run(output):
    output=Path(output);output.mkdir(parents=True,exist_ok=False)
    started=time.monotonic()
    def mark(stage,**extra):
        data={'stage':stage,'elapsed_seconds':round(time.monotonic()-started,2),**extra}
        (output/'progress.json').write_text(json.dumps(data));print(data,flush=True)
    comfy=Path('C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI')
    models=Path('C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/models')
    files={'model':models/'diffusion_models/Qwen-Rapid-AIO-SFW-v23.safetensors','clip':models/'text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors','vae':models/'vae/qwen_image_vae.safetensors','lora':models/'loras/modern-anime.safetensors'}
    reference=Path('C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Shared/input/Mana Turnaround Sheet.png')
    for path in [*files.values(),reference]:
        if not path.is_file():raise FileNotFoundError(path)
    prompt=('Create a new polished anime illustration of Mana, the same single character shown in the reference turnaround sheet. '
            'Preserve her recognizable face, large blue eyes, long silver-white hair and small X-shaped hair clip. '
            'Show only one Mana, not a character sheet or collage. '
            'She is wearing a modest sky-blue knee-length summer sundress with wide shoulder straps and white closed-toe shoes. '
            'Replace the hoodie, shorts and mismatched socks with this new outfit. She has no headphones in this scene. '
            'A three-quarter view of her walking along a flower garden path, gently holding a small basket of flowers in both hands. '
            'Her complete figure and both shoes are visible with space below her feet. '
            'Warm morning sunlight, lush flowers, coherent soft cel shading, detailed expressive eyes, clean linework, a finished anime artwork. '
            'The green backdrop and labels in the reference are not part of the artwork.')
    negative='blurry, worst quality, low quality, jpeg artifacts, signature, watermark, username, error, deformed hands, bad anatomy, extra limbs, poorly drawn hands, poorly drawn face, mutation, deformed, extra eyes, extra arms, extra legs, malformed limbs, fused fingers, too many fingers, long neck, cross-eyed, bad proportions, missing arms, missing legs, extra digit, fewer digits, cropped, collage, character sheet, multiple views, green screen'
    request={'models':{k:str(v) for k,v in files.items()},'reference':str(reference),'prompt':prompt,'negative':negative,'width':1280,'height':720,'seed':4156193457,'steps':4,'cfg':1,'sampler':'res_multistep','scheduler':'simple','shift':3.1,'cfg_norm':1.25,'pre_cfg':True,'reference_method':'index_timestep_zero','lora_strength':1,'denoise':1}
    (output/'request.json').write_text(json.dumps(request,indent=2))
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
        with Image.open(reference) as source:
            pixels=torch.from_numpy(np.array(source.convert('RGB'),copy=True)).float().div(255).unsqueeze(0)
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
        latent=EmptyLatentImage().generate(1280,720)[0]['samples']
        latent=comfy.sample.fix_empty_latent_channels(model,latent)
        noise=comfy.sample.prepare_noise(latent,request['seed'])
        mark('sampling',step=0,total=4)
        samples=comfy.sample.sample(model,noise,4,1,'res_multistep','simple',positive,negative_cond,latent,denoise=1,callback=lambda step,*_:mark('sampling',step=step+1,total=4),disable_pbar=True,seed=request['seed'])
        mark('decoding')
        decoded=vae.decode(samples)
        # Qwen's video-shaped VAE can return [batch, time, height, width, RGB].
        # Match the core VAEDecode node's flattening of batch/time dimensions.
        decoded=decoded.reshape(-1,*decoded.shape[-3:])
        if decoded.shape[0]!=1 or decoded.shape[-1]!=3:
            raise RuntimeError(f'Expected one RGB image, received {tuple(decoded.shape)}')
        image=(decoded[0].detach().cpu().clamp(0,1)*255).to(torch.uint8).numpy()
        Image.fromarray(image).save(output/'image.png')
        mark('ready')
        (output/'generation.json').write_text(json.dumps({**request,'elapsed_seconds':round(time.monotonic()-started,2)},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('output');args=parser.parse_args()
    try:run(args.output)
    except Exception as error:
        directory=Path(args.output)
        if directory.is_dir():
            (directory/'progress.json').write_text(json.dumps({'stage':'error','error':str(error)[:1000]}))
        raise
