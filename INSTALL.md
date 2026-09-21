# 安装与使用：Krypto说AI 小红书 skill

两个 skill 的源码在 `skills/`，改完后运行：

```bash
bash build.sh
```

它会生成 `dist/` 里的安装包，并自动同步到本机 Claude Code。

| 文件 | 用在哪 |
|---|---|
| `dist/youtube-xhs.zip` | claude.ai 网页 / 桌面 Chat |
| `dist/xiaohongshu-wutu-zhishika.zip` | claude.ai 网页 / 桌面 Chat |
| `dist/krypto-xhs.plugin` | Cowork（两个 skill 打成一个插件） |

## 各端安装

**Claude Code（这台 Mac）**：已安装，`build.sh` 每次自动同步，不用管。

**claude.ai 网页 / 桌面 Chat**
1. 设置 → 功能（Capabilities）里打开「代码执行与文件创建」
2. 设置 → Customize → Skills → 点 + → 上传 skill，**两个 zip 各传一次**
3. 新开对话，说「用 youtube-xhs 处理 <链接>」即可

**Cowork**
Customize → Plugins → 上传 `dist/krypto-xhs.plugin`。

**手机**
- 想跑完整流程（下载视频、压字幕、出卡片图）：用 **Dispatch** 或 **Remote Control**，从手机把任务交给这台 Mac 上的 Claude 执行，Mac 需要开着、联网
- 只用 claude.ai 手机 App：能用网页上传的 skill 的话，只会走「云端文案模式」（见下）

## 云端和本地能做的事不一样

| | 本地完整模式（Mac：Claude Code / Dispatch / Remote Control） | 云端文案模式（claude.ai 网页 / 手机 / Cowork 沙箱） |
|---|---|---|
| 下载视频、字幕 | ✓ | 视网络而定，常被拦；拦了就需要你粘贴字幕或要点 |
| 中英字幕压制视频 | ✓ | ✗（云端不能处理大视频） |
| 抽课件关键帧 | ✓ | ✗ |
| 卡片图 1080×1440 | ✓ | 尽量尝试；不行就给 cards.json，回 Mac 一句话出图 |
| 标题.txt + 正文.txt | ✓ | ✓ |

skill 会先自己判断当前是哪种环境，再决定怎么做。

X（Twitter）链接：本地模式会下载推文视频，用 mlx-whisper 在这台 Mac 上转写字幕，再由 Claude 翻译。依赖 `uv tool install mlx-whisper`（已装），模型约 1.6GB 已缓存在 `~/.cache/huggingface/`。云端模式没法转写，只能靠推文文字或你粘贴的内容写文案。

## 更新流程

1. 在 Claude Code 里说「改一下 xx skill」，改的是 `yt2red/skills/`
2. 运行 `bash build.sh`
3. 重新上传变动的 zip / plugin（claude.ai 上删掉旧的再传新的）
