import {scriptLines} from './production.js';
/** Read-only human view of the canonical executable design. */
export function designTable(design:Record<string,any>,script:string):string {
  const lines=new Map(scriptLines(script).map(line=>[line.id,line.text]));
  const escape=(v:unknown)=>String(v??'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
  const staging=(design.shots??[]).filter((s:any)=>s.staging).map((s:any)=>`| ${s.id} / ${s.state} | ${escape(s.staging.purpose+' / '+s.staging.framing)} | ${escape(s.staging.presenterLayers.join(', '))} | ${escape(s.staging.contentLayers.join(', '))} | ${escape(s.staging.environmentLayers.join(', '))} | ${escape(s.staging.protectedLayers.join(', '))} | ${s.staging.landing.join('–')} |`);
  return `# ${escape(design.title)}\n\nGenerated view / 自动生成视图。Edit design.json, then run gates refresh. 不在本表另写一套设计。\n\n${escape(design.direction)}\n\n| Shot | Frames | Script | Subject / change | Camera | Sound |\n|---|---|---|---|---|---|\n`+
    (design.shots??[]).map((s:any)=>`| ${s.id} | ${s.from}–${s.to} | ${escape((s.lines??[]).map((id:string)=>lines.get(id)).join(' / '))} | ${escape(`${s.subject}: ${s.initial} → ${s.action} → ${s.result}`)} | ${escape(s.camera)} | ${escape(s.sound)} |`).join('\n')+
    (staging.length?'\n\n## A/B staging / 主次与避让\n\n| Shot | Purpose / framing | Presenter | Content | Environment | Protected information | Landing |\n|---|---|---|---|---|---|---|\n'+staging.join('\n')+'\n':'')+
    '\n\n## Complete executable decisions / 完整执行设计\n\n```json\n'+JSON.stringify(design,null,2)+'\n```\n';
}
