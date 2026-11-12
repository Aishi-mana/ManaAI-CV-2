from pathlib import Path
p=Path('src/core/outfitPrototype.ts');s=p.read_text().replace('  }parts.push(part);\n\n','  }parts.push(part);\n  if(parts.length>4096)throw Error(\'Too many disconnected marks to separate this outfit safely.\');\n\n');p.write_text(s)
