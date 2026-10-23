from pathlib import Path
p=Path('src/core/imageGeneration.ts');s=p.read_text(encoding='utf-8');marker=' return /^animagine/i.test(model)?`no humans,'
assert marker in s
s=s.replace(marker," if(isQwenModel(model))return `Create a clean anime wardrobe design sheet of ${garment}. Clothing items only, with no wearer. Show each requested garment and both shoes, when requested, as separate complete pieces with generous empty gaps, all facing forward in the same scale. Use a natural wearable shape with open necklines, clear sleeve openings, readable seams and fabric folds. Flat arrangement, no perspective distortion. Keep the design practical and faithful to the requested colors and style. No extra garments, labels, text, hangers, mannequin, person, head, hair, skin, hands or feet. Center all pieces with margins on a uniform light-gray background, no gradients or cast shadows. Crisp clean anime linework and coherent soft cel shading.`;\n"+marker,1)
s+='''
export function outfitDesignRequest():ChatPictureRequest{return {backend:'qwen',clothingOnly:true,prompt:'A coordinated cozy casual outfit set: a simple lavender button-front cardigan, a plain white knee-length skirt, and a matching pair of white closed-toe flats. Soft fabric, understated details, clean anime styling. Show the cardigan, skirt and two shoes separately.'};}
'''
p.write_text(s,encoding='utf-8')
p=Path('src/App.tsx');s=p.read_text(encoding='utf-8');i=s.index("from './core/imageGeneration'");start=s.rfind('import ',0,i);part=s[start:i];part=part.replace('{','{outfitDesignRequest,',1);s=s[:start]+part+s[i:];s=s.replace("{prompt:'A cozy casual outfit with detailed fabric and clean linework',clothingOnly:true}",'outfitDesignRequest()',1);p.write_text(s,encoding='utf-8')
