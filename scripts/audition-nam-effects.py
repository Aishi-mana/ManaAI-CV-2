"""Separate restrained room, width and delay auditions on the real NAM tone."""
import json,shutil
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt
ROOT=Path('C:/AI/ManaAI-CV-2');SR=24000

def shift(audio,seconds):
 samples=round(seconds*SR);result=np.zeros_like(audio)
 if samples<len(audio):result[samples:]=audio[:-samples]
 return result

def room(audio):
 rng=np.random.default_rng(42);length=round(.28*SR);t=np.arange(length)/SR
 layers=[]
 for taps in [[(.011,.55),(.019,.38),(.031,.24)],[ (.014,.55),(.023,.38),(.037,.24)]]:
  impulse=rng.normal(0,.0025,length)*np.exp(-t/.055)
  impulse[:round(.012*SR)]=0
  for delay,gain in taps:impulse[round(delay*SR)]+=gain
  wet=sosfilt(butter(2,4500,'lowpass',fs=SR,output='sos'),fftconvolve(audio,impulse)[:len(audio)])
  layers.append(audio+wet*.10)
 return np.column_stack(layers)

def width(audio):
 # Dry center retained with two quiet decorrelated doubles.
 frames=np.arange(len(audio));t=frames/SR
 left=np.interp(frames-(.011+.0007*np.sin(2*np.pi*.3*t))*SR,frames,audio,left=0,right=0)
 right=np.interp(frames-(.018+.0007*np.sin(2*np.pi*.34*t+1.1))*SR,frames,audio,left=0,right=0)
 return np.column_stack((audio+left*.10,audio+right*.10))

def delay(audio):
 wet=sosfilt(butter(2,3800,'lowpass',fs=SR,output='sos'),shift(audio,.085))
 return np.column_stack((audio+wet*.09,audio+wet*.07+shift(wet,.085)*.018))

def main():
 base=ROOT/'exports/singing/guitar-nam-jcm800-2026-10-15'
 out=ROOT/'exports/singing/guitar-nam-effects-2026-10-15';out.mkdir(exist_ok=True)
 # User approved NAM generally; use normal-input capture as fixed comparison baseline.
 audio,sr=sf.read(base/'nam-normal-input.wav');assert sr==SR and audio.shape==(10*SR,)
 target=float(np.sqrt(np.mean(audio**2)));results=[]
 for name,processor in [('dry',lambda x:np.column_stack((x,x))),('small-room',room),('stereo-width',width),('short-delay',delay)]:
  assert not np.any(processor(np.zeros(1000)))
  processed=processor(audio);assert processed.shape==(10*SR,2) and np.isfinite(processed).all()
  rms=float(np.sqrt(np.mean(processed**2)));peak=float(np.max(np.abs(processed)))
  gain=min(target/max(rms,1e-9),.9/max(peak,1e-9))
  sf.write(out/(name+'.wav'),processed*gain,SR,subtype='PCM_16')
  results.append(dict(name=name,gain=gain,rms=rms*gain,peak=peak*gain))
 shutil.copyfile(base/'original-guitar.wav',out/'original-guitar.wav');shutil.copyfile(base/'notes.json',out/'notes.json')
 report=dict(source=str(base/'nam-normal-input.wav'),audition_start=9,audition_end=19,results=results,room='11–37ms early reflections plus short280ms decaying tail,10% wet',width='11/18ms doubles,±.7ms slow modulation,10% wet',delay='85ms darkened echo9%/7% wet plus a quiet170ms right echo',method='Separate subtle effects on fixed real NAM full-rig output. Dry center retained; stereo RMS matched, no original blended in. Tail cut at10s for comparison, not production export behavior.')
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':main()
