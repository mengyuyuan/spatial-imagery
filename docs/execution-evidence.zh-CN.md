# 设计、执行与证据契约 · 3.26

本版衔接 3.25 原片保真要求，SDK 版本为 0.5。保留原 schema 4，并增加 `executionContractVersion: 1`；旧工程须保留后重新生成、迁移设计和实现，再审查新输出。仅改版本号不能完成迁移，旧批准不继承。

## 1. 设计只有一个执行源

SDK 工程以 `design.json` 为唯一执行设计；`design-table.md` 是包含全部决策的自动生成阅读视图。修改 JSON 后执行 `npm run gates -- refresh`。命令将不同的旧表保存到 `design-history/<sha256>.md`，再生成新表、同步机器记录并清除旧媒体与审核。只改 Markdown 会触发设计漂移和输入变化，不能继续把旧设计当成新方案执行。

非 SDK 手写工程可保留原 Markdown 作为唯一设计源，但须有明确的导出适配器，将完整 SH/EL/TR、素材与声音决策映射到执行参数和门禁记录，并绑定源表、适配器与导出文件哈希。不得独立维护互相冲突的两份设计。自定义工程使用 `execution.renderer: custom`，不能借默认 CSS 检查器冒称已经测量三维画面。

## 2. 运动和镜头绑定实际执行

每个 SH 必须填写 `motionBinding` 与 `cameraBinding`，每个 TR 填写 `cameraBinding`：

```json
{"mode":"animated","subject":"petal","channels":["layers.petal.rotateX"],"reason":"花瓣从侧缘转向正面，显露原有纹理"}
```

镜头通道示例为 `camera.x`、`camera.zoom`。`subject` 必须引用该时段实际存在的主体。默认执行器逐整数帧采样：`animated` 必须发生数值变化；`hold` 必须保持不动并说明固定观察或阅读的理由。运动通道支持 x/y/z、宽高、scale、rotateX/Y/Z、radius、reveal、opacity；镜头支持 x/y/zoom/rotateZ。空的 hold 通道表会检查该对象全部支持通道。单帧镜头不能证明镜内运动，应使用有依据的保持并审看相邻衔接。

自定义执行器沿用 `layers.<主体>.<测量项>`、`camera.<测量项>`；保持也需要具体测量通道。不得把设计关键帧当成渲染时求值结果。真实运动不等于有意义的设计，结构变化、表意和观众视线仍分别审查。

G2/G3 每个 SH/TR 的 `implementation` 都须填真实 `路径:行号`：文件存在、UTF-8 可读、已列入 `inputs` 的 source 角色且行号有效。不存在的组件、越界行号或未绑定的文件不能通过。

## 3. A/B 不能用全屏插入段绕过

只对口播应用 A/B。比较相邻的实际 A/B 落稳状态，即使中间插入一个或多个 `full` 镜头。在进入新 A/B 的 TR 上，以 `takeover.fromShot` 指向此前的 A/B 起点。内容与背景证明层对应两个落稳状态，完成帧在进入接口的审查范围内且不晚于落稳开始。所有相邻接口仍分别审看。

人物不能遮住必要信息：A/B 镜头以及中间 full 插入段都逐帧检查。插入段继承两侧信息保护层，未出现的保护层测量为零。装饰仍可穿到人物身后。A/B 的背景必须确实不同；改名、改色、缩放同一背景不能通过。近乎透明的巨大矩形不能冒充主导内容或背景覆盖：面积乘实际不透明度，避免重叠重复计数；避让则继续使用保守范围。

## 4. 自定义渲染器提交逐帧证据

G1 允许只有明确设计与执行绑定，草样仍可制作。G2/G3 必须为每个已登记媒体提交一份测量文件，登记到 `executionEvidence`：

```json
{"media":"draft","evidence":{"path":"output/draft-execution.json","sha256":"真实文件哈希"}}
```

文件根字段为 `method: renderer-mask-projection`、`binding`（取当前门禁的 `executionBinding`）、实际编码 `mediaSha256`、真实 `width/height`、测量代码 `producer: src/measure.ts:1` 和按 SH/TR ID 索引的 `targets`。

每个 target：

- `frames`：该镜头/接口的全部整数帧，顺序连续。每帧有 `frame` 与 `values`，后者包含所有绑定通道的有限实际数值，不能只测首中尾。
- `captures`：首帧、`floor((from+to-1)/2)`、末帧的真实渲染截图；短段去重。每项有 `frame/path/sha256`。
- A/B 每帧及中间 full 段包含 `staging.protectedOverlap`：所有保护层与人物的实际重叠面积，单位为合成像素，必要信息须为零。落稳时还需 `presenterArea/contentArea/backgroundCoverage/backgroundIdentities`。

人物/内容面积从实际渲染投影、裁切、alpha 和遮挡计算，不同层不能重复统计同一像素。A 人物主导，B 内容主导。背景覆盖是叠加人物前环境底层的有效覆盖，须至少 90%，不要求最终画面里背景无遮挡占 90%（否则会与 A 人物大屏冲突）。背景身份使用可见环境内容的稳定 SHA256，不能把镜头参数、场景名或单纯改色加入身份以制造差异。分段草样至少完整覆盖每个目标及其衔接范围。

操作顺序：实现测量代码并刷新输入 → 草样编码和技术检查 → `gates register-draft` → 获取当前 executionBinding → 将真实测量绑定到本次编码 → `gates register-execution` → 补实际观看、听审与专项记录 → G2。最终编码重复登记、测量和审查，再执行 G3。实际命令为 `npm run gates -- <动作>`，也可用 SDK 的 `spatial-imagery gates <工程> <动作>`。

`executionBinding` 绑定输入与编码，审查用的 `binding` 另外纳入测量文件哈希；因此修改测量也会让旧动态审查失效，不发生文件自引用哈希。登记测量会清除动态审查，不自动批准影片；保留同一编码的技术报告和未变化的设计审查。文件哈希不能证明填表人诚实测量，因此还必须核看真实截图、正常速度视频和合画面声音。检查器不自动理解美术，也不代替听审。

## 5. 声音默认保留，处理必须显式

混音默认 `normalization: preserve`，不自动做响度归一或人声闪避；仅在总线采样将削波时整体减益并报告。需要响度处理时明确填写 `normalization: loudness` 与 `lufs/truePeakDb` 两个目标；例如 -16 与 -1.5 只是示例，按项目实测和对听决定。若要闪避，显式设置 `ducking: {amount:0.4, attack:0.12, release:0.25}`，时间单位秒，amount 为减益比例。0 关闭闪避。旧设计同时给出两个响度目标仍视为明确选择 loudness；矛盾或不完整设置报错。

保留原片、连续未处理 PCM 和音画剪辑映射；先旁路、时间对齐、等响度比较，再决定降噪、压缩、增益和限幅。画质核对原片→前景→合成→实际编码的同帧细节，代理不作正式输入，少做有损代际。改字幕不能冒称修了口吃；提高码率不能冒称找回细节。3.25 的完整返修规范见 [原片保真与返修](recording-quality-and-repair.zh-CN.md)。
