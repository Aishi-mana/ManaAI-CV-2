from pathlib import Path
p=Path('scripts/clothing_fit.py');s=p.read_text().replace('''                        matrix=np.array([[sx,0,cx*(1-sx)+dx]''','''                        penalty=(sx-1)*100+(sy-1)*100+dy+abs(dx)
                        if best is not None and best[2]==0 and penalty>=best[0]:continue
                        matrix=np.array([[sx,0,cx*(1-sx)+dx]''').replace('score=missed*1000+(sx-1)*100+(sy-1)*100+dy+abs(dx)','score=missed*1000+penalty');p.write_text(s)
p=Path('scripts/outfit_quality.py');s=p.read_text().replace('''    remove=labels==label
    near=''', '''    remove=labels==label
    # Remove small enclosed islands inside the discarded neck fill as well
    # (e.g. a generated clothing tag), not the surrounding collar outline.
    contours,_=cv2.findContours(remove.astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    solid=np.zeros((h,w),np.uint8);cv2.drawContours(solid,contours,-1,1,cv2.FILLED)
    islands=(solid>0)&~remove
    count,parts,stats,_=cv2.connectedComponentsWithStats(islands.astype(np.uint8),8)
    for island in range(1,count):
        if stats[island,cv2.CC_STAT_AREA]<=width*width*.10:remove|=parts==island
    near=''' );p.write_text(s)
p=Path('tests/test_outfit_quality.py');s=p.read_text().replace("a[31:37,38:62]=[65,117,102,255]","a[31:37,38:62]=[65,117,102,255];a[33:35,48:52]=[245,245,245,255]");p.write_text(s)
