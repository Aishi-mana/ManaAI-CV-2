from pathlib import Path
p=Path('scripts/garment_only.py');s=p.read_text(encoding='utf-8').replace(" if not feet['feet'] or any(not f.get('fitted') for f in feet['feet']):\n  raise ValueError('Socks or shoes leave exposed skin; this design needs fitting review.')"," fit_issues=[]\n if not feet['feet'] or any(not f.get('fitted') for f in feet['feet']):\n  fit_issues.append('Socks or shoes leave exposed skin; adjust their fit in Atelier before approving.')")
s=s.replace(" if torso_missed:\n  raise ValueError('The torso fit leaves exposed skin; this design needs fitting review.')", " if torso_missed:\n  fit_issues.append('The torso fit leaves exposed skin; adjust the clothing in Atelier before approving.')\n checked_torso=torso&(result[:,:,3]>=220)")
s=s.replace(" # Cleanup is forbidden", " fit_warnings=fit_issues+fit_warnings\n # Cleanup is forbidden",1).replace("if (torso&(result[:,:,3]<220)).any():raise", "if (checked_torso&(result[:,:,3]<220)).any():raise",1).replace("'fit_check_passed':True", "'fit_check_passed':not fit_warnings",1)
p.write_text(s,encoding='utf-8')
p=Path('tests/test_garment_only.py');s=p.read_text(encoding='utf-8');s=s.replace('import sys,unittest,json,tempfile','import sys,unittest,json,tempfile\nfrom unittest.mock import patch',1)
s+='''
 def test_incomplete_footwear_reaches_review_with_warning_not_failure(self):
  rgb,body=self.sample()
  with patch('garment_only.fit_closed_shoes',side_effect=lambda rgba,body,**kw:(rgba,{'feet':[{'side':'left','fitted':False,'coverage_start_row':1040}]})):
   out,report=fit_garment_only(rgb,body)
  self.assertTrue(out[:,:,3].any())
  self.assertFalse(report['automatic_save_allowed'])
  self.assertFalse(report['fit_check_passed'])
  self.assertTrue(any('Socks or shoes' in warning for warning in report['fit_warnings']))
  self.assertFalse(report['shoulder_erasure'])
''';p.write_text(s,encoding='utf-8')
p=Path('src/components/GeneratedOutfits.tsx');s=p.read_text(encoding='utf-8').replace("setStatus('Resuming fitting from the saved image. No regeneration…');", "setFailedStage('');trackStage('fitting_outfit');setStatus('Resuming fitting from the saved image. No regeneration…');",1);p.write_text(s,encoding='utf-8')
