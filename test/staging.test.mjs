import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStaging,layerBounds,channelValue,validateFilm,scriptLines} from '../dist/production.js';
import {createHash} from 'node:crypto';
import {withContract} from './fixtures/design-contract.mjs';

// Synthetic geometry/contract fixture; not evidence of a reviewed film.
const keys=(a,b)=>[{frame:0,value:a},{frame:20,value:a},{frame:40,value:b},{frame:59,value:b}];
function plan(){
  return {width:1000,height:600,execution:{renderer:'layers-2.5d'},layers:[
    {id:'person',type:'video',from:0,to:60,asset:'presenter',x:keys(220,900),y:300,width:keys(400,180),height:keys(500,220)},
    {id:'content',type:'video',from:0,to:60,asset:'water',x:650,y:300,width:keys(140,240),height:keys(140,460)},
    {id:'title',type:'text',text:'Spatial Imagery',from:0,to:60,x:500,y:25,width:400,height:30},
    {id:'background',type:'rect',from:0,to:60,fill:'#112233'}],shots:[
    {id:'SH1',state:'A',from:0,to:30,intent:{focusAfter:'person'},staging:{scene:'shared-world',purpose:'Speaker introduces the demonstration',framing:'Presenter leads',presenterLayers:['person'],contentLayers:['content'],environmentLayers:['background'],protectedLayers:['title','content'],landing:[0,20]}},
    {id:'SH2',state:'B',from:30,to:60,intent:{focusAfter:'content'},staging:{scene:'shared-world',purpose:'Inspect the water process',framing:'Demonstration leads',presenterLayers:['person'],contentLayers:['content'],environmentLayers:['background'],protectedLayers:['title','content'],landing:[40,60]}}],
    transitions:[{id:'TR1',fromShot:'SH1',toShot:'SH2',range:[20,45],takeover:{environment:'retained',reason:'The same world connects speaker to evidence',reveal:'Water expands into the demonstration area',bridge:'The small water sample becomes the large view',completionFrame:40,proofLayers:['content']}}]};
}
// Keep the presenter outside the information during the entire crossing, not only landings.
function safe(){const d=plan();d.layers[0].y=[{frame:0,value:300},{frame:20,value:300},{frame:27,value:580},{frame:36,value:580},{frame:40,value:300},{frame:59,value:300}];d.layers[0].height=[{frame:0,value:500},{frame:20,value:500},{frame:27,value:20},{frame:36,value:20},{frame:40,value:220},{frame:59,value:220}];d.layers[0].x=[{frame:0,value:220},{frame:27,value:220},{frame:36,value:900},{frame:59,value:900}];return d;}

