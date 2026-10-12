# 小熊先生内容写作 Skill（2026-10-11 版）

## 安装

把整个 `xiaoxiong-account-writer` 文件夹放进所用 Agent 的 skills 目录：

- Claude Code：`~/.claude/skills/xiaoxiong-account-writer/`，或项目内 `.claude/skills/xiaoxiong-account-writer/`
- Codex 等支持 `SKILL.md` 的 Agent：放进各自的 skills 目录

替换旧版时，先备份旧文件夹，再整体替换。旧版 `references/` 里的 7 个文件已合并或删除（对应关系见 [CHANGELOG.md](CHANGELOG.md)），不要和新版混放。

## 文件职责

| 文件 | 职责 |
|---|---|
| `SKILL.md` | 入口：账号定位、读取顺序、执行流程、底线 |
| `references/identity-and-facts.md` | 「我」能写什么、已确认信息登记表、事实来源分级、引用他人、服务表述 |
| `references/writing-style.md` | 写作底线、按题材选写法、少用和不用的句型、各部位写法、标题字段、自查 |
| `references/topic-planning.md` | 要经营的读者问题、选题卡、去重、外部素材、栏目、数量、实验方法 |
| `references/linmu-techniques.md` | 从林木求职 302 篇转写稿归纳的可迁移技法、边界和不迁移清单 |
| `references/data-feedback.md` | 后台表字段、读数据规矩、当前规律表、更新方法 |
| `references/cards-and-archive.md` | 先定文字再排版的顺序、卡片检查优先级、外部依赖、交付状态、归档 |
| `references/examples.md` | 三组改写示例（旧版为按旧规则模拟） |
| `templates/delivery-template.md` | 交付文件模板 |
| `scripts/check_draft.py` | 稿件自检脚本，只提示不改稿 |

## 依赖

**写作部分无外部依赖**，任何能读文件的 Agent 都能用。自检脚本需要 Python 3（只用标准库）。

**可选外部依赖**（属于原小红书项目，不随包提供）：IdeaCard 应用和 `card.sh`、`card-precheck.mjs`、`小熊先生/_近期发文索引.md`、`自适应学习/账号学习状态.json`、后台导出表、账号头像。缺少时的降级做法见 `references/cards-and-archive.md` 第三节。本包不含任何机器上的绝对路径。

## 使用

- 写一篇：「用小熊先生 Skill 写一篇：审计实习只做底稿，简历怎么写」。
- 改稿：附上原稿，说明是否保留标题。
- 选题：说明数量；不说时默认给 5 个候选，合格数量不足时如实说明。
- 复盘：附上新导出的后台表。

## 修改理由（摘要）

旧版把真人感和专业性主要交给固定句子、配额和版面门槛来保证，导致文章容易出现可识别的模板，同时各文件之间有冲突和过期引用。新版改为：底线可检查，写法按题材选择，专业性靠岗位事实和来源，卡片排版后置。完整说明见 [CHANGELOG.md](CHANGELOG.md) 和交付报告。
