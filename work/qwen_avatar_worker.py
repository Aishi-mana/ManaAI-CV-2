from pathlib import Path
p=Path('scripts/qwen_image.py');s=p.read_text(encoding='utf-8');s=s.replace('\n\n','\n')
s=s.replace('import faulthandler,gc,json,logging,sys,time','import base64,faulthandler,gc,io,json,logging,sys,time',1)
s=s.replace('def generate_qwen(request,directory,status):', '''def avatar_reference(value):
    from PIL import Image
    if not isinstance(value,str) or len(value)>1_000_000 or not value.startswith('data:image/jpeg;base64,'):
        raise ValueError('Use a prepared JPEG avatar reference.')
    with Image.open(io.BytesIO(base64.b64decode(value.split(',',1)[1],validate=True))) as image:
        if image.format!='JPEG' or max(image.size)>1280:
            raise ValueError('Avatar reference must be a JPEG up to 1280 pixels per edge.')
        return image.convert('RGB')

def generate_qwen(request,directory,status):''',1)
s=s.replace("    prompt=request['prompt'];negative=request['negative']", "    if request.get('reference') and reference is not None:raise ValueError('Choose one Qwen character reference.')\n    current_avatar=avatar_reference(request['reference']) if request.get('reference') else None\n    if current_avatar is not None:current_avatar.save(output/'reference.jpg',quality=92)\n    prompt=request['prompt'];negative=request['negative']",1)
line="                pixels=torch.from_numpy(np.array(source.convert('RGB'),copy=True)).float().div(255).unsqueeze(0)"
s=s.replace(line,line+"\n        elif current_avatar is not None:\n            pixels=torch.from_numpy(np.array(current_avatar,copy=True)).float().div(255).unsqueeze(0)\n            current_avatar.close()",1)
a=s.index("        (output/'generation.json').write_text");b=s.index("\n        mark('ready')",a)
s=s[:a]+'''        metadata={key:value for key,value in request.items() if key!='reference'}
        metadata.update(sampler='res_multistep',scheduler='simple',shift=3.1,cfg_norm=1.25,pre_cfg=True,lora_strength=1,reference_method='index_timestep_zero',denoise=1,reference_used=reference is not None or current_avatar is not None,reference_source='avatar' if current_avatar is not None else 'sheet' if reference is not None else 'none',elapsed_seconds=round(time.monotonic()-started,2))
        (output/'generation.json').write_text(json.dumps(metadata,indent=2))'''+s[b:]
p.write_text(s,encoding='utf-8')
