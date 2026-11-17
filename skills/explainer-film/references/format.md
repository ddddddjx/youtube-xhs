# plan.json 字段、通用镜头、写法规矩的由来

## plan.json

| 字段 | 说明 |
|---|---|
| `title` / `account` / `slogan` / `source` | 片名；片尾账号名和 slogan；原声卡片左上角「某某 原声 \| source」 |
| `steps` | 路线图的几步（一般三步），通用镜头 roadmap / recap / ending 都用它 |
| `narration` | 配音参数：speaker、rate、fidelity、pause、ctx（不写就用 tts.py 的默认） |
| `lines` | `[[id, 旁白全文], ...]`。一句一个句号 / 问号，合成时按句切开、句间停顿 |
| `clips` | `{id: {segs: [[起, 止], ...], who, layout, subs: [[起, 止, 英文, 中文], ...], mute}}`。segs / subs 都是片源秒数（transcript.json 的时间）；`mute: true` 只要画面 |
| `plan` | 镜头顺序：`["clip", id, 前置停顿]`、`["nar", id, 停顿]`、`["bridge", 原声id, 0, "过桥一行字"]`。停顿不写默认 0.45，片头第一段写 0 |
| `footage` | `{旁白id: [片段id, rect, 片段内起点]}`：这段旁白的画面放原片（静音）。连续几段 footage 首尾相接 |
| `scenes` | `{旁白id: {type, ...}}`，通用镜头的文字；项目 scenes.js 写了同 id 的镜头就以 scenes.js 为准 |
| `bgm` | `{file, gain_db, title, credit}`，bgm.py use 会写 |
| `tail` | 片尾停留秒数，默认 2.5 |

`layout` / `rect`：`center`（原声居中大卡）、`left`（原声在左，右栏 x 1110–1890 给小图，`KIT.panels[id]`）、`wide`（开场人物介绍）、`mini`（过桥小窗）。位置在 `scripts/rects.json`。

## 通用镜头（kit.js 的 GEN，scenes[id].type）

| type | 用在 | 字段 |
|---|---|---|
| `intro` | 开场人物介绍（画面是 footage） | chapter、headline [白, 金]、names [[名牌文字, 横向比例 0–1, 出现延迟秒]] |
| `answer` | 问题 + 答案先放在前面 | headline [白, 金]、answer [白, 金]、card（金卡上的词）、cue_answer、cue_card |
| `judgment` | 判断盖章 | headline、card、card_sub、stamp、premise [胶囊, 一行]、cue_stamp、cue_premise |
| `roadmap` | 分几步看 | （读 steps；旁白里「第一 / 第二 / 第三」开头的字幕出现时点亮） |
| `recap` | 这一步只要记住一句 | step（0 起）、sentence（逗号分两行，最后一段金色） |
| `ending` | 回到开头的判断 + 账号名 | card、stamp、line、cue |
| `pill` | 普通旁白段的兜底 | step 或 chapter、pill [中文, 英文斜体]、big [一两行大字] |

`cue_*` 是正则，匹配旁白字幕的文字来定出现时间（**按内容找，不按第几行**：长句会被拆成几行，按行号会错位，11-02 踩过）。

项目专用镜头写在 `$W/scenes.js`：`(function (K) { K.S.n3 = (t, seg) => {...}; K.panels.C4 = (lt, seg) => {...}; })(window.KIT);`，组件见 kit.js 末尾的 `window.KIT`。过桥段的 id 是 `bridge_<原声id>`。

## 规矩是怎么来的（11-02 Claude Code 团队片，v1 → v7）

| 版本 | 用户说 | 改成 |
|---|---|---|
| v1 | 旁白「我拆成三个转变」：讲解片不该用「我」 | 旁白客观讲述，不用「我」当主语 |
| v1 | 旁白 75 秒 / 原声 42 秒反了 | 原声为主（约 70 秒），旁白串场点题 |
| v1 | 克隆声音没情感、太平 | 加语气指令（后来 v4 又换了口吻） |
| v1 | 开头要像 Jim：画面用原片，旁白快速交代背景人物 | 人物介绍段放原片（全景 / 主持人 / 嘉宾）+ 名牌 |
| v3 | 学 Jim 的旁白形式：开场给判断和答案 | 问题 → 答案先放在前面 → 判断 → 三步路线图 → 每步回顾 → 片尾回到判断 |
| v3 | 问题 / 判断 / 路线图这几段也要带原片 | 左原片右图示的版式（footage + rect left） |
| v3 | 配乐全程垫着、lo-fi 太平；可以超过 2 分钟 | 配乐只轻压；不卡时长 |
| v4 | 旁白太快、没停顿、AI 感重 | 按句合成句间停 0.45 秒；语气指令改聊天口吻（「兴奋、惊讶」像表演） |
| v5 | 语速 15 又太慢 | 语速 25 |
| v6 | 进鼓前配乐几乎听不到；开头先放 3–5 秒原片钩子 | 鼓点从 0 秒；片头一句完整原话 |
| v7 | 要现成的配乐，给五条选 | incompetech 五首叠旁白试听，用户选 Voxel Revolution，音量 +10% |

## 11-17 哈佛幸福研究片（第二条）用户改的三条

| 用户说 | 改成 |
|---|---|
| 旁白「这个结论站得住吗？站得住」是「自问自答的愚蠢回答」 | 旁白只用陈述句；判断 / 前提让原声说；answer / judgment 镜头和片尾盖章不用 |
| 「很多画面里可以直接把原素材的画面抹掉，只保留原声的音轨」，用自己的动画配合讲解 | clips 加 `audio_only: true`，画面整屏由 scenes.js 重画；原片只留钩子和人物介绍 |
| 我的声音「非常平，没有任何的情感和节奏变化」 | 每句〔情绪指令｜k｜s｜g〕：请求口吻的指令 + rubberband 逐句变调变速 + 音量，按情绪曲线标 |

整屏动画的写法见 `发布/2026-11-13_harvard-good-life/编辑用/scenes.js` 文末（S.C1 年代轴 + 724 光点、S.C2 三个被划掉的符号 → 全屏关系网、S.CQ 人群里的孤独 / 数量 vs 质量、S.q1 几万页压成一句话）。注意 dot() 要乘在外层透明度上，不然外层淡出不生效。
