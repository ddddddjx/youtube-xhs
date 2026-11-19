# -*- coding: utf-8 -*-
"""《一死酬知己》声音：对白 / 环境 / 拟音 / 配乐四条分轨 + 混音母版。全部是这里算出来的，没有用任何素材库和现成曲子。
  python sound.py 05 09            # 做镜 05–09 这一段 → out/05-09_{vo,amb,fx,mus,mix}.wav
  python sound.py 05 09 <画面.mp4> # 再把混音合进画面 → out/05-09.mp4
口径按《分镜脚本》§十二：人声在最前，环境垫底不抢中频，音乐只在没人说话的地方抬起来（有人声自动压）；
技能音「短、窄、亮」，少年期留一点没长成的毛边；成片 −14 LUFS、峰值不过 −1 dBTP。
调性 D 小调五声（D F G A C），80 BPM（一拍 0.75 秒）。
每一镜的声音事件写在 CUES 里，时间是「镜内秒」，镜头时长改了不用重排。"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000; HERE = Path(__file__).resolve().parent; OUT = HERE / 'out'; OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(20261119)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def tt(d): return np.arange(int(d * SR)) / SR
def hz(semi, base=146.83): return base * 2 ** (semi / 12)                 # 0 = D3
def env(d, a=0.01, r=0.2): t = tt(d); return np.minimum(1, t / a) * np.minimum(1, (d - t) / r).clip(0)

class Bus:
    def __init__(self, dur): self.n = int(dur * SR) + SR; self.b = np.zeros((self.n, 2))
    def add(self, x, t, g=1.0, pan=0.0):
        i = int(t * SR)
        if i >= self.n or i + len(x) <= 0: return
        if i < 0: x = x[-i:]; i = 0
        x = x[: self.n - i]; l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        if x.ndim == 1: self.b[i:i + len(x), 0] += x * g * l * 1.414; self.b[i:i + len(x), 1] += x * g * r * 1.414
        else: self.b[i:i + len(x)] += x * g

def reverb(b, sec=1.8, wet=0.2, bright=5000):
    n = int(sec * SR); ir = lp(rng.standard_normal((n, 2)) * np.exp(-6.9 * np.arange(n) / n)[:, None], bright); ir /= np.sqrt((ir ** 2).sum(0)).max()
    return b + np.stack([fftconvolve(b[:, c], ir[:, c])[: len(b)] for c in (0, 1)], 1) * wet

# ---------- 乐器 ----------
def taiko(vel=1.0, pitch=62):                               # 太鼓：音高下坠的正弦 + 皮面的一声「啪」
    t = tt(1.1); f = pitch * (1 + 1.3 * np.exp(-t * 22)); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    return (x + lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.018) * 0.5 + lp(rng.standard_normal(len(t)), 300) * np.exp(-t / 0.09) * 0.4) * vel
def framedrum(vel=1.0):                                     # 小手鼓：试探的轻点
    t = tt(0.4); f = 150 * (1 + 0.6 * np.exp(-t * 40)); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07) + bp(rng.standard_normal(len(t)), 900, 3500) * np.exp(-t / 0.02) * 0.35) * vel
def pluck(f, d=2.4, bright=0.5):                            # 筝：Karplus–Strong 拨弦
    n = int(SR / f); buf = rng.uniform(-1, 1, n); buf = lp(buf, 2500 + 6000 * bright); out = np.zeros(int(d * SR))
    for i in range(len(out)): out[i] = buf[i % n]; buf[i % n] = 0.996 * 0.5 * (buf[i % n] + buf[(i + 1) % n])
    return out * np.minimum(1, tt(d) / 0.002)
def strings(semis, d, a=0.8, r=1.2, cut=1400, trem=0.0):    # 弦乐垫：每个音三把略微走调的锯齿，低通；trem > 0 是震音
    t = tt(d); x = np.zeros(len(t))
    for s in semis:
        for det in (-0.07, 0.0, 0.06):
            f = hz(s + det); x += 2 * ((t * f + rng.random()) % 1) - 1
    x = lp(x, cut) / (3 * len(semis)) * env(d, a, r)
    if trem: x *= 0.6 + 0.4 * np.sin(2 * np.pi * trem * t + np.sin(t * 3) * 0.7) ** 2
    return x
def flute(semi, d, vib=5.2):                                # 笛：正弦 + 气声 + 颤音（主题用，这一段还没到）
    t = tt(d); f = hz(semi) * (1 + 0.006 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.4)); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.25 * np.sin(2 * ph) + bp(rng.standard_normal(len(t)), 1800, 6000) * 0.05) * env(d, 0.08, 0.25)

# ---------- 拟音 ----------
def cloth(d=0.35, f0=700, f1=3500):                         # 衣料：一两下带通噪声
    t = tt(d); return bp(rng.standard_normal(len(t)), f0, f1) * (np.sin(np.pi * t / d) ** 2) * (0.6 + 0.4 * np.sin(t * 38) ** 2)
def whoosh(d=0.45, f0=300, f1=3000, q=0.5):                 # 破风：中心频率扫上去的窄带噪声
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); K = 12
    for k in range(K):                                      # 分段滤波再交叠，省得写时变滤波器
        a, b = int(k * len(t) / K), int(min(len(t), (k + 2) * len(t) / K)); fc = f0 * (f1 / f0) ** (k / (K - 1)); seg = bp(n[a:b], fc * (1 - q / 2), fc * (1 + q / 2)); out[a:b] += seg * np.hanning(len(seg))
    return out * (t / d) ** 1.5
def thud(f0=75, f1=38, d=0.7):                              # 闷响：盾砸地
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 14); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2) + lp(rng.standard_normal(len(t)), 260) * np.exp(-t / 0.06) * 0.9
def ding(fs=(1900, 2860, 4120, 5300), d=1.0, crack=0.0):    # 金属的一声「叮」；crack > 0 加一点破音（少年期，没长成）
    t = tt(d); x = sum(np.sin(2 * np.pi * f * (1 + 0.002 * i) * t) * np.exp(-t / (0.32 / (1 + i * 0.6))) / (1 + i) for i, f in enumerate(fs))
    if crack: x = np.tanh(x * (1 + 6 * crack * np.exp(-t / 0.05))) * (1 - 0.3 * crack)
    return x * np.minimum(1, t / 0.001)
def sand(d=0.8, grain=1.0):                                 # 沙：高频的细碎声，一粒一粒
    t = tt(d); return hp(rng.standard_normal(len(t)), 2500) * (rng.random(len(t)) < 0.02 * grain).astype(float).cumsum() % 2 * np.exp(-t / (d * 0.35)) + hp(rng.standard_normal(len(t)), 3500) * np.exp(-t / (d * 0.25)) * 0.5
def hum(d, f=55):                                           # 技能前摇：低频嗡 + 极细的金属颤
    t = tt(d); k = (t / d) ** 2; lo = (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.01 * t)) * k
    hi = sum(np.sin(2 * np.pi * fr * t + i) for i, fr in enumerate((3120, 4710, 6290))) * (0.5 + 0.5 * np.sin(2 * np.pi * 17 * t)) * k * 0.05
    return lo * 0.8 + hi

# ---------- 每一镜的声音事件：(轨, 镜内秒, 做什么) ----------
def cues(sid, add):
    """add(bus, t, x, gain, pan)。bus：'fx' 拟音 / 'mus' 配乐。"""
    if sid == '05':                                          # 蒙恬拱手、直起上身；轻鼓点起
        add('fx', 0.10, cloth(0.4), 0.30, -0.2); add('fx', 0.55, lp(thud(90, 55, 0.25), 400), 0.16, -0.2); add('fx', 0.62, sand(0.3, 0.6), 0.05, -0.2)
        for b, v in ((0.0, 0.5), (1.5, 0.3), (2.25, 0.4)): add('mus', b, framedrum(v), 0.5, 0.15)
        add('mus', 2.55, pluck(hz(19), 2.2, 0.6), 0.22, 0.3); add('mus', 2.72, pluck(hz(24), 2.6, 0.7), 0.2, 0.35)                # 一句话说完，筝应一声：A4 → D5
    if sid == '06':                                          # 嬴政侧头：几乎没有动作，只有风；筝压一个低音
        add('fx', 0.15, cloth(0.3, 1200, 5000), 0.10, 0.3)
        for b, v in ((0.0, 0.35), (1.5, 0.25)): add('mus', b, framedrum(v), 0.42, 0.15)
        add('mus', 1.75, pluck(hz(0), 3.0, 0.2), 0.34, -0.25); add('mus', 2.3, pluck(hz(3), 2.5, 0.25), 0.22, -0.2)             # D3、F3：冷
    if sid == '07':                                          # 戈尖点地
        add('fx', 0.85, lp(thud(120, 70, 0.2), 500), 0.3, 0.25); add('fx', 0.86, ding((2300, 3650), 0.35), 0.035, 0.25); add('fx', 0.88, sand(0.5, 1.0), 0.12, 0.25)
        for b, v in ((0.0, 0.5), (0.75, 0.25), (1.5, 0.4), (2.25, 0.25), (3.0, 0.5), (3.375, 0.3)): add('mus', b, framedrum(v), 0.5, 0.15)
        for i, (b, s) in enumerate(((3.25, 17), (3.5, 19), (3.75, 22))): add('mus', b, pluck(hz(s), 1.6, 0.7), 0.17 + 0.03 * i, 0.3)  # G4 A4 C5 往上，把话头递出去
    if sid == '08':                                          # 撤步沉身，掌心金环：鼓点一记 + 前摇的嗡
        add('fx', 0.03, whoosh(0.4, 500, 2400, 0.9), 0.22, 0.1); add('fx', 0.22, bp(sand(0.3, 1.5), 1800, 6000), 0.10, 0.0)
        add('fx', 0.25, hum(1.75), 0.26, 0.0); add('mus', 0.5, taiko(0.8), 0.6, 0.0)
        add('mus', 0.3, strings((12, 19), 1.7, a=1.4, r=0.05, cut=2600, trem=11), 0.2, 0.0)                                   # 弦乐震音往上顶
    if sid == '09':                                          # 方阵突刺：破风 → 0.5 秒盾砸地
        add('fx', 0.02, whoosh(0.47, 260, 3200, 0.5), 0.5, -0.4); add('fx', 0.5, thud(), 0.95, 0.05); add('fx', 0.5, lp(rng.standard_normal(int(0.9 * SR)), 90) * np.exp(-tt(0.9) / 0.25), 0.8, 0.0)
        add('fx', 0.52, ding(crack=0.5), 0.13, 0.15); add('fx', 0.5, sand(1.1, 2.0), 0.22, 0.1); add('fx', 0.75, sand(0.9, 1.0), 0.1, -0.3)
        add('mus', 0.5, taiko(1.0, 55), 0.95, 0.0); add('mus', 0.5, strings((-12, 0, 7), 2.4, a=0.02, r=1.6, cut=900), 0.5, 0.0)   # 低音一记重的
        for b, v in ((1.25, 0.5), (1.625, 0.55), (2.0, 0.7), (2.25, 0.6), (2.5, 0.75), (2.75, 0.9)): add('mus', b, taiko(v, 66 if v < 0.7 else 58), 0.6, (-0.3 if v < 0.7 else 0.2))   # 战鼓进来，越敲越密

def main(a, b, video=None):
    shots = json.loads((HERE / 'shots.json').read_text(encoding='utf-8'))['shots']; sel = [s for s in shots if int(a) <= int(s['id']) <= int(b)]
    t = 0.0
    for s in sel: s['a'] = t; t += s['dur']
    D = t; vo, amb, fx, mus = Bus(D), Bus(D), Bus(D), Bus(D); bus = {'fx': fx, 'mus': mus}
    # 对白：切点后 0.3 秒起
    vmask = np.zeros(vo.n)
    for s in sel:
        f = HERE / 'vo' / f"{s['id']}.wav"
        if 'text' not in s or not f.exists(): continue
        with wave.open(str(f)) as w: x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
        x = hp(x, 70) / (np.abs(x).max() or 1) * 0.7; i = int((s['a'] + 0.3) * SR); vo.add(x, s['a'] + 0.3, 1.0, 0.0); vmask[i:i + len(x)] = 1
    vo.b = reverb(vo.b, 0.5, 0.05, 3500)                                    # 一点点空间，不然像贴在画面外面
    # 环境（渭水・黄昏）：河水垫底 + 风过芦苇，阵风的起伏左右各走各的
    n = amb.n; tA = np.arange(n) / SR
    for c in (0, 1):
        river = bp(rng.standard_normal(n), 140, 1100) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.17 * tA + c * 1.3)) + bp(rng.standard_normal(n), 900, 2600) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.31 * tA + c * 2.1) ** 2)
        gust = np.clip(0.35 + 0.4 * np.sin(2 * np.pi * 0.11 * tA + c * 0.9) + 0.3 * np.sin(2 * np.pi * 0.27 * tA + 1.7 + c), 0, 1) ** 1.5
        amb.b[:, c] = river * 0.055 + bp(rng.standard_normal(n), 1800, 5200) * gust * 0.05 + bp(rng.standard_normal(n), 300, 700) * gust * 0.03
    for s in sel: cues(s['id'], lambda k, lt, x, g=1.0, pan=0.0, _s=s: bus[k].add(x, _s['a'] + lt, g, pan))
    # 配乐垫底的低弦（从头到尾一口气，跟着段落慢慢抬）
    if any(s['id'] in ('05', '06', '07', '08') for s in sel):
        d0 = sum(s['dur'] for s in sel if s['id'] in ('05', '06', '07', '08')); a0 = min(s['a'] for s in sel if s['id'] in ('05', '06', '07', '08'))
        pad = strings((-12, -5), d0 + 0.6, a=2.5, r=0.6, cut=700); pad *= np.linspace(0.6, 1.0, len(pad)) ** 2; mus.add(pad, a0, 0.5, 0.0)
    fx.b = reverb(fx.b, 1.2, 0.14); mus.b = reverb(mus.b, 2.4, 0.26, 4200)
    # 有人说话，音乐和环境自动让一让（提前 0.15 秒压，说完 0.4 秒回来）
    k = int(0.2 * SR); duck = np.convolve(vmask, np.ones(k) / k, 'same'); duck = np.maximum(duck, np.roll(duck, -int(0.15 * SR))); duck = lp(np.maximum(duck, np.roll(duck, int(0.25 * SR))), 4, 1).clip(0, 1)
    mus.b *= (1 - 0.5 * duck)[:, None]; amb.b *= (1 - 0.3 * duck)[:, None]
    N = int(D * SR); fade = np.minimum(1, np.arange(N) / (0.15 * SR)) * np.minimum(1, (N - np.arange(N)) / (0.35 * SR))
    stems = {'vo': vo.b[:N] * 2.4, 'amb': amb.b[:N] * 2.6, 'fx': fx.b[:N] * 0.9, 'mus': mus.b[:N] * 0.85}   # 人声最前；配乐比人声低约 6 dB，环境低约 12 dB（§12.7）
    mix = sum(stems.values()) * fade[:, None]; tag = f'{a}-{b}'
    def save(name, x):
        p = OUT / f'{tag}_{name}.wav'
        with wave.open(str(p), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
        return p
    pk = max(np.abs(x).max() for x in stems.values()); g = 0.89 / max(pk, np.abs(mix).max())
    for kname, x in stems.items(): save(kname, x * fade[:, None] * g)
    raw = save('mix_raw', mix * g); final = OUT / f'{tag}_mix.wav'
    # 响度到 −14 LUFS，再限峰到 −1 dBTP
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89:level=false', '-ar', '48000', str(final)], check=True); raw.unlink()
    print('分轨和混音 →', OUT, f'（{D:.1f} 秒）')
    for kname, x in stems.items(): print(f'  {kname}: 峰值 {20 * np.log10(np.abs(x).max() * g + 1e-9):.1f} dBFS  均方 {20 * np.log10(np.sqrt((x ** 2).mean()) * g + 1e-9):.1f} dB')
    if video:
        out = OUT / f'{tag}.mp4'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', str(final), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', str(out)], check=True); print('成片 →', out)

if __name__ == '__main__':
    if len(sys.argv) < 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
