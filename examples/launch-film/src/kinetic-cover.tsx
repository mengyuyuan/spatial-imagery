import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Base,C,Txt,Small,Mark,EN} from './kinetic/common';
function Cover(){return <Base bg={C.ink} fg={C.paper}>
 <div style={{position:'absolute',left:88,top:100}}><Mark size={190}/></div>
 <Small x={340} y={153}>DESIGN / MOTION / SOUND</Small>
 <Txt x={75} y={406} size={305}>空间意象<span style={{color:C.red}}>。</span></Txt>
 <Txt x={89} y={766} size={109} style={{fontFamily:EN,letterSpacing:4}}>SPATIAL IMAGERY</Txt>
 <Txt x={90} y={969} size={37} style={{fontWeight:500,letterSpacing:1}}>让想法成为空间 / GIVE IDEAS ROOM TO MOVE.</Txt>
 <Small x={90} y={1115} color={C.mint}>OPEN SOURCE CREATIVE SDK</Small>
 </Base>;}
registerRoot(()=> <Composition id="Kinetic-Cover" component={Cover} width={1600} height={1200} fps={30} durationInFrames={1}/>);
