# 本仓库的安装记录（Krypto说AI）

- 来源：https://github.com/lemomo-ai/lemo-opuscar ，commit f171360，MIT（`LICENSE` 一起拷进来了）。2026-10-30 用户要求安装。
- 上游是 Claude 插件，skill 本体只有 `plugin/skills/lemo-opuscar/` 里的 `SKILL.md` + `scripts/setup.sh`，原样拷进 `skills/lemo-opuscar/`，`.claude/skills/lemo-opuscar` 软链过去，调用 `/lemo-opuscar`。没改上游任何文件。
- **样式库不进仓库**：整个上游 200 MB（67 种样式的 demo 源码、海报、贴图），skill 设计成用的时候由 `setup.sh` 稀疏克隆到 `~/lemo-opuscar`（约 31 MB，只有指南、`core/` 工具和每个 `STYLE.md`）。云端容器每次新建，所以每个会话第一次用都会重新拉一次，几秒钟。
- 云端用法：
  1. `sh skills/lemo-opuscar/scripts/setup.sh` → 打印 `LIB=/root/lemo-opuscar`
  2. `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers sh skills/lemo-opuscar/scripts/setup.sh deps`（npm 两个包 + Python venv；设了这个变量就用预装浏览器，不重新下载）
  3. 渲染前 `export PLAYWRIGHT_CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome)`（上游 `core/render/browser.mjs` 本来就读这个变量，不用改代码）
- 读过的代码：`setup.sh`（联网只有 git clone/fetch 上游、npm、PyPI，`demo` / `voice` / `music` 按需再拉）、`core/render/page.mjs`、`browser.mjs`、`still.mjs`、`tools/fetch.sh`（从上游 GitHub Releases 下 TTS 模型、HDRI、乐器采样，按需）。
- 10-30 云端自测：建一个最小工程（canvas + `window.render(t)` / `READY` / `DUR`），`still.mjs` 出静帧、`video.mjs` 出 1920×1080 mp4 都正常。
- 已知限制：
  - setup.sh 提示 `ffmpeg7+(found 6.x)`，云端 ffmpeg 是 6.1，出片没问题，混音 / 字幕压制如果用到 7 的新滤镜可能报错，到时再看。
  - WebGL 走软件渲染（SwiftShader），3D / CRT 类样式会很慢。
  - demo 源码只当参考（skill 自己也这么说），字体不在 git 里，直接渲染 demo 会因字体 404 报 pageerror，正常。
  - 中文旁白默认 Kokoro 离线；edge-tts 会把旁白文本发给微软，要先问用户。
- 适用范围：代码渲染的风格短片（油画、水彩、浮世绘、卫星简报、产品拆解等 67 种），默认 16:9，也支持 `--size 1080x1920`。跟 `vibe-knowledge-film`（无旁白字幕知识片）、`huashu-art-motion`、`science-film`、`health-vibe` 并列；本号小红书图文规则（CLAUDE.md）不适用它。
- 以后同步上游：重新 clone，拷 `plugin/skills/lemo-opuscar/` 覆盖即可；样式库 `setup.sh` 每次运行自己会对齐上游 main。
