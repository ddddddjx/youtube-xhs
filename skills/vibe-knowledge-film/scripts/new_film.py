# -*- coding: utf-8 -*-
"""建一个新片工程：
  python new_film.py <工程目录> [--world A|B|C] [--portrait] [--dur 60] [--three] [--force]
A 鎏金（电影感暗金，11-03 起的默认）· B 寓言（心理和行为机制，插画）· C 夜曲（抽象概念、看不见的机制）。怎么选见 references/worlds.md。
--portrait 出竖屏 1080×1920（默认横屏 1920×1080）；--dur 片长（默认 60）；--three 打开 Three.js。

工程里是 index.html 和一份只能跑起来的 film.js 骨架——里面一行画面都没有。
文案不同，屏上的东西就不同，代码也不同：每一镜照 storyboard.md 现写，不要从别的片子里搬画面。
引擎留在 skill 目录里，由 engine/render.py 挂载。"""
import shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORLD = {   # 外观名、theme、字幕样式、色板、这套外观的常驻元素（都在 vk-kit.js，用法见 references/engine.md）
    "A": ("A 鎏金", "gilt", "gilt", "gilt", "顶部钩子行 K.hookBar、0–2 秒大字 K.headline、景深 K.depth、片名卡 K.titleGilt（可选）"),
    "B": ("B 寓言", "flat", "flat", "flat", "仪表 K.gauge、片名卡 K.titleGilt；场景自己画进 fr.look.under"),
    "C": ("C 夜曲", "night", "night", "night", "章节标 K.chapterMark、片名卡 K.titleNight；字幕带一行英文（en）"),
}
SKELETON = """/* ★ 片名 · {name}
 * 这是骨架，一行画面都没有。每一镜照 storyboard.md 现写——文案不同，屏上的东西就不同。
 * 每个场景的函数头上先写一行：这是什么（日常的词）/ 它在干什么（一个动词）/ 观众明白了什么。
 * 事实和出处、哪些是示意，写在这段注释里。
 * 这套外观的常驻元素：{standing}。规格见 references/worlds.md。 */
(function () {{
'use strict';
const {{ W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix }} = VK;
const K = VKit, P = K.PAL.{pal};

const T = {{ end: {dur} }};                                   // 关键时刻集中写在这里，挪动时只改一处；切点对齐 score.py / beat.py 打出的小节线
const HOOK = '……';                                         // 顶部常驻的钩子标题：第 0 帧就满亮，整条片都在
const SUBS = [                                             // 一句字幕一行，和分镜表对着写；{{词}} 金色，{{!词}} 红色
  // {{ a: 0.8, b: 4.2, zh: '……'{en} }},
];

/* 一个场景一个函数，自己管自己的进场和退场。 */
function scene1(fr, t) {{
}}

VK.film({{
  dur: T.end, theme: '{theme}',
  meta: {{ title: '', music: {{ bpm: 120, sections: [[0, 1]], drop: [] }} }},   // 合成配乐的段落强弱，见 engine/score.py
  draw(fr, t) {{
    scene1(fr, t);                                         // 0–2 秒：第一帧就要有画面和大字（K.headline），不能是黑屏
    K.hookBar(fr, t, HOOK, {{ style: '{subs}' }});              // 顶部常驻钩子标题
    K.subs(fr, t, SUBS, '{subs}');                         // 字幕永远最后画，压在一切之上
  }},
}});
}})();
"""

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 1 or a[0].startswith("-"): sys.exit(__doc__)
    proj = Path(a[0]).resolve(); world = (a[a.index("--world") + 1] if "--world" in a else "A").upper()
    if world not in WORLD: sys.exit("--world 只能是 A、B 或 C")
    dur = a[a.index("--dur") + 1] if "--dur" in a else "60"
    proj.mkdir(parents=True, exist_ok=True)
    film = proj / "film.js"
    if film.exists() and "--force" not in a: sys.exit(f"{film} 已经存在。要覆盖加 --force")
    name, theme, subs, pal, standing = WORLD[world]
    html = (ROOT / "engine/index.html").read_text(encoding="utf-8")
    if "--portrait" in a: html = html.replace("window.VK_SIZE = [1920, 1080];", "window.VK_SIZE = [1080, 1920];")
    if "--three" in a:
        html = html.replace("window.VK_SIZE", "window.VK_THREE = true; window.VK_SIZE", 1)
        html = html.replace("<!-- <script type=\"module\">", "<script type=\"module\">").replace("</script> -->", "</script>")
        if not (ROOT / "engine/vendor/three.module.min.js").exists(): print("注意：engine/vendor/three.module.min.js 还没有，先跑 python engine/get_fonts.py --three")
    (proj / "index.html").write_text(html, encoding="utf-8")
    film.write_text(SKELETON.format(name=name, theme=theme, subs=subs, pal=pal, standing=standing, dur=dur, en=", en: '……'" if world == "C" else ""), encoding="utf-8", newline="\n")
    render = ROOT / "engine/render.py"
    print(f"建好了：{proj}（{name}）\n"
          f"  预览  python \"{render}\" \"{proj}\" --serve\n"
          f"  拼图  python \"{render}\" \"{proj}\" --sheet\n"
          f"  渲染  python \"{render}\" \"{proj}\"\n"
          f"下一步：film.js 里现在一行画面都没有。照 storyboard.md，从最难画的那一镜写起。")
