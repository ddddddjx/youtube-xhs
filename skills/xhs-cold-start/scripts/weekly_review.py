#!/usr/bin/env python3
"""每周复盘看板：读工作区的 发布日志.csv（youtube-xhs/scripts/post_log.py 写的），按原流程的阈值给每篇诊断，
写出 复盘/<周>.md。脚本只算数；最好 / 最差一篇的原因、评论区选题、下周排什么，由 Claude 读完补写。

用法:
  python3 weekly_review.py <工作区> [--week 2026-W40]   # 不给 --week 就用最近一篇的发布周
  python3 weekly_review.py <工作区> --all              # 全部已回填的笔记，按类型汇总（攒够四周再看）

口径（小红书后台）：
  点击率 = ctr（后台给的封面点击率，%）
  收藏率 = 收藏 ÷ 观看（没有观看数时用 曝光 × 点击率 估算）
  互动率 = (赞 + 评论 + 分享) ÷ 观看
"""
import argparse
import csv
import datetime
import os
import sys
from collections import defaultdict

# (好, 及格) 两道线，以及三档的诊断
RULES = {
    "点击率": (10, 5, ["优秀", "及格", "换标题 / 封面"]),
    "收藏率": (5, 3, ["形态对了", "赠品不够", "换清单体"]),
    "互动率": (3, 1, ["痛点准", "加过来人语气", "加提问引导"]),
}


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def week_of(date_str):
    d = datetime.date.fromisoformat(date_str)
    y, w, _ = d.isocalendar()
    return f"{y}-W{w:02d}"


def metrics(r):
    impr, ctr = num(r.get("impr")), num(r.get("ctr"))
    views = num(r.get("views"))
    if views is None and impr and ctr is not None:
        views = impr * ctr / 100
    out = {"点击率": ctr}
    saves = num(r.get("saves"))
    out["收藏率"] = saves / views * 100 if (views and saves is not None) else None
    inter = [num(r.get(k)) for k in ("likes", "comments", "shares")]
    out["互动率"] = sum(x for x in inter if x) / views * 100 if (views and any(x is not None for x in inter)) else None
    return out


def grade(name, v):
    if v is None:
        return "—"
    hi, lo, labels = RULES[name]
    return labels[0] if v > hi else labels[1] if v >= lo else labels[2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workspace")
    ap.add_argument("--week")
    ap.add_argument("--all", action="store_true")
    a = ap.parse_args()
    log = os.path.join(a.workspace, "发布日志.csv")
    if not os.path.exists(log):
        sys.exit(f"没有 {log}：先用 post_log.py add --log \"{log}\" 登记笔记")
    rows = list(csv.DictReader(open(log, encoding="utf-8-sig", newline="")))
    done = [r for r in rows if num(r.get("impr"))]
    if not done:
        sys.exit("日志里还没有回填数据：用 post_log.py fill 填曝光、点击率、赞藏评")

    if a.all:
        sel, label = done, "全部"
    else:
        wk = a.week or week_of(max(r["date"] for r in done))
        sel, label = [r for r in done if week_of(r["date"]) == wk], wk
        if not sel:
            sys.exit(f"{wk} 没有已回填的笔记")

    out = [f"# 复盘 {label}", "", f"共 {len(sel)} 篇（日志里 {len(rows)} 篇，已回填 {len(done)} 篇）", "",
           "| 发布 | 标题 | 类型 | 曝光 | 点击率 | 收藏率 | 互动率 | 涨粉 | 诊断 |",
           "|---|---|---|---|---|---|---|---|---|"]
    scored = []
    for r in sorted(sel, key=lambda r: r["date"]):
        m = metrics(r)
        diag = "；".join(f"{k}{grade(k, v)}" for k, v in m.items() if v is not None)
        fmt = lambda v: f"{v:.1f}%" if v is not None else "—"
        out.append(f"| {r['date']} | {r['title'][:20]} | {r.get('topic') or '—'} | {r['impr']} | {fmt(m['点击率'])} | "
                   f"{fmt(m['收藏率'])} | {fmt(m['互动率'])} | {r.get('follows') or '—'} | {diag} |")
        # 先比几项过了「好」线，再比涨粉，再比点击率
        score = (sum(1 for k, v in m.items() if v is not None and v > RULES[k][0]),
                 num(r.get("follows")) or 0, m["点击率"] or 0)
        scored.append((score, r, m))

    scored.sort(key=lambda x: x[0], reverse=True)  # 最好 = 过线项数最多，同数时涨粉多
    best, worst = scored[0], scored[-1]
    out += ["", f"最好的一篇：《{best[1]['title']}》", f"最差的一篇：《{worst[1]['title']}》" if len(scored) > 1 else ""]

    # 按类型、按发布时段汇总（样本少时只看方向）
    for col, name in (("topic", "类型"), ("title_type", "标题类型")):
        g = defaultdict(list)
        for s, r, m in scored:
            g[r.get(col) or "未填"].append(m)
        if len(g) > 1:
            out += ["", f"| {name} | 篇数 | 平均点击率 | 平均收藏率 | 平均互动率 |", "|---|---|---|---|---|"]
            for k, ms in sorted(g.items(), key=lambda kv: -len(kv[1])):
                avg = lambda key: sum(x[key] for x in ms if x[key] is not None) / max(1, sum(1 for x in ms if x[key] is not None))
                out.append(f"| {k} | {len(ms)} | {avg('点击率'):.1f}% | {avg('收藏率'):.1f}% | {avg('互动率'):.1f}% |")

    out += ["", "## 待补（Claude 读完上表后填写）",
            "- 最好的一篇好在：☐标题 ☐时间 ☐类型 ☐封面",
            "- 最差的一篇差在：☐标题 ☐时间 ☐类型 ☐封面",
            "- 评论区选题：① ② ③",
            "- 下周 3 篇：类型 ｜ 选题编号 ｜ 周几几点",
            "- 追加到 爆款公式.md 的规律：", ""]
    if len(done) < 12:
        out.append(f"> 已回填 {len(done)} 篇，不到四周（约 12 篇），规律只看方向，不下结论。")

    text = "\n".join(out) + "\n"
    os.makedirs(os.path.join(a.workspace, "复盘"), exist_ok=True)
    dst = os.path.join(a.workspace, "复盘", f"{label}.md")
    open(dst, "w", encoding="utf-8").write(text)
    print(text)
    print(f"✓ 写入 {dst}")


if __name__ == "__main__":
    main()
