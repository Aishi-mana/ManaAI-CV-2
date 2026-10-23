from pathlib import Path
import sys,json
sys.path.insert(0,str(Path.cwd()/'scripts'));from original_song_job import build_request,fit_generated_lyrics,lyric_budget
for folder in sorted(Path('exports/singing').glob('original-*'),key=lambda x:x.stat().st_mtime,reverse=True):
 file=folder/'request.json';planned=folder/'ace-planner-original.json'
 if not file.exists() or not planned.exists():continue
 p=json.loads(file.read_text(encoding='utf-8'))
 if p.get('instrumental') is not False or p.get('duration')!=90:continue
 raw=json.loads(planned.read_text(encoding='utf-8'));request=build_request(p);fitted,adjusted=fit_generated_lyrics(raw['lyrics'],request)
 count=lambda text:len([line for line in text.splitlines() if line.strip() and not line.startswith('[')])
 print(json.dumps({'savedPlan':folder.name,'targetSeconds':90,'previousLyricLines':count(raw['lyrics']),'fittedLyricLines':count(fitted),'budget':lyric_budget(request),'shortened':adjusted,'endingReserved':fitted.splitlines()[-2]=='[Outro]'}));break
