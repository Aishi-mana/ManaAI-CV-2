"""Local clothing parsing diagnostic. Never downloads weights or writes wardrobe files."""
import argparse,json
from pathlib import Path
CLOTHING_LABELS=(4,5,6,7,8,9,10)
def extract(image_path,model_dir,output):
    import os
    os.environ.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1')
    import numpy as np,torch
    from PIL import Image
    from transformers import SegformerImageProcessor,SegformerForSemanticSegmentation
    model_dir=Path(model_dir)
    for filename in ('config.json','preprocessor_config.json','model.safetensors'):
        if not (model_dir/filename).is_file():raise FileNotFoundError('Missing local parsing model file: '+filename)
    out=Path(output);out.mkdir(parents=True,exist_ok=False)
    with Image.open(image_path) as im:image=im.convert('RGB')
    processor=SegformerImageProcessor.from_pretrained(model_dir,local_files_only=True)
    model=SegformerForSemanticSegmentation.from_pretrained(model_dir,local_files_only=True,use_safetensors=True).eval()
    with torch.inference_mode():
        logits=model(**processor(images=image,return_tensors='pt')).logits
        logits=torch.nn.functional.interpolate(logits,size=(image.height,image.width),mode='bilinear',align_corners=False)
        probabilities=logits.softmax(dim=1);labels=probabilities.argmax(dim=1)[0].numpy()
        confidence=probabilities[0,list(CLOTHING_LABELS)].sum(dim=0).numpy()
    np.savez_compressed(out/'parsing.npz',labels=labels,probabilities=probabilities[0].numpy())
    keep=np.isin(labels,CLOTHING_LABELS)
    if not keep.any():raise RuntimeError('No clothing found; do not save a wardrobe item.')
    alpha=(keep.astype(np.uint8)*255)
    pixels=np.array(image.convert('RGBA'),copy=True);pixels[:,:,3]=alpha;pixels[~keep]=0
    Image.fromarray(pixels).save(out/'clothing.png')
    Image.fromarray(labels.astype(np.uint8)).save(out/'labels.png')
    Image.fromarray(alpha).save(out/'mask.png')
    report={'prototype':True,'not_wardrobe_ready':True,'clothing_fraction':float(keep.mean()),'mean_clothing_confidence':float(confidence[keep].mean()),'note':'Parsing alone does not establish fit, hidden fabric, front/back hair depth or visual quality. No automatic wardrobe write.'}
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('image');parser.add_argument('model_dir');parser.add_argument('output');a=parser.parse_args();extract(a.image,a.model_dir,a.output)
