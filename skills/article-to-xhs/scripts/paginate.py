#!/usr/bin/env python3
"""把一篇写好的长稿（draft.md）切成小红书卡片（cards.json），给 render_cards.py 出图。

先把文章当文章写完，再分页。分页只在段落之间切，不改一个字。

用法:
  python3 paginate.py <draft.md> <cards.json>

draft.md 格式:

  ---
  series: 长文精读
  no: 2
  source: 查马斯 / Social Capital        # 信源，只进 log 和正文来源行，不上封面
  cover: AI无处不在<br>除了在财报里        # 封面大字，两行，每行 5 到 6 字
  cover_image: cover_menzel.jpg          # 可选：封面大字下面的配图（公有领域油画 / 有授权的照片），放在 编辑用/
  cover_credit: 门采尔《轧铁厂》，1875    # 可选：封面来源，写进正文末尾，不上封面
  date: 09/28                            # 不写就用今天
  ab: 你是 A 先上 AI 边用边改，还是 B 先删流程再上 AI？
  slogan: 每周精读 2 篇好文章
  ---

  # 开场页标题<br>可以两行
  开场的段落……

  ## 小标题一
  这一节的段落。一节可以很长，脚本会自动切成几页：
  第一页放大标题，后面的续页只在页眉下放一行小字节名。

  ==单独成段的一句收束。==

  | 公司 | 估值 | 时间 |                 ← 以 | 开头的连续几行是一张表
  | A | 4 亿 | 2024-08 |

  ![图注 · 来源](ev_chart.jpg)            ← 证据图单独占一页
  > 紧跟在图后面、以 > 开头的段落，是这一页图上方的说明（合计 120 字以内）

  ## 看法页的标题<br>一句可以被反对的判断 {看法}
  理由……（这一节的最后会自动接一条分隔线和 ab 问题）

名片卡（末页）由 slogan 生成（gift 已停用）。不预告下一期（2026-09-28 起），写了 next 也不会上图。
"""
import datetime
import json
import math
import re
import sys

# 版式常量，和 render_cards.py 的 CSS 对应（1080x1440，dense 页）
INNER_H = 1440 - 64 - 60          # .page 上下 padding
TOP_H = 76 + 34                   # 头像页眉
BODY_W = 1080 - 72 * 2
FS, LH, P_GAP = 31, 31 * 1.6, 20  # dense 正文字号、行高、段距
H1_FS, H1_LH, H1_GAP = 58, 58 * 1.2, 30
KICKER_H = 34 + 14 + 2 + 26
HR_H = 10 + 2 + 18
ROW_H = 31 * 1.6 + 28 + 2
SAFE = 0.96                       # 估算留 4% 余量，避免溢出
UNITS_PER_LINE = BODY_W / FS


def units(text):
    """一行能放多少字：汉字和全角标点算 1，英文数字算 0.56。"""
    text = text.replace("==", "")
    return sum(1 if ord(c) > 0x2E7F else (0.28 if c == " " else 0.52) for c in text)


def p_height(text):
    return math.ceil(units(text) / UNITS_PER_LINE) * LH + P_GAP


def block_height(b):
    if "p" in b:
        return p_height(b["p"])
    if "table" in b:
        return len(b["table"]) * ROW_H + 28
    if b.get("hr"):
        return HR_H
    return 0


def h1_height(title):
    lines = title.split("<br>")
    n = sum(max(1, math.ceil(units(t) * H1_FS / BODY_W)) for t in lines)
    return n * H1_LH + H1_GAP


def capacity(title=None, kicker=None):
    h = INNER_H - TOP_H
    if kicker:
        h -= KICKER_H
    if title:
        h -= h1_height(title)
    return h * SAFE


def parse(md):
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n", md, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line and not line.strip().startswith("#"):
                k, v = line.split(":", 1)
                meta[k.strip()] = re.sub(r"\s+#\s.*$", "", v).strip()
        md = md[m.end():]
    sections, cur = [], None
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line.strip():
            continue
        hm = re.match(r"^(#{1,2})\s+(.+)$", line)
        if hm:
            title = hm.group(2).strip()
            kind = "open" if hm.group(1) == "#" else "body"
            if title.endswith("{看法}"):
                title, kind = title[:-4].strip(), "claim"
            cur = {"title": title, "kind": kind, "items": []}
            sections.append(cur)
            continue
        if cur is None:
            sys.exit("正文前面要先有一行「# 开场页标题」")
        im = re.match(r"^!\[(.*?)\]\((.+?)\)$", line.strip())
        if im:
            notes = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                notes.append(lines[i].lstrip()[1:].strip())
                i += 1
            cur["items"].append({"evidence": {"image": im.group(2), "caption": im.group(1)},
                                 "notes": [n for n in notes if n]})
            continue
        if line.lstrip().startswith("|"):
            rows = []
            i -= 1
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            cur["items"].append({"table": rows})
            continue
        cur["items"].append({"p": line.strip()})
    return meta, sections


