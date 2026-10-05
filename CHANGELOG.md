# Changelog / 更新记录

## 0.6.0

- Bind current user requirements to SH/TR subjects, dimensions and measured effect channels. Presenter playback and an unrelated moving channel cannot satisfy a requested spatial transformation.
- Ship portable entry preflight and current-project identity checks; generated renderers verify the selected composition's dimensions and frame timeline. G3 also checks the exact active final encode.
- Move diagnostic video/QA/measurement output to `qa/pipeline-review`; drafts cannot claim completion. Preserve legitimate 2D projects and unreviewed diagnostic work.
- Add English/Chinese migration guidance, package-consumer checks and regressions for stale sources/timelines and draft-as-delivery. Existing projects need explicit migration; no approvals are generated.
- This release also includes the execution/evidence binding changes below. No OS-level bypass prevention or automatic aesthetic/listening approval is claimed.

## 0.4.0

- Production standard 3.23 connects shipped design methods to the actual planner, persists instruction provenance and carries structured intent/handoff/specialist plans into unreviewed evidence. Refresh resynchronizes complete designs and invalidates prior reviews.
- Reject unsupported camera/layer/keyframe fields; requested dimensions and declared-but-unused shot assets participate in bounded model repair. Custom renderer requirements stop at an explicit implementation boundary instead of a planar fallback.
- Short (1–2 frame) shots/interfaces require all real frames plus neighbouring playback context. Silence documentation now matches the mandatory encoded-media review. Library states include rejected references without treating them as approved.
- Bilingual workflow 3.22 adds design principles, imagery/camera reasoning, mixed-dimensional lyric guidance and a nine-stage production SOP with explicit artifacts and repair routes. These guide creative work without claiming automatic aesthetic review or changing schema 4.
- Schema 4 adds an independent mandatory camera gate covering every shot and handoff; motion/camera/sound each veto formal render and delivery.
- Intentional silence requires an encoded-media-bound sound review, never N/A.
- Explicit `videoType`; A/B staging is restricted to talking-head projects. General films keep content-led scenes/cameras with `full` states.
- Historical launch renderers are diagnostic-only and preserve published films/evidence. Existing schema-3 projects need explicit migration and review.

## 0.3.0

- Portable key-free demo with bundled CC0 sounds and locked renderer dependencies.
- Environment doctor, consistent executable overrides and clean consumer render tests.
- Bundled schema-v3 evidence gates; production render enforces G1/G2 and delivery checks G3.
- Workflow change: use `--draft` / `render:draft` for diagnostic renders; ordinary render now requires review evidence.

## 0.1.0

- First extraction of the spatial video workflow into a dependency-free TypeScript core.
- Deterministic Hermite paths, velocity sampling, camera follow, projection and handoff metrics.
- Cue alignment, fades, material crossfade, equal-power pan and audio-rate envelopes.
- Typed storyboard validation and CLI; asset and scoped sample library search.
- Chinese/English workflow and API documentation, original reproducible launch film, license manifest and explicit QA boundaries.

The package is not yet published to a registry. GitHub source and a local `npm pack` artifact are the installation paths for this first version.
