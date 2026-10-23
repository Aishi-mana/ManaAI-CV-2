import fs from 'node:fs';const p='src/components/StudioLyrics.tsx';let s=fs.readFileSync(p,'utf8').replace('optional <word time> markers','optional &lt;word time&gt; markers');fs.writeFileSync(p,s);
