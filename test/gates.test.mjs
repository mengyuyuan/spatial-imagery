import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,cp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {makeFilm,renderProject,gateProject} from '../dist/production-node.js';
import {pythonCommand} from '../dist/environment.js';
import {withContract} from './fixtures/design-contract.mjs';
import {designTable} from '../dist/design-table.js';

test('portable schema-v4 validator passes its synthetic regression suite',()=>{
  const p=pythonCommand(),r=spawnSync(p.bin,[...p.args,'-X','utf8','test/production_gates_test.py'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr||r.stdout);
});
test('requirement and entrypoint regressions reject stale identities and playback substitution',()=>{
  const p=pythonCommand(),r=spawnSync(p.bin,[...p.args,'-X','utf8','test/requirements_entrypoints_test.py'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr||r.stdout);
});
async function project(fn,complete=false){
  const root=await mkdtemp(join(tmpdir(),'si-gates-'));
  try{
    for(const name of ['script.md','config.json','design.json'])await cp(new URL(`../templates/demo/${name}`,import.meta.url),join(root,name));
    const design=JSON.parse(await readFile(join(root,'design.json'),'utf8'));design.cues=[];for(const s of design.shots)s.assets=[];
    await writeFile(join(root,'design.json'),JSON.stringify(complete?withContract(design):design));
    const out=join(root,'film');await makeFilm({script:join(root,'script.md'),design:join(root,'design.json'),config:join(root,'config.json'),out});
    const gate=await import(pathToFileURL(join(out,'gate.mjs')).href);await fn(out,gate);
  }finally{await rm(root,{recursive:true,force:true});}
}
test('fresh project cannot render production through either SDK or direct npm entry',()=>project(async(root,g)=>{
  const m=JSON.parse(await readFile(join(root,'production-gates.json'),'utf8'));
  assert.equal(m.videoType,'general');assert.equal(m.schemaVersion,4);
  for(const name of ['animation','camera','soundfx'])assert.equal(m.specialistGates[name].applicable,true);
  assert.deepEqual(m.specialistGates.camera.targets,[...m.shots,...m.transitions].map(s=>s.id));
  const r=await g.checkGates(root,'full-render');assert.equal(r.eligible,false);assert(r.errors.some(e=>e.code==='review_incomplete'));assert(r.errors.some(e=>e.code==='missing_baseline'));
  const direct=spawnSync(process.execPath,[join(root,'render.mjs')],{encoding:'utf8'});
  assert.notEqual(direct.status,0);assert.match(direct.stderr,/gate blocked/);assert.doesNotMatch(direct.stderr,/Cannot find package '@remotion/);
  await assert.rejects(g.runGate(root,'delivery').then(r=>{if(!r.eligible)throw Error('blocked');}),/blocked/);
  assert.equal(JSON.parse(await readFile(join(root,'delivery-status.json'),'utf8')).status,'blocked');
}));
test('draft entry checks current source identity and confines diagnostic output',()=>project(async(root,g)=>{
  const result=await g.requireEntry(root,'draft','qa/pipeline-review/test.mp4');
  assert.equal(result.completed,false);assert.equal(result.allowed,true);
  await assert.rejects(g.requireEntry(root,'draft','output/complete-review.mp4'),/draft_destination/);
  await writeFile(join(root,'src/index.tsx'),'// changed actual renderer');
  await assert.rejects(g.requireEntry(root,'draft','qa/pipeline-review/test.mp4'),/active_identity/);
},true));

test('design view edits invalidate evidence and refresh preserves them before regeneration',()=>project(async(root,g)=>{
 const table=join(root,'design-table.md'),original=await readFile(table,'utf8');
 await writeFile(table,original+'\nA manual design change that the renderer has not executed.\n');
 const hash=await g.hashFile(table),result=await g.checkGates(root,'design');
 assert(result.errors.some(e=>e.code==='design_view_drift'));assert(result.errors.some(e=>e.code==='project_changed'));
 await g.runGate(root,'refresh');
 assert((await readFile(join(root,'design-history',hash+'.md'),'utf8')).includes('manual design change'));
 assert.equal(await readFile(table,'utf8'),original);
 const m=JSON.parse(await readFile(join(root,'production-gates.json'),'utf8'));assert.equal(m.filmDesignReview.status,'unverified');assert.deepEqual(m.media,[]);
 assert(!(await g.checkGates(root,'design')).errors.some(e=>e.code==='design_view_drift'));
}));

test('custom measurement registration binds the encode and never signs playback approval',()=>project(async(root,g)=>{
 const path=join(root,'production-gates.json'),d=JSON.parse(await readFile(join(root,'design.json'),'utf8'));
 d.execution.renderer='custom';await writeFile(join(root,'design.json'),JSON.stringify(d));await g.runGate(root,'refresh');
 await mkdir(join(root,'output'));await mkdir(join(root,'qa/pipeline-review'),{recursive:true});await writeFile(join(root,'qa/pipeline-review/draft.mp4'),'Synthetic encode, not a video');
 const qa={technicalPassed:true,mode:'draft',fps:d.fps,frames:d.durationInFrames,inputs:await g.projectInputs(root),sha256:await g.hashFile(join(root,'qa/pipeline-review/draft.mp4')),audio:{audio:false}};
 await writeFile(join(root,'qa/pipeline-review/draft-qa.json'),JSON.stringify(qa));await g.runGate(root,'register-draft');
 const m=JSON.parse(await readFile(path,'utf8')),binding=(await g.checkGates(root,'design')).executionBinding;
 await writeFile(join(root,'qa/pipeline-review/draft-execution.json'),JSON.stringify({binding:'old',mediaSha256:qa.sha256}));
 await assert.rejects(g.runGate(root,'register-execution'),/binding\/video changed/);
 await writeFile(join(root,'qa/pipeline-review/draft-execution.json'),JSON.stringify({binding,mediaSha256:qa.sha256}));
 await g.runGate(root,'register-execution');
 const next=JSON.parse(await readFile(path,'utf8'));assert.equal(next.executionEvidence.length,1);assert.deepEqual(next.technicalReview.evidence,m.technicalReview.evidence);assert.equal(next.technicalReview.status,'passed');assert.equal(next.technicalReview.binding,(await g.checkGates(root,'design')).binding);assert.equal(next.shots[0].review.status,'unverified');
 const result=await g.checkGates(root,'full-render');assert.equal(result.eligible,false);assert(result.errors.some(e=>e.code==='execution_evidence_binding'));
},true));
test('project input binding detects source additions, rewrites and removed required roles',()=>project(async(root,g)=>{
  let r=await g.checkGates(root,'design');assert(!r.errors.some(e=>e.code==='project_changed'));
  await writeFile(join(root,'src/custom.ts'),'export const color = "blue";');
  r=await g.checkGates(root,'design');assert(r.errors.some(e=>e.code==='project_changed'));
  const path=join(root,'production-gates.json'),m=JSON.parse(await readFile(path,'utf8'));
  m.shots[0].review={status:'passed',observed:'Old observation',binding:'old'};await writeFile(path,JSON.stringify(m));
  await g.runGate(root,'refresh');
  const fresh=JSON.parse(await readFile(path,'utf8'));assert.equal(fresh.shots[0].review.status,'unverified');assert.deepEqual(fresh.media,[]);
  fresh.inputs=fresh.inputs.filter(i=>i.path!=='policy.json');await writeFile(path,JSON.stringify(fresh));
  assert((await g.checkGates(root,'design')).errors.some(e=>e.code==='project_changed'));
}));
test('an evidence manifest cannot narrow the current film scope or disable its real shot coverage',()=>project(async(root,g)=>{
  const path=join(root,'production-gates.json'),m=JSON.parse(await readFile(path,'utf8'));
  m.scope=[0,84];m.shots=m.shots.slice(0,1);await writeFile(path,JSON.stringify(m));
  const codes=(await g.checkGates(root,'design')).errors.map(e=>e.code);assert(codes.includes('project_scope'));assert(codes.includes('project_shots'));
}));
test('registering missing or edited media cannot create a technical pass',()=>project(async(root,g)=>{
  await assert.rejects(g.runGate(root,'register-draft'),/ENOENT/);
  assert.equal(JSON.parse(await readFile(join(root,'production-gates.json'),'utf8')).technicalReview.status,'unverified');
}));

test('current SDK refuses old project gate runners before they can approve production',()=>project(async(root)=>{
  const file=join(root,'production-gates.json'),m=JSON.parse(await readFile(file,'utf8'));m.schemaVersion=3;
  await writeFile(file,JSON.stringify(m));
  await writeFile(join(root,'gate.mjs'),"console.log('OLD_RUNNER_MUST_NOT_RUN');");
  await assert.rejects(renderProject(root),/requires a schema-4 project/);
  await assert.rejects(gateProject(root,'delivery'),/requires a schema-4 project/);
  m.schemaVersion=4;delete m.executionContractVersion;await writeFile(file,JSON.stringify(m));
  await assert.rejects(gateProject(root,'delivery'),/execution contract 1/);
}));

test('evidence cannot relabel general design as talking-head to sneak through A/B',()=>project(async(root,g)=>{
  const file=join(root,'production-gates.json'),m=JSON.parse(await readFile(file,'utf8'));
  m.videoType='talking-head';m.shots[0].state='A';await writeFile(file,JSON.stringify(m));
  const codes=(await g.checkGates(root,'design')).errors.map(e=>e.code);
  assert(codes.includes('project_scope'));assert(codes.includes('project_shots'));
}));
test('complete synthetic project contract passes, but changed source and draft-as-final fail',()=>project(async(root,g)=>{
  // Deliberately synthetic byte fixtures. These test record validation, never real film approval.
  const path=join(root,'production-gates.json'),m=JSON.parse(await readFile(path,'utf8'));
  const ref=async(path)=>({path,sha256:await g.hashFile(join(root,path))});
  await mkdir(join(root,'output'));
  await writeFile(join(root,'reference.fixture'),'synthetic reference, not a video');
  await writeFile(join(root,'output/final.mp4'),'synthetic media bytes, not a video');
  await writeFile(join(root,'assets-review.fixture'),'synthetic asset review');
  m.baselines=[{id:'fixture',role:'primary',...await ref('reference.fixture'),frames:180,fps:30,range:[0,180],mechanism:'Assemble the same pieces',adaptation:'Test record only',approvalScope:'Unapproved synthetic fixture'}];
  m.audioReason='Silent synthetic fixture';m.openIssues=[];
  const observed='Synthetic contract observation; not real viewing or listening';
  const review=(range)=>({status:'passed',method:'normal_speed',media:'final',range,frames:[range[0],Math.floor((range[0]+range[1])/2),range[1]-1],observed,intentChecks:Object.fromEntries(['meaning','specificity','subject','timing','landing'].map(k=>[k,{status:'passed',observed}]))});
  for(const s of m.shots){
    s.implementation=['src/index.tsx:1'];
    s.review=review([s.from,s.to]);
  }
  for(const t of m.transitions){
    t.implementation=['src/index.tsx:1'];t.review=review(t.range);
  }
  const qa={technicalPassed:true,mode:'production',fps:30,frames:180,inputs:await g.projectInputs(root),sha256:(await ref('output/final.mp4')).sha256,audio:{audio:false}};
  await writeFile(join(root,'output/qa.json'),JSON.stringify(qa));
  m.media=[{id:'final',role:'final',...await ref('output/final.mp4'),from:0,to:180,qa:'output/qa.json'}];
  m.assetsReview={status:'passed',observed,evidence:await ref('assets-review.fixture')};
  m.technicalReview={status:'passed',method:'technical',media:'final',range:[0,180],observed,evidence:await ref('output/qa.json')};
  m.soundReview={status:'passed',method:'silence_review',media:'final',range:[0,180],observed,evidence:await ref('assets-review.fixture')};m.sequenceReview=review([0,180]);
  const py=pythonCommand();
  const definitions=spawnSync(py.bin,[...py.args,'-B','-c','import json,sys; sys.path.insert(0,sys.argv[1]); from verify_production_gates import SPECIALIST_CHECKS; print(json.dumps(SPECIALIST_CHECKS))',root],{encoding:'utf8'});
  assert.equal(definitions.status,0,definitions.stderr);const criteria=JSON.parse(definitions.stdout);
  m.filmDesignReview={status:'passed',method:'design_review',observed,range:[0,180],evidence:await ref('assets-review.fixture'),checks:Object.fromEntries(['not_slide_deck','content_swap_test','middle_end_coverage','subject_camera_progression','motivated_reading_holds'].map(k=>[k,{status:'passed',observed}]))};
  m.specialistGates={};
  for(const [name,keys] of Object.entries(criteria)){
    const silent=name==='denoise',rows=name==='handoff'?m.transitions:name==='camera'?[...m.shots,...m.transitions]:m.shots;
    const requiredKeys=name==='soundfx'?['intentional_silence','no_missing_audio','transition_intent','output_silence']:keys;
    m.specialistGates[name]={applicable:!silent,reason:'Synthetic source decision',plan:'Synthetic production plan',targets:silent?[]:rows.map(r=>r.id),reviews:silent?[{status:'not_applicable',method:'source_inspection',observed,evidence:await ref('assets-review.fixture')}]:await Promise.all(rows.map(async row=>{
      const extent=row.range??[row.from,row.to];
      return {...review(extent),target:row.id,method:name==='design'?'design_review':name==='soundfx'?'silence_review':'normal_speed',evidence:await ref('assets-review.fixture'),checks:Object.fromEntries(requiredKeys.map(k=>[k,{status:'passed',observed}])),comparison:{before:await ref('reference.fixture'),after:await ref('output/final.mp4'),alignment:'Synthetic same-time comparison'}};
    }))};
  }
  const design=JSON.parse(await readFile(join(root,'design.json'),'utf8'));
  design.gatePlans=Object.fromEntries(Object.entries(m.specialistGates).map(([k,{reviews,...plan}])=>[k,plan]));
  await writeFile(join(root,'design.json'),JSON.stringify(design));
  await writeFile(join(root,'design-table.md'),designTable(design,await readFile(join(root,'script.md'),'utf8')));
  m.inputs=await g.projectInputs(root);qa.inputs=m.inputs;
  await writeFile(join(root,'output/qa.json'),JSON.stringify(qa));m.technicalReview.evidence=await ref('output/qa.json');
  await writeFile(path,JSON.stringify(m));
  const result=await g.checkGates(root,'design'),binding=result.binding;
  for(const row of [...m.shots,...m.transitions])row.review.binding=binding;
  for(const k of ['assetsReview','soundReview','technicalReview','sequenceReview'])m[k].binding=binding;
  m.filmDesignReview.binding=result.designBinding;
  for(const [name,gate] of Object.entries(m.specialistGates))for(const r of gate.reviews)r.binding=name==='design'||!gate.applicable?result.designBinding:binding;
  await writeFile(path,JSON.stringify(m));
  for(const stage of ['design','full-render','delivery']){const r=await g.checkGates(root,stage);assert.equal(r.eligible,true,JSON.stringify(r.errors));}
  // An otherwise complete contract must still stop before any expensive renderer loads.
  for(const name of ['animation','camera','soundfx']){
    const gate=m.specialistGates[name],saved=structuredClone(gate.reviews);
    gate.reviews=[];await writeFile(path,JSON.stringify(m));
    await assert.rejects(g.requireGate(root,'full-render'),/specialist_review_missing/);
    await assert.rejects(renderProject(root),/Production subprocess exited/);
    const direct=spawnSync(process.execPath,[join(root,'render.mjs')],{encoding:'utf8'});
    assert.notEqual(direct.status,0);assert.match(direct.stderr,/specialist_review_missing/);
    assert.equal((await g.checkGates(root,'delivery')).eligible,false);
    gate.reviews=saved;
  }
  await writeFile(path,JSON.stringify(m));
  await g.runGate(root,'register-final');
  assert.equal((await g.checkGates(root,'design')).eligible,true,'New media must preserve valid unchanged G1 critiques');
  assert.equal((await g.checkGates(root,'delivery')).eligible,false,'New media must clear old playback reviews');
  await writeFile(path,JSON.stringify(m));
  qa.mode='draft';await writeFile(join(root,'output/qa.json'),JSON.stringify(qa));
  assert((await g.checkGates(root,'delivery')).errors.some(e=>e.code==='media_qa'));
  await writeFile(join(root,'src/new-shape.ts'),'export const changed = true;');
  assert((await g.checkGates(root,'full-render')).errors.some(e=>e.code==='project_changed'));
},true));
