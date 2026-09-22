#!/usr/bin/env python3
"""把 comic.json 渲染成小红书漫画讲解竖图（1080x1440 PNG）+ overview.jpg。

用法: python3 render_comic.py <comic.json> <输出目录>

comic.json:
{
  "account": {"name": "Krypto说AI", "avatar_image": "avatar.png"},
  "series": "K老师讲AI｜第 3 期",
  "pages": [
    {"type": "cover", "kicker": "开了 10 个 Agent 之后…", "title": "为什么你的 Agent\\n越多越乱？",
     "scene": {"actors": [{"who": "ein", "face": "meh", ...}], "props": [...], "strings": [...]}},
        # kicker = 顶部黄底小字引子：场景 / 情绪（「永不眠！」「开了 10 个 Agent 之后…」）
        # title  = 超大问句钩子：「为什么你的… / 如何…」，读者自己的事，产品名直接嵌进去
        # scene  = 只有一个人（默认 K 老师，face=meh 无语脸）+ 1–3 个道具把这件事演出来，不配台词
        # 底部只放栏目名（spec 顶层 series）。keyword / sub / promise 是旧版式字段，新封面不用
    {"type": "story", "kicker": "可选小字", "no": "01", "title": "小标题",
     "text": "画面上方的讲解", "scene": {...},
     "quote": "原内容里的关键句（可选，黄色竖线引用块）", "note": "画面下方的补充"},
    {"type": "panel", "no": "03", "blocks": [            # 内页主力版式：文字主导 + 小图解
        {"lead": "小字引入一句"}, {"h": "大标题\\n可两行"}, {"p": "段落"}, {"ul": ["要点 1", "要点 2"]},
        {"fig": {...scene...}, "height": 460},            # 图解，高度 360–560；人物默认小一号
        {"rows": [{"icon": {"who": "bot", "hold": "checklist"}, "title": "Choice", "desc": "一句解释"}]},
        {"quote": "关键句"}, {"space": true}]},            # space = 把后面的块推到页底
    {"type": "end", "lines": ["收束金句第一行", "第二行"], "next": "下一期：XX", "cta": "关注看下一期 · 评论区扣 1 领本期模板", "sign": "漫画学AI，我是 K 老师～"}
  ]
}
文字里 **加粗**、==黄色马克笔高亮==；title / text / note 里用 \\n 换行。

scene:
{
  "actors": [{"who": "ein|xiaobai", "pose": "...", "face": "...", "say": "头顶台词",
              "hold": "道具名", "x": 300, "scale": 1.8, "flip": false, "lie": false}],
  "props":  [{"prop": "laptop", "x": 780, "y": 380, "scale": 1.6, "label": "道具下方小字"}],
  "tags":   [{"text": "效率型AI", "x": 620, "y": 300, "style": "fill|line|plain", "size": 44}]
}
x / y 是 1080x760 画面里的坐标（地面 y=720）；都可以省略，脚本按人数和道具数自动排位。
  "strings": [[[x, y], [x, y], ...]]   # 手绘线（缠住的线、牵着的绳），按点连成平滑曲线
  图解元素（panel 的 fig 里用）:
    "bars":   {"items": [{"label": "优化前", "value": 1092, "text": "1092 次", "hl": false}], "x": 330, "y": 70}
    "flow":   {"items": [{"text": "LLM", "sub": "写、查", "hl": false}, {"text": "Jev", "hl": true}], "y": 200}
    "arrows": [{"from": [300, 200], "to": [700, 200], "label": "派单"}]
    "divider": true            # 中间一条虚线，左右对比
  actor 额外字段: "hat": "chefhat"（头顶戴道具） "meter": 0.8（头顶进度条） "label": "脚下小字" "accent": true（bot 黄领带）
who: ein（K 老师） xiaobai（小白） bot（方头机器人 = AI / Agent / 模型）
pose: stand wave point shrug cheer think hold walk ｜ 封面大动作: carry（抱着大东西走）push（推）kneel（蹲着摆弄）headache（抱头）run sit lean
  actor 的 hold_scale（默认 0.38）：封面让人抱一个大道具时调到 0.8–1.2，配 pose=carry / push / kneel
  scene.backdrop: {"kind": "ground|waves|hill|road", "y": 480}   # 铺在人物后面的一片地面 / 波浪 / 坡 / 路，封面用
face: ein → tongue happy smug surprise think sad meh；xiaobai → neutral happy confused surprise sad smug meh
prop: 见 characters.py 的 PROPS（封面大道具: basket 一筐纸、stack 一摞纸、timeline 时间线、bill 账单、brick 砖）
"""
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from characters import ACTORS, ARMS_ON_TOP, POSE_DY, POSES, PROPS, SHADOW, YELLOW, backdrop  # noqa: E402