def split_pages(blocks, caps):
    """把一串 block 切成若干页。caps(k) 给出第 k 页的可用高度。
    前面的页尽量填满，像书的一章；最后一页太短（不到四成）时，从上一页挪几段下来。"""
    hs = [block_height(b) for b in blocks]
    n = len(blocks)

    def glued(j):
        """第 j 个 block 不能做页首：单独成段的 ==短评== 和分隔线跟着上一段走。"""
        b = blocks[j]
        if b.get("hr"):
            return True
        if j > 0 and blocks[j - 1].get("hr"):
            return True
        return "p" in b and re.fullmatch(r"==.+==", b["p"]) is not None

    cuts, start, used, k = [], 0, 0, 0
    for j in range(n):
        if hs[j] > caps(1):
            sys.exit(f"有一段太长，一页放不下（约 {int(units(blocks[j].get('p', '')))} 字），拆成两段：\n  "
                     + blocks[j].get("p", "")[:40])
        if used + hs[j] > caps(k) and j > start:
            end = j
            while end - 1 > start and glued(end):      # 不让短评落在页首
                end -= 1
            cuts.append((start, end))
            start, k = end, k + 1
            used = sum(hs[start:j])
        used += hs[j]
    cuts.append((start, n))
    # 末页太短：从上一页挪段落下来，直到末页过四成，且上一页不低于六成
    while len(cuts) >= 2:
        (a0, a1), (b0, b1) = cuts[-2], cuts[-1]
        kb, ka = len(cuts) - 1, len(cuts) - 2
        if sum(hs[b0:b1]) / caps(kb) >= 0.4 or a1 - 1 <= a0:
            break
        m = a1 - 1
        while m - 1 > a0 and glued(m):
            m -= 1
        if sum(hs[a0:m]) / caps(ka) < 0.6 or sum(hs[m:b1]) > caps(kb):
            break
        cuts[-2], cuts[-1] = (a0, m), (m, b1)
    return [(blocks[a:b], sum(hs[a:b]) / caps(i)) for i, (a, b) in enumerate(cuts)]


HOOK_END = ("？", "?", "…", "：", ":", "——")


def is_hook(text):
    """页末钩子：一句 25 字以内的短句，或者停在问号、省略号、冒号上。
    对标 MemeInformation 180 篇：成熟期 40% 的页末是钩子短句或半句，逼读者翻页。"""
    t = text.replace("==", "").strip()
    return units(t) <= 25 or t.endswith(HOOK_END)


def hook_tips(pages):
    """统计正文页（开场、正文，不含看法页、证据页、名片卡）的最后一段是不是钩子。"""
    body = [(i, pg) for i, pg in enumerate(pages, 1)
            if pg.get("dense") and pg["blocks"] and not any(b.get("hr") for b in pg["blocks"])]
    if len(body) < 3:
        return []
    miss = [(i, pg["blocks"][-1].get("p", "")) for i, pg in body[:-1]
            if "p" in pg["blocks"][-1] and not is_hook(pg["blocks"][-1]["p"])]
    hooked = len(body) - 1 - len(miss)
    ok = hooked * 2 >= len(body) - 1
    tips = [("✓ " if ok else "") + f"页末钩子 {hooked}/{len(body) - 1} 页（至少一半）" + ("" if ok else
            "：下面几页停在一段长叙述上，在页末放一句 20 字以内的短句把下一页提起来"
            "（「问题出在第三步。」「但他没算到一件事。」），揭晓放到下一页第一句")]
    if not ok:
        tips += [f"  第 {i:02} 页末尾：…{p.replace('==', '')[-18:]}" for i, p in miss]
    return tips


