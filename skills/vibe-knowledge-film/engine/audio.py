# -*- coding: utf-8 -*-
"""按画面事件表合成配乐和音效，再和画面合成成片。
  python audio.py <工程目录>                       # 读 audio/events.json → audio/score.wav → renders/final.mp4
  python audio.py <工程目录> --bgm 曲子.mp3 [-8]   # 用现成配乐垫底（默认 -8 dB），事件音照样叠上去
  python audio.py <工程目录> --wav-only            # 只出 wav，不合成
  python audio.py <工程目录> --bgm 曲子.mp3 -8 --from 12.37   # 11-03：从第 12.37 秒（beat.py 算出的乐句起点）截取配乐
  python audio.py <工程目录> --bgm audio/music.wav 0          # 用 score.py 合成的配乐（已经按分镜做了强弱，0 dB）
混音最后过一道限幅（alimiter），峰值压在 -1 dBTP 以下，不爆音。

事件表由 render.py --events 导出：film.js 里每个 fr.sfx(时刻, 名字, 参数) 就是一条。
声音的写法学自参考片（C 家族）：
  低频长音垫底 · 每章开头一记带泛音的钟/垫和弦（约 8 秒衰减）· 屏幕上每打一个字一声"嗒" ·
  提问处一个上滑音 · 说到噪声就真的铺噪声 · 定理落地的那一下之后留 2–3 秒彻底静音（hush）。
事件名：tick / soft / chord / bloom / rise / thud / tock / stamp / shimmer / hush（参数 dur，秒）
     11-03 加：hit（重击：低频冲击 + 一层噪声，揭晓、落字用）/ whoosh（呼啸：带通噪声扫频，转场、推拉用，参数 dur）/ ping（提示音：清亮的两声，"你猜？"、数字跳出来用）
META（film.js 的 meta）：{ root: 半音偏移, noise: [[起,止,强度0..1],...], silence: [[起,止],...], drone: 0..1 }
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.signal import fftconvolve, lfilter, butter

SR = 48000
D3 = 146.83
PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]           # 大调五声，嗒声从这里取音高
CHORD = [0, 7, 12, 14, 19, 24, 26]                   # 根音、五度、八度、九度…… 叠成"开阔"的和弦

def hz(semi, base=D3): return base * 2 ** (semi / 12)
def env_exp(n, tau, attack=0.004):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / tau)
def lowpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "low"); return lfilter(b, a, x, axis=0)
def highpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high"); return lfilter(b, a, x, axis=0)
def pan(x, p):                                        # p: -1 左 … 1 右
    l, r = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4); return np.stack([x * l, x * r], 1)
def add(buf, x, t):
    i = int(t * SR)
    if i >= len(buf) or i < 0: return
    n = min(len(x), len(buf) - i); buf[i:i + n] += x[:n]

def tone(f, dur, tau, partials=((1, 1.0),), attack=0.004, vib=0.0):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for mult, amp in partials:
        ph = 2 * np.pi * f * mult * t + (vib * np.sin(2 * np.pi * 4.3 * t) if vib else 0)
        out += amp * np.sin(ph) * np.exp(-t / (tau / (1 + 0.35 * (mult - 1))))   # 高次泛音衰减更快
    return out * np.minimum(1, t / attack)

def ev_tick(rng, p):
    f = hz(PENTA[int(p.get("pitch", 0)) % len(PENTA)] + 24)
    x = tone(f, .5, .09, ((1, 1), (2.01, .28), (3.02, .1)), attack=.002)
    click = highpass(rng.standard_normal(int(.012 * SR)) * env_exp(int(.012 * SR), .003), 3000) * .25
    x[:len(click)] += click
    return pan(x * .16 * p.get("gain", 1), rng.uniform(-.35, .35))
def ev_soft(rng, p):
    return pan(tone(hz(12 + 7), 2.2, .7, ((1, 1), (2, .2)), attack=.03) * .12 * p.get("gain", 1), 0)
def ev_chord(rng, p):
    root = p.get("root", 0); n = int(9 * SR); out = np.zeros((n, 2))
    for k, semi in enumerate(CHORD):
        f = hz(root + semi); x = tone(f, 9, 2.6 - k * .12, ((1, 1), (2.003, .32), (3.01, .14), (4.02, .06)), attack=.012, vib=.6)
        out += pan(x * (.11 / (1 + k * .22)), (k % 3 - 1) * .5)
    sub = tone(hz(root - 12), 6, 2.2, ((1, 1),), attack=.02)
    out[:len(sub)] += pan(sub * .16, 0)
    return out * p.get("gain", 1)
def ev_bloom(rng, p):                                 # 闪白：和弦 + 一口气的噪声扫过
    out = ev_chord(rng, {"root": p.get("root", 0), "gain": 1.15 * p.get("gain", 1)})
    n = int(1.6 * SR); ns = rng.standard_normal((n, 2)) * env_exp(n, .35, .01)[:, None]
    out[:n] += lowpass(highpass(ns, 500), 7000) * .12
    return out
def ev_rise(rng, p):                                  # 上滑音：提问、蓄势
    dur = p.get("dur", 1.0); n = int(dur * SR); t = np.arange(n) / SR
    f = hz(7) * 2 ** (t / dur * 1.0); ph = 2 * np.pi * np.cumsum(f) / SR
    e = np.sin(np.pi * np.minimum(1, t / dur) ** 1.6) ** 1.2
    ns = lowpass(rng.standard_normal(n), 2500) * (t / dur) ** 2 * .22
    return pan((np.sin(ph) * .1 + ns * .1) * e * p.get("gain", 1), 0)
def ev_thud(rng, p):
    n = int(.6 * SR); t = np.arange(n) / SR; f = 95 * np.exp(-t * 9) + 48
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, .13, .002) + lowpass(rng.standard_normal(n), 600) * env_exp(n, .04) * .5
    return pan(x * .42 * p.get("gain", 1), 0)
def ev_tock(rng, p):
    f = 520 * 2 ** (int(p.get("pitch", 0)) * 2 / 12); n = int(.25 * SR)
    x = tone(f, .25, .04, ((1, 1), (2.7, .4), (5.1, .15)), attack=.001) + highpass(rng.standard_normal(n), 2500) * env_exp(n, .006) * .3
    return pan(x * .2 * p.get("gain", 1), rng.uniform(-.5, .5))
def ev_stamp(rng, p):
    n = int(.5 * SR); x = ev_thud(rng, {"gain": 1.1})[:n, 0] + highpass(rng.standard_normal(n), 1800) * env_exp(n, .02) * .35
    return pan(x * p.get("gain", 1), 0)
def ev_shimmer(rng, p):
    n = int(2.4 * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for k in range(7): out += np.sin(2 * np.pi * hz(24 + PENTA[k + 2]) * t + rng.uniform(0, 6)) * np.exp(-((t - .25 - k * .06) / .5) ** 2)
    return pan(out * .035 * p.get("gain", 1), 0)
def ev_hit(rng, p):                                   # 重击：比 thud 更重，有一层空气感
    n = int(1.4 * SR); t = np.arange(n) / SR; f = 70 * np.exp(-t * 7) + 38
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, .32, .001)
    crack = highpass(rng.standard_normal(n), 1200) * env_exp(n, .03, .0005) * .5
    air = lowpass(rng.standard_normal(n), 900) * env_exp(n, .5, .01) * .25
    return pan((body * .75 + crack + air) * .55 * p.get("gain", 1), 0)
def ev_whoosh(rng, p):                                # 呼啸：低频段和高频段两层噪声交叉，听起来像往上扫再落回
    dur = p.get("dur", .9); n = int(dur * SR); t = np.arange(n) / SR; k = t / dur; ns = rng.standard_normal(n)
    bl, al = butter(2, [250 / (SR / 2), 900 / (SR / 2)], "band"); bh, ah = butter(2, [1400 / (SR / 2), 4200 / (SR / 2)], "band")
    w = np.sin(np.pi * k) ** 2; out = lfilter(bl, al, ns) * (1 - w) + lfilter(bh, ah, ns) * w * 1.3
    e = np.sin(np.pi * k) ** 1.4
    return np.stack([out * e * (1 - .35 * k), out * e * (.65 + .35 * k)], 1) * .5 * p.get("gain", 1)
def ev_ping(rng, p):                                  # 提示音：两声清亮的正弦，第二声高五度
    a = tone(hz(PENTA[int(p.get("pitch", 3)) % len(PENTA)] + 24), .9, .22, ((1, 1), (2.0, .18), (3.01, .05)), attack=.002)
    b = tone(hz(PENTA[int(p.get("pitch", 3)) % len(PENTA)] + 31), .9, .26, ((1, 1), (2.0, .15)), attack=.002)
    x = np.zeros(int(1.1 * SR)); x[:len(a)] += a; i = int(.12 * SR); x[i:i + len(b)] += b[:len(x) - i] * .8
    return pan(x * .14 * p.get("gain", 1), 0)
EV = dict(hit=ev_hit, whoosh=ev_whoosh, ping=ev_ping, tick=ev_tick, soft=ev_soft, chord=ev_chord, bloom=ev_bloom, rise=ev_rise, thud=ev_thud, tock=ev_tock, stamp=ev_stamp, shimmer=ev_shimmer)

def reverb(x, rng, t60=3.6, wet=.42):
    n = int(t60 * SR); t = np.arange(n) / SR
    ir = lowpass(rng.standard_normal((n, 2)) * np.exp(-6.9 * t / t60)[:, None], 5200); ir[:int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))[:, None]
    ir /= np.sqrt((ir ** 2).sum(0)).max()
    wetsig = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1)
    return x + wetsig * wet

def synth(spec, bgm=False):
    end = spec["end"]; meta = spec.get("meta") or {}; n = int((end + .05) * SR); rng = np.random.default_rng(20261006)
    dry = np.zeros((n, 2)); t = np.arange(n) / SR; root = meta.get("root", 0)
    hush = [(when, when + p.get("dur", 2.5)) for when, name, p in spec["events"] if name == "hush"]
    for when, name, p in spec["events"]:
        if name in EV: add(dry, EV[name](rng, dict(p, root=p.get("root", 0) + root) if name in ("chord", "bloom") else p), when)
    out = reverb(dry, rng)
    if not bgm:                                       # 低频长音垫底：两个略微失谐的正弦 + 很慢的呼吸
        lv = .05 * meta.get("drone", 1)
        d = (np.sin(2 * np.pi * hz(root - 24) * t) + .6 * np.sin(2 * np.pi * hz(root - 24 + .08) * 2 * t) + .25 * np.sin(2 * np.pi * hz(root - 12 + 7) * t)) * (.75 + .25 * np.sin(2 * np.pi * t / 11))
        air = lowpass(highpass(rng.standard_normal(n), 300), 1800) * .012 * (.6 + .4 * np.sin(2 * np.pi * t / 17))
        out += np.stack([d * lv + air, d * lv + np.roll(air, 4000)], 1)
    for a, b, k in meta.get("noise", []):             # 文案说到噪声，配乐里就真的有噪声
        g = np.clip((t - a) / max(.01, b - a), 0, 1) ** 1.5 * (t <= b) * k
        out += lowpass(highpass(rng.standard_normal((n, 2)), 200), 6000) * (g * .12)[:, None]
    g = np.ones(n)
    for a, b in list(meta.get("silence", [])) + hush:  # 彻底静音：0.15s 收掉，0.4s 回来
        g *= 1 - np.clip((t - a) / .15, 0, 1) * (1 - np.clip((t - b) / .4, 0, 1))
    g *= np.clip(t / .6, 0, 1) * np.clip((end - t) / 1.2, 0, 1)
    out *= g[:, None]
    return out

def write_wav(path, x):
    import wave
    x = np.clip(x, -1, 1); pcm = (x * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    proj = Path(a[0]).resolve(); spec = json.load(open(proj / "audio/events.json", encoding="utf-8"))
    bgm = a[a.index("--bgm") + 1] if "--bgm" in a else None
    bgm_db = float(a[a.index("--bgm") + 2]) if bgm and len(a) > a.index("--bgm") + 2 and a[a.index("--bgm") + 2].lstrip("-").replace(".", "").isdigit() else -8
    x = synth(spec, bgm=bool(bgm)); pk = np.abs(x).max() or 1; x = x / pk * 10 ** (-3 / 20)
    wav = proj / "audio/score.wav"; write_wav(wav, x); print("score:", wav, f"{len(x) / SR:.1f}s", len(spec["events"]), "events")
    if "--wav-only" in a: sys.exit()
    raw, out, end = proj / "renders/raw.mp4", proj / "renders/final.mp4", spec["end"]
    lim = "alimiter=limit=0.89:attack=5:release=60:level=disabled"   # 11-03：限幅，峰值不过 -1 dBFS
    if bgm:   # 现成配乐：从 --from 秒起截（beat.py 给的乐句起点），垫底 + 事件音；结尾 2.5 秒淡出；整体到 -14 LUFS
        st = float(a[a.index("--from") + 1]) if "--from" in a else 0.0; fo = min(2.5, end / 4)
        fc = f"[2:a]atrim={st}:{st + end},asetpts=PTS-STARTPTS,volume={bgm_db}dB,afade=t=in:d=0.08,afade=t=out:st={end - fo}:d={fo}[b];[1:a][b]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,{lim}[a]"
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-i", str(wav), "-stream_loop", "-1", "-i", bgm, "-filter_complex", fc]
    else:     # 合成配乐本来就安静、动态大：只到 -18 LUFS，别压扁
        cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-i", str(wav), "-filter_complex", f"[1:a]loudnorm=I=-18:TP=-1.5:LRA=14,{lim}[a]"]
    subprocess.run(cmd + ["-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", str(out)], check=True)
    print("done", out)
