"""Merge unsupported repeat attacks while retaining the earlier polyphonic take."""
import json,sys
from pathlib import Path
import numpy as np
import soundfile as sf
import librosa
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2')
sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def merge_attacks(notes,has_attack):
 result=[];last={};merged=[]
 for row in sorted(notes,key=lambda n:(n[0],n[2])):
  note=list(row);previous=last.get(note[2])
  if (previous is not None and 0<=note[0]-previous[1]<=.16
      and note[3]<.55 and note[3]<=previous[3]*.9
      and not has_attack(note[0],note[2])):
   previous[1]=max(previous[1],note[1]);merged.append(note)
  else:result.append(note);last[note[2]]=note
 return result,merged

def check():
 original=[[0,.5,60,.8],[0,1,64,.7],[.5,1,60,.4],[.7,1.2,67,.5]]
 result,removed=merge_attacks(original,lambda *_:False)
 assert len(result)==3 and result[0]==[0,1,60,.8] and result[1]==original[1]
 assert original[0][1]==.5
 assert merge_attacks(original,lambda *_:True)[0]==original

def main():
 check();base=ROOT/'exports/singing/whereabout-uvr-piano-0-15-audition'
 out=ROOT/'exports/singing/whereabout-uvr-piano-attack-repair';out.mkdir(exist_ok=True)
 source,_=librosa.load(base/'piano-guide.wav',sr=SR)
 notes=json.loads((base/'notes.json').read_text(encoding='utf-8'))
 hop=120
 spectrum=np.abs(librosa.cqt(source,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(21),n_bins=88))
 def has_attack(time,pitch):
  def level(a,b):
   first=max(0,round(a*SR/hop));last=min(spectrum.shape[1],max(first+1,round(b*SR/hop)))
   return float(np.median(spectrum[pitch-21,first:last])) if last>first else 0
  before=level(time-.09,time-.025);after=level(time-.01,time+.045)
  # A fresh rise supports a real re-strike; do not merge it just because it is soft.
  return before<=1e-7 or after>=before*1.4
 repaired,merged=merge_attacks(notes,has_attack)
 audio=render_separate(repaired,15,ROOT,'piano',0,None)
 assert len(audio)==15*SR and np.isfinite(audio).all()
 rms=float(np.sqrt(np.mean(audio*audio)));gain=min(.9/max(float(np.max(np.abs(audio))),1e-9),.07/max(rms,1e-9))
 sf.write(out/'attack-repaired-piano.wav',audio*gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for a,b,p,v in repaired:track.notes.append(pretty_midi.Note(pitch=p,velocity=int(48+55*np.clip(v,0,1)),start=a,end=b))
 midi.instruments.append(track);midi.write(str(out/'candidate.mid'))
 report=dict(seconds=15,before_notes=len(notes),after_notes=len(repaired),merged_repeat_attacks=len(merged),merged_notes=merged,listening_gain=gain,method='Merge weaker same-key near-contiguous repeat attacks lacking a source-energy rise; extend prior note to retain the full interval. Other pitches/notes untouched.')
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(out/'notes.json').write_text(json.dumps(repaired,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':main()
