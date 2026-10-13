#!/usr/bin/env python3
"""公众号分支（10-13 起）：同一份 draft.md → 公众号的封面、标题、摘要、正文。正文一字不改，只换输出层。

和小红书首图的差别见 references/wechat_cover_guide.md，要点：
  公众号后台用同一张图裁 2.35:1（订阅号列表）和 1:1（群聊 / 朋友圈转发卡，默认取正中间），
  所以大字放在横幅正中间的安全正方形里，素材图放在正方形外的右侧；裁成 1:1 时只剩大字，缩略图里反而更清楚。

用法:
  python3 render_wechat.py <draft.md> <输出目录>      # 输出目录一般是 发布/<日期_标题>/公众号版

draft.md 里可选的字段（都不写也能出）:
  wechat_cover: 别跟 AI 说<br>==高级一点==   # 横幅大字，2 到 3 行，每行 6 字以内，==词== 打黄底；不写用 headline，再不写用 title
  wechat_kicker: 用 Claude 干活两年          # 大字上面一行小字；不写就没有（cover_kicker 也认）
  wechat_hero: map.png                      # 右侧素材图；不写用 hero；off 不放
  wechat_digest: 一句摘要                    # 120 字以内；不写取第一段
  wechat_title: 公众号标题                   # 64 字以内；不写用 title

出:
  封面.png            1800×766，上传公众号后台：2.35:1 用整张，1:1 用默认居中
  封面_1x1预览.png     默认居中裁出来的 1:1，看群聊缩略图里读不读得出
  预览.jpg            模拟订阅号列表、群聊转发卡、朋友圈三处
  标题.txt 摘要.txt 正文.md
"""
import math
import os
import re
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_meme as rm   # noqa: E402  复用 parse / font / circle / darkness / cover_lines / units

BW, BH = 1800, 766                       # 2.35:1
SQ_X0, SQ_X1 = (BW - BH) // 2, (BW - BH) // 2 + BH   # 默认 1:1 裁切区：x 517 到 1283
SAFE_PAD = 44                            # 大字离安全区边的最小距离
BOTTOM_KEEP = 90                         # 多图文群发时头条标题会压在横幅下沿，底部不放字
BG = (255, 255, 255)
MAX_PER_LINE, MAX_TOTAL = 6, 16
EXTREME = ["最", "第一", "唯一", "100%", "绝对", "顶级", "史上"]
HASHTAG = re.compile(r"^\s*(#\S+\s*)+$")


def draw_badge(im, d, avatar, name, x, y):
    """账号章：头像 + 账号名。给订阅号列表里的老读者认。"""
    av = rm.circle(avatar, 72)
    im.paste(av, (x, y), av)
    d.text((x + 88, y + 14), name, font=rm.font(36, "Medium"), fill=rm.NAME_ORANGE)


def fit_font(lines, box_w, box_h, cap=200):
    widest = max(rm.units(l.replace("==", "")) for l in lines)
    fs = int(min(cap, box_w / widest * 0.98, box_h / (len(lines) * 1.22)))
    return fs, rm.font(fs, "Semibold"), int(fs * 1.22)


def draw_big(d, lines, fb, lh, cx, y, fs):
    """大字逐行水平居中在 cx 上，==词== 打黄底。返回实际占用的 (x0, x1, y_end)。"""
    x0, x1 = BW, 0
    for ln in lines:
        plain = ln.replace("==", "")
        w = fb.getlength(plain)
        x = int(cx - w / 2)
        x0, x1 = min(x0, x), max(x1, x + int(w))
        for part in re.split(r"(==.+?==)", ln):
            if not part:
                continue
            mark = part.startswith("==") and part.endswith("==")
            t = part[2:-2] if mark else part
            pw = fb.getlength(t)
            if mark:
                d.rounded_rectangle((x - 8, y + int(fs * 0.12), x + pw + 8, y + int(fs * 1.14)), radius=14, fill=rm.YELLOW)
            d.text((x, y), t, font=fb, fill=rm.BLACK)
            x += pw
        y += lh
    return x0, x1, y


