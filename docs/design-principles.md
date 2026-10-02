# Design principles: imagery, movement and camera

[简体中文](design-principles.zh-CN.md) · [Workflow](pipeline.md) · Workflow prose: CC BY 4.0; see [NOTICE](../NOTICE.md).

Use these principles for new films and substantial visual revisions, then apply [design synthesis](design-synthesis.md). Technical repairs keep the accepted design. These are reasons for creative choices, not a transition menu or another approval form.

**Organize attention, understanding and feeling through perceptible change.** Content supplies a reason; shapes and materials supply possibilities; the camera controls when things become visible; rhythm shapes the experience. There is no reliable one-word-to-one-effect dictionary.

## 1. Imagery expresses relationships

A clock alone does not express waiting, nor do two models necessarily express separation. Approach, hesitation, an unclosed gap or a recurring trace makes the relationship perceptible. Find the state, tension and change before choosing objects.

Possible metaphors connect behavior, structure or sensation: hesitation with advancing and withdrawing, constraint with a tightening boundary, an aftersound with a lingering trace. These are creative interpretations, not factual claims. Product functions and quantities remain accurate; poetry can stay ambiguous without illustrating every noun.

For “approaching but not reunited,” two traces can extend toward a point, slow near it and leave a legible gap. Ink, light or paper could carry that relationship. Closing the gap into a complete heart would change the emotional conclusion.

**Apply:** state the relationship without naming a model, then select its carrier. **Diagnose:** an unrelated script needs only different titles. Atmospheric passages can work through texture and rhythm, but must have a specific emotional role rather than conceal missing action.

## 2. A transformation needs meaning and a visible bridge

Ask separately why the next image belongs to the content and how the eye connects it to the current one. Meaning without a visible bridge may feel abrupt; resemblance without purpose can become random shape play. This is a design heuristic, not a rule against ambiguous poetic editing.

Bridges can use outline, negative space, parts, direction, propagation phase, position, material behavior or scale. Use the subjects' possibilities: paper folds, a line extends, cloth deforms, ink leaves a trace. Impossible transformations can work when the eye can follow their construction.

Ask what the current action could become in the next subject. A rotating ring might become a vessel opening, an orbit or a letterform. Choose according to the next relationship, not merely because all three are round.

**Apply:** identify the property retained, the property changed and the resulting meaning before choosing meshes, masks or cuts. **Diagnose:** “morph,” “merge” or “travel through” has no drawable intermediate state.

## 3. Continuity belongs to perception

One mesh can lose its apparent identity if position, scale, color and speed all jump. Separate objects can hand attention over through contact, occlusion or action matching. Distinguish object identity from attention continuity; shared variable names prove neither.

During a strong change, preserve enough cues for recognition. Establish the subject, introduce the new structure, then let the old subject leave when appropriate. Do not freeze every attribute or carry every object until the ending.

