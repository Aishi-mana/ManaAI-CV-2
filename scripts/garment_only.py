"""Body-guided garment-only fitting. No hairstyle mask, parsing erasure or repainting."""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from generated_outfit import remove_outer_background
from clothing_fit import fit_closed_shoes,fit_sleeve_widths,clear_underarm_background,fit_cuff_proportions,fit_shoulder_drape

def refine_outfit_matte(rgba,rgb):
 # Recover partial coverage from a white matte only along the outer contour.
 # Preserve dark outline cores and all interior fabric / decorations.
 out=rgba.copy();near=cv2.dilate((rgba[:,:,3]==0).astype(np.uint8),np.ones((3,3),np.uint8))>0
 color=rgb.astype(np.float32);foreground=cv2.erode(color,np.ones((3,3),np.uint8))
 light=color.min(2);dark=foreground.min(2)
 edge=(rgba[:,:,3]>0)&near&(light>140)&(dark<190)&(light-dark>20)
 fraction=np.clip(np.max((255-color)/np.maximum(1,255-foreground),axis=2),.05,1)
 restored=np.clip((color-255*(1-fraction[:,:,None]))/fraction[:,:,None],0,255)
 out[:,:,:3][edge]=np.rint(restored[edge]).astype(np.uint8)
 out[:,:,3][edge]=np.rint(rgba[:,:,3][edge]*fraction[edge]).astype(np.uint8)
 out[out[:,:,3]==0]=0
 return out,int(edge.sum())

def warp_garment_rgba(rgba,matrix,size):
 # Interpolate premultiplied colors, then unmix. Straight RGBA interpolation
 # against transparent black produces a dark, cut-and-pasted outline.
 pixels=rgba.astype(np.float32)/255;pixels[:,:,:3]*=pixels[:,:,3:4]
 warped=cv2.warpAffine(pixels,matrix,size,flags=cv2.INTER_CUBIC)
 alpha=np.clip(warped[:,:,3:4],0,1)
 colors=np.divide(warped[:,:,:3],alpha,out=np.zeros_like(warped[:,:,:3]),where=alpha>0)
 out=np.rint(np.clip(np.concatenate([colors,alpha],axis=2)*255,0,255)).astype(np.uint8)
 out[out[:,:,3]==0]=0
 return out

