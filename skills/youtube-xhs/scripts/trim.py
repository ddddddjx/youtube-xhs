"""删掉视频里的版权声明等片段（片头、片尾或中间任意段），并同步平移字幕时间轴。
在 merge_subs.py / burn.sh 之前跑，对 _work/ 里的原始文件操作：
  video.mp4 → 删段后覆盖（原片备份为 video_orig.mp4）
  en.srt zh.srt → 删段内的字幕丢弃、之后的整体前移（原件备份为 *.orig.srt）
用法: python3 trim.py <工作目录> --cut 0-5 [--cut 2050-end] ...
  时间单位秒，end 表示到结尾
已压好的成品视频要补删时: python3 trim.py --video <成品.mp4> --srt a.srt --srt b.srt --cut 0-5
"""
import argparse
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from merge_subs import fmt_srt, parse_time  # noqa: E402

FF = os.path.expanduser("~/bin/ffmpeg")
if not os.path.exists(FF):
    FF = shutil.which("ffmpeg")


def duration(video):
    err = subprocess.run([FF, "-i", video], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def parse_cuts(specs, dur):
    cuts = []
    for spec in specs:
        a, b = spec.split("-")
        cuts.append((float(a), dur if b == "end" else float(b)))
    return sorted(cuts)


def shift(t, cuts):
    """原时间 → 删段后的时间；落在删除段内返回 None"""
    removed = 0
    for a, b in cuts:
        if t >= b:
            removed += b - a
        elif t > a:
            return None
    return t - removed


def trim_srt(path, cuts):
    blocks = re.split(r"\n\s*\n", open(path, encoding="utf-8").read().strip())
    out = []
    for block in blocks:
        lines = block.strip().splitlines()
        idx = next((i for i, l in enumerate(lines) if "-->" in l), None)
        if idx is None:
            continue
        a, b = lines[idx].split("-->")
        s, e = parse_time(a), parse_time(b.split()[0])
        # 字幕跨删除段边界时裁到边界
        for ca, cb in cuts:
            if ca <= s < cb:
                s = cb
            if ca < e <= cb:
                e = ca
        if e <= s:
            continue
        ns, ne = shift(s, cuts), shift(e, cuts)
        if ns is None or ne is None or ne <= ns:
            continue
        out.append((ns, ne, lines[idx + 1:]))
    with open(path, "w", encoding="utf-8") as f:
        for i, (s, e, text) in enumerate(out, 1):
            f.write(f"{i}\n{fmt_srt(s)} --> {fmt_srt(e)}\n" + "\n".join(text) + "\n\n")
    print(f"{path}: {len(blocks)} → {len(out)} 条")


def trim_video(src, dst, cuts):
    cond = "+".join(f"between(t,{a},{b})" for a, b in cuts)
    enc = (["-c:v", "h264_videotoolbox", "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M"]
           if "h264_videotoolbox" in subprocess.run([FF, "-hide_banner", "-encoders"],
                                                    capture_output=True, text=True).stdout
           else ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18"])
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-stats", "-y", "-i", src,
                    "-vf", f"select='not({cond})',setpts=N/FRAME_RATE/TB",
                    "-af", f"aselect='not({cond})',asetpts=N/SR/TB",
                    *enc, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
                    "-movflags", "+faststart", dst], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work", nargs="?")
    ap.add_argument("--video")
    ap.add_argument("--srt", action="append", default=[])
    ap.add_argument("--cut", action="append", required=True)
    args = ap.parse_args()

    if args.work:
        video = os.path.join(args.work, "video.mp4")
        srts = [os.path.join(args.work, n) for n in ("en.srt", "zh.srt")
                if os.path.exists(os.path.join(args.work, n))]
    else:
        video, srts = args.video, args.srt
    cuts = parse_cuts(args.cut, duration(video))
    print("删除:", ", ".join(f"{a:g}-{b:g}s" for a, b in cuts))

    root, ext = os.path.splitext(video)
    backup = root + "_orig" + ext
    if not os.path.exists(backup):
        shutil.move(video, backup)
    trim_video(backup, video, cuts)
    for p in srts:
        orig = p[:-4] + ".orig.srt"
        if not os.path.exists(orig):
            shutil.copy(p, orig)
        shutil.copy(orig, p)
        trim_srt(p, cuts)
    print(f"完成: {video}（原片 {backup}）")


if __name__ == "__main__":
    main()
