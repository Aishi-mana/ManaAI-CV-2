from pathlib import Path
import sys,time,json,subprocess,os
root=Path(__file__).resolve().parents[1]
experiment=root/'data/applio-training/engine/logs/mousey-v2-trial-v1'
deadline=time.monotonic()+900
previous=None
while time.monotonic()<deadline:
    models=list(experiment.glob('mousey-v2-trial-v1_10e_*s.pth'))
    if models:
        state=(str(models[0]),models[0].stat().st_size)
        if state==previous and state[1]>50000000:break
        previous=state
    manifest=json.loads((root/'data/custom-voice/mousey-v2-rvc-trial-v1/manifest.json').read_text(encoding='utf-8'))
    if manifest['status']=='trial-error':raise RuntimeError(manifest.get('error'))
    time.sleep(3)
else:raise TimeoutError('First checkpoint was not ready within 15 minutes')
env=os.environ.copy()
env.update(PYTHONPATH=str(root/'data/applio-training/offline-overlay'),PYTHONUNBUFFERED='1',PYTHONIOENCODING='utf-8')
subprocess.run([str(root/'data/music-tools/Scripts/python.exe'),str(root/'work/audition-mousey-v2.py'),'--epoch','10'],
               cwd=root,env=env,check=True)
