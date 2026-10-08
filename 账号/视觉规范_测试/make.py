#!/usr/bin/env python3
"""按 账号/视觉规范.md 的 prompt 出 4 张测试图（封面 / 信息图 / 数据图 / 插画）。HTML+SVG → headless Chromium 截图。"""
import math, random, subprocess, sys, pathlib

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BG, INK, Y, G1, G2, G3, PINK = "#F7F5EF", "#1A1A1A", "#FFE600", "#5C5C5C", "#BDBDBD", "#E6E4DE", "#F4B6B0"
SW = 3.5  # 线宽

WOB = ('<filter id="wob" x="-5%" y="-5%" width="110%" height="110%">'
       '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/>'
       '<feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>')


def hair(seed=4):
    rnd = random.Random(seed); pts = []
    for i, a in enumerate(range(-35, 216, 9)):
        r = (150 if i % 2 else 112) + rnd.randint(-10, 14)
        t = math.radians(a); pts.append((r * math.cos(t), -r * math.sin(t) - 10))
    d = "M0,40 " + " ".join(f"L{x:.0f},{y:.0f}" for x, y in pts) + " Z"
    return f'<path d="{d}" fill="{G2}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'


def k_teacher(x, y, s=1.0, brow="raise"):
    """K 老师半身像，局部坐标头心 (0,0)，身体往下延伸到 y≈260。"""
    rb = "M18,-44 Q38,-62 62,-46 Q40,-48 20,-36 Z" if brow == "raise" else "M18,-30 Q38,-42 62,-30 Q40,-30 20,-22 Z"
    return f'''<g transform="translate({x},{y}) scale({s})" filter="url(#wob)">
  <path d="M-150,280 Q-140,120 -48,96 L48,96 Q140,120 150,280 Z" fill="{INK}" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M-46,96 L0,172 L46,96 Z" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M-46,96 L-20,140 L-60,128 Z M46,96 L20,140 L60,128 Z" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M-11,112 L11,112 L8,124 L-8,124 Z" fill="{Y}" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M-8,124 L8,124 L20,214 L0,240 L-20,214 Z" fill="{Y}" stroke="{INK}" stroke-width="{SW}"/>
  {hair()}
  <circle cx="-90" cy="14" r="17" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>
  <circle cx="90" cy="14" r="17" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>
  <ellipse cx="0" cy="12" rx="88" ry="100" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M-34,-62 Q0,-72 34,-62 M-26,-50 Q0,-58 26,-50" fill="none" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M-62,-30 Q-40,-44 -18,-32 Q-40,-34 -60,-24 Z" fill="{G2}" stroke="{INK}" stroke-width="2.5"/>
  <path d="{rb}" fill="{G2}" stroke="{INK}" stroke-width="2.5"/>
  <circle cx="-38" cy="-8" r="7" fill="{INK}"/><circle cx="38" cy="-14" r="7" fill="{INK}"/>
  <path d="M-4,0 Q-16,30 -2,38 Q8,40 12,32" fill="none" stroke="{INK}" stroke-width="{SW}" stroke-linecap="round"/>
  <ellipse cx="-56" cy="36" rx="14" ry="8" fill="{PINK}"/><ellipse cx="58" cy="32" rx="14" ry="8" fill="{PINK}"/>
  <ellipse cx="4" cy="70" rx="24" ry="11" fill="{INK}"/>
  <path d="M-12,66 L-12,100 Q4,120 20,100 L20,66 Z" fill="{PINK}" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M4,72 V100" stroke="{INK}" stroke-width="2.5"/>
  <path d="M-60,52 Q-50,38 -32,46 Q-20,36 -6,46 Q4,40 14,46 Q30,36 42,46 Q58,40 64,54 Q50,66 34,60 Q18,68 4,60 Q-12,68 -28,60 Q-46,68 -60,52 Z" fill="{G2}" stroke="{INK}" stroke-width="{SW}"/>
</g>'''


def bot(x, y, s=1.0):
    return f'''<g transform="translate({x},{y}) scale({s})" filter="url(#wob)">
  <path d="M0,-70 V-96" stroke="{INK}" stroke-width="{SW}"/><circle cx="0" cy="-104" r="10" fill="{G3}" stroke="{INK}" stroke-width="{SW}"/>
  <path d="M-90,250 Q-84,110 -40,96 L40,96 Q84,110 90,250 Z" fill="{G3}" stroke="{INK}" stroke-width="{SW}"/>
  <rect x="-80" y="-70" width="160" height="150" rx="22" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>
  <rect x="-58" y="-36" width="116" height="62" rx="14" fill="{G3}" stroke="{INK}" stroke-width="{SW}"/>
  <circle cx="-26" cy="-6" r="9" fill="{INK}"/><circle cx="26" cy="-6" r="9" fill="{INK}"/>
  <path d="M-18,50 Q0,58 18,50" fill="none" stroke="{INK}" stroke-width="{SW}" stroke-linecap="round"/>
</g>'''


