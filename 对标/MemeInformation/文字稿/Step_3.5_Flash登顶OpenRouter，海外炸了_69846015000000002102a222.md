# Step_3.5_Flash登顶OpenRouter，海外炸了

- **笔记 ID**：69846015000000002102a222
- **原文链接**：https://www.xiaohongshu.com/explore/69846015000000002102a222
- **图片数量**：12 张
- **提取方式**：RapidOCR 本地离线识别（平均置信度 0.858）
- **正文字数**：约 2773 字

---

## 正文

26-2-516:36发布于广东

最近看到一个挺有意思的事

阶跃星辰的Step3.5Flash发布才两天，就直接冲上了 OpenRouter的Trending榜单第一

这个榜单跟那些学术测试不太一样，它统计的是全球开发者真金白银的API调用量

说白了，开发者用钱投票，选出来的都是真正好用的模型

但在海外社区，有人开始质疑了@'.,HLE,ARCAGl

Toobad @,

@'我知道这可能是一个很棒的模型，我只是希望他们不要那么刻意地选择基准测试。比如，MMLU、HLE、ARCAGI这些测试结果在哪里？

太糟糕了@Huggingface他们关闭了排行榜，之后也没有其他人站出来

GitHub和X平台上陆续有人发现，阶跃星辰这次发布Step3.5Flash的时候，把几个通用知识类的基准测试成绩全藏起来了

MMLU、GPQA、HLE这些行业标配的测试，在Step2阶段还公开着，到了Step3.5Flash就集体消失

有个叫的用户直接发推说：只展示模型擅长的领域，把基础知识问答能力藏起来，这是选择性披露

GitHub上也有人质疑：Agent相关的评分看起来很可靠，但标准知识基准测试完全没看到，很难判断这到底是能力问题还是营销策略

QuixiAl这个用户也在X平台上说，感觉StepFun在玩文字游戏，只展示自己想让人看到的数据

一时间，外网讨论炸开了锅

这时候，阶跃星辰的技术人员Charles在GitHub上回应了

他说得很直接：阶跃星辰确实非常重视模型的参数化知识，在预训练阶段用了Muon优化器，在知识类数据上投入了大量精力

Step3.5Flash的32k基座模型在SimpleQA上拿到了30多分，这个成绩能媲美那些万亿参数规模的模型

并且，Step3.5Flash最终版在知识增强型推理基准上表现很强：MMLU-Pro拿了84.4分，HLE拿了23.1分（且未使用并行思考），这些成绩会在即将发布的技术报告里公开

那为什么公开榜单上不展示这些通用知识类的测试成绩？

Charles给了一个很有意思的解释：优秀Agent基座

模型的定义正在发生变化

对于知识密集型任务，在推理阶段直接用搜素工具或者RAG，可以更灵活、更低成本地注入实时知识

这比把所有知识都塞进模型参数里要高效得多，所以阶跃星辰的公开评估更侧重那些能反映真实世界Agent工作流的任务

这个逻辑其实挺清晰

传统思路是把模型训练得什么都懂，遇到问题直接从参数里调取知识

但这条路有个硬伤，为了保持知识的覆盖面和新鲜度，需要不断进行昂贵的持续预训练

并且，参数化知识越强，推理轨迹往往越长越复杂，成本也越高

Agent工作流的思路更像换了一套玩法：模型不需要什么都懂，它更重要的是知道什么时候该调用什么工具

遇到知识密集型问题，直接去搜索素或检索，拿到最新、最准确的信息，然后基于这些信息继续推理

这样更灵活，成本更低，也更能保证信息时效性

Charles还特别强调：参数化知识和基于工具的检索是互补关系

更强的参数化知识可以减少搜索和工具调用的轮数，节省上下文和交互开销

但在当前技术条件下，训练成本、延迟和工具成本之间怎么找到最优平衡，仍然缺乏公平的评估方式说到这里，我突然想明白一件事

阶跃星辰隐藏通用知识类基准测试成绩，本质上是在向市场传递一个信号：他们认为，传统的大模型评估体系已经跟不上Agent时代的需求了

过去大家评价一个模型好不好，主要看它在MMLU、GPQA这些知识问答类测试上的表现，默认逻辑是记住的知识越多越好、回答越准越好

但在Agent工作流场景下，这套评估体系开始失效

因为Agent的核心能力是调度工具、执行任务、处理复杂的多步推理：要快，要稳，要会在长链条任务里做正确决策

至于具体知识储备，很多时候可以通过外部工具补齐

从这个角度看，阶跃Step3.5Flash的产品定位就很清晰了

