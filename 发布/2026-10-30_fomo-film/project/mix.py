# -*- coding: utf-8 -*-
"""旁白 + 音效 + 配乐（可选）合成成片。skill 的 audio.py 只管音效和配乐，旁白是这条片额外加的（用户 10-30 要求）。
  python mix.py                      # renders/raw.mp4 + audio/score.wav + narration/*.mp3 → renders/final.mp4
  python mix.py --bgm 曲子.mp3 [-14] # 再垫配乐（默认 -14 dB），旁白出现时配乐自动压低（sidechain）
先跑：render.py <工程> --events && audio.py <工程> --wav-only（出 audio/score.wav）。
旁白时间表在 narration.json：[文件, 起始秒]，起始秒 = 对应字幕的 a。
"""
import json, subprocess, sys
from pathlib import Path

proj = Path(__file__).resolve().parent
a = sys.argv[1:]
bgm = a[a.index("--bgm") + 1] if "--bgm" in a else None
bgm_db = float(a[a.index("--bgm") + 2]) if bgm and len(a) > a.index("--bgm") + 2 else -14
raw, score = proj / "renders/raw.mp4", proj / "audio/score.wav"
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(raw)]).decode().strip())
clips = json.loads((proj / "narration.json").read_text(encoding="utf-8"))["clips"]

cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-i", str(score)]
for f, _ in clips: cmd += ["-i", str(proj / "narration" / f)]
fc, labels = [], []
for i, (_, at) in enumerate(clips):
    ms = int(at * 1000); fc.append(f"[{i + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},volume=1.6[n{i}]"); labels.append(f"[n{i}]")
fc.append(f"{''.join(labels)}amix=inputs={len(clips)}:normalize=0,apad,atrim=0:{dur}[voice]")
fc.append("[voice]asplit=2[v1][vkey]")
fc.append("[1:a]volume=-7dB[sfx]")
if bgm:
    cmd += ["-stream_loop", "-1", "-i", bgm]; bi = len(clips) + 2
    fc.append(f"[{bi}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{dur},volume={bgm_db}dB,afade=t=in:d=1.0,afade=t=out:st={dur - 2.5}:d=2.5[b0]")
    fc.append("[b0][vkey]sidechaincompress=threshold=0.04:ratio=6:attack=40:release=450[bgm]")
    fc.append("[v1][sfx][bgm]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
else:
    fc.append("[vkey]anullsink"); fc.append("[v1][sfx]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]")
out = proj / "renders/final.mp4"
cmd += ["-filter_complex", ";".join(fc), "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", str(out)]
subprocess.run(cmd, check=True)
print("final:", out, f"{dur:.1f}s", "bgm:" if bgm else "", bgm or "")