def build(meta, sections):
    pages, report, tips = [], [], []
    if not meta.get("cover"):
        sys.exit("front matter 里缺 cover（封面大字）")
    cover = {"cover": True, "title": meta["cover"]}             # 09-29 起封面不放栏目期数角标
    if meta.get("cover_image"):
        cover["evidence"] = {"image": meta["cover_image"]}      # 不加图注：封面只有大字和图
    pages.append(cover)
    report.append(("封面", meta["cover"].replace("<br>", " / "), None))

    for sec in sections:
        title = sec["title"]
        kicker = re.sub(r"<br>", "", title)
        # 把证据图从正文流里拿出来，各占一页，位置保持在它出现的地方
        runs, cur = [], []
        for it in sec["items"]:
            if "evidence" in it:
                if cur:
                    runs.append(("text", cur))
                    cur = []
                runs.append(("evidence", it))
            else:
                cur.append(it)
        if cur:
            runs.append(("text", cur))
        first = True
        for kind, payload in runs:
            if kind == "evidence":
                notes = payload["notes"]
                n = sum(len(x) for x in notes)
                if n > 130:
                    print(f"⚠ 证据页说明 {n} 字，超过 120，图会被挤小：{payload['evidence']['image']}")
                pg = {"blocks": [{"p": x} for x in notes], "evidence": payload["evidence"]}
                pg["title" if first else "kicker"] = title if first else kicker
                pages.append(pg)
                report.append(("证据", kicker, None))
                first = False
                continue
            blocks = list(payload)
            if sec["kind"] == "claim" and payload is runs[-1][1] and meta.get("ab"):
                blocks += [{"hr": True}, {"p": "==" + meta["ab"].strip("=") + "=="}]
            start_with_title = first

            def caps(k, s=start_with_title):
                return capacity(title=title) if (k == 0 and s) else capacity(kicker=kicker)

            parts = split_pages(blocks, caps)
            after_image = not first and any(k == "evidence" for k, _ in runs[:runs.index((kind, payload))])
            if after_image and len(parts) == 1 and parts[0][1] < 0.5:
                tips.append(f"「{kicker}」证据图后面只剩 {sum(len(b.get('p', '')) for b in blocks)} 字，"
                            "会单独占一页：把这几段挪到图的前面，让图做这一节的最后一页")
            for k, (blks, fill) in enumerate(parts):
                pg = {"dense": True, "blocks": blks}
                if k == 0 and first:
                    pg["title"] = title
                else:
                    pg["kicker"] = kicker
                pages.append(pg)
                chars = sum(len(b.get("p", "").replace("==", "")) for b in blks)
                report.append(("看法" if sec["kind"] == "claim" else "正文", kicker, (chars, fill)))
            # 这一节整体偏空时，告诉作者补多少字能填满，或删多少字能少一页
            total_cap = sum(caps(k) for k in range(len(parts)))
            used = sum(block_height(b) for b in blocks)
            if used / total_cap < 0.75:
                per_px = UNITS_PER_LINE * 0.85 / LH          # 每像素高度大约能放的字数（扣掉段尾空白）
                add = int((total_cap * 0.93 - used) * per_px / 10) * 10
                tip = f"「{kicker}」共 {len(parts)} 页，平均填充 {used / total_cap:.0%}：再展开约 {add} 字可以填满"
                if len(parts) > 1:
                    cut = int((used - (total_cap - caps(len(parts) - 1)) * 0.97) * per_px / 10 + 1) * 10
                    if cut > 0:
                        tip += f"，或删约 {cut} 字少一页"
                tips.append(tip)
            first = False

    tips += hook_tips(pages)
    if meta.get("next"):
        print("⚠ front matter 里有 next：已停用下一期预告，名片卡不会放它，删掉这一行")
    card = [{"p": meta.get("slogan", "每周精读 2 篇好文章")}]
    if meta.get("gift"):
        print("⚠ front matter 里有 gift：09-30 起名片卡不写「扣 1 领」，已忽略；领取物想给就在评论里直接给")
    pages.append({"title": "关注 Krypto说AI", "blocks": card})
    report.append(("名片卡", "关注 Krypto说AI", None))
    return pages, report, tips


def main(src, dst):
    meta, sections = parse(open(src, encoding="utf-8").read())
    if not sections or sections[0]["kind"] != "open":
        sys.exit("第一节必须是「# 开场页标题」")
    if not any(s["kind"] == "claim" for s in sections):
        print("⚠ 没有 {看法} 节：最后一节标题后面加上 {看法}")
    pages, report, tips = build(meta, sections)
    date = meta.get("date") or datetime.date.today().strftime("%m/%d")
    spec = {"account": {"name": meta.get("account", "Krypto说AI"), "avatar_image": "avatar.png", "date": date},
            "pages": pages}
    json.dump(spec, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    for i, (kind, name, info) in enumerate(report, 1):
        extra = ""
        if info:
            chars, fill = info
            extra = f"  {chars} 字，填充 {fill:.0%}"
        print(f"{i:02} {kind}  {name}{extra}")
    for t in tips:
        print(t if t.startswith(("✓", "  ")) else "⚠ " + t)
    n = len(pages)
    print(f"共 {n} 页" + ("  ✗ 超过小红书 18 张上限，删一节或合并" if n > 18 else ""))
    if n > 18:
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
