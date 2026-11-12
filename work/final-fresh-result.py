from pathlib import Path
import json
p=Path('exports/images/fresh-production-20261030/final-lavender');r=json.loads((p/'outfit-report.json').read_text());print(r['fit_warnings']);print(r['footwear']);print(r['fit_checks']);print(r['opening_cleanup'])
