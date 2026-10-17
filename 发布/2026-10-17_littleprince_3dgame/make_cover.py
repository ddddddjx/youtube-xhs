#!/usr/bin/env python3
"""视频封面：照 meme-xhs 首页版式（左上作者块：头像 + Krypto说AI + 发布时间 → 突出标题 → 两三行正文 → 素材图）。
用法：python3 make_cover.py <字体目录>（里面要有 noto500/700/900.otf，可从 代码工程/lib/fonts/NotoSansSC-*.woff 转出来）"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
FD = sys.argv[1]
W, H, L = 1080, 1440, 55
BLACK, GREY, ORANGE = (23, 23, 23), (170, 170, 170), (238, 150, 50)
f = lambda s, w: ImageFont.truetype(os.path.join(FD, f"noto{w}.otf"), s)
def circle(img, size):
    img = img.convert("RGB").resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, size * 4, size * 4), fill=255)
    out = Image.new("RGBA", (size, size)); out.paste(img, (0, 0), m.resize((size, size), Image.LANCZOS)); return out
def wrap(text, fo, width):
    import re
    lines, cur = [], ""
    for tk in re.findall(r"[0-9A-Za-z.]+ ?.|.", text):   # 数字连同后面的量词一起换行，不拆「332 万」
        if fo.getlength(cur + tk) > width and tk not in "，。、；：？！": lines.append(cur); cur = tk.lstrip()
        else: cur += tk
    return lines + [cur] if cur else lines
im = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(im)
av = Image.open(os.path.join(HERE, "../../skills/meme-xhs/assets/avatar.png"))
im.paste(circle(av, 96), (55, 25), circle(av, 96))
d.text((176, 24), "Krypto说AI", font=f(38, 700), fill=ORANGE)
d.text((176, 82), "26-10-17 18:00", font=f(29, 500), fill=GREY)
y = 190
d.text((L, y), "16天，一个人用AI做出3D游戏", font=f(62, 900), fill=BLACK); y += 104
fb = f(44, 500)
for ln in wrap("小王子去过的星球，每一颗都能走进去。预告 332 万次观看，近 1 万人收藏。他把五步流程和提示词都公开了，我拆成了这条视频。", fb, W - 2 * L):
    d.text((L, y), ln, font=fb, fill=BLACK); y += 72
top, bottom = y + 36, H - 40
src = Image.open(os.path.join(HERE, "代码工程/clips_lp/rose/0060.jpg")).convert("RGB")
bw, bh = W - 2 * L, bottom - top
s = max(bw / src.width, bh / src.height); src = src.resize((int(src.width * s) + 1, int(src.height * s) + 1), Image.LANCZOS)
cx = int(min(max(src.width * 0.55 - bw / 2, 0), src.width - bw)); cy = (src.height - bh) // 2
im.paste(src.crop((cx, cy, cx + bw, cy + bh)), (L, top))
im.save(os.path.join(HERE, "封面.jpg"), quality=92)
print("封面.jpg", top, bh)
