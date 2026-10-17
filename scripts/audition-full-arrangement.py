"""Aligned ensemble checks using current production replacement routes."""
import json
from pathlib import Path
import numpy as np
import librosa,soundfile as sf
from arrangement_replacement import SR,render
ROOT=Path('C:/AI/ManaAI-CV-2')

def rms(x):return float(np.sqrt(np.mean(x*x)))
def load(path,seconds):
    x,_=librosa.load(path,sr=SR,duration=seconds)
    return librosa.util.fix_length(x,size=round(seconds*SR))
def matched(x,source):return x*(rms(source)/max(rms(x),1e-9))

def export_group(out,clips,reference,seconds,report):
    assert all(x.shape==(round(seconds*SR),) and np.isfinite(x).all() for x in clips.values())
    peak=max(float(np.max(np.abs(x))) for x in clips.values())
    gain=min(.9/max(peak,1e-9),.12/max(rms(clips[reference]),1e-9))
    for name,x in clips.items():
        sf.write(out/(name+'.wav'),x*gain,SR,subtype='PCM_16')
        if seconds==19:sf.write(out/(name+'-9-19.wav'),x[9*SR:19*SR]*gain,SR,subtype='PCM_16')
        report.append(dict(name=name,seconds=seconds,shared_gain=gain,rms=rms(x*gain),peak=float(np.max(np.abs(x*gain)))))

def main():
    out=ROOT/'exports/singing/full-arrangement-2026-10-16';out.mkdir(exist_ok=True)
    base=ROOT/'exports/singing/arrangement-1791744247383209600'
    original={name:load(base/(name+'.wav'),19) for name in ['guitar','piano','bass','drums','other','mana-vocal']}
    changed={};metadata=[];results=[]
    for name,instrument in [('guitar','guitar-bright-room'),('piano','piano'),('bass','finger-bass'),('drums','drums-rock')]:
        print('Rendering '+name+'…',flush=True)
        audio,midi,notes=render(base/(name+'.wav'),19,ROOT,instrument,bank='separate',source_name=name)
        audio=matched(audio,original[name]);changed[name]=audio
        sf.write(out/('reach-'+name+'.wav'),audio,SR,subtype='FLOAT')
        midi.write(str(out/('reach-'+name+'.mid')))
        metadata.append(dict(source=name,instrument=instrument,notes=len(notes),source_rms=rms(original[name]),rendered_rms=rms(audio)))
    print('Rendering unshifted guitar comparison…',flush=True)
    guitar_zero,_,_=render(base/'guitar.wav',19,ROOT,'guitar-bright-room',source_name='guitar',custom={'pitch':0,'extension':0})
    guitar_zero=matched(guitar_zero,original['guitar'])
    source_backing=sum(original[n] for n in ['guitar','piano','bass','drums','other'])
    rebuilt=sum(changed.values())+original['other']
    zero=rebuilt-changed['guitar']+guitar_zero
    export_group(out,{'reach-source-backing':source_backing,'reach-rebuilt-plus2':rebuilt,'reach-rebuilt-pitch0':zero},'reach-source-backing',19,results)
    voice=original['mana-vocal']
    export_group(out,{'reach-source-with-mana':voice+source_backing*.3,'reach-plus2-with-mana':voice+rebuilt*.3,'reach-pitch0-with-mana':voice+zero*.3},'reach-source-with-mana',19,results)
    # Sax stays with its own aligned Elvis backing, not spliced into the other song.
    print('Rendering sax with aligned Elvis backing…',flush=True)
    saxbase=ROOT/'exports/singing/sax-demucs-elvis-audition'
    sax=load(saxbase/'song-Sax.wav',15);backing=load(saxbase/'song-BackingMono.wav',15)
    generated,_,notes=render(saxbase/'song-Sax.wav',15,ROOT,'sax-tenor',source_name='sax-extracted')
    generated=matched(generated,sax)
    export_group(out,{'elvis-source-ensemble':sax+backing,'elvis-tenor-ensemble':generated+backing},'elvis-source-ensemble',15,results)
    report=dict(reach_stems=metadata,elvis_sax_notes=len(notes),results=results,method='Production routes, full-context render then9–19s excerpts. Each replacement matched to own source stem RMS, no retiming. ReachOut original Other/mixed retained identically and existing saved Mana vocal retained identically. Source piano stem is quiet/possibly bleed; not a claim actual piano instrumentation. Compare preferred+2 guitar to explicit0 against same bass/piano/drums. Elvis rebuilt sax with original matching BackingMono, same15s60–75s passage. Shared master within each comparison group, no compression/per-clip normalization. Original accompaniment/Other in mixes explicitly retained; replacement stems contain no originals. No app/project/library mutation, audition only.')
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Full ensemble comparisons verified and saved.',flush=True)

if __name__=='__main__':main()
