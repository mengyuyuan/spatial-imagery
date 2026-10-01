import React from 'react';
import {registerRoot,Composition,AbsoluteFill,Sequence,OffthreadVideo,Audio,staticFile,useCurrentFrame} from 'remotion';
import {smooth,track} from '../../../dist/index.js';
const ink='#16333c',paper='#f5f0e5',coral='#f25b3c';
const font='"Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif';
const fade=(t:number,a:number,b:number)=>smooth((t-a)/.45)*(1-smooth((t-b)/.4));
const Label=({en,cn,t,start,end,dark=false}:{en:string;cn:string;t:number;start:number;end:number;dark?:boolean})=><div style={{position:'absolute',left:75,top:102,opacity:fade(t,start,end),transform:`translateY(${20*(1-smooth((t-start)/.6))}px)`,color:dark?paper:ink}}><div style={{fontSize:24,letterSpacing:5,marginBottom:16,fontWeight:500}}>{en}</div><div style={{fontSize:57,letterSpacing:1,fontWeight:700}}>{cn}</div></div>;
const Logo=({size=180}:{size?:number})=><svg width={size} height={size} viewBox="0 0 120 120"><path d="M15 38 60 12 105 38 105 87 60 113 15 87Z" fill="none" stroke={coral} strokeWidth="9"/><path d="M15 38 60 64 105 38M60 64V113" fill="none" stroke={coral} strokeWidth="9"/><path d="M38 25 82 51 82 100" fill="none" stroke={paper} strokeWidth="6"/></svg>;
const Film=()=>{
  const f=useCurrentFrame(),t=f/30;
  const shrink=smooth((t-22.5)/2.2);
  return <AbsoluteFill style={{background:paper,fontFamily:font}}>
    {t<20&&<><OffthreadVideo src={staticFile('space.mp4')} muted style={{width:'100%',height:'100%'}}/><AbsoluteFill style={{background:'linear-gradient(90deg,rgba(245,240,229,.92),rgba(245,240,229,0) 44%)',opacity:t<4?1:t>11?.72:.25}}/><AbsoluteFill style={{background:'radial-gradient(ellipse 1000px 430px at 180px 100px,rgba(245,240,229,.99) 0%,rgba(245,240,229,.97) 50%,rgba(245,240,229,0) 100%)',opacity:Math.max(fade(t,.3,3.4),fade(t,4.3,8.5),fade(t,12,15.6),fade(t,17.7,19.3))}}/></>}
    {t<20&&<>
      <Label en="01 / START WITH A SUBJECT" cn="先有主体。" t={t} start={.3} end={3.4}/>
      <Label en="02 / FOLLOW THROUGH SPACE" cn="主体带路，镜头接力。" t={t} start={4.3} end={8.5}/>
      <Label en="03 / REVEAL THE RELATIONSHIP" cn="变化，揭示关系。" t={t} start={12} end={15.6}/>
      <Label en="ONE TIMELINE. EVERY LAYER." cn="画面与声音，共用时间轴。" t={t} start={17.7} end={19.3}/>
    </>}
    {t>=20&&t<25.4&&<>
      <div style={{position:'absolute',inset:0,background:ink}}/>
      <div style={{position:'absolute',width:1600,height:900,transform:`translate(${shrink*310}px,${shrink*10}px) scale(${1-shrink*.43})`,overflow:'hidden',borderRadius:shrink*14,boxShadow:'0 40px 130px #0005'}}>
        <Sequence from={600} durationInFrames={162}><OffthreadVideo src={staticFile('ink.mp4')} startFrom={90} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></Sequence>
      </div>
      <div style={{position:'absolute',left:75,top:300,color:paper,opacity:smooth((t-22.8)/.5)}}><div style={{fontSize:23,letterSpacing:4}}>04 / FOOTAGE MEETS FORM</div><div style={{fontSize:57,fontWeight:700,marginTop:24,lineHeight:1.3}}>真实素材。<br/>进入叙事。</div><div style={{fontSize:22,marginTop:24,opacity:.7}}>Bring footage into the story.</div></div>
    </>}
    {t>=25&&<AbsoluteFill style={{background:ink,opacity:smooth((t-25)/.6),alignItems:'center',justifyContent:'center',color:paper}}>
      <div style={{transform:`translateY(${35*(1-smooth((t-25.2)/.9))}px)`,textAlign:'center',opacity:smooth((t-25.2)/.7)}}><Logo size={148}/><div style={{fontSize:76,fontWeight:700,letterSpacing:12,marginTop:25}}>空间意象</div><div style={{fontSize:36,letterSpacing:5,marginTop:18}}>SPATIAL IMAGERY</div><div style={{fontSize:25,marginTop:40,opacity:.8}}>让想法成为空间 · Give ideas room to move.</div><div style={{fontSize:20,marginTop:46,opacity:.65}}>OPEN SOURCE SDK / TypeScript · Blender · Remotion</div><div style={{fontSize:22,marginTop:18,color:'#8fc8b9'}}>github.com/mengyuyuan/spatial-imagery</div></div>
    </AbsoluteFill>}
    <div style={{position:'absolute',left:75,right:75,bottom:42,display:'flex',justifyContent:'space-between',color:t<20?ink:paper,fontSize:16,letterSpacing:2,opacity:t>25?0:.75}}><span>空间意象 / SPATIAL IMAGERY</span><span>DESIGN → MOTION → SOUND</span></div>
    <Audio src={staticFile('mix.wav')}/>
  </AbsoluteFill>;
};
registerRoot(()=> <Composition id="Spatial-Imagery-Launch" component={Film} durationInFrames={900} fps={30} width={1600} height={900}/>);
