#!/usr/bin/env python3
"""公众号版 → 能直接推进草稿箱的包（云端跑，要 Pillow）。

用法: python3 prep_wechat.py <发布目录> [--author Krypto说AI] [--no-comment]
前提: 先跑过 meme-xhs 的 render_wechat.py，<发布目录>/公众号版/ 里有 正文.md、标题.txt、摘要.txt、封面.png
出   公众号版/正文.html   带内联样式（公众号编辑器会删 <style>），图指向 upload/ 下的文件，浏览器打开就是预览
     公众号版/upload/     正文图压到 1MB 以内（uploadimg 的上限）、封面转 jpg
     公众号版/wechat.json  publish.py wechat 只读这个文件

正文.md 的第一行 # 标题 不进 HTML：草稿箱的标题是单独字段，正文里再写一遍会出现两次。
"""
import html
import json
import os
import re
import shutil
import sys

from PIL import Image

SEARCH = ["公众号版", "meme版/编辑用", "meme版"]
MAX_BODY_IMG = 1024 * 1024 - 8 * 1024
EXTREME = ["最", "第一", "唯一", "100%", "绝对", "顶级", "史上"]

P = "margin:0 0 1.2em;font-size:16px;line-height:1.85;color:#222;letter-spacing:0.5px;text-align:justify;"
H = "margin:1.8em 0 0.8em;font-size:18px;font-weight:bold;color:#111;line-height:1.5;"
IMGS = "display:block;max-width:100%;height:auto;margin:1.2em auto 0.4em;border-radius:4px;"
CAP = "margin:0 0 1.4em;font-size:13px;color:#888;text-align:center;line-height:1.5;"
HR = "border:0;border-top:1px solid #e5e5e5;margin:2em 0;"
TD = "border:1px solid #ddd;padding:6px 8px;font-size:14px;line-height:1.6;color:#222;"
HL = "background:#FFE14D;padding:0 2px;"


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"==(.+?)==", rf'<span style="{HL}">\1</span>', s)
    s = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r"\1", s)    # 未开通外链的号点不了，留字去链接
    return s


def find_img(root, name):
    for sub in SEARCH:
        p = os.path.join(root, sub, name)
        if os.path.isfile(p):
            return p
    return None


def shrink(src, dst_dir, stem, limit):
    """存成 jpg，质量从 92 往下降，宽度最多 1080，直到小于 limit。返回相对 公众号版/ 的路径。"""
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if im.width > 1080 and limit == MAX_BODY_IMG:
        im = im.resize((1080, round(im.height * 1080 / im.width)), Image.LANCZOS)
    out = os.path.join(dst_dir, stem + ".jpg")
    for q in (92, 85, 78, 70, 62, 55):
        im.save(out, "JPEG", quality=q, optimize=True)
        if os.path.getsize(out) <= limit:
            break
    return os.path.relpath(out, os.path.dirname(dst_dir))


def to_html(md, root, up_dir, errs):
    lines = md.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    out, images, i = [], [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)$", line)
        if m:
            alt, name = m.group(1), m.group(2).strip()
            src = find_img(root, name)
            if not src:
                errs.append(f"✗ 正文图 {name} 找不到（找过 {' / '.join(SEARCH)}）")
            else:
                rel = shrink(src, up_dir, f"img{len(images) + 1:02d}", MAX_BODY_IMG)
                images.append(rel)
                out.append(f'<p style="text-align:center;margin:0;"><img src="{rel}" style="{IMGS}" alt="{html.escape(alt)}"></p>')
                if alt:
                    out.append(f'<p style="{CAP}">{html.escape(alt)}</p>')
            i += 1
        elif line == "---":
            out.append(f'<hr style="{HR}">')
            i += 1
        elif line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            body = "".join(
                "<tr>" + "".join(
                    f'<td style="{TD}{"font-weight:bold;background:#f6f6f6;" if r == 0 else ""}">{inline(c)}</td>'
                    for c in row) + "</tr>"
                for r, row in enumerate(rows))
            out.append(f'<table style="border-collapse:collapse;width:100%;margin:0 0 1.2em;"><tbody>{body}</tbody></table>')
        elif re.fullmatch(r"\*\*(.+)\*\*", line) or line.startswith("## "):
            text = re.sub(r"^##\s+|\*\*", "", line)
            out.append(f'<h3 style="{H}">{inline(text)}</h3>')
            i += 1
        else:
            para = [line]
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(r"!\[|\||---$|\*\*.+\*\*$|## ", lines[i].strip()):
                para.append(lines[i].strip())
                i += 1
            out.append(f'<p style="{P}">{"<br>".join(inline(p) for p in para)}</p>')
    return "\n".join(out), images


