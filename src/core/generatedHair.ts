import type {Box,OutfitPiece} from './outfitPrototype';
const HAIR_PROMPT='Create exactly TWO separate anime game hair assets, matching the reference silver-white color, thin delicate gray linework and soft gray-lilac shading, smooth antialiased curves, no pixel art or stair-step outlines. Keep the two-panel reference layout and rounded top positions. LEFT HALF: ONLY the requested compact fringe, with a smooth rounded top and tips above the eyebrows. No long side locks, face framing, wig ring, face opening shape, jaw or chin outline. RIGHT HALF: ONLY the requested back hairstyle. This is the layer behind the head and shoulders, viewed from the same front-facing angle. Use a filled scalp area with a smooth rounded top. No face, head, skin, eyes, nose, mouth, ears, neck, body, mannequin, accessories, text, labels or shadow. Pure white background, Leave a wide white gutter between the two assets and white margins on all outer edges. Same scalp width for both. No crown, tiara, headband, horns, spikes or pointed decorations along the top edge. Hair pixels only.';
export const BACK_HAIR_STYLES = {
 long: {group:'Loose hair',label:'Loose waves',shape:'Long softly wavy loose hair behind the shoulders.'},
 straight: {group:'Loose hair',label:'Long straight hair',shape:'A long straight silhouette with sleek vertical strands and a clean, gently tapered hem.'},
 layers: {group:'Loose hair',label:'Feathered layers',shape:'Medium-length feathered layers with staggered tapered ends and loose, outward-swept tips.'},
 ringlets: {group:'Loose hair',label:'Spiral ringlets',shape:'Several large springy spiral ringlets that are visible beside the shoulders, with air between the lower curls.'},
 shoulderWaves: {group:'Loose hair',label:'Shoulder-length waves',shape:'Soft waves that end at the shoulders in a distinct rounded silhouette. No strands extending down the back.'},
 bob: {group:'Short cuts',label:'Short bob',shape:'A short, rounded bob with ends near the jaw. No shoulder-length strands or long curtain behind the shoulders.'},
 bluntBob: {group:'Short cuts',label:'Blunt bob',shape:'A jaw-length bob with a crisp horizontal hem and straight sides.'},
 flippedBob: {group:'Short cuts',label:'Flipped bob',shape:'A neck-length bob with tips visibly curling outward on both sides. No long strands.'},
 pixie: {group:'Short cuts',label:'Tapered pixie',shape:'A compact cropped back with a tapered nape and subtle short overlapping locks. Ends close to the scalp.'},
 shag: {group:'Short cuts',label:'Short shag',shape:'A short layered shag with staggered textured ends around the nape and small outward wisps.'},
 ponytail: {group:'Ponytails',label:'Side-swept ponytail',shape:'One high ponytail with its gathered hair visible on one side of the head. Keep the scalp area centered. No loose shoulder-length curtain or second tail.'},
 lowPonytail: {group:'Ponytails',label:'Low ponytail',shape:'One ponytail gathered at the nape, sweeping into view beside one shoulder, with a compact scalp cap and no loose hair curtain.'},
 curlyPonytail: {group:'Ponytails',label:'Curly ponytail',shape:'One high gathered ponytail sweeping out to the side in a cluster of large curls. The opposite side stays close to the scalp.'},
 twinTails: {group:'Ponytails',label:'Twin tails',shape:'Two clearly separated high ponytails, one visible on each side of the head, with open white space below the central scalp between the tails. No loose central curtain.'},
 lowPigtails: {group:'Ponytails',label:'Low pigtails',shape:'Two short tails gathered low at the nape and visible on either side of the neck. Leave white space between the ends.'},
 bubbleTails: {group:'Ponytails',label:'Bubble twin tails',shape:'Two gathered tails made of rounded hair sections pinched at intervals. Keep the segmented silhouette clear on both sides.'},
 sideBraid: {group:'Braids',label:'Side braid',shape:'One thick woven three-strand braid curving out beside one shoulder. Keep the opposite side close to the scalp.'},
 twinBraids: {group:'Braids',label:'Twin braids',shape:'Two separate woven braids hanging to either side of the shoulders with tapered ends and open white space between them.'},
 fishtail: {group:'Braids',label:'Fishtail braid',shape:'One broad fishtail braid with small crossed strands, tapering as it curves out beside one shoulder.'},
 braidedHalfUp: {group:'Braids',label:'Braided half-up',shape:'Two small braids from the sides meeting at the back above a distinct shoulder-length layer of loose waves.'},
 buns: {group:'Updos',label:'Double buns',shape:'Two round hair buns visible to either side of the upper scalp, made entirely of coiled hair. No hanging strands, loose curtain or accessories.'},
 topKnot: {group:'Updos',label:'Top knot',shape:'One round coiled top knot visible above a snug scalp cap, with a clean nape and no hanging hair.'},
 sideBun: {group:'Updos',label:'Low side bun',shape:'One coiled bun visible beside the lower scalp and nape. Keep the rest of the hair tucked up with no hanging curtain.'},
 halfUpBun: {group:'Updos',label:'Half-up bun',shape:'One small coiled bun visible above the scalp, with loose shoulder-length waves below it.'},
} as const;
export type BackHairStyle = keyof typeof BACK_HAIR_STYLES;
export const BACK_HAIR_STYLE_IDS = Object.keys(BACK_HAIR_STYLES) as BackHairStyle[];
export const BACK_HAIR_GROUPS = Array.from(new Set(BACK_HAIR_STYLE_IDS.map(id=>BACK_HAIR_STYLES[id].group)));


