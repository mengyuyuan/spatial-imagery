# Spatial Imagery: the production workflow

[简体中文](pipeline.zh-CN.md). Workflow prose is CC BY 4.0; attribution and adaptations are in [NOTICE](../NOTICE.md).

The SDK supplies execution tools. The design table states the creative intent. The encoded film is what gets reviewed. Calling a few functions does not mean the whole pipeline was completed. Keep actual outputs and mark missing work unverified or not applicable.

The v0.2 [script-to-video runner](script-to-video.md) connects scripts, configurable model/imported designs, acquired assets, editable animation projects, audio and rendering. It executes applicable stages below; it does not replace footage review or final viewing/listening. Music, narration, procedural-only mode, duration, canvas and style belong to each project rather than becoming universal rules from a previous film.

## Production standard 3.23: derive design from intent

The executable planner now receives the shipped design principles, synthesis method and this SOP together with its JSON contract. The generated project saves those instructions and their source hashes. Design rationale, intent chains, handoffs and specialist plans survive into production records; observation and approval remain separate. The default engine implements layers in 2D/CSS 2.5D. Designs needing physical 3D, cloth or other bespoke behavior declare a custom implementation requirement and cannot silently render a simplified substitute. See [the executable contract](script-to-video.md#design-contract-and-execution-boundary).

Shared requirements cover intent, motion, camera, sound, evidence and source identity. Presenter A/B staging, matting and relighting belong to talking-head projects when applicable. They do not impose a presenter, floating cards, progress bars, room backdrop or fixed chapter count on lyric, brand or other general films.

First understand [design principles](design-principles.md): relationships expressed as imagery, recognition cues, attention through composition, dimensional expression, the separate roles of subject and camera, and rhythm/type as carriers of feeling. Important decisions state their principle, contextual reason, expected perception and failure risk. Principle names, technique labels and statements of responsibility do not substitute for that reasoning.

For a new film or substantial visual revision, read [design synthesis](design-synthesis.md) first. The maker proposes and selects imagery paths and camera work, compares meaningful alternatives, and records the choice, visible intermediate states, discovery and reading landing in the existing design table. Do not wait for the user to invent every transition. Choose 2D, 2.5D, 3D, lyrics and footage for expression; lacking source footage does not require fully modeled sets. A requested dimensional conversion needs its own interface, not just camera travel through 3D scenery. This updates the design method; machine gates remain schema 4 and do not judge creative quality automatically.

Determine the intended change in understanding, feeling and attention before choosing shape, function, space, camera or sound. Each shot connects **the actual line/text/action → prior understanding → new understanding → visible change → subject handoff → camera discovery → readable landing**. A real morph still fails when it does not express the current idea. Films without speech use screen text, actions or a creative brief as their cues.

Two approved production studies establish useful patterns: a meteor leads the camera through increasing scales before the cosmic structure returns to a glass sphere behind the presenter; a guiding disc becomes a control's top plate, then close views reveal its construction. These preserve intent and viewing continuity without claiming that every object is one continuous mesh. Reuse the appropriate mechanism, not a mandatory cosmos, sphere, control, palette or beat count. Record the actual reference version, range and adaptation for each new project.

| Gate | Required evidence | If incomplete |
|---|---|---|
| G1: executable design | SH/TR coverage, actual cue windows, progression of understanding/feeling, subject roles and exits, camera tasks and sound intent | Repair the relevant design; position, scale, fading and text replacement alone do not certify internal transformation |
| G2: working motion design | Audio drafts covering every SH/TR; normal-speed and before/middle/after review; separate observations for meaning, specificity, attention, semantic timing and readable landing; listening with picture | Fix known defects before production rendering; diagnostic drafts remain allowed and existing authorization remains valid |
| G3: deliverable encoded film | Shot/interface review, full viewing, listening and technical evidence tied to the final version, ranges and SHA256 | Retain draft/unverified/needs-revision status; do not register complete approval |

An impressive opening cannot certify the middle or ending. Sync and loudness measurements cannot certify listening. Distinguish same-object transformation from a new-subject relay; a subject may exit when its role is complete. Motivated cuts and reading holds remain valid. Relabeled effects and arbitrary scene resets do not establish intent continuity. Changes to intent, code, edits, mixing or media invalidate the affected reviews and neighboring handoffs.

**Execution boundary (v0.4):** generated projects include the schema-v4 Python validator, Node gate runner, current-input-bound unverified manifest and [portable guide](../templates/production/PRODUCTION-GATES.md). Formal render enforces G1/G2; `gates delivery` checks G3 against the final encode. Use `--draft` / `render:draft` for diagnosis. These check records, current source/media hashes and coverage; they do not perceive aesthetics or listen for you. Structural checks and review approval remain separate.

Eight independent vetoes now cover design, motion, camera, handoff, color/lighting, matting, denoise and sound effects. Full-film and per-shot design critique must explicitly reject slide-deck packaging; exact fields and evidence rules are in [SPECIALIST-GATES](../templates/production/SPECIALIST-GATES.md).

## Execution SOP: inputs, actions, outputs and repair routes

Principles explain why; this SOP turns decisions into production. Follow the order below; the numbered sections that follow supply topic-specific detail. Keep the same SH/EL/TR/VID/SFX identities rather than maintaining competing records.

| Stage | Input and required action | Output and check; where to return |
|---|---|---|
| 1 Scope and sources | Verify the request, source files/script/music, media specifications and current version; record talking-head/general and sample/full-film scope | One-page baseline, source identities and media inspection. Repair missing/incorrect sources; do not create face detection or A/B for films without a presenter |
| 2 Content and timeline | Verify speech and edit where appropriate; align lyrics to real singing, phrases, accents and sustains; organize motion-only work around music/text/intent | Content/emotion segments, one timeline and source→edited→sample mapping. Record the actual transcription model and uncertainties; do not invent timings or apply speech breath removal to a song |
| 3 Research and assets | Use preliminary relationships to inspect studies, complete reference films, footage and existing sounds; check ranges, authors and usage conditions | Reference mechanisms/adaptations, VID/SFX candidates, separate verified/selected/rejected states and gaps. Continue searching where needed; stills or GitHub tools do not replace moving footage and actual sound assets |
| 4 Design reasoning | Apply principles to imagery alternatives, shape bridges, recognition, dimensions, camera, rhythm, lyrics and visual unity | Selected narrative, tradeoffs, viewing script and failure risks. Repair weak ideas here; return to 3 for asset changes instead of adding models to an empty concept |
| 5 Design table and G1 | Specify SH/EL/TR/VID/SFX, key compositions, intermediate states, actual frame windows, reading and sound envelopes | Executable scope-wide table and G1 checks. Complete fields do not prove design quality; unclear mechanisms return to 4, missing assets to 3 |
| 6 Critical motion draft | Prototype the most uncertain interface and its context with actual camera behavior, readable text and candidate audio; inspect using stage 7 | Playable low-cost draft and defects. After it works, extend to the entire scope, then refine geometry/material/light, grade/matting and audio; a key passage cannot certify the whole film |
| 7 Scope-wide review and repair | Watch every SH/TR at normal speed, inspect ordered frames, listen with picture and perform applicable specialist reviews | Current-version evidence and defects. Design faults return to 4/5, implementation to 6, asset/sound selection to 3 with realignment. Include middle, ending and intentional quiet; unverified is not passed |
| 8 Current preview | Repair known defects before presenting a cached audiovisual preview and scrubbable project; confirm the displayed version | Preview, source snapshot and scope-specific feedback. Existing authorization/approval remains valid; sample scope ends with a sample, without automatic expansion or repeated approval |
| 9 Formal encode and delivery | After G2, render formally; after final mixing/encoding, repeat shot/full viewing, listening and technical checks, then G3 | Authorized media/cover, source/dependencies, assets, QA and library record. Required failures retain review/revision status rather than a final label |

Order: **1→2→3↔4→5→6↔7→8→9**. Research and design can inform each other. Resolve viewing relationships in drafts before increasing detail. Timeline changes return to 2 and propagate through affected shots, words, footage, people and sound; local visual/audio changes include neighboring interfaces and the encode. Without audio, relative timing design may proceed, but formal synchronization needs the actual source.

G1/G2/G3 govern formal production; clearly labeled diagnostic drafts remain available. A gap blocks dependent formal output, not independent work, and creates no new per-stage user approval. On resumption, record the current stage, verified version, next artifact and gaps in the one-page baseline. Updating this document does not automatically upgrade an old project or reload another running conversation.

## 1. Establish scope and source truth

For a spoken video, verify the originals, transcript, word timing and corrections; edit the speech before visual packaging. Preserve meaning, order and emotion. Do not speed up speech just to fit animation. For a film without source speech, use research → proposal → script → scene plan → assets → edit → compose → publish. A local revision updates only the affected records and neighboring handoffs.

Record audience, central idea, dimensions, FPS, duration, speech/music policy, delivery platform and production scope. Preserve originals with SHA256. Crops, proxies, grades and denoised outputs have their own identities.

## 2. Search two distinct libraries

Describe the relationship, subject, material and action before searching.

| Library | Contains | Selection rule |
|---|---|---|
| Source assets | Footage, sound, images, models, fonts, motion code, reference links | Source/author/license, file/hash/commit, specifications, usable ranges and review state |
| Samples | Actually rendered versions, ranges, project source, used assets, QA and feedback | Approval belongs to one file hash, version and named scope |
| External references | Creator film pages and research notes | A reference is not acquired footage or permission to reuse it |

`searchAssets` matches all query terms. `searchSamples` defaults to explicitly approved samples. Search externally when the local library does not cover the need. GitHub popularity is a screening signal; inspect code, maintenance and asset-specific licensing before adoption.

Actively search for footage corresponding to the shot, inspect the content and usage conditions, and incorporate suitable moving footage. Static images and procedural animation do not replace footage research. Document rejected candidates rather than forcing irrelevant stock into the film.

## 3. Write the design table before animation

The one-page baseline defines meaning, visual language, light, typography, palette, rhythm, sound, gaps and reference versions. Use shared IDs across these records:

Also record content → subject properties → imagery path, the important design tradeoff, and the interface that needs a motion prototype. For mixed dimensions, EL/TR specify starting dimension, conversion medium, preserved anchor, intermediate state and ending dimension. When lyrics are the subject, SH includes entry into type, an accurate readable window, and exit into the next image. Apply these details where relevant; do not prescribe a dimensional ratio, a morph per shot, or a universal petal/cloth sequence.

| Record | Required information |
|---|---|
| SH / shot | Global `[from,to)` frames, speech/keyword, A/B for talking-head or full for general films, subject, initial→action→result, camera task, reading window, assets and sound |
| EL / element | Identity, parts, silhouette, structure, relationships and purpose; entry, development, resolution, exit; what stays recognizable |
| TR / handoff | Old subject's completed job and exit; next subject's arrival; screen position, size, direction, velocity and landing |
| VID / footage | Source ID, source and project in/out points, crop, speed/freeze handoff, original sound and license |
| SFX / sound | Source, active source range, audible anchor, role, motion stages, processing, gain/pan, fades, overlap and cutoff |

Write a short viewing script: who the viewer follows, what changes, what is discovered and what becomes understandable. A label does not prove the relationship. Show sorting by rearrangement, limitation by a visible capacity conflict, handoff by a readable transfer of attention.

Use integer frames in the table, seconds in motion/audio APIs, samples in audio processing. Convert with `frame/fps` and `round(seconds*sampleRate)`, never a fixed samples-per-frame assumption.

## 4. Subject-led camera choreography

Every shot has a primary subject. It can transform or finish its role and hand over. Avoid clearing the scene every sentence, changing only card text, or forcing one object to express every idea.

Give the camera an observation task: follow, reveal after passing a foreground object, inspect a detail, pull back to explain structure, establish a larger scale, or affect intimacy, tension and rhythm through specific framing and timing. Movement needs a perceptible viewing purpose, not necessarily a new fact in every shot. Depth comes from foreground/midground/background references, occlusion, parallax and light.

`motionPath` accepts velocities in world units/second. A shared key tangent provides continuous velocity across segments. Omitted velocity means a pause. Sampling outside the path clamps position and returns zero velocity, so extend the path when movement must continue through the boundary.

`followCamera` uses a world-space offset and look-ahead in seconds. Design camera movement separately from object movement. Use `project` and `handoffDelta` to inspect screen-space continuity. Check position, size, direction, speed, silhouette and action phase at a continuous match. These diagnostics do not prohibit intentional cuts; record the narrative reason for a cut.

## 5. Talking-head-only A/B staging, matting and lighting

Only `videoType: talking-head` may use A/B. General brand, product, animation and voiceover-only films use `videoType: general` and `state: full`; arrange subjects, scenes and camera shots by content. `full` is not a single fixed camera. Never invent a presenter window to satisfy this workflow.

A: the presenter dominates the frame. Content moves through the space behind a real matte, respecting face, hands and subtitles. Avoid guide-line graphics behind the large presenter and avoid replacing an entire spatial scene with one fixed side card.

B: content takes the main frame; a smaller presenter window has a clear spatial role. Choose proportions and timing by information needs. Design A→B, B→A and B→B handoffs independently instead of mechanically alternating.

Match camera perspective, key-light direction, color temperature, exposure, black level and sharpness before refining spill, hair, edge light and shadow. Compare source, composite and encoded frames to distinguish grading issues from color interpretation. Describe 2D local shaping separately from physical relighting; never invent unseen presenter views.

The initial SDK does not contain transcription, matting or relighting models. These remain external production steps with recorded tools, outputs and review evidence.

## 6. Source sound before finalizing cues

Search by object/material + action + usable length: `paper unfold close`, `glass slide on wood`, `soft air passby long`. A tiny button sound cannot carry a multi-second transformation.

Inspect active body versus file duration, speech/music/noise contamination, audible transient, natural tail, channels, sample rate, author and license. Acquisition, decoding, audition and selection are different states. Permission to synchronize a commercial sound does not necessarily permit bundling its raw file in an open-source SDK. Keep provenance even for CC0 assets.

Assign roles: motion body covers the process; material layers add physical character; short contact sounds mark contact. Do not click every object or keyword. Decide music by the film's purpose. If used, set a pulse, section changes and silence before cutting; music must not hide weak edits.

## 7. Process, preserve inertia, mix

Typical order: preserve source → decode/resample → select active range → necessary EQ → control exceptional transients → set body level → motion/material envelopes → pan → speech ducking → mix headroom → encode.

- Align the audible anchor with `alignSound(actionTime, sourceAnchor, sourceIn)`, not merely the file's start.
- When sound is weak, investigate a silent crop, transient-driven normalization, excessive fades, masking or cancellation. Do not raise quiet tails independently.
- Inertia comes from anticipation, the actual acceleration/deformation/resistance and deceleration. Label whether an envelope derives from motion data or is approximate. Stable reading can be silent; avoid a permanent hiss bed.
- De-clicking and audible onset are distinct. Contacts need their attacks. Cue fades must fit the duration; the SDK rejects overlapping fade budgets.
- Overlap material handoffs after matching body levels. `crossfade` supplies equal-power weights for low-correlation sources; correlated sources can swell and require listening-based adjustment.
- Pan relative to the viewer/camera. A followed object may stay close and centered. SDK panning is not HRTF, physical propagation or Doppler simulation.
- Protect dialogue with fewer competing events and selective time/frequency/gain changes. Restore ducking smoothly. Keep dialogue, source sound, SFX and music independently controlled to prevent duplicate original audio.

`gainEnvelope` samples gain at audio rate rather than stepping at video FPS. The SDK does not select sources, synthesize sound or decide licenses. The example processes existing acquired SFX.

## 8. Test the real difficulty, then finish

Build a representative section covering the hardest transformation or handoff. Check identity, intermediate state, reveal and sound continuity. A simple unrelated preview does not validate a difficult transition. Choose duration by the problem.

Provide a cached video with audio plus a seekable source project. Compute every frame from absolute time; seed randomness and avoid accumulated state or wall-clock animation. Re-time camera, footage, captions and sound together.

Review at normal speed for comprehension and rhythm; inspect dense frame sequences for position jumps, background holes, occlusion and clipping. Listen to the primary sound alone, add layers, then review with picture. Technical decoding, selected stills, agent listening and user approval are separate evidence.

## 9. Encode, deliver, archive

Check actual video frame count, PTS/DTS, FPS, audio/video durations, color conversion and tags, decode errors, audio peak and endpoints. Container duration alone is insufficient. Do not blindly stream-copy segments with incompatible time bases.

Deliver the playable film, design table, source/dependency locks, source usage manifest, processing settings and QA. Record technical checks, playback, listening and unresolved defects independently. Never assert listening or approval that did not occur.

Archive the actual SHA256, version, specifications, meaningful ranges, asset references and feedback. Add new records for revisions, preserve old ones. Keep external links as references. Publish only redistributable assets; provide retrieval instructions and identity for excluded dependencies.
