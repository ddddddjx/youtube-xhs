#!/usr/bin/env python3
"""渲染竖版成片的「顶部信息框」PNG：1080x1920、透明底，只画顶部那一块（主题、来路、标题钩子、讲者卡）。
视频画面和底部字幕由 compose_frame.py 叠上去。

用法:
  python3 render_frame.py <frame.json> <输出.png>

frame.json 结构:
{
  "tag": "AI 与未来十年",                          # 主题 / 栏目，≤10 字，强调色
  "source": "2026 · Silicon Valley Girl 访谈",     # 来路：年份、节目 / 课程名、第几讲
  "title": "李飞飞：<br>十年后只有两种打工人",      # 标题钩子，最多 2 行，每行 ≤11 字（超了自动缩字号）
  "speaker": {"name": "李飞飞", "role": "斯坦福教授 · World Labs 创始人"},
  "credit": "字幕：Krypto说AI",                    # 可省；讲者卡右侧的小灰字
  "accent": "#FFD93B"                              # 可省；默认账号黄
}

出图后必须 Read 一眼 PNG：标题有没有超过两行、讲者卡有没有挤到视频区。
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_panel import shoot  # noqa: E402

W, H = 1080, 1920
SAFE_TOP = 110     # 小红书播放页左上返回键、右上搜索 / 分享会盖住这一条
TOP_H = 590        # 视频画面从这里开始
PAD = 44
TITLE_MAX = 92     # 标题最大字号；长了按最长一行缩

CSS = """
@page { margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { width: %(w)dpx; height: %(h)dpx; background: transparent; overflow: hidden }
body { font-family: "PingFang SC", "Noto Sans CJK SC", sans-serif; color: #fff;
       -webkit-font-smoothing: antialiased }
.top { position: absolute; left: 0; top: 0; width: 100%%; height: %(top)dpx;
       padding: %(safe)dpx %(pad)dpx 22px; display: flex; flex-direction: column;
       background: linear-gradient(180deg, rgba(8,9,12,.92) 0%%, rgba(8,9,12,.78) 70%%, rgba(8,9,12,.55) 100%%) }
.tag { color: %(accent)s; font-size: 32px; font-weight: 800; letter-spacing: 1px; line-height: 1.25 }
.src { font-family: Menlo, "SF Mono", "Courier New", "PingFang SC", monospace; font-size: 29px;
       color: #D6D6D6; line-height: 1.4; margin-top: 4px; white-space: nowrap; overflow: hidden }
h1 { font-family: "Songti SC", "STSong", "Noto Serif CJK SC", serif; font-weight: 900;
     font-size: %(fs)dpx; line-height: 1.16; margin-top: 14px; white-space: nowrap;
     text-shadow: 0 3px 14px rgba(0,0,0,.65) }
.row { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px }
.who { background: rgba(22,25,33,.92); border-left: 9px solid %(accent)s; padding: 12px 30px 14px 24px;
       box-shadow: 0 6px 18px rgba(0,0,0,.45); max-width: 100%% }
.who .n { font-size: 44px; font-weight: 800; line-height: 1.25; white-space: nowrap }
.who .r { font-family: Menlo, "SF Mono", "Courier New", "PingFang SC", monospace; font-size: 27px;
          color: #DADADA; line-height: 1.4; white-space: nowrap }
.credit { font-size: 21px; color: #A9A9A9; text-align: right; line-height: 1.4; padding-bottom: 4px }
"""


def units(text):
    """一行字大约几个汉字宽：汉字 / 全角标点算 1，英文数字算 0.56"""
    return sum(1 if ord(c) > 0x2E7F else 0.56 for c in text)


def frame_html(spec):
    lines = [t.strip() for t in re.split(r"<br\s*/?>", spec.get("title", "")) if t.strip()]
    if len(lines) > 2:
        print(f"⚠ 标题 {len(lines)} 行，顶部只放得下 2 行，请压缩", file=sys.stderr)
    longest = max((units(t) for t in lines), default=1)
    fs = min(TITLE_MAX, int((W - 2 * PAD) / longest))
    if len(lines) > 2:
        fs = min(fs, 62)
    sp = spec.get("speaker") or {}
    who = ""
    if sp.get("name"):
        role = f'<div class="r">{html.escape(sp["role"])}</div>' if sp.get("role") else ""
        who = f'<div class="who"><div class="n">{html.escape(sp["name"])}</div>{role}</div>'
    credit = f'<div class="credit">{html.escape(spec["credit"])}</div>' if spec.get("credit") else ""
    css = CSS % {"w": W, "h": H, "top": TOP_H, "safe": SAFE_TOP, "pad": PAD, "fs": fs,
                 "accent": spec.get("accent", "#FFD93B")}
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head>
<body><div class="top">
<div class="tag">{html.escape(spec.get("tag", ""))}</div>
<div class="src">{html.escape(spec.get("source", ""))}</div>
<h1>{"<br>".join(html.escape(t) for t in lines)}</h1>
<div class="row">{who}{credit}</div>
</div></body></html>"""


def main(spec_path, out_png):
    spec = json.load(open(spec_path, encoding="utf-8"))
    out_png = os.path.abspath(out_png)
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    htm = out_png + ".html"
    open(htm, "w", encoding="utf-8").write(frame_html(spec))
    if os.path.exists(out_png):
        os.remove(out_png)
    shoot(htm, out_png, W, H, transparent=True)
    os.remove(htm)
    if not os.path.exists(out_png):
        sys.exit("顶部信息框截图失败")
    print(out_png)


if __name__ == "__main__":
    main(*sys.argv[1:3])
