---
name: xiaohongshu-huochairen-shipin
description: >-
  火柴人短视频导演（Krypto说AI 版）。use this when 用户要把文案 / 笔记 / 文章 / 话题 / 漫画图文做成 Gemini Omni Flash 火柴人短视频的分镜和逐段 prompt：
  每段约 10 秒，时长 30 秒 / 60 秒（默认）/ 3 分钟 / 5 分钟。画风有 Style 1 经典极简（亮 / 暗）、Style 2A 极简科技、Style 2B 彩色故事，
  以及账号专属 Style 3「K 老师漫画风」：用漫画图文同一份 characters.py 出角色参考图和每段首帧，把爱因斯坦小人 K 老师稳定锁在每段视频里，默认 9:16、中文口播。
  用户说「火柴人视频」「K 老师视频」「漫画版视频」「stickman video」「Omni Flash 提示词」时用
---
# 火柴人短视频导演（K 老师版）

在开源 skill [kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director)（MIT，见 `LICENSE`）的基础上改的：原版三种画风和流程原样保留在 `references/`，新增 **Style 3 · K 老师漫画风**（`references/style-3-k-laoshi.md` + `scripts/render_refs.py`）。

`$V` = 本 SKILL.md 所在目录；`$M` = 同级的 `xiaohongshu-manhua-jiangjie`（K 老师造型在那边的 `scripts/characters.py`，两个 skill 要一起安装；Style 3 不改造型，只调用它）。

## 核心流程

一份素材 → 用户确认的导演方案（Phase A）→ N 条独立的约 10 秒 Omni Flash prompt（Phase B），N = 时长 / 10。保留原内容的意思，用「五段心跳」结构讲：黄金钩子 → 打破常识 → 拉出内幕 → 真相揭秘 → 升华互动。

## 开工前要确定的（缺什么一次问完，然后停）

- 素材
- 画幅：`9:16` 或 `16:9`
- 时长：10 秒的倍数，没说就 60 秒（6 段）；不是 10 的倍数就取最近的
- 画风：

| 画风 | 样子 | 适合 |
|---|---|---|
| **Style 1 亮 / 暗** 经典极简 | 纯白底黑线 / 纯黑底白线，最多 3 个强调色，无脸无衣服的火柴人 | 高密度讲解、思维模型 |
| **Style 2A** 极简科技 | 白色影棚 + 浅灰透视网格 + 青蓝玻璃 UI，红毛线帽黄 T 恤小人 | AI 工具、方法论 |
| **Style 2B** 彩色故事 | 全彩电影感场景，同一个红帽小人 | 情绪故事、成长 |
| **Style 3** K 老师漫画风 | 白底粗黑马克笔线 + 只用柠檬黄强调，K 老师（灰色炸毛 + 灰胡子 + 吐舌头 + 黑外套黄领带）主讲，小白 / bot 配戏 | **账号默认**：K老师讲AI 系列、漫画图文配套视频 |

**本账号的默认值**：用户提到 K 老师 / 漫画版 / 小红书、或没指定画风时，用 **Style 3 + 9:16 + 中文口播**，并在 Phase A 开头写明「默认用了 Style 3 / 9:16，要换直接说」——不用停下来问。用户点名要 Style 1 / 2 时，画幅和画风缺了照原规则问。

已经给过的不要再问。赶时间、省成本、「随便选个常规的」都不能跳过 Phase A 的确认。

## 步骤

1. 读 `references/storyboard-template.md`、`references/style-catalog.md`；**Style 3 再读 `references/style-3-k-laoshi.md`**（冲突时以它为准）。按五段心跳写 Phase A：
   - 说明用中文；口播 Style 3 默认中文（每段 40–50 字），Style 1 / 2 默认英文（每段 20–25 词）+ 中文参考译文
   - 分镜表每段一行：时间 / 这段的任务 / 画面 / 动作镜头转场 / 口播 / BGM 音效
   - Style 3 的画面一栏写清：谁出场、用 `POSES` 里的哪个姿势、哪个表情、`PROPS` 里的哪些道具——这样 Phase B 能直接画出首帧
2. **停下，等用户确认 Phase A。**
3. 用户改了画幅、时长、画风、口播、分镜结构或整体方向 → 重写 Phase A，再确认一次。
4. 确认后读 `references/omni-flash-prompt-contract.md`，出 Phase B（顺序：全局连续性说明 → N 条 prompt → 拼接说明 → 声音连续性说明）。
5. **Style 3 额外出图**（Phase B 同时做）：
   - 写 `<输出目录>/火柴人视频/编辑用/keyframes.json`：每段的 `start` 场景（可加 `end`），第 N 段的 start = 第 N-1 段的 end；格式见 `scripts/render_refs.py` 顶部注释和 `samples/keyframes.json`
   - `python3 $V/scripts/render_refs.py sheet <输出目录>/火柴人视频/参考图`（没有 Chrome 的云端环境出不了图：参考图直接用 `$V/assets/ref_k_laoshi.png`、`ref_cast.png`，首帧跳过，只交付 keyframes.json 回 Mac 再出）
   - `python3 $V/scripts/render_refs.py frames <输出目录>/火柴人视频/编辑用/keyframes.json <输出目录>/火柴人视频/首帧`
   - Read 参考图和几张首帧检查：人有没有被裁掉、姿势是不是这一拍的开头、竖版上下是不是留了字幕位
   - 每条 prompt 开头注明「参考图：ref_k_laoshi.png；首帧：clipNN.png」
6. 只有在一个完整例子能消除歧义时才读 `references/examples.md`。

确认的是旧版 Phase A、或只确认了选题，都不算确认当前 Phase A。

## 输出硬规矩（所有画风）

- 每段三拍 `[0–3s]` `[3–7s]` `[7–10s]`，至少 4 个视觉手段，每 2–3 秒画面有变化；人不能站着发呆
- 动作靠具体的人物动作（跳、推门、画线、抱东西走），不用液体 / 形状变形
- 每段结尾的画面 = 下一段开头的画面
- 旁白声音描述每段逐字相同；BGM 从第 1 段起锁住
- 口播只作音频：`Audio voiceover only, strictly no speech bubbles, no dialogue boxes`；台词原样引用，不许改、重复、上字幕
- prompt 里不写色号（hex / RGB / Pantone），只用普通颜色词
- 生成画面里默认没有任何字、字母、数字；要加的 2–5 字花字单列在后期清单里
- 不编造事实、数字、引语、产品能力
- Style 2 / Style 3 的角色锚点逐字照抄，不改写

## 改版规则

改画幅要重新排站位，不是改个参数：`16:9` 左中右 + 横向跟拍；`9:16` 前后景深 + 竖向揭示 + 给界面留安全区。改画风、主题、画幅、时长都算全局改动，之前的确认作废。

## 交付前检查

照 `references/storyboard-template.md`（Phase A）和 `references/omni-flash-prompt-contract.md`（Phase B）末尾的清单逐条过；Style 3 再加：

- 每条 prompt 都有 K 老师锚点（第 1 段用完整版，后面用 The same… 版）和 Style 3 负面约束
- prompt 里没有 "Einstein" 或任何真人名字
- 首帧张数 = 段数，相邻两段首尾画面一致
- 参考图和首帧上没有字

交付：SendUserFile 发 `参考图/ref_k_laoshi.png`、首帧（多张就发前两张）和 prompt 文档 `火柴人视频/prompts.md`。
