#!/usr/bin/env python3
"""竖版成片（1080x1920）：顶部信息框 + 中间原视频（字幕压在画面底边）+ 原视频下方的章节标题，背景纯深色或原片模糊压暗。

用法:
  python3 compose_frame.py <工作目录> <frame.png> <输出.mp4> [--bg blur] [--zh-only] [--chapters chapters.json]
  python3 compose_frame.py <工作目录> <frame.png> <预览.png> --preview 65     # 只出第 65 秒那一帧，几秒钟就好

  工作目录里要有 video.mp4、en.srt、zh.srt；frame.png 用 render_frame.py 出。
  字幕在这里单独生成 frame.ass，不用 merge_subs.py 的 ass：
    - 中英双语压在原视频画面的底边，居中，半透明深色底框，中文黑体在上、英文小字在下（11-08 起，对标 Better Living）
    - 原视频下方是「章节标题」：两行黑体大字，第一行白（这段在讲什么）、第二行强调色（这段的结论），随 chapters.json 的时间切换
  工作目录里有 chapters.json（或用 --chapters 指定）就画章节层；没有就只压字幕并提醒。

版面（和 render_frame.py 共用 TOP_H）:
  0–110      小红书播放页的返回 / 搜索键会盖住，不放字
  110–590    顶部信息框
  590–~1200  原视频，宽度铺满；字幕在它的底边
  其下        章节标题（两行）
  1600–1920  小红书的作者栏、标题、点赞栏会盖住，不放字

chapters.json:
{
  "accent": "#FFD93B",                       # 可省，跟 frame.json 同色
  "chapters": [
    {"start": 0,    "line1": "Adam 早期演讲",      "line2": "紧张得观众也能感觉到"},
    {"start": 41.5, "line1": "哪些话值得听",        "line2": "要看对方在说什么"}
  ]
}
  start 是原片时间（秒或 mm:ss），每段到下一段开始为止；4 到 8 段；line1 ≤12 字，line2 ≤14 字。
"""
import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import textwrap

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from merge_subs import fmt_ass, read_srt, video_size  # noqa: E402
from render_frame import H, PAD, TOP_H, W  # noqa: E402

SAFE_BOTTOM = 1600
MAX_VH = 720            # 比 3:2 还方的画面按高度缩，两侧露出模糊背景
ZH_FS, EN_FS = 52, 28   # 字幕压在画面里，比原来放在画面下面时小一号
ZH_EM, EN_EM = 1.0, 0.56      # libass 的字号按行高算：黑体一个汉字宽约 1.0×字号，英文字母约 0.56×字号
SUB_PAD = 120           # 字幕左右各留的边，比顶部 PAD 宽，底框不贴画面边
CH_FS = 58              # 章节标题字号
CH_GAP = 36             # 章节标题离原片下沿
SANS = "PingFang SC" if sys.platform == "darwin" else "Noto Sans CJK SC"


def ass_color(hex_rgb, alpha="00"):
    """#RRGGBB → &HAABBGGRR"""
    h = hex_rgb.lstrip("#")
    return f"&H{alpha}{h[4:6]}{h[2:4]}{h[0:2]}&".upper()


def parse_time(v):
    if isinstance(v, (int, float)):
        return float(v)
    parts = [float(x) for x in str(v).split(":")]
    return sum(x * 60 ** i for i, x in enumerate(reversed(parts)))
BREAK_AFTER = "，。！？、；："
NO_HEAD = "，。！？、；：）》」』”’…,.!?;:)%"   # 不能出现在行首的标点


def tokens(text):
    """汉字逐个切，英文单词 / 数字整块保留"""
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9.\-+'/%]*|\s+|.", text)


def units(tok):
    return sum(1 if ord(c) > 0x2E7F else 0.56 for c in tok)


