from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
overlay=root/'data/applio-training/offline-overlay'
overlay.mkdir(exist_ok=True)
site=(root/'data/applio-training/runtime/Lib/site-packages/sitecustomize.py').read_text(encoding='utf-8')
site=site.replace("sys.path.append('C:/AI/Applio/env/Lib/site-packages')", '# Use the working music runtime dependencies; never mix Python ABIs.')
(overlay/'sitecustomize.py').write_text(site,encoding='utf-8')
src=Path('C:/AI/Applio/env/Lib/site-packages')
shutil.copy2(src/'wget.py',overlay/'wget.py')
shutil.copytree(src/'noisereduce',overlay/'noisereduce',dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__'))
print(overlay)
