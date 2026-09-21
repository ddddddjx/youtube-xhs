# 视频关键帧 → 证据卡（YouTube 视频蒸馏）

把 YouTube 讲座 / 访谈 / 发布会视频做成小红书图文时，从视频里抽 **PPT、图表、数据可视化** 画面，放进卡片底部的「信源证据卡」。
与罗尼研报笔记轨天然匹配（证据卡本来就是它的 DNA）；默认五图轨也可在 1–2 页放一张小证据图。

脚本都在 `scripts/`，依赖：ffmpeg（`~/bin/ffmpeg` 或 PATH）、yt-dlp（`~/bin/yt-dlp`）、macOS Google Chrome。

---

## 流程

### 1. 下载视频和英文字幕

```bash
~/bin/yt-dlp --ffmpeg-location ~/bin \
  -f "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b" --merge-output-format mp4 \
  --write-subs --write-auto-subs --sub-langs "en.*,en" --convert-subs srt \
  --write-info-json --no-playlist -o "<工作目录>/video.%(ext)s" "<URL>"
```

- 优先用人工字幕（`video.en-<id>.srt`），没有才用自动字幕（有滚动重复行，要先合并）
- 读字幕提炼观点；**文案用自己的话总结**，只引用极少原话
- 遇到 HTTP 429：等 1–2 分钟重试

### 2. 抽候选帧，先看总览图

```bash
python3 scripts/extract_keyframes.py <video.mp4> <工作目录>/frames
```

- 2fps 场景检测 + 最小间隔 8s 去重，34 分钟视频约 1 分钟跑完
- 输出 `contact_N.jpg`（4×4，每格标 `#序号 分:秒`）→ **先 Read 总览图再挑**
- 候选太多：`--scene 0.35`；漏了翻页：`--scene 0.18 --min-gap 4`

### 3. 挑帧规则

| 要 | 不要 |
|---|---|
| 全屏 PPT、图表、数据表、产品界面 | 讲者特写、观众、空白过渡页 |
| 数字清晰、标题可读的那一帧 | 翻页动画中途（元素还没出齐） |
| 每张图对应一页论点 | 纯装饰、和本页观点无关的图 |

- 候选帧常是动画刚开始的一帧，**往后挪 2–5 秒**再抽（例：候选 26:16 是空白页，26:32 才出齐）
- 课堂镜头里的投影幕布太小时，优先找同一页的全屏版本；实在没有再用 crop 裁出幕布
- 一帖证据图 **3–4 张为宜**，只做引用佐证，不搬运整套课件

### 4. 抽原分辨率帧（可裁剪）

```bash
scripts/grab_frame.sh <video.mp4> <秒数> <输出.png> [w:h:x:y]
# 例：scripts/grab_frame.sh video.mp4 1592 ev_02.png
# 例：scripts/grab_frame.sh video.mp4 900 ev_05.png 1100:620:410:40   # 只要幕布区域
```

### 5. 写 cards.json 并出图

格式见 `scripts/render_cards.py` 顶部注释。要点：
- `==整句==` → 藏青加粗完整判断句（一页 1–2 句，必须成句）
- `evidence.caption` **必须写来源**：`课件截图｜<图名> · <频道/机构>`
- 有证据卡的页：正文 2 段以内，否则挤压图片
- 纯文字页自动放大字号；内容仍撑不满时补一个观察点或结尾问题，别留半页空白

```bash
python3 scripts/render_cards.py <cards.json> <输出目录>
```

输出 `01.png…NN.png`（1080×1440）+ `overview.jpg`。**必须 Read overview.jpg 检查**：文字溢出底边、证据卡过小、大块留白。

### 6. 图下文案（标题.txt + 正文.txt）

按罗尼轨：新闻句标题 → 首句「机构 + 日期 + 课程/报告名」→ 2–4 句可带走结论 → 结尾可评论问题 → 视频出处 + 截图版权说明 → 密标签。

**纯文本、能原样粘贴进小红书**：`标题.txt` 一行 ≤20 字；`正文.txt` 不用任何 Markdown 符号（`#` 标题行、`**`、`- ` 列表、`>`、反引号、`==`、`---`），不留占位提示。写完跑 `python3 <youtube-xhs 目录>/scripts/check_paste.py <目录>（youtube-xhs 与本 skill 同级）` 检查。

---

## 版权与合规

- 视频本体（含压字幕版本）只用于自己学习，不上传小红书
- 证据图是「引用」：数量少、标来源、配自己的分析；不整页翻译课件、不逐字搬运字幕
- 不截讲者肖像做封面主图
- 账号名 / 头像用使用者自己的（`cards.json` 的 `account`），**不得冒用样张里的罗尼先生**

## 已验证案例

Stanford MS&E435《Economics of the AI Supercycle》Lecture 1（34 分钟）：53 张候选 → 选 4 张课件（05:42 倒三角、26:32 收入 5 倍、28:10 毛利占比、28:56 AI 应用周活）→ 6 页罗尼轨卡片，渲染约 15 秒。
