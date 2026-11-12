from pathlib import Path
p=Path('scripts/garment_only.py');s=p.read_text().replace(' upper=rgba.copy();upper[labels!=main]=0',''' # Carry antialiased edge pixels with the garment. Leaving low-alpha pixels
 # at the old position creates a ghost outline after moving/resizing clothing.
 main_mask=labels==main
 fringe=(cv2.dilate(main_mask.astype(np.uint8),np.ones((7,7),np.uint8))>0)&(labels==0)&(rgba[:,:,3]>0)
 main_mask|=fringe
 upper=rgba.copy();upper[~main_mask]=0''').replace('result=rgba.copy();result[labels==main]=0','result=rgba.copy();result[main_mask]=0');p.write_text(s)
