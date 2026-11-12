import json
from pathlib import Path
r=json.loads(Path('exports/images/fresh-production-20261030/apricot-blouse/outfit-report.json').read_text());print(r['fit_warnings']);print(r['fit_checks'])
