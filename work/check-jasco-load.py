"""Offline model-load check; does not modify Mana or generate a song."""
exec(compile(open('work/check-jasco-import.py', encoding='utf-8').read(), 'work/check-jasco-import.py', 'exec'))
from pathlib import Path
import json
import transformers
from omegaconf import OmegaConf
from audiocraft.models import builders
from audiocraft.models.encodec import HFEncodecCompressionModel
from audiocraft.modules import conditioners, jasco_conditioners
sys.path.insert(0, str(root/'work/melodyflow-native/tools'))
from audiocraft_ckpt import _safe_globals

# Reuse the supplied local T5 files, with the matching fast tokenizer JSON.
class LocalTokenizer:
    @staticmethod
    def from_pretrained(name):
        assert name == 't5-base', name
        return transformers.T5TokenizerFast(tokenizer_file=str(root/'data/melodyflow-models/tokenizer.json'))
class LocalEncoder:
    @staticmethod
    def from_pretrained(name):
        assert name == 't5-base', name
        return transformers.T5EncoderModel.from_pretrained(str(root/'data/melodyflow-models'), local_files_only=True)
conditioners.T5Tokenizer = LocalTokenizer
conditioners.T5EncoderModel = LocalEncoder

# JASCO's default separator is an unregistered helper, not learned JASCO weights.
# This runner will supply a real, pre-separated drum stem instead of downloading Demucs.
import demucs.pretrained
class PreparedDrums:
    sources = ['drums']
    def to(self, device):
        return self
demucs.pretrained.get_model = lambda name: PreparedDrums()
def prepared_drums(self, wav, sample_rate):
    return jasco_conditioners.convert_audio(wav, sample_rate, self.sample_rate, 1)
jasco_conditioners.DrumsConditioner._get_drums_stem = prepared_drums

device = 'cuda'
print('Loading supplied 32kHz codec', flush=True)
codec = HFEncodecCompressionModel(transformers.EncodecModel.from_pretrained(
    str(root/'data/jasco-chords-drums-melody-400M/codec-32khz'), local_files_only=True).to(device)).eval()
print('Loading supplied JASCO checkpoint', flush=True)
with torch.serialization.safe_globals(_safe_globals(torch)):
    pkg = torch.load(root/'data/jasco-chords-drums-melody-400M/state_dict.bin', map_location='cpu', weights_only=True)
cfg = OmegaConf.create(pkg['xp.cfg'])
cfg.device = device
cfg.dtype = 'float16'
lm = builders.get_jasco_model(cfg, codec)
result = lm.load_state_dict(pkg['best_state'], strict=True)
lm.eval()
lm.cfg = cfg
model = JASCO(name='local-jasco', compression_model=codec, lm=lm,
    chords_mapping_path=str(root/'work/jasco-audiocraft/assets/chord_to_index_mapping.pkl'))
report = {'strict_state_dict': str(result), 'sample_rate': codec.sample_rate,
    'cuda': torch.cuda.get_device_name(), 'allocated_bytes': torch.cuda.memory_allocated(),
    'duration': model.duration, 'drum_input': 'must be pre-separated'}
(root/'work/jasco-load-check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report), flush=True)
