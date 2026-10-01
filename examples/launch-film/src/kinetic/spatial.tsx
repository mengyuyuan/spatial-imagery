import React,{useLayoutEffect,useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {motionPath,followCamera} from '../../../../dist/index.js';
import {C,e,smooth,clamp,mix,range} from './common';

const fly=motionPath([
  {time:0,position:[0,0,3],velocity:[0,0,-7]},
  {time:1.2,position:[1.1,.55,-7]},
  {time:2.6,position:[-.7,-.35,-22]},
  {time:3.75,position:[0,0,-35],velocity:[0,0,-11]},
]);
const box=new RoundedBoxGeometry(.84,.84,.44,3,.12);
function Environment(){
  const {gl,scene}=useThree();
  useLayoutEffect(()=>{const pm=new THREE.PMREMGenerator(gl),room=new RoomEnvironment();const env=pm.fromScene(room,.04);scene.environment=env.texture;return()=>{scene.environment=null;env.dispose();room.dispose();pm.dispose();};},[gl,scene]);
  return <><ambientLight intensity={.5}/><directionalLight position={[-3,6,8]} intensity={3.5}/><directionalLight position={[5,-2,2]} color="#d0deff" intensity={1.4}/></>;
}
function Camera({mode,t}:{mode:string;t:number}){
 const {camera}=useThree();
 useLayoutEffect(()=>{
   const cam=camera as THREE.PerspectiveCamera;
   if(mode==='fly'){
     const rig=followCamera(fly,t,{offset:[Math.sin(t*.7)*.25,.35,6.4],lookAhead:.1,fov:57});
     cam.position.set(...rig.position);cam.up.set(0,1,0);cam.lookAt(...rig.target);cam.fov=57;
   }else if(mode==='morph'){
     cam.position.set(Math.sin(t*.75)*1.9,.3+Math.sin(t)*.65,7.4-t*.25);cam.lookAt(0,0,0);cam.fov=43;
   }else{
     cam.position.set(Math.sin(t*.9)*1.7,2.8-1.2*smooth(t/1.8),10.2);cam.lookAt(0,0,0);cam.fov=47;
   }
   cam.updateProjectionMatrix();
 },[camera,mode,t]);return null;
}
function Flight({t}:{t:number}){
 const hero=fly(t).position;
 return <>
  <fog attach="fog" args={[C.paper,18,60]}/>
  {range(9).map(i=><group key={i} position={[Math.sin(i*.85)*1.2,Math.cos(i*.7)*.65,-i*5]} rotation={[Math.sin(i)*.13,Math.cos(i)*.2,i*.31]}>
    <mesh scale={[1.3,1,1]}><torusGeometry args={[2.65,.4,20,80]}/><meshPhysicalMaterial color={i%3===0?C.blue:i%3===1?C.red:'#e0cdb4'} metalness={.15} roughness={.27} clearcoat={1}/></mesh>
  </group>)}
  <mesh position={hero} rotation={[t*1.1,t*.7,0]} scale={[.53,.53,.53]}><icosahedronGeometry args={[1,3]}/><meshPhysicalMaterial color={C.red} metalness={.3} roughness={.16} clearcoat={1}/></mesh>
 </>;
}
function Morph({t}:{t:number}){
 const uniforms=useMemo(()=>({uT:{value:t},uMorph:{value:smooth((t-.2)/1.1)}}),[t]);
 return <mesh><planeGeometry args={[40,30]}/><shaderMaterial transparent depthTest={false} uniforms={uniforms} vertexShader={`void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`
 precision highp float; uniform float uT; uniform float uMorph;
 mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
 float field(vec3 p){p.xy=rot(.2+uT*.15)*p.xy;p.yz=rot(.6+uT*.45)*p.yz;float sphere=length(p)-1.8;float ring=length(vec2(length(p.xz)-1.67,p.y))-.57;return mix(sphere,ring,uMorph);}
 void main(){vec2 uv=(gl_FragCoord.xy-vec2(800.,450.))/900.;vec3 ro=vec3(0.,0.,7.5),rd=normalize(vec3(uv*5.,-5.));float travel=0.;vec3 pos;bool hit=false;
 for(int i=0;i<96;i++){pos=ro+rd*travel;float d=field(pos);if(abs(d)<.0015){hit=true;break;}travel+=d*.78;if(travel>14.)break;}
 if(!hit)discard;vec2 ep=vec2(.002,0.);vec3 n=normalize(vec3(field(pos+ep.xyy)-field(pos-ep.xyy),field(pos+ep.yxy)-field(pos-ep.yxy),field(pos+ep.yyx)-field(pos-ep.yyx)));
 vec3 l=normalize(vec3(-.5,.8,1.)),v=-rd;float dif=max(dot(n,l),0.);float spec=pow(max(dot(reflect(-l,n),v),0.),44.);float rim=pow(1.-max(dot(n,v),0.),3.);
 vec3 base=vec3(1.,.20,.085);vec3 col=base*(.28+.72*dif)+vec3(1.,.91,.8)*spec*.8+vec3(.22,.28,.5)*rim*.5;
 float strip=pow(max(dot(reflect(-normalize(vec3(.9,.3,1.)),n),v),0.),70.);col+=strip*.35;gl_FragColor=vec4(col,1.);
 }`}/></mesh>;
}
function Grid({t}:{t:number}){
 return <group rotation={[-.05,.15,-.08+t*.07]}>
  {range(63).map(i=>{const col=i%9,row=Math.floor(i/9),wave=Math.sin(col*.7+row*.65-t*6),phase=smooth((t-.1)/.6),collapse=smooth((t-1.2)/.65);
  return <mesh key={i} geometry={box} position={[(col-4)*1.04*(1-.25*collapse),(row-3)*1.04*(1-.25*collapse),wave*.65*phase]} rotation={[wave*.5*phase,collapse*(col-4)*.28,wave*.1]} scale={[1,1,1+collapse*.7]}><meshPhysicalMaterial color={(row+col)%5===0?C.red:(row+col)%3===0?C.blue:C.paper} roughness={.28} metalness={.15}/></mesh>;})}
 </group>;
}
export function Spatial({mode,t}:{mode:'fly'|'morph'|'grid';t:number}){
 return <ThreeCanvas width={1600} height={900} camera={{position:[0,0,9],fov:50}} gl={{antialias:true,alpha:true}} style={{position:'absolute',inset:0}}>
  <Environment/><Camera mode={mode} t={t}/>
  {mode==='fly'?<Flight t={t}/>:mode==='morph'?<Morph t={t}/>:<Grid t={t}/>}
 </ThreeCanvas>;
}
