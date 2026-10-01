将空间视频制作方法整理为可安装的 TypeScript SDK，并附可复现的中英双语宣传片。设计表、元素、相机和声音共用明确的时间与身份，减少每个项目重复拼接临时代码的问题。

Packages the spatial video workflow as a deterministic TypeScript SDK, with bilingual documentation and a reproducible launch film. Subject motion, camera choreography, sound cues and production records share explicit timing and identity.

- Hermite 轨迹与速度、主体跟随相机、透视投影、屏幕空间交接诊断。
- 声音锚点、运动包络、淡入淡出、材质交叉淡化和等功率声像。
- 设计表/CLI、素材与样片检索、版本范围认可、文件哈希和媒体检查。
- 30 秒文字驱动宣传片：128 BPM、15 个镜头、3D 穿行/体积形变/阵列与图形重组、31 个声音事件；Remotion/Three.js 工程，10 份 CC0 原声音源，其他音乐/音效/视频独立获取并验证哈希。此前 Blender 研究版单独保留。
- 中英文首页与详细制作管线；代码 MIT，方法文档 CC BY 4.0，第三方许可单独记录。

Validation: TypeScript build, 25 behavioral tests, CLI checks, source hashes and clean tarball installation passed locally. Kinetic source type checking, representative frames and final media evidence are recorded in `examples/launch-film/qa-v2.json`. Normal-speed playback and subjective listening are not asserted. GitHub CI is configured separately and its status must be checked after push.

The core has no runtime dependencies. Transcription, matting, physical relighting and prompt-to-film generation are not implemented or advertised as automatic features. Remotion/Blender/FFmpeg are optional external rendering tools with their own terms. This PR does not publish a package to npm.
