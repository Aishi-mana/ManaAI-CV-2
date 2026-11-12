import type {Box} from './outfitPrototype';
/** Remove edge-connected neutral white/gray background, then isolate one accessory.
 * This deliberately supports colored, outlined clips/bows, not white lace or jewelry. */
export function cleanAccessory(input:Uint8ClampedArray,width:number,height:number){
 if(width<8||height<8||width>2048||height>2048||input.length!==width*height*4)throw Error('Invalid accessory picture.');
 const n=width*height,data=new Uint8ClampedArray(input),seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
 const background=(i:number)=>{const p=i*4,r=data[p],g=data[p+1],b=data[p+2];return data[p+3]<16||(Math.min(r,g,b)>=175&&Math.max(r,g,b)-Math.min(r,g,b)<28);};
 const add=(i:number)=>{if(!seen[i]&&background(i)){seen[i]=1;queue[tail++]=i;}};
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
 while(head<tail){const i=queue[head++],x=i%width;if(x)add(i-1);if(x<width-1)add(i+1);if(i>=width)add(i-width);if(i<n-width)add(i+width);}
 if(tail<n*.15)throw Error('The accessory needs a plain white background. Try another design.');
 for(let i=0;i<n;i++)if(seen[i])data[i*4+3]=0;
 // Reject multiple substantial objects rather than silently saving an accessory sheet.
 seen.fill(0);const groups:number[][]=[];
 for(let i=0;i<n;i++){if(seen[i]||data[i*4+3]<16)continue;head=0;tail=0;queue[tail++]=i;seen[i]=1;const group:number[]=[];while(head<tail){const k=queue[head++];group.push(k);const x=k%width;for(const j of [x?k-1:-1,x<width-1?k+1:-1,k>=width?k-width:-1,k<n-width?k+width:-1])if(j>=0&&!seen[j]&&data[j*4+3]>=16){seen[j]=1;queue[tail++]=j;}}groups.push(group);}
 groups.sort((a,b)=>b.length-a.length);const main=groups[0];if(!main||main.length<n*.015||main.length>n*.7)throw Error('No isolated accessory found. Try another design.');
 if(groups[1]?.length>main.length*.2)throw Error('More than one object was generated. Please try one simple clip or bow.');
 const keep=new Uint8Array(n);let x0=width,y0=height,x1=0,y1=0;for(const i of main){keep[i]=1;const x=i%width,y=Math.floor(i/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x0<2||y0<2||x1>=width-2||y1>=height-2)throw Error('The accessory is cut off at the picture edge.');
 for(let i=0;i<n;i++)if(!keep[i])data[i*4+3]=0;
 return {data,bounds:{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}};
}
export function accessoryPlacement(head:Box,item:Box,side:'left'|'right'):Box{
 const width=head.width*.28,height=width*item.height/item.width;
 if(height>head.height*.6)throw Error('This accessory is too tall for an automatic temple fit.');
 return {x:head.x+head.width*(side==='left'?.16:.84)-width/2,y:head.y+head.height*.36-height/2,width,height};
}
export function accessoryPrompt(kind:'bow'|'clip',color:string){return `One small ${color} ${kind==='bow'?'fabric hair bow with a central knot and two short tails':'decorative star-shaped hair clip'}, front view, flat polished anime accessory illustration, complete dark outline, isolated centered single object on pure white background. No person, face, head, hair, skin, mannequin, hand, attachment diagram, duplicate objects, text, labels, cast shadow, ground shadow or drop shadow. Show the accessory only, filling the middle half of the picture.`;}
export interface AccessoryIdea{name:string;description:string}
export function readAccessoryIdea(text:string):AccessoryIdea{
 const cleaned=text.replace(/<think>[\s\S]*?<\/think>/gi,'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let value:unknown;try{value=JSON.parse(cleaned);}catch{throw Error('Mana did not return a complete accessory idea. No image was generated.');}
 const v=value as AccessoryIdea;if(!v||typeof v.name!=='string'||!v.name.trim()||v.name.length>80||typeof v.description!=='string'||!v.description.trim()||v.description.length>700)throw Error('Mana’s accessory idea was incomplete. No image was generated.');
 return {name:v.name.trim(),description:v.description.trim()};
}
export function accessoryIdeaMessages(character:string,personality:string,look:string){return [{role:'system' as const,content:`You are ${character}. ${personality.slice(0,2000)} Invent one small colored, outlined hair accessory you would like to wear. Be creative with its shape, material, motif and color; you are not limited to bows or stars. It must be a single connected item that fits at one temple. No pairs, face, hair, body, hats, jewelry, white lace, transparent material, hanging chains, scenery or lettering. Return only JSON: {"name":"short name","description":"visual design of the accessory only, under 700 characters"}.`},{role:'user' as const,content:`Choose a new accessory for yourself. Current look labels (not a visual description): ${look.slice(0,500)}. Describe only the item for image generation.`}];}
export function describedAccessoryPrompt(description:string){
 const request=description.trim();if(!request||request.length>700)throw Error('Describe one small hair accessory in 1–700 characters.');
 return `Draw this one small hair accessory: ${request}. Treat this as an accessory design, not a scene. One complete connected object, front view, flat polished anime accessory illustration, complete dark outline, centered on pure white background. No person, face, head, hair, skin, mannequin, hand, duplicates, text, labels, cast shadow, ground shadow or drop shadow. Show the accessory only, filling the middle half of the picture.`;
}
