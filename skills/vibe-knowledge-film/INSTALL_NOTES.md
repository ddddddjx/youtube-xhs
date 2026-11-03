# 本仓库的安装记录（Krypto说AI）

- 来源：https://github.com/HeyChengC/vibe-knowledge-film ，commit 62d5150（「首页加上微信号。」），MIT。2026-10-30 用户要求安装。
- 装法同 huashu-art-motion：拷进 `skills/vibe-knowledge-film/`，`.claude/skills/vibe-knowledge-film` 软链过去，调用 `/vibe-knowledge-film`。
- 没拷的：`.git`、`examples/fold_C.gif`（17 MB）、`examples/pigeon_B.gif`（30 MB）。README 里两处 GIF 换成了上游链接，静帧 `examples/look_*.jpg` 还在。
- 字体不进仓库（上游 `.gitignore` 忽略 `engine/fonts/*.ttf`），新环境先跑 `python engine/get_fonts.py`（从 Google Fonts 仓库下，云端代理能通）。
- **改了一处**：`engine/render.py` 启动浏览器那行。上游写死 `channel="chrome"`（要本机装 Google Chrome），云端只有预装 Chromium。现在设了环境变量 `VK_CHROME_PATH` 就用那个可执行文件，不设和上游一样。云端：
  `VK_CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome python3 engine/render.py <工程> ...`
  Python 依赖 `pip install playwright numpy scipy Pillow`（不要 `playwright install`，用预装的 Chromium）。
- 读过的代码：`engine/*.py`、`engine/*.js`、`scripts/new_film.py`。联网只有 `get_fonts.py` 下字体，`render.py` 起 127.0.0.1 本地预览，其余是本地 ffmpeg 调用，没有别的外发。
- 10-30 云端自测：`new_film.py` 建骨架 + `--stills` 出帧；`examples/fold_C` 第 12 秒静帧和 10–12 秒片段（1920×1080、30fps）都正常。
- 适用范围（10-30 原版）：16:9 横屏、无旁白字幕知识短片（抖音「Vibe 知识大赏」式）。跟 `health-vibe`（9:16 大健康号）、`science-film`（3D 微观科普）是不同的片种；本号小红书图文规则（CLAUDE.md）不适用它。
- 以后同步上游：重新 clone，按上面排除项拷贝，再把 `render.py` 这处改动补回来。
- **旁白（10-30，这个 skill 原本无旁白，用户在 FOMO 片里要求加）**：云端 edge-tts 能用。它用自己的 certifi 证书包、不读 `SSL_CERT_FILE`，被代理重签的 TLS 会报 self-signed；把 `certifi.where` 指到 `/root/.ccr/ca-bundle.crt` 就通（不关校验）。脚本在 `发布/2026-10-30_fomo-film/project/tools/tts.py`（`python3 -I tts.py "文字" zh-CN-YunxiNeural out.mp3`）。旁白和音效、配乐的合成用同目录 `mix.py`（配乐在旁白处 sidechain 压低）。字幕按每句旁白的实际时长排。
- **11-03 按用户给的简报改造**（简报原文在 `references/prompts.md` 第〇节，执行口径在 SKILL.md「简报」）：默认 60 秒、A 鎏金（恢复成可选并设为默认）、横竖屏都支持、只讲一个故事、0–2 秒钩子大字、顶部常驻钩子行、每 10–15 秒转折、场景三层景深、配乐对小节线、合成配乐、音效加重击 / 呼啸 / 提示音、混音限峰、交付 mp4 + 总览图 + 源码 zip、不停下来等确认、每阶段报进展。改的文件：
  `engine/vk.js`（`VK_SIZE` 横竖屏、`window.draw` 别名、`VK_THREE` 等 Three.js 载入、chars 支持逐字渐变、暗角按长边算）、`engine/vk-kit.js`（竖屏字幕版式、字幕 `|` 断行和自动缩字号、第 0 秒字幕满亮、新件 `hookBar` / `headline` / `depth` / `three` / `PORTRAIT`）、
  `engine/index.html`（`VK_SIZE`、Three.js 引入行、画布按比例铺满）、`engine/render.py`（自动找云端 Chromium、按画布大小设视口、逐帧 jpg、`--sheet` 默认 9 帧并支持竖图）、`engine/audio.py`（`hit` / `whoosh` / `ping`、`--from` 截乐句、结尾 2.5 秒淡出、`alimiter` 限幅）、
  `engine/get_fonts.py --three`；新文件 `engine/beat.py`、`engine/score.py`、`scripts/deliver.py`；`scripts/new_film.py` 加 `--world A`、`--portrait`、`--dur`、`--three`。文档改了 SKILL.md、`references/worlds.md`、`engine.md`、`script.md`、`prompts.md`。
  `render.py` 现在不设 `VK_CHROME_PATH` 也会自动用 `/opt/pw-browsers` 里的 Chromium。同步上游时这些改动要手动补回。