def main(argv):
    if not argv or argv[0].startswith("-"):
        sys.exit(__doc__)
    root = argv[0].rstrip("/")
    author = argv[argv.index("--author") + 1] if "--author" in argv else "Krypto说AI"
    wx = os.path.join(root, "公众号版")
    need = ["正文.md", "标题.txt", "摘要.txt", "封面.png"]
    miss = [n for n in need if not os.path.isfile(os.path.join(wx, n))]
    if miss:
        print(f"✗ 公众号版/ 缺 {'、'.join(miss)}：先跑 meme-xhs/scripts/render_wechat.py")
        return 1
    up = os.path.join(wx, "upload")
    shutil.rmtree(up, ignore_errors=True)
    os.makedirs(up)

    errs, warns = [], []
    title = open(os.path.join(wx, "标题.txt"), encoding="utf-8").read().strip()
    digest = open(os.path.join(wx, "摘要.txt"), encoding="utf-8").read().strip()
    body, images = to_html(open(os.path.join(wx, "正文.md"), encoding="utf-8").read(), root, up, errs)
    cover = shrink(os.path.join(wx, "封面.png"), up, "cover", 9 * 1024 * 1024)

    if len(title) > 64:
        errs.append(f"✗ 标题 {len(title)} 字，草稿箱上限 64")
    if len(digest) > 120:
        errs.append(f"✗ 摘要 {len(digest)} 字，上限 120")
    if len(author) > 8:
        warns.append(f"⚠ 作者「{author}」{len(author)} 个字：后台作者栏手填限 8 字，接口要是报错就加 --author 改短")
    for w in EXTREME:
        if w in title:
            errs.append(f"✗ 标题里有极限词「{w}」")
    plain = re.sub(r"<[^>]+>", "", body)
    if len(plain) > 20000:
        errs.append(f"✗ 正文 {len(plain)} 字，公众号上限 2 万")
    if len(body.encode()) > 1_000_000:
        errs.append("✗ 正文 HTML 超过 1MB")
    if not images:
        warns.append("⚠ 正文里一张图都没有：至少放一张原文证据截图")

    page = (f'<section style="padding:0 4px;font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\','
            f'\'Hiragino Sans GB\',\'Microsoft YaHei\',sans-serif;">\n{body}\n</section>\n')
    open(os.path.join(wx, "正文.html"), "w", encoding="utf-8").write(page)
    meta = {
        "title": title,
        "author": author,
        "digest": digest,
        "html": "正文.html",
        "cover": cover,
        "images": images,
        "need_open_comment": 0 if "--no-comment" in argv else 1,
    }
    json.dump(meta, open(os.path.join(wx, "wechat.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"公众号草稿包 → {wx}")
    print(f"  标题 {len(title)} 字  摘要 {len(digest)} 字  正文 {len(plain)} 字  正文图 {len(images)} 张  评论 {'开' if meta['need_open_comment'] else '关'}")
    for m in errs + warns:
        print("  " + m)
    if errs:
        os.remove(os.path.join(wx, "wechat.json"))
        return 1
    print("  ✓ 浏览器打开 公众号版/正文.html 看一眼排版；Mac 上跑 publish.py wechat 推草稿")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
