# 6 个月成为 AI Engineer：原文打包 + 信源核对 + 作者背景

打包日期：2026-10-04
请求来源：https://x.com/deronin_/status/2033587293064204349

---

## 0. 先看结论

这不是论文，也不是公司官方课程。它是 X 长文，作者 Ronin（@DeRonin_）2026-03-16 发布，自称与 @andy_ai0 合写，耗时 40+ 小时，正文号称 1 万词以上。

能核对上的部分：

- 主帖和 X Article 都存在，合写人 Andy 当天发帖承认一起写了这篇。
- 三天前作者发过一版短大纲（2026-03-13），六个月结构与长文一致。
- 五天后作者又发了配套练习帖（2026-03-21）。
- 资源大部分指向官方文档：Anthropic、OpenAI、FastAPI、CS50P、LlamaIndex、LangGraph、OWASP。这些链接本身是真的。
- 2026-03-17，note.com 用户 isisi 发了日文译本，并署名原作者 Ronin / andy_ai0。

核对不上、需要打折看的部分：

- 「CEO of Arcane」「天使投资人」「$40k / $78k MRR」「单月净入 $70k」都是本人在 X 上的自述，没有公司注册、财报或第三方报道能对上。
- 公开能查到的 YC Arcane AI（W24，Rohan Mehta / Lucas Switzer，纽约，已收购）和这个账号对不上，不要当成同一家公司。
- 长文在 X 抓取时从 Month 4 后段被截断。Month 5–6 的资源清单用作者自己的大纲帖 + isisi 译本交叉补齐，已在正文里标出。
- 原文有一处链接错误：Month 1 的 freeCodeCamp「19 小时 API 课」和「终端命令课」指向了同一个 YouTube 视频 `ZtqBQ68cfJc`。

阅读建议：把这篇当「带链接的学习目录」用，不要把作者履历当成招聘背书。

---

## 1. 作品元数据

| 项 | 内容 |
| --- | --- |
| 平台 | X Article |
| 展示帖 | https://x.com/DeRonin_/status/2033587293064204349 |
| Article ID | 2033454728298770432 |
| Article 链接 | https://x.com/i/article/2033454728298770432 |
| 发布时间 | 2026-03-16 16:52:47 UTC |
| 作者 | Ronin，@DeRonin_ |
| 合写 | Andy，@andy_ai0（双方帖子互相承认） |
| 抓取时互动 | 7,911 赞 / 1,230 转帖 / 215 引用 / 222 回复 / 26,621 收藏 / 约 416 万浏览 |
| 语言 | 英文长文（平台语言标记为 zxx，即 Article） |
| 外部正式出版 | 无。没有作者博客、GitHub 仓库或课程平台原文 |

相关帖，按时间：

1. 短大纲，2026-03-13：https://x.com/DeRonin_/status/2032392546454794289
2. 长文，2026-03-16：https://x.com/DeRonin_/status/2033587293064204349
3. Andy 转发承认合写，2026-03-16：https://x.com/andy_ai0/status/2033588631810572711
4. 配套练习，2026-03-21：https://x.com/DeRonin_/status/2035374232893354262
5. 日文译本，2026-03-17：https://note.com/isisi/n/nf83aa539cc2b
6. 作者 2026-10-02 又发了一版压缩路线：https://x.com/DeRonin_/status/2106073036231204984

---

## 2. 作者背景（公开信息，和自述分开）

### 2.1 能从平台资料直接看到的

Ronin，@DeRonin_

- 用户 ID：1414948050817196037
- 注册：2021-07-13
- 注册地标记：UA（乌克兰）
- 简介（本人填写）：20 / CEO of Arcane / Angel Investor / engineering virality for AI companies
- 外链：https://www.youtube.com/@deronin_23
- 粉丝：约 11.9 万（2026-10 抓取）
- 认证：X Premium / Blue
- 早期内容是加密货币增长、空投、交易所上币线程；2025 年后转到个人品牌、增长和 AI；2026 年大量发 AI 工程师路线、agent、机器人入门

