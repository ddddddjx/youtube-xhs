# Thariq (@trq212) — HTML plan skill 帖子归档

来源：https://x.com/trq212/status/2107192901537329354
作者：Thariq (@trq212)，Claude Code @anthropicai
抓取时间：2026-10-07
说明：只收录主帖和作者本人在该会话里的回复。他人评论仅在「回复对象」里摘一句，方便看上下文。互动数是抓取时的数字。

文件：
- video.mp4 — 主帖视频，1758×1080，约 39.3 秒，H.264，4.4 MB
- video_frame_08s.jpg / video_frame_20s.jpg — 视频抽帧
- reply_callstacks.jpg — 作者第三条自回里的配图

---

## 1. 主帖

- ID: 2107192901537329354
- 时间: 2026-10-05 19:35:12 UTC（北京时间 10-06 03:35）
- 互动: 赞 4518 / 转 177 / 引用 61 / 回复 290 / 收藏 4573 / 浏览 453664
- 视频: video.mp4（时长 40443 ms）
- 链接: https://x.com/trq212/status/2107192901537329354

I've been working on a skill that makes better HTML plans in Claude Code.

It uses simple language, shows code snippets, surfaces questions & makes mockups. Linting reduces the normal failure cases that Claude runs into.

Would love your feedback before shipping more broadly!

---

## 2. 作者自己的回复（按时间）

### 2.1 安装方式（紧跟主帖的自回）

- ID: 2107192972983075241
- 时间: 2026-10-05 19:35:29 UTC
- 互动: 赞 584 / 转 27 / 引用 3 / 回复 21 / 收藏 1234 / 浏览 48540
- 链接: https://x.com/trq212/status/2107192972983075241

install it and give me feedback with:

claude plugin marketplace add anthropics/claude-plugins-community

claude plugin install html-plan@claude-community

here's an example: https://claude.ai/artifact/CUF7bzFny3XUFVLAVt9rfc

### 2.2 想做成替换默认 plan mode 的插件

- ID: 2107193591852675342
- 时间: 2026-10-05 19:37:56 UTC
- 互动: 赞 60 / 转 1 / 回复 10 / 收藏 5 / 浏览 10800
- 回复对象: Gustavo Valverde (@GustavoValverde) — "HTML plans without plan mode, right?"
- 链接: https://x.com/trq212/status/2107193591852675342

I want to ship this is as a plugin that replaces default plan mode with a HTML plan

### 2.3 承认界面还要再设计

- ID: 2107194660171186423
- 时间: 2026-10-05 19:42:11 UTC
- 互动: 赞 40 / 回复 3 / 浏览 11524
- 回复对象: Vincent Adultman (@TatataToddC) — "Idk the UI in this video feels a bit chaotic to me. I think too much variance in font sizes, positioning of visual elements, etc. It's not calm to look at imo"
- 链接: https://x.com/trq212/status/2107194660171186423

yeah good feedback, more design work to do!

### 2.4 lint 也覆盖图表和流程图

- ID: 2107195507739422805
- 时间: 2026-10-05 19:45:33 UTC
- 互动: 赞 9 / 收藏 2 / 浏览 9737
- 回复对象: Mustafa (@mustafa_2vec) — "Does it generate good flowcharts??"
- 链接: https://x.com/trq212/status/2107195507739422805

yeah some of the linting is for better diagrams + flowcharts

### 2.5 call stack 和代码批注（带图）

- ID: 2107196587021840760
- 时间: 2026-10-05 19:49:50 UTC
- 互动: 赞 176 / 转 3 / 引用 1 / 回复 12 / 收藏 117 / 浏览 34210
- 配图: reply_callstacks.jpg
- 链接: https://x.com/trq212/status/2107196587021840760

I particularly like the call stacks (got this from @dillon_mulroy) and ability to annotate code snippets

### 2.6 mockup 复用已有组件

- ID: 2107199875201032330
- 时间: 2026-10-05 20:02:54 UTC
- 互动: 赞 1 / 回复 1 / 浏览 1888
- 回复对象: Dhruv Kumar (@dhruvkumar1805) — "does it reuse the existing components for the mockups or draw fresh ones? my plans keep inventing a whole new UI every time"
- 链接: https://x.com/trq212/status/2107199875201032330

Yeah reuses components, should be more token efficient

### 2.7 token 消耗接近 markdown

- ID: 2107200136485191950
- 时间: 2026-10-05 20:03:57 UTC
- 互动: 赞 6 / 回复 1 / 浏览 1257
- 回复对象: Joseph Hurtado (@josephfounder) — HTML/CSS 会不会比纯文本或 Markdown 多花很多 token
- 链接: https://x.com/trq212/status/2107200136485191950

It uses components so should lose much fewer tokens than raw HTML, should be comparable to markdown
