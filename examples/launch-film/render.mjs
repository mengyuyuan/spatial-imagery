import {requireDiagnosticMode,refuseExistingOutput} from './draft-only.mjs';
requireDiagnosticMode(process.argv.slice(2),'--layout-check');
const {bundle}=await import('@remotion/bundler');
const {selectComposition,renderMedia,renderStill}=await import('@remotion/renderer');
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const root=path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(root,'build/temp'),{recursive:true});
process.env.TEMP=process.env.TMP=path.join(root,'build/temp');
const output=path.join(root,'build/diagnostic');mkdirSync(output,{recursive:true});
if(!process.argv.includes('--layout-check'))refuseExistingOutput(path.join(output,'draft.mp4'));
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.tsx'),publicDir:path.join(root,'public'),outDir:path.join(root,'build/bundle')});
const options={serveUrl,chromiumOptions:{gl:'angle'},timeoutInMilliseconds:120000,logLevel:'error'};
const composition=await selectComposition({...options,id:'Spatial-Imagery-Launch'});
const layoutCheck=process.argv.includes('--layout-check');
for(const frame of layoutCheck?[675,735,840]:[60,195,420,675,735,840])await renderStill({...options,composition,frame,output:path.join(root,'build',`composed-${frame}.png`)});
await renderStill({...options,composition,frame:840,output:path.join(output,'poster.png')});
if(!layoutCheck){
  await renderMedia({...options,composition,codec:'h264',outputLocation:path.join(output,'draft.mp4'),colorSpace:'bt709',imageFormat:'png',crf:19,x264Preset:'fast',concurrency:2,onProgress:p=>writeFileSync(path.join(root,'build/composition-progress.json'),JSON.stringify({progress:p.progress,renderedFrames:p.renderedFrames}))});
  console.log('Diagnostic draft rendered; production gates and review remain pending:',path.join(output,'draft.mp4'));
}
