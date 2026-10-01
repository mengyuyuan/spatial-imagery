import React from 'react';
import {AbsoluteFill,Audio,Composition,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import {B,C,Base,Txt,Small,e,p} from './kinetic/common';
import {Spatial} from './kinetic/spatial';
import {Idea,Flat,Depth,ReForm,Material,Sound,Time,Mosaic,Layers,Code,Crescendo,Brand} from './kinetic/graphic';
export function KineticFilm(){
 const f=useCurrentFrame(),t=f/30,b=t/B;
 let scene;
 if(b<4)scene=<Idea b={b}/>;
 else if(b<8)scene=<Flat b={b-4}/>;
 else if(b<12)scene=<Depth b={b-8}/>;
 else if(b<20)scene=<Base><Spatial mode="fly" t={(b-12)*B}/><Small>FOLLOW THE IDEA.</Small><Txt x={80} y={724} size={88}>跟上想象。</Txt><Small x={1160} y={800}>SUBJECT → CAMERA</Small></Base>;
 else if(b<24)scene=<Base bg={C.ink} fg={C.paper}><div style={{position:'absolute',inset:0,transform:'translateX(220px)'}}><Spatial mode="morph" t={(b-20)*B}/></div><Small>CHANGE THE FORM.</Small><Txt x={80} y={285} size={145}>改变<br/>形态</Txt><Small y={795}>SAME SURFACE. A NEW POSSIBILITY.</Small></Base>;
 else if(b<28)scene=<Base><Spatial mode="grid" t={(b-24)*B}/><Small>BREAK THE GRID.</Small><Txt x={80} y={742} size={89}>打破排列。</Txt></Base>;
 else if(b<32)scene=<ReForm b={b-28}/>;
 else if(b<36)scene=<Material b={b-32}/>;
 else if(b<40)scene=<Sound b={b-36} frame={f}/>;
 else if(b<44)scene=<Time b={b-40}/>;
 else if(b<48)scene=<Mosaic b={b-44}/>;
 else if(b<52)scene=<Layers b={b-48}/>;
 else if(b<56)scene=<Code b={b-52}/>;
 else if(b<60)scene=<Crescendo b={b-56}/>;
 else scene=<Brand b={b-60}/>;
 return <AbsoluteFill>{scene}<Audio src={staticFile('kinetic-mix.wav')}/></AbsoluteFill>;
}
registerRoot(()=> <Composition id="Spatial-Imagery-Kinetic" component={KineticFilm} durationInFrames={900} fps={30} width={1600} height={900}/>);
