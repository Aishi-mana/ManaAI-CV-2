import fs from 'node:fs';const p='src/core/studioMix.ts';let s=fs.readFileSync(p,'utf8').replace('source:p,clip:c,','source:p,clip:c as BuilderClip|undefined,');fs.writeFileSync(p,s);
