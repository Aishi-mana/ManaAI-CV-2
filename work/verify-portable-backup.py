from pathlib import Path
import hashlib, importlib.util, json, tempfile, zipfile
spec=importlib.util.spec_from_file_location('portable',Path('scripts/portable_backup.py'))
portable=importlib.util.module_from_spec(spec)
spec.loader.exec_module(portable)
with tempfile.TemporaryDirectory(dir='work') as scratch:
 root=Path(scratch).resolve()
 source=root/'source'; gallery=root/'gallery-source'; gallery.mkdir()
 music=source/'exports/singing/one';music.mkdir(parents=True)
 (music/'mix.wav').write_bytes(b'fixture audio')
 (gallery/'photo-1.jpg').write_bytes(b'fixture picture')
 model=root/'selected.gguf';model.write_bytes(b'fixture model')
 data={'format':'mana-backup','version':1,'data':{'mana.settings.v1':{'modelPath':str(model)},'mana.images.v1':[{'diskId':'photo-1'}],'draft':{'mix':str(music/'mix.wav')}}}
 archive=root/'bundle.zip'
 assert portable.export(archive,json.dumps(data),source,gallery,True)=={'files':3,'missing':0}
 target=root/'target'; new_gallery=root/'gallery-target'
 with zipfile.ZipFile(archive) as opened:
  payload=json.loads(portable.metadata_bytes(opened))
  model_name=hashlib.sha256(model.read_bytes()).hexdigest()+'.gguf'
  assert Path(payload['data']['mana.settings.v1']['modelPath']).name==model_name
  assert portable.restore(opened,target,new_gallery)=={'files':3}
  assert portable.restore(opened,target,new_gallery)=={'files':0}
  restored=target/'exports/singing/one/mix.wav'
  assert restored.read_bytes()==b'fixture audio' and (new_gallery/'photo-1.jpg').read_bytes()==b'fixture picture'
  assert (target/'data/portable-models'/model_name).read_bytes()==b'fixture model'
  restored.write_bytes(b'conflicting contents')
  try:portable.restore(opened,target,new_gallery)
  except ValueError as e:assert 'different file already exists' in str(e)
  else:raise AssertionError('Restore should reject conflicting contents')
  assert restored.read_bytes()==b'conflicting contents'
 for name in ('music/../outside.wav','music/CON.wav','gallery/nested/file.jpg','model/executable.exe'):
  try:portable.destination(name,target,new_gallery)
  except ValueError:pass
  else:raise AssertionError(name)
print('Portable ZIP roundtrip, idempotent restore, conflict protection and invalid paths passed.')
