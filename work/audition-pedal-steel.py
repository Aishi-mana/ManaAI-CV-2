from pathlib import Path
import json
import subprocess
import sys

import numpy as np
import soundfile as sf

root = Path.cwd()
sys.path[:0] = [str(root / 'scripts'), str(root / 'data/transcription-packages')]
import pretty_midi
from piano_arrangement import balance

base = root / 'work/country-band-audition'
score = json.loads((base / 'band/band-analysis.json').read_text())['score']
vocal, rate = sf.read(base / 'mana-vocal.wav', dtype='float32')
out = root / 'exports/singing/country-lead-comparison'
scratch = root / 'work/pedal-steel-audition'
scratch.mkdir(exist_ok=True)

midi = pretty_midi.PrettyMIDI()
guitar = pretty_midi.Instrument(27)
slides = []
for index, (start, end, pitch, strength) in enumerate(score['melody']):
    guitar.notes.append(pretty_midi.Note(round(52 + 46 * strength), pitch, start, end))
    if end - start < .19 or index % 3 == 2:
        continue
    previous = score['melody'][index-1] if index else None
    interval = pitch - previous[2] if previous and start - previous[1] < .18 else 1
    bend = -interval if abs(interval) in (1, 2) else -1
    duration = min(.145, (end-start)*.6)
    for step in range(17):
        progress = step/16
        value = int(np.clip(round(4096*bend*(1-progress)**2), -8192, 8191))
        guitar.pitch_bends.append(pretty_midi.PitchBend(value, start+duration*progress))
    slides.append((start, bend, duration))
assert slides
midi.instruments.append(guitar)
midi_file = scratch / 'steel-style.mid'
midi.write(str(midi_file))
synth = next((root / 'data/fluidsynth/runtime').rglob('fluidsynth.exe'))
bank = next((root / 'data/instrument-samples/LiveHQNatural').glob('*.sf2'))
raw = scratch / 'lead.wav'
subprocess.run([str(synth), '-ni', '-R', '0', '-C', '0', '-F', str(raw), '-r', str(rate), str(bank), str(midi_file)], check=True)
lead, lead_rate = sf.read(raw, always_2d=True)
assert lead_rate == rate
lead = np.pad(lead.mean(1)[:len(vocal)], (0, max(0, len(vocal)-len(lead))))
rms = lambda samples: np.sqrt(np.mean(samples**2))
lead *= min(.044 / max(rms(lead),1e-8), .95 / max(abs(lead).max(),1e-8))
assert rms(lead) > .001
rhythm = sum(sf.read(base / 'band' / (name+'.wav'))[0] for name in ('acoustic-guitar','bass','drums'))
backing = lead + rhythm
backing *= min(.07 / rms(backing), .95 / abs(backing).max())
mixed = balance(np.stack([vocal,vocal]), np.stack([backing,backing]))
assert mixed.shape == (2,16*rate) and np.isfinite(mixed).all()
sf.write(out / 'Pedal steel audition.wav', mixed.T, rate, subtype='PCM_16')
print(f'16-second comparison, {len(slides)} slides, identical source backing stems.')
