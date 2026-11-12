from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text();a=s.index('        region=half&');b=s.index('        x0,x1',a)
s=s[:a]+'''        # Identify complete footwear components before selecting a lower ROI.
        # Cropping at 78% cut long hems into false shoe components and discarded
        # valid socks starting above that row. Never move the upper garment.
        mask=((rgba[:,:,3]>0)&half).astype(np.uint8)
        count,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
        source=np.zeros((h,w),bool)
        for label in range(1,count):
            bx,by,bw,bh,area=stats[label]
            if area>=30 and by>h*.70 and by+bh>h*.90:
                source|=labels==label
        region=source
        y,x=np.where(source)
        if len(x)<30:
            reports.append({'side':side,'fitted':False,'reason':'No separate footwear found'});continue
''' +s[b:]
s=s.replace('result[region]=0','result[source]=0');p.write_text(s)
