/** Optional Node-only file/media audit. The browser-safe core does not import this module. */
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import type {Plan} from './storyboard.js';
const exec=promisify(execFile);
export async function sha256File(file: string): Promise<string> {
  const hash=createHash('sha256');
  for await(const chunk of createReadStream(file))hash.update(chunk);
  return hash.digest('hex');
}
export interface FileAudit {id:string;status:'verified'|'reference'|'error';message:string}
/** Resolve symlinks and refuse reading an asset outside the explicit project root. */
export async function auditAssets(plan: Plan, projectRoot: string): Promise<FileAudit[]> {
  const root=await realpath(projectRoot),result:FileAudit[]=[];
  for(const a of plan.assets){
    if(a.availability==='reference'){result.push({id:a.id,status:'reference',message:'External reference, no local media asserted'});continue;}
    try{
      if(!a.local)throw new Error('Missing local path');
      const file=await realpath(resolve(root,a.local)),rel=relative(root,file);
      if(rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||isAbsolute(rel))throw new Error('Asset resolves outside the project root');
      const hash=await sha256File(file);
      if(hash!==a.sha256?.toLowerCase())throw new Error('SHA256 mismatch');
      result.push({id:a.id,status:'verified',message:'File hash verified; license and aesthetic review remain separate'});
    }catch(e){result.push({id:a.id,status:'error',message:e instanceof Error?e.message:String(e)});}
  }
  return result;
}
export interface MediaStream {codec_type:string;codec_name?:string;avg_frame_rate?:string;nb_read_frames?:string;duration?:string;width?:number;height?:number;sample_rate?:string;channels?:number}
export interface MediaProbe {streams:MediaStream[];format:{duration?:string}}
export async function probeMedia(file:string, ffprobe=process.env.FFPROBE_BIN??'ffprobe'):Promise<MediaProbe>{
  const {stdout}=await exec(ffprobe,['-v','error','-count_frames','-show_streams','-show_format','-of','json',resolve(file)],{maxBuffer:16*1024*1024});
  const p:MediaProbe=JSON.parse(stdout);
  if(!Array.isArray(p.streams)||!p.format)throw new Error('Malformed ffprobe response');
  return p;
}
export function auditMedia(probe:MediaProbe,expected:{fps:number;frames:number;audio?:boolean}):string[]{
  if(!Number.isFinite(expected.fps)||expected.fps<=0||!Number.isSafeInteger(expected.frames)||expected.frames<1)throw new RangeError('Invalid media expectation');
  const problems:string[]=[],v=probe.streams.find(s=>s.codec_type==='video'),a=probe.streams.find(s=>s.codec_type==='audio');
  if(!v)return ['Missing video stream'];
  const [num,den]=(v.avg_frame_rate??'0/1').split('/').map(Number);const fps=num!/(den??1);
  if(!Number.isFinite(fps)||Math.abs(fps-expected.fps)>.001)problems.push('Unexpected frame rate');
  if(Number(v.nb_read_frames)!==expected.frames)problems.push('Unexpected decoded frame count');
  const duration=expected.frames/expected.fps,tolerance=2/expected.fps;
  if(!Number.isFinite(Number(v.duration))||Math.abs(Number(v.duration)-duration)>tolerance)problems.push('Unexpected video-stream duration');
  if(expected.audio&&!a)problems.push('Missing audio stream');
  if(a&&(!Number.isFinite(Number(a.duration))||Math.abs(Number(a.duration)-duration)>tolerance))problems.push('Audio/video duration mismatch');
  return problems;
}
