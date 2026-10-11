from pathlib import Path
import json,csv,shutil,html
import numpy as np,soundfile as sf
root=Path(r'C:\Users\Admin\Downloads\Yuuki Voice');out=Path('exports/voice-review');rows=json.loads((out/'inventory.json').read_text());drafts={r['filename']:r['draftJapanese'] for r in json.loads((out/'clip-transcripts.json').read_text(encoding='utf-8'))}
sets={
 'gentle_candidate':{7,14,17,23,36,48,107,155,159,173,182,185,221,231,235,237,244,268},
 'thoughtful_candidate':{12,29,38,39,46,92,94,96,98,102,114,115,116,120,121,153,154,170,175,179,184,187,211,219,220,223,229,233,236,238,243,247,260,261,262,263,264,267},
 'cheerful_candidate':{3,5,6,8,9,10,11,13,18,19,20,25,26,27,28,30,32,33,35,40,41,42,45,53,104,105,139,160,168,183,186,205,206,207,214,215,222,228,240,245,251,256,265},
 'neutral_candidate':{1,2,49,51,52,55,56,63,64,89,165,166,172,176,208,212,213,230,232,269},
 'names_context_specific':set(range(54,89))-{55,56,63,64},
 'battle_context':{15,16,21,22,24,47,79,90,91,93,95,97,99,101,103,109,117,119,149,150,151,156,158,161,162,163,164,167,169,171,174,177,178,180,181,188,189,190,194,195,196,199,200,202}
}
for r in rows:
 number=int(r['filename'].split('_')[-1].split('.')[0]);category=next((c for c,ids in sets.items() if number in ids),'reaction_or_unclear');r['classification']=category;r['draftJapanese']=drafts.get(r['filename'],'');r['labelBasis']='Draft Japanese content; acoustic triage. Emotional delivery is unverified.';r['needsReview']=True;r['referenceReady']=False
 folder=out/'categorized'/category;folder.mkdir(parents=True,exist_ok=True);shutil.copy2(r['file'],folder/r['filename'])
(out/'categorized-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
with open(out/'catalogue.csv','w',encoding='utf-8-sig',newline='') as f:
 keys=['filename','classification','seconds','draftJapanese','rms','peak','clippedFraction','pitchMedian','pitchSpread','referenceReady','needsReview','labelBasis','file','sha256'];writer=csv.DictWriter(f,keys,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
auditions={'default':[1,2,269],'cheerful':[20,105],'thoughtful':[29,219,236],'gentle':[14,268]};meta=[];byname={r['filename']:r for r in rows}
for category,ids in auditions.items():
 parts=[];sources=[]
 for number in ids:
  name=f'yuuki_line_{number:03d}.wav';y,sr=sf.read(root/'yuuki_voice_lines_wav'/name,always_2d=True)
  if parts:parts.append(np.zeros((int(sr*.25),y.shape[1])))
  parts.append(y);sources.append(name)
 y=np.concatenate(parts);dest=out/f'audition-{category}.wav';sf.write(dest,y,sr,subtype='PCM_16');meta.append({'category':category,'sources':sources,'seconds':round(len(y)/sr,3),'file':str(dest.resolve()),'verified':False,'denoised':False,'draftTranscript':' '.join(byname[n]['draftJapanese'] for n in sources)})
(out/'audition-manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
counts={category:sum(r['classification']==category for r in rows) for category in [*sets,'reaction_or_unclear']}
report=['# Yuuki voice review — provisional', '', 'All originals are unchanged. This is an automated acoustic/content triage, not a listening-certified emotion or speaker assessment. Japanese ASR can be wrong, especially for tiny exclamations; review the audio before adopting a label or transcript.', '', '## What was inspected', '', '- 269 WAV cuts: 229.4 seconds total, all 44.1 kHz stereo, 0.221–2.691 seconds each.', '- Six MP3 sources; longer sources range up to 717.59 seconds. Eight draft-transcribed excerpts are included for review.', '- No byte-identical WAV duplicates and no measured samples above 0.999 in the WAV cuts. All WAVs have approximately 0.1 RMS, suggesting prior level normalization. This does not prove they are free of music/noise or extraction artifacts.', '- Current GPT-SoVITS enforces a 3–10 second reference. None of the individual WAV cuts qualifies. Do not pad a grunt with silence merely to meet that limit.', '', '## Provisional categories', '', '| Suggested group | Clips |', '|---|---:|']
report.extend(f'| {c.replace("_"," ")} | {n} |' for c,n in counts.items())
report+=['','Full labels, measurements, original paths and draft transcripts: [catalogue.csv](catalogue.csv). Copies are grouped under categorized/. Battle calls, names and reactions remain separate from the everyday styles. Labels follow phrase content and coarse acoustic cues; pitch or wording alone does not establish emotion.','', '## Four short auditions', '', 'These use a few complete matching phrases with 250 ms gaps. No denoising, pitch shift or gain increase was applied. They are review candidates, not installed references. Each has an unverified Japanese transcript in audition-manifest.json. A single natural, clean phrase from a longer source remains preferable when available.']
for r in meta:
 report+=['',f'### {r["category"].capitalize()} candidate — {r["seconds"]} seconds',f'Sources: {", ".join(r["sources"])}.','',f'![{r["category"]} audition]({r["file"].replace(chr(92),"/")})','',f'Draft transcript: {r["draftTranscript"]}']
report+=['','## Longer-source review', '', '- Fight! recording begins with the same team-play phrase as the current reference. The current reference has user-confirmed improved results after transcript correction; keep it as a baseline rather than replacing it automatically.', '- Fractured Daydream trailer: conversational/philosophical content and battle delivery. Check for background music, sound effects and repeated material before extraction.', '- Bike Ride recording: useful conversational passages, but the excerpts may contain other speakers and game background audio. Speaker identity, exact timestamps and cleanliness require listening review. The full and trimmed versions may overlap.', '', 'Review excerpts:']
for r in json.loads((out/'source-transcripts.json').read_text(encoding='utf-8')):
 report += [f'- {r["id"]}: source offset {r["start"]} seconds; [audio excerpt]({r["id"]}-review.wav).']
report+=['','## Cleanup and final reference workflow','', '1. Listen and approve style/speaker/complete phrase boundaries first.', '2. Prefer an already clean source. If background music is present, try vocal separation on a copy; if hiss is present, compare mild denoising with the original. Separation/denoising can damage consonants, breath or vocal texture.', '3. Preserve pitch and natural expression, trim excessive silence, avoid clipping and unnecessary upsampling. WAV conversion cannot restore missing MP3 detail.', '4. Keep one default and one approved 3–10 second reference per expression, or several individually selectable alternatives. Do not merge a whole category into one long WAV.', '5. Verify the exact transcript and set Japanese reference language independently from English reply language. That language control is still a pending implementation task.', '6. For training, keep separate, accurately labeled utterances with source provenance. These tiny cuts are a starting collection, not a curated training-ready dataset.','', 'No runtime settings changed. No audio was uploaded; Japanese ASR used locally cached Whisper-small weights.']
(out/'REVIEW.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print('Provisional category counts:',counts);print('Auditions:',[(r['category'],r['seconds']) for r in meta]);print('Review:',(out/'REVIEW.md').resolve())
