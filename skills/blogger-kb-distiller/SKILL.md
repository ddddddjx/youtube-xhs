---
name: blogger-kb-distiller
description: 跨平台博主知识蒸馏器。把小红书 / B站 / YouTube / 抖音 / 视频号 / 公众号 / 博客等博主的视频或图文口播，转写为文字并跨内容熔合成可读精读长文，附「溯源 + 时间锚定」。当用户想"蒸馏某平台某博主的知识 / 视频 / 图文""把某博主内容整理成长文""搭建某博主知识库""把 B站/抖音/公众号博主的内容系统化"时触发。核心是可插拔 adapter：抓取层按平台切换后端（小红书=内嵌浏览器登录、B站/YouTube=yt-dlp、博客=RSS、抖音=登录会话），下游蒸馏引擎平台无关。
agent_created: true
---

# 跨平台博主知识蒸馏器 (blogger-kb-distiller)

把某平台博主的多条视频/图文，整理为**跨内容熔合的精读长文 + 溯源索引**，让用户无需逐条观看即可系统吸收。

## 何时使用
- "蒸馏小红书/B站/抖音/公众号/博客博主 XXX 的知识"
- "把 XXX 的视频/图文整理成长文 / 搭建 XXX 知识库"
- 用户已有一批某博主媒体文件，想系统化

## 核心思想：两层分离（这是本 Skill 的关键）
- **平台无关引擎（固化，每次都一样）**：ingest → transcribe/extract → classify → fuse → provenance+anchor → export
- **可插拔 adapter（按平台切换，只做一件事）**：把"某博主内容"变成**统一中间格式**，下游引擎完全不关心平台

> 所以"内嵌浏览器登录"不是全局强制——它只是**小红书 / 抖音**这类强反爬 adapter 的内部策略之一；B站 / 博客走自动化，用户零登录。

## 统一中间格式（每个 adapter 必须产出）
```json
{
  "platform": "xiaohongshu | bilibili | youtube | douyin | blog | wechat",
  "blogger": "博主名/账号",
  "items": [
    {"num": 1, "title": "标题", "date": "YYYY-MM-DD", "text": "逐字稿/正文", "file": "1_标题.mp4", "id": "可选原始ID"}
  ]
}
```
下游引擎只认这个格式。date 字段是溯源与时间锚定的基础（小红书靠 note id 时间戳还原，B站/博客来自元数据）。

## 五步引擎（平台无关，每次照做）
### Step 1 · Ingestion — 调对应 adapter
- 按 `platform` 选 adapter（规格见 `references/adapters.md`）
- adapter 产出统一中间格式 JSON（落 `_ingest.json`），并把媒体/逐字稿落到工作目录
- 小红书 / 抖音：需用户在**内嵌浏览器**登录网页版；B站 / 博客：全自动

### Step 2 · Transcribe / Extract — 取文字
- 视频：优先用现成字幕/逐字稿；无则转写（whisper / 平台字幕）得文字
- 图文 / 博客：直接抽正文
- 落盘：`03_逐字稿/{num:02d}_{title}.txt`（num 两位零填充）

### Step 3 · Classify — 分类聚类
- 用 LLM 把 items 按主题聚成若干"合成单元"(unit)，每单元含多个相关 items
- 输出 `_units.json`：`[{id:"uNN", name, out:"", files:[{num:"NN", title, path}]}]`（`id` 形如 `"u01"`，`num` 为零填充字符串；与 `05_精读摘要/{NN}_*.md` 对应）
- 一级分类建议 14 类（参考资本市场律师案例：境内IPO/港股/投融资文件/股权尽调/交易方案/方法论/行业/特殊权利/税务/国企/劳动/合同/书单/随笔…），按博主实际主题调整

### Step 4 · Fuse — 跨视频熔合（写出长文）★核心
- 对每个 unit：读其 `files` 对应逐字稿，**去口语 + 立逻辑骨架 + 保留案例**，熔合成一篇精读长文
- **关键经验**：跨视频熔合型长文远优于单篇摘要（用户验证：单篇"看不懂、逻辑散"，熔合后"是我想要的内容"）
- 写到 `05_精读摘要/{unit:02d}_{一级类}_{短名}.md`
- 顶部先留文档级来源区块位置（Step 5 填充）

