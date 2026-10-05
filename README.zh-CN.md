# 空间意象 · Spatial Imagery

**v0.4 硬门禁：** 运动、镜头、声音各自独立，缺证据/失败阻止正式渲染与交付；无声也须验证。`videoType` 必填，只有 `talking-head` 可用 A/B，其他影片用 `general` + `full`。详见 [门禁与迁移](templates/production/PRODUCTION-GATES.md)。

**让想法成为空间。** 面向主体驱动叙事的 TypeScript SDK：连续运动、空间镜头接力、声音包络，以及可追溯的设计表。

[English](README.md) · [完整制作管线](docs/pipeline.zh-CN.md) · [API](docs/api.md) · [宣传片源码](examples/launch-film/README.md)

https://github.com/user-attachments/assets/37f98ee4-dff0-4948-8d79-7f060c86b287

**30 秒宣传片，建议打开声音。** 文字驱动、空间镜头、元素变形，与音乐节拍共同推进。[下载 MP4](media/spatial-imagery-kinetic-v2.mp4)。

**当前为 v0.6.0，包含脚本出片执行器与底层 SDK。** 配置 OpenAI 兼容模型后，可从脚本生成可编辑设计表，获取选用素材，生成动画工程、混合声音并渲染 MP4；也能使用 Codex 或人工审定的设计表。审美复核、口播转录、真人抠像与重打光仍是独立制作环节。[脚本出片详细说明](docs/script-to-video.zh-CN.md)。

**首次运行：随包样片，无需模型密钥、私人素材或素材下载。** [Installation / 安装排错](docs/quickstart.md).

```sh
npm ci
npm run build
node dist/cli.js doctor
node dist/cli.js demo --out first-film --install --render
```

6s / 640×360 / 30 fps / stereo: `first-film/qa/pipeline-review/draft.mp4`. [G1/G2/G3 production gates / 正式门禁](templates/production/PRODUCTION-GATES.md).

**八项独立门禁：** 设计、运动、镜头、衔接变化、调色/打光、抠像、降噪、音效。**禁止 PPT 式包装**：重复卡片换字、淡入、位移与缩放不能代替内容演绎。各项须有真实证据，不适用须经源检查。[完整退回条件](templates/production/SPECIALIST-GATES.md)。


## 已封装的能力

| 模块 | 实际提供 |
|---|---|
| 脚本出片 | 可配置模型、有限次数设计修正、Pexels 视频搜索、素材获取核验、可编辑二维/2.5D 工程、连续混音、成片检查 |
| 运动 | 按绝对秒采样的数值轨道、三次 Hermite 空间轨迹与解析速度 |
| 镜头 | 跟随主体、前视、透视投影、切点屏幕位置/速度/尺度诊断 |
| 声音 | 可闻锚点对齐、运动力度、淡入淡出、材质等功率交叉淡化、声像、音频采样级增益 |
| 设计表 | 口播专用 A/B；其他影片全屏场景、主体状态链、镜头任务、声音意图、阅读窗口、交接记录与 JSON 校验 |
| 素材与样片库 | 原素材与样片版本分开检索，来源/哈希/许可记录，认可绑定具体版本与范围 |
| 检查 | 独立 Node 入口验证文件哈希、项目路径边界、实际解码帧数及音视频时长 |
| 样片 | 30 秒中英双语宣传片、Blender/Remotion 源码，以及新的 20 秒脚本出片集成测试片 |

核心包没有运行时依赖。出片执行器在生成工程中安装 Remotion；Blender 示例另有渲染环境要求。[查看和复现脚本出片测试](examples/script-to-film/README.md)。

## 从源码运行

需要 Node.js 22+；渲染需要 FFmpeg/ffprobe 和浏览器，正式门禁需要 Python 3.11+。首版通过源码或本地打包安装，**尚未发布到 npm**。

```sh
git clone https://github.com/mengyuyuan/spatial-imagery.git
cd spatial-imagery
npm ci
npm test
node dist/cli.js init ./my-film
node dist/cli.js check ./my-film/storyboard.json
npm pack
```

完整源码保存在 `main`。生成的 `spatial-imagery-0.6.0.tgz` 可安装到其他项目；不要直接假定 npm 同名包属于本仓库。

```ts
import {motionPath, followCamera, sampleCue} from 'spatial-imagery';

const subject = motionPath([
  {time: 0, position: [0, 0, 0]},
  {time: 2, position: [0, 6, 1], velocity: [0, 3, 0]},
  {time: 4, position: [1, 12, 1]},
]);
const time = frame / fps;
const object = subject(time);
const camera = followCamera(subject, time, {
  offset: [0, -5, 2], lookAhead: 0.12, fov: 45,
});
const sound = sampleCue({
  id: 'SFX01', asset: 'licensed-air.wav', start: 0, end: 4,
  sourceIn: 0.5, fadeIn: 0.3, fadeOut: 0.6, gainDb: -12,
  pan: [-0.2, 0.2],
}, time);
```

把位置、镜头和增益交给你的渲染器/混音器即可。支持任意顺序拖轴与分帧渲染；不依赖上一帧累积状态。坐标由调用方约定，示例使用 Z 向上，视角为垂直角度。更详细的参数和边界见 [API](docs/api.md)。

## 制作方法

先理解内容，再确定主体；写出观众实际看到的变化，安排镜头发现顺序；主动寻找视频和声音素材，用同一时间轴编排；渲染后审看、听审，把真实版本回库。完整步骤、设计表字段、音效检索处理和检查方法见[制作管线](docs/pipeline.zh-CN.md)。结构校验通过不等于设计、许可或听感通过。

宣传片附[设计表](examples/launch-film/design.md)、[素材身份](examples/launch-film/asset-manifest.json)、[复现说明](examples/launch-film/README.md)和 [QA](examples/launch-film/qa.json)。示例里的材质、造型和配色属于这支片子，下一支片子按内容设计。

原始代码采用 **MIT**；制作方法文档采用 **CC BY 4.0**。第三方媒体和渲染器单独遵守各自许可，详见 [NOTICE](NOTICE.md)。公开包不含个人原片、付费音库或凭据。

[3.26 执行与证据契约及迁移](docs/execution-evidence.zh-CN.md)。SDK 0.5 要求执行契约 1，旧工程的批准不能自动继承。

**3.27 / v0.6:** [需求绑定与统一执行入口](docs/requirements-and-entrypoints.zh-CN.md).
