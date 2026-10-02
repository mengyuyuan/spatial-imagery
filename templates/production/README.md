# Editable film / 可编辑影片

`script.md` is the source. `design.json` contains the complete timed scene graph, shots and sound cues; `design-table.md` is its readable table. `assets.json` records the files actually acquired and hashed. `policy.json` belongs to this project, not to every future film.

```sh
npm install
npm run studio
npm run render
```

Requires Node.js 22+, FFmpeg/ffprobe, a usable Chromium environment and fonts for the script language. Renderer versions are pinned; retain the generated package lock. An OpenAI-compatible model is only used during planning, not playback or rendering. Renderer licensing applies separately.

Edit `src/index.tsx` for bespoke composition, actual 3D meshes, lighting or a different rendering technique. The default scene graph uses 2D and CSS 2.5D: it is not a physical 3D engine. `src/sdk` is the MIT-licensed deterministic animation/audio runtime used by this project.

Motion layers use global frame keys; sound events use seconds, and their optional intensity keys use global frames. Music and narration retain stereo; motion and contact sources are downmixed before panning. The mixer fades event bodies, supports overlapping material handoffs and smooth narration ducking. Review actual sound against the picture.

Render produces `output/final.mp4`, representative frames and `output/qa.json`. Technical checks do not set visual, listening or user approval to passed. Keep each accepted output and its project snapshot together. Raw third-party media are ignored by Git; inspect their individual terms before redistributing this project.

Production standard 3.19: design from intent, then verify every shot and handoff for meaning, content specificity, attention continuity, semantic timing and a readable landing. Review intermediate states and normal-speed motion with sound. The source planning prompt follows this standard; generated/imported designs and encoded output still need actual review. Before production rendering, review an audio draft covering the full intended range; diagnostic drafts remain allowed. Before registering delivery, bind viewing, listening and technical evidence to the final media hash. These are production obligations, not automatic checks built into `npm run render`.

制作标准 3.19：按意向设计主体、镜头和声音，逐镜核对表达、针对性、注意力接力、语义时机和理解落点。真实形变也必须服务本句；已知缺陷或未观看/未试听保持返修或待审。片头样片不代表全片通过。采用本地完整管线时执行其 G1/G2/G3 证据门；当前渲染命令本身不会自动完成这项艺术验收。
