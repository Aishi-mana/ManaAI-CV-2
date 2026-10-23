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
        from sax_replacement import noise_like,prepare_sax
        test_t=np.arange(24000)/24000
        quiet=np.sin(2*np.pi*440*test_t)*.001
        assert not noise_like(quiet,[0,.07,69,.3])
        rng=np.random.default_rng(51)
        assert noise_like(rng.normal(0,.1,24000),[0,.07,69,.3])
        sample_notes=[[0,.3,69,.8],[.35,.8,72,.8]]
        assert prepare_sax(sample_notes,np.zeros(24000),1)==sample_notes
        joined=prepare_sax(sample_notes,np.ones(24000)*.1,1)
        assert joined[0][1]==.41 and sample_notes[0][1]==.3
        # A repeated key owns its new attack even when another pitch intervenes.
        overlapping=[[0,.7,69,.8],[.2,.8,72,.6],[.4,.9,69,.5]]
        safe=arrangement_replacement.playback_notes(overlapping)
        assert safe==[[0,.4,69,.8],[.2,.8,72,.6],[.4,.9,69,.5]]
        assert overlapping[0][1]==.7
        assert arrangement_replacement.playback_notes(list(reversed(overlapping)))==list(reversed(safe))
        import drum_replacement
        with patch.object(drum_replacement,'render_rock',return_value=expected) as player:
            assert arrangement_replacement.render_drums(guide,2,root,'drums-rock') is expected
            player.assert_called_once_with(guide,2,root)
        root_real=Path(__file__).resolve().parents[1]
        from synth_lead_replacement import prepare_lead
        synth_notes=[[0,.3,60,.8],[.34,.6,64,.7],[.9,1,67,.6]]
        lead,levels=prepare_lead(synth_notes,1,[80,80,80])
        assert np.isclose(lead[0][1],.36) and synth_notes[0][1]==.3
        assert levels==[82,75,82] and lead[1][1]==.6
        assert [n[2] for n in lead]==[60,64,67]
        repeated,_=prepare_lead([[0,.3,60,.8],[.34,.6,60,.8]],1)
        assert repeated[0][1]==.3
        from electric_piano_replacement import prepare_touch,render_electric_piano,merge_vocal_holds
        held_vocal=[[0,.6,60,.8],[.7,1.3,60,.8]]
        continuous=np.ones(48000)*.1
        assert len(merge_vocal_holds(held_vocal,continuous))==1 and held_vocal[0][1]==.6
        breath=continuous.copy();breath[14400:16800]=0
        assert len(merge_vocal_holds(held_vocal,breath))==2
        reattack=continuous.copy();reattack[16800:18000]*=3
        assert len(merge_vocal_holds(held_vocal,reattack))==2
        assert len(merge_vocal_holds([[0,.1,60,.8],[.2,.3,60,.8]],continuous))==2
        touch_source=np.ones(24000)*.1;touch_source[:2400]*=.1
        touch_notes=[[0,.1,60,.8],[.2,.7,64,.8]]
        touch_levels,releases=prepare_touch(touch_notes,touch_source)
        assert touch_levels[0]<touch_levels[1] and releases==[1.05,1.8]
        with patch.object(arrangement_replacement,'render_soundfont',return_value=np.ones(24000)*.1) as player:
            audio,midi,played=render_electric_piano(touch_notes,touch_source,1,root_real,{'pitch':2,'extension':.5})
            assert player.call_count==2 and [c.kwargs['release_scale'] for c in player.call_args_list]==[1.05,1.8]
            assert played[0][1]==.6 and touch_notes[0][1]==.1
            assert [n.pitch for n in midi.instruments[0].notes]==[62,66]
            assert [n.velocity for n in midi.instruments[0].notes]==touch_levels
        from vocal_melody import clean_held_notes
        from vocal_melody import stable_vocal_line
        held_pitch=61+.65*np.sin(2*np.pi*6*np.arange(400)*.005)
        assert np.all(stable_vocal_line(held_pitch,np.ones(400,dtype=bool))==61)
        changing=np.r_[np.full(100,61.),np.full(100,63.)]
        stable=stable_vocal_line(changing,np.ones(200,dtype=bool))
        assert stable[50]==61 and stable[150]==63
        voiced=np.ones(200,dtype=bool);voiced[90:110]=False
        assert np.all(stable_vocal_line(changing,voiced)[90:110]==0)
        from vocal_melody import render_vocal_notes,PROGRAMS as VOCAL_PROGRAMS
        from ocarina_replacement import prepare_ocarina,soften_ocarina
        ocarina_input=[[0,.3,60,.8],[.34,.6,64,.7],[.9,1,67,.6]]
        shaped,levels,entrances=prepare_ocarina(ocarina_input,1,[80,80,80])
        assert np.isclose(shaped[0][1],.365) and ocarina_input[0][1]==.3
        assert levels==[69,76,69] and entrances==[0,.9]
        assert soften_ocarina(np.ones(24000),[0])[0]==0
        # Every offered vocal instrument reaches its actual sample/NAM backend,
        # not a silently substituted general MIDI guitar or sax.
        for instrument in VOCAL_PROGRAMS:
            with patch.object(arrangement_replacement,'render_soundfont',return_value=np.ones(24000)*.1) as gm,patch.object(arrangement_replacement,'render_separate',return_value=np.ones(24000)*.1) as sampled,patch.object(arrangement_replacement,'render_bright_room',return_value=(np.ones(24000)*.1,ocarina_input)) as nam:
                audio,midi,performed=render_vocal_notes(ocarina_input,[80,80,80],np.ones(24000)*.1,1,root_real,instrument,{'pitch':2,'extension':0})
                assert len(audio)==24000 and np.isfinite(audio).all()
                assert gm.call_count+sampled.call_count+nam.call_count==1
                assert all(n.pitch==row[2]+2 for n,row in zip(midi.instruments[0].notes,performed))
                if instrument in arrangement_replacement.NAM_GUITARS:nam.assert_called_once()
                if instrument in ['sax-weresax','guitar-black','electric-guitar-distorted']:sampled.assert_called_once()
                if instrument=='synth-saw':assert gm.call_args.kwargs['release_scale']==1
                if instrument=='synth-pad':assert gm.call_args.kwargs['release_scale']==1.2
        assert not any(name.startswith('drums-') for name in VOCAL_PROGRAMS)
        import json
        cached=root_real/'exports/singing/whereabout-vocal-harmonica-2026-10-16'
        if cached.is_dir():
            raw=json.loads((cached/'notes.json').read_text())
            # Fixture is stored at the extraction's own sample rate.
            source,sr=sf.read(root_real/'exports/singing/vocal-extraction-170s-2026-10-13/lead-vocal-raw.wav')
            if source.ndim>1:source=source.mean(axis=1)
            cleaned=clean_held_notes(raw,source,sr)
            approved=json.loads((root_real/'exports/singing/whereabout-harmonica-held-vowels-2026-10-16/notes.json').read_text())
            assert cleaned==approved and len(cleaned)==26
        held=[[0,.5,60,.8],[.53,.8,60,.8],[1,1.3,62,.8]]
        joined=clean_held_notes(held,np.ones(48000)*.1)
        assert len(joined)==2 and joined[0][1]==.8 and held[0][1]==.5
        assert len(clean_held_notes(held,np.zeros(48000)))==3
        with patch('vocal_melody.render_vocal',return_value=expected) as player:
            assert arrangement_replacement.render(guide,2,root,'harmonica',source_name='vocal',custom={'pitch':2,'extension':.1}) is expected
            assert player.call_args.args[-1]=={'pitch':2,'extension':.1}
        assert arrangement_replacement.EXTRA_PROGRAMS['trumpet']==56
        trumpet_notes=[[0,.3,60,.8],[.34,.6,64,.7],[.9,1,67,.6]]
        played,levels=arrangement_replacement.prepare_trumpet(trumpet_notes,1)
        assert played[0][1]==.375 and played[1][1]==.6
        assert [n[2] for n in played]==[60,64,67] and trumpet_notes[0][1]==.3
        assert levels==[round(92*1.04),round(86*.96),round(81*1.04)]
        from flute_replacement import prepare_flute,soften_entrances
        from violin_replacement import focus_melody,render_focused_violin
        violin_source=np.sin(2*np.pi*440*np.arange(24000)/24000)*.1
        focused=focus_melody([[0,1,69,.8]],violin_source,1)
        assert focused.shape==violin_source.shape and np.isfinite(focused).all()
        try:focus_melody([[0,1,69,.8]],np.zeros(24000),1)
        except ValueError as error:assert 'No clear violin melody' in str(error)
        else:raise AssertionError('Silent violin guide accepted')
        with patch.object(arrangement_replacement,'render',return_value=(np.ones(24000)*.1,Midi(),[[0,.9,69,.8]])) as player:
            result=render_focused_violin([[0,1,69,.8]],violin_source,1,root_real,{'pitch':2,'extension':.1})
            assert player.call_count==1 and player.call_args.kwargs['_violin_focused'] is True
            assert player.call_args.kwargs['custom']=={'pitch':2,'extension':.1}
            assert result[0][0]==0
        flute_source=np.sin(2*np.pi*440*np.arange(24000)/24000)*.1
        flute_notes=[[0,.3,69,.8],[.3,.4,57,.5],[.4,.8,69,.8]]
        played,levels,entrances=prepare_flute(flute_notes,flute_source,1)
        assert [n[2] for n in played]==[69,69,69]
        assert flute_notes[1][2]==57 and len(levels)==3 and entrances==[0]
        silent,_,_=prepare_flute(flute_notes,np.zeros(24000),1)
        assert silent[1][2]==57
        faded=soften_entrances(np.ones(24000),[0])
        assert faded[0]==0 and faded[500]==1
        # Strings cleanup removes only a brief unsupported detour, retains real soft notes.
        from strings_replacement import prepare_strings
        t=np.arange(24000)/24000
        tone=np.sin(2*np.pi*440*t)*.1
        sample=[[0,.3,69,.8],[.3,.39,60,.6],[.39,.8,69,.8]]
        cleaned,levels=prepare_strings(sample,tone,1)
        assert [n[2] for n in cleaned]==[69,69] and len(levels)==2
        assert sample[1][2]==60 and sample[0][1]==.3
        supported=[[0,.3,69,.3],[.35,.8,72,.8]]
        cleaned,_=prepare_strings(supported,tone,1)
        assert len(cleaned)==2 and cleaned[0][1]==.425
        with patch.object(drum_replacement,'render_rock') as player,patch.object(arrangement_replacement,'drum_hits',return_value=[[0,.1,36,.8]]),patch.object(arrangement_replacement,'render_soundfont',return_value=np.ones(48000)*.1):
            for kit in ['drums-standard','drums-jazz','drums-brush','drums-electronic']:
                result=arrangement_replacement.render_drums(guide,2,root_real,kit)
                assert len(result[2])==1
            player.assert_not_called()
        assert drum_replacement.analyze(np.zeros(24000),{})==([],[])
        events=[dict(time=t,pitch=49,score=.1,strength=.3,share=.7) for t in [.1,.2,.4]]
        fuller=drum_replacement.fuller(events,2)
        trimmed,removed=drum_replacement.trim(fuller,2)
        assert trimmed and all(n[1]>n[0] for n in trimmed)
        import bass_replacement
        slow_notes=[[0,2,40,.8],[2.2,3,43,.8]]
        fast_notes=[[.4,.46,40,.8],[.48,.54,43,.8],[.56,.62,45,.8]]
        regions=bass_replacement.fast_regions(fast_notes,3)
        assert regions
        combined=bass_replacement.combine(slow_notes,fast_notes,regions)
        assert all(n in combined for n in fast_notes) and slow_notes[1] in combined
        assert bass_replacement.combine(slow_notes,fast_notes,[])==slow_notes
        assert slow_notes==[[0,2,40,.8],[2.2,3,43,.8]]

        for instrument,program in [('finger-bass',33),('picked-bass',34)]:
            with patch.object(bass_replacement,'render_bass',return_value=expected) as player:
                result=arrangement_replacement.render(guide,2,root,instrument,source_name='bass',custom={'pitch':2,'extension':.3})
                assert result is expected
                player.assert_called_once_with(guide,2,root,program,{'pitch':2,'extension':.3})
        # Bass melody must not change detectors when the destination timbre changes.
        import vocal_melody
        tracked=([[0,.08,40,.8],[.08,.16,43,.8],[.16,.24,45,.8]],[80,70,60])
        for target in ['harmonica','ocarina','sax-tenor','sax-weresax','electric-piano','synth-pad','piano-treble','guitar-black']:
            with patch.object(bass_replacement,'track_bass_notes',return_value=tracked) as detector,patch.object(vocal_melody,'render_vocal_notes',return_value=expected) as player:
                result=arrangement_replacement.render(guide,2,root,target,source_name='bass')
                assert result is expected and detector.call_count==1
                assert player.call_args.args[0:2]==tracked
                assert player.call_args.args[5]==target
        for source in ['sax-extracted','trumpet-extracted','winds-estimate','strings-estimate']:
            assert arrangement_replacement.source_note_attacks(source,[.1,.2])==[]
        assert arrangement_replacement.source_note_attacks('guitar',[.1,.2])==[.1,.2]
        assert arrangement_replacement.source_note_attacks('piano',[.1,.2])==[.1,.2]
        assert arrangement_replacement.source_frequency_range('piano')==(27.5,4186)
        assert arrangement_replacement.source_frequency_range('winds-estimate')==(100,4186)
        assert arrangement_replacement.source_frequency_range('strings-estimate')==(65.4,4186)
        assert arrangement_replacement.source_frequency_range('guitar')==(100,1500)
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