def fit_garment_only(rgb,body,port_mask=None,on_stage=None,prompt="",protected=None,cleanup=True):
 stage=on_stage or (lambda value:None)
 stage('fitting_outfit')
 h,w=body.shape[:2]
 source=remove_outer_background(rgb)
 if port_mask is not None:
  if port_mask.shape!=rgb.shape[:2]:raise ValueError('Opening cleanup canvas mismatch')
  source[port_mask]=0
 if cleanup:source,matte_edge_pixels=refine_outfit_matte(source,rgb)
 else:matte_edge_pixels=0
 rgba=np.array(Image.fromarray(source).resize((w,h),Image.Resampling.LANCZOS))
 # A parsed bare-leg fill may be gone while its thin black contour still
 # joins skirt to sock. Clear only narrow rows WITH confirmed removed body.
 leg_outline_pixels=0
 if port_mask is not None:
  removed=np.array(Image.fromarray(port_mask.astype(np.uint8)*255).resize((w,h),Image.Resampling.NEAREST))>0
  thin=[]
  for row in range(round(h*.65),round(h*.90)):
   count=int((rgba[row,:,3]>32).sum())
   if 0<count<=max(12,w*.02) and removed[row].sum()>w*.025:thin.append(row)
  for band in np.split(np.array(thin,dtype=int),np.where(np.diff(thin)>1)[0]+1) if thin else []:
   if len(band)>=max(3,round(h*.004)):
    leg_outline_pixels+=int((rgba[band,:,3]>0).sum());rgba[band]=0
 if (rgba[:round(h*.24),:,3]>128).sum()>64:
  raise ValueError('The model drew a person instead of clothing only. The result was not saved to Wardrobe.')
 n,labels,stats,_=cv2.connectedComponentsWithStats((rgba[:,:,3]>128).astype(np.uint8),8)
 if n<2:raise ValueError('The clothing-only image contains no garment.')
 main=1+int(np.argmax(stats[1:,4]))
 # Cleaning a waist opening can separate blouse and skirt. Fit both together,
 # rather than mistaking the now-larger skirt for the complete main garment.
 for label in range(1,n):
  x0,y0,ww,hh,area=stats[label]
  if label!=main and y0+hh*.5<h*.78 and area>=stats[main,4]*.08:labels[labels==label]=main
 ys,xs=np.where(labels==main);x,y=int(xs.min()),int(ys.min());bw,bh=int(xs.max()-x+1),int(ys.max()-y+1)
 # The body guide supplies the neck/shoulder transition. Preserve horizontal
 # coordinates and garment hem; compress only excess height above the hem.
 spans=[]
 for row in range(round(h*.27),round(h*.34)):
  xs=np.where(body[row,:,3]>128)[0]
  if len(xs)>w*.025:spans.append((len(xs),row,int(xs.min()),int(xs.max()+1)))
 if not spans:raise ValueError('Body guide has no identifiable neck.')
 width,neck,left,right=min(spans)
 if width>w*.15:raise ValueError('Body guide neck is ambiguous; review manually.')
 shoulder=next((row for span,row,_,_ in spans if row>neck and span>width*2),None)
 if shoulder is None:raise ValueError('Body guide shoulder transition is missing.')
 target_top=neck+round(width*.3)
 shift=target_top-int(y)
 if abs(shift)>h*.08:raise ValueError('Generated garment is too far from the body guide; fitting needs review.')
 # Transform the connected main garment as a whole. No shoulder clipping.
 # Carry antialiased edge pixels with the garment. Leaving low-alpha pixels
 # at the old position creates a ghost outline after moving/resizing clothing.
 main_mask=labels==main
 fringe=(cv2.dilate(main_mask.astype(np.uint8),np.ones((7,7),np.uint8))>0)&(labels==0)&(rgba[:,:,3]>0)
 main_mask|=fringe
 upper=rgba.copy();upper[~main_mask]=0
 matrix=np.array([[1,0,0],[0,(bh-shift)/bh,target_top-y*(bh-shift)/bh]],np.float32)
 stage('resizing_outfit')
 # Match torso/sleeve coverage to the body with modest ease. Use several
 # rows so a pocket, cuff or a single stray pixel cannot dictate the resize.
 vertical=warp_garment_rgba(upper,matrix,(w,h))
 ratios=[];offsets=[];centers=[]
 for row in range(round(h*.32),round(h*.53),4):
  bx=np.where(body[row,:,3]>128)[0];gx=np.where(vertical[row,:,3]>128)[0]
  if len(bx)>w*.15 and len(gx)>w*.15:
   ratios.append((bx[-1]-bx[0]+1+w*.012)/(gx[-1]-gx[0]+1))
   offsets.append((bx[0]+bx[-1])/2);centers.append((gx[0]+gx[-1])/2)
 sx=float(np.clip(np.median(ratios),.94,1.08)) if ratios else 1.
 gc=float(np.median(centers)) if centers else x+bw/2
 bc=float(np.median(offsets)) if offsets else gc
 dx=float(np.clip(bc-gc,-w*.02,w*.02))
 matrix[0]=[sx,0,gc*(1-sx)+dx]
 torso_target=np.zeros((h,w),bool);body_center=round((left+right)/2)
 for row in range(shoulder+round(width*.8),round(h*.5)):
  occupied=body[row,:,3]>128
  if not occupied[body_center]:continue
  lo=body_center;hi=body_center
  while lo>0 and occupied[lo-1]:lo-=1
  while hi+1<w and occupied[hi+1]:hi+=1
  if hi-lo>4:torso_target[row,lo+2:hi-1]=True
 # Check the fit and enlarge only as much as needed to cover the torso.
 for candidate_scale in np.linspace(sx,max(sx,1.12),7):
  matrix[0]=[candidate_scale,0,gc*(1-candidate_scale)+dx]
  fitted=warp_garment_rgba(upper,matrix,(w,h))
  sx=float(candidate_scale)
  if not (torso_target&(fitted[:,:,3]<220)).any():break
 result=rgba.copy();result[main_mask]=0
 a=Image.fromarray(result);a.alpha_composite(Image.fromarray(fitted));result=np.array(a)
 # Resize footwear, then verify coverage before final opening cleanup.
 if cleanup:result,negative_space=clear_underarm_background(result,body)
 else:negative_space={'underarm_background_pixels_removed':0}
 result,drape=fit_shoulder_drape(result,body,[left-2,neck-20,right+2,shoulder])
 result,proportions=fit_cuff_proportions(result,body,prompt)
 from outfit_quality import broader_fit_checks
 measured,_=broader_fit_checks(result,body,[left-2,neck-20,right+2,shoulder],prompt)
 sleeve_checks=[measured.get(s+'_sleeve',{}) for s in ['left','right']]
 already_fitted=bool(proportions.get('cuffs')) and not proportions.get('review_required') and all(c.get('passed') and c.get('fraction_exposed',1)<=.003 and c.get('cuff_exposed_pixels',1)==0 for c in sleeve_checks)
 if already_fitted:
  sleeves={'rows_resized':0,'coverage_warp_skipped':True,'reason':'Anatomical sleeve fit already covers the arm and wrist within edge tolerance.'}
 else:result,sleeves=fit_sleeve_widths(result,body,prompt)
 sleeves.update(negative_space);sleeves['proportions']=proportions
 sleeves['shoulder_drape']=drape
 result,feet=fit_closed_shoes(result,body,allow_reposition=True)
 stage('checking_outfit_fit')
 fit_issues=[]
 if proportions.get('review_required'):
  fit_issues.append('Sleeve proportions need review: the generated sleeve joins the torso or skirt ambiguously. No forced cuff narrowing was applied.')
 elif any(not c.get('fitted') for c in proportions.get('cuffs',[])):
  fit_issues.append('Cuff proportions could not be measured reliably; inspect their size and alignment before approving.')
 if not feet['feet'] or any(not f.get('fitted') for f in feet['feet']):
  fit_issues.append('Socks or shoes leave exposed skin; adjust their fit in Atelier before approving.')
 center=(left+right)/2
 torso=np.zeros((h,w),bool)
 for row in range(shoulder+round(width*.8),round(h*.5)):
  occupied=body[row,:,3]>128
  if not occupied[round(center)]:continue
  a=round(center);b=a
  while a>0 and occupied[a-1]:a-=1
  while b+1<w and occupied[b+1]:b+=1
  if b-a>4:torso[row,a+2:b-1]=True
 torso_missed=int((torso&(result[:,:,3]<220)).sum())
 if torso_missed:
  fit_issues.append('The torso fit leaves exposed skin; adjust the clothing in Atelier before approving.')
 checked_torso=torso&(result[:,:,3]>=220)
 stage('cleaning_outfit')
 # Preserve the generated collar opening. Never stamp a fixed polygon through
 # fabric: skin/confirmed insert cleanup below follows the actual source edge.
 bottom=shoulder+round(width*.15)
 # Refine only anatomical opening rims; preserve all checked coverage and hair-hidden pixels.
 from outfit_quality import clean_opening_edges,broader_fit_checks,clean_collar_insert
 coverage=torso.copy();yy,xx=np.indices((h,w))
 for foot in feet['feet']:
  half=xx<w//2 if foot['side']=='left' else xx>=w//2
  coverage|=(body[:,:,3]>128)&half&(yy>=foot.get('coverage_start_row',h))
 if cleanup:
  result,collar_cleanup=clean_collar_insert(result,[left-2,neck-20,right+2,bottom],protected,body)
  result,opening_cleanup=clean_opening_edges(result,body,[left-2,neck-20,right+2,bottom],feet,protected,coverage)
 else:
  collar_cleanup={};opening_cleanup={'cleanup_mode':'fit-only','collar_pixels_removed':0,'shoulder_pixels_modified':0}
 opening_cleanup.update(collar_cleanup)
 fit_checks,fit_warnings=broader_fit_checks(result,body,[left-2,neck-20,right+2,bottom],prompt)
 fit_warnings=fit_issues+fit_warnings
 # Cleanup is forbidden from reopening any already checked covered region.
 if (checked_torso&(result[:,:,3]<220)).any():raise ValueError('Opening cleanup affected torso coverage.')
 return result,{'fit_version':9,'matte_edge_pixels_refined':matte_edge_pixels,'leg_outline_pixels_removed':leg_outline_pixels,'neck_cleanup_policy':'generated-opening-only','sleeve_resize':sleeves,'fit_checks':fit_checks,'fit_warnings':fit_warnings,'opening_cleanup':opening_cleanup,'automatic_save_allowed':not fit_warnings,'source':'body-guided-clothing-only','shoulder_erasure':False,'shoulder_repainting':False,'hair_mask_used':False,'neck_bounds':[left-2,neck-20,right+2,bottom],'main_transform':matrix.tolist(),'body_width_scale':sx,'body_center_shift':dx,'footwear':feet,'review_required':True,'fit_check_passed':not fit_warnings,'torso_pixels_exposed':torso_missed,'flow':['generate','fit','resize','check-fit']+(['cleanup'] if cleanup else [])+['review-save']}