def wrap_zh(text, limit):
    total = units(text)
    if total <= limit:
        return [text]
    n = math.ceil(total / limit)
    for lim in (max(total / n + 0.6, limit * 0.6), limit):   # 先试着把各行排匀，排不进再顶格排
        lines, cur, cur_w = [], "", 0
        for tok in tokens(text):
            w = units(tok)
            if cur and cur_w + w > lim and tok[0] not in NO_HEAD and not tok.isspace():
                lines.append(cur.strip())
                cur, cur_w = "", 0
            cur, cur_w = cur + tok, cur_w + w
            if tok in BREAK_AFTER and cur_w >= lim * 0.8:   # 快到行尾时遇到标点，就在标点后换行，少拆词
                lines.append(cur.strip())
                cur, cur_w = "", 0
        if cur.strip():
            lines.append(cur.strip())
        if len(lines) <= n:
            return lines
    return lines


def first_speech(work, ff):
    """第一句话的时间：先取字幕第一条的开始，再用 silencedetect 找它附近真正开口的那一刻，往前留 0.1 秒。
    YouTube 自动字幕的时间轴常常比声音早零点几秒，只看字幕会多出一小段没人说话的画面。"""
    ts = [read_srt(os.path.join(work, n))[0][0] for n in ("en.srt", "zh.srt")
          if os.path.exists(os.path.join(work, n))]
    if not ts:
        return 0.0
    cue = min(ts)
    err = subprocess.run([ff, "-hide_banner", "-t", str(cue + 2), "-i", os.path.join(work, "video.mp4"),
                          "-af", "silencedetect=n=-35dB:d=0.4", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    onset = max([e for e in ends if e <= cue + 1.0], default=cue)   # 字幕开始前最后一次静音结束 = 开口
    return max(0.0, onset - 0.1)


def build_ass(work, video_bottom, zh_only, offset=0.0, chapters=None, accent="#FFD93B"):
    """字幕压在原片底边（居中、半透明底框）；章节标题画在原片下方。video_bottom = TOP_H + 原片高。"""
    en, zh = read_srt(os.path.join(work, "en.srt")), read_srt(os.path.join(work, "zh.srt"))
    if offset:   # 成片从 offset 秒开始：时间轴整体前移，之前的字幕丢掉
        en = [(max(0.0, s - offset), e - offset, t) for s, e, t in en if e > offset]
        zh = [(max(0.0, s - offset), e - offset, t) for s, e, t in zh if e > offset]
    if zh_only:
        cues = [(s, e, z, "") for s, e, z in zh]
    else:   # 和 merge_subs.py 的双语 srt 一样：每条英文配重叠最长的那条中文
        cues = []
        for s, e, t in en:
            best = max(zh, key=lambda z: min(e, z[1]) - max(s, z[0]))
            cues.append((s, e, best[2] if min(e, best[1]) - max(s, best[0]) > 0 else "", t))

    sub_margin_v = H - video_bottom + 22          # ASS 底对齐时 MarginV 从画布底算起
    video_h = video_bottom - TOP_H
    zh_lim = (W - 2 * SUB_PAD) / (ZH_FS * ZH_EM)
    en_cols = int((W - 2 * SUB_PAD) / (EN_FS * EN_EM))
    ch_y = video_bottom + CH_GAP
    box = ass_color("#0A0A14", "6E")              # 半透明深色底框
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ZH,{SANS},{ZH_FS},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,2,{SUB_PAD},{SUB_PAD},{sub_margin_v + 18},1
Style: BOX,{SANS},20,{box},{box},{box},{box},0,0,0,0,100,100,0,0,1,0,0,2,0,0,{sub_margin_v},1
Style: CH1,{SANS},{CH_FS},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,7,{PAD},{PAD},{ch_y},1
Style: CH2,{SANS},{CH_FS},{ass_color(accent)},&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,0,0,7,{PAD},{PAD},{ch_y + int(CH_FS * 1.3)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    over = []
    path = os.path.join(work, "frame.ass")
    with open(path, "w", encoding="utf-8") as f:
        f.write(head)
        for s, e, z, t in cues:
            zl = wrap_zh(z, zh_lim) if z else []
            fs = ZH_FS
            if len(zl) > 2:                      # 画面里最多两行中文，再长缩一号
                fs = 44
                zl = wrap_zh(z, (W - 2 * SUB_PAD) / (fs * ZH_EM))
            el = textwrap.wrap(t, en_cols) if t else []
            if len(el) > 2:
                el = textwrap.wrap(t, en_cols * 2)[:2]
            height = len(zl) * fs * 1.08 + len(el) * EN_FS * 1.1 + 34   # 实测黑体行高约 1.05 倍字号
            if height > video_h * 0.42:          # 字幕块盖住画面四成以上就太长
                over.append((s, z or t))
            parts = []
            if zl:
                parts.append((f"{{\\fs{fs}}}" if fs != ZH_FS else "") + "\\N".join(zl))
            if el:
                parts.append(f"{{\\fs{EN_FS}\\b0\\c&HE6E6E6&}}" + "\\N".join(el))
            bw, bh = W - 2 * (SUB_PAD - 36), int(height)          # 整块底框：固定宽、按行数算高
            f.write(f"Dialogue: 0,{fmt_ass(s)},{fmt_ass(e)},BOX,,0,0,0,,{{\\an2\\pos({W // 2},{video_bottom - 22})"
                    f"\\bord0\\shad0\\p1}}m 0 0 l {bw} 0 l {bw} {bh} l 0 {bh}{{\\p0}}\n")
            f.write(f"Dialogue: 1,{fmt_ass(s)},{fmt_ass(e)},ZH,,0,0,0,,{'\\N'.join(parts)}\n")
        if chapters:
            total = max([e for _, e, _ in (zh or en)] + [0]) + 5
            chs = sorted(((parse_time(c["start"]) - offset, c) for c in chapters), key=lambda x: x[0])
            for i, (s, c) in enumerate(chs):
                e = chs[i + 1][0] if i + 1 < len(chs) else total
                if e <= 0:
                    continue
                s = max(0.0, s)
                for key, style in (("line1", "CH1"), ("line2", "CH2")):
                    txt = (c.get(key) or "").strip()
                    if txt:
                        f.write(f"Dialogue: 2,{fmt_ass(s)},{fmt_ass(e)},{style},,0,0,0,,{txt}\n")
    print(f"字幕 {len(cues)} 条，压在画面底边；章节 {len(chapters or [])} 段")
    if over:
        print(f"⚠ {len(over)} 条字幕太长，会盖住小半个画面（把 zh.srt 里这几句拆短 / 压缩）：")
        for s, text in over[:8]:
            print(f"   {int(s) // 60:02}:{int(s) % 60:02}  {text[:36]}")
    if chapters:
        for c in chapters:
            l1, l2 = (c.get("line1") or ""), (c.get("line2") or "")
            if units(l1) > 12 or units(l2) > 14:
                print(f"⚠ 章节标题太长（第一行 ≤12 字、第二行 ≤14 字）：「{l1} / {l2}」")
    else:
        print("提示 没有 chapters.json：原片下方会空着。按 zh.srt 分 4 到 8 段写两行章节标题，见 templates/video_frame.md")
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("frame")
    ap.add_argument("out")
    ap.add_argument("--bg", choices=["blur", "solid"], default="solid",
                    help="solid（默认，11-08 起）= 纯深色底，章节标题更清楚；blur = 原片模糊压暗")
    ap.add_argument("--chapters", metavar="chapters.json", help="章节标题文件，默认读工作目录里的 chapters.json")
    ap.add_argument("--zh-only", action="store_true", help="只要中文字幕")
    ap.add_argument("--preview", type=float, metavar="秒", help="只出这一秒的画面（PNG），用来检查版面")
    ap.add_argument("--start", default="auto", metavar="秒|auto",
                    help="成片从第几秒开始。默认 auto = 第一句话前 0.15 秒，跳过片头动画 / 赞助商页；0 = 不跳")
    a = ap.parse_args()

    work, frame, out = (os.path.abspath(p) for p in (a.work, a.frame, a.out))
    ff = os.path.expanduser("~/bin/ffmpeg")
    ff = ff if os.path.exists(ff) else shutil.which("ffmpeg")
    if not ff:
        sys.exit("找不到 ffmpeg：竖版成片只能在本地完整模式做")
    vw, vh = video_size(work)
    if vh > vw:
        sys.exit("原片本身是竖屏，不用套版式：直接用 burn.sh 压字幕")
    fw, fh = W, round(W * vh / vw / 2) * 2
    if fh > MAX_VH:
        fw, fh = round(MAX_VH * vw / vh / 2) * 2, MAX_VH
    start = first_speech(work, ff) if a.start == "auto" else float(a.start)
    if start:
        print(f"成片从 {start:.2f} 秒开始（跳过片头 {start:.1f} 秒；要保留就加 --start 0）")
    ch_path = a.chapters or os.path.join(work, "chapters.json")
    chapters, accent = None, "#FFD93B"
    if os.path.exists(ch_path):
        spec = json.load(open(ch_path, encoding="utf-8"))
        chapters, accent = spec.get("chapters") or [], spec.get("accent", accent)
    build_ass(work, TOP_H + fh, a.zh_only, start, chapters, accent)

    # 50 / 60 帧的原片降到 30 帧：小红书反正会转码，压制时间和体积都省一半
    probe = subprocess.run([ff, "-hide_banner", "-i", os.path.join(work, "video.mp4")],
                           capture_output=True, text=True).stderr
    m = re.search(r"([\d.]+) fps", probe)
    src = "[0:v]fps=30," if m and float(m.group(1)) > 33 else "[0:v]"
    if a.preview is not None:   # 预览用 -ss 直接跳到那一秒，时间戳会归零，补回去字幕才对得上
        src = src.replace("[0:v]", f"[0:v]setpts=PTS+{a.preview}/TB,")

    if a.bg == "blur":   # 缩到很小再模糊、压暗，最后放大：几乎不占压制时间
        bg = (f"{src}split=2[b0][f0];[b0]scale={W // 4}:{H // 4}:force_original_aspect_ratio=increase,"
              f"crop={W // 4}:{H // 4},boxblur=20:3,colorchannelmixer=rr=.34:gg=.34:bb=.36,"
              f"scale={W}:{H}:flags=bilinear[bg];")
    else:
        bg = f"{src}split=2[b0][f0];[b0]scale={W}:{H},drawbox=c=0x0C0D11:t=fill[bg];"
    fonts = "/System/Library/Fonts/Supplemental"
    fonts = fonts if os.path.isdir(fonts) else "/usr/share/fonts"
    graph = (bg + f"[f0]scale={fw}:{fh}[fg];[bg][fg]overlay=(W-w)/2:{TOP_H}[c1];"
             f"[c1][1:v]overlay=0:0[c2];[c2]ass=frame.ass:fontsdir={fonts}[v]")

    cmd = [ff, "-hide_banner", "-loglevel", "error", "-y"]
    if a.preview is not None:
        cmd += ["-ss", str(start + a.preview), "-i", "video.mp4", "-i", frame,
                "-filter_complex", graph, "-map", "[v]", "-frames:v", "1", out]
    else:
        enc = subprocess.run([ff, "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
        venc = (["-c:v", "h264_videotoolbox", "-b:v", "6M", "-maxrate", "8M", "-bufsize", "12M"]
                if "h264_videotoolbox" in enc else ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21"])
        cmd += ["-stats", "-ss", str(start), "-i", "video.mp4", "-i", frame, "-filter_complex", graph,
                "-map", "[v]", "-map", "0:a?", *venc, "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", out]
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if shutil.which("caffeinate"):   # Mac 一睡着压制就停（用手机 Remote Control 时尤其常见），压片期间不让它睡
        cmd = ["caffeinate", "-i"] + cmd
    subprocess.run(cmd, cwd=work, check=True)
    print(out)


if __name__ == "__main__":
    main()
