#!/usr/bin/env python3
"""把卡片 JSON 渲染成小红书竖图（1080x1440 PNG），当前实现「罗尼研报笔记轨」版式。

用法:
  python3 render_cards.py <cards.json> <输出目录>

cards.json 结构（图片路径相对 json 所在目录）:
{
  "account": {"name": "账号名", "avatar_image": "avatar.png", "date": "09/19"},
                                          # 没有头像图时用 "avatar": "字" 显示文字圆标
  "pages": [
    {
      "tag": "斯坦福公开课",                 # 可选，封面左上黄底信源角标
      "cover": true,                        # 封面页：title 按最长一行放大到接近满宽；不给 evidence 就是「字为主」封面（黑字、175px、==高亮== 打黄底）
      "title": "第一行<br>第二行",            # 藏青大衬线，一页一个论点
      "blocks": [
        {"p": "普通段落，==这里是藏青完整判断句==。"},
        {"h": "小标题"},
        {"hr": true},
        {"table": [["谷歌", "40 亿用户", "× $100"], ["Meta", "35 亿", "× $70"]]}
      ],
      "evidence": {"image": "ev_01.png", "caption": "课件截图 · 来源"}   # 可选，底部证据卡
    }
  ]
}

截图引擎按顺序尝试: macOS Google Chrome → PATH 里的 google-chrome / chromium → Python Playwright。
字体: macOS 用系统宋体 Songti SC；Linux 用 Noto Serif CJK / 思源宋体（需已安装）。
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

W, H = 1080, 1440


def find_chrome():
    mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(mac):
        return mac
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if shutil.which(name):
            return shutil.which(name)
    return None

CSS = """
@page { margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { width: %(w)dpx; height: %(h)dpx; background: #F7F2E8; overflow: hidden }
body { font-family: "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif;
       color: #141414;
       -webkit-font-smoothing: antialiased }
.page { width: 100%%; height: 100%%; padding: 64px 72px 60px; display: flex; flex-direction: column }
.top { display: flex; align-items: center; gap: 20px; margin-bottom: 34px; position: relative; flex: none }
.avatar { width: 76px; height: 76px; border-radius: 50%%; background: #2B4B7C; color: #F7F2E8;
          display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 700;
          object-fit: cover; flex: none }
.who .name { font-size: 36px; font-weight: 700; letter-spacing: 1px }
.who .date { font-size: 24px; color: #8A8478; margin-top: 4px; font-family: Georgia, serif }
.pill { position: absolute; right: -8px; top: 0; background: #A8A39A; color: #fff; border-radius: 30px;
        padding: 8px 22px; font-size: 26px; font-family: Georgia, serif }
.tag { align-self: flex-start; background: #F2D54A; color: #141414; font-size: 26px; font-weight: 700;
       padding: 6px 16px; margin-bottom: 18px; flex: none }
h1 { color: #2B4B7C; font-size: 66px; line-height: 1.22; font-weight: 900; letter-spacing: 1px;
     margin-bottom: 30px; flex: none }
h1 mark { background: #F2D54A; color: #141414; padding: 0 10px; border-radius: 6px }
.body { flex: none }
.body p { font-size: 33px; line-height: 1.62; margin-bottom: 22px; text-align: justify }
.body p b { color: #2B4B7C; font-weight: 900 }
.body h3 { color: #2B4B7C; font-size: 36px; font-weight: 900; margin: 8px 0 14px }
.body hr { border: 0; border-top: 1.5px solid #D9D1C1; margin: 16px 0 26px }
.body table { width: 100%%; border-collapse: collapse; font-size: 32px; margin: 4px 0 24px }
.body td { padding: 14px 8px; border-bottom: 1.5px solid #E2DACB }
.body td:first-child { font-weight: 700; color: #2B4B7C }
.body td:not(:first-child) { text-align: right; font-family: Georgia, "Songti SC", serif }
.evidence { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: center;
            padding: 10px 0 }
/* 没有证据卡的纯文字页：放大字号填满版面 */
.text .body p, .text .body table { font-size: 35px; line-height: 1.7 }
.text .body p { margin-bottom: 30px }
.text .body h3 { font-size: 40px }
.text h1 { margin-bottom: 44px }
.card { background: #fff; border-radius: 22px; padding: 18px 18px 14px;
        box-shadow: 0 10px 34px rgba(60, 45, 20, .16); display: flex; flex-direction: column;
        min-height: 0; max-height: 100%% }
.card img { width: 100%%; min-height: 0; flex: 1 1 auto; object-fit: contain; border-radius: 10px }
.card .cap { font-size: 21px; color: #8A8478; margin-top: 10px; font-family: Georgia, "Songti SC", serif;
             flex: none }
"""


def inline(text):
    """==整句== → 藏青加粗判断句；其余转义。"""
    parts = re.split(r"(==.+?==)", text)
    out = []
    for p in parts:
        if p.startswith("==") and p.endswith("=="):
            out.append(f"<b>{html.escape(p[2:-2])}</b>")
        else:
            out.append(html.escape(p))
    return "".join(out).replace("&lt;br&gt;", "<br>")


def avatar_html(account, base):
    """有 avatar_image 用圆形头像图，否则用 avatar 文字圆标。"""
    img = account.get("avatar_image")
    if img:
        src = "file://" + os.path.abspath(os.path.join(base, img))
        return f'<img class="avatar" src="{src}">'
    return f'<div class="avatar">{html.escape(account.get("avatar", ""))}</div>'


def page_html(page, idx, total, account, base):
    blocks = []
    for b in page.get("blocks", []):
        if "p" in b:
            blocks.append(f"<p>{inline(b['p'])}</p>")
        elif "h" in b:
            blocks.append(f"<h3>{html.escape(b['h'])}</h3>")
        elif b.get("hr"):
            blocks.append("<hr>")
        elif "table" in b:
            rows = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
                           for r in b["table"])
            blocks.append(f"<table>{rows}</table>")
    ev = ""
    if page.get("evidence"):
        e = page["evidence"]
        src = "file://" + os.path.abspath(os.path.join(base, e["image"]))
        cap = f'<div class="cap">{html.escape(e.get("caption", ""))}</div>' if e.get("caption") else ""
        ev = f'<div class="evidence"><div class="card"><img src="{src}">{cap}</div></div>'
    tag = f'<div class="tag">{html.escape(page["tag"])}</div>' if page.get("tag") else ""
    # 标题允许 <br> 手动断行，其余转义
    lines = page.get("title", "").split("<br>")
    # 标题里 ==关键词== → 黄底高亮（封面用）
    title = "<br>".join(re.sub(r"==(.+?)==", r"<mark>\1</mark>", html.escape(t)) for t in lines)
    # 封面页（"cover": true）：大字按最长一行放大到接近满宽（汉字算 1，英文数字算 0.56，高亮标记不计）
    h1_style = ""
    if page.get("cover"):
        plain = [t.replace("==", "") for t in lines]
        units = max((sum(1 if ord(c) > 0x2E7F else 0.56 for c in t) for t in plain), default=1)
        cap = 150 if ev else 175          # 没有配图的「字为主」封面：字更大、黑字、上下留白
        fs = int(min(cap, (W - 144) / max(units, 1) * 0.98))
        color = "#141414"                  # 封面大字一律黑字（09-24），藏青留给内页
        top = 10 if ev else 90
        h1_style = f' style="font-size:{fs}px;line-height:1.18;margin:{top}px 0 40px;letter-spacing:0;color:{color}"'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS % {'w': W, 'h': H}}</style></head>
<body><div class="page{'' if ev else ' text'}">
<div class="top">{avatar_html(account, base)}
<div class="who"><div class="name">{html.escape(account.get('name', ''))}</div>
<div class="date">{html.escape(account.get('date', ''))}</div></div>
<div class="pill">{idx}/{total}</div></div>
{tag}<h1{h1_style}>{title}</h1>
<div class="body">{''.join(blocks)}</div>
{ev}
</div></body></html>"""


def shoot_playwright(jobs):
    """没有 Chrome 可执行文件时用 Playwright（云端沙箱：pip install playwright && playwright install chromium）。"""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("找不到 Chrome，也没有 Playwright。云端可试：pip install playwright && "
                 "python -m playwright install chromium；仍不行就只交付 cards.json，回到 Mac 上出图")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        for htm, png in jobs:
            page.goto("file://" + htm)
            page.wait_for_timeout(500)
            page.screenshot(path=png)
            os.remove(htm)
            print(png)
        browser.close()


def main(spec_path, out_dir):
    spec = json.load(open(spec_path, encoding="utf-8"))
    base = os.path.dirname(os.path.abspath(spec_path))
    os.makedirs(out_dir, exist_ok=True)
    pages = spec["pages"]
    jobs = []
    for i, page in enumerate(pages, 1):
        htm = os.path.abspath(os.path.join(out_dir, f"{i:02}.html"))
        png = os.path.abspath(os.path.join(out_dir, f"{i:02}.png"))
        open(htm, "w", encoding="utf-8").write(page_html(page, i, len(pages), spec.get("account", {}), base))
        if os.path.exists(png):
            os.remove(png)
        jobs.append((htm, png))

    shoot(jobs)
    make_overview(out_dir, len(pages))


def shoot(jobs):
    """jobs = [(html 路径, png 路径)]，逐页截成 1080x1440；漫画讲解 skill 也复用这个函数。"""
    chrome = find_chrome()
    if not chrome:
        shoot_playwright(jobs)
        return
    # 独立的临时配置目录，避免和正在用的 Chrome 冲突
    profile = tempfile.mkdtemp(prefix="xhs-chrome-")
    for i, (htm, png) in enumerate(jobs, 1):
        proc = subprocess.Popen(
            [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
             "--allow-file-access-from-files", f"--user-data-dir={profile}",
             "--force-device-scale-factor=1", f"--window-size={W},{H}",
             "--virtual-time-budget=2000", f"--screenshot={png}", "file://" + htm],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # macOS 上无头 Chrome 截完图有时不退出：PNG 写完且大小稳定后主动结束
        last, deadline = -1, time.time() + 60
        while time.time() < deadline and proc.poll() is None:
            time.sleep(0.5)
            size = os.path.getsize(png) if os.path.exists(png) else -1
            if size > 0 and size == last:
                break
            last = size
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(5)
            except subprocess.TimeoutExpired:
                proc.kill()
        if not os.path.exists(png):
            sys.exit(f"第 {i} 页截图失败")
        os.remove(htm)
        print(png)
    shutil.rmtree(profile, ignore_errors=True)


def make_overview(out_dir, n):
    """3 列拼一张 overview.jpg，出图后先看它检查溢出 / 留白。"""
    ff = os.path.expanduser("~/bin/ffmpeg")
    ff = ff if os.path.exists(ff) else shutil.which("ffmpeg")
    if not ff:
        return
    cols = 3
    rows = -(-n // cols)
    inputs, filters = [], []
    for i in range(rows * cols):
        if i < n:
            inputs += ["-i", os.path.join(out_dir, f"{i + 1:02}.png")]
            filters.append(f"[{i}:v]scale=540:720[v{i}]")
        else:
            inputs += ["-f", "lavfi", "-i", "color=c=white:s=540x720:d=1"]
            filters.append(f"[{i}:v]null[v{i}]")
    layout = "|".join(f"{(i % cols) * 540}_{(i // cols) * 720}" for i in range(rows * cols))
    grid = "".join(f"[v{i}]" for i in range(rows * cols))
    fc = ";".join(filters) + f";{grid}xstack=inputs={rows * cols}:layout={layout}"
    out = os.path.join(out_dir, "overview.jpg")
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *inputs,
                    "-filter_complex", fc, "-frames:v", "1", out], check=True)
    print(out)


if __name__ == "__main__":
    main(*sys.argv[1:3])