def prepare_garment_only(directory,body_path):
 directory=Path(directory)
 metadata={}
 for filename in ['request.json','generation.json']:
  if (directory/filename).is_file():metadata.update(json.loads((directory/filename).read_text(encoding='utf-8')))
 strict=metadata.get('outfitSourcePolicy')=='clothing-only-strict'
 rgb=np.array(Image.open(directory/'image.png').convert('RGB'))
 body=np.array(Image.open(body_path).convert('RGBA'))
 # Some outputs retain bare legs even when instructed clothing-only. Remove
 # only confirmed exposed body at distal openings, never shoulder fabric.
 hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV);yy,xx=np.indices(rgb.shape[:2])
 skin_color=(hsv[:,:,0]<25)&(hsv[:,:,1]>30)&(hsv[:,:,2]>100)
 candidate=skin_color&(yy>rgb.shape[0]*.38)
 collar_window=(yy>rgb.shape[0]*.265)&(yy<rgb.shape[0]*.335)&(xx>rgb.shape[1]*.40)&(xx<rgb.shape[1]*.60)
 collar_candidate=skin_color&collar_window
 port_mask=np.zeros(rgb.shape[:2],bool)
 if strict or candidate.sum()>500 or collar_candidate.sum()>40:
  parsed=directory/'opening-parsing'
  if not (parsed/'parsing.npz').is_file():
   from clothing_extract import extract
   model=Path('C:/AI/ManaAI-CV-2/models/clothing-segformer-b2')
   extract(directory/'image.png',model,parsed)
  data=np.load(parsed/'parsing.npz',allow_pickle=False)
  if strict:
   anatomy=skin_color&np.isin(data['labels'],[11,12,13,14,15])
   count=int(anatomy.sum())
   validation={'policy':'clothing-only-strict','accepted':count<=16,'confirmed_anatomy_pixels':count,'source_modified':False}
   (directory/'source-validation.json').write_text(json.dumps(validation,indent=2),encoding='utf-8')
   if count>16:
    raise ValueError('The model generated body parts instead of a clothing-only layer. The unmodified source was rejected before fitting; no body-removal cleanup was attempted.')
   # Strict sources must already be body-free. Do not route them through the
   # legacy anatomy-erasure fallback, even when a color resembles skin.
   candidate=np.zeros_like(candidate);collar_candidate=np.zeros_like(collar_candidate);skin_color=np.zeros_like(skin_color)
  # Neck/face class11 in the central collar is generated anatomy, not fabric.
  # Reject rather than present an extra neck as a successful fitted outfit.
  if (collar_candidate&(data['labels']==11)).sum()>40:
   raise ValueError('The clothing-only source contains a generated neck at the collar. It was retained for inspection, not accepted as a wearable outfit.')
  seed=candidate&np.isin(data['labels'],[12,13,14,15])
  near=cv2.dilate(seed.astype(np.uint8),np.ones((7,7),np.uint8))>0
  clothing=np.isin(data['labels'],[4,5,6,7,8,9,10])
  port_mask=near&~clothing&(yy>rgb.shape[0]*.5)
  # Thin skin bands in waist/sock openings can be partially mislabelled as fabric.
  # Grow only color-connected thin bands confirmed by a body-class seed, below shoulders.
  bands=skin_color&(yy>rgb.shape[0]*.38)
  n,parts,stats,_=cv2.connectedComponentsWithStats(bands.astype(np.uint8),8)
  for label in range(1,n):
   x,y,bw,bh,area=stats[label]
   thin=bh<=rgb.shape[0]*.035 and bw>=bh*2
   lower_limb=y>rgb.shape[0]*.65 and bh<=rgb.shape[0]*.07 and bw>=bh*.5
   if not (thin or lower_limb) or area<20:continue
   component=parts==label
   confirmed=int((component&np.isin(data['labels'],[11,12,13,14,15])).sum())
   above=data['labels'][max(0,y-8):y,x:x+bw]
   below=data['labels'][y+bh:min(rgb.shape[0],y+bh+14),x:x+bw]
   waist=(rgb.shape[0]*.38<y<rgb.shape[0]*.52 and abs(x+bw/2-rgb.shape[1]/2)<rgb.shape[1]*.12
          and above.size and below.size and (above==4).mean()>.8 and np.isin(below,[5,6]).mean()>.8)
   if confirmed>=max(3,area*.01) or (thin and waist):port_mask|=component
 from image_job import status
 request=json.loads((directory/'request.json').read_text(encoding='utf-8')) if (directory/'request.json').is_file() else {}
 protected=None
 if (directory/'avatar-front-hair.png').is_file():
  hair=np.array(Image.open(directory/'avatar-front-hair.png').convert('RGBA'))
  if hair.shape==body.shape:protected=hair[:,:,3]>0
 result,report=fit_garment_only(rgb,body,port_mask,lambda value:status(directory,stage=value),request.get('prompt',''),protected,cleanup=not strict)
 report['opening_body_pixels_removed']=int(port_mask.sum())
 Image.fromarray(result).save(directory/'outfit.png')
 report.update(width=body.shape[1],height=body.shape[0])
 (directory/'outfit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 return report
