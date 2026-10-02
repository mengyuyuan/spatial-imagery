import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeScript,scriptLines,validateFilm} from '../dist/production.js';
import {makeFilm,requestJSON,validateConfig} from '../dist/production-node.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
const script='# Film\nMove the idea.\nMake the relationship visible.\n';
const policy={music:'allowed',narration:'off',footage:'optional'};
function design(){return {version:1,videoType:'general',scriptSha256:sha(script),title:'A relationship',width:640,height:360,fps:30,durationInFrames:120,background:'#101820',direction:'The same object opens to reveal a relationship.',shots:[{id:'SH1',from:0,to:60,state:'full',lines:['L001'],keyword:'Move',subject:'disc',initial:'one point',action:'cross frame',result:'arrives',camera:'follow',sound:'quiet',assets:[],readFrames:15,handoff:{to:'SH2',method:'same subject',continuity:'position'}},{id:'SH2',from:60,to:120,state:'full',lines:['L002'],keyword:'Reveal',subject:'disc',initial:'arrives',action:'opens',result:'relationship shown',camera:'pull back',sound:'quiet',assets:[],readFrames:20}],camera:{zoom:[{frame:0,value:1},{frame:120,value:1.5}]},layers:[{id:'subject',type:'ellipse',from:0,to:120,x:[{frame:0,value:50},{frame:60,value:320}],y:180,width:90,height:90,fill:'#fd6841'}],cues:[]};}
async function workspace(fn){const root=await mkdtemp(join(tmpdir(),'si-production-'));try{await writeFile(join(root,'script.md'),script);await writeFile(join(root,'design.json'),JSON.stringify(design()));await writeFile(join(root,'config.json'),JSON.stringify({policy}));await fn(root);}finally{await rm(root,{recursive:true,force:true});}}
async function server(handler,fn){const s=createServer(handler);await new Promise(r=>s.listen(0,'127.0.0.1',r));try{await fn(`http://127.0.0.1:${s.address().port}/v1`);}finally{await new Promise(r=>s.close(r));}}
test('script lines have stable IDs and design must cover every real line',()=>{
  assert.equal(sha(normalizeScript('\uFEFF'+script.replace(/\n/g,'\r\n'))),sha(script));
  assert.deepEqual(scriptLines(script).map(l=>l.id),['L001','L002']);assert.deepEqual(validateFilm(design(),scriptLines(script),[],sha(script),policy),[]);
  const d=design();d.shots[1].lines=['L999'];const errors=validateFilm(d,scriptLines(script),[],sha(script),policy);assert(errors.some(e=>e.includes('real input')));assert(errors.some(e=>e.includes('L002')));
  d.scriptSha256=sha('different');assert(validateFilm(d,scriptLines(script),[],sha(script),policy).some(e=>e.includes('another script')));
});
test('out-of-order animation keys and invisible shots are rejected',()=>{
  const d=design();d.layers[0].x=[{frame:40,value:1},{frame:20,value:2}];d.layers[0].to=30;
  const errors=validateFilm(d,scriptLines(script),[],sha(script),policy);assert(errors.some(e=>e.includes('ordered')));assert(errors.some(e=>e.includes('covering')));
});
test('audio range and project music restrictions are enforced',()=>{
  const d=design();d.cues=[{id:'s',asset:'audio',role:'music',start:0,end:4,sourceIn:1,fadeIn:.2,fadeOut:.5,gainDb:-10}];
  const a={id:'audio',kind:'audio',title:'source',source:'https://example.org/source',license:'CC0',tags:[],local:'source.wav',sha256:'a'.repeat(64),availability:'local',redistribution:'allowed',review:'technical',duration:3};
  const errors=validateFilm(d,scriptLines(script),[a],sha(script),{...policy,music:'off'});assert(errors.some(e=>e.includes('disabled')));assert(errors.some(e=>e.includes('too short')));
});
test('required footage cannot silently become a text-only film',()=>{assert(validateFilm(design(),scriptLines(script),[],sha(script)).some(e=>e.includes('Footage required')));});

