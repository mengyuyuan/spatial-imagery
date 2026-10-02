# Changelog / 更新记录

## 0.4.0

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
