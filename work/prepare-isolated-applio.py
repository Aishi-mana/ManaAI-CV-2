from pathlib import Path
import shutil, json

root=Path(__file__).resolve().parents[1]
source=Path('C:/AI/Applio')
engine=root/'data/applio-training/engine'
engine.mkdir(parents=True,exist_ok=True)
shutil.copytree(source/'rvc',engine/'rvc',dirs_exist_ok=True,
                ignore=shutil.ignore_patterns('models','__pycache__','*.pyc'))
for relative in ['rvc/models/embedders/contentvec/config.json',
                 'rvc/models/embedders/contentvec/pytorch_model.bin',
                 'rvc/models/predictors/rmvpe.pt',
                 'rvc/models/pretraineds/hifi-gan/f0G40k.pth',
                 'rvc/models/pretraineds/hifi-gan/f0D40k.pth']:
    dst=engine/relative
    dst.parent.mkdir(parents=True,exist_ok=True)
    if not dst.exists(): shutil.copy2(source/relative,dst)
(engine/'assets').mkdir(exist_ok=True)
(engine/'assets/config.json').write_text(json.dumps({'precision':'fp16'}),encoding='utf-8')
# Load optional alternate extractors/vocoders only when chosen. RMVPE and
# HiFi-GAN do not use torchaudio; the old installation's torchaudio is incomplete.
p=engine/'rvc/train/extract/extract.py'
p.write_text(p.read_text(encoding='utf-8-sig').replace('import torchcrepe\n',''),encoding='utf-8')
p=engine/'rvc/lib/predictors/f0.py'
s=p.read_text(encoding='utf-8-sig').replace('from torchfcpe import spawn_infer_model_from_pt\n','').replace('import torchcrepe\n','')
s=s.replace('        f0, pd = torchcrepe.predict(', '        import torchcrepe\n        f0, pd = torchcrepe.predict(')
s=s.replace('        self.model = spawn_infer_model_from_pt(', '        from torchfcpe import spawn_infer_model_from_pt\n        self.model = spawn_infer_model_from_pt(')
p.write_text(s,encoding='utf-8')
p=engine/'rvc/lib/algorithm/synthesizers.py'
s=p.read_text(encoding='utf-8-sig').replace('from rvc.lib.algorithm.generators.refinegan import RefineGANGenerator\n','')
s=s.replace('                self.dec = RefineGANGenerator(', '                from rvc.lib.algorithm.generators.refinegan import RefineGANGenerator\n                self.dec = RefineGANGenerator(')
p.write_text(s,encoding='utf-8')
print(engine)
