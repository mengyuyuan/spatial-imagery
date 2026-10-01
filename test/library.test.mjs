import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateSample,searchSamples} from '../dist/index.js';
const s={id:'relay',version:'v1',title:'Subject relay',sha256:'a'.repeat(64),fps:30,frames:600,path:'sample.mp4',tags:['camera','主体'],ranges:[{from:0,to:600,purpose:'Handoff'}],review:{technical:true,normalSpeed:false,listening:false},approval:{status:'unreviewed',scope:[]},assets:[]};
test('technical test never becomes artistic approval automatically',()=>{validateSample(s);assert.equal(searchSamples([s],'relay').length,0);assert.equal(searchSamples([s],'relay',{includeUnapproved:true}).length,1);});
test('scope cannot extend a user quote to unrelated sound approval',()=>{
  const a={...s,approval:{status:'approved_in_scope',scope:['camera'],quote:'Camera continuity works'}};
  assert.equal(searchSamples([a],'',{scope:'camera'}).length,1);assert.equal(searchSamples([a],'',{scope:'sound'}).length,0);
  assert.throws(()=>validateSample({...a,approval:{...a.approval,quote:''}}));
});
test('sample must have a file hash and a range inside that version',()=>{
  assert.throws(()=>validateSample({...s,sha256:''}));assert.throws(()=>validateSample({...s,ranges:[{from:0,to:601,purpose:'all'}]}));
});
