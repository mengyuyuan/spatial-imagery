import {requireDiagnosticMode,refuseExistingOutput} from './draft-only.mjs';
requireDiagnosticMode(process.argv.slice(2),'--stills');
const {bundle}=await import('@remotion/bundler');
const {selectComposition,renderMedia,renderStill}=await import('@remotion/renderer');
import {fileURLToPath} from 'node:url';import path from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const root=path.dirname(fileURLToPath(import.meta.url)),build=path.join(root,'build/kinetic');
mkdirSync(path.join(build,'temp'),{recursive:true});process.env.TEMP=process.env.TMP=path.join(build,'temp');
const output=path.join(build,'diagnostic');mkdirSync(output,{recursive:true});
if(!process.argv.includes('--stills'))refuseExistingOutput(path.join(output,'draft.mp4'));
const serveUrl=await bundle({entryPoint:path.join(root,'src/kinetic.tsx'),publicDir:path.join(root,'public'),outDir:path.join(build,'bundle')});
const options={serveUrl,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000,logLevel:'error'};
const composition=await selectComposition({...options,id:'Spatial-Imagery-Kinetic'});
const frameArg=process.argv.find(x=>x.startsWith('--frames='));
const stills=frameArg?frameArg.slice(9).split(',').map(Number):[28,82,142,218,311,367,423,479,536,592,649,705,760,803,861];
for(const frame of stills){await renderStill({...options,composition,frame,output:path.join(build,`frame-${frame}.png`)});console.log('Still',frame);}
if(!process.argv.includes('--stills')){
 await renderStill({...options,composition,frame:861,output:path.join(output,'kinetic-v2-poster.png')});
 await renderMedia({...options,composition,codec:'h264',outputLocation:path.join(output,'draft.mp4'),colorSpace:'bt709',imageFormat:'png',crf:18,x264Preset:'fast',concurrency:2,onProgress:p=>writeFileSync(path.join(build,'progress.json'),JSON.stringify({progress:p.progress,renderedFrames:p.renderedFrames}))});
 console.log('Diagnostic draft rendered; production gates and review remain pending:',path.join(output,'draft.mp4'));
}
