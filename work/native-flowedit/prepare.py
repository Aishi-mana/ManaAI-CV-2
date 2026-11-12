from pathlib import Path
folder=Path(__file__).resolve().parent
source=Path('C:/AI/acestep.cpp/src/pipeline-synth-ops.cpp').read_text(encoding='utf-8')
mark='int ops_dit_generate(const AceSynth * ctx, int batch_n, SynthState & s, bool (*cancel)(void *), void * cancel_data) {'
assert source.count(mark)==1
source=source.replace(mark,'#include "flowedit.h"\n\n'+mark+'\n    if (std::getenv("ACE_FLOW_EDIT_SOURCE_CAPTION")) {\n        if(batch_n!=1)return -1;\n        return flowedit_generate(ctx,s,cancel,cancel_data);\n    }')
(folder/'pipeline-synth-ops.cpp').write_text(source,encoding='utf-8')
