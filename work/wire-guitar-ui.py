from pathlib import Path
p=Path('src/components/SingingDrawer.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('Rock · Electric guitar','Electric guitar · source notes')
s=s.replace('<option value="rock">Rock · preview</option>','<option value="rock">Electric guitar · source notes</option>')
s=s.replace("{genre!=='original'&&genre!=='jazz'&&", "{genre!=='original'&&genre!=='jazz'&&genre!=='rock'&&")
key="{genre==='jazz'&&"
if key not in s:raise RuntimeError('Piano hint boundary missing')
s=s.replace(key,"{genre==='rock'&&<p className=\"hint-soft\">Follows the detected guitar notes with electric-guitar samples and an amp. Keeps the other instruments and converts the singer separately. Up to 60 seconds; bends and slides may differ. This changes the guitar, not the whole genre.</p>}"+key,1)
s=s.replace("genre==='jazz'?'Piano backing':'Original backing'","genre==='jazz'?'Piano backing':genre==='rock'?'Guitar backing':'Original backing'")
s=s.replace('checked={wholeSong} disabled={blocked}',"checked={wholeSong} disabled={blocked||genre!=='original'}")
s=s.replace('Jazz features a synthesized sax lead; rock uses electric-guitar tones. Chord-based versions may lose recognizable riffs; preview before saving.', 'Electric guitar follows the detected source guitar notes and keeps the remaining backing. Jazz features a synthesized sax lead; its chord-based version may lose recognizable riffs. Preview before saving.')
p.write_text(s,encoding='utf-8')
for name in ['CoverBuilder.tsx','StemReview.tsx']:
 p=Path('src/components')/name;s=p.read_text(encoding='utf-8')
 s=s.replace('Clean electric guitar','Clean electric guitar · guitar notes').replace('Distorted electric guitar','Distorted electric guitar · guitar notes')
 p.write_text(s,encoding='utf-8')
