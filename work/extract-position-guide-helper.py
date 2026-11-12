from pathlib import Path
p=Path('scripts/image_job.py');s=p.read_text();a=s.index('def generate(');s=s[:a]+'''def clothing_position_guide(body):
    from PIL import Image,ImageDraw
    guide=Image.new('RGBA',body.size,'white');guide.alpha_composite(body.convert('RGBA'))
    ImageDraw.Draw(guide).rectangle((0,0,guide.width,round(guide.height*.29)),fill='white')
    return guide.convert('RGB')

''' +s[a:];a=s.index("                guide=Image.new('RGBA',source.size,'white')",s.index("if request.get('outfitExtraction')=='garment-only-body-guide':"));b=s.index('            buf=io.BytesIO()',a);s=s[:a]+'''                guide=clothing_position_guide(source)
''' +s[b:];p.write_text(s)
