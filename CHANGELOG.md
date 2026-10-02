# Changelog / 更新记录

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
