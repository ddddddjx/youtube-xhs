---
name: youtube-xhs
description: >-
  YouTube / X（Twitter）链接 → 小红书两件套（Krypto说AI）。use this when 用户发来一个 YouTube 链接或 x.com / twitter.com 推文链接，
  要求下载视频、补中文字幕并产出小红书内容：① 视频版（中英字幕压制视频 + 配视频文案）② 图文版（调用 xiaohongshu-wutu-zhishika 出知识卡，或 xiaohongshu-manhua-jiangjie 出K 老师漫画讲解 + 图下文案）。
  推文视频没有字幕时用本地 Whisper 转写 + Claude 翻译
---
# YouTube / X → 小红书两件套

用户发一个 YouTube 链接或 X（Twitter）推文链接，按下面步骤一次产出两份小红书内容。账号：**Krypto说AI**（头像在图文 skill 的 `assets/`）。

## 先定位目录、判断环境（每次开始都做）

- `$Y` = 本 SKILL.md 所在目录；`$X` = 同级的 `xiaohongshu-wutu-zhishika` 目录（找不到就 `find / -type d -name xiaohongshu-wutu-zhishika 2>/dev/null | head -1`）
- 跑 `command -v yt-dlp ffmpeg; ls ~/bin/yt-dlp ~/bin/ffmpeg "/Applications/Google Chrome.app" 2>/dev/null` 判断模式：

| 模式 | 判断 | 能做什么 |
|---|---|---|
| **本地完整模式** | 用户的 Mac（有 `~/bin/yt-dlp`、`~/bin/ffmpeg`、Chrome）——Claude Code / Remote Control / Dispatch 都算 | 全流程：下载、字幕压制视频、抽帧、出卡片图、文案 |
| **云端文案模式** | claude.ai 网页 / 手机 / Cowork 云沙箱（没有上述工具） | 见下方「云端文案模式」；不下载、不压视频 |

### 云端文案模式
1. 先试 `pip install yt-dlp` 后跑 `python3 $Y/scripts/fetch.py "<URL>" <输出目录>/_work --subs-only`（只拿字幕和元数据）
2. 网络不通 / 被拒：请用户粘贴字幕文本或视频要点（不要编造内容），拿到后继续
3. 选题打分、发布状态、立场、标题封面 3 版、系列化、日志这些规则和本地模式一样。产出：`视频版/标题.txt + 正文.txt`（仅「可发布」状态；有字幕时间轴才写时间轴）、`图文版/标题.txt + 正文.txt`、`图文版/编辑用/cards.json`
4. 出卡片图：试 `python3 $X/scripts/render_cards.py`（会自动尝试 Chrome / Playwright）；失败就只交付 cards.json，告诉用户回到 Mac（或用 Dispatch / Remote Control）一句话即可出图
5. 视频版的字幕视频只能在本地完整模式做，明确告诉用户
6. 输出目录用当前环境可下载给用户的位置（如 `/mnt/user-data/outputs/`）

以下步骤默认是**本地完整模式**。依赖：`~/bin/yt-dlp`（官方独立版）、`~/bin/ffmpeg`（带 libass + videotoolbox）、Google Chrome。

## 输出目录

本地默认 `~/Documents/Krypto说AI/<YYYY-MM-DD>_<英文短标题>/`，工作文件放在其下 `_work/`：

```
<日期>_<短标题>/
  视频版/
    <短标题>_分屏.mp4          ← 上半屏原视频+黄底字幕，下半屏补充知识卡（发布用）
    <短标题>_中英字幕.mp4      ← 只带字幕的全屏版（存档 / 自己看）
    标题.txt  正文.txt       ← 可直接粘贴进小红书
    cover_candidate.png
    中文字幕.srt  中英双语字幕.srt  英文字幕.srt
    编辑用/ panel.json  panel.png
  图文版/
    01.png … NN.png   overview.jpg   标题.txt  正文.txt
    编辑用/ cards.json  avatar.png  ev_XX.png
  _work/            video.mp4、info.json、frames/ 等中间文件
```

## 步骤

### 0. 下载（后台跑，约 5–10 分钟）
```bash
python3 $Y/scripts/fetch.py "<URL>" "<输出目录>/_work"
```
同一条命令自动识别 YouTube / X 链接（X 的做法见 0.1）。读 `_work/meta.txt`：标题、频道、时长、**许可**、字幕来源、章节。
- 英文源是「自动字幕」时，告诉用户中文字幕质量会差一些
- 429 限流脚本会自动重试，不要手动反复触发

