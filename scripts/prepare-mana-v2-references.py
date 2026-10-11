from pathlib import Path
import json,hashlib
import soundfile as sf
root=Path(__file__).resolve().parents[1]
out=root/'data/custom-voice/references/mana-v2';out.mkdir(parents=True,exist_ok=True)
report=json.loads((root/'exports/mana-v2-voice-review/report.json').read_text())
texts={
'default':'Once upon a time, in a faraway kingdom, a brave knight set out on a quest to rescue the lost princess.',
'gentle':'Take a deep breath. Everything is going to be just fine. The stars are out tonight and you are completely safe.'
}
rows=[]
for r in report:
    style=r['intendedEmotion'];source=Path(r['file']);audio,sr=sf.read(source)
    end={'default':6.5,'gentle':6.85}.get(style,len(audio)/sr)
    target=out/(style+'.wav');sf.write(target,audio[:round(end*sr)],sr,subtype='PCM_16')
    rows.append(dict(style=style,file=str(target),source=str(source),seconds=end,text=texts.get(style,r['draftEnglish']),language='en',transcriptVerified=False,sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
(out/'manifest.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows,indent=2))
