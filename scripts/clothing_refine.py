"""Conservative local refinement of clothing parser output; never saves to Wardrobe."""
import argparse,json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image


def remove_small(mask,min_area):
    count,labels,stats,_=cv2.connectedComponentsWithStats(mask.astype(np.uint8),8)
    result=np.zeros(mask.shape,np.uint8)
    for i in range(1,count):
        if stats[i,cv2.CC_STAT_AREA]>=min_area:result[labels==i]=1
    return result.astype(bool)


def palette_distance(lab,samples):
    if len(samples)<30:return np.full(lab.shape[:2],999,np.float32)
    samples=samples[::max(1,len(samples)//4000)].astype(np.float32)
    # Small color palettes retain highlight/shadow variation without nearest-pixel overfitting.
    _,_,centers=cv2.kmeans(samples,4,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,30,.2),1,cv2.KMEANS_PP_CENTERS)
    return np.min(np.stack([np.linalg.norm(lab-c,axis=2) for c in centers]),axis=0)


def refine(rgb,labels,probabilities,front_hair_mask=None):
    if rgb.ndim != 3 or rgb.shape[2] != 3 or labels.shape != rgb.shape[:2] or probabilities.shape != (18, *labels.shape):
        raise ValueError("Image, label map and 18-class probabilities must have matching dimensions")
    if rgb.dtype != np.uint8 or not np.isfinite(probabilities).all():
        raise ValueError("Expected uint8 RGB and finite probabilities")
    if front_hair_mask is not None and front_hair_mask.shape != labels.shape:
        raise ValueError("Front hair mask must match the clothing image")
    cv2.setRNGSeed(0)
    keep=np.isin(labels,[4,5,6,7,8,9,10]);original=keep.copy()
    lab=cv2.cvtColor(rgb,cv2.COLOR_RGB2LAB).astype(np.float32)
    skin_seed=np.isin(labels,[11,12,13,14,15])&(probabilities[11:16].max(axis=0)>.85)
    skin_seed&=(lab[:,:,0]>90)&(lab[:,:,1]>130)&(lab[:,:,2]>130)
    hair_seed=(labels==2)&(probabilities[2]>.85)
    skin_distance=palette_distance(lab,lab[skin_seed]);hair_distance=palette_distance(lab,lab[hair_seed])
    interior=cv2.erode(keep.astype(np.uint8),np.ones((15,15),np.uint8)).astype(bool)
    # Pale neutral garments are too similar to silver hair for color-based removal.
    neutral=(lab[:,:,0]>175)&(np.abs(lab[:,:,1]-128)<12)&(np.abs(lab[:,:,2]-128)<12)
    ambiguous_pale=bool(interior.any() and neutral[interior].mean()>.4)
    clothing_distance=palette_distance(lab,lab[interior&(probabilities[4:11].max(axis=0)>.97)])
    shoe_region=np.isin(labels,[9,10])
    # Toe skin may be mislabeled as a shoe. Only apply this stronger skin rule inside shoes.
    sole=np.zeros(keep.shape,bool)
    for shoe_class in (9,10):
        y,x=np.where(labels==shoe_class)
        if len(y):sole[max(y.min(),int(y.min()+.8*(y.max()-y.min()))):, :]|=(labels[max(y.min(),int(y.min()+.8*(y.max()-y.min()))):, :]==shoe_class)
    skin_remove=keep&shoe_region&~sole&(skin_distance<15)&(skin_distance+5<clothing_distance)
    # Remove skin-colored fringes adjacent to the visible neck/face, without
    # searching across the garment for similarly colored decorative details.
    face_near=cv2.dilate(((labels==11)&skin_seed).astype(np.uint8),np.ones((7,7),np.uint8)).astype(bool)
    neck_remove=keep&~shoe_region&face_near&(skin_distance<10)&(skin_distance+5<clothing_distance)
    edge_band=cv2.distanceTransform(keep.astype(np.uint8),cv2.DIST_L2,3)<8
    # Follow a hair-colored fringe inward as one component instead of leaving
    # its thick centre behind. Do not search/remove similar shading inside a
    # white tie or collar: the component must touch the extraction boundary.
    hair_like=keep&~shoe_region&(hair_distance<20)&(hair_distance+4<clothing_distance)
    count,components=cv2.connectedComponents(hair_like.astype(np.uint8),8)
    boundary=edge_band
    touching=np.unique(components[(boundary|(probabilities[2]>.1))&hair_like]);touching=touching[touching!=0]
    hair_remove=np.isin(components,touching)
    # Resolve low-saturation silver-hair pixels that the parser put in the
    # blouse class but still assigns substantial hair probability. Colored
    # fabric and white highlights are not included in this rule.
    silver_fringe=(probabilities[2]>.1)&(np.ptp(rgb.astype(np.int16),axis=2)<45)&(rgb.max(axis=2)<230)
    hair_remove|=keep&~shoe_region&silver_fringe
    face_context=cv2.dilate((labels==11).astype(np.uint8),np.ones((31,31),np.uint8)).astype(bool)
    neutral_shadow=(np.ptp(rgb.astype(np.int16),axis=2)<45)&(rgb.max(axis=2)>100)&(rgb.max(axis=2)<230)
    body_fringe=keep&face_context&neutral_shadow&(probabilities[4:11].max(axis=0)<.85)&(probabilities[11:16].sum(axis=0)>.12)
    neck_remove|=body_fringe
    # Preserve garment pixels concealed by a separate front-hair layer.
    if front_hair_mask is not None:
        hair_remove&=~(front_hair_mask.astype(bool)&(probabilities[4:9].max(axis=0)>.9)&(probabilities[2]<.05)&(probabilities[11:16].sum(axis=0)<.05))
    # Color alone is ambiguous on pale clothing; retain it when garment and hair palettes overlap.
    if ambiguous_pale:
        skin_remove[:]=False;hair_remove[:]=False;neck_remove[:]=False
    protected_cloth=np.zeros(keep.shape,bool)
    if front_hair_mask is not None:
        protected_cloth=original&front_hair_mask.astype(bool)&~shoe_region
        protected_cloth&=(probabilities[4:9].max(axis=0)>.9)&(probabilities[2]<.05)
        protected_cloth&=probabilities[11:16].sum(axis=0)<.05
    keep&=~(skin_remove|hair_remove|neck_remove)
    keep|=protected_cloth
    # Thin outlines from the removed feet can remain attached to the soles.
    # A small opening inside shoe regions removes these wisps without smoothing
    # the entire garment or filling toe holes with invented fabric.
    shoes=keep&shoe_region
    opened=cv2.morphologyEx(shoes.astype(np.uint8),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))).astype(bool)
    shoe_wisps=shoes&~opened
    keep[shoe_region]=opened[shoe_region]
    keep=remove_small(keep,max(12,int(keep.size*.000025)))
    keep|=protected_cloth
    # Subpixel alpha only at the inside of retained edges; don't expand back into skin or hair.
    distance=cv2.distanceTransform(keep.astype(np.uint8),cv2.DIST_L2,3)
    alpha=np.clip(distance/1.5,0,1)*255
    alpha=alpha.astype(np.uint8)
    alpha[protected_cloth]=255
    report={'neck_pixels_removed':int(neck_remove.sum()),'shoe_wisp_pixels_removed':int(shoe_wisps.sum()),'raw_pixels':int(original.sum()),'clean_pixels':int(keep.sum()),'skin_pixels_removed':int(skin_remove.sum()),'hair_pixels_removed':int(hair_remove.sum()),'total_removed_fraction':float((original&~keep).sum()/max(1,original.sum())),'review_required':True,'color_cleanup_skipped_for_pale_fabric':ambiguous_pale}
    return alpha,report


