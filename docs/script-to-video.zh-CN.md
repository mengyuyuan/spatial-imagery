# 从台词脚本到视频

**v0.4：** 运动、镜头、声音为独立硬门禁，无声也须验证。`videoType` 必填；A/B 仅允许口播 `talking-head`，其他影片使用 `general` + `full`。见[门禁与迁移](../templates/production/PRODUCTION-GATES.md)。

v0.4: first renders explicitly use `--draft` → `output/draft.mp4` and `draft-qa.json`. Formal rendering requires bundled G1/G2 evidence; delivery requires G3. Python 3.11+ is required for gates only. See the generated `PRODUCTION-GATES.md`. / 首次出片为明确的诊断草样，正式渲染与交付须完成随工程携带的门禁。

v0.2 增加了真实执行入口：脚本 → 模型设计 → 分镜/场景图校验 → 素材获取与核验 → 可编辑 Remotion 工程 → 连续音轨 → MP4 与 QA。原来的运动、相机、声音 SDK 和完整制作方法继续保留。

## 直接从脚本制作

先在仓库运行 `npm ci`、`npm run build`。复制 `templates/production.config.example.json` 为自己的配置，填写服务商的 **OpenAI 兼容 Chat Completions 基础地址和准确模型 ID**。基础地址一般以 `/v1` 结尾；程序补上 `/chat/completions`。密钥只放在配置指定的环境变量中，不填进 JSON、源码或命令行参数。默认 `SPATIAL_IMAGERY_API_KEY`；支持本地模型服务的 localhost HTTP 地址，远程地址要求 HTTPS。

```sh
node dist/cli.js make script.md --config film.config.json --catalog assets.json --out my-film --install --render --draft
```

脚本使用 UTF-8 纯文本或 Markdown，每个非空内容行得到一个稳定的 `L001` 编号；一级标题只作为标题。多句属于同一表达时可以写在同一行。程序统一 BOM 与换行符，避免 Windows/Linux 检出的相同脚本产生不同设计身份。模型需要覆盖全部内容行，可以按语义合并或拆分镜头。

此命令会把脚本、创作说明和候选素材元数据发送到你指定的模型服务。不会把本机素材路径或 API 密钥放进提示词。连接失败不会静默换模型；JSON 或分镜不合格最多修正一次，再将具体错误写到项目目录。

`--install` 明确安装工程所需渲染依赖；`--render --draft` 渲染诊断草样；单独 `--render` 检查正式证据。省略它们会生成可查看、可编辑的工程。缺模型配置时会提示补配置或使用设计表导入，绝不自动用换字模板冒充内容设计。

## 素材不是链接占位符

`--catalog` 接受素材记录数组，字段与 `ProductionAsset` 类型一致：ID、类型、标题、来源、许可、许可 URL、标签、使用/再分发边界、时长、检查状态，以及 `local` 或 `download`。本地路径相对于目录文件且不能逃出该目录；本地文件需要真实 SHA256。下载项只能来自明确记录的 HTTPS 地址，获取后记录哈希、媒体类型和实际长度。

可参考 `examples/script-to-film/catalog.json`。`redistribution: "forbidden"` 在这里表示原素材不能随源码分发，不等于已取得成片的一切用途授权。必须阅读对应许可；模型和校验器不会推断你的发布用途是否合法。

已有库不足时可启用 Pexels 视频搜索：

```json
{
  "search": {
    "provider": "pexels",
    "apiKeyEnv": "PEXELS_API_KEY",
    "perQuery": 4
  }
}
```

把该段加入模型配置。未指定 `queries` 时，模型先根据脚本提出 1–4 个检索词，程序执行真实搜索，记录 `research.json`，再把候选交给设计步骤。也可先独立执行：

```sh
node dist/cli.js search "traffic lights rhythm" --out traffic-candidates.json
```

Pexels 搜索需要自己的 API key。音效与音乐当前从明确的本地/下载目录选取，**尚无覆盖所有音库的自动搜索器**。默认要求实际使用合适的视频素材，不能只写素材名字或改用静态图片完成。搜索候选不自动变成视觉审核通过；按原制作管线看实际片段、核对语义和使用条件。没有合适素材时补目录再运行新项目，不应伪造素材。

## 使用 Codex 或人工审定的设计表

不必重复调用远程模型。Codex 可以依据随包的规划合同、设计原理、设计推导、SOP、脚本和素材目录生成 `FilmDesign`，审看或修改后交给同一个执行器：

```sh
node dist/cli.js make examples/script-to-film/script.md --config examples/script-to-film/config.json --catalog examples/script-to-film/catalog.json --design examples/script-to-film/design.json --out city-rhythm --install --render --draft
```

设计表包含语义与执行两部分：每镜台词 ID、主体起始/过程/结果、观察任务和交接；逐层形状、文字/视频、相机、全局关键帧；逐条声音的源内位置、起止、淡化、声像和运动强度。一个主体层可跨多个镜头持续存在。程序不按关键词随机挑动效。

