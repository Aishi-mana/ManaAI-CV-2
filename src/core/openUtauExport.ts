import type {TranslationProject} from './translationWorkbench';
import {guideReady,normalizeMelodyGuide} from './midiMelody';

/** OpenUtau USTX 0.6 project (480 ticks per quarter).
 * Never substitutes a singer: the user installs and selects an English-
 * capable OpenUtau voicebank, phonemizer and renderer before WAV export. */
export function exportOpenUtauGuide(project:TranslationProject):string{
 const melody=normalizeMelodyGuide(project.melody,project.lines.length);
 if(!melody||!guideReady(melody,project.lines))
  throw Error('Review every note lyric against the current English lines before exporting.');
 if(!['owned','licensed','public-domain'].includes(project.rightsBasis)||
  !['owned','licensed','public-domain'].includes(melody.rightsBasis))
  throw Error('Both adaptation and melody permissions are required.');
 const yamlString=(value:string)=>JSON.stringify(value);
 const last=melody.notes[melody.notes.length-1];
 const duration=Math.ceil((last.position+last.duration)/480)*480;
 const startBpm=melody.tempos[0].bpm;
 const content=[
  'name: '+yamlString(project.title.slice(0,120)+' · English guide'),
  'comment: '+yamlString('Mana Songbook 3B. Owner-declared rights; unrendered note guide. Select English singer/phonemizer and export WAV in OpenUtau.'),
  'output_dir: "Vocal"',
  'cache_dir: "UCache"',
  'ustx_version: "0.6"',
  'resolution: 480',
  'bpm: '+startBpm,
  'beat_per_bar: '+melody.signature.beatPerBar,
  'beat_unit: '+melody.signature.beatUnit,
  'key: 0',
  'expressions:',
  '  dyn: {name: "dynamics (curve)", abbr: dyn, type: Curve, min: -240, max: 120, default_value: 0, is_flag: false, flag: ""}',
  '  pitd: {name: "pitch deviation (curve)", abbr: pitd, type: Curve, min: -1200, max: 1200, default_value: 0, is_flag: false, flag: ""}',
  '  vel: {name: "velocity", abbr: vel, type: Numerical, min: 0, max: 200, default_value: 100, is_flag: false, flag: ""}',
  '  clr: {name: "voice color", abbr: clr, type: Options, min: 0, max: -1, default_value: 0, is_flag: false, options: []}',
  'exp_selectors: [dyn, pitd, clr, vel]',
  'exp_primary: 0',
  'exp_secondary: 1',
  'time_signatures:',
  '  - bar_position: 0',
  '    beat_per_bar: '+melody.signature.beatPerBar,
  '    beat_unit: '+melody.signature.beatUnit,
  'tempos:',
  ...melody.tempos.flatMap(tempo=>[
   '  - position: '+tempo.position,
   '    bpm: '+tempo.bpm,
  ]),
  'tracks:',
  '  - singer: ""',
  '    phonemizer: "OpenUtau.Core.DefaultPhonemizer"',
  '    renderer_settings: {}',
  '    track_name: "English guide - select singer"',
  '    track_color: "Blue"',
  '    mute: false',
  '    solo: false',
  '    volume: 0',
  '    pan: 0',
  '    voice_color_names: []',
  'voice_parts:',
  '  - name: '+yamlString(project.title.slice(0,100)+' · English phrase'),
  '    comment: ""',
  '    track_no: 0',
  '    position: 0',
  '    duration: '+duration,
  '    notes:',
  ...melody.notes.flatMap(note=>[
   '      - position: '+note.position,
   '        duration: '+note.duration,
   '        tone: '+note.tone,
   '        lyric: '+yamlString(note.lyric.trim()),
   '        pitch:',
   '          data:',
   '            - {x: -40, y: 0, shape: io}',
   '            - {x: 40, y: 0, shape: io}',
   '          snap_first: true',
   '        vibrato: {length: 0, period: 180, depth: 35, in: 20, out: 20, shift: 0, drift: 0, vol_link: 0}',
   '        phoneme_expressions: []',
   '        phoneme_overrides: []',
  ]),
  'wave_parts: []',
  '',
 ].join('\n');
 if(content.length>120_000)throw Error('OpenUtau project exceeds the safe export size.');
 return content;
}
