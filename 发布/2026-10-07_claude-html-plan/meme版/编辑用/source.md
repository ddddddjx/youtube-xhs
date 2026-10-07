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

---

## 10-07 补查：各家 plan mode 的一手出处（用户要求「基于事实，不瞎编」）

### Claude Code（官方文档 code.claude.com/docs/en/permission-modes，10-07 抓取）
- 「Plan mode tells Claude to research and propose changes without making them. Claude reads files, runs shell commands to explore, and writes a plan, but does not edit your source.」
- 进入：`Shift+Tab` 循环到 `⏸ plan mode on`；或单条提示词前加 `/plan`；或 `claude --permission-mode plan`。
- 方案出来后三个选项：「Yes, and use auto mode」「Yes, manually approve edits」「No, keep planning」。
- `Ctrl+G` 在你自己的文本编辑器里直接改方案。方案文件在 `~/.claude/plans/`。
- 项目里 `.claude/settings.json` 设 `defaultMode: plan` 可以让每次都从 plan 开始。

### Codex CLI（搜索结果摘自 OpenAI changelog，developers.openai.com 被代理挡，未直接核对原页）
- v0.93.0（2026-02）加入 plan mode：「Plan mode streams proposed plans into a dedicated TUI view, plus a feature-gated /plan shortcut」。
- 进入：`/plan [描述]`，或 `Shift+Tab` 循环 collaboration modes。
- 2026-03：加了 plan mode 提问的通知（「notifications for plan mode questions」）。

### Kimi Code CLI（官方帮助 kimi.com/help/kimi-code/cli-work-modes，搜索摘要，原页被代理挡）
- 「Plan 模式是一种只读的规划模式……AI 只能使用只读工具（Glob、Grep、ReadFile）探索代码库，不能修改任何文件或执行命令。AI 会将方案写入一个专门的 plan 文件，然后提交给你审批。」
- 进入：`kimi --plan`、`Shift-Tab`、`/plan`；复杂任务时 AI 可能自己通过 EnterPlanMode 请求进入。
- 审批面板：方案有多条路径时列 2 到 3 个带标签的选项；Reject / Reject and Exit / Revise（输入修改意见，AI 修订后重新提交）。
- 内置三个子代理：coder、explore、plan；plan 子代理没有 shell 命令。

### Qoder CLI（原通义灵码，docs.qoder.com/cli/plan，搜索摘要，原页被代理挡）
- 「Plan allows Qoder to explore the codebase in read-only mode, analyze problems, and propose a solution before making any code changes.」
- `/plan` 开关；常和 Goal 搭配：plan 里确认方案，退出后 `/goal set` 让它自己跑完。

### Cursor（cursor.com/blog/plan-mode，搜索摘要，原页被代理挡）
- `Shift+Tab` 进入；复杂任务 Cursor 会主动建议。
- 流程：先问澄清问题 → 查代码库 → 写方案 → 你在对话或 markdown 文件里改 → 点 build。
- 方案默认存在用户主目录，可「Save to workspace」进仓库。

### Trae（字节）
- 搜到的是 Builder 模式和 SOLO 模式，没搜到官方叫 Plan 的模式。稿子里写「没查到」，不写它有。

### html-plan 插件 README（raw.githubusercontent.com/anthropics/claude-plugins-community/main/html-plan/README.md）
- 调用：`/html-plan add send later to the composer`。
- 「review comprehensive specifications in approximately one minute」。
- 三层：Title（Why）→ Level 1（mockup / 状态机）→ Level 2（调用栈 / schema / 代码片段）→ Level 3（代码位置）。
- 「Closed, the tree is the summary. Open it one level at a time.」每个决定带编号，按钮「3 to answer」跳到没答的。可以选选项、改 schema、给任何一句加评论，然后提交。
- 需要 Node.js 把页面打成一个自包含的 HTML。
