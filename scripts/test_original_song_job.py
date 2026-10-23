import unittest,json,tempfile
from pathlib import Path
from unittest.mock import patch
import original_song_job as song

class OriginalControls(unittest.TestCase):
    def brief(self,**changes):
        return dict(prompt='Quiet evening.\nTempo: 92 BPM.',lyrics='[Verse]\nStay beside me in the light\nQuiet hearts will sing tonight',duration=15,seed=42,style='gentle-piano',instrumental=False,**changes)
    def test_tempo_is_explicit_and_not_inferred(self):
        p=self.brief();r=song.build_request(p)
        self.assertEqual(r['bpm'],92)
        self.assertEqual(r['guidance_scale'],3.0)
        self.assertNotIn('use_cot_caption',r)
        p['prompt']='92 stars and 71 dreams'
        self.assertNotIn('bpm',song.build_request(p))
        p['prompt']='Tempo: 241 BPM.'
        with self.assertRaises(ValueError):song.build_request(p)
    def test_render_plan_preserves_intent_and_caps_codes(self):
        r=song.build_request(self.brief());plan={'duration':35.2,'bpm':71,'caption':'layered harmonies','lyrics':'changed','audio_codes':','.join(map(str,range(176))),'seed':42}
        adjusted=song.prepare_render_plan(r,plan)
        self.assertEqual(len(adjusted['audio_codes'].split(',')),75)
        self.assertEqual(adjusted['bpm'],92)
        self.assertEqual(adjusted['caption'],plan['caption'])
        self.assertEqual(adjusted['lyrics'],r['lyrics'])
        self.assertEqual(len(plan['audio_codes'].split(',')),176)
        self.assertEqual(adjusted['seed'],42)
    def test_short_codes_and_automatic_lyrics_are_retained(self):
        p=self.brief();p['lyrics']='';r=song.build_request(p)
        plan={'audio_codes':'1,2,3','lyrics':'generated verse','bpm':71}
        result=song.prepare_render_plan(r,plan)
        self.assertEqual(result['audio_codes'],'1,2,3')
        self.assertEqual(result['lyrics'],'generated verse')
        p['instrumental']=True
        self.assertEqual(song.build_request(p)['lyrics'],'[Instrumental]')
        self.assertEqual(song.build_request(p)['guidance_scale'],1.0)
    def test_final_wav_duration_and_raw_evidence(self):
        import soundfile as sf
        import numpy as np
        workspace=Path(__file__).resolve().parents[1]/'work'
        with tempfile.TemporaryDirectory(dir=workspace) as temp:
            out=Path(temp);p=self.brief();p['output']=temp
            def fake_run(args,**kwargs):
                if 'ace-lm.exe' in args[0]:
                    sent=json.loads((out/'ace-request.json').read_text())
                    self.assertNotIn('use_cot_caption',sent)
                    self.assertEqual(sent['bpm'],92)
                    (out/'ace-request0.json').write_text(json.dumps({'duration':35.2,'bpm':71,'caption':'drift','lyrics':'changed','audio_codes':','.join(['1']*176)}))
                else:
                    render=json.loads((out/'ace-request0.json').read_text())
                    self.assertEqual(render['bpm'],92)
                    self.assertEqual(render['duration'],15)
                    self.assertEqual(len(render['audio_codes'].split(',')),75)
                    sf.write(out/'ace-request00.wav',np.ones((int(35.2*8000),2))*.1,8000,subtype='PCM_16')
            with patch.object(song.subprocess,'run',side_effect=fake_run):result=song.run(p)
            self.assertEqual(result['seconds'],15)
            self.assertEqual(sf.info(result['mix']).frames,15*8000)
            self.assertEqual(json.loads((out/'ace-planner-original.json').read_text())['bpm'],71)
            self.assertEqual(json.loads((out/'ace-request0.json').read_text())['bpm'],92)
            self.assertEqual(sf.info(out/'ace-request00.wav').duration,35.2)
            self.assertEqual(sf.read(result['mix'])[0][-1].tolist(),[0,0])
    def test_automatic_lyrics_fit_before_audio_codes(self):
        import soundfile as sf
        import numpy as np
        workspace=Path(__file__).resolve().parents[1]/'work'
        with tempfile.TemporaryDirectory(dir=workspace) as temp:
            out=Path(temp);p=self.brief();p.update(output=temp,lyrics='',duration=90)
            long_lyrics='[Verse 1]\n'+'\n'.join(['A small light is shining here']*40)+'\n[Outro]\nNow we rest at home'
            calls=[]
            def fake_run(args,**kwargs):
                request=Path(args[args.index('--request')+1]);sent=json.loads(request.read_text());calls.append(request.name)
                if request.name=='ace-lyrics.json':
                    self.assertEqual(sent['lm_mode'],'inspire')
                    self.assertNotIn('audio_codes',sent)
                    (out/'ace-lyrics0.json').write_text(json.dumps({'lyrics':long_lyrics,'keyscale':'C major','timesignature':'4'}))
                elif request.name=='ace-request.json':
                    self.assertTrue(sent['lyrics'].endswith('[Outro]\nNow we rest at home'))
                    self.assertLess(len(sent['lyrics']),len(long_lyrics))
                    self.assertEqual(sent['duration'],90)
                    self.assertEqual(sent['bpm'],92)
                    (out/'ace-request0.json').write_text(json.dumps({**sent,'audio_codes':','.join(['1']*440)}))
                else:sf.write(out/'ace-request00.wav',np.ones((2*8000,2))*.1,8000,subtype='PCM_16')
            with patch.object(song.subprocess,'run',side_effect=fake_run):result=song.run(p)
            self.assertEqual(calls,['ace-lyrics.json','ace-request.json','ace-request0.json'])
            self.assertTrue(result['lyricsAdjusted'])
            self.assertFalse(result['durationLimited'])
    def test_generated_lyrics_budget_and_ending(self):
        request=song.build_request(self.brief())
        long='[Verse]\n'+'\n'.join(['We walk together in the light']*30)+'\n[Outro]\nWe are home'
        fitted,adjusted=song.fit_generated_lyrics(long,request)
        lines=[x for x in fitted.splitlines() if not x.startswith('[')]
        max_lines,max_words=song.lyric_budget(request)
        self.assertTrue(adjusted)
        self.assertLessEqual(len(lines),max_lines)
        self.assertLessEqual(sum(len(x.split()) for x in lines),max_words)
        self.assertTrue(fitted.endswith('[Outro]\nWe are home'))
        for empty in ['', '[Instrumental]', '[Verse]']:
            with self.assertRaises(ValueError):song.fit_generated_lyrics(empty,request)
if __name__=='__main__':unittest.main()