它采用稀疏MoE架构，每个token只激活约110亿个参数，总计1960亿参数

通过MTP-3技术，模型一次预测多个token，推理效率直接翻倍

在单请求代码类任务上，最高推理速度能达到每秒350个token

这个速度意味着什么？

意味着在多步推理场景下，模型能做到低延迟响应

Agent需要频繁调用工具、处理中间结果、做出下一步决策，如果模型推理速度慢，整个工作流就会卡顿

而阶跃Step3.5Flash的高速推理能力，恰好踩中了这个痛点

OpenRouter的Trending榜单也能说明一些问题

它统计的是开发者的实际调用量

开发者用API是要花钱的，他们不会因为某个模型在某项测试上拿了高分就去用它，更多时候只会选在真实工作流里更顺手、更划算的模型

阶跃Step3.5Flash发布两天就登顶，至少说明它在实战场景下具备相当强的可用性

当然，阶跃星辰这次的做法确实有争议

隐藏通用知识类基准测试成绩，客观上会让一部分人产生怀疑

尤其是那些习惯传统评估体系的开发者，会下意识觉得：一个连MMLU都不敢公布成绩的模型，能有多强？

但如果我们跳出这个思维定式，也能看到另一种可能：阶跃星辰可能是在用更强势的方式，逼大家重新思考什么才是好的Agent基座模型

不再只看它记住了多少知识，而是看它在真实工作流里能不能高效完成任务

不再只町某个单项分数，而是看它在复杂、长链条任务里能不能保持稳定

在这个方向上，行业里投入巨大的团队也还在不断试错，阶跃星辰已经拿出了阶段性成果

Charles说，技术报告会提供基座模型和后训练模型的更清晰结果

等报告出来，很多质疑自然会变少

但更重要的是，这次事件把一个问题摆到了台面上：在Agent时代，我们到底需要什么样的大模型?

是需要一个什么都懂、但推理速度慢、成本高的全能型选手？

还是需要一个推理速度快、擅长调度工具、在实战场景下更好用的专业型选手？

阶跃Step3.5Flash用登顶榜单的事实，给出了自己的答案

而那些仍然纠结于传统基准测试成绩的人，可能也该想想更本质的问题：当规则正在改变的时候，继续用旧的标准去衡量新的事物，到底还有没有意义？

?①

