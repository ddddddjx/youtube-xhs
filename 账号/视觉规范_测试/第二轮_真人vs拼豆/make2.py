#!/usr/bin/env python3
"""视觉规范第二轮：K 老师换成真人头像（A 套）和拼豆头像（B 套），各出 封面 / 信息图 / 数据图 / 场景图。
用法：python3 make2.py <assets 目录（avatar.png）> <输出目录>"""
import base64, io, subprocess, sys, pathlib
from PIL import Image

ASSETS, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BG, INK, Y, G1, G2, G3 = "#F7F5EF", "#1A1A1A", "#FFE600", "#5C5C5C", "#BDBDBD", "#E6E4DE"
SW = 3.5
WOB = ('<filter id="wob" x="-5%" y="-5%" width="110%" height="110%">'
       '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/>'
       '<feDisplacementMap in="SourceGraphic" scale="3"/></filter>')
AVATAR = Image.open(ASSETS / "avatar.png").convert("RGBA")

# ---------------- 拼豆 ----------------
BEADS = {"Y": "#FFE600", "K": "#1A1A1A", "D": "#3E3E3E", "M": "#7A7A7A", "L": "#B4B4B4", "l": "#D8D8D8", "W": "#F4F4F2",
         "s": "#F6D3B6", "S": "#E8AE8A", "T": "#C98262", "B": "#8E4E3C", "P": "#E07A88", "R": "#B8323C", "G": "#E6E4DE"}
NEAR_KEYS = "YKDMLlWsSTBPR"   # 头像取色只在这些里挑
_RGB = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in BEADS.items()}


def _near(c):
    r, g, b = c
    return min(NEAR_KEYS, key=lambda k: 3 * (r - _RGB[k][0]) ** 2 + 4 * (g - _RGB[k][1]) ** 2 + 2 * (b - _RGB[k][2]) ** 2)


def grid_from_avatar(n):
    from PIL import ImageEnhance
    sm = ImageEnhance.Contrast(AVATAR.convert("RGB")).enhance(1.25).resize((n, n), Image.BOX)
    al = AVATAR.split()[3].resize((n, n), Image.BOX)
    return ["".join(_near(sm.getpixel((x, y))) if al.getpixel((x, y)) > 140 else "." for x in range(n)) for y in range(n)]


def beads(rows, x, y, cell):
    """rows：字符网格，'.' 空。每颗豆 = 色圆 + 中间露底的小孔，平涂无阴影。"""
    out = []
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == ".": continue
            cx, cy = x + i * cell + cell / 2, y + j * cell + cell / 2
            out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{cell*0.47:.1f}" fill="{BEADS[ch]}"/>'
                       f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{cell*0.12:.1f}" fill="{BG}"/>')
    return "".join(out)


BOT = ["........KK........", ".......KLLK.......", ".......KLLK.......", "........KK........", "........KK........",
       "..KKKKKKKKKKKKKK..", "..KWWWWWWWWWWWWK..", "..KWKKKKKKKKKKWK..", "..KWKGGGGGGGGKWK..", "..KWKGKKGGKKGKWK..",
       "..KWKGKKGGKKGKWK..", "..KWKGGGGGGGGKWK..", "..KWKKKKKKKKKKWK..", "..KWWWWWWWWWWWWK..", "..KWWWKKKKKKWWWK..",
       "..KWWWWWWWWWWWWK..", "..KKKKKKKKKKKKKK..", "......KKKKKK......", "....KKLLLLLLKK....", "...KLLLLLLLLLLK...",
       "..KLLLLLLLLLLLLK..", "..KLLLLLLLLLLLLK..", ".KLLLLLLLLLLLLLLK.", ".KLLLLLLLLLLLLLLK."]
PAPER = ["KKKKKKKKK", "KYYYYYYYK", "KYKKKKKYK", "KYYYYYYYK", "KYKKKKKYK", "KYYYYYYYK", "KYKKKYYYK", "KYYYYYYYK",
         "KYYYYYYYK", "KKKKKKKKK"]
QMARK = [".KKKK.", "KK..KK", "....KK", "...KK.", "..KK..", "..KK..", "......", "..KK.."]


def png_uri(img):
    b = io.BytesIO(); img.save(b, "PNG"); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()


AV_URI = png_uri(AVATAR.resize((640, 640), Image.LANCZOS))


def photo(x, y, d, ring=True):
    s = f'<image href="{AV_URI}" x="{x}" y="{y}" width="{d}" height="{d}"/>'
    if ring: s += f'<circle cx="{x+d/2}" cy="{y+d/2}" r="{d/2}" fill="none" stroke="{INK}" stroke-width="{SW+1}"/>'
    return s


def corners(x, y, w, h, L=40, t=8, pad=14):
    x0, y0, x1, y1 = x - pad, y - pad, x + w + pad, y + h + pad
    d = (f"M{x0},{y0+L} V{y0} H{x0+L} M{x1-L},{y0} H{x1} V{y0+L} "
         f"M{x1},{y1-L} V{y1} H{x1-L} M{x0+L},{y1} H{x0} V{y1-L}")
    return f'<path d="{d}" fill="none" stroke="{Y}" stroke-width="{t}" stroke-linecap="square"/>'


