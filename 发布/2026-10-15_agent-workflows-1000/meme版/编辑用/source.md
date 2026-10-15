# 素材：Claude Managed Agents dynamic workflows（beta）

来源：Anthropic，Claude Platform 文档。2026-10-15 抓取。
- Release notes：https://platform.claude.com/docs/en/release-notes/overview （October 9, 2026 条目）
- Workflow runs：https://platform.claude.com/docs/en/managed-agents/workflow-runs （Cost and budgets、Limits 两节）
截图：编辑用/rn_oct9_box.png、limits_box.png（2026-10-15 用 Chromium 截）

## 原文摘录

October 9, 2026：You can now let a Claude Managed Agents agent use dynamic workflows, in beta with the managed-agents-2026-04-01 beta header. For work with many pieces, such as reviewing hundreds of documents, the agent can write a workflow. A workflow is a program that runs many agents in phases and combines their results. The server runs it in the background as a workflow run.

Workflow runs：The agent that the session runs writes each workflow for the work that you describe. A workflow is a program: it runs other agents, collects what each one returns, and combines the results. That way, the agent can take on a task that is too large for one conversation, such as a review of hundreds of documents. During a run, the agent can keep working or end its turn, and it can check on the run.

Cost and budgets：A run's model requests count toward the session's budget. A run has no price of its own. The tokens its agents use are billed like the session's other tokens, at each model's rates. … At the budget: Every open run pauses …

Limits：
- Threads working at once in one run：64
- Agents a workflow starts over the run's whole life：1,000（超了以 thread_limit_error 结束）
- Run lifetime：24 hours by default, or the lifetime the agent sets
- Runs open at once in a session：10 by default

## 同月别家（二手汇总，正文只点名不给细节）
- Codex CLI 0.162.0：managed Git worktree、pinned tasks（Releasebot 汇总 https://releasebot.io/updates/openai/codex）
- GitHub Copilot CLI：computer use 公开预览（https://tech-insider.org/github-copilot-cli-computer-use-preview-2026/）

## 用到的经历（账号/经历库.md）
#2 第一次配 agent team；#9 十几个定时任务、上月底企业版 Codex token 用完、sites 组装混乱；#13 Claude 当架构师拆计划 / Codex 写代码 / Grok 搜英文圈
