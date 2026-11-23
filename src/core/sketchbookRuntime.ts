import {streamChat} from './llm';
import type {ChatPictureRequest} from './imageGeneration';
import {
 readSketchbookIdea,sketchbookIdeaMessages,sketchbookImagePrompt,
 type SketchbookIdea,type SketchbookIdeaContext,
} from './sketchbookIdeas';

/** A normal Create-picture request, not a new generator or image job. */
export interface PreparedSketchbookDrawing {
 idea:SketchbookIdea;
 pictureRequest:ChatPictureRequest;
}

export interface SketchbookModelSession {
 port:number;
 context:SketchbookIdeaContext;
 signal:AbortSignal;
}

const MAX_IDEA_TEXT=6500;

/**
 * Use Mana's existing local llama.cpp chat connection to choose her drawing.
 *
 * Caller must own the existing busy/resource gate and due-slot reservation.
 * On success, hand pictureRequest to the existing ImageGenerationDrawer (with
 * its normal GPU lease, cancellation, model discovery and result handling).
 *
 * This function never launches image generation, downloads anything, changes
 * chat history, or claims that a drawing has already been saved.
 */
export async function prepareSketchbookDrawing({
 port,context,signal,
}:SketchbookModelSession):Promise<PreparedSketchbookDrawing> {
 if(!Number.isSafeInteger(port)||port<1024||port>65535)
  throw Error('Mana needs a valid local chat-model port to imagine a drawing.');
 if(signal.aborted)throw Error('Sketchbook idea cancelled.');
 const controller=new AbortController();
 const abort=()=>controller.abort();
 signal.addEventListener('abort',abort,{once:true});
 let text='',tooLong=false;
 try {
  await streamChat({
   port,
   temperature:.8,
   maxTokens:550,
   rejectTruncated:true,
   signal:controller.signal,
   messages:sketchbookIdeaMessages(context),
   onToken:token=>{
    if(controller.signal.aborted)return;
    text+=token;
    if(text.length>MAX_IDEA_TEXT){
     tooLong=true;
     controller.abort();
    }
   },
  });
  if(signal.aborted)throw Error('Sketchbook idea cancelled.');
  if(tooLong)throw Error('Mana returned an oversized drawing idea. No image was generated.');
  const approvedIds=(context.approvedMemories??[]).slice(0,3).map(memory=>memory.id);
  const idea=readSketchbookIdea(text,approvedIds);
  // Normal unreferenced Create-picture request: ImageGenerationDrawer discovers
  // the installed checkpoint and uses imageSession / image_generation_start.
  const pictureRequest:ChatPictureRequest={prompt:sketchbookImagePrompt(idea)};
  return {idea,pictureRequest};
 }catch(error){
  if(signal.aborted)throw Error('Sketchbook idea cancelled.');
  if(tooLong)throw Error('Mana returned an oversized drawing idea. No image was generated.');
  throw error;
 }finally{
  signal.removeEventListener('abort',abort);
 }
}