他在 2025-04-19 的帖子里自述：普通乌克兰家庭出身，一年半把账号从 5k 做到 77k，Telegram 社区约 1.4 万，一年写了 2,144 条推文、315 条线程。帖子：https://x.com/DeRonin_/status/1913549738953081033

2025-06-30 的年度回顾帖继续自述：粉丝从 4 万到 8 万、做过 agency、搬过国、参加过会议。帖子：https://x.com/DeRonin_/status/1939740719339442197

### 2.2 自述，未独立核实

- CEO of Arcane。没有查到与该 X 账号绑定的公司注册、官网或融资记录。
- Y Combinator 名录里的 Arcane AI 是另一家：2023 年创立，W24，纽约，创始人 Rohan Mehta（后入职 OpenAI）和 Lucas Switzer，状态为已收购。https://www.ycombinator.com/companies/arcane 与 @DeRonin_ 无公开关联。
- 2026-07-13 帖称一人 agency、零员工、$40k MRR。https://x.com/DeRonin_/status/2076601521169387563
- 2026-09 帖把同一叙事改成 $78k MRR、9 个客户、月 token 成本约 $1,400。https://x.com/DeRonin_/status/2104517555507388837
- 另有帖称某月净入超过 $70k。均为自述。
- 2026-04 有一帖称在 @CloseAI_hq 用 4 名工程师、3 个月从零训练 8B 销售模型。数字（30TB 录音、7 个 LoRA）没有外部技术报告支撑，按营销帖看。

内容定位更准确的说法：增长向创作者，用长资源帖获客。路线图的价值在目录和链接，不在作者的从业年限。

### 2.3 合写人 Andy，@andy_ai0

- 用户 ID：2024155877373345792
- 注册：2026-02-18，抓取时账号只有约一个月
- 注册地标记：SK（斯洛伐克）
- 简介：using AI as leverage. distribution for AI products
- 粉丝：抓取时约 887
- 2026-03-13 自我介绍：做了 3 年多内容营销经理，近一年学 AI，用过写作、自动化、自己做 app、agent。帖子：https://x.com/andy_ai0/status/2032459030015168783
- 2026-03-16 转发长文，称两人花了 40+ 小时收资源。https://x.com/andy_ai0/status/2033588631810572711

合写关系有双方帖子互证。Andy 的「很懂 AI」是 Ronin 的推荐语，公开履历更接近内容营销，不是可核验的工程师简历。

---

## 3. 信源怎么用

正文分两层。

- A 层：X 长文抓取原文，Month 1 到 Month 4 前段。这一层是作者原文。
- B 层：Month 4 后段、Month 5、Month 6。X 抓取在 Month 4 工具选择处截断。结构以作者 2026-03-13 大纲帖为准；资源名和链接来自 2026-03-17 isisi 日文译本的英文对照，译本署名了 Ronin 和 andy_ai0。B 层不是逐字原文。

原文质量备注：

- 月份编号有跳号（Month 2 从 1 跳到 3，Month 2 里出现两个「5」）。保留原样。
- freeCodeCamp 19 小时 API 课链接与终端课链接重复，使用时以文字标题为准，不要盲点那个重复链接。
- 文中「多数生产环境工程师用 Instructor」「RAG 是目前最缺的技能」是作者判断，不是调查数据。

---

## 4. 中文骨架（方便先扫一遍）

AI 工程师在这篇里的定义：不是从零训练大模型，而是在现成模型上做产品。位置在软件工程、产品工程、自动化、应用 AI 之间。

