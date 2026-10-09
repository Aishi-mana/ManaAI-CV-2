/** Simple pause detection, not a learned voice activity detector. */
export class SpeechEndpoint{
 private noiseEnergy=0;private noiseMs=0;private elapsed=0;private voiced=0;private quiet=0;private heard=false;
 step(rms:number,durationMs:number):'wait'|'finish'|'silence'{const ms=Math.max(0,Math.min(500,durationMs));this.elapsed+=ms;const level=Number.isFinite(rms)?Math.max(0,rms):0;if(this.noiseMs<700){this.noiseEnergy+=level*ms;this.noiseMs+=ms;return 'wait';}const threshold=Math.max(0.012,this.noiseEnergy/Math.max(1,this.noiseMs)*2.5);if(level>=threshold){this.voiced+=ms;this.quiet=0;if(this.voiced>=300)this.heard=true;}else{this.quiet+=ms;if(!this.heard)this.voiced=0;}if(this.heard&&this.quiet>=1200)return 'finish';if(!this.heard&&this.elapsed>=8000)return 'silence';return 'wait';}
}

/** Sound captions alone must never become an automatically sent user message. */
export function hasSpokenWords(text:string):boolean{return /[a-z0-9]/i.test(text.replace(/\[[^\]]*\]|\([^)]*\)|[♪♫]/g,''));}