def sig(mode):
    """右下角署名：小头像 + 账号名。"""
    if mode == "photo": av = photo(1008 - 56 - 196, 1368 - 56, 56)
    else: av = beads(grid_from_avatar(16), 1008 - 56 - 196, 1368 - 56, 3.5)
    return av, '<div style="position:absolute;right:72px;top:1324px;font-size:28px;font-weight:700;color:#1A1A1A">Krypto说AI</div>'


def page(name, body_html, svg, mode):
    sv, sh = sig(mode)
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1440px;background:{BG};font-family:"Noto Sans CJK SC",sans-serif;color:{INK};position:relative;overflow:hidden}}
svg.art{{position:absolute;left:0;top:0}}
.hl{{background:linear-gradient(transparent 52%,{Y} 52%,{Y} 92%,transparent 92%);padding:0 6px}}
.t{{position:absolute;left:72px;right:72px}}
.src{{position:absolute;left:72px;top:1330px;font-size:24px;color:{G1}}}
</style></head><body>
<svg class="art" width="1080" height="1440" viewBox="0 0 1080 1440"><defs>{WOB}</defs>{svg}{sv}</svg>
{body_html}{sh}</body></html>'''
    p = OUT / f"{name}.html"; p.write_text(html)
    png = OUT / f"{name}.png"
    subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--window-size=1080,1600", f"--screenshot={png}", p.resolve().as_uri()], check=True, capture_output=True)
    Image.open(png).crop((0, 0, 1080, 1440)).save(png); p.unlink()


for mode, tag in (("photo", "A真人"), ("bead", "B拼豆")):
    # ---------- 封面 ----------
    if mode == "photo":
        art = photo(428, 700, 580)
    else:
        art = beads(grid_from_avatar(52), 436, 708, 11)
    cover_html = '''
<div class="t" style="top:150px;font-size:40px;font-weight:700;color:#5C5C5C">用 Claude / Codex 干活两年</div>
<div class="t" style="top:220px;font-size:128px;font-weight:900;line-height:1.22;letter-spacing:-2px">Agent 跑偏<br>是你<span class="hl">没写这页</span></div>
<div class="t" style="top:600px;font-size:38px;font-weight:500;color:#5C5C5C">派活之前，先给它一页纸</div>'''
    page(f"{tag}_01_封面", cover_html, art, mode)

    # ---------- 信息图 ----------
    steps = [("目标", "一句话写清：做完长什么样"), ("上下文", "给它文件和背景，别让它猜"),
             ("检查点", "写好它自己怎么验收"), ("人验收", "最后一眼必须是你")]
    px, top, gap, ch, cx, cw = 150, 420, 220, 160, 230, 778
    svg = (f'<g filter="url(#wob)"><rect x="{px-14}" y="{top+40}" width="28" height="{gap*3+ch-80}" rx="14" fill="{Y}" stroke="{INK}" stroke-width="{SW}"/>'
           + "".join(f'<rect x="{px-26}" y="{top+ch/2-14+i*gap}" width="52" height="28" rx="6" fill="{INK}"/>' for i in range(4)) + '</g>')
    html = '''<div class="t" style="top:140px;font-size:44px;font-weight:700;color:#5C5C5C">给 Agent 派活</div>
<div class="t" style="top:205px;font-size:84px;font-weight:900">一页纸写<span class="hl">四样东西</span></div>'''
    for i, (h, sub) in enumerate(steps):
        y = top + i * gap
        svg += f'<g filter="url(#wob)"><rect x="{cx}" y="{y}" width="{cw}" height="{ch}" rx="16" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/></g>'
        svg += (f'<circle cx="{cx+80}" cy="{y+ch/2}" r="42" fill="{Y if i==3 else G3}" stroke="{INK}" stroke-width="{SW}"/>')
        html += (f'<div style="position:absolute;left:{cx+38}px;width:84px;text-align:center;top:{y+ch/2-34}px;font-size:48px;font-weight:900">{i+1}</div>'
                 f'<div style="position:absolute;left:{cx+160}px;top:{y+30}px;font-size:48px;font-weight:900">{h}</div>'
                 f'<div style="position:absolute;left:{cx+160}px;top:{y+94}px;font-size:32px;color:#5C5C5C">{sub}</div>')
        if i == 3: svg += corners(cx, y, cw, ch)
    page(f"{tag}_02_信息图", html, svg, mode)

    # ---------- 数据图（账号后台真实数据）----------
    bars = [("10-02 之前\n的封面（上限）", 12.0, False), ("同类笔记\n中位数", 20.0, False), ("Karpathy 稿\n10-02", 20.4, True)]
    x0, base = 140, 1180
    svg = ""
    html = '''<div class="t" style="top:140px;font-size:44px;font-weight:700;color:#5C5C5C">小红书封面点击率</div>