def load_shooter():
    """截图和 overview 复用五图知识卡 skill 的 render_cards.py。"""
    roots = [os.path.join(HERE, "..", ".."), os.path.expanduser("~/.claude/skills")]
    for root in roots:
        d = os.path.join(root, "xiaohongshu-wutu-zhishika", "scripts")
        if os.path.exists(os.path.join(d, "render_cards.py")):
            sys.path.insert(0, d)
            import render_cards
            return render_cards
    sys.exit("找不到同级的 xiaohongshu-wutu-zhishika/scripts/render_cards.py（两个 skill 要一起安装）")


SW, SH, GROUND = 1080, 760, 720
GREY_BAR = "#D8D8D8"

CSS = """
* { margin: 0; padding: 0; box-sizing: border-box }
body { width: 1080px; height: 1440px; background: #fff; color: #000; overflow: hidden;
       font-family: "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif }
.page { width: 1080px; height: 1440px; padding: 84px 80px 70px; display: flex; flex-direction: column }
.round { font-family: "Yuanti SC", "PingFang SC", "Noto Sans CJK SC", sans-serif; font-weight: 700 }
.kicker { font-size: 40px; line-height: 1.4; margin-bottom: 10px }
.no { font-size: 56px; line-height: 1; margin-bottom: 18px }
.no span, mark { background: linear-gradient(transparent 45%, #FFE600 45%, #FFE600 92%, transparent 92%);
                 color: inherit; padding: 0 6px }
h1 { font-size: 118px; line-height: 1.22; letter-spacing: -1px }
.cover { padding: 96px 72px 64px }
.cover .kicker { font-size: 50px; line-height: 1.3; margin-bottom: 22px; font-weight: 700 }
.cover .kicker span { background: #FFE600; padding: 4px 16px; border-radius: 10px;
                      box-decoration-break: clone; -webkit-box-decoration-break: clone }
.cover h1 { font-size: 118px; line-height: 1.18; letter-spacing: -2px }
.cover .scene { margin: 20px -72px 10px }
.kwline { display: flex; align-items: center; gap: 26px; margin-top: 34px }
.kwline .k { font-size: 76px; line-height: 1; background: #FFE600; padding: 14px 26px 18px; border-radius: 16px;
             white-space: nowrap; flex: none }
.kwline .s { font-size: 42px; line-height: 1.35; font-weight: 700; white-space: pre-wrap }
.panel { padding: 70px 72px 56px }
.panel .lead { font-size: 38px; line-height: 1.5; margin-bottom: 10px }
.panel .no { margin-bottom: 14px }
.panel h2 { font-size: 62px; line-height: 1.26; margin-bottom: 22px }
.panel p { font-size: 39px; line-height: 1.58; margin-bottom: 20px; white-space: pre-wrap }
.panel ul { list-style: none; margin: 2px 0 16px }
.panel li { font-size: 37px; line-height: 1.5; padding-left: 36px; position: relative; margin-bottom: 12px }
.panel li:before { content: ""; position: absolute; left: 6px; top: 22px; width: 13px; height: 13px;
                   border-radius: 50%; background: #000 }
.panel .fig { margin: 6px -72px 14px; flex: 1 1 auto }   /* 图解吃掉剩余高度，上下自动留白 */
.panel .fig svg { width: 1080px; height: 100%; display: block }
.panel .rows { margin: 4px 0 12px; flex: 1 1 auto; display: flex; flex-direction: column; justify-content: space-around }
.panel .row { display: flex; align-items: center; gap: 26px; margin-bottom: 14px }
.panel .row .ic { flex: none; width: 170px; height: 170px }
.panel .row .ic svg { width: 170px; height: 170px }
.panel .row .rt { font-size: 43px; font-weight: 700; line-height: 1.3 }
.panel .row .rd { font-size: 35px; line-height: 1.48; margin-top: 6px }
.panel .quote { font-size: 39px; margin: 8px 0 20px }
.panel .sp { flex: 1 }
.promise { text-align: center; font-size: 32px; color: #555; margin-top: 18px }
.quote { font-size: 37px; line-height: 1.5; font-weight: 700; border-left: 12px solid #FFE600;
         padding: 4px 0 4px 24px; margin-bottom: 18px; white-space: pre-wrap }
h2 { font-size: 58px; line-height: 1.3 }
.text, .note { font-size: 39px; line-height: 1.55; white-space: pre-wrap }
.text { margin-top: 18px }
.scene { flex: 1; min-height: 0; margin: 10px -80px; display: flex; align-items: center }
.scene svg { width: 1080px; height: 100%; display: block }
.series { text-align: center; font-size: 40px }
.next { text-align: center; font-size: 40px; margin-top: 28px }
.next span { background: #FFE600; border-radius: 40px; padding: 8px 34px }
.cta { text-align: center; font-size: 36px; color: #444; margin-top: 18px }
.series span { background: #FFE600; border-radius: 40px; padding: 8px 34px }
.end { align-items: center; justify-content: center; text-align: center; padding-top: 60px }
.end .lines { font-size: 50px; line-height: 1.55; margin-top: 40px; white-space: pre-wrap }
.end .sign { font-size: 38px; margin-top: 60px; display: flex; align-items: center; gap: 18px }
.end .sign img { width: 64px; height: 64px; border-radius: 50% }
.pg { position: absolute; right: 60px; bottom: 36px; font-size: 26px; color: #9A9A9A }
b { font-weight: 700 }
"""


