"""敦煌风·上下五千年 配乐：88 BPM、180 秒、纯代码合成（D 宫五声）。
段落：序 2 小节｜15 朝各 4 小节｜尾声 4 小节。每朝第 1 拍大鼓落地（=横移落点），第 3 小节第 1 拍一记钟/锣（=快推）。
uv run --with numpy --with scipy --with soundfile python synth.py
"""
import numpy as np, scipy.signal as ss, soundfile as sf
from pathlib import Path
SR = 48000; BPM = 88; BEAT = 60 / BPM; BAR = 4 * BEAT; DUR = 180.0
N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(5)
def add(sig, t, g=1.0, pan=0.0):
    s = int(round(t * SR));
    if s >= N: return
    sig = sig[: N - s] * g; a = (pan + 1) * np.pi / 4
    L[s:s + len(sig)] += sig * np.cos(a); R[s:s + len(sig)] += sig * np.sin(a)
def tv(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
# D 宫五声：D E F# A B
PENT = [0, 2, 4, 7, 9]
def deg(i, base=62):  # 第 i 级（可跨八度）
    o, k = divmod(i, 5); return base + 12 * o + PENT[k]
def pluck(f, d=1.6, bright=1.0):  # 琵琶/筝：谐波各自衰减，起音带一点噪声
    t = tv(d); s = np.zeros_like(t)
    for k in range(1, 10):
        s += (1 / k ** (1.2 - 0.3 * bright)) * np.sin(2 * np.pi * f * k * (1 + 0.0007 * k * k) * t) * np.exp(-t * (2.2 + 1.6 * k))
    n = int(0.006 * SR); s[:n] += rng.normal(0, 0.3, n) * np.linspace(1, 0, n)
    return s * np.minimum(1, t / 0.002)
def bell(f, d=4.0):  # 编钟
    t = tv(d); s = np.zeros_like(t)
    for p, a, dc in [(1, 1, 0.9), (2.0, 0.5, 1.4), (2.76, 0.45, 1.8), (5.4, 0.25, 3.0), (8.93, 0.12, 5)]:
        s += a * np.sin(2 * np.pi * f * p * t) * np.exp(-t * dc)
    return s * np.minimum(1, t / 0.001)
def gong(d=6.0, f=110):
    t = tv(d); s = np.zeros_like(t)
    for p in [1, 1.48, 1.97, 2.43, 3.1, 3.92, 4.6]:
        s += np.sin(2 * np.pi * f * p * t * (1 + 0.004 * np.sin(2 * np.pi * 0.7 * t))) * np.exp(-t * (0.6 + p * 0.25)) / p
    return s * np.minimum(1, t / 0.01)
def drum(d=0.9, f0=110, f1=48):
    t = tv(d); f = f1 + (f0 - f1) * np.exp(-t * 18); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 4.5); n = int(0.02 * SR); s[:n] += rng.normal(0, 0.5, n) * np.linspace(1, 0, n); return s
def wood(d=0.12, f=900):
    t = tv(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 60)
def pad(ms, d, g=1.0):  # 笙：几支锯齿波叠加，低通，慢起慢收
    t = tv(d); s = np.zeros_like(t)
    for m in ms:
        f = hz(m)
        for det in (-0.08, 0.08): s += ss.sawtooth(2 * np.pi * f * (1 + det / 100) * t)
    b, a = ss.butter(2, 1400 / (SR / 2)); s = ss.lfilter(b, a, s)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8); return s * env * g / len(ms)
def shimmer(d=2.0):  # 丝带：高处一串轻拨
    out = np.zeros(int(d * SR))
    for i in range(10):
        s = pluck(hz(deg(10 + (i * 3) % 7)), 1.0, 1.5) * 0.25; o = int(i * 0.09 * SR); out[o:o + len(s)] += s[: len(out) - o]
    return out
