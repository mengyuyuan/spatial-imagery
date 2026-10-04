import {track,linear,smooth} from './motion.js';

/** Screen-space contracts for presenter/content staging; never an aesthetic verdict. */
export interface Staging {
  scene:string; purpose:string; framing:string;
  presenterLayers:string[]; contentLayers:string[]; environmentLayers:string[];
  landing:[number,number];
  protectedLayers:string[];
}
export interface Takeover {
  environment:'retained'|'reframed'|'transformed'|'replaced';
  reason:string; reveal:string; bridge:string; completionFrame:number;
  proofLayers:string[];
}
type Row=Record<string,any>;
const object=(v:unknown):v is Row=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown)=>typeof v==='string'&&!!v.trim()&&!/^(todo|tbd|pending|待填|待验证)$/i.test(v.trim());
const ids=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(text)&&new Set(v).size===v.length;
const range=(v:unknown):v is [number,number]=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=0&&v[1]>v[0];
const overlaps=(a:Row,b:Row)=>a.from<b.to&&b.from<a.to;
const samplers=new WeakMap<object,(f:number)=>number>();
export function channelValue(c:any,f:number,fallback:number):number {
  if(c===undefined)return fallback;
  if(typeof c==='number')return c;
  let fn=samplers.get(c);
  if(!fn){fn=track(c.map((k:Row)=>({time:k.frame,value:k.value,easing:k.easing==='linear'?linear:smooth})));samplers.set(c,fn);}
  return fn!(f);
}
export type Bounds={left:number;top:number;right:number;bottom:number};
const area=(b:Bounds|null)=>b?Math.max(0,b.right-b.left)*Math.max(0,b.bottom-b.top):0;
const intersect=(a:Bounds,b:Bounds):Bounds=>({left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)});
// Union area, not an enclosing box: distant tiny objects must not claim the empty gap.
const coveredArea=(boxes:Bounds[])=>{
  const xs=[...new Set(boxes.flatMap(b=>[b.left,b.right]))].sort((a,b)=>a-b);let total=0;
  for(let i=1;i<xs.length;i++){
    const x0=xs[i-1]!,x1=xs[i]!,ys=boxes.filter(b=>b.left<x1&&b.right>x0).map(b=>[b.top,b.bottom]).sort((a,b)=>a[0]!-b[0]!);
    let end=-Infinity,height=0;
    for(const [top,bottom] of ys){height+=Math.max(0,bottom!-Math.max(top!,end));end=Math.max(end,bottom!);}
    total+=(x1-x0)*height;
  }
  return total;
};

/** Conservative projected rectangle for the bundled CSS renderer (alpha holes are occupied).
 * Geometry follows its transform order, origin, camera and reveal clipping. Custom meshes
 * need actual encoded-frame review; these rectangles do not measure perceptual salience.
 */
export function layerBounds(l:Row,f:number,d:Row):Bounds|null {
  if(f<l.from||f>=l.to||channelValue(l.opacity,f,1)<=0)return null;
  const w=channelValue(l.width,f,d.width),h=channelValue(l.height,f,d.height),s=channelValue(l.scale,f,1),r=channelValue(l.reveal,f,1);
  if(w<=0||h<=0||s<=0||r<=0)return null;
  const angle=(v:number)=>v*Math.PI/180,rx=angle(channelValue(l.rotateX,f,0)),ry=angle(channelValue(l.rotateY,f,0)),rz=angle(channelValue(l.rotateZ,f,0));
  if(Math.cos(rx)*Math.cos(ry)<=0)return null; // backface-visibility:hidden
  const rotate=(x:number,y:number,z:number)=>{
    const a=x*Math.cos(rz)-y*Math.sin(rz),b=x*Math.sin(rz)+y*Math.cos(rz);
    const c=a*Math.cos(ry)+z*Math.sin(ry),e=-a*Math.sin(ry)+z*Math.cos(ry);
    return [c,b*Math.cos(rx)-e*Math.sin(rx),b*Math.sin(rx)+e*Math.cos(rx)];
  };
  const camera=d.camera??{},cx=d.width/2,cy=d.height/2;
  const points=[];
  for(const x of [-w/2,w*(r-.5)])for(const y of [-h/2,h/2]){
    let [px,py,pz]=rotate(x*s,y*s,0) as [number,number,number];
    px+=channelValue(l.x,f,cx);py+=channelValue(l.y,f,cy);pz+=channelValue(l.z,f,0);
    if(l.space!=='screen'){
      const a=angle(-channelValue(camera.rotateZ,f,0)),zoom=channelValue(camera.zoom,f,1);
      const x0=px-cx-channelValue(camera.x,f,0),y0=py-cy-channelValue(camera.y,f,0);
      const distance=camera.perspective??1400;
      if(pz>=distance)throw Error('layer crosses the CSS perspective plane; use a custom renderer and encoded review');
      const p=distance/(distance-pz);
      px=cx+(x0*Math.cos(a)-y0*Math.sin(a))*zoom*p;py=cy+(x0*Math.sin(a)+y0*Math.cos(a))*zoom*p;
    }
    points.push([px,py]);
  }
  const box=intersect({left:Math.min(...points.map(p=>p[0]!)),top:Math.min(...points.map(p=>p[1]!)),right:Math.max(...points.map(p=>p[0]!)),bottom:Math.max(...points.map(p=>p[1]!))},{left:0,top:0,right:d.width,bottom:d.height});
  return area(box)>0?box:null;
}

