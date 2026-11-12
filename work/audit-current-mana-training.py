"""Read-only inventory; no model imports, downloads, or training."""
from pathlib import Path
import hashlib, json, wave

root = Path(__file__).resolve().parents[1]
rows = []
seen = set()
for path in sorted((root / 'assets/voice').glob('Mana v2*.wav')):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    with wave.open(str(path), 'rb') as audio:
        seconds = audio.getnframes() / audio.getframerate()
        row = dict(path=str(path), sha256=digest, seconds=seconds,
                   sampleRate=audio.getframerate(), channels=audio.getnchannels(),
                   duplicate=digest in seen, listeningApprovedForTraining=False)
    seen.add(digest)
    rows.append(row)
report = dict(sources=rows, uniqueSourceSeconds=sum(r['seconds'] for r in rows if not r['duplicate']),
              singingRecordings=0, trainingStarted=False, downloadsPerformed=False,
              decision='Do not train yet: short speech references only; identity and singing coverage require review.',
              excluded=['Legacy Kokoro/RVC training-pilot', 'Seed-VC converted covers',
                        'Duplicate references', 'Unverified generated speech'],
              installedTrainingAssets=dict(
                  runtime=Path('C:/AI/Applio/env/python.exe').exists(),
                  generator40k=Path('C:/AI/Applio/rvc/models/pretraineds/hifi-gan/f0G40k.pth').exists(),
                  discriminator40k=Path('C:/AI/Applio/rvc/models/pretraineds/hifi-gan/f0D40k.pth').exists(),
                  rmvpe=Path('C:/AI/Applio/rvc/models/predictors/rmvpe.pt').exists()))
out=root/'exports/singing/mana-training-readiness-20261101'
out.mkdir(parents=True, exist_ok=True)
(out/'audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