def fit_audit(reference_labels,generated_labels):
    h,w=generated_labels.shape
    ref=cv2.resize(reference_labels,(w,h),interpolation=cv2.INTER_NEAREST)
    checks={}
    for name,classes in [('face',[11]),('left_leg',[12]),('right_leg',[13]),('left_arm',[14]),('right_arm',[15])]:
        def box(mask):
            y,x=np.where(mask)
            if len(x)<30:return None
            return np.array([x.mean()/w,y.mean()/h,(x.max()-x.min()+1)/w,(y.max()-y.min()+1)/h])
        a,b=box(np.isin(ref,classes)),box(np.isin(generated_labels,classes))
        if a is None or b is None:checks[name]={'available':False};continue
        checks[name]={'available':True,'center_shift':float(np.linalg.norm(a[:2]-b[:2])),'width_ratio':float(b[2]/a[2]),'height_ratio':float(b[3]/a[3])}
    failed=[name for name,c in checks.items() if not c.get('available') or c.get('center_shift',1)>.025 or not .8<c.get('height_ratio',0)<1.2]
    return {'landmarks':checks,'alignment_pass':not failed,'failed_checks':failed,'note':'Semantic region alignment is a rough check, not proof of anatomical fit; visual review is required.'}


def run(image_path,parsing_path,output,reference_labels=None):
    out=Path(output);out.mkdir(parents=True,exist_ok=False)
    with Image.open(image_path) as im:rgb=np.array(im.convert('RGB'))
    data=np.load(parsing_path,allow_pickle=False);alpha,report=refine(rgb,data['labels'],data['probabilities'])
    rgba=np.dstack([rgb,alpha]);rgba[alpha==0]=0
    Image.fromarray(rgba).save(out/'clothing.png');Image.fromarray(alpha).save(out/'mask.png')
    bg=Image.new('RGBA',(rgb.shape[1],rgb.shape[0]),(145,155,165,255));bg.alpha_composite(Image.fromarray(rgba));bg.convert('RGB').save(out/'edge-preview.jpg')
    if reference_labels:
        report['fit']=fit_audit(np.array(Image.open(reference_labels)),data['labels'])
    report['automatic_save_allowed']=False
    (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('image');p.add_argument('parsing');p.add_argument('output');p.add_argument('--reference-labels');a=p.parse_args();print(json.dumps(run(a.image,a.parsing,a.output,a.reference_labels),indent=2))