### 0.1 X（Twitter）链接
推文视频一般没有字幕，fetch.py 会：下载视频（≤1080p）→ 写推文信息（作者、推文原文、发布时间、互动数据）→ 调 `transcribe.py` 用 mlx-whisper 本地转写，按讲话语言写出 `en.srt` 或 `zh.srt`（其它语言写 `src.srt`），语言记在 `asr_lang.txt`。
- 首次转写要下载 Whisper 模型（~1.6GB，之后缓存）；10 分钟视频在 M2 上转写约 2–4 分钟
- 一条推文多个视频：先跑一遍看报错 / info，再加 `--item N`
- 下载失败提示要登录（受保护账号、敏感内容）：**先问用户**同意后加 `--cookies chrome`（读本机 Chrome 的 X 登录态），不自己加
- 推文里是 YouTube 外链卡片而不是原生视频：改用那条 YouTube 链接走原流程
- 输出目录短标题用 `x-<作者handle>-<主题>`

**补另一种语言的字幕（Claude 自己翻译，不用机翻）**：
```bash
cd "<输出目录>/_work"
python3 $Y/scripts/sub_translate.py dump en.srt tr        # 讲中文时把 en.srt 换成 zh.srt
# 逐个读 tr/batch_XX.txt，把译文写成 tr/batch_XX.zh.txt（讲中文时写 batch_XX.en.txt 的内容，文件名仍用 .zh.txt）
python3 $Y/scripts/sub_translate.py build en.srt tr zh.srt   # 讲中文时: build zh.srt tr en.srt
```
- 翻译规则：每行「序号<TAB>译文」，序号一个不能少；一条对一条，不合并不拆分；口语译成自然的中文口语，术语、产品名、人名保留英文（Claude、Agent、GPU）；每条中文尽量 ≤ 20 字，太长就意译压缩
- 先读一遍全部原文再动手，前后称呼、术语统一；Whisper 听错的专有名词（人名、公司名）结合推文原文和上下文改正，同时改 en.srt 原文
- 先看 `asr_check.txt`（置信度低的句子），对照视频那几秒（grab_frame 抽帧看画面、字幕条）判断原话，改对 en.srt；英文原文缺标点、大小写的顺手补上
- transcribe.py 已自动丢掉音乐 / 静音段的幻觉句（「Thank you」「you」「谢谢观看」等），终端里会列出丢了哪几句
- 其它语言（src.srt）：译成中文写 zh.srt，另译一份英文写 en.srt，双语成片用中英两轨
- 建好后照常走步骤 2（merge_subs.py 会按视频尺寸自动调字号和位置，竖屏字幕会往上抬，避开小红书底部按钮）

### 0.5 选题打分（先 `--subs-only` 拿到元数据和字幕就做，不等视频下完）
按 `templates/topic_score.md` 打 5 项分（满分 10），连同一句理由告诉用户：
- ≥7：继续做；5–6：说明短板（比如中文区已经有人做过），给一个能救回来的角度，让用户决定；≤4：直接建议「这条不值得做」，用户坚持再做
- 「中文区有没有人做过」要实际去小红书搜 1–2 个关键词验证（搜不了就注明没验证，该项按 1 分算）
- 同时定下：系列栏目名与期数（见「系列化」）、这条视频能不能拆成 2–3 篇（数据篇 / 人物篇 / 工具篇）
- 用户没给链接、只说「今天做什么」：读 `templates/watchlist.md`，扫各频道近 48 小时的新内容，按同一套标准打分，给出前 3 个候选

### 1. 版权与发布状态（必须告知用户，不替用户做决定）
读 `meta.txt` 的许可，定出本期的**发布状态**，后面的步骤都按它走：

| 发布状态 | 条件 | 视频版 | 图文版 |
|---|---|---|---|
| **可发布** | Creative Commons（CC BY）/ 用户说明是自己的视频 / 已获原作者授权 | 成片 + 标题.txt + 正文.txt；不声明原创，文案注明原作者 | 正常产出，可声明原创 |
| **仅供学习** | Standard YouTube License 且没有授权；X 推文视频（版权归发布者，平台不提供再利用许可）且没有授权 | 只出字幕成片，**不写**标题.txt / 正文.txt，改写一个 `视频版/仅供学习_勿上传.txt`（一句话说明原因） | 正常产出，这是本期唯一的发布物 |

