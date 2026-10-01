# Spatial Imagery · 空间意象

**Give ideas room to move.** A TypeScript SDK for subject-led spatial storytelling: continuous motion, camera handoffs, sound envelopes, and auditable design tables.

[简体中文](README.zh-CN.md) · [Workflow](docs/pipeline.md) · [API](docs/api.md) · [Launch-film source](examples/launch-film/README.md)

https://github.com/user-attachments/assets/37f98ee4-dff0-4948-8d79-7f060c86b287

**30-second launch film — sound on.** Kinetic type, spatial camera moves, transforming shapes and a shared music beat. [Download the MP4](media/spatial-imagery-kinetic-v2.mp4).

**Status: v0.1.0, early SDK.** The package turns tested production ideas into deterministic functions and explicit records. It does not automatically write a good story, perform transcription/matting/relighting, or render a finished film from a prompt. Those remain production stages described in the workflow.

## What is implemented

| Capability | What you get |
|---|---|
| Motion | Pure seconds-based scalar tracks and cubic Hermite paths with analytical velocity |
| Camera | Subject following, look-ahead, perspective projection and screen-space handoff diagnostics |
| Sound | Audible-anchor alignment, motion intensity, fades, equal-power material crossfades, stereo pan, sample-rate gain envelopes |
| Design | Typed A/B/full-frame shots, subject state chains, camera task, sound intent, reading windows, handoff records and JSON validation |
| Libraries | Separate source assets and immutable sample versions, source/hash/license metadata, scoped approval and search |
| Audit | Node-only file hashes, project-boundary checks and actual decoded video/audio duration checks via ffprobe |
| Example | An original bilingual 30-second film, Blender scene driven by SDK poses, Remotion composition and reproducible SFX mix |

No runtime dependencies in the core. Remotion and Blender are optional renderers, installed separately for the example.

## Run locally

Node.js 22+ is required. This initial release is distributed as source/a locally packed tarball; **it is not published to npm yet**.

```sh
git clone https://github.com/mengyuyuan/spatial-imagery.git
cd spatial-imagery
npm ci
npm test
node dist/cli.js init ./my-film
node dist/cli.js check ./my-film/storyboard.json
npm pack
# In another project, install the generated spatial-imagery-0.1.0.tgz.
```

While the launch PR is open, check out its feature branch to access the full source. Never run `npm install spatial-imagery` assuming this repository owns a registry name.

```ts
import {motionPath, followCamera, sampleCue} from 'spatial-imagery';

const subject = motionPath([
  {time: 0, position: [0, 0, 0]},
  {time: 2, position: [0, 6, 1], velocity: [0, 3, 0]},
  {time: 4, position: [1, 12, 1]},
]);
const time = frame / fps; // your renderer's absolute frame
const object = subject(time);
const camera = followCamera(subject, time, {
  offset: [0, -5, 2], lookAhead: 0.12, fov: 45,
});
const sound = sampleCue({
  id: 'SFX01', asset: 'licensed-air.wav', start: 0, end: 4,
  sourceIn: 0.5, fadeIn: 0.3, fadeOut: 0.6, gainDb: -12,
  pan: [-0.2, 0.2],
}, time);
// Apply object.position and camera to your renderer, sound.gain to your mixer.
```

Paths and cameras are pure functions: seeking frame 80 before frame 20 produces the same result as forward playback. The SDK emits parameters; Blender, Three.js, Remotion or your mixer applies them. Coordinates are caller-defined world units; examples use Z-up. FOV is vertical degrees.

## Make a film

Start with meaning → identify the subject → specify the visible transformation → plan the camera's discovery → source real footage and sound → share one timeline → render → review → archive the exact version. See the [complete production workflow](docs/pipeline.md). A validator catches structural mistakes; it cannot certify visual quality, rights or listening comfort.

To reproduce the launch film, follow [the example instructions](examples/launch-film/README.md). View its [design table](examples/launch-film/design.md), [source manifest](examples/launch-film/asset-manifest.json) and [QA record](examples/launch-film/qa.json). The sample demonstrates a specific visual direction; the SDK does not prescribe coral tiles, portals or a particular color palette.

## Contributing and license

Run `npm test` and add behavioral tests for new public functions. Keep every frame deterministic, use explicit time units, preserve source attribution, and separate technical validation from subjective approval. See [CONTRIBUTING](CONTRIBUTING.md).

Original code: **MIT**. Workflow prose: **CC BY 4.0**. Media and optional renderers have separate terms: [NOTICE](NOTICE.md). No paid library or personal source footage is bundled.
