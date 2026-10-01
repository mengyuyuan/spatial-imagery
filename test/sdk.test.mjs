import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import * as sdk from '../dist/index.js';
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const plan=JSON.parse(await readFile(new URL('../templates/storyboard.json',import.meta.url),'utf8'));
test('Hermite endpoints, shared velocity and units are exact',()=>{
  const path=sdk.motionPath([{time:0,position:[0,0,0]},{time:2,position:[2,4,0],velocity:[1,2,0]},{time:4,position:[4,8,0]}]);
  assert.deepEqual(path(0).position,[0,0,0]); assert.deepEqual(path(4).position,[4,8,0]);
  for(const t of [2-1e-6,2,2+1e-6]){near(path(t).velocity[0],1,1e-5);near(path(t).velocity[1],2,1e-5);}
  const d=1e-5,t=1.2;near((path(t+d).position[1]-path(t-d).position[1])/(2*d),path(t).velocity[1]);
});
test('random-access motion sampling has no playback history',()=>{
  const p=sdk.motionPath([{time:0,position:[0,1,0]},{time:3,position:[9,-2,5]}]);
  const first=p(1.2);p(3);p(-2);p(0);assert.deepEqual(p(1.2),first);
  assert.deepEqual(p(10).velocity,[0,0,0]);
});
test('mutating input keys does not mutate compiled animation',()=>{
  const keys=[{time:0,position:[0,0,0]},{time:1,position:[1,1,1]}];const p=sdk.motionPath(keys);
  keys[1].position[0]=99;near(p(1).position[0],1);
  p(3).position[0]=500;near(p(3).position[0],1);
});
test('motion rejects invalid keys and samples',()=>{
  for(const k of [[],[{time:0,position:[0,0,0]}],[{time:0,position:[0,0,0]},{time:0,position:[1,1,1]}],[{time:0,position:[0,0,0]},{time:1,position:[NaN,0,0]}]])assert.throws(()=>sdk.motionPath(k));
  assert.throws(()=>sdk.motionPath([{time:0,position:[0,0,0]},{time:1,position:[1,1,1]}])(NaN));
});
test('scalar track supports holds, custom easing and clamp',()=>{
  const s=sdk.track([{time:1,value:2},{time:3,value:10,easing:sdk.linear}]);
  near(s(2),6);near(s(-10),2);near(s(10),10);assert.throws(()=>sdk.track([]));
});
test('follow camera keeps relative placement and look-ahead',()=>{
  const p=sdk.motionPath([{time:0,position:[0,0,0],velocity:[1,0,0]},{time:2,position:[2,0,0],velocity:[1,0,0]}]);
  const c=sdk.followCamera(p,1,{offset:[0,-4,2],lookAhead:.5});
  assert.deepEqual(c.position,[1,-4,2]);near(c.target[0],1.5);
});
test('projection distinguishes depth, aspect and behind-camera',()=>{
  const c={position:[0,-10,0],target:[0,0,0],up:[0,0,1],fov:90};
  assert.deepEqual(sdk.project([0,0,0],c,1600,900),{x:800,y:450,depth:10});
  near(sdk.project([1,0,0],c,1600,900).x,845);
  assert.equal(sdk.project([0,-11,0],c,1600,900),null);
  assert.throws(()=>sdk.project([0,0,0],{...c,up:[0,1,0]},1600,900));
});
test('handoff reports screen-space mismatches without a false artistic verdict',()=>{
  const r=sdk.handoffDelta({x:0,y:0,size:20,vx:3,vy:4},{x:3,y:4,size:40,vx:3,vy:6});
  assert.deepEqual(r,{positionPixels:5,velocityPixelsPerSecond:2,scaleRatio:2});
});
const cue={id:'SFX01',asset:'air',start:1,end:3,sourceIn:4,fadeIn:.25,fadeOut:.5,gainDb:-6,pan:[-1,1]};
test('audio starts/ends at zero, covers body, and pans with timeline',()=>{
  near(sdk.sampleCue(cue,1).gain,0);near(sdk.sampleCue(cue,3).gain,0);
  near(sdk.sampleCue(cue,2).gain,10**(-6/20));near(sdk.sampleCue(cue,2).pan,0);
  near(sdk.sampleCue(cue,2).sourceTime,5);
  const m=sdk.sampleCue(cue,2);near(m.left*m.left+m.right*m.right,m.gain*m.gain);
});
test('audio-rate fade avoids frame-sized gain steps',()=>{
  const e=sdk.gainEnvelope(cue,48000,1,12000);
  assert.equal(e.length,12000);near(e[0],0);
  let max=0;for(let i=1;i<e.length;i++)max=Math.max(max,Math.abs(e[i]-e[i-1]));
  assert.ok(max<0.0001);assert.ok(e.at(-1)>.49);
});
test('audio envelope inherits an explicitly supplied movement intensity',()=>{
  const c={...cue,intensity:t=>(t-1)/2};near(sdk.sampleCue(c,2).gain,sdk.dbToGain(-6)*.5);
});
test('material crossfade conserves power for uncorrelated sources',()=>{
  for(let i=0;i<=100;i++){const [a,b]=sdk.crossfade(i/100,0,1);near(a*a+b*b,1);}
  near(sdk.crossfade(0,0,1)[0],1);near(sdk.crossfade(1,0,1)[1],1);
});
test('sound anchors include trimmed source offset',()=>{near(sdk.alignSound(10,4.5,4),9.5);assert.throws(()=>sdk.alignSound(10,3,4));});
test('sound rejects negative and overlapping fades, invalid pan',()=>{
  for(const c of [{...cue,fadeIn:-1},{...cue,fadeIn:2},{...cue,pan:[-2,1]},{...cue,end:0}])assert.throws(()=>sdk.sampleCue(c,2));
});
test('valid plan and half-open frame boundaries',()=>{
  assert.deepEqual(sdk.validatePlan(plan),[]);assert.equal(sdk.shotAt(plan,89).id,'SH01');assert.equal(sdk.shotAt(plan,90).id,'SH02');assert.equal(sdk.shotAt(plan,180),undefined);
});
test('JSON validation never throws on malformed external values',()=>{
  for(const x of [null,42,[],{}, {...plan,assets:[null],shots:[null]}, {...plan,shots:[{from:'a',to:NaN,handoff:4}]}]){assert.doesNotThrow(()=>sdk.validatePlan(x));assert.ok(sdk.validatePlan(x).length);}
});
test('plan catches gaps, overlap, missing subjects, invalid handoffs and references',()=>{
  for(const mutate of [p=>p.shots[1].from++,p=>p.shots[1].from--,p=>p.shots[0].subject='',p=>p.shots[0].handoff.to='missing',p=>p.shots[0].assets=['missing'],p=>p.shots[0].readFrames=91,p=>p.durationInFrames++]){
    const p=structuredClone(plan);mutate(p);assert.ok(sdk.validatePlan(p).some(i=>i.severity==='error'));assert.throws(()=>sdk.definePlan(p));
  }
});
test('reference metadata cannot silently become acquired video',()=>{
  const p=structuredClone(plan);p.assets=[{id:'ref',title:'Film',source:'https://example.com',license:'all rights reserved',tags:['camera','主体'],kind:'reference',availability:'reference',redistribution:'forbidden',review:'unreviewed'}];p.shots[0].assets=['ref'];
  assert.ok(sdk.validatePlan(p).some(i=>i.severity==='warning'));assert.equal(sdk.searchAssets(p.assets,'camera 主体').length,1);assert.equal(sdk.searchAssets(p.assets,'camera',{localOnly:true}).length,0);
});
test('CLI initializes without clobbering and returns failure on invalid JSON plan',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'spatial-imagery-'));
  const run=(...args)=>spawnSync(process.execPath,['dist/cli.js',...args],{encoding:'utf8'});
  try {
    assert.equal(run('init',dir).status,0);assert.equal(run('init',dir).status,1);
    assert.equal(run('check',join(dir,'storyboard.json')).status,0);
    await writeFile(join(dir,'bad.json'),'{}');assert.equal(run('check',join(dir,'bad.json')).status,1);
    assert.equal(run('unknown').status,1);
  } finally {await rm(dir,{recursive:true,force:true});}
});
