from pathlib import Path
import soundfile as sf
p=Path('exports/singing/original-direction-preview-2026-10-18')
x,sr=sf.read(p/'original-song.wav',always_2d=True)
sf.write(p/'vocal-issue-24-30s.wav',x[24*sr:30*sr],sr,subtype='PCM_16')
print('Saved unchanged 24–30 second excerpt; reported issue at excerpt 0:03.')