<div class="t" style="top:205px;font-size:84px;font-weight:900;line-height:1.25">只改了标题<br>点击率<span class="hl">翻了快一倍</span></div>'''
    if mode == "photo":
        scale = 620 / 24
        for v in (5, 10, 15, 20): svg += f'<path d="M{x0},{base - v*scale} H1008" stroke="{G3}" stroke-width="2"/>'
        svg += f'<path d="M{x0},{base} H1008" stroke="{INK}" stroke-width="{SW}"/>'
        for i, (lab, v, hero) in enumerate(bars):
            bx, h = x0 + 70 + i * 270, v * scale
            svg += f'<g filter="url(#wob)"><rect x="{bx}" y="{base-h}" width="180" height="{h}" fill="{Y if hero else G2}" stroke="{INK}" stroke-width="{SW}"/></g>'
        tops = [base - v * scale for _, v, _ in bars]
    else:
        cell = 12  # 1 颗豆 = 0.4 个百分点：12% = 30 颗，20% = 50 颗，20.4% = 51 颗
        for v in (5, 10, 15, 20): svg += f'<path d="M{x0},{base - v/0.4*cell} H1008" stroke="{G3}" stroke-width="2"/>'
        svg += f'<path d="M{x0},{base} H1008" stroke="{INK}" stroke-width="{SW}"/>'
        tops = []
        for i, (lab, v, hero) in enumerate(bars):
            n = round(v / 0.4); bx = x0 + 70 + i * 270
            svg += beads(["YYYYYYYYYYYYYYY" if hero else "MMMMMMMMMMMMMMM"] * n, bx, base - n * cell, cell)
            tops.append(base - n * cell)
        html += '<div style="position:absolute;right:72px;top:470px;font-size:24px;color:#5C5C5C">1 颗豆 = 0.4 个百分点</div>'
    for i, (lab, v, hero) in enumerate(bars):
        bx = x0 + 70 + i * 270
        html += (f'<div style="position:absolute;left:{bx}px;width:180px;top:{tops[i]-86}px;text-align:center;font-size:{64 if hero else 48}px;'
                 f'font-weight:900;color:{"#1A1A1A" if hero else "#5C5C5C"}">{v:g}%</div>'
                 f'<div style="position:absolute;left:{bx-30}px;width:240px;top:{base+22}px;text-align:center;font-size:28px;line-height:1.4;white-space:pre-line">{lab}</div>')
    for v in (0, 10, 20):
        yy = base - v * (620 / 24 if mode == "photo" else 30)
        html += f'<div style="position:absolute;left:72px;width:56px;text-align:right;top:{yy-18}px;font-size:24px;color:#5C5C5C">{v}%</div>'
    html += '<div class="src">来源：账号后台，2026-10</div>'
    page(f"{tag}_03_数据图", html, svg, mode)

    # ---------- 场景图 ----------
    html = '<div class="t" style="top:150px;font-size:76px;font-weight:900;line-height:1.3">你以为它懂了<br>它其实在<span class="hl">猜</span></div>'
    if mode == "photo":
        # 聊天截图式场景：真人头像 + AI 回复卡，不画卡通人
        svg = photo(72, 470, 150)
        svg += (f'<g filter="url(#wob)"><rect x="250" y="480" width="680" height="130" rx="16" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>'
                f'<rect x="150" y="700" width="780" height="220" rx="16" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>'
                f'<rect x="72" y="1010" width="858" height="150" rx="16" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/></g>'
                f'<rect x="958" y="710" width="50" height="50" rx="12" fill="{G3}" stroke="{INK}" stroke-width="{SW}"/>'
                + corners(150, 700, 780, 220))
        html += ('<div style="position:absolute;left:286px;top:510px;font-size:36px;line-height:1.6">帮我把这份方案改得<b>简洁一点</b></div>'
                 '<div style="position:absolute;left:968px;top:712px;font-size:30px;font-weight:900">AI</div>'
                 '<div style="position:absolute;left:186px;top:730px;width:710px;font-size:34px;line-height:1.65">好的！我把整份方案<span class="hl">重写了</span>，'
                 '删掉了第 2、3、5 节，标题也换了，结构更清晰了。</div>'
                 '<div style="position:absolute;left:108px;top:1042px;font-size:36px;line-height:1.6;font-weight:700">我说的「简洁」，是删几个形容词</div>')
    else:
        svg = beads(grid_from_avatar(34), 72, 700, 13)          # 拼豆 K 老师
        svg += beads(BOT, 770, 820, 13)                          # 拼豆机器人
        svg += beads(PAPER, 560, 760, 13)                        # 唯一的黄色物件：那页纸
        svg += beads(QMARK, 850, 680, 13)
        svg += f'<path d="M72,1180 H1008" stroke="{INK}" stroke-width="{SW}" filter="url(#wob)"/>'
    page(f"{tag}_04_场景", html, svg, mode)

print("done")