- 第 1 个月：Python、Git、终端、HTTP/JSON/async、SQL、pandas、FastAPI。目标是能写能跑的小程序。
- 第 2 个月：提示词、结构化输出、tool calling、流式、多轮状态、token 成本、失败处理、提示注入。
- 第 3 个月：embedding、切块、向量库、metadata 过滤、rerank、检索失败模式、引用。框架先 LlamaIndex。
- 第 4 个月：agent 循环、工具描述、状态、重试、何时不要用 agent、工作流、eval。建议先不用框架写一个 while-loop agent。
- 第 5 个月：生产 FastAPI、Docker、队列、鉴权、日志、prompt 版本、成本、缓存。
- 第 6 个月：三条方向里选一条做作品集。产品工程师、应用 LLM 工程师、自动化工程师。

作者自己的雇佣标准：六个月结束时手里要有几个能点开的产品，而不是学完理论。

---

## 5. 正文 A：X 长文原文（抓取，至截断处）

来源：https://x.com/DeRonin_/status/2033587293064204349
抓取时间：2026-10-04。以下尽量保留原措辞。

AI engineering has quickly become one of the most valuable skill sets in tech

The problem is that most beginners have no clear idea what they should actually study

Some start with machine learning theory
Some get stuck endlessly watching tutorials
Others jump straight into prompts and agents without understanding APIs, backend basics, or how real products are actually built

The result is usually the same: a lot of confusion and very little practical skill

If your goal is to become an AI engineer, you don’t need to master every field of artificial intelligence
You need to learn how to build useful AI systems in the real world

That means learning how to:

- build end-to-end applications with LLMs
- work with model APIs such as OpenAI and Anthropic
- properly design prompts and context
- use structured outputs and tool calling
- add retrieval when needed
- deploy projects so people can actually use them

This guide was created to give you a practical 6-month roadmap

The article is 10,000+ WORDS, so reading it may take a few hours or even longer
But its real value is that for every skill you need to learn, there are resources and clear explanations of what to do
That way, within six months you can reach the level of AI engineering, and start using it for yourself already within the first 1-2 months

Writing this article took more than 40 HOURS, and I worked on it together with my friend @andy_ai0
He just started building his personal brand on X, but he understands AI very well and helped a lot with this article
I definitely think he deserves your follow and support as he grows

Now let's start reading the article

### What an AI Engineer actually does

A lot of people hear the phrase "AI engineer" and imagine someone training giant models from scratch

In reality, most modern AI engineers do something much more practical
They build products and systems on top of existing models

That usually includes:

- connecting to LLM APIs
- designing prompts and context flows
- building chat, search, or automation systems
- integrating tools, databases, and external APIs
- handling structured outputs
- improving reliability, cost, and latency
- deploying AI features into real applications

So in practice, an AI engineer often sits somewhere between: software engineering, product engineering, automation, applied AI

This is why the role is growing so fast
Companies do not only need researchers
They need people who can take models and turn them into useful products

That is also why this roadmap focuses less on heavy theory and more on practical execution

If you can build real LLM apps, retrieval systems, automations, and production-ready workflows, you are already much closer to being employable than most beginners

### Month 1: Get solid enough in coding and the fundamentals

Your goal this month: Become a functional Python developer

You don't need to be an expert, you just need to stop Googling basic syntax and be able to build simple programs confidently

AI engineering is first and foremost software engineering
Everything in the later months assumes you can write clean Python, use the terminal, call APIs, and manage a codebase. This month is your foundation

#### 1. Python

Python is the language of AI engineering. Full stop. Almost every library, API, and tutorial you'll encounter over the next six months is in Python

How to learn it:
Start with a structured course that forces you to write code, not just watch videos
The most common mistake beginners make is consuming content passively, reading along, nodding, and never opening a code editor
Fight this by coding every single example as you go

Resources:

1. Python for Everybody (Coursera, free to audit) https://www.coursera.org/specializations/python
2. freeCodeCamp Python Course (YouTube, free) https://www.youtube.com/watch?v=rfscVS0vtbw
3. CS50P: Introduction to Programming with Python (Harvard, free) https://cs50.harvard.edu/python/
4. Official Python docs (the tutorial) https://docs.python.org/3/tutorial/

What to focus on:

