// Historical renderers are reproduction studies, not alternate production entry points.
import {existsSync} from 'node:fs';
export function requireDiagnosticMode(args, stillFlag){
  if(!args.includes('--draft')&&!(stillFlag&&args.includes(stillFlag))){
    throw Error('Production gate blocked: this historical example has no schema-v4 motion/camera/sound evidence. Use --draft for a diagnostic reproduction; migrate the composition into a current generated project for gated production and delivery.');
  }
}
export function refuseExistingOutput(path){
  if(existsSync(path))throw Error('Diagnostic output already exists; preserve it or choose a new project version before rerendering.');
}
