import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {requireDiagnosticMode} from './draft-only.mjs';
requireDiagnosticMode(process.argv.slice(2));
const root=path.dirname(fileURLToPath(import.meta.url)), repo=path.resolve(root,'../..');
function run(bin,args){const r=spawnSync(bin,args,{cwd:repo,stdio:'inherit'});if(r.error||r.status!==0)throw new Error(`${bin} failed: ${r.error?.message??r.status}`);}
// Installation is explicit: this command never installs binaries or changes global config.
run(process.env.BLENDER_BIN??'blender',['--version']);
for(const b of ['ffmpeg','ffprobe'])run(b,['-version']);
if(!existsSync(path.join(repo,'dist/index.js')))throw new Error('Run npm ci && npm run build first');
if(!existsSync(path.join(root,'node_modules/remotion')))throw new Error('Run npm ci --prefix examples/launch-film first');
for(const script of ['poses.mjs','fetch-assets.mjs'])run(process.execPath,[path.join(root,script)]);
run(process.env.BLENDER_BIN??'blender',['-b','--python',path.join(root,'scene.py'),'--','--render']);
for(const script of ['mix.mjs','prepare.mjs','render.mjs','qa.mjs'])run(process.execPath,[path.join(root,script),...(['render.mjs','qa.mjs'].includes(script)?['--draft']:[])]);
