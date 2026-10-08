import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
I = Image.open(src).convert("RGB")
cx, cy, r = 589, 969, 517
av = I.crop((cx - r, cy - r, cx + r, cy + r))
m = Image.new("L", (4 * 2 * r, 4 * 2 * r), 0); ImageDraw.Draw(m).ellipse((0, 0, 8 * r - 1, 8 * r - 1), fill=255)
m = m.resize((2 * r, 2 * r), Image.LANCZOS)
a = av.copy(); a.putalpha(m); a.save(f"{out}/avatar.png")
# 抠掉黄底：离纯黄越近越透明
arr = np.array(av).astype(float)
d = np.sqrt((arr[..., 0] - 255) ** 2 + (arr[..., 1] - 240) ** 2 + (arr[..., 2] - 0) ** 2)
al = np.clip((d - 60) / 90, 0, 1) * (np.array(m) / 255)
cut = av.copy(); cut.putalpha(Image.fromarray((al * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.8)))
cut.save(f"{out}/cutout.png")
