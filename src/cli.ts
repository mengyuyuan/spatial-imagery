#!/usr/bin/env node
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePlan, searchAssets, type Plan} from './index.js';
import {auditAssets,auditMedia,probeMedia} from './node.js';
const [command, ...args] = process.argv.slice(2);
const usage = '空间意象 / Spatial Imagery\n  spatial-imagery init <directory>\n  spatial-imagery check <storyboard.json>\n  spatial-imagery catalog <storyboard.json> [query]\n  spatial-imagery audit <storyboard.json>\n  spatial-imagery media <video> <fps> <frames>\n';
try {
  if(command==='init') {
    if(args.length!==1) throw new Error(usage);
    const dir=resolve(args[0]!); await mkdir(dir,{recursive:true});
    const template=await readFile(fileURLToPath(new URL('../templates/storyboard.json',import.meta.url)),'utf8');
    await writeFile(join(dir,'storyboard.json'),template,{flag:'wx'});
    console.log(`Created ${join(dir,'storyboard.json')}`);
  } else if(command==='media'){
    if(args.length!==3)throw new Error(usage);
    const probe=await probeMedia(args[0]!);const issues=auditMedia(probe,{fps:Number(args[1]),frames:Number(args[2]),audio:true});
    console.log(JSON.stringify({valid:issues.length===0,issues,probe},null,2));if(issues.length)process.exitCode=1;
  } else if(command==='check'||command==='catalog'||command==='audit') {
    if(!args[0])throw new Error(usage);
    const plan:unknown=JSON.parse(await readFile(resolve(args[0]),'utf8'));
    const issues=validatePlan(plan);
    if(command==='check')console.log(JSON.stringify({valid:!issues.some(i=>i.severity==='error'),issues},null,2));
    if(issues.some(i=>i.severity==='error')) {process.exitCode=1; if(command!=='check')throw new Error('Invalid storyboard; run check first');}
    else if(command==='catalog')console.log(JSON.stringify(searchAssets((plan as Plan).assets,args.slice(1).join(' ')),null,2));
    else if(command==='audit'){const results=await auditAssets(plan as Plan,dirname(resolve(args[0])));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.status==='error'))process.exitCode=1;}
  } else if(!command||command==='--help'||command==='-h') console.log(usage);
  else throw new Error(usage);
} catch(error) {console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
