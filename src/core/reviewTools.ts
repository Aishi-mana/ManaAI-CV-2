export const outfitSteps=[['loading','Load image model'],['sampling','Generate clothing'],['fitting_outfit','Fit clothing'],['resizing_outfit','Resize to body'],['checking_outfit_fit','Check fit'],['cleaning_outfit','Prepare review'],['ready','Save for review / Wardrobe']] as const;
export function outfitStepIndex(stage:string){return outfitSteps.findIndex(s=>s[0]===stage);}
export async function runReviewBatch(ids:string[],action:(id:string)=>Promise<void>){const succeeded:string[]=[],failed:{id:string;error:string}[]=[];for(const id of [...new Set(ids)]){try{await action(id);succeeded.push(id);}catch(e){failed.push({id,error:String(e)});}}return {succeeded,failed};}

export function inspectionLayers<T extends {key:string}>(layers:T[],showFrontHair:boolean):T[]{return showFrontHair?layers:layers.filter(l=>!/^hairstyles\/.*hair_(front|ahoge)/i.test(l.key));}
