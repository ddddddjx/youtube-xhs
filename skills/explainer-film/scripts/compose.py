# -*- coding: utf-8 -*-
"""合成成片：动画层 renders/anim.mp4 + 原片窗口（圆角遮罩，按 rects.json 放）+ 旁白 + 原声 + 配乐 → renders/final.mp4
  python compose.py <工作目录>
配乐和音量在 plan.json 的 bgm：{"file": "audio/bgm.wav", "gain_db": -11.0}（用户 11-02 定的：原 -13 → +15% → 换曲后再 +10%）。
- 旁白音量 ×1.8（复刻音色比原片人声低 1.5–2 dB）
- 配乐全程垫着，人说话时只轻压（sidechain ratio 2.5），不是压到听不见
- 原片有剪口的（clips.json cuts），剪口后那段放大 7%，当成轻推镜遮住跳切
- 整片 loudnorm -14 LUFS
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

P = Path(sys.argv[1]).resolve()
HERE = Path(__file__).resolve().parent
tl = json.loads((P / "timeline.json").read_text(encoding="utf-8"))
plan = json.loads((P / "plan.json").read_text(encoding="utf-8"))
rects = json.loads(((P / "rects.json") if (P / "rects.json").exists() else (HERE / "rects.json")).read_text())
dur = tl["dur"]
bgm = plan.get("bgm", {})

def mask(name):                      # 圆角遮罩，4 倍超采样抗锯齿
    R = rects[name]; f = P / "renders" / f"mask_{name}.png"
    big = Image.new("L", (R["w"] * 4, R["h"] * 4), 0)
    ImageDraw.Draw(big).rounded_rectangle([0, 0, R["w"] * 4 - 1, R["h"] * 4 - 1], R["r"] * 4, fill=255)
    big.resize((R["w"], R["h"]), Image.LANCZOS).save(f); return f

# 输入编号单独计数：遮罩那条带 -loop 1，按「每个输入两个参数」算会错位（11-02 踩过）
inputs = ["-i", str(P / "renders/anim.mp4")]; n_in = 1
def add(*args):
    global n_in
    inputs.extend(args); n_in += 1; return n_in - 1

fc, last = [], "[0:v]"
for wi, w in enumerate(tl["windows"]):
    R = rects[w["rect"]]
    vi = add("-i", str(P / w["src"]))
    mi = add("-loop", "1", "-i", str(mask(w["rect"])))
    d = w["t1"] - w["t0"]; cuts = w.get("cuts") or []
    if cuts:
        bounds = [0] + cuts + [d]; parts = []
        for k in range(len(bounds) - 1):
            z = "crop=iw/1.07:ih/1.07," if k % 2 else ""
            fc.append(f"[{vi}:v]trim={bounds[k]}:{bounds[k + 1]},setpts=PTS-STARTPTS,{z}scale={R['w']}:{R['h']},setsar=1[w{wi}p{k}]")
            parts.append(f"[w{wi}p{k}]")
        fc.append(f"{''.join(parts)}concat=n={len(parts)}:v=1:a=0[w{wi}s]")
    else:
        fc.append(f"[{vi}:v]trim={w['off']}:{w['off'] + d},setpts=PTS-STARTPTS,scale={R['w']}:{R['h']},setsar=1[w{wi}s]")
    fc.append(f"[{mi}:v]trim=0:{d},setpts=PTS-STARTPTS,format=gray[w{wi}m]")
    fc.append(f"[w{wi}s][w{wi}m]alphamerge,format=yuva420p,fade=t=in:d=0.25:alpha=1,fade=t=out:st={max(0, d - .25):.3f}:d=0.25:alpha=1,"
              f"setpts=PTS+{w['t0']}/TB[w{wi}]")
    fc.append(f"{last}[w{wi}]overlay={R['x']}:{R['y']}:eof_action=pass:enable='between(t,{w['t0']},{w['t1']})'[v{wi}]")
    last = f"[v{wi}]"
fc.append(f"{last}format=yuv420p[vout]")

alabels = []
for ai, a in enumerate(tl["audio"]):
    ii = add("-i", str(P / a["src"]))
    ms = int(a["at"] * 1000); g = 1.8 if a.get("narration") else 1.0
    fc.append(f"[{ii}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g},adelay={ms}|{ms}[a{ai}]"); alabels.append(f"[a{ai}]")
fc.append(f"{''.join(alabels)}amix=inputs={len(alabels)}:normalize=0,apad,atrim=0:{dur}[voice]")
if bgm.get("file"):
    fc.append("[voice]asplit=2[vo][vkey]")
    bi = add("-i", str(P / bgm["file"]))
    fc.append(f"[{bi}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{dur},volume={bgm.get('gain_db', -11.0)}dB,afade=t=out:st={dur - 3}:d=3[b0]")
    fc.append("[b0][vkey]sidechaincompress=threshold=0.06:ratio=2.5:attack=40:release=400[bgm]")   # 注释不能写进滤镜字符串里
    fc.append("[vo][bgm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
else:
    fc.append("[voice]loudnorm=I=-14:TP=-1.5:LRA=11[aout]")

out = P / "renders/final.mp4"
cmd = ["ffmpeg", "-v", "error", "-stats", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[vout]", "-map", "[aout]",
       "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
       "-t", str(dur), "-movflags", "+faststart", str(out)]
subprocess.run(cmd, check=True)
print("final:", out, f"{dur:.2f}s")
