from pathlib import Path
root=Path(__file__).resolve().parents[1]
repo=root/'work/jasco-audiocraft/audiocraft'
# Keep the checkout isolated; avoid eager loading unrelated model families.
(repo/'__init__.py').write_text("__version__='1.4.0a2'\n",encoding='utf-8')
(repo/'models/__init__.py').write_text('# Isolated inference namespace.\n',encoding='utf-8')
path=repo/'modules/transformer.py';s=path.read_text(encoding='utf-8')
s=s.replace('from xformers import ops','try:\n    from xformers import ops\nexcept ImportError:\n    ops = None  # This runner uses the supported torch attention backend.')
path.write_text(s,encoding='utf-8')
