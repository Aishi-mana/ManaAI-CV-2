"""Subtle effects on the selected source-shaped tone; no transcription changes."""
import json,shutil
from pathlib import Path
import numpy as np
import soundfile as sf
ROOT=Path('C:/AI/ManaAI-CV-2');SR=24000

def delayed(audio,seconds):
 shift=round(seconds*SR);result=np.zeros_like(audio)
 if shift<len(audio):result[shift:]=audio[:-shift]
 return result

def chorus(audio):
 frames=np.arange(len(audio));time=frames/SR
 left=np.interp(frames-(.012+.002*np.sin(2*np.pi*.6*time))*SR,frames,audio,left=0,right=0)
 right=np.interp(frames-(.017+.002*np.sin(2*np.pi*.6*time+np.pi/2))*SR,frames,audio,left=0,right=0)
 # Center remains dry; low-level independently modulated layers provide width.
 return np.column_stack((audio+left*.12,audio+right*.12))

def short_delay(audio):
 first=delayed(audio,.075);second=delayed(audio,.15)
 return np.column_stack((audio+first*.10+second*.025,audio+first*.075+second*.025))

def save(out,name,audio,target):
 assert audio.shape==(10*SR,2) and np.isfinite(audio).all()
 rms=float(np.sqrt(np.mean(audio**2)));peak=float(np.max(np.abs(audio)))
 gain=min(target/max(rms,1e-9),.9/max(peak,1e-9))
 sf.write(out/(name+'.wav'),audio*gain,SR,subtype='PCM_16')
 return dict(name=name,gain=gain,rms=rms*gain,peak=peak*gain)

def main():
 base=ROOT/'exports/singing/guitar-amp-tone-2026-10-15'
 out=ROOT/'exports/singing/guitar-effects-2026-10-15';out.mkdir(exist_ok=True)
 audio,sr=sf.read(base/'source-shaped-midgain.wav');assert sr==SR and audio.shape==(SR*10,)
 silence=np.zeros(SR);assert not np.any(chorus(silence)) and not np.any(short_delay(silence))
 impulse=np.zeros(SR);impulse[1000]=1;assert delayed(impulse,.075).argmax()==1000+1800
 target=float(np.sqrt(np.mean(audio**2)))
 results=[save(out,'source-shaped-dry',np.column_stack((audio,audio)),target),save(out,'subtle-chorus-doubling',chorus(audio),target),save(out,'subtle-short-delay',short_delay(audio),target)]
 shutil.copyfile(base/'original-guitar.wav',out/'original-guitar.wav');shutil.copyfile(base/'notes.json',out/'notes.json')
 (out/'report.json').write_text(json.dumps(dict(audition_start=9,audition_end=19,source=str(base/'source-shaped-midgain.wav'),results=results,chorus=dict(left_delay_ms=12,right_delay_ms=17,depth_ms=2,rate_hz=.6,wet_gain=.12),short_delay=dict(first_ms=75,second_ms=150,first_gain_left=.10,first_gain_right=.075,second_gain=.025),method='Unchanged dry source-shaped performance; two separate subtle stereo-effect auditions, RMS matched to dry. No original blended in or claims of identifying original effects; output stays10s and tails at end are trimmed.'),indent=2),encoding='utf-8')
 print(json.dumps(results,indent=2))

if __name__=='__main__':main()
