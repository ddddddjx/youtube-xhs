# -*- coding: utf-8 -*-
"""在几个时间点截原片画面拼成一排，用来核对「这句话是谁说的」、挑开场近景和封面图。
  python frames.py <工作目录> 33 45 120 402 → <工作目录>/renders/frames.jpg
原片开头通常有人名字幕条（Member of Technical Staff 之类），先截那几秒对上谁是谁。
"""
import subprocess, sys, tempfile
from pathlib import Path
P = Path(sys.argv[1]).resolve(); ts = sys.argv[2:]; tmp = Path(tempfile.mkdtemp())
(P / "renders").mkdir(exist_ok=True)
for i, t in enumerate(ts):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", t, "-i", str(P / "src/full.mp4"), "-frames:v", "1", "-vf", "scale=480:-1", str(tmp / f"{i}.jpg")], check=True)
ins = sum((["-i", str(tmp / f"{i}.jpg")] for i in range(len(ts))), [])
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", "".join(f"[{i}]" for i in range(len(ts))) + f"hstack={len(ts)}", str(P / "renders/frames.jpg")], check=True)
print(P / "renders/frames.jpg", "（从左到右：" + "、".join(ts) + " 秒）")
