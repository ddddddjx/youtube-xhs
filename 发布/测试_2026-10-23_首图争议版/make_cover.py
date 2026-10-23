# 测试用：赛博老奶式首页（大字争议块 + 红线导语 + 截图 + 引用块）。不进 skill。
import os, sys, subprocess, shutil, tempfile, time, html
from PIL import Image
AV = "/home/user/youtube-xhs/skills/meme-xhs/assets/avatar.png"
TPL = """<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1080px;height:1440px;background:#fff;font-family:"Noto Sans CJK SC","PingFang SC",sans-serif;color:#171717;overflow:hidden}
.top{display:flex;align-items:center;padding:34px 55px 0}
.top img{width:92px;height:92px;border-radius:50%%}
.name{margin-left:28px}.name b{font-size:38px;color:#ee9632;font-weight:600}
.name span{font-size:27px;color:#aaa;margin-left:22px}.name .loc{display:block;font-size:26px;color:#aaa;margin-top:2px}
.block{position:relative;margin:70px 55px 0;background:#fdeeee;padding:26px 40px}
.block:before{content:"";position:absolute;left:0;top:0;width:8px;height:140px;background:#b42020}
.block:after{content:"";position:absolute;right:0;bottom:0;width:8px;height:140px;background:#b42020}
.h{font-size:%(fs)dpx;font-weight:900;line-height:1.22;letter-spacing:1px;color:#1a1212}
.lead{margin:44px 55px 0;font-size:40px;line-height:1.65}
.lead u{color:#c0251f;text-decoration:none;border-bottom:5px solid #c0251f;padding-bottom:2px}
.shot{margin:40px 55px 0;border-bottom:10px solid #c0251f;padding-bottom:10px}
.shot img{width:100%%;display:block;max-height:%(imgh)dpx;object-fit:cover;object-position:top}
.quote{margin:34px 55px 0;background:#fdf1f1;border-left:8px solid #b42020;padding:22px 30px;font-size:36px;line-height:1.55;color:#444}
</style></head><body>
<div class="top"><img src="%(av)s"><div class="name"><b>Krypto说AI</b><span>AI builder · 活全交给 AI 两年</span><span class="loc">发布于 香港</span></div></div>
<div class="block"><div class="h">%(head)s</div></div>
<div class="lead">%(lead)s</div>
<div class="shot"><img src="%(img)s"></div>
%(quote)s
</body></html>"""
def build(out, head_lines, lead_html, img, quote=None, fs=104, imgh=430):
    q = '<div class="quote">%s</div>' % quote if quote else ""
    h = TPL % dict(av="file://"+AV, head="<br>".join(head_lines), lead=lead_html, img="file://"+os.path.abspath(img), quote=q, fs=fs, imgh=imgh)
    tmp = tempfile.mkdtemp(prefix="cov-"); src = os.path.join(tmp, "c.html"); open(src,"w",encoding="utf-8").write(h)
    png = os.path.join(tmp,"c.png")
    subprocess.run(["chromium","--headless=new","--disable-gpu","--hide-scrollbars","--no-sandbox","--allow-file-access-from-files",
        f"--user-data-dir={tmp}/p","--force-device-scale-factor=1","--window-size=1080,1440","--virtual-time-budget=3000",f"--screenshot={png}","file://"+src],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    Image.open(png).convert("RGB").save(out, quality=95); shutil.rmtree(tmp, ignore_errors=True); print(out)
