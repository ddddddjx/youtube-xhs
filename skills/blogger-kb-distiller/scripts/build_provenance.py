#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
由 adapter 产出的统一中间格式 _ingest.json 生成 _provenance_map.json。

用法:
  python build_provenance.py <workdir> [_ingest.json] [--force] [--strict] [--merge]

选项:
  --force   覆盖已存在的 _provenance_map.json（即使新数据更少），跳过覆盖保护
  --strict  若存在缺 date 的 item 则中止写入并退出码 2（时间锚定必须有锚点）
  --merge   与现有 _provenance_map.json 按 num 合并（保留旧条目，追加新条目），用于增量更新

输出: <workdir>/_provenance_map.json  -> [{num,title,id,date,file}, ...]  (按 date,num 排序)
"""
import json
import os
import sys


def main():
    force = "--force" in sys.argv
    strict = "--strict" in sys.argv
    merge = "--merge" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 1:
        print("usage: python build_provenance.py <workdir> [_ingest.json] [--force] [--strict] [--merge]")
        sys.exit(1)
    workdir = args[0]
    ingest_path = args[1] if len(args) > 1 else os.path.join(workdir, "_ingest.json")
    if not os.path.exists(ingest_path):
        print(f"[ERR] 找不到 {ingest_path}")
        sys.exit(1)

    with open(ingest_path, encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("items", [])

    # ---- 日期校验 ----
    missing = [it for it in items if not it.get("date")]
    if missing:
        print(f"[WARN] {len(missing)}/{len(items)} 个 item 缺 date 字段（时间锚定将无锚点，段落级『近期/近几年』无法定位）")
    if strict and missing:
        print("[ABORT] --strict：存在缺 date 的 item，已中止写入。请补全 _ingest.json 的 date 后再跑。")
        sys.exit(2)

    prov = []
    for it in items:
        prov.append({
            "num": it.get("num"),
            "title": it.get("title", ""),
            "id": it.get("id", ""),
            "date": it.get("date", ""),
            "file": it.get("file", ""),
        })

    out = os.path.join(workdir, "_provenance_map.json")

    # ---- 覆盖保护（非 merge 时）----
    if os.path.exists(out) and not force and not merge:
        try:
            old = json.load(open(out, encoding="utf-8"))
            if isinstance(old, list) and len(old) > len(prov):
                print(f"[ABORT] 已存在 {out} 含 {len(old)} 条，新数据仅 {len(prov)} 条。"
                      f"若确认要覆盖，加 --force；若要增量合并，加 --merge。")
                sys.exit(2)
        except Exception:
            pass

    # ---- 增量合并 ----
    if merge and os.path.exists(out):
        try:
            old = json.load(open(out, encoding="utf-8"))
            oldd = {x["num"]: x for x in old if isinstance(x, dict) and "num" in x}
            added = 0
            for it in prov:
                if it["num"] not in oldd:
                    oldd[it["num"]] = it
                    added += 1
            prov = list(oldd.values())
            print(f"[MERGE] 现有 {len(old)} 条，新增 {added} 条")
        except Exception as e:
            print(f"[WARN] 合并失败，按全量写入：{e}")

    # 排序：先按日期，再按编号，便于溯源区块按时间升序
    prov.sort(key=lambda x: (x["date"] or "0000-00-00", x["num"] if isinstance(x["num"], int) else 0))

    with open(out, "w", encoding="utf-8") as f:
        json.dump(prov, f, ensure_ascii=False, indent=2)
    print(f"[OK] wrote {out}  ({len(prov)} items)")


if __name__ == "__main__":
    main()
