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
