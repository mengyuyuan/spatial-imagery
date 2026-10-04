# Portable production gates / 随工程携带的制作门禁

The project includes the schema-v4 Python evidence validator, JSON template and Node runner. No Codex, Hermes, private skill folder or author workstation is required. Python 3.11+ is needed for gates, not draft rendering. Set `PYTHON_BIN` to an executable path if discovery fails. All manifest paths resolve from this project, not the shell's current directory.

See [SPECIALIST-GATES.md](SPECIALIST-GATES.md) for the eight independent gates, strict per-shot/whole-film design review and the prohibition on slide-deck packaging. Schema 4 does not inherit schema-2/3 approvals.

## Commands / 命令

```sh
npm ci
npm run browser:install
npm run render:draft
npm run gates -- design
npm run gates -- register-draft
npm run gates -- full-render
npm run render
npm run gates -- register-final
npm run gates -- delivery
```

These are stages with editing and real review between them, not a command sequence that automatically approves a film. `render:draft` bypasses review gates for diagnosis and writes `output/draft.mp4`; `render` checks G1/G2 before loading the renderer and writes `output/final.mp4`. Existing MP4 files are never overwritten. Preserve/rename the previous media and QA before another render, or create a new project version. Neither route publishes anything. `delivery` checks G3 and records `delivery-status.json`; actual user approval remains separate.

## G1: executable design / 可执行设计

`production-gates.json` starts with the current project inputs, SH IDs/ranges and any structured decisions from `design.json`: rationale, meaning, identity, intent, reading windows, transitions and all eight specialist plans. Generated designs must supply these decisions; legacy imported designs can leave them for manual completion. **Every review remains unverified.** Review/edit the creative decisions in `design.json`, then run `gates refresh`; the runner rejects contradictory decisions in the evidence record. Complete implementation locations and actual reviews in `production-gates.json`. Choose a real local reference in `baselines`: `id`, `role: primary`, `path`, `sha256`, `frames`, `fps`, `[from,to)` `range`, `mechanism`, `adaptation`, and the actual `approvalScope` (unapproved references must say so). The public package does not redistribute private approved films or fabricate their approval. Download a reference you may use and explain what you adapt; a new exploration may use a diagnostic study as an explicitly unapproved reference.

- SH: `meaning`, `initial`, `process`, `result`, persistent `identity`, `camera`, `kind`, `changes`, `reading` or `noReadingReason`, implementation locations. A transformation needs structure/contour/relationship/function, not just fading, moving or replacing text. Holds need `holdReason`.
- SH `intent`: `sourceKind` (`speech`, `screen_text`, `gesture`, `brief`), actual `cue` and `cueRange`, understanding `before`/`after`, `why`, `visualBridge`, `focusBefore`/`focusAfter`, `revealFrame`, plus `timingReason` if revealing outside the cue window. Do not invent word timing; supplied scripts without speech can use a brief or screen text.
- TR: one record per adjacent SH pair; a `range` straddling the cut; `method`, `reason`, `identity`, `motion`; `handoff` with `kind` (`same_subject`, `new_subject`, `intentional_cut`), `outgoing`, `incoming`, `exit`, `entry`, `meaningBridge`, `cue`, `cueRange`, `focusFrame`, optional `timingReason`. Subject IDs must connect the neighboring SH focus states.
- Talking-head A/B: `staging` is mandatory even for imported designs; A↔B requires `takeover`. The required protected information and subject roles are executable constraints, not review prose. See [PRESENTER-STAGING.md](PRESENTER-STAGING.md). Legacy A/B projects must migrate and re-review; a shared backdrop is allowed, presenter-only shrinking and covered information are blocked.

`npm run gates -- design` prints individual failures and the current `binding`. Complete filmDesignReview and every SH design specialist review using the reported designBinding; all eight applicability decisions and plans must be concrete. G1 validates the critique records, not whether artistic claims are true.

## G2: motion and listening / 动态与声音草样

Render a full-range draft. `register-draft` verifies the renderer QA, current input inventory and video hash, records the draft and fills **only technical review**. It clears old playback/listening reviews. Unchanged G1 design critiques and source-inspection N/A decisions keep their separate designBinding; media registration changes the playback binding. Finish design/media fields first, run `gates design` to obtain the binding, then record actual observations. Do not blindly copy a binding onto old observations.

Each SH/TR `review` needs `status: passed`, `method: normal_speed`, `media: draft`, complete `range`, ordered distinct `frames` for before/middle/after (first and last are interval boundaries), concrete `observed`, and the current `binding`. Add five `intentChecks`, each with status and observation: `meaning`, `specificity`, `subject`, `timing`, `landing`. State what was actually seen, including the intermediate transformation and reading landing.

