import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'asset-manifest.json'),'utf8'));
const asset=manifest.find(a=>a.id==='video:ink');
const out=path.join(root,asset.path);await mkdir(path.dirname(out),{recursive:true});
const existing=await readFile(out).catch(()=>null);
if(existing&&createHash('sha256').update(existing).digest('hex')===asset.sha256)console.log('Verified existing stock footage');
else{
  const response=await fetch(asset.download,{signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw new Error(`Download failed: ${response.status}`);
  const data=Buffer.from(await response.arrayBuffer());
  if(createHash('sha256').update(data).digest('hex')!==asset.sha256)throw new Error('Source changed. Review before updating the manifest.');
  await writeFile(out,data);console.log('Fetched verified stock footage; excluded from the SDK package');
}
