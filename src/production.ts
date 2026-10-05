import {validatePlan, type Plan, type Asset} from './storyboard.js';
import {validateCue,resolveMixPolicy,type MixPolicy,type SoundCue} from './audio.js';
import {validateStaging} from './staging.js';
export {validateStaging,layerBounds,channelValue,type Staging,type Takeover} from './staging.js';
export {validateExecutionBindings,type ExecutionBinding} from './execution.js';
import {validateDesignContract,rejectUnknown,type DesignedShot,type DesignedTransition,type GateName,type GatePlan,type DesignRationale,type ExecutionPlan} from './design-contract.js';
export type {DesignedShot,DesignedTransition,GateName,GatePlan,DesignRationale,ExecutionPlan,Intent} from './design-contract.js';

export interface ScriptLine {id:string; text:string}
/** Line-ending normalization keeps designs portable between Windows and Unix checkouts. */
export const normalizeScript=(script:string)=>script.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
export function scriptLines(script:string):ScriptLine[] {
  return normalizeScript(script).split('\n').map(s=>s.trim()).filter(s=>s && !/^#\s/.test(s))
    .map((text,i)=>({id:`L${String(i+1).padStart(3,'0')}`,text}));
}
export type Channel = number | {frame:number; value:number; easing?:'smooth'|'linear'}[];
export interface Layer {
  id:string; type:'text'|'rect'|'ellipse'|'path'|'image'|'video'; from:number; to:number;
  space?:'world'|'screen'; text?:string; asset?:string; sourceIn?:number; path?:string; transparent?:boolean;
  fill?:string; stroke?:string; fontFamily?:string; fontSize?:number; fontWeight?:number;
  align?:'left'|'center'|'right'; fit?:'cover'|'contain';
  x?:Channel; y?:Channel; z?:Channel; width?:Channel; height?:Channel; opacity?:Channel;
  scale?:Channel; rotateX?:Channel; rotateY?:Channel; rotateZ?:Channel; radius?:Channel; reveal?:Channel;
  strokeWidth?:number;
}
export interface ProductionCue extends Omit<SoundCue,'intensity'> {
  role:'music'|'motion'|'contact'|'narration'; intensity?:Channel;
}
export interface FilmDesign extends Omit<Plan,'assets'|'shots'> {
  scriptSha256:string; width:number; height:number; background:string;
  direction:string; shots:DesignedShot[];
  designRationale?:DesignRationale; execution?:ExecutionPlan; transitions?:DesignedTransition[];
  gatePlans?:Record<GateName,GatePlan>; audioReason?:string;
  mix?:MixPolicy;
  camera?:{x?:Channel;y?:Channel;zoom?:Channel;rotateZ?:Channel;perspective?:number};
  layers:Layer[]; cues:ProductionCue[];
}
export interface ProductionAsset extends Asset {
  download?:string; author?:string; licenseUrl?:string;
}
export interface ProductionPolicy {
  music:'allowed'|'off'; narration:'off'|'provided'; footage:'required'|'optional';
}
export const defaultPolicy:ProductionPolicy={music:'allowed',narration:'off',footage:'required'};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const channels=['x','y','z','width','height','opacity','scale','rotateX','rotateY','rotateZ','radius','reveal'];
function checkChannel(v:unknown,frames:number,path:string,errors:string[],range?:[number,number]) {
  const check=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)&&(!range||(n>=range[0]&&n<=range[1]));
  if(typeof v==='number'){if(!check(v))errors.push(`${path}: value out of range`);return;}
  if(!Array.isArray(v)||!v.length){errors.push(`${path}: expected a number or keyframes`);return;}
  let previous=-1;
  for(const k of v){
    if(!object(k)||!Number.isSafeInteger(k.frame)||Number(k.frame)<0||Number(k.frame)>frames||Number(k.frame)<=previous||!check(k.value)||k.easing!==undefined&&!['smooth','linear'].includes(String(k.easing))) {
      errors.push(`${path}: finite, ordered global frame keys required`);return;
    }
    rejectUnknown(k,['frame','value','easing'],path,errors);
    previous=Number(k.frame);
  }
}
/** Checks generated JSON before it becomes a project. No model-produced code is executed. */
export function validateFilm(value:unknown,lines:readonly ScriptLine[],assets:readonly ProductionAsset[],hash:string,policy:ProductionPolicy=defaultPolicy,options:{requireDesignContract?:boolean}={}):string[] {
  if(!object(value))return ['Design must be a JSON object'];
  const errors:string[]=[];
  errors.push(...validateDesignContract(value,options.requireDesignContract));
  if(value.scriptSha256!==hash)errors.push('scriptSha256: design belongs to another script; regenerate it');
  for(const key of ['width','height'])if(!Number.isSafeInteger(value[key])||Number(value[key])<16||Number(value[key])%2!==0)errors.push(`${key}: positive even size >=16 required`);
  if(typeof value.background!=='string'||!/^#[0-9a-f]{6}$/i.test(value.background))errors.push('background: use a six-digit hex color');
  if(typeof value.direction!=='string'||!value.direction.trim())errors.push('direction: explain the visual and sound direction');
  const refs=new Map(assets.map(a=>[a.id,a]));
  errors.push(...validatePlan({...value,assets}).filter(i=>i.severity==='error').map(i=>`${i.path}: ${i.message}`));
  const frames=Number(value.durationInFrames), fps=Number(value.fps);
  if(value.mix!==undefined){
    try{resolveMixPolicy(value.mix);}catch(e){errors.push(e instanceof Error?e.message:'Invalid mix policy');}
  }
  const knownLines=new Set(lines.map(l=>l.id)),covered=new Set<string>();
  if(Array.isArray(value.shots))for(const shot of value.shots){
    if(!object(shot)||!Array.isArray(shot.lines)||!shot.lines.length||shot.lines.some(id=>typeof id!=='string'||!knownLines.has(id)))errors.push('shots: every shot must reference real input line IDs');
    else for(const id of shot.lines)covered.add(String(id));
  }
  for(const id of knownLines)if(!covered.has(id))errors.push(`Script line ${id} is not covered`);
  const seen=new Set<string>(),used=new Set<string>();
  if(!Array.isArray(value.layers)||!value.layers.length)errors.push('layers: at least one visible layer required');
  else for(const [i,l] of value.layers.entries()){
    const p=`layers[${i}]`;
    if(!object(l)){errors.push(`${p}: expected object`);continue;}
    rejectUnknown(l,['id','type','from','to','space','text','asset','sourceIn','transparent','path','fill','stroke','fontFamily','fontSize','fontWeight','align','fit','strokeWidth',...channels],p,errors);
    if(l.transparent!==undefined&&(l.type!=='video'||typeof l.transparent!=='boolean'))errors.push(`${p}.transparent: only video accepts a boolean alpha-decode flag`);
    if(typeof l.id!=='string'||!/^[\w-]+$/.test(l.id)||seen.has(l.id))errors.push(`${p}: unique safe ID required`);
    seen.add(String(l.id));
    if(!['text','rect','ellipse','path','image','video'].includes(String(l.type)))errors.push(`${p}: unsupported layer type`);
    if(!Number.isSafeInteger(l.from)||!Number.isSafeInteger(l.to)||Number(l.from)<0||Number(l.to)<=Number(l.from)||Number(l.to)>frames)errors.push(`${p}: invalid frame interval`);
    if(l.space!==undefined&&!['world','screen'].includes(String(l.space)))errors.push(`${p}: invalid space`);
    if(l.align!==undefined&&!['left','center','right'].includes(String(l.align)))errors.push(`${p}: unsupported text alignment`);
    if(l.fit!==undefined&&!['cover','contain'].includes(String(l.fit)))errors.push(`${p}: unsupported media fit`);
    if(l.type==='text'&&(typeof l.text!=='string'||!l.text.trim()))errors.push(`${p}: text is required`);
    if(l.type==='path'&&(typeof l.path!=='string'||!l.path.trim()))errors.push(`${p}: SVG path data is required`);
    if(l.asset!==undefined&&l.type!=='video'&&l.type!=='image')errors.push(`${p}.asset: only media layers execute asset references`);
    for(const key of ['fill','stroke'])if(l[key]!==undefined&&(typeof l[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(String(l[key]))&&l[key]!=='none'))errors.push(`${p}.${key}: use hex color or none`);
    for(const key of ['fontSize','fontWeight','strokeWidth'])if(l[key]!==undefined&&(typeof l[key]!=='number'||!Number.isFinite(l[key])||Number(l[key])<=0))errors.push(`${p}.${key}: positive number required`);
    for(const key of channels)if(l[key]!==undefined)checkChannel(l[key],frames,`${p}.${key}`,errors,['opacity','reveal'].includes(key)?[0,1]:['width','height','scale','radius'].includes(key)?[0,Infinity]:undefined);
    if(l.type==='video'||l.type==='image'){
      const a=refs.get(String(l.asset));if(!a||a.kind!==l.type)errors.push(`${p}: missing ${l.type} asset`);else used.add(a.id);
      if(l.type==='video'&&a){const t=Number(l.sourceIn??0);if(!Number.isFinite(t)||t<0||!a.duration||t+(Number(l.to)-Number(l.from))/fps>a.duration+1e-6)errors.push(`${p}: video source range exceeds asset duration`);}
    }
  }
  if(object(value.camera)){
    rejectUnknown(value.camera,['x','y','zoom','rotateZ','perspective'],'camera',errors);
    for(const key of ['x','y','zoom','rotateZ'])if(value.camera[key]!==undefined)checkChannel(value.camera[key],frames,`camera.${key}`,errors,key==='zoom'?[.01,Infinity]:undefined);
    if(value.camera.perspective!==undefined&&(!(typeof value.camera.perspective==='number')||!Number.isFinite(value.camera.perspective)||value.camera.perspective<1))errors.push('camera.perspective: positive number required');
  }else if(value.camera!==undefined)errors.push('camera: expected object');
  const cueIds=new Set<string>();
  if(!Array.isArray(value.cues))errors.push('cues: expected array');
  else for(const [i,c] of value.cues.entries()){
    if(!object(c)){errors.push(`cues[${i}]: expected object`);continue;}
    try{validateCue(c as unknown as SoundCue);}catch{errors.push(`cues[${i}]: invalid audio envelope`);}
    if(typeof c.id!=='string'||!c.id.trim()||cueIds.has(c.id))errors.push(`cues[${i}]: unique ID required`);cueIds.add(String(c.id));
    if(!['music','motion','contact','narration'].includes(String(c.role)))errors.push(`cues[${i}]: role required`);
    if(c.role==='music'&&policy.music==='off')errors.push('Music is disabled for this project');
    if(c.role==='narration'&&policy.narration==='off')errors.push('Narration is disabled for this project');
    const a=refs.get(String(c.asset));
    if(!a||a.kind!=='audio')errors.push(`cues[${i}]: unknown audio asset`);
    else {used.add(a.id);if(!a.duration||Number(c.sourceIn)+Number(c.end)-Number(c.start)>a.duration+1e-6)errors.push(`cues[${i}]: source audio too short; choose a longer source or edit timing`);}
    if(Number(c.end)>frames/fps)errors.push(`cues[${i}]: extends past film`);
    if(c.intensity!==undefined)checkChannel(c.intensity,frames,`cues[${i}].intensity`,errors,[0,1]);
  }
  if(policy.narration==='provided'&&(!Array.isArray(value.cues)||!value.cues.some(c=>object(c)&&c.role==='narration')))errors.push('Provided narration requires a narration cue');
  if(policy.footage==='required'&&(!Array.isArray(value.layers)||!value.layers.some(l=>object(l)&&l.type==='video')))errors.push('Footage required: select and use an appropriate acquired video');
  if(Array.isArray(value.shots)&&Array.isArray(value.layers))for(const s of value.shots){
    if(object(s)&&!value.layers.some(l=>object(l)&&Number(l.from)<=Number(s.from)&&Number(l.to)>=Number(s.to)))errors.push(`Shot ${String(s.id)} has no layer covering its whole duration`);
    if(object(s)&&Array.isArray(s.assets))for(const id of s.assets){
      const shown=value.layers.some(l=>object(l)&&(l.type==='image'||l.type==='video')&&l.asset===id&&Number(l.from)<Number(s.to)&&Number(s.from)<Number(l.to));
      const heard=Array.isArray(value.cues)&&value.cues.some(c=>object(c)&&c.asset===id&&Number(c.start)*fps<Number(s.to)&&Number(s.from)<Number(c.end)*fps);
      if(!shown&&!heard)errors.push(`Shot ${String(s.id)} asset ${String(id)}: must actually be used during this shot by a layer or cue`);
    }
  }
  for(const id of used){const a=refs.get(id)!;if(a.license==='unknown'||a.redistribution==='unknown')errors.push(`${id}: license/use conditions must be recorded before rendering`);if(!a.local&&!a.download)errors.push(`${id}: reference link is not acquired media`);}
  if(!errors.length)errors.push(...validateStaging(value,assets));
  return errors;
}
