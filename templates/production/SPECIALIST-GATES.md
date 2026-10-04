# Eight independent gates / 八项独立门禁（3.21）

No gate can be averaged away by a good overall score, a strong opening, or a technical pass. Schema version 4 requires eight explicit production plans and reviews to `production-gates.json`, plus a whole-film design critique. Old schema-2/3 passes are historical evidence, not automatic approvals for this version.

**禁止 PPT 式包装。** 不把台词拆成重复卡片，以换字、淡入、位移、缩放或每页同款入场代替内容演绎。变形、运镜与空间都要改变观众看到的关系和理解；镜头跟随有职责的主体，落稳后可阅读，再有理由地接棒。文字、图表、产品界面可作为叙事对象，但须按实际内容演出关系。为了消除 PPT 感而不停飞、转、震动同样退回；必要阅读、真人情绪和有理由的切镜仍可保留。

## Evidence format / 证据格式

Every `specialistGates.<name>` contains `applicable` (explicit boolean), concrete `reason`, `plan`, `targets` and `reviews`. Targets use real SH IDs; `handoff` uses every TR; `camera` uses every SH and every TR. SH/TR IDs must be globally distinct. Design/animation/color/soundfx cover every SH, including intentional silence. Motion, camera and sound are separate mandatory vetoes for all video types. Matting/denoise cover the actual affected SH and must explain that scope. No reviewer may omit affected shots to obtain a pass.

An applicable gate needs one review per target. Each review contains `target`, `status`, `method`, `media` where applicable, `range`, `observed`, `binding`, a hashed `evidence: {path, sha256}` file, and `checks: {criterion: {status, observed}}`. Every listed criterion is required and each must pass. Describe the actual object, frame/time and defect decision; copying the plan or writing “looks fine” is not an observation. Human or capable agent reviewers must really inspect the work.

Design reviews use `method: design_review`, the exact SH range, and **`designBinding`** printed by `gates design`. Dynamic visual reviews use `normal_speed` plus ordered before/middle/after `frames`. Denoise and audible soundfx reviews use `listening`, including picture where synchronization matters. Entirely silent films must keep soundfx applicable and use `silence_review` with the dedicated criteria below. Playback reviews use **`binding`**, which also includes registered media. The design binding excludes media so registering an encode does not invalidate an unchanged design critique; source/design/scope/applicability changes invalidate both.

Color, matting and denoise also require `comparison: {before: {path, sha256}, after: {path, sha256}, alignment: "..."}`. Color/matting compare the same frame and crop, or a documented reference target against the output. Denoise compares time-aligned, level-matched source and processed audio. `alignment` must state the mapping and viewing/listening conditions. Reports and media are real local files, not nonexistent paths or screenshots of a success log.

Non-applicability is not a blank checkbox. It requires empty targets and exactly one review with `status: not_applicable`, `method: source_inspection`, concrete observation, `designBinding`, and hashed source-inspection evidence. It is allowed for absent matting, unnecessary denoising after listening, or a single shot with no interfaces. Design, motion, camera, color, existing handoffs and sound (even silence) cannot be disabled. Do not add denoising to clean audio or fabricate a person just to exercise a gate.

G1 requires whole-film and per-SH design critiques, all eight applicability decisions and concrete plans. G2 additionally requires actual SH/TR playback, specialist review and listening. G3 repeats applicable playback/listening checks on the final encoded media; draft evidence cannot sign the final file. A `failed`, `unverified`, missing criterion, stale hash or missing target blocks its stage.

## A/B takeover and protected information / 主次交接与人物避让（3.24）

A/B applies only to talking-head films. A shared environment may persist, but presenter-only resizing cannot stand in for content takeover. Each A/B SH needs `staging` roles, `landing` and `protectedLayers`; each A↔B TR needs `takeover`. The default renderer checks every frame for presenter/protected rectangle overlap, settled subject priority, and an actual non-presenter content/view change. Review text, demonstration details and intermediate states, including moving hands; decoration may pass behind the person. See [PRESENTER-STAGING.md](PRESENTER-STAGING.md) for fields, conservative geometry limits and custom-renderer evidence requirements.

