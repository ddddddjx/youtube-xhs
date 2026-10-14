# 素材

## 素材 1：Anthropic 内部文档《Concise Research Roadmap》
- 作者：Jared Kaplan（Anthropic 联合创始人）
- 日期：Last Updated July 2021（评论时间戳 7/16/2021）
- 来源：法庭披露文件，页脚「Highly Confidential – Attorneys' Eyes Only」，Bates 编号 ANT_BARTZ_000436689–694（Bartz v. Anthropic 版权诉讼）。公开镜像 https://i.smitop.com/concise-research-roadmap.pdf
- 6 页：3 页正文 + 3 页评论汇总，24 条评论，评论人 Dario Amodei、Jared Kaplan、Christopher Olah、Ben Mann、Sam McCandlish、Amanda Askell、Tom Brown、Nelson Elhage、Andy Jones、Thomas Henighan、Catherine Olsson

### 正文要点（原文为英文，这里是逐段整理）
**Long Term Goal**：顶层目标是 safe, beneficial AGI。作为 proof of concept，做一个能和用户对话、创建 / 编辑 / 解释软件的通用 AI 助手。最有野心的版本能回答一般问题、写函数、找 bug、设计 API、讨论风格和最佳实践，「显示出一个软件工程师同事的全部能力」。「我们不指望马上做到，但这是我们努力的方向。」
「我们目前认为这需要：带长期记忆的大型生成模型，用 RL（自动奖励 + 人类反馈）微调。」

**Scaling**：训练巨型模型的系统，高 GPU 利用率、灵活 API、为 RL 高效采样；非专家也能设超参；安全态势（尤其是模型权重）；为 TPU、Trainium 等硬件去风险、准备算力交易。

**Interpretability**：围绕 neurons、attention heads、circuits 定位；探索算术、多角色对话、代码等具体能力背后的机制。

**Pretraining and Data**：预训练最好的语言 + 代码模型；建最好的数据集，含自然语言、代码、diffs、PRs、debugging、代码评估；用 Diffs、PRs、Wikidiffs、Metadata 微调，「把人的意图和模型行为连起来」。研究：训练任意大模型（1T 及以上）所需的 ML 进展；超长上下文（或等效的记忆 / 经验机制）；数据质量（过滤、迁移、微调、多样性）。

**Human Feedback and Alignment**：用人类反馈训练模型 generally helpful，提供帮助、响应反馈、提问澄清；找出对齐失败案例，按难易分类；Scaling Laws for Alignment：奖励模型的对齐和鲁棒性（on-policy 数据和静态数据集如 stack exchange、GAN-discriminator 训练）；人类反馈数据怎么用最好、要多少资源。其他：GAN/discriminator 训练和 test-time compute 的 scaling laws；人和模型判断的对应、模型「自评」能力、偏见公平。

**RL for Tool Use**：探索大模型用工具、了解 / 生成环境和目标数据的能力，以此推进通往 AGI 的路径；在 search、printf debugging 等任务上看到清晰的生命迹象，评估工具使用和 RL 能否化解当前大模型的局限；找出比监督学习更好的 compute scaling 的训练技术。

**Societal Impact**：新的评估方法（经济影响、偏见、生成偏好）；帮第三方（学界、政府、其他公司）评估 AI 系统；扩大能评估和实验模型的第三方范围。

### 评论里值得用的（2021-07-16，同一天下午 5:28 到 5:40）
- Dario Amodei（数据来源）：stackoverflow, issues, comments, etc
- Christopher Olah：I'd be super excited to connect some of these to interpretability.
- Ben Mann（超长上下文的等效机制）：like "sleeping", eg periodic batched backprop
- Sam McCandlish：big question for me: how to deploy non-sandboxed tools safely?
- Dario Amodei：Specifically, tools that execute code at deployment time!
- Amanda Askell：I'm a bit nervous if we end up doing alignment research on natural language and capabilities research on code. It feels like there should be a pretty tight connection between the two at all times... That could have knock-on effects like alignment becoming an island because we don't integrate it early on.
- Amanda Askell：A possible principle: "by default, capabilities and alignment research should be in proportion across domains unless we can give a good argument for why they should come apart".
- Tom Brown：Repository browsing seems like a simple and valuable tool for us to start with also
- Nelson Elhage：Strong +1. I feel like if I could add one capability to Copilot, "go look up my project's type definitions" would be a strong candidate.
- Ben Mann：especially for a repo you've never seen before and don't have loaded into your IDE (eg matplotlib)
- Dario Amodei：Yep. Basically the code editor. I will also make a plug for the natural language editor -- I know we are more focused on code, but i think there's interesting safety work and interesting applications with the style of editing that is done in google docs too.
- Andy Jones：I think there's a bit of a tension here between 'build the best coprogrammer', for which repo search is 100% the best place to start, and 'convincingly demo tool use', for which printf + editor usage are >>>> repo search.
- Dario Amodei：I think the plan is prioritize the latter in the short run and the former in the long run.
- Andy Jones：'encourage everyone else to do ethical ML research, by leading by example'... 'building the city on the hill for ML research'.
- Dario Amodei：This is a top-level goal in the company vision doc that I'm almost done writing, which can be thought of as one level above the research roadmap.

## 素材 2：推文（引出这份文档的）
- 作者：Yuwei Niu @purshow04（北大硕士，前字节 Seed）
- 时间：2026-10-14 06:51 GMT；88 赞 / 28 收藏 / 6850 浏览
- 链接：https://x.com/purshow04/status/2110262181132681357
- 正文要点：五年前 Anthropic 就对接下来五年的核心方向形成了清晰判断。震撼三点：RL for Tool Use、1T+ 参数、超长上下文。还讨论了 Coding Agent 作为 Proto-AGI 原型、Diffs/PRs 数据、Alignment Scaling、可解释性、test-time compute（「WTF??」）。「真正令人震撼的不是他们预见了某项具体技术，而是在 2021 年就已经对未来五年的核心研究问题形成了如此系统且前瞻性的认识。虽然很不甘心承认，，，但真的该 A/成功啊。。。」
