# Requirement bindings and execution entrypoints

Production standard 3.27 binds the current brief to the actual shot mechanisms and the current render identity. Existing footage can satisfy a footage request; it does not waive separately requested spatial packaging. Playback time and opacity cannot stand in for the requested transformation.

## Requirement contract

Store the actual request and corrections in `user-brief.json`, bound as an input with role `brief`. `design.json` carries `requirementContract: {version: 1, brief: "user-brief.json", requirements: [...]}`. Each requirement has `id`, the original `quote`, `kind` (`content`, `asset`, `editorial`, `motion`, `spatial`, `audio`), `scopeReason`, `acceptance`, and `fulfillments` referencing real SH/TR targets with `initial`, `process`, and `result`.

Motion/spatial fulfillments bind `channels` already declared by that target's motion/camera bindings. Spatial requirements additionally specify `allowedDimensions` (`2d`, `2.5d`, `3d`); each fulfillment declares `dimension`, the actual motion `subject`, `depthCue`, `depthChannels`, and source `implementation` locations. The default CSS renderer cannot fulfill a real-3D requirement. The selected depth/hinge/shape channels must actually vary in custom renderer measurements; unrelated moving playback channels cannot satisfy that test.

No universal 3D quota is introduced. Honest reading holds and two-dimensional projects remain valid. Classification and completeness of the user brief still require human judgment; declarations and hashes do not establish artistic truth.

## Current identity and entry modes

Generated projects include `pipeline-active.json`, `pipeline_entry.py`, and its Node adapter. The active record identifies the gate manifest, entrypoint and canonical design with SHA256, full frame range, FPS and dimensions. `gates refresh` updates the identity and invalidates reviews. It does not approve a new version. The render entry checks identity before bundling and checks the selected composition's actual dimensions/FPS/frame count before rendering. G3 checks the exact registered final media before reporting delivery eligibility.

- `draft`: current source identity and requirement structure must be valid, while subjective reviews may remain incomplete. Output is restricted to `qa/pipeline-review`; `completed` is always false. `register-draft` uses that directory. Drafts may be shared for review, but cannot be called completed deliveries.
- `full-render`: require current identity and G2 before formal rendering. Partial render ranges must stay within the current full timeline.
- `delivery`: require G3, the exact registered final file and full range. Recheck immediately before exporting. Objective media checks do not replace G3.

Custom projects can use the same helpers, supplying their actual entry/design/range/output. Set `execution.designSource` and `execution.parameterSources` to the real files, and bind the entry/design as source/design inputs. The active record has `version: 1`, `manifest`, `entryPoint: {path, sha256}`, `designSource: {path, sha256}`, `scope: [from,to)`, `fps`, `width`, and `height`.

## Migration and limits

Preserve legacy projects and reviews. Explicitly add request mappings, refresh the active identity, render/review the changed version, and register its evidence. Missing contracts are not silently approved; imported designs without mappings can be generated for editing but cannot enter rendering until completed. The bundled installation sample contains its own authored content requirement.

These are checks in integrated entrypoints, not an operating-system sandbox. Arbitrary external commands can bypass them and must not be called compliant pipeline production. Other existing projects must explicitly adopt the helpers. The tests use synthetic evidence only, not actual visual/listening approval.

See [execution evidence](execution-evidence.md) and the [Chinese contract](requirements-and-entrypoints.zh-CN.md).
