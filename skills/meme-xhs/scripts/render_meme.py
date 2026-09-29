#!/usr/bin/env python3
"""把 draft.md 排成 MemeInformation 式的「手机长文截图」卡片：1080×1440，白底黑字，
首页是作者块（头像、账号名、发布时间、发布于），续页是顶栏（返回、头像、账号名、•••）。

正文按屏幕高度逐行切页，和原号一样会断在半句，读者要翻页才能读完那句话。

用法:
  python3 render_meme.py <draft.md> <输出目录>

draft.md 格式:

  ---
  title: 标题（只进 标题.txt，不上图）
  time: 26-9-29 12:30        # 首页发布时间，不写就用现在
  location: 上海              # 首页「发布于」，不写就不显示
  account: Krypto说AI
  avatar: avatar.png         # 相对 draft.md，找不到就用 skill 自带的
  card: 每周拆 2 篇 AI 圈的新东西   # 可选：末尾加一页同版式的名片页，默认不加（原号没有）
  ---

  正文一段一行，段与段之间空一行。
  ## 01                       ← 小节标记，排成加粗的一行（原号偶尔用 01 / 02）
  ![说明](chart.png)           ← 图片横向撑满，放不下就挪到下一页
  | 列 | 列 |                  ← 表格
"""
import datetime
import math
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1440
L, R = 55, 55
TEXT_W = W - L - R
FS, LH, PGAP = 44, 72, 44          # 正文字号、行高、段距（量自原号截图）
BOTTOM = H - 40
TOP_BAR = 132
FONT = "/System/Library/Fonts/PingFang.ttc"
BLACK, GREY, NAME_ORANGE, LINE = (23, 23, 23), (170, 170, 170), (238, 150, 50), (238, 238, 238)
NO_START = "，。、；：？！）」』”’》〉%…·"
HERE = os.path.dirname(os.path.abspath(__file__))


def font(size, weight="Regular"):
    idx = {"Regular": 2, "Medium": 5, "Semibold": 8}[weight]
    try:
        return ImageFont.truetype(FONT, size, index=idx)
    except OSError:
        return ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", size)


F_BODY, F_BOLD = font(FS), font(FS, "Semibold")


def parse(md):
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n", md, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line and not line.strip().startswith("#"):
                k, v = line.split(":", 1)
                meta[k.strip()] = re.sub(r"\s+#\s.*$", "", v).strip()
        md = md[m.end():]
    blocks, lines, i = [], md.splitlines(), 0
    while i < len(lines):
        s = lines[i].strip()
        i += 1
        if not s:
            continue
        im = re.match(r"^!\[(.*?)\]\((.+?)\)$", s)
        if im:
            blocks.append({"img": im.group(2), "alt": im.group(1)})
        elif s.startswith("|"):
            rows = [s]
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i].strip())
                i += 1
            cells = [[c.strip() for c in r.strip("|").split("|")] for r in rows]
            blocks.append({"table": [c for c in cells if not all(re.fullmatch(r":?-{2,}:?", x) for x in c)]})
        elif s.startswith("#"):
            blocks.append({"head": s.lstrip("#").strip()})
        else:
            blocks.append({"p": s.replace("**", "").replace("==", "")})
    return meta, blocks


def tokens(text):
    """英文单词和数字连在一起不拆，其余逐字。"""
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9.\-_/%+']*|\s|.", text)


def wrap(text, f):
    lines, cur = [], ""
    for t in tokens(text):
        if t.isspace() and not cur:
            continue
        trial = cur + t
        if f.getlength(trial) <= TEXT_W:
            cur = trial
        elif t in NO_START and f.getlength(trial) <= TEXT_W + FS:   # 标点悬挂在行尾，不让它落到行首
            cur = trial
        else:
            if f.getlength(t) > TEXT_W:                              # 超长英文串，硬拆
                for ch in t:
                    if f.getlength(cur + ch) > TEXT_W:
                        lines.append(cur)
                        cur = ""
                    cur += ch
                continue
            lines.append(cur.rstrip())
            cur = t.lstrip()
    if cur.strip():
        lines.append(cur.rstrip())
    return lines


