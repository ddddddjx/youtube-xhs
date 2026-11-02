# -*- coding: utf-8 -*-
"""原创 lo-fi 配乐（代码合成，无版权问题）。用户 10-30 想要 hi noise《We Never (Remix)》那种感觉，找不到原曲，改用这条。
温暖、略带怅然：电钢琴七和弦 Fmaj7 → Em7 → Dm7 → Cmaj7，软底鼓 + 擦片 + 八分踩镲，低音跟根音，黑胶底噪，整体低通。
结构跟着画面走：钩子里只有电钢琴；片名那一拍（--drums 秒）鼓进来；结尾 3 秒淡出。
  python tools/bgm.py <时长秒> <鼓进来的秒> <输出.wav> [鼓停的秒]
速度 76.19 BPM：一小节 3.15 秒，片名 25.2 秒正好落在第 9 小节的第一拍。
"""
import sys, wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
dur, drums_at, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
drums_out = float(sys.argv[4]) if len(sys.argv) > 4 else 1e9           # 鼓和低音在这一秒停（回到客厅那段只留电钢琴）
BAR = 3.15; BEAT = BAR / 4
N = int(dur * SR); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def lp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "low"); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), "high"); return lfilter(b, a, x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= N: return
    n = min(len(x), N - i); buf[i:i + n] += x[:n] * g

def epiano(m, d, vel=1.0):                       # 电钢琴：基频 + 几个泛音，钟一样的起音，慢衰减，轻微颤音
    n = int(d * SR); t = np.arange(n) / SR; f = hz(m)
    env = np.minimum(1, t / .008) * np.exp(-t / 1.6)
    trem = 1 + .12 * np.sin(2 * np.pi * 4.5 * t)
    x = (np.sin(2 * np.pi * f * t) + .45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / .5) + .18 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / .25)) * env * trem
    return x * vel

CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]   # Fmaj7 Em7 Dm7 Cmaj7
ROOTS = [41, 40, 38, 36]
nbars = int(dur / BAR) + 2
for b in range(nbars):
    c = CHORDS[b % 4]; t0 = b * BAR
    for k, m in enumerate(c):                     # 和弦稍微错开地弹下去（strum），左右分一点
        x = epiano(m, BAR * 1.2, .16); pan = .35 + .1 * k
        add(L, x, t0 + k * .018, 1 - pan + .3); add(R, x, t0 + k * .018, pan + .3)
    for k, m in enumerate([c[3] + 12, c[2] + 12]):   # 第三拍补一个高八度的短句
        x = epiano(m, 1.0, .07); add(L, x, t0 + BEAT * 2.5 + k * .2, .8); add(R, x, t0 + BEAT * 2.5 + k * .2, 1.0)
    if drums_at - .01 <= t0 < drums_out - .01:      # 鼓在的时候才有低音
        n = int(BAR * SR); t = np.arange(n) / SR; f = hz(ROOTS[b % 4])
        bass = np.sin(2 * np.pi * f * t) * np.minimum(1, t / .02) * np.exp(-t / 1.4) * .32
        add(L, bass, t0); add(R, bass, t0)

def kick():
    n = int(.45 * SR); t = np.arange(n) / SR; f = 95 * np.exp(-t / .05) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .16) * .75
def snare():
    n = int(.3 * SR); t = np.arange(n) / SR
    return (lp(hp(rng.standard_normal(n), 1200), 5000) * .5 + .3 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t / .07) * .28
def hat():
    n = int(.08 * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t / .018) * .07
first = int(np.ceil(drums_at / BAR - 1e-6))
for b in range(first, min(nbars, int(round(drums_out / BAR)))):
    t0 = b * BAR
    for beat in range(4):
        tb = t0 + beat * BEAT; sw = BEAT * .56     # 一点摇摆
        if beat in (0, 2): k = kick(); add(L, k, tb); add(R, k, tb)
        if beat == 2 and b % 2: k = kick() * .6; add(L, k, tb + sw); add(R, k, tb + sw)
        if beat in (1, 3): s = snare(); add(L, s, tb, .9); add(R, s, tb, 1.0)
        for hh in (0, sw): h = hat(); add(L, h, tb + hh, 1.0); add(R, h, tb + hh, .8)

crack = np.zeros(N); idx = rng.integers(0, N, int(dur * 9)); crack[idx] = rng.uniform(-.25, .25, len(idx))
crack = lp(crack, 3500) + lp(rng.standard_normal(N), 900) * .006
L += crack; R += crack * .9
L, R = lp(L, 4200), lp(R, 4200)                   # 整体低通：lo-fi 的闷
fade = np.ones(N); fi = int(1.5 * SR); fo = int(3 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
L *= fade; R *= fade
st = np.stack([L, R], 1); st = st / (np.abs(st).max() or 1) * .89
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print("bgm:", out, f"{dur:.1f}s", "drums at", f"{first * BAR:.2f}s")
