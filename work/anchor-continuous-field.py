from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text().replace('fade*=np.exp(-.5*(inner_dist/max(.75,gap*.3))**2)','q=np.clip(1-inner_dist/max(1,gap*.55),0,1);fade*=q*q*(3-2*q)');p.write_text(s)
