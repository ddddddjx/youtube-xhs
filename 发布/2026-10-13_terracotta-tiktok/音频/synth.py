"""兵马俑 TikTok 配乐：60 秒，纯代码合成。D 小调，低音持续＋太鼓＋编钟，鼓点落在每个剪辑点。
uv run --with numpy --with scipy --with soundfile python synth.py
"""
import numpy as np, scipy.signal as ss, soundfile as sf
from pathlib import Path
SR = 48000; DUR = 60.0; N = int(DUR * SR); L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(7)
def add(sig, t, g=1.0, pan=0.0):
    s = int(round(t * SR))
    if s >= N: return
    sig = sig[: N - s] * g; a = (pan + 1) * np.pi / 4
    L[s:s + len(sig)] += sig * np.cos(a); R[s:s + len(sig)] += sig * np.sin(a)
def tv(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def taiko(d=1.6, f0=150, f1=48, g=1.0):
    t = tv(d); f = f1 + (f0 - f1) * np.exp(-t * 22); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 3.2); n = int(0.03 * SR); s[:n] += rng.normal(0, 0.7, n) * np.linspace(1, 0, n)
    b, a = ss.butter(2, 2500 / (SR / 2)); return ss.lfilter(b, a, s) * g
def bell(f, d=5.0):
    t = tv(d); s = np.zeros_like(t)
    for p, a, dc in [(1, 1, 0.7), (2.0, 0.5, 1.2), (2.76, 0.45, 1.6), (5.4, 0.25, 2.8), (8.93, 0.12, 4.5)]:
        s += a * np.sin(2 * np.pi * f * p * t) * np.exp(-t * dc)
    return s * np.minimum(1, t / 0.001)
def drone(ms, d, g=1.0, cut=700):
    t = tv(d); s = np.zeros_like(t)
    for m in ms:
        for det in (-0.12, 0.0, 0.12): s += ss.sawtooth(2 * np.pi * hz(m) * (1 + det / 100) * t)
    b, a = ss.butter(2, cut / (SR / 2)); s = ss.lfilter(b, a, s)
    env = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 1.5); return s * env * g / (3 * len(ms))
def riser(d=1.0):
    t = tv(d); s = rng.normal(0, 1, len(t)); out = np.zeros_like(s)
    for i in range(0, len(t), 2400):  # 逐块升高带通
        fc = 300 + 5000 * (i / len(t)) ** 2; b, a = ss.butter(2, [fc * 0.7 / (SR / 2), min(0.99, fc * 1.3 / (SR / 2))], 'band'); out[i:i + 2400] = ss.lfilter(b, a, s[i:i + 2400])
    return out * (t / d) ** 2
def crack(d=0.5):  # 颜料剥落的细碎爆裂声
    out = np.zeros(int(d * SR))
    for i in range(40):
        o = int(rng.uniform(0, d - 0.02) * SR); n = int(0.004 * SR); out[o:o + n] += rng.normal(0, 1, n) * np.linspace(1, 0, n) * rng.uniform(0.2, 1)
    b, a = ss.butter(2, 2000 / (SR / 2), 'high'); return ss.lfilter(b, a, out)
def sub(d=2.5):
    t = tv(d); return np.sin(2 * np.pi * (30 + 25 * np.exp(-t * 3)) * t) * np.exp(-t * 1.2)
def pluck(f, d=1.4):
    t = tv(d); s = np.zeros_like(t)
    for k in range(1, 9): s += (1 / k) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.5 + 1.8 * k))
    return s * np.minimum(1, t / 0.002)

# 段落（与 eras_film.js 对齐）
CUTS = [2.4, 5.4, 8.0, 9.3, 10.6, 12.0, 15.0, 18.0, 20.0, 22.5, 26.0, 31.0, 35.0, 39.0, 42.5, 46.0, 49.7, 53.0, 56.6, 58.4]  # v3.1 剪辑点
# 开场：一记钟 + 剥落爆裂 + 低音落地
add(bell(hz(62), 4), 0.0, 0.55, -0.2); add(sub(2.5), 0.0, 0.9)
for k in range(5): add(crack(0.45), 0.9 + k * 0.35, 0.18, rng.uniform(-0.6, 0.6))
add(riser(1.6), 1.9, 0.25); add(riser(1.4), 6.0, 0.3)
# 低音持续：D 小调 i–VI–iv–V
PROG = [([38, 45, 50], 0, 9), ([34, 41, 46], 9, 19), ([31, 38, 43], 19, 27), ([33, 40, 45], 27, 35), ([38, 45, 50], 35, 41), ([34, 41, 46], 41, 51), ([31, 38, 43], 51, 56), ([38, 45, 50], 56, 60)]
for ms, a, b in PROG: add(drone(ms, b - a + 1.2, 0.5, 600 if a < 42 else 900), max(0, a - 0.3))
# 每个剪辑点一记太鼓（大）＋ 6.5 后进入律动（92 BPM 八分）
for c in CUTS: add(taiko(g=1.0), c, 0.9); add(sub(1.5), c, 0.35)
BEAT = 60 / 92
t = 9.0; i = 0
while t < 55.5:
    if i % 4 == 0: add(taiko(0.9, 120, 60), t, 0.45, -0.3)
    if i % 4 == 2: add(taiko(0.6, 220, 90), t, 0.3, 0.35)
    if i % 2 == 1 and t > 19.6: add(taiko(0.25, 600, 300) * 0.5, t, 0.15, 0.5)
    t += BEAT; i += 1
# 旋律：D 小调五声拨弦，12 秒后每两拍一音
SCALE = [62, 65, 67, 69, 72, 74]
MEL = [0, 2, 3, 2, 4, 3, 2, 0, 1, 2, 3, 5, 4, 3, 2, 1]
t = 19.6; j = 0
while t < 55.5:
    add(pluck(hz(SCALE[MEL[j % len(MEL)]])), t, 0.22, 0.25); t += BEAT * 2; j += 1
# 50–57 水银：高音钟慢敲
for k in range(5): add(bell(hz(74 + (k % 2) * 5), 3), 35.2 + k * 0.8, 0.2, 0.4 - 0.2 * k)
# 结尾：鼓停，一记钟收在问题上
add(riser(1.4), 54.6, 0.3); add(bell(hz(50), 5), 56.0, 0.6); add(bell(hz(62), 4), 56.0, 0.35, 0.3)
mix = np.stack([L, R], 1); fade = int(1.0 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix = mix / np.max(np.abs(mix)) * 0.79   # 留到 -2 dBFS，AAC 编码后不过 -1 dBTP（审片：峰值 0 dBFS）
sf.write(Path(__file__).with_name('配乐.wav'), mix, SR)
print('ok', mix.shape)
