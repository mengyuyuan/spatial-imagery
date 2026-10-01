import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {validatePlan} from '../../dist/index.js';
const root=path.dirname(fileURLToPath(import.meta.url)),B=60/128;
const source=JSON.parse(readFileSync(path.join(root,'assets-v2.json'),'utf8'));
const audio=JSON.parse(readFileSync(path.join(root,'sound-v2.json'),'utf8'));
const rows=[
 [0,4,'让想法 / Give ideas room','EL01 typography and red point','Compressed glyphs','Expand glyphs with stagger and squeeze','Ideas fill the surface','Fixed editorial wide','Text pressure and first contact'],
 [4,8,'离开平面 / Beyond flat','EL02 sliced type','Flat word in frame','Horizontal slices separate at different phases','A fragmented surface','Fixed crop; shape movement','Air slide and granular swipe'],
 [8,12,'进入空间 / Into space','EL03 extruded SPACE word','Flat typography','Depth layers open and turn before rapid approach','View enters negative space','CSS 2.5D rotation and approach, not physical 3D','Rising pass-by'],
 [12,20,'跟上想象 / Follow the idea','EL04 coral sphere','Subject ahead in ring sculpture','Sphere and true 3D camera travel through depth','Foreground rings pass the viewer','SDK motionPath and followCamera; near/far occlusion','Long acceleration envelope; pan follows travel'],
 [20,24,'改变形态 / Change the form','EL05 implicit surface','Sphere','Ray-marched signed-distance volume morphs into ring','Opening visible inside the same form','Animated volume orientation and fixed shader view','Material body then taper'],
 [24,28,'打破排列 / Break the grid','EL06 rounded tile field','Ordered matrix','Staggered height and rotation wave propagates','Array becomes spatial','3D camera arcs over matrix','Short varied glass contacts'],
 [28,32,'拆开重组 / Split and reform','EL07 four sectors','Circle','Sectors separate, rotate and continuously square off','Reassembled square','Fixed asymmetrical graphic frame','Separation body and contact'],
 [32,36,'让材质流动 / Feel the material','EL08 video aperture','Circle window','Circle reveals actual bubble footage, ink sweeps across','Material fills the frame','2D aperture and wipe with actual video motion','Music foreground; restrained material accent'],
 [36,40,'声音有惯性 / Sound has momentum','EL09 RMS waveform','Horizontal bars','Bars driven by measured music RMS reorganize as a ring','Circular waveform','Graphic regrouping with temporal offsets','Continuous body with explicit tail'],
 [40,44,'同一时间 / One timeline','EL10 type tracks','Three offset lines','MOTION CAMERA SOUND align on a moving marker','Tracks share start position','Locked viewing reference makes alignment visible','Slide then contact on actual alignment'],
 [44,48,'每种想法都有形状 / More ways to make','EL11 contact sheet','Separate visual motifs','Different graphic systems assemble as contact sheet','One selected cell becomes focus','Push toward selected cell','Small accents, directional sweep'],
 [48,52,'设计动画声音 / Design motion sound','EL12 color planes','Separated stacked type','Planes tilt, lift, close and rush toward lens','Blue fills the frame for next shot','CSS 2.5D fold and zoom','Layer movement and closure'],
 [52,56,'用代码把它连接 / Create with code','EL13 SDK function names','Separated braces','Braces enter and frame the actual exported function names','Connected toolkit','Fixed layout with brace movement','Dry switch and exit movement'],
 [56,60,'想法变化空间意象 / Idea change space imagery','EL14 keyword sequence','Idea','Each beat hands to the next word via scale and cut','Brand meaning complete','Four rhythmic graphic cuts; no one-take claim','Music carries the four beats'],
 [60,64,'空间意象 / Spatial Imagery','EL15 brand lockup','Separated mark and name','Mark rotates to alignment and brand type settles','Brand and project address readable','Stable end frame','Final contact and music fade'],
];
const assets=source.map(a=>({id:a.id,kind:a.id.startsWith('video:')?'video':'audio',title:a.id,source:a.source,license:a.license,tags:[a.id.startsWith('music:')?'music':a.id.split(':')[0]],local:a.path,sha256:a.sha256,availability:'local',redistribution:a.redistribution==='allowed'?'allowed':'forbidden',review:'technical'}));
const shots=rows.map((r,i)=>{const[from,to,keyword,subject,initial,action,result,camera,sound]=r;const frameFrom=Math.ceil(from*B*30),frameTo=Math.ceil(to*B*30);const used=new Set(['music:162',...audio.cues.filter(c=>c.start<to*B&&c.end>from*B).map(c=>'audio:'+c.asset)]);if(from===32){used.add('video:ink');used.add('video:51884');}
 return {id:`SH${String(i+1).padStart(2,'0')}`,from:frameFrom,to:frameTo,state:'full',keyword,subject,initial,action,result,camera,sound,assets:[...used],readFrames:from===56?8:from===60?35:20,...(i<rows.length-1?{handoff:{to:`SH${String(i+2).padStart(2,'0')}`,method:from===48?'color-plane fill into matching blue field':from===12?'subject punch-in / match cut':from===28?'shape-position match into video aperture':'rhythmic cut or shape continuity; see design-v2.md',continuity:'Shared beat grid and active subject hierarchy'}}:{})};});
const plan={version:1,title:'空间意象 / Spatial Imagery — Kinetic v2',fps:30,durationInFrames:900,shots,assets};
const issues=validatePlan(plan);if(issues.some(i=>i.severity==='error'))throw new Error(JSON.stringify(issues));
writeFileSync(path.join(root,'storyboard-v2.json'),JSON.stringify(plan,null,2));console.log(JSON.stringify({shots:shots.length,assets:assets.length,issues}));