export const FRONT_HAIR_STYLES = {
 classic: {label:'Classic curved bangs',shape:'A softly curved, evenly distributed fringe.'},
 blunt: {label:'Blunt bangs',shape:'A straight eyebrow-length fringe with a clean horizontal edge.'},
 wispy: {label:'Wispy bangs',shape:'A light fringe with narrow tapered locks and small gaps between the tips.'},
 sideSwept: {label:'Side-swept bangs',shape:'Short diagonal bangs swept toward one temple, all ending above the eyebrows.'},
 curtain: {label:'Short curtain bangs',shape:'Center-parted fringe swept outward on both sides, with an open center and short tips above the eyebrows.'},
 micro: {label:'Micro bangs',shape:'A very short fringe with small rounded tips high on the forehead.'},
 choppy: {label:'Choppy bangs',shape:'An irregular fringe with short and medium tapered tips, all above the eyebrows.'},
 rounded: {label:'Rounded bangs',shape:'An arched fringe, slightly shorter at the center and gently rounded toward both temples.'},
 split: {label:'Split bangs',shape:'Two short overlapping groups of locks divided by a small off-center part.'},
 sweptBack: {label:'Swept-back front',shape:'A compact front hairline brushed upward and back, leaving the forehead open.'},
} as const;
export type FrontHairStyle = keyof typeof FRONT_HAIR_STYLES;
export const FRONT_HAIR_STYLE_IDS = Object.keys(FRONT_HAIR_STYLES) as FrontHairStyle[];

export function hairstylePrompt(back: BackHairStyle, front: FrontHairStyle = 'classic'): string {
 return HAIR_PROMPT+' LEFT style: '+FRONT_HAIR_STYLES[front].shape+' RIGHT style: '+BACK_HAIR_STYLES[back].shape+
  (back==='long'&&front==='classic'?'':' Use the reference for color and linework. Follow the requested shapes.');
}

/** Find a clear gutter near the center without cutting through either piece. */
export function hairPanelSplit(data: Uint8ClampedArray, width: number, height: number): number {
 const middle = Math.floor(width / 2);
 const limit = Math.floor(width * .12);
 const clear = (x: number) => {
  for (let y = 0; y < height; y++) {
   const i = (y * width + x) * 4;
   if (data[i+3] >= 16 && Math.min(data[i],data[i+1],data[i+2]) <= 238) return false;
  }
  return true;
 };
 for(let offset=0;offset<=limit;offset++){
  for(const x of offset?[middle-offset,middle+offset]:[middle]){
   if(clear(x-2)&&clear(x-1)&&clear(x)&&clear(x+1))return x;
  }
 }
 throw Error('Hair layers overlap or cross the panel gutter. Generate a new hairstyle.');
}

