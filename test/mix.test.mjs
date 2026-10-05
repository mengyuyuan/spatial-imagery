// Offline PCM regression signals only; these are not production sound assets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

test('actual mixer preserves gain by default and applies only requested narration ducking',async()=>{
 const ffmpeg=process.env.FFMPEG_BIN??'ffmpeg',available=spawnSync(ffmpeg,['-version'],{encoding:'utf8'});
 assert.equal(available.status,0,'FFmpeg is required for the PCM integration test');
 const root=await mkdtemp(join(tmpdir(),'si-pcm-'));
 try{
  await mkdir(join(root,'src/sdk'),{recursive:true});await mkdir(join(root,'build'));await mkdir(join(root,'public'));
  for(const file of ['audio.js','motion.js'])await copyFile(new URL('../dist/'+file,import.meta.url),join(root,'src/sdk',file));
  await copyFile(new URL('../templates/production/mix.mjs',import.meta.url),join(root,'mix.mjs'));
  await writeFile(join(root,'package.json'),'{"type":"module"}');
  for(const [name,source] of [['tone','aevalsrc=0.1*sin(2*PI*440*t)|0.05*sin(2*PI*660*t):s=48000:d=2'],['silent','anullsrc=r=48000:cl=stereo']]){
   const r=spawnSync(ffmpeg,['-v','error','-y','-f','lavfi','-i',source,'-t','2','-c:a','pcm_s16le',join(root,'public',name+'.wav')]);assert.equal(r.status,0,r.stderr?.toString());
  }
  const {mix}=await import(pathToFileURL(join(root,'mix.mjs')).href);
  const cue={start:0,end:2,sourceIn:0,fadeIn:0,fadeOut:0,gainDb:0};
  const d={fps:30,durationInFrames:60,cues:[{...cue,id:'music',asset:'tone',role:'music'},{...cue,id:'speech',asset:'silent',role:'narration',start:.5,end:1.5}]};
  const assets=['tone','silent'].map(id=>({id,local:id+'.wav'}));
  const normal=await mix(root,d,assets);assert.equal(normal.masterGain,1);assert.equal(normal.policy.normalization,'preserve');
  const pcm=await readFile(join(root,'public/mix.wav'));
  const rms=(b,a,z)=>{let sum=0,n=0;for(let i=Math.round(a*48000);i<Math.round(z*48000);i++){sum+=(b.readInt16LE(44+i*4)/32768)**2;n++;}return Math.sqrt(sum/n);};
  assert(Math.abs(rms(pcm,.75,1.25)-.1/Math.sqrt(2))<.0001);
  d.mix={ducking:{amount:.4,attack:.1,release:.1}};
  await mix(root,d,assets);const ducked=await readFile(join(root,'public/mix.wav'));
  assert(Math.abs(rms(ducked,.75,1.25)/rms(pcm,.75,1.25)-.6)<.001);
  assert(Math.abs(rms(ducked,.1,.3)/rms(pcm,.1,.3)-1)<.001);
 }finally{await rm(root,{recursive:true,force:true});}
});
