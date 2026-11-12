import type { Vowel } from './avatar';
// Windows US-English visemes reduced to the five mouth images in Mana's avatar.
export function visemeMouth(viseme:number):Vowel|null {
  if(!Number.isInteger(viseme)||viseme<0||viseme>21||viseme===0||viseme===21)return null;
  if([1,2,9,11,12,20].includes(viseme))return 'a';
  if([3,8,10].includes(viseme))return 'o';
  if([7,13,16].includes(viseme))return 'u';
  if([6,15,17,19].includes(viseme))return 'i';
  return 'e';
}

export function playbackMouth(currentId:string,event:{playbackId:string;viseme:number}):Vowel|null|undefined {
  return currentId&&event.playbackId===currentId ? visemeMouth(event.viseme) : undefined;
}

/** Estimate mouth movement from the rendered speech. Text supplies approximate vowel shapes. */
export function speechMouthTrack(samples: Float32Array, sampleRate: number, text: string): (seconds: number) => Vowel | null {
  const frameSize = Math.max(1, Math.round(sampleRate * 0.02));
  const levels: number[] = [];
  for (let start = 0; start < samples.length; start += frameSize) {
    const end = Math.min(samples.length, start + frameSize);
    let energy = 0;
    for (let i = start; i < end; i++) energy += samples[i] * samples[i];
    levels.push(Math.sqrt(energy / (end - start)));
  }

  const ordered = levels.slice().sort((a, b) => a - b);
  const speechLevel = ordered[Math.floor(ordered.length * 0.9)] ?? 0;
  const threshold = Math.min(0.015, Math.max(0.003, speechLevel * 0.12));
  const active = levels.map(level => level >= threshold);
  const vowels = (text.toLowerCase().match(/[aeiou]/g) ?? ["a"]) as Vowel[];
  const activeCount = active.filter(Boolean).length;
  let spokenFrames = 0;
  const shapes = active.map(isActive => {
    if (!isActive) return null;
    return vowels[Math.floor(spokenFrames++ * vowels.length / activeCount)];
  });

  return seconds => {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds * sampleRate >= samples.length) return null;
    return shapes[Math.floor(seconds * sampleRate / frameSize)] ?? null;
  };
}
