# Presenter staging and information clearance (3.24)

A/B applies only to on-camera talking-head films. A gives the presenter visual priority; B gives the demonstration, animation or footage priority with a smaller presenter. Neither state is a fixed background template. A shared world is allowed; a frozen composition with only a shrinking presenter is insufficient. General motion/lyric films continue to use `full`.

## Design before implementation

1. Identify what the viewer must see now: the speaker's expression or the demonstrated process. Choose A or B for that reason, not alternation on a timer.
2. Design both settled compositions. Name the presenter, primary content and environment layers, the visible result and the reading interval. An unchanged room can connect the views, but B must give useful space/scale to its actual subject.
3. Design the transfer of attention. State what the outgoing subject finishes, how the content opens, reframes or transforms, where the presenter travels, and where attention lands. Design the return as deliberately as the entry. Do not require a gratuitous backdrop replacement.
4. Reserve information regions before routing the presenter. Protect key text, diagrams, demonstration objects, process states and important footage details. Check the entire moving path and each reading interval, not just initial/final screenshots. Recompose, crop, move or reduce the presenter when needed. Decoration may pass behind the person; necessary information must remain visible.
5. Render the risky interface first. Review normal-speed encoded playback plus before/middle/after and closest-approach frames. Then implement the whole sequence. Geometry and an approval-shaped JSON record cannot establish creative quality.

## Executable fields

Each A/B `shots[]` item requires `staging`:

| Field | Meaning |
|---|---|
| `scene`, `purpose`, `framing` | Environment identity, why this state serves this cue, and its actual composition |
| `presenterLayers` | Unique IDs of moving `video` layers containing the presenter; a still/shape is insufficient |
| `contentLayers` | Primary demonstration layers; mandatory and nonempty for B |
| `environmentLayers` | Decorative/context layers, disjoint from presenter and primary content |
| `protectedLayers` | Necessary information, including every overlapping text layer and all A/B content layers; never the presenter/background |
| `landing: [from,to]` | Settled priority/readability interval inside this shot, in global half-open frames |

`intent.focusAfter` names a presenter layer in A and a content layer in B. A layer may persist across shots. Every referenced layer must exist and overlap its shot. Protect an A-state demonstration too when it is being explained. Decorative objects can remain outside the protected set; do not relabel meaningful content as decoration to pass.

Each adjacent A↔B transition requires `takeover`:

```json
{
  "environment": "retained",
  "reason": "The same room preserves orientation while the evidence takes over",
  "reveal": "The sample unfolds into a close inspection of its mechanism",
  "bridge": "The persistent sample keeps its identity as the presenter clears its path",
  "completionFrame": 140,
  "proofLayers": ["mechanism"]
}
```

`environment` is `retained`, `reframed`, `transformed` or `replaced`. `completionFrame` belongs to the destination shot is inside the reviewed transition range, and is no later than its landing start. `proofLayers` identifies actual content, never presenter-only motion. Describe a cue-specific relationship, not just “becomes larger”. Content scale alone may demonstrate layout takeover but does not prove the promised semantic transformation; the existing intent/design gates still apply.

## Automated checks and their limits

For the bundled `layers-2.5d` renderer, validation samples **every integer frame** of A/B shots. It projects each visible layer's clipped rectangle through its channels and camera. Any presenter/protected rectangle intersection blocks. During landings, the union area of visible presenter rectangles must exceed content area in A; B requires the converse and a visible presenter. The union excludes empty gaps between disconnected objects. Takeover additionally requires an actual non-presenter content/view difference between the two landings; renaming a scene or moving only the presenter does not satisfy it. Import, model repair, draft rendering and production gates use these constraints.

These are conservative layout checks, not segmentation, OCR, salience scoring or a universal composition rule. Transparent holes, rounded corners and empty text-box margins remain occupied rectangles. Keep protected boxes tight, split meaningful details from decorative plates, and recompose for safe spacing. Actual text size, alpha edges, facial lighting, narrative relevance and subtle versus useful changes still require review. Extreme perspective-plane crossings are rejected. Custom renderers retain the contract and recorded-review requirements but cannot use the default CSS geometry as proof; inspect their actual encoded motion and record their own projection/occlusion evidence. Never mark a custom renderer solely to evade a failed default layout.

For an alpha presenter video, set `transparent: true` on the video layer. This requests alpha-preserving frame extraction in `OffthreadVideo`; it does not create or repair a matte. The moving source and alpha edges must already be valid.

## Independent review gates

In addition to the existing schema-4 criteria, A/B targets require these checks, each with a concrete observation:

| Gate | Additional required criteria |
|---|---|
| Design, each A/B SH | `ab_scene_role`, `information_clearance` |
| Animation, each A/B SH | `ab_content_priority`, `information_clearance` |
| Camera, each A/B SH and A↔B TR | `ab_view_change`, `information_clearance` |
| Handoff, each A↔B TR | `ab_takeover`, `information_clearance` |

G1 reviews the planned roles, paths and protected regions. G2 reviews actual draft playback. G3 reviews the final encode, including the transition midpoint and moving hands. Record what takes over, where the person is, which information remains readable, and the relevant frames. A shared background is not a failure by itself; unchanged subject responsibility or covered information is. Holds/fixed cameras can be intentional; explain their observation task rather than adding meaningless motion.

Design decisions and protected regions are copied into `production-gates.json` and included in review bindings. Changes invalidate old evidence. Old A/B projects must add these fields and conditional review criteria, regenerate/refresh with the current runtime, render and review again. Unchanged general/full projects do not need A/B records. Schema stays 4; old generic checklists cannot certify the new A/B requirements. No automatic pass or user approval is generated.
