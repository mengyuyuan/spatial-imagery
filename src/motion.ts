/** All time arguments are seconds. Sampling is pure: no hidden playback state. */
export type Vec3 = readonly [number, number, number];
export type Easing = (progress: number) => number;
export const clamp = (x: number, min = 0, max = 1): number => Math.min(max, Math.max(min, x));
export const linear: Easing = (t) => clamp(t);
export const smooth: Easing = (t) => { const u = clamp(t); return u * u * (3 - 2 * u); };
export const smoother: Easing = (t) => { const u = clamp(t); return u ** 3 * (u * (u * 6 - 15) + 10); };
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, n: number): Vec3 => [a[0] * n, a[1] * n, a[2] * n];
export const length = (a: Vec3): number => Math.hypot(...a);
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scale(sub(b, a), t));
export function progress(time: number, start: number, end: number): number {
  if (![time, start, end].every(Number.isFinite) || end <= start) throw new RangeError('Finite time and end > start required');
  return clamp((time - start) / (end - start));
}
export interface Keyframe { time: number; value: number; easing?: Easing }
export function track(keys: readonly Keyframe[]): (time: number) => number {
  if (!keys.length || keys.some((k, i) => !Number.isFinite(k.time) || !Number.isFinite(k.value) || (i > 0 && k.time <= keys[i - 1]!.time)))
    throw new RangeError('Track keys must be finite and strictly increasing');
  const copy = keys.map(k => ({...k}));
  return time => {
    if (!Number.isFinite(time)) throw new RangeError('Finite time required');
    if (time <= copy[0]!.time) return copy[0]!.value;
    for (let i = 1; i < copy.length; i++) {
      const a = copy[i - 1]!, b = copy[i]!;
      if (time <= b.time) return mix(a.value, b.value, (b.easing ?? smooth)(progress(time, a.time, b.time)));
    }
    return copy.at(-1)!.value;
  };
}
export interface MotionKey { time: number; position: Vec3; /** World units / second. Omitted = pause at this key. */ velocity?: Vec3 }
export interface MotionSample { position: Vec3; velocity: Vec3 }
const finiteVec = (v: Vec3) => v.length === 3 && v.every(Number.isFinite);
/** Piecewise cubic Hermite motion. Shared key velocities provide C1 continuity. */
export function motionPath(keys: readonly MotionKey[]): (time: number) => MotionSample {
  if (keys.length < 2 || keys.some((k, i) => !Number.isFinite(k.time) || !finiteVec(k.position) || (k.velocity && !finiteVec(k.velocity)) || (i > 0 && k.time <= keys[i - 1]!.time)))
    throw new RangeError('Need >= 2 finite, ordered motion keys');
  const copy = keys.map(k => ({time: k.time, position: [...k.position] as unknown as Vec3, velocity: [...(k.velocity ?? [0, 0, 0])] as unknown as Vec3}));
  return time => {
    if (!Number.isFinite(time)) throw new RangeError('Finite time required');
    const first = copy[0]!, last = copy.at(-1)!;
    if (time < first.time) return {position: [...first.position] as unknown as Vec3, velocity: [0, 0, 0]};
    if (time > last.time) return {position: [...last.position] as unknown as Vec3, velocity: [0, 0, 0]};
    const i = Math.max(1, copy.findIndex(k => k.time >= time));
    const a = copy[i - 1]!, b = copy[i]!, dt = b.time - a.time, u = clamp((time - a.time) / dt);
    const v: number[] = [], p: number[] = [];
    for (let c = 0; c < 3; c++) {
      const p0 = a.position[c]!, p1 = b.position[c]!, m0 = a.velocity[c]! * dt, m1 = b.velocity[c]! * dt;
      p.push((2*u**3-3*u*u+1)*p0 + (u**3-2*u*u+u)*m0 + (-2*u**3+3*u*u)*p1 + (u**3-u*u)*m1);
      v.push(((6*u*u-6*u)*p0 + (3*u*u-4*u+1)*m0 + (-6*u*u+6*u)*p1 + (3*u*u-2*u)*m1) / dt);
    }
    return {position: p as unknown as Vec3, velocity: v as unknown as Vec3};
  };
}
export interface CameraPose { position: Vec3; target: Vec3; up: Vec3; fov: number }
export interface FollowOptions { offset: Vec3; lookAhead?: number; up?: Vec3; fov?: number }
/** Deterministic follow rig; offset is world-space, lookAhead is seconds. */
export function followCamera(subject: (t: number) => MotionSample, time: number, options: FollowOptions): CameraPose {
  const s = subject(time), fov = options.fov ?? 45, up = options.up ?? [0, 0, 1];
  if (!finiteVec(options.offset) || length(options.offset) < 1e-9 || !(fov > 0 && fov < 180) || !Number.isFinite(options.lookAhead ?? 0)) throw new RangeError('Invalid camera options');
  const pose = {position: add(s.position, options.offset), target: add(s.position, scale(s.velocity, options.lookAhead ?? 0)), up, fov};
  cameraBasis(pose);
  return pose;
}
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const dot = (a: Vec3, b: Vec3): number => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function cameraBasis(camera: CameraPose) {
  if (![camera.position, camera.target, camera.up].every(finiteVec) || !Number.isFinite(camera.fov) || camera.fov <= 0 || camera.fov >= 180) throw new RangeError('Invalid camera');
  const dir = sub(camera.target, camera.position);
  if (length(dir) < 1e-9) throw new RangeError('Camera and target coincide');
  const forward = scale(dir, 1/length(dir)), right = cross(forward, camera.up);
  if (length(right) < 1e-9) throw new RangeError('Camera up is parallel to viewing direction');
  const normalizedRight = scale(right, 1/length(right));
  return {forward, right: normalizedRight, up: cross(normalizedRight, forward)};
}
/** Perspective projection in pixels; null means at/behind the camera. fov is vertical. */
export function project(point: Vec3, camera: CameraPose, width: number, height: number): {x: number; y: number; depth: number} | null {
  if (!finiteVec(point) || ![width, height].every(x => Number.isFinite(x) && x > 0)) throw new RangeError('Invalid viewport or point');
  const b = cameraBasis(camera), relative = sub(point, camera.position), z = dot(relative, b.forward);
  if (z <= 1e-6) return null;
  const focal = height / (2 * Math.tan(camera.fov * Math.PI / 360));
  return {x: width/2 + dot(relative, b.right)*focal/z, y: height/2 - dot(relative, b.up)*focal/z, depth:z};
}
export interface ScreenState { x: number; y: number; size: number; vx: number; vy: number }
/** Diagnostic only: a clean intentional cut can be valid even with large differences. */
export function handoffDelta(a: ScreenState, b: ScreenState) {
  if (Object.values(a).concat(Object.values(b)).some(x => !Number.isFinite(x)) || a.size <= 0 || b.size <= 0) throw new RangeError('Invalid screen state');
  return {positionPixels: Math.hypot(b.x-a.x,b.y-a.y), velocityPixelsPerSecond: Math.hypot(b.vx-a.vx,b.vy-a.vy), scaleRatio: b.size/a.size};
}
