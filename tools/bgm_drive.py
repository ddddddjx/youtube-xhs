# -*- coding: utf-8 -*-
"""原创科技感电子配乐（代码合成，无版权问题），给解说片全程垫底用。
用户 11-02 嫌 fomo 片那条 lo-fi 太平，要「相对更强烈一点」：4/4 底鼓 + 反拍踩镲 + 2/4 拍手 + 锯齿贝斯 + 十六分琶音 + 铺底和弦。
两种风格：
  drive  112 BPM，A 小调 Am-F-C-G，暗一点、推进感（科技解说）
  bright 122 BPM，C 大调 C-G-Am-F，亮一点、上扬（发现感）
结构：前 2 小节只有铺底和琶音（开场人物介绍），之后鼓和贝斯进；每 8 小节一次小过门；结尾 3 秒淡出。
  python tools/bgm_drive.py <时长秒> <输出.wav> [drive|bright] [鼓进来的秒，默认 2 小节]
"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
dur, out = float(sys.argv[1]), sys.argv[2]
style = sys.argv[3] if len(sys.argv) > 3 else "drive"
CFG = {"drive": dict(bpm=112, prog=[(57, "m"), (53, "M"), (48, "M"), (55, "M")]),
       "bright": dict(bpm=122, prog=[(48, "M"), (55, "M"), (57, "m"), (53, "M")])}[style]
BEAT = 60 / CFG["bpm"]; BAR = 4 * BEAT
drums_at = float(sys.argv[4]) if len(sys.argv) > 4 else 2 * BAR
N = int(dur * SR); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)

def lp(x, fc, o=2): b, a = butter(o, min(fc, SR / 2 - 100) / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "high"); return lfilter(b, a, x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(x, at, gl=1.0, gr=None):
    i = int(at * SR)
    if i >= N or i + len(x) <= 0: return
    n = min(len(x), N - i); L[i:i + n] += x[:n] * gl; R[i:i + n] += x[:n] * (gl if gr is None else gr)
def saw(f, t): return 2 * ((f * t) % 1) - 1

def kick(): t = np.arange(int(.35 * SR)) / SR; f = 45 + 110 * np.exp(-t / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .18)
def clap():
    t = np.arange(int(.25 * SR)) / SR; n = hp(rng.standard_normal(len(t)), 900)
    env = np.exp(-t / .06) * (1 + .6 * (np.sin(2 * np.pi * 90 * t) > 0) * (t < .03)); return lp(n * env, 6000)
def hat(open_=False): t = np.arange(int((.18 if open_ else .05) * SR)) / SR; return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / (.06 if open_ else .012))
def bass(m, d):
    t = np.arange(int(d * SR)) / SR; f = hz(m - 12)
    x = .6 * saw(f, t) + .4 * saw(f * 1.005, t); env = np.minimum(1, t / .005) * np.exp(-t / (d * .9))
    k = np.exp(-t / .08)                                 # 滤波扫频：亮 → 暗两路按包络混合
    return lp(x * env, 1500) * k + lp(x * env, 480) * (1 - k)
def pluck(m, d):
    t = np.arange(int(d * SR)) / SR; f = hz(m)
    x = saw(f, t) * .5 + np.sin(2 * np.pi * f * t) * .5; return lp(x * np.exp(-t / .12), 3200)
def pad(notes, d):
    t = np.arange(int(d * SR)) / SR; x = np.zeros(len(t))
    for m in notes:
        for det in (-.12, 0, .12): x += saw(hz(m) * 2 ** (det / 12), t)
    env = np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4); return lp(x * env / (3 * len(notes)), 1400)

def chord(root, q): return [root, root + (3 if q == "m" else 4), root + 7]

nbars = int(dur / BAR) + 1
for b in range(nbars):
    t0 = b * BAR; root, q = CFG["prog"][b % 4]; ch = chord(root, q)
    add(pad([m + 12 for m in ch], BAR), t0, .22)
    arp = ch + [ch[0] + 12]
    for s in range(16):                                   # 十六分琶音，左右交替
        m = arp[(s * 3 + b) % 4] + 12; g = .11 if s % 4 else .15
        add(pluck(m, BEAT / 4 * 1.6), t0 + s * BEAT / 4, g * (1.2 if s % 2 else .7), g * (.7 if s % 2 else 1.2))
    if t0 < drums_at - 1e-6: continue
    fill = (b % 8 == 7)
    for k in range(4):
        tb = t0 + k * BEAT
        add(kick(), tb, .9)
        if k in (1, 3): add(clap(), tb, .32)
        add(hat(open_=True), tb + BEAT / 2, .12)
        for e in (0, 2): add(hat(), tb + e * BEAT / 4, .07)
        for e in (0, 1):                                  # 八分贝斯，反拍更响（推进感）
            add(bass(root, BEAT / 2 * .95), tb + e * BEAT / 2, .30 if e else .22)
    if fill:                                              # 过门：最后一拍拍手连击
        for s in range(4): add(clap(), t0 + 3 * BEAT + s * BEAT / 4, .18 + .05 * s)

# 侧链式泵感：每拍底鼓处压一下铺底和琶音（整体轻压）
t = np.arange(N) / SR; ph = (t % BEAT) / BEAT; pump = np.where(t >= drums_at, .72 + .28 * np.minimum(1, ph / .35), 1)
L *= pump; R *= pump
fade = np.minimum(1, (dur - t) / 3.0); fade = np.clip(fade, 0, 1); L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max()) + 1e-9; L, R = L / peak * .89, R / peak * .89
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([L, R], 1) * 32767).astype(np.int16).tobytes())
print(f"bgm: {out} {dur:.1f}s style={style} bpm={CFG['bpm']} drums at {drums_at:.2f}s")
