import unittest,json,ast
from pathlib import Path
class OutfitPackagingTests(unittest.TestCase):
 def test_all_local_fitter_imports_are_packaged(self):
  root=Path(__file__).resolve().parents[1];resources=json.loads((root/'src-tauri/tauri.conf.json').read_text(encoding='utf-8'))['bundle']['resources'];pending=['garment_only','generated_outfit','clothing_fit','clothing_extract'];seen=set()
  while pending:
   name=pending.pop()
   if name in seen:continue
   seen.add(name);self.assertEqual(resources.get('../scripts/'+name+'.py'),'scripts/'+name+'.py')
   tree=ast.parse((root/'scripts'/str(name+'.py')).read_text(encoding='utf-8'))
   for node in ast.walk(tree):
    if isinstance(node,ast.ImportFrom) and node.module and (root/'scripts'/str(node.module+'.py')).is_file():pending.append(node.module)
