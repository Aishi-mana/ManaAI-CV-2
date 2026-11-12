import unittest,sys,copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from source_band import plan,checked_lead

class SourceBandTests(unittest.TestCase):
 def setUp(self):
  self.notes=[[0.,8.,48,.8],[0.,8.,60,.8],[0.,8.,64,.8],[0.,8.,67,.8]]
  self.grid={'beats':[.2+i*.5 for i in range(16)],'downbeats':[.2,2.2,4.2,6.2]}
 def test_four_pop_leads_share_music_and_keep_input_untouched(self):
  original=copy.deepcopy(self.notes)
  plans=[plan(self.notes,self.grid,8,'pop',lead) for lead in ['electric-piano','acoustic-piano','synth-lead','clean-guitar']]
  for p in plans[1:]:
   for key in ['melody','bass','drums','pad','comp','beat_map']:self.assertEqual(plans[0][key],p[key])
  self.assertEqual(original,self.notes)
 def test_bass_has_source_pitch_evidence_and_drums_follow_source_grid(self):
  for genre in ['rock','jazz','pop']:
   p=plan(self.notes,self.grid,8,genre)
   for n,e in zip(p['bass'],p['bassEvidence']):self.assertEqual(n[2]%12,self.notes[e['source_note_index']][2]%12)
   self.assertTrue(all(0<=n[0]<n[1]<=8 for n in p['drums']))
   self.assertEqual(p['beat_map'],self.grid)
 def test_explicit_defaults_and_invalid_combinations(self):
  self.assertEqual(checked_lead('pop'),'electric-piano');self.assertEqual(checked_lead('jazz'),'sax')
  self.assertEqual(checked_lead('jazz','clarinet'),'clarinet')
  for g,l in [('jazz','synth-lead'),('pop','clarinet'),('country','sax')]:
   with self.assertRaises(ValueError):checked_lead(g,l)
 def test_bad_duration_or_beats_fail_instead_of_inventing_grid(self):
  for duration in [1,361,float('nan')]:
   with self.assertRaises(ValueError):plan(self.notes,self.grid,duration,'pop')
  for beats in [[],[.1,.2],[.3,.2,.4,.5]]:
   with self.assertRaises(ValueError):plan(self.notes,{'beats':beats},8,'pop')
 def test_rock_leads_use_the_same_guitar_notes_and_rhythm(self):
  a=plan(self.notes,self.grid,8,'rock');b=plan(self.notes,self.grid,8,'rock','crunch-guitar')
  self.assertEqual(a['lead'],'electric-guitar')
  self.assertEqual(dict(a,lead=b['lead']),b)
 def test_rock_organ_uses_upper_melody_with_same_rhythm(self):
  guitar=plan(self.notes,self.grid,8,'rock')
  organ=plan(self.notes,self.grid,8,'rock','rock-organ')
  self.assertEqual(organ['melody'],[[0.,8.,67,.8]])
  for key in ['bass','drums','beat_map']:self.assertEqual(guitar[key],organ[key])
 def test_country_has_fiddle_guitar_and_light_backbeat(self):
  country=plan(self.notes,self.grid,8,'country')
  self.assertEqual(country['lead'],'fiddle')
  for lead in ('clean-guitar','harmonica','banjo','pedal-steel','acoustic-guitar'):
   self.assertEqual(dict(country,lead=lead),plan(self.notes,self.grid,8,'country',lead))
  self.assertEqual([n[2] for n in country['melody']],[67])
  self.assertEqual([n[2] for n in country['comp']],[48])
  self.assertTrue(all(n[0] in self.grid['beats'] for n in country['bass']))
  self.assertEqual({n[2] for n in country['drums']},{36,37,42})
 def test_follow_bass_changes_only_the_bass_plan(self):
  original=plan(self.notes,self.grid,8,'rock')
  notes=[[1.,1.3,39,.8],[1.5,1.8,43,.7]]
  self.assertEqual(plan(self.notes,self.grid,8,'rock',bass_override=notes),
                   dict(original,bass=notes,bassEvidence=[]))
 def test_vocal_melody_can_use_low_guitar_notes_for_harmony(self):
  vocal=[[1.,2.,69,.8]]
  score=plan([self.notes[0]],self.grid,8,'country',melody_override=vocal)
  self.assertEqual(score['melody'],vocal)
  self.assertTrue(score['bass'] and score['drums'])
 def test_follow_piano_uses_the_approved_jazz_plan_and_a_single_rock_lead(self):
  for source in ('piano','keys'):
   self.assertEqual(plan(self.notes,self.grid,8,'jazz'),plan(self.notes,self.grid,8,'jazz',source=source))
  rock=plan(self.notes,self.grid,8,'rock',source='piano')
  self.assertEqual([n[2] for n in rock['melody']],[67])
  self.assertEqual(rock['bass'],plan(self.notes,self.grid,8,'rock')['bass'])
 def test_jazz_alternates_use_exact_same_note_plan(self):
  baseline=plan(self.notes,self.grid,8,'jazz','sax')
  for lead in ('clarinet','muted-trumpet'):
   self.assertEqual(dict(baseline,lead=lead),plan(self.notes,self.grid,8,'jazz',lead))

if __name__=='__main__':unittest.main()
