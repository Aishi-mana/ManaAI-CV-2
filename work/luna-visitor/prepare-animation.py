from pathlib import Path
from PIL import Image
import subprocess
base=Path('work/luna-visitor')
template=Path('work/room-set-preview/cartoon-preview.py').read_text(encoding='utf-8')
js=template.split('js="""',1)[1].split('"""',1)[0]
assets=Path('public/companion-room')
def sprite(source, name, center):
    raw=base/'frame.rgba'
    image=source.convert('RGBA')
    raw.write_bytes(image.tobytes())
    subprocess.run(['node','-e',js,str(raw),*map(str,image.size)],capture_output=True,text=True,check=True)
    image=Image.frombytes('RGBA',image.size,raw.read_bytes())
    bounds=image.getbbox()
    piece=image.crop(bounds)
    ratio=510/piece.height
    piece=piece.resize((round(piece.width*ratio),510),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(550,550))
    frame.paste(piece,(round(275-(center-bounds[0])*ratio),40))
    frame.save(assets/f'luna-{name}.png',optimize=True)
sheet=Image.open(base/'animation/image.png')
sprite(sheet.crop((0,0,384,640)), 'stride', 195)
sprite(sheet.crop((768,0,1152,640)), 'blink', 201)
passing=base/'passing/image.png'
if passing.is_file():
    image=Image.open(passing)
    sprite(image, 'passing', image.width//2)

