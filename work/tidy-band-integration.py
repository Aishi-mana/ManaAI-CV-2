from pathlib import Path
p=Path('scripts/cover_genre.py');s=p.read_text(encoding='utf-8');s=s.split('\n request=genre_request')[0]+"\n raise ValueError('Choose a supported backing style.')\n";p.write_text(s,encoding='utf-8')
p=Path('src/components/SingingDrawer.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('settings:{...original.settings,genreLead:leadFor(style),','settings:{...original.settings,genre:[\'rock\',\'jazz\',\'pop\',\'piano-trio\',\'guitar-electric\'].includes(style)?style as BackingStyle:original.settings.genre,genreLead:leadFor(style),')
p.write_text(s,encoding='utf-8')
