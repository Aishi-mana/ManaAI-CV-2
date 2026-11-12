from pathlib import Path
root=Path(__file__).resolve().parents[1]
def edit(path,old,new):
 p=root/path;s=p.read_text(encoding='utf-8');assert old in s,(path,old[:90]);p.write_text(s.replace(old,new),encoding='utf-8')
p=root/'scripts/arrangement_replacement.py';s=p.read_text();a=s.index('def render_piano_preserving(');b=s.index('\ndef prepare_source_holds',a)
s=s[:a]+'''def render_piano_preserving(path,seconds,root,patch_name=None,custom=None):
 from piano_transcription import transcribe,midi_for
 notes=transcribe(path,seconds,root)
 custom=validate_custom(custom);shift=int(custom.get('pitch',0))
 notes=customize_notes(notes,seconds,custom.get('extension',0))
 audio=render_separate(notes,seconds,root,'piano',shift,None,patch_name,midi_velocities=[max(1,round(n[3]*127)) for n in notes])
 return audio,midi_for(notes,0,shift),notes

'''+s[b:]
a=s.index(' packages=root/\'data/transcription-packages\'',s.index('def render('));b=s.index(" if instrument=='electric-piano':",a)
block=s[a:b]
s=s[:a]+''' from piano_transcription import PIANO_SOURCES
 if source_name in PIANO_SOURCES:
  from piano_transcription import transcribe
  notes=transcribe(guitar_path,seconds,root)
  guitar,_=librosa.load(guitar_path,sr=SR,duration=seconds)
 else:
'''+''.join(' '+line if line.strip() else line for line in block.splitlines(keepends=True))+s[b:]
s=s.replace(" if instrument=='electric-piano':\n  from electric_piano_replacement", " if instrument=='electric-piano' and source_name not in PIANO_SOURCES:\n  from electric_piano_replacement")
s=s.replace(' string_velocities=None\n'," string_velocities=[max(1,round(n[3]*127)) for n in notes] if source_name in PIANO_SOURCES else None\n")
p.write_text(s,encoding='utf-8')
edit('scripts/optional_separators.py',"['keyboard-extract','electric-piano-extract','trumpet-extract']","['keyboard-extract','electric-piano-extract','trumpet-extract','piano-mega']")
edit('scripts/optional_separators.py',"'trumpet-extract':'trumpet'}[kind]","'trumpet-extract':'trumpet','piano-mega':'piano'}[kind]")
edit('scripts/optional_separators.py',"samples=extract(source,root,kind)","samples=extract(source,root,'piano-mega' if kind=='piano-extract' else kind)")
edit('scripts/optional_separators.py',"'piano-extract':'piano-banquet'","'piano-extract':'piano'")
edit('scripts/cover_genre.py','def restyle_backing(backing, sample_rate, genre, output):','def restyle_backing(backing, sample_rate, genre, output, root=None, percussion=False):')
edit('scripts/cover_genre.py'," request=genre_request(genre,backing.shape[1]/sample_rate)",''' if genre=='jazz':
  from piano_arrangement import arrange
  audio,metadata=arrange(backing,sample_rate,root or Path(__file__).resolve().parents[1],out,percussion)
  g=math.gcd(24000,sample_rate);audio=resample_poly(audio,sample_rate//g,24000//g)
  audio=np.pad(audio[:backing.shape[1]],(0,max(0,backing.shape[1]-len(audio))))
  target=out/'restyled-backing.wav';sf.write(target,audio,sample_rate,subtype='FLOAT')
  sf.write(out/'original-backing.wav',backing.T,sample_rate,subtype='FLOAT')
  return np.stack([audio,audio]),dict(metadata,genre=genre,instrumental=str(target))
 request=genre_request(genre,backing.shape[1]/sample_rate)''')
edit('scripts/singing_job.py',"    if genre!='original' and audio.shape[-1]>180*sr:","    if genre=='jazz' and audio.shape[-1]>60*sr:\n        raise ValueError('Piano trio supports up to 60 seconds. Choose a shorter excerpt.')\n    if genre!='original' and audio.shape[-1]>180*sr:")
edit('scripts/singing_job.py','restyle_backing(backing,sr,genre,out)','restyle_backing(backing,sr,genre,out,root,percussion=p.get(\'percussion\',False))')
edit('scripts/singing_job.py',"        mixed = converted[:length, :2] + backing[:, :length].T * gain",'''        if genre=='jazz':
            from piano_arrangement import balance
            mixed=balance(converted[:length,:2],backing[:,:length].T,gain)
        else:
            mixed = converted[:length, :2] + backing[:, :length].T * gain''')
edit('scripts/arrangement_job.py',"'fine-stems','piano','gentle-piano'","'fine-stems','piano-trio','piano','gentle-piano'")
edit('scripts/arrangement_job.py',"    if np.sqrt(np.mean(original**2))<.001:",'''    if style=='piano-trio':
        from piano_arrangement import arrange,balance
        backing,analysis=arrange(original,SR,data_root,out/'piano-trio',p.get('percussion',False))
        mixed=balance(vocal,backing)
        for name,data in [('mana-vocal',vocal),('instrumental',backing),('arrangement-mix',mixed)]:sf.write(out/(name+'.wav'),data,SR,subtype='PCM_16')
        return dict(vocal=str(out/'mana-vocal.wav'),mix=str(out/'arrangement-mix.wav'),seconds=size/SR)
    if np.sqrt(np.mean(original**2))<.001:''')
