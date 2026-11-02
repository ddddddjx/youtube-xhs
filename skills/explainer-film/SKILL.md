---
name: explainer-film
description: >-
  原声解说片（Krypto说AI，11-02 起）：用户发来一段访谈 / 对谈 / 演讲的原视频（可以分几段 mp4），做成 Jim AI Notebook 式的
  横版 1920×1080 解说视频：片头 3–5 秒原片钩子 → 原片画面上快速交代背景和人物 → 抛问题、答案先放在前面、给判断 → 三步路线图 →
  每步「旁白串场 + 原片原声（中英双语字幕）+ 代码画的可视化」→ 每步结尾「这一步只要记住一句」→ 片尾回到判断。
  旁白用用户自己的复刻音色（火山豆包声音复刻 2.0），配乐全程垫底，交付成片 + meme-v2 封面 + 三个标题 + 正文。
  use this when 用户发来视频素材说「做个讲解视频 / 解说视频」「像 Jim 那样」「原声 + 可视化」「用我的声音配音」「/explainer-film」。
  竖版短视频、纯字幕无旁白的知识片、没有原片素材的科普片不用这个（分别是 youtube-xhs、vibe-knowledge-film、science-film）。
---
# explainer-film：原声 + 可视化 + 用户音色的横版解说片

范例（用户看过 7 版、逐条改出来的）：`发布/2026-11-02_claude-code-team/`，成片 `成片.mp4`（2:43），它的 `plan.json` + `scenes.js` 在 `templates/claude-code-team/`。对标拆解：`对标/Jim_AI_Notebook/拆解.md`。本目录记作 `$E`，工作目录 `发布/<日期>_<英文短名>/编辑用` 记作 `$W`。

一期的全部内容写在 `$W/plan.json`（旁白稿、原声片段和双语字幕、镜头顺序、每个镜头显示的字）；想要专门的画面（气泡、清单、代码块之类）再写 `$W/scenes.js`。脚本每期不改。

## 流程

### 0. 准备（云端环境）
```bash
apt-get install -y fonts-noto-cjk >/dev/null 2>&1 || (apt-get update && apt-get install -y fonts-noto-cjk)
pip install -q faster-whisper scipy        # 转录；scipy 给 tools/bgm_drive.py
mkdir -p $W && cp $E/templates/gitignore $W/.gitignore
```
读 `CLAUDE.md`、`账号/档案.md`（长期立场 A–D）、`对标/Jim_AI_Notebook/拆解.md`。

### 1. 素材：合并、转录、看画面
```bash
python3 -I $E/scripts/prepare.py $W <上传的 part-00.mp4> <part-01.mp4> ...   # src/full.mp4、sheets/、transcript.json/.txt
```
21 分钟素材转录约 15 分钟，放后台跑（等它结束用 `until grep -q ... log`，**不要用 `pgrep -f 脚本名`，会匹配到等待命令自己，永远等不完**）。看 `sheets/` 和原片开头的人名字幕条，记下谁是谁、谁坐哪。

### 2. 写稿前先问（硬规则，等回答）
按 `CLAUDE.md`「写稿前先问」：150 字摘要 + 候选原声表（编号、时长、谁、原话要点、中文意思）+ 问题 ①–⑤（代价 ⑥ 用户说跳过就跳过）。用户挑原声编号、答立场。长期立场 A–D 用户记不住，**问 ④ 时把四条原文列出来**并给一个推荐。回答原样记进 `$W/source.md`。

### 3. 切原声、核对谁在说
```bash
python3 -I $E/scripts/words.py $W 95 115 226 245        # 词级时间戳，片段切到词
python3 -I $E/scripts/frames.py $W 33 45 102 578        # 截画面核对说话人 → renders/frames.jpg
```
每段原声只留最关键的一两句（一段 5–25 秒），多段可以拼（剪口自动放大 7% 遮跳切）。写进 `plan.json` 的 `clips`（`segs` 片源秒数、`who`、`layout`、`subs` 中英字幕），再加开场要用的静音画面（全景、主持人近景、双人镜头；`mute: true`）。
```bash
python3 -I $E/scripts/cut_clips.py $W      # clips/<id>.mov + clips.json
```

### 4. 写旁白稿和分镜（先给用户看，定了再配音）
结构固定，照 Jim 的旁白形式（用户 11-02 逐条定的，见 references/format.md）：

| 段 | 画面 | 旁白 |
|---|---|---|
| 钩子 | 原片 3–5 秒，**一个人把一句完整的话说完**，双语字幕 | 无 |
| 人物介绍（o1–o3） | 原片全景 → 主持人近景 → 嘉宾，顶部一行大标题，卡片下名牌 | 这是谁放出的什么对谈；负责提问的是谁；另外几位是谁、在做什么 |
| 问题 + 答案（q1） | 左原片 / 右答案卡 | 抛问题，「答案先放在前面：……」 |
| 判断（q2） | 左原片 / 右盖章 + 前提 | 「这句话站得住吗？站得住，但有一个前提：……」（前提要出自原声，不是自己编的） |
| 路线图（q3） | 左原片 / 右竖排三步 | 「分三步看：第一……第二……第三……」 |
| 每一步 | 动画（一句话一个动作）→ 原声卡片 + 右侧小图 | 旁白只串场点题，故事让原片里的人自己讲 |
| 每步回顾（r*） | 「这一步只要记住一句」卡 | 一句话，逗号分两行 |
| 收尾 | 回到开头的判断卡 + 章 + 账号名 | 回到判断 + 一句立场（stance_line），只这一句是个人立场 |