Research on common fate supports coordinated motion as a grouping cue, with context-dependent strength. [Common Fate for Animated Transitions](https://arxiv.org/abs/1908.00661) Our production application is to give related parts a common main impulse and distinguish unrelated groups through relative movement or timing. Moving background, type and subject identically can erase useful grouping.

**Apply:** follow the attention point through screen space. **Diagnose:** a smooth world-space curve still makes the subject jump across the screen, or a scene resets and a same-colored object is called a continuous handoff.

## 4. Composition allocates attention

Size, contrast, color difference, isolation, silhouette and movement contribute to visual priority. Making everything bright, large and active weakens differentiation. Decide what deserves attention now, then reduce competition around it.

Google's motion guidance uses important shared elements to retain focus through transitions. Its source context is interface design; borrow the attention principle, not its UI timings or layouts. [Material Choreography](https://m1.material.io/motion/choreography.html)

Reduce background texture behind an intricate subject; clear the contact area when contact matters; restrain camera and secondary action while the main deformation must be read. Empty space can express distance, solitude or an opening for the next subject.

**Apply:** inspect small-scale value blocks and silhouettes before restoring detail. **Diagnose:** arrows and giant captions are necessary just to locate the subject, or every layer demands equal attention. This is a visual diagnosis, not a numerical threshold.

## 5. Changing dimension changes how space is read

Flat design emphasizes outline, layout, juxtaposition and negative space. Volume offers turning surfaces, occlusion, relative motion and shading. Neither is superior. The same renderer can first present a graphic plane and then reveal depth; merely applying toon shading does not establish a promised graphic conversion.

**Flat to volume:** establish the planar form and an anchor, then lift, fold or expose a side while preserving its relation to the original contour. Let camera angle and lighting reveal readable depth. Do not orbit dramatically before there is anything new to see.

**Volume to flat:** choose a view that summarizes the object, progressively resolve depth into a graphic relationship, then transfer attention to strokes, texture or layout. Distinguish actual flattening from projection matching.

For a front-facing object in simple perspective, projected height is approximately proportional to focal length × object height / distance. Match the screen anchor and scale when changing viewpoints or projection. The approximation helps setup; rotating and deforming objects still require actual image review.

**Apply:** specify the planar expression, first depth cue, contribution of volume and retained graphic result. **Diagnose:** an all-3D environment tour is called dimensional conversion, or each conversion introduces an unrelated palette, font and shape style.

## 6. Camera work arranges the experience of looking

Object movement answers what happens. Camera work decides what is known first, when more becomes visible and how close the viewer feels. It may affect intimacy, tension or rhythm without revealing a new fact. Those purposes still need concrete framing and timing; “atmosphere” does not excuse arbitrary travel.

Choose the intended final relationship or feeling and its readable framing. Work backward to the less-revealed starting view, then use subject behavior to lead there. A close view can establish a detail; pulling back can reveal its context; a side view can expose hidden structure; overhead framing can clarify a layout. These are viewing conditions, not universal emotions assigned to camera moves.

Check relative movement when tracking. If subject and camera move identically and no references remain, travel may appear frozen. Appropriate near/far references, relative displacement and a clear destination help establish progress. Camera translation can produce different screen displacements at different depths; changing a camera coordinate alone does not prove spatial design.

Cuts can change scale, pace or feeling. Preserve the required direction, attention and action phase, or break them deliberately. Do not cut away to hide an unimplemented promised morph, and do not force a long take that prolongs empty travel.

**Apply:** describe perceptible differences between entry, turn and landing frames. **Diagnose:** endless same-scale orbiting, pursuit with no arrival, or simultaneous extreme camera movement and deformation.

## 7. Motion quality comes from force and timing

Anticipation, timing and follow-through help an action and its physical character read; they are not a universal easing preset. [Adobe's animation principles](https://www.adobe.com/creativecloud/animation/discover/principles-of-animation.html) The material comparisons below are our production applications.

Paper can bend first at the driven point and follow at its far edge; a cloth deformation can propagate and settle; a rigid object preserves shape while acceleration, stopping and contact suggest weight. Stylization may exaggerate these behaviors, but maintain a coherent material language.

Separate path from spacing over time. The same path can hesitate, surge or settle. A continuing action should not reset to zero speed at an arbitrary scene boundary. Secondary parts and sound may finish after the main arrival; not everything needs spring overshoot.

**Apply:** define trigger, driving point, main action, propagation or lag, arrival and release before choosing curves. **Diagnose:** petals, fabric and metal type all bounce identically, or every action has a long easing tail mistaken for natural movement.

## 8. Rhythm needs contrast and development

Constant speed, density and amplitude leave no contrast for a peak. Rhythm can contrast fast/slow, dense/sparse, large/small, moving/still, tight/open or near/far. Develop the dimensions that support the intended experience, rather than randomizing them all.

Consider film sections, phrases and local events separately. Preparation may precede a musical accent, discovery may land on it, and release may span a sustained note. Reading and resonance belong to the rhythm. Without audio, describe structure rather than inventing beat timestamps.

A recurring motif can establish a form, later change its function or relationship, and return with a different meaning. That can build identity without identical loops or unrelated effect changes. A circular narrative is optional.

**Apply:** compare neighboring passages' motion intensity, density and reading demand. **Diagnose:** identical entrances each line, identical impacts each beat, or faster playback presented as rhythmic design. No fixed speed ratio or shot-length quota follows from this principle.

## 9. Lyrics are language and graphic material

Words must be read accurately while their strokes, grouping, direction and empty space can also act. Select behavior that fits the language, music and scene. Treat phrases as related units when that relationship matters; do not make every character jump independently.

Let the preceding contour, pattern or motion become strokes or layout. Give the complete text a clear reading phase. Then develop a meaningful part into the next image. These phases may overlap, but reading must be checked at the actual size, speed and density rather than certified by a nominal duration.

**Apply:** design the layout together with its origin and destination, preserving compatible curve, line-weight, color and material behavior. **Diagnose:** a refined scene suddenly becomes a default glowing title, or every difficult passage becomes the same fading caption.

## 10. Unity comes from a visual language, variety from development

Choose shape language, contour treatment, detail scale, material response, color roles and motion character for the film. Preserve recognizable features across flat and volumetric stages without forcing every object to have the same color or material. Highlights, bevels and texture should support that language rather than accumulate as decoration.

Study a key contour both as a graphic and as a volume. Compare curvature, line weight, value blocks, detail density and motion weight. If delicate graphics become chunky plastic objects, repair shape and material response before increasing render quality.

Sound shares the film's material and rhythmic language. Continuity comes from preparation, process, contact and release, not a continuous noise bed. Select sound for each action and the existing music; update apparent distance and panning when the viewpoint changes. Use the workflow's audio guidance for sourcing and processing.

**Apply:** retain common features, then choose what changes for this passage. **Diagnose:** background and animation belong to incompatible styles, or unity becomes one repeated card with new text.

## Worked reasoning and limits

The *Shuangxue Qiannian* petal example came from the user; do not label it independently invented or dynamically validated. Contact can turn a falling petal's landing point into the center of a flat ripple. A ripple and a cloth fold can share wave shape and propagation: preserve recognizable phase and pattern while height, damping and shading change. The camera first lets the wave read, then reveals raised depth. As the cloth relaxes into a readable plane, its pattern can supply a typographic bridge. The next lyric chooses the next transformation; it need not return to a petal. Each bridge still needs compatibility with the actual lyric/music and a continuous prototype.

For a different brief, “fragments becoming a system,” make the connections legible, build a common structure, and reveal its overall function by pulling back. Its final outline might supply part of a title or mark. Preserve the assembling relationship, not the petal, water or historical styling. Actual product functions need evidence; mark conceptual depictions as abstract.

These principles mainly articulate this project's creative reasoning. The linked sources support specific concepts about grouping, shared focus and animated action; they do not scientifically certify every film adaptation here. Do not turn feelings into universal geometry rules. Use principles to form testable decisions, then review the actual film. Technical checks, written design critique, dynamic viewing, listening and user approval remain distinct.
