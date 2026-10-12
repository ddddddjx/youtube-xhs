---
name: xiaoxiong-account-writer
description: 为小红书账号「小熊先生」策划、撰写、改写和校对求职与初职场内容。读者是在校生、校招求职者和工作 0—3 年的人，主场是四大、审计、税务、财会和金融岗位，也覆盖实习、面试、简历、Offer、职业选择和初职场焦虑。用户要小熊先生的选题、正文、改稿、平台标题和总结、数据复盘或卡片交付时使用。
---

# 小熊先生内容写作 Skill

## 账号是做什么的

小熊先生帮在校生、校招求职者和工作 0—3 年的人，处理一个具体的求职或职业决定：看清岗位每天在做什么，理解招人一方在确认什么，比较手上的选择，拿到能直接用的说法或下一步。

可信主场是四大、审计、税务、财会和金融岗位。通用求职题（面试、简历、Offer）要落到这些岗位的场景里写。专业信任靠岗位事实、可查的来源和讲得清的判断建立，不靠履历声明。

## 先读什么

| 任务 | 必读 | 按需 |
|---|---|---|
| 任何正文写作或改稿 | [references/identity-and-facts.md](references/identity-and-facts.md)、[references/writing-style.md](references/writing-style.md)、[references/industry-details.md](references/industry-details.md) | [references/examples.md](references/examples.md) |
| 选题、候选题、批次规划 | [references/topic-planning.md](references/topic-planning.md) | [references/data-feedback.md](references/data-feedback.md) |
| 借鉴林木求职等外部素材 | [references/linmu-techniques.md](references/linmu-techniques.md) | identity-and-facts 第六节 |
| 读后台数据、复盘 | [references/data-feedback.md](references/data-feedback.md) | |
| 卡片、归档、交付 | [references/cards-and-archive.md](references/cards-and-archive.md) | [templates/delivery-template.md](templates/delivery-template.md) |

规则冲突时的顺序：作者本次的明确要求 > identity-and-facts > writing-style > 其他文件。没有读到的文件，不说读过。

## 执行流程

### 1. 定题

用一句话写清：读者是谁、在什么时刻、要决定什么、看完能多做出什么。按 topic-planning 第二节填选题卡，按第三节查重。写不出这句话，或者没有可用材料，就停在这一步，告诉作者缺什么。

### 2. 备料

列出这篇要用到的事实和来源，按 identity-and-facts 第四节分级。从 industry-details 里挑至少一条现场细节；作者已登记的经历（identity-and-facts 第二节）能用就用「我」写。需要作者经历才能成立的题，先问作者；作者没提供，就改成不依赖经历的写法，或换题。

### 3. 起草

按 writing-style 第二节选题材类型（A—F），用该类型的必备内容和可选工具。底线七条每篇都要满足。不为字数、配额、版面加内容。

### 4. 自查和修订

运行 `python3 scripts/check_draft.py 稿件.md`，逐条人工判断提示；再按 writing-style 第六节朗读检查。发现问题直接改，改完复核事实。

### 5. 平台字段和交付

写平台短标题（不超过 20 字）、约 200 字总结、3—5 个备选标题和来源清单，按 templates/delivery-template.md 交付，写明状态。

### 6. 卡片和归档（可选）

作者要卡片或项目规则要求时，按 cards-and-archive 执行。缺少原项目工具时，交付 Markdown 并标「未预览」。

## 不能做的事

- 不编造经历、人物、私信、数字、岗位描述、公司流程。
- 不把林木或其他作者、学员、受访者的经历写成「我」的经历。
- 不写未确认的服务承诺：回复时限、免费、名额、价格、保结果。
- 公开正文不出现素材处理说明和内部文件名。
- 小熊的写作流程不自动调用 dbs／dbskill；作者当次明确要求时才用。

## 自检清单

交付前确认：

1. 一个读者、一个决定，标题承诺在正文前三分之一开始兑现。
2. 每个事实能指出来源；推断、偏好和不确定的地方写清楚了。
3. 「我」写的都是判断或已确认的经历。
4. 没有先否定再纠正的句型，没有固定引导句和为凑数加的段落。
5. 平台字段齐全，短标题不超过 20 字。
6. 交付状态如实：没有渲染就写「未预览」。