def inline(text):
    t = html.escape(text or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    return re.sub(r"==(.+?)==", r"<mark>\1</mark>", t)


def wrap(text, width):
    """按视觉宽度折行：中文算 1，英文数字算 0.55；保留手写的 \\n。"""
    lines = []
    for part in text.split("\n"):
        cur, w = "", 0.0
        for ch in part:
            cw = 1.0 if ord(ch) > 0x2E7F else 0.55
            if w + cw > width and cur:
                lines.append(cur)
                cur, w = "", 0.0
            cur += ch
            w += cw
        lines.append(cur)
    return lines


def vis_len(s):
    return sum(1.0 if ord(c) > 0x2E7F else 0.55 for c in s)


def svg_text(lines, cx, bottom, size, weight=400, anchor="middle"):
    lh = size * 1.35
    out = []
    for i, line in enumerate(lines):
        y = bottom - (len(lines) - 1 - i) * lh
        out.append(f'<text x="{cx:.0f}" y="{y:.0f}" font-size="{size}" font-weight="{weight}" '
                   f'text-anchor="{anchor}">{html.escape(line)}</text>')
    return "".join(out)


def arrow_svg(x1, y1, x2, y2):
    """黄底黑边箭头，从 (x1,y1) 指向 (x2,y2)。"""
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    hx1, hy1 = x2 - 34 * math.cos(ang - 0.6), y2 - 34 * math.sin(ang - 0.6)
    hx2, hy2 = x2 - 34 * math.cos(ang + 0.6), y2 - 34 * math.sin(ang + 0.6)
    d = f"M{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f} M{x2:.0f},{y2:.0f} L{hx1:.0f},{hy1:.0f} M{x2:.0f},{y2:.0f} L{hx2:.0f},{hy2:.0f}"
    return (f'<path d="M{x1:.0f},{y1:.0f} L{x2:.0f},{y2:.0f}" fill="none" stroke="{YELLOW}" stroke-width="20"/>'
            f'<path d="{d}" fill="none" stroke="#000" stroke-width="7"/>')


def actor_svg(a, scale, flip=False):
    """单个人物的 SVG（局部坐标，脚底 y=195*scale 由调用方摆放）。返回 (svg, 头顶的 y 偏移)。"""
    who = a.get("who", "ein")
    fn = ACTORS[who]
    pose = a.get("pose", "hold" if a.get("hold") else "stand")   # 指定了 pose 就按 pose（carry / push / kneel 自带手的位置）
    face = a.get("face", "tongue" if who == "ein" else "neutral")
    body, hand = fn(pose, face, accent=True) if (who == "bot" and a.get("accent")) else fn(pose, face)
    if a.get("hold") and hand:
        hs = a.get("hold_scale", 0.38)   # 封面想让人抱一个大东西时把它调到 0.8–1.2
        body += f'<g transform="translate({hand[0]},{hand[1]}) scale({hs})">{PROPS[a["hold"]]}</g>'
        if pose in ARMS_ON_TOP:   # 手臂盖在大道具上，看起来是抱着 / 推着，不是道具飘在身前
            la, ra = POSES[pose][:2]
            body += f'<path d="{la} {ra}" fill="none" stroke="#000" stroke-width="9"/>'
    top = 92
    if a.get("hat"):
        body += f'<g transform="translate(0,-74) scale(0.62)">{PROPS[a["hat"]]}</g>'
        top = 150
    return body, top


def scene_svg(scene, sh=SH, small=False):
    """small=True：内页图解用，人物默认小一号（约占图高的 6 成），给图解元素让位置。"""
    actors, props, tags = scene.get("actors", []), scene.get("props", []), scene.get("tags", [])
    n_label = max((len(wrap(a["label"], 12)) for a in actors if a.get("label")), default=0)
    ground = sh - 40 - (n_label * 42 + 14 if n_label else 0)
    _ = None
    actors, props, tags = scene.get("actors", []), scene.get("props", []), scene.get("tags", [])
    talking = any(a.get("say") for a in actors)
    crowded = bool(props or tags or scene.get("bars") or scene.get("flow")) or len(actors) > 1
    if len(actors) == 1:
        auto_x = [300 if crowded else 540]
    elif len(actors) == 2:
        auto_x = [290, 790]
    else:
        auto_x = [int(SW * (i + 0.5) / max(len(actors), 1)) for i in range(len(actors))]
    free = [x for x in (780, 560) if all(abs(x - ax) > 200 for ax in auto_x[:len(actors)])] or [780]
    drawn, texts = [], []
    bd = scene.get("backdrop")           # 背景景片：{"kind": "ground|waves|hill|road", "y": 480}
    if bd:
        drawn.append(backdrop(bd.get("kind", "ground"), bd.get("y", int(sh * 0.62)), SW, sh))
    if scene.get("divider"):
        drawn.append(f'<path d="M{SW // 2},20 V{sh - 20}" fill="none" stroke="#000" stroke-width="5" stroke-dasharray="4 22"/>')
    for i, a in enumerate(actors):
        x = a.get("x", auto_x[i])
        if small:
            default = min(1.55, (ground - 110 - (60 if talking else 0)) / 290)   # 内页人物约占页高 1/4–1/3
        else:
            default = 1.7 if talking else (2.0 if crowded else 2.3)
        scale = a.get("scale", default)
        flip = a.get("flip", len(actors) == 2 and i == 1)
        body, top_off = actor_svg(a, scale, flip)
        sx = -scale if flip else scale
        if a.get("lie"):
            drawn.append(f'<ellipse cx="{x}" cy="{ground}" rx="{150 * scale}" ry="{9 * scale}" fill="{SHADOW}"/>'
                         f'<g transform="translate({x - 60 * scale},{ground - 52 * scale}) rotate(-78) '
                         f'scale({sx},{scale}) translate(0,-60)">{body}</g>')
            top = ground - 150 * scale
        else:
            dy = POSE_DY.get(a.get("pose"), 0) * scale   # 跪 / 坐：整个人下沉
            drawn.append(f'<ellipse cx="{x}" cy="{ground}" rx="{52 * scale}" ry="{9 * scale}" fill="{SHADOW}"/>'
                         f'<g transform="translate({x},{ground - 195 * scale + dy}) scale({sx},{scale})">{body}</g>')
            top = ground - (195 + top_off) * scale + dy
        if a.get("meter") is not None:   # 头顶进度条：0–1
            w, h = 200 * max(scale, 0.9), 30
            my = top - 34
            drawn.append(f'<rect x="{x - w / 2:.0f}" y="{my - h:.0f}" width="{w * max(a["meter"], 0.04):.0f}" height="{h}" rx="12" fill="{YELLOW}"/>'
                         f'<rect x="{x - w / 2:.0f}" y="{my - h:.0f}" width="{w:.0f}" height="{h}" rx="12" fill="none" stroke="#000" stroke-width="7"/>')
            top = my - h - 6
        if a.get("label"):               # 脚下小字：这个角色代表谁
            ll = wrap(a["label"], 12)
            texts.append(svg_text(ll, x, ground + 52 + (len(ll) - 1) * 42, 31, 700))
        if a.get("say"):
            fs = 34 if small else 40
            lines = wrap(a["say"], 11)
            half = max(vis_len(l) for l in lines) * fs / 2
            cx = min(max(x, 40 + half), SW - 40 - half)
            texts.append(svg_text(lines, cx, top - 20, fs))
    for pts in scene.get("strings", []):
        d = f"M{pts[0][0]},{pts[0][1]}"
        for (ax, ay), (bx, by) in zip(pts[1:], pts[2:] + [pts[-1]]):
            d += f" Q{ax},{ay} {(ax + bx) / 2:.0f},{(ay + by) / 2:.0f}" if (bx, by) != (ax, ay) else f" L{ax},{ay}"
        drawn.append(f'<path d="{d}" fill="none" stroke="#000" stroke-width="6"/>')
    for i, pr in enumerate(props):
        x, y = pr.get("x", free[0] + (i * 40 if i else 0)), pr.get("y", sh * 0.52)
        s = pr.get("scale", 1.1 if small else 1.7)
        drawn.append(f'<g transform="translate({x},{y}) scale({s})">{PROPS[pr["prop"]]}</g>')
        if pr.get("label"):
            texts.append(svg_text(wrap(pr["label"], 12), x, y + 100 * s + 42, 32 if small else 36))
    for ar in scene.get("arrows", []):
        (x1, y1), (x2, y2) = ar["from"], ar["to"]
        drawn.append(arrow_svg(x1, y1, x2, y2))
        if ar.get("label"):
            texts.append(svg_text([ar["label"]], (x1 + x2) / 2, min(y1, y2) - 22, 30, 700))
    # 横向条形对比：[{label, value, text}]
    bars = scene.get("bars")
    if bars:
        items = bars["items"] if isinstance(bars, dict) else bars
        bx, by = (bars.get("x", 330), bars.get("y", 70)) if isinstance(bars, dict) else (330, 70)
        bw = (bars.get("w", 470) if isinstance(bars, dict) else 470)
        vmax = max(b["value"] for b in items) or 1
        for i, b in enumerate(items):
            y = by + i * 104
            fw = max(bw * b["value"] / vmax, 16)
            drawn.append(f'<rect x="{bx}" y="{y}" width="{fw:.0f}" height="52" rx="14" fill="{YELLOW if b.get("hl", True) else GREY_BAR}"/>'
                         f'<rect x="{bx}" y="{y}" width="{bw}" height="52" rx="14" fill="none" stroke="#000" stroke-width="7"/>')
            texts.append(svg_text([b["label"]], bx - 20, y + 38, 32, 700, "end"))
            if b.get("text"):
                texts.append(svg_text([b["text"]], bx + bw + 18, y + 38, 32, 700, "start"))
    # 流程：一排方框用箭头串起来
    flow = scene.get("flow")
    if flow:
        items, fy, size = flow["items"], flow.get("y", sh * 0.5), flow.get("size", 36)
        widths = [max(max(vis_len(l) for l in it["text"].split("\n")) * size + 52,
                      max((vis_len(l) for l in wrap(it.get("sub", ""), 7)), default=0) * 30 + 24) for it in items]
        gap = 64
        total = sum(widths) + gap * (len(items) - 1)
        if total > SW - 80:
            k = (SW - 80) / total
            size, gap = size * k, gap * k
            widths = [w * k for w in widths]
            total = SW - 80
        x = (SW - total) / 2
        for i, (it, w) in enumerate(zip(items, widths)):
            lines = it["text"].split("\n")
            h = len(lines) * size * 1.35 + 40
            fill = YELLOW if it.get("hl") else "#FFF"
            drawn.append(f'<rect x="{x:.0f}" y="{fy - h / 2:.0f}" width="{w:.0f}" height="{h:.0f}" rx="20" fill="{fill}" stroke="#000" stroke-width="7"/>')
            texts.append(svg_text(lines, x + w / 2, fy + h / 2 - 20 - size * 0.28, size, 700))
            if it.get("sub"):
                sl = wrap(it["sub"], 7)
                texts.append(svg_text(sl, x + w / 2, fy + h / 2 + 46 + (len(sl) - 1) * 40, 30))
            if i < len(items) - 1:
                drawn.append(arrow_svg(x + w + 8, fy, x + w + gap - 8, fy))
            x += w + gap
    for tg in tags:
        size, style = tg.get("size", 38 if small else 44), tg.get("style", "fill")
        lines = wrap(tg["text"], tg.get("width", 10))
        w = max(vis_len(l) for l in lines) * size + 70
        h = len(lines) * size * 1.35 + 44
        x, y = tg.get("x", 780), tg.get("y", sh / 2)
        if style != "plain":
            fill = YELLOW if style == "fill" else "#FFF"
            drawn.append(f'<rect x="{x - w / 2:.0f}" y="{y - h / 2:.0f}" width="{w:.0f}" height="{h:.0f}" rx="22" '
                         f'fill="{fill}" stroke="#000" stroke-width="7"/>')
        texts.append(svg_text(lines, x, y + h / 2 - 22 - size * 0.28, size, 700 if style != "plain" or tg.get("bold") else 400))
    return (f'<svg viewBox="0 0 {SW} {sh}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">'
            f'<defs><filter id="wob" x="-5%" y="-5%" width="110%" height="110%">'
            f'<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/>'
            f'<feDisplacementMap in="SourceGraphic" scale="7"/></filter></defs>'
            f'<g filter="url(#wob)" stroke-linecap="round" stroke-linejoin="round">{"".join(drawn)}</g>'
            f'<g font-family="PingFang SC, Noto Sans CJK SC, sans-serif" fill="#000">{"".join(texts)}</g></svg>')


def icon_svg(icon):
    """rows 里的小图标：一个小号人物（可带道具 / 帽子）或一个道具，160x160。"""
    if icon.get("prop"):
        inner = f'<g transform="translate(80,84) scale(0.62)">{PROPS[icon["prop"]]}</g>'
    else:
        body, top_off = actor_svg(icon, 0.5)
        dy = 56 if not icon.get("hat") else 78
        inner = f'<g transform="translate(70,{dy}) scale(0.5)">{body}</g>'
    return (f'<svg viewBox="0 0 160 160" width="150" height="150" xmlns="http://www.w3.org/2000/svg">'
            f'<g stroke-linecap="round" stroke-linejoin="round">{inner}</g></svg>')


def end_scene():
    body, _ = ACTORS["ein"]("stand", "smug")
    return (f'<svg viewBox="0 0 600 560" width="600" height="560" xmlns="http://www.w3.org/2000/svg">'
            f'<defs><clipPath id="c"><circle cx="300" cy="280" r="262"/></clipPath></defs>'
            f'<circle cx="300" cy="280" r="270" fill="{YELLOW}"/>'
            f'<g clip-path="url(#c)" stroke-linecap="round" stroke-linejoin="round">'
            f'<g transform="translate(300,250) scale(2.6)">{body}</g></g>'
            f'<circle cx="300" cy="280" r="266" fill="none" stroke="#000" stroke-width="9"/></svg>')


def hook_size(title, max_px=118, box=936):
    """封面钩子按最长一行自动缩字号，保证每行不折行（中文算 1，英文数字算 0.55）。"""
    def vis(line):
        line = line.replace("==", "").replace("**", "")
        return sum(1.0 if ord(ch) > 0x2E7F else 0.55 for ch in line)
    widest = max((vis(l) for l in title.split("\n")), default=1) or 1
    return max(72, min(max_px, int(box / widest)))


def page_html(page, idx, total, spec, base):
    kind = page.get("type", "story")
    series = spec.get("series", "")
    if kind == "cover":
        kw = ""
        if page.get("keyword"):
            sub = f'<span class="s">{inline(page["sub"])}</span>' if page.get("sub") else ""
            kw = f'<div class="kwline round"><span class="k">{inline(page["keyword"])}</span>{sub}</div>'
        promise = page.get("promise", "")   # 新版式不放承诺行；旧 comic.json 在页内写了才显示
        kick = f'<div class="kicker round"><span>{inline(page["kicker"])}</span></div>' if page.get("kicker") else ""
        inner = (f'{kick}'
                 f'<h1 class="round" style="font-size:{hook_size(page["title"])}px">'
                 f'{inline(page["title"]).replace(chr(10), "<br>")}</h1>{kw}'
                 f'<div class="scene">{scene_svg(page.get("scene", {"actors": [{}]}))}</div>'
                 f'<div class="series round"><span>{inline(series)}</span></div>'
                 f'{"<div class=promise>" + inline(promise) + "</div>" if promise else ""}')
        cls = "page cover"
    elif kind == "end":
        acc = spec.get("account", {})
        av = acc.get("avatar_image")
        img = f'<img src="file://{os.path.join(base, av)}">' if av and os.path.exists(os.path.join(base, av)) else ""
        nxt = f'<div class="next round"><span>{inline(page["next"])}</span></div>' if page.get("next") else ""
        cta = f'<div class="cta">{inline(page["cta"])}</div>' if page.get("cta") else ""
        inner = (f'{end_scene()}<div class="lines round">{inline(chr(10).join(page.get("lines", [])))}</div>'
                 f'{nxt}{cta}'
                 f'<div class="sign">{img}<span>{inline(page.get("sign", ""))}</span></div>')
        cls = "page end"
    elif kind == "panel":
        parts = []
        if page.get("no"):
            parts.append(f'<div class="no round"><span>{inline(page["no"])}</span></div>')
        for b in page.get("blocks", []):
            if "lead" in b:
                parts.append(f'<div class="lead">{inline(b["lead"])}</div>')
            elif "h" in b:
                parts.append(f'<h2 class="round">{inline(b["h"]).replace(chr(10), "<br>")}</h2>')
            elif "p" in b:
                parts.append(f'<p>{inline(b["p"])}</p>')
            elif "ul" in b:
                parts.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in b["ul"]) + "</ul>")
            elif "fig" in b:
                h = int(b.get("height", 460))
                parts.append(f'<div class="fig" style="min-height:{h}px">{scene_svg(b["fig"], h, small=True)}</div>')
            elif "rows" in b:
                rows = "".join(f'<div class="row"><div class="ic">{icon_svg(r.get("icon", {}))}</div>'
                               f'<div><div class="rt round">{inline(r["title"])}</div>'
                               f'<div class="rd">{inline(r.get("desc", ""))}</div></div></div>' for r in b["rows"])
                parts.append(f'<div class="rows">{rows}</div>')
            elif "quote" in b:
                parts.append(f'<div class="quote">{inline(b["quote"])}</div>')
            elif b.get("space"):
                parts.append('<div class="sp"></div>')
        inner = "".join(parts)
        cls = "page panel"
    else:
        no = f'<div class="no round"><span>{inline(page["no"])}</span></div>' if page.get("no") else ""
        kick = f'<div class="kicker round"><span>{inline(page["kicker"])}</span></div>' if page.get("kicker") else ""
        inner = (f'{kick}'
                 f'{no}'
                 f'<h2 class="round">{inline(page.get("title", "")).replace(chr(10), "<br>")}</h2>'
                 f'{"<div class=text>" + inline(page["text"]) + "</div>" if page.get("text") else ""}'
                 f'<div class="scene">{scene_svg(page.get("scene", {}))}</div>'
                 f'{"<div class=quote>" + inline(page["quote"]) + "</div>" if page.get("quote") else ""}'
                 f'{"<div class=note>" + inline(page["note"]) + "</div>" if page.get("note") else ""}')
        cls = "page"
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>'
            f'<div class="{cls}">{inner}</div></body></html>')


