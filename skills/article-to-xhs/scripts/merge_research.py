#!/usr/bin/env python3
"""把几路并行研究交回的文件合并成 编辑用/ 下的 参考资料.md、场景卡.md、出入清单.md。

每一路的文件里，参考资料各自编号（A1、B1、C1……），场景卡和出入清单里用这些编号指向出处。
合并时统一改成 R1、R2……，同一个链接只留一条，场景卡重新编号。

用法:
  python3 merge_research.py <编辑用目录> <research_A.md> [research_B.md ...]

每一路的文件要有三个二级标题，标题里分别含「参考资料」「场景卡」「出入清单」。
参考资料每行写成：A1 - [一手] 作者, 媒体, "标题", 日期 — 用到的事实 — 链接
合并只是机械活：合并之后仍要逐条核对，尤其是只有一家二手支撑的数字。
"""
import os
import re
import sys

REF = re.compile(r"^([A-Z]{1,2})(\d+)\s*[-–—]\s*(\[(?:一手|二手|原文)\].*)$")
URL = re.compile(r"https?://\S+")


def split_sections(text):
    parts = {"refs": "", "unread": "", "cards": "", "diffs": ""}
    chunks = re.split(r"(?m)^(#{1,3} .*)$", text)
    cur = None
    for c in chunks:
        if re.match(r"^#{1,3} ", c):
            t = c.strip("# ").strip()
            level = len(c) - len(c.lstrip("#"))
            if "未能直接读到" in t:
                cur = "unread"
            elif level <= 2 and "参考资料" in t:
                cur = "refs"
            elif level <= 2 and "场景卡" in t:
                cur = "cards"
            elif level <= 2 and "出入" in t:
                cur = "diffs"
            elif cur in ("cards", "diffs") or (cur == "refs" and level == 3):
                parts[cur] += c + "\n"          # 卡片标题、参考资料的小分类保留
            continue
        if cur:
            parts[cur] += c
    return parts


def main(out_dir, files):
    refs, seen, unread, cards, diffs = [], {}, [], [], []
    old = os.path.join(out_dir, "参考资料.md")
    if os.path.exists(old):
        for line in open(old, encoding="utf-8"):
            m = re.match(r"^R\d+\s*[-–—]\s*(\[(?:一手|二手|原文)\].*)$", line.strip())
            if m:
                body = m.group(1)
                refs.append(body)
                for u in URL.findall(body):
                    seen[u.rstrip("）).,")] = len(refs)
    for f in files:
        parts = split_sections(open(f, encoding="utf-8").read())
        mapping = {}
        for line in parts["refs"].splitlines():
            m = REF.match(line.strip())
            if not m:
                continue
            key, body = m.group(1) + m.group(2), m.group(3)
            urls = [u.rstrip("）).,") for u in URL.findall(body)]
            hit = next((seen[u] for u in urls if u in seen), None)
            if hit:
                mapping[key] = hit
                continue
            refs.append(body)
            mapping[key] = len(refs)
            for u in urls:
                seen[u] = len(refs)

        def renum(text, mapping=mapping):
            return re.sub(r"(?<![A-Za-z0-9])([A-Z]{1,2}\d+)(?![A-Za-z0-9])",
                          lambda m: f"R{mapping[m.group(1)]}" if m.group(1) in mapping else m.group(1), text)

        if parts["unread"].strip():
            unread.append(renum(parts["unread"].strip()))
        if parts["cards"].strip():
            cards.append(renum(parts["cards"].strip()))
        if parts["diffs"].strip():
            diffs.append(f"<!-- 来自 {os.path.basename(f)} -->\n" + renum(parts["diffs"].strip()))

    first = sum(1 for r in refs if r.startswith("[一手]"))
    with open(old, "w", encoding="utf-8") as w:
        w.write("# 参考资料\n\n只收亲自打开读过的。链接只留在这个文件里，不进卡片和正文。\n\n")
        for i, r in enumerate(refs, 1):
            w.write(f"R{i} - {r}\n")
        w.write("\n## 未能直接读到\n\n" + "\n\n".join(unread) + "\n")
    n = 0
    out = []
    for block in cards:
        def bump(m):
            nonlocal n
            n += 1
            title = re.sub(r"^场景\s*[A-Za-z]?\d+\s*[:：]\s*", "", m.group(2))
            return f"## 场景 {n}：{title}"
        out.append(re.sub(r"(?m)^(#{2,3})\s*(场景.*)$", bump, block))
    open(os.path.join(out_dir, "场景卡.md"), "w", encoding="utf-8").write("# 场景卡\n\n" + "\n\n".join(out) + "\n")
    open(os.path.join(out_dir, "出入清单.md"), "w", encoding="utf-8").write(
        "# 出入清单\n\n素材的说法和原始出处不一致的地方。这里常常有稿子里最好的一笔。\n\n" + "\n\n".join(diffs) + "\n")
    print(f"参考资料 {len(refs)} 条，其中一手 {first} 条；场景卡 {n} 张；出入清单来自 {len(diffs)} 路")
    if len(refs) < 12 or first < 5 or n < 8:
        print("⚠ 还没到达标线（参考资料 12 条、一手 5 条、场景卡 8 张），继续查")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2:])
