"""Convert user-downloaded open weights; never fetch files from the network."""
from pathlib import Path
import os,sys,subprocess
root=Path(__file__).resolve().parents[1]
models=root/'data/melodyflow-models';tools=root/'work/melodyflow-native/tools'
required=['state_dict.bin','compression_state_dict.bin','model.safetensors','config.json','tokenizer.json']
missing=[name for name in required if not (models/name).is_file()]
if missing:raise SystemExit('Place the downloaded files in '+str(models)+': '+', '.join(missing))
out=models/'converted';out.mkdir(exist_ok=True)
env=os.environ.copy();env['PYTHONPATH']=str(root/'data/melodyflow-conversion-packages')+os.pathsep+env.get('PYTHONPATH','')
jobs=[('convert_melodyflow_dit.py',['--src',str(models/'state_dict.bin'),'--out',str(out/'melodyflow-dit-f16.gguf'),'--out-type','f16']),('convert_seanet.py',['--src',str(models/'compression_state_dict.bin'),'--out',str(out/'melodyflow-codec-f32.gguf')]),('convert_t5.py',['--src',str(models/'model.safetensors'),'--config',str(models/'config.json'),'--tokenizer',str(models/'tokenizer.json'),'--out',str(out/'t5-base-f16.gguf'),'--out-type','f16'])]
for script,args in jobs:
 subprocess.run([sys.executable,str(tools/script),*args],env=env,check=True)
print('Offline model conversion completed.')
