# 各平台 Adapter 规格（可插拔）

每个 adapter 只做一件事：把"某博主内容"变成 **统一中间格式**
`{platform, blogger, items:[{num, title, date, text, file, id?}]}`，
并把媒体落到 `01_视频/`、文字落到 `03_逐字稿/{num:02d}_{title}.txt`。

引擎（SKILL.md 五步）完全不关心平台，只消费这个格式。

---

## 统一契约（每个 adapter 必须遵守）
- 输入：blogger 标识（主页链接 / 账号名 / 用户 ID）
- 输出：`_ingest.json`（统一中间格式）
- 副作用：`01_视频/` 媒体文件、`03_逐字稿/{num:02d}_{title}.txt`
- `date` 字段必填（溯源/时间锚定基础）；`num` 从 1 起连续编号

---

## 小红书 (xiaohongshu) — 已验证 ✅
- **策略**：内嵌浏览器网页版登录（强反爬，必须登录）
- 流程：
  1. 浏览器打开小红书网页版，请**用户登录**
  2. 进入博主主页，滚动加载笔记列表，采集 note id / 标题 / 链接
  3. **note id 前 8 位 hex = Unix 时间戳 → 发布日期**（验证 `660d6f4b`→2024-04-03；198/198 全部成功还原）
  4. 逐个打开笔记：图文读正文，视频读字幕或转写口播
  5. 落盘 `03_逐字稿/{num:02d}_{title}.txt`，`_ingest.json` 带 `id`(note id)
- 关键技巧：note id 时间戳还原，无需重爬即可精确到天
- 坑：登录态维护、反爬频率；降低请求节奏

---

## B站 / YouTube (bilibili / youtube) — yt-dlp 自动化
- **策略**：自动化（yt-dlp / you-get），公开视频通常**无需登录**
- 流程：
  1. 取博主主页 / 频道 URL（B站 `space.bilibili.com/UID`，YouTube channel URL）
  2. `yt-dlp --dump-json --flat-playlist <URL>` 列视频，`upload_date` 直接得 `YYYYMMDD`→`date`
  3. `yt-dlp` 下载视频 / 字幕；有字幕直接用，无则转写
  4. 按 num 顺序命名 `03_逐字稿/{num:02d}_{title}.txt`
- 优势：全自动、`date` 直接来自元数据
- 坑：会员 / 私享需登录（`--cookies-from-browser`）；长视频转写耗时

---

## 博客 / 公众号 (blog / wechat) — RSS / HTTP
- **策略**：RSS 或静态 HTTP 抓取，最简单
- 流程：
  1. 博客：找 RSS feed（`/feed` 或 `/rss`），解析 entries → title / pubDate / content
  2. 公众号：经搜狗 / 浏览器或第三方桥接取文章列表与正文（**封闭生态，最难**；可走"浏览器登录"策略兜底，见下）
  3. 正文清洗（去导航 / 广告），落 `03_逐字稿/{num:02d}_{title}.txt`
  4. `date` 来自 `pubDate`
- 优势：文字天然，无需转写
- 坑：公众号封闭，需登录或第三方；动态站用 playwright

---

## 抖音 / 视频号 (douyin) — 登录会话 / playwright
- **策略**：强反爬，需登录会话或 playwright；**难度最高**（v1 留接口 + 策略文档，不保证跑通）
- 流程（建议）：
  1. 浏览器 / playwright 登录抖音网页版，请用户授权
  2. 采集作品列表（aweme id）
  3. 取文案 / 字幕；视频转写
  4. 落盘 `03_逐字稿/{num:02d}_{title}.txt`
- 坑：签名 / 加密参数、频率限制；建议限定单博主、降速、分批

---

## 如何新增一个 adapter（扩展新平台）
1. 复制上面任一模板，新建 `references/<platform>_adapter.md`
2. 实现统一契约（产出 `_ingest.json` + 落盘）
3. 在 `SKILL.md` 的「adapter 注册表」（Step 1）加一行 `platform → adapter` 映射
4. **引擎（五步）完全不用改**
> 示例：未来加「知乎 / 雪球」只需新增 adapter，下游熔合 / 溯源逻辑复用。
