/** Read-only preflight. Nothing is installed, downloaded, or authenticated here. */
import {spawnSync} from 'node:child_process';
import {existsSync,realpathSync} from 'node:fs';
import {delimiter,dirname,join} from 'node:path';

export function npmEntry():string {
  const candidates=[process.env.npm_execpath,join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),join(dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')];
  for(const dir of (process.env.PATH??'').split(delimiter)){
    candidates.push(join(dir,'node_modules/npm/bin/npm-cli.js'),join(dir,'../lib/node_modules/npm/bin/npm-cli.js'));
    // Debian and other Unix layouts expose npm as a symlink to its JS entry.
    try{const target=realpathSync(join(dir,'npm'));if(target.endsWith('npm-cli.js'))candidates.push(target);}catch{/* Try the next installation layout. */}
  }
  const found=candidates.find((p):p is string=>!!p&&existsSync(p));
  if(!found)throw Error('npm CLI not found. Install Node.js with npm, or set npm_execpath to npm-cli.js.');
  return found;
}
export function pythonCommand():{bin:string;args:string[]} {
  const candidates=process.env.PYTHON_BIN?[{bin:process.env.PYTHON_BIN,args:[]}]:[{bin:'python3',args:[]},{bin:'python',args:[]},{bin:'py',args:['-3']}];
  for(const c of candidates){
    const r=spawnSync(c.bin,[...c.args,'-c','import sys; sys.exit(0 if sys.version_info >= (3,11) else 1)'],{timeout:10000,windowsHide:true,stdio:'ignore'});
    if(!r.error&&r.status===0)return c;
  }
  throw Error('Python 3.11+ is required for production evidence gates. Install it or set PYTHON_BIN to the executable path (no flags). Draft rendering does not require Python.');
}
export interface EnvironmentCheck {name:string;ok:boolean;detail:string}
export function doctor():{ready:boolean;checks:EnvironmentCheck[];notes:string[]} {
  const checks:EnvironmentCheck[]=[{name:'Node.js >=22',ok:Number(process.versions.node.split('.')[0])>=22,detail:process.version}];
  try{checks.push({name:'npm',ok:true,detail:npmEntry()});}catch(e){checks.push({name:'npm',ok:false,detail:String(e)});}
  for(const [name,variable] of [['FFmpeg','FFMPEG_BIN'],['ffprobe','FFPROBE_BIN']]){
    const bin=process.env[variable!]??name!.toLowerCase(),r=spawnSync(bin,['-version'],{encoding:'utf8',timeout:10000,windowsHide:true});
    checks.push({name:name!,ok:!r.error&&r.status===0,detail:!r.error&&r.status===0?r.stdout.split(/\r?\n/)[0]!: `Not executable: ${bin}. Install FFmpeg/ffprobe or set ${variable} to its executable path.`});
  }
  try{const p=pythonCommand();checks.push({name:'Python >=3.11 (production gates)',ok:true,detail:p.bin});}catch(e){checks.push({name:'Python >=3.11 (production gates)',ok:false,detail:String(e)});}
  const browser=process.env.REMOTION_BROWSER_EXECUTABLE;
  if(browser)checks.push({name:'Explicit browser',ok:existsSync(browser),detail:browser});
  return {ready:checks.every(c=>c.ok),checks,notes:['Renderer dependencies and Chrome Headless Shell are installed separately in each film project. Run npm run browser:install there before an offline render.','A successful doctor is not a browser launch, model API test, or visual/listening approval. Run the bundled demo to test actual rendering.','Install fonts for your script language; the bundled English demo uses system sans-serif.']};
}
