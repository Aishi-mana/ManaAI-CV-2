from pathlib import Path
import soundfile as sf
import numpy as np
p=Path('exports/singing/original-word-clarity-ab-2026-10-18');a,sr=sf.read(p/'A-current/original-song.wav');b,_=sf.read(p/'B-stronger-lyrics/original-song.wav');print('Identical audio:',np.array_equal(a,b));print('Difference RMS:',float(np.sqrt(np.mean((a-b)**2))))
