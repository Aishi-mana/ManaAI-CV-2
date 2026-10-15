"""Regression: direct uploaded instrument tracks have no companion stems."""
import tempfile
from pathlib import Path
from unittest.mock import patch
import numpy as np
import soundfile as sf
import arrangement_job
import arrangement_replacement

class Midi:
    def write(self, path):
        Path(path).write_bytes(b'test-midi')

def run():
    with tempfile.TemporaryDirectory(prefix='builder-replacement-') as folder:
        root=Path(folder)
        guide=root/'guide.wav'
        sf.write(guide,np.sin(np.arange(48000)*.04)*.1,24000)
        # Prepared piano uses the approved path; guitar-to-piano keeps its existing route.
        expected=(np.ones(48000)*.1,Midi(),[[0,2,60,.8]])
        for source in ['piano','piano-banquet']:
            with patch.object(arrangement_replacement,'render_piano_preserving',return_value=expected) as player:
                result=arrangement_replacement.render(guide,2,root,'piano',bank='separate',source_name=source)
                assert result is expected
                player.assert_called_once_with(guide,2,root,None)
        with patch.object(arrangement_replacement,'render_piano_preserving') as player:
            try:arrangement_replacement.render(guide,2,root,'piano',bank='separate',source_name='guitar')
            except ValueError as error:assert 'Transcription setup is missing' in str(error)
            else:raise AssertionError('Expected the existing guitar route to check its setup')
            player.assert_not_called()
        for custom in [{'pitch':13},{'pitch':1.5},{'extension':-1},{'extension':float('nan')},{'pitch':True},{'bogus':1}]:
            try:arrangement_replacement.validate_custom(custom)
            except ValueError:pass
            else:raise AssertionError('Invalid tuning accepted')
        source_notes=[[0,.2,60,.8],[.4,.7,64,.7],[.6,.8,60,.5]]
        extended=arrangement_replacement.customize_notes(source_notes,1,.5)
        assert extended[0][1]==.6 and extended[1][1]==1 and extended[2][1]==1
        assert source_notes[0][1]==.2
        assert arrangement_replacement.validate_custom({'pitch':-12,'extension':1.5})=={'pitch':-12,'extension':1.5}
        # Missing local NAM assets fail before transcription or rendering begins.
        for variant in arrangement_replacement.NAM_GUITARS:
            with patch.object(arrangement_replacement,'render_separate') as player:
                try:arrangement_replacement.render(guide,2,root,variant)
                except ValueError as error:assert 'local NAM renderer' in str(error)
                else:raise AssertionError('Expected a missing NAM setup error')
                player.assert_not_called()
        for stems in [None, []]:
            request=dict(style='replace-guitar-electric-piano',start=0,seconds=2,
                vocal=str(guide),instrumental=str(guide),guitar=str(guide),
                source_name='other',stems=stems,output=str(root/'result'),data_root=str(root))
            with patch.object(arrangement_replacement,'render',return_value=(np.ones(48000)*.1,Midi(),[])):
                result=arrangement_job.run(request)
            assert result['seconds']==2
            part=next(p for p in result['stems'] if p['name']=='electric-piano')
            audio,sr=sf.read(part['path'])
            assert len(audio)==48000 and sr==24000 and np.isfinite(audio).all()
    print('Direct-track replacement passed with null and empty companion stems.')

if __name__=='__main__':run()
