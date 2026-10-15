"""Keep approved notes, audition source-key attack strength as piano velocity."""
import json,sys
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def velocities(strengths):
 reference=max(float(np.percentile(strengths,90)),1e-9)
 return [int(round(15+80*float(np.clip(v/reference,0,1))**.65)) for v in strengths]

def check():
 values=velocities([.001,.01,.1,1])
 assert all(1<=v<=127 for v in values) and values==sorted(values) and values[0]<values[-1]-40
 try:render_separate([[0,1,60,.5]],1,ROOT,'piano',0,None,midi_velocities=[128])
 except ValueError:pass
 else:raise AssertionError('Invalid velocity accepted')

def main():
 check()
 base=ROOT/'exports/singing/whereabout-uvr-piano-0-15-audition'
 approved=ROOT/'exports/singing/whereabout-uvr-piano-full-passage-repair'
 out=ROOT/'exports/singing/whereabout-uvr-piano-dynamics-audition';out.mkdir(exist_ok=True)
 notes=json.loads((approved/'notes.json').read_text(encoding='utf-8'))
 source,_=librosa.load(base/'piano-guide.wav',sr=SR);hop=120
 spectrum=np.abs(librosa.cqt(source,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(21),n_bins=88))
 strengths=[]
 for a,b,p,_ in notes:
  first=max(0,round((a+.015)*SR/hop));last=min(spectrum.shape[1],max(first+1,round(min(b,a+.14)*SR/hop)))
  strength=float(np.percentile(spectrum[p-21,first:last],75)) if last>first else 0
  strengths.append(strength)
 strikes=velocities(strengths)
 audio=render_separate(notes,15,ROOT,'piano',0,None,midi_velocities=strikes)
 assert len(audio)==15*SR and np.isfinite(audio).all()
 old_audio,_=sf.read(approved/'passage-repaired-piano.wav')
 target=float(np.sqrt(np.mean(old_audio*old_audio)));rms=float(np.sqrt(np.mean(audio*audio)))
 gain=min(.9/max(float(np.max(np.abs(audio))),1e-9),target/max(rms,1e-9))
 sf.write(out/'dynamic-piano.wav',audio*gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for (a,b,p,_),v in zip(notes,strikes):track.notes.append(pretty_midi.Note(pitch=p,velocity=v,start=a,end=b))
 midi.instruments.append(track);midi.write(str(out/'candidate.mid'))
 report=dict(seconds=15,note_count=len(notes),old_velocity_range=[min(int(48+55*n[3]) for n in notes),max(int(48+55*n[3]) for n in notes)],new_velocity_range=[min(strikes),max(strikes)],source_attack_strengths=strengths,midi_velocities=strikes,listening_gain=gain,target_rms=target,actual_rms=float(np.sqrt(np.mean((audio*gain)**2))),method='Source CQT key strength 15–140ms after onset; velocities15–95 referenced to90th percentile. Exact notes/pitches/onsets/ends preserved; global RMS matched to approved take subject to peak cap.')
 (out/'notes.json').write_text(json.dumps(notes,indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 assert json.loads((out/'notes.json').read_text(encoding='utf-8'))==notes
 print(json.dumps({k:v for k,v in report.items() if k not in ['source_attack_strengths','midi_velocities']},indent=2))

if __name__=='__main__':main()
