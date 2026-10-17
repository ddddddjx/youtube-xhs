---
name: x-wechat
description: >-
  素材 / 已写好的 meme 稿 → 推特中文 thread（5 到 10 条）+ 公众号长文，一键推出去（Krypto说AI，10-17 起）。
  云端写稿、出封面、打包、检查；Mac 上一条命令发布：公众号推进草稿箱、用户去后台点发表，
  X 在终端列出整条 thread、用户输入 y 才发。use this when 用户说「发推特」「发 X」「发公众号」「推特 thread」
  「同步到推特和公众号」「一键发布」，或者给了素材要同时出推特和公众号版本。
---
# x-wechat：推特 thread + 公众号长文

**一句话**：同一篇稿子出两份，推特是中文 thread，公众号是长文。写稿流程、口吻、人设都照小红书那套走，这个 skill 只管两件事：改成这两个平台的形状，以及把它发出去。

用户 10-17 定的：中文、同一个 AI builder 人设；推特发 5 到 10 条的 thread；公众号已认证，接口推草稿箱；**最后一下由用户点**（公众号后台点发表，X 在终端输入 y）。这一点跟 CLAUDE.md「不代发、按平台入口标注 AI 辅助」那条规矩是对上的，不要加 `--yes` 之类的跳过开关。

## 为什么发布在 Mac 上跑

云端会话连不上 `api.x.com`、`upload.twitter.com`、`api.weixin.qq.com`（10-17 测过，三个都超时）。公众号接口还有 IP 白名单，GitHub Actions 每次换 IP，用不了。所以：

- **云端**：写稿 → 终稿重写 → 出公众号封面 → 打包 → 检查 → commit + push
- **Mac**：`git pull` → `publish.py wechat` / `publish.py x` → 把 `posted.json` commit + push

## 文件

- `$W` = 本目录。`scripts/thread_check.py`（推特检查 + 打包）、`scripts/prep_wechat.py`（公众号 HTML + 图压缩 + 打包，要 Pillow）、`scripts/publish.py`（Mac 上跑，只用标准库）、`publish.env.example`（凭证模板）
- `$M` = 同级 `meme-xhs`：writing_guide、meme_check、`render_wechat.py`（公众号封面 / 标题 / 摘要 / 正文.md，规则见 `references/wechat_cover_guide.md`）
- 输出：`发布/<YYYY-MM-DD>_<英文短标题>/` 下面的 `推特版/` 和 `公众号版/`，跟小红书的 `meme版/` 放同一个目录

## 流程

### 1. 先有一份 draft.md

- **这篇小红书已经做过**：直接用 `meme版/编辑用/draft.md`，跳到第 2 步。
- **新素材**：照 CLAUDE.md 走「写稿前先问」，按 `/meme-xhs`（或 `/own-xhs`）写 `meme版/编辑用/draft.md`。只发推特和公众号时，小红书的图可以不出，draft.md 和它的检查照做。篇幅不受小红书页数限制，公众号长文可以写到 3000 到 5000 字。

### 2. 终稿重写（用户 10-16 定，每篇必走）

thread.md 写完、跑 thread_check 之前，按下面这段把 thread 全文重写一遍（draft.md 在第 1 步已经按 meme-xhs 的要求重写过的，不用再重写）。用户原话照收：

> 请全面化身为顶级语言风格编辑、真人表达校准师与AI痕迹清除专家。在不改变原文事实、核心观点和重要信息的前提下，对全文进行深度重写。删除空洞开场、正确但没有信息量的废话、机械连接词、过度完整的排比、重复总结、虚假的情绪升华和教科书式表达。重新调整句子长短、停顿节奏、观点顺序和用词密度。加入符合语境的真实细节、自然转折和明确立场，允许存在克制的不完美。禁止堆砌网络热词、故意口语化、编造个人经历、增加原文没有的事实，以及把文章改成另一种模板化文风。

