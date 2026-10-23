from pathlib import Path
p=Path('src/core/codeSandbox.ts');s=p.read_text(encoding='utf-8');start=s.index('export const SANDBOX_EXAMPLE=');end=s.index(';\nexport function sandboxCode',start)
source=Path('exports/code-playground/collect-stars-fixed.js').read_text(encoding='utf-8-sig').strip()
s=s[:start]+'export const SANDBOX_EXAMPLE=`'+source+'`'+s[end:]
s+='''
export function sandboxDraftInstructions():string{
 return SANDBOX_INSTRUCTIONS+'\\nCRITICAL: api.onFrame is called repeatedly. Initialize player position, score, arrays of objects and reset-key latch OUTSIDE the callback. Never reinitialize them at the start of each frame. Inside onFrame only update persistent state, handle input and draw. Multiply movement speed by dt. Reset state only on an explicit restart, and trigger Space reset on a press edge rather than every held frame. Adapt this working example to the user request, retaining its state lifetime pattern:\\n'+SANDBOX_EXAMPLE;
}
'''
p.write_text(s,encoding='utf-8')
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8').replace('SANDBOX_EXAMPLE,SANDBOX_INSTRUCTIONS,sandboxCode','SANDBOX_EXAMPLE,sandboxDraftInstructions,sandboxCode').replace("content:SANDBOX_INSTRUCTIONS}","content:sandboxDraftInstructions()}");p.write_text(s,encoding='utf-8')
