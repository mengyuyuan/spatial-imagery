# 需求绑定与实际执行入口 · 3.27

本次缺陷：用户要求素材直接播放，被扩大成整片平面固定机位；包装动画绑定到人物 `sourceTime`；检查仍针对旧版，新的渲染和发布脚本绕过检查。“待审”虽诚实标明未验收，却被当作完成任务。修复落在可运行入口，不靠新增审核承诺。

## 需求来自用户，不来自实现后的解释

将当前有效原话、范围、已确认修正保存在项目 brief 文件，登记为 `inputs` 的 `brief` 角色。`requirementContract.version=1`，`brief` 指向该文件，`requirements` 每项包含：

- `id / quote / kind / scopeReason / acceptance`：原话、类别与适用范围、可观察的验收结果。kind 为 content、asset、editorial、motion、spatial、audio。
- `fulfillments`：每项以 `target` 引用真实 SH/TR，写 `initial / process / result`。不要把“使用已有视频”扩大为“可以省略包装空间设计”。
- motion/spatial 再写 `channels`，必须属于目标镜头真实 motionBinding/cameraBinding；不能只登记人物播放时间或透明度。
- spatial 再写 `allowedDimensions`（按本次要求选择 2d、2.5d、3d），各 fulfillment 写 `dimension / subject / depthCue / depthChannels / implementation`。depthChannels 指定实际产生纵深、折叠或形体变化的通道，须属于 channels；自定义逐帧证据单独验证这些通道确实变化，不能靠另一个播放通道在动代签。subject 必须匹配实际 motionBinding；3d 要求 custom 执行器，实际实现位置从 G2 起核验。默认二维执行器不得冒称真实三维。

通道实际数值继续由执行证据逐帧验证，填写三维名称不证明三维效果。没有明确三维要求的项目不强制三维；固定镜头可服务阅读，但不能代替已承诺的变化。brief 完整性、语义分类与观看效果仍需制作者核对，机器不会自动理解原话。

## 当前版本只能有一个执行身份

项目根 `pipeline-active.json`：

```json
{
  "version": 1,
  "manifest": "production-gates.json",
  "entryPoint": {"path": "film.tsx", "sha256": "当前真实哈希"},
  "designSource": {"path": "design.json", "sha256": "当前真实哈希"},
  "scope": [0, 180], "fps": 30, "width": 1920, "height": 1080
}
```

入口、设计均须与门禁 inputs 的 source/design 角色相符；designSource 和 parameterSources 也须指向实际执行文件。修改源码或设计后显式更新当前身份并使旧审查失效，不能仅修改指针、复用旧通过记录。执行者应核对所有本地导入及媒体依赖均已绑定；入口哈希不自动覆盖未登记的依赖。

## 三种执行模式

在 bundle/render 之前调用共享 preflight；导出之前重新调用，禁止缓存一次通过当永久通行证。Python `pipeline_entry.check(...)` 返回 allowed、completed、错误列表；Node `pipeline_entry.cjs` 在失败时抛错。

```text
python scripts/pipeline_entry.py --project PROJECT --mode draft --entry film.tsx --design design.json --output qa/pipeline-review/draft.mp4 --range 0 180
```

- `draft`：要求当前版本身份和需求契约有效；允许设计批判、动态审看与听审尚未通过，输出限定项目 `qa/pipeline-review`。返回 completed=false，输出名称与汇报必须清楚标明验证对象和未解决项。可以提供给用户查看，不可宣称目标已完成。
- `full-render`：当前版本与 G2 同时通过才启动正式高质量渲染。允许有明确范围的分段生产，但每段属于当前完整帧轴。
- `delivery`：G3 通过，只允许导出 finalMedia 登记的同一文件、完整范围和哈希。复制到交付目录前重验。客观媒体检查继续使用 verify_delivery.py，它不能替代 G3。

不新增用户批准轮次。检查失败先修对应问题；用户要求暂停或只检查时遵从。旧项目可保留、读取、诊断，正式制作必须显式补齐契约；不自动填 passed，也不把历史待审文件自动升级。

## 能力边界与回归

这是接入入口的程序约束，不是操作系统沙箱。直接另写 FFmpeg/Remotion 命令仍可绕过，因此禁止把绕过输出登记为管线交付。SDK、自定义渲染和发布脚本都要接入同一检查；未迁移的外部工程不能宣称已获得保护。

回归必须包含：已有合规二维工程允许通过；明确要求三维却仅 CSS2.5D、sourceTime 代替物体变化、旧源码/旧帧轴、待审写入交付路径、未登记最终文件均失败；允许尚未审完的当前诊断留在诊断路径且 completed=false。测试使用合成数据，不当作真实影片批准。
