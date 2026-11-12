from pathlib import Path
for name in ['scripts/clothing_fit.py','scripts/outfit_quality.py']:
 p=Path(name);s=p.read_text().replace('long[- ]sleeve|','long[- ]sleeved?|').replace('short[- ]sleeve|','short[- ]sleeved?|');p.write_text(s)