export function hairBounds(data:Uint8ClampedArray,width:number,height:number):Box{
 let x0=width,y0=height,x1=-1,y1=-1;for(let i=0;i<width*height;i++)if(data[i*4+3]>32){const x=i%width,y=Math.floor(i/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1<0)throw Error('No hair found.');return {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};
}
/** White matte cleanup only; never erase face outlines and call it hair. */
export function cleanHairPanel(input:Uint8ClampedArray,width:number,height:number,slot:'front'|'back'){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<16||height<16||width>1280||height>1280||input.length!==width*height*4)throw Error('Invalid hair panel.');
 const data=new Uint8ClampedArray(input),n=width*height,labels=new Int32Array(n),queue=new Int32Array(n);let label=0,skin=0;
 const white=(i:number)=>{const p=i*4,r=data[p],g=data[p+1],b=data[p+2];return data[p+3]<16||(Math.min(r,g,b)>238&&Math.max(r,g,b)-Math.min(r,g,b)<20);};
 const neighbors=(i:number)=>[i%width?i-1:-1,i%width<width-1?i+1:-1,i>=width?i-width:-1,i<n-width?i+width:-1];
 let background=0;
 const enclosed:{pixels:number[];x:number;y:number;neutral:number}[]=[];
 for(let i=0;i<n;i++){if(labels[i]||!white(i))continue;label++;let head=0,tail=1,edge=false,x0=width,x1=0,y0=height,y1=0;queue[0]=i;labels[i]=label;while(head<tail){const k=queue[head++],x=k%width,y=Math.floor(k/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);if(!x||!y||x===width-1||y===height-1)edge=true;for(const j of neighbors(k))if(j>=0&&!labels[j]&&white(j)){labels[j]=label;queue[tail++]=j;}}
  if(!edge&&slot==='front'&&tail>n*.025&&(y1-y0)>(x1-x0)*.65&&y1>height*.3)throw Error('The front panel contains a face-shaped opening. Use bangs only; no review was saved.');
  if(edge){for(let k=0;k<tail;k++)data[queue[k]*4+3]=0;background+=tail;}
  else if(slot==='back'&&tail>=24){let neutral=0;for(let k=0;k<tail;k++){const p=queue[k]*4,r=data[p],g=data[p+1],b=data[p+2];if(Math.min(r,g,b)>250&&Math.max(r,g,b)-Math.min(r,g,b)<4)neutral++;}enclosed.push({pixels:Array.from(queue.slice(0,tail)),x:(x0+x1)/2,y:(y0+y1)/2,neutral:neutral/tail});}
 }
 if(background<n*.15)throw Error('Hair needs a plain white background.');
 // Keep the primary connected hair piece; reject separate heads/extra assets.
 labels.fill(0);let largest:number[]=[],second=0;
 for(let i=0;i<n;i++){if(labels[i]||data[i*4+3]<16)continue;let head=0,tail=1;queue[0]=i;labels[i]=1;while(head<tail){const k=queue[head++];for(const j of neighbors(k))if(j>=0&&!labels[j]&&data[j*4+3]>=16){labels[j]=1;queue[tail++]=j;}}if(tail>largest.length){second=largest.length;largest=Array.from(queue.slice(0,tail));}else second=Math.max(second,tail);}
 if(largest.length<n*.015)throw Error('No complete hair piece found.');if(second>largest.length*.15)throw Error('Extra hair pieces were generated. No review was saved.');
 const keep=new Uint8Array(n);for(const i of largest)keep[i]=1;for(let i=0;i<n;i++){if(!keep[i]){data[i*4+3]=0;continue;}const p=i*4,r=data[p],g=data[p+1],b=data[p+2];if(r>150&&r>g*1.12&&g>b*1.08)skin++;}
 if(skin>largest.length*.03)throw Error('Skin-colored content found; this must contain hair only.');
 const bounds=hairBounds(data,width,height);
 // A white curl gap is near the lower outer silhouette, unlike crown highlights.
 // Require a strongly neutral matte core; tinted silver shading stays untouched.
 let enclosedBackgroundRemoved=0;
 for(const gap of enclosed)if(gap.neutral>=.60&&gap.y>bounds.y+bounds.height*.42&&Math.abs(gap.x-(bounds.x+bounds.width/2))>bounds.width*.25){for(const i of gap.pixels){data[i*4+3]=0;enclosedBackgroundRemoved++;}}
 // Repeated isolated points along the top are generated headgear, not a smooth hairline.
 let runs=0;
 for(const fraction of [.10,.15,.20]){const band=Math.max(2,Math.round(bounds.height*fraction));let countRuns=0,inside=false;
  for(let x=bounds.x;x<bounds.x+bounds.width;x++){let count=0;for(let y=bounds.y;y<bounds.y+band;y++)if(data[(y*width+x)*4+3]>32)count++;const occupied=count>=2;if(occupied&&!inside)countRuns++;inside=occupied;}
  runs=Math.max(runs,countRuns);
 }
 const profile=Array.from({length:bounds.width},(_,dx)=>{for(let y=bounds.y;y<bounds.y+bounds.height;y++)if(data[(y*width+bounds.x+dx)*4+3]>128)return y;return height;});
 const radius=Math.max(4,Math.round(bounds.width*.06));let peaks=0,inPeak=false;
 for(let x=radius;x<profile.length-radius;x++){const neighbors=profile.slice(x-radius,x+radius+1).sort((a,b)=>a-b),median=neighbors[Math.floor(neighbors.length/2)],peak=median-profile[x]>Math.max(4,bounds.height*.03);if(peak&&!inPeak)peaks++;inPeak=peak;}
 runs=Math.max(runs,peaks);
 if(runs>=4)throw Error('Crown-like spikes or headgear were generated. Hair must have a smooth top edge; no review was saved.');if(bounds.x<2||bounds.y<2||bounds.x+bounds.width>width-2||bounds.y+bounds.height>height-2)throw Error('Hair is cut off at a panel edge.');if(slot==='front'&&bounds.height>bounds.width*1.15)throw Error('Front hair is too long; generate compact bangs, not a face frame.');
 // Unmix only the light matte fringe next to transparency. Dark outline cores
 // and interior hair/highlights are unchanged; this is not a global blur.
 const edgeSource=new Uint8ClampedArray(data);let edgePixelsRefined=0;
 for(let y=2;y<height-2;y++)for(let x=2;x<width-2;x++){
  const i=y*width+x,p=i*4;if(edgeSource[p+3]===0||Math.min(edgeSource[p],edgeSource[p+1],edgeSource[p+2])<140)continue;
  if(!neighbors(i).some(j=>j>=0&&edgeSource[j*4+3]===0))continue;
  let best=p,bestLight=Math.min(edgeSource[p],edgeSource[p+1],edgeSource[p+2]);
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const q=((y+dy)*width+x+dx)*4;if(edgeSource[q+3]<250)continue;
   const light=Math.min(edgeSource[q],edgeSource[q+1],edgeSource[q+2]);if(light<bestLight){best=q;bestLight=light;}
  }
  if(bestLight>=190||Math.min(edgeSource[p],edgeSource[p+1],edgeSource[p+2])-bestLight<20)continue;
  let alpha=0;for(let c=0;c<3;c++)alpha=Math.max(alpha,(255-edgeSource[p+c])/Math.max(1,255-edgeSource[best+c]));alpha=Math.min(1,Math.max(.05,alpha));
  for(let c=0;c<3;c++)data[p+c]=Math.round(Math.max(0,Math.min(255,(edgeSource[p+c]-255*(1-alpha))/alpha)));
  data[p+3]=Math.round(edgeSource[p+3]*alpha);edgePixelsRefined++;
 }
 return {data,bounds,enclosedBackgroundRemoved,edgePixelsRefined};
}
/** Legacy reference fit for imported trials; production uses fitHairToLandmarks below. */
export function hairPiece(slot:'front'|'back',bounds:Box,source:{width:number;height:number},body:{width:number;height:number}):OutfitPiece{
 const targetWidth=body.width*(slot==='front'?406/843:492/843),s=Math.min(targetWidth/bounds.width,slot==='front'?body.height*.225/bounds.height:Infinity),top=body.height*46/1264,left=body.width/2-bounds.width*s/2,base=Math.max(body.width/source.width,body.height/source.height);
 return {id:slot==='front'?'bangs':'back-hair',name:slot==='front'?'Bangs':'Back hair',depth:slot,regions:[{erase:false,points:[{x:bounds.x,y:bounds.y},{x:bounds.x+bounds.width,y:bounds.y},{x:bounds.x+bounds.width,y:bounds.y+bounds.height},{x:bounds.x,y:bounds.y+bounds.height}]}],transform:{scale:s/base,frame:1,x:left-bounds.x*s-(body.width-source.width*s)/2,y:top-bounds.y*s-(body.height-source.height*s)/2}};
}

