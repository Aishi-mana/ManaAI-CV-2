"""Owned local ACE-Step CLI job. External installation is read-only."""
from pathlib import Path
import json,sys,subprocess,shutil,traceback

def validate(p):
    prompt=p.get('prompt','')
    if not isinstance(prompt,str) or not 1<=len(prompt.strip())<=2000:raise ValueError('Describe the song in 1–2000 characters.')
    if not isinstance(p.get('lyrics',''),str) or len(p.get('lyrics',''))>6000:raise ValueError('Lyrics must be at most 6000 characters.')
    duration=p.get('duration',0);seed=p.get('seed',-1)
    if isinstance(duration,bool) or not isinstance(duration,(int,float)) or not 10<=duration<=180:raise ValueError('Choose 10–180 seconds.')
    if isinstance(seed,bool) or not isinstance(seed,int) or not 0<=seed<=2147483647:raise ValueError('Choose a whole-number seed from 0 to 2147483647.')
    if p.get('style') not in ['gentle-piano','acoustic-guitar','jazz','rock','synth-pop']:raise ValueError('Choose an available song style.')

def run(p):
    validate(p)
    out=Path(p['output']).resolve();out.mkdir(parents=True,exist_ok=True)
    binary=Path('C:/AI/acestep.cpp/build/Release');models=Path('C:/AI/Manaverse-BGM-Generator/models')
    style={'gentle-piano':'gentle piano, warm flowing chords, intimate hopeful anime slice-of-life mood','acoustic-guitar':'light acoustic guitar, warm fingerpicked melody, intimate acoustic pop','jazz':'melodic jazz, saxophone, piano, upright bass, light brushed drums','rock':'anime-inspired melodic rock, distorted electric guitar, energetic drums','synth-pop':'bright melodic synth-pop, expressive keyboards, warm bass, lively drums'}[p['style']]
    instrumental=bool(p.get('instrumental',True))
    request={'caption':p['prompt'].strip()+'. '+style+('. Instrumental, no vocals.' if instrumental else '. Clear expressive female lead singing, audible lyrics.'),'lyrics':'[Instrumental]' if instrumental else p.get('lyrics','').strip(),'duration':p['duration'],'seed':p['seed'],'lm_seed':p['seed'],'vocal_language':'en','lm_model':'acestep-5Hz-lm-4B-Q8_0.gguf','synth_model':'acestep-v15-base-Q8_0.gguf','inference_steps':50,'guidance_scale':1.0,'output_format':'wav16','task_type':'text2music'}
    path=out/'ace-request.json';path.write_text(json.dumps(request,ensure_ascii=False),encoding='utf-8')
    flags=getattr(subprocess,'CREATE_NO_WINDOW',0)
    print('Planning original music and lyrics…',flush=True)
    subprocess.run([str(binary/'ace-lm.exe'),'--models',str(models),'--request',str(path),'--max-seq','4096'],cwd=out,check=True,creationflags=flags)
    planned=out/'ace-request0.json'
    if not planned.is_file():raise RuntimeError('The music planner returned no song plan.')
    print('Rendering original audio…',flush=True)
    subprocess.run([str(binary/'ace-synth.exe'),'--models',str(models),'--request',str(planned),'--vae-chunk','256'],cwd=out,check=True,creationflags=flags)
    generated=out/'ace-request00.wav'
    if not generated.is_file():raise RuntimeError('The music generator returned no WAV.')
    import soundfile as sf,numpy as np
    info=sf.info(generated)
    if info.duration<1:raise RuntimeError('Generated audio is too short.')
    x,sr=sf.read(generated,always_2d=True)
    if not np.isfinite(x).all():raise RuntimeError('Generated audio contains invalid samples.')
    mix=out/'original-song.wav';shutil.copyfile(generated,mix)
    if instrumental:shutil.copyfile(mix,out/'instrumental.wav')
    plan=json.loads(planned.read_text(encoding='utf-8'))
    return dict(mix=str(mix),vocal='',seconds=info.duration,kind='original',generatedLyrics=plan.get('lyrics',''),instrumental=instrumental)

if __name__=='__main__':
    p=json.load(sys.stdin)
    try:result=dict(done=True,error='',**run(p))
    except Exception as e:traceback.print_exc();result=dict(done=True,error=str(e))
    Path(p['result']).write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
