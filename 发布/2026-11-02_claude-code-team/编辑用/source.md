# 素材：Claude Code 团队三人对谈（Anthropic 官方视频）

- 用户 11-02 发来 5 段 mp4（1574×1080，23.976fps），合计 21 分 43 秒，无烧录字幕；全文转录 `transcript.txt` / `transcript.json`（Whisper small.en，带词级时间戳；「Cloud Code」「Cloud Tag」是转录错误，应为 Claude Code / Claude Tag）
- 人：Thariq Shihipar、Sid Bidasaria、Robert Boyce（Claude Code 团队；原片字幕条「Member of Technical Staff」）。谁说哪句待对画面核实
- 用户定（11-02）：横版、成片 2 分钟以内、普通话旁白用用户复刻音色（`tools/volc_tts.py`，语速 40、还原模式关）、英文原声配中英双语字幕、只抽关键片段，其余用代码可视化讲解

## 摘要（给用户的 30 秒版）

Anthropic 官方视频，Claude Code 团队三位工程师聊自己现在怎么用 Claude Code。核心判断：一年前是逐条下指令、点权限，现在只给目标，七八成工作在 Slack 里的 Claude Tag 上完成。支撑：底层模型每两个月一变，去年救命的 to-do list 今年删掉了；代码审查从挑小毛病变成看大局；Robert 用 Claude Tag 开发 Claude Tag。最可争论的一句：「你得对自己做的东西毫不留恋，因为它们很快就会消失。」

## 候选原声（时间是合并后全片的秒数）

| # | 时间 | 时长 | 原话要点 | 中文意思 |
|---|---|---|---|---|
| 1 | 82.0–95.4 | 13s | 70 to 80% of my work happens on Claude Tag now | 七八成工作都在 Claude Tag 上，只有两成会打开终端或桌面端去微调 |
| 2 | 95.4–114.6 | 19s | from caring about each individual tool call … to I have a goal | 从盯每一次工具调用，到只说「我有个目标」，交给模型去完成 |
| 3 | 160.8–168.5 | 8s | the technology fundamentally shifts underneath you every two months | 脚下的技术每两个月就彻底变一次 |
| 4 | 212.8–244.4 | 32s（可剪到 17s） | to-do list … a year from then, it's disappeared … be very unattached | 当年模型做五件只做三件，加了 to-do list 才行；一年后不需要了。要对自己做的东西毫不留恋 |
| 5 | 313.0–318.4 | 5s | hyperbolic time chamber of where software development is going | Claude Code 团队是软件开发未来的「精神时光屋」 |
| 6 | 575.5–598.1 | 23s | pick out three little nitpicks … to prove that I actually was reading | 以前审代码挑三个小毛病，只为证明自己看过；现在这些交给 Claude，人看大局 |
| 7 | 951.8–973.0 | 21s | being forced even to let Claude cook | 看不到它在想什么，一开始有点怕，但被逼着放手之后发现模型真的够好了 |
| 8 | 1243.9–1248.9 + 1271.9–1302.8 | 5s + 31s | Claude can just do that for me now … seven or eight … PowerPoint … within my grasp | 七八岁想做游戏只会用 PowerPoint；现在整个软件工程都触手可及 |

## 写稿前先问（11-02 发给用户，待回答）

见对话；回答原样记在下面。

用户回答（11-02）：
- 原声选 2 4 5 6 7（每段压到最关键一两句，原声合计约 45 秒）
- ① 「第一个问题由你来定吧」→ 旁白不放用户个人经历
- ② 认同「对做的东西毫不留恋，就是因为现在模型进化的速度太快」和「很多时候看不到他在想什么，也得放手」
- ③ 观众带走信息和框架
- ④ 问长期立场 A/B/C/D 是什么，待选
- ⑤ 「付出过什么代价，这部分不要硬提了，可以跳过」
