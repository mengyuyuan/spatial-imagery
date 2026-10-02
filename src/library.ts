export const sampleApprovalStatuses=['unreviewed','technical_only','approved_in_scope','needs_revision','rejected'] as const;
export interface Sample {
  id: string; version: string; title: string; sha256: string; fps: number; frames: number;
  path: string; tags: string[];
  ranges: {from: number; to: number; purpose: string}[];
  review: {technical: boolean; normalSpeed: boolean; listening: boolean};
  approval: {status: typeof sampleApprovalStatuses[number]; scope: string[]; quote?: string};
  assets: string[];
}
/** Approval belongs to an immutable file version and a named scope. */
export function validateSample(s: Sample): void {
  if (!s.id || !s.version || !/^[0-9a-f]{64}$/i.test(s.sha256) || !(Number.isFinite(s.fps)&&s.fps>0) || !Number.isSafeInteger(s.frames) || s.frames<=0 || !s.path || !s.title) throw new RangeError('Invalid sample identity');
  if (!s.ranges.length || s.ranges.some(r=>!Number.isSafeInteger(r.from)||!Number.isSafeInteger(r.to)||r.from<0||r.to> s.frames||r.to<=r.from||!r.purpose)) throw new RangeError('Invalid sample range');
  if (!sampleApprovalStatuses.includes(s.approval.status)) throw new RangeError(`Unknown sample approval status: ${s.approval.status}`);
  if (s.approval.status==='approved_in_scope' && (!s.approval.scope.length || !s.approval.quote?.trim())) throw new RangeError('Scoped approval requires scope and actual feedback');
}
export function searchSamples(samples: readonly Sample[], query: string, options: {includeUnapproved?: boolean; scope?: string} = {}): Sample[] {
  const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return samples.filter(s=>{
    validateSample(s);
    return (options.includeUnapproved||s.approval.status==='approved_in_scope')&&(!options.scope||s.approval.scope.includes(options.scope))&&terms.every(t=>[s.title,...s.tags,...s.ranges.map(r=>r.purpose)].join(' ').toLocaleLowerCase().includes(t));
  });
}
