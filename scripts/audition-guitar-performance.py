"""Guitar audition: retain existing melody, follow source sustain and picking level."""
import json,sys
from pathlib import Path
import numpy as np
import librosa
import soundfile as sf
from arrangement_replacement import SR,render,render_separate
ROOT=Path('C:/AI/ManaAI-CV-2');sys.path.insert(0,str(ROOT/'data/transcription-packages'))

def extend_notes(notes,spectrum,rms,seconds,hop,max_extra=.45,relative_floor=.28,peak_floor=.035):
 result=[list(n) for n in notes]
 for i,note in enumerate(result):
  a,b,p,_=note
  next_key=min((n[0] for n in notes[i+1:] if n[2]==p),default=seconds)
  limit=min(seconds,b+max_extra,next_key)
  first=max(0,round(b*SR/hop));last=min(spectrum.shape[1],len(rms),round(limit*SR/hop))
  shoulder=max(0,round(max(a,b-.10)*SR/hop))
  reference=float(np.percentile(spectrum[p-40,shoulder:max(shoulder+1,first+1)],65))
  floor=max(reference*relative_floor,float(spectrum[p-40].max())*peak_floor,1e-7)
  stop=first
  for frame in range(first+1,last):
   if spectrum[p-40,frame]<floor or rms[frame]<max(float(rms.max())*.025,1e-7):break
   stop=frame
  if stop-first>=5:note[1]=max(b,min(limit,stop*hop/SR))
 return result

def check():
 notes=[[0,.3,60,.7],[.3,.6,64,.6],[.65,.9,60,.7]]
 spectrum=np.ones((49,200));rms=np.ones(200)
 extended=extend_notes(notes,spectrum,rms,1,120)
 assert extended[0][1]>.3 and extended[0][1]<=.65
 assert notes[0][1]==.3 and all(a[0]==b[0] and a[2:]==b[2:] for a,b in zip(notes,extended))
 assert extend_notes(notes,np.zeros((49,200)),np.zeros(200),1,120)==notes

def main():
 check()
 source=ROOT/'exports/singing/arrangement-1791744247383209600/guitar.wav'
 out=ROOT/'exports/singing/guitar-performance-9-19-audition';out.mkdir(exist_ok=True)
 original,_=librosa.load(source,sr=SR,duration=19)
 baseline,midi,notes=render(source,19,ROOT,'electric-guitar',tone='clean',bank='separate')
 assert all(40<=n[2]<=88 for n in notes)
 hop=120
 spectrum=np.abs(librosa.cqt(original,sr=SR,hop_length=hop,fmin=librosa.midi_to_hz(40),n_bins=49))
 rms=librosa.feature.rms(y=original,frame_length=1024,hop_length=hop)[0]
 performed=extend_notes(notes,spectrum,rms,19,hop)
 strengths=[]
 for a,b,p,_ in performed:
  first=max(0,round((a+.015)*SR/hop));last=min(spectrum.shape[1],max(first+1,round(min(b,a+.12)*SR/hop)))
  strengths.append(float(np.percentile(spectrum[p-40,first:last],75)) if last>first else 0)
 reference=max(float(np.percentile(strengths,90)),1e-9)
 velocities=[int(round(15+85*float(np.clip(s/reference,0,1)))) for s in strengths]
 candidate=render_separate(performed,19,ROOT,'electric-guitar',0,'clean',midi_velocities=velocities)
 assert len(candidate)==len(baseline)==19*SR and np.isfinite(candidate).all()
 start=9*SR;end=19*SR
 ref=baseline[start:end];gain=min(.9/max(float(np.max(np.abs(ref))),1e-9),.065/max(float(np.sqrt(np.mean(ref*ref))),1e-9))
 shared_gain=min(gain,.9/max(float(np.max(np.abs(candidate[start:end]))),1e-9))
 for name,audio in [('current-clean-guitar',baseline),('candidate-clean-guitar',candidate)]:
  sf.write(out/(name+'.wav'),audio[start:end]*shared_gain,SR,subtype='PCM_16')
 original_gain=min(.9/max(float(np.max(np.abs(original[start:end]))),1e-9),.065/max(float(np.sqrt(np.mean(original[start:end]**2))),1e-9))
 sf.write(out/'original-guitar.wav',original[start:end]*original_gain,SR,subtype='PCM_16')
 midi.write(str(out/'current.mid'))
 import pretty_midi
 performed_midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=27)
 for (a,b,p,_),v in zip(performed,velocities):track.notes.append(pretty_midi.Note(pitch=p,velocity=v,start=a,end=b))
 performed_midi.instruments.append(track);performed_midi.write(str(out/'candidate.mid'))
 assert [n[0] for n in performed]==[n[0] for n in notes] and [n[2] for n in performed]==[n[2] for n in notes]
 report=dict(source=str(source),audition_start=9,audition_end=19,note_count=len(notes),extended_notes=sum(n[1]>b[1]+.001 for n,b in zip(performed,notes)),velocity_range=[min(velocities),max(velocities)],recreated_shared_gain=shared_gain,original_gain=original_gain,method='Keep current melody/attacks, extend source-supported ringing up to450ms without crossing same-key re-strikes; source-key picking strength controls sample velocity. No original layered into candidate. Source guitar is distorted; candidate intentionally clean.')
 (out/'notes.json').write_text(json.dumps(dict(before=notes,after=performed,velocities=velocities),indent=2),encoding='utf-8');(out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':main()
