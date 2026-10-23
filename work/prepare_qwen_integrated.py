import json,time
from pathlib import Path
root=Path('C:/AI/ManaAI-CV-2')
r=json.loads((root/'exports/images/qwen-reference-check-1792631848914/request.json').read_text())
r.update(backend='qwen',model='Qwen-Rapid-AIO-SFW-v23.safetensors',checkpoint=r['models']['model'],qwenFiles=r['models'],qwenReference=r['reference'],characterReference=True,cpu=False,comfy='C:/Users/Admin/AppData/Local/Comfy-Desktop/ComfyUI-Installs/ComfyUI/ComfyUI',seed=721105)
r.pop('reference');r.pop('models')
r['prompt']='Create a new polished anime artwork of the same single character Mana shown in the reference turnaround sheet. Preserve her recognizable face, blue eyes, long silver-white hair and X-shaped hair clip, except for changes explicitly requested. Generate a coherent new pose, outfit and scene as requested, not a collage or character sheet. The green backdrop and labels are not part of the artwork. Requested artwork: Mana in a cozy lavender cardigan and white knee-length dress, seated at a wooden table reading an open storybook in a warm magical library, three-quarter view, gentle smile, glowing floating lights, detailed shelves, clean anime linework, coherent soft cel shading. No headphones.'
p=root/'exports/images'/('qwen-integrated-check-'+str(time.time_ns()));p.mkdir();(p/'request.json').write_text(json.dumps(r,indent=2));(root/'work/qwen-integrated-path.txt').write_text(str(p))