# 图上不许出现的「转述腔」：漫画是在讲这件事本身，不是在转述一篇帖子。来源只写在 正文.txt 里。
BANNED = ["原帖", "原文", "作者", "博主", "这篇文章", "这条推文", "爆帖", "爆文", "X 上", "推特", "视频里", "来源："]


def lint(spec):
    bad = []
    for i, page in enumerate(spec["pages"], 1):
        says = [a.get("say", "") for a in page.get("scene", {}).get("actors", [])]
        tags = [g.get("text", "") for g in page.get("scene", {}).get("tags", [])]
        blob = " ".join([page.get(k, "") or "" for k in ("kicker", "keyword", "title", "text", "quote", "note")]
                        + page.get("lines", []) + says + tags)
        hit = [w for w in BANNED if w in blob]
        if hit:
            bad.append(f"  第 {i} 页出现：{'、'.join(hit)}")
    cover = spec["pages"][0]
    if cover.get("type") == "cover":
        title = (cover.get("title") or "").replace("\n", "")
        actors = cover.get("scene", {}).get("actors", [])
        if not cover.get("kicker"):
            bad.append("  封面没有 kicker：顶部要一行黄底小字引子（场景 / 情绪），如「开了 10 个 Agent 之后…」")
        if not re.search(r"[？?]|如何|怎么|为什么", title):
            bad.append("  封面 title 不是问句：写成「为什么你的… / 如何…？」这类读者自己的问题")
        if len(actors) != 1:
            bad.append(f"  封面有 {len(actors)} 个人：只放一个人（默认 K 老师）+ 道具，把这件事演出来")
        if any(a.get("say") for a in actors):
            bad.append("  封面人物有台词：缩略图上看不清，删掉 say，用表情和道具演")
        if cover.get("keyword") or cover.get("sub"):
            bad.append("  封面还有 keyword / sub：新版式只留 kicker + 问句 + 一个人 + 栏目名，搜索词放进标题.txt 和标签")
        blob = " ".join([cover.get("title") or "", cover.get("kicker") or ""])
        if re.search(r"(只要|仅需|低至|才)\s*[\$¥￥]?\s*\d", blob):
            bad.append("  封面出现「只要 / 仅需 / 低至 + 价格」：产品名 + 价格 + 促销词是广告句式，会被当成未报备推广。"
                       "改成中性陈述（「约 $0.42」），或者写成问句（「凭什么只花 $0.42？」）")
    sigs = []
    for i, page in enumerate(spec["pages"], 1):
        if page.get("type") != "panel":
            sigs.append(None)
            continue
        blocks = page.get("blocks", [])
        chars = sum(len(re.sub(r"[=*\s]", "", str(v))) for b in blocks for k, v in b.items()
                    if k in ("lead", "h", "p", "quote"))
        chars += sum(len(x) for b in blocks for x in b.get("ul", []))
        chars += sum(len(r.get("title", "")) + len(r.get("desc", "")) for b in blocks for r in b.get("rows", []))
        if chars < 90:
            bad.append(f"  第 {i} 页只有 {chars} 字：内页是文字主导，至少 90 字（标题 + 段落 + 要点 / 图标行）")
        if chars > 300:
            bad.append(f"  第 {i} 页 {chars} 字，超过 300：拆成两页")
        figs = [b["fig"] for b in blocks if "fig" in b]
        for f in figs:
            for a in f.get("actors", []):
                if a.get("scale", 1.0) > 1.7:
                    bad.append(f"  第 {i} 页人物 scale={a['scale']}：内页人物是图解的配角，scale ≤ 1.7（只有封面用大人物）")
        kinds = tuple(k for b in blocks for k in ("ul", "fig", "rows", "quote") if k in b)
        fig_kind = tuple(sorted(k for f in figs for k in ("bars", "flow", "arrows", "tags", "props", "divider") if f.get(k)))
        n_act = tuple(len(f.get("actors", [])) for f in figs)
        who = tuple(sorted(a.get("who", "ein") for f in figs for a in f.get("actors", [])))
        sigs.append((kinds, fig_kind, n_act, who))
    for i in range(2, len(sigs)):
        if sigs[i] and sigs[i] == sigs[i - 1] == sigs[i - 2]:
            bad.append(f"  第 {i - 1}–{i + 1} 页版式一模一样：连续三页同一种构图读者会疲劳，换一种（图标行 / 条形对比 / 流程 / 双人对比）")
    panel_sigs = [s for s in sigs if s]
    if len(panel_sigs) >= 6 and len(set(panel_sigs)) < 4:
        bad.append("  全篇内页版式少于 4 种：至少混用「人物 + 图解」「图标行 rows」「条形 / 流程图」「双人对比」")
    solo = sum(1 for s in panel_sigs if s[2] == (1,) and not s[1])
    if panel_sigs and solo > len(panel_sigs) // 3:
        bad.append(f"  有 {solo} 页是「一个人干站着、旁边什么都没有」：人物要在做事（拿道具 / 指着图 / 顶着进度条），或者旁边有图解元素")
    if bad:
        sys.exit("comic.json 没过检查，改完再出图：\n" + "\n".join(bad))


def main(spec_path, out_dir):
    rc = load_shooter()
    spec = json.load(open(spec_path, encoding="utf-8"))
    lint(spec)
    base = os.path.dirname(os.path.abspath(spec_path))
    os.makedirs(out_dir, exist_ok=True)
    pages, jobs = spec["pages"], []
    for i, page in enumerate(pages, 1):
        htm = os.path.abspath(os.path.join(out_dir, f"{i:02}.html"))
        png = os.path.abspath(os.path.join(out_dir, f"{i:02}.png"))
        open(htm, "w", encoding="utf-8").write(page_html(page, i, len(pages), spec, base))
        if os.path.exists(png):
            os.remove(png)
        jobs.append((htm, png))
    rc.shoot(jobs)
    rc.make_overview(out_dir, len(pages))


if __name__ == "__main__":
    main(*sys.argv[1:3])
