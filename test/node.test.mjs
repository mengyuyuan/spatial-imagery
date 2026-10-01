import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {sha256File,auditAssets,auditMedia} from '../dist/node.js';
test('asset audit hashes actual bytes and rejects escape paths',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'si-audit-'));const root=join(dir,'project');await mkdir(root);
  try{
    await writeFile(join(root,'clip.txt'),'abc');await writeFile(join(dir,'outside.txt'),'secret');
    const sha256=await sha256File(join(root,'clip.txt'));assert.equal(sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const plan={assets:[{id:'ok',availability:'local',local:'clip.txt',sha256},{id:'bad',availability:'local',local:'clip.txt',sha256:'0'.repeat(64)},{id:'escape',availability:'local',local:'../outside.txt',sha256},{id:'link',availability:'reference'}]};
    const results=await auditAssets(plan,root);assert.deepEqual(results.map(r=>r.status),['verified','error','error','reference']);assert.match(results[2].message,/outside/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('media audit detects the historical long-container/short-video failure',()=>{
  const p={format:{duration:'24'},streams:[{codec_type:'video',avg_frame_rate:'30/1',nb_read_frames:'240',duration:'8'},{codec_type:'audio',duration:'24'}]};
  const issues=auditMedia(p,{fps:30,frames:720,audio:true});assert.ok(issues.includes('Unexpected decoded frame count'));assert.ok(issues.includes('Unexpected video-stream duration'));
});
test('media audit accepts fractional FPS and a small AAC padding tolerance',()=>{
  const fps=30000/1001,seconds=300/fps;const p={format:{duration:String(seconds)},streams:[{codec_type:'video',avg_frame_rate:'30000/1001',nb_read_frames:'300',duration:String(seconds)},{codec_type:'audio',duration:String(seconds+.02)}]};
  assert.deepEqual(auditMedia(p,{fps,frames:300,audio:true}),[]);
});