默认执行器可组合文字、矩形、椭圆、SVG 路径、图片和真实视频，以二维/CSS 2.5D 场景图表现关系。它不是完整三维物理引擎。工程源码完全可编辑；真 3D 网格、物理打光、复杂形变应在 `src/index.tsx` 中接入 Three.js/其他渲染实现，沿用同一分镜与声音轴。不能把默认执行器的能力说成覆盖太阳系、人体重打光等所有复杂画面。

## 设计合同与执行边界

规划器的实际系统上下文由包内 `planner.md`、`design-principles.md`、`design-synthesis.md`、`pipeline.md` 组装。工程的 `design-instructions.md` 保存完整指令，`planner-context.json` 保存标准 3.24、各文件和整体哈希；不依赖作者本机技能。导入设计标为 `source: imported`，只记录可用的方法版本，不冒称曾调用模型。

模型必须交付 `designRationale`（依据、替代方案、选择、感知、风险）、`execution`（引擎、理由、能力需求）、逐 SH 的意义/身份/变化/意向/阅读区间、每对相邻 SH 的 `transitions`，以及八项 `gatePlans`。字段见[规划合同](../templates/production/planner.md)与导出的类型。焦点 ID 必须对应镜头边界时实际存在的图层，TR 必须接上两侧焦点；运动、镜头和声音计划不可关闭。有意无声写 `audioReason`。这些决策进入 `production-gates.json`，审核仍全部未验证，模型不能生成通过记录。旧版 `--design` 可继续导入，但缺少的门禁设计内容须人工补齐。

指定画幅、帧率、视频类型、时长、未知执行字段，以及“声明素材但没有在该镜实际使用”的问题，都进入同一个有界修复流程：最多带具体错误重试一次，仍失败则保存错误并停止。默认相机仅支持 `x/y/zoom/rotateZ/perspective`；`z/target` 和未知图层 shader 等字段直接报错，避免写了却未执行。

支持的图层场景选 `execution.renderer: layers-2.5d`；需要真实网格、空间相机/光照、特殊形变时选 `custom`，记录能力需求。后者返回 `custom_implementation_required` 并生成明确的 `src/index.tsx` 待实现入口，制作者实现 `Spatial-Imagery` 合成、保留计划中的时轴/素材/声音，再渲染审看。这个分支负责明确能力边界，尚不自动写完 Three.js/Blender 场景，也不能把平面替代片当作已实现的三维设计。

## 每个项目有自己的规则

```json
{"policy":{"music":"allowed","narration":"off","footage":"required"}}
```

- 音乐：`allowed` 或 `off`，不再把旧片“零 BGM”设为通用限制。
- 人声：`off` 或 `provided`。后者要求实际的人声素材与声音事件；此版不生成、克隆声音，也不自动对齐口型/词级字幕。
- 视频：默认 `required`；明确选择纯程序动画的项目可用 `optional`。它不是省略实际素材研究的借口。
- 时长、尺寸、帧率、风格和阅读节奏按项目设置，没有“只能 30 秒”或“只能宇宙”的限制。镜头观察任务、空间形式与转场无需固定配额。

音效使用实际录音，按事件覆盖动作过程，具备淡入淡出、强度轨道、声像和重叠区间；音乐/人声保留立体声，运动/接触音先下混单声道再做等功率声像。人声事件会平滑降低竞争音轨。混音进行整片两遍响度处理，默认 -16 LUFS、真峰值上限 -1.5 dBTP；可在设计表 mix.lufs / mix.truePeakDb 调整。报告记录实测值与总线减益，不把它当听感结论。长片超过当前 512 MiB 混音缓冲预算时明确报错，需分段渲染；不会静默截短。

## 查看、返修和交付

输出目录保留 `script.md`、`design.json`、`design-table.md`、`storyboard.json`、`assets.json`、`policy.json`、可编辑源码和制作报告。相同输出目录不能被 `make` 静默覆盖。

```sh
cd my-film
npm run studio
npm run render:draft
# 或从 SDK 仓库运行：node dist/cli.js render /absolute/path/my-film
```

修改 `design.json` 或工程源码后重新渲染；修改台词内容则重新设计并建立新版本。每次渲染重新验证设计与素材哈希；草样输出 `output/draft.mp4`，正式渲染输出 `output/final.mp4`、关键帧和 QA，核对解码帧数、音画时长、尺寸、帧率与完整解码。默认 `normalSpeed`、`listening`、`aesthetic` 保持未验证；需要按原管线完成真实审看/听审与返修，再把具体成片身份回库。该入口不会自动声称用户认可，也不会自动发布 GitHub、npm 或视频平台。

当前仍需外部解决：真人转录/粗剪/抠像/重打光、配音生成、任意网站音效检索、专业审美评价。模型服务的可用性、费用和上下文长度由所选服务决定。运行需要 Node.js 22+、FFmpeg/ffprobe、Chromium、合适字体和独立渲染器依赖；本 SDK 核心仍没有运行时依赖。

## 3.24: A/B 可执行契约与旧工程迁移

参见 [A/B 主次交接与人物避让](presenter-staging.zh-CN.md)。每镜必须记录人物、内容、环境、信息保护区和落稳区间，每个 A/B 接口必须设计内容接管。A/B 背景场景必须不同并设计换场，不能保留同背景只调整人物或内容大小；转场全程须让必要信息可见。非口播 full 不强加 A/B。