def place_hero(im, path, box, warn):
    """素材图铺满右侧的框（居中裁切，圆角），右边贴到横幅边上。太宽的图只露出中间一截，提醒换竖一点的。"""
    src = Image.open(path).convert("RGB")
    mean, dark = rm.darkness(src)
    if mean < rm.DARK_MEAN or dark > rm.DARK_SHARE:
        warn.append(f"⚠ 素材图太暗（平均亮度 {mean:.0f}，深色像素 {dark:.0%}）：列表里是一块黑，换亮的或 wechat_hero: off")
    bx0, by0, bx1, by1 = box
    bw, bh = bx1 - bx0, by1 - by0
    if src.width / src.height > 1.6:
        warn.append(f"⚠ 素材图太宽（{src.width}×{src.height}），右侧只露出中间一截：换一张竖的或接近方的（手机截图、人物照、框出一句话的截图），或 wechat_hero: off")
    scale = max(bw / src.width, bh / src.height)
    src = src.resize((math.ceil(src.width * scale), math.ceil(src.height * scale)), Image.LANCZOS)
    cx, cy = (src.width - bw) // 2, (src.height - bh) // 2
    src = src.crop((cx, cy, cx + bw, cy + bh))
    mask = Image.new("L", (bw * 2, bh * 2), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, bw * 2, bh * 2), radius=72, fill=255)
    mask = mask.resize((bw, bh), Image.LANCZOS)
    shadow = Image.new("RGB", (bw, bh), (226, 226, 226))
    im.paste(shadow, (bx0 - 2, by0 + 6), mask)
    im.paste(src, (bx0, by0), mask)


