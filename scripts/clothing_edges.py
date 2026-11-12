"""Small-gap alpha cleanup for extracted clothing; does not invent hidden garment panels."""
import cv2
import numpy as np


def polish_edges(rgba):
    if rgba.ndim!=3 or rgba.shape[2]!=4 or rgba.dtype!=np.uint8:
        raise ValueError('Expected uint8 RGBA')
    mask=(rgba[:,:,3]>=128).astype(np.uint8)
    if not mask.any():return np.zeros_like(rgba),{'added_pixels':0,'removed_pixels':0}
    kernel=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))
    smooth=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,kernel)
    smooth=cv2.medianBlur(smooth,5)
    # Fill only small contour gaps. Colors come from the closest existing garment
    # pixel, rather than the body/background underneath the extracted image.
    _,nearest=cv2.distanceTransformWithLabels(1-mask,cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
    colors=np.zeros((int(nearest.max())+1,3),np.uint8)
    colors[nearest[mask>0]]=rgba[:,:,:3][mask>0]
    result=rgba.copy();added=(smooth>0)&(mask==0)
    result[:,:,:3][added]=colors[nearest[added]]
    # A narrow coverage ramp smooths jagged pixel steps without a broad blur.
    coverage=cv2.GaussianBlur(smooth.astype(np.float32),(3,3),.65)
    alpha=np.clip(coverage*255,0,255).astype(np.uint8)
    fringe=(alpha>0)&(smooth==0)
    _,near_smooth=cv2.distanceTransformWithLabels(1-smooth,cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
    palette=np.zeros((int(near_smooth.max())+1,3),np.uint8);palette[near_smooth[smooth>0]]=result[:,:,:3][smooth>0]
    result[:,:,:3][fringe]=palette[near_smooth[fringe]]
    result[:,:,3]=alpha;result[alpha==0]=0
    return result,{'added_pixels':int(added.sum()),'removed_pixels':int(((mask>0)&(smooth==0)).sum()),'review_required':True}