Additional mandatory criteria: design SH `ab_scene_role` + `information_clearance`; animation SH `ab_content_priority` + `information_clearance`; camera A/B SH and A↔B TR `ab_view_change` + `information_clearance`; handoff A↔B TR `ab_takeover` + `information_clearance`. G1 evaluates the design; G2/G3 require actual encoded playback observations and before/middle/after evidence. These are conditional schema-4 requirements, not automatic passes. Updating staging/protection invalidates old bindings. General/full targets keep their existing criteria.

## Design / 设计门：先淘汰空洞方案

Explain the principles behind important choices: how the relationship becomes visible, which cues preserve recognition, and what camera/rhythm contribute to the viewing experience. Technique or principle names alone are insufficient. Emotional and poetic purposes are valid; each shot need not add a new factual explanation. See the SDK's packaged docs/design-principles.md and docs/design-principles.zh-CN.md for reasoning and failure examples.

For a new film or substantial redesign, derive content/emotion → changeable subject properties → candidate imagery paths → visible intermediate states → discovery and reading landing. The maker compares meaningful alternatives and selects a path in the one-page brief, then records the mechanism and camera task in SH/EL/TR; do not wait for users to invent each transition. Requested mixed dimensions cannot be signed off as an all-3D walkthrough. When lyrics are the subject, inspect their letterform/layout behavior and reading window rather than deleting the text. Prototype the most uncertain interface before detailed production. The SDK's packaged docs/design-synthesis.md and docs/design-synthesis.zh-CN.md explain the method. Record evidence under the existing criteria below; schema remains 4 and the checker does not judge creative quality.

Per-SH criteria: `intent`, `specificity`, `visible_process`, `subject_hierarchy`, `camera_discovery`, `reading_rhythm`, `sound_plan`, `reference_adaptation`, `not_slide_deck`.

- 真实台词/屏幕文字/手势/创作意向 → 观众此前理解 → 此后理解；愿望与顾虑不能被画成已经实现。
- 主体有职责、初态、可见过程、结果和去向。说“拆开/融合/重组”必须写能实现的部件对应与中间态，不能只写动词。
- 隐去辅助解释标题，指出画面还表达什么关系；把台词换成无关内容时，是否只改字就照样成立。若是，退回重新设计。
- 镜头有发现任务、对象运动有表达任务，主次和观看尺度清楚；不是相机转圈充数。读不清、无意义等待或没有落点都退回。
- 每镜有适配本句的声音与参考改造，不按固定菜单机械轮换。

Top-level `filmDesignReview` requires status, `method: design_review`, entire scope as `range`, observation, evidence, design binding and five checks: `not_slide_deck`, `content_swap_test`, `middle_end_coverage`, `subject_camera_progression`, `motivated_reading_holds`. Inspect the beginning, middle, ending and whole attention chain together. A beautiful opening cannot excuse a card deck afterward.

## Motion / 运动与动画门：看动作真实发生

Criteria: `initial_process_result`, `material_structure`, `depth_occlusion`, `tempo_inertia`, `readable_landing`, `not_slide_motion`.

正常速度看完整动作，再看前中后；核对结构/关系/用途是否实际改变、材质和部件是否保持身份、纵深遮挡是否正确、相机是否揭示内容、速度与减速是否有惯性、结果是否读得懂。连续播放日志和整幅帧差不能替代。只有平移淡化的标题卡不能通过“真实动画”签字。有意保持写清正在读什么，不把缺失动作改名留白。

## Camera / 镜头门：独立于物体运动

Criteria: `subject_priority`, `observation_task`, `framing_readability`, `spatial_orientation`, `trajectory_inertia`, `handoff_continuity`, `motivated_hold_or_cut`.

逐 SH 与 TR 正常速度审看，再核对前中后：镜头此刻跟谁、为什么改变观察点、掠过/推近/拉开之后发现什么，主体尺寸、读字尺度、遮挡与空间朝向是否成立；起势/跟随/减速/落稳是否有惯性。跨镜检查方向、位置、尺度、速度与注意力交接；有意切镜写清意义。固定机位也必须说明它让观众看清什么，不能标 N/A；不强求一直飞或转。物体动画通过不能替镜头签字，屏幕坐标/速度计算及静帧也不能替代连续观看。

A/B 只用于口播：`videoType: talking-head`。其他影片 `general` 使用 `full`，按主体、场景与机位组织；有旁白不自动等于口播出镜。两类影片都执行独立运动、镜头、声音门。

## Handoff / 衔接变化门：检查接棒而非翻页

