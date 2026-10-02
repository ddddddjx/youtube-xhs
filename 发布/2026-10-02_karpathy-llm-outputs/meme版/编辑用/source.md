# Andrej Karpathy · 2026-10-02

来源：https://x.com/karpathy/status/2105819303471976479
作者：Andrej Karpathy (@karpathy)
发布时间：2026-10-02 00:37 UTC（北京/香港时间 08:37）
抓取时互动：点赞 11,636 · 转发 1,146 · 引用 232 · 回复 412 · 收藏 13,256 · 浏览 489,849

配图：`01_ASD-STE100_overview.png`（原图 3200×1600，ASD-STE100 规范总览）

---

## 原文

We'll be spending a lot more time trying to understand the outputs of language models. A few thoughts, tips & tricks:

Writing. Something I've had success with: Ask your LLM to explain something in ASD-STE100, it's a controlled language specification originally developed for aerospace maintenance documentation. LLMs well-versed in this language and it comes with heavy constraints on clean writing style that I often find a lot more readable. Sometimes I've tried to soften it a bit e.g. ask for "80% of the way to ASD-STE100" because the spec is quite stringent. But even better:

Diagrams / images. Instead of writing, ask your LLM to create a diagram. These can be a lot easier to process, parse, and understand. But even better:

Web pages. Ask for output "in HTML" to get a beautiful, interactive webpage. LLMs are getting really good at frontend and can create beautiful experiences, animations, etc. But even better:

Explainer videos. The output format I am most bullish on is fully custom / bespoke explainer videos generated on any arbitrary topic. Experiment with things like "Create a 3b1b style video explainer on X. Use my ElevenLabs API key for audio narration". (you'd need an API key for the latter or you can ask your LLM to find you decent free alternatives that use your local compute). This is actually starting to work!

In summary:
- As LLMs get better, they will do more and more of the legwork autonomously, and a lot more of our work will rise up the abstractions into oversight and understanding.
- Luckily, LLMs can help here too because as intelligence and code are increasingly abundant, you can ask for large, custom, discardable software artifacts (e.g. web apps, video explainers) that would have never made sense to create before. Push the boundaries here and you'll be surprised.

---

## 中文对照

我们会花越来越多的时间，去理解语言模型的输出。几点想法和技巧：

写作。我用过、有效的一种做法：让 LLM 用 ASD-STE100 来解释一件事。这是一套受控语言规范，最初是为航空航天维修文档开发的。模型对这套语言很熟，而且它本身对文风有很强约束，我经常觉得读起来更清楚。有时我会把它稍微放软一点，比如要求「做到 ASD-STE100 的 80%」，因为这套规范本身相当严。但还有更好的：

图 / 示意图。别只写文字，让 LLM 画一张图。图往往更容易处理、拆解和理解。但还有更好的：

网页。让它「用 HTML 输出」，得到一个好看、可交互的网页。模型的前端能力已经很强，能做出漂亮的体验和动画。但还有更好的：

讲解视频。我最看好的输出形式，是针对任意主题、完全定制的讲解视频。可以试这样的提示：「给 X 做一条 3b1b 风格的讲解视频。用我的 ElevenLabs API key 做旁白。」（后半段需要 API key，也可以让模型找用你本地算力的免费替代方案。）这已经开始能跑通了。

总结：
- 模型越强，它们会越来越多地自己把杂活做完，我们的工作会上移到监督和理解这一层。
- 好在模型也能帮这一层：智力和代码越来越充裕之后，你可以要那些以前根本不值得做的、一次性的大型软件产物（网页应用、讲解视频）。把边界往外推，结果会让你吃惊。

---

## 配图内容（按面板）

图标题：Simplified Technical English: overview。规范编号 ASD-STE100，所有者 ASD，来源 asd-ste100.org，第 1 页。

A. Document structure
- ASD-STE100 / Simplified Technical English
- Part 1: Writing rules — Section 1 Words, 2 Noun clusters, 3 Verbs, 4 Sentences, 5 Procedures, 6 Descriptive writing, 7 Safety instructions, 8 Punctuation and word counts, 9 Writing practices
- Part 2: Dictionary — Approved words, Unapproved words, Technical names, Technical verbs；约 900 个批准词，一词一义、一词一类

B. Anatomy of STE sentences（改写示例）
- 原文（不是 STE）：It is imperative that the operator ensures the hydraulic reservoir is replenished prior to commencing operation.
- 1 Procedural sentence：Make sure that the hydraulic reservoir is full before you start the operation.（13 words, limit 20）
- 2 Safety instruction：WARNING: Do not touch the brake unit until it is cool. Hot parts can cause injury.
- 3 Descriptive sentence：The pump supplies fuel to the engine when the switch is on.（12 words, limit 25）

C. Verb forms（Section 3）
- 批准：Command (imperative), Simple present, Simple past, Simple future, Infinitive, Past participle (as adjective)
- 不批准：Progressive (-ing), Perfect, Passive in procedures（仅在必要时可用被动）

D. Dictionary entries（Part 2）
- 批准：CLOSE (v) 合在一起、止流；TEST (v) 看它是否正确工作
- 不批准并给出替代：close→NEAR, commence→START, ensure→MAKE SURE, prior to→BEFORE, replenish→FILL, utilize→USE, approximately→ABOUT, in order to→TO

E. Writing rule limits
- Procedural sentence 最多 20 词
- Descriptive sentence 最多 25 词
- Descriptive paragraph 最多 6 句
- Noun cluster 最多 3 词
- 每句一条指令（同时动作除外，最多 1）
- 原则：同一事物用同一个词；不漏词尾 -s / -ed；用主动；复杂文本用竖向列表；一段一个主题

F. History
- 1979 AECMA 开始做航空受控英语
- 1986 第一版 AECMA Simplified English Guide
- 2005 AECMA 并入 ASD 后改为 ASD-STE100
- Now 免费下载，由 ASD-STE100 修订
