from PIL import Image
import numpy as np,json,base64,io
from pathlib import Path
out=Path('exports/images/hair-landmarks-20261028');out.mkdir(exist_ok=True)
body=Image.open('assets/avatar/base/body.png').convert('RGBA');eyes=Image.open('assets/avatar/eyes/eye_neutral.png').convert('RGBA');mouth=Image.open('assets/avatar/mouth/mouth_neutral.png').convert('RGBA')
for key,im in [('body',body),('eyes',eyes),('mouth',mouth)]: (out/(key+'.rgba')).write_bytes(im.tobytes())
a=np.array(body);ys,xs=np.where(a[:round(body.height*.29),:,3]>128);hw=xs.max()-xs.min()+1
front=Image.open('assets/avatar/hairstyles/default/hair_front.png').convert('RGBA');back=Image.open('assets/avatar/hairstyles/default/hair_back.png').convert('RGBA');e=np.array(eyes);ey=int(np.where(e[:,:,3]>128)[0].min());box=front.getbbox();bottom=min(box[3],ey+hw*.2);fw=box[2]-box[0];fh=bottom-box[1];s=min(330/fw,240/fh)
ref=Image.new('RGBA',(1024,768),'white');ref.alpha_composite(front.crop((box[0],box[1],box[2],round(bottom))).resize((round(fw*s),round(fh*s)),Image.Resampling.LANCZOS),(round(256-fw*s/2),40));box=back.getbbox();bw=box[2]-box[0];bh=box[3]-box[1];s=min(440/bw,660/bh);ref.alpha_composite(back.crop(box).resize((round(bw*s),round(bh*s)),Image.Resampling.LANCZOS),(round(512+(512-bw*s)/2),40));ref.convert('RGB').save(out/'reference.jpg',quality=95)