- Variables, data types, loops, conditionals, functions
- Lists, dictionaries, sets, tuples
- File I/O and working with JSON
- Classes and basic OOP
- Error handling with try/except
- Virtual environments (venv) and pip
- Package management, requirements.txt

Practice project: Build a simple CLI tool in Python. Something like a personal expense tracker that reads/writes to a JSON file, or a script that calls a public API (like a weather API) and prints formatted results

#### 2. Git and GitHub

Resources:

1. GitHub Skills (free, interactive) https://skills.github.com/
2. Learn Git Branching (free, interactive) https://learngitbranching.js.org/
3. Pro Git Book (free online book) https://git-scm.com/book/en/v2

What to focus on: git init, add, commit, push, pull; branching and merging; .gitignore; creating repos; basic README files

Practice: every project, even small scripts, should live in a GitHub repo.

#### 3. CLI / Terminal Basics

Resources:

1. The 50 most popular Linux & Terminal commands https://www.youtube.com/watch?v=ZtqBQ68cfJc
2. The Missing Semester of Your CS Education (MIT, free) https://missing.csail.mit.edu/

What to focus on: cd, ls, pwd, mkdir, rm; cat, less, grep; running Python scripts; environment variables; PATH

#### 4. JSON, APIs, HTTP, and Async Basics

Resources:

1. HTTP basics, MDN https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
2. REST API Tutorial https://restfulapi.net/
3. Python requests library docs https://requests.readthedocs.io/en/latest/
4. Python async/await https://realpython.com/async-io-python/

What to focus on: GET, POST; reading and writing JSON; status codes 200, 400, 401, 404, 500; API keys; async def and await

Practice project: call Open-Meteo (no API key) and format the result as clean JSON.

#### 5. Basic SQL and Pandas

Resources:

1. SQLBolt https://sqlbolt.com/
2. Pandas official getting started https://pandas.pydata.org/docs/getting_started/index.html
3. Kaggle Pandas course https://www.kaggle.com/learn/pandas

What to focus on: SELECT, WHERE, GROUP BY, JOIN, ORDER BY; loading CSVs, filtering, aggregations

#### 6. FastAPI

Resources:

1. FastAPI Official Tutorial https://fastapi.tiangolo.com/tutorial/
2. Python API Development (19-Hour Course, freeCodeCamp). 原文链接与上面的终端课重复，指向 https://www.youtube.com/watch?v=ZtqBQ68cfJc 。这是原文错误，不要当成 19 小时 API 课。

What to focus on: GET and POST endpoints, path and query parameters, Pydantic request bodies, uvicorn, built-in /docs

Month 1 Milestone:

- Write Python programs that read/write files, call APIs, and handle errors
- Version code with Git and push to GitHub
- Navigate the terminal
- Make an HTTP request in Python
- Query SQLite with basic SQL
- Build and run a simple FastAPI app locally

### Month 2: Master LLM App Development

Your goal this month: Build real AI-powered applications using the OpenAI and Anthropic APIs

By the end you should be comfortable writing prompts that work reliably, getting structured data out of models, making them call your functions, and handling everything that can go wrong

#### 1. Prompting Fundamentals

Resources:

1. Anthropic's Interactive Prompt Engineering Tutorial https://github.com/anthropics/prompt-eng-interactive-tutorial
2. Anthropic Prompt Engineering Docs https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
3. OpenAI Prompt Engineering Guide https://platform.openai.com/docs/guides/prompt-engineering
4. PromptingGuide.ai https://www.promptingguide.ai/

Focus: system vs user messages, specificity, chain-of-thought, few-shot, wording sensitivity

Practice: one real task, five prompts, compare outputs.

原文这里编号从 1 跳到 3。

#### 3. Structured Outputs / JSON Schemas

Resources:

1. OpenAI Structured Outputs Guide https://platform.openai.com/docs/guides/structured-outputs
2. Instructor https://python.useinstructor.com/
3. OpenAI Cookbook: Structured Outputs Introduction https://developers.openai.com/cookbook/examples/structured_outputs_intro/

