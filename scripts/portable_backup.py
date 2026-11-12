"""Portable Mana backup for user media and selected local dependencies."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath, PureWindowsPath
import shutil
import sys
import tempfile
import zipfile

BACKUP = 'Mana-backup.json'
MAX_METADATA = 256_000_000
MAX_ENTRIES = 50_000
IMAGE_SUFFIXES = {'.png', '.webp', '.jpg', '.jpeg'}
MODEL_SETTINGS = {
    'mana.settings.v1': ('modelPath',),
    'mana.vision.v1': ('modelPath', 'projectorPath'),
    'mana.game_dev.v1': ('developmentModelPath',),
    'mana.whisper.v1': ('modelPath',),
}
MUSIC_SUFFIXES = {'.wav', '.mid', '.json', '.mp3', '.flac', '.ogg', '.m4a'}


def values(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from values(item)
    elif isinstance(value, list):
        for item in value:
            yield from values(item)
    elif isinstance(value, str):
        yield value


def allowed_relative(name):
    if ':' in name or chr(92) in name:
        raise ValueError('Invalid path in portable backup.')
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or str(path) != name or len(path.parts) < 2:
        raise ValueError('Invalid path in portable backup.')
    return path


def digest(stream):
    return hashlib.file_digest(stream, 'sha256').hexdigest() if hasattr(hashlib, 'file_digest') else _digest(stream)


def _digest(stream):
    sha = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b''):
        sha.update(block)
    return sha.hexdigest()


def sha_file(path):
    with path.open('rb') as stream:
        return digest(stream)


def add_tree(files, source, section):
    root = source.resolve()
    if not root.is_dir():
        return False
    for path in root.rglob('*'):
        relative = path.relative_to(root)
        if len(relative.parts) > 7 or not path.is_file() or not path.resolve().is_relative_to(root):
            continue
        name = section + '/' + relative.as_posix()
        if avatar_entry(section, relative.parts):
            files[name] = path.resolve()
    return True


def avatar_entry(section, parts):
    file = Path(*parts)
    if section == 'avatar':
        return file.suffix.lower() in IMAGE_SUFFIXES or file.as_posix().lower() == 'items.json'
    return parts[0] in {'outfits', 'hairstyles', 'accessories'} and (
        file.suffix.lower() in IMAGE_SUFFIXES or file.name in {'project.json', 'selection.json'}
    )


def model_entry(source, files, workspace):
    name = sha_file(source) + source.suffix.lower()
    files['model/' + name] = source
    return (workspace / 'data/portable-models' / name).as_posix()


def runtime_entry(source, files, workspace, executable):
    if not source.is_file() or source.name.lower() != executable:
        raise ValueError(f'Select an available {executable} or turn off its backup option.')
    dependencies = sorted((path for path in source.parent.iterdir()
                           if path.suffix.lower() == '.dll' and path.is_file()
                           and path.resolve().is_relative_to(source.parent)), key=lambda path: path.name.lower())
    fingerprint = hashlib.sha256()
    for dependency in [source, *dependencies]:
        fingerprint.update(dependency.name.lower().encode() + b':' + sha_file(dependency).encode())
    folder = fingerprint.hexdigest()
    for dependency in [source, *dependencies]:
        files[f'runtime/{folder}/{dependency.name.lower()}'] = dependency
    return (workspace / 'data/portable-runtimes' / folder / executable).as_posix()


def export(path, data, workspace, gallery, model, avatars=False, vision=False, runtime=False, developer=False, whisper=False):
    metadata = json.loads(data)
    music = workspace / 'exports/singing'
    prefix = music.as_posix().lower() + '/'
    files = {}
    missing = set()
    for value in values(metadata['data']):
        normalized = value.replace(chr(92), '/')
        if not normalized.lower().startswith(prefix):
            continue
        source = Path(normalized)
        if source.suffix.lower() not in MUSIC_SUFFIXES:
            continue
        resolved = source.resolve()
        if resolved.is_relative_to(music.resolve()) and resolved.is_file():
            relative = source.relative_to(music).as_posix()
            files['music/' + relative] = resolved
        else:
            missing.add(normalized)
    for image in metadata['data'].get('mana.images.v1', []):
        identifier = image.get('diskId', '')
        if not identifier or len(identifier) > 64 or any(not (c.isascii() and (c.isalnum() or c in '-_')) for c in identifier):
            continue
        name = identifier + '.jpg'
        source = (gallery / name).resolve()
        if source.is_file() and source.is_relative_to(gallery.resolve()):
            files['gallery/' + name] = source
        else:
            missing.add(name)
    settings = metadata['data']['mana.settings.v1']
    if avatars:
        avatar_dir = settings.get('avatarDir', '')
        if avatar_dir:
            if add_tree(files, Path(avatar_dir), 'avatar'):
                if any(name.startswith('avatar/') for name in files):
                    settings['avatarDir'] = (workspace / 'data/portable-avatar').as_posix()
                else:
                    missing.add(avatar_dir)
            else:
                missing.add(avatar_dir)
        add_tree(files, gallery.parent / 'wardrobe', 'wardrobe')
    if model:
        source = Path(settings.get('modelPath', '')).resolve()
        if not source.is_file() or source.suffix.lower() != '.gguf':
            raise ValueError('Select an available GGUF chat model in Settings first, or turn off Include chat model.')
        settings['modelPath'] = model_entry(source, files, workspace)
    if vision:
        vision_settings = metadata['data'].get('mana.vision.v1', {})
        for field in MODEL_SETTINGS['mana.vision.v1']:
            source = Path(vision_settings.get(field, '')).resolve()
            if not source.is_file() or source.suffix.lower() != '.gguf':
                raise ValueError('Select an available vision GGUF and matching projector, or turn off Include vision models.')
            vision_settings[field] = model_entry(source, files, workspace)
    if runtime:
        source = Path(settings.get('exePath', '')).resolve()
        settings['exePath'] = runtime_entry(source, files, workspace, 'llama-server.exe')
    if developer:
        game_settings = metadata['data'].get('mana.game_dev.v1', {})
        source = Path(game_settings.get('developmentModelPath', '')).resolve()
        if not source.is_file() or source.suffix.lower() != '.gguf':
            raise ValueError('Choose a Game Dev GGUF model or turn off Include Game Dev model.')
        game_settings['developmentModelPath'] = model_entry(source, files, workspace)
    if whisper:
        voice_input = metadata['data'].get('mana.whisper.v1', {})
        source = Path(voice_input.get('modelPath', '')).resolve()
        if not source.is_file() or source.suffix.lower() != '.bin':
            raise ValueError('Choose an available Whisper .bin model or turn off Include Whisper.')
        voice_input['modelPath'] = model_entry(source, files, workspace)
        voice_input['exePath'] = runtime_entry(Path(voice_input.get('exePath', '')).resolve(), files, workspace, 'whisper-cli.exe')
    payload = json.dumps(metadata, ensure_ascii=False, separators=(',', ':')).encode()
    if len(payload) > MAX_METADATA or len(files) >= MAX_ENTRIES:
        raise ValueError('Portable backup exceeds its metadata or file-count limit.')
    with path.open('xb') as stream:
        try:
            with zipfile.ZipFile(stream, 'w', allowZip64=True) as archive:
                archive.writestr(BACKUP, payload)
                for name, source in files.items():
                    allowed_relative(name)
                    archive.write(source, name)
        except Exception:
            stream.close()
            path.unlink(missing_ok=True)
            raise
    return {'files':len(files),'missing':len(missing)}


def metadata_bytes(archive):
    if len(archive.infolist()) > MAX_ENTRIES:
        raise ValueError('Too many files in this portable backup.')
    names = archive.namelist()
    if len(set(names)) != len(names):
        raise ValueError('Portable backup contains duplicate entries.')
    info = archive.getinfo(BACKUP)
    if info.file_size > MAX_METADATA:
        raise ValueError('Backup exceeds 256 MB.')
    return archive.read(info)


def is_digest(text):
    return len(text) == 64 and all(c in '0123456789abcdef' for c in text)


def destination(name, workspace, gallery):
    relative = allowed_relative(name)
    section, *parts = relative.parts
    file = Path(*parts)
    if section == 'music' and file.suffix.lower() in MUSIC_SUFFIXES:
        root = workspace / 'exports/singing'
    elif section == 'gallery' and len(parts) == 1 and file.suffix == '.jpg' and len(file.stem) <= 64 and all(c.isascii() and (c.isalnum() or c in '-_') for c in file.stem):
        root = gallery
    elif section in {'avatar', 'wardrobe'} and len(parts) <= 7 and avatar_entry(section, parts):
        root = workspace / 'data/portable-avatar' if section == 'avatar' else gallery.parent / 'wardrobe'
    elif section == 'runtime' and len(parts) == 2 and is_digest(parts[0]) and (
            parts[1] in {'llama-server.exe', 'whisper-cli.exe'} or file.suffix.lower() == '.dll'):
        root = workspace / 'data/portable-runtimes'
    elif section == 'model' and len(parts) == 1 and file.suffix in {'.gguf', '.bin'} and is_digest(file.stem):
        root = workspace / 'data/portable-models'
    else:
        raise ValueError('Unsupported file in portable backup: ' + name)
    for part in parts:
        if PureWindowsPath(part).is_reserved() or part.endswith(('.', ' ')) or any(c in '<>|?*' or ord(c)<32 for c in part):
            raise ValueError('Invalid Windows path in portable backup.')
    parent_root = gallery.parent.resolve() if section in {'gallery', 'wardrobe'} else workspace.resolve()
    if not root.resolve().is_relative_to(parent_root):
        raise ValueError('A restore folder points outside Mana.')
    target = root / file
    if not target.resolve().is_relative_to(root.resolve()):
        raise ValueError('A restore path points outside its destination folder.')
    return target


def restore(archive, workspace, gallery):
    entries = [(item, destination(item.filename, workspace, gallery)) for item in archive.infolist() if item.filename != BACKUP]
    if len({str(target.resolve()).lower() for _,target in entries}) != len(entries):
        raise ValueError('Portable backup contains colliding destination paths.')
    runtimes = {}
    for item, _ in entries:
        if item.filename.startswith('runtime/'):
            _, folder, name = item.filename.split('/')
            runtimes.setdefault(folder, {})[name] = item
    for folder, members in runtimes.items():
        executables = {'llama-server.exe', 'whisper-cli.exe'} & members.keys()
        if len(executables) != 1:
            raise ValueError('The bundled runtime must contain one supported executable.')
        executable = executables.pop()
        fingerprint = hashlib.sha256()
        for name in [executable, *sorted(set(members) - {executable})]:
            with archive.open(members[name]) as stream:
                fingerprint.update(name.encode() + b':' + digest(stream).encode())
        if fingerprint.hexdigest() != folder:
            raise ValueError('The bundled runtime checksum does not match.')
    pending = []
    for item, target in entries:
        if target.exists():
            with archive.open(item) as stream:
                if not target.is_file() or target.stat().st_size != item.file_size or sha_file(target) != digest(stream):
                    raise ValueError('A different file already exists: ' + str(target))
        else:
            pending.append((item,target))
    copied = []
    try:
        for item, target in pending:
            target.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=target.parent, delete=False) as tmp:
                scratch = Path(tmp.name)
                try:
                    with archive.open(item) as stream:
                        shutil.copyfileobj(stream,tmp,1024*1024)
                    tmp.close()
                    if item.filename.startswith('model/') and sha_file(scratch)!=target.stem:
                        raise ValueError('The bundled model checksum does not match.')
                    if os.name == 'nt':
                        os.rename(scratch,target)  # Windows rename fails if the target already exists.
                    else:
                        os.link(scratch,target)
                    copied.append(target)
                finally:
                    tmp.close()
                    scratch.unlink(missing_ok=True)
    except Exception:
        for target in reversed(copied):
            target.unlink(missing_ok=True)
        raise
    return {'files':len(copied)}


def inspect_metadata(payload, archive, workspace, gallery):
    metadata = json.loads(payload)
    paths = {item.filename: destination(item.filename, workspace, gallery)
             for item in archive.infolist() if item.filename != BACKUP}
    if len({str(target.resolve()).lower() for target in paths.values()}) != len(paths):
        raise ValueError('Portable backup contains colliding destination paths.')
    metadata.pop('portableSourceWorkspace', None)
    data = metadata['data']
    for section, fields in MODEL_SETTINGS.items():
        settings = data.get(section, {})
        for field in fields:
            value = settings.get(field, '')
            if not isinstance(value, str):
                continue
            value = value.replace(chr(92), '/')
            name = 'model/' + value.rsplit('/', 1)[-1]
            extension = '.bin' if section == 'mana.whisper.v1' else '.gguf'
            if '/data/portable-models/' in value.lower() and name in paths and name.endswith(extension):
                settings[field] = paths[name].as_posix()
    settings = data['mana.settings.v1']
    if any(name.startswith('avatar/') for name in paths):
        settings['avatarDir'] = (workspace / 'data/portable-avatar').as_posix()
    for section, executable in [('mana.settings.v1', 'llama-server.exe'), ('mana.whisper.v1', 'whisper-cli.exe')]:
        runtime_settings = data.get(section, {})
        exe = runtime_settings.get('exePath', '').replace(chr(92), '/')
        if '/data/portable-runtimes/' in exe.lower() and exe.endswith('/' + executable):
            entry = 'runtime/' + '/'.join(exe.rsplit('/', 2)[-2:])
            if entry in paths:
                runtime_settings['exePath'] = paths[entry].as_posix()
                if section == 'mana.settings.v1':
                    runtime_settings['autoStart'] = False
    return json.dumps(metadata, ensure_ascii=False, separators=(',', ':'))


def main():
    operation,path,workspace,gallery = sys.argv[1:]
    path,workspace,gallery = map(Path,(path,workspace,gallery))
    request = json.load(sys.stdin)
    if operation == 'export':
        return export(path,request['content'],workspace,gallery,request['model'], request.get('avatars'), request.get('vision'), request.get('runtime'), request.get('developer'), request.get('whisper'))
    with zipfile.ZipFile(path) as archive:
        payload = metadata_bytes(archive)
        directory = [(item.filename, item.file_size, item.CRC) for item in archive.infolist()]
        checksum = hashlib.sha256(payload + json.dumps(directory).encode()).hexdigest()
        if operation == 'inspect':
            return {'content':inspect_metadata(payload, archive, workspace, gallery),'checksum':checksum,'files':len(archive.infolist())-1}
        if operation != 'restore' or checksum != request.get('checksum'):
            raise ValueError('Portable backup changed. Open its restore preview again.')
        return restore(archive,workspace,gallery)


if __name__ == '__main__':
    try:
        print(json.dumps(main()))
    except (OSError, ValueError, KeyError, RuntimeError, zipfile.BadZipFile) as error:
        sys.exit(str(error))
