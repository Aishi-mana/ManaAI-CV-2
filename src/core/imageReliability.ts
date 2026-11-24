import {choosePictureModel,pictureModelReady,type ChatPictureRequest} from './imageGeneration';

export interface LocalImageModel {name:string;kind:string}
export interface LocalImageDiscovery<T extends LocalImageModel=LocalImageModel> {
 models:T[];
 engineReady:boolean;
 netaReady:boolean;
 qwenReady?:boolean;
}

const checkpointPattern=/^[^\\/]{1,180}\.safetensors$/i;
const GPU_STALL_MS=20*60_000;
const CPU_STALL_MS=120*60_000;

/** Reuse a checkpoint that actually saved a prior Sketchbook picture.
 * Never trust a stored path or accept a checkpoint not present in discovery.
 */
export function lastSuccessfulSketchbookModel(
 entries:readonly {model?:string}[],
):string|undefined {
 for(let i=entries.length-1;i>=0;i--){
  const name=entries[i]?.model;
  if(typeof name==='string'&&checkpointPattern.test(name))return name;
 }
 return undefined;
}

/**
 * The user's explicit backend choice is authoritative: never switch it silently.
 * Autonomous Sketchbook requests can reuse a proven installed checkpoint, or
 * try a locally installed lower-memory SD1 checkpoint before large SDXL.
 * No model files are created, selected by path or downloaded.
 */
export function chooseReadyImageModel<T extends LocalImageModel>(
 discovery:LocalImageDiscovery<T>,
 options:Pick<ChatPictureRequest,'backend'|'preferredModel'|'preferEfficientModel'>={},
):T|undefined {
 const ready=(model:T)=>pictureModelReady(model.kind,discovery);
 const models=discovery.models.filter(model=>ready(model));
 if(options.backend){
  const selected=choosePictureModel(discovery.models,options.backend);
  return selected&&ready(selected)?selected:undefined;
 }
 const preferred=options.preferredModel;
 if(typeof preferred==='string'&&checkpointPattern.test(preferred)){
  const known=models.find(model=>model.name===preferred);
  if(known)return known;
 }
 if(options.preferEfficientModel){
  return models.find(model=>model.kind==='sd1'&&model.name.toLowerCase()==='photon_v1.safetensors')??
   models.find(model=>model.kind==='sd1')??
   models.find(model=>model.kind==='neta')??
   models.find(model=>model.kind==='sdxl');
 }
 const usual=choosePictureModel(discovery.models);
 return usual&&ready(usual)?usual:models[0];
}

/** Avoid hanging forever on a native job that stopped reporting progress.
 * CPU inference is intentionally allowed much longer than GPU inference.
 */
export function imageProgressStalled(lastProgressAt:number,now:number,cpu:boolean):boolean {
 return Number.isFinite(lastProgressAt)&&Number.isFinite(now)&&now>=lastProgressAt&&
  now-lastProgressAt>(cpu?CPU_STALL_MS:GPU_STALL_MS);
}

/** Keep the native error visible, with a specific and safe recovery action. */
export function explainImageFailure(error:unknown,cpu:boolean):string {
 const detail=(error instanceof Error?error.message:String(error)).slice(0,800);
 if(/(?:out.of.memory|\boom\b|cuda.*alloc|cuda.*memory|cudnn.*alloc|failed to allocate|cannot allocate|not enough memory|insufficient.*memory|memory allocation failed)/i.test(detail)){
  return detail+' '+(cpu
   ?'The image process ran out of system memory. Close other heavy tasks and try a smaller installed checkpoint.'
   :'The GPU could not fit this image job. Mana should restore her chat model after stopping the image job. Try an installed SD1/Photon checkpoint or choose CPU mode for a supported model.');
 }
 if(/image generation was stopped|\bimage job stopped\b/i.test(detail))
  return 'The local image job stopped before finishing. No incomplete picture was saved.';
 if(/started outside Mana|outside Mana|externally managed|external chat model/i.test(detail))
  return detail+' Stop the external chat server before GPU artwork, or choose CPU mode for a supported model.';
 if(/stalled|no progress/i.test(detail))
  return detail+' The job was stopped to free the model; check its local job.log and try a smaller installed checkpoint.';
 return detail;
}
