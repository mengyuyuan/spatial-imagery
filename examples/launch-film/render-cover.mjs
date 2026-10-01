import {bundle} from '@remotion/bundler';import {selectComposition,renderStill} from '@remotion/renderer';
import {fileURLToPath} from 'node:url';import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));process.env.TEMP=process.env.TMP=path.join(root,'build/kinetic/temp');
const serveUrl=await bundle({entryPoint:path.join(root,'src/kinetic-cover.tsx'),outDir:path.join(root,'build/kinetic/cover-bundle'),publicDir:path.join(root,'public')});
const composition=await selectComposition({serveUrl,id:'Kinetic-Cover'});
await renderStill({serveUrl,composition,frame:0,output:path.resolve(root,'../../media/kinetic-v2-cover-4x3.png')});
