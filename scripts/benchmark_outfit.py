"""Replay cached extraction against the accepted demo, with no generation/download."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from aligned_outfit import extract_aligned
from clothing_fit import fit_closed_shoes


def run(root, output):
    root, output = Path(root), Path(output)
    output.mkdir(parents=True, exist_ok=False)
    avatar = Path(__file__).resolve().parents[1] / 'assets/avatar'
    source = root / 'image.png'
    approved = root / 'collar-shoulder-restored/clothing.png'
    with Image.open(avatar/'base/body.png') as im:
        size = im.size
    with Image.open(source) as im:
        rgb = np.array(im.convert('RGB'))
    data = np.load(root/'parsed/parsing.npz', allow_pickle=False)
    candidate, report = extract_aligned(rgb, data['labels'], data['probabilities'], size)
    body=np.array(Image.open(avatar/'base/body.png').convert('RGBA'))
    candidate, report['shoe_fit'] = fit_closed_shoes(candidate, body)
    Image.fromarray(candidate).save(output/'candidate.png')
    accepted = np.array(Image.open(approved).convert('RGBA'))
    a, b = accepted[:, :, 3] > 128, candidate[:, :, 3] > 128
    # Same source and approved correction: silhouette disagreement is a useful
    # regression measure here, not a general quality score for different outfits.
    report['benchmark'] = {'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'approved_sha256': hashlib.sha256(approved.read_bytes()).hexdigest(),
        'silhouette_iou': float((a & b).sum()/max(1, (a | b).sum())),
        'missing_approved_pixels': int((a & ~b).sum()),
        'extra_pixels': int((b & ~a).sum()), 'new_generations': 0,
        'note': 'Visual review still required; overlap does not measure garment detail or fit on a new source.'}
    def preview(outfit):
        canvas = Image.new('RGBA', size, 'white')
        for file in ['hairstyles/default/hair_back.png', 'base/body.png', None,
                     'mouth/mouth_neutral.png', 'eyes/eye_neutral.png',
                     'hairstyles/default/hair_front.png', 'hairstyles/default/hair_ahoge.png',
                     'accessories/cross_hairclip.png', 'accessories/cat_ear_headset.png']:
            canvas.alpha_composite(Image.fromarray(outfit) if file is None else Image.open(avatar/file).convert('RGBA'))
        return canvas.convert('RGB')
    before, after = preview(accepted), preview(candidate)
    after.save(output/'candidate-preview.jpg', quality=95)
    sheet = Image.new('RGB', (size[0]*2, size[1]+45), 'white')
    sheet.paste(before, (0,45)); sheet.paste(after, (size[0],45))
    draw = ImageDraw.Draw(sheet)
    draw.text((20,15), 'Earlier approved manual correction', fill='black')
    draw.text((size[0]+20,15), 'Automatic extraction, source position preserved', fill='black')
    sheet.save(output/'comparison.jpg', quality=95)
    for name, box in [('neck-shoulders', (250,330,610,600)), ('shoes', (290,1010,550,1240))]:
        left, right = before.crop(box), after.crop(box)
        pair = Image.new('RGB', (left.width*2,left.height), 'white')
        pair.paste(left,(0,0));pair.paste(right,(left.width,0));pair.resize((pair.width*2,pair.height*2)).save(output/(name+'.jpg'), quality=95)
    (output/'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report['benchmark'], indent=2))


if __name__ == '__main__':
    p = argparse.ArgumentParser(); p.add_argument('root'); p.add_argument('output')
    args = p.parse_args(); run(args.root, args.output)