本账号的执行口径和 `../own-xhs/SKILL.md` 同名一节一样：细节只从素材原文、`账号/经历库.md`、用户这次给的原话里取；立场只用用户给过的判断和观点库；改前那版存 `推特版/thread_v1.md`。

### 3. 推特 thread：`推特版/thread.md`

格式：一条推一段，段和段之间单独一行 `---`；配图单独一行 `![说明](文件名)`，文件名跟 draft.md 里的一样，脚本会去 `meme版/编辑用/` 找。

写法（都是从 draft.md 改，不另起炉灶）：
- **第 1 条**就是 draft.md 的开头三句压短：第一句判断或「我」的处境，第二句理由，第三句事实（writing_guide 第 3 节）。可搜词放这条。证据截图放第 1 或第 2 条。
- **一条一件事**，每条单独被转出去也看得懂。中文一条大约 120 到 140 字，留余量，不要条条顶到 280。
- 「他说」的原话、数字、时间锚照 draft.md 搬，不在推特版里加新事实。
- **最后一条**停在一句判断上。不写「关注我」，不写「🧵」「1/」编号，不预告下一期。
- 小红书的禁区（不引流站外）推特上不适用，但也不往公众号导流，除非用户这篇要求。

```bash
python3 $W/scripts/thread_check.py 发布/<目录>
```

拦：单条超过 280（中文、全角标点、emoji 算 2，链接算 23）、一条超过 4 张图、图找不到 / 超 5MB、极限词。提示：条数不在 5 到 10、标签超过 2 个、中间某条太短。过了才写出 `推特版/thread.json`。

### 4. 公众号长文

```bash
python3 $M/scripts/render_wechat.py 发布/<目录>/meme版/编辑用/draft.md 发布/<目录>/公众号版
python3 $W/scripts/prep_wechat.py 发布/<目录>          # --no-comment 关留言；--author 改作者名
```

第一行出封面、标题、摘要、正文.md（规则见 `$M/references/wechat_cover_guide.md`，Read `预览.jpg` 看三处场景）。第二行把正文.md 转成带内联样式的 `正文.html`（公众号编辑器会删 `<style>`）、正文图压到 1MB 以内放进 `upload/`、写 `wechat.json`。浏览器打开 `正文.html` 就是排版预览。

### 5. commit + push，交付时告诉用户 Mac 上跑什么

```bash
git pull
python3 skills/x-wechat/scripts/publish.py wechat 发布/<目录>   # 进草稿箱；后台勾「AI 生成 / 辅助」再发表
python3 skills/x-wechat/scripts/publish.py x 发布/<目录>        # 先列整条 thread，输入 y 才发
git add 发布/<目录>/*/posted.json && git commit -m "发布记录" && git push
```

交付清单写：thread 几条、每条字数、配图位置；公众号标题 / 摘要 / 字数；哪几处是默认（用户说「你定」的地方）；发前清单（`账号/爆文方法论.md`）逐条过没过。

## 第一次用（Mac 上做一次）

1. X 开发者后台建 App，权限改 **Read and write**，生成 Access Token。2026 年 2 月起 X 按量计费，开通前看一眼后台的单价和支出上限。
2. 公众号后台 → 设置与开发 → 开发接口管理：复制 AppID / AppSecret。
3. `cp skills/x-wechat/publish.env.example ~/.config/krypto-publish.env`，填好，`chmod 600`。
4. `python3 skills/x-wechat/scripts/publish.py check`：两边都 ✓ 就通了。公众号报 40164 会给出 Mac 的出口 IP，加进后台 IP 白名单；家里宽带 IP 变了要再加一次。

## 出错了

- 发 thread 中途断了（限流、额度、网络）：已发的 id 在 `推特版/posted.json`，重跑从断的那条接着回复，不会重发。
- 公众号已推过：重跑会拒，要再推一份加 `--again`（草稿箱里旧的那份手动删）。
- 各种错误码 `publish.py` 会翻成中文和要去后台哪一页改。
