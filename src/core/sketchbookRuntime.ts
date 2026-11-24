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
 let tooLong=false;
 try {
  const approvedIds=(context.approvedMemories??[]).slice(0,3).map(memory=>memory.id);
  // One bounded correction attempt handles a small local model that returns
  // incomplete JSON. This does not spend another scheduled slot or start an image.
  for(let attempt=0;attempt<2;attempt++){
   let text='';
   const messages=sketchbookIdeaMessages(context);
   if(attempt===1)messages.push({
    role:'user',
    content:'The previous drawing idea could not be used. Please respond with ONLY a complete JSON object containing title, concept, prompt, inspiration, relatedMemoryIds. Example: {"title":"Cloud garden","concept":"An imagined flower garden on a cloud","prompt":"A tiny floating garden, lavender flowers, morning sky, soft colored pencil","inspiration":"imagination","relatedMemoryIds":[]}. You may create a different original idea. Use imagination unless an approved memory is listed; no commentary or code fences.',
   });
   await streamChat({
    port,
    temperature:attempt===0?.8:.35,
    maxTokens:attempt===0?550:650,
    rejectTruncated:true,
    signal:controller.signal,
    messages,
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
   try{
    const idea=readSketchbookIdea(text,approvedIds);
    // Same installed image models and native job system as user-created pictures.
    return {idea,pictureRequest:{prompt:sketchbookImagePrompt(idea)}};
   }catch(error){
    if(attempt===1)throw error;
    // The initial response was syntactically complete but did not meet the
    // bounded image-idea schema. Ask once more rather than generating bad art.
   }
  }
  throw Error('Mana could not prepare a complete drawing idea. No image was generated.');
 }catch(error){
  if(signal.aborted)throw Error('Sketchbook idea cancelled.');
  if(tooLong)throw Error('Mana returned an oversized drawing idea. No image was generated.');
  throw error;
 }finally{
  signal.removeEventListener('abort',abort);
 }
}
