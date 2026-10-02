# Portable installation film / 可携带安装样片

From the SDK repository after building, run `node dist/cli.js demo --out first-film --install --render`.
From an installed tarball, run `npx --no-install spatial-imagery demo --out first-film --install --render`.

This six-second, 640×360, 30 fps procedural film uses a bundled design and three bundled Kenney CC0 sounds. It requires no model key, personal library, Python, or stock-media download. Initial npm installation and Chrome Headless Shell acquisition need network access. FFmpeg/ffprobe must be installed. After preparing dependencies and browser, rendering can run offline.

The output is `first-film/output/draft.mp4`, with `draft-qa.json` and representative frames. It is a diagnostic draft, not a signed production delivery or an approved design baseline. The entry point uses the same project generator, mixer and renderer as other films.

无密钥的六秒安装测试，使用随包设计和 Kenney CC0 音效。首次安装依赖、取得浏览器需要联网，素材本身全部随包。输出是有声草样，不能当作已通过艺术审查的最终作品。正式制作请完成工程内 `PRODUCTION-GATES.md` 的步骤。

Sources, licenses and SHA256 identities: [catalog.json](catalog.json). Kenney [Sci-Fi Sounds](https://kenney.nl/assets/sci-fi-sounds) and [Impact Sounds](https://kenney.nl/assets/impact-sounds), CC0-1.0. Original script/design: MIT. No synthetic approvals are bundled.
