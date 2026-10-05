import {clamp, smooth, progress} from './motion.js';
export interface SoundCue {
  id: string; asset: string; start: number; end: number; sourceIn: number;
  fadeIn: number; fadeOut: number; gainDb: number; pan?: readonly [number, number];
  /** Optional normalized intensity. Pure function of global time; never a synthesis source. */
  intensity?: (time: number) => number;
}
export const dbToGain = (db: number): number => 10 ** (db / 20);
export function validateCue(cue: SoundCue): void {
  if (![cue.start,cue.end,cue.sourceIn,cue.fadeIn,cue.fadeOut,cue.gainDb].every(Number.isFinite) || cue.start < 0 || cue.end <= cue.start || cue.sourceIn < 0 || cue.fadeIn < 0 || cue.fadeOut < 0 || cue.fadeIn+cue.fadeOut > cue.end-cue.start || (cue.pan && (cue.pan.length !== 2 || cue.pan.some(p => !Number.isFinite(p) || Math.abs(p)>1)))) throw new RangeError('Invalid sound cue');
}
/** Equal-power stereo panning. Source audio remains external; no generated noise bed. */
export function sampleCue(cue: SoundCue, time: number) {
  validateCue(cue);
  if (!Number.isFinite(time)) throw new RangeError('Finite time required');
  const active = time >= cue.start && time < cue.end;
  const fadeIn = cue.fadeIn ? smooth((time-cue.start)/cue.fadeIn) : 1;
  const fadeOut = cue.fadeOut ? smooth((cue.end-time)/cue.fadeOut) : 1;
  const intensity = cue.intensity?.(time) ?? 1;
  if (!Number.isFinite(intensity)) throw new RangeError('Non-finite intensity');
  const gain = active ? dbToGain(cue.gainDb) * fadeIn * fadeOut * clamp(intensity) : 0;
  const p = cue.pan ?? [0,0], pan = p[0]+(p[1]-p[0])*clamp((time-cue.start)/(cue.end-cue.start));
  return {active, gain, pan, left: gain*Math.cos((pan+1)*Math.PI/4), right:gain*Math.sin((pan+1)*Math.PI/4), sourceTime: cue.sourceIn+clamp(time-cue.start,0,cue.end-cue.start)};
}
/** Equal-power material weights; correlated recordings may need different curves. */
export function crossfade(time: number, start: number, end: number): readonly [number, number] {
  const u = smooth(progress(time,start,end));
  return [Math.cos(u*Math.PI/2), Math.sin(u*Math.PI/2)];
}
/** Audible anchor minus source-local anchor; sourceIn handles a trimmed file. */
export function alignSound(actionTime: number, sourceAnchor: number, sourceIn = 0): number {
  if (![actionTime,sourceAnchor,sourceIn].every(Number.isFinite) || sourceIn < 0 || sourceAnchor < sourceIn) throw new RangeError('Invalid source anchor');
  return actionTime - (sourceAnchor-sourceIn);
}
/** Sampling uses seconds at audio rate, independent of the video frame rate. */
export function gainEnvelope(cue: SoundCue, sampleRate: number, start: number, count: number): Float32Array {
  validateCue(cue);
  if (!Number.isInteger(sampleRate) || sampleRate < 1 || !Number.isFinite(start) || !Number.isSafeInteger(count) || count < 0 || count > 100_000_000) throw new RangeError('Invalid envelope sampling');
  const out = new Float32Array(count);
  for (let i=0;i<count;i++) out[i]=sampleCue(cue,start+i/sampleRate).gain;
  return out;
}
export interface MixPolicy {
  normalization?:'preserve'|'loudness'; lufs?:number; truePeakDb?:number;
  ducking?:{amount:number;attack:number;release:number};
}
export function resolveMixPolicy(value:unknown={}) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('mix: expected a policy object');
  const p=value as MixPolicy;
  if(Object.keys(p).some(k=>!['normalization','lufs','truePeakDb','ducking'].includes(k)))throw Error('mix: unsupported field');
  const normalization=p.normalization??(p.lufs!==undefined||p.truePeakDb!==undefined?'loudness':'preserve');
  if(!['preserve','loudness'].includes(normalization))throw Error('mix.normalization: choose preserve or loudness');
  for(const [key,min,max] of [['lufs',-36,-8],['truePeakDb',-9,-1]] as const){const n=p[key];if(n!==undefined&&(!Number.isFinite(n)||n<min||n>max))throw Error(`mix.${key}: expected ${min}..${max}`);}
  if(normalization==='preserve'&&(p.lufs!==undefined||p.truePeakDb!==undefined))throw Error('mix: preserve cannot specify normalization targets');
  if(normalization==='loudness'&&(p.lufs===undefined||p.truePeakDb===undefined))throw Error('mix: loudness requires explicit lufs and truePeakDb targets');
  const ducking=p.ducking??{amount:0,attack:.15,release:.3};
  if(!ducking||typeof ducking!=='object'||Object.keys(ducking).some(k=>!['amount','attack','release'].includes(k))||!Number.isFinite(ducking.amount)||ducking.amount<0||ducking.amount>1||!Number.isFinite(ducking.attack)||ducking.attack<0||!Number.isFinite(ducking.release)||ducking.release<0)throw Error('mix.ducking: finite amount 0..1 and nonnegative attack/release required');
  return {normalization,lufs:p.lufs,truePeakDb:p.truePeakDb,ducking};
}
