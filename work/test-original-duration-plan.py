from pathlib import Path
p=Path('scripts/test_original_song_job.py');s=p.read_text(encoding='utf-8');i=s.index("if __name__=='__main__'")
tests='''    def test_automatic_lyrics_fit_before_audio_codes(self):
        import soundfile as sf
        import numpy as np
        workspace=Path(__file__).resolve().parents[1]/'work'
        with tempfile.TemporaryDirectory(dir=workspace) as temp:
            out=Path(temp);p=self.brief();p.update(output=temp,lyrics='',duration=90)
            long_lyrics='[Verse 1]\\n'+'\\n'.join(['A small light is shining here']*40)+'\\n[Outro]\\nNow we rest at home'
            calls=[]
            def fake_run(args,**kwargs):
                request=Path(args[args.index('--request')+1]);sent=json.loads(request.read_text());calls.append(request.name)
                if request.name=='ace-lyrics.json':
                    self.assertEqual(sent['lm_mode'],'inspire')
                    self.assertNotIn('audio_codes',sent)
                    (out/'ace-lyrics0.json').write_text(json.dumps({'lyrics':long_lyrics,'keyscale':'C major','timesignature':'4'}))
                elif request.name=='ace-request.json':
                    self.assertTrue(sent['lyrics'].endswith('[Outro]\\nNow we rest at home'))
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
        long='[Verse]\\n'+'\\n'.join(['We walk together in the light']*30)+'\\n[Outro]\\nWe are home'
        fitted,adjusted=song.fit_generated_lyrics(long,request)
        lines=[x for x in fitted.splitlines() if not x.startswith('[')]
        max_lines,max_words=song.lyric_budget(request)
        self.assertTrue(adjusted)
        self.assertLessEqual(len(lines),max_lines)
        self.assertLessEqual(sum(len(x.split()) for x in lines),max_words)
        self.assertTrue(fitted.endswith('[Outro]\\nWe are home'))
        for empty in ['', '[Instrumental]', '[Verse]']:
            with self.assertRaises(ValueError):song.fit_generated_lyrics(empty,request)
'''
p.write_text(s[:i]+tests+s[i:],encoding='utf-8')
