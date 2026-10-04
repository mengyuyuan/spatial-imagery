# Script to video

**v0.4:** motion, camera and sound are independent mandatory production gates, including verified intentional silence. Explicit `videoType` is required; A/B is restricted to `talking-head`, while other films use `general` + `full`. See the [portable production-gate guide](../templates/production/PRODUCTION-GATES.md) for review and migration.

v0.4: first renders explicitly use `--draft` → `output/draft.mp4` and `draft-qa.json`. Formal rendering requires bundled G1/G2 evidence; delivery requires G3. Python 3.11+ is required for gates only. See the generated `PRODUCTION-GATES.md`. / 首次出片为明确的诊断草样，正式渲染与交付须完成随工程携带的门禁。

v0.2 adds an executable path: script → model-authored design → validation → acquired media → editable Remotion project → continuous sound mix → MP4 and QA. See the [detailed Chinese guide](script-to-video.zh-CN.md) and [worked example](../examples/script-to-film/README.md).

Build the SDK with `npm ci && npm run build`. Copy `templates/production.config.example.json`, select an explicit model ID and your provider's OpenAI-compatible Chat Completions base URL. Set the key in the named environment variable; never write the key into project files. `jsonMode: false` supports providers without JSON response mode. HTTPS is required except for local model servers.

```sh
node dist/cli.js make script.md --config film.config.json --catalog assets.json --out my-film --install --render --draft
```

The script and candidate metadata are sent to the configured model; local media paths and credentials are not sent in the prompt. There is one bounded repair attempt for malformed JSON/designs. The runner does not select another model or silently fall back to arbitrary templates. Without model configuration, import a design from your agent or designer:

```sh
node dist/cli.js make script.md --design design.json --config film.config.json --catalog assets.json --out my-film --install --render --draft
```

Every nonblank content line is assigned a stable line ID. Designs must cover all lines, preserve their meaning, identify the subject/change/camera/handoff, and supply actual timed layers and sound cues. UTF-8 BOM and CRLF/LF differences are normalized for script identity. One persistent layer can span several shots. Shapes and motion are composed freely rather than chosen from a fixed title-card menu.

## Design contract and execution boundary

The model's system context is assembled from the packaged planner, design principles, design synthesis and production SOP. `design-instructions.md` saves that context; `planner-context.json` records standard 3.24, individual source hashes and the combined hash. This makes the actual method inspectable without requiring private skill files. Imported designs record `source: imported`; this is not a claim that a model used those instructions.

Model-authored `FilmDesign` must supply `designRationale` (basis, alternatives, choice, perception, risk), `execution` (renderer, reason, requirements), shot meaning/identity/kind/changes/intent/reading, one structured `transitions` entry per adjacent pair, and all eight `gatePlans`. See the shipped [planner contract](../templates/production/planner.md) and exported types. Focus IDs must reference layers active at the relevant shot boundaries and connect across handoffs. Motion, camera and sound plans cannot be disabled. Silence needs an explicit `audioReason`. Design decisions are retained in `production-gates.json`; the runner never accepts model-generated approvals. Legacy `--design` imports remain usable but require manual completion of missing gate decisions.

Requested size, FPS, video type and duration, unsupported execution fields, and shot assets declared without actual overlapping use are checked inside the bounded repair loop. Invalid designs get one correction request with those failures; the second invalid response stops with recorded errors. A camera supports only `x`, `y`, `zoom`, `rotateZ` and `perspective`; invented `z`, `target` or layer shader fields are errors rather than ignored behavior.

Choose `execution.renderer: layers-2.5d` for supported scene graphs. Choose `custom` when the design needs real meshes, spatial camera/lighting or custom deformation. That route returns `custom_implementation_required` and creates an explicit `src/index.tsx` placeholder; a maker must implement the named `Spatial-Imagery` composition, retain the planned timing/assets/audio, then render and review. This routes capability limits honestly; it is not an automatic Three.js/Blender implementation. It cannot fall back to a flat movie while claiming the requested 3D design was executed.

The optional `search: {"provider":"pexels","apiKeyEnv":"PEXELS_API_KEY","perQuery":4}` configuration searches real videos using model-proposed phrases, or explicit `queries`. `research.json` preserves candidates. Music/SFX currently come from a supplied catalog; there is no universal sound-site crawler. Catalog entries carry source, license, usage/redistribution boundary, hash, duration and review status. Selected downloads are acquired, hashed and decoded. References alone do not count as footage; source ranges must fit actual media. Local paths are relative to, and contained by, the catalog directory. Search results are not automatically marked visually reviewed.

Project policy is explicit: `music: allowed|off`, `narration: off|provided`, `footage: required|optional`. Music is no longer globally prohibited. A provided narration requires a real audio cue. Default footage policy requires acquired video; an explicitly procedural-only project may choose optional. Canvas, duration, palette and motion are project decisions, not fixed to the launch film.

The generated renderer supports text, rectangles, ellipses, SVG paths, images and video in a 2D/CSS 2.5D scene graph with global-frame channels and a camera. It is not a full 3D geometry/lighting engine. Edit `src/index.tsx` to add bespoke Three.js scenes or another renderer. Audio uses acquired recordings, sample-rate motion envelopes, entry/tail fades, source trims, equal-power movement panning and smooth narration ducking. Stereo music/narration are preserved. Whole-film two-pass normalization defaults to -16 LUFS and a -1.5 dBTP ceiling, configurable through design.mix.lufs / truePeakDb. The current offline audio bus has a 512 MiB memory budget; longer films need segment rendering, never silent truncation.

`--install` runs npm ci with the bundled renderer lockfile; `--render --draft` produces diagnostic media; `--render` alone requires production evidence. Omitting those flags leaves an editable project. Existing output directories are never overwritten by `make`.

```sh
cd my-film
npm run studio
npm run render:draft
```

Outputs include source script, machine/readable designs, acquired asset identities, project policy, editable source, a render, representative frames and QA. Full decode, frame count, dimensions, FPS and audio/video duration are checked. Technical checks never mark normal-speed viewing, listening or aesthetic approval as passed. Preserve accepted versions and review the actual film before publication. This command does not publish anything externally.

Still external: speech transcription/editing, person matting/relighting, voice generation, arbitrary sound-library search and artistic review. Node.js 22+, FFmpeg/ffprobe, Chromium, suitable fonts and renderer dependencies are required. The chosen model provider controls availability, cost and context limits. No key or model-specific integration was embedded in the package.

Protocol references: [Chat Completions](https://developers.openai.com/api/reference/resources/chat), [Pexels API](https://www.pexels.com/api/documentation/), [Remotion rendering](https://www.remotion.dev/docs/renderer/render-media).

## 3.24: A/B executable contract and migration

See [A/B executable contract and migration](presenter-staging.md). A/B requires shot staging roles, protected information, landing windows and transition takeover records. A/B must use distinct background scenes with an authored transition; the same backdrop is rejected even when content scales up. Every transition frame must keep required information clear. General/full films remain outside A/B.
