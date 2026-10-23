"""Owned local ACE-Step CLI job. External installation is read-only."""
from pathlib import Path
import json,sys,subprocess,shutil,traceback,re,math

def validate(p):
    prompt=p.get('prompt','')
    if not isinstance(prompt,str) or not 1<=len(prompt.strip())<=2000:raise ValueError('Describe the song in 1–2000 characters.')
    if not isinstance(p.get('lyrics',''),str) or len(p.get('lyrics',''))>6000:raise ValueError('Lyrics must be at most 6000 characters.')
    duration=p.get('duration',0);seed=p.get('seed',-1)
    if isinstance(duration,bool) or not isinstance(duration,(int,float)) or not 10<=duration<=180:raise ValueError('Choose 10–180 seconds.')
    if isinstance(seed,bool) or not isinstance(seed,int) or not 0<=seed<=2147483647:raise ValueError('Choose a whole-number seed from 0 to 2147483647.')
    if p.get('style') not in ['gentle-piano','acoustic-guitar','jazz','rock','synth-pop']:raise ValueError('Choose an available song style.')

def build_request(p):
    validate(p)
    style={'gentle-piano':'gentle piano, warm flowing chords, intimate hopeful anime slice-of-life mood','acoustic-guitar':'light acoustic guitar, warm fingerpicked melody, intimate acoustic pop','jazz':'melodic jazz, saxophone, piano, upright bass, light brushed drums','rock':'anime-inspired melodic rock, distorted electric guitar, energetic drums','synth-pop':'bright melodic synth-pop, expressive keyboards, warm bass, lively drums'}[p['style']]
    instrumental=bool(p.get('instrumental',True))
    request={'caption':p['prompt'].strip()+'. '+style+('. Instrumental, no vocals.' if instrumental else '. Clear expressive female lead singing, audible lyrics.'),'lyrics':'[Instrumental]' if instrumental else p.get('lyrics','').strip(),'duration':p['duration'],'seed':p['seed'],'lm_seed':p['seed'],'vocal_language':'en','lm_model':'acestep-5Hz-lm-4B-Q8_0.gguf','synth_model':'acestep-v15-base-Q8_0.gguf','inference_steps':50,'guidance_scale':1.0,'output_format':'wav16','task_type':'text2music'}
    # User-approved A/B: stronger base-model guidance made the sung English
    # words understandable. Instrumental generation retains its prior setting.
    request['guidance_scale']=1.0 if instrumental else 3.0
    # The composer stores optional directions in the saved prompt. Only read
    # its exact tempo line; do not infer a tempo from arbitrary lyric numbers.
    tempos=re.findall(r'^Tempo: (\d+) BPM\.$',p['prompt'],re.MULTILINE)
    if tempos:
        bpm=int(tempos[-1])
        if not 40<=bpm<=240:raise ValueError('Choose a tempo from 40 to 240 BPM.')
        request['bpm']=bpm
    request['caption']+=f" Complete the song within {p['duration']:g} seconds, with a brief intro and a clear final ending; reserve the last few seconds for the outro."
    return request


def lyric_budget(request):
    seconds=request['duration']
    reserve=min(8,seconds*.25)
    available=seconds-reserve
    bpm=request.get('bpm',90)
    # Conservative phrasing estimate, not a measured alignment or guarantee.
    return max(1,math.floor(available*bpm/480)),max(6,math.floor(available*1.4))


def fit_generated_lyrics(lyrics,request):
    if not isinstance(lyrics,str) or not lyrics.strip() or lyrics.strip()=='[Instrumental]':
        raise ValueError('The lyric planner returned no sung lyrics.')
    max_lines,max_words=lyric_budget(request)
    lines=[];section='Verse'
    for text in lyrics.splitlines():
        text=text.strip()
        if not text:continue
        if text.startswith('[') and text.endswith(']'):
            section=text[1:-1];continue
        lines.append((section,text))
    if not lines:raise ValueError('The lyric planner returned no sung lines.')
    # Keep complete lines and reserve a final line from the original ending.
    ending=lines[-1][1]
    selected=[];words=len(ending.split())
    if words>max_words:
        raise ValueError('Even the closing lyric line is too long for this duration. Choose a longer song or supply shorter lyrics.')
    for section,text in lines[:-1]:
        if len(selected)>=max_lines-1 or words+len(text.split())>max_words:break
        selected.append((section,text));words+=len(text.split())
    selected.append(('Outro',ending))
    output=[];previous=None
    for section,text in selected:
        if section!=previous:output.append(f'[{section}]');previous=section
        output.append(text)
    adjusted=len(selected)!=len(lines)
    return '\n'.join(output),adjusted


