from pathlib import Path
p=Path('scripts/singing_job.py');s=p.read_text(encoding='utf-8-sig').replace("    os.environ['CUDA_VISIBLE_DEVICES'] = ''", "    os.environ['NUMBA_CACHE_DIR'] = str(root / 'data/music-cache/numba')\n    os.environ['CUDA_VISIBLE_DEVICES'] = ''",1);p.write_text(s,encoding='utf-8')
