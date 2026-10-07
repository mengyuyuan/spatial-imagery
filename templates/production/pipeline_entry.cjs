// Call before bundling/rendering and again immediately before export; no cached pass token.
const cp = require('child_process');
const path = require('path');
module.exports = function preflight({python,project,mode,entry,design,output,range,media}) {
  if (!python) throw Error('Pass the configured Python interpreter explicitly');
  const args=[path.join(__dirname,'pipeline_entry.py'),'--project',project,'--mode',mode,
    '--entry',entry,'--design',design,'--output',output,'--range',...range.map(String)];
  if(media) args.push('--media',media);
  const result=cp.spawnSync(python,args,{cwd:project,encoding:'utf8',windowsHide:true});
  if(result.status!==0) throw Error('PIPELINE BLOCKED: '+(result.stdout||result.stderr||String(result.error)));
  return JSON.parse(result.stdout);
};
