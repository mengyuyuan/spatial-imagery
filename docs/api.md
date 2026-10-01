# API reference / 接口说明

Browser-safe exports come from `spatial-imagery`. Filesystem/media helpers use `spatial-imagery/node`; the executable production API uses `spatial-imagery/production`. The emitted declarations in `dist/*.d.ts` are the complete type contract. Core sampling functions do not read files, access the network, run a renderer or mutate caller input.

## Time and coordinates / 时间与坐标

Motion/audio: seconds. Plans/samples: `[from,to)` integer frames. Convert explicitly. `Vec3` is a readonly `[x,y,z]`; world units are yours to define. Example scenes use Z-up. Camera FOV is vertical degrees. Audio pan is -1 left, 0 center, +1 right; gains are linear amplitude internally, input gainDb is dB.

| Function | Inputs → output | Notes / 边界 |
|---|---|---|
| `motionPath(keys)` | `MotionKey[]` → `(seconds) => {position, velocity}` | At least two strictly increasing finite times. Cubic Hermite; tangent in units/second. Missing tangent = zero. Clamps outside keys, velocity zero outside. |
| `track(keys)` | `{time,value,easing?}[]` → number sampler | The destination key supplies segment easing; default smoothstep. One key is a constant. |
| `followCamera(subject,t,options)` | subject sampler + offset/lookAhead/up/fov → `CameraPose` | World-space offset. Rejects degenerate view direction/up. Not a spring simulation. |
| `project(point,camera,width,height)` | world point → `{x,y,depth}` or null | Perspective projection, pixels; at/behind camera returns null. No occlusion test. |
| `handoffDelta(a,b)` | screen states → position/velocity difference, scale ratio | Diagnostic, not an artistic pass/fail verdict. Size must be positive. |
| `sampleCue(cue,t)` | sound cue → active/gain/pan/left/right/sourceTime | Source time advances at 1×; offline stretching belongs in the mixer. Outside event: gain zero. |
| `gainEnvelope(cue,rate,start,count)` | cue and sample interval → Float32Array | Samples seconds at audio rate. Count limited to 100 million; stream longer envelopes in chunks. |
| `crossfade(t,start,end)` | transition interval → `[old,new]` amplitude weights | Smooth equal-power, appropriate for uncorrelated sources; does not mix files. |
| `alignSound(action,anchor,sourceIn=0)` | timeline/source seconds → clip start | May be negative: trim or move timeline explicitly; do not silently discard onset. |
| `validateCue(cue)` | cue → void or RangeError | Positive duration, finite values, legal fades and pan. |
| `dbToGain(db)` | dB → amplitude | Mathematical conversion. Validate application inputs. |
| `validatePlan(unknown)` | JSON → `Issue[]` | Nonthrowing structural validation; errors vs warnings. Does not inspect files or certify meaning/rights. |
| `definePlan(plan)` | typed plan → independent copy | Throws on structural errors. Warnings remain available through validatePlan. |
| `shotAt(plan,frame)` | validated plan + absolute frame → shot or undefined | Half-open boundaries; outside timeline undefined. |
| `searchAssets(assets,query,options)` | metadata + terms → matches | All terms; optional kind/localOnly. Reference links remain references. |
| `validateSample(sample)` | typed sample → void or RangeError | Hash/range/version and approval evidence. Typed API, not an untrusted-JSON parser. |
| `searchSamples(samples,query,options)` | sample records → matches | By default approved_in_scope only. Optional scope/includeUnapproved. |

Math helpers: `clamp`, `linear`, `smooth`, `smoother`, `mix`, `add`, `sub`, `scale`, `length`, `lerp3`, `progress`. `progress` rejects a nonpositive interval. Easing functions clamp normalized progress to [0,1].

## Remotion integration / 与 Remotion 结合

Create samplers outside the component, use `useCurrentFrame()/fps` inside it, and apply sampled transforms. Sequences use local frames; add the intended global offset when sampling a global timeline. For simple Audio volume, sample a cue against the global frame. For continuous offline envelopes, use `gainEnvelope` at the audio rate and mix before composition.

The launch example exports SDK states to JSON and Blender consumes them. That makes motion deterministic even when frames render out of order. The composition then adds titles, acquired footage and the mixed sound. It is not a claim that the core itself is a rendering engine.

## CLI

v0.2 adds `make <script.md> --out <project> --config <config.json> --catalog <assets.json> [--design <design.json>] [--install] [--render]`, `render <project> [--install]` and `search <query> --out <catalog.json> [--key-env <variable>]`. See [script-to-video](script-to-video.md). `make` creates a new editable project and never overwrites an existing output directory. A configured model designs the film unless an explicit design is imported; no silent template fallback is used.

`spatial-imagery init <directory>` creates a starter storyboard and refuses to overwrite an existing one. `check <file>` prints structured issues and exits 1 on errors. `catalog <file> [query]` searches assets in a valid plan. It does not download files or execute instructions embedded in metadata.

`audit <storyboard.json>` hashes the local assets relative to the design file's directory. It resolves symlinks and refuses paths outside that project root. A missing raw stock clip is an expected error until you run the explicit example downloader. `media <video> <fps> <frames>` uses ffprobe on PATH and checks decoded frame count, frame rate, video-stream duration and audio duration. It requires an audio stream; use the Node API with `audio: false` for a silent render.

### Optional Node subpath

`import {sha256File, auditAssets, probeMedia, auditMedia} from 'spatial-imagery/node'`.

- `sha256File(path)` streams bytes into SHA256.
- `auditAssets(plan, projectRoot)` verifies existing local files and reports references separately. It does not download assets, infer rights or search outside the chosen root.
- `probeMedia(path, ffprobe?)` executes ffprobe without a shell and counts actual decoded frames. Install FFmpeg separately.
- `auditMedia(probe, {fps, frames, audio?})` returns diagnostic strings. Audio duration tolerance is two video frames for encoding padding. It does not check aesthetic quality, sound comfort, timestamps or color tags; those remain separate final QA checks.

Node-only auditing stays out of the browser core dependency graph. 本地哈希核验和媒体检查位于单独的 Node 子入口，不影响浏览器端核心包；校验文件身份不等于许可或审美通过。

## Known boundaries / 当前边界

- `scriptLines`, `normalizeScript` and `validateFilm` are browser-safe design helpers. `makeFilm`, `requestJSON`, `searchPexels`, `installProject` and `renderProject` belong to the Node production subpath; these may access the network/filesystem or run explicitly requested production commands.
- `FilmDesign` supports global-frame scene layers/camera keys, script-line coverage, real media and second-based audio cues. Default generated geometry is 2D/CSS 2.5D. A project's editable composition is the extension point for bespoke/true-3D rendering.

- Spatial samplers do not model collisions, deformation, materials or lighting; the renderer owns geometry and shading.
- Equal-power panning assumes a mono source; downmix deliberately or implement an appropriate stereo balance in your mixer.
- No asset-license inference or automatic aesthetic approval.
- Core sampling is deterministic across seeks, but GPU rendering, fonts and external codec versions can change pixels across machines.
- A/B design records describe staging; this version has no segmentation, transcription or compositing model.
