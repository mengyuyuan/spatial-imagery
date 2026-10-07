import {channelValue} from './staging.js';

/** Bind a creative promise to executable channels; never an aesthetic approval. */
export interface ExecutionBinding {
  mode:'animated'|'hold'; subject:string; channels:string[]; reason:string;
}
type Row=Record<string,any>;
const object=(v:unknown):v is Row=>!!v&&typeof v==='object'&&!Array.isArray(v);
const detail=(v:unknown)=>typeof v==='string'&&!!v.trim()&&!/^(todo|tbd|pending|待填|待填写|待验证|待实现)$/i.test(v.trim());
const motionKeys=['x','y','z','width','height','scale','rotateX','rotateY','rotateZ','radius','reveal','opacity'];
const cameraKeys=['x','y','zoom','rotateZ'];
export function validateExecutionBindings(d:Row,required=true):string[]{
  const errors:string[]=[],custom=d.execution?.renderer==='custom';
  const layers=Array.isArray(d.layers)?d.layers.filter(object):[];
  const rows=[...(Array.isArray(d.shots)?d.shots:[]),...(Array.isArray(d.transitions)?d.transitions:[])].filter(object);
  for(const row of rows){
    const isShot=Number.isSafeInteger(row.from),extent=isShot?[row.from,row.to]:row.range;
    if(!Array.isArray(extent)||extent.length!==2||!extent.every(Number.isSafeInteger)||extent[1]<=extent[0])continue;
    for(const kind of (isShot?['motion','camera']:['camera'])){
      const key=kind+'Binding',p=`${row.id}.${key}`,b=row[key];
      if(!b&&!required)continue;
      if(!object(b)){errors.push(`${p}: bind the intended motion/camera to channels, or declare a motivated hold`);continue;}
      if(Object.keys(b).some(k=>!['mode','subject','channels','reason'].includes(k)))errors.push(`${p}: unsupported binding field`);
      const subject=layers.find(l=>l.id===b.subject&&l.from<extent[1]&&extent[0]<l.to);
      if(!subject||!detail(b.reason)||!['animated','hold'].includes(b.mode))errors.push(`${p}: actual subject, mode and concrete reason required`);
      if(!Array.isArray(b.channels)||new Set(b.channels).size!==b.channels.length||b.channels.some((c:unknown)=>!detail(c))||(!b.channels.length&&(b.mode==='animated'||custom))){errors.push(`${p}: unique executable channels required`);continue;}
      if(custom){
        if(b.channels.some((c:string)=>!c.startsWith(kind==='camera'?'camera.':`layers.${b.subject}.`)))errors.push(`${p}: custom channels must identify the camera or bound subject`);
        continue; // G2/G3 require these exact channels in renderer measurements.
      }
      const resolve=(name:string):{channel:any;fallback:number}|undefined=>{
        const parts=name.split('.');
        if(kind==='camera'&&parts.length===2&&parts[0]==='camera'&&cameraKeys.includes(parts[1]!))return {channel:d.camera?.[parts[1]!],fallback:parts[1]==='zoom'?1:0};
        if(kind==='motion'&&parts.length===3&&parts[0]==='layers'&&parts[1]===b.subject&&motionKeys.includes(parts[2]!)&&subject)return {channel:subject[parts[2]!],fallback:['scale','opacity','reveal'].includes(parts[2]!)?1:0};
      };
      const names=b.channels.length?b.channels:kind==='camera'?cameraKeys.map(k=>`camera.${k}`):motionKeys.map(k=>`layers.${b.subject}.${k}`);
      let changed=false;
      for(const name of names){
        const c=resolve(name);
        if(!c||b.channels.length&&c.channel===undefined){errors.push(`${p}: missing or unsupported channel ${name}`);continue;}
        try{
          const start=Math.max(extent[0],kind==='motion'?subject?.from??extent[0]:extent[0]);
          const end=Math.min(extent[1],kind==='motion'?subject?.to??extent[1]:extent[1]);
          const first=channelValue(c.channel,start,c.fallback);
          if(!Number.isFinite(first))throw Error('Non-finite channel');
          for(let f=start+1;f<end;f++){
            const sample=channelValue(c.channel,f,c.fallback);
            if(!Number.isFinite(sample))throw Error('Non-finite channel');
            if(Math.abs(sample-first)>1e-6)changed=true;
          }
        }catch{errors.push(`${p}: invalid executable channel ${name}`);}
      }
      if(b.mode==='animated'&&!changed)errors.push(`${p}: promised animation has no changing executable trajectory in this interval`);
      if(b.mode==='hold'&&changed)errors.push(`${p}: declared hold contradicts its changing channels`);
    }
  }
  return errors;
}
