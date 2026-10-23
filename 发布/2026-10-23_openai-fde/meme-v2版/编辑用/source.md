# 素材：OpenAI《What FDE means at OpenAI》

- 链接：https://openai.com/index/forward-deployed-engineering-means/
- 作者：Colin Jarvis，OpenAI Head of Forward Deployed Engineering
- 日期：2026-10-22
- 云端拿不到原文：openai.com、cdn.openai.com、r.jina.ai、archive 都被代理拦（CONNECT 403），WebFetch 对 fourweekmba / getperspective / eng-leadership 也 DNS 失败。下面的内容来自 WebSearch 的页面摘录（带原文引语的以引号标出），二手报道只用来对数。**发布前请用户在 Mac 上打开原文核一遍引语和数字，并截一张文章头部（标题 + 作者）或 Colin Jarvis 的照片给首页。**

## 原文里能确认的内容（WebSearch 摘录自 openai.com 页面）

1. 起因："I founded the team in early 2025 to close what we call 'the deployment gap'" —— 部署鸿沟：模型看起来能做的事，和人在工作里能放心依赖的事，中间的距离。
2. 诊断："Model capabilities have moved faster than the systems and processes needed to put them to use. Sometimes the missing piece is a product. Sometimes a model performs well on a benchmark but cannot do the job with real-life variables and constraints."
3. 团队的定位："If we make ourselves obsolete every couple of months, our FDE team is doing its job." 做法是把一个没人解决过的难题做成 zero-to-one 的方案，再随着技术进步做成可复用的包。
4. 公共框架：把各个用例搬到一个以 Codex 为核心的公共 harness 上，每个项目大约 90% 的定制代码被拆掉；一位 FDE 把自己的应用围绕这个 harness 重建。
5. 关键数字："In one August 2026 example, the initial deployment took two months. Extending the solution to a second team took one day."
6. Tax AI："During its pilot, Tax AI processed 7,000 tax returns and increased throughput by about 50%." 文章把它当 FDE 和研究团队一起做的例子。
7. 研究团队的角色（摘录措辞，待核）：FDE 和客户一起搭平台、定义模型要做什么，Research 在连续几个模型快照里补能力缺口，关键评测从约 60% 升到 80%、再到 90% 以上，历时六个月。
8. 有一节标题叫 "Close the intelligence gaps as they appear"：有时候模型本身还做不了这件事（正文摘录被截断）。

## 旁证（不是这篇文章，稿里不混进去）

- OpenAI 另一篇《Building self-improving tax agents with Codex》：Tax AI 是 OpenAI 和 Thrive Holdings 的工程师用约六个月做的，给 Crete 旗下 30 多家会计师事务所用；OpenAI 2025-12 入股 Thrive Holdings。稿里只用「Thrive 旗下三十多家会计师事务所」「做了半年」这两个事实，标为旁证。
- Jarvis 在 HumanX 的访谈（The Next Web 等）：约 80% 的企业问题出在部署；Codex 之后每个项目的定制工作从约 90% 降到 50%；一家半导体公司的夜间任务排错系统。**这些是访谈，不是这篇文章，稿里不用。**
- FourWeekMBA 三篇评论（10-22）：把两个月到一天算成 60 倍，是评论者自己的算术，不用。