- 未授权的整片搬运会被小红书查重限流、被举报后扣分，所以「仅供学习」时不给视频版发布文案；想发视频，建议用户自己出镜 / 配音解读，原片只做十几秒以内的引用
- 想拿授权：在对话里帮用户起草一封给原作者的英文授权邮件（用户自己发）；X 上起草一条给作者的英文私信
- X 推文常常是转发别人的片段（节目、发布会、播客剪辑）：先从推文和画面判断原始出处，出处和授权对象都以原始出处为准，推文作者只算转发者

### 1.5 保留版权声明（不要删）
片头片尾的「All rights reserved」「Copyright ©」、机构 logo 版权页**一律保留**：删除权利管理信息在法律上比搬运本身更严重，CC BY 也要求保留署名。
`trim.py` / `scan_edges.sh` 只用来剪用户点名要去掉的片段（赞助商口播、长时间静场），不能用来剪版权页；用了就在交付时写明剪了哪几段。

### 2. 字幕合并 + 分屏成片（后台，75 分钟视频约 10 分钟）

成片一律是**上下分屏**：上半屏原视频 + 账号黄底中英字幕，下半屏一张固定的补充知识卡（讲者 / 课程背景 / 关键概念 / 我的思考）。细则见 `templates/video_panel.md`。

```bash
cd "<输出目录>/_work" && python3 $Y/scripts/merge_subs.py en.srt zh.srt .   # 出 bilingual.ass + bilingual_box.ass
# 写 视频版/编辑用/panel.json（讲者 / 课程背景 / 关键概念 / 一条判断；小标题不写「我的思考」这类标签词）
python3 $Y/scripts/render_panel.py "<输出目录>/视频版/编辑用/panel.json" "<输出目录>/视频版/编辑用/panel.png"
bash $Y/scripts/compose_split.sh "<输出目录>/_work" "<输出目录>/视频版/编辑用/panel.png" \
     "<输出目录>/视频版/<短标题>_分屏.mp4"
```

- **Read 一眼 panel.png**：最后一行碰到页脚线就删内容，别改字号
- 压完用 grab_frame 抽 2 帧（挑有字幕的秒数）看：黄底字幕清不清楚、上下分界有没有压到人脸
- 只要全屏带字幕版（存档、或者原片本身就是竖屏）时用：
  `bash $Y/scripts/burn.sh "<输出目录>/_work" "<输出目录>/视频版/<短标题>_中英字幕.mp4"`（只要中文加参数 zh）
- 复制 `zh.srt / bilingual.srt / en.srt` 为 `中文字幕.srt / 中英双语字幕.srt / 英文字幕.srt` 到 `视频版/`

### 3. 读字幕，提炼内容（压制期间做）
- 按分钟读 `en.srt`，列出：核心问题、5–7 个关键论点、所有硬数字、讲者身份
- X 短视频（几十秒到几分钟）：论点通常只有 1–3 个，结合推文原文和评论区语境补背景；时间轴只在视频 ≥3 分钟时写，图文版做 3–5 页，别为了凑页数注水
- 数字以画面课件为准（步骤 4 看到的图表），口头数字冲突时用课件并注明
- **全部用自己的话总结**，不整段翻译字幕；原话引用每份产物不超过 1–2 句
- **先要立场再写文案**：提炼完后，把 3 个最可争论的点列给用户，问一句「你站哪边 / 你怎么看」。「我的看法」和图文版的判断页都围绕这句立场展开——纯摘要谁都能做，立场才是读者关注的理由，也是平台认定原创的依据。用户说「你定」或没法问（定时任务）时自己选一个有立场的判断，交付时标出「立场是我替你选的，发之前改成你自己的话」

### 4. 抽关键帧
```bash
python3 $X/scripts/extract_keyframes.py "<输出目录>/_work/video.mp4" "<输出目录>/_work/frames"
```
Read `contact_N.jpg`，挑 3–4 张 PPT / 图表帧（规则见 `$X/templates/video_keyframes.md`），用 `$X/scripts/grab_frame.sh` 抽原分辨率帧（动画页往后挪几秒）。另挑 1 张做视频封面候选 `视频版/cover_candidate.png`。

