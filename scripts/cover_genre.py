"""Source-guided accompaniment restyling; never sends the singer to ACE-Step."""
from pathlib import Path
import json, subprocess, math, os

GENRES={
 'rock':'Rock band arrangement, electric rhythm guitar, electric bass, acoustic drum kit, energetic rock groove.',
 'jazz':'Jazz combo arrangement, acoustic piano, upright walking bass, brushed jazz drums, warm intimate jazz sound.',
 'pop':'Modern pop arrangement, bright keyboards, electric bass, tight pop drums, polished melodic pop production.',
}

def genre_request(genre, duration):
 if genre not in GENRES: raise ValueError('Choose Original, Rock, Jazz or Pop backing.')
 if not math.isfinite(duration) or not 1<=duration<=180: raise ValueError('Genre remix supports source sections up to 180 seconds. Use an excerpt for longer songs.')
 return dict(task_type='cover-nofsq',caption=GENRES[genre]+' Instrumental only, no singing or spoken voices. Preserve the source song structure, tempo and phrase timing.',
             lyrics='[Instrumental]',duration=duration,seed=42,synth_model='acestep-v15-base-Q8_0.gguf',
             audio_cover_strength=.5,inference_steps=50,guidance_scale=1.0,output_format='wav16')

def restyle_backing(backing, sample_rate, genre, output, root=None, percussion=False, lead=None, source='guitar',vocal=None, follow_bass=False):
 import numpy as np
 import soundfile as sf
 from scipy.signal import resample_poly
 out=Path(output).resolve()/'genre-remix';out.mkdir(parents=True,exist_ok=True)
 if genre in ('rock','jazz','pop','country'):
  from source_band import arrange
  audio,metadata=arrange(backing,sample_rate,genre,lead,root or Path(__file__).resolve().parents[1],out,source=source,vocal=vocal,follow_bass=follow_bass)
  target=out/'restyled-backing.wav';sf.write(target,audio.T,sample_rate,subtype='FLOAT')
  return audio,dict(metadata,instrumental=str(target))
 if genre=='guitar-electric':
  from guitar_arrangement import arrange
  audio,metadata=arrange(backing,sample_rate,root or Path(__file__).resolve().parents[1],out)
  target=out/'restyled-backing.wav';sf.write(target,audio.T,sample_rate,subtype='FLOAT')
  return audio,dict(metadata,genre=genre,instrumental=str(target))
 if genre=='piano-trio':
  from piano_arrangement import arrange
  audio,metadata=arrange(backing,sample_rate,root or Path(__file__).resolve().parents[1],out,percussion)
  g=math.gcd(24000,sample_rate);audio=resample_poly(audio,sample_rate//g,24000//g)
  audio=np.pad(audio[:backing.shape[1]],(0,max(0,backing.shape[1]-len(audio))))
  target=out/'restyled-backing.wav';sf.write(target,audio,sample_rate,subtype='FLOAT')
  sf.write(out/'original-backing.wav',backing.T,sample_rate,subtype='FLOAT')
  return np.stack([audio,audio]),dict(metadata,genre=genre,instrumental=str(target))
 raise ValueError('Choose a supported backing style.')
