# Claude Code 团队怎么用 Claude Code：解说片分镜

## v3 改动（11-02，用户看 v1 成片后两条）

1. **声音太平** → 合成加语气指令（豆包 2.0 `additions.context_texts`）：「你是一个科技 AI 博主，正在讲一个令人兴奋的发现，语气要有惊讶、有强调、有起伏」，写进 `编辑用/tools/volc_tts.py` 默认值，全部旁白重配
2. **开场学 Jim AI Notebook**：画面用原片，旁白快速交代背景和人物（替换原来的「一年前」气泡开场 + 交代句）：

| 画面 | 旁白 |
|---|---|
| 原片全景嵌在卡片里，上方一行大标题「Claude Code 团队，自己怎么用 Claude Code？」 | 这是 Anthropic 官方放出的一段对谈，主角是 Claude Code 团队的三位工程师。 |
| Thariq 近景（116.5 秒起）+ 名牌「Thariq Shihipar · 提问」 | 负责提问的是 Thariq。 |
| Robert 和 Sid 双人镜头（44 秒起，左 Robert 右 Sid）+ 两个名牌 | 另外两位是 Sid 和 Robert，Robert 正在做 Claude Tag。 |
| 「一年前」气泡往上刷 → 「一年后」①②③ 三个空位 | 一年前用 Claude Code，是你说一句、它做一步；一年后，他们的工作方式有了三个转变。 |

为了压回 2 分钟：C2 从「在意每一次工具调用」开始（去掉「在意对话记录」半句），C4 去掉开头「那时的模型做不了任何长线任务」（跟「五件只做三件」重复），停顿收紧。总长 118.1 秒，旁白 45.3 秒、原声 ≈ 66 秒（含开场原片画面约 11 秒）。

---

以下是 v2 分镜（开场以上面为准）

- 素材：Anthropic 官方对谈，Claude Code 团队 Thariq Shihipar / Sid Bidasaria / Robert Boyce（`编辑用/source.md`）
- 规格：1920×1080 横版、30fps、成片 ≤ 2 分钟；旁白普通话，用户复刻音色（`编辑用/tools/volc_tts.py`，语速 40、还原模式关）；原声英文，配中英双语字幕
- **配比（用户 11-02 改）：原声约 70 秒、旁白约 42 秒**。故事让三位工程师自己讲，旁白只串场和点题（v1 是旁白 75 秒 / 原声 42 秒）
- 旁白不用「我」当主语（用户 11-02：讲解性视频，「我拆成三个转变」这种不合适），用客观讲述
- value：框架为主、信息为辅；stance_line D；个人立场只在片尾一句（用户 11-02 定）
- 外观学 `对标/Jim_AI_Notebook/`：深蓝底 + 缓慢漂的虚焦光斑、左上常驻章节标签、居中胶囊概念标签配英文斜体、底部单行中文旁白字幕；原声缩成圆角卡片 + 左上「人名 原声」标签 + 中英双语字幕；进原声前一个过桥镜头（动画卡缩到左边 + 原片小窗 + 一行要点）。不搬它的厨房比喻和画面
- **贯穿全片的一个形象：一条「人 → Claude」的指令线**。开头是密密麻麻一格一格的对话气泡（一句一步、一个个「允许」）；每讲一个转变，这条线就少一样东西，到结尾只剩一张「目标」卡片

## 原声（五段，合计约 72 秒）

| # | 片源时间（合并后秒数） | 谁 | 英文 | 中文字幕 |
|---|---|---|---|---|
| C2 | 98.2–114.5（16.3s） | Sid | caring about the transcript so much and like caring about each individual tool call / and each individual decision that the model makes / to just zoomed out view of like, I have a goal and I'd like to achieve this goal. / And you just kind of give that goal to the model to achieve for you. | 以前特别在意对话记录，在意每一次工具调用、/ 模型做的每一个决定；/ 现在退远一步：我有一个目标，我想把它达成。/ 然后把这个目标交给模型，让它替你完成。 |
| C4 | 209.0–220.8 + 227.2–231.4 + 236.2–244.1（23.9s） | Sid | the models were not able to do any kind of long horizon work. / It would give it like five things to do and it would do three things and just give up. / So that's when we were like, oh, maybe you give it a to-do list and it'll do really well. / But a year from then, it's disappeared. You don't really need the to-do list anymore. / … you got to be very unattached to the things you're building / because they're going to go away fairly quickly. | 那时的模型做不了任何长线任务。/ 给它五件事，做完三件就放弃了。/ 我们就想：要不给它一张待办清单？效果很好。/ 可一年后，它就消失了，待办清单已经用不上了。/ 你得对自己做的东西毫不留恋，/ 因为它们很快就会消失。 |
| C5 | 312.9–318.4（5.5s） | Thariq | So I think in some ways, we're this hyperbolic time chamber of where software development is going. | 某种程度上，我们就是软件开发未来的「精神时光屋」。 |
| C6 | 575.4–583.1 + 589.3–598.0（16.4s） | Robert | and they would pick out three little nitpicks to post. / It was kind of just like, I'm signaling to you that I read this code. / Now, you can have Claude figure out those little things and address them autonomously. / That's not really the important part of human code review anymore. | 审代码的人会挑出三个小毛病发上去，/ 其实就是在告诉你：这段代码我看过了。/ 现在，这些小问题可以交给 Claude 自己找、自己改。/ 这已经不是人审代码的重点了。 |
| C7 | 927.6–934.1 + 951.7–955.5（10.3s） | Robert | And that abstraction was like a little scary to get through at first. / I can't see everything that Claude is thinking as it's thinking it. / And like being forced even to let Claude cook. | 这层抽象，一开始有点吓人。/ 我看不到 Claude 当下在想的每一件事。/ 就像被逼着放手，让它自己发挥。 |

