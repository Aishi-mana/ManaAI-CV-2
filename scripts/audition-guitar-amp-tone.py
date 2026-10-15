"""Approximate amp/speaker tone audition, preserving the existing guitar performance.
No measured cabinet IR, named amplifier emulation, or original-audio blending.
"""
import json,shutil
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfilt,resample_poly,firwin2,fftconvolve,welch
from scipy.ndimage import gaussian_filter1d
SR=24000
ROOT=Path('C:/AI/ManaAI-CV-2')

def apply_fir(audio,kernel):
 delay=(len(kernel)-1)//2
 return fftconvolve(audio,kernel,mode='full')[delay:delay+len(audio)]

def bright_amp(audio):
 # Oversampled low/mid drive; fixed input reference keeps quieter picks quieter.
 dry=sosfilt(butter(2,70,'highpass',fs=SR,output='sos'),audio)
 up=resample_poly(dry,4,1)
 x=up/.065
 pre=np.tanh(x*.65+.06)-np.tanh(.06)
 power=.85*pre+.15*np.tanh(pre*.55)/.55
 driven=resample_poly(power,1,4)[:len(audio)]
 # Synthetic speaker-like response; these are audition choices, not hardware specs.
 frequencies=np.array([0,50,90,160,400,900,1600,2600,3800,5500,7500,12000])
 db=np.array([-80,-18,-5,-2,-1,1,2.5,3,0,-7,-20,-60])
 kernel=firwin2(257,frequencies,10**(db/20),fs=SR)
 return apply_fir(driven,kernel)

def source_shaped(audio,original):
 frequencies,power=welch(audio,SR,nperseg=2048)
 _,reference=welch(original,SR,nperseg=2048)
 band=np.geomspace(80,7500,36)
 def envelope(values):
  return gaussian_filter1d(np.interp(band,frequencies,10*np.log10(np.maximum(values,1e-12))),2)
 current=envelope(power);target=envelope(reference)
 difference=target-current
 # Remove global volume difference; only broad, bounded timbre correction remains.
 difference=np.clip(difference-np.median(difference),-6,6)
 kernel=firwin2(257,np.r_[0,band,SR/2],10**(np.r_[0,difference,0]/20),fs=SR)
 return apply_fir(audio,kernel),difference.tolist()

def save(out,name,audio):
 assert audio.shape==(SR*10,) and np.isfinite(audio).all()
 rms=float(np.sqrt(np.mean(audio**2)));peak=float(np.max(np.abs(audio)))
 assert rms>1e-8
 gain=min(.065/rms,.9/max(peak,1e-9))
 sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
 return dict(name=name,gain=gain,rms=rms*gain,peak=peak*gain)

def main():
 base=ROOT/'exports/singing/guitar-patch-comparison-2026-10-15'
 out=ROOT/'exports/singing/guitar-amp-tone-2026-10-15';out.mkdir(exist_ok=True)
 clean,sr=sf.read(base/'green-clean.wav');original,original_sr=sf.read(base/'original-guitar.wav')
 assert sr==original_sr==SR and len(clean)==len(original)==SR*10
 assert np.max(np.abs(bright_amp(np.zeros(SR))))<1e-9
 impulse=np.zeros(1000);impulse[500]=1
 test=apply_fir(impulse,firwin2(257,[0,SR/2],[1,1],fs=SR))
 assert np.argmax(np.abs(test))==500 and len(test)==len(impulse)
 bright=bright_amp(clean);shaped,correction=source_shaped(bright,original)
 report=dict(audition_start=9,audition_end=19,patch='Green twang',performance='Same existing48-note longer-sustain performance; only audio processing changes.',outputs=[save(out,'bright-midgain',bright),save(out,'source-shaped-midgain',shaped)],broad_eq_db=correction,method='4x oversampled gentle asymmetric saturation, synthetic speaker EQ and optional bounded broad source-informed EQ. No measured IR or named amp recreation. FIR delay compensated, no original blended in.')
 shutil.copyfile(base/'original-guitar.wav',out/'original-guitar.wav')
 shutil.copyfile(base/'green-distorted.wav',out/'previous-distortion.wav')
 shutil.copyfile(base/'notes.json',out/'notes.json')
 assert json.loads((out/'notes.json').read_text(encoding='utf-8'))==json.loads((base/'notes.json').read_text(encoding='utf-8'))
 attribution=ROOT/'data/instrument-samples/SeparateLibraries/ATTRIBUTION.txt'
 if attribution.is_file():shutil.copyfile(attribution,out/'INSTRUMENT_ATTRIBUTION.txt')
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps({k:v for k,v in report.items() if k!='broad_eq_db'},indent=2))

if __name__=='__main__':main()
