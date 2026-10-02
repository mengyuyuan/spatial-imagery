# 城市的节奏 / City rhythm

v0.4: first renders explicitly use `--draft` → `output/draft.mp4` and `draft-qa.json`. Formal rendering requires bundled G1/G2 evidence; delivery requires G3. Python 3.11+ is required for gates only. See the generated `PRODUCTION-GATES.md`. / 首次出片为明确的诊断草样，正式渲染与交付须完成随工程携带的门禁。

A new 20-second integration example for the generic script-to-film runner. `script.md` drives a five-shot design: real traffic → a moving subject → deceleration and structure → relay → reading hold. The design was authored by Codex and imported; this example does not claim a live remote model generated it.

[Watch/download the rendered example](../../media/script-to-film-integration.mp4) · [Media QA](qa.json) · [Verification scope](verification.json)

The 600-frame MP4 passed full decoding, frame-count, size and audio-duration checks. The final mix measured -15.90 LUFS. Sampled frames were inspected; normal-speed viewing, subjective listening and user aesthetic approval remain pending. This integration sample does not replace the approved launch film.

```sh
npm ci
npm run build
node dist/cli.js make examples/script-to-film/script.md --config examples/script-to-film/config.json --catalog examples/script-to-film/catalog.json --design examples/script-to-film/design.json --out city-rhythm --install --render --draft
```

Run from the repository root. Output directories must be new. The runner downloads the two Mixkit sources from the recorded URLs and verifies hashes. Three original Kenney CC0 sounds are included; music/footage raw files are not. See `catalog.json`, `sourcing.md` and the repository NOTICE.

The same runner accepts another script and model configuration without using this example's design. The generated project contains editable layers, camera keys, audio cues, a readable design table and QA. This example exercises 2D/CSS 2.5D, video and sound; it does not claim physical 3D or user aesthetic approval.