12.5B tokens3..5 Flash (free)(free).7M tok80s15.38(.1 Terminus (.(free)...658 tokongB.

..

### 1.%(.(thinking)2010

### #5Oopen

''..5.version,,.,where.,when.,'. Looking.,', C-Eval, orCMMLu. The', but',·.'

., but it'.MMLU-Pro.',,'

Follow

,@stepfun.comEngineer@Stepfun

)

use.,. In fact, Step3.+, which (()

report

. That'''..and tool.call rounds,,(

.,. Stay tuned!

---

## 逐图原文（按图片顺序，便于核对）

**图 1**

Memelnformation
26-2-516:36
发布于广东
最近看到一个挺有意思的事。
阶跃星辰的Step3.5Flash发布才两天，就直接冲
上了 OpenRouter的Trending榜单第一
这个榜单跟那些学术测试不太一样，它统计的是全
球开发者真金白银的API调用量。
说白了，开发者用钱投票，选出来的都是真正好用
的模型。
但在海外社区，有人开始质疑了。
EricHartford@QuixiAI19h
Iknow it's probablyagreat model ljust wish theydidnt cherrypick their
benchmarkssomuch.LikewhereisMMLU,HLE,ARCAGl.
Toobad @Huggingface shut down their leaderboard,andnobody else has
steppedup,
We also learned from @AlatMeta thatwe can't justtakethemodel
publishers word forit.
我知道这可能是一个很棒的模型，我只是希望他们不要那么刻意地选择基准测
试。比如，MMLU、HLE、ARCAGI这些测试结果在哪里？
太糟糕了
@Huggingface他们关闭了排行榜，之后也没有其他人站出来。

**图 2**

Memelnformation
GitHub和X平台上陆续有人发现，阶跃星辰这次发
布Step3.5Flash的时候，把几个通用知识类的基
准测试成绩全藏起来了。
MMLU、GPQA、HLE这些行业标配的测试，在
Step2阶段还公开着，到了Step3.5Flash就集体
消失。
有个叫EricHartford的用户直接发推说：只展示模
型擅长的领域，把基础知识问答能力藏起来，这是
选择性披露。
GitHub上也有人质疑：Agent相关的评分看起来很
可靠，但标准知识基准测试完全没看到，很难判断
这到底是能力问题还是营销策略。
QuixiAl这个用户也在X平台上说，感觉StepFun
在玩文字游戏，只展示自己想让人看到的数据
一时间，外网讨论炸开了锅。

**图 3**

Memelnformation
这时候，阶跃星辰的技术人员Charles在GitHub上
回应了。
他说得很直接：阶跃星辰确实非常重视模型的参数
化知识，在预训练阶段用了Muon优化器，在知识
类数据上投入了大量精力。
Step3.5Flash的32k基座模型在SimpleQA上拿
到了30多分，这个成绩能媲美那些万亿参数规模的
模型。
并且，Step3.5Flash最终版在知识增强型推理基准
上表现很强：MMLU-Pro拿了84.4分，HLE拿了
23.1分（且未使用并行思考），这些成绩会在即将发
布的技术报告里公开
那为什么公开榜单上不展示这些通用知识类的测试
成绩？
Charles给了一个很有意思的解释：优秀Agent基座

**图 4**

Memelnformation
模型的定义正在发生变化。
对于知识密集型任务，在推理阶段直接用搜素工具
或者RAG，可以更灵活、更低成本地注入实时知
识。
这比把所有知识都塞进模型参数里要高效得多，所
以阶跃星辰的公开评估更侧重那些能反映真实世界
Agent工作流的任务。
这个逻辑其实挺清晰
传统思路是把模型训练得什么都懂，遇到问题直接
从参数里调取知识
但这条路有个硬伤，为了保持知识的覆盖面和新鲜
度，需要不断进行昂贵的持续预训练。
并且，参数化知识越强，推理轨迹往往越长越复
杂，成本也越高。

**图 5**

Memelnformation
Agent工作流的思路更像换了一套玩法：模型不需要
什么都懂，它更重要的是知道什么时候该调用什么
工具。
遇到知识密集型问题，直接去搜索素或检索，拿到最
新、最准确的信息，然后基于这些信息继续推理
这样更灵活，成本更低，也更能保证信息时效性。
Charles还特别强调：参数化知识和基于工具的检索
是互补关系。
更强的参数化知识可以减少搜索和工具调用的轮
数，节省上下文和交互开销。
但在当前技术条件下，训练成本、延迟和工具成本
之间怎么找到最优平衡，仍然缺乏公平的评估方
式。
说到这里，我突然想明白一件事。

**图 6**

Memelnformation
阶跃星辰隐藏通用知识类基准测试成绩，本质上是
在向市场传递一个信号：他们认为，传统的大模型
评估体系已经跟不上Agent时代的需求了。
过去大家评价一个模型好不好，主要看它在
MMLU、GPQA这些知识问答类测试上的表现，默认
逻辑是记住的知识越多越好、回答越准越好。
但在Agent工作流场景下，这套评估体系开始失
效。
因为Agent的核心能力是调度工具、执行任务、处
理复杂的多步推理：要快，要稳，要会在长链条任
务里做正确决策
至于具体知识储备，很多时候可以通过外部工具补
齐。
从这个角度看，阶跃Step3.5Flash的产品定位就
很清晰了。

**图 7**

Memelnformation
它采用稀疏MoE架构，每个token只激活约110亿
个参数，总计1960亿参数。
通过MTP-3技术，模型一次预测多个token，推理
效率直接翻倍
在单请求代码类任务上，最高推理速度能达到每秒
350个token。
这个速度意味着什么？
意味着在多步推理场景下，模型能做到低延迟响
应。
Agent需要频繁调用工具、处理中间结果、做出下一
步决策，如果模型推理速度慢，整个工作流就会卡
顿。
而阶跃Step3.5Flash的高速推理能力，恰好踩中
了这个痛点。

**图 8**

Memelnformation
OpenRouter的Trending榜单也能说明一些问题，
它统计的是开发者的实际调用量。
开发者用API是要花钱的，他们不会因为某个模型
在某项测试上拿了高分就去用它，更多时候只会选
在真实工作流里更顺手、更划算的模型
阶跃Step3.5Flash发布两天就登顶，至少说明它在
实战场景下具备相当强的可用性。
当然，阶跃星辰这次的做法确实有争议。
隐藏通用知识类基准测试成绩，客观上会让一部分
人产生怀疑。
尤其是那些习惯传统评估体系的开发者，会下意识
觉得：一个连MMLU都不敢公布成绩的模型，能有
多强？

**图 9**

Memelnformation
但如果我们跳出这个思维定式，也能看到另一种可
能：阶跃星辰可能是在用更强势的方式，逼大家重
新思考什么才是好的Agent基座模型
不再只看它记住了多少知识，而是看它在真实工作
流里能不能高效完成任务。
不再只町某个单项分数，而是看它在复杂、长链条
任务里能不能保持稳定。
在这个方向上，行业里投入巨大的团队也还在不断
试错，阶跃星辰已经拿出了阶段性成果。
Charles说，技术报告会提供基座模型和后训练模型
的更清晰结果。
等报告出来，很多质疑自然会变少。
但更重要的是，这次事件把一个问题摆到了台面
上：在Agent时代，我们到底需要什么样的大模
型?

**图 10**

Memelnformation
是需要一个什么都懂、但推理速度慢、成本高的全
能型选手？
还是需要一个推理速度快、擅长调度工具、在实战
场景下更好用的专业型选手？
阶跃Step3.5Flash用登顶OpenRouterTrending
榜单的事实，给出了自己的答案。
而那些仍然纠结于传统基准测试成绩的人，可能也
该想想更本质的问题：当规则正在改变的时候，继
续用旧的标准去衡量新的事物，到底还有没有意义？

**图 11**

? LtM Leaderboard
Cotyipsre Thie most populst innetets on OpenRouter ①
12.5B tokens
3.21n takens
Step 3.5 Flash (free)
Solar Pro 3 (free)
1.
11
by ypeam
13.7M tok80s
15.38(okans
Riverflow V2 Pro
DeepSeek V3.1 Terminus (..
12.
1758 takens
16.1n tokens
Mistral Large 32512
Trinity Large Preview (free)
3.
13.
by mi tredal
355151
ty a al
1498 tokans
381M tokens
GPT-5Nano
GPTAudio Mini
14.
Iy 30enat
8.76M takens
46aB tokens
KimiK2.5
GPTAudio
5.
15.
ty muws hatni
5.658 tokong
B.01B tokans
LFM2-8B-A1B
Qwen3Next80BA3BThin...
6.
16.
178Mtokens
103Mtokens
bge-base-en-v1.5
all-mpnet-base-v2
17
2151
by Se noe tmafong
by be
5.230toxans
635B idkans
Qwen3CoderPlus
Qwen3Coder480BA35B...
8.
18.
1.628 tokens
609Mtokans
MiniMax M2-her
Trinity Mini
19
9.
224%
by mhnime
145M (oxeng
513M toxeng
Olmo3.132BInstruct
Qwen Plus0728 (thinking)
20.
10.

**图 12**

Onthemodelevaluationbenchmarks#5
Oopen
Simuoss ppened yesterday
I've been following StepFun's models for qulte a whlle. After trying the newly released 3.5.version, the improvement is very
noticeable,especially on several internal Agent worktlow evaluation-sets.1had built earlier,where.it achleved very high scores.
However,when.it comes to pure knowledge-based QA, the model doesn't feel particularly outstanding. Looking.at the public
leaderboards, Ialso noticed that if hasn't been evaluated on standard knowledge benchmarks such as LiveBench, C-Eval, or
CMMLu. The'se were stil Included during the Step2 stage, but'starting from Step3 they seem to have been dropped, wlthi more
focus instead placed on·Agent-oriented and mathematical. reasoning benchmarks.
I'm curious about the rationale:behind this shift.
Galn007 yesterday -edited by Galn007
Edits:
Agreed. The Agent-specific scores look sofid, but it's:a bit odd to see a total blackout on standard knowledge benchmarks like
GPQA or.MMLU-Pro. Even if they're Jeaning into the Agentic niche, we: stl need to know the baseline reasoning floor, Hard to
tell it it's Just being selectively marketed.
Follow
days or three with full benchmark details and aeeper insights, Stay tunedi
joketzz0926charlesge@stepfun.com
Engineer@Stepfun
jokerzz0926aaminutes-ag)
use.the Muon optimizer and put a lot of eftort into knowledge-focused data, for wide coverage of iong-tall tacts. In fact, Step.
3.5 Fiash 32k base model scores 30+ on SimpleQA, which (s comparable to much larger models (lke tillionparameter ones
such as K2).
report.
date knowiedge. That's why our public evaluation focus more on tasks that'better reflect real-worlid agent workflows.
There's also a fealtrade-off:stronger parametric knowledge.canreduce the number:of search.and tool.call rounds, 5aving
context and interaction overhead, butit typically requlres more expensive continual pretraining (to manage forgetting and
We see parametric knowledge and tool-based retrieval as compiementary. In the tech report, we willprovide clearer results of
base and post-trained models. Stay tuned!
