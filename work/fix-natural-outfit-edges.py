from pathlib import Path
p=Path('scripts/garment_only.py');s=p.read_text();at=s.index('def fit_garment_only');s=s[:at]+'''def warp_garment_rgba(rgba,matrix,size):
 # Interpolate premultiplied colors, then unmix. Straight RGBA interpolation
 # against transparent black produces a dark, cut-and-pasted outline.
 pixels=rgba.astype(np.float32)/255;pixels[:,:,:3]*=pixels[:,:,3:4]
 warped=cv2.warpAffine(pixels,matrix,size,flags=cv2.INTER_CUBIC)
 alpha=np.clip(warped[:,:,3:4],0,1)
 colors=np.divide(warped[:,:,:3],alpha,out=np.zeros_like(warped[:,:,:3]),where=alpha>0)
 out=np.clip(np.concatenate([colors,alpha],axis=2)*255,0,255).astype(np.uint8)
 out[out[:,:,3]==0]=0
 return out

''' +s[at:];s=s.replace('cv2.warpAffine(upper,matrix,(w,h),flags=cv2.INTER_LINEAR)','warp_garment_rgba(upper,matrix,(w,h))');a=s.index(' # Clean only the CENTRAL neck opening');b=s.index(' # Refine only anatomical opening rims;',a);s=s[:a]+''' # Preserve the generated collar opening. Never stamp a fixed polygon through
 # fabric: skin/confirmed insert cleanup below follows the actual source edge.
 bottom=shoulder+round(width*.15)
''' +s[b:];s=s.replace("'fit_version':8","'fit_version':9,'neck_cleanup_policy':'generated-opening-only'");p.write_text(s)
p=Path('tests/test_garment_only.py');s=p.read_text().replace('from garment_only import fit_garment_only','from garment_only import fit_garment_only,warp_garment_rgba').replace("r['fit_version'],8","r['fit_version'],9");a=s.index(' def test_rejects_person');s=s[:a]+''' def test_affine_keeps_light_edge_color_at_partial_alpha(self):
  a=np.zeros((40,40,4),np.uint8);a[5:35,5:35]=[210,225,240,255]
  out=warp_garment_rgba(a,np.array([[1,0,.4],[0,1,.4]],np.float32),(40,40))
  edge=(out[:,:,3]>20)&(out[:,:,3]<220)
  self.assertTrue(edge.any());self.assertLess(np.max(np.abs(out[:,:,:3][edge].astype(int)-[210,225,240])),3)
 def test_high_collar_fabric_is_not_cut_by_fixed_neck_polygon(self):
  rgb,body=self.sample();out,r=fit_garment_only(rgb,body,prompt='high collar dress')
  self.assertEqual(out[395,422,3],255);self.assertEqual(r['neck_cleanup_policy'],'generated-opening-only')
''' +s[a:];p.write_text(s)
