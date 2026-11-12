"""Prepare and remix the five aligned band preview parts."""
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

PARTS = ('vocal', 'lead', 'accompaniment', 'bass', 'drums')


def limit(audio):
    return min(1., .95 / max(float(np.max(np.abs(audio))), 1e-9))


def prepare(vocal, backing, rate, source, output, backing_gain=1.):
    from scipy.signal import resample_poly
    from piano_arrangement import balance_gains

    source, output = Path(source), Path(output) / 'band-mix-parts'
    output.mkdir(exist_ok=True)
    frames = len(vocal)
    tracks = {}
    for path in sorted(source.glob('*.wav')):
        if path.stem not in ('lead', 'bass', 'drums', 'piano', 'keys', 'pad', 'acoustic-guitar'):
            continue
        mono, sr = sf.read(path, dtype='float32')
        divisor = math.gcd(rate, sr)
        mono = resample_poly(mono, rate // divisor, sr // divisor)
        mono = np.pad(mono[:frames], (0, max(0, frames-len(mono))))
        tracks[path.stem] = mono
    lead, bass, drums = (tracks.pop(name) for name in ('lead', 'bass', 'drums'))
    accompaniment = sum(tracks.values(), np.zeros(frames, dtype='float32'))
    raw = lead + accompaniment + bass + drums
    rms = lambda x: float(np.sqrt(np.mean(x*x)))
    scale = rms(backing) / max(rms(raw), 1e-9)
    voice_gain, mix_gain = balance_gains(vocal, backing, backing_gain)
    # Keep faders useful even when the initial backing was set to zero.
    parts = {'vocal': vocal * voice_gain * mix_gain}
    for name, data in zip(PARTS[1:], (lead, accompaniment, bass, drums)):
        parts[name] = data * scale * mix_gain
    manifest = []
    for name, data in parts.items():
        path = output / f'{name}.wav'
        sf.write(path, data, rate, subtype='FLOAT')
        manifest.append(dict(name=name, path=str(path), gain=1. if name=='vocal' else backing_gain, available=bool(np.any(data))))
    return manifest


def remix(paths, gains, output):
    rate = frames = None
    vocal = None
    backing = None
    for name, path, gain in zip(PARTS, paths, gains):
        info = sf.info(path)
        if not 0 < info.duration <= 361 or info.channels not in (1, 2):
            raise ValueError('Choose aligned band preview tracks.')
        data, sr = sf.read(path, always_2d=True, dtype='float32')
        if rate is None:
            rate, frames = sr, len(data)
            backing = np.zeros((frames, 2), dtype='float32')
        if rate != sr or frames != len(data) or not np.isfinite(data).all():
            raise ValueError('Band preview tracks are not aligned.')
        if name=='vocal':
            vocal = np.broadcast_to(data, backing.shape) * gain
        else:
            backing += data * gain
    mixed = vocal + backing
    scale = min(limit(mixed), limit(vocal), limit(backing))
    result = {}
    for name, data in [('mix', mixed), ('vocal', vocal), ('instrumental', backing)]:
        path = output / f'{name}.wav'
        sf.write(path, data * scale, rate, subtype='PCM_16')
        result[name] = str(path)
    return result


if __name__ == '__main__':
    request = json.load(sys.stdin)
    print(json.dumps(remix(request['paths'], request['gains'], Path(request['output']))))
