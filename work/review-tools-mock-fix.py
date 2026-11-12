from pathlib import Path
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8');a=s.index("test('Atelier hands a design");b=s.index("test('wardrobe inventory",a);part=s[a:b].replace("id.includes('ImageGenerationDrawer')?", "id.includes('DraftLibrary')?{default:()=>null,__esModule:true}:id.includes('ImageGenerationDrawer')?",1);s=s[:a]+part+s[b:];p.write_text(s,encoding='utf-8')
