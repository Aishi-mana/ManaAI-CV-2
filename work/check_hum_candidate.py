from pathlib import Path
import soundfile as sf,numpy as np,json,hashlib
root=Path.cwd();old=root/'exports/singing/musical-moments/soft-hum.wav';candidate=root/'exports/singing/humming-connected-audition/soft-hum-connected.wav'
a,ar=sf.read(old);b,br=sf.read(candidate)
assert np.isfinite(b).all() and np.sqrt(np.mean(b*b))>.001
before=float(np.sqrt(np.mean(b*b)));target=float(np.sqrt(np.mean(a*a)));gain=min(target/before,.95/max(abs(b).max(),.001));b*=gain;sf.write(candidate,b,br,subtype='PCM_16')
report={'originalHash':hashlib.sha256(old.read_bytes()).hexdigest(),'originalSeconds':len(a)/ar,'candidateSeconds':len(b)/br,'originalRms':target,'candidateRms':float(np.sqrt(np.mean(b*b))),'candidatePeak':float(abs(b).max()),'gainForLevelComparison':gain,'listeningApproved':False}
(candidate.parent/'comparison.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
