"""Explicit note edits: sample rendering only, never transcription."""
import math
PROGRAMS={'piano':0,'sax':65,'acoustic-guitar':25,'electric-guitar':27,'finger-bass':33,'strings':48,'flute':73,'trumpet':56,'harmonica':22,'electric-piano':4,'synth-pad':89,'drums-standard':0,'drums-rock':16}
def validate_notes(notes,seconds):
 if not isinstance(notes,list) or len(notes)>4096:raise ValueError('Use at most 4096 edited notes.')
 result=[]
 for row in notes:
  if not isinstance(row,list) or len(row)!=4 or any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) for x in row):raise ValueError('Use finite note start/end/pitch/strength values.')
  a,b,p,v=row
  if not 0<=a<b<=seconds or int(p)!=p or not 0<=p<=127 or not 0<=v<=1:raise ValueError('Edited notes must fit the section with pitch0–127 and strength0–1.')
  result.append([float(a),float(b),int(p),float(v)])
 return result

def render_edited_notes(notes,seconds,root,instrument):
 notes=validate_notes(notes,seconds)
 if instrument not in PROGRAMS:raise ValueError('Choose a supported note preview instrument.')
 import sys,numpy as np
 sys.path.insert(0,str(root/'data/transcription-packages'))
 import pretty_midi
 from arrangement_replacement import render_soundfont,SR
 played=[n for n in notes if n[3]>0]
 audio=render_soundfont(played,seconds,root,PROGRAMS[instrument],0,percussion=instrument.startswith('drums-'),midi_velocities=[max(1,round(n[3]*127)) for n in played]) if played else np.zeros(round(seconds*SR))
 midi=pretty_midi.PrettyMIDI();track=pretty_midi.Instrument(program=PROGRAMS[instrument],is_drum=instrument.startswith('drums-'))
 for a,b,p,v in played:track.notes.append(pretty_midi.Note(velocity=max(1,round(v*127)),pitch=p,start=a,end=b))
 midi.instruments.append(track)
 return audio,midi,notes
