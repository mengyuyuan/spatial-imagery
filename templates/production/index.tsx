import React from 'react';
import {AbsoluteFill,Audio,Composition,Img,OffthreadVideo,Sequence,registerRoot,staticFile,useCurrentFrame} from 'remotion';
import design from '../design.json';
import assets from '../assets.json';
import {track,linear,smooth} from './sdk/motion.js';

// This is an editable scene graph, not a choice of fixed title-card templates.
// All channels use global frames. A layer can persist through multiple shots.
const samplers=new WeakMap<object,(frame:number)=>number>();
const value=(channel:any,frame:number,fallback:number):number=>{
  if(channel===undefined)return fallback;
  if(typeof channel==='number')return channel;
  let sampler=samplers.get(channel);
  if(!sampler){sampler=track(channel.map((k:any)=>({time:k.frame,value:k.value,easing:k.easing==='linear'?linear:smooth})));samplers.set(channel,sampler);}
  return sampler!(frame);
};
const media=(id:string)=>staticFile(assets.find((a:any)=>a.id===id)!.local);
const Layer:React.FC<{layer:any;frame:number}>=({layer:l,frame:f})=>{
  const w=value(l.width,f,design.width),h=value(l.height,f,design.height);
  const style:React.CSSProperties={position:'absolute',left:0,top:0,width:w,height:h,
    transform:`translate3d(${value(l.x,f,design.width/2)}px,${value(l.y,f,design.height/2)}px,${value(l.z,f,0)}px) translate(-50%,-50%) rotateX(${value(l.rotateX,f,0)}deg) rotateY(${value(l.rotateY,f,0)}deg) rotateZ(${value(l.rotateZ,f,0)}deg) scale(${value(l.scale,f,1)})`,
    transformStyle:'preserve-3d',backfaceVisibility:'hidden',opacity:value(l.opacity,f,1),
    borderRadius:l.type==='ellipse'?'50%':value(l.radius,f,0),overflow:l.type==='path'?'visible':'hidden',
    clipPath:`inset(0 ${100*(1-value(l.reveal,f,1))}% 0 0)`};
  if(l.type==='text')return <div style={{...style,color:l.fill??'#f5f0e7',fontFamily:l.fontFamily??'"Noto Sans CJK SC", "Microsoft YaHei", sans-serif',fontSize:l.fontSize??72,fontWeight:l.fontWeight??700,lineHeight:1.12,whiteSpace:'pre-wrap',display:'flex',alignItems:'center',justifyContent:l.align==='left'?'flex-start':l.align==='right'?'flex-end':'center',textAlign:l.align??'center'}}>{l.text}</div>;
  if(l.type==='image')return <div style={style}><Img src={media(l.asset)} style={{width:'100%',height:'100%',objectFit:l.fit??'cover'}}/></div>;
  if(l.type==='video')return <div style={style}><Sequence from={l.from} durationInFrames={l.to-l.from} layout="none"><OffthreadVideo src={media(l.asset)} startFrom={Math.round((l.sourceIn??0)*design.fps)} muted style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:l.fit??'cover'}}/></Sequence></div>;
  if(l.type==='path')return <svg style={style} viewBox={`0 0 ${w} ${h}`}><path d={l.path} fill={l.fill??'none'} stroke={l.stroke??'#f5f0e7'} strokeWidth={l.strokeWidth??3} strokeLinecap="round"/></svg>;
  return <div style={{...style,background:l.fill??'#f5f0e7',border:l.stroke?`${l.strokeWidth??2}px solid ${l.stroke}`:undefined,boxSizing:'border-box'}}/>;
};
const Film:React.FC=()=>{
  const f=useCurrentFrame(),c:any=design.camera??{},layers=(design.layers as any[]).filter(l=>f>=l.from&&f<l.to);
  return <AbsoluteFill style={{backgroundColor:design.background,overflow:'hidden'}}>
    <AbsoluteFill style={{perspective:`${c.perspective??1400}px`,perspectiveOrigin:'50% 50%'}}>
      <AbsoluteFill style={{transformStyle:'preserve-3d',transformOrigin:'50% 50%',transform:`scale(${value(c.zoom,f,1)}) rotateZ(${-value(c.rotateZ,f,0)}deg) translate3d(${-value(c.x,f,0)}px,${-value(c.y,f,0)}px,0)`}}>
        {layers.filter(l=>l.space!=='screen').map(l=><Layer key={l.id} layer={l} frame={f}/>)}
      </AbsoluteFill>
    </AbsoluteFill>
    {layers.filter(l=>l.space==='screen').map(l=><Layer key={l.id} layer={l} frame={f}/>)}
    {design.cues.length>0?<Audio src={staticFile('mix.wav')}/>:null}
  </AbsoluteFill>;
};
registerRoot(()=> <Composition id="Spatial-Imagery" component={Film} width={design.width} height={design.height} fps={design.fps} durationInFrames={design.durationInFrames}/>);
