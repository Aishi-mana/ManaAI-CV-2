import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('portable_backup', ROOT / 'scripts/portable_backup.py')
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class PortableBackupTest(unittest.TestCase):
    def test_cli_reads_utf8_and_recovers_old_windows_metadata(self):
        original = {'data': {'mana.settings.v1': {}, 'mana.chat.v1': [{'content': '日本語 🐱'}]}}
        raw = json.dumps(original, ensure_ascii=False).encode('utf-8')
        damaged = json.loads(raw.decode('cp1252', 'surrogateescape'))
        self.assertNotEqual(damaged, original)
        self.assertEqual(backup.read_portable_metadata(backup.metadata_json(damaged)), original)
        with TemporaryDirectory() as folder:
            base = Path(folder)
            archive_path = base / 'backup.zip'
            request = json.dumps({'content': raw.decode('utf-8'), 'model': False}, ensure_ascii=False).encode('utf-8')
            subprocess.run([sys.executable, str(ROOT / 'scripts/portable_backup.py'), 'export',
                            str(archive_path), str(base), str(base / 'gallery')],
                           input=request, capture_output=True, check=True,
                           env={**os.environ, 'PYTHONIOENCODING': 'cp1252:surrogateescape'})
            with zipfile.ZipFile(archive_path) as archive:
                self.assertEqual(backup.read_portable_metadata(archive.read(backup.BACKUP)), original)

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
                'mana.chat.v1': [{'text': '日本語 🎵 \udc9d'}],
            }}
            archive_path = base / 'test.zip'
            updates = []
            result = backup.export(archive_path, json.dumps(metadata), source, gallery,
                                   model=True, avatars=True, vision=True, runtime=True, developer=True, whisper=True,
                                   progress=lambda **update: updates.append(update))
            self.assertEqual(result, {'files': 15, 'missing': 0})
            writes = [update for update in updates if update['stage'] == 'Writing ZIP']
            self.assertEqual(writes[0]['bytesWritten'], 0)
            self.assertEqual(writes[-1]['bytesWritten'], writes[-1]['totalBytes'])
            self.assertEqual(writes[-1]['completedFiles'], result['files'])
            self.assertEqual(updates[-1]['stage'], 'Finalizing ZIP')
            self.assertEqual(list(base.glob('*.partial')), [])
            with self.assertRaisesRegex(ValueError, 'Choose a new backup name'):
                backup.export(archive_path, json.dumps(metadata), source, gallery, model=False)
            with zipfile.ZipFile(archive_path) as archive:
                self.assertFalse(any('secret.txt' in name for name in archive.namelist()))
                payload = backup.metadata_bytes(archive)
                self.assertIn(b'\\udc9d', payload)
                self.assertIn('日本語 🎵'.encode('utf-8'), payload)
                preview = backup.inspect_metadata(payload, archive, target, restored_gallery)
                self.assertIn('\\udc9d', preview)
                preview.encode('utf-8')
                restored = json.loads(preview)['data']
                self.assertEqual(restored['mana.chat.v1'], metadata['data']['mana.chat.v1'])
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