def circle(img, size):
    img = img.convert("RGB").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4, size * 4), fill=255)
    out = Image.new("RGBA", (size, size))
    out.paste(img, (0, 0), mask.resize((size, size), Image.LANCZOS))
    return out


class Pager:
    def __init__(self, meta, avatar):
        self.meta, self.avatar, self.pages, self.ends = meta, avatar, [], []
        self.last_line, self.last_para, self.in_para = "", "", False
        self.new_page()

    def cur_end(self):
        """上一页的页末：半句（句子被切开）、钩子（22 字以内的短段）、整段。"""
        if self.in_para and self.last_line and self.last_line[-1] not in "。！？!?…”":
            return "半句"
        if not self.in_para and 0 < len(self.last_para) <= 22:
            return "钩子"
        return "整段"

    def new_page(self):
        im = Image.new("RGB", (W, H), "white")
        d = ImageDraw.Draw(im)
        name = self.meta.get("account", "Krypto说AI")
        if not self.pages:                                   # 首页：作者块
            im.paste(circle(self.avatar, 96), (55, 25), circle(self.avatar, 96))
            d.text((176, 28), name, font=font(38, "Medium"), fill=NAME_ORANGE)
            d.text((176, 86), self.meta["time"], font=font(29), fill=GREY)
            y = 128
            if self.meta.get("location"):
                d.text((176, y), "发布于 " + self.meta["location"], font=font(29), fill=GREY)
                y += 50
            self.y = max(y, 150) + 40
        else:                                                # 续页：顶栏
            d.line([(72, 52), (48, 77), (72, 102)], fill=(40, 40, 40), width=5, joint="curve")
            im.paste(circle(self.avatar, 88), (133, 33), circle(self.avatar, 88))
            d.text((248, 55), name, font=font(38), fill=(40, 40, 40))
            for k in range(3):
                d.ellipse((970 + k * 22, 70, 980 + k * 22, 80), fill=(40, 40, 40))
            d.line([(0, TOP_BAR), (W, TOP_BAR)], fill=LINE, width=2)
            self.y = TOP_BAR + 34
        if self.pages:                                        # 记下上一页是怎么结束的
            self.ends.append(self.cur_end())
        self.im, self.d, self.fresh = im, d, True
        self.pages.append(im)

    def gap(self, px):
        if not self.fresh:
            self.y += px

    def line(self, text, f=F_BODY):
        if self.y + LH > BOTTOM:
            self.new_page()
        self.d.text((L, self.y + (LH - FS) // 2 - 4), text, font=f, fill=BLACK)
        self.y += LH
        self.fresh = False
        self.last_line = text

    def para(self, text, f=F_BODY):
        self.gap(PGAP)
        lines = wrap(text, f)
        for k, ln in enumerate(lines):
            self.in_para = k > 0
            self.line(ln, f)
        self.in_para, self.last_para = False, text

    def image(self, path, alt):
        if not os.path.exists(path):
            print(f"⚠ 找不到图片 {path}，跳过（{alt}）")
            return
        src = Image.open(path).convert("RGB")
        w = TEXT_W
        h = int(src.height * w / src.width)
        avail_full = BOTTOM - (TOP_BAR + 34)
        if h > avail_full:                                   # 太高：按整页可用高度缩
            h = avail_full
            w = int(src.width * h / src.height)
        self.gap(30)
        if self.y + h > BOTTOM:
            left = BOTTOM - self.y
            if left >= h * 0.75 and left > 300:              # 差一点放得下：略缩
                h, w = left, int(src.width * left / src.height)
            else:
                self.new_page()
        self.im.paste(src.resize((w, h), Image.LANCZOS), (L + (TEXT_W - w) // 2, self.y))
        self.y += h + 10
        self.fresh = False

    def table(self, rows):
        f = font(30)
        n = max(len(r) for r in rows)
        cw = TEXT_W / n
        self.gap(30)
        for ri, r in enumerate(rows):
            cells = [wrap_cell(c, f, cw - 24) for c in r] + [[]] * (n - len(r))
            rh = max(1, max(len(c) for c in cells)) * 44 + 24
            if self.y + rh > BOTTOM:
                self.new_page()
            if ri == 0:
                self.d.rectangle((L, self.y, W - R, self.y + rh), fill=(246, 246, 246))
            for ci, c in enumerate(cells):
                for li, t in enumerate(c):
                    self.d.text((L + ci * cw + 12, self.y + 12 + li * 44), t,
                                font=font(30, "Medium") if ri == 0 else f, fill=BLACK)
            self.d.line([(L, self.y + rh), (W - R, self.y + rh)], fill=(225, 225, 225), width=2)
            self.y += rh
            self.fresh = False
        self.y += 10


def wrap_cell(text, f, width):
    out, cur = [], ""
    for ch in text:
        if f.getlength(cur + ch) > width:
            out.append(cur)
            cur = ""
        cur += ch
    return out + [cur] if cur else out


def overview(pages, path):
    cols = 5
    tw, th = 216, 288
    rows = math.ceil(len(pages) / cols)
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * 12, rows * th + (rows + 1) * 12), (225, 225, 225))
    for i, p in enumerate(pages):
        sheet.paste(p.resize((tw, th), Image.LANCZOS), (12 + (i % cols) * (tw + 12), 12 + (i // cols) * (th + 12)))
    sheet.save(path, quality=88)


def main(src, out):
    meta, blocks = parse(open(src, encoding="utf-8").read())
    base = os.path.dirname(os.path.abspath(src))
    now = datetime.datetime.now()
    meta.setdefault("time", f"{now.year % 100}-{now.month}-{now.day} {now:%H:%M}")
    av = os.path.join(base, meta.get("avatar", "avatar.png"))
    if not os.path.exists(av):
        av = os.path.join(HERE, "..", "assets", "avatar.png")
    pg = Pager(meta, Image.open(av))
    for b in blocks:
        if "p" in b:
            pg.para(b["p"])
        elif "head" in b:
            pg.para(b["head"], F_BOLD)
        elif "img" in b:
            pg.image(os.path.join(base, b["img"]), b["alt"])
        elif "table" in b:
            pg.table(b["table"])
    if meta.get("card"):
        pg.new_page()
        pg.para("关注 " + meta.get("account", "Krypto说AI"), F_BOLD)
        pg.para(meta["card"])
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if re.fullmatch(r"\d{2}\.png", f):
            os.remove(os.path.join(out, f))
    for i, p in enumerate(pg.pages, 1):
        p.save(os.path.join(out, f"{i:02}.png"))
    overview(pg.pages, os.path.join(out, "overview.jpg"))
    fill = (pg.y - (TOP_BAR + 34)) / (BOTTOM - TOP_BAR - 34)
    ends = pg.ends
    if ends:
        mid, hook = ends.count("半句"), ends.count("钩子")
        share = (mid + hook) / len(ends)
        print(f"{'✓' if share >= 0.3 else '⚠'} 页末：断在半句 {mid}、钩子短句 {hook}、整段 {ends.count('整段')}"
              f"（{share:.0%}；原号成熟期 40%：半句 27% + 钩子 13%）")
        if share < 0.3:
            print("  页末多停在整段上：在这几页末尾放一句 22 字以内的短段把下一页提起来，"
                  "或者把揭晓句写长一点，让它跨页")
    print(f"共 {len(pg.pages)} 页，末页填充 {fill:.0%}" + ("  ✗ 超过小红书 18 张上限，删段落" if len(pg.pages) > 18 else ""))
    if fill < 0.25 and len(pg.pages) > 1:
        print(f"⚠ 末页只有 {fill:.0%}：删几句让它并进上一页，或者在结尾补一句回扣")
    return len(pg.pages)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(1 if main(sys.argv[1], sys.argv[2]) > 18 else 0)
