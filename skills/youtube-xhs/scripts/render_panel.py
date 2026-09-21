#!/usr/bin/env python3
"""渲染分屏视频下半屏的「补充知识卡」PNG（默认 1080x832，配 1080x608 的视频画面凑成 1080x1440）。

用法:
  python3 render_panel.py <panel.json> <输出.png> [宽 高]

panel.json 结构:
{
  "title": "这门课 / 这位讲者是谁",
  "blocks": [
    {"h": "讲者"},
    {"p": "普通段落，==这句会变成藏青加粗的判断句==。"},
    {"cols": [["讲者", "CMU 教授"], ["课程", "AI Agents 2026"]]}
  ],
  "footer": "来源：频道名 · 视频标题｜字幕：YouTube 自动翻译，Krypto说AI 压制"
}

底色米白、全文衬线、藏青小标题 —— 和图文版卡片同一套视觉。下半屏不放头像和账号名（上半屏已经是别人的画面，再挂自己的头像很别扭）。
出图后必须 Read 一眼 PNG：文字碰到底边就删内容，别改字号。
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

W, H = 1080, 832

CSS = """
@page { margin: 0 }
* { box-sizing: border-box; margin: 0; padding: 0 }
html, body { width: %(w)dpx; height: %(h)dpx; background: #F7F2E8; overflow: hidden }
body { font-family: "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif;
       color: #141414; -webkit-font-smoothing: antialiased }
.panel { width: 100%%; height: 100%%; padding: 44px 56px 34px; display: flex; flex-direction: column }
h1 { color: #2B4B7C; font-size: 46px; line-height: 1.25; font-weight: 900; margin-bottom: 24px; flex: none }
.body { flex: 1 1 auto; min-height: 0; overflow: hidden }
.body h3 { color: #2B4B7C; font-size: 30px; font-weight: 900; margin: 16px 0 8px }
.body h3:first-child { margin-top: 0 }
.body p { font-size: 29px; line-height: 1.6; margin-bottom: 14px; text-align: justify }
.body p b { color: #2B4B7C; font-weight: 900 }
.body table { width: 100%%; border-collapse: collapse; font-size: 28px; margin: 6px 0 16px }
.body td { padding: 9px 6px; border-bottom: 1.5px solid #E2DACB; vertical-align: top }
.body td:first-child { width: 168px; font-weight: 700; color: #2B4B7C }
.foot { font-size: 21px; color: #8A8478; border-top: 1.5px solid #D9D1C1; padding-top: 12px;
        margin-top: 10px; flex: none }
"""


def find_chrome():
    mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(mac):
        return mac
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if shutil.which(name):
            return shutil.which(name)
    return None


def inline(text):
    """==整句== → 藏青加粗判断句；其余转义，保留 <br>。"""
    out = []
    for p in re.split(r"(==.+?==)", text):
        if p.startswith("==") and p.endswith("=="):
            out.append(f"<b>{html.escape(p[2:-2])}</b>")
        else:
            out.append(html.escape(p))
    return "".join(out).replace("&lt;br&gt;", "<br>")


def panel_html(spec, w, h):
    blocks = []
    for b in spec.get("blocks", []):
        if "p" in b:
            blocks.append(f"<p>{inline(b['p'])}</p>")
        elif "h" in b:
            blocks.append(f"<h3>{html.escape(b['h'])}</h3>")
        elif "cols" in b:
            rows = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
                           for r in b["cols"])
            blocks.append(f"<table>{rows}</table>")
    title = "<br>".join(html.escape(t) for t in spec.get("title", "").split("<br>"))
    foot = f'<div class="foot">{html.escape(spec["footer"])}</div>' if spec.get("footer") else ""
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS % {'w': w, 'h': h}}</style></head>
<body><div class="panel"><h1>{title}</h1>
<div class="body">{''.join(blocks)}</div>{foot}</div></body></html>"""


def shoot(htm, png, w, h):
    chrome = find_chrome()
    if not chrome:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            sys.exit("找不到 Chrome，也没有 Playwright：分屏成片只能在本地完整模式做")
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            page.goto("file://" + htm)
            page.wait_for_timeout(500)
            page.screenshot(path=png)
            browser.close()
        return
    profile = tempfile.mkdtemp(prefix="xhs-panel-")
    proc = subprocess.Popen(
        [chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
         "--allow-file-access-from-files", f"--user-data-dir={profile}",
         "--force-device-scale-factor=1", f"--window-size={w},{h}",
         "--virtual-time-budget=2000", f"--screenshot={png}", "file://" + htm],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # macOS 无头 Chrome 截完图有时不退出：PNG 写完且大小稳定后主动结束
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
    shutil.rmtree(profile, ignore_errors=True)


def main(spec_path, out_png, w=W, h=H):
    w, h = int(w), int(h)
    spec = json.load(open(spec_path, encoding="utf-8"))
    out_png = os.path.abspath(out_png)
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    htm = out_png + ".html"
    open(htm, "w", encoding="utf-8").write(panel_html(spec, w, h))
    if os.path.exists(out_png):
        os.remove(out_png)
    shoot(htm, out_png, w, h)
    os.remove(htm)
    if not os.path.exists(out_png):
        sys.exit("下半屏截图失败")
    print(out_png)


if __name__ == "__main__":
    main(*sys.argv[1:5])
