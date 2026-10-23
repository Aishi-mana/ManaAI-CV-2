export interface ImageGenerationRequest{model:string;prompt:string;negative:string;width:number;height:number;steps:number;cfg:number;seed:number;cpu:boolean;reference?:string;referenceStrength?:number;referenceMask?:string;characterReference?:boolean}

export function imageGenerationRequest(value:ImageGenerationRequest):ImageGenerationRequest{

 if(value.characterReference!==undefined&&typeof value.characterReference!=='boolean')throw Error('Choose a valid character reference.');if(isQwenModel(value.model)&&(value.cpu||value.referenceMask||(value.reference&&value.characterReference)||value.width*value.height>1_310_720))throw Error('Qwen needs GPU mode, one character reference and an image up to 1.3 megapixels.');if(value.characterReference&&!isQwenModel(value.model))throw Error('Character sheet references require Qwen.');

 if(!value.model||/[\\/]/.test(value.model)||!value.model.endsWith('.safetensors')||!value.prompt.trim()||value.prompt.length>1500||value.negative.length>1500||![value.width,value.height].every(n=>Number.isInteger(n)&&n>=128&&n<=(isQwenModel(value.model)?1280:1024)&&n%(isQwenModel(value.model)?16:64)===0)||!Number.isInteger(value.steps)||value.steps<1||value.steps>50||!Number.isFinite(value.cfg)||value.cfg<1||value.cfg>15||!Number.isInteger(value.seed)||value.seed<0||value.seed>4294967295||typeof value.cpu!=='boolean')throw Error('Choose a supported checkpoint, a prompt and valid image settings.');if(value.reference!==undefined&&(value.reference.length>1_000_000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value.reference)))throw Error('Use a prepared JPEG avatar reference.');if(value.referenceMask!==undefined&&(!value.reference||value.referenceMask.length>1_000_000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value.referenceMask)))throw Error('Clothing editing needs a valid avatar reference and mask.');if(value.referenceStrength!==undefined&&(!Number.isFinite(value.referenceStrength)||value.referenceStrength<.2||value.referenceStrength>.8))throw Error('Choose reference variation between 0.2 and 0.8.');return {...value,prompt:value.prompt.trim()};

}

export interface ChatPictureRequest {prompt:string;backend?:'neta'|'sd'|'animagine'|'photon'|'qwen';referenceAvatar?:boolean;clothingOnly?:boolean;qwenReferenceSource?:'sheet'|'avatar'}

/** Only explicit leading creation requests; questions and quoted discussion stay chat. */

export function requestedPicture(text:string,charName='Mana'):ChatPictureRequest|null {

 let command=text.trim();

 if(charName&&(command.toLowerCase().startsWith(charName.toLowerCase()+',')||command.toLowerCase().startsWith(charName.toLowerCase()+' ')))command=command.slice(charName.length+1).trim();

 command=command.replace(/^please\s+/i,'').replace(/^(?:can|could|would) you\s+(?:please\s+)?/i,'');

 const match=command.match(/^(?:draw\s+(?:me\s+)?(?:a\s+|an\s+)?|(?:generate|create|make)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:picture|image|illustration)\s+(?:of\s+)?)([\s\S]+)$/i);

 if(!match)return null;

 let prompt=match[1].trim(),backend:ChatPictureRequest['backend'];

 prompt=prompt.replace(/\s+(?:using|with)\s+(netayume|animagine|stable diffusion|photon|qwen)[.!?]*$/i,(_,name:string)=>{backend=({qwen:'qwen',netayume:'neta',animagine:'animagine',photon:'photon','stable diffusion':'sd'} as const)[name.toLowerCase() as 'qwen'|'netayume'|'animagine'|'photon'|'stable diffusion'];return '';}).trim();

 if(/^(?:conclusions?|comparisons?|parallels?|attention|on your|from your)\b/i.test(prompt))return null;

 if(!prompt||/^(?:a|an|the|something|picture|image|illustration)[.!?]*$/i.test(prompt)||prompt.length>1500)return null;

 const qwenReferenceSource=backend==='qwen'&&/\b(?:using|from|based on|as) (?:your |the )?current avatar\b/i.test(prompt)?'avatar':undefined;
 if(qwenReferenceSource)prompt=prompt.replace(/\b(?:using|from|based on|as) (?:your |the )?current avatar\b/i,'').trim();
 const referenceAvatar=/\b(?:yourself|of you|your (?:new )?outfit)\b/i.test(prompt)||(charName&&(prompt.toLowerCase().includes('of '+charName.toLowerCase())||prompt.toLowerCase().startsWith(charName.toLowerCase()+' ')||prompt.toLowerCase()===charName.toLowerCase()));const clothingOnly=/\b(?:(?:clothing|outfit|garment) only|only (?:the )?(?:clothing|outfit|garment)|no (?:person|human)|without (?:a |the )?(?:person|character|body))\b/i.test(prompt);return {prompt,...(backend?{backend}:{}),...(referenceAvatar||qwenReferenceSource?{referenceAvatar:true}:{}),...(qwenReferenceSource?{qwenReferenceSource}:{}),...(clothingOnly?{clothingOnly:true}:{})};

}



