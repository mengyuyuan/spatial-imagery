// A real consumer smoke test: install the tarball, import the public entry and invoke its bin.
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';import {join,resolve,dirname} from 'node:path';import {spawnSync} from 'node:child_process';
import {withContract} from './fixtures/design-contract.mjs';
const npmCli=process.env.npm_execpath??join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const render=process.argv.includes('--render');
const tarball=resolve(process.argv.slice(2).find(x=>!x.startsWith('--'))??`spatial-imagery-${version}.tgz`);
const dir=await mkdtemp(join(tmpdir(),'spatial-imagery-consumer-'));
function run(command,args,cwd=dir){const r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024,env:{...process.env,NODE_PATH:'',REMOTION_BROWSER_EXECUTABLE:''}});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr||r.stdout);return r.stdout;}
let passed=false;
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
  // Generate using only packed files, without a checkout, model, FFmpeg or private skill.
  const pkg=join(dir,'node_modules/spatial-imagery');
  const d=JSON.parse(await readFile(join(pkg,'templates/demo/design.json'),'utf8'));d.cues=[];for(const s of d.shots)s.assets=[];
  await writeFile(join(dir,'design.json'),JSON.stringify(withContract(d)));
  console.log(run(process.execPath,[join(pkg,'dist/cli.js'),'make',join(pkg,'templates/demo/script.md'),'--design','design.json','--config',join(pkg,'templates/demo/config.json'),'--out','editable']));
  for(const f of ['gate.mjs','verify_production_gates.py','production-gates.json','package-lock.json','PRODUCTION-GATES.md','design-instructions.md','planner-context.json','src/sdk/design-contract.js','src/sdk/staging.js','src/sdk/execution.js','src/sdk/design-table.js','verify_execution_evidence.py','EXECUTION-EVIDENCE.md'])assert((await readFile(join(dir,'editable',f))).length>0);
  const context=JSON.parse(await readFile(join(dir,'editable/planner-context.json'),'utf8'));
  assert.equal(context.standard,'3.26.0');assert.equal(context.source,'imported');assert.equal(context.sources.length,6);
  const blocked=spawnSync(process.execPath,[join(dir,'editable/render.mjs')],{encoding:'utf8'});assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/gate blocked/);
  const m=JSON.parse(await readFile(join(dir,'editable/production-gates.json'),'utf8'));assert.equal(m.shots[0].review.status,'unverified');
  assert.deepEqual(m.shots[0].intent,withContract(d).shots[0].intent);
  assert.equal(m.schemaVersion,4);assert.equal(m.videoType,'general');
  for(const name of ['animation','camera','soundfx'])assert.equal(m.specialistGates[name].applicable,true);
  assert.deepEqual(m.specialistGates.camera.targets,[...m.shots,...m.transitions].map(s=>s.id));
  if(render){
    console.log('Rendering from clean consumer at '+dir);
    console.log(run(process.execPath,[join(pkg,'dist/cli.js'),'demo','--out','demo','--install']));
    console.log(run(process.execPath,[npmCli,'run','browser:install'],join(dir,'demo')));
    console.log(run(process.execPath,[npmCli,'run','render:draft'],join(dir,'demo')));
    const qa=JSON.parse(await readFile(join(dir,'demo/output/draft-qa.json'),'utf8'));
    assert.equal(qa.technicalPassed,true);assert.equal(qa.frames,180);assert.equal(qa.fps,30);assert.equal(qa.width,640);assert.equal(qa.height,360);assert.equal(qa.audio.audio,true);assert.equal(qa.review.listening,'unverified');
    console.log(run(process.execPath,[join(pkg,'dist/cli.js'),'gates',join(dir,'demo'),'register-draft']));
    const delivery=spawnSync(process.execPath,[join(pkg,'dist/cli.js'),'gates',join(dir,'demo'),'delivery'],{encoding:'utf8'});assert.notEqual(delivery.status,0);
    console.log(JSON.stringify({consumer:dir,video:join(dir,'demo/output/draft.mp4'),sha256:qa.sha256,technicalPassed:true,review:qa.review}));
  }
  passed=true;
}finally{
  // Only this invocation's verified mkdtemp directory is removed; opt in to keep QA artifacts.
  if(passed&&!process.env.SI_KEEP_SMOKE)await rm(dir,{recursive:true,force:true});
  else console.log('Consumer artifacts retained: '+dir);
}
