# Contributing / 参与贡献

Node.js 22+ and Python 3.11+: `npm ci` then `npm run check`. Public API is in `src/`; tests execute built ESM from `dist/`. `npm run test:package` installs a real tarball into a fresh consumer and generates an independent editable project. `npm run test:render` additionally needs FFmpeg/ffprobe and network access for renderer/browser installation, and checks a six-second MP4 with sound. Set `SI_KEEP_SMOKE=1` to retain that invocation's artifacts. The synthetic gate tests never stand for actual film approval.

Add tests for observable behavior: time boundaries, random-access determinism, tangent continuity, malformed JSON and audio energy. Do not add tests that simply restate a constant or compare a implementation to itself.

For a motion example, submit the design intent, source code, asset provenance, playable output and separate technical/visual/listening review states. Approval is scoped to a particular file hash. Never copy private media or redistribute a sound pack without appropriate rights.

对于动效贡献，请提交设计意图、可运行源码、素材来源、可播放样片以及分开的技术/画面/听审状态。保留失败案例的问题记录；“可渲染”不能替代“设计通过”。

Keep Chinese and English user documentation aligned. Use `[from,to)` frame ranges in design tables and seconds in motion/audio APIs. No network calls or renderer dependencies belong in the core package.
