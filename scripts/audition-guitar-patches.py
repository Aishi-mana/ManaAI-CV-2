"""Controlled patch comparison: identical guitar MIDI, release and distortion."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def main():
 base=ROOT/'exports/singing/guitar-longer-sustain-9-19-audition'
 data=json.loads((base/'notes.json').read_text(encoding='utf-8'));notes=data['after'];velocities=data['velocities']
 out=ROOT/'exports/singing/guitar-patch-comparison-2026-10-15';out.mkdir(exist_ok=True)
 patches={'green':'04-green_twang.sfz','black':'07-black_twang.sfz','combo':'10-combo_twang.sfz'}
 results=[]
 for name,patch in patches.items():
  path='BlackAndGreenGuitars/Programs/'+patch
  for tone in ['clean','distorted']:
   audio=render_separate(notes,19,ROOT,'electric-guitar',0,tone,patch_name=path,midi_velocities=velocities,guitar_release=1.1)
   section=audio[9*SR:19*SR]
   assert len(section)==10*SR and np.isfinite(section).all()
   rms=float(np.sqrt(np.mean(section*section)));peak=float(np.max(np.abs(section)))
   assert rms>1e-6
   gain=min(.9/max(peak,1e-9),.065/rms)
   sf.write(out/(name+'-'+tone+'.wav'),section*gain,SR,subtype='PCM_16')
   results.append(dict(name=name,tone=tone,patch=path,gain=gain,output_rms=rms*gain,output_peak=peak*gain))
 source,sr=sf.read(ROOT/'exports/singing/guitar-performance-9-19-audition/original-guitar.wav')
 assert sr==SR and len(source)==10*SR
 sf.write(out/'original-guitar.wav',source,SR,subtype='PCM_16')
 (out/'notes.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
 assert json.loads((out/'notes.json').read_text(encoding='utf-8'))==data
 (out/'report.json').write_text(json.dumps(dict(audition_start=9,audition_end=19,note_count=len(notes),release=1.1,results=results,method='Same48 notes, onsets, holds, velocities and1.1s main release for Green/Black/Combo. Same distortion algorithm; each ten-second clip RMS matched to.065 subject to.9peak cap. No original layered into recreation.'),indent=2),encoding='utf-8')
 print(json.dumps(results,indent=2))

if __name__=='__main__':main()
