from pathlib import Path
p=Path('work/wire_qwen_frontend.py');s=p.read_text();s=s[s.index("p=Path('src/components/ImageGenerationDrawer.tsx')"):];s="from pathlib import Path\n"+s;s=s.replace('assert old in s;s=s.replace(old,new,1)',"old=s[s.index('{discovery?.models.map'):s.index('</select>')];s=s.replace(old,new,1)");Path('work/wire_qwen_drawer.py').write_text(s)
