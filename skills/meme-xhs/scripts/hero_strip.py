#!/usr/bin/env python3
"""首图：素材里说出论点的那张图 + 右侧一条讲者小窗（11-17 学邓下班）。

用法：
  python3 hero_strip.py 论点图.png 讲者截帧.jpg 输出.png [--crop x0,y0,x1,y1] [--ratio 0.22]

--crop  讲者截帧里要裁的那块（像素），不给就取中间偏上的竖条
--ratio 小窗宽度占整张图的比例，默认 0.22
论点图优先用原片里的幻灯片、原文里的图表；讲者小窗给一张眼睛睁着的脸。
"""
import argparse
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("slide"); ap.add_argument("speaker"); ap.add_argument("out")
ap.add_argument("--crop", default=""); ap.add_argument("--ratio", type=float, default=0.22)
a = ap.parse_args()

slide = Image.open(a.slide).convert("RGB")
sp = Image.open(a.speaker).convert("RGB")
H = slide.height
sw = int(slide.width * a.ratio / (1 - a.ratio))
if a.crop:
    x0, y0, x1, y1 = [int(v) for v in a.crop.split(",")]
    sp = sp.crop((x0, y0, x1, y1))
else:                                            # 默认：按小窗比例取中间偏上
    want = sw / H
    if sp.width / sp.height > want:
        w = int(sp.height * want); x0 = (sp.width - w) // 2
        sp = sp.crop((x0, 0, x0 + w, sp.height))
    else:
        h = int(sp.width / want); sp = sp.crop((0, 0, sp.width, h))
sp = sp.resize((sw, H), Image.LANCZOS)
gap = max(8, slide.width // 120)
out = Image.new("RGB", (slide.width + gap + sw, H), "white")
out.paste(slide, (0, 0)); out.paste(sp, (slide.width + gap, 0))
out.save(a.out)
print("ok", a.out, out.size)
