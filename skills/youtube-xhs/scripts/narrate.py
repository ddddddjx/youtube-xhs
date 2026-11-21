#!/usr/bin/env python3
"""解读口播版（11-21 起，A 方案）：旁白讲、原片只穿插十几秒的原声当证据 → 一个新的工作目录，直接喂给 compose_frame.py。

用法:
  python3 narrate.py <工作目录>                      # 读 <工作目录>/narration.json，出 <工作目录>/narrated/
  python3 narrate.py <工作目录> --try "一句话"        # 只合成一句试听 narrated/try.wav
  python3 narrate.py <工作目录> --force              # 旁白全部重配（默认按文字缓存，改了哪段只重配哪段）
  然后:
  python3 compose_frame.py <工作目录>/narrated frame.png 成片.mp4     # narrated/ 里有 timeline.json 时自动 --start 0

工作目录里要有 video.mp4、en.srt、zh.srt（fetch.py + merge_subs.py 的产物）。

narration.json:
{
  "voice": "刘飞2.0",              # 音色名（tools/volc-voice/volc_tts.py 的 VOICES）或音色 ID；可省，默认刘飞2.0
  "rate": 0,                       # 语速 -50..100，可省
  "ctx": "像在跟朋友讲一件……",      # 语气指令，可省
  "pause": 0.45,                   # 句间停顿秒数，可省
  "bed": 0,                        # 旁白下面原片声音的音量（0 = 静音，0.1 左右能听到一点现场声）
  "segments": [
    {"say": "旁白，一段可以几句。", "over": 12.0, "chapter": {"line1": "他是谁", "line2": "Coinbase 创始人"}},
    {"clip": [65.2, 78.0]},
    {"say": "……", "over": 80}
  ]
}
  say  旁白段：画面从原片 over 秒起取旁白那么长（不写 over 就取紧接着的那段原声之前的画面，再没有就取上一段原声之后）
  clip 原声段：原片 [开始, 结束] 秒，原声 + 原字幕（中英），每段建议 ≤15 秒
  chapter  可选：这一段开始时切换章节标题，自动写成 narrated/chapters.json

出: narrated/video.mp4、zh.srt、en.srt（只有原声段有英文）、chapters.json、timeline.json、narration/*.wav
"""
import argparse, json, os, re, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
for p in [os.environ.get("VOLC_TTS_DIR"), HERE.parents[2] / "tools" / "volc-voice"]:
    if p and (Path(p) / "volc_tts.py").exists():
        sys.path.insert(0, str(p)); break
import volc_tts as T  # noqa: E402
from merge_subs import fmt_srt, read_srt  # noqa: E402

FPS = 30
CLIP_WARN = 15        # 单段原声超过这么多秒提醒
SHARE_WARN = 0.5      # 原声占全片超过一半提醒：这就又像整片搬运了
SUB_MAX = 20          # 旁白字幕一条最多这么多字，长句按逗号拆


def ffmpeg():
    ff = os.path.expanduser("~/bin/ffmpeg")
    return ff if os.path.exists(ff) else shutil.which("ffmpeg")


