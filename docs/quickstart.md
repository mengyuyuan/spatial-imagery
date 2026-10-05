# First working film / 第一次跑通

The package includes the generator, locked renderer template, sounds, evidence validator and demo design. It does not require the author's machine, Codex, Hermes or any private media library. The demo is an installation test, not a ready-made style for every script.

## Install prerequisites / 安装前提

| Requirement | Used for |
|---|---|
| Node.js 22 or 24 with npm | SDK, generated project and renderer |
| FFmpeg and ffprobe on PATH | Audio processing and actual media checks |
| Python 3.11+ | G1/G2/G3 production evidence checks; not needed for drafts |
| Chrome Headless Shell | Installed by the generated project's `npm run browser:install`, or automatically on first render |
| Language fonts | System sans-serif works for the English demo; install an appropriately licensed CJK font for Chinese |

Install Node.js from [nodejs.org](https://nodejs.org/), Python from [python.org](https://www.python.org/downloads/) and FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html). Windows users must add the executable directories to PATH and open a new terminal. Ubuntu can install FFmpeg with `sudo apt-get update` then `sudo apt-get install -y ffmpeg`; macOS with Homebrew can use `brew install ffmpeg`. Minimal Linux containers also need Chrome's system libraries; see [Remotion Linux dependencies](https://www.remotion.dev/docs/miscellaneous/linux-dependencies).

Optional overrides are executable paths, never shell commands: `FFMPEG_BIN`, `FFPROBE_BIN`, `PYTHON_BIN`, `REMOTION_BROWSER_EXECUTABLE`. The SDK respects the same FFprobe override while acquiring source media and while checking the render. It never installs system packages itself.

## Source checkout / 源码方式

Run these in PowerShell, bash or zsh, one line at a time:

```sh
git clone https://github.com/mengyuyuan/spatial-imagery.git
cd spatial-imagery
npm ci
npm run build
node dist/cli.js doctor
node dist/cli.js demo --out first-film --install --render
```

Open `first-film/output/draft.mp4`. Expected: **6 seconds, 640×360, 30 fps, 180 decoded frames and stereo sound**. Technical results are in `first-film/output/draft-qa.json`. The fresh output directory must not already exist. The first install/browser download needs network access and disk space; no model key, stock-media download or private source is needed. Python can be absent for this diagnostic command even if `doctor` reports the production gate prerequisite missing.

Then edit `first-film/design.json` and `first-film/src/index.tsx`. The generated project is independent of the SDK checkout:

```sh
cd first-film
npm run studio
```

For a new draft version, preserve/rename the old draft MP4 and QA, then run `npm run render:draft`. To prepare offline use, complete `npm ci` and `npm run browser:install` in the film directory first. Do not copy another machine's `node_modules` across operating systems.

## Packed SDK / 安装打包版本

The repository does not claim the npm registry name. From the built checkout:

```sh
npm pack
```

In a separate empty consumer directory:

```sh
npm init -y
npm install /absolute/path/spatial-imagery-0.5.0.tgz
npx --no-install spatial-imagery doctor
npx --no-install spatial-imagery demo --out first-film --install --render
```

Use your actual tarball path (quote it if it contains spaces). All demo and gate files are inside the tarball. `--no-install` prevents npx from looking up an unrelated registry package. `npm run test:package` verifies a fresh consumer install; `npm run test:render` additionally installs a fresh renderer, downloads its browser and renders the bundled sample.

## Your script and production delivery / 自己的脚本与正式交付

Read [script-to-video](script-to-video.md) / [中文指南](script-to-video.zh-CN.md). Import a designer-authored `FilmDesign`, or configure your own OpenAI-compatible provider and model. Model use needs your key and network access; the included demo does not exercise a live provider. Music, narration and sourced footage are project choices. Existing speech transcription, matting and physical 3D scenes still need their corresponding tools or custom implementation.

`make ... --install --render --draft` creates a diagnostic film. From v0.4, `--render` without `--draft` and `npm run render` require G1/G2 evidence. Complete the generated `production-gates.json` and [gate guide](../templates/production/PRODUCTION-GATES.md). G3 requires review of the actual final file. A validator cannot provide aesthetic judgment or listening on your behalf.

Schema 4 includes eight separate vetoes and per-shot/whole-film anti-slide-deck design review. [Specialist criteria / 八项专项门禁](../templates/production/SPECIALIST-GATES.md) cover aligned color/matting/denoise comparisons, real sound listening and evidence-based N/A decisions. Old approvals do not automatically migrate.

中文：先用随包六秒样片验证环境，再换自己的脚本、素材和设计。无需我们的电脑路径或私有技能；正式门禁脚本也在工程中。首次联网安装完成后，可在本机离线渲染已准备好的工程。模型服务、专业字体和真人处理是明确的外部条件，不会自动替你配置或冒充已完成。

## Common failures / 常见问题

- **Command not found:** run `doctor`, install the missing tool and reopen the terminal. For executable overrides in PowerShell use `$env:FFMPEG_BIN='C:/tools/ffmpeg.exe'`; bash/zsh use `export FFMPEG_BIN=/path/to/ffmpeg`.
- **No browser / download failure:** run `npm run browser:install` inside the film project, or set `REMOTION_BROWSER_EXECUTABLE` to a compatible local Chrome executable. A doctor pass does not prove a browser can launch; the render test does.
- **Missing glyphs:** install the proper fonts or add licensed font files under `public/` and reference them in the composition. Font metrics can differ between systems.
- **Gate blocked:** read the listed fields in `production-gates.json`. Do not mark reviews passed without viewing/listening. Continue diagnostic work with `render:draft`; after source changes run `gates refresh` and re-review.
- **EEXIST / output already exists:** choose a new project/version or preserve the existing MP4 and QA before another render. No command silently overwrites an existing film.


## Mandatory motion, camera and sound / 三项硬门禁

Schema 4 requires an explicit `videoType: general | talking-head` in the design, storyboard and evidence manifest. Config defaults to `general`; to import/generate presenter A/B staging, explicitly set config `videoType: talking-head` too. A voiceover alone does not make a film talking-head. General films use `state: full` with freely designed subjects/scenes/cameras. Unknown/missing types or general-film A/B states fail validation.

`specialistGates.animation`, `.camera` and `.soundfx` must remain `applicable: true`. Motion and sound cover every SH; camera covers every SH **and TR**, using globally distinct IDs. Missing, failed, stale or partial reviews block G2 production rendering and G3 delivery, through both SDK and the generated direct render command. G1 also requires concrete plans and cannot waive these gates. Locked-off views and reading holds must serve content; constant movement is not compulsory.

For sound, `audioExpected: false` is **not** N/A. State `audioReason`, then review each SH with `method: silence_review`, `status: passed`, current media/range/binding, hashed evidence and the four checks `intentional_silence`, `no_missing_audio`, `transition_intent`, `output_silence`. Compare the brief/cue inventory to the actual encoded playback and audio-stream/decode evidence: verify deliberate quiet, no forgotten cues, purposeful transitions and no stray sound. This does not pretend to audition nonexistent audio. The full-scope `soundReview` uses the same method and hashed evidence. Audible films require actual `listening`; measurements cannot sign it. Partial quiet windows in an audible film are still reviewed under listening, with their purpose recorded.

These are mandatory production decisions for all video types. A/B layout is a talking-head convention, not a condition for motion/camera/sound review. Schema 3 approvals cannot be copied into schema 4. Preserve old projects/evidence; generate a current project, port the composition and design, then review the current render. Historical launch renderers only accept explicit diagnostic `--draft` (or their still-only mode); they cannot export a new approved film to `media/`.
