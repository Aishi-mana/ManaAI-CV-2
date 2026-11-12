from pathlib import Path
import hashlib,json,shutil
root=Path.cwd();refs=root/'data/custom-voice/references/mana-v2';src=refs/'default-r2.wav';dest=refs/'singing-stable-v1.wav'
if dest.exists() and dest.read_bytes()!=src.read_bytes():raise ValueError('Existing versioned voice reference differs; do not overwrite')
if not dest.exists():shutil.copyfile(src,dest)
(refs/'singing-stable-v1.json').write_text(json.dumps({'profile':'mana-stable-v1','source':'default-r2.wav','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'reason':'Country Roads comparison #2 preferred by user on October 26','createdOn':'2026-11-01','legacyReferenceUnchanged':'singing.wav'},indent=2),encoding='utf-8')
p=Path('src/core/musicStudio.ts');s=p.read_text(encoding='utf-8-sig').replace("mana-v2/singing.wav';","mana-v2/singing-stable-v1.wav';",1);p.write_text(s,encoding='utf-8')
p=Path('src/components/SingingDrawer.tsx');s=p.read_text(encoding='utf-8-sig').replace('Use Mana’s singing reference</label>', 'Use Mana’s stable voice (recommended)</label><p className="hint-soft">Uses the same approved voice reference for every cover, independent of her chat mood. Turning this off uses the current chat reference.</p>');p.write_text(s,encoding='utf-8')
p=Path('scripts/singing_job.py');s=p.read_text(encoding='utf-8-sig');idx=s.index('\ndef run(p):');s=s[:idx]+'''
def conversion_profile(p):
    import hashlib
    reference=Path(p['reference']).resolve()
    seed=p.get('seed',42)
    if isinstance(seed,bool) or not isinstance(seed,int) or not 0<=seed<=4294967295:
        raise ValueError('Conversion seed must be an integer from 0 to 4294967295.')
    steps=p.get('diffusion_steps',30)
    if isinstance(steps,bool) or not isinstance(steps,int) or not 10<=steps<=100:
        raise ValueError('Diffusion steps must be between 10 and 100.')
    guidance=p.get('guidance',.7)
    import math
    if isinstance(guidance,bool) or not isinstance(guidance,(int,float)) or not math.isfinite(guidance) or not 0<=guidance<=1:
        raise ValueError('Conversion guidance must be between 0 and 1.')
    digest=hashlib.sha256()
    with reference.open('rb') as file:
        for block in iter(lambda:file.read(1024*1024),b''):digest.update(block)
    return {'engine':'seed-vc-f0','reference':str(reference),'referenceSha256':digest.hexdigest(),
            'seed':seed,'diffusionSteps':steps,'guidance':float(guidance),
            'pitchSmoothing':bool(p.get('pitch_smoothing',False)),
            'pitchShiftSemitones':p.get('semi_tone_shift',0),'autoPitchAdjust':False}
''' +s[idx:]
s=s.replace("    pitch_shift = p.get('semi_tone_shift', 0)", "    profile=conversion_profile(p)\n    pitch_shift = p.get('semi_tone_shift', 0)",1)
s=s.replace("        if 'seed' in p:\n            import random\n            seed = int(p['seed'])\n            random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)", "        import random\n        seed=profile['seed']\n        random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)")
s=s.replace("'diffusionSteps':steps,'pitchSmoothing':bool(p.get('pitch_smoothing',False))}", "'diffusionSteps':steps,'pitchSmoothing':bool(p.get('pitch_smoothing',False)),'voiceProfile':profile}")
p.write_text(s,encoding='utf-8')
