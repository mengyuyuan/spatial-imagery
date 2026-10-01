import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {sampleCue} from './src/sdk/audio.js';
import {track,linear,smooth} from './src/sdk/motion.js';

export async function mix(root,design,assets){
  if(!design.cues.length)return {audio:false};
  const rate=48000,frames=Math.round(design.durationInFrames/design.fps*rate),bytes=frames*2*4;
  if(bytes>512*1024*1024)throw Error('Audio mix needs more than 512 MiB. Render the film in shorter sections; no silent truncation is performed.');
  const bus=new Float32Array(frames*2),narration=design.cues.filter(c=>c.role==='narration');
  for(const cue of design.cues){
    const asset=assets.find(a=>a.id===cue.asset);
    const r=spawnSync(process.env.FFMPEG_BIN??'ffmpeg',['-v','error','-ss',String(cue.sourceIn),'-i',join(root,'public',asset.local),'-t',String(cue.end-cue.start),'-vn','-ar',String(rate),'-ac','2','-f','f32le','pipe:1'],{maxBuffer:bytes+1024*1024});
    if(r.error||r.status!==0)throw Error(`Audio decode failed for ${cue.id}: ${r.error?.message??r.stderr.toString()}`);
    const count=Math.min(Math.floor(r.stdout.length/8),Math.round((cue.end-cue.start)*rate));
    if(count<Math.round((cue.end-cue.start)*rate)-rate/design.fps*2)throw Error(`Audio source ended early: ${cue.id}`);
    const intensity=Array.isArray(cue.intensity)?track(cue.intensity.map(k=>({time:k.frame/design.fps,value:k.value,easing:k.easing==='linear'?linear:smooth}))):()=>cue.intensity??1;
    const event={...cue,intensity};
    for(let i=0;i<count;i++){
      const sample=Math.round(cue.start*rate)+i;if(sample>=frames)break;
      const time=cue.start+i/rate,s=sampleCue(event,time);
      let left=r.stdout.readFloatLE(i*8),right=r.stdout.readFloatLE(i*8+4);
      if(cue.role==='motion'||cue.role==='contact'){const mono=(left+right)*.5;left=mono*s.left;right=mono*s.right;}
      else{left*=s.gain;right*=s.gain;}
      let duck=1;
      if(cue.role!=='narration')for(const n of narration){const enter=smooth((time-n.start+.15)/.15),leave=smooth((n.end+.3-time)/.3);duck=Math.min(duck,1-.7*enter*leave);}
      bus[sample*2]+=left*duck;bus[sample*2+1]+=right*duck;
    }
  }
  let peak=0;for(const v of bus){if(!Number.isFinite(v))throw Error('Non-finite mixed audio');peak=Math.max(peak,Math.abs(v));}
  const headroom=10**(-2/20),gain=peak>headroom?headroom/peak:1;
  const data=Buffer.alloc(44+frames*4);data.write('RIFF');data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(2,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*4,28);data.writeUInt16LE(4,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(frames*4,40);
  for(let i=0;i<bus.length;i++)data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,bus[i]*gain))*32767),44+i*2);
  await mkdir(join(root,'public'),{recursive:true});const raw=join(root,'build/mix-input.wav');await writeFile(raw,data);
  const target=design.mix?.lufs??-16,tp=design.mix?.truePeakDb??-1.5,ffmpeg=process.env.FFMPEG_BIN??'ffmpeg';
  const analyze=spawnSync(ffmpeg,['-hide_banner','-i',raw,'-af',`loudnorm=I=${target}:TP=${tp}:LRA=11:print_format=json`,'-f','null','-'],{encoding:'utf8'});
  if(analyze.error||analyze.status!==0)throw Error('Loudness analysis failed');
  const measurements=JSON.parse(analyze.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/s)?.[0]??'null');
  if(!measurements||!Number.isFinite(Number(measurements.input_i)))throw Error('Audio is silent or loudness cannot be measured');
  const filter=`loudnorm=I=${target}:TP=${tp}:LRA=11:measured_I=${measurements.input_i}:measured_TP=${measurements.input_tp}:measured_LRA=${measurements.input_lra}:measured_thresh=${measurements.input_thresh}:offset=${measurements.target_offset}:linear=true:print_format=json`;
  const normalized=spawnSync(ffmpeg,['-hide_banner','-y','-i',raw,'-af',filter,'-ar',String(rate),'-c:a','pcm_s16le',join(root,'public/mix.wav')],{encoding:'utf8'});
  if(normalized.error||normalized.status!==0)throw Error('Loudness normalization failed');
  const final=JSON.parse(normalized.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/s)?.[0]??'null');
  const report={audio:true,sampleRate:rate,channels:2,samples:frames,cues:design.cues.length,preGainPeak:peak,masterGain:gain,preNormalizationPeakDb:peak?20*Math.log10(peak*gain):null,loudness:{targetLufs:target,targetTruePeakDb:tp,measured:final},subjectiveListening:'unverified',note:'Stereo music/narration preserved; movement/contact sources deliberately downmixed for equal-power panning. Whole-film two-pass normalization; no synthesized sound.'};
  await writeFile(join(root,'build/mix-report.json'),JSON.stringify(report,null,2));return report;
}
