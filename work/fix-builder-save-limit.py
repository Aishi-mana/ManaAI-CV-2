from pathlib import Path
root=Path(__file__).resolve().parents[1]
for file,before,after in [
 ('src/components/SingingDrawer.tsx','canSave={studio.projects.length<50}','canSave={studio.projects.length<STUDIO_PROJECT_LIMIT}'),
 ('src/components/CoverBuilder.tsx','onStop={()=>{pauseMix();seek(0);}}',"onStop={()=>{pauseMix();seek(0);setMessage('Playback stopped.');}}")]:
 p=root/file;s=p.read_text(encoding='utf-8');assert before in s;p.write_text(s.replace(before,after),encoding='utf-8')
