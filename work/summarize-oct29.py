from pathlib import Path
import json
r=Path('exports/images/generation-validation-20261029')
for name in ['sailor','purple','mint-dress','rose-cardigan']:
 p=json.loads((r/name/'outfit-report.json').read_text());print(name,p['fit_version'],p['torso_pixels_exposed'],p['opening_body_pixels_removed'],p.get('sleeve_resize'),p['fit_warnings'])