Practice: invoice or receipt parser returning a typed object (invoice_number, amount, items, due_date).

#### 4. Function / Tool Calling

The model does not execute functions. It returns a structured call. Your code executes it and sends the result back.

Resources:

1. OpenAI Function Calling Guide https://platform.openai.com/docs/guides/function-calling
2. Anthropic Tool Use Docs https://docs.anthropic.com/en/docs/build-with-claude/tool-use
3. OpenAI Cookbook notebook https://github.com/openai/openai-cookbook/blob/main/examples/How_to_call_functions_with_chat_models.ipynb

Practice: assistant with get_weather(city), calculate(expression), search_notes(query).

#### 5. Streaming Responses

Resources:

1. OpenAI Streaming Docs https://platform.openai.com/docs/api-reference/streaming
2. Anthropic Streaming Docs https://docs.anthropic.com/en/api/messages-streaming
3. Simon Willison, How Streaming LLM APIs Work https://til.simonwillison.net/llms/streaming-llm-apis

Focus: stream=True, delta chunks, FastAPI StreamingResponse.

原文接着又出现一个「5. Conversation State」。保留原编号。

#### 5. Conversation State

LLMs are stateless. You send the full message list every request.

Resources:

1. OpenAI conversation state https://platform.openai.com/docs/guides/conversation-state
2. Anthropic Messages API https://docs.anthropic.com/en/api/messages

Practice: terminal multi-turn chatbot with /reset and a printed token count.

#### 6. Cost, Latency, and Token Basics

Resources:

1. OpenAI Pricing https://openai.com/api/pricing
2. Anthropic Pricing https://www.anthropic.com/pricing
3. OpenAI Tokenizer https://platform.openai.com/tokenizer
4. tiktoken https://github.com/openai/tiktoken

Focus: token roughly 4 characters; input vs output price; context window; do not use the largest model for every task.

#### 7. Failure Handling

Resources:

1. OpenAI Error Codes https://platform.openai.com/docs/guides/error-codes
2. Anthropic Errors https://docs.anthropic.com/en/api/errors
3. Tenacity https://tenacity.readthedocs.io/

Focus: 429 and exponential backoff, timeouts, validate output, fallback model, never crash on bad model output.

#### 8. Prompt Injection Awareness

Resources:

1. OWASP LLM01 Prompt Injection https://genai.owasp.org/llmrisk/llm01-prompt-injection/
2. OWASP Prompt Injection Prevention Cheat Sheet https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
3. Evidently AI explainer https://www.evidentlyai.com/llm-guide/prompt-injection-llm

Focus: direct vs indirect injection; system prompts are not a security boundary; least privilege for tools; do not let unvalidated model output take consequential actions.

Month 2 Milestone:

- Reliable prompts
- Structured JSON via Pydantic + Instructor
- Tool calling
- Streaming through FastAPI
- Multi-turn history
- Token cost estimate before sending
- Errors and bad outputs do not crash the app
- Can explain prompt injection and apply basic defenses

### Month 3: Learn RAG Properly

Your goal this month: Build systems that let LLMs answer questions from your documents, not just from their training data

#### 1. Embeddings

Resources:

1. Stack Overflow Blog, An Intuitive Introduction to Text Embeddings https://stackoverflow.blog/2023/11/09/an-intuitive-introduction-to-text-embeddings/
2. Google ML Crash Course: Embeddings https://developers.google.com/machine-learning/crash-course/embeddings
3. HuggingFace: Getting Started With Embeddings https://huggingface.co/blog/getting-started-with-embeddings
4. OpenAI Embeddings Guide https://platform.openai.com/docs/guides/embeddings

Practice: embed 20 sentences, nearest-neighbor search, return top 3.

#### 2. Chunking

Resources:

1. Weaviate: Chunking Strategies for RAG https://weaviate.io/blog/chunking-strategies-for-rag
2. Unstructured: Chunking for RAG Best Practices https://unstructured.io/blog/chunking-for-rag-best-practices
3. LangChain Text Splitters https://python.langchain.com/docs/concepts/text_splitters/

