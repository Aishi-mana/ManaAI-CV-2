from pathlib import Path
p=Path('src/styles.css');s=p.read_text(encoding='utf-8').replace('.cover-builder { max-width:1050px; margin:auto; }','.cover-builder { width:100%; min-width:0; max-width:1500px; margin:auto; }').replace('.studio-builder-area { grid-column:2 / -1;','.studio-builder-area { min-width:0; grid-column:2 / -1;');p.write_text(s,encoding='utf-8')
