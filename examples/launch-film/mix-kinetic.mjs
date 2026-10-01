import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';import path from 'node:path';
import {sampleCue,clamp,smooth} from '../../dist/index.js';
const root=path.dirname(fileURLToPath(import.meta.url)),rate=48000,duration=30,B=60/128;
const manifest=JSON.parse(readFileSync(path.join(root,'assets-v2.json'),'utf8'));
const assets=new Map(manifest.map(a=>[path.basename(a.path),a]));
const cues=[];
function cue(asset,beat,beats,db,pan=[0,0],extra={}){
 const d=beats*B;
 cues.push({id:`SFX${String(cues.length+1).padStart(2,'0')}`,asset,start:beat*B,end:(beat+beats)*B,sourceIn:0,fadeIn:Math.min(.08,d*.15),fadeOut:Math.min(.25,d*.4),gainDb:db,pan,lowpass:6500,...extra});
}
cue('impactSoft_heavy_001.ogg',0,1,-5);
cue('doorOpen_000.ogg',.2,2,-11,[-.5,.25],{fadeIn:.06,fadeOut:.18});
cue('switch1.wav',2.1,.45,-14);
cue('v2-whoosh-fast.wav',3.5,1.6,-9,[-.7,.65]);
cue('v2-whoosh-particle.wav',5.2,2.4,-13,[.3,-.4],{sourceIn:.1,sourceOut:1.3});
cue('impactGlass_light_001.ogg',8,.5,-11);
cue('v2-passby.wav',8.3,3.7,-12,[-.2,.35],{sourceIn:.7,sourceOut:2.8,fadeIn:.24,fadeOut:.36,lowpass:4500});
cue('v2-passby.wav',12,7.8,-10,[-.55,.55],{sourceIn:.3,sourceOut:4.5,fadeIn:.35,fadeOut:.5,lowpass:5000,intensity:t=>.35+.65*smooth((t-12*B)/1.8)});
cue('impactSoft_heavy_001.ogg',20,.85,-5);
cue('forceField_002.ogg',20.3,3.2,-13,[.2,-.1],{sourceIn:.04,fadeIn:.1,fadeOut:.3,lowpass:3700});
cue('v2-whoosh-fast.wav',23.7,1.4,-10,[-.6,.6]);
for(let i=0;i<4;i++)cue(i%2?'impactGlass_light_002.ogg':'impactGlass_light_001.ogg',24.5+i*.66,.6,-15+i*.6,[i*.22-.4,i*.22-.3],{fadeIn:.003,fadeOut:.12});
cue('doorOpen_000.ogg',28.1,1.2,-8,[-.6,.4]);
cue('metal1.wav',30.4,.75,-13);
cue('v2-whoosh-particle.wav',30.6,1.6,-12,[.5,-.4],{sourceIn:.1,sourceOut:1.1});
cue('impactGlass_heavy_000.ogg',32,.7,-12,[0,0],{fadeIn:.003});
cue('v2-whoosh-fast.wav',35.65,1.3,-13,[.4,-.3]);
cue('engineCircular_001.ogg',36.2,3.3,-20,[-.3,.3],{sourceIn:.8,sourceOut:2.5,fadeIn:.22,fadeOut:.35,lowpass:2300});
cue('doorOpen_000.ogg',40.2,1.8,-11,[-.5,.4]);
cue('impactSoft_medium_003.ogg',42,1,-7,[0,0],{fadeIn:.004,fadeOut:.27});
cue('v2-whoosh-particle.wav',43.6,2.4,-12,[-.3,.35],{sourceIn:0,sourceOut:1.45});
cue('v2-whoosh-fast.wav',47.1,1.8,-10,[.45,-.4]);
cue('doorOpen_000.ogg',48.2,2.4,-12,[-.25,.3]);
cue('impactGlass_light_002.ogg',51.5,.5,-13);
cue('v2-whoosh-fast.wav',51.7,1.3,-11,[-.5,.5]);
cue('switch1.wav',54.1,.6,-12);
cue('v2-whoosh-particle.wav',55.2,1.7,-11,[.4,-.4],{sourceIn:.1,sourceOut:1.4});
cue('impactSoft_heavy_001.ogg',60,1.5,-6,[0,0],{fadeOut:.5});

