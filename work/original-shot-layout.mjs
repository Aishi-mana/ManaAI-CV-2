import fs from 'node:fs';const p='work/original-preview.tsx';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace("height:'100vh',overflow:'auto'","minHeight:'100vh',overflow:'visible'"));
