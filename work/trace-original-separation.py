import faulthandler
faulthandler.dump_traceback_later(30,repeat=True)
from pathlib import Path
import sys
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
print('Importing separator helper',flush=True)
from cover_lead import extract
print('Loading separator model',flush=True)
out=root/'exports/singing/original-direction-preview-2026-10-18/issue-27s-stems'
extract(root,out/'source-24-30s.wav',out)
print('Separation completed',flush=True)
