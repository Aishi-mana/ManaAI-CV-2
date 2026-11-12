"""Offline, isolated Applio trial. Never changes Mana's active voice."""
from pathlib import Path
import os, subprocess, json, sys, time, hashlib

root=Path(__file__).resolve().parents[1]
engine=root/'data/applio-training/engine'
dataset=root/('data/custom-voice/'+(sys.argv[sys.argv.index('--dataset')+1] if '--dataset' in sys.argv else 'mana-current-rvc-trial-v1'))
python=root/'data/music-tools/Scripts/python.exe'
model=sys.argv[sys.argv.index('--model')+1] if '--model' in sys.argv else 'mana-current-trial-v1'
batch=int(sys.argv[sys.argv.index('--batch-size')+1]) if '--batch-size' in sys.argv else 4
assert batch in (1,2,4)
assert model in ('mana-current-trial-v1','mousey-v2-trial-v1'), 'Unknown trial namespace'
experiment=engine/'logs'/model
experiment.mkdir(parents=True,exist_ok=True)
manifest_path=dataset/'manifest.json'
env=os.environ.copy()
env.update(PYTHONPATH=str(root/'data/applio-training/offline-overlay'),
           PYTHONIOENCODING='utf-8',PYTHONUNBUFFERED='1',
           PYTHONPYCACHEPREFIX=str(root/'data/applio-training/pycache'),
           TEMP=str(root/'work'),TMP=str(root/'work'),
           HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1')
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
for row in manifest['sources']:
    assert hashlib.sha256(Path(row['workingCopy']).read_bytes()).hexdigest()==row['sha256']
assert not ({r['sha256'] for r in manifest['sources'] if r['split']=='train'} &
            {r['sha256'] for r in manifest['sources'] if r['split']=='holdout'})
for source in {r['source'] for r in manifest['sources']}:
    intervals=sorted((r['startFrame'],r['endFrame']) for r in manifest['sources'] if r['source']==source and 'startFrame' in r)
    assert all(a[1]<=b[0] for a,b in zip(intervals,intervals[1:])), 'Overlapping training/holdout source frames'

def status(value,**extra):
    manifest.update(status=value,**extra)
    manifest_path.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(value,flush=True)

def stage(label,args):
    status(label)
    with (experiment/f'{label}.log').open('w',encoding='utf-8') as log:
        completed=subprocess.run([str(python),*map(str,args)],cwd=engine,env=env,
                                 stdout=log,stderr=subprocess.STDOUT)
    if completed.returncode:
        raise RuntimeError(f'{label} exited {completed.returncode}; see {experiment/label}.log')

try:
    if '--resume-training' not in sys.argv:
        stage('preprocess',['rvc/train/preprocess/preprocess.py',experiment,dataset/'train',40000,4,
                            'Automatic','False','False',0.0,3.0,0.3,'none'])
        stage('extract',['rvc/train/extract/extract.py',experiment,'rmvpe',2,'0',40000,'contentvec','None',0])
    # Complete features for every sliced source; no holdout is fed to extractor.
    wavs=list((experiment/'sliced_audios').glob('*.wav'))
    assert wavs, 'No sliced training audio'
    for wav in wavs:
        for folder,suffix in [('extracted','.npy'),('f0','.wav.npy'),('f0_voiced','.wav.npy')]:
            assert (experiment/folder/(wav.stem+suffix)).is_file(), f'Missing {folder}: {wav}'
    status('training',trainingStarted=True,runtime='music-tools Python 3.10 + isolated Applio code',
           experiment=str(experiment),slicedTrainingClips=len(wavs))
    stage('training',['rvc/train/train.py',model,10,50,
                      engine/'rvc/models/pretraineds/hifi-gan/f0G40k.pth',
                      engine/'rvc/models/pretraineds/hifi-gan/f0D40k.pth',
                      '0',batch,40000,'True','True','False','False',50,'False','HiFi-GAN','False'])
    assert list(experiment.glob(f'{model}_50e_*s.pth')), 'Training ended without the requested 50-epoch checkpoint; inspect training.log'
    candidates=list(experiment.glob(f'{model}_*e_*s.pth'))
    assert candidates, 'Trainer returned without an exported candidate'
    status('trained-awaiting-listening',candidateModels=[str(p) for p in candidates])
except Exception as exc:
    status('trial-error',error=str(exc))
    raise
