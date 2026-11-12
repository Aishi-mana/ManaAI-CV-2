from pathlib import Path
import json
p=Path('exports/images/fresh-production-20261030/apricot-blouse');r=json.loads((p/'outfit-report.json').read_text());print(r['neck_bounds'],r['opening_cleanup'],r['footwear'])
