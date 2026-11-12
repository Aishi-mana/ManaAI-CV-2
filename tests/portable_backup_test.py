import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('portable_backup', ROOT / 'scripts/portable_backup.py')
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class PortableBackupTest(unittest.TestCase):
    def test_moves_avatar_wardrobe_vision_and_runtime_without_overwriting(self):
        with TemporaryDirectory() as folder:
            base = Path(folder)
            source, target = base / 'Source Workspace', base / 'Target Workspace'
            gallery, restored_gallery = base / 'Source Profile/gallery', base / 'Target Profile/gallery'
            runtime, avatar = base / 'llama', base / 'avatar'
            for path, content in {
                source / 'chat.gguf': b'chat',
                source / 'vision.gguf': b'vision',
                source / 'projector.gguf': b'projector',
                source / 'coder.gguf': b'coder',
                source / 'whisper.bin': b'whisper',
                base / 'whisper/whisper-cli.exe': b'whisper exe',
                base / 'whisper/ggml.dll': b'whisper dll',
                runtime / 'llama-server.exe': b'exe',
                runtime / 'ZZ.dll': b'DLL',
                runtime / 'aa.dll': b'dll',
                avatar / 'base/body.png': b'body',
                avatar / 'items.json': b'{}',
                avatar / 'secret.txt': b'private',
                gallery / 'abc.jpg': b'gallery',
                gallery.parent / 'wardrobe/outfits/atelier_dress/outfit.png': b'dress',
                gallery.parent / 'wardrobe/outfits/atelier_dress/project.json': b'{}',
            }.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
            metadata = {'data': {
                'mana.settings.v1': {'modelPath': str(source / 'chat.gguf'), 'avatarDir': str(avatar),
                                     'exePath': str(runtime / 'llama-server.exe'), 'autoStart': True},
                'mana.vision.v1': {'modelPath': str(source / 'vision.gguf'),
                                   'projectorPath': str(source / 'projector.gguf')},
                'mana.game_dev.v1': {'developmentModelPath': str(source / 'coder.gguf')},
                'mana.whisper.v1': {'modelPath': str(source / 'whisper.bin'),
                                    'exePath': str(base / 'whisper/whisper-cli.exe')},
                'mana.images.v1': [{'diskId': 'abc'}],
            }}
            archive_path = base / 'test.zip'
            result = backup.export(archive_path, json.dumps(metadata), source, gallery,
                                   model=True, avatars=True, vision=True, runtime=True, developer=True, whisper=True)
            self.assertEqual(result, {'files': 15, 'missing': 0})
            with zipfile.ZipFile(archive_path) as archive:
                self.assertFalse(any('secret.txt' in name for name in archive.namelist()))
                preview = backup.inspect_metadata(backup.metadata_bytes(archive), archive, target, restored_gallery)
                restored = json.loads(preview)['data']
                self.assertEqual(backup.restore(archive, target, restored_gallery)['files'], 15)
                self.assertEqual(backup.restore(archive, target, restored_gallery)['files'], 0)
                settings = restored['mana.settings.v1']
                self.assertFalse(settings['autoStart'])
                self.assertEqual(Path(settings['modelPath']).read_bytes(), b'chat')
                self.assertEqual((Path(settings['avatarDir']) / 'base/body.png').read_bytes(), b'body')
                self.assertEqual(Path(settings['exePath']).with_name('zz.dll').read_bytes(), b'DLL')
                self.assertEqual(Path(restored['mana.vision.v1']['projectorPath']).read_bytes(), b'projector')
                self.assertEqual(Path(restored['mana.game_dev.v1']['developmentModelPath']).read_bytes(), b'coder')
                self.assertEqual(Path(restored['mana.whisper.v1']['modelPath']).read_bytes(), b'whisper')
                self.assertEqual(Path(restored['mana.whisper.v1']['exePath']).with_name('ggml.dll').read_bytes(), b'whisper dll')
                self.assertTrue((restored_gallery.parent / 'wardrobe/outfits/atelier_dress/project.json').exists())
                restored_gallery.joinpath('abc.jpg').write_bytes(b'changed')
                with self.assertRaisesRegex(ValueError, 'different file'):
                    backup.restore(archive, target, restored_gallery)


if __name__ == '__main__':
    unittest.main()