C4 原话里提到「maybe Sonnet 3.5」，没放进片段；三段之间的剪口用轻推镜遮住。

## 分镜（旁白约 42 秒，约 6.5 字 / 秒估，配音后按实际时长重排）

| 段 | 章节标签 | 旁白 / 原声 | 画面 | 约 |
|---|---|---|---|---|
| 1 开场 | — | 一年前用 Claude Code，是你说一句、它做一步。现在呢？ | 左：一长串小气泡往上刷，夹着一个个「允许？」按钮被点掉，左上角「一年前」；右半屏打一个问号 | 5s |
| 2 交代 | — | Anthropic 官方放出一段对谈：Claude Code 团队的三位工程师，聊自己现在怎么用 Claude Code。一年里，有三个转变。 | 原片三人全景缩成卡片居中，下方三个名字胶囊；右侧依次亮起 ①②③ 三个空位 | 9s |
| 3 转变一 | 不盯过程，只给目标 | 第一，不盯过程，只给目标。Sid 七八成的工作，都在 Slack 里的 Claude Tag 上完成。 | 胶囊「目标 *goal*」；那串气泡被一把收拢，压成一张「目标」卡片，飞进一个 Slack 样的对话框；旁边「70–80%」 | 7s |
| — 过桥 | | | 动画卡缩到左边，右边原片小窗，下面「Sid：从盯每一步，到只给目标」 | 1s |
| C2 | Sid Bidasaria 原声 | 原声 C2 | 原声卡片 + 双语字幕 | 16.3s |
| 4 转变二 | 功能是临时的 | 第二，功能是临时的。 | 五个格子 + 一张待办清单卡，清单上盖一个时钟 | 2.5s |
| C4 | Sid Bidasaria 原声 | 原声 C4 | 原声卡片 + 双语字幕；说到「五件做三件」「待办清单」时卡片旁边小图：五格勾到第三格停住 → 清单滑入五格全勾 → 清单淡出 | 23.9s |
| 5 | 功能是临时的 | 底层模型，每两个月就换一次。Thariq 的说法是—— | 横向时间轴，每两个月一个刻度，功能卡一张张亮起又被推掉；胶囊「每 2 个月」 | 4.5s |
| C5 | Thariq Shihipar 原声 | 原声 C5 | 原声卡片 + 双语字幕 | 5.5s |
| 6 转变三 | 人只看大局 | 第三，人只看大局。以前审代码是这样的—— | 一段代码，三个小红圈依次圈住三处小毛病 | 4s |
| C6 | Robert Boyce 原声 | 原声 C6 | 原声卡片 + 双语字幕；后半句时旁边小图：红圈被自动抹掉 | 16.4s |
| 7 | 人只看大局 | 人只盯 Claude 没想明白的：接口怎么设计，边界划在哪。连它每一步在想什么，都不用看了。 | 镜头拉远，代码变成服务地图，人只盯两条边界线；随后地图上盖一层半透明，只露出结果 | 7s |
| C7 | Robert Boyce 原声 | 原声 C7 | 原声卡片 + 双语字幕 | 10.3s |
| 8 收尾 | 三个转变 | 模型每两个月换一次，你搭的流程迟早要拆。能留下来的，只有你给它的那个目标。 | 开头那串气泡回来，被三个转变依次砍成一张金色「目标」卡片；①②③ 填满，其余淡出 | 7.5s |

合计约 2 分钟（旁白约 42 秒 + 原声约 72 秒 + 过桥约 3 秒）。配音后超了先压过桥和停顿。

## 片尾立场（stance_line D）

模型每两个月换一次，你搭的流程迟早要拆。能留下来的，只有你给它的那个目标。

（用户认同「对做的东西毫不留恋」「看不到它在想什么也得放手」；个人立场只这一句。）
