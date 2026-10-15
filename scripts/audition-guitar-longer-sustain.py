"""Longer source-supported guitar rings; fixed pitches, attacks and dynamics."""
import json,sys,runpy
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from arrangement_replacement import SR,render_separate
extend_notes=runpy.run_path(str(Path(__file__).with_name('audition-guitar-performance.py')))['extend_notes']
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def main():
 base=ROOT/'exports/singing/guitar-performance-9-19-audition'
 report=json.loads((base/'report.json').read_text(encoding='utf-8'));data=json.loads((base/'notes.json').read_text(encoding='utf-8'))
 notes=data['after'];velocities=data['velocities'];original,_=librosa.load(report['source'],sr=SR,duration=19)
 hop=120;spectrum=np.abs(librosa.cqt(original,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(40),n_bins=49));rms=librosa.feature.rms(y=original,frame_length=1024,hop_length=hop)[0]
 performed=extend_notes(notes,spectrum,rms,19,hop,max_extra=1.2,relative_floor=.18,peak_floor=.025)
 assert len(performed)==len(notes) and all(n[0]==b[0] and n[2:]==b[2:] and n[1]>=b[1] for n,b in zip(performed,notes))
 for i,n in enumerate(performed):
  next_key=min((p[0] for p in notes[i+1:] if p[2]==n[2]),default=19)
  assert n[1]<=max(notes[i][1],next_key)+1e-6
 audio=render_separate(performed,19,ROOT,'electric-guitar',0,'clean',midi_velocities=velocities,guitar_release=1.1)
 gain=min(report['recreated_shared_gain'],.9/max(float(np.max(np.abs(audio[9*SR:19*SR]))),1e-9))
 assert len(audio)==19*SR and np.isfinite(audio).all()
 out=ROOT/'exports/singing/guitar-longer-sustain-9-19-audition';out.mkdir(exist_ok=True)
 sf.write(out/'longer-clean-guitar.wav',audio[9*SR:19*SR]*gain,SR,subtype='PCM_16')
 distorted=render_separate(performed,19,ROOT,'electric-guitar',0,'distorted',midi_velocities=velocities,guitar_release=1.1)
 section=distorted[9*SR:19*SR];target=float(np.sqrt(np.mean((audio[9*SR:19*SR]*gain)**2)))
 distorted_gain=min(.9/max(float(np.max(np.abs(section))),1e-9),target/max(float(np.sqrt(np.mean(section**2))),1e-9))
 assert len(distorted)==19*SR and np.isfinite(distorted).all()
 sf.write(out/'longer-distorted-guitar.wav',section*distorted_gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=27)
 for (a,b,p,_),v in zip(performed,velocities):track.notes.append(pretty_midi.Note(pitch=p,velocity=v,start=a,end=b))
 midi.instruments.append(track);midi.write(str(out/'candidate.mid'))
 result=dict(audition_start=9,audition_end=19,note_count=len(notes),further_extended_notes=sum(n[1]>b[1]+.001 for n,b in zip(performed,notes)),maximum_extra_hold=max(n[1]-b[1] for n,b in zip(performed,notes)),sample_release=1.1,listening_gain=gain,previous_gain=report['recreated_shared_gain'],distorted_gain=distorted_gain,method='Follow supported source pitch up to1.2s further, preserve same-key next attacks and real energy stops; sampled release1.1s instead of.65s. Exact previous pitches/onsets/velocities, no new notes or source layering. Distorted version uses identical performance, separately RMS matched to clean clip.')
 (out/'notes.json').write_text(json.dumps(dict(before=notes,after=performed,velocities=velocities),indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
 print(json.dumps(result,indent=2))

if __name__=='__main__':main()
