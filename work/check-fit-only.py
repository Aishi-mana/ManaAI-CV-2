from pathlib import Path
p=Path('tests/test_garment_only.py');s=p.read_text(encoding='utf-8-sig');s+='''
 def test_fit_only_preserves_fabric_without_calling_automatic_cleanup(self):
  rgb,body=self.sample()
  with patch('garment_only.refine_outfit_matte',side_effect=AssertionError('matte cleanup called')),patch('garment_only.clear_underarm_background',side_effect=AssertionError('underarm cleanup called')),patch('outfit_quality.clean_collar_insert',side_effect=AssertionError('collar cleanup called')),patch('outfit_quality.clean_opening_edges',side_effect=AssertionError('opening cleanup called')):
   out,report=fit_garment_only(rgb,body,cleanup=False)
  self.assertTrue(out[:,:,3].any());self.assertEqual(report['opening_cleanup']['cleanup_mode'],'fit-only');self.assertNotIn('cleanup',report['flow']);self.assertEqual(report['matte_edge_pixels_refined'],0)
''';p.write_text(s,encoding='utf-8')
p=Path('src/components/OutfitPrototype.tsx');s=p.read_text(encoding='utf-8').replace("const pixels=out.getContext('2d')!.getImageData(0,0,out.width,out.height).data", "const pixels=combined.getContext('2d')!.getImageData(0,0,combined.width,combined.height).data");p.write_text(s,encoding='utf-8')
p=Path('src/components/GeneratedOutfits.tsx');s=p.read_text(encoding='utf-8-sig').replace('extract the clothing while keeping its position on her body.','fit the clothing while preserving its fabric. Automatic collar and opening cleanup is off.');p.write_text(s,encoding='utf-8')
