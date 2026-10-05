import type {Shot} from './storyboard.js';
import type {Staging,Takeover} from './staging.js';
import {validateExecutionBindings,type ExecutionBinding} from './execution.js';

export const gateNames=['design','animation','camera','handoff','color','matting','denoise','soundfx'] as const;
export type GateName=typeof gateNames[number];
export interface Intent {
  sourceKind:'speech'|'screen_text'|'gesture'|'brief'; cue:string; cueRange:[number,number];
  before:string; after:string; why:string; visualBridge:string;
  focusBefore:string; focusAfter:string; revealFrame:number; timingReason?:string;
}
export interface DesignedShot extends Shot {
  lines:string[]; meaning?:string; identity?:string;
  kind?:'transformation'|'handoff'|'demonstration'|'hold'; changes?:string[];
  intent?:Intent; reading?:[number,number]|null; holdReason?:string; noReadingReason?:string;
  staging?:Staging;
  motionBinding?:ExecutionBinding; cameraBinding?:ExecutionBinding;
}
export interface DesignedTransition {
  id:string; fromShot:string; toShot:string; range:[number,number];
  method:string; reason:string; identity:string; motion:string;
  takeover?:Takeover;
  cameraBinding?:ExecutionBinding;
  handoff:{kind:'same_subject'|'new_subject'|'intentional_cut'; outgoing:string; incoming:string;
    exit:string; entry:string; meaningBridge:string; cue:string; cueRange:[number,number]; focusFrame:number; timingReason?:string};
}
export interface GatePlan {applicable:boolean; reason:string; plan:string; targets:string[]}
export interface DesignRationale {basis:string; alternatives:string; choice:string; perception:string; risk:string}
export interface ExecutionPlan {renderer:'layers-2.5d'|'custom'; reason:string; requirements:string[]}

const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const detail=(v:unknown)=>typeof v==='string'&&!!v.trim()&&!/^(todo|tbd|pending|待填|待填写|待验证|待实现)$/i.test(v.trim());
const range=(v:unknown):v is [number,number]=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[0]<v[1];
const inside=(outer:unknown,inner:unknown)=>range(outer)&&range(inner)&&outer[0]<=inner[0]&&inner[1]<=outer[1];
export function rejectUnknown(value:Record<string,unknown>,allowed:readonly string[],path:string,errors:string[]):void {
  for(const key of Object.keys(value))if(!allowed.includes(key))errors.push(`${path}.${key}: unsupported field; it would not be executed`);
}

