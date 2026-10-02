# Spatial Imagery: the production workflow

[简体中文](pipeline.zh-CN.md). Workflow prose is CC BY 4.0; attribution and adaptations are in [NOTICE](../NOTICE.md).

The SDK supplies execution tools. The design table states the creative intent. The encoded film is what gets reviewed. Calling a few functions does not mean the whole pipeline was completed. Keep actual outputs and mark missing work unverified or not applicable.

The v0.2 [script-to-video runner](script-to-video.md) connects scripts, configurable model/imported designs, acquired assets, editable animation projects, audio and rendering. It executes applicable stages below; it does not replace footage review or final viewing/listening. Music, narration, procedural-only mode, duration, canvas and style belong to each project rather than becoming universal rules from a previous film.

## Production standard 3.19: transform according to intent

Determine the intended change in understanding, feeling and attention before choosing shape, function, space, camera or sound. Each shot connects **the actual line/text/action → prior understanding → new understanding → visible change → subject handoff → camera discovery → readable landing**. A real morph still fails when it does not express the current idea. Films without speech use screen text, actions or a creative brief as their cues.

Two approved production studies establish useful patterns: a meteor leads the camera through increasing scales before the cosmic structure returns to a glass sphere behind the presenter; a guiding disc becomes a control's top plate, then close views reveal its construction. These preserve intent and viewing continuity without claiming that every object is one continuous mesh. Reuse the appropriate mechanism, not a mandatory cosmos, sphere, control, palette or beat count. Record the actual reference version, range and adaptation for each new project.

| Gate | Required evidence | If incomplete |
|---|---|---|
| G1: executable design | SH/TR coverage, actual cue windows, progression of understanding/feeling, subject roles and exits, camera tasks and sound intent | Repair the relevant design; position, scale, fading and text replacement alone do not certify internal transformation |
| G2: working motion design | Audio drafts covering every SH/TR; normal-speed and before/middle/after review; separate observations for meaning, specificity, attention, semantic timing and readable landing; listening with picture | Fix known defects before production rendering; diagnostic drafts remain allowed and existing authorization remains valid |
| G3: deliverable encoded film | Shot/interface review, full viewing, listening and technical evidence tied to the final version, ranges and SHA256 | Retain draft/unverified/needs-revision status; do not register complete approval |

An impressive opening cannot certify the middle or ending. Sync and loudness measurements cannot certify listening. Distinguish same-object transformation from a new-subject relay; a subject may exit when its role is complete. Motivated cuts and reading holds remain valid. Relabeled effects and arbitrary scene resets do not establish intent continuity. Changes to intent, code, edits, mixing or media invalidate the affected reviews and neighboring handoffs.

**Current runner boundary:** `validatePlan` / `validateFilm` check structure, references and timing. `make --render` returns `rendered_review_pending`, not artistic approval. The SDK does not yet embed the complete evidence gate or automatically perceive images/audio. The local full workflow uses `verify_production_gates.py` with evidence schema version 2; the production caller places that check before production rendering and final delivery. Record/hash validation still requires real viewing and listening. Updating this documentation and planning prompt does not add an automatic aesthetic evaluator to the SDK.

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

| Record | Required information |
|---|---|
| SH / shot | Global `[from,to)` frames, speech/keyword, A/B/full state, subject, initial→action→result, camera task, reading window, assets and sound |
| EL / element | Identity, parts, silhouette, structure, relationships and purpose; entry, development, resolution, exit; what stays recognizable |
| TR / handoff | Old subject's completed job and exit; next subject's arrival; screen position, size, direction, velocity and landing |
| VID / footage | Source ID, source and project in/out points, crop, speed/freeze handoff, original sound and license |
| SFX / sound | Source, active source range, audible anchor, role, motion stages, processing, gain/pan, fades, overlap and cutoff |

Write a short viewing script: who the viewer follows, what changes, what is discovered and what becomes understandable. A label does not prove the relationship. Show sorting by rearrangement, limitation by a visible capacity conflict, handoff by a readable transfer of attention.

Use integer frames in the table, seconds in motion/audio APIs, samples in audio processing. Convert with `frame/fps` and `round(seconds*sampleRate)`, never a fixed samples-per-frame assumption.

## 4. Subject-led camera choreography

Every shot has a primary subject. It can transform or finish its role and hand over. Avoid clearing the scene every sentence, changing only card text, or forcing one object to express every idea.

Give the camera an observation task: follow, reveal after passing a foreground object, inspect a detail, pull back to explain structure, or establish a larger scale. Motion should cause discovery. Depth comes from foreground/midground/background references, occlusion, parallax and light.

`motionPath` accepts velocities in world units/second. A shared key tangent provides continuous velocity across segments. Omitted velocity means a pause. Sampling outside the path clamps position and returns zero velocity, so extend the path when movement must continue through the boundary.

`followCamera` uses a world-space offset and look-ahead in seconds. Design camera movement separately from object movement. Use `project` and `handoffDelta` to inspect screen-space continuity. Check position, size, direction, speed, silhouette and action phase at a continuous match. These diagnostics do not prohibit intentional cuts; record the narrative reason for a cut.

## 5. A/B staging, matting and lighting

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
