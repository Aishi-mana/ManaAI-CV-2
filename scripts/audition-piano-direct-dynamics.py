"""Audition explicit weak-note attenuation, keeping approved note/timing data."""
import argparse,json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def main(softer_boosted=False):
 base=ROOT/'exports/singing/whereabout-uvr-piano-soft-dynamics'
 out=ROOT/'exports/singing'/('whereabout-uvr-piano-balanced-dynamics' if softer_boosted else 'whereabout-uvr-piano-direct-dynamics');out.mkdir(exist_ok=True)
 notes=json.loads((base/'notes.json').read_text(encoding='utf-8'));prior=json.loads((base/'report.json').read_text(encoding='utf-8'));velocities=prior['midi_velocities']
 levels=[1.,.4,.18,.08] if softer_boosted else [1.,.5,.25,.125]
 groups={gain:[] for gain in levels};assigned=[]
 for i,(note,velocity) in enumerate(zip(notes,velocities)):
  score=min(velocity/95,float(np.clip((note[3]-.4)/.3,0,1)))
  gain=levels[0] if score>=.75 else levels[1] if score>=.45 else levels[2] if score>=.25 else levels[3]
  groups[gain].append(i);assigned.append(gain)
 assert sorted(i for group in groups.values() for i in group)==list(range(len(notes)))
 audio=np.zeros(SR*15,dtype=np.float32)
 for gain,indices in groups.items():
  if not indices:continue
  layer=render_separate([notes[i] for i in indices],15,ROOT,'piano',0,None,midi_velocities=[velocities[i] for i in indices])
  audio+=layer*gain
 boost_db=1.5 if softer_boosted else 0
 target_gain=prior['listening_gain']*10**(boost_db/20)
 listening_gain=min(target_gain,.9/max(float(np.max(np.abs(audio))),1e-9))
 assert len(audio)==SR*15 and np.isfinite(audio).all() and listening_gain<=target_gain
 sf.write(out/('balanced-piano.wav' if softer_boosted else 'direct-soft-piano.wav'),audio*listening_gain,SR,subtype='PCM_16')
 (out/'notes.json').write_text(json.dumps(notes,indent=2),encoding='utf-8')
 report=dict(seconds=15,note_count=len(notes),direct_gain_per_note=assigned,group_counts={str(gain):len(group) for gain,group in groups.items()},requested_boost_db=boost_db,applied_boost_db=float(20*np.log10(listening_gain/prior['listening_gain'])),peak=float(np.max(np.abs(audio*listening_gain))),listening_gain=listening_gain,previous_gain=prior['listening_gain'],rms=float(np.sqrt(np.mean((audio*listening_gain)**2))),method='Exact approved notes and MIDI velocities; explicit weak-note layer attenuation with fixed requested overall boost subject to peak cap. No note removal or RMS normalization.')
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 assert json.loads((out/'notes.json').read_text(encoding='utf-8'))==notes
 print(json.dumps({k:v for k,v in report.items() if k!='direct_gain_per_note'},indent=2))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--softer-boosted',action='store_true');args=parser.parse_args();main(args.softer_boosted)
