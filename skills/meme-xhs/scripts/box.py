#!/usr/bin/env python3
"""在证据截图上画红框（10-03 起，对标小盖：关键那句框出来，读者不用读整张图）。

用法：python3 box.py 截图.png x1,y1,x2,y2 [x1,y1,x2,y2 ...] [--out 文件名] [--width 8]
输出默认是 截图_box.png。坐标按原图像素；先 Read 看图估坐标，画完再 Read 一次确认框住了那句。
"""
import os
import sys

from PIL import Image, ImageDraw

RED = (230, 40, 40)


def main(argv):
    args, out, width, i = [], None, 8, 0
    while i < len(argv):
        if argv[i] == "--out":
            out, i = argv[i + 1], i + 2
        elif argv[i] == "--width":
            width, i = int(argv[i + 1]), i + 2
        else:
            args.append(argv[i])
            i += 1
    if len(args) < 2:
        sys.exit(__doc__)
    src, boxes = args[0], args[1:]
    out = out or os.path.splitext(src)[0] + "_box.png"
    im = Image.open(src).convert("RGB")
    d = ImageDraw.Draw(im)
    for b in boxes:
        x1, y1, x2, y2 = (int(v) for v in b.split(","))
        d.rectangle((x1, y1, x2, y2), outline=RED, width=width)
    im.save(out)
    print(f"✓ {out}（{len(boxes)} 个框，{im.width}×{im.height}）")


if __name__ == "__main__":
    main(sys.argv[1:])
