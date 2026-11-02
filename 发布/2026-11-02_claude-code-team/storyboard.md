# Claude Code 团队怎么用 Claude Code：解说片分镜（v1，待用户看）

- 素材：Anthropic 官方对谈，Claude Code 团队 Thariq Shihipar / Sid Bidasaria / Robert Boyce（`编辑用/source.md`）
- 规格：1920×1080 横版、30fps、成片 ≤ 2 分钟；旁白普通话，用户复刻音色（`编辑用/tools/volc_tts.py`，语速 40、还原模式关）；原声英文，配中英双语字幕
- value：框架为主、信息为辅；stance_line D；个人立场只在片尾一句（用户 11-02 定）
- 外观学 `对标/Jim_AI_Notebook/`：深蓝底 + 缓慢漂的虚焦光斑、左上常驻章节标签、居中胶囊概念标签配英文斜体、底部单行中文旁白字幕；原声缩成圆角卡片 + 左上「人名 原声」标签 + 中英双语字幕；进原声前一个过桥镜头（动画卡缩到左边 + 原片小窗 + 一行要点）。不搬它的厨房比喻和画面
- **贯穿全片的一个形象：一条「人 → Claude」的指令线**。开头是密密麻麻一格一格的对话气泡（一句一步、一个个「允许」）；每讲一个转变，这条线就少一样东西，到结尾只剩一张「目标」卡片。观众只看哪一样变了

## 原声（五段，合计约 42 秒）

| # | 片源时间（合并后秒数） | 谁 | 英文 | 中文字幕 |
|---|---|---|---|---|
| C2 | 100.5–105.0 / 105.0–109.9 | Sid | caring about each individual tool call and each individual decision that the model makes, / to just zoomed out view of like, I have a goal and I'd like to achieve this goal. | 盯着每一次工具调用、模型做的每一个决定，/ 到退远一步：我有一个目标，我想把它达成。 |
| C4 | 227.2–231.4 + 236.2–244.1（中间剪掉 5 秒） | Sid | But a year from then, it's disappeared. You don't really need the to-do list anymore. / … you got to be very unattached to the things you're building / because they're going to go away fairly quickly. | 可一年后，它就消失了，待办清单已经用不上了。/ 你得对自己做的东西毫不留恋，/ 因为它们很快就会消失。 |
| C5 | 312.9–318.4 | Thariq | So I think in some ways, we're this hyperbolic time chamber of where software development is going. | 某种程度上，我们就是软件开发未来的「精神时光屋」。 |
| C6 | 575.4–578.9 / 579.4–583.1 | Robert | and they would pick out three little nitpicks to post. / It was kind of just like, I'm signaling to you that I read this code. | 审代码的人会挑出三个小毛病发上去，/ 其实就是在告诉你：这段代码我看过了。 |
| C7 | 931.0–934.1 + 951.7–955.5 | Robert | I can't see everything that Claude is thinking as it's thinking it. / And like being forced even to let Claude cook. | 我看不到 Claude 当下在想的每一件事。/ 就像被逼着放手，让它自己发挥。 |

## 分镜（时长按旁白约 6.5 字 / 秒估，配音后按实际时长重排）

| 段 | 章节标签 | 旁白 / 原声 | 画面 | 约 |
|---|---|---|---|---|
| 1 开场 | — | 一年前用 Claude Code，是你说一句、它做一步，还得一个个点「允许」。现在呢？ | 左：一长串小气泡往上刷，夹着一个个「允许？」按钮被点掉，左上角「2025」；右半屏是空的，打一个问号 | 9s |
| 2 交代 | — | Anthropic 官方放出一段内部对谈：Claude Code 团队的三位工程师，聊他们自己现在怎么用 Claude Code。我拆成三个转变。 | 原片三人全景缩成卡片居中，下方三个名字胶囊；随后右侧依次亮起 ①②③ 三个空位 | 10s |
| 3 转变一 | 不盯过程，只给目标 | Sid 说，他七八成的工作，已经在 Slack 里的 Claude Tag 上完成。 | 胶囊「目标 *goal*」；那串气泡被一把收拢，压成一张「目标」卡片，飞进一个 Slack 样的对话框；旁边「70–80%」计数跳到 | 7s |
| — 过桥 | | | 动画卡缩到左边，右边原片小窗，下面「Sid：从盯每一步，到只给目标」 | 1.5s |
| C2 | Sid Bidasaria 原声 | 原声 C2 | 原声卡片 + 双语字幕 | 9.5s |
| 4 转变二 | 功能是临时的 | 第二个转变：做出来的功能，要随时准备删。早期的模型，给它五件事只做三件；团队加了一张待办清单，它才做得完。 | 五个格子，模型打勾到第三格就停；一张清单滑进来，五格全勾 | 9s |
| — 过桥 | | | 「Sid：一年后，清单消失了」 | 1.5s |
| C4 | Sid Bidasaria 原声 | 原声 C4 | 原声卡片 + 双语字幕；剪口处轻推镜遮住 | 12s |
| 5 | 功能是临时的 | 因为底层模型，每两个月就换一次。用 Thariq 的话说—— | 一条横向时间轴，每两个月一个刻度，刻度上的功能卡（待办清单、提问工具……）一张张亮起又被下一代模型推掉；胶囊「每 2 个月」 | 6s |
| C5 | Thariq Shihipar 原声 | 原声 C5 | 原声卡片 + 双语字幕 | 5.5s |
| 6 转变三 | 人只看大局 | 第三个转变：人从逐行检查，退到看大局。以前审代码是这样的—— | 一段代码，三个小红圈依次圈住三处小毛病 | 5s |
| C6 | Robert Boyce 原声 | 原声 C6 | 原声卡片 + 双语字幕 | 7.7s |
| 7 | 人只看大局 | 现在这些小毛病，Claude 自己就改了。人只看它没想明白的：接口为什么这样设计，边界为什么划在这里。在 Claude Tag 里，你甚至看不到它每一步在想什么。 | 三个红圈被 Claude 自动抹掉；镜头拉远，代码变成一张服务地图，人只盯两条边界线；随后地图上盖一层半透明，只露出结果 | 12s |
| C7 | Robert Boyce 原声 | 原声 C7 | 原声卡片 + 双语字幕 | 7s |
| 8 回顾 | 三个转变 | 盯过程，变成给目标；功能，是临时的；人，只看大局。 | 开头那串气泡回来，三个转变依次把它砍成一张「目标」卡片；①②③ 三个位置填满 | 7s |
| 9 收尾 | — | 模型每两个月换一次，你搭的流程迟早要拆。能留下来的，只有你给它的那个目标。 | 只剩一张金色「目标」卡片，其余淡出；右下角账号名 | 7s |

合计约 2 分钟（旁白约 75 秒 + 原声约 42 秒）。配音后超了先压过桥和停顿，再删第 5 段时间轴那句。

## 片尾立场（stance_line D）

模型每两个月换一次，你搭的流程迟早要拆。能留下来的，只有你给它的那个目标。

（用户认同「对做的东西毫不留恋」「看不到它在想什么也得放手」；个人立场只这一句。）
