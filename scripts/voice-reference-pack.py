"""Build review-only 7–9 second references with provenance and level matching."""
from pathlib import Path
import json, shutil, hashlib
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
review = root / 'exports/voice-review'
out = review / 'references-8s'
out.mkdir(parents=True, exist_ok=True)
original = Path(r'C:\Users\Admin\Downloads\Yuuki Voice')
rows = []


def metrics(path):
    y, sr = sf.read(path, always_2d=True)
    return {'seconds': round(len(y) / sr, 3), 'sampleRate': sr,
            'channels': y.shape[1], 'peak': round(float(np.max(np.abs(y))), 5),
            'rms': round(float(np.sqrt(np.mean(y*y))), 5),
            'clippedFraction': float(np.mean(np.abs(y) > .999))}


def save_level_matched(path, y, sr):
    rms = float(np.sqrt(np.mean(y*y)))
    peak = float(np.max(np.abs(y)))
    if not np.isfinite(y).all() or rms < .001:
        raise ValueError('Candidate is invalid or nearly silent')
    gain = min(.1 / rms, .95 / peak)
    sf.write(path, y * gain, sr, subtype='PCM_16')
    return round(gain, 5)


def source_record(path, **details):
    return {'file': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), **details}


baseline = Path('C:/AI/GPT-SoVITS/main_reference.wav')
shutil.copy2(baseline, out / 'default-previous-reference.wav')
source = next(original.glob('Fight!*'))
y, sr = sf.read(source, always_2d=True)
y = y[:round(8.136 * sr)]
dest = out / 'default.wav'
gain = save_level_matched(dest, y, sr)
rows.append({'style': 'default', 'file': str(dest),
             'construction': 'One continuous excerpt rebuilt from original MP3 of baseline phrase',
             'sources': [source_record(source, start=0, end=8.136)],
             'draftTranscript': 'チームプレイは得意な方だよ。信頼できるみんなと一緒に何かをするのってすごく楽しいしね。',
             'transcriptStatus': 'Japanese-script rendition of user-confirmed romanized text; verify boundaries/wording',
             'styleApproval': 'Baseline style approved; rebuilt source candidate needs comparison',
             'cleanup': 'No separation or denoising; level matched without clipping',
             'gainApplied': gain, 'originalComparisonFile': str(out / 'default-previous-reference.wav'),
             **metrics(dest)})

candidates = {r['id']: r for r in json.loads((review / 'longer/candidate-transcripts.json').read_text(encoding='utf-8'))}
regions = {r['id']: r for r in json.loads((review / 'longer/regions.json').read_text(encoding='utf-8'))}
for style, cid in [('cheerful', 'bike-middle-2.38-10.06'), ('thoughtful', 'bike-later-11.96-20.06')]:
    c = candidates[cid]
    src = Path(c['file'])
    dest = out / f'{style}.wav'
    y, sr = sf.read(src, always_2d=True)
    gain = save_level_matched(dest, y, sr)
    rows.append({'style': style, 'file': str(dest),
                 'construction': 'One continuous excerpt from original recording',
                 'sources': [source_record(Path(c['source']), start=round(c['sourceOffset'], 2), end=round(c['sourceOffset'] + c['seconds'], 2))],
                 'draftTranscript': c['draftJapanese'], 'transcriptStatus': 'Automatic Japanese ASR, unverified',
                 'styleApproval': 'Short style audition approved; longer excerpt needs comparison',
                 'cleanup': 'Demucs vocal separation plus safe level match; no pitch shift or additional denoising',
                 'gainApplied': gain, 'originalComparisonFile': str(out / f'{style}-original.wav'),
                 **metrics(dest)})
    region = regions[c['region']]
    y, sr = sf.read(review / 'longer' / f'{c["region"]}-original.wav', always_2d=True)
    sf.write(out / f'{style}-original.wav', y[round(c['start'] * sr):round(c['end'] * sr)], sr, subtype='PCM_16')

ids = [14, 268, 48, 107, 155, 159]
parts, sources = [], []
drafts = {r['filename']: r['draftJapanese'] for r in json.loads((review / 'clip-transcripts.json').read_text(encoding='utf-8'))}
for n in ids:
    path = original / 'yuuki_voice_lines_wav' / f'yuuki_line_{n:03d}.wav'
    y, sr = sf.read(path, always_2d=True)
    if parts:
        parts.append(np.zeros((round(.25 * sr), y.shape[1])))
    parts.append(y)
    sources.append(source_record(path))
dest = out / 'gentle.wav'
gain = save_level_matched(dest, np.concatenate(parts), sr)
rows.append({'style': 'gentle', 'file': str(dest),
             'construction': 'Six complete caring phrases with 250 ms gaps; not a continuous recording',
             'sources': sources,
             'draftTranscript': ' '.join(drafts[Path(s['file']).name] for s in sources),
             'transcriptStatus': 'Automatic Japanese ASR, unverified',
             'styleApproval': 'Core two phrases approved; additions need comparison',
             'cleanup': 'Safe level matching only; source WAVs were already approximately normalized',
             'gainApplied': gain, **metrics(dest)})
for row in rows:
    assert 7 <= row['seconds'] <= 9
    assert row['clippedFraction'] == 0 and row['peak'] <= .9501
    for src in row['sources']:
        assert hashlib.sha256(Path(src['file']).read_bytes()).hexdigest() == src['sha256']
metadata = {'references': rows, 'previousBaseline': metrics(baseline),
            'activeSettingsChanged': False, 'referenceLanguageRequired': 'ja',
            'replyLanguageIndependent': True, 'speakerIdentityVerified': False}
(out / 'manifest.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
report = ['# Longer Mana reference candidates', '',
          'The short style auditions and around-eight-second target were approved. These longer candidates are review copies; active settings remain unchanged. Emotional labels, speaker consistency, exact boundaries and ASR transcripts still require comparison/listening.', '',
          '| Style | Duration | Construction |', '|---|---:|---|']
for row in rows:
    report.append(f'| {row["style"]} | {row["seconds"]} s | {row["construction"]} |')
report += ['', 'The existing baseline WAV has about 3.86% of samples above 0.999, consistent with clipping. Lowering that WAV cannot recover the lost peaks. The new default was rebuilt from the original MP3 of the same phrase, which has no such clipped samples. The old WAV remains available for comparison and stays active in Mana.', '',
           'Reference candidates are level matched toward RMS 0.1, with a peak cap of 0.95, so loudness differences do not dominate comparison. No pitch shift or time stretching was used. MP3 detail cannot be restored merely by converting to WAV.', '',
           'Cheerful/thoughtful have vocal separation; compare against their originals for consonant/breath loss or residual sound. Gentle remains a small phrase assembly because a confidently gentle continuous excerpt was not established. Do not merge the whole category.', '',
           'Japanese reference-language control remains pending; the integration currently hardcodes English. Verify Japanese transcripts before TTS comparison.']
for row in rows:
    report += ['', f'## {row["style"].capitalize()}',
               f'![{row["style"]}]({row["file"].replace(chr(92), "/")})', '',
               f'Draft transcript: {row["draftTranscript"]}',
               f'Processing: {row["cleanup"]}.']
    if row.get('originalComparisonFile'):
        report += ['', f'[Original/baseline comparison]({row["originalComparisonFile"].replace(chr(92), "/")})']
report += ['', 'Source provenance, exact excerpts and measurements are in manifest.json. All inputs are unchanged; no audio upload or runtime preset installation occurred.']
(out / 'REVIEW.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('Prepared:', [(r['style'], r['seconds'], r['peak']) for r in rows])
print('Source hashes unchanged; candidate duration and peak bounds passed.')
