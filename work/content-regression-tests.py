from pathlib import Path
p=Path('tests/test_garment_only.py');s=p.read_text(encoding='utf-8');s+='''
 def test_waist_skin_band_removed_without_erasing_peach_fabric_or_shoulders(self):
  rgb,body=self.sample();rgb[550:565,350:480]=[250,220,200];rgb[600:610,350:480]=[250,220,200]
  labels=np.zeros(rgb.shape[:2],np.uint8);labels[552:560,400:410]=11;labels[600:610,350:480]=4
  with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1]/'work') as folder:
   p=Path(folder);Image.fromarray(rgb).save(p/'image.png');Image.fromarray(body).save(p/'body.png');(p/'opening-parsing').mkdir();np.savez_compressed(p/'opening-parsing/parsing.npz',labels=labels)
   from garment_only import prepare_garment_only
   report=prepare_garment_only(p,p/'body.png');out=np.array(Image.open(p/'outfit.png'))
   self.assertEqual(report['opening_body_pixels_removed'],1950)
   self.assertEqual(out[410,300,3],255)
   m=np.array(report['main_transform']);x,y=(m@np.array([415,605,1])).round().astype(int);self.assertGreater(out[y,x,3],220)
''';p.write_text(s,encoding='utf-8')
p=Path('tests/generated-hair.test.cjs');s=p.read_text(encoding='utf-8');s+='''
test('hair rejects repeated crown-like top spikes instead of fitting headgear',()=>{const a=picture();fill(a,20,30,80,55);for(const x of [22,32,42,52,62,72])fill(a,x,10,x+3,31);assert.throws(()=>api.cleanHairPanel(a,100,100,'front'),/Crown-like/);});
test('long fringe is uniformly height-bounded rather than stretched across the face',()=>{const b={x:40,y:30,width:300,height:310},source={width:1024,height:768},body={width:843,height:1264},p=api.hairPiece('front',b,source,body),s=Math.max(body.width/source.width,body.height/source.height)*p.transform.scale;assert.ok(b.height*s<=body.height*.225+1e-6);assert.equal(p.transform.stretchY,undefined);assert.ok(Math.abs((body.width-source.width*s)/2+p.transform.x+(b.x+b.width/2)*s-body.width/2)<1e-6);});
''';p.write_text(s,encoding='utf-8')
