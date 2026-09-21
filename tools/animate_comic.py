#!/usr/bin/env python3
"""把漫画讲解的 comic.json 做成带配音的竖版短视频（1080x1920，45–60 秒）。

用法:
  python3 animate_comic.py <comic.json> <narration.json> <输出.mp4> [--voice Tingting] [--rate 205]
                           [--audio-dir <目录>]   # 已有配音（01.wav…）时跳过合成，比如换成真人录音

narration.json: 和 comic.json 的页一一对应
  [{"say": "念给 TTS 的文本（难读的词写成读音，如 Jev→杰夫）", "sub": "字幕上显示的文本"}, ...]

动画:
  - panel 页按块分三拍出现：标题 → 正文 + 图解 → 关键句和结论；封面 / 末页整页出现
  - 每页轻微推近，页与页之间左滑切换
  - 画布 1080x1920：上方漫画页（1080x1440），下方账号黄底字幕
每页时长 = 这一页旁白的长度 + 0.8 秒，所以总时长由旁白决定：想要 45–60 秒，旁白总共 230–270 字。
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

# 独立工具，不属于漫画 skill；只借用 skill 的渲染器出图
SKILL_SCRIPTS = os.path.expanduser("~/.claude/skills/xiaohongshu-manhua-jiangjie/scripts")
sys.path.insert(0, SKILL_SCRIPTS)
import render_comic  # noqa: E402

FF = os.path.expanduser("~/bin/ffmpeg")
FF = FF if os.path.exists(FF) else shutil.which("ffmpeg")
FPS, TRANS, LEAD, TAIL = 30, 0.35, 0.25, 0.55
W, H, PW, PH, PY = 1080, 1920, 1080, 1440, 70     # 画布、漫画页尺寸、漫画页的 y
YELLOW_ASS = "&H0000E6FF"                         # #FFE600 的 BGR


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit("命令失败: " + " ".join(cmd[:6]) + " …\n" + r.stderr[-1500:])
    return r


def duration(path):
    err = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err)
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def tts(text, out_wav, voice, rate):
    aiff = out_wav[:-4] + ".aiff"
    run(["say", "-v", voice, "-r", str(rate), "-o", aiff, text])
    run([FF, "-y", "-loglevel", "error", "-i", aiff, "-ar", "44100", "-ac", "2", out_wav])
    os.remove(aiff)


def stages_of(page):
    """panel 页拆成三拍；返回每一拍「要隐藏的 block 下标集合」。"""
    blocks = page.get("blocks")
    if page.get("type") != "panel" or not blocks:
        return [set()]
    first_h = next((i for i, b in enumerate(blocks) if "h" in b), 0)
    visual = next((i for i, b in enumerate(blocks) if "fig" in b or "rows" in b), len(blocks) - 1)
    cuts = sorted({first_h, max(visual, first_h), len(blocks) - 1})
    return [set(range(c + 1, len(blocks))) for c in cuts]


def render_stages(spec, base, work):
    """每页每一拍出一张 PNG，返回 [[png, …], …]。"""
    rc = render_comic.load_shooter()
    jobs, result = [], []
    for i, page in enumerate(spec["pages"], 1):
        pngs = []
        for k, hidden in enumerate(stages_of(page)):
            htm = os.path.join(work, f"p{i:02}_{k}.html")
            png = os.path.join(work, f"p{i:02}_{k}.png")
            doc = render_comic.page_html(page, i, len(spec["pages"]), spec, base)
            if hidden:   # 后面的块占着位置但先不显示：.panel 的子元素 = 可选的编号 + 各个 block
                first = min(hidden) + 1 + (1 if page.get("no") else 0)
                doc = doc.replace("</style>", f".panel > :nth-child(n+{first}) {{ visibility: hidden }}</style>", 1)
            open(htm, "w", encoding="utf-8").write(doc)
            jobs.append((htm, png))
            pngs.append(png)
        result.append(pngs)
    rc.shoot(jobs)
    return result


def page_clip(pngs, total, out):
    """一页的视频：各拍之间淡入，整页轻微推近。"""
    n = len(pngs)
    if n == 1:
        durs = [total]
    else:   # 第一拍（标题）短一点，最后一拍留够时间读结论
        first = min(0.9, total * 0.22)
        rest = (total - first) / (n - 1)
        durs = [first] + [rest] * (n - 1)
    fade = 0.25
    cmd = [FF, "-y", "-loglevel", "error"]
    for p, d in zip(pngs, durs):
        cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{d + fade + 0.2:.3f}", "-i", p]
    chain, last, off = [], "[0:v]", 0.0
    for k in range(1, n):
        off += durs[k - 1]
        chain.append(f"{last}[{k}:v]xfade=transition=fade:duration={fade}:offset={off:.3f}[x{k}]")
        last = f"[x{k}]"
    frames = int(total * FPS)
    zoom = (f"{last}scale={PW * 2}:{PH * 2},zoompan=z='1+0.035*on/{frames}':x='iw/2-(iw/zoom/2)':"
            f"y='ih/2-(ih/zoom/2)':d=1:s={PW}x{PH}:fps={FPS},trim=duration={total:.3f},"
            f"pad={W}:{H}:0:{PY}:color=white,format=yuv420p[v]")
    chain.append(zoom)
    cmd += ["-filter_complex", ";".join(chain), "-map", "[v]", "-r", str(FPS),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", out]
    run(cmd)


def ass_time(x):
    cs = round(x * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02}:{cs // 100 % 60:02}.{cs % 100:02}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("comic"), ap.add_argument("narration"), ap.add_argument("out")
    ap.add_argument("--voice", default="Tingting"), ap.add_argument("--rate", type=int, default=205)
    ap.add_argument("--audio-dir")
    a = ap.parse_args()

    spec = json.load(open(a.comic, encoding="utf-8"))
    narr = json.load(open(a.narration, encoding="utf-8"))
    if len(narr) != len(spec["pages"]):
        sys.exit(f"narration 有 {len(narr)} 段，comic 有 {len(spec['pages'])} 页，要一一对应")
    chars = sum(len(re.sub(r"[，。？！、：\s]", "", n["sub"])) for n in narr)
    print(f"旁白共 {chars} 字（45–60 秒建议 230–270 字）")
    base = os.path.dirname(os.path.abspath(a.comic))
    work = tempfile.mkdtemp(prefix="comic-anim-")

    # 1. 配音
    wavs = []
    for i, n in enumerate(narr, 1):
        wav = os.path.join(a.audio_dir, f"{i:02}.wav") if a.audio_dir else os.path.join(work, f"{i:02}.wav")
        if not (a.audio_dir and os.path.exists(wav)):
            tts(n["say"], wav, a.voice, a.rate)
        wavs.append(wav)
    adur = [duration(w) for w in wavs]
    lens = [LEAD + d + TAIL for d in adur]

    # 2. 分拍出图 + 每页一段视频
    stage_pngs = render_stages(spec, base, work)
    clips = []
    for i, (pngs, L) in enumerate(zip(stage_pngs, lens), 1):
        clip = os.path.join(work, f"clip{i:02}.mp4")
        page_clip(pngs, L, clip)
        if duration(clip) < L - 0.1:
            sys.exit(f"第 {i} 页的片段只有 {duration(clip):.2f}s，应为 {L:.2f}s")
        clips.append(clip)
        print(f"  第 {i} 页 {L:.1f}s（{len(pngs)} 拍）")

    # 3. 页间左滑切换；算出每页在成片里的起点
    starts, t = [], 0.0
    for L in lens:
        starts.append(t)
        t += L - TRANS
    total = t + TRANS
    cmd = [FF, "-y", "-loglevel", "error"]
    for c in clips:
        cmd += ["-i", c]
    chain, last = [], "[0:v]"
    for k in range(1, len(clips)):
        chain.append(f"{last}[{k}:v]xfade=transition=slideleft:duration={TRANS}:offset={starts[k]:.3f}[s{k}]")
        last = f"[s{k}]"

    # 4. 字幕（账号黄底黑字）
    ass = os.path.join(work, "sub.ass")
    with open(ass, "w", encoding="utf-8") as f:
        f.write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 0\n\n[V4+ Styles]\n"
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
                "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
                "Alignment, MarginL, MarginR, MarginV, Encoding\n"
                f"Style: S,PingFang SC,58,&H00141414,&H00141414,{YELLOW_ASS},{YELLOW_ASS},1,0,0,0,100,100,0,0,3,14,0,"
                "2,70,70,190,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for n, s, d in zip(narr, starts, adur):
            text = n["sub"].replace("\n", "\\N")
            f.write(f"Dialogue: 0,{ass_time(s + LEAD)},{ass_time(s + LEAD + d + 0.15)},S,,0,0,0,,{text}\n")
    shutil.copy(ass, os.path.join(os.path.dirname(os.path.abspath(a.out)), "字幕.ass"))
    fonts = "/System/Library/Fonts" if os.path.isdir("/System/Library/Fonts") else "/usr/share/fonts"
    chain.append(f"{last}ass={ass}:fontsdir={fonts}[v]")

    # 5. 配音按每页起点摆到时间线上
    n_v = len(clips)
    for w in wavs:
        cmd += ["-i", w]
    mix = []
    for k, s in enumerate(starts):
        ms = int((s + LEAD) * 1000)
        chain.append(f"[{n_v + k}:a]adelay={ms}|{ms}[a{k}]")
        mix.append(f"[a{k}]")
    chain.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0,apad=whole_dur={total:.3f}[a]")
    cmd += ["-filter_complex", ";".join(chain), "-map", "[v]", "-map", "[a]", "-t", f"{total:.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", a.out]
    run(cmd)
    shutil.rmtree(work, ignore_errors=True)
    vdur = duration(a.out)
    if abs(vdur - total) > 0.5:
        sys.exit(f"成片 {vdur:.1f}s 和预期 {total:.1f}s 对不上，画面可能中途断了")
    print(f"{a.out}\n总时长 {total:.1f} 秒" + ("" if 45 <= total <= 60 else "  ← 不在 45–60 秒：调 --rate，或增删旁白"))


if __name__ == "__main__":
    main()