def dur(ff, path):
    err = subprocess.run([ff, "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def chunks(sent, a, b):
    """一句旁白 → 一到几条字幕，按逗号拆、时长按字数分。"""
    if len(sent) <= SUB_MAX:
        return [(a, b, sent)]
    bits, cur = [], ""
    for piece in re.split(r"(?<=[，、；：,;:])", sent):
        if cur and len(cur) + len(piece) > SUB_MAX:
            bits.append(cur); cur = ""
        cur += piece
    if cur:
        bits.append(cur)
    total, out, t = sum(len(x) for x in bits), [], a
    for x in bits:
        d = (b - a) * len(x) / total
        out.append((t, t + d, x)); t += d
    return out


def clean(t):  # 字幕不带句末句号
    return re.sub(r"[。，,]$", "", t.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("--plan", help="默认 <工作目录>/narration.json")
    ap.add_argument("--try", dest="try_", metavar="一句话")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    work = Path(a.work).resolve()
    plan_path = Path(a.plan) if a.plan else work / "narration.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8")) if plan_path.exists() else {}
    v, rate, ctx = plan.get("voice", "刘飞2.0"), plan.get("rate", 0), plan.get("ctx")
    pause, bed = plan.get("pause", 0.45), float(plan.get("bed", 0))
    out = work / "narrated"; (out / "narration").mkdir(parents=True, exist_ok=True); (out / "parts").mkdir(exist_ok=True)

    if a.try_:
        audio, marks = T.say(a.try_, v, rate, ctx, pause)
        T.write_wav(out / "try.wav", audio)
        print(f"{out / 'try.wav'}  {len(audio) / T.SR:.2f}s  音色 {v}"); return

    ff = ffmpeg()
    if not ff:
        sys.exit("找不到 ffmpeg")
    src = work / "video.mp4"
    src_len = dur(ff, src)
    en, zh = read_srt(work / "en.srt"), read_srt(work / "zh.srt")
    segs = plan.get("segments") or sys.exit(f"{plan_path} 里没有 segments")

    # 1. 旁白：按文字缓存
    for i, s in enumerate(segs):
        if "say" not in s:
            continue
        k = T.key(s["say"], v, rate, ctx, pause, bool(os.environ.get("VOLC_TTS_FAKE")))
        wav, meta = out / "narration" / f"{i:02}_{k}.wav", out / "narration" / f"{i:02}_{k}.json"
        if a.force or not wav.exists():
            audio, marks = T.say(s["say"], v, rate, ctx, pause)
            T.write_wav(wav, audio); meta.write_text(json.dumps(marks, ensure_ascii=False))
            print(f"旁白 {i:02}  {len(audio) / T.SR:.1f}s  {s['say'][:24]}…")
        s["_wav"], s["_marks"] = wav, json.loads(meta.read_text())
        s["_len"] = s["_marks"][-1][2] + 0.35 if s["_marks"] else 0.5   # 段尾留一口气

    # 2. 旁白画面从哪取
    for i, s in enumerate(segs):
        if "say" not in s or "over" in s:
            continue
        nxt = next((x for x in segs[i + 1:] if "clip" in x), None)
        prv = next((x for x in reversed(segs[:i]) if "clip" in x), None)
        if nxt and nxt["clip"][0] - s["_len"] >= 0:
            s["over"] = nxt["clip"][0] - s["_len"]
        elif prv:
            s["over"] = prv["clip"][1]
        else:
            s["over"] = 0
        s["over"] = max(0.0, min(float(s["over"]), src_len - s["_len"]))

    # 3. 逐段出片（统一 30fps、48k 立体声，才能无损拼接）
    vf = f"fps={FPS},format=yuv420p"
    enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
    t, timeline, subs_zh, subs_en, chapters, parts = 0.0, [], [], [], [], []
    for i, s in enumerate(segs):
        part = out / "parts" / f"{i:02}.mp4"
        if "chapter" in s:
            chapters.append({"start": round(t, 2), **s["chapter"]})
        if "say" in s:
            L = s["_len"]
            mix = (f"[0:a]volume={bed}[b];[1:a]aformat=channel_layouts=stereo,apad[n];[n][b]amix=inputs=2:duration=first:normalize=0[a]"
                   if bed > 0 else "[1:a]aformat=channel_layouts=stereo,apad[a]")
            cmd = [ff, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s["over"]), "-t", str(L), "-i", str(src),
                   "-i", str(s["_wav"]), "-filter_complex", f"[0:v]{vf}[v];{mix}", "-map", "[v]", "-map", "[a]",
                   "-t", str(L), *enc, str(part)]
            for sent, a0, b0 in s["_marks"]:
                subs_zh += [(t + x, t + y, clean(z)) for x, y, z in chunks(sent, a0, b0)]
            timeline.append({"kind": "say", "at": round(t, 2), "len": round(L, 2), "over": round(s["over"], 2), "text": s["say"]})
        else:
            c0, c1 = map(float, s["clip"]); L = c1 - c0
            cmd = [ff, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(c0), "-t", str(L), "-i", str(src),
                   "-vf", vf, "-af", f"afade=t=in:d=0.06,afade=t=out:st={max(0, L - 0.08)}:d=0.08",
                   *enc, str(part)]
            for cues, bucket in ((zh, subs_zh), (en, subs_en)):
                for x, y, z in cues:
                    if y > c0 and x < c1:
                        bucket.append((t + max(x, c0) - c0, t + min(y, c1) - c0, z))
            timeline.append({"kind": "clip", "at": round(t, 2), "len": round(L, 2), "src": [c0, c1]})
        subprocess.run(cmd, check=True)
        parts.append(part)
        t += dur(ff, part)

    lst = out / "parts" / "list.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p in parts))
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-c", "copy", "-movflags", "+faststart", str(out / "video.mp4")], check=True)
    for name, cues in (("zh.srt", subs_zh), ("en.srt", subs_en)):
        with open(out / name, "w", encoding="utf-8") as f:
            for n, (x, y, z) in enumerate(cues, 1):
                f.write(f"{n}\n{fmt_srt(x)} --> {fmt_srt(y)}\n{z}\n\n")
    if chapters:
        (out / "chapters.json").write_text(json.dumps({"chapters": chapters}, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "timeline.json").write_text(json.dumps({"voice": v, "total": round(t, 2), "segments": timeline},
                                                  ensure_ascii=False, indent=1), encoding="utf-8")

    clip_t = sum(x["len"] for x in timeline if x["kind"] == "clip")
    print(f"\n{out / 'video.mp4'}  {t:.1f}s  音色 {v}")
    print(f"旁白 {t - clip_t:.1f}s / 原声 {clip_t:.1f}s（原声占 {clip_t / t:.0%}）  章节 {len(chapters)} 段")
    for x in timeline:
        if x["kind"] == "clip" and x["len"] > CLIP_WARN:
            print(f"⚠ 原声 {x['src'][0]:.1f}–{x['src'][1]:.1f} 长 {x['len']:.1f}s，超过 {CLIP_WARN}s：拆短或换成旁白")
    if clip_t / t > SHARE_WARN:
        print(f"⚠ 原声占了一半以上，又像整片搬运了：多讲、少放")
    if not chapters:
        print("提示 segments 里没写 chapter：成片原片下方会空着")


if __name__ == "__main__":
    main()
