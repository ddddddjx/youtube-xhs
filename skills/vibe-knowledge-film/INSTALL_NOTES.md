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
- 适用范围：16:9 横屏、无旁白字幕知识短片（抖音「Vibe 知识大赏」式）。跟 `health-vibe`（9:16 大健康号）、`science-film`（3D 微观科普）是不同的片种；本号小红书图文规则（CLAUDE.md）不适用它。
- 以后同步上游：重新 clone，按上面排除项拷贝，再把 `render.py` 这处改动补回来。