def prepare_render_plan(request,plan):
    result=dict(plan)
    result['duration']=request['duration']
    # Keep the caption that conditioned these codes; do not change vocal
    # instructions after the LM has already generated the musical content.
    if 'bpm' in request:result['bpm']=request['bpm']
    if request['lyrics']:result['lyrics']=request['lyrics']
    # The installed LM allows 100 extra tokens. Its 5Hz codes, rather than
    # duration metadata alone, determine the synth's output length.
    codes=result.get('audio_codes','')
    if not isinstance(codes,str):raise ValueError('Invalid planner audio codes.')
    if codes.strip():
        tokens=codes.split(',')
        limit=max(1,math.floor(request['duration']*5))
        result['audio_codes']=','.join(tokens[:limit])
    return result


def run(p):
    request=build_request(p)
    instrumental=bool(p.get('instrumental',True))
    out=Path(p['output']).resolve();out.mkdir(parents=True,exist_ok=True)
    binary=Path('C:/AI/acestep.cpp/build/Release');models=Path('C:/AI/Manaverse-BGM-Generator/models')
    flags=getattr(subprocess,'CREATE_NO_WINDOW',0)
    lyrics_adjusted=False
    if not instrumental and not request['lyrics']:
        max_lines,max_words=lyric_budget(request)
        lyric_request={**request,'lm_mode':'inspire'}
        lyric_request['caption']+=f' Use at most {max_lines} short sung lines and {max_words} words total, including a short closing line. Use a compact verse/chorus structure that fits this length; omit extra verses and repeats.'
        lyric_path=out/'ace-lyrics.json'
        lyric_path.write_text(json.dumps(lyric_request,ensure_ascii=False),encoding='utf-8')
        print('Planning lyrics to fit the selected length…',flush=True)
        subprocess.run([str(binary/'ace-lm.exe'),'--models',str(models),'--request',str(lyric_path),'--max-seq','4096'],cwd=out,check=True,creationflags=flags)
        lyric_plan=json.loads((out/'ace-lyrics0.json').read_text(encoding='utf-8'))
        request['lyrics'],lyrics_adjusted=fit_generated_lyrics(lyric_plan.get('lyrics',''),request)
        # Preserve planner metadata for code generation, but not its codes or
        # rewritten duration/BPM. Codes must be generated AFTER fitting lyrics.
        for field in ['keyscale','timesignature']:
            if lyric_plan.get(field):request[field]=lyric_plan[field]
    path=out/'ace-request.json';path.write_text(json.dumps(request,ensure_ascii=False),encoding='utf-8')
    print('Planning original music and lyrics…',flush=True)
    subprocess.run([str(binary/'ace-lm.exe'),'--models',str(models),'--request',str(path),'--max-seq','4096'],cwd=out,check=True,creationflags=flags)
    planned=out/'ace-request0.json'
    if not planned.is_file():raise RuntimeError('The music planner returned no song plan.')
    shutil.copyfile(planned,out/'ace-planner-original.json')
    raw_plan=json.loads(planned.read_text(encoding='utf-8'))
    duration_limited=len(raw_plan.get('audio_codes','').split(','))>math.floor(request['duration']*5)
    plan=prepare_render_plan(request,raw_plan)
    planned.write_text(json.dumps(plan,ensure_ascii=False),encoding='utf-8')
    print('Rendering original audio…',flush=True)
    subprocess.run([str(binary/'ace-synth.exe'),'--models',str(models),'--request',str(planned),'--vae-chunk','256'],cwd=out,check=True,creationflags=flags)
    generated=out/'ace-request00.wav'
    if not generated.is_file():raise RuntimeError('The music generator returned no WAV.')
    import soundfile as sf,numpy as np
    info=sf.info(generated)
    if info.duration<1:raise RuntimeError('Generated audio is too short.')
    x,sr=sf.read(generated,always_2d=True)
    if not np.isfinite(x).all():raise RuntimeError('Generated audio contains invalid samples.')
    mix=out/'original-song.wav'
    frames=math.floor(request['duration']*sr)
    if len(x)>frames:
        duration_limited=True
        x=x[:frames].copy()
        fade=min(len(x),int(.02*sr))
        if fade:x[-fade:]*=np.linspace(1,0,fade)[:,None]
        sf.write(mix,x,sr,subtype='PCM_16')
    else:shutil.copyfile(generated,mix)
    if instrumental:shutil.copyfile(mix,out/'instrumental.wav')
    plan=json.loads(planned.read_text(encoding='utf-8'))
    return dict(mix=str(mix),vocal='',seconds=sf.info(mix).duration,kind='original',generatedLyrics=plan.get('lyrics',''),instrumental=instrumental,lyricsAdjusted=lyrics_adjusted,durationLimited=duration_limited)

if __name__=='__main__':
    p=json.load(sys.stdin)
    try:result=dict(done=True,error='',**run(p))
    except Exception as e:traceback.print_exc();result=dict(done=True,error=str(e))
    Path(p['result']).write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
