from pathlib import Path
p=Path('scripts/qwen_reference_candidate.py').read_text()
body=p[p.index('    sys.path.insert(0,str(comfy))'):p.index("\nif __name__=='__main__':")]
body=body.replace("mark('ready')", "Image.fromarray(image).save(output/'image.jpg',quality=92)")
body=body.replace("(output/'generation.json').write_text(json.dumps({**request,'elapsed_seconds':round(time.monotonic()-started,2)},indent=2))", "(output/'generation.json').write_text(json.dumps({**request,'sampler':'res_multistep','scheduler':'simple','shift':3.1,'cfg_norm':1.25,'pre_cfg':True,'lora_strength':1,'reference_method':'index_timestep_zero','denoise':1,'reference_used':reference is not None,'elapsed_seconds':round(time.monotonic()-started,2)},indent=2))\n        mark('ready')")
body=body.replace("with Image.open(reference) as source:\n            pixels=torch.from_numpy(np.array(source.convert('RGB'),copy=True)).float().div(255).unsqueeze(0)", "pixels=None\n        if reference is not None:\n            with Image.open(reference) as source:\n                pixels=torch.from_numpy(np.array(source.convert('RGB'),copy=True)).float().div(255).unsqueeze(0)")
body=body.replace("EmptyLatentImage().generate(1280,720)","EmptyLatentImage().generate(request['width'],request['height'])")
body=body.replace("model,noise,4,1,'res_multistep'", "model,noise,request['steps'],request['cfg'],'res_multistep'").replace("step=0,total=4","step=0,total=request['steps']").replace("step=step+1,total=4","step=step+1,total=request['steps']")
header='''"""Installed Qwen Rapid reference-art backend. No UI, server or custom-node startup."""
import faulthandler,gc,json,logging,sys,time
from pathlib import Path

def generate_qwen(request,directory,status):
    if request['cpu']:raise ValueError('Qwen currently requires the NVIDIA GPU. Turn off Use CPU.')
    output=Path(directory);started=time.monotonic()
    def mark(stage,**extra):
        data={'stage':stage,'elapsed_seconds':round(time.monotonic()-started,2),**extra}
        status(output,**data);print(data,flush=True)
    comfy=Path(request['comfy']);files={k:Path(v) for k,v in request['qwenFiles'].items()}
    reference=Path(request['qwenReference']) if request.get('qwenReference') else None
    prompt=request['prompt'];negative=request['negative']
    for path in [*files.values(),*([reference] if reference else [])]:
        if not path.is_file():raise FileNotFoundError('A required Qwen model or character sheet is missing: '+str(path))
'''
Path('scripts/qwen_image.py').write_text(header+body)
p=Path('scripts/image_job.py');s=p.read_text();s=s.replace("    started=time.monotonic(); timings={}","    if request.get('backend')=='qwen':\n        from qwen_image import generate_qwen\n        return generate_qwen(request,directory,status)\n    started=time.monotonic(); timings={}");p.write_text(s)
p=Path('src-tauri/tauri.conf.json');s=p.read_text().replace('"../scripts/image_job.py": "scripts/image_job.py",','"../scripts/image_job.py": "scripts/image_job.py",\n      "../scripts/qwen_image.py": "scripts/qwen_image.py",');p.write_text(s)
