#!/usr/bin/env python3
"""Style 3（K 老师漫画风）的角色参考图 + 每段首帧图。

造型不在这里定义：直接调用 xiaohongshu-manhua-jiangjie 的 characters.py / render_comic.py 的 scene_svg，
所以视频里的 K 老师和漫画图文里的是同一套线条。图上不放任何文字（视频模型会把参考图里的字抄进画面）。

用法:
  python3 render_refs.py sheet  <输出目录>                 # ref_k_laoshi.png（K 老师 8 个姿势表情）+ ref_cast.png（全员）
  python3 render_refs.py frames <keyframes.json> <输出目录>  # 每段一张 clipNN.png 首帧（可选 clipNN_end.png）

keyframes.json:
{
  "ratio": "9:16",                     # 或 "16:9"
  "clips": [
    {"start": {scene}, "end": {scene}},  # scene 格式同 comic.json 的 scene：actors / props / backdrop / svg / strings / motion
    ...                                  # end 可省；第 N 段的 start 应该和第 N-1 段的 end 画面一致（接得上）
  ]
}
scene 里的文字（say / label / tags / 道具 label）会被去掉，并打印提示。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def load_comic():
    for root in (os.path.join(HERE, "..", ".."), os.path.expanduser("~/.claude/skills")):
        d = os.path.join(root, "xiaohongshu-manhua-jiangjie", "scripts")
        if os.path.exists(os.path.join(d, "render_comic.py")):
            sys.path.insert(0, d)
            import render_comic
            return render_comic
    sys.exit("找不到同级的 xiaohongshu-manhua-jiangjie/scripts/render_comic.py（K 老师造型在那边，要一起安装）")


rcm = load_comic()
FRAMES = {"9:16": (1080, 1920), "16:9": (1920, 1080)}


def strip_text(scene, where):
    """视频首帧不能有字：去掉台词、脚下标签、文字标签。"""
    scene = json.loads(json.dumps(scene))
    dropped = []
    for a in scene.get("actors", []):
        for k in ("say", "label"):
            if a.pop(k, None):
                dropped.append(k)
    for p in scene.get("props", []):
        if p.pop("label", None):
            dropped.append("prop.label")
    if scene.pop("tags", None):
        dropped.append("tags")
    for k in ("bars", "flow", "arrows"):   # 这几种图解自带文字
        if scene.pop(k, None):
            dropped.append(k)
    if dropped:
        print(f"  {where}: 去掉了带文字的字段 {sorted(set(dropped))}（视频画面不放字）")
    return scene


def nest(svg, x, y, w, h, crop=None):
    """把 scene_svg 返回的整张 <svg> 摆进大画布的 (x, y, w, h)；crop="x y w h" 只取画面里的一块（人物特写）。"""
    if crop:
        svg = re.sub(r'viewBox="[^"]*"', f'viewBox="{crop}"', svg, count=1)
    return svg.replace("<svg ", f'<svg x="{x}" y="{y}" width="{w}" height="{h}" ', 1)


def page(w, h, body):
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#FFF}}</style></head>'
            f'<body><svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">'
            f'<rect width="{w}" height="{h}" fill="#FFF"/>{body}</svg></body></html>')


def frame_html(scene, ratio):
    w, h = FRAMES[ratio]
    if ratio == "9:16":   # 竖版：画面放中间偏下，上方留给后期的主题 / 标题，下方留给字幕
        sh = 1240
        return w, h, page(w, h, nest(rcm.scene_svg(scene, sh=sh), 0, 360, 1080, sh))
    sh = 760              # 横版：1080x760 的画面等比放大到满高，左右留白
    sw = int(1080 * h / sh)
    return w, h, page(w, h, nest(rcm.scene_svg(scene, sh=sh), (w - sw) // 2, 0, sw, h))


def shoot(jobs, w, h):
    shooter = rcm.load_shooter()
    shooter.W, shooter.H = w, h
    shooter.shoot(jobs)


def write_jobs(items, out_dir):
    """items = [(文件名, w, h, html)]，按尺寸分批截图。"""
    os.makedirs(out_dir, exist_ok=True)
    by_size = {}
    for name, w, h, htm in items:
        hp, pp = (os.path.abspath(os.path.join(out_dir, name + ext)) for ext in (".html", ".png"))
        open(hp, "w", encoding="utf-8").write(htm)
        if os.path.exists(pp):
            os.remove(pp)
        by_size.setdefault((w, h), []).append((hp, pp))
    for (w, h), jobs in by_size.items():
        shoot(jobs, w, h)


# K 老师参考图：8 个格子，覆盖常用姿势和表情；格子 480x540，全部同一个比例尺
K_POSES = [("stand", "tongue"), ("wave", "happy"), ("point", "smug"), ("think", "think"),
           ("shrug", "meh"), ("run", "surprise"), ("cheer", "happy"), ("hold", "tongue")]
CAST = [{"who": "ein", "pose": "wave", "face": "tongue"}, {"who": "xiaobai", "pose": "stand", "face": "neutral"},
        {"who": "bot", "pose": "stand", "face": "neutral"}, {"who": "bot", "pose": "stand", "face": "happy", "accent": True}]


def sheet(out_dir):
    cells = []
    for i, (pose, face) in enumerate(K_POSES):
        a = {"who": "ein", "pose": pose, "face": face, "scale": 2.2}
        if pose == "hold":
            a["hold"] = "laptop"
        if pose == "run":
            a["motion"] = True
        cells.append(nest(rcm.scene_svg({"actors": [a]}, sh=760), (i % 4) * 480, (i // 4) * 540, 480, 540,
                          crop="200 0 680 765"))
    cast = [nest(rcm.scene_svg({"actors": [dict(a, scale=2.3)]}, sh=760), i * 480, 0, 480, 1080, crop="250 20 580 760")
            for i, a in enumerate(CAST)]
    write_jobs([("ref_k_laoshi", 1920, 1080, page(1920, 1080, "".join(cells))),
                ("ref_cast", 1920, 1080, page(1920, 1080, "".join(cast)))], out_dir)


def frames(spec_path, out_dir):
    spec = json.load(open(spec_path, encoding="utf-8"))
    ratio = spec.get("ratio", "9:16")
    if ratio not in FRAMES:
        sys.exit(f"ratio 只能是 9:16 或 16:9，现在是 {ratio}")
    items = []
    for i, clip in enumerate(spec["clips"], 1):
        for key, suffix in (("start", ""), ("end", "_end")):
            if clip.get(key):
                w, h, htm = frame_html(strip_text(clip[key], f"clip{i:02}.{key}"), ratio)
                items.append((f"clip{i:02}{suffix}", w, h, htm))
    write_jobs(items, out_dir)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "sheet":
        sheet(sys.argv[2])
    elif len(sys.argv) >= 4 and sys.argv[1] == "frames":
        frames(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
