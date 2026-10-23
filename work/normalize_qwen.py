from pathlib import Path
for name in ['src/components/ImageGenerationDrawer.tsx','src/core/imageGeneration.ts','src-tauri/src/image_generation.rs','scripts/qwen_image.py','scripts/image_job.py','src-tauri/tauri.conf.json']:
 p=Path(name);s=p.read_bytes().decode('utf-8','surrogateescape');s=''.join(bytes([ord(c)-0xdc00]).decode('cp1252') if 0xdc80<=ord(c)<=0xdcff else c for c in s);p.write_text(s,encoding='utf-8')
s=Path('work/qwen_followup.py').read_text(encoding='utf-8');s=s[s.index("p=Path('tests/foundation.test.cjs')"):];Path('work/qwen_component_test.py').write_text('from pathlib import Path\n'+s,encoding='utf-8')
