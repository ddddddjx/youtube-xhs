# 敦煌风·上下五千年（180 秒动画）

一条横向长卷，一匹丝从五千年前的蚕茧里抽出来，穿过 15 个朝代，最后飞回敦煌莫高窟。
画风：敦煌壁画（土红/赭黄地仗、矿物色、铁线描、青绿山、做旧剥落），纯代码绘制；配乐纯代码合成（88 BPM，D 宫五声）。

- 成片：`成片/`
- 镜头表：`镜头表.md`
- 三个方向设定帧：`设定帧/`（选了 A「一匹丝」）
- 代码：`代码工程/dh/`（画具 kit、长卷骨架 world、三批场景 seg_a/b/c）、`代码工程/eras_film.js`
- 配乐：`音频/synth.py`

## 重渲

```sh
cd 发布/2026-10-10_dunhuang-5000yrs
cp -Rn ../../skills/huashu-art-motion/scripts/engine/. 代码工程/          # 补回引擎本体（不覆盖本片文件）
uv run --with numpy --with scipy --with soundfile python 音频/synth.py   # 配乐.wav
cd 代码工程
uv run --with playwright==1.56.0 python render.py --film film --fps 30 --out ../成片/成片.mp4 --audio ../音频/配乐.wav
```
云端容器预装的 Chromium 是 1194 版，要配 playwright==1.56.0；本地用最新 playwright 的话去掉版本号。
