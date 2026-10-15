"""User-requested audition removing only confidence below .40 from preferred take."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2')
sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def main():
 base=ROOT/'exports/singing/whereabout-uvr-piano-0-15-audition'
 out=ROOT/'exports/singing/whereabout-uvr-piano-weak-only-audition';out.mkdir(exist_ok=True)
 before=json.loads((base/'notes.json').read_text(encoding='utf-8'))
 notes=[list(n) for n in before if n[3]>=.40]
 assert len(notes)==114 and len(before)-len(notes)==74
 assert notes==[n for n in before if n[3]>=.40]
 audio=render_separate(notes,15,ROOT,'piano',0,None)
 assert len(audio)==15*SR and np.isfinite(audio).all()
 # Use the exact preferred take's gain, avoiding a new loudness boost after filtering.
 original_report=json.loads((base/'report.json').read_text(encoding='utf-8'))
 gain=next(row['gain'] for row in original_report['listening_levels'] if row['name']=='candidate-polyphonic')
 assert np.max(np.abs(audio*gain))<1
 sf.write(out/'weak-removed-piano.wav',audio*gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for a,b,p,v in notes:track.notes.append(pretty_midi.Note(pitch=p,velocity=int(48+55*np.clip(v,0,1)),start=a,end=b))
 midi.instruments.append(track);midi.write(str(out/'candidate.mid'))
 report=dict(seconds=15,before_notes=len(before),retained_notes=len(notes),removed_notes=len(before)-len(notes),confidence_threshold=.40,listening_gain=gain,method='Only remove confidence below .40. No short-note, harmonic, attack merging or timing changes. Same rendering and playback gain as preferred take.')
 (out/'notes.json').write_text(json.dumps(notes,indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':main()
