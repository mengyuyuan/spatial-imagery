// A real consumer smoke test: install the tarball, import the public entry and invoke its bin.
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve,dirname} from 'node:path';import {spawnSync} from 'node:child_process';
const npmCli=process.env.npm_execpath??join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const tarball=resolve(process.argv[2]??`spatial-imagery-${version}.tgz`);
const dir=await mkdtemp(join(tmpdir(),'spatial-imagery-consumer-'));
function run(command,args,cwd=dir){const r=spawnSync(command,args,{cwd,encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr||r.stdout);return r.stdout;}
try{
  await writeFile(join(dir,'package.json'),JSON.stringify({private:true,type:'module'}));
  run(process.execPath,[npmCli,'install','--ignore-scripts','--no-audit','--no-fund',tarball]);
  await writeFile(join(dir,'consumer.mjs'),`import {motionPath,sampleCue,validatePlan,searchSamples} from 'spatial-imagery';\nconst p=motionPath([{time:0,position:[0,0,0]},{time:1,position:[1,2,3]}]);\nif(p(.5).position[0]!==.5)throw Error('Public import failed');\nconsole.log('Consumer import OK');`);
  console.log(run(process.execPath,['consumer.mjs']));
  console.log(run(process.execPath,['node_modules/spatial-imagery/dist/cli.js','init','film']));
  console.log(run(process.execPath,['node_modules/spatial-imagery/dist/cli.js','check','film/storyboard.json']));
  const planner=await readFile(join(dir,'node_modules/spatial-imagery/templates/production/planner.md'),'utf8');
  if(!planner.includes('FilmDesign'))throw Error('Production templates not packaged');
  await writeFile(join(dir,'production.mjs'),`import {requestJSON,makeFilm} from 'spatial-imagery/production'; if(typeof makeFilm!=='function'||typeof requestJSON!=='function')throw Error('Production exports missing');`);
  console.log(run(process.execPath,['production.mjs']));
}finally{await rm(dir,{recursive:true,force:true});}
