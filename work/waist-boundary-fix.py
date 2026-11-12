from pathlib import Path
p=Path('scripts/garment_only.py');s=p.read_text(encoding='utf-8').replace("   if confirmed>=max(3,area*.01):port_mask|=component",'''   above=data['labels'][max(0,y-8):y,x:x+bw]
   below=data['labels'][y+bh:min(rgb.shape[0],y+bh+14),x:x+bw]
   waist=(rgb.shape[0]*.38<y<rgb.shape[0]*.52 and abs(x+bw/2-rgb.shape[1]/2)<rgb.shape[1]*.12
          and above.size and below.size and (above==4).mean()>.8 and np.isin(below,[5,6]).mean()>.8)
   if confirmed>=max(3,area*.01) or waist:port_mask|=component''',1);p.write_text(s,encoding='utf-8')
p=Path('tests/test_garment_only.py');s=p.read_text(encoding='utf-8').replace("labels[552:560,400:410]=11;", "labels[542:550,350:480]=4;labels[565:579,350:480]=5;",1);p.write_text(s,encoding='utf-8')
