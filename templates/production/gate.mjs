// Portable project evidence runner. Reviews remain observations supplied by a reviewer.
import {readFile,writeFile,readdir,stat,mkdir,copyFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {pythonCommand} from './src/sdk/environment.js';
import {validateStaging} from './src/sdk/staging.js';
import {validateExecutionBindings} from './src/sdk/execution.js';
import {designTable} from './src/sdk/design-table.js';

const home=dirname(fileURLToPath(import.meta.url));
const load=async(root,name)=>JSON.parse(await readFile(join(root,name),'utf8'));
const save=async(root,name,data)=>writeFile(join(root,name),JSON.stringify(data,null,2)+'\n');
const projectExecution=d=>({...(d.execution??{renderer:'layers-2.5d'}),designSource:'design.json',parameterSources:['src/index.tsx','design.json']});
async function refreshActive(root,d){
  await save(root,'pipeline-active.json',{version:1,manifest:'production-gates.json',entryPoint:{path:'src/index.tsx',sha256:await hashFile(join(root,'src/index.tsx'))},designSource:{path:'design.json',sha256:await hashFile(join(root,'design.json'))},scope:[0,d.durationInFrames],fps:d.fps,width:d.width,height:d.height});
}
export async function requireEntry(root,mode,output,media){
  const d=await load(root,'design.json'),p=pythonCommand();
  const r=spawnSync(p.bin,[...p.args,'-X','utf8',join(root,'pipeline_entry.py'),'--project',root,'--mode',mode,'--entry','src/index.tsx','--design','design.json','--output',output,'--range','0',String(d.durationInFrames),...(media?['--media',media]:[])],{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});
  if(r.error||r.status!==0)throw Error(`Production gate blocked by entry preflight: ${r.stdout||r.stderr||r.error}`);
  return JSON.parse(r.stdout);
}
export async function hashFile(file){const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return h.digest('hex');}
async function refreshDesignView(root){
  const expected=designTable(await load(root,'design.json'),await readFile(join(root,'script.md'),'utf8'));
  const path=join(root,'design-table.md');
  try{if(await readFile(path,'utf8')!==expected){await mkdir(join(root,'design-history'),{recursive:true});await copyFile(path,join(root,'design-history',`${await hashFile(path)}.md`));}}catch(e){if(e.code!=='ENOENT')throw e;}
  await writeFile(path,expected);
}
export async function projectInputs(root){
  const inputs=[];
  async function add(role,path){inputs.push({role,path,sha256:await hashFile(join(root,path))});}
  for(const [role,path] of [['design','design.json'],['timeline','design.json'],['sound','design.json'],['assets','assets.json'],['source','script.md'],['source','policy.json'],['source','package.json'],['source','render.mjs'],['source','mix.mjs'],['source','gate.mjs'],['source','verify_production_gates.py']])await add(role,path);
  await add('design','design-table.md');
  await add('source','verify_execution_evidence.py');
  for(const path of ['verify_requirements.py','pipeline_entry.py','pipeline_entry.cjs'])await add('source',path);
  await add('brief','user-brief.json');
  for(const path of ['package-lock.json','planner-context.json','design-instructions.md'])try{await stat(join(root,path));await add('source',path);}catch(e){if(e.code!=='ENOENT')throw e;}
  async function walk(folder){
    for(const e of (await readdir(join(root,folder),{withFileTypes:true})).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
      const path=`${folder}/${e.name}`;
      if(e.isSymbolicLink())throw Error(`Keep project sources self-contained; symlink found: ${path}`);
      if(e.isDirectory())await walk(path);
      else if(e.isFile()&&path!=='public/mix.wav')await add('source',path);
    }
  }
  await walk('src');await walk('public');
  return inputs.sort((a,b)=>{const x=a.role+':'+a.path,y=b.role+':'+b.path;return x<y?-1:x>y?1:0;});
}
function clearReviews(m){
  m.executionEvidence=[];
  for(const row of [...m.shots,...m.transitions])row.review={status:'unverified'};
  for(const key of ['assetsReview','soundReview','technicalReview','sequenceReview'])m[key]={status:'unverified'};
  m.filmDesignReview={status:'unverified'};
  for(const gate of Object.values(m.specialistGates??{}))gate.reviews=[];
}
const shotDecisionKeys=['meaning','identity','kind','changes','reading','intent','holdReason','noReadingReason','staging','motionBinding','cameraBinding'];
const shotCore=s=>({id:s.id,from:s.from,to:s.to,state:s.state,subject:s.subject,initial:s.initial,process:s.action,result:s.result,camera:s.camera});
const shotEvidenceKeys=['id','from','to','state','subject','initial','process','result','camera',...shotDecisionKeys];
const transitionDecisionKeys=['id','fromShot','toShot','range','method','reason','identity','motion','handoff','takeover','cameraBinding'];
const select=(value,keys)=>Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,structuredClone(value[k])]));
function applyDesignedDecisions(m,d){
  m.requirementContract=d.requirementContract??null;
  for(const [i,s] of d.shots.entries())Object.assign(m.shots[i],select(s,shotDecisionKeys));
  if(d.transitions)m.transitions=d.transitions.map(t=>({...select(t,transitionDecisionKeys),review:{status:'unverified'}}));
  for(const [key,g] of Object.entries(d.gatePlans??{}))if(m.specialistGates[key])m.specialistGates[key]={...select(g,['applicable','reason','plan','targets']),reviews:[]};
  if(d.designRationale)m.designRationale=structuredClone(d.designRationale);
}
export async function initializeGates(root){
  const d=await load(root,'design.json'),template=await load(root,'production-gates-template.json');
  await refreshDesignView(root);
  const m={...template,executionContractVersion:1,version:'working-1',execution:projectExecution(d),width:d.width,height:d.height,videoType:d.videoType,intentThesis:d.direction,fps:d.fps,scope:[0,d.durationInFrames],audioExpected:d.cues.length>0,inputs:await projectInputs(root)};
  if(!m.audioExpected)m.audioReason=d.audioReason??'TODO';
  m.shots=d.shots.map(s=>({...structuredClone(template.shots[0]),id:s.id,from:s.from,to:s.to,state:s.state,subject:s.subject,meaning:'TODO',initial:s.initial,process:s.action,result:s.result,camera:s.camera,kind:'demonstration',changes:[],reading:s.readFrames?[s.to-s.readFrames,s.to]:null,identity:'TODO',intent:{sourceKind:'brief',cue:'TODO',cueRange:[s.from,s.to],before:'TODO',after:'TODO',why:'TODO',visualBridge:'TODO',focusBefore:'TODO',focusAfter:'TODO',revealFrame:s.from},implementation:[]}));
  m.transitions=d.shots.slice(1).map((s,i)=>({id:`TR${i+1}`,fromShot:d.shots[i].id,toShot:s.id,range:[Math.max(d.shots[i].from,s.from-2),Math.min(s.to,s.from+2)],method:d.shots[i].handoff?.method??'TODO',reason:'TODO',identity:'TODO',motion:d.shots[i].handoff?.continuity??'TODO',handoff:{kind:'new_subject',outgoing:'TODO',incoming:'TODO',exit:'TODO',entry:'TODO',meaningBridge:'TODO',cue:'TODO',cueRange:[s.from-1,s.from+1],focusFrame:s.from}}));
  // Preserve designed decisions, never import purported approvals from model JSON.
  if(d.transitions)m.transitions=d.transitions.map(t=>select(t,transitionDecisionKeys));
  clearReviews(m);
  for(const key of ['design','animation','camera','soundfx','color','handoff']){
    const gate=m.specialistGates[key];gate.applicable=key!=='handoff'||m.transitions.length>0;
    gate.targets=(key==='handoff'?m.transitions:key==='camera'?[...m.shots,...m.transitions]:m.shots).map(s=>s.id);
  }
  applyDesignedDecisions(m,d);
  await writeFile(join(root,'production-gates.json'),JSON.stringify(m,null,2)+'\n',{flag:'wx'});
  await refreshActive(root,d);
  return {status:'unverified',manifest:'production-gates.json',note:'Complete design details and actual reviews; no approval was generated.'};
}
function verifyRecord(root,stage){
  const p=pythonCommand();
  const r=spawnSync(p.bin,[...p.args,'-X','utf8',join(root,'verify_production_gates.py'),join(root,'production-gates.json'),'--stage',stage],{encoding:'utf8',timeout:120000,windowsHide:true,maxBuffer:16*1024*1024});
  if(r.error)throw r.error;
  try{return JSON.parse(r.stdout);}catch{throw Error(`Evidence validator failed: ${r.stderr.trim()||'no JSON response'}`);}
}
export async function checkGates(root,stage){
  if(!['design','full-render','delivery'].includes(stage))throw Error('Use design, full-render or delivery');
  const m=await load(root,'production-gates.json'),d=await load(root,'design.json');
  const result=verifyRecord(root,stage);result.errors??=[];
  const fail=(code,message)=>result.errors.push({code,path:'project',message});
  if(JSON.stringify(m.requirementContract)!==JSON.stringify(d.requirementContract??null))fail('project_requirements','Requirements differ from the executed design; refresh and re-review.');
  for(const message of validateExecutionBindings(d))fail('execution_binding',message);
  if(!Array.isArray(d.transitions)||d.transitions.length!==Math.max(0,d.shots.length-1))fail('execution_binding','Bind every TR camera in design.json, including legacy imported projects, before G1.');
  for(const [i,s] of d.shots.entries())if(JSON.stringify(select(s,['motionBinding','cameraBinding']))!==JSON.stringify(select(m.shots?.[i]??{},['motionBinding','cameraBinding'])))fail('project_decisions',`Shot ${s.id} execution bindings differ from design.json.`);
  if(JSON.stringify(m.execution)!==JSON.stringify(projectExecution(d))||m.width!==d.width||m.height!==d.height)fail('project_execution','Renderer and measurement dimensions must match design.json.');
  if(await readFile(join(root,'design-table.md'),'utf8')!==designTable(d,await readFile(join(root,'script.md'),'utf8')))fail('design_view_drift','design-table.md is a generated view. Edit design.json and refresh; preserve any prose edits before regenerating.');
  for(const message of validateStaging(d,await load(root,'assets.json')))fail('ab_staging',message);
  const inputs=await projectInputs(root);
  const key=x=>`${x.role}:${x.path}:${x.sha256}`;
  const actual=new Set((m.inputs??[]).map(key));
  if(inputs.some(x=>!actual.has(key(x))))fail('project_changed','Required current sources/assets/lockfile are missing or stale. Run gates refresh, then review the changed version again.');
  if(m.fps!==d.fps||m.videoType!==d.videoType||JSON.stringify(m.scope)!==JSON.stringify([0,d.durationInFrames])||m.audioExpected!==(d.cues.length>0))fail('project_scope','Evidence videoType, FPS, scope and audio policy must match design.json.');
  const shots=x=>x.map(s=>[s.id,s.from,s.to,s.state]);
  if(!Array.isArray(m.shots)||JSON.stringify(shots(m.shots))!==JSON.stringify(shots(d.shots)))fail('project_shots','Evidence shot IDs, ranges and states must match design.json.');
  for(const [i,s] of d.shots.entries())if(s.intent&&JSON.stringify(select({...s,...shotCore(s)},shotEvidenceKeys))!==JSON.stringify(select(m.shots?.[i]??{},shotEvidenceKeys)))fail('project_decisions',`Shot ${s.id} decisions differ from design.json; edit the source design and refresh.`);
  if(d.transitions&&JSON.stringify(d.transitions.map(t=>select(t,transitionDecisionKeys)))!==JSON.stringify((m.transitions??[]).map(t=>select(t,transitionDecisionKeys))))fail('project_decisions','TR decisions differ from design.json.');
  for(const [name,g] of Object.entries(d.gatePlans??{}))if(JSON.stringify(select(g,['applicable','reason','plan','targets']))!==JSON.stringify(select(m.specialistGates?.[name]??{},['applicable','reason','plan','targets'])))fail('project_decisions',`${name} production plan differs from design.json.`);
  if(stage!=='design'){
    for(const item of m.media??[]){
      try{
        const qa=await load(root,item.qa);
        if(!qa.technicalPassed||qa.sha256!==item.sha256||qa.frames!==d.durationInFrames||qa.fps!==d.fps||item.from!==0||item.to!==d.durationInFrames||JSON.stringify(qa.inputs)!==JSON.stringify(inputs))throw Error('QA does not match current media, inputs or full project range');
        if(m.audioExpected&&!qa.audio?.audio)throw Error('Expected sound is missing');
        if(stage==='delivery'&&item.id===m.finalMedia&&(item.path!=='output/final.mp4'||item.qa!=='output/qa.json'||qa.mode!=='production'))throw Error('Delivery must review this project’s production render');
      }catch(e){fail('media_qa',`${item.id}: ${e.message}`);}
    }
  }
  result.eligible=result.eligible===true&&result.errors.length===0;
  return result;
}
export async function requireGate(root,stage){
  const result=await checkGates(root,stage);
  if(!result.eligible)throw Error(`${stage} gate blocked:\n${result.errors.slice(0,16).map(e=>`${e.code}: ${e.path}: ${e.message}`).join('\n')}\nSee PRODUCTION-GATES.md. Use render:draft only for diagnostic work, not delivery.`);
  return result;
}
export async function runGate(root,action){
  if(action==='init')return initializeGates(root);
  if(action==='register-execution'){
    const m=await load(root,'production-gates.json');
    if(m.execution?.renderer!=='custom'||m.media?.length!==1)throw Error('Register the current custom draft/final media first.');
    const item=m.media[0],path=item.role==='final'?'output/final-execution.json':'qa/pipeline-review/draft-execution.json',doc=await load(root,path);
    const current=verifyRecord(root,'design');
    if(doc.binding!==current.executionBinding||doc.mediaSha256!==item.sha256||await hashFile(join(root,item.path))!==item.sha256)throw Error('Measurement binding/video changed; collect evidence for the current encode.');
    const designReviews=m.specialistGates?.design?.reviews,overview=m.filmDesignReview,technical=m.technicalReview;
    const decisions=Object.fromEntries(Object.entries(m.specialistGates??{}).filter(([,g])=>g.applicable===false).map(([k,g])=>[k,g.reviews]));
    clearReviews(m);m.filmDesignReview=overview;m.technicalReview=technical;
    if(m.specialistGates?.design)m.specialistGates.design.reviews=designReviews??[];
    for(const [k,reviews] of Object.entries(decisions))m.specialistGates[k].reviews=reviews;
    m.executionEvidence=[{media:item.id,evidence:{path,sha256:await hashFile(join(root,path))}}];
    await save(root,'production-gates.json',m);
    const binding=verifyRecord(root,'design').binding;
    if(technical?.status==='passed'&&technical.binding===current.binding){m.technicalReview={...technical,binding};await save(root,'production-gates.json',m);}
    await save(root,'delivery-status.json',{status:'unverified',reason:'Measurements attached; playback and listening reviews must be completed.'});
    return {status:'review_pending',binding,note:'Measurement artifact registered, never approved. Run gates and complete the actual reviews.'};
  }
  if(action==='refresh'){
    const m=await load(root,'production-gates.json'),d=await load(root,'design.json');
    await refreshDesignView(root);
    Object.assign(m,{execution:projectExecution(d),width:d.width,height:d.height,requirementContract:d.requirementContract??null});
    if(d.shots.every(s=>s.intent)&&d.transitions&&d.gatePlans){
      m.shots=d.shots.map(s=>({...shotCore(s),implementation:[]}));
      Object.assign(m,{intentThesis:d.direction,fps:d.fps,videoType:d.videoType,scope:[0,d.durationInFrames],audioExpected:d.cues.length>0});
      if(!m.audioExpected)m.audioReason=d.audioReason??'TODO';else delete m.audioReason;
      applyDesignedDecisions(m,d);
    }
    m.inputs=await projectInputs(root);m.media=[];clearReviews(m);
    await save(root,'production-gates.json',m);
    await refreshActive(root,d);
    await save(root,'delivery-status.json',{status:'unverified',reason:'Inputs refreshed; register new media and review it.'});
    return {status:'unverified',note:'Input hashes refreshed; media and reviews invalidated. Structured design decisions resynced from design.json; legacy manual records need manual scope/shot maintenance.'};
  }
  if(action==='register-draft'||action==='register-final'){
    const final=action==='register-final',qaPath=final?'output/qa.json':'qa/pipeline-review/draft-qa.json',file=final?'output/final.mp4':'qa/pipeline-review/draft.mp4';
    const qa=await load(root,qaPath),d=await load(root,'design.json'),m=await load(root,'production-gates.json');
    if(!qa.technicalPassed||qa.sha256!==await hashFile(join(root,file))||JSON.stringify(qa.inputs)!==JSON.stringify(await projectInputs(root)))throw Error('Render or source has changed; render a current version first.');
    const role=final?'final':'draft';
    // Keep just the version now being reviewed; old media is never silently reapproved.
    m.media=[{id:role,role,path:file,sha256:qa.sha256,from:0,to:d.durationInFrames,qa:qaPath}];
    // A new encode changes playback evidence, not unchanged G1 design critique or source N/A decisions.
    const designReview=m.specialistGates?.design?.reviews,overview=m.filmDesignReview;
    const decisions=Object.fromEntries(Object.entries(m.specialistGates??{}).filter(([,g])=>g.applicable===false).map(([k,g])=>[k,g.reviews]));
    m.finalMedia='final';clearReviews(m);
    m.filmDesignReview=overview;
    if(m.specialistGates?.design)m.specialistGates.design.reviews=designReview??[];
    for(const [k,reviews] of Object.entries(decisions))m.specialistGates[k].reviews=reviews;
    await save(root,'production-gates.json',m);
    const binding=verifyRecord(root,'design').binding;
    m.technicalReview={status:'passed',method:'technical',media:role,range:[0,d.durationInFrames],binding,observed:'Renderer QA: full decode, frame count, dimensions, FPS, file hash and expected audio verified. Not a viewing/listening review.',evidence:{path:qaPath,sha256:await hashFile(join(root,qaPath))}};
    await save(root,'production-gates.json',m);
    return {status:'review_pending',binding,media:role,note:'Only technical review populated. Complete actual shot, transition, asset, listening and sequence reviews.'};
  }
  const result=await checkGates(root,action);
  if(action==='delivery'&&result.eligible){
    try{await requireEntry(root,'delivery','output/final.mp4','output/final.mp4');}
    catch(error){result.eligible=false;result.errors.push({code:'entry_preflight',path:'project',message:error.message});}
  }
  if(action==='delivery')await save(root,'delivery-status.json',{status:result.eligible?'evidence_complete':'blocked',...result,note:'Reviewer declarations validated; user approval remains separate. Re-run after any change.'});
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const r=await runGate(home,process.argv[2]??'design');console.log(JSON.stringify(r,null,2));if(r.eligible===false)process.exitCode=1;}
  catch(e){console.error(e.message);process.exitCode=1;}
}
