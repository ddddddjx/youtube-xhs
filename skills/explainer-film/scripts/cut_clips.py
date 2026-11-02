# -*- coding: utf-8 -*-
"""按 plan.json 的 clips 从 src/full.mp4 切片段 → clips/<id>.mov，并写 clips.json（每段时长和剪口位置）。
  python cut_clips.py <工作目录> [--force] [id ...]
- segs 是片源秒数 [[起, 止], ...]，多段会拼起来，拼接处记成剪口（compose 会在剪口后放大 7% 遮跳切）
- mute: true 的是只要画面的片段（开场原片、footage、过桥小窗），不留音轨
- 统一 30fps、1574×1080（原片比例），PCM 音频，避免拼接和叠加时漂移
- 已存在的不重切，除非 --force 或点名 id。旁白改长后 build_timeline 会提示哪段原片不够长，改 segs 再点名重切
"""
import json, subprocess, sys, tempfile
from pathlib import Path
P = Path(sys.argv[1]).resolve(); args = sys.argv[2:]
force = "--force" in args; only = [a for a in args if a != "--force"]
plan = json.loads((P / "plan.json").read_text(encoding="utf-8"))
(P / "clips").mkdir(exist_ok=True)
meta_f = P / "clips.json"; meta = json.loads(meta_f.read_text()) if meta_f.exists() else {}
tmp = Path(tempfile.mkdtemp())
for k, c in plan["clips"].items():
    out = P / "clips" / f"{k}.mov"
    if out.exists() and not force and k not in only and k in meta: continue
    parts = []
    for i, (a, b) in enumerate(c["segs"]):
        f = tmp / f"{k}_{i}.mov"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(a), "-i", str(P / "src/full.mp4"), "-t", str(b - a), "-vf", "fps=30,scale=1574:1080",
               "-c:v", "libx264", "-crf", "16", "-preset", "fast"]
        cmd += ["-an"] if c.get("mute") else ["-af", "aresample=48000", "-ac", "2", "-c:a", "pcm_s16le"]
        subprocess.run(cmd + [str(f)], check=True); parts.append(f)
    lst = tmp / f"{k}.txt"; lst.write_text("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(out)]))
    segs = c["segs"]
    meta[k] = {"dur": round(d, 3), "cuts": [round(sum(b - a for a, b in segs[:i + 1]), 3) for i in range(len(segs) - 1)]}
    print(f"{k:8} {d:6.2f}s  cuts {meta[k]['cuts']}")
meta_f.write_text(json.dumps(meta, indent=1))
