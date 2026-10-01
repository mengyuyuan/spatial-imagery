import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const v2=process.argv.includes('--v2');
const manifest=JSON.parse(await readFile(path.join(root,v2?'assets-v2.json':'asset-manifest.json'),'utf8'));
for(const asset of v2?manifest:manifest.filter(a=>a.id==='video:ink')){
const out=path.join(root,asset.path);await mkdir(path.dirname(out),{recursive:true});
const existing=await readFile(out).catch(()=>null);
if(existing&&createHash('sha256').update(existing).digest('hex')===asset.sha256)console.log('Verified existing stock footage');
else{
  if(!asset.download)throw new Error(`Missing bundled asset ${asset.id}; restore it from the repository.`);
  const response=await fetch(asset.download,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(`Download failed: ${response.status}`);
  const data=Buffer.from(await response.arrayBuffer());
  if(createHash('sha256').update(data).digest('hex')!==asset.sha256)throw new Error('Source changed. Review before updating the manifest.');
  await writeFile(out,data);console.log('Fetched verified stock footage; excluded from the SDK package');
}
}
if(v2){await mkdir(path.join(root,'public'),{recursive:true});for(const [source,name] of [['assets/stock/ink.mp4','ink.mp4'],['assets/stock/bubbles-51884.mp4','bubbles-51884.mp4']])await copyFile(path.join(root,source),path.join(root,'public',name));}
