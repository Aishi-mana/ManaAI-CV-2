"""Targeted repair of unsupported repeat attacks around the user's flagged time."""
import argparse,json,sys
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from arrangement_replacement import SR,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def main(whole_section=False):
 base=ROOT/'exports/singing/whereabout-uvr-piano-0-15-audition'
 accepted=ROOT/'exports/singing/whereabout-uvr-piano-weak-only-audition'
 out=ROOT/'exports/singing'/('whereabout-uvr-piano-full-passage-repair' if whole_section else 'whereabout-uvr-piano-4s-repair');out.mkdir(exist_ok=True)
 before=json.loads((accepted/'notes.json').read_text(encoding='utf-8'))
 source,_=librosa.load(base/'piano-guide.wav',sr=SR);hop=120
 spectrum=np.abs(librosa.cqt(source,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(21),n_bins=88))
 repaired=[];last={};changes=[]
 for row in before:
  note=list(row);a,b,p,v=note;previous=last.get(p)
  first=max(0,round((a-.09)*SR/hop));end=round((a-.025)*SR/hop)
  pre=float(np.median(spectrum[p-21,first:max(first+1,end)]))
  first=round((a+.005)*SR/hop);end=round((a+.06)*SR/hop)
  post=float(np.median(spectrum[p-21,first:max(first+1,end)]))
  ratio=post/max(pre,1e-9)
  if (whole_section or 3.7<=a<=4.6) and previous is not None and abs(a-previous[1])<=.04 and pre>1e-7 and ratio<1.1:
   changes.append(dict(removed_attack=note,prior_note=list(previous),energy_rise=ratio))
   previous[1]=max(previous[1],b)
  else:repaired.append(note);last[p]=note
 if not whole_section:assert len(changes)==2 and {row['removed_attack'][2] for row in changes}=={51,59}
 else:assert any(abs(c['removed_attack'][0]-3.9486761904761902)<.001 for c in changes) and any(abs(c['removed_attack'][0]-4.437579138321995)<.001 for c in changes)
 # Every unmerged note retains its pitch, onset and confidence; changes only extend ends.
 assert all(any(n[0]==r[0] and n[2:]==r[2:] and n[1]>=r[1] for n in repaired) for r in before if not any(r==c['removed_attack'] for c in changes))
 audio=render_separate(repaired,15,ROOT,'piano',0,None)
 gain=json.loads((accepted/'report.json').read_text(encoding='utf-8'))['listening_gain']
 assert len(audio)==SR*15 and np.isfinite(audio).all() and np.max(np.abs(audio*gain))<1
 sf.write(out/('passage-repaired-piano.wav' if whole_section else 'targeted-piano.wav'),audio*gain,SR,subtype='PCM_16')
 import pretty_midi
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=0)
 for a,b,p,v in repaired:track.notes.append(pretty_midi.Note(pitch=p,velocity=int(48+55*np.clip(v,0,1)),start=a,end=b))
 midi.instruments.append(track);midi.write(str(out/'candidate.mid'))
 report=dict(before_notes=len(before),after_notes=len(repaired),seconds=15,listening_gain=gain,changes=changes,method='Merge near-contiguous same-key attacks with no >1.1x source key-energy rise; preserve prior sustain.',review_window='0–15s' if whole_section else '3.7–4.6s')
 (out/'notes.json').write_text(json.dumps(repaired,indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--whole-section',action='store_true');args=parser.parse_args();main(args.whole_section)
