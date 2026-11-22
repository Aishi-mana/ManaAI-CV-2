import {isRecord} from './validation';
import {cleanAccessory} from './generatedAccessories';
import type {ImageAttachment} from './vision';

export const ROOM_SHOP_LIMIT=12;
export const ROOM_BACKGROUND_LIMIT=8;
export const ROOM_SHOP_PRICE=40;
export const ROOM_SHOP_CATEGORIES=['Seating','Tables','Storage','Plants'] as const;
export type RoomShopCategory=typeof ROOM_SHOP_CATEGORIES[number];
export const ROOM_DESIGNS=[
 {category:'Tables',name:'Moonstone side table',description:'a blue-gray wooden side table with a moon-shaped inlay',reference:'coffee_table.png'},
 {category:'Seating',name:'Peach reading stool',description:'a peach velvet reading stool with short walnut legs',reference:'beanie_bag.png'},
 {category:'Plants',name:'Mint planter',description:'a small leafy plant in a mint ceramic pot',reference:'plant.png'},
 {category:'Seating',name:'Lavender ottoman',description:'a lavender upholstered ottoman with a scalloped base',reference:'beanie_bag.png'},
 {category:'Tables',name:'Honey oak end table',description:'a honey oak end table with a curved shelf',reference:'coffee_table.png'},
 {category:'Plants',name:'Terracotta fern',description:'a compact fern in a patterned terracotta pot',reference:'plant.png'},
 {category:'Storage',name:'Cloud bookcase',description:'a compact ivory bookcase with two shelves and a cloud-shaped cutout',reference:'bookshelf.png'},
 {category:'Storage',name:'Lavender cabinet',description:'a low lavender storage cabinet with two paneled doors and brass knobs',reference:'bookshelf.png'},
] as const satisfies readonly {category:RoomShopCategory;name:string;description:string;reference:string}[];
export type RoomDesign=typeof ROOM_DESIGNS[number];
export function shopPieceActivity(name:string):'water'|'read'|'sleep'|undefined{
 const design=ROOM_DESIGNS.find(item=>item.name===name);
 if(design?.category==='Plants')return 'water';
 if(design?.category==='Seating')return 'sleep';
 if(design?.name==='Cloud bookcase')return 'read';
}
export interface ShopPiece {id:string;name:string;image:string;aspect:number;owned:boolean}
export interface RoomShop {coins:number;pieces:ShopPiece[]}
export const emptyRoomShop=():RoomShop=>({coins:100,pieces:[]});

export function chooseRoomDesign(category:RoomShopCategory|'Any category',pieces:readonly ShopPiece[],roll=Math.random()):RoomDesign{
 const matching=ROOM_DESIGNS.filter(design=>category==='Any category'||design.category===category);
 const fresh=matching.filter(design=>!pieces.some(piece=>piece.name===design.name));
 const pool=fresh.length?fresh:matching;
 return pool[Math.min(pool.length-1,Math.floor(roll*pool.length))];
}

export function validateRoomShop(value:unknown):RoomShop|undefined{
 if(!isRecord(value)||typeof value.coins!=='number'||!Number.isInteger(value.coins)||value.coins<0||value.coins>9999||!Array.isArray(value.pieces))return;
 const pieces:ShopPiece[]=[];
 for(const piece of value.pieces.slice(0,ROOM_SHOP_LIMIT)){
  if(!isRecord(piece)||typeof piece.id!=='string'||!/^shop-[a-z0-9-]{1,45}$/.test(piece.id)||pieces.some(item=>item.id===piece.id)||
   typeof piece.name!=='string'||!piece.name.trim()||piece.name.length>80||typeof piece.owned!=='boolean'||
   typeof piece.aspect!=='number'||!Number.isFinite(piece.aspect)||piece.aspect<.45||piece.aspect>2.4||
   typeof piece.image!=='string'||piece.image.length>200_000||!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(piece.image)||
   (piece.image.length-'data:image/png;base64,'.length)%4!==0)continue;
  pieces.push({id:piece.id,name:piece.name,image:piece.image,aspect:piece.aspect,owned:piece.owned});
 }
 return {coins:value.coins,pieces};
}

export function buyRoomPiece(shop:RoomShop,id:string):RoomShop{
 if(shop.coins<ROOM_SHOP_PRICE||!shop.pieces.some(piece=>piece.id===id&&!piece.owned))return shop;
 return {coins:shop.coins-ROOM_SHOP_PRICE,pieces:shop.pieces.map(piece=>piece.id===id?{...piece,owned:true}:piece)};
}

export function furniturePrompt(description:string){
 return `Use the reference only for its camera angle and illustrated room sprite style. Draw one complete new object: ${description}. Match the reference isometric three-quarter camera: viewed slightly from above with the top and two sides visible where applicable, upright verticals, left and right edges diagonally receding, no straight-on or side-profile view. Preserve the reference orientation, with the front facing down and right. Single isolated object centered on a pure white background, generous margins, distinct colored edges. No room, floor, people, text, duplicate pieces, or cast shadow.`;
}