/** Creative decisions only. No observation, approval, or evidence is generated here. */
export function validateDesignContract(value:Record<string,unknown>,required=false):string[]{
  const errors:string[]=[];
  const words=(v:Record<string,unknown>,keys:string[],path:string)=>{for(const key of keys)if(!detail(v[key]))errors.push(`${path}.${key}: concrete design detail required`);};
  const timed=(v:Record<string,unknown>,extent:unknown,frameKey:string,path:string)=>{
    if(!inside([0,value.durationInFrames],v.cueRange))errors.push(`${path}.cueRange: use the film's actual semantic frame window`);
    const frame=v[frameKey];
    if(!range(extent)||!Number.isSafeInteger(frame)||Number(frame)<extent[0]||Number(frame)>=extent[1])errors.push(`${path}.${frameKey}: must lie in the shot/interface`);
    else if(range(v.cueRange)&&(Number(frame)<v.cueRange[0]||Number(frame)>=v.cueRange[1])&&!detail(v.timingReason))errors.push(`${path}.timingReason: explain anticipation or delayed landing`);
  };
  if(value.execution!==undefined||required){
    if(!object(value.execution))errors.push('execution: declare layers-2.5d or custom and the required capabilities');
    else{
      rejectUnknown(value.execution,['renderer','reason','requirements'],'execution',errors);
      if(!['layers-2.5d','custom'].includes(String(value.execution.renderer)))errors.push('execution.renderer: unsupported renderer');
      words(value.execution,['reason'],'execution');
      if(!Array.isArray(value.execution.requirements)||!value.execution.requirements.length||!value.execution.requirements.every(detail))errors.push('execution.requirements: record the actual implementation needs');
    }
  }
  if(value.designRationale!==undefined||required){
    if(!object(value.designRationale))errors.push('designRationale: explain the design choice, not just effect names');
    else words(value.designRationale,['basis','alternatives','choice','perception','risk'],'designRationale');
  }
  const shots=Array.isArray(value.shots)?value.shots.filter(object):[];
  const layers=Array.isArray(value.layers)?value.layers.filter(object):[];
  const layerAt=(id:unknown,frame:number)=>layers.some(l=>l.id===id&&Number(l.from)<=frame&&frame<Number(l.to));
  const shotIds=shots.map(s=>s.id);
  const contract=required||value.transitions!==undefined||value.gatePlans!==undefined||shots.some(s=>s.intent!==undefined);
  if(!contract)return errors;
  if(Array.isArray(value.cues)&&value.cues.length===0&&!detail(value.audioReason))errors.push('audioReason: explain deliberate silence');
  const changes=new Set(['structure','contour','relationship','function','reveal','position','scale','opacity','text','emphasis','hold']);
  for(const [i,s] of shots.entries()){
    const p=`shots[${i}]`,extent=[s.from,s.to];
    words(s,['meaning','identity'],p);
    if(!['transformation','handoff','demonstration','hold'].includes(String(s.kind)))errors.push(`${p}.kind: choose the actual expression kind`);
    if(!Array.isArray(s.changes)||!s.changes.length||s.changes.some(c=>typeof c!=='string'||!changes.has(c)))errors.push(`${p}.changes: declare actual change categories`);
    else if(s.kind==='transformation'&&!s.changes.some(c=>['structure','contour','relationship','function'].includes(String(c))))errors.push(`${p}.changes: cosmetic motion cannot certify a transformation`);
    if(s.kind==='hold')words(s,['holdReason'],p);
    if(s.reading===null)words(s,['noReadingReason'],p);
    else if(!inside(extent,s.reading))errors.push(`${p}.reading: explicit reading range must fit the shot, or use null with a reason`);
    if(!object(s.intent)){errors.push(`${p}.intent: intent chain required`);continue;}
    const intent=s.intent;
    words(intent,['cue','before','after','why','visualBridge','focusBefore','focusAfter'],p+'.intent');
    if(!['speech','screen_text','gesture','brief'].includes(String(intent.sourceKind)))errors.push(`${p}.intent.sourceKind: unsupported cue source`);
    if(s.kind!=='hold'&&detail(intent.before)&&String(intent.before).trim().toLowerCase()===String(intent.after).trim().toLowerCase())errors.push(`${p}.intent: explain progression or declare a motivated hold`);
    timed(intent,extent,'revealFrame',p+'.intent');
    if(!layerAt(intent.focusBefore,Number(s.from))||!layerAt(intent.focusAfter,Number(s.to)-1))errors.push(`${p}.intent: focus IDs must reference layers present at the shot's first/last frame`);
  }
  const transitions=Array.isArray(value.transitions)?value.transitions.filter(object):[];
  if(!Array.isArray(value.transitions)||transitions.length!==value.transitions.length||transitions.length!==Math.max(0,shots.length-1))errors.push('transitions: one complete interface per adjacent shot pair required');
  const ids=new Set(shotIds);
  for(const [i,tr] of transitions.entries()){
    const p=`transitions[${i}]`,previous=shots[i],next=shots[i+1];
    words(tr,['id','method','reason','identity','motion'],p);
    if(ids.has(tr.id))errors.push(`${p}.id: SH/TR IDs must be distinct`);ids.add(tr.id);
    if(!previous||!next||tr.fromShot!==previous.id||tr.toShot!==next.id){errors.push(`${p}: must join the adjacent SH pair in timeline order`);continue;}
    if(!inside([previous.from,next.to],tr.range)||!range(tr.range)||!(tr.range[0]<Number(next.from)&&Number(next.from)<tr.range[1]))errors.push(`${p}.range: must straddle the cut within the adjacent shots`);
    if(!object(tr.handoff)){errors.push(`${p}.handoff: attention relay required`);continue;}
    const h=tr.handoff;
    words(h,['outgoing','incoming','exit','entry','meaningBridge','cue'],p+'.handoff');
    if(!['same_subject','new_subject','intentional_cut'].includes(String(h.kind)))errors.push(`${p}.handoff.kind: unsupported handoff`);
    if(h.kind==='same_subject'&&h.outgoing!==h.incoming||h.kind==='new_subject'&&h.outgoing===h.incoming)errors.push(`${p}.handoff: subject identity contradicts the handoff kind`);
    if(!object(previous.intent)||!object(next.intent)||h.outgoing!==previous.intent.focusAfter||h.incoming!==next.intent.focusBefore)errors.push(`${p}.handoff: must match the SH focus chain`);
    timed(h,tr.range,'focusFrame',p+'.handoff');
  }
  if(!object(value.gatePlans))errors.push('gatePlans: production plans for all eight specialists required');
  else for(const name of gateNames){
    const g=value.gatePlans[name],p=`gatePlans.${name}`;
    if(!object(g)){errors.push(`${p}: plan required`);continue;}
    rejectUnknown(g,['applicable','reason','plan','targets'],p,errors);
    words(g,['reason','plan'],p);
    const available=name==='handoff'?transitions.map(t=>t.id):name==='camera'?[...shotIds,...transitions.map(t=>t.id)]:shotIds;
    const mandatory=['design','animation','camera','color','soundfx'].includes(name)||name==='handoff'&&transitions.length>0;
    if(typeof g.applicable!=='boolean'||mandatory&&!g.applicable)errors.push(`${p}.applicable: mandatory gates cannot be disabled`);
    if(name==='denoise'&&Array.isArray(value.cues)&&value.cues.length===0&&g.applicable)errors.push(`${p}: silent films require an evidenced denoise N/A decision later`);
    if(!Array.isArray(g.targets)||new Set(g.targets).size!==g.targets.length||g.targets.some(t=>!available.includes(t))||g.applicable&&(!g.targets.length||mandatory&&g.targets.length!==available.length)||g.applicable===false&&g.targets.length)errors.push(`${p}.targets: exact affected SH/TR coverage required`);
  }
  errors.push(...validateExecutionBindings(value,contract));
  return errors;
}