Author's suggested start: RecursiveCharacterTextSplitter, chunk_size=500, chunk_overlap=50. Another cited starting point in the same section: about 250 tokens with 10–20% overlap.

#### 3. Vector Databases

Author's choice guide: Chroma for local prototyping, Pinecone for managed scale, Weaviate for open-source hybrid search, Qdrant for filters and self-hosting, pgvector if you already use Postgres.

Resources:

1. Chroma https://docs.trychroma.com/
2. Pinecone Learning Center https://www.pinecone.io/learn/
3. Qdrant https://qdrant.tech/documentation/
4. pgvector https://github.com/pgvector/pgvector

Practice: index 50–100 pages into Chroma with metadata, retrieve top 5.

#### 4. Metadata Filtering

Resources:

1. Pinecone metadata filtering https://docs.pinecone.io/guides/data/filter-with-metadata
2. LlamaIndex metadata filters https://docs.llamaindex.ai/en/stable/module_guides/querying/node_postprocessors/node_postprocessors/

#### 5. Reranking

Pattern: embed and search, then rerank top-k.

Resources:

1. Cohere reranking https://docs.cohere.com/docs/reranking-with-cohere
2. LangChain Cohere reranker https://python.langchain.com/docs/integrations/retrievers/cohere-reranker/

#### 6. Retrieval Quality Issues

- Semantic drift: query rewriting or HyDE
- Chunk boundary: more overlap or semantic chunking
- Wrong document: metadata filter
- Top-k too small: retrieve more, rerank down

Resources:

1. LangChain query transformations https://python.langchain.com/docs/how_to/#query-analysis
2. Pinecone retrieval quality section https://www.pinecone.io/learn/retrieval-augmented-generation/#retrieval-quality

#### 7. Hallucination Reduction

Resources:

1. Zep guide https://www.getzep.com/ai-agents/reducing-llm-hallucinations/
2. Voiceflow overview https://www.voiceflow.com/blog/prevent-llm-hallucinations

Focus: answer only from provided context; say "I don't know"; check retrieval before blaming the model.

#### 8. Citations and Grounding

Resources:

1. Anthropic citations https://docs.anthropic.com/en/docs/build-with-claude/citations
2. LangChain QA with sources https://python.langchain.com/docs/how_to/qa_sources/

#### 9. LangChain or LlamaIndex

Author's advice: Month 3 start with LlamaIndex. Month 4 agents, move to LangChain.

Resources:

1. LlamaIndex RAG intro https://developers.llamaindex.ai/python/framework/understanding/rag/
2. LlamaIndex starter https://developers.llamaindex.ai/python/framework/getting_started/starter_example/
3. LangChain RAG agent https://docs.langchain.com/oss/python/langchain/rag

Practice: chat-with-your-docs. Ingest 10–20 files, FastAPI endpoint, top 5 with reranking, cited answer.

Month 3 Milestone:

- Explain embeddings
- Chunk documents
- Store and query with metadata filters
- Add reranking
- Debug retrieval failures
- Ship an end-to-end RAG pipeline

### Month 4: Agents, Tools, Workflows, and Evals

Your goal this month: Build AI systems that can take sequences of actions autonomously, wire together multi-step workflows, and critically evaluate whether they're working

#### 1. Agent Loops

An agent is a loop: observe, reason, act. The branching is the model choosing a tool. The doing is your code calling the function.

Resources:

1. Anthropic: Building Effective Agents https://www.anthropic.com/research/building-effective-agents
2. OpenAI: A Practical Guide to Building Agents https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
3. freeCodeCamp: The Open Source LLM Agent Handbook https://www.freecodecamp.org/news/the-open-source-llm-agent-handbook/
4. LangChain Academy: Introduction to LangGraph https://academy.langchain.com/courses/intro-to-langgraph

Practice: build an agent with no framework. API only, 3 tools, a goal, a loop.