### 5. 产物一：视频文案（仅「可发布」状态；「仅供学习」跳过本步）
按 `templates/video_post.md` 写 `视频版/标题.txt`（一行，≤20 字）和 `视频版/正文.txt`：钩子、**时间轴**、3 条要点、「我的看法」（写成完整句子，不留占位）、互动问题、原视频出处、标签。

时间轴是长视频文案里读者最常用的部分，要写成 `12:30 ｜ 小标题　一句话说明这段讲了什么`，8–12 条、覆盖全片，让人能直接跳到自己想看的段落。时间必须对着字幕文件核对。

**文案文件一律纯文本，能原样粘贴进小红书**：不用任何 Markdown 符号（`#` 标题行、`**`、`- ` 列表、`>`、反引号、`==`、`---`），不留「（在这里写…）」之类提示——要提醒使用者的话写在对话里。

### 6. 产物二：图文版
**先选格式**（用户没指定就按内容判断，并在汇报里说明选了哪种）：

| 格式 | 适合 | 做法 |
|---|---|---|
| **知识卡**（默认） | 数据多、有课件截图、研报式内容 | 按下面 1–8 步 |
| **漫画讲解** | 讲概念 / 原理 / 方法论、逻辑链清楚但没什么图表；用户说「漫画版」「K 老师」 | 按同级 `xiaohongshu-manhua-jiangjie/SKILL.md`：先提炼逻辑链，再编一个小故事让K 老师和小白演出来，写 `图文版/编辑用/comic.json` 出图。下面第 5–8 步（文案、标题 3 版、出处）照旧；封面 3 版改为 covers.json 里 3 个 cover 页单独渲染到 `封面备选/`（画面相同，只换 `kicker` 引子 + `title` 大问句，分别用痛点型 / 数字型 / 反常识型）。**漫画版不适用下面第 2 步的「封面第一行写信源」**：漫画封面是「黄底引子 + 大问句 + 一个 K 老师配道具 + 栏目名」，不放关键词块和台词，图上不出现「原帖 / 作者 / X 爆帖」这类字样，出处只写在 正文.txt |

按 `$X/SKILL.md`（有证据卡 → 罗尼研报笔记轨）：
1. 复制 `$X/assets/avatar.png` 和选中的 `ev_XX.png` 到 `图文版/编辑用/`
2. 写 `cards.json`：`account` = `{"name": "Krypto说AI", "avatar_image": "avatar.png", "date": "<今天 MM/DD>"}`；5–7 页；**封面标题第一行写信源**（「Dan Koe 长文：」「CMU 公开课：」），和结论同样的大字，写进标题后就不要再加左上角小角标；证据卡 caption 写来源
3. `python3 $X/scripts/render_cards.py 图文版/编辑用/cards.json 图文版/`
4. **Read overview.jpg 检查**：溢出、留白、证据卡太小 → 改 cards.json 重出
5. 写 `图文版/标题.txt` 和 `图文版/正文.txt`（罗尼轨：新闻句标题 → 机构日期开篇 → 结论 → 我的立场 → 互动问题 → 下一期预告 → 出处与截图版权说明 → 密标签），同样纯文本、可直接粘贴
6. **标题 3 版**：`图文版/标题备选.txt` 三行，分别是数字型 / 冲突型 / 人物型（每行 ≤20 字）；你认为最强的那条同时写进 `标题.txt`，在对话里说明理由。每条标题都要带一个用户会搜的关键词（Claude、Cursor、Agent、人名、机构名）——小红书过半流量来自搜索
7. **封面 3 版**：写 `编辑用/covers.json`（只含 3 个封面页，对应三种标题角度，其余字段同 cards.json；三版都保留标题第一行的信源），`python3 $X/scripts/render_cards.py 图文版/编辑用/covers.json 图文版/封面备选/`。封面按 `$X/templates/xhs_heili_engagement.md` 执行：大字 = 权威 / 数字 / 术语，加一行可争论的立场钩
8. 出处只写「来源：频道名 · 视频标题」（X：「来源：作者名 @handle · X」；有原始出处就写原始出处），**不放任何链接**，不写「去油管搜」之类的话（会被判站外导流）