export function choosePictureModel<T extends {name:string;kind:string}>(models:T[],choice?:ChatPictureRequest['backend']):T|undefined{

 const animagine=models.find(m=>m.kind==='sdxl'&&m.name.toLowerCase().startsWith('animagine'));

 const photon=models.find(m=>m.kind==='sd1'&&m.name.toLowerCase()==='photon_v1.safetensors');

 if(choice==='qwen')return models.find(m=>m.kind==='qwen');

 if(choice==='neta')return models.find(m=>m.kind==='neta');

 if(choice==='animagine')return animagine;

 if(choice==='photon')return photon;

 const sdFallback=photon??models.find(m=>m.kind==='sd1')??models.find(m=>m.kind==='sdxl');

 return choice==='sd'?sdFallback:animagine??sdFallback;

}

export function pictureDetails(filename:string):string{

 const match=filename.match(/^Mana-(.+)-(\d+)\.jpg$/);

 return match?`Model: ${match[1]} · Seed: ${match[2]}`:'';

}



/** Relative words describe the supplied avatar, not an identity known to the checkpoint. */

export function avatarPicturePrompt(prompt:string,clothing=false,model=""):string {

 if(clothing&&/^animagine/i.test(model))return animagineClothingPrompt(prompt);

 const request=prompt.replace(/\byourself\b/gi,'the character in the reference image').replace(/\byour (?:new )?outfit\b/gi,'a new outfit for the character in the reference image');

 return (clothing?'Replace the original clothing in the editable region with the requested new outfit. Do not retain the original outfit merely because it appears in the reference. ':'')+'Anime illustration of the same single character shown in the reference image. Preserve the reference character’s face, eye color, hairstyle, hair color, proportions and distinctive accessories except for changes explicitly requested below. Keep the face clearly visible and detailed. Requested scene or changes: '+request;

}



export function isClothingChange(prompt:string):boolean{return /\b(?:dress|outfit|clothing|clothes|wearing|costume|uniform|jacket|skirt|swimsuit|sweater|hoodie|shirt|pants|trousers)\b/i.test(prompt);}



export function animagineClothingPrompt(prompt:string):string {

 const target=prompt.replace(/^(?:yourself|the character in the reference image)\s*(?:in|wearing)?\s*(?:a |an )?/i,'').trim().replace(/[.!?]+$/,'');

 const summer=/\bsummer dress\b/i.test(target);

 const straps=summer&&!/\b(?:strapless|off.shoulder|halter|sleeves?|spaghetti|straps?)\b/i.test(target)?'sleeveless dress, wide shoulder straps, ':'';

 const shoes=!/\b(?:shoes?|boots?|sandals?|barefoot|heels?|sneakers?|feet|toes)\b/i.test(target)?'closed-toe shoes, ':'';

 return `1girl, solo, ${target}, ${summer?'sundress, ':''}${straps}${shoes}full body, feet fully visible, standing, arms at sides, hands at sides, detailed clothing, white background, masterpiece, high score, great score, absurdres`;

}

export function clothingNegative(prompt:string,negative:string,model:string):string {

 if(!/^animagine/i.test(model)||! /\bdress\b/i.test(prompt)||/\b(?:hoodie|sweatshirt|shorts)\b/i.test(prompt))return negative;

 return [negative,'hoodie, sweatshirt, shorts'].filter(Boolean).join(', ');

}



