import wave,json
from pathlib import Path
for folder,name in [('original-generator-audition','request00.wav'),('original-lyrical-production-check','original-song.wav'),('original-full-production-check','original-song.wav')]:
 p=Path('exports/singing')/folder/name
 with wave.open(str(p),'rb') as f: print(json.dumps({'path':str(p),'seconds':f.getnframes()/f.getframerate(),'sample_rate':f.getframerate(),'channels':f.getnchannels()}))