视频版和图文版的标题、角度要**有区分**：视频版偏「带你看」（时间轴导览），图文版偏「帮你算清楚」（数据与判断）。

### 6.5 系列化
- 固定栏目名 + 期数，写在封面角标和正文第一行，例如「硅谷一手｜第 12 期」。期数从 `log.csv` 里同栏目的最大期数 +1（没有记录就问用户）
- 封面版式每期保持一致，主页网格才像一本杂志
- 不放「求关注」式 CTA；正文倒数第二段用一句话预告下一期（「下一期拆 XX」），给读者一个关注的理由
- 一条长视频拆成多篇时，每篇单独一个子目录、单独一行 log，隔天发，不要同一天发完；同一条视频的视频版和图文版也隔天发

### 7. 交付
- 先跑 `python3 $Y/scripts/check_paste.py "<输出目录>"`，有 ✗ 就改到全部 ✓；⚠（极限词、投资用语）逐条看，能换说法就换
- 记一行发布日志：`python3 $Y/scripts/post_log.py add --dir "<输出目录>" --series "<栏目名>" --no <期数> --topic <选题类型> --title-type <数字|冲突|人物> --score <选题分> --title "<标题>"`
- SendUserFile：`视频版/编辑用/panel.png`（可发布状态）、`图文版/overview.jpg`、`图文版/封面备选/overview.jpg`、`标题.txt` + `标题备选.txt` + `正文.txt`（可发布状态再加视频版两份）
- 汇报：选题分、发布状态（可发布 / 仅供学习）及原因、产物路径、视频时长 / 大小、字幕来源、三个标题和封面里你推荐哪个、需要用户补的地方（立场、校对字幕）
- 提醒：发布 48 小时后把数据告诉我（曝光、点击率、收藏、涨粉），我来回填 log
- 不自动登录小红书、不代发

## 数据复盘
日志在 `~/Documents/Krypto说AI/log.csv`（post_log.py 自动建）。
- 用户报数据时：`python3 $Y/scripts/post_log.py fill --dir "<输出目录>" --impr 12000 --ctr 8.5 --saves 300 --follows 45`
- 用户说「复盘」，或 log 里已回填的篇数每满 10 篇：`python3 $Y/scripts/post_log.py report`，读各选题类型 / 标题类型的平均点击率、收藏率、单篇涨粉，告诉用户哪类该加量、哪类该停；结论同步改进 `templates/topic_score.md` 末尾的「复盘校准」一节（改源码目录那份，再跑 build.sh）
- 判断标准：点击率 <5% 先换封面标题；点击率高但收藏率低说明内容没干货；收藏高但涨粉低说明缺立场和系列感

## 常见问题
- 429 限流：fetch.py 已自动重试；仍失败就过 10 分钟再跑 `--subs-only`
- 中文字幕条数比英文少：正常，YouTube 按整句翻译；ass 里中英两层各用自己的时间轴
- `meta.txt` 显示中文「译自自动英文字幕，质量较差」但英文是人工字幕：YouTube 这次没列出人工字幕的中文译本（时有时无）。告诉用户，并提议过 10–30 分钟删掉 `_work/zh.srt` 重跑 fetch.py（只会补下中文，不重下视频），拿到更好的译本后再合并压制
- Chrome 截图卡住：render_cards.py 已处理（PNG 写完即结束进程）
- 视频是 VP9：burn.sh 会转 H.264，手机和小红书都能播
- X 下载报「No video could be found」：推文里没有原生视频（图片 / 外链卡片）；报登录相关错误：见 0.1，征得同意再加 `--cookies chrome`
- Whisper 模型下载很慢或失败：`~/.cache/huggingface/` 里的下载会续传，重跑 fetch.py 即可；国内网络下可以问用户是否同意用镜像：`HF_ENDPOINT=https://hf-mirror.com python3 $Y/scripts/fetch.py …`
- 找不到 mlx-whisper：`uv tool install mlx-whisper`（没有 uv 先装 uv）；只转写不重下视频：`python3 $Y/scripts/transcribe.py "<输出目录>/_work"`
- 转写出现重复句 / 静音处有幻觉字幕：transcribe.py 已关掉上文条件并过滤长静音；仍有就手工删掉那几条，或加 `--lang en` 指定语言重跑
