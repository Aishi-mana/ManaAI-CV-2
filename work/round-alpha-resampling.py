from pathlib import Path
for name in ['scripts/garment_only.py','scripts/clothing_fit.py']:
 p=Path(name);s=p.read_text().replace('np.clip(np.concatenate([colors,alpha],axis=2)*255,0,255).astype(np.uint8)','np.rint(np.clip(np.concatenate([colors,alpha],axis=2)*255,0,255)).astype(np.uint8)').replace('np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255).astype(np.uint8)','np.rint(np.clip(np.concatenate([rgb,alpha],axis=2)*255,0,255)).astype(np.uint8)');p.write_text(s)
