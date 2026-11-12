"""Prepare disjoint source-level splits without modifying original recordings."""
from pathlib import Path
import hashlib, json, re, shutil, wave

root = Path(__file__).resolve().parents[1]
source = root / 'assets/voice/training-current'
out = root / 'data/custom-voice/mana-current-rvc-trial-v1'
heldout = {6, 15, 24, 33, 42}
rows = []
seen = set()
for path in sorted(source.glob('*.wav')):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest in seen:
        raise ValueError(f'Duplicate source: {path}')
    seen.add(digest)
    match = re.search(r'training-(\d+)', path.name)
    number = int(match.group(1)) if match else None
    split = 'holdout' if number in heldout else 'train'
    name = f'mana-{number:03}.wav' if number is not None else 'mana-approved-neutral.wav'
    target = out / split / name
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != digest:
        raise ValueError(f'Refusing to replace changed working copy: {target}')
    shutil.copy2(path, target)
    with wave.open(str(target), 'rb') as audio:
        seconds = audio.getnframes() / audio.getframerate()
    rows.append(dict(source=str(path), workingCopy=str(target), split=split,
                     seconds=seconds, sha256=digest))
manifest = dict(profile='mana-current-rvc-trial-v1', sources=rows,
                splitMethod='Whole recordings; holdout 006,015,024,033,042 never enter training/index.',
                trainSeconds=round(sum(r['seconds'] for r in rows if r['split']=='train'), 3),
                holdoutSeconds=round(sum(r['seconds'] for r in rows if r['split']=='holdout'), 3),
                trainingStarted=False, activeVoiceChanged=False, downloadsPerformed=False,
                status='prepared-runtime-repair-needed',
                runtimeFailures=['Applio Python missing copyreg',
                                 'After local stdlib/DLL workaround: torch.sparse.semi_structured missing'],
                plannedTrial=dict(sampleRate=40000, pitchExtractor='rmvpe', pretrained='HiFi-GAN 40k',
                                  initialEpochs=50, checkpointEvery=10,
                                  evaluation=['Held-out speech identity and clarity',
                                              'Same 12-second Country Roads passage, matched loudness']))
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
assert all(hashlib.sha256(Path(r['workingCopy']).read_bytes()).hexdigest()==r['sha256'] for r in rows)
print(json.dumps({k:v for k,v in manifest.items() if k!='sources'}, indent=2))
