import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExecutionBindings} from '../dist/execution.js';
import {resolveMixPolicy} from '../dist/audio.js';

function plan(){return {layers:[{id:'petal',from:0,to:10,x:[{frame:0,value:0},{frame:9,value:90}]}],camera:{x:[{frame:0,value:0},{frame:9,value:30}]},shots:[{id:'SH1',from:0,to:10,motionBinding:{mode:'animated',subject:'petal',channels:['layers.petal.x'],reason:'Petal falls into the pond'},cameraBinding:{mode:'animated',subject:'petal',channels:['camera.x'],reason:'Follow the falling petal'}}]};}
test('declared animation must change in its actual shot interval',()=>{
 const d=plan();assert.deepEqual(validateExecutionBindings(d),[]);
 d.layers[0].x=0;assert.match(validateExecutionBindings(d).join('\n'),/no changing executable trajectory/);
 d.layers[0].x=[{frame:0,value:0},{frame:15,value:0},{frame:20,value:10}];assert.match(validateExecutionBindings(d).join('\n'),/no changing executable trajectory/);
 delete d.layers[0].x;assert.match(validateExecutionBindings(d).join('\n'),/missing or unsupported channel/);
});
test('a motivated hold is valid but cannot disguise a changing camera',()=>{
 const d=plan();d.shots[0].cameraBinding.mode='hold';assert.match(validateExecutionBindings(d).join('\n'),/contradicts/);
 d.camera.x=0;assert.deepEqual(validateExecutionBindings(d),[]);
 d.shots[0].cameraBinding.channels=[];assert.deepEqual(validateExecutionBindings(d),[]);
 d.camera.zoom=[{frame:0,value:1},{frame:9,value:2}];assert.match(validateExecutionBindings(d).join('\n'),/contradicts/);
});
test('bindings need real subjects, supported channels and explicit custom hold measurements',()=>{
 const d=plan();d.shots[0].motionBinding.subject='missing';assert.match(validateExecutionBindings(d).join('\n'),/actual subject/);
 const c=plan();c.shots[0].cameraBinding.channels=['camera.fake'];assert.match(validateExecutionBindings(c).join('\n'),/unsupported channel/);
 c.execution={renderer:'custom'};c.shots[0].cameraBinding={mode:'hold',subject:'petal',channels:[],reason:'Read the landed lyric'};assert.match(validateExecutionBindings(c).join('\n'),/unique executable channels/);
});
test('audio defaults preserve levels and disable automatic ducking',()=>{
 assert.deepEqual(resolveMixPolicy(),{normalization:'preserve',lufs:undefined,truePeakDb:undefined,ducking:{amount:0,attack:.15,release:.3}});
 assert.throws(()=>resolveMixPolicy({normalization:'loudness'}),/lufs|targets/);
 assert.throws(()=>resolveMixPolicy({normalization:'preserve',lufs:-16}),/preserve/);
 assert.throws(()=>resolveMixPolicy({ducking:{amount:1.1,attack:0,release:0}}));
 const p=resolveMixPolicy({normalization:'loudness',lufs:-18,truePeakDb:-2,ducking:{amount:.25,attack:.05,release:.2}});assert.equal(p.ducking.amount,.25);assert.equal(p.lufs,-18);
});