export function validateStaging(value:unknown):string[]{
  if(!object(value)||!Array.isArray(value.shots)||!Array.isArray(value.layers))return [];
  const d=value,shots=d.shots.filter(object),layers=d.layers.filter(object),byId=new Map<string,Row>(layers.map((l:Row)=>[l.id,l]));
  const errors:string[]=[],valid=new Set<string>();
  const fail=(p:string,m:string)=>errors.push(`${p}: ${m}`);
  for(const shot of shots){
    if(!['A','B'].includes(shot.state))continue;
    const p=`shot ${shot.id} staging`,s=shot.staging;
    if(!object(s)){fail(p,'A/B requires an executable presenter/content staging contract');continue;}
    const count=errors.length;
    for(const k of ['scene','purpose','framing'])if(!text(s[k]))fail(p,`${k} needs a concrete decision`);
    for(const key of ['presenterLayers','contentLayers','environmentLayers','protectedLayers']){
      if(!ids(s[key])){fail(p,`${key} needs unique layer IDs`);continue;}
      for(const id of s[key])if(!byId.has(id)||!overlaps(byId.get(id)!,shot))fail(p,`${key} references an absent layer: ${id}`);
    }
    if(!range(s.landing)||s.landing[0]<shot.from||s.landing[1]>shot.to)fail(p,'landing must fit the shot');
    if(errors.length!==count)continue;
    if(!s.presenterLayers.length||s.presenterLayers.some((id:string)=>byId.get(id)!.type!=='video'))fail(p,'presenterLayers must reference actual moving presenter video, not an image/shape');
    const roles=[...s.presenterLayers,...s.contentLayers,...s.environmentLayers];
    if(new Set(roles).size!==roles.length)fail(p,'presenter, content and environment roles must be disjoint');
    if(s.protectedLayers.some((id:string)=>s.presenterLayers.includes(id)||s.environmentLayers.includes(id)))fail(p,'protected information cannot be the presenter or background');
    if(shot.state==='B'&&!s.contentLayers.length)fail(p,'B needs real primary content');
    if(!s.contentLayers.every((id:string)=>s.protectedLayers.includes(id)))fail(p,'A/B must protect its information layers; use environment roles only for decoration');
    for(const l of layers)if(l.type==='text'&&overlaps(l,shot)&&!s.protectedLayers.includes(l.id))fail(p,`text layer ${l.id} needs presenter clearance`);
    const focus=shot.state==='A'?s.presenterLayers:s.contentLayers;
    if(!object(shot.intent)||!focus.includes(shot.intent.focusAfter))fail(p,'landing focus must match A presenter / B content priority');
    if(errors.length===count)valid.add(shot.id);
  }
  if(errors.length)return errors;
  const boxes=(s:Row,key:string,f:number)=>s[key].map((id:string)=>layerBounds(byId.get(id)!,f,d)).filter((b:Bounds|null):b is Bounds=>!!b);
  const custom=d.execution?.renderer==='custom';
  if(!custom)for(const shot of shots){
    if(!valid.has(shot.id))continue;
    const s=shot.staging,p=`shot ${shot.id} staging`;
    try{
      // All visible frames, including handoff frames, not just the reading landing.
      for(let f=shot.from;f<shot.to;f++){
        const people=boxes(s,'presenterLayers',f);
        const covered=s.protectedLayers.find((id:string)=>{const b=layerBounds(byId.get(id)!,f,d);return b&&people.some((a:Bounds)=>area(intersect(a,b))>1e-6);});
        if(covered){fail(p,`presenter overlaps protected information ${covered} at frame ${f}; recompose/crop/move the presenter`);break;}
        if(f>=s.landing[0]&&f<s.landing[1]){
          const person=coveredArea(people),content=coveredArea(boxes(s,'contentLayers',f));
          if(person<=0||shot.state==='B'&&content<=person||shot.state==='A'&&person<=content){fail(p,`A/B primary subject does not own the planned landing at frame ${f}`);break;}
        }
      }
    }catch(e){fail(p,e instanceof Error?e.message:'Cannot evaluate staging geometry');}
  }
  const transitions=Array.isArray(d.transitions)?d.transitions.filter(object):[];
  for(let i=1;i<shots.length;i++){
    const a=shots[i-1]!,b=shots[i]!;
    if(!['A','B'].includes(a.state)||!['A','B'].includes(b.state)||a.state===b.state)continue;
    const p=`handoff ${a.id}->${b.id}`,tr=transitions.find((t:Row)=>t.fromShot===a.id&&t.toShot===b.id),t=tr?.takeover;
    if(!object(t)){fail(p,'A/B switch requires takeover: environment decision, reveal, bridge and proof layers');continue;}
    for(const k of ['reason','reveal','bridge'])if(!text(t[k]))fail(p,`${k} needs a concrete takeover decision`);
    if(!['retained','reframed','transformed','replaced'].includes(t.environment))fail(p,'choose the actual environment treatment; a new backdrop is not mandatory');
    if(!Number.isSafeInteger(t.completionFrame)||t.completionFrame<b.from||t.completionFrame>=b.to)fail(p,'completionFrame must locate the takeover in the destination shot');
    if(!range(tr?.range)||t.completionFrame<tr.range[0]||t.completionFrame>=tr.range[1])fail(p,'completionFrame must be covered by the reviewed transition range');
    if(!valid.has(a.id)||!valid.has(b.id))continue;
    if(t.completionFrame>b.staging.landing[0])fail(p,'takeover must complete before the destination landing');
    const content=[...a.staging.contentLayers,...b.staging.contentLayers],people=[...a.staging.presenterLayers,...b.staging.presenterLayers];
    if(!ids(t.proofLayers)||!t.proofLayers.length||t.proofLayers.some((id:string)=>!content.includes(id)||people.includes(id))){fail(p,'proofLayers must identify actual non-presenter content');continue;}
    if(!custom)try{
      const frame=(s:Row)=>Math.floor((s.landing[0]+s.landing[1]-1)/2);
      // IDs, declarations, scene names and presenter-only motion cannot satisfy this test.
      const signature=(f:number)=>t.proofLayers.flatMap((id:string)=>{
        const l=byId.get(id)!,box=layerBounds(l,f,d);if(!box)return [];
        return [JSON.stringify({type:l.type,asset:l.asset,text:l.text,path:l.path,fill:l.fill,stroke:l.stroke,box:Object.values(box).map(n=>Math.round(n*100)/100),rotation:[l.rotateX,l.rotateY,l.rotateZ].map(c=>channelValue(c,f,0)),radius:channelValue(l.radius,f,0),reveal:channelValue(l.reveal,f,1)})];
      }).sort();
      if(JSON.stringify(signature(frame(a.staging)))===JSON.stringify(signature(frame(b.staging))))fail(p,'only presenter/layout labels changed; content/view must actually take over and return');
    }catch(e){fail(p,e instanceof Error?e.message:'Cannot evaluate takeover');}
  }
  return errors;
}
