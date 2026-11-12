"""Isolated 10-second source-guided audition; no library or app changes."""
exec(compile(open('work/check-jasco-load.py',encoding='utf-8').read(),'work/check-jasco-load.py','exec'))
import numpy as np, soundfile as sf, time
out=root/'exports/singing/jasco-country-rock-20261108'
guide=json.loads((out/'guidance.json').read_text(encoding='utf-8'))
drums,sr=sf.read(out/'Source drums.wav',always_2d=True)
melody=np.load(out/'melody.npy')
assert melody.shape==(53,500) and 0.1<guide['melody_voiced_fraction']<1
use_drums=guide['drums_rms']>.001
assert all(chord in model.chords_mapping for chord,_ in guide['chords'])
torch.manual_seed(1234)
model.set_generation_params(cfg_coef_all=1.5,cfg_coef_txt=2.5,euler=True,euler_steps=50)
caption='Instrumental rock band, crunchy distorted electric rhythm guitar, electric bass, energetic acoustic drums and snare backbeat. Tight steady groove. No vocals.'
print('Generating source-guided Rock, 50 Euler steps',flush=True)
t=time.monotonic()
with torch.inference_mode():
    audio=model.generate_music(descriptions=[caption],drums_wav=torch.from_numpy(drums.T.astype(np.float32)) if use_drums else None,
        drums_sample_rate=sr,chords=[tuple(x) for x in guide['chords']],
        melody_salience_matrix=torch.from_numpy(melody),progress=True)
a=audio[0].float().cpu().numpy().T
assert np.isfinite(a).all() and a.shape[0]==320000
sf.write(out/'JASCO Rock raw.wav',a,32000,subtype='FLOAT')
def match(x):
    return x*min(.95/max(float(np.max(np.abs(x))),1e-8),.07/max(float(np.sqrt(np.mean(x*x))),1e-8))
sf.write(out/'JASCO Rock.wav',match(a),32000)
b,br=sf.read(out/'Original backing.wav');sf.write(out/'Original backing matched.wav',match(b),br)
report={'caption':caption,'seconds':len(a)/32000,'elapsed_seconds':time.monotonic()-t,
    'raw_peak':float(np.abs(a).max()),'raw_rms':float(np.sqrt(np.mean(a*a))),
    'original_backing_overlaid':False,'chords_are_unverified_estimates':True,'drum_guidance_used':use_drums,
    'source_guides':guide,'settings':model.generation_params}
(out/'render-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