#### 2. Tool Selection

原文抓取在这里截断。作者原句停在：Anthropic's equivale...

已抓到的资源：

1. OpenAI function-calling best practices https://platform.openai.com/docs/guides/function-calling/best-practices
2. Anthropic tool-use best practices https://docs.anthropic.com/en/docs/build-with-claude/tool-use/implement-tool-use#best-practices-for-tool-definitions

A 层到此结束。

---

## 6. 正文 B：截断后的补齐（非逐字原文）

结构来自作者 2026-03-13 大纲帖。资源名和链接来自 isisi 2026-03-17 译本，该译本注明原作者为 Ronin，合写 andy_ai0。链接请自行再点开确认，平台文档路径会改。

### Month 4 续

#### 3. State management

LangGraph 里 state 是流过图的共享对象：消息、变量、中间结果、决定历史。

- https://langchain-ai.github.io/langgraph/concepts/low_level/#state
- https://www.datacamp.com/tutorial/langgraph-agents
- https://realpython.com/langgraph-python/

#### 4. Retries inside the loop

循环中途的工具失败会弄坏状态、打转，或安静地交出错误答案。

- https://langchain-ai.github.io/langgraph/how-tos/autofill-tool-errors/
- OpenAI agents PDF 的 guardrails 一节，链接同上

#### 5. When not to use an agent

作者大纲和译本都把这条当成 Month 4 的关键：一次提示能解决就用单次调用；步骤固定就用工作流；只有步骤数和分支真的动态时才用 agent。

- https://www.anthropic.com/research/building-effective-agents
- Simon Willison, Designing Agentic Loops https://simonwillison.net/2025/Sep/30/designing-agentic-loops/

#### 6. Multi-step workflows

模式：prompt chaining、routing、parallelization、orchestrator-subagent。

- https://www.anthropic.com/research/building-effective-agents#workflow-patterns
- https://langchain-ai.github.io/langgraph/concepts/multi_agent/

译本中的练习：三步内容管线。抽取事实，并行生成 tweet / LinkedIn / summary，再打分选一条。

#### 7. Evaluation harnesses

- DeepEval https://deepeval.com/docs/getting-started
- Promptfoo https://github.com/promptfoo/promptfoo
- LangSmith https://smith.langchain.com/
- Ragas https://docs.ragas.io/

Month 4 里程碑（译本）：能不用框架写出 agent 循环；工具描述能被稳定选中；能管理状态；循环内失败不崩；能判断该用 agent、工作流还是单次调用；能做链式、路由、并行工作流；能跑 eval。

### Month 5: Deployment, product thinking, and reliability

大纲帖列出的学习项：FastAPI production patterns、Docker、background jobs、queues、auth 和 API key、logging、observability、prompt/version management、eval dashboards、cost monitoring、rate limits、caching。

译本补充的资源：

1. FastAPI deployment https://fastapi.tiangolo.com/deployment/
2. Docker getting started https://docs.docker.com/get-started/
3. freeCodeCamp multi-agent Docker 文 https://www.freecodecamp.org/news/build-and-deploy-multi-agent-ai-with-python-and-docker/
4. DataCamp deploy LLM apps with Docker https://www.datacamp.com/tutorial/deploy-llm-applications-using-docker
5. Celery https://docs.celeryq.dev/en/stable/getting-started/introduction.html
6. FastAPI background tasks https://fastapi.tiangolo.com/tutorial/background-tasks/
7. FastAPI security https://fastapi.tiangolo.com/tutorial/security/
8. OWASP API Security Top 10 https://owasp.org/API-Security/
9. Langfuse https://langfuse.com/docs/observability/overview
10. LangSmith https://smith.langchain.com/
11. structlog https://www.structlog.org/
12. Langfuse prompt management https://langfuse.com/docs/prompts
13. OpenAI usage https://platform.openai.com/usage
14. Anthropic console https://console.anthropic.com/
15. Helicone https://www.helicone.ai/
16. LiteLLM https://github.com/BerriAI/litellm
17. Redis https://redis.io/docs/
18. GPTCache https://github.com/zilliztech/GPTCache

