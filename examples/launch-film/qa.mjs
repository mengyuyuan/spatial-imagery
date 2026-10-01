import {probeMedia,auditMedia,sha256File,auditAssets} from '../../dist/node.js';
import {validatePlan} from '../../dist/index.js';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import path from 'node:path';
const v2=process.argv.includes('--v2'),filename=v2?'spatial-imagery-kinetic-v2.mp4':'spatial-imagery-launch.mp4';
const root=path.dirname(fileURLToPath(import.meta.url)),file=path.resolve(root,'../../media',filename);
const plan=JSON.parse(await readFile(path.join(root,v2?'storyboard-v2.json':'storyboard.json'),'utf8'));
const probe=await probeMedia(file),issues=auditMedia(probe,{fps:30,frames:900,audio:true});
// Keep public evidence portable; ffprobe otherwise records the producer's absolute path.
probe.format.filename='media/'+filename;
const video=probe.streams.find(s=>s.codec_type==='video');
if(video?.width!==1600||video?.height!==900)issues.push('Unexpected encoded dimensions');
if(validatePlan(plan).some(i=>i.severity==='error'))issues.push('Storyboard validation failed');
const decode=spawnSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{encoding:'utf8'});
if(decode.status!==0||decode.stderr.trim())issues.push('Decode error: '+decode.stderr);
const timing=spawnSync('ffprobe',['-v','quiet','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','json',file],{encoding:'utf8',maxBuffer:4*1024*1024});
if(timing.status!==0)throw new Error('Timestamp probe failed');
const pts=JSON.parse(timing.stdout).frames.map(f=>Number(f.best_effort_timestamp_time));
const monotonic=pts.length===900&&pts.every((p,i)=>Number.isFinite(p)&&(i===0||p>pts[i-1]));
if(!monotonic)issues.push('Non-monotonic or missing presentation timestamps');
const astats=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','astats=reset=0','-f','null','-'],{encoding:'utf8'});
const peaks=[...astats.stderr.matchAll(/Peak level dB:\s*(-?[\d.]+)/g)].map(m=>Number(m[1]));
const peakDbfs=peaks.length?Math.max(...peaks):null;
if(peakDbfs===null||peakDbfs>=0)issues.push('Missing peak analysis or possible audio clipping');
const assets=await auditAssets(plan,root);
if(assets.some(a=>a.status==='error'))issues.push('Source file audit failed');
const loudnessRun=spawnSync('ffmpeg',['-hide_banner','-i',file,'-vn','-af','loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json','-f','null','-'],{encoding:'utf8'});
const loudnessMatch=loudnessRun.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);
const loudness=loudnessMatch?JSON.parse(loudnessMatch[0]):null;
if(v2&&(!loudness||Number(loudness.input_tp)>=0))issues.push('Missing true-peak analysis or clipping');
const report={version:v2?'kinetic-v2':'0.1.0',file:'media/'+filename,sha256:await sha256File(file),
  intended:{fps:30,frames:900,seconds:30,width:1600,height:900},
  technical:{passed:issues.length===0,issues,probe,decode:decode.status===0,monotonicPresentationTimestamps:monotonic,audioPeakDbfs:peakDbfs,loudness,planIssues:validatePlan(plan),assets},
  review:{sampledVisualFrames:process.argv.includes('--visual-reviewed')?(v2?[28,82,142,218,295,311,330,367,423,479,536,592,649,705,760,803,861]:[60,195,420,675,735,840]):[],normalSpeedPlayback:false,subjectiveListening:false,userApproval:'not requested or asserted'},
  limits:['Technical validity is not an artistic verdict.','System fonts can differ across hosts.','Mixkit raw footage is fetched separately.','No physical relighting, matting, transcription or speech synthesis is demonstrated.']};
await writeFile(path.join(root,v2?'qa-v2.json':'qa.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:issues.length===0,issues,sha256:report.sha256,peakDbfs},null,2));if(issues.length)process.exitCode=1;
