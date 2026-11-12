from pathlib import Path
import sys,json,os,faulthandler
faulthandler.dump_traceback_later(60,repeat=True)
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root/'scripts'))
from singing_job import run
out=root/'exports/singing/genre-rock-integration-20261105';out.mkdir(parents=True,exist_ok=True)
p=dict(data_root=str(root),output=str(out),source=str(root/'exports/singing/original-1793880291450825500/original-song.wav'),
       start=18,seconds=12,whole_song=False,separate=True,extractor='mega-lead',backing_gain=1,trained_voice=True,voice_profile='mousey-trained-v2',genre='rock')
(out/'request.json').write_text(json.dumps(p),encoding='utf-8')
result=run(p)
(out/'result.json').write_text(json.dumps(dict(done=True,error='',**result),indent=2),encoding='utf-8')
assert abs(result['seconds']-12)<.1 and result['genreProfile']['genre']=='rock'
assert result['voiceProfile']['profileId']=='mousey-trained-v2'
print('FULL_GENRE_COVER_READY',flush=True)
