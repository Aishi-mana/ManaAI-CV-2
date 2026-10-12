"""Owned offline accompaniment job using saved stems and estimated chords."""
import json, sys, traceback
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
SR = 24000
def note(midi, duration, style):
    t = np.arange(int(duration * SR)) / SR
    f = 440 * 2 ** ((midi - 69) / 12)
    if style == 'piano':
        tone = sum(np.sin(2 * np.pi * f * h * (1 + .0003 * h*h) * t)
                   * np.exp(-t * (1.8 + .35*h)) / h**1.7 for h in range(1, 9))
    else:
        # Deterministic filtered pluck, avoiding repeated noise changes between auditions.
        rng = np.random.default_rng(midi)
        delay = max(2, round(SR/f))
        ring = rng.uniform(-1, 1, delay)
        tone = np.zeros(len(t))
        for i in range(len(t)):
            j = i % delay
            tone[i] = ring[j]
            ring[j] = .496 * (ring[j] + ring[(j+1) % delay])
        tone *= np.exp(-t*.65)
    envelope = np.minimum(t/.008, 1) * np.minimum((duration-t)/.06, 1)
    return tone * np.maximum(envelope, 0)


def run(p):
    style=p['style']
    from arrangement_replacement import EXTRA_PROGRAMS,DRUM_PROGRAMS,SEPARATE_VARIANTS
    extra_styles=['replace-guitar-'+name for name in [*EXTRA_PROGRAMS,*DRUM_PROGRAMS,*SEPARATE_VARIANTS]]
    if style not in extra_styles+['sax-extract','piano-extract','fine-stems','piano','gentle-piano','jazz','rock','review-stems','replace-guitar-sax','replace-guitar-piano','replace-guitar-electric-guitar','replace-guitar-electric-guitar-distorted']: raise ValueError('Choose a supported arrangement style.')
    start=float(p['start']);length=float(p['seconds'])
    if not np.isfinite(start) or start<0 or not 1<=length<=60: raise ValueError('Choose 1–60 seconds.')
    out=Path(p['output']).resolve();out.mkdir(parents=True,exist_ok=True)
    data_root=Path(p.get('data_root') or out.parents[2]).resolve()
    for path in [p['vocal'],p['instrumental']]:
        info=sf.info(path)
        if start+length>info.duration+.01: raise ValueError('The excerpt ends beyond a saved stem.')
    print('Preparing strings and winds extraction…' if style=='fine-stems' else 'Estimating chords and timing from original accompaniment…',flush=True)
    vocal,_=librosa.load(p['vocal'],sr=SR,offset=start,duration=length)
    original,_=librosa.load(p['instrumental'],sr=SR,offset=start,duration=length)
    size=min(len(vocal),len(original));vocal=vocal[:size];original=original[:size]
    if style.startswith('replace-guitar-'):
        source_name=p.get('source_name','guitar')
        if source_name not in ['guitar','piano','bass','other','drums','strings-estimate','winds-estimate','sax-extracted','piano-banquet']:raise ValueError('Choose a supported source part.')
        instrument=style.removeprefix('replace-guitar-')
        if (source_name=='drums') != (instrument in DRUM_PROGRAMS):raise ValueError('Drum parts need a drum kit; melodic parts need a melodic instrument.')
        if instrument in EXTRA_PROGRAMS or instrument in DRUM_PROGRAMS:p={**p,'bank':'livehq'}
        if instrument in SEPARATE_VARIANTS:p={**p,'bank':'separate'}
        label='replacement-piano' if instrument=='piano' else instrument
        from arrangement_replacement import render
        tone='distorted' if instrument=='electric-guitar-distorted' else None
        if tone:instrument='electric-guitar'
        root=data_root
        guitar,_=librosa.load(p['guitar'],sr=SR,offset=start,duration=length)
        sf.write(out/'guitar-guide.wav',guitar,SR,subtype='PCM_16')
        print('Transcribing '+source_name+' and rendering sampled '+instrument+'…',flush=True)
        sax,midi,notes=render(out/'guitar-guide.wav',size/SR,root,instrument,tone=tone,bank=p.get('bank','fluidr3'),source_name=source_name)
        sax=sax[:size];sax*=max(float(np.sqrt(np.mean(guitar**2))),.001)/max(float(np.sqrt(np.mean(sax**2))),.001)
        sax*=min(1,.95/max(float(np.max(np.abs(sax))),.001))
        parts=[];others=np.zeros(size)
        for part in p.get('stems',[]):
            if part['name']==source_name:continue
            data,_=librosa.load(part['path'],sr=SR,offset=start,duration=length);data=data[:size];data=np.pad(data,(0,max(0,size-len(data))))
            path=out/(part['name']+'.wav');sf.write(path,data,SR,subtype='PCM_16');parts.append(dict(name=part['name'],path=str(path),gain=part.get('gain',1),muted=part.get('muted',False)));others+=data
        if not parts:
            others=original-guitar[:size];sf.write(out/'other.wav',others,SR,subtype='PCM_16');parts=[dict(name='other',path=str(out/'other.wav'),gain=1,muted=False)]
        sf.write(out/(label+'.wav'),sax,SR,subtype='PCM_16');parts.append(dict(name=label,path=str(out/(label+'.wav')),gain=1,muted=False))
        backing=others+sax;sf.write(out/'instrumental.wav',backing,SR,subtype='PCM_16');sf.write(out/'mana-vocal.wav',vocal,SR,subtype='PCM_16')
        mixed=vocal+backing*.3;mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001));sf.write(out/'arrangement-mix.wav',mixed,SR,subtype='PCM_16')
        import shutil
        attribution=root/('data/instrument-samples/'+('SeparateLibraries' if p.get('bank')=='separate' else 'LiveHQNatural' if p.get('bank')=='livehq' else 'FluidR3_GM')+'/ATTRIBUTION.txt')
        if attribution.exists():shutil.copyfile(attribution,out/'INSTRUMENT_ATTRIBUTION.txt')
        midi.write(str(out/'guitar-transcription.mid'));(out/'notes.json').write_text(json.dumps(notes),encoding='utf-8')
        return dict(vocal=str(out/'mana-vocal.wav'),mix=str(out/'arrangement-mix.wav'),seconds=size/SR,stems=parts)
    if style in ['sax-extract','piano-extract']:
        if length>30:raise ValueError('Use a 1–30 second section for optional extraction.')
        print('Extracting '+('sax' if style=='sax-extract' else 'Banquet piano')+' from original accompaniment…',flush=True)
        from optional_separators import separate_parts
        parts=separate_parts(original,data_root,out,style)
        sf.write(out/'mana-vocal.wav',vocal,SR,subtype='FLOAT')
        sf.write(out/'instrumental.wav',original,SR,subtype='FLOAT')
        mixed=vocal+original*.3;mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001))
        sf.write(out/'arrangement-mix.wav',mixed,SR,subtype='PCM_16')
        return dict(vocal=str(out/'mana-vocal.wav'),mix=str(out/'arrangement-mix.wav'),seconds=size/SR,stems=parts)
    if style=='fine-stems':
        from fine_separator import separate_parts
        if length>30:raise ValueError('Use a 1–30 second section for finer extraction.')
        existing=p.get('stems') or []
        source_path=next((part['path'] for part in existing if part['name']=='other'),None)
        if existing and not source_path:raise ValueError('This project needs an Other/mixed part for finer extraction.')
        source=original
        if source_path:
            source,_=librosa.load(source_path,sr=SR,offset=start,duration=length)
            source=np.pad(source[:size],(0,max(0,size-len(source))))
        parts=separate_parts(source,data_root,out)
        backing=np.zeros(size)
        for part in parts:
            data,_=sf.read(part['path']);backing+=data
        for part in existing:
            if part['name'] in ['other','strings-estimate','winds-estimate']:continue
            data,_=librosa.load(part['path'],sr=SR,offset=start,duration=length);data=np.pad(data[:size],(0,max(0,size-len(data))))
            path=out/(part['name']+'.wav');sf.write(path,data,SR,subtype='FLOAT')
            parts.append(dict(name=part['name'],path=str(path),gain=part.get('gain',1),muted=part.get('muted',False)));backing+=data
        # Existing accepted estimates are retained on a second extraction pass.
        for part in existing:
            if part['name'] not in ['strings-estimate','winds-estimate']:continue
            old,_=librosa.load(part['path'],sr=SR,offset=start,duration=length);old=np.pad(old[:size],(0,max(0,size-len(old))))
            path=out/(part['name']+'.wav');current,_=sf.read(path);sf.write(path,current+old,SR,subtype='FLOAT');backing+=old
        sf.write(out/'mana-vocal.wav',vocal,SR,subtype='FLOAT');sf.write(out/'instrumental.wav',backing,SR,subtype='FLOAT')
        mixed=vocal+backing*.3;mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001));sf.write(out/'arrangement-mix.wav',mixed,SR,subtype='PCM_16')
        return dict(vocal=str(out/'mana-vocal.wav'),mix=str(out/'arrangement-mix.wav'),seconds=size/SR,stems=parts)
    if style=='review-stems':
        import torch,os,gc
        os.environ['TORCH_HOME']=str(data_root/'data/music-cache/torch')
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        torch.set_num_threads(8)
        print('Separating estimated guitar, piano, bass and drums…',flush=True)
        model=get_model('htdemucs_6s').cpu().eval()
        stereo=librosa.resample(original,orig_sr=SR,target_sr=model.samplerate)
        audio=torch.from_numpy(np.stack([stereo,stereo])).float();ref=audio.mean(0);mean=ref.mean();std=ref.std().clamp(min=1e-6)
        with torch.no_grad():separated=apply_model(model,((audio-mean)/std)[None],device='cpu',shifts=0,split=True,overlap=.25,progress=True)[0]
        separated=separated*std+mean
        parts=[];reconstructed=np.zeros(size)
        for name in ['guitar','piano','bass','drums']:
            samples=separated[model.sources.index(name)].numpy().mean(axis=0)
            samples=librosa.resample(samples,orig_sr=model.samplerate,target_sr=SR)[:size]
            samples=np.pad(samples,(0,max(0,size-len(samples))))
            reconstructed+=samples;path=out/(name+'.wav');sf.write(path,samples,SR,subtype='PCM_16');parts.append(dict(name=name,path=str(path),gain=1,muted=False))
        # Residual includes model 'other', leakage and any unassigned material, preserving the sum.
        sf.write(out/'other.wav',original-reconstructed,SR,subtype='PCM_16');parts.append(dict(name='other',path=str(out/'other.wav'),gain=1,muted=False))
        sf.write(out/'mana-vocal.wav',vocal,SR,subtype='PCM_16');sf.write(out/'instrumental.wav',original,SR,subtype='PCM_16')
        mixed=vocal+original*.3;mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001));sf.write(out/'arrangement-mix.wav',mixed,SR,subtype='PCM_16')
        return dict(vocal=str(out/'mana-vocal.wav'),mix=str(out/'arrangement-mix.wav'),seconds=size/SR,stems=parts)
    if np.sqrt(np.mean(original**2))<.001: raise ValueError('No audible accompaniment in this section.')
    chroma=librosa.feature.chroma_stft(y=librosa.effects.harmonic(original),sr=SR,hop_length=512)
    tempo,beats=librosa.beat.beat_track(y=original,sr=SR,hop_length=512)
    bpm=float(np.asarray(tempo).reshape(-1)[0]);beat=float(np.clip(60/bpm if bpm>0 else .5,.3,1.2))
    times=librosa.frames_to_time(beats,sr=SR,hop_length=512)
    times=times[(times>=0)&(times<size/SR)]
    if len(times)<4: times=np.arange(0,size/SR,beat)
    templates=[]
    for root in range(12):
        for third in [4,3]:
            template=np.zeros(12);template[[root,(root+third)%12,(root+7)%12]]=[1,.8,.8]
            templates.append((root,third,template/np.linalg.norm(template)))
    chords=[];backing=np.zeros(size)
    print('Rendering '+style+' accompaniment…',flush=True)
    for index in range(0,len(times),4):
        begin=float(times[index]);end=float(times[index+4]) if index+4<len(times) else size/SR
        a=int(begin*SR/512);b=max(a+1,int(end*SR/512));energy=chroma[:,a:b].mean(axis=1)
        root,third,_=max(templates,key=lambda entry:float(energy@entry[2]));chords.append(dict(start=begin,end=end,root=root,third=third))
        if style in ['jazz','rock']:continue
        pitches=[48+root,48+root+third,55+root,60+root]
        hits=times[(times>=begin)&(times<end)]
        if style=='gentle-piano':hits=hits[::2]
        for i,hit in enumerate(hits):
            offset=int(hit*SR);duration=min(2.5 if style=='gentle-piano' else 1.5,(size-offset)/SR)
            tone=note(pitches[i%4],duration,'piano')*.18
            if style=='gentle-piano':
                from scipy.signal import butter,sosfilt
                tone=sosfilt(butter(2,2200,fs=SR,output='sos'),tone)
            backing[offset:offset+len(tone)]+=tone
    if style in ['jazz','rock']:
        from arrangement_band import render_band
        backing=render_band(chords,beat,size,style,note)
    vr=max(float(np.sqrt(np.mean(vocal**2))),.001);br=max(float(np.sqrt(np.mean(backing**2))),.001)
    backing*=vr*(.22 if style=='gentle-piano' else .3 if style=='jazz' else .42 if style=='rock' else .35)/br
    mixed=vocal+backing;mixed*=min(1,.95/max(float(np.max(np.abs(mixed))),.001))
    sf.write(out/'mana-vocal.wav',vocal,SR,subtype='PCM_16')
    sf.write(out/'instrumental.wav',backing,SR,subtype='PCM_16')
    sf.write(out/'arrangement-mix.wav',mixed,SR,subtype='PCM_16')
    (out/'analysis.json').write_text(json.dumps(dict(style=style,start=start,chords=chords,estimated=True)),encoding='utf-8')
    return dict(vocal=str(out/'mana-vocal.wav'),mix=str(out/'arrangement-mix.wav'),seconds=size/SR)

if __name__=='__main__':
    p=json.load(sys.stdin)
    try:result=dict(done=True,error='',**run(p))
    except Exception as error:
        traceback.print_exc();result=dict(done=True,error=str(error))
    Path(p['result']).write_text(json.dumps(result),encoding='utf-8')
