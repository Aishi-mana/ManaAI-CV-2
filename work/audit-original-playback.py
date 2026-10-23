from pathlib import Path
import hashlib,json,wave
p=Path('exports/singing/original-direction-preview-2026-10-18')
raw=p/'ace-request00.wav';saved=p/'original-song.wav'
with wave.open(str(raw),'rb') as f:info={'sample_rate':f.getframerate(),'channels':f.getnchannels(),'seconds':f.getnframes()/f.getframerate()}
info['raw_equals_saved']=hashlib.sha256(raw.read_bytes()).digest()==hashlib.sha256(saved.read_bytes()).digest()
print(json.dumps(info))
