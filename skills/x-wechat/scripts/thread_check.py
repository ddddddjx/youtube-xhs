#!/usr/bin/env python3
"""推特 thread 检查 + 打包。

用法: python3 thread_check.py <发布目录>
读   <发布目录>/推特版/thread.md   一条推一段，段与段之间一行 ---；配图写 ![说明](文件名)，单独一行
出   <发布目录>/推特版/thread.json  publish.py x 只读这个文件

图按文件名找：推特版/ → meme版/编辑用/ → meme版/ → 公众号版/。
拦（✗）：单条超过 280（X 的计法：中文、全角标点、emoji 算 2，链接一律算 23）、一条超过 4 张图、
图找不到 / 超过 5MB / 格式不对、极限词、少于 2 条或多于 25 条。
提示（⚠）：条数不在 5 到 10、话题标签超过 2 个、单条短于 40（多半是结构词孤段）。
"""
import json
import os
import re
import sys

EXTREME = ["最", "第一", "唯一", "100%", "绝对", "顶级", "史上"]
EXTREME_OK = ["最近", "最后", "最初", "最早", "最少", "最多", "最终"]  # 时间 / 数量词，不算极限词
IMG = re.compile(r"^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$")
URL = re.compile(r"https?://\S+")
EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MAX_IMG = 5 * 1024 * 1024
SEARCH = ["推特版", "meme版/编辑用", "meme版", "公众号版"]


def weight(text):
    """twitter-text v3 的计法：这几段 Unicode 算 1，其余算 2；URL 一律 23。"""
    n = 0
    for u in URL.findall(text):
        n += 23
    text = URL.sub("", text)
    for ch in text:
        c = ord(ch)
        if c <= 4351 or 8192 <= c <= 8205 or 8208 <= c <= 8223 or 8242 <= c <= 8247:
            n += 1
        else:
            n += 2
    return n


def parse(md):
    tweets = []
    for block in re.split(r"(?m)^\s*---\s*$", md):
        lines, imgs = [], []
        for line in block.strip("\n").splitlines():
            m = IMG.match(line)
            if m:
                imgs.append((m.group(1), m.group(2).strip()))
            else:
                lines.append(line.rstrip())
        text = "\n".join(lines).strip()
        text = re.sub(r"\n{3,}", "\n\n", text)
        if text or imgs:
            tweets.append({"text": text, "imgs": imgs})
    return tweets


def find_img(root, name):
    for sub in SEARCH:
        p = os.path.join(root, sub, name)
        if os.path.isfile(p):
            return os.path.relpath(p, root)
    return None


def main(root):
    src = os.path.join(root, "推特版", "thread.md")
    if not os.path.isfile(src):
        print(f"✗ 找不到 {src}")
        return 1
    tweets = parse(open(src, encoding="utf-8").read())
    errs, warns, out = [], [], []

    if not 2 <= len(tweets) <= 25:
        errs.append(f"✗ {len(tweets)} 条：thread 至少 2 条，超过 25 条 X 那边会很难看完")
    elif not 5 <= len(tweets) <= 10:
        warns.append(f"⚠ {len(tweets)} 条：约定是 5 到 10 条")

    for i, t in enumerate(tweets, 1):
        w = weight(t["text"])
        if not t["text"]:
            errs.append(f"✗ 第 {i} 条只有图没有字")
        if w > 280:
            errs.append(f"✗ 第 {i} 条 {w}/280，超了 {w - 280}（中文一个字算 2，约等于 140 个汉字）")
        elif 0 < w < 40 and i not in (1, len(tweets)):
            warns.append(f"⚠ 第 {i} 条只有 {w}：短到像结构词孤段，并进前后条")
        txt = t["text"]
        for ok in EXTREME_OK:
            txt = txt.replace(ok, "")
        for x in EXTREME:
            if x in txt:
                errs.append(f"✗ 第 {i} 条有极限词「{x}」")
        tags = re.findall(r"(?<!\S)#\S+", t["text"])
        if len(tags) > 2:
            warns.append(f"⚠ 第 {i} 条 {len(tags)} 个话题标签，X 上超过 2 个像广告号")
        if len(t["imgs"]) > 4:
            errs.append(f"✗ 第 {i} 条 {len(t['imgs'])} 张图，X 一条最多 4 张")
        paths = []
        for alt, name in t["imgs"]:
            p = find_img(root, name)
            if not p:
                errs.append(f"✗ 第 {i} 条的图 {name} 找不到（找过 {' / '.join(SEARCH)}）")
                continue
            if os.path.splitext(p)[1].lower() not in EXTS:
                errs.append(f"✗ 第 {i} 条的图 {name} 格式不对，只收 png / jpg / gif / webp")
            if os.path.getsize(os.path.join(root, p)) > MAX_IMG:
                errs.append(f"✗ 第 {i} 条的图 {name} 超过 5MB")
            paths.append({"path": p, "alt": alt[:1000]})
        out.append({"text": t["text"], "weight": w, "images": paths})

    if not any(t["images"] for t in out[:2]):
        warns.append("⚠ 前两条都没图：证据截图放第 1 或第 2 条，滑到第 3 条前没图的 thread 很少有人展开")

    print(f"推特版 → {len(out)} 条")
    for i, t in enumerate(out, 1):
        first = t["text"].splitlines()[0] if t["text"] else ""
        print(f"  {i:>2}. [{t['weight']:>3}/280] {len(t['images'])}图  {first[:30]}")
    for m in errs + warns:
        print("  " + m)
    if errs:
        return 1
    dst = os.path.join(root, "推特版", "thread.json")
    json.dump({"tweets": out}, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"  ✓ 写好 {os.path.relpath(dst, root)}，Mac 上跑 publish.py x 发")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1].rstrip("/")))
