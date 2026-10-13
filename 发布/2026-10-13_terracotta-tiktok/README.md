# 兵马俑 · TikTok 60 秒（1080×1920@30）

英文观众，英文大字幕＋中文小字幕，无口播。前 3 秒钩子：一张满彩的兵马俑脸，颜料成片剥落，只剩灰陶。

- 成片：`成片/兵马俑_TikTok_v1.mp4`
- 镜头表与事实核对：`脚本.md`
- 发布文案（含必带署名）：`发布文案.md`
- 照片署名：`素材/署名.md`（照片在 `代码工程/img/`）
- 代码：`代码工程/eras_film.js`（10 段）、`代码工程/tt/film.js`（照片运镜、彩绘层与剥落、数字、字幕、水银河）、`代码工程/tt/kit.js`（剥落遮罩、尘土）
- 配乐：`音频/synth.py`

## 重渲

```sh
cd 发布/2026-10-13_terracotta-tiktok
cp -Rn ../../skills/huashu-art-motion/scripts/engine/. 代码工程/
uv run --with numpy --with scipy --with soundfile python 音频/synth.py
cd 代码工程
uv run --with playwright==1.56.0 python render.py --film film --fps 30 --out ../成片/兵马俑_TikTok_v1.mp4 --audio ../音频/配乐.wav
```
