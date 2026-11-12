from pathlib import Path
p=Path('scripts/outfit_quality.py');s=p.read_text();a=s.index('    # The upper dark outline belonged');b=s.index('    if protected is not None:remove&=~protected',a);s=s[:a]+'''    # Retain the upper/back collar rim behind the neck. Only its interior
    # mannequin fill is removed; dark fabric/outline is not a cleanup target.
''' +s[b:];p.write_text(s)
p=Path('scripts/clothing_fit.py');s=p.read_text();s=s.replace('min(1.,max(0.,(y-first)/max(1,h*.025)),(max(0.,(cuff_end-y)/max(1,cuff_end-wrist)) if y>wrist else 1.))','min(1.,(max(0.,(cuff_end-y)/max(1,cuff_end-wrist)) if y>wrist else 1.))');a=s.index('            strip=rgba[y:y+1,x0:x1].astype');b=s.index('            alpha=strip[:,:,3:4]',a);s=s[:a]+'''            # Extend only narrow edge bands. Keep interior folds/embroidery
            # anchored instead of rescaling the entire sleeve on each row.
            strip=rgba[y:y+1].astype(np.float32)/255
            strip[:,:,:3]*=strip[:,:,3:4]
            band=min((x1-x0)/3,max(3,w*.015))
            positions=np.arange(lo,hi,dtype=np.float32)+.5
            map_x=np.interp(positions,[lo,x0+band,x1-band,hi],[x0,x0+band,x1-band,x1]).astype(np.float32)-.5
            strip=cv2.remap(strip,map_x.reshape(1,-1),np.zeros((1,hi-lo),np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
''' +s[b:];p.write_text(s)
