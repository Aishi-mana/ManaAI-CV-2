"""Extract complete closed footwear from a plain white background, without erosion."""
import cv2
import numpy as np


def extract_closed_footwear(rgb,forbidden=None):
    if rgb.dtype!=np.uint8 or rgb.ndim!=3 or rgb.shape[2]!=3:
        raise ValueError('Expected uint8 RGB crop')
    if forbidden is not None and forbidden.shape!=rgb.shape[:2]:
        raise ValueError('Footwear exclusion mask must match the crop')
    white=(rgb.min(axis=2)>235)&((rgb.max(axis=2).astype(int)-rgb.min(axis=2))<18)
    _,labels=cv2.connectedComponents(white.astype(np.uint8),8)
    border=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]));border=border[border!=0]
    outside=np.isin(labels,border)
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
    skin=(hsv[:,:,0]<25)&(hsv[:,:,1]>35)&(hsv[:,:,2]>200)&(hsv[:,:,1]<150)
    keep=~outside&~skin
    if forbidden is not None:keep&=~forbidden.astype(bool)
    n,parts,stats,_=cv2.connectedComponentsWithStats(keep.astype(np.uint8),8)
    if n<=1:raise ValueError('No footwear silhouette found')
    keep=parts==(1+np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    rgba=np.dstack([rgb,keep.astype(np.uint8)*255]);rgba[~keep]=0
    return rgba

