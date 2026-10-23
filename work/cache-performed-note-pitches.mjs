import fs from 'node:fs';const p='scripts/arrangement_job.py';let s=fs.readFileSync(p,'utf8');const target="        midi.write(str(out/'guitar-transcription.mid'));(out/'notes.json').write_text(json.dumps(notes),encoding='utf-8')";const replacement=target+`\n        # Cache performed pitches/velocities (including transposition) for editing;
        # keep the detector's raw notes.json unchanged for existing comparisons.
        performed=[[float(n.start),min(size/SR,float(n.end)),int(n.pitch),float(n.velocity)/127] for part in getattr(midi,'instruments',[]) for n in part.notes if 0<=n.start<min(size/SR,n.end)]
        if not hasattr(midi,'instruments'):performed=notes
        performed.sort(key=lambda n:(n[0],n[2]))
        (out/'editable-notes.json').write_text(json.dumps(performed),encoding='utf-8')`;if(!s.includes(target))throw Error('Notes save not found');s=s.replace(target,replacement).replace("notesPath=str(out/'notes.json')","notesPath=str(out/'editable-notes.json')");fs.writeFileSync(p,s);
