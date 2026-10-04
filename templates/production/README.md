# Editable film / 可编辑影片

`script.md` is the source. `design.json` contains the complete timed scene graph, shots and sound cues; `design-table.md` is its readable table. `assets.json` records the files actually acquired and hashed. `policy.json` belongs to this project, not to every future film.

```sh
npm ci
npm run browser:install
npm run render:draft
npm run studio
```

Requires Node.js 22+, FFmpeg/ffprobe, a usable Chromium environment and fonts for the script language. Renderer dependencies are locked and installed with npm ci. Python 3.11+ is used for production gates. An OpenAI-compatible model is only used during planning, not playback or rendering. Renderer licensing applies separately. Executable overrides: FFMPEG_BIN, FFPROBE_BIN, PYTHON_BIN, REMOTION_BROWSER_EXECUTABLE.

Edit `src/index.tsx` for bespoke composition, actual 3D meshes, lighting or a different rendering technique. The default scene graph uses 2D and CSS 2.5D: it is not a physical 3D engine. `src/sdk` is the MIT-licensed deterministic animation/audio runtime used by this project.

`execution.renderer: custom` records requirements beyond the layer renderer and creates an explicit implementation placeholder. Implement the `Spatial-Imagery` composition before rendering; no planar substitute is generated. Unknown camera/layer/keyframe fields are rejected. `design-instructions.md` contains the shipped planning method; `planner-context.json` records its standard version and source hashes. For imported designs, these describe the available method, not proof that a model read it.

Motion layers use global frame keys; sound events use seconds, and their optional intensity keys use global frames. Music and narration retain stereo; motion and contact sources are downmixed before panning. The mixer fades event bodies, supports overlapping material handoffs and smooth narration ducking. Review actual sound against the picture.

Draft render produces `output/draft.mp4`, representative frames and `output/draft-qa.json`. Formal `npm run render` checks G1/G2 first and produces `output/final.mp4` and `output/qa.json`. Both refuse to overwrite existing MP4 files. Keep each version and its QA before rendering another version. Technical checks do not set visual, listening or user approval to passed. Raw third-party media are ignored by Git; inspect their individual terms before redistributing this project.

Production standard 3.24: design from intent, then verify every shot and handoff for meaning, content specificity, attention continuity, semantic timing and a readable landing. Review intermediate states and normal-speed motion with sound. Structured design decisions are copied into `production-gates.json`; reviews remain unverified. Complete implementation references and actual reviews using [PRODUCTION-GATES.md](PRODUCTION-GATES.md). The validator is included in this project; no private skill installation is required. The renderer enforces recorded G1/G2 evidence; `npm run gates -- delivery` checks G3. The software validates records, not artistic truth.

制作标准 3.24：按意向设计主体、镜头和声音，逐镜核对表达、针对性、注意力接力、语义时机和理解落点。模型必须写出设计理由、逐镜意向、交接与八项计划，工程保留这些决策；观看、听审和认可仍待实际验证。需要真实三维时生成明确的待实现入口，不能偷偷改成平面。首次先渲草样；修改源码后执行 `npm run gates -- refresh` 会从完整设计同步决策并清除旧媒体和审核记录，须登记新版本并重新检查。正式渲染检查 G1/G2，交付执行 G3。

Eight specialist gates / 八项独立门禁：见 [SPECIALIST-GATES.md](SPECIALIST-GATES.md)。禁止 PPT 式包装；旧 schema 2/3 的通过记录不能自动迁移为 schema 4。
