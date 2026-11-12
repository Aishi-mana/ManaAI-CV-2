from pathlib import Path
p=Path('work/preview-oct29-outfits.py');s=p.read_text().replace("'hair/default/back.png'","'hairstyles/default/hair_back.png'").replace("'hair/default/front.png'","'hairstyles/default/hair_front.png'")
# Back hair belongs behind the body; front hair remains above clothing.
s=s.replace("im.alpha_composite(Image.open(p/'avatar-body.png')", "im.alpha_composite(Image.open('assets/avatar/hairstyles/default/hair_back.png').convert('RGBA'));im.alpha_composite(Image.open(p/'avatar-body.png')").replace("['hairstyles/default/hair_back.png','eyes/", "['eyes/")
p.write_text(s)
