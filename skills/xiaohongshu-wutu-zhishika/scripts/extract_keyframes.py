#!/usr/bin/env python3
"""从视频里抽候选关键帧（PPT 翻页、图表出现、镜头切换），给 AI 挑图用。

用法:
  python3 extract_keyframes.py <video.mp4> <输出目录> [--scene 0.25] [--min-gap 8]

输出:
  <输出目录>/cand_XXX_HHMMSS.jpg   每个候选帧（宽 640，文件名带时间）
  <输出目录>/index.tsv             序号 / 秒数 / 文件名
  <输出目录>/contact_N.jpg         总览图（4x4 一张，带时间戳），先看这个再挑

挑中后用 grab_frame.sh 按时间点抽原分辨率帧并裁剪。
依赖: ffmpeg（优先 ~/bin/ffmpeg，其次 PATH）
"""
import argparse
import os
import re
import shutil
import subprocess
import sys


def find_ffmpeg():
    local = os.path.expanduser("~/bin/ffmpeg")
    return local if os.path.exists(local) else shutil.which("ffmpeg")


def hms(sec):
    sec = int(sec)
    return f"{sec // 3600:02}{sec // 60 % 60:02}{sec % 60:02}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--scene", type=float, default=0.25, help="画面变化阈值，越小候选越多")
    ap.add_argument("--min-gap", type=float, default=8, help="两张候选的最小间隔（秒）")
    args = ap.parse_args()

    ff = find_ffmpeg()
    if not ff:
        sys.exit("找不到 ffmpeg")
    os.makedirs(args.out, exist_ok=True)
    tmp = os.path.join(args.out, "_raw")
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)

    # 先降到 2fps 再做场景检测，34 分钟视频约 1 分钟跑完；第一帧总是保留
    vf = f"fps=2,select='eq(n\\,0)+gt(scene\\,{args.scene})',scale=640:-2,showinfo"
    proc = subprocess.run(
        [ff, "-hide_banner", "-i", args.video, "-vf", vf, "-fps_mode", "vfr",
         "-q:v", "3", os.path.join(tmp, "%05d.jpg")],
        capture_output=True, text=True)
    times = [float(t) for t in re.findall(r"pts_time:([\d.]+)", proc.stderr)]
    raw = sorted(os.listdir(tmp))
    if not raw:
        sys.exit("没有抽到帧：\n" + proc.stderr[-800:])

    # 按最小间隔去重，只留每段画面的第一张
    kept, last = [], -1e9
    for name, t in zip(raw, times):
        if t - last >= args.min_gap:
            kept.append((t, name))
            last = t

    for f in os.listdir(args.out):
        if f.startswith(("cand_", "contact_")):
            os.remove(os.path.join(args.out, f))
    rows = []
    for i, (t, name) in enumerate(kept, 1):
        new = f"cand_{i:03}_{hms(t)}.jpg"
        shutil.move(os.path.join(tmp, name), os.path.join(args.out, new))
        rows.append((i, t, new))
    shutil.rmtree(tmp)

    with open(os.path.join(args.out, "index.tsv"), "w") as f:
        f.write("idx\tseconds\tfile\n")
        for i, t, name in rows:
            f.write(f"{i}\t{t:.1f}\t{name}\n")

    # 总览图：每张左上角标 序号 + 时间，4x4 一页
    font = next((f for f in ["/System/Library/Fonts/Helvetica.ttc",
                             "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
                 if os.path.exists(f)), None)
    per = 16
    for page in range(0, len(rows), per):
        chunk = rows[page:page + per]
        inputs, filters = [], []
        for j, (i, t, name) in enumerate(chunk):
            inputs += ["-i", os.path.join(args.out, name)]
            label = f"#{i}  {int(t) // 60:02}\\:{int(t) % 60:02}"
            filters.append(
                f"[{j}:v]scale=480:270:force_original_aspect_ratio=decrease,"
                f"pad=480:270:(ow-iw)/2:(oh-ih)/2:color=black,"
                f"drawtext={f'fontfile={font}:' if font else ''}text='{label}':x=8:y=8:fontsize=26:"
                f"fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6[v{j}]")
        while len(filters) < per:  # 补黑格凑满 4x4
            j = len(filters)
            inputs += ["-f", "lavfi", "-i", "color=c=black:s=480x270:d=1"]
            filters.append(f"[{j}:v]null[v{j}]")
        grid = "".join(f"[v{j}]" for j in range(per))
        layout = "|".join(f"{(j % 4) * 480}_{(j // 4) * 270}" for j in range(per))
        fc = ";".join(filters) + f";{grid}xstack=inputs={per}:layout={layout}"
        out = os.path.join(args.out, f"contact_{page // per + 1}.jpg")
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", *inputs,
                        "-filter_complex", fc, "-frames:v", "1", "-q:v", "3", out], check=True)

    print(f"候选帧 {len(rows)} 张，总览图 {-(-len(rows) // per)} 张 → {args.out}")


if __name__ == "__main__":
    main()