export interface HairLandmarks{centerX:number;scalpTop:number;headWidth:number;eyeTop:number;mouthTop:number}
export function hairLandmarks(body:Uint8ClampedArray,width:number,height:number,eyes?:Uint8ClampedArray,mouth?:Uint8ClampedArray):HairLandmarks{
 if(body.length!==width*height*4||width<32||height<64)throw Error('Invalid avatar fitting guide.');
 let top=height,left=width,right=-1;
 for(let y=0;y<Math.round(height*.29);y++)for(let x=0;x<width;x++)if(body[(y*width+x)*4+3]>128){top=Math.min(top,y);left=Math.min(left,x);right=Math.max(right,x);}
 if(right<left||top>=height*.25)throw Error('Cannot identify Mana’s head for fitting.');
 const featureBounds=(pixels?:Uint8ClampedArray)=>{if(!pixels||pixels.length!==body.length)return undefined;try{return hairBounds(pixels,width,height);}catch{return undefined;}};
 const headWidth=right-left+1,eyeBox=featureBounds(eyes),mouthBox=featureBounds(mouth);
 return {centerX:(left+right)/2,scalpTop:Math.max(0,top-headWidth*.07),headWidth,eyeTop:eyeBox?.y??top+headWidth*.52,mouthTop:mouthBox?.y??top+headWidth*.98};
}
export function fitHairToLandmarks(front:{data:Uint8ClampedArray;width:number;height:number;bounds:Box},back:{bounds:Box},source:{width:number;height:number},body:{width:number;height:number;data:Uint8ClampedArray},eyes?:Uint8ClampedArray,mouth?:Uint8ClampedArray){
 const guide=hairLandmarks(body.data,body.width,body.height,eyes,mouth),base=Math.max(body.width/source.width,body.height/source.height),cap=Math.max(30,guide.mouthTop+guide.headWidth*.22-guide.scalpTop),top=guide.scalpTop;
 const tips:number[]=[];for(let x=Math.round(front.bounds.x+front.bounds.width*.35);x<front.bounds.x+front.bounds.width*.65;x++){for(let y=Math.min(front.height-1,front.bounds.y+front.bounds.height-1);y>=front.bounds.y;y--)if(front.data[(y*front.width+x)*4+3]>128){tips.push(y-front.bounds.y);break;}}tips.sort((a,b)=>a-b);const fringeDepth=tips[Math.floor(tips.length/2)]??front.bounds.height,fringeTarget=guide.eyeTop+guide.headWidth*.06;
 const opaque=(x:number,y:number,s:number,topY=top)=>{const sx=Math.floor((x-guide.centerX)/s+front.bounds.x+front.bounds.width/2),sy=Math.floor((y-topY)/s+front.bounds.y);return sx>=0&&sx<front.width&&sy>=0&&sy<front.height&&front.data[(sy*front.width+sx)*4+3]>128;};
 const scalp:PointLike[]=[],eyePoints:PointLike[]=[];
 for(let y=Math.round(top);y<guide.eyeTop-guide.headWidth*.25;y+=2)for(let x=Math.round(guide.centerX-guide.headWidth/2);x<guide.centerX+guide.headWidth/2;x+=2){if(x>=0&&x<body.width&&body.data[(y*body.width+x)*4+3]>128)scalp.push({x,y});}
 if(eyes)for(let y=0;y<body.height*.32;y+=2)for(let x=0;x<body.width;x+=2){const i=(y*body.width+x)*4;if(eyes[i+3]>128&&Math.max(eyes[i],eyes[i+1],eyes[i+2])-Math.min(eyes[i],eyes[i+1],eyes[i+2])>35)eyePoints.push({x,y});}
 let best:{scale:number;top:number;scalpMiss:number;eyeCovered:number;score:number}|undefined;
 for(let ratio=1.08;ratio<=1.46;ratio+=.025)for(let shift=-.06;shift<=.021;shift+=.02){const y=top+guide.headWidth*shift,scale=Math.min(guide.headWidth*ratio/front.bounds.width,cap/front.bounds.height),scalpMiss=scalp.length?scalp.filter(p=>!opaque(p.x,p.y,scale,y)).length/scalp.length:0,eyeCovered=eyePoints.length?eyePoints.filter(p=>opaque(p.x,p.y,scale,y)).length/eyePoints.length:0,score=scalpMiss*12+Math.max(0,eyeCovered-.12)*8+Math.abs(y+fringeDepth*scale-fringeTarget)/guide.headWidth*1.5+Math.abs(ratio-1.30)*.08+Math.abs(shift)*.1;if(!best||score<best.score)best={scale,top:y,scalpMiss,eyeCovered,score};}
 const make=(slot:'front'|'back',bounds:Box,s:number):OutfitPiece=>({id:slot==='front'?'bangs':'back-hair',name:slot==='front'?'Bangs':'Back hair',depth:slot,regions:[{erase:false,points:[{x:bounds.x,y:bounds.y},{x:bounds.x+bounds.width,y:bounds.y},{x:bounds.x+bounds.width,y:bounds.y+bounds.height},{x:bounds.x,y:bounds.y+bounds.height}]}],transform:{scale:s/base,frame:1,x:guide.centerX-(bounds.x+bounds.width/2)*s-(body.width-source.width*s)/2,y:best!.top-bounds.y*s-(body.height-source.height*s)/2}});
 const backScale=Math.min(guide.headWidth*1.9/back.bounds.width,body.height*.50/back.bounds.height),warnings:string[]=[];
 const fringeTip=best!.top+fringeDepth*best!.scale;if(Math.abs(fringeTip-fringeTarget)>guide.headWidth*.18)warnings.push('Fringe depth needs review.');
 if(!eyePoints.length)warnings.push('Eye landmarks are unavailable; inspect the fringe manually.');
 if(best!.scalpMiss>.02)warnings.push('Some scalp coverage needs review.');if(best!.eyeCovered>.22)warnings.push('Bangs overlap the eye area; review the fringe position.');
 return {parts:[make('front',front.bounds,best!.scale),make('back',back.bounds,backScale)],report:{guide,scalpUncovered:best!.scalpMiss,eyesCovered:best!.eyeCovered,eyeProtection:'colored-iris',verticalShift:best!.top-top,fringeTip,fringeTarget,warnings,uniformOnly:true,fitVersion:'head-eye-landmarks-v3'}};
}
interface PointLike{x:number;y:number}
