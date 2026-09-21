#!/usr/bin/env python3
"""发布日志：记录每篇笔记的选题 / 标题类型，回填数据，按类型复盘。

用法:
  post_log.py add    --dir <输出目录> --series 栏目 --no 12 --topic 人物访谈 --title-type 冲突 --score 8 --title "标题"
  post_log.py fill   --dir <输出目录> --impr 12000 --ctr 8.5 --saves 300 --follows 45 [--likes 500 --comments 30]
  post_log.py report
日志默认在 ~/Documents/Krypto说AI/log.csv，可用 --log 指定。
"""
import argparse
import csv
import datetime
import os
from collections import defaultdict

FIELDS = ["date", "dir", "series", "no", "topic", "title_type", "score", "title",
          "impr", "ctr", "likes", "saves", "comments", "follows"]
DEFAULT = os.path.expanduser("~/Documents/Krypto说AI/log.csv")


def load(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def save(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(rows)


def key(d):
    return os.path.basename(os.path.normpath(d))


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def report(rows):
    done = [r for r in rows if num(r["impr"])]
    print(f"共 {len(rows)} 篇，已回填 {len(done)} 篇")
    if not done:
        return
    for col, label in (("topic", "选题类型"), ("title_type", "标题类型")):
        groups = defaultdict(list)
        for r in done:
            groups[r[col] or "未填"].append(r)
        print(f"\n{label:<10}篇数  点击率%  收藏率%  单篇涨粉")
        stats = []
        for g, rs in groups.items():
            ctr = [num(r["ctr"]) for r in rs if num(r["ctr"]) is not None]
            sr = [num(r["saves"]) / num(r["impr"]) * 100 for r in rs if num(r["saves"]) is not None]
            fo = [num(r["follows"]) for r in rs if num(r["follows"]) is not None]
            avg = lambda xs: sum(xs) / len(xs) if xs else 0
            stats.append((avg(fo), g, len(rs), avg(ctr), avg(sr)))
        for fo, g, n, ctr, sr in sorted(stats, reverse=True):
            print(f"{g:<10}{n:>4}  {ctr:>7.1f}  {sr:>7.2f}  {fo:>8.0f}")
    top = sorted(done, key=lambda r: num(r["follows"]) or 0, reverse=True)[:3]
    print("\n涨粉前 3：")
    for r in top:
        print(f"  +{r['follows'] or 0}  {r['title']}（{r['topic']} / {r['title_type']}）")
    total = sum(num(r["follows"]) or 0 for r in done)
    print(f"\n累计涨粉（已回填部分）：{total:.0f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["add", "fill", "report"])
    ap.add_argument("--log", default=DEFAULT)
    ap.add_argument("--dir")
    for k in ("series", "no", "topic", "title-type", "score", "title",
              "impr", "ctr", "likes", "saves", "comments", "follows"):
        ap.add_argument("--" + k)
    a = ap.parse_args()
    rows = load(a.log)
    if a.cmd == "report":
        return report(rows)
    if not a.dir:
        ap.error("需要 --dir")
    vals = {f: getattr(a, f, None) for f in FIELDS if f not in ("date", "dir")}
    row = next((r for r in rows if r["dir"] == key(a.dir)), None)
    if a.cmd == "add" and row is None:
        row = dict.fromkeys(FIELDS, "")
        row.update(date=datetime.date.today().isoformat(), dir=key(a.dir))
        rows.append(row)
    if row is None:
        raise SystemExit(f"log 里没有 {key(a.dir)}，先 add")
    row.update({k: v for k, v in vals.items() if v is not None})
    save(a.log, rows)
    print(f"✓ {a.cmd}: {row['dir']}  →  {a.log}")


if __name__ == "__main__":
    main()