译本中的练习：把 Month 3 的 RAG 应用容器化，docker-compose 跑 FastAPI、Chroma 或 Qdrant、Redis。

译本还列了两篇非官方生产部署文，路径不稳定，这里不当作必读：craftyourstartup.com 的 FastAPI 生产文，fastlaunchapi.dev 的 2026 best practices。

### Month 6: Specialize and become hireable

这一层以 2026-03-13 大纲帖为准，三条方向是原文，不是译本发明的。

Direction 1: AI product engineer
适合想快进创业公司的人。焦点：LLM apps、RAG、agents、deployment、product UX。
译本补充：Vercel AI SDK https://sdk.vercel.ai/docs ；Streamlit https://docs.streamlit.io/ ；Gradio https://www.gradio.app/docs ；Google People + AI Guidebook https://pair.withgoogle.com/guidebook/ ；Nielsen Norman Group AI UX https://www.nngroup.com/topic/artificial-intelligence/
练习：这个月做出 2–3 个能演示的成品，放上 GitHub 并部署。

Direction 2: Applied ML / LLM engineer
焦点：fine-tuning、何时微调而不是只写提示、evaluation、inference optimization、open-source models、training pipelines。
译本补充的决策顺序：先提示词，不够再 RAG，提示词加 RAG 仍达不到质量、一致性、延迟要求时才微调。
资源：OpenAI fine-tuning https://platform.openai.com/docs/guides/fine-tuning ；HuggingFace training https://huggingface.co/docs/transformers/training ；Unsloth https://github.com/unslothai/unsloth ；LLaMA-Factory https://github.com/hiyouga/LLaMA-Factory ；Ollama https://ollama.ai/ ；HuggingFace models https://huggingface.co/models ；vLLM https://github.com/vllm-project/vllm
对照阅读：Google crash course tuning https://developers.google.com/machine-learning/crash-course/llm/tuning ；IBM RAG vs fine-tuning vs prompt engineering https://www.ibm.com/think/topics/rag-vs-fine-tuning-vs-prompt-engineering

Direction 3: AI automation engineer
大纲帖原文焦点：workflow orchestration、business process automation、multi-tool systems、CRM / docs / email / support / ops。
译本在抓取时于 Direction 2 后截断，Direction 3 没有可靠的逐条资源清单，不以译本补写。

大纲帖结尾：六个月结束时应该已经有几个做过的产品或任务样例，找 AI 工程师工作会容易得多。保存路线，后面回来学。

---

## 7. 配套练习帖（原文要点）

来源：https://x.com/DeRonin_/status/2035374232893354262
时间：2026-03-21。作者说长文发了将近 4 天，资源有了，但读者不知道具体做什么，所以补了 10–14 天的练习。下面是抓到的前两周，不是全文。

Week 1

1. CLI expense tracker：增删查，存 JSON，只用标准库 json、sys、argparse。
2. Open-Meteo 天气脚本：解析 JSON，处理 404 和超时。
3. 两个项目都推到 GitHub，写 README，有 .gitignore，多次有意义的 commit。
4. 用 pandas 把 CSV 装进 SQLite，做 SQL 查询。帖子在这里被搜索摘要截断。

Week 2

1. 把记账 CLI 改成 FastAPI：POST /expense、GET /expenses、DELETE /expense/{id}，Pydantic，uvicorn，用 /docs 测。
2. 接第一个 LLM，确认 token 是流式出现，不是一次吐完。

作者说如果反馈够，会继续发后面的练习。打包时没有把后续练习全部拉全。

---

## 8. 文件说明

- 本文件是阅读包，不是作者授权的再版。
- 转载、课程化或拿去卖之前，原文版权在作者。资源链接各自属于文档站。
- B 层如果和 X Article 打开后的原文不一致，以 X Article 为准。