test('imported A/B designs require a talking-head project, not just a model declaration',()=>workspace(async(root)=>{
  const d=design();d.videoType='talking-head';d.shots[0].state='A';d.shots[1].state='B';
  await writeFile(join(root,'design.json'),JSON.stringify(d));
  const args={script:join(root,'script.md'),design:join(root,'design.json'),config:join(root,'config.json')};
  await assert.rejects(makeFilm({...args,out:join(root,'wrong-type')}),/videoType does not match/);
  await writeFile(join(root,'config.json'),JSON.stringify({policy,videoType:'talking-head'}));
  const out=join(root,'talking-head');await makeFilm({...args,out});
  const m=JSON.parse(await readFile(join(out,'production-gates.json'),'utf8'));
  assert.equal(m.videoType,'talking-head');assert.deepEqual(m.shots.map(s=>s.state),['A','B']);
  assert.throws(()=>validateConfig({videoType:'voiceover'}),/videoType/);
}));
test('model endpoint and key stay explicit; missing secrets do not trigger a fallback',async()=>{
  assert.throws(()=>validateConfig({model:{baseUrl:'http://example.com/v1',model:'test',apiKeyEnv:'SI_TEST_KEY'}}),/HTTPS/);
  assert.throws(()=>validateConfig({model:{baseUrl:'https://example.com/v1?key=secret',model:'test',apiKeyEnv:'SI_TEST_KEY'}}),/credentials/);
  await assert.rejects(requestJSON({baseUrl:'https://example.com/v1',model:'test',apiKeyEnv:'SI_MISSING_KEY'},'JSON',{}),/Missing environment/);
});
test('compatible model wire protocol preserves the chosen model and parses JSON',async()=>{
  process.env.SI_TEST_KEY='fixture-only-not-a-secret';
  try{await server(async(req,res)=>{let body='';for await(const b of req)body+=b;const input=JSON.parse(body);assert.equal(req.url,'/v1/chat/completions');assert.equal(input.model,'chosen-model');assert.equal(req.headers.authorization,'Bearer fixture-only-not-a-secret');res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{content:'{"ok":true}'},finish_reason:'stop'}]}));},async(baseUrl)=>assert.deepEqual(await requestJSON({baseUrl,model:'chosen-model',apiKeyEnv:'SI_TEST_KEY'},'Return JSON',{script}),{ok:true}));}finally{delete process.env.SI_TEST_KEY;}
});
test('provider error bodies and credentials are not reflected in errors',async()=>{
  process.env.SI_TEST_KEY='fixture-sensitive-value';try{await server((_req,res)=>{res.statusCode=401;res.end('fixture-sensitive-value');},async(baseUrl)=>{await assert.rejects(requestJSON({baseUrl,model:'m',apiKeyEnv:'SI_TEST_KEY'},'JSON',{}),e=>e.message.includes('HTTP 401')&&!e.message.includes('fixture-sensitive-value'));});}finally{delete process.env.SI_TEST_KEY;}
});
test('editable project materializes from script/design and refuses overwrites',async()=>workspace(async(root)=>{
  const out=join(root,'film'),args={script:join(root,'script.md'),design:join(root,'design.json'),config:join(root,'config.json'),out};
  const result=await makeFilm(args);assert.equal(result.status,'editable_project_ready');assert((await readFile(join(out,'src/index.tsx'),'utf8')).includes('registerRoot'));assert((await readFile(join(out,'design-table.md'),'utf8')).includes('Make the relationship visible.'));
  const report=JSON.parse(await readFile(join(out,'production-report.json'),'utf8'));assert.equal(report.review.listening,'unverified');assert.equal(report.status.at(-1).stage,'project');
  await assert.rejects(makeFilm(args),/EEXIST/);
}));
test('bounded model repair receives validation feedback, without local catalog paths',async()=>workspace(async(root)=>{
  process.env.SI_TEST_KEY='fixture-key';let attempts=0;
  try{await server(async(req,res)=>{let raw='';for await(const b of req)raw+=b;const input=JSON.parse(JSON.parse(raw).messages[1].content);const d=design();assert.equal(input.videoType,'general');if(attempts++===0){d.shots[1].lines=['L777'];d.videoType='talking-head';}else{assert(input.validationFeedback.some(e=>e.includes('L002')));assert(input.validationFeedback.some(e=>e.includes('videoType')));}res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(d)}}]}));},async(baseUrl)=>{
    await writeFile(join(root,'config.json'),JSON.stringify({policy,model:{baseUrl,model:'fixture-model',apiKeyEnv:'SI_TEST_KEY'}}));
    await makeFilm({script:join(root,'script.md'),config:join(root,'config.json'),out:join(root,'film')});assert.equal(attempts,2);
    assert(!(await readFile(join(root,'film/project.json'),'utf8')).includes('fixture-key'));
  });}finally{delete process.env.SI_TEST_KEY;}
}));
test('asset integrity mismatch fails and is recorded before rendering',async()=>workspace(async(root)=>{
  await writeFile(join(root,'pixel.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=','base64'));
  const a={id:'img',kind:'image',title:'fixture',source:'generated test fixture',license:'CC0',tags:[],local:'pixel.png',sha256:'a'.repeat(64),availability:'local',redistribution:'allowed',review:'technical'};
  await writeFile(join(root,'assets.json'),JSON.stringify([a]));const d=design();d.layers[0].type='image';d.layers[0].asset='img';await writeFile(join(root,'design.json'),JSON.stringify(d));
  const out=join(root,'film');await assert.rejects(makeFilm({script:join(root,'script.md'),design:join(root,'design.json'),config:join(root,'config.json'),catalog:join(root,'assets.json'),out}),/SHA256 mismatch/);
  assert.equal(JSON.parse(await readFile(join(out,'production-report.json'),'utf8')).status.at(-1).state,'failed');
}));
