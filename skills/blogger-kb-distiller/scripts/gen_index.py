#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
由 _units.json + _provenance_map.json 生成 溯源与时间索引.md。
用法: python gen_index.py <workdir>
输出: <workdir>/05_精读摘要/溯源与时间索引.md
每篇长文 -> 源视频清单(编号/日期/标题) + 路径，便于反向查证。
"""
import glob
import json
import os
import sys


def main():
    if len(sys.argv) < 2:
        print("usage: python gen_index.py <workdir>")
        sys.exit(1)
    workdir = sys.argv[1]
    units_path = os.path.join(workdir, "_units.json")
    prov_path = os.path.join(workdir, "_provenance_map.json")
    if not (os.path.exists(units_path) and os.path.exists(prov_path)):
        print("[ERR] 需要 _units.json 与 _provenance_map.json")
        sys.exit(1)

    units = json.load(open(units_path, encoding="utf-8"))
    prov = json.load(open(prov_path, encoding="utf-8"))
    pmap = {p["num"]: p for p in prov}

    art_dir = os.path.join(workdir, "05_精读摘要")
    os.makedirs(art_dir, exist_ok=True)

    lines = ["# 溯源与时间索引", "",
             "> 每篇精读长文 → 融合的源视频清单（编号 / 发布日期 / 标题）+ 文件路径。",
             "> 正文段末的 `（来源：视频#N，发布 YYYY-MM-DD）` 可定位到具体视频。", ""]

    for u in units:
        uid = u.get("id")
        files = u.get("files", [])
        # id 形如 "u01"（字符串）或 1（整数），统一成文件名前缀
        if isinstance(uid, str) and uid[:1].lower() == "u":
            prefix = uid[1:]
        else:
            try:
                prefix = f"{int(uid):02d}"
            except (TypeError, ValueError):
                prefix = str(uid)
        cand = sorted(glob.glob(os.path.join(art_dir, f"{prefix}_*.md")))
        art = os.path.basename(cand[0]) if cand else f"{prefix}_?.md"
        # files 可能是 [{num,title,path}] 字典列表，也可能是 [num] 整数列表
        nums = []
        for fobj in files:
            if isinstance(fobj, dict):
                try:
                    nums.append(int(fobj.get("num")))
                except (TypeError, ValueError):
                    pass
            else:
                try:
                    nums.append(int(fobj))
                except (TypeError, ValueError):
                    pass
        srcs = []
        for n in nums:
            p = pmap.get(n)
            if p:
                srcs.append(f"#{n} ({p['date']}) {p['title']}")
        lines.append(f"## {art}")
        lines.append(f"**来源视频（{len(srcs)} 个）**：")
        for s in srcs:
            lines.append(f"- {s}")
        lines.append(f"路径：`05_精读摘要/{art}`")
        lines.append("")

    out = os.path.join(art_dir, "溯源与时间索引.md")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[OK] wrote {out}  ({len(units)} units)")


if __name__ == "__main__":
    main()
