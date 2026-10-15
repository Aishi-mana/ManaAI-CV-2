"""Filter the same accepted UVR piano transcription without changing its timing."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,filter_piano_notes,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2')
sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def check():
 chord=[[0,1,60,.8],[0,1,64,.7],[0,1,67,.6]]
 assert filter_piano_notes(chord)==chord
 assert len(filter_piano_notes(chord+[[0,1,72,.42],[.2,.26,80,.45]]))==3
 assert filter_piano_notes([[0,1,60,.8],[.2,1,72,.5]])==[[0,1,60,.8],[.2,1,72,.5]]
 assert filter_piano_notes([[0,.08,60,.75]])==[[0,.08,60,.75]]

def main():
 check()
 base=ROOT/'exports/singing/whereabout-uvr-piano-0-15-audition'
 out=ROOT/'exports/singing/whereabout-uvr-piano-filtered-audition';out.mkdir(exist_ok=True)
 before=json.loads((base/'notes.json').read_text(encoding='utf-8'));notes=filter_piano_notes(before)
 audio=render_separate(notes,15,ROOT,'piano',0,None)
 assert len(audio)==15*SR and np.isfinite(audio).all()
 rms=float(np.sqrt(np.mean(audio*audio)));gain=min(.9/max(float(np.max(np.abs(audio))),1e-9),.07/max(rms,1e-9))
 sf.write(out/'filtered-piano.wav',audio*gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for start,end,pitch,confidence in notes:track.notes.append(pretty_midi.Note(pitch=pitch,velocity=int(48+55*np.clip(confidence,0,1)),start=start,end=end))
 midi.instruments.append(track);midi.write(str(out/'filtered.mid'))
 report=dict(seconds=15,original_notes=len(before),retained_notes=len(notes),removed_notes=len(before)-len(notes),maximum_polyphony=int(max(sum(a<=t<b for a,b,_,_ in notes) for t in np.arange(0,15,.01))),listening_gain=gain,source_notes=str(base/'notes.json'),changes='Confidence/short-note and coincident weak harmonic filtering; retained note timing/pitch unchanged.')
 (out/'notes.json').write_text(json.dumps(notes,indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':main()