规矩：
- **旁白不用「我」当主语**（「我拆成三个转变」被划掉），客观讲述；多写问句和短句，起伏靠标点。
- **原声为主、旁白为辅**（用户定过原声约 70 秒、旁白约 40 秒，后来旁白放慢到 80 秒也接受）；**不硬卡 2 分钟**。
- 开场判断和片尾判断是同一句，中间只出现一次个人立场。
- 一个贯穿形象（范例是「人 → Claude 的指令线」：气泡 → 目标卡），每一步只改它一样东西。
写进 `plan.json` 的 `lines`、`plan`、`footage`、`scenes`、`steps`，把旁白表发给用户确认。

### 5. 配音（用户音色）
```bash
python3 -I $E/scripts/tts.py $W --try "一年前用 Claude Code，是你说一句、它做一步。" /tmp/claude-0/try.wav   # 先试一句
python3 -I $E/scripts/tts.py $W            # 全部旁白 → narration/<id>.wav
```
默认：音色 `S_DRo7Kc2k2`、语速 25、还原模式关、聊天口吻语气指令、按句合成句间停 0.45 秒（都是用户试听定的，见 `tools/volc-voice/README.md`）。改了某句只重配那句：`tts.py $W q2`。

### 6. 时间线 → 静帧 → 整片
```bash
python3 -I $E/scripts/build_timeline.py $W           # timeline.json；原片不够长会提示
node $E/scripts/render.js $W --stills 3 15 30 60     # renders/still_*.png，先看版式
node $E/scripts/render.js $W 30                      # renders/anim.mp4，2:40 的片约 11 分钟，放后台
```
只改了一小段（某句字幕、某个镜头）：`node render.js $W 30 11 18` 渲那 7 秒，再按帧号拼回 anim.mp4（`trim=end_frame / start_frame` + concat），不用整片重渲。

### 7. 配乐
```bash
python3 -I $E/scripts/bgm.py $W search                                   # incompetech 曲库筛候选
python3 -I $E/scripts/bgm.py $W preview "Tech Live" "Voxel Revolution" …  # 5 首 30 秒试听，叠开场旁白，发给用户挑
python3 -I $E/scripts/bgm.py $W use "Voxel Revolution"                   # → audio/bgm.wav，写进 plan.json
```
用户 11-02 的结论：配乐**从第 0 秒就要有节奏**（只有和弦的前奏几乎听不见），全程垫着，人说话只轻压；lo-fi 和自己合成的电子乐都嫌平，选了现成曲。也可以 `python3 tools/bgm_drive.py <秒> audio/bgm.wav bright 0` 合成原创曲。音量在 `plan.json` 的 `bgm.gain_db`（现在 -11 dB）。

### 8. 合成、检查、交付
```bash
python3 -I $E/scripts/compose.py $W        # renders/final.mp4，-14 LUFS
```
检查：抽 10 个时间点的帧拼图看（原片在卡片里、字幕、小图）；分段 `volumedetect` 看旁白和原声差在 2 dB 以内；整片 `ebur128` 约 -14。我听不到声音，**语气、剪口、配乐强弱要用户听**，交付时明说。

交付到 `发布/<日期>_<名字>/`：`成片.mp4`、`封面.png`、`标题.txt`、`标题备选.txt`、`正文.txt`、`storyboard.md`。
- **封面**：用 meme-v2 原版首页做 3:4（一行标题 + 两段正文 + 片头钩子那帧人脸），`skills/meme-xhs/scripts/render_meme.py`，只要 `01.png`。正文第一段写钩子那一刻（谁、在哪、说了什么不对劲的话），第二段写答案。
- **标题**：按 meme-v2 标题规则三条三种句式（结论句 / 钩子悬念句 / 情绪 + 名字），20 字内，可搜词在前 6 字；主标题跟封面同一句。
- **正文.txt**：第一段问题 + 答案（带关键词）→ 判断 → 三步要点 → 收尾判断 → 二选一互动（「评论区打 A 或 B」）→「原声来自 X 官方视频，中文字幕和旁白为 AI 辅助制作」→ 配乐署名 → 标签。跑 `skills/youtube-xhs/scripts/check_paste.py`。
- 发 SendUserFile；commit、开 PR 合进 main；CLAUDE.md 摘要记一行。

## 文件
- `scripts/prepare.py` 合并 + 拼图 + 转录；`words.py` 词级时间戳；`frames.py` 截画面核对说话人
- `scripts/cut_clips.py` 切原声 / 静音画面；`tts.py` 用户音色配音；`bgm.py` 配乐挑选
- `scripts/build_timeline.py` 时间线；`kit.js` 组件库 + 通用镜头；`render.js` 逐帧渲染；`compose.py` 合成
- `scripts/rects.json` 原片卡片位置（center / left / wide / mini），kit 和 compose 共用
- `templates/claude-code-team/` 范例 plan.json + scenes.js；`templates/gitignore`
- `references/format.md` plan.json 字段、通用镜头、写稿规矩的由来；`references/pitfalls.md` 踩过的坑

## 不动的硬规则
- 写稿前先问，等回答；用户说「你定」才按默认。
- 原声只用对画面核过说话人的；字幕忠实原话，不加戏。
- 旁白不用「我」；个人立场只在判断和片尾那一句。
- 正文写明 AI 辅助和原声出处；配乐要署名的写署名，不放网址；不代发。