def banner(meta, avatar, base, warn):
    im = Image.new("RGB", (BW, BH), BG)
    d = ImageDraw.Draw(im)
    big = meta.get("wechat_cover") or meta.get("headline") or meta.get("title", "")
    lines = rm.cover_lines(big)
    if not lines:
        warn.append("✗ 没有大字：写 wechat_cover 或 headline")
        lines = ["（空）"]
    for ln in lines:
        if rm.units(ln.replace("==", "")) > MAX_PER_LINE:
            warn.append(f"✗ 大字「{ln.replace('==', '')}」超过每行 {MAX_PER_LINE} 字：1:1 缩略图里读不出，拆行或删字")
    total = sum(rm.units(l.replace("==", "")) for l in lines)
    if total > MAX_TOTAL:
        warn.append(f"✗ 大字共 {total:.0f} 字，超过 {MAX_TOTAL}：缩略图里是一团，留标题里最扎人的那几个字")
    if len(lines) > 3:
        warn.append("✗ 大字超过 3 行")
    for w in EXTREME:
        if w in big.replace("==", ""):
            warn.append(f"✗ 大字里有极限词「{w}」")

    hero = meta.get("wechat_hero") or meta.get("hero")
    hero_path = None
    if hero and hero != "off":
        hero_path = os.path.join(base, hero)
        if not os.path.exists(hero_path):
            warn.append(f"⚠ 找不到素材图 {hero_path}，按没有图出")
            hero_path = None

    kicker = meta.get("wechat_kicker") or meta.get("cover_kicker")
    badge_y = 52
    draw_badge(im, d, avatar, meta.get("account", "Krypto说AI"), SQ_X0 + SAFE_PAD, badge_y)

    top = badge_y + 72 + 40
    bottom = BH - BOTTOM_KEEP
    box_w = SQ_X1 - SQ_X0 - 2 * SAFE_PAD
    kicker_h = 0
    fk = rm.font(38, "Medium")
    if kicker:
        kicker_h = 62
    fs, fb, lh = fit_font(lines, box_w, bottom - top - kicker_h)
    block_h = kicker_h + lh * len(lines)
    y = top + max(0, (bottom - top - block_h) // 2)
    cx = BW // 2
    if kicker:
        kw = fk.getlength(kicker)
        d.text((int(cx - kw / 2), y), kicker, font=fk, fill=rm.KICKER_GREY)
        y += kicker_h
    x0, x1, y_end = draw_big(d, lines, fb, lh, cx, y, fs)
    if x0 < SQ_X0 + SAFE_PAD - 12 or x1 > SQ_X1 - SAFE_PAD + 12:
        warn.append("✗ 大字出了 1:1 安全区：群聊缩略图会切掉两头，减字")
    if y_end > BH - BOTTOM_KEEP + 10:
        warn.append("✗ 大字压到底部 90px：多图文群发时会被标题盖住")

    if hero_path:
        place_hero(im, hero_path, (SQ_X1 + 40, 56, BW + 80, BH - 56), warn)   # 右边出血，圆角只在左侧露出
        d.rectangle((0, 0, 14, BH), fill=rm.YELLOW)                             # 左边一道黄条，和右边的图配平
    else:
        for xx in (SQ_X0 - 110, SQ_X1 + 110):                                   # 没图：两道细线，别空成一片白
            d.line((xx, 150, xx, BH - 150), fill=rm.LINE, width=3)
    return im


def preview(ban, sq, title, digest, account, avatar, path):
    """模拟三处：订阅号列表（单图文）、群聊转发卡、朋友圈转发。灰底白卡。"""
    f_t, f_s, f_lab = rm.font(34, "Semibold"), rm.font(26), rm.font(28, "Medium")
    W, H = 1400, 1000
    sheet = Image.new("RGB", (W, H), (237, 237, 237))
    d = ImageDraw.Draw(sheet)

    def wrap_w(text, f, width, max_lines):
        out, cur = [], ""
        for ch in text:
            if f.getlength(cur + ch) > width:
                out.append(cur); cur = ch
            else:
                cur += ch
        if cur:
            out.append(cur)
        if len(out) > max_lines:
            out = out[:max_lines]
            out[-1] = out[-1][:-1] + "…"
        return out

    # 1. 订阅号消息列表（单图文）：横幅 + 标题 + 账号名
    d.text((60, 30), "① 订阅号消息列表（单图文）", font=f_lab, fill=(90, 90, 90))
    cx0, cy0, cw = 60, 80, 760
    bh = int(cw / BW * BH)
    d.rounded_rectangle((cx0, cy0, cx0 + cw, cy0 + bh + 150), radius=18, fill="white")
    sheet.paste(ban.resize((cw - 24, int((cw - 24) / BW * BH)), Image.LANCZOS), (cx0 + 12, cy0 + 12))
    y = cy0 + bh + 12
    for ln in wrap_w(title, f_t, cw - 48, 2):
        d.text((cx0 + 24, y), ln, font=f_t, fill=(20, 20, 20)); y += 44
    d.text((cx0 + 24, cy0 + bh + 108), f"{account}  ·  今天", font=f_s, fill=(150, 150, 150))

    # 2. 群聊转发卡：标题两行 + 1:1 小图
    d.text((880, 30), "② 群聊 / 私聊转发卡", font=f_lab, fill=(90, 90, 90))
    kx, ky, kw, kh = 880, 80, 460, 190
    d.rounded_rectangle((kx, ky, kx + kw, ky + kh), radius=14, fill="white")
    y = ky + 22
    for ln in wrap_w(title, rm.font(28, "Medium"), kw - 150, 2):
        d.text((kx + 20, y), ln, font=rm.font(28, "Medium"), fill=(20, 20, 20)); y += 38
    sheet.paste(sq.resize((104, 104), Image.LANCZOS), (kx + kw - 124, ky + 22))
    d.line((kx + 20, ky + kh - 46, kx + kw - 20, ky + kh - 46), fill=(235, 235, 235), width=2)
    d.text((kx + 20, ky + kh - 36), account, font=rm.font(22), fill=(150, 150, 150))

    # 3. 朋友圈转发：1:1 小图 + 标题
    d.text((880, 310), "③ 朋友圈转发", font=f_lab, fill=(90, 90, 90))
    px, py = 880, 360
    d.rounded_rectangle((px, py, px + 460, py + 150), radius=14, fill=(247, 247, 247))
    sheet.paste(sq.resize((120, 120), Image.LANCZOS), (px + 15, py + 15))
    y = py + 30
    for ln in wrap_w(title, rm.font(28), 300, 3):
        d.text((px + 150, y), ln, font=rm.font(28), fill=(20, 20, 20)); y += 36

    # 4. 摘要卡（转发到群里时，标题下面那行就是摘要）
    d.text((880, 550), "④ 摘要（转发卡 / 搜一搜里标题下面那行）", font=f_lab, fill=(90, 90, 90))
    d.rounded_rectangle((880, 600, 1340, 760), radius=14, fill="white")
    y = 620
    for ln in wrap_w(digest, rm.font(26), 420, 4):
        d.text((900, y), ln, font=rm.font(26), fill=(70, 70, 70)); y += 36

    # 5. 1:1 原尺寸对照
    d.text((60, 640), "⑤ 默认居中裁出的 1:1（后台可拖动）", font=f_lab, fill=(90, 90, 90))
    sheet.paste(sq.resize((300, 300), Image.LANCZOS), (60, 690))
    sheet.save(path, quality=90)


def body_md(blocks, title, base, caption_path):
    """公众号正文：标题 → 段落 → 图按文件名引用 → 文末接领取物（去掉标签行）。"""
    out = [f"# {title}", ""]
    for b in blocks:
        if "p" in b:
            out += [b["p"], ""]
        elif "head" in b:
            out += [f"**{b['head']}**", ""]
        elif "img" in b:
            out += [f"![{b['alt']}]({b['img']})", ""]
        elif "table" in b:
            rows = b["table"]
            if rows:
                out.append("| " + " | ".join(rows[0]) + " |")
                out.append("|" + "---|" * len(rows[0]))
                for r in rows[1:]:
                    out.append("| " + " | ".join(r) + " |")
                out.append("")
    gift = []
    if caption_path and os.path.exists(caption_path):
        paras = [p for p in open(caption_path, encoding="utf-8").read().split("\n\n") if p.strip()]
        paras = [p for p in paras if not HASHTAG.match(p.strip())]
        # 正文.txt 前面是要点复述，领取物从第一个「可以直接复制 / 下面 / 提示词 / 复制」之类的段开始；找不到就全接
        start = 0
        for i, p in enumerate(paras):
            if re.search(r"复制|贴给|照这个格式|提示词|配置|清单", p):
                start = i
                break
        gift = paras[start:]
    if gift:
        out += ["---", ""]
        for p in gift:
            out += [p, ""]
    return "\n".join(out).rstrip() + "\n"


def main(src, out):
    meta, blocks = rm.parse(open(src, encoding="utf-8").read())
    base = os.path.dirname(os.path.abspath(src))
    os.makedirs(out, exist_ok=True)
    av = os.path.join(base, meta.get("avatar", "avatar.png"))
    if not os.path.exists(av):
        av = os.path.join(rm.HERE, "..", "assets", "avatar.png")
    avatar = Image.open(av)
    warn = []

    title = meta.get("wechat_title") or meta.get("title", "")
    if len(title) > 64:
        warn.append(f"✗ 标题 {len(title)} 字，公众号上限 64")
    elif len(title) > 30:
        warn.append(f"⚠ 标题 {len(title)} 字：列表里会折成两行以上，30 字以内更稳")
    for w in EXTREME:
        if w in title:
            warn.append(f"✗ 标题里有极限词「{w}」")

    first = next((b["p"] for b in blocks if "p" in b), "")
    digest = meta.get("wechat_digest") or first
    if len(digest) > 120:
        cut = re.split(r"(?<=[。！？])", digest)
        d2, acc = "", ""
        for s in cut:
            if len(acc + s) > 120:
                break
            acc += s
        digest = acc or digest[:118] + "…"
        if meta.get("wechat_digest"):
            warn.append("✗ wechat_digest 超过 120 字，已按句截断，自己改一句")
        else:
            warn.append("⚠ 摘要取的是第一段并截到句号，建议写 wechat_digest 一句话")

    ban = banner(meta, avatar, base, warn)
    sq = ban.crop((SQ_X0, 0, SQ_X1, BH))
    ban.save(os.path.join(out, "封面.png"))
    sq.save(os.path.join(out, "封面_1x1预览.png"))
    preview(ban, sq, title, digest, meta.get("account", "Krypto说AI"), avatar, os.path.join(out, "预览.jpg"))
    open(os.path.join(out, "标题.txt"), "w", encoding="utf-8").write(title + "\n")
    open(os.path.join(out, "摘要.txt"), "w", encoding="utf-8").write(digest + "\n")
    caption = os.path.join(os.path.dirname(base), "正文.txt")      # meme版/正文.txt
    open(os.path.join(out, "正文.md"), "w", encoding="utf-8").write(body_md(blocks, title, base, caption))
    imgs = [b["img"] for b in blocks if "img" in b]
    print(f"公众号版 → {out}")
    print(f"  封面.png 1800×766（1:1 默认居中）  标题 {len(title)} 字  摘要 {len(digest)} 字  正文图 {len(imgs)} 张（上传时按文件名找：{', '.join(imgs) or '无'}）")
    for w in warn:
        print("  " + w)
    print("  Read 预览.jpg：②群聊缩略图里大字读不读得出；①列表里图和标题是不是同一件事")
    return 1 if any(w.startswith("✗") for w in warn) else 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2]))
