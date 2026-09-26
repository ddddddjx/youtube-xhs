#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增量更新差量：对比「重新全量爬取的 _ingest.json」与「现有 _provenance_map.json」，
找出新增 item，写出 _ingest_new.json 供下游只处理增量；并保留现有 map 不动。

用法:
  python incremental.py <workdir> [full_ingest.json]

流程（配合 build_provenance --merge 使用）：
  1. adapter 重新全量爬取博主主页 -> _ingest.json（含全部历史+新内容）
  2. 跑本脚本 -> 产出 _ingest_new.json（仅新增），并打印新增/已有/失效报告
  3. 对新增跑 Step2~5 熔合长文（可后台分批）
  4. build_provenance.py <workdir> _ingest_new.json --merge  -> 追加到 _provenance_map.json
  5. gen_index.py <workdir> 重新生成溯源索引

判定新增：优先按 id（note id / video id）；id 缺失时退化为 num。
"""
import json
import os
import sys
import glob


def key_of(it):
    return str(it.get("id") or it.get("num"))


def main():
    if len(sys.argv) < 2:
        print("usage: python incremental.py <workdir> [full_ingest.json]")
        sys.exit(1)
    workdir = sys.argv[1]
    ingest_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(workdir, "_ingest.json")
    map_path = os.path.join(workdir, "_provenance_map.json")

    if not os.path.exists(ingest_path):
        print(f"[ERR] 找不到 {ingest_path}")
        sys.exit(1)

    full = json.load(open(ingest_path, encoding="utf-8")).get("items", [])
    existing = set()
    if os.path.exists(map_path):
        for it in json.load(open(map_path, encoding="utf-8")):
            if isinstance(it, dict):
                existing.add(str(it.get("id") or it.get("num")))

    new_items = [it for it in full if key_of(it) not in existing]
    removed = [k for k in existing if k not in {key_of(it) for it in full}]

    out_path = os.path.join(workdir, "_ingest_new.json")
    json.dump({"platform": full[0].get("platform") if full else "",
               "blogger": full[0].get("blogger") if full else "",
               "items": new_items},
              open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"[OK] 全量 {len(full)} 条 | 已有 {len(existing)} 条 | 新增 {len(new_items)} 条 | 失效(仅map有) {len(removed)} 条")
    print(f"      新增已写出 -> {out_path}")
    if new_items:
        print("      新增编号:", [it.get("num") for it in new_items])
    if removed:
        print("      [提示] 失效编号(原map有但本次未爬到，可能已删除/私密):", removed)


if __name__ == "__main__":
    main()
