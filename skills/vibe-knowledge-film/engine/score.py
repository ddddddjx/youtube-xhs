# -*- coding: utf-8 -*-
"""没有用户的配乐时，用代码合成一条（Krypto说AI 11-03 加）。默认 120 BPM，段落强弱跟着分镜走。

  python score.py <工程目录>            # 读 audio/events.json 里的 meta.music → audio/music.wav
  python score.py <工程目录> --demo     # 不看分镜，按默认强弱出一条听听

film.js 的 meta 里写：
  music: { bpm: 120, key: -2,                         // key：相对 D 小调的半音偏移
           sections: [[0, 1], [8, 2], [24, 3], [40, 0], [44, 3], [56, 1]],   // [从第几秒起, 强度 0..3]
           drop: [39.0] }                             // 这些时刻前一拍抽空（揭晓前的静默），揭晓那一拍全编制砸回来
  强度：0 = 只有低音长垫；1 = 垫 + 八分音符脉冲低音；2 = 再加鼓和沙锤；3 = 再加钢琴琶音和高处的弦。
  每段的起点会吸到最近的小节线上：分镜的切点也照 bars 对齐（render.py --events 之后跑这个，终端会打出小节线）。
风格：电影感、暗、克制 —— 小调，低音弦乐垫（失谐锯齿波 + 低通），脉冲低音，像太鼓的底鼓，铃一样的钢琴。结尾一个长和弦淡出。
"""
import json, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
def lp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "low"); return lfilter(b, a, x, axis=0)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "high"); return lfilter(b, a, x, axis=0)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def main(proj, demo=False):
    spec = {"end": 60, "meta": {}} if demo else json.load(open(proj / "audio/events.json", encoding="utf-8"))
    end = float(spec["end"]); m = (spec.get("meta") or {}).get("music") or {}
    bpm = float(m.get("bpm", 120)); beat = 60 / bpm; bar = 4 * beat; key = int(m.get("key", 0))
    secs = m.get("sections") or [[0, 1], [end * .15, 2], [end * .45, 3], [end * .7, 2], [end * .85, 3]]
    secs = sorted([[round(t / bar) * bar, lv] for t, lv in secs]); drops = [round(d / beat) * beat for d in m.get("drop", [])]
    N = int((end + 3) * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(1103)
    level = lambda t: max([lv for s0, lv in secs if s0 <= t + 1e-6] or [secs[0][1]])
    def add(x, t, g=1.0, p=0.0):
        i = int(t * SR)
        if i >= N or i < 0: return
        x = x if x.ndim == 2 else np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], 1)
        n = min(len(x), N - i); out[i:i + n] += x[:n] * g
    root = 50 + key                                                      # D3
    prog = [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-2, 2, 5]]              # i – VI – iv – VII（小调，电影感）
    # 低音弦乐垫：每小节一个和弦，失谐锯齿波 + 低通，慢起慢收
    for k in range(int(end / bar) + 2):
        t0 = k * bar; ch = prog[k % 4]; n = int(bar * 1.15 * SR); tt = np.arange(n) / SR
        env = np.minimum(1, tt / .35) * np.minimum(1, (bar * 1.15 - tt) / .4).clip(0, 1)
        pad = np.zeros(n)
        for semi in ch + [ch[0] - 12]:
            for det in (-.07, .07):
                f = hz(root + semi + det); pad += 2 * ((tt * f) % 1) - 1
        add(lp(pad * env, 900 + 500 * min(level(t0), 3) / 3) * .035, t0, p=0)
    for k in range(int(end / beat) + 1):
        t0 = k * beat; lv = level(t0)
        if any(d - beat - 1e-6 <= t0 < d - 1e-6 for d in drops): continue      # 揭晓前一拍抽空
        ch = prog[int(t0 / bar) % 4]
        if lv >= 1:                                                     # 八分音符脉冲低音
            for h in (0, .5):
                n = int(beat * .45 * SR); tt = np.arange(n) / SR; f = hz(root - 12 + ch[0])
                x = (np.sin(2 * np.pi * f * tt) + .35 * np.sign(np.sin(2 * np.pi * f * tt))) * np.exp(-tt / .12)
                add(lp(x, 700) * .16, t0 + h * beat)
        if lv >= 2:                                                     # 鼓：一、三拍底鼓（太鼓感），二、四拍轻的军鼓刷，八分沙锤
            bi = k % 4
            if bi in (0, 2) or (lv >= 3 and bi == 3 and (k // 4) % 2):
                n = int(.5 * SR); tt = np.arange(n) / SR; f = 110 * np.exp(-tt * 18) + 46
                add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .18) * .5 + lp(rng.standard_normal(n), 400) * np.exp(-tt / .03) * .2, t0)
            if bi in (1, 3):
                n = int(.3 * SR); tt = np.arange(n) / SR; add(hp(rng.standard_normal(n), 1800) * np.exp(-tt / .07) * .07, t0, p=.2)
            for h in (0, .5):
                n = int(.08 * SR); tt = np.arange(n) / SR; add(hp(rng.standard_normal(n), 6000) * np.exp(-tt / .015) * .035, t0 + h * beat, p=-.3)
        if lv >= 3:                                                     # 钢琴琶音：十六分，铃一样
            for q in range(4):
                semi = (ch + [ch[0] + 12])[(k * 4 + q) % 4] + 12; n = int(.9 * SR); tt = np.arange(n) / SR; f = hz(root + semi)
                x = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt) + .1 * np.sin(6 * np.pi * f * tt)) * np.exp(-tt / .35) * np.minimum(1, tt / .003)
                add(x * .045, t0 + q * beat / 4, p=(q - 1.5) * .25)
    for d in drops:                                                     # 揭晓那一拍：低音重击 + 全编制
        n = int(2.2 * SR); tt = np.arange(n) / SR; f = 60 * np.exp(-tt * 5) + 36
        add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .6) * .5 + lp(rng.standard_normal(n), 1500) * np.exp(-tt / .4) * .12, d)
    # 结尾：最后一个和弦拖长，3 秒淡出；不拦腰截断
    n = int(4 * SR); tt = np.arange(n) / SR; tail = np.zeros(n)
    for semi in prog[0] + [prog[0][0] - 12, prog[0][0] + 12]: tail += np.sin(2 * np.pi * hz(root + semi) * tt) * np.exp(-tt / 2.2)
    add(lp(tail, 2500) * .06, max(0, end - 3.2))
    # 简单混响 + 整体淡入淡出 + 归一到 -3 dBFS
    ir_n = int(2.2 * SR); ir = lp(rng.standard_normal((ir_n, 2)) * np.exp(-6.9 * np.arange(ir_n) / SR / 2.2)[:, None], 4500); ir /= np.sqrt((ir ** 2).sum(0)).max()
    from scipy.signal import fftconvolve
    out = out + np.stack([fftconvolve(out[:, c], ir[:, c])[:N] for c in (0, 1)], 1) * .25
    out = out[:int(end * SR)]; tt = np.arange(len(out)) / SR
    out *= (np.clip(tt / .05, 0, 1) * np.clip((end - tt) / 3.0, 0, 1))[:, None]
    out = out / (np.abs(out).max() or 1) * 10 ** (-3 / 20)
    (proj / "audio").mkdir(exist_ok=True); path = proj / "audio/music.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype("<i2").tobytes())
    print(f"music: {path}  {bpm} BPM  一小节 {bar:.3f}s  {end:.1f}s")
    print("小节线（成片时刻）:", " ".join(f"{k * bar:.2f}" for k in range(int(end / bar) + 1)))
    print("段落:", secs, " 揭晓:", drops)

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    main(Path(a[0]).resolve(), "--demo" in a)
