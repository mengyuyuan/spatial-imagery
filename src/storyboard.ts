export interface Asset {
  id: string; kind: 'video'|'audio'|'image'|'model'|'font'|'code'|'reference'; title: string;
  source: string; license: string; tags: string[]; local?: string; sha256?: string;
  availability: 'local'|'reference'; redistribution: 'allowed'|'forbidden'|'unknown';
  duration?: number; review: 'unreviewed'|'technical'|'reviewed';
}
export interface Shot {
  id: string; from: number; to: number; state: 'A'|'B'|'full'; keyword: string;
  subject: string; initial: string; action: string; result: string;
  camera: string; sound: string; assets: string[]; readFrames: number;
  handoff?: {to: string; method: string; continuity: string};
}
export type VideoType = 'talking-head'|'general';
export interface Plan {version: 1; videoType: VideoType; title: string; fps: number; durationInFrames: number; shots: Shot[]; assets: Asset[]}
export interface Issue {path: string; message: string; severity: 'error'|'warning'}
const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const integer = (v: unknown): v is number => Number.isSafeInteger(v);
const kinds = ['video','audio','image','model','font','code','reference'];
/** Validates untrusted JSON without executing it; interval convention is [from,to). */
export function validatePlan(value: unknown): Issue[] {
  const issues: Issue[]=[];
  const error=(path:string,message:string)=>issues.push({path,message,severity:'error'});
  const warning=(path:string,message:string)=>issues.push({path,message,severity:'warning'});
  if (!obj(value)) return [{path:'$',message:'Expected an object',severity:'error'}];
  if (value.version!==1) error('version','Supported schema version is 1');
  if (typeof value.videoType!=='string'||!['talking-head','general'].includes(value.videoType)) error('videoType','Explicit talking-head or general required; only talking-head may use A/B states');
  if (!text(value.title)) error('title','Title is required');
  if (typeof value.fps!=='number'||!Number.isFinite(value.fps)||value.fps<=0||value.fps>240) error('fps','FPS must be > 0 and <= 240');
  if (!integer(value.durationInFrames)||value.durationInFrames<=0) error('durationInFrames','Positive integer required');
  const assets = new Map<string,Record<string,unknown>>();
  if (!Array.isArray(value.assets)) error('assets','Expected an array');
  else value.assets.forEach((asset,i)=>{
    const p=`assets[${i}]`;
    if (!obj(asset)) {error(p,'Expected an object');return;}
    for(const k of ['id','title','source','license']) if (!text(asset[k])) error(`${p}.${k}`,'Required nonempty text');
    if (text(asset.id)) {if(assets.has(asset.id)) error(p+'.id','Duplicate asset ID'); assets.set(asset.id,asset);}
    if (!kinds.includes(String(asset.kind))) error(p+'.kind','Unknown asset kind');
    if (!['local','reference'].includes(String(asset.availability))) error(p+'.availability','Unknown availability');
    if (!['allowed','forbidden','unknown'].includes(String(asset.redistribution))) error(p+'.redistribution','Unknown redistribution status');
    if (!['unreviewed','technical','reviewed'].includes(String(asset.review))) error(p+'.review','Unknown review status');
    if (!Array.isArray(asset.tags)||asset.tags.some(t=>!text(t))) error(p+'.tags','Expected string tags');
    if (asset.availability==='local'&&(!text(asset.local)||!text(asset.sha256)||!/^[0-9a-f]{64}$/i.test(asset.sha256))) error(p,'Local assets need a path and SHA256');
    if (asset.duration!==undefined && (typeof asset.duration!=='number'||!Number.isFinite(asset.duration)||asset.duration<=0)) error(p+'.duration','Positive finite duration required');
    if (asset.redistribution==='unknown') warning(p+'.redistribution','Verify license before publication');
  });
  if (!Array.isArray(value.shots)||!value.shots.length) {error('shots','At least one shot required');return issues;}
  let cursor=0;
  const shots = new Map<string,Record<string,unknown>>();
  value.shots.forEach((shot,i)=>{
    const p=`shots[${i}]`;
    if(!obj(shot)){error(p,'Expected an object');return;}
    for(const k of ['id','keyword','subject','initial','action','result','camera','sound']) if(!text(shot[k])) error(`${p}.${k}`,'Required nonempty text');
    if(text(shot.id)){if(shots.has(shot.id))error(p+'.id','Duplicate shot ID');shots.set(shot.id,shot);}
    if(typeof shot.state!=='string'||!['A','B','full'].includes(shot.state))error(p+'.state','Expected A, B or full');
    if((shot.state==='A'||shot.state==='B')&&value.videoType!=='talking-head')error(p+'.state','A/B states are reserved for talking-head videos; use full for other films');
    if(!integer(shot.from)||!integer(shot.to)||shot.from<0||shot.to<=shot.from)error(p,'Invalid [from,to) frame range');
    else {
      if(shot.from!==cursor)error(p+'.from',`Expected ${cursor}; shots must cover the timeline without gaps/overlaps`);
      cursor=shot.to;
      if(!integer(shot.readFrames)||shot.readFrames<0||shot.readFrames>shot.to-shot.from)error(p+'.readFrames','Reading window must fit inside the shot');
    }
    if(!Array.isArray(shot.assets)||shot.assets.some(a=>typeof a!=='string'||!assets.has(a)))error(p+'.assets','Unknown asset reference or invalid array');
    else for(const id of shot.assets as string[])if(assets.get(id)?.availability==='reference')warning(p+'.assets',`${id} is a link, not acquired media`);
    if(shot.handoff!==undefined){
      if(!obj(shot.handoff))error(p+'.handoff','Expected object');
      else for(const k of ['to','method','continuity'])if(!text(shot.handoff[k]))error(`${p}.handoff.${k}`,'Required handoff detail');
    }
  });
  if(cursor!==value.durationInFrames)error('durationInFrames',`Last shot ends at ${cursor}`);
  value.shots.forEach((s,i)=>{if(obj(s)&&obj(s.handoff)) {
    const next=value.shots as unknown[];
    const n=next[i+1];
    if(!obj(n)||s.handoff.to!==n.id)error(`shots[${i}].handoff.to`,'Handoff must target the next shot');
  }});
  return issues;
}
export function definePlan(plan: Plan): Plan {
  const errors=validatePlan(plan).filter(i=>i.severity==='error');
  if(errors.length)throw new Error(errors.map(i=>`${i.path}: ${i.message}`).join('\n'));
  return structuredClone(plan);
}
export function shotAt(plan: Plan, frame: number): Shot | undefined {
  if(!Number.isFinite(frame))throw new RangeError('Finite frame required');
  return plan.shots.find(s=>frame>=s.from&&frame<s.to);
}
/** All terms must match; reference-only results remain explicitly reference-only. */
export function searchAssets(assets: readonly Asset[], query: string, options: {kind?: Asset['kind']; localOnly?: boolean} = {}): Asset[] {
  const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return assets.filter(a=>(!options.kind||a.kind===options.kind)&&(!options.localOnly||a.availability==='local')&&terms.every(t=>[a.id,a.title,...a.tags].join(' ').toLocaleLowerCase().includes(t)));
}
