"""把英文 srt 和中文 srt 按时间轴合并，输出：
  zh.srt        纯中文字幕
  bilingual.srt 中英双语字幕（中文在上，英文在下）
  bilingual.ass 压制用的双语样式字幕（中文大字，英文小字，半透明黑底）
  bilingual_box.ass 账号黄底字幕（中英同一块黄底，老的分屏版式 compose_split.sh 用它）
竖版成片的字幕不在这里出：compose_frame.py 自己按 1080x1920 的版面生成 frame.ass。
用法: python3 merge_subs.py <英文srt> <中文srt> <输出目录>
"""
import os
import re
import shutil
import subprocess
import sys


def parse_time(t):
    h, m, rest = t.strip().split(":")
    s, ms = rest.replace(".", ",").split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def fmt_srt(x):
    ms = round(x * 1000)
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def fmt_ass(x):
    cs = round(x * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02}:{cs // 100 % 60:02}.{cs % 100:02}"


def read_srt(path):
    cues = []
    for block in re.split(r"\n\s*\n", open(path, encoding="utf-8").read().strip()):
        lines = block.strip().splitlines()
        idx = next((i for i, l in enumerate(lines) if "-->" in l), None)
        if idx is None:
            continue
        a, b = lines[idx].split("-->")
        text = " ".join(l.strip() for l in lines[idx + 1:] if l.strip())
        text = re.sub(r"<[^>]+>", "", text)
        if text:
            cues.append((parse_time(a), parse_time(b.split()[0]), text))
    return cues


def video_size(out):
    """读 <输出目录>/video.mp4 的分辨率（含手机竖拍的旋转信息），读不到按 1920x1080"""
    ff = os.path.expanduser("~/bin/ffmpeg")
    ff = ff if os.path.exists(ff) else shutil.which("ffmpeg")
    video = os.path.join(out, "video.mp4")
    if not (ff and os.path.exists(video)):
        return 1920, 1080
    err = subprocess.run([ff, "-hide_banner", "-i", video], capture_output=True, text=True).stderr
    m = re.search(r"Video:.*?(\d{2,5})x(\d{2,5})", err)
    if not m:
        return 1920, 1080
    w, h = int(m.group(1)), int(m.group(2))
    rot = re.search(r"rotation of (-?[\d.]+)|rotate\s*:\s*(-?\d+)", err)
    if rot and abs(round(float(rot.group(1) or rot.group(2)))) % 180 == 90:
        w, h = h, w
    return w, h


def main(en_path, zh_path, out):
    en, zh = read_srt(en_path), read_srt(zh_path)
    # 中文轨按整句翻译，时间轴和英文不一一对应：
    # 双语 srt 给每条英文配重叠最长的那条中文；ass 里中英两层各用自己的时间轴。
    merged = []
    for s, e, text in en:
        best = max(zh, key=lambda z: min(e, z[1]) - max(s, z[0]))
        zh_text = best[2] if min(e, best[1]) - max(s, best[0]) > 0 else ""
        merged.append((s, e, zh_text, text))

    missing = sum(1 for m in merged if not m[2])
    print(f"英文 {len(en)} 条 / 中文 {len(zh)} 条 / 双语 srt 未配到中文 {missing} 条")

    with open(os.path.join(out, "zh.srt"), "w", encoding="utf-8") as f:
        for i, (s, e, z) in enumerate(zh, 1):
            f.write(f"{i}\n{fmt_srt(s)} --> {fmt_srt(e)}\n{z}\n\n")
    with open(os.path.join(out, "bilingual.srt"), "w", encoding="utf-8") as f:
        for i, (s, e, z, t) in enumerate(merged, 1):
            f.write(f"{i}\n{fmt_srt(s)} --> {fmt_srt(e)}\n" + (f"{z}\n" if z else "") + f"{t}\n\n")

    w, h = video_size(out)
    k = min(w, h) / 1080                     # 横屏 1080p 时 k=1，和原来的样式一样
    lift = int(h * 0.12) if h > w else 0     # 竖屏抬高字幕，避开小红书底部的标题 / 按钮
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ZH,PingFang SC,{round(58 * k)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,{3 * k:.1f},1,2,{round(80 * k)},{round(80 * k)},{round(78 * k) + lift},1
Style: EN,Helvetica Neue,{round(38 * k)},&H00D8F2FF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,{2.4 * k:.1f},1,2,{round(80 * k)},{round(80 * k)},{round(32 * k) + lift},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    with open(os.path.join(out, "bilingual.ass"), "w", encoding="utf-8") as f:
        f.write(header)
        for s, e, z in zh:
            f.write(f"Dialogue: 0,{fmt_ass(s)},{fmt_ass(e)},ZH,,0,0,0,,{z}\n")
        for s, e, t in en:
            f.write(f"Dialogue: 0,{fmt_ass(s)},{fmt_ass(e)},EN,,0,0,0,,{t}\n")

    # 账号黄底版：中英同一块黄底（BorderStyle=3 不透明底框），中文黑字在上、英文深灰在下。
    # 黄色 #FFD93B 在 ass 里是 BGR 的 &H3BD9FF；一条 Dialogue 装两行，两行之间不会裂成两块底。
    box_header = header.replace(
        "[Events]",
        f"Style: BOX,PingFang SC,{round(52 * k)},&H00141414,&H00141414,&H003BD9FF,&H003BD9FF,"
        f"1,0,0,0,100,100,0,0,3,{6 * k:.1f},0,2,{round(70 * k)},{round(70 * k)},"
        f"{round(70 * k) + lift},1\n\n[Events]")
    with open(os.path.join(out, "bilingual_box.ass"), "w", encoding="utf-8") as f:
        f.write(box_header)
        for s, e, z, t in merged:
            en_line = f"{{\\fnHelvetica Neue\\fs{round(34 * k)}\\c&H3A3A3A&}}{t}"
            text = f"{z}\\N{en_line}" if z else en_line
            f.write(f"Dialogue: 0,{fmt_ass(s)},{fmt_ass(e)},BOX,,0,0,0,,{text}\n")


if __name__ == "__main__":
    main(*sys.argv[1:4])
