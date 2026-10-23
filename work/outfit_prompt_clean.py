from pathlib import Path
p=Path('src/core/imageGeneration.ts');s=p.read_text(encoding='utf-8').replace('Create a clean anime wardrobe design sheet of ${garment}.','Draw only these isolated anime clothing objects: ${garment}.',1)
s=s.replace("'person, human, mannequin, face, head, hair, skin, hands, feet, body, cropped, out of frame'","'person, human, mannequin, face, head, hair, skin, hands, feet, body, cropped, out of frame, text, letters, typography, captions, labels, watermark'",1);p.write_text(s,encoding='utf-8')
p=Path('tests/foundation.test.cjs');s=p.read_text(encoding='utf-8').replace('/wardrobe design sheet/','/isolated anime clothing objects/');p.write_text(s,encoding='utf-8')