export async function prepareFurnitureReference(design:{reference:string},signal:AbortSignal){
 const bitmap=await createImageBitmap(await (await fetch('./companion-room/cartoon/'+design.reference,{signal})).blob());
 try{
  signal.throwIfAborted();
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=512;
  const context=canvas.getContext('2d');
  if(!context)throw Error('Furniture reference preparation is unavailable.');
  const scale=340/Math.max(bitmap.width,bitmap.height);
  const width=Math.round(bitmap.width*scale),height=Math.round(bitmap.height*scale);
  context.fillStyle='white';
  context.fillRect(0,0,512,512);
  context.imageSmoothingQuality='high';
  context.drawImage(bitmap,Math.floor((512-width)/2),Math.floor((512-height)/2),width,height);
  return canvas.toDataURL('image/jpeg',.92);
 }finally{bitmap.close();}
}

export const ROOM_BACKGROUND_PROMPT='Redraw this exact empty isometric room in the same cartoon game style with new coordinated wall colors and wood or tile flooring. Preserve the exact outline, two wall planes, center seam, wall-to-floor boundaries, floor corners, and camera. No windows, furniture, lettering, decorations, or people. Show the complete room with margins on a pure white background. Keep the structural outlines dark and connected.';

export function validRoomBackground(value:unknown):value is string{
 return typeof value==='string'&&value.length<=550_000&&/^data:image\/webp;base64,UklGR[A-Za-z0-9+/]*={0,2}$/.test(value)
  &&(value.length-'data:image/webp;base64,'.length)%4===0;
}

export async function prepareRoomBackground(image:ImageAttachment,reference:string):Promise<string>{
 const bitmap=await createImageBitmap(await (await fetch(image.dataUrl)).blob());
 try{
  const canvas=document.createElement('canvas');
  canvas.width=bitmap.width;
  canvas.height=bitmap.height;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Room background preparation is unavailable.');
  ctx.drawImage(bitmap,0,0);
  const clean=cleanAccessory(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  ctx.putImageData(new ImageData(new Uint8ClampedArray(clean.data),canvas.width,canvas.height),0,0);
  const {x,y,width,height}=clean.bounds;
  const template=await createImageBitmap(await (await fetch(reference)).blob());
  try{
   const output=document.createElement('canvas');
   output.width=799;output.height=698;
   const target=output.getContext('2d');
   if(!target)throw Error('Room background preparation is unavailable.');
   target.drawImage(canvas,x,y,width,height,0,0,799,698);
   const pixels=target.getImageData(0,0,799,698).data;
   target.clearRect(0,0,799,698);
   target.drawImage(template,0,0,799,698);
   const expected=target.getImageData(0,0,799,698).data;
   let overlap=0,union=0;
   for(let i=3;i<pixels.length;i+=4){
    const actual=pixels[i]>128,original=expected[i]>128;
    if(actual||original)union++;
    if(actual&&original)overlap++;
   }
   if(!union||overlap/union<.94)throw Error('The generated outline does not line up with this room. Try another background.');
   target.globalCompositeOperation='source-in';
   target.drawImage(canvas,x,y,width,height,0,0,799,698);
   const data=output.toDataURL('image/webp',.88);
   if(!validRoomBackground(data))throw Error('The background could not be saved at room size.');
   return data;
  }finally{template.close();}
 }finally{bitmap.close();}
}

export async function prepareShopPiece(image:ImageAttachment,id:string,name:string):Promise<ShopPiece>{
 const bitmap=await createImageBitmap(await (await fetch(image.dataUrl)).blob());
 try{
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,512/Math.max(bitmap.width,bitmap.height));
  canvas.width=Math.round(bitmap.width*scale);
  canvas.height=Math.round(bitmap.height*scale);
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Furniture image preparation is unavailable.');
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  let clean:ReturnType<typeof cleanAccessory>;
  try{clean=cleanAccessory(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);}
  catch{throw Error('Mana needs one complete piece of furniture on a plain white background. Try another design.');}
  ctx.putImageData(new ImageData(new Uint8ClampedArray(clean.data),canvas.width,canvas.height),0,0);
  const {x,y,width,height}=clean.bounds;
  const aspect=height/width;
  if(aspect<.45||aspect>2.4)throw Error('This piece is too tall or wide for the room. Try another design.');
  const output=document.createElement('canvas');
  const resize=Math.min(1,240/Math.max(width,height));
  output.width=Math.round(width*resize);
  output.height=Math.round(height*resize);
  const target=output.getContext('2d');
  if(!target)throw Error('Furniture image preparation is unavailable.');
  target.drawImage(canvas,x,y,width,height,0,0,output.width,output.height);
  const data=output.toDataURL('image/png');
  if(data.length>200_000)throw Error('The furniture image is too large to save.');
  return {id,name,image:data,aspect,owned:false};
 }finally{bitmap.close();}
}