`assetsReview` needs status, observation, binding and a hashed local `evidence` file documenting source/use conditions and inspected content. Audible `soundReview` needs `status: passed`, `method: listening`, full range, media, observation, binding and hashed evidence. Intentional silence also requires `status: passed`, using `method: silence_review` and the evidence described below; it cannot use N/A. Clear `openIssues` only when defects are resolved. An unavailable viewing/listening facility leaves the relevant status unverified and blocks production; diagnostic drafts remain available. No additional user approval prompt is required by the software.

For a 1–2 frame SH/TR, record **every existing frame** in `frames`; never invent a third. Expand the review's `range` to cover its neighbouring playback context, and add `contextRange`, `contextFrames` and `contextObserved`. The context must include the entire short interval and both sides where available inside the delivered scope; at a film boundary only the available side is required. Record at least three ordered context frames including its first/last frame (or all frames if the whole delivered scope is shorter than three). Normal-speed review, specialist criteria and SH/TR coverage remain mandatory.

## G3: encoded delivery / 最终编码交付

After G2 passes, `npm run render` produces final MP4/QA. Register it using `register-final`, which clears draft playback/listening observations and records new technical results. Unchanged design critique stays bound to designBinding; all applicable specialist playback reviews must use the final encode. Review the actual final encode again, with SH/TR, assets and sound reviews referring to `media: final`. Add `sequenceReview` with `method: normal_speed`, full range, observation and current binding. `gates delivery` must pass before claiming evidence-complete delivery. It specifically requires this project's `output/final.mp4` and production QA; a draft cannot be renamed into an approved final.

## Changes and portability / 变更与可携带性

The runner compares the current script, design/timeline/sound, asset catalog, policy, dependency lockfile, render/mix/gate code, planner provenance and saved instructions (when present), every `src/` file and every `public/` file (except derived `mix.wav`) with recorded hashes. Extra source/assets require new evidence too. Keep local fonts and assets inside `public/`, custom source inside `src/`; custom external services/files are not automatically tracked and must be explicitly added to `inputs` and reviewed.

After a legitimate source change, run `npm run gates -- refresh`. This refreshes hashes and clears media registrations and all reviews. For a complete structured design, it resynchronizes shot IDs/timing/decisions, transitions, scope and specialist plans from `design.json`; implementation references must be filled for the current source. Legacy manual records still need manual shot/scope maintenance. It does not update reference hashes or approve anything. Render/register/review a new version. For other local evidence hashes use `python -c "import hashlib,pathlib; print(hashlib.sha256(pathlib.Path('file').read_bytes()).hexdigest())"` (or `python3` on Unix).

中文：先填写真实意向与逐镜变化，再渲染有声草样、登记媒体、逐镜观看和合画面听审；G2 通过后才正式渲染。最终文件重新登记和审看，G3 通过才可记录完成。哈希、响度、帧数通过不能代替观看或试听。`refresh` 会清掉旧媒体记录和审核状态，不会自动补通过。本工具验证记录、范围和文件身份，不会自动理解画面、判断美感或授予素材使用权。


## Mandatory motion, camera and sound / 三项硬门禁

Schema 4 requires an explicit `videoType: general | talking-head` in the design, storyboard and evidence manifest. Config defaults to `general`; to import/generate presenter A/B staging, explicitly set config `videoType: talking-head` too. A voiceover alone does not make a film talking-head. General films use `state: full` with freely designed subjects/scenes/cameras. Unknown/missing types or general-film A/B states fail validation.

`specialistGates.animation`, `.camera` and `.soundfx` must remain `applicable: true`. Motion and sound cover every SH; camera covers every SH **and TR**, using globally distinct IDs. Missing, failed, stale or partial reviews block G2 production rendering and G3 delivery, through both SDK and the generated direct render command. G1 also requires concrete plans and cannot waive these gates. Locked-off views and reading holds must serve content; constant movement is not compulsory.

For sound, `audioExpected: false` is **not** N/A. State `audioReason`, then review each SH with `method: silence_review`, `status: passed`, current media/range/binding, hashed evidence and the four checks `intentional_silence`, `no_missing_audio`, `transition_intent`, `output_silence`. Compare the brief/cue inventory to the actual encoded playback and audio-stream/decode evidence: verify deliberate quiet, no forgotten cues, purposeful transitions and no stray sound. This does not pretend to audition nonexistent audio. The full-scope `soundReview` uses the same method and hashed evidence. Audible films require actual `listening`; measurements cannot sign it. Partial quiet windows in an audible film are still reviewed under listening, with their purpose recorded.

These are mandatory production decisions for all video types. A/B layout is a talking-head convention, not a condition for motion/camera/sound review. Schema 3 approvals cannot be copied into schema 4. Preserve old projects/evidence; generate a current project, port the composition and design, then review the current render. Historical launch renderers only accept explicit diagnostic `--draft` (or their still-only mode); they cannot export a new approved film to `media/`.
