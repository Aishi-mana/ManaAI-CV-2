"""Compare approved extracted piano with mono and polyphonic sampled recreation."""
import json
import argparse
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa
from arrangement_replacement import SR,render,render_piano_polyphonic,piano_notes
ROOT=Path('C:/AI/ManaAI-CV-2')

def check_notes():
 events=[(0,1.5,60,.8),(0,1.3,64,.7),(.2,1.8,67,.6),(1,2,60,.8),(0,.5,45,.1)]
 notes=piano_notes(events,2)
 assert len(notes)==4 and notes[0][1]==1
 assert sum(a<=.3<b for a,b,_,_ in notes)==3

def audition(source=None,start=0,seconds=15,output='whereabout-piano-polyphonic-audition'):
 check_notes()
 if not 0<=start or not 1<=seconds<=60:raise ValueError('Use a non-negative start and 1–60 seconds.')
 if not output or Path(output).name!=output:raise ValueError('Use a single output folder name.')
 supplied=source is not None
 source=Path(source) if supplied else ROOT/'exports/singing/whereabout-sax-piano-audition/piano-raw.wav'
 out=ROOT/'exports/singing'/output;out.mkdir(exist_ok=True)
 input_source=source
 if supplied:
  guide=out/'piano-guide.wav'
  subprocess.run(['C:/AI/Applio/ffmpeg.exe','-y','-nostdin','-ss',str(start),'-i',str(source),'-t',str(seconds),'-ar',str(SR),'-ac','1','-c:a','pcm_s16le',str(guide)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  input_source=guide
 original,_=librosa.load(input_source,sr=SR)
 seconds=len(original)/SR
 before,old_midi,old_notes=render(input_source,seconds,ROOT,'piano',bank='separate',source_name='piano-banquet')
 after,midi,notes=render_piano_polyphonic(input_source,seconds,ROOT)
 report=dict(source=str(source),song_start=start if supplied else 80,seconds=seconds,old_note_count=len(old_notes),new_note_count=len(notes),maximum_polyphony=int(max(sum(a<=t<b for a,b,_,_ in notes) for t in np.arange(0,seconds,.01))),listening_levels=[])
 for name,data in [('original-piano',original),('previous-monophonic',before),('candidate-polyphonic',after)]:
  assert np.isfinite(data).all()
  rms=float(np.sqrt(np.mean(data*data)));gain=min(.9/max(float(np.max(np.abs(data))),1e-9),.07/max(rms,1e-9))
  sf.write(out/(name+'.wav'),data*gain,SR,subtype='PCM_16')
  report['listening_levels'].append(dict(name=name,rms=rms,gain=gain))
 old_midi.write(str(out/'previous.mid'));midi.write(str(out/'candidate.mid'))
 (out/'notes.json').write_text(json.dumps(notes,indent=2),encoding='utf-8')
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source');parser.add_argument('--start',type=float,default=0);parser.add_argument('--seconds',type=float,default=15);parser.add_argument('--output',default='whereabout-piano-polyphonic-audition')
 args=parser.parse_args();audition(args.source,args.start,args.seconds,args.output)