def corners(x, y, w, h, L=40, t=8, pad=14):
    x0, y0, x1, y1 = x - pad, y - pad, x + w + pad, y + h + pad
    d = (f"M{x0},{y0+L} V{y0} H{x0+L} M{x1-L},{y0} H{x1} V{y0+L} "
         f"M{x1},{y1-L} V{y1} H{x1-L} M{x0+L},{y1} H{x0} V{y1-L}")
    return f'<path d="{d}" fill="none" stroke="{Y}" stroke-width="{t}" stroke-linecap="square"/>'


def page(name, body_html, svg):
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1440px;background:{BG};font-family:"Noto Sans CJK SC",sans-serif;color:{INK};position:relative;overflow:hidden}}
svg.art{{position:absolute;left:0;top:0}}
.hl{{background:linear-gradient(transparent 52%,{Y} 52%,{Y} 92%,transparent 92%);padding:0 6px}}
.t{{position:absolute;left:72px;right:72px}}
.src{{position:absolute;left:72px;bottom:72px;font-size:24px;color:{G1}}}
.sig{{position:absolute;right:72px;bottom:72px;font-size:24px;color:{G1};font-weight:700}}
</style></head><body>
<svg class="art" width="1080" height="1440" viewBox="0 0 1080 1440"><defs>{WOB}</defs>{svg}</svg>
{body_html}</body></html>'''
    p = OUT / f"{name}.html"; p.write_text(html)
    subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--window-size=1080,1600", f"--screenshot={OUT / (name + '.png')}", p.as_uri()],
                   check=True, capture_output=True)
    from PIL import Image
    im = Image.open(OUT / (name + '.png')); im.crop((0, 0, 1080, 1440)).save(OUT / (name + '.png'))


# ---------- 01 封面 ----------
cover_svg = (k_teacher(800, 1150, 1.45) +
             # 放射短线：K 老师「亮了」
             f'<g stroke="{INK}" stroke-width="{SW}" stroke-linecap="round" filter="url(#wob)">'
             f'<path d="M560,860 L590,880 M590,800 L612,828 M650,770 L660,802"/></g>' +
             # 道具：一张写满的任务单（白卡）
             f'<g filter="url(#wob)"><rect x="110" y="900" width="330" height="390" rx="16" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>'
             f'<path d="M150,970 H400 M150,1030 H360 M150,1090 H390 M150,1150 H300" stroke="{G2}" stroke-width="14" stroke-linecap="round"/>'
             f'<path d="M150,1210 H330" stroke="{G2}" stroke-width="14" stroke-linecap="round"/></g>')
cover_html = '''
<div class="t" style="top:150px;font-size:40px;font-weight:700;color:#5C5C5C">用 Claude / Codex 干活两年</div>
<div class="t" style="top:220px;font-size:128px;font-weight:900;line-height:1.22;letter-spacing:-2px">
Agent 跑偏<br>是你<span class="hl">没写这页</span></div>
<div class="t" style="top:600px;font-size:38px;font-weight:500;color:#5C5C5C;line-height:1.6">派活之前，先给它一页纸</div>
<div class="sig" style="left:72px;right:auto">Krypto说AI</div>'''
page("01_封面", cover_html, cover_svg)

# ---------- 02 信息图：竖向管道串 4 张卡 ----------
steps = [("目标", "一句话写清：做完长什么样", "target"),
         ("上下文", "给它文件和背景，别让它猜", "doc"),
         ("检查点", "写好它自己怎么验收", "check"),
         ("人验收", "最后一眼必须是你", "eye")]
icons = {
    "target": f'<circle r="20" fill="none" stroke="{INK}" stroke-width="{SW}"/><circle r="8" fill="{INK}"/>',
    "doc": f'<path d="M-16,-22 H8 L18,-12 V22 H-16 Z" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/><path d="M-8,-4 H10 M-8,8 H10" stroke="{INK}" stroke-width="{SW}"/>',
    "check": f'<path d="M-18,0 L-5,14 L18,-14" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    "eye": f'<path d="M-24,0 Q0,-22 24,0 Q0,22 -24,0 Z" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/><circle r="7" fill="{INK}"/>',
}
px, top, gap, ch = 150, 400, 230, 170
info_svg = (f'<g filter="url(#wob)"><rect x="{px-14}" y="{top+40}" width="28" height="{gap*3+ch-80}" rx="14" fill="{Y}" stroke="{INK}" stroke-width="{SW}"/>'
            + "".join(f'<rect x="{px-26}" y="{top+ch/2-14+i*gap}" width="52" height="28" rx="6" fill="{INK}"/>' for i in range(4)) + '</g>')
info_html = '''<div class="t" style="top:140px;font-size:44px;font-weight:700;color:#5C5C5C">给 Agent 派活</div>
<div class="t" style="top:205px;font-size:84px;font-weight:900;line-height:1.25">一页纸写<span class="hl">四样东西</span></div>'''
for i, (h, sub, ic) in enumerate(steps):
    y = top + i * gap; cx, cw = 230, 778
    info_svg += f'<g filter="url(#wob)"><rect x="{cx}" y="{y}" width="{cw}" height="{ch}" rx="16" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/>'
    info_svg += f'<g transform="translate({cx+90},{y+ch/2})"><circle r="46" fill="{Y if i==3 else G3}" stroke="{INK}" stroke-width="{SW}"/>{icons[ic]}</g></g>'
    if i == 3: info_svg += corners(cx, y, cw, ch)
    info_html += (f'<div style="position:absolute;left:{cx+170}px;top:{y+34}px;font-size:48px;font-weight:900">{h}</div>'
                  f'<div style="position:absolute;left:{cx+170}px;top:{y+100}px;font-size:32px;color:#5C5C5C">{sub}</div>')
info_html += '<div class="sig">Krypto说AI</div>'
page("02_信息图", info_html, info_svg)

# ---------- 03 数据图：账号后台真实数据 ----------
bars = [("10-02 之前\n的封面（上限）", 12.0, False), ("同类笔记\n中位数", 20.0, False), ("Karpathy 稿\n10-02", 20.4, True)]
x0, base, top_ = 140, 1180, 560
scale = (base - top_) / 24
data_svg = f'<g filter="url(#wob)">'
for v in (0, 5, 10, 15, 20):
    yy = base - v * scale
    data_svg += f'<path d="M{x0},{yy} H{1080-72}" stroke="{G3 if v else INK}" stroke-width="{2 if v else SW}"/>'
bw, step = 180, 270
data_html = '''<div class="t" style="top:140px;font-size:44px;font-weight:700;color:#5C5C5C">小红书封面点击率</div>
<div class="t" style="top:205px;font-size:84px;font-weight:900;line-height:1.25">只改了标题<br>点击率<span class="hl">翻了快一倍</span></div>'''
for i, (lab, v, hero) in enumerate(bars):
    bx = x0 + 70 + i * step; h = v * scale
    data_svg += f'<rect x="{bx}" y="{base-h}" width="{bw}" height="{h}" fill="{Y if hero else G2}" stroke="{INK}" stroke-width="{SW}"/>'
    data_html += (f'<div style="position:absolute;left:{bx}px;width:{bw}px;top:{base-h-86}px;text-align:center;font-size:{64 if hero else 48}px;'
                  f'font-weight:900;color:{"#1A1A1A" if hero else "#5C5C5C"}">{v:g}%</div>'
                  f'<div style="position:absolute;left:{bx-30}px;width:{bw+60}px;top:{base+22}px;text-align:center;font-size:28px;line-height:1.4;'
                  f'color:#1A1A1A;white-space:pre-line">{lab}</div>')
data_svg += '</g>'
for v in (0, 10, 20):
    data_html += f'<div style="position:absolute;left:72px;width:56px;text-align:right;top:{base - v*scale - 18}px;font-size:24px;color:#5C5C5C">{v}%</div>'
data_html += '<div class="src">来源：Krypto说AI 账号后台，2026-10；「之前」取 5–12% 区间上限</div>'
page("03_数据图", data_html, data_svg)

# ---------- 04 插画：K 老师把一页纸递给机器人 ----------
ill_svg = (f'<path d="M72,1210 Q300,1196 540,1206 T1008,1200" fill="none" stroke="{INK}" stroke-width="{SW}" filter="url(#wob)"/>'
           f'<path d="M120,1250 H260 M700,1246 H900" stroke="{G2}" stroke-width="{SW}" stroke-linecap="round" filter="url(#wob)"/>'
           + k_teacher(300, 883, 1.15) + bot(800, 930, 1.1) +
           # 一页纸：本画面唯一的黄色物件
           f'<g filter="url(#wob)" transform="translate(560,800) rotate(-8)">'
           f'<rect x="-70" y="-90" width="140" height="180" rx="12" fill="{Y}" stroke="{INK}" stroke-width="{SW}"/>'
           f'<path d="M-40,-50 H40 M-40,-15 H40 M-40,20 H20" stroke="{INK}" stroke-width="{SW}" stroke-linecap="round"/></g>'
           f'<g filter="url(#wob)"><path d="M420,1060 Q470,960 512,850" fill="none" stroke="{INK}" stroke-width="40" stroke-linecap="round"/>'
           f'<circle cx="516" cy="836" r="22" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/></g>'
           # 机器人头上的问号气泡
           f'<g filter="url(#wob)"><path d="M860,620 h120 a18,18 0 0 1 18,18 v64 a18,18 0 0 1 -18,18 h-70 l-24,26 v-26 h-26 a18,18 0 0 1 -18,-18 v-64 a18,18 0 0 1 18,-18 Z" fill="#FFF" stroke="{INK}" stroke-width="{SW}"/></g>')
ill_html = '''<div class="t" style="top:150px;font-size:76px;font-weight:900;line-height:1.3">你以为它懂了<br>它其实在<span class="hl">猜</span></div>
<div style="position:absolute;left:880px;top:628px;width:100px;text-align:center;font-size:64px;font-weight:900">？</div>
<div class="sig">Krypto说AI</div>'''
page("04_插画", ill_html, ill_svg)
print("done")
