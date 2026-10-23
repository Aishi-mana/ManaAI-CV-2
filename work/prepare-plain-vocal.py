import json
from pathlib import Path
out=Path('exports/singing/original-plain-vocal-preview-2026-10-18').resolve();out.mkdir(exist_ok=True)
if (out/'result.json').exists():raise SystemExit('Existing result: reuse instead of regenerating')
p=dict(kind='original',title='Quiet evening · plain vocal test',prompt='A cozy, hopeful song about spending a quiet evening together.\nMood: Warm and hopeful.\nFeatured instruments: warm piano, fingerpicked guitar, soft strings.\nTempo: 92 BPM.\nSong structure: one short verse.',lyrics='[Verse]\nStay beside me in the light\nQuiet hearts will sing tonight\nLet the evening softly glow\nHere with you, I am home',style='gentle-piano',instrumental=False,duration=15,seed=42,previewOnly=True,output=str(out),result=str(out/'result.json'))
(out/'request.json').write_text(json.dumps(p,ensure_ascii=False,indent=2),encoding='utf-8')
