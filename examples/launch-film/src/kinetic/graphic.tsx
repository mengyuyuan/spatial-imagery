import React from 'react';
import {OffthreadVideo,Sequence,staticFile} from 'remotion';
import {C,Base,Txt,Small,Mark,e,back,smooth,clamp,mix,p,range,EN} from './common';
import energy from './energy.json';

export function Idea({b}:{b:number}){
 const ex=e(p(b,3.25,.75));
 return <Base><Small>SPATIAL IMAGERY / AN OPEN CREATIVE TOOLKIT</Small>
  <Txt x={90} y={165} size={86} style={{transform:`translateY(${(1-e(b*1.4))*140}px)`}}>让</Txt>
  {['想','法'].map((v,i)=><Txt key={v} x={80+i*325+ex*(i?-300:260)} y={290} size={305} style={{transform:`translateY(${(1-back((b-i*.2)/.85))*700}px) scaleX(${1+.08*Math.sin(b*5)*Math.exp(-b*2)})`}}>{v}</Txt>)}
  <div style={{position:'absolute',left:1100-ex*330,top:340,width:210+ex*550,height:210,borderRadius:200,background:C.red,transform:`scale(${back((b-.8)/.9)}) rotate(${-ex*20}deg)`}}/>
  <Txt x={85} y={720} size={78} style={{fontFamily:EN,letterSpacing:-3}}>GIVE IDEAS ROOM.</Txt>
  <Small x={1370} y={805}>01 / 15</Small>
 </Base>;
}
export function Flat({b}:{b:number}){
 return <Base bg={C.red}><Small>FIRST, BREAK THE SURFACE.</Small><Txt y={170} size={86}>离开平面</Txt>
  {range(9).map(i=>{const d=e(p(b,i*.09,.8));return <div key={i} style={{position:'absolute',inset:0,clipPath:`inset(${320+i*37}px 0 ${900-320-(i+1)*37}px 0)`,transform:`translateX(${Math.sin(i*2.2)*(80+100*p(b,2.8,1))*d}px)`}}><Txt x={120} y={290} size={350} color={C.paper} style={{fontFamily:EN,letterSpacing:-25,transform:`scaleX(${1.1+.18*p(b,2.8,1)})`}}>FLAT.</Txt></div>;})}
  <div style={{position:'absolute',left:80-250*e(p(b,3,.7)),right:80-250*e(p(b,3,.7)),top:287,bottom:173,border:'3px solid #161a20',transform:`rotate(${-2*b}deg)`}}/>
  <Small y={796}>FROM A SURFACE, TO A POSSIBILITY.</Small>
 </Base>;
}
export function Depth({b}:{b:number}){
 const u=e(p(b,0,1.5)),rush=e(p(b,2.9,1.1));
 return <Base bg={C.ink} fg={C.paper}><Small color={C.red}>DEPTH IS A DIFFERENT POINT OF VIEW.</Small>
  <div style={{position:'absolute',inset:0,perspective:'1100px',overflow:'visible'}}>
   <div style={{position:'absolute',left:'50%',top:'44%',transformStyle:'preserve-3d',transform:`translate(-50%,-50%) rotateY(${-26+u*44}deg) rotateZ(${-7+u*10}deg) scale(${.8+u*.12+rush*7})`}}>
   {range(20).map(i=><div key={i} style={{position:'absolute',fontFamily:EN,fontWeight:900,fontSize:240,letterSpacing:-16,whiteSpace:'nowrap',transform:`translate(-50%,-50%) translateZ(${-i*7*u}px)`,color:i===0?C.paper:i%4===0?C.red:'#333b49',WebkitTextStroke:i===0?'0px':'1px #74747b'}}>SPACE</div>)}
   </div>
  </div>
  <Txt x={80} y={707} size={95}>进入空间。</Txt><Small x={1180} y={794}>02 → 03</Small>
 </Base>;
}
export function ReForm({b}:{b:number}){
 const split=smooth(p(b,.2,.8))*(1-smooth(p(b,2.1,.8))),rot=e(p(b,1,1.1))*90,settle=smooth(p(b,2.6,1));
 return <Base bg={C.blue} fg={C.paper}>
  <Small>NOT MORE OBJECTS. MORE POSSIBILITIES.</Small>
  <svg width={1600} height={900} viewBox="0 0 1600 900"><g transform={`translate(1010 430) rotate(${rot})`}>
   {range(4).map(i=><g key={i} transform={`rotate(${i*90}) translate(${split*130} ${-split*130})`}><path d={`M0 0 H225 C225 ${124+101*settle} ${124+101*settle} 225 ${225*settle} 225 H0Z`} fill={i===0?C.red:i===2?C.mint:C.paper} transform={`rotate(${split*25})`}/></g>)}
  </g></svg>
  <Txt x={80} y={300} size={134}>{b<2?'拆开':'重组'}</Txt><Txt x={83} y={463} size={55} style={{fontFamily:EN,letterSpacing:-2}}>{b<2?'SPLIT.':'REFORM.'}</Txt>
  <Small y={793}>ONE FORM. MANY STATES.</Small>
 </Base>;
}
export function Material({b}:{b:number}){
 const s=smooth(p(b,1.1,1.25)),wipe=e(p(b,2.8,1.1));
 return <Base bg={C.ink} fg={C.paper}>
  <div style={{position:'absolute',inset:0,clipPath:`circle(${230+s*760}px at ${1030-s*230}px 430px)`}}><Sequence from={450} durationInFrames={57}><OffthreadVideo src={staticFile('bubbles-51884.mp4')} startFrom={90} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/></Sequence></div>
  <div style={{position:'absolute',inset:0,clipPath:`polygon(${100-wipe*100}% 0,100% 0,100% 100%,${100-wipe*100}% 100%)`}}><Sequence from={450} durationInFrames={57}><OffthreadVideo src={staticFile('ink.mp4')} startFrom={120} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/></Sequence></div>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#10172299,transparent 60%)'}}/>
  <Small color={C.paper}>FROM GEOMETRY TO MATERIAL.</Small><Txt x={78} y={300} size={173} style={{textShadow:'0 4px 22px #0003'}}>让材质<br/>流动</Txt><Small y={795}>FEEL THE MATERIAL.</Small>
 </Base>;
}
export function Sound({b,frame}:{b:number;frame:number}){
 const q=smooth(p(b,1.5,1.3));
 return <Base bg={C.paper}><Small>CONTINUITY YOU CAN HEAR.</Small>
  <svg width={1600} height={900}>{range(96).map(i=>{const a=i/96*Math.PI*2-Math.PI/2,amp=energy[Math.max(0,Math.min(899,frame-Math.floor(i/4)))]??.3;const v=(.2+.8*Math.abs(Math.sin(i*.68-b*2)))*amp;const x=mix(100+i*14.7,1090+Math.cos(a)*230,q),y=mix(450,430+Math.sin(a)*230,q),h=30+v*240;return <rect key={i} x={x-4} y={y-h/2} width={9} height={h} rx={4.5} fill={i%8===0?C.red:C.ink} transform={`rotate(${q*i/96*360} ${x} ${y})`}/>;})}</svg>
  <div style={{opacity:q}}><Txt x={80} y={305} size={112}>声音<br/>有惯性。</Txt></div>
  <Small y={795}>SOUND HAS MOMENTUM.</Small>
 </Base>;
}
export function Time({b}:{b:number}){
 const s=e(p(b,.65,1.4));
 return <Base bg={C.red}><Small>ONE TIMELINE. EVERYTHING CONNECTED.</Small>
  {['MOTION','CAMERA','SOUND'].map((w,i)=><div key={w} style={{position:'absolute',left:90+(1-s)*[500,-400,750][i],top:175+i*166,fontFamily:EN,fontWeight:900,fontSize:150,letterSpacing:-10,color:i===1?C.paper:C.ink,transform:`scaleX(${1+(1-s)*.12})`,transformOrigin:'left center'}}>{w}<span style={{fontFamily:'Microsoft YaHei',fontSize:47,letterSpacing:0,marginLeft:48}}>{['运动','镜头','声音'][i]}</span></div>)}
  <div style={{position:'absolute',left:75+s*1430,top:155,bottom:150,width:5,background:C.paper,opacity:1-p(b,2.7,.5)}}/>
  <Small y={795}>同一时间，连成作品。</Small>
 </Base>;
}
const Motif=({kind,b}:{kind:number;b:number})=>kind===0?<svg viewBox="0 0 400 260" width="100%" height="100%">{range(12).map(i=><circle key={i} cx={200+Math.cos(i/12*Math.PI*2+b)*77} cy={130+Math.sin(i/12*Math.PI*2+b)*77} r={24} fill={i%3===0?C.red:C.ink}/>)}</svg>:kind===1?<svg viewBox="0 0 400 260" width="100%" height="100%">{range(13).map(i=><rect key={i} x={i*32-5} y={80+Math.sin(i*.7+b*3)*55} width={22} height={135} fill={C.paper} transform={`rotate(-18 ${i*32} 130)`}/>)}</svg>:kind===2?<div style={{fontFamily:EN,fontWeight:900,fontSize:115,lineHeight:.8,letterSpacing:-9,transform:`rotate(-10deg) translateY(${Math.sin(b*2)*15}px)`}}>MAKE<br/>ROOM.</div>:<svg viewBox="0 0 400 260" width="100%" height="100%">{range(6).map(i=><rect key={i} x={110+i*13} y={35+i*13} width={160-i*20} height={180-i*20} rx={10} fill={i%2?C.ink:C.red} transform={`rotate(${b*20+i*10} 200 130)`}/>)}</svg>;
export function Mosaic({b}:{b:number}){
 const zoom=e(p(b,2.8,1.2));
 return <Base bg={C.ink} fg={C.paper}><Small>MORE WAYS TO MAKE.</Small>
  <div style={{position:'absolute',left:80,top:165,width:1440,height:520,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:18,transform:`translate(${-zoom*410}px,${zoom*80}px) scale(${1+zoom*2})`,transformOrigin:'75% 50%'}}>
  {range(8).map(i=><div key={i} style={{background:[C.paper,C.blue,C.red,C.mint][i%4],color:C.ink,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',transform:`translateY(${(1-back(p(b,i*.05,.8)))*(i%2?650:-650)}px)`}}><Motif kind={i%4} b={b+i*.2}/></div>)}
  </div><Txt x={80} y={742} size={58} style={{opacity:1-zoom}}>每种想法，都有形状。</Txt></Base>;
}
export function Layers({b}:{b:number}){
 const v=smooth(p(b,.1,1.1)),close=smooth(p(b,2.3,1.2)),rush=e(p(b,3.35,.65));
 return <Base><Small>COMPOSE THE WHOLE EXPERIENCE.</Small>
  <div style={{position:'absolute',inset:0,perspective:'1400px'}}><div style={{position:'absolute',left:800,top:425,transformStyle:'preserve-3d',transform:`rotateX(${v*52*(1-close)}deg) rotateZ(${-v*23*(1-close)}deg) scale(${1-close*.18+4*rush})`}}>
  {['DESIGN','MOTION','SOUND'].map((w,i)=><div key={w} style={{position:'absolute',width:900,height:280,left:-450,top:-140,background:[C.ink,C.red,C.blue][i],color:C.paper,transform:`translateZ(${(i-1)*150*v*(1-close)}px) translateY(${(i-1)*155*(1-v)}px) translateX(${(i-1)*160*close}px)`,boxShadow:'0 25px 55px #161a2026',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:EN,fontSize:135,fontWeight:900,letterSpacing:-7,opacity:close>.6&&i<2?1-(close-.6)*2.5:1}}>{w}</div>)}
  </div></div><Small y={795}>设计 → 动画 → 声音</Small>
 </Base>;
}
export function Code({b}:{b:number}){
 const s=e(p(b,0,1)),close=e(p(b,2.8,1.2));
 return <Base bg={C.blue} fg={C.paper}><Small>AN OPEN SDK FOR SPATIAL STORYTELLING.</Small>
  <Txt x={80-(1-s)*400+close*450} y={225} size={330} color={C.red} style={{fontFamily:EN}}>{'{'}</Txt><Txt x={1340+(1-s)*400-close*450} y={225} size={330} color={C.red} style={{fontFamily:EN}}>{'}'}</Txt>
  <div style={{position:'absolute',left:390,top:272,fontFamily:'Consolas, monospace',fontSize:56,lineHeight:1.55,opacity:1-close,transform:`translateY(${(1-s)*80}px)`}}><div>motionPath(...)</div><div style={{color:C.mint}}>followCamera(...)</div><div>sampleCue(...)</div></div>
  <Txt x={385} y={685} size={55} style={{opacity:1-close}}>用代码，把它连接。</Txt>
 </Base>;
}
export function Crescendo({b}:{b:number}){
 const k=Math.min(3,Math.floor(b)),u=b-k;const bg=[C.paper,C.red,C.blue,C.ink][k],fg=k>1?C.paper:C.ink;
 return <Base bg={bg} fg={fg}><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',transform:`scale(${.85+.15*e(u*3)}) rotate(${(1-e(u*3))*(k%2?9:-9)}deg)`}}><div style={{fontSize:290,fontWeight:900,letterSpacing:-12}}>{['想法','变化','空间','意象'][k]}</div></div><Small color={fg}>{['IDEA','CHANGE','SPACE','IMAGERY'][k]} / SPATIAL IMAGERY</Small></Base>;
}
export function Brand({b}:{b:number}){
 const s=back(p(b,0,1));
 return <Base bg={C.ink} fg={C.paper}>
  <div style={{position:'absolute',left:90,top:95}}><Mark size={118} progress={s}/></div>
  <Txt x={78} y={280} size={210} style={{transform:`translateY(${(1-s)*240}px)`}}>空间意象<span style={{color:C.red}}>。</span></Txt>
  <Txt x={87} y={535} size={73} style={{fontFamily:EN,letterSpacing:4,opacity:e(p(b,.3,.8))}}>SPATIAL IMAGERY</Txt>
  <Small y={725} style={{opacity:e(p(b,.7,.7))}}>让想法成为空间 / GIVE IDEAS ROOM TO MOVE.</Small>
  <Small y={808} color={C.mint}>github.com/mengyuyuan/spatial-imagery</Small><Small x={1290} y={808}>OPEN SOURCE</Small>
 </Base>;
}