test('retained environment passes when content genuinely takes over and stays clear',()=>assert.deepEqual(validateStaging(safe()),[]));
test('legacy A/B labels alone fail; general films remain outside the A/B contract',()=>{
 const d=safe();delete d.shots[0].staging;assert.match(validateStaging(d).join('\n'),/staging contract/);
 for(const s of d.shots)s.state='full';assert.deepEqual(validateStaging(d),[]);
});
test('presenter-only shrink fails even with renamed scenes and an honest size hierarchy',()=>{
 const d=safe();Object.assign(d.layers[1],{width:240,height:460});d.shots[1].staging.scene='different-name';
 assert.match(validateStaging(d).join('\n'),/only presenter\/layout labels changed/);
});
test('unprotected text/content and using presenter as takeover proof are blocked',()=>{
 const d=safe();d.shots[1].staging.protectedLayers=[];
 assert.match(validateStaging(d).join('\n'),/protect its information/);assert.match(validateStaging(d).join('\n'),/text layer/);
 const p=safe();p.transitions[0].takeover.proofLayers=['person'];assert.match(validateStaging(p).join('\n'),/non-presenter content/);
});
test('single middle-frame intrusion fails although both landings are clear',()=>{
 const d=safe();d.layers[0].x=[{frame:0,value:220},{frame:29,value:220},{frame:30,value:650},{frame:31,value:900},{frame:59,value:900}];d.layers[0].y=300;
 assert.match(validateStaging(d).join('\n'),/overlaps protected information content at frame 30/);
});
test('wrong landing hierarchy, missing moving presenter and late takeover fail',()=>{
 const d=safe();d.layers[0].type='image';assert.match(validateStaging(d).join('\n'),/actual moving presenter video/);
 const h=safe();h.layers[1].height=keys(140,10);assert.match(validateStaging(h).join('\n'),/primary subject/);
 const t=safe();t.transitions[0].takeover.completionFrame=41;assert.match(validateStaging(t).join('\n'),/before the destination landing/);
});
test('protection covers A-state explanations but decoration can pass behind presenter',()=>{
 const d=safe();d.layers[1].x=220;d.layers[1].to=29;d.shots=d.shots.slice(0,1);d.transitions=[];
 assert.match(validateStaging(d).join('\n'),/overlaps/);
 d.shots[0].staging.protectedLayers=['title'];assert.match(validateStaging(d).join('\n'),/protect its information/);
 d.shots[0].staging.contentLayers=[];d.shots[0].staging.environmentLayers.push('content');assert.deepEqual(validateStaging(d),[]);
});
test('custom execution still needs roles, focus and takeover; geometry needs encoded review',()=>{
 const d=plan();d.execution.renderer='custom';assert.deepEqual(validateStaging(d),[]);
 delete d.transitions[0].takeover;assert.match(validateStaging(d).join('\n'),/requires takeover/);
});
test('geometry handles clipping, inactive frames, depth, reveal and camera zoom',()=>{
 const d={width:1000,height:600,camera:{perspective:1000,zoom:2}},l={from:0,to:60,x:500,y:300,width:100,height:50,z:500};
 assert.deepEqual(layerBounds(l,0,d),{left:300,right:700,top:200,bottom:400});
 assert.equal(layerBounds(l,60,d),null);assert.equal(layerBounds({...l,opacity:0},0,d),null);
 assert.deepEqual(layerBounds({...l,space:'screen',reveal:.5},0,d),{left:450,right:500,top:275,bottom:325});
 assert.equal(channelValue([{frame:0,value:0,easing:'linear'},{frame:2,value:10}],1,99),5);
});
test('disconnected tiny content cannot count its empty bounding gap as dominance',()=>{
 const d=safe();const c=d.layers[1];Object.assign(c,{x:20,y:80,width:10,height:10});
 d.layers.push({...c,id:'tiny2',x:970,y:80});d.shots[1].staging.contentLayers.push('tiny2');d.shots[1].staging.protectedLayers.push('tiny2');
 assert.match(validateStaging(d).join('\n'),/primary subject/);
});
test('video alpha flag is typed and accepted by the actual film validator',()=>{
 const d=withContract({version:1,videoType:'general',width:1000,height:600,fps:30,durationInFrames:60,title:'Alpha test',background:'#112233',direction:'Alpha footage',scriptSha256:createHash('sha256').update('Test').digest('hex'),layers:[{id:'p',type:'video',asset:'p',from:0,to:60,transparent:true}],shots:[{id:'SH1',from:0,to:60,state:'full',lines:['L001'],keyword:'Test',subject:'Person',initial:'Starts',action:'Moves',result:'Ends',camera:'Fixed',sound:'Silent test',assets:['p'],readFrames:15}],cues:[]});
 const assets=[{id:'p',kind:'video',duration:2,title:'Synthetic alpha fixture',source:'synthetic:test',license:'fixture-only',availability:'local',redistribution:'forbidden',review:'technical',tags:[],local:'fixture.webm',sha256:'0'.repeat(64)}],policy={music:'off',narration:'off',footage:'optional'};
 assert.deepEqual(validateFilm(d,scriptLines('Test'),assets,d.scriptSha256,policy),[]);
 d.layers[0].transparent='yes';assert.match(validateFilm(d,scriptLines('Test'),assets,d.scriptSha256,policy).join('\n'),/boolean alpha-decode/);
});
