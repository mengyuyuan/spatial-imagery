import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {sampleCue,smooth,clamp,length} from '../../dist/index.js';
import {subject} from './poses.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)), rate=48000, duration=30;
mkdirSync(path.join(root,'public'),{recursive:true});
// Every event uses an acquired recording/designed SFX. No oscillators or noise synthesis.
const cues=[
  {id:'SFX01',asset:'doorOpen_000.ogg',start:.45,end:2.3,sourceIn:0,fadeIn:.2,fadeOut:.5,gainDb:-22,pan:[-.2,.15],lowpass:2700},
  {id:'SFX02',asset:'impactSoft_medium_003.ogg',start:2.75,end:2.95,sourceIn:0,fadeIn:.004,fadeOut:.1,gainDb:-16,pan:[0,0],lowpass:8000},
  {id:'SFX03',asset:'engineCircular_001.ogg',start:3.5,end:11.35,sourceIn:.15,sourceOut:4.8,fadeIn:.9,fadeOut:1,gainDb:-20,pan:[-.1,.1],lowpass:2600,intensity:t=>clamp(.15+length(subject(t).velocity)/4.5)},
  {id:'SFX04',asset:'forceField_002.ogg',start:9.8,end:11.7,sourceIn:.04,fadeIn:.6,fadeOut:.45,gainDb:-24,pan:[.1,0],lowpass:2200},
  {id:'SFX05',asset:'impactSoft_heavy_001.ogg',start:11.05,end:11.7,sourceIn:0,fadeIn:.006,fadeOut:.4,gainDb:-13,pan:[0,0],lowpass:7000},
  {id:'SFX06',asset:'doorOpen_000.ogg',start:11.6,end:13.6,sourceIn:0,fadeIn:.18,fadeOut:.6,gainDb:-19,pan:[-.1,.2],lowpass:3000},
  {id:'SFX07',asset:'metal1.wav',start:13,end:13.8,sourceIn:0,fadeIn:.01,fadeOut:.5,gainDb:-24,pan:[.2,.2],lowpass:4000},
  {id:'SFX08',asset:'forceField_002.ogg',start:16,end:18.15,sourceIn:.03,fadeIn:.3,fadeOut:.6,gainDb:-22,pan:[.15,-.1],lowpass:2500,reverse:true},
  {id:'SFX09',asset:'impactSoft_heavy_001.ogg',start:17.75,end:18.5,sourceIn:0,fadeIn:.008,fadeOut:.45,gainDb:-14,pan:[0,0],lowpass:7000},
  {id:'SFX10',asset:'engineCircular_001.ogg',start:19.5,end:22.8,sourceIn:.5,sourceOut:3.5,fadeIn:.5,fadeOut:1.2,gainDb:-27,pan:[-.2,.2],lowpass:1500,reverse:true},
  {id:'SFX11',asset:'doorOpen_000.ogg',start:22.7,end:24.9,sourceIn:0,fadeIn:.25,fadeOut:.6,gainDb:-22,pan:[.2,0],lowpass:2400},
  {id:'SFX12',asset:'switch1.wav',start:25.25,end:25.7,sourceIn:0,fadeIn:.005,fadeOut:.22,gainDb:-24,pan:[0,0],lowpass:4500},
  {id:'SFX13',asset:'impactSoft_medium_003.ogg',start:26.3,end:26.75,sourceIn:0,fadeIn:.008,fadeOut:.3,gainDb:-20,pan:[0,0],lowpass:4500}
];
const mixed=new Float32Array(duration*rate*2), report=[];
for(const cue of cues){
  const input=path.join(root,'assets/audio',cue.asset);
  const probe=spawnSync('ffprobe',['-v','quiet','-show_format','-of','json',input],{encoding:'utf8'});
  if(probe.status!==0)throw new Error(`Cannot probe ${input}`);
  const srcDuration=Number(JSON.parse(probe.stdout).format.duration), end=cue.sourceOut??srcDuration;
  let tempo=(end-cue.sourceIn)/(cue.end-cue.start);const filters=[`atrim=start=${cue.sourceIn}:end=${end}`,'asetpts=PTS-STARTPTS'];
  if(cue.reverse)filters.push('areverse');
  while(tempo<.5){filters.push('atempo=0.5');tempo/=.5;}while(tempo>2){filters.push('atempo=2');tempo/=2;}filters.push(`atempo=${tempo}`,`highpass=f=100`,`lowpass=f=${cue.lowpass}`);
  const r=spawnSync('ffmpeg',['-v','error','-i',input,'-af',filters.join(','),'-ar',String(rate),'-ac','1','-f','f32le','pipe:1'],{maxBuffer:64*1024*1024});
  if(r.status!==0)throw new Error(r.stderr.toString());
  const samples=new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset,r.stdout.byteOffset+r.stdout.byteLength));
  let sum=0,max=0;for(const s of samples){sum+=s*s;max=Math.max(max,Math.abs(s));}const rms=Math.sqrt(sum/samples.length);
  // Whole selected event normalization. Never boost isolated silent tails.
  const normalize=Math.min(.15/Math.max(rms,1e-6),.85/Math.max(max,1e-6));
  const start=Math.round(cue.start*rate), n=Math.min(samples.length,Math.round((cue.end-cue.start)*rate));
  for(let i=0;i<n;i++){
    const g=sampleCue(cue,cue.start+i/rate), s=samples[i]*normalize*6;
    mixed[(start+i)*2]+=s*g.left;mixed[(start+i)*2+1]+=s*g.right;
  }
  report.push({...cue,intensity:cue.intensity?'SDK subject speed':'constant + fades',processing:filters,sourceRms:rms,normalization:normalize});
}
let peak=0;for(const s of mixed)peak=Math.max(peak,Math.abs(s));const master=peak>.78?.78/peak:1;
for(let i=0;i<mixed.length;i++)mixed[i]*=master;
const wav=Buffer.alloc(44+mixed.length*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(mixed.length*2,40);
for(let i=0;i<mixed.length;i++)wav.writeInt16LE(Math.round(clamp(mixed[i],-1,1)*32767),44+i*2);
writeFileSync(path.join(root,'public/mix.wav'),wav);writeFileSync(path.join(root,'build/audio-report.json'),JSON.stringify({sampleRate:rate,seconds:duration,peakBeforeMaster:peak,masterGain:master,cues:report,subjectiveListening:false},null,2));
console.log('Mixed 13 events / 7 CC0 sources at 48 kHz. Peak',20*Math.log10(peak*master),'dBFS');
