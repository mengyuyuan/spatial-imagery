// Synthetic design decisions for contract tests. Never playback/approval evidence.
import {channelValue} from '../../dist/staging.js';
export function bindExecution(d){
  const make=(kind,subject,extent)=>{
    const owner=kind==='camera'?d.camera??{}:d.layers.find(l=>l.id===subject)??{};
    const keys=(kind==='camera'?['x','y','zoom','rotateZ']:['x','y','z','width','height','scale','rotateX','rotateY','rotateZ','radius','reveal','opacity']).filter(k=>owner[k]!==undefined);
    const animated=keys.some(k=>{const first=channelValue(owner[k],extent[0],0);for(let f=extent[0]+1;f<extent[1];f++)if(Math.abs(channelValue(owner[k],f,0)-first)>1e-6)return true;return false;});
    return {mode:animated?'animated':'hold',subject,channels:keys.map(k=>kind==='camera'?`camera.${k}`:`layers.${subject}.${k}`),reason:animated?'The sampled channel carries the observation or subject change':'This interval intentionally holds the sampled observation or subject'};
  };
  for(const s of d.shots){const id=s.intent?.focusAfter??d.layers[0].id;s.motionBinding=make('motion',id,[s.from,s.to]);s.cameraBinding=make('camera',id,[s.from,s.to]);}
  for(const t of d.transitions??[])t.cameraBinding=make('camera',t.handoff?.incoming??d.layers[0].id,t.range);
  return d;
}
export function withContract(input){
  const d=structuredClone(input),focus=d.layers[0].id;
  d.designRationale={basis:'Relationships need visible intermediate states',alternatives:'A label swap would conceal the assembly',choice:'Follow the same part into its useful role',perception:'The audience sees a connection form',risk:'The joint must remain visible at the interface'};
  d.execution={renderer:'layers-2.5d',reason:'Layer motion and occlusion can show this planar connection',requirements:['planar position and scale animation']};
  d.audioReason='Silent synthetic contract fixture; no requested sound omitted';
  for(const s of d.shots)Object.assign(s,{meaning:'Parts become a connected relationship',identity:'Recognisable orange contour',kind:'demonstration',changes:['relationship'],reading:[s.to-s.readFrames,s.to],intent:{sourceKind:'brief',cue:s.keyword,cueRange:[s.from,s.to],before:s.initial,after:s.result,why:'The phrase asks for a visible relationship',visualBridge:s.action,focusBefore:focus,focusAfter:focus,revealFrame:s.from+Math.floor((s.to-s.from)/2)}});
  d.transitions=d.shots.slice(1).map((s,i)=>({id:`TR${i+1}`,fromShot:d.shots[i].id,toShot:s.id,range:[s.from-2,s.from+2],method:'subject match',reason:'Inspect the new relationship',identity:'same orange contour',motion:'carry attention into the next view',handoff:{kind:'same_subject',outgoing:focus,incoming:focus,exit:'Part settles into position',entry:'Connection becomes readable',meaningBridge:'Movement establishes the relation',cue:s.keyword,cueRange:[s.from-2,s.from+2],focusFrame:s.from}}));
  d.gatePlans=Object.fromEntries(['design','animation','camera','handoff','color','matting','denoise','soundfx'].map(name=>{
    const applicable=!['matting','denoise'].includes(name)&&(name!=='handoff'||d.transitions.length>0);
    const rows=name==='handoff'?d.transitions:name==='camera'?[...d.shots,...d.transitions]:d.shots;
    return [name,{applicable,reason:applicable?'The subject relationship needs this check':'No matching source processing in this synthetic plan',plan:`Inspect ${name} against the planned relationship; no approval asserted`,targets:applicable?rows.map(r=>r.id):[]}];
  }));
  return bindExecution(d);
}