export function outfitQualityDefaults(model:string,enabled:boolean,prompt=""){if(isQwenModel(model))return {steps:4,cfg:1,referenceStrength:.45};return enabled&&/^animagine/i.test(model)?{steps:28,cfg:5.5,referenceStrength:.8}:{steps:20,cfg:/^neta/i.test(model)?4:7,referenceStrength:.45};}



export function clothingOnlyPrompt(prompt:string,model:string){

 const garment=prompt.replace(/^(?:yourself|the character in the reference image)\s*(?:in|wearing)?\s*(?:a |an )?/i,'').replace(/\b(?:outfit|clothing) only\b/gi,'outfit').trim().replace(/[.!?]+$/,'');

 if(isQwenModel(model))return `Draw only these isolated anime clothing objects: ${garment}. Clothing items only, with no wearer. Show each requested garment and both shoes, when requested, as separate complete pieces with generous empty gaps, all facing forward in the same scale. Use a natural wearable shape with open necklines, clear sleeve openings, readable seams and fabric folds. Flat arrangement, no perspective distortion. Keep the design practical and faithful to the requested colors and style. No extra garments, labels, text, hangers, mannequin, person, head, hair, skin, hands or feet. Center all pieces with margins on a uniform light-gray background, no gradients or cast shadows. Crisp clean anime linework and coherent soft cel shading.`;
 return /^animagine/i.test(model)?`no humans, ${garment}, clothing only, front view, isolated garment, centered, complete garment, white background, detailed fabric, masterpiece, high score, great score, absurdres`:`Clothing design of ${garment}. Clothing only, front view, isolated complete garment on a plain white background. No person, mannequin, skin, face or hair.`;

}

export function clothingOnlyNegative(negative:string){return [negative,'person, human, mannequin, face, head, hair, skin, hands, feet, body, cropped, out of frame, text, letters, typography, captions, labels, watermark'].filter(Boolean).join(', ');}



/** Fresh requests vary; retaining a seed remains an explicit repeatability option. */

export function freshPictureSeed(previous:number,value?:number){let next=value;if(next===undefined){const crypto=globalThis.crypto;next=crypto?.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296);}next=Math.floor(next)>>>0;return next===previous?(next+1)>>>0:next;}



export function isQwenModel(model:string){return model==='Qwen-Rapid-AIO-SFW-v23.safetensors';}

export function qwenArtworkPrompt(prompt:string,reference:boolean,source:'sheet'|'avatar'='sheet'){return reference?'Create a new polished anime artwork of the same single character shown in the reference '+(source==='sheet'?'turnaround sheet':'current avatar image')+'. Preserve the reference character’s recognizable face, apparent age, head-to-body ratio, height, body proportions, eye color, hair color, hairstyle and distinctive features, except for changes explicitly requested. Do not age the character up or lengthen her limbs into adult proportions. Generate exactly one character in one coherent scene, even if the reference shows several views of that same character. Do not duplicate her, draw twins, add reflections or repeat the reference views. Generate a coherent new pose and outfit as requested, not a collage or character sheet. Reference backgrounds and labels are not part of the artwork. Requested artwork: '+prompt.replace(/\byourself\b/gi,'the reference character'):prompt;}

export function pictureModelDimensions(kind:string,reference=false){return kind==='qwen'?{width:1280,height:720}:kind==='sd1'?{width:512,height:reference?768:512}:{width:reference?768:1024,height:1024};}

export function pictureModelReady(kind:string,discovery:{engineReady:boolean;netaReady:boolean;qwenReady?:boolean}){return kind==='qwen'?!!discovery.qwenReady:kind==='neta'?discovery.netaReady:kind!=='unsupported'&&discovery.engineReady;}


export function outfitDesignRequest():ChatPictureRequest{return {backend:'qwen',clothingOnly:true,prompt:'A coordinated cozy casual outfit set: a simple lavender button-front cardigan, a plain white knee-length skirt, and a matching pair of white closed-toe flats. Soft fabric, understated details, clean anime styling. Show the cardigan, skirt and two shoes separately.'};}
