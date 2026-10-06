#!/usr/bin/env python3
"""把 draft.md 排成 MemeInformation 式的「手机长文截图」卡片：1080×1440，白底黑字，
首页是作者块（头像、账号名、发布时间、发布于）+ 可选的一行突出标题（headline）+ 可选的一张素材图（hero）+ 正文，
续页是顶栏（返回、头像、账号名、•••）。和原号一样，第 1 页就是正文页；钩子靠 headline 和素材图。
用户明确要单独封面页时才写 cover（09-30 用户反馈：画出来的封面太刻意，默认不用）。

正文按屏幕高度逐行切页，和原号一样会断在半句，读者要翻页才能读完那句话。

用法:
  python3 render_meme.py <draft.md> <输出目录>

draft.md 格式:

  ---
  title: 标题（只进 标题.txt，不上图）
  headline: 它替你订的酒店，是谁出的价      # 可选：首页作者块下面的一行突出标题，20 字以内
  hero: quote.png                        # 可选：首页的一张素材图（原文截图、原文配图、后台截图），不用自己画的
  hero_after: 3                          # 素材图放在第几段之后（默认 3：先铺垫几句再放图，读者才知道图在讲什么）
  font: serif                            # 可选（10-03 起，对标小盖）：正文用宋体，信息流里像一个人认真写的长文；headline 和名片卡仍是黑体
  extra_pages: summary.png               # 可选：整页图（1080×1440，比如结构化总结表），插在名片卡前面，多张用 || 隔开
  cover: 它替你订的酒店<br>是==谁出的价==   # 仅用户要求时：单独封面页的大字，2 到 3 行，每行 7 字以内，==词== 打黄底
  cover_kicker: 把钱包交给 AI 之前          # 可选：大字上面的一行小字引子，20 字以内
  cover_image: cover.png                 # 封面插图：单主体、缩略图里认得出；相对 draft.md
  cover_alts: 免费的 AI 管家<br>到底==听谁的== || 交出信用卡前<br>先定==5 条规矩==   # 可选：备选封面大字，用 || 隔开，出到 封面备选/
  time: 26-9-29 12:30        # 首页发布时间，不写就用现在
  location: 上海              # 首页「发布于」，不写就不显示
  account: Krypto说AI
  avatar: avatar.png         # 相对 draft.md，找不到就用 skill 自带的
  card: 每天一篇，把 AI 圈的新东西讲成人话   # 末页名片卡的定位句。不写就用默认这句；写 card: off 不出名片卡
  card_note: 可选的第二行，默认没有（09-30 用户：不写「AI 全权运营 / 后台数据公开」）
  gift: 已停用（09-30 用户：图上不写「评论区扣 1 领」），写了也不出
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
NO_END = "《「『“‘（〈"
YELLOW, KICKER_GREY = (255, 224, 61), (110, 110, 110)
CARD, CARD_NOTE = "每天一篇海外一手，每篇留一段能直接用的", ""   # 10-07 改：定位句写成具体承诺，给去主页的人一个关注理由   # 名片卡默认文案；第二行默认没有
COVER_CAP, COVER_CAP_NOIMG = 150, 175      # 封面大字字号上限：有插图 / 没插图
DARK_MEAN, DARK_SHARE = 70, 0.70           # 封面插图：平均亮度低于 70 或深色像素超过七成，缩略图里是一块黑
HERE = os.path.dirname(os.path.abspath(__file__))


def font(size, weight="Regular"):
    idx = {"Regular": 2, "Medium": 5, "Semibold": 8}[weight]
    try:
        return ImageFont.truetype(FONT, size, index=idx)
    except OSError:
        pass
    try:
        return ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", size)
    except OSError:   # 云端 Linux：apt-get install -y fonts-noto-cjk，ttc 里 index 2 是简体中文
        noto = "/usr/share/fonts/opentype/noto/NotoSansCJK-%s.ttc" % ("Regular" if weight == "Regular" else "Bold")
        return ImageFont.truetype(noto, size, index=2)


F_BODY, F_BOLD = font(FS), font(FS, "Semibold")

SERIF = [  # 10-03 起可选的正文宋体：Mac 的 Songti，云端的 NotoSerifCJK（apt-get install -y fonts-noto-cjk）
    ("/System/Library/Fonts/Supplemental/Songti.ttc", {"Regular": 0, "Semibold": 1}),
    ("/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc", {"Regular": 2}),
]


def serif_font(size, weight="Regular"):
    for path, idx in SERIF:
        if not os.path.exists(path):
            continue
        if weight == "Semibold" and "NotoSerifCJK-Regular" in path:
            path = path.replace("-Regular", "-Bold")
        try:
            return ImageFont.truetype(path, size, index=idx.get(weight, idx["Regular"]))
        except OSError:
            continue
    print("⚠ 找不到宋体（Mac: Songti.ttc；云端: apt-get install -y fonts-noto-cjk），正文仍用黑体")
    return font(size, weight)


def set_body_font(kind):
    global F_BODY, F_BOLD
    if kind == "serif":
        F_BODY, F_BOLD = serif_font(FS), serif_font(FS, "Semibold")


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
            carry = ""
            while cur and cur[-1] in NO_END:                          # 开括号不留在行尾，跟着下一行走
                carry, cur = cur[-1] + carry, cur[:-1]
            lines.append(cur.rstrip())
            cur = carry + t.lstrip()
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
    def __init__(self, meta, avatar, has_cover=False):
        self.meta, self.avatar, self.pages, self.ends = meta, avatar, [], []
        self.has_cover = has_cover
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
        if not self.pages and not self.has_cover:            # 没有封面时，首页放作者块 + 突出标题 + 素材图
            self.y = author_block(im, d, self.meta, self.avatar) + 40
            if self.meta.get("headline"):
                fh = font(58, "Semibold")
                for ln in wrap(self.meta["headline"], fh):
                    d.text((L, self.y), ln, font=fh, fill=BLACK)
                    self.y += 82
                self.y += 14
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

    def line(self, text, f=None):
        f = f or F_BODY
        if self.y + LH > BOTTOM:
            self.new_page()
        self.d.text((L, self.y + (LH - FS) // 2 - 4), text, font=f, fill=BLACK)
        self.y += LH
        self.fresh = False
        self.last_line = text

    def para(self, text, f=None):
        f = f or F_BODY
        self.gap(PGAP)
        lines = wrap(text, f)
        for k, ln in enumerate(lines):
            self.in_para = k > 0
            self.line(ln, f)
        self.in_para, self.last_para = False, text

    def image(self, path, alt, hero=False):
        if not os.path.exists(path):
            print(f"⚠ 找不到图片 {path}，跳过（{alt}）")
            return
        src = Image.open(path).convert("RGB")
        w = TEXT_W
        h = int(src.height * w / src.width)
        if hero and h > 480:                                 # 首页素材图最高 480，前面的铺垫和后面的正文都要露出来
            h, w = 480, int(src.width * 480 / src.height)
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
        laid = [[wrap_cell(c, f, cw - 24) for c in r] + [[]] * (n - len(r)) for r in rows]
        total = sum(max(1, max(len(c) for c in cells)) * 44 + 24 for cells in laid)
        if self.y + total > BOTTOM and total <= BOTTOM - (TOP_BAR + 34):   # 整张表放得进一页，就不拆开
            self.new_page()
        for ri, cells in enumerate(laid):
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


def author_block(im, d, meta, avatar):
    """头像、账号名、发布时间、发布于。返回这一块的底边。"""
    im.paste(circle(avatar, 96), (55, 25), circle(avatar, 96))
    d.text((176, 28), meta.get("account", "Krypto说AI"), font=font(38, "Medium"), fill=NAME_ORANGE)
    d.text((176, 86), meta["time"], font=font(29), fill=GREY)
    y = 128
    if meta.get("location"):
        d.text((176, y), "发布于 " + meta["location"], font=font(29), fill=GREY)
        y += 50
    return max(y, 150)


def units(text):
    """一行大约几个汉字宽：汉字和全角标点算 1，英文数字算 0.56。"""
    return sum(1 if ord(c) > 0x2E7F else 0.56 for c in text)


def darkness(img):
    """(平均亮度 0–255, 深色像素占比)。用来拦整块深色的截图和暗色油画。"""
    px = list(img.convert("L").resize((160, 120)).getdata())
    return sum(px) / len(px), sum(v < 70 for v in px) / len(px)


def cover_lines(text):
    return [l.strip() for l in re.split(r"<br\s*/?>|\\n", text) if l.strip()]


def cover_page(meta, avatar, base):
    """封面：作者块 → 小字引子 → 2 到 3 行大字（==词== 打黄底）→ 插图铺满剩下的版面。"""
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    y = author_block(im, d, meta, avatar) + 56
    img_path = os.path.join(base, meta["cover_image"]) if meta.get("cover_image") else None
    if img_path and not os.path.exists(img_path):
        print(f"⚠ 找不到封面插图 {img_path}，按没有插图出封面")
        img_path = None
    if meta.get("cover_kicker"):
        fk = font(44, "Medium")
        for ln in wrap(meta["cover_kicker"], fk):
            d.text((L, y), ln, font=fk, fill=KICKER_GREY)
            y += 64
        y += 14
    lines = cover_lines(meta["cover"])
    widest = max(units(l.replace("==", "")) for l in lines)
    fs = int(min(COVER_CAP if img_path else COVER_CAP_NOIMG, TEXT_W / widest * 0.98))
    fb, lh = font(fs, "Semibold"), int(fs * 1.24)
    if not img_path:                                          # 没有插图：大字在剩下的版面里上下居中偏上
        y += max(0, (H - y - lh * len(lines)) // 3)
    for ln in lines:
        x = L
        for part in re.split(r"(==.+?==)", ln):
            if not part:
                continue
            mark = part.startswith("==") and part.endswith("==")
            t = part[2:-2] if mark else part
            w = fb.getlength(t)
            if mark:
                d.rounded_rectangle((x - 8, y + int(fs * 0.13), x + w + 8, y + int(fs * 1.16)), radius=14, fill=YELLOW)
            d.text((x, y), t, font=fb, fill=BLACK)
            x += w
        y += lh
    if img_path:
        top, bottom = y + 46, H - 60
        box_w, box_h = TEXT_W, bottom - top
        src = Image.open(img_path).convert("RGB")
        mean, dark = darkness(src)
        if mean < DARK_MEAN or dark > DARK_SHARE:
            print(f"✗ 封面插图太暗（平均亮度 {mean:.0f}，深色像素 {dark:.0%}）：信息流缩略图里是一块黑。"
                  "换成单主体、明暗分明的图；代码 / 文档 / 界面截图和暗色油画不上封面")
        scale = max(box_w / src.width, box_h / src.height)    # 铺满裁切，主体放在画面中间
        src = src.resize((math.ceil(src.width * scale), math.ceil(src.height * scale)), Image.LANCZOS)
        cx, cy = (src.width - box_w) // 2, (src.height - box_h) // 2
        src = src.crop((cx, cy, cx + box_w, cy + box_h))
        mask = Image.new("L", (box_w * 2, box_h * 2), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, box_w * 2, box_h * 2), radius=64, fill=255)
        im.paste(src, (L, top), mask.resize((box_w, box_h), Image.LANCZOS))
        if box_h < 380:
            print(f"⚠ 封面插图只剩 {box_h}px 高：大字减到 2 行，或者删掉小字引子")
    return im


def card_page(pg):
    """末页名片卡（09-29 起默认出）：大头像、账号名、一句定位、一句这个号的特别之处、可选领取物。
    读者读完要在笔记里看到关注的理由；不喊关注，不预告下一期。"""
    meta = pg.meta
    pg.new_page()
    pg.ends.pop()                                         # 正文最后一页不算翻页钩子
    im, d = pg.im, pg.d
    y = 330
    av = circle(pg.avatar, 260)
    im.paste(av, ((W - 260) // 2, y), av)
    y += 260 + 50
    name, fn = meta.get("account", "Krypto说AI"), font(64, "Semibold")
    d.text(((W - fn.getlength(name)) / 2, y), name, font=fn, fill=NAME_ORANGE)
    y += 130
    fc = font(52, "Semibold")
    for ln in wrap(meta.get("card") or CARD, fc):
        d.text(((W - fc.getlength(ln)) / 2, y), ln, font=fc, fill=BLACK)
        y += 80
    note = meta.get("card_note", CARD_NOTE)
    if note and note != "off":
        y += 24
        fs_ = font(40)
        for ln in wrap(note, fs_):
            d.text(((W - fs_.getlength(ln)) / 2, y), ln, font=fs_, fill=KICKER_GREY)
            y += 62
    if meta.get("gift") and meta.get("gift_on_card") == "yes":      # 09-30 起默认不出领取物提示
        y += 70
        fg = font(42, "Medium")
        lines = wrap(meta["gift"], fg)
        bw = max(fg.getlength(l) for l in lines) + 80
        d.rounded_rectangle(((W - bw) / 2, y, (W + bw) / 2, y + 66 * len(lines) + 44), radius=28, fill=YELLOW)
        for k, ln in enumerate(lines):
            d.text(((W - fg.getlength(ln)) / 2, y + 22 + 66 * k), ln, font=fg, fill=BLACK)
    pg.y, pg.fresh = BOTTOM, False


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
    if meta.get("font") == "serif":
        set_body_font("serif")
    now = datetime.datetime.now()
    meta.setdefault("time", f"{now.year % 100}-{now.month}-{now.day} {now:%H:%M}")
    av = os.path.join(base, meta.get("avatar", "avatar.png"))
    if not os.path.exists(av):
        av = os.path.join(HERE, "..", "assets", "avatar.png")
    avatar = Image.open(av)
    cover = cover_page(meta, avatar, base) if meta.get("cover") else None
    if meta.get("hero"):                                    # 素材图插在第 hero_after 段之后（默认 3），不放在正文前面
        k, seen = int(meta.get("hero_after", 3) or 3), 0
        for i, b in enumerate(blocks):
            if "p" in b:
                seen += 1
                if seen == k:
                    blocks.insert(i + 1, {"img": meta["hero"], "alt": "素材图", "hero": True})
                    break
        else:
            blocks.append({"img": meta["hero"], "alt": "素材图", "hero": True})
    if not cover and not meta.get("headline") and not meta.get("hero"):
        print("⚠ 首页没有 headline 也没有 hero：信息流里露出的只有前几行正文，看看前两段够不够当钩子")
    pg = Pager(meta, avatar, has_cover=bool(cover))
    for b in blocks:
        if "p" in b:
            pg.para(b["p"])
        elif "head" in b:
            pg.para(b["head"], F_BOLD)
        elif "img" in b:
            pg.image(os.path.join(base, b["img"]), b["alt"], hero=b.get("hero", False))
        elif "table" in b:
            pg.table(b["table"])
    body_fill = (pg.y - (TOP_BAR + 34)) / (BOTTOM - TOP_BAR - 34)   # 正文最后一页的填充率，名片卡不算
    for ep in [x.strip() for x in meta.get("extra_pages", "").split("||") if x.strip()]:   # 整页图，插在名片卡前
        fp = os.path.join(base, ep)
        if os.path.exists(fp):
            pg.pages.append(Image.open(fp).convert("RGB").resize((W, H), Image.LANCZOS))
        else:
            print(f"⚠ 找不到整页图 {fp}")
    body_pages = len(pg.pages)
    if meta.get("card") != "off":
        card_page(pg)
    if cover:
        pg.pages.insert(0, cover)
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if re.fullmatch(r"\d{2}\.png", f):
            os.remove(os.path.join(out, f))
    for i, p in enumerate(pg.pages, 1):
        p.save(os.path.join(out, f"{i:02}.png"))
    overview(pg.pages, os.path.join(out, "overview.jpg"))
    if cover and meta.get("cover_alts"):                    # 备选封面：同一个引子和插图，只换大字，给用户投票
        alt_dir = os.path.join(out, "封面备选")
        os.makedirs(alt_dir, exist_ok=True)
        for f in os.listdir(alt_dir):
            if re.fullmatch(r"\d{2}\.png|overview\.jpg", f):
                os.remove(os.path.join(alt_dir, f))
        alts = [cover] + [cover_page({**meta, "cover": a.strip()}, avatar, base)
                          for a in meta["cover_alts"].split("||") if a.strip()]
        for i, p in enumerate(alts, 1):
            p.save(os.path.join(alt_dir, f"{i:02}.png"))
        overview(alts, os.path.join(alt_dir, "overview.jpg"))
        print(f"封面备选 {len(alts)} 版（01 是正式封面）→ {alt_dir}")
    fill = body_fill
    ends = pg.ends
    if ends:
        first_end = ends[1] if cover and len(ends) > 1 else ends[0]
        print(f"{'✓' if first_end != '整段' else '⚠'} 第 1 页末尾：{first_end}" + ("（读者 5 秒后要不要翻页，就看这一行：把揭晓句写长让它跨页，或者末尾放一句钩子短段）" if first_end == '整段' else ""))
        mid, hook = ends.count("半句"), ends.count("钩子")
        share = (mid + hook) / len(ends)
        print(f"{'✓' if share >= 0.3 else '⚠'} 页末：断在半句 {mid}、钩子短句 {hook}、整段 {ends.count('整段')}"
              f"（{share:.0%}；原号成熟期 40%：半句 27% + 钩子 13%）")
        if share < 0.3:
            print("  页末多停在整段上：在这几页末尾放一句 22 字以内的短段把下一页提起来，"
                  "或者把揭晓句写长一点，让它跨页")
    print(f"共 {len(pg.pages)} 页，末页填充 {fill:.0%}" + ("  ✗ 超过小红书 18 张上限，删段落" if len(pg.pages) > 18 else ""))
    if fill < 0.25 and body_pages > 1:
        print(f"⚠ 末页只有 {fill:.0%}：删几句让它并进上一页，或者在结尾补一句回扣")
    return len(pg.pages)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(1 if main(sys.argv[1], sys.argv[2]) > 18 else 0)
