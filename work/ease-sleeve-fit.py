from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text().replace('        for y,parts in body_rows:\n            if y>wrist:continue','''        first=body_rows[0][0]
        for y,parts in body_rows:
            if y>wrist:continue''');s=s.replace('            if (hi-lo)/(x1-x0)>1.6:', '''            # Ease the change into the joined upper sleeve and out through the
            # cuff instead of introducing a horizontal resampling seam.
            blend=min(1.,max(0.,(y-first)/max(1,h*.025)),max(0.,(wrist-y)/max(1,h*.012)))
            blend=blend*blend*(3-2*blend)
            lo=round(x0+(lo-x0)*blend);hi=round(x1+(hi-x1)*blend)
            if (hi-lo)/(x1-x0)>1.6:''');p.write_text(s)
