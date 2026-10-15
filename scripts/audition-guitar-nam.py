"""Real NAM full-rig audition; original-performance MIDI and source files untouched."""
import json,subprocess,hashlib,shutil
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
ROOT=Path('C:/AI/ManaAI-CV-2')

def main():
 model=ROOT/'data/nam/models/jcm800-cab.nam'
 renderer=ROOT/'data/nam/build/tools/Release/render.exe'
 data=json.loads(model.read_text(encoding='utf-8'));rate=int(data.get('sample_rate',48000))
 assert rate==48000 and data.get('metadata',{}).get('gear_type')=='full-rig'
 source=ROOT/'exports/singing/guitar-patch-comparison-2026-10-15/green-clean.wav'
 audio,sr=sf.read(source);assert sr==24000 and audio.shape==(240000,)
 clean=resample_poly(audio,2,1)
 out=ROOT/'exports/singing/guitar-nam-jcm800-2026-10-15';out.mkdir(exist_ok=True)
 results=[];padding=rate//2
 for name,input_db in [('nam-lighter-input',-6),('nam-normal-input',0)]:
  input_audio=np.pad(clean*10**(input_db/20),(padding,padding))
  input_path=out/(name+'-input.wav');raw_path=out/(name+'-raw.wav')
  sf.write(input_path,input_audio,rate,subtype='PCM_16')
  job=subprocess.run([str(renderer),str(model),str(input_path),str(raw_path)],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
  (out/(name+'-renderer.log')).write_text(job.stdout+job.stderr,encoding='utf-8')
  if job.returncode:raise RuntimeError(job.stderr[-1500:])
  processed,output_rate=sf.read(raw_path)
  assert output_rate==rate and processed.shape==input_audio.shape and np.isfinite(processed).all()
  segment=processed[padding:padding+len(clean)]
  segment=resample_poly(segment,1,2)
  rms=float(np.sqrt(np.mean(segment**2)));peak=float(np.max(np.abs(segment)))
  assert len(segment)==240000 and rms>1e-7
  gain=min(.065/rms,.9/max(peak,1e-9))
  sf.write(out/(name+'.wav'),segment*gain,24000,subtype='PCM_16')
  results.append(dict(name=name,input_db=input_db,input_rms=float(np.sqrt(np.mean((clean*10**(input_db/20))**2))),output_gain=gain,output_rms=rms*gain,output_peak=peak*gain))
 reference=ROOT/'exports/singing/guitar-amp-tone-2026-10-15'
 shutil.copyfile(reference/'original-guitar.wav',out/'original-guitar.wav')
 shutil.copyfile(reference/'source-shaped-midgain.wav',out/'previous-source-shaped.wav')
 shutil.copyfile(reference/'notes.json',out/'notes.json')
 report=dict(seconds=10,audition_start=9,audition_end=19,model=str(model),model_sha256=hashlib.sha256(model.read_bytes()).hexdigest(),metadata=data.get('metadata'),sample_rate=rate,results=results,method='Clean Green sample performance through real NAM Marshall JCM800 amp+cab capture by honkkis, A2 at48k. No extra distortion/cab/chorus/delay/EQ or original blend. Fixed performance, input-level comparison, output RMS matched. Padded silence excluded from exports.')
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(report,indent=2))

if __name__=='__main__':main()
