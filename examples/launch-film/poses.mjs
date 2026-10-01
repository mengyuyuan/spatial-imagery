import {motionPath, followCamera, track, smoother, smooth, mix, lerp3, sampleCue} from '../../dist/index.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));mkdirSync(path.join(root,'build'),{recursive:true});
export const subject=motionPath([
  {time:0,position:[0,0,.72]}, {time:3,position:[0,0,1.3]},
  {time:5,position:[0,1,2.4],velocity:[0,2,0]},
  {time:7,position:[.5,7,2.5],velocity:[0,4,0]},
  {time:9,position:[-.3,15,2.5],velocity:[0,4,0]},
  {time:11,position:[0,20,2.5]}, {time:20,position:[0,20,2.5]}
]);
const lens=track([{time:0,value:40},{time:4,value:46},{time:10,value:46},{time:13,value:48},{time:18,value:40},{time:20,value:40}]);
const camera=motionPath([
  {time:0,position:[4.9,-7,6.5]}, {time:3.5,position:[3,-6.6,4.9]},
  {time:5,position:[0,-4.5,4.2],velocity:[0,2,0]},
  {time:7,position:[.5,1.5,4.3],velocity:[0,4,0]},
  {time:9,position:[-.3,9.5,4.3],velocity:[0,4,0]},
  {time:11,position:[0,14.5,4.3],velocity:[1,0,.5]},
  {time:14,position:[7,12,8]}, {time:17,position:[8,14,7]},
  {time:20,position:[1,13,4.8]}
]);
const travel={id:'SFX-travel',asset:'engine',start:3.4,end:11.4,sourceIn:0,fadeIn:.8,fadeOut:1,gainDb:-16,pan:[-.3,.25],intensity:t=>Math.min(1,.22+Math.hypot(...subject(t).velocity)/5)};
const frames=[];
for(let frame=0;frame<600;frame++){
  const t=frame/30, s=subject(t), follow=followCamera(subject,t,{offset:[0,-5.5,1.8],lookAhead:.1,fov:lens(t)});
  const useFollow=smooth((t-3.5)/1.5)*(1-smooth((t-10.8)/1.5));
  const target=lerp3(s.position,[0,20,3.4],smooth((t-11)/2));
  frames.push({frame,time:t,subject:s.position,velocity:s.velocity,
    camera:{position:lerp3(camera(t).position,follow.position,useFollow),target:lerp3(target,follow.target,useFollow),up:[0,0,1],fov:lens(t)},
    lift:smooth((t-.5)/2),fold:smooth((t-2.4)/1.2),assembly:smooth((t-10)/1.4),explode:smooth((t-11.6)/1.5)*(1-smooth((t-16)/1.8)),
    sound:sampleCue(travel,t)});
}
writeFileSync(path.join(root,'build/poses.json'),JSON.stringify({fps:30,width:1600,height:900,frames}));
writeFileSync(path.join(root,'build/travel-cue.json'),JSON.stringify({...travel,intensity:'derived from subject velocity / 5, floor 0.22'}));
console.log('Exported 600 deterministic SDK poses');
