from pathlib import Path
import re
b=Path('src/core/backup.ts').read_text(encoding='utf-8').split('export interface Backup')[0]
r=Path('src-tauri/src/store.rs').read_text(encoding='utf-8').split('#[cfg(test)]')[0]
print('Backup only:',set(re.findall(r"'(mana\.[^']+)'\s*:",b))-set(re.findall(r'"(mana\.[^"]+)"',r)))