function decode(input,filters,channels=1){const r=spawnSync('ffmpeg',['-v','error','-i',input,'-af',filters.join(','),'-ar',String(rate),'-ac',String(channels),'-f','f32le','pipe:1'],{maxBuffer:80*1024*1024});if(r.status!==0)throw new Error(r.stderr.toString());return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset,r.stdout.byteOffset+r.stdout.byteLength));}
const mixed=new Float32Array(duration*rate*2);
const music=decode(path.join(root,'assets/stock/minimal-techno-162.mp3'),['atrim=start=18.5:end=48.5','asetpts=PTS-STARTPTS'],2);
let energy=0;for(const s of music)energy+=s*s;const musicRms=Math.sqrt(energy/music.length),musicGain=Math.min(1,.115/musicRms);
for(let i=0;i<Math.min(music.length,mixed.length);i++){const t=i/2/rate,fade=smooth(t/.035)*(1-smooth((t-28.8)/1.2));mixed[i]=music[i]*musicGain*fade;}
const report=[];
for(const c of cues){
 const asset=assets.get(c.asset),input=path.join(root,asset.path);
 const pr=spawnSync('ffprobe',['-v','quiet','-show_format','-of','json',input],{encoding:'utf8'});if(pr.status!==0)throw new Error('Probe failed');
 const out=c.sourceOut??Number(JSON.parse(pr.stdout).format.duration),filters=[`atrim=start=${c.sourceIn}:end=${out}`,'asetpts=PTS-STARTPTS'];
 let tempo=(out-c.sourceIn)/(c.end-c.start);while(tempo<.5){filters.push('atempo=0.5');tempo/=.5;}while(tempo>2){filters.push('atempo=2');tempo/=2;}filters.push(`atempo=${tempo}`,'highpass=f=100',`lowpass=f=${c.lowpass}`);
 const data=decode(input,filters);let sum=0,peak=0;for(const s of data){sum+=s*s;peak=Math.max(peak,Math.abs(s));}const rms=Math.sqrt(sum/data.length),norm=Math.min(.16/Math.max(rms,1e-6),.82/Math.max(peak,1e-6));
 const start=Math.round(c.start*rate),n=Math.min(data.length,Math.round((c.end-c.start)*rate),duration*rate-start);
 for(let i=0;i<n;i++){const g=sampleCue(c,c.start+i/rate),s=data[i]*norm*1.5;mixed[(start+i)*2]+=s*g.left;mixed[(start+i)*2+1]+=s*g.right;}
 report.push({...c,intensity:c.intensity?'authored acceleration envelope':'event envelope',sourceOut:out,sourceSha256:asset.sha256,filters,normalization:norm});
}
let peak=0;for(const s of mixed)peak=Math.max(peak,Math.abs(s));const master=Math.min(2,.80/Math.max(peak,1e-6));
const wav=Buffer.alloc(44+mixed.length*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(mixed.length*2,40);
for(let i=0;i<mixed.length;i++)wav.writeInt16LE(Math.round(clamp(mixed[i]*master,-1,1)*32767),44+i*2);
writeFileSync(path.join(root,'public/kinetic-mix.wav'),wav);
// The visualization uses measured frame-window RMS, not invented audio bars.
const frameEnergy=[];for(let f=0;f<900;f++){let sum=0;const from=f*rate/30*2,to=(f+1)*rate/30*2;for(let i=from;i<to;i++)sum+=music[i]*music[i];frameEnergy.push(Math.sqrt(sum/(to-from)));}
const sorted=[...frameEnergy].sort((a,b)=>a-b),reference=sorted[Math.floor(sorted.length*.95)];
writeFileSync(path.join(root,'src/kinetic/energy.json'),JSON.stringify(frameEnergy.map(v=>Number(clamp(v/reference).toFixed(4)))));
writeFileSync(path.join(root,'sound-v2.json'),JSON.stringify({bpm:128,beatSeconds:B,music:{asset:'music:162',sourceSeconds:[18.5,48.5],gain:musicGain,fadeIn:.035,fadeOut:1.2,beatAnalysis:'approximate 128 BPM grid fitted to automatically detected stable beats; not listening approval'},peakBeforeMaster:peak,masterGain:master,peakDbfs:20*Math.log10(peak*master),cues:report,subjectiveListening:false},null,2));
console.log(JSON.stringify({events:report.length,peakDbfs:20*Math.log10(peak*master),musicGain}));
