import type {TownWeather,TownWeatherSettings} from './townWeather';

export function weatherSoundMix(weather:Pick<TownWeather,'kind'|'intensity'>,settings:Pick<TownWeatherSettings,'audio'|'volume'>,indoors:boolean){
 const steady=weather.intensity==='steady';
 const rain=weather.kind==='rain'?(steady ? .22 : .14):0;
 const wind=weather.kind==='breeze'?(steady ? .19 : .11):weather.kind==='snow'?(steady ? .09 : .025):weather.kind==='rain' ? .035 : 0;
 const volume=typeof settings.volume==='number'&&Number.isFinite(settings.volume)?Math.max(0,Math.min(1,settings.volume)):.25;
 return {rain,wind,master:settings.audio===false?0:volume*(indoors ? .22 : 1),cutoff:indoors?900:14000};
}

// Noise is generated locally once. No audio files, requests, or timers are
// needed to sustain playback; Web Audio supplies the gust modulation.
export function createWeatherAmbience(context:AudioContext){
 const noise=context.createBuffer(1,context.sampleRate*4,context.sampleRate);
 const samples=noise.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 const rainSource=context.createBufferSource(),windSource=context.createBufferSource();
 rainSource.buffer=noise;rainSource.loop=true;windSource.buffer=noise;windSource.loop=true;
 const rainFilter=context.createBiquadFilter();rainFilter.type='highpass';rainFilter.frequency.value=650;rainFilter.Q.value=.4;
 const windFilter=context.createBiquadFilter();windFilter.type='lowpass';windFilter.frequency.value=480;windFilter.Q.value=.5;
 const rain=context.createGain(),wind=context.createGain(),gust=context.createGain(),master=context.createGain();
 rain.gain.value=0;wind.gain.value=0;gust.gain.value=.8;master.gain.value=0;
 const roomFilter=context.createBiquadFilter();roomFilter.type='lowpass';roomFilter.frequency.value=14000;roomFilter.Q.value=.3;
 const lfo=context.createOscillator(),depth=context.createGain();lfo.frequency.value=.085;depth.gain.value=.18;
 rainSource.connect(rainFilter).connect(rain).connect(roomFilter);
 windSource.connect(windFilter).connect(wind).connect(gust).connect(roomFilter);
 lfo.connect(depth).connect(gust.gain);roomFilter.connect(master).connect(context.destination);
 rainSource.start();windSource.start(0,1.73);lfo.start();
 let disposed=false;
 const nodes=[rainSource,windSource,rainFilter,windFilter,rain,wind,gust,master,roomFilter,lfo,depth];
 function target(parameter:AudioParam,value:number,time=.45){
  parameter.cancelScheduledValues(context.currentTime);
  parameter.setTargetAtTime(value,context.currentTime,time);
 }
 return {
  update(weather:Pick<TownWeather,'kind'|'intensity'>,settings:Pick<TownWeatherSettings,'audio'|'volume'>,indoors:boolean){
   if(disposed)return;
   const mix=weatherSoundMix(weather,settings,indoors);
   target(rain.gain,mix.rain);target(wind.gain,mix.wind);target(roomFilter.frequency,mix.cutoff);
   target(master.gain,mix.master,settings.audio===false ? .06 : .35);
  },
  async resume(){if(!disposed&&context.state!=='closed')await context.resume();},
  async suspend(){if(!disposed&&context.state==='running')await context.suspend();},
  async dispose(){
   if(disposed)return;disposed=true;
   rainSource.stop();windSource.stop();lfo.stop();
   for(const node of nodes)node.disconnect();
   if(context.state!=='closed')await context.close();
  },
 };
}
