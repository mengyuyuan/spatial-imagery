# Launch film / 双语宣传片

An original 30-second film showing the SDK in use. [Design table](design.md), [sources](asset-manifest.json), [QA](qa.json). Stock source files are excluded from Git. Seven CC0 sound sources are included with provenance. The finished MP4 is in [`media/`](../../media/).

## Reproduce / 复现

Requirements: Node.js 22+, Blender 5.2 (tested with 5.2.1), FFmpeg/ffprobe with libx264 and zscale on PATH. Chinese font: Microsoft YaHei on Windows, or install Noto Sans CJK SC on other systems. Remotion has its own [license](https://www.remotion.dev/docs/license).

Run from the **repository root**:

```sh
npm ci
npm run demo:poses
node examples/launch-film/fetch-assets.mjs
blender -b --python examples/launch-film/scene.py -- --stills
# Review the sampled frames before the full render.
blender -b --python examples/launch-film/scene.py -- --render
node examples/launch-film/mix.mjs
node examples/launch-film/prepare.mjs
npm ci --prefix examples/launch-film
node examples/launch-film/render.mjs
node examples/launch-film/qa.mjs
```

On Windows, use the installed Blender executable's full path if it is not on PATH. No hard-coded machine-specific path is required by the project. The scene skips existing frame PNGs for resuming a render; after changing the scene or poses, remove only this example's generated `build/frames/` before re-rendering. Do not mix old frames with a new scene.

After dependencies are installed, `node examples/launch-film/reproduce.mjs` runs the production commands in order. Set `BLENDER_BIN` to the executable path when needed. This runner does not install or authenticate third-party tools. Allow roughly 5 GB of working disk space for frame PNGs and rendering caches; the compressed SDK itself is much smaller.

Pipeline stages are represented by `design.md` (research/direction/script/scene plan), `asset-manifest.json` (assets), the explicit composition/cues (edit), rendered media plus `qa.json` (compose), and the repository PR (publish). These are project-native artifacts; this example does not claim OpenMontage's hosted execution or schema-validation service ran.

`poses.mjs` imports the SDK and exports 600 camera/subject states. `scene.py` uses those absolute states to render original meshes. `mix.mjs` processes acquired sounds and uses SDK envelopes at 48 kHz; motion intensity for the travel cue derives from the SDK subject velocity. `prepare.mjs` performs sRGB-to-BT.709 conversion, then `render.mjs` composes 900 final frames with bilingual type, moving footage and the mix.

这里展示的是 SDK 驱动的原创样片，不把示例造型当通用模板。正常速度审看与听审状态以 QA 为准，不因能够渲染就自动记为艺术通过。需要换音乐时先检索、核对许可并完成节奏表；不要把商用成片的配乐提取进仓库。
