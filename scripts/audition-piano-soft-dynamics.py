"""Lower weak source notes without lifting their velocity or normalizing upward."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def main():
 base=ROOT/'exports/singing/whereabout-uvr-piano-dynamics-audition'
 out=ROOT/'exports/singing/whereabout-uvr-piano-soft-dynamics';out.mkdir(exist_ok=True)
 previous=json.loads((base/'report.json').read_text(encoding='utf-8'))
 notes=json.loads((base/'notes.json').read_text(encoding='utf-8'))
 strengths=previous['source_attack_strengths'];reference=max(float(np.percentile(strengths,90)),1e-9)
 strikes=[int(round(1+94*float(np.clip(s/reference,0,1)))) for s in strengths]
 assert len(strikes)==len(notes) and all(1<=v<=95 for v in strikes)
 assert all(a<=b for a,b in zip(strikes,previous['midi_velocities']))
 assert sorted(zip(strengths,strikes))==sorted(zip(strengths,strikes),key=lambda row:(row[1],row[0]))
 audio=render_separate(notes,15,ROOT,'piano',0,None,midi_velocities=strikes)
 gain=min(previous['listening_gain'],.9/max(float(np.max(np.abs(audio))),1e-9))
 assert len(audio)==15*SR and np.isfinite(audio).all() and gain<=previous['listening_gain']
 sf.write(out/'soft-dynamic-piano.wav',audio*gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for (a,b,p,_),v in zip(notes,strikes):track.notes.append(pretty_midi.Note(pitch=p,velocity=v,start=a,end=b))
 midi.instruments.append(track);midi.write(str(out/'candidate.mid'))
 report=dict(seconds=15,note_count=len(notes),new_velocity_range=[min(strikes),max(strikes)],midi_velocities=strikes,listening_gain=gain,previous_gain=previous['listening_gain'],actual_rms=float(np.sqrt(np.mean((audio*gain)**2))),method='Linear source-key strength to MIDI1–95, no artificial15-velocity floor or compression curve. No upward RMS normalization; same notes/timing/overlaps.')
 (out/'notes.json').write_text(json.dumps(notes,indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 assert json.loads((out/'notes.json').read_text(encoding='utf-8'))==notes
 print(json.dumps({k:v for k,v in report.items() if k!='midi_velocities'},indent=2))

if __name__=='__main__':main()
