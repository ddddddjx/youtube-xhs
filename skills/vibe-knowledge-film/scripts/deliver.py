# -*- coding: utf-8 -*-
"""交付前最后一步（Krypto说AI 11-03 加）：成片抽帧拼总览图 + 把源码打包成 zip。

  python deliver.py <工程目录> [--frames 12]

做三件事：
1. 查 renders/final.mp4 的规格（分辨率、帧率、编码、时长、有没有音轨），不对就报出来；
2. 从成片里均匀抽 N 帧（默认 12）拼一张 renders/overview.jpg —— 最终检查看这张，不是看 review/ 里的拼图；
3. 把 film.js、index.html、ch*.js、storyboard.md、facts.md、audio/*.json、tools/ 打包成 <工程名>_source.zip（不含渲染结果和字体）。
"""
import json, subprocess, sys, zipfile
from pathlib import Path

def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)

def main(proj, n=12):
    final = proj / "renders/final.mp4"
    if not final.exists(): sys.exit(f"没有 {final}：先跑 audio.py 合成成片")
    info = probe(final); v = next(s for s in info["streams"] if s["codec_type"] == "video"); a = [s for s in info["streams"] if s["codec_type"] == "audio"]
    dur = float(info["format"]["duration"]); fps = eval(v["r_frame_rate"])
    print(f"成片 {v['width']}×{v['height']}  {fps:.2f}fps  {v['codec_name']}  {dur:.2f}s  音轨 {a[0]['codec_name'] if a else '无'}")
    bad = [m for m, ok in [("视频不是 H.264", v["codec_name"] == "h264"), ("没有 AAC 音轨", bool(a) and a[0]["codec_name"] == "aac"), ("帧率不是 30", abs(fps - 30) < .01)] if not ok]
    for m in bad: print("  ✗", m)
    portrait = v["height"] > v["width"]; cols = 6 if portrait else 4; rows = -(-n // cols)
    tw = 320 if portrait else 480; th = tw * v["height"] // v["width"]
    sel = "+".join(f"eq(n\\,{round((i + .5) * dur / n * fps)})" for i in range(n))
    over = proj / "renders/overview.jpg"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(final), "-vf", f"select='{sel}',scale={tw}:{th},tile={cols}x{rows}:padding=6:color=0x141414", "-frames:v", "1", "-vsync", "0", "-q:v", "3", str(over)], check=True)
    print("总览图:", over)
    z = proj / f"{proj.name}_source.zip"
    keep = ["film.js", "index.html", "storyboard.md", "facts.md"] + [p.name for p in proj.glob("ch*.js")]
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in keep:
            if (proj / name).exists(): zf.write(proj / name, name)
        for p in list(proj.glob("audio/*.json")) + list(proj.glob("tools/**/*")):
            if p.is_file(): zf.write(p, p.relative_to(proj))
    print("源码包:", z, f"{z.stat().st_size // 1024} KB")

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    main(Path(a[0]).resolve(), int(a[a.index("--frames") + 1]) if "--frames" in a else 12)
