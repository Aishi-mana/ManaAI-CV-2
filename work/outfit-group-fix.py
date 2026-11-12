from pathlib import Path
p=Path('scripts/garment_only.py');s=p.read_text(encoding='utf-8').replace(" main=1+int(np.argmax(stats[1:,4]));x,y,bw,bh,_=stats[main]",''' main=1+int(np.argmax(stats[1:,4]))
 # Cleaning a waist opening can separate blouse and skirt. Fit both together,
 # rather than mistaking the now-larger skirt for the complete main garment.
 for label in range(1,n):
  x0,y0,ww,hh,area=stats[label]
  if label!=main and y0+hh*.5<h*.78 and area>=stats[main,4]*.08:labels[labels==label]=main
 ys,xs=np.where(labels==main);x,y=int(xs.min()),int(ys.min());bw,bh=int(xs.max()-x+1),int(ys.max()-y+1)''',1);p.write_text(s,encoding='utf-8')
