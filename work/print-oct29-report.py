import json
from pathlib import Path
p=Path('exports/images/generation-validation-20261029/mint-dress/outfit-report.json');r=json.loads(p.read_text());print({k:r[k] for k in ['fit_warnings','opening_body_pixels_removed','torso_pixels_exposed','footwear']})
