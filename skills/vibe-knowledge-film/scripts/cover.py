# -*- coding: utf-8 -*-
"""视频封面（Krypto说AI 11-03 用户定的样式）：竖屏 1080×1440，跟图文笔记是同一个家族。
白底；页头和图文首页完全一样（头像、橙色昵称、灰色 slogan、发布于 香港）；黑色加粗大标题，关键词垫品牌黄荧光笔；
一行副题；一大张片中画面（圆角、播放键、右下角时长）；三张看点小图配黑字说明。

  python cover.py spec.json 输出.png

spec.json：
{
  "title": "Claude 团队：<br>已经<hl>不给 AI 下指令</hl>了",     // <hl>…</hl> 黄荧光笔，<br> 换行
  "sub": "Anthropic 官方对谈：<o>三个转变</o>讲清他们怎么用 AI",   // <o>…</o> 橙色
  "hero": "画面.jpg",  "dur": "2:43",
  "thumbs": [["a.jpg", "只给目标"], ["b.jpg", "功能随时准备删"], ["c.jpg", "人只看大局"]],
  "title_size": 86                                                   // 可选；两行放不下就调小
}
图片路径相对 spec.json 所在目录。头像默认用 skills/meme-xhs/assets/avatar.png。"""
import json, sys, tempfile, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AVATAR = ROOT / "meme-xhs/assets/avatar.png"

CSS = """
html,body{margin:0;width:1080px;height:1440px;overflow:hidden;background:#fff;font-family:"Noto Sans CJK SC","PingFang SC",sans-serif;color:#171717}
.av{position:absolute;left:56px;top:24px;width:96px;height:96px;border-radius:50%;object-fit:cover}
.nm{position:absolute;left:176px;top:22px;font-size:38px;font-weight:500;color:#EE9632}
.sl{position:absolute;left:390px;top:30px;font-size:27px;color:#AAAAAA}
.loc{position:absolute;left:176px;top:78px;font-size:29px;color:#AAAAAA}
.h1{position:absolute;left:56px;right:56px;top:190px;font-weight:900;line-height:1.22;letter-spacing:1px}
hl{background:linear-gradient(transparent 58%,#FFE03D 58%,#FFE03D 92%,transparent 92%)}
o{color:#EE9632;font-weight:700}
.k{position:absolute;left:56px;right:56px;top:425px;font-size:38px;line-height:1.5}
.fr{position:absolute;left:56px;top:512px;width:968px;height:560px;border-radius:22px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.fr img{width:100%;height:100%;object-fit:cover;display:block}
.play{position:absolute;left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:rgba(255,255,255,.88);box-shadow:0 4px 18px rgba(0,0,0,.3)}
.play:after{content:"";position:absolute;left:48px;top:34px;border-left:40px solid #171717;border-top:26px solid transparent;border-bottom:26px solid transparent}
.dur{position:absolute;right:18px;bottom:16px;background:rgba(0,0,0,.6);color:#fff;font-size:24px;font-weight:700;padding:4px 12px;border-radius:8px}
.row{position:absolute;left:56px;top:1112px;width:968px;display:flex;gap:22px}
.c{flex:1}.c .im{height:186px;border-radius:14px;overflow:hidden}.c img{width:100%;height:100%;object-fit:cover;display:block}
.c p{margin:12px 0 0;font-size:30px;font-weight:700;text-align:center}
"""

def main(spec_path, out):
    spec_path = Path(spec_path).resolve(); base = spec_path.parent; s = json.loads(spec_path.read_text(encoding="utf-8"))
    tmp = Path(tempfile.mkdtemp(prefix="cover-"))
    def cp(p, name):
        src = (base / p) if not Path(p).is_absolute() else Path(p); shutil.copy(src, tmp / name); return name
    av = cp(s.get("avatar", str(AVATAR)), "avatar" + Path(s.get("avatar", str(AVATAR))).suffix)
    hero = cp(s["hero"], "hero" + Path(s["hero"]).suffix)
    thumbs = "".join(f'<div class="c"><div class="im"><img src="{cp(p, f"t{i}" + Path(p).suffix)}"></div><p>{cap}</p></div>' for i, (p, cap) in enumerate(s["thumbs"]))
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<img class="av" src="{av}"><div class="nm">{s.get("name", "Krypto说AI")}</div><div class="sl">{s.get("slogan", "AI builder · 带你拉开和身边人的差距")}</div><div class="loc">发布于 {s.get("location", "香港")}</div>
<div class="h1" style="font-size:{s.get('title_size', 86)}px">{s['title']}</div><div class="k">{s['sub']}</div>
<div class="fr"><img src="{hero}"><div class="play"></div><div class="dur">{s['dur']}</div></div>
<div class="row">{thumbs}</div></body></html>"""
    (tmp / "cover.html").write_text(html, encoding="utf-8")
    from playwright.sync_api import sync_playwright
    import glob
    exe = sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome"))
    with sync_playwright() as p:
        b = p.chromium.launch(**({"executable_path": exe[-1]} if exe else {})); pg = b.new_page(viewport={"width": 1080, "height": 1440})
        pg.goto((tmp / "cover.html").as_uri()); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(400)
        pg.screenshot(path=str(Path(out).resolve())); b.close()
    shutil.rmtree(tmp); print("封面:", out)

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
