from pathlib import Path
import sqlite3,json,os
path=Path(os.environ['APPDATA'])/'com.mana.companion/mana.sqlite3'
with sqlite3.connect(path.as_uri()+'?mode=ro',uri=True) as db:
 row=db.execute('select value from app_state where key=?',('mana.code_games.v1',)).fetchone()
state=json.loads(row[0]) if row else {}
out=Path('work/game-revision-review');out.mkdir(exist_ok=True)
for i,game in enumerate(state.get('games',[])):
 target=out/f'game-{i+1}-v{game["version"]}.js';target.write_text(game['code'],encoding='utf-8');print(json.dumps({'file':str(target),'title':game['title'],'version':game['version'],'characters':len(game['code'])}))
for i,report in enumerate(state.get('reports',[])):
 target=out/f'report-{i+1}.js';target.write_text(report['code'],encoding='utf-8');print(json.dumps({'file':str(target),'reason':report['reason'],'frames':report['frames'],'detail':report['detail']}))
