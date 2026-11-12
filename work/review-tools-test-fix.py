from pathlib import Path
p=Path('tests/review-tools.test.cjs');s=p.read_text(encoding='utf-8').replace('module:ts.ModuleKind.CommonJS','module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021');p.write_text(s,encoding='utf-8')
