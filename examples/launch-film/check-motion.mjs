import {spawnSync} from 'node:child_process';import {writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const draft=process.argv.includes('--draft');
mkdirSync(path.join(root,draft?'build/kinetic/diagnostic':'build'),{recursive:true});
const result=spawnSync('ffmpeg',['-v','error','-i',draft?path.join(root,'build/kinetic/diagnostic/draft.mp4'):path.resolve(root,'../../media/spatial-imagery-kinetic-v2.mp4'),'-vf','fps=6,scale=320:180','-pix_fmt','rgb24','-f','rawvideo','pipe:1'],{maxBuffer:64*1024*1024});
if(result.status!==0)throw new Error(result.stderr.toString());
const bytesPerFrame=320*180*3,count=result.stdout.length/bytesPerFrame;if(count!==180)throw new Error(`Unexpected sample count ${count}`);
const differences=[];let exactDuplicates=0;for(let f=1;f<count;f++){let sum=0;for(let i=0;i<bytesPerFrame;i++)sum+=Math.abs(result.stdout[f*bytesPerFrame+i]-result.stdout[(f-1)*bytesPerFrame+i]);if(sum===0)exactDuplicates++;differences.push(Number((sum/bytesPerFrame).toFixed(3)));}
const report={sampleFps:6,sampleCount:count,intervalMeanAbsoluteDifferences:differences,exactDuplicates,normalSpeedPlayback:false,denseContactSheetVisualReview:process.argv.includes('--visual-reviewed'),note:'Decoded 6 fps contact sheets complement normal-speed playback. The brand lockup intentionally settles; numerical change is not artistic approval.'};
writeFileSync(path.join(root,draft?'build/kinetic/diagnostic/motion.json':'build/historical-motion-v2.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({count,exactDuplicates:report.exactDuplicates}));