### Step 5 · Provenance + Time Anchoring — 溯源 + 时间锚定
- **文档级**：每篇开头注入 `> **来源视频（共 N 个，按发布时间排序）**：` + 编号+发布日期列表 + `> 本篇融合视频发布于 X ~ Y；文中「近期／近几年／当年」等时间词指各视频发布时点前后。`
- **段落级**：模糊时间词（近期/近几年/当年/最近/目前/现在/前几年）→ 具体年/时段；段末内联 `（来源：视频#N，发布 YYYY-MM-DD）`；融合多视频的段落用**多源标注** `（来源：视频#N、#M）` / `（来源：视频#N、#M，发布 YYYY-MM-DD、YYYY-MM-DD）`（比强行归单一视频更诚实，优先用多源）
- 段落归因方法：读逐字稿原文，判断每段最源自哪个视频（见 `references/pipeline.md`）
- 用 `scripts/build_provenance.py <workdir>` 生成 `_provenance_map.json`
- 用 `scripts/gen_index.py <workdir>` 生成 `05_精读摘要/溯源与时间索引.md`

## 输出目录布局（复用已验证结构）
```
<workdir>/
  01_视频/              媒体文件
  03_逐字稿/            {num:02d}_{title}.txt
  _ingest.json          统一中间格式（adapter 产出）
  _provenance_map.json  编号↔标题↔日期↔文件 映射
  _units.json           合成单元定义
  05_精读摘要/          01~NN 长文 + 00_学习知识地图.md + 溯源与时间索引.md
```
- 工作目录**默认 `~/XHS_KB`**，可让用户指定
- 过程文件（json）保留，便于增量更新与溯源；不要随意删除

## 一次跑通 Runbook（用户说"蒸馏 X 平台博主 Y"）
1. 确认三要素：platform、blogger 标识（主页/账号）、工作目录
2. 调对应 adapter（小红书/抖音→内嵌浏览器请用户登录；B站/博客→全自动）
3. 跑 Step 2–5。长文合成可用**后台子代理分批**（每批 3–4 个 unit）；跑完务必 `python scripts/verify.py <workdir>` 清零错误（文档级区块/段末标注/日期一致性）。博主更新内容时用 `scripts/incremental.py` 做增量（见 Runbook 增量更新）
4. 生成 `00_学习知识地图.md`：用一级分类组织全部长文，含每篇一句话导读 + 推荐阅读路径 A/B/C
5. 汇报：长文篇数、溯源覆盖率（应 100%）、是否有缺失/失败单元

## 增量更新 Runbook（博主发了新内容，不全量重跑）
1. adapter 重新全量爬取博主主页 → 覆盖 `_ingest.json`（含全部历史 + 新内容）
2. `python scripts/incremental.py <workdir>` → 对比现有 `_provenance_map.json`，产出 `_ingest_new.json`（仅新增）并打印新增/失效报告
3. 只对 `_ingest_new.json` 的 item 跑 Step 2–5 熔合新长文（后台分批）
4. `python scripts/build_provenance.py <workdir> _ingest_new.json --merge` → 追加到 `_provenance_map.json`
5. `python scripts/gen_index.py <workdir>` 重生成索引；再跑 `verify.py` 校验

## 注意 / 坑（来自实战）
- **429 频率限制**：子代理并发会触发，重置后重启；用**跳过规则**（文件已含 `（来源：视频#` 内联标注则跳过，不重复写）
- **段落归因**：必须读逐字稿原文判断来源，不能瞎标；综合/过渡段归入最相关视频，无法判断则归本单元最早发布视频
- **文档级来源区块勿删**：写回文件时保留顶部 `> **来源视频（共` 区块
- **时间锚定基准**：以段落归因视频的发布日期为"近期/近几年"的锚点
- **小红书 note id 时间戳**：note id 前 8 位 hex = Unix 时间戳，可精确还原发布日期，无需重爬（验证 `660d6f4b`→2024-04-03）

## 参考文件
- `references/pipeline.md` — 五步引擎详细模板（分类/熔合 prompt、段落级锚定模板、多源标注、质量门禁、增量、转写）
- `references/adapters.md` — 各平台 adapter 规格与"如何新增 adapter"
- `scripts/build_provenance.py` — 由 `_ingest.json` 生成 `_provenance_map.json`（支持 `--strict` 日期校验、`--merge` 增量合并、`--force` 覆盖）
- `scripts/gen_index.py` — 由 `_units.json` + `_provenance_map.json` 生成溯源索引
- `scripts/verify.py` — **质量门禁**：校验文档级区块/段末标注/日期一致性，不通过退码 1
- `scripts/incremental.py` — 增量差量，产出仅新增的 `_ingest_new.json`
- `scripts/transcribe.py` — 字幕清洗 / whisper 转写辅助（视频无字幕时）