Criteria: `subject_identity`, `attention_bridge`, `direction_position_scale`, `velocity_continuity`, `occlusion_or_cut_reason`, `semantic_timing`, `sound_bridge`, `landing`, `no_unmotivated_reset`.

逐 TR 观察切点两侧和中间态：同一对象的部件可追踪，新主体第一眼有接入位置，旧主体职责结束后有去向。位置、方向、尺度、速度和声音尾巴按设计承接，不同时清零重启。掠过行星、流星引镜、收进玻璃球是可借鉴的观看关系，不是规定造型。硬切须有语义或动作理由，不能跳过承诺演出的变化。无理由清场→新卡片弹出即退回。

## Color and lighting / 调色与打光门

Criteria: `exposure_detail`, `white_balance_palette`, `skin_or_material`, `light_direction`, `temporal_consistency`, `text_contrast`, `color_space`.

同帧对比原始/参考与输出，再连续检查：肤色自然，黑发与白衣保留层次，背景不发灰，CG亮暗面与人物主光和环境相容；局部塑光跟随人物，不漂移、不闪变、不产生整圈光晕。纯动画也检查材质、色板、黑白细节、标题对比及色彩解释。A/B与转场中间态不能突然染色或亮度跳变。波形、标签、LUT名称或“提高饱和”不能代替观感；参数随素材设计，不设通用橙青滤镜或亮度配额。

## Matting / 抠像门

Criteria: `hair_edges`, `hands_fingers`, `core_integrity`, `spill_halo`, `alpha_interpretation`, `temporal_stability`, `occlusion_tracking`, `timeline_alignment`.

同帧核对源 RGB、alpha、成片；用亮底、暗底、最终背景比较头发、眼镜、耳朵、肩线、衣服、手指和运动模糊。检查丢指、缺块、漏背景、原底残色、黑边/白边及预乘alpha错误。连续检查边缘跳动、头转和手移动；人物核心与身份不能被清边或调色误改。物体前后遮挡、逐帧跟踪、大小屏接口与口型沿用同一剪后时间轴。静帧漂亮、模型很大或alpha存在都不能通过此门。

## Denoise / 降噪门

Criteria: `noise_floor`, `speech_detail`, `no_musical_noise`, `no_pumping`, `breaths_transients`, `sync_level_match`.

先听原音的室内底噪、电流、风噪及停顿，再按问题处理。源/处理后等响度AB试听，保留辅音、齿音、呼吸、音色与瞬态，检查水下感、金属/音乐噪声、抽吸、门限截字和剪口跳变。核对起中末与剪点同步，不因响度变大就认为更清楚。干净录音可不做降噪，但必须有真实源试听与不处理的证据；“没运行降噪”本身不是不适用理由。

## Sound / 声音与音效门（不可关闭）

Criteria: `source_license`, `body_coverage`, `attack_release`, `inertia_material_handoff`, `pan_depth`, `dialogue_space`, `variety_no_noise_bed`, `sync_tail`.

先按对象、材质、动作和有效主体时长取得真实候选，记来源/许可/哈希、源内裁段和淘汰理由。合画面听起势—动作主体—接触—落稳—尾声：包络覆盖变化，淡入淡出自然，转材质交叉淡化继承动势，声像与空间一致。不能每个词重复短点击、只在开始打点，或用持续沙沙声铺满过程。不同动作需要适配音色；不设强制音效数量。人声清楚、运动声可辨、不削波，剪点/接口尾声不突断。纯人声或留白段要说明声音意图并检查收声；技术响度和同步通过不能代替听感。

For an entirely silent film, sound remains applicable. Set `audioExpected: false` with `audioReason`; each SH uses `method: silence_review` and checks `intentional_silence`, `no_missing_audio`, `transition_intent`, `output_silence`. Review the creative brief/cues against actual encoded playback and audio-stream/decode evidence, record why silence is deliberate and how the transition lands without missing intended sound. Include hashed evidence and current media/range/binding. The whole-film `soundReview` must also pass with the same method/evidence. Neither N/A nor a technical-only record is enough. Silent windows within audible films remain part of listening review. No fake audition of absent audio and no compulsory noise bed.

These are record-and-identity gates, not an automatic visual taste or audio perception model. The package cannot prove a dishonest reviewer watched a file; never fabricate observations to turn reports green. Defects stay open and block formal production. Diagnostic drafts remain available without additional user permission.
