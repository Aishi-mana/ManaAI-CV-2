"""Extract an already posed redesign without moving its torso into a guessed box.

Offline evaluation path. Requires cached semantic parsing; never writes Wardrobe.
The source must already share the avatar's pose/framing. This is not registration.
"""
import cv2
import numpy as np
from PIL import Image
from clothing_refine import refine
from clothing_edges import polish_edges
from clothing_footwear import extract_closed_footwear
from clothing_fit import fit_closed_shoes


def extract_aligned(rgb, labels, probabilities, size, front_alpha=None):
    """Keep source coordinates; restore closed footwear from semantic seed boxes."""
    if front_alpha is not None and front_alpha.shape != (size[1],size[0]):
        raise ValueError('Front hair and output canvas must match')
    source_front=None
    if front_alpha is not None:
        source_front=cv2.resize(front_alpha,(rgb.shape[1],rgb.shape[0]),interpolation=cv2.INTER_NEAREST)>240
    alpha, cleanup = refine(rgb, labels, probabilities,source_front)
    pixels = np.dstack([rgb, alpha])
    # Semantic shoes provide crop bounds, rather than outfit-specific coordinates.
    # White-background extraction retains buckles/soles that parser erosion loses.
    footwear = []
    for label in (9, 10):
        ys, xs = np.where(labels == label)
        if len(xs) < 30:
            continue
        pad = max(4, round(rgb.shape[0] * .008))
        x0, x1 = max(0, xs.min()-pad), min(rgb.shape[1], xs.max()+pad+1)
        y0, y1 = max(0, ys.min()-pad), min(rgb.shape[0], ys.max()+pad+1)
        # The recovery crop includes a strip ABOVE each sock. That strip is a
        # leg, even when it is too pale for the old HSV skin-color heuristic.
        excluded=np.isin(labels[y0:y1,x0:x1],[1,2,3,11,12,13,14,15,16,17])
        shoe = extract_closed_footwear(rgb[y0:y1, x0:x1],excluded)
        region = pixels[y0:y1, x0:x1]
        region[shoe[:, :, 3] > 0] = shoe[shoe[:, :, 3] > 0]
        footwear.append({'label': label, 'bounds': [int(x0), int(y0), int(x1), int(y1)]})
    pixels[ pixels[:, :, 3] == 0 ] = 0
    pixels = np.array(Image.fromarray(pixels).resize(size, Image.Resampling.LANCZOS))
    pixels, edges = polish_edges(pixels)
    # Protect only cleaned CLOTHING pixels under front hair. A hair occluder is
    # not permission to copy a rectangle of the original avatar into the outfit.
    protected=np.zeros(pixels.shape[:2],bool)
    if front_alpha is not None:
        garment=cv2.resize(np.isin(labels,[4,5,6,7,8]).astype(np.uint8),size,interpolation=cv2.INTER_NEAREST)>0
        clean=cv2.resize((alpha>128).astype(np.uint8),size,interpolation=cv2.INTER_NEAREST)>0
        protected=garment&clean&(front_alpha>240)
        pixels[:,:,3][protected]=255
    pixels[pixels[:, :, 3] == 0] = 0
    return pixels, {'geometry': 'source-canvas-preserved', 'automatic_save_allowed': False,
                    'requires_alignment_review': True, 'cleanup': cleanup,
                    'edges': edges, 'footwear': footwear, 'hidden_gap_pixels': 0,
                    'shoulder_completion':False,
                    'front_hair_protection_used':front_alpha is not None,
                    'protected_source_pixels':int(protected.sum())}


def prepare_aligned_outfit(directory, body_path):
    """Replay parsing if cached, otherwise use the installed offline CPU parser."""
    import json
    from pathlib import Path
    directory=Path(directory)
    source=directory/'image.png'
    if not source.is_file():
        source=directory/'image.jpg'
    parsed=directory/'aligned-parsing'
    if not (parsed/'parsing.npz').is_file():
        from clothing_extract import extract
        model=Path(__file__).resolve().parents[1]/'models/clothing-segformer-b2'
        if not model.is_dir():
            model=Path('C:/AI/ManaAI-CV-2/models/clothing-segformer-b2')
        # Failed parsing directories remain diagnostic evidence; do not delete.
        if parsed.exists():
            import tempfile
            parsed=Path(tempfile.mkdtemp(prefix='aligned-parsing-',dir=directory))/'result'
        extract(source,model,parsed)
    with Image.open(source) as im:
        rgb=np.array(im.convert('RGB'))
    with Image.open(body_path) as im:
        body=np.array(im.convert('RGBA'))
    data=np.load(parsed/'parsing.npz',allow_pickle=False)
    front_path=directory/'avatar-front-hair.png'
    front=None
    if front_path.is_file():
        with Image.open(front_path) as im:front=np.array(im.convert('RGBA'))[:,:,3]
    pixels,report=extract_aligned(rgb,data['labels'],data['probabilities'],(body.shape[1],body.shape[0]),front)
    pixels,report['shoe_fit']=fit_closed_shoes(pixels,body)
    Image.fromarray(pixels).save(directory/'outfit.png')
    report.update(width=body.shape[1],height=body.shape[0],prototype=True,
                  source='local-avatar-redesign',fit_version=6)
    (directory/'outfit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return report
