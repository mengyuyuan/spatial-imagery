# Execution and evidence contract · 3.26

SDK 0.5 retains schema 4 and requires `executionContractVersion: 1`. Preserve old projects, regenerate with the new package, port the actual implementation, and re-review new output. Merely editing the version number is not migration.

The executable design is `design.json`. `design-table.md` is a generated human-readable view, including the complete decisions. Edit the JSON and run `gates refresh`. Refresh preserves a differing old table in `design-history/<sha256>.md`, regenerates the view, synchronizes decisions and invalidates playback evidence. Editing the table alone fails the gate; it never silently changes the renderer. Older structured designs need these bindings before import; basic legacy draft imports still cannot pass G1. No old approval is automatically migrated.

A hand-authored project outside the SDK may retain one Markdown source, but must bind its export adapter and all derived execution/SH/TR data in the input inventory. Such renderers use `custom` measurements. The Python record check alone cannot claim to sample default CSS channels; bundled CSS projects run the Node gate as well.

## Motion and camera bindings

Each SH requires `motionBinding` and `cameraBinding`; each TR requires `cameraBinding`. Each binding contains:

```json
{"mode":"animated","subject":"petal","channels":["layers.petal.rotateX"],"reason":"The petal turns from its edge to its visible face"}
```

Camera example: `{"mode":"animated","subject":"petal","channels":["camera.x","camera.zoom"],"reason":"Follow the petal before revealing the water surface"}`. Use `mode: "hold"` with a concrete reason for a fixed observation or reading interval. This does not waive the motion/camera review.

For `layers-2.5d`, motion channels must exist on the bound subject: x/y/z, width/height, scale, rotateX/Y/Z, radius, reveal or opacity. Camera channels are x/y/zoom/rotateZ. The validator samples actual global integer frames in the target interval: animated channels must change; declared holds must remain constant. Empty hold channels mean all supported channels are checked. A one-frame interval cannot prove motion internally; use a motivated hold and review its adjacent TR context. Changing opacity or position does not prove a semantic transformation: the independent intent/animation review still decides that.

For `custom`, use the same prefixes (`layers.<subject>.<measurement>`, `camera.<measurement>`) and instrument the real renderer. Even holds need at least one measured channel. Do not substitute planned keyframes for actual evaluated values or claim that the CSS layout checker measured a Three.js mesh.

SH and TR `implementation` entries at G2/G3 use `path:line`. The file must be an existing UTF-8 source included in `inputs` with role `source`, and the line must exist. A prose label or nonexistent function/file is not implementation evidence.

## A/B through full-frame inserts

For talking-head films the next settled A/B state is compared with the previous A/B state even when `full` shots intervene. On the TR entering the new A/B state, set `takeover.fromShot` to the originating A/B SH. Existing `proofLayers` and `environmentProofLayers` identify those two states; the destination completion frame remains inside the entering TR's reviewed range. Full inserts inherit protected information IDs from both adjacent A/B states; measure zero overlap for inactive layers too. Full inserts remain legal, and every adjacent TR still requires its own review. Background/content visibility uses opacity-weighted area; conservative information clearance continues to treat transparent holes as occupied.

## Custom renderer measurements

G1 permits unimplemented custom work with concrete bindings. Draft rendering remains available. G2/G3 require an `executionEvidence` entry for every reviewed media file:

```json
{"media":"draft","evidence":{"path":"qa/pipeline-review/draft-execution.json","sha256":"<actual file hash>"}}
```

The renderer's JSON artifact must contain:

- `method: "renderer-mask-projection"`, `binding` equal to the current gate `executionBinding`, exact `mediaSha256`, composition `width`/`height`, and `producer: "src/measure.ts:1"` identifying the bound measuring code.
- `targets`: object keyed by each SH/TR. Each target's `frames` contains **every** integer frame of that target in order, with `frame` and `values` mapping all its bound channel names to finite evaluated numbers.
- Each target's `captures` contains hashed real rendered frame files at start, `floor((start+end-1)/2)` and end−1, with `frame`, `path`, `sha256`. Deduplicate those anchors for a short interval.
- Each A/B SH frame and intervening full-frame insert also has `staging.protectedOverlap`, mapping every protected layer ID to its measured overlap area with the presenter in composition pixels. Required information must have zero overlap. During the landing, include effective visible `presenterArea`, `contentArea`, `backgroundCoverage` (0..1), and `backgroundIdentities` (stable SHA256 identifiers of the visible environmental content).

Calculate presenter/content areas from the renderer's actual projected/alpha/occlusion result, after clipping and compositing, without double counting overlapping pixels. Background coverage is the effective environmental plate coverage before foreground compositing: it must fill the scene behind the presenter, not claim 90% of the final unobstructed pixels. Background identities describe environmental content; exclude camera pose, arbitrary scene names and tint-only changes. The gate checks complete ranges, finite values, actual channel change/hold, information overlap, A/B dominance, at least 90% environmental plate coverage and distinct landing backgrounds. For segmented drafts, every target must fit entirely in at least one registered media segment; keep enough transition context.

Capture measurements while evaluating the real render, retain the input inventory, and finalize the artifact against that exact encode after media registration. `executionBinding` binds inputs and media; review `binding` additionally includes the measurement-file identity. Replacing measurements invalidates prior playback reviews without creating a circular hash. `gates register-execution` attaches the current `qa/pipeline-review/draft-execution.json` or `output/final-execution.json`; it rejects stale binding/video identities and clears playback approvals. It does not manufacture measurements or approve a film. Re-run all affected reviews after attachment. A file/hash check cannot prove that a dishonest producer measured real pixels: inspect the actual captures and normal-speed video as a separate requirement.

## Sound and source quality

Mixing now defaults to preserving levels with no automatic ducking. Whole-bus sample clipping protection is recorded, not called loudness or intelligibility approval. Opt into normalization with both targets: `"mix":{"normalization":"loudness","lufs":-16,"truePeakDb":-1.5}`; those numbers are an example, not a project-independent target. For deliberate ducking add `"ducking":{"amount":0.4,"attack":0.12,"release":0.25}`. `amount:0` disables it; choose timing/depth against the actual motion sound and dialogue. Unknown/conflicting settings fail.

For recorded footage preserve source identity and the source→processing→compositing→encoding map. Keep proxies separate from production inputs; compare original RGB, processed subject, composite and decoded output at the same source time. Preserve the original RGB in opaque subject cores when possible, inspect alpha/hair/hands on light/dark/actual backgrounds, and avoid repeated lossy intermediates. Noise reduction requires level/time-aligned bypass listening; it is not automatically inserted. Cuts must modify actual picture/sound and remap dependent tracks. Report actual codec, frame sampling and remaining source softness honestly. These 3.25 quality requirements apply to relevant inputs, not every pure-graphics project.

These are mechanical execution and evidence checks. They do not replace design judgement, normal-speed viewing, sound audition, or scoped user feedback.

The detailed [source-quality and repair method (Chinese)](recording-quality-and-repair.zh-CN.md) supplies same-frame comparisons, processing-chain evidence, proxy separation and source-audio review. Its 3.25 examples are conditional, not fixed processing recipes.
