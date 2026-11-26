"""Losslessly convert bundled artwork; verify pixels before removing backed-up sources.

User data, generated art, test fixtures and native application icons are not inputs.
Requires Pillow with WebP support. Run from any directory; paths are workspace-relative.
"""
import argparse
import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from PIL import Image, features

ROOT = Path(__file__).resolve().parent.parent
ROOTS = (ROOT / 'public', ROOT / 'assets/avatar')
MANIFEST = ROOT / 'scripts/bundled-webp-manifest.json'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def checked(relative):
    path = (ROOT / relative).resolve()
    if not any(path.is_relative_to(root.resolve()) for root in ROOTS):
        raise ValueError(f'Not bundled artwork: {relative}')
    return path


def convert(path):
    target = path.with_suffix('.webp')
    original = path.read_bytes()
    with Image.open(path) as image:
        if getattr(image, 'n_frames', 1) != 1:
            raise ValueError(f'Animated input needs a separate conversion: {path}')
        rgba = image.convert('RGBA')
        pixels = rgba.tobytes()
        if not target.exists():
            temporary = target.with_suffix('.webp.tmp')
            rgba.save(temporary, format='WEBP', lossless=True, exact=True, method=6)
            temporary.replace(target)
        with Image.open(target) as result:
            if result.size != rgba.size or result.convert('RGBA').tobytes() != pixels:
                raise ValueError(f'Pixel verification failed: {target}')
        return dict(source=path.relative_to(ROOT).as_posix(), target=target.relative_to(ROOT).as_posix(),
                    width=rgba.width, height=rgba.height, original_bytes=len(original),
                    converted_bytes=target.stat().st_size, original_sha256=digest(original),
                    webp_sha256=digest(target.read_bytes()), rgba_sha256=digest(pixels))


def verify(rows, backup=None, remove=False):
    archive = ZipFile(backup) if backup else None
    try:
        # Finish verifying the entire batch before removing any source.
        for row in rows:
            source, target = checked(row['source']), checked(row['target'])
            if digest(target.read_bytes()) != row['webp_sha256']:
                raise ValueError(f'Changed WebP: {target}')
            with Image.open(target) as image:
                if image.size != (row['width'], row['height']) or digest(image.convert('RGBA').tobytes()) != row['rgba_sha256']:
                    raise ValueError(f'Changed pixels: {target}')
            if source.exists() and digest(source.read_bytes()) != row['original_sha256']:
                raise ValueError(f'Changed original: {source}')
            if archive and digest(archive.read(row['source'])) != row['original_sha256']:
                raise ValueError(f'Backup verification failed: {source}')
        if remove:
            if not archive:
                raise ValueError('An independently verified original backup is required.')
            for row in rows:
                checked(row['source']).unlink(missing_ok=True)
    finally:
        if archive:
            archive.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backup', type=Path)
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--remove-originals', action='store_true')
    args = parser.parse_args()
    if not features.check('webp'):
        raise RuntimeError('Pillow was built without WebP support.')
    if args.verify or args.remove_originals:
        rows = json.loads(MANIFEST.read_text(encoding='utf-8'))['images']
        verify(rows, args.backup, args.remove_originals)
    else:
        sources = sorted(path for root in ROOTS for path in root.rglob('*') if path.suffix.lower() in ('.png', '.jpg', '.jpeg'))
        if not sources:
            raise ValueError('No original bundled images found; use --verify after migration.')
        if not args.backup or args.backup.exists():
            raise ValueError('Choose a new original backup archive with --backup.')
        if any(args.backup.resolve().is_relative_to(root.resolve()) for root in ROOTS):
            raise ValueError('Store the original backup outside bundled asset folders.')
        args.backup.parent.mkdir(parents=True, exist_ok=True)
        with ZipFile(args.backup, 'x', ZIP_DEFLATED) as archive:
            for source in sources:
                archive.write(source, source.relative_to(ROOT).as_posix())
        with ThreadPoolExecutor(max_workers=2) as workers:
            rows = list(workers.map(convert, sources))
        MANIFEST.write_text(json.dumps({'format': 'lossless-webp', 'pixel_verification': 'exact-rgba', 'images': rows}, indent=2)+'\n', encoding='utf-8')
        verify(rows, args.backup)
    old, new = sum(row['original_bytes'] for row in rows), sum(row['converted_bytes'] for row in rows)
    print(json.dumps(dict(images=len(rows), original_bytes=old, webp_bytes=new, saved_bytes=old-new, saved_percent=round((old-new)*100/old, 2), verified=True, originals_removed=args.remove_originals)))


if __name__ == '__main__':
    main()