# ---------- 段落 ----------
eras = 15; T_ERA = lambda k: 2 * BAR + k * 4 * BAR; T_WEI = 2 * BAR + eras * 4 * BAR
CH = [[50, 57, 62], [47, 54, 59], [43, 50, 55], [45, 52, 57]]   # D  Bm  G  A（低音区五声色彩）
# 序：一记钟、丝带一串轻拨、低音持续
add(bell(hz(62), 5), 0.05, 0.5, -0.3); add(pad([38, 45, 50], 2 * BAR + 0.5, 0.35), 0)
add(shimmer(2.2), BAR, 0.6, 0.4)
for i, dg in enumerate([0, 2, 3, 4]): add(pluck(hz(deg(5 + dg)), 1.6), BAR + 0.3 + i * BEAT * 0.5, 0.35, 0.2)
MOTIF = [[4, 3, 2, 0], [2, 4, 5, 4], [0, 2, 3, 2], [5, 4, 2, 3]]
for k in range(eras):
    t0 = T_ERA(k); energy = 0.6 + 0.4 * k / (eras - 1); modern = k >= 11
    add(drum(1.0), t0, 0.9, 0); add(gong(5, 98 if k % 2 else 110), t0, 0.18, -0.2)
    for b in range(4):
        tb = t0 + b * BAR; ch = CH[b % 4]
        add(pad(ch, BAR + 0.4, 0.55), tb, 0.35, 0)
        add(pluck(hz(ch[0] - 12 if ch[0] > 40 else ch[0]), 1.8, 0.4), tb, 0.45, -0.1)
        # 节奏：木鱼四分，越往后越密；近现代加八分
        for q in range(8 if modern else 4):
            add(wood(0.1, 1100 if q % 2 else 800), tb + q * BEAT * (0.5 if modern else 1), 0.18 * energy, 0.4)
        if b in (1, 3): add(drum(0.6, 90, 50), tb + 2 * BEAT, 0.45 * energy, 0)
        # 旋律：动机随朝代在五声里移位；第 3 小节由钟领
        mo = MOTIF[b]; off = (k * 2) % 5
        for i, dgr in enumerate(mo):
            dd = dgr + off; tn = tb + i * BEAT
            inst = bell(hz(deg(dd + 5) - 12), 2.4) * 0.5 if b == 2 else pluck(hz(deg(dd + 5)), 1.6, 1.0)
            add(inst, tn, 0.5 * (0.8 + 0.2 * energy), 0.25 if i % 2 else -0.25)
            if b == 3 and i == 3: add(pluck(hz(deg(dd + 7)), 1.2), tn + BEAT / 2, 0.35, 0.3)
    # 第 3 小节第 1 拍：快推的「咚」
    add(bell(hz(deg(k % 5 + 5) - 12), 3.5), t0 + 2 * BAR, 0.55, 0); add(drum(0.8, 140, 60), t0 + 2 * BAR, 0.7, 0)
    add(shimmer(1.4), t0 - 0.75, 0.35, 0.5)   # 横移时丝带掠过
# 尾声：第 1–2 小节延续，第 3 小节切全貌一记大锣，拉远时长音收
tw = T_WEI; add(drum(1.0), tw, 0.9); add(pad([50, 57, 62, 66], 2 * BAR + 0.3, 0.6), tw, 0.4)
for i, dgr in enumerate([0, 2, 4, 5, 7, 5, 4, 2]): add(pluck(hz(deg(dgr + 5)), 1.8), tw + i * BEAT, 0.45, -0.2 + 0.05 * i)
add(gong(9, 82), tw + 2 * BAR, 0.6, 0); add(drum(1.4, 120, 40), tw + 2 * BAR, 1.0)
add(pad([38, 45, 50, 57, 62], DUR - tw - 2 * BAR, 0.7), tw + 2 * BAR, 0.45)
for i, dgr in enumerate([5, 4, 2, 0]): add(bell(hz(deg(dgr + 5)), 5), tw + 2 * BAR + 0.6 + i * BEAT * 1.5, 0.45, -0.3 + 0.2 * i)
add(bell(hz(62), 6), tw + 3 * BAR + 1.0, 0.5); add(shimmer(2.5), tw + 3 * BAR + 0.4, 0.4, 0.3)
# ---------- 混音：轻混响、限幅、响度 ----------
def verb(x):
    ir = rng.normal(0, 1, int(1.6 * SR)) * np.exp(-np.arange(int(1.6 * SR)) / SR * 3.2); ir[0] = 0
    return ss.fftconvolve(x, ir)[: len(x)] * 0.012
L2 = L + verb(L); R2 = R + verb(R)
fade = np.ones(N); fn = int(1.2 * SR); fade[-fn:] = np.linspace(1, 0, fn) ** 2
st = np.stack([L2 * fade, R2 * fade], 1)
rms = np.sqrt(np.mean(st ** 2)); st *= 0.12 / rms
st = np.tanh(st * 1.1) / np.tanh(1.1); st *= 10 ** (-1.5 / 20) / np.max(np.abs(st))
out = Path(__file__).with_name('配乐.wav'); sf.write(out, st, SR); print(out, st.shape[0] / SR)
