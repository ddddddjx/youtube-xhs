#!/usr/bin/env python3
"""Roadster 片的声音：代码合成的科技新闻配乐 + 按画面事件逐个设计的音效 → 混音、-14 LUFS、和画面合成。

uv run --with numpy --with scipy python -I sound_design.py --video 画面.mp4 --out 成片.mp4 [--no-music 无配乐版.mp4]

配乐 120 BPM、F 小调（Fm – D♭ – A♭ – E♭），段落跟着片子走：
  0–3    钩子：开场重击 + 十六分音符贝斯脉冲
  3–17.5 证据段：底鼓四拍 + 反拍贝斯 + 拨弦琶音 + 侧链铺底
  17.5–18 升调 + 反向镲 → 18 进黑底推导：鼓退场，只留铺底、钟摆滴答、慢琶音
  29–32.85 堆张力：军鼓滚奏 + 升调；32.85 重击后 1 秒近乎静音
  34–40.4 回到纸桌面：全编制回归，加主旋律
  40.4–42 收尾：铺底 + 长尾
音效按 timeline 写在 EVENTS 里，每一类事件一种声音，不用同一个声音应付所有切换。
"""
import argparse, subprocess, tempfile, os, wave
import numpy as np
from scipy import signal

SR = 48000
ap = argparse.ArgumentParser()
ap.add_argument('--video', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--no-music', help='另出一版只有音效的成片（在小红书 App 里自己配平台曲库音乐用）')
ap.add_argument('--seed', type=int, default=17)
a = ap.parse_args()

DUR = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video],
                           capture_output=True, text=True).stdout)
N = int((DUR + 2) * SR)
R = np.random.default_rng(a.seed)
BPM = 120; BEAT = 60 / BPM; BAR = BEAT * 4


# ───────── 基础件 ─────────
def tt(d): return np.arange(int(d * SR)) / SR
def hz(n): return 440 * 2 ** ((n - 69) / 12)                 # MIDI 音高
def env(n, a_=0.005, d=0.1, s=0.0, r=0.05, hold=0.0):
    e = np.zeros(n); i = 0
    for seg, v0, v1 in ((a_, 0, 1), (d, 1, s), (hold, s, s), (r, s, 0)):
        k = min(n - i, int(seg * SR))
        if k > 0: e[i:i + k] = np.linspace(v0, v1, k, endpoint=False); i += k
    return e
def expdec(n, tau): return np.exp(-np.arange(n) / SR / tau)
def lp(x, f, o=2): b, a_ = signal.butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low'); return signal.lfilter(b, a_, x)
def hp(x, f, o=2): b, a_ = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a_, x)
def bp(x, f1, f2, o=2): b, a_ = signal.butter(o, [f1 / (SR / 2), f2 / (SR / 2)], 'band'); return signal.lfilter(b, a_, x)
def noise(d): return R.standard_normal(int(d * SR))
def saw(f, d, detune=0.0):
    t = tt(d); ph = (f * (1 + detune)) * t; return 2 * (ph - np.floor(ph + 0.5))
def supersaw(f, d, n=5, spread=0.012):
    return sum(saw(f, d, (i - n // 2) * spread / n) for i in range(n)) / n
_IR = None
def reverb(x, wet=0.3, length=1.8):
    global _IR
    if _IR is None:
        n = int(length * SR); ir = R.standard_normal(n) * expdec(n, length / 5); ir = lp(ir, 6000); ir /= np.abs(ir).sum() ** 0.5 * 6
        _IR = ir
    y = signal.fftconvolve(x, _IR)[:len(x) + len(_IR)]
    out = np.zeros(len(y)); out[:len(x)] += x * (1 - wet); out += y * wet; return out
def put(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf): return
    x = x[:len(buf) - i]; buf[i:i + len(x)] += x * g


# ───────── 鼓和乐器 ─────────
def kick(d=0.45):
    t = tt(d); f = 45 + 110 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * expdec(len(t), 0.16) + lp(noise(d), 3000) * expdec(len(t), 0.006) * 0.4
def clap(d=0.3):
    n = noise(d); e = np.zeros(len(n))
    for k in (0, 0.011, 0.022): e += np.roll(expdec(len(n), 0.008), int(k * SR))
    e += expdec(len(n), 0.09) * 0.5; return bp(n, 900, 5000) * e * 0.7
def hat(d=0.06, open_=False): n = noise(0.35 if open_ else d); return lp(hp(n, 7000), 13000) * expdec(len(n), 0.045 if open_ else 0.014) * 0.35
def snare(d=0.25):
    t = tt(d); return (np.sin(2 * np.pi * 190 * t) * expdec(len(t), 0.05) * 0.5 + bp(noise(d), 1500, 7000) * expdec(len(t), 0.07)) * 0.6
def bass_note(n, d, cut=900):
    t = tt(d); x = saw(hz(n), d) * 0.6 + np.sin(2 * np.pi * hz(n - 12) * t) * 0.6
    e = env(len(t), 0.004, d * 0.6, 0.5, 0.03); return lp(x, cut) * e
def pluck(n, d=0.35, bright=4000):
    t = tt(d); x = supersaw(hz(n), d, 3, 0.008); f = lp(x, bright) * expdec(len(t), 0.12); return f * env(len(t), 0.002, 0, 1, 0.02, d)
def pad(notes, d):
    x = sum(supersaw(hz(n), d, 5, 0.018) for n in notes) / len(notes)
    x = lp(x, 1800); return x * env(len(x), 0.6, 0.0, 1.0, 0.8, d - 1.4)
def lead(n, d):
    t = tt(d); vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(hz(n) * vib) / SR; x = (2 * (ph / (2 * np.pi) % 1) - 1) * 0.5 + np.sin(ph) * 0.5
    return lp(x, 3500) * env(len(t), 0.02, 0.2, 0.7, 0.15)

# 和弦：Fm  D♭  A♭  E♭（MIDI 根音 F2=41, Db2=37, Ab2=44, Eb2=39）
PROG = [(41, [65, 68, 72, 75]), (37, [61, 65, 68, 72]), (44, [63, 68, 72, 75]), (39, [63, 67, 70, 74])]
def chord_at(t): return PROG[int(t // BAR) % 4]


# ───────── 配乐 ─────────
def music():
    m = np.zeros(N); drums = np.zeros(N); sc = np.ones(N)    # sc：侧链包络
    def section(t0, t1, kick_on=True, bass='off', hats=True, arp='16', padv=0.22, leadv=0.0, clap_on=True):
        nb = int(round((t1 - t0) / BEAT))
        for b in range(nb):
            tb = t0 + b * BEAT
            root, ch = chord_at(tb)
            if kick_on:
                put(drums, kick(), tb, 0.9)
                i = int(tb * SR); k = min(N - i, int(0.32 * SR))
                if k > 0: sc[i:i + k] = np.minimum(sc[i:i + k], 0.35 + 0.65 * np.linspace(0, 1, k) ** 0.7)
            if clap_on and b % 2 == 1: put(drums, clap(), tb, 0.55)
            if hats:
                put(drums, hat(open_=True), tb + BEAT / 2, 0.18)
                for s in (0.25, 0.75): put(drums, hat(), tb + BEAT * s, 0.12)
            if bass == '16':
                for s in range(4): put(m, bass_note(root + (12 if s == 2 else 0), BEAT / 4 * 0.9, 700), tb + s * BEAT / 4, 0.5)
            elif bass == 'off':
                put(m, bass_note(root, BEAT * 0.45, 1100), tb + BEAT / 2, 0.55)
            if arp:
                step = BEAT / (4 if arp == '16' else 2)
                for s in range(int(round(BEAT / step))):
                    idx = (b * int(round(BEAT / step)) + s) % 8; n = ch[[0, 1, 2, 3, 2, 1, 3, 2][idx]] + 12
                    put(m, pluck(n, step * 1.6, 3200 if arp == '16' else 2200), tb + s * step, 0.14 if arp == '16' else 0.12)
        # 铺底按小节
        tb = t0 - (t0 % BAR)
        while tb < t1:
            root, ch = chord_at(tb + 0.01); s0 = max(t0, tb); d = min(t1, tb + BAR) - s0 + 0.6
            if padv: put(m, pad(ch, d), s0, padv)
            tb += BAR
        if leadv:
            mel = [77, 75, 72, 75, 80, 79, 77, 75, 72, 70, 72, 75]
            for i, n in enumerate(mel):
                tn = t0 + i * BEAT
                if tn < t1 - 0.2: put(m, lead(n, BEAT * 0.95), tn, leadv)
    # 段落按成片时间（edit.json 插进现场视频后，全片 47.6 秒）
    section(0.0, 3.0, kick_on=False, bass='16', hats=False, arp='16', padv=0.18, clap_on=False)
    section(3.0, 18.5, bass='off', arp='16', padv=0.2)
    section(19.0, 32.0, kick_on=False, bass=None, hats=False, arp='8', padv=0.26, clap_on=False)
    section(32.0, 35.95, kick_on=True, bass='16', hats=False, arp='16', padv=0.24, clap_on=False)
    section(37.0, 43.5, bass='off', arp='16', padv=0.22, leadv=0.16)
    section(43.5, 47.6, kick_on=False, bass=None, hats=False, arp=None, padv=0.3, clap_on=False)
    # 黑底段的钟摆滴答（算账的感觉）
    for b in range(int((32 - 19) / BEAT)):
        tb = 19 + b * BEAT; put(drums, hp(noise(0.03), 4000) * expdec(int(0.03 * SR), 0.006), tb, 0.35)
    # 低频长音：黑底段打底
    t = tt(13.5); put(m, np.sin(2 * np.pi * hz(29) * t) * env(len(t), 1.0, 0, 1, 1.5, 11) * 0.35, 18.9)
    # 军鼓滚奏 29–32.85，越来越密
    tb = 32.0
    while tb < 35.9:
        k = (tb - 32) / 3.95; put(drums, snare(), tb, 0.25 + 0.4 * k); tb += BEAT / (2 if k < 0.4 else 4 if k < 0.75 else 8)
    m = m * sc; mix = m + drums
    # 32.85–34：重击后几乎静音
    i0, i1 = int(36.05 * SR), int(37.1 * SR); mix[i0:i1] *= np.linspace(1, 0.03, i1 - i0) ** 0.3 * 0 + 0.03
    i2 = int(46.6 * SR); mix[i2:] *= np.linspace(1, 0, N - i2) ** 1.5
    return reverb(mix, 0.18, 1.6)[:N]


# ───────── 音效（每类事件一种声音） ─────────
def impact(big=1.0):         # 电影感重击：次低频下坠 + 破裂噪声 + 长尾
    t = tt(2.2); f = 30 + 70 * np.exp(-t * 6); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * expdec(len(t), 0.7)
    crack = lp(noise(2.2), 5000) * expdec(len(t), 0.05)
    return reverb((sub * 0.9 + crack * 0.6) * big, 0.35, 2.0)[:len(t)]
def riser(d=1.5):            # 升调噪声 + 上滑正弦
    t = tt(d); k = t / d; x = np.zeros(len(t))
    for i in range(0, len(t), 2400):
        seg = noise(0.05)[:min(2400, len(t) - i)]; fc = 400 + 7000 * k[i] ** 2
        x[i:i + len(seg)] = bp(seg, fc * 0.7, min(fc * 1.3, 20000))
    sw = np.sin(2 * np.pi * np.cumsum(200 + 1600 * k ** 2) / SR) * 0.25
    return (x * 0.5 + sw) * k ** 2
def reverse_cymbal(d=1.2): n = hp(noise(d), 3000) * expdec(int(d * SR), 0.35); return n[::-1] * 0.6
def whoosh(d=0.5, f0=300, f1=2400, pan_up=True):   # 镜头移动：带通扫频噪声
    t = tt(d); k = t / d; x = noise(d); out = np.zeros(len(t))
    for i in range(0, len(t), 1200):
        seg = x[i:i + 1200]; fc = f0 + (f1 - f0) * (k[i] if pan_up else 1 - k[i]); out[i:i + len(seg)] = bp(seg, fc * 0.6, fc * 1.6)
    return out * np.sin(np.pi * k) ** 1.5 * 0.9
def zip_(d=0.22): return whoosh(d, 800, 6000) * 0.8          # 快推：短、高
def photo_drop():            # 冲印照片落桌：低闷 thud + 纸声
    t = tt(0.35); thud = np.sin(2 * np.pi * 95 * t) * expdec(len(t), 0.04) * 0.8
    paper = bp(noise(0.35), 1500, 6000) * expdec(len(t), 0.05) * 0.5; return thud + paper
def paper_slide(d=0.6): x = bp(noise(d), 2000, 9000); k = tt(d) / d; return x * np.sin(np.pi * k) ** 0.8 * 0.35
def marker(d=0.5, seed=0):   # 红笔划纸：颗粒噪声，笔触起伏
    r = np.random.default_rng(seed); t = tt(d); x = bp(r.standard_normal(len(t)), 2500, 8000)
    strokes = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * (5 + r.random() * 3) * t)); return x * strokes * env(len(t), 0.02, 0, 1, 0.06, d - 0.08) * 0.32
def stamp():                 # 印章 / 标签砸下：木质 knock + 低频
    t = tt(0.3); k = np.sin(2 * np.pi * 180 * t) * expdec(len(t), 0.03) + np.sin(2 * np.pi * 70 * t) * expdec(len(t), 0.07) * 0.8
    return (k + bp(noise(0.3), 800, 3000) * expdec(len(t), 0.015) * 0.6) * 0.9
def type_click(): t = tt(0.04); return (bp(noise(0.04), 2000, 6000) * expdec(len(t), 0.004) + np.sin(2 * np.pi * 1800 * t) * expdec(len(t), 0.003) * 0.3) * 0.45
def pin(): t = tt(0.12); return np.sin(2 * np.pi * 2400 * t) * expdec(len(t), 0.02) * 0.25 + hp(noise(0.12), 5000) * expdec(len(t), 0.004) * 0.3
def gas_hiss(d=1.0, falling=False):   # 高压气体泄压嘶声（冷气推进器）
    t = tt(d); k = t / d; x = hp(noise(d), 2500); x = bp(x, 2500, 12000)
    e = np.minimum(1, k * 8) * (1 - k) ** (2.5 if falling else 0.6)
    if falling: x = lp(x, 9000) * (1 - 0.6 * k)
    return x * e * 0.45
def blip(n=84, d=0.09): t = tt(d); return np.sin(2 * np.pi * hz(n) * t) * expdec(len(t), 0.03) * 0.3
def data_beep(): return np.concatenate([blip(88, 0.06), blip(93, 0.08)])       # UI 数据提示
def bell(n=84, d=1.6):       # FM 钟声：公式出现
    t = tt(d); f = hz(n); mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * expdec(len(t), 0.4)
    return np.sin(2 * np.pi * f * t + mod) * expdec(len(t), 0.5) * 0.3
def draw_tone(d=0.9):        # 白线描出：柔和上滑
    t = tt(d); k = t / d; return np.sin(2 * np.pi * np.cumsum(330 + 330 * k) / SR) * np.sin(np.pi * k) * 0.12
def drop_thud():             # 重力箭头砸下：下坠音 + 低频
    t = tt(0.6); f = 220 * np.exp(-t * 5) + 40; return np.sin(2 * np.pi * np.cumsum(f) / SR) * expdec(len(t), 0.25) * 0.8
def glitch(d=0.35):          # 切进黑底：数字故障
    t = tt(d); x = np.sign(np.sin(2 * np.pi * 110 * t * (1 + 4 * (R.random(len(t)) > 0.97)))) * 0.2
    gate = (np.floor(t * 40) % 3 != 0); return lp(x * gate, 4000) * expdec(len(t), 0.15) + hp(noise(d), 3000) * expdec(len(t), 0.03) * 0.3
def pop(n=79): t = tt(0.08); return np.sin(2 * np.pi * np.cumsum(hz(n) * (1 + 0.5 * np.exp(-t * 60))) / SR) * expdec(len(t), 0.02) * 0.35
def end_chime(): return reverb(bell(89, 2.5) + bell(84, 2.5) * 0.6, 0.4, 2.2)[:int(2.5 * SR)]


EVENTS = [
    # 镜 1 钩子
    (0.0, impact(1.0), 0.9), (0.0, gas_hiss(1.4), 0.55), (0.3, zip_(), 0.6), (0.6, marker(0.35, 1), 0.9), (1.25, marker(0.5, 2), 0.9),
    *[(1.9 + i / 16, type_click(), 0.9) for i in range(10)],
    (2.3, riser(0.7), 0.35),
    # 镜 2 纸桌面
    (3.0, photo_drop(), 1.0), (3.4, marker(1.2, 3), 0.8), (4.25, whoosh(0.3, 500, 2500), 0.5), (4.9, stamp(), 0.9), (5.2, zip_(), 0.45),
    # 镜 3
    (6.0, pin(), 1), (6.5, whoosh(0.6, 250, 1800), 0.6), (7.9, zip_(), 0.6), (8.35, marker(0.55, 4), 0.9), *[(9.0 + i / 16, type_click(), 0.9) for i in range(6)],
    # 镜 4
    (9.5, pin(), 1), (10.0, whoosh(0.6, 250, 1800, False), 0.6), (11.2, marker(0.7, 5), 0.85), (11.6, whoosh(0.3, 600, 3000), 0.45),
    (12.0, marker(0.5, 6), 0.85), *[(12.6 + i / 16, type_click(), 0.9) for i in range(11)],
    # 镜 5
    (14.15, paper_slide(0.6), 1.0), (14.72, photo_drop(), 0.8), (15.0, pin(), 1), (15.25, zip_(), 0.5), (15.4, marker(0.5, 7), 0.85), (16.0, stamp(), 1.0),
    # 过门 → 黑底
    (16.8, reverse_cymbal(1.2), 0.7), (16.5, riser(1.5), 0.35), (18.0, glitch(), 0.7), (18.0, impact(0.55), 0.6),
    # 镜 6
    (18.0, draw_tone(0.9), 1.0), (19.1, gas_hiss(1.6), 0.8), *[(19.6 + i * 0.12, blip(76 + i * 3, 0.12), 0.9) for i in range(4)], (20.5, zip_(), 0.45),
    # 镜 7
    (22.2, whoosh(0.8, 300, 3500), 0.5), (22.85, bell(84), 1.0), *[(23.18 + i * 0.18, pop(84 + i * 2), 0.6) for i in range(4)], (24.6, zip_(), 0.45),
    # 镜 8
    (26.3, drop_thud(), 1.0), (27.0, type_click(), 1.4), (27.3, data_beep(), 1.0), (28.05, zip_(), 0.4), (28.1, data_beep(), 1.0),
    # 镜 9
    (30.25, whoosh(0.3, 400, 1600), 0.5), (30.6, gas_hiss(0.9), 0.5), (31.9, gas_hiss(0.8, True), 0.8), (32.85, impact(0.9), 1.0),
    # 镜 10 回到纸桌面
    (34.0, impact(0.7), 0.8), (34.0, photo_drop(), 0.7), (34.55, zip_(), 0.5),
    *[(34.7 + i * 0.25, marker(0.5, 8 + i), 0.75) for i in range(3)], *[(35.9 + i * 0.18, pop(72 + i * 3), 0.9) for i in range(4)],
    (36.0, marker(0.4, 12), 0.6), (36.6, whoosh(0.3, 500, 2600), 0.45), (37.0, stamp(), 1.0),
    # 镜 11 拉远 + 年份卡
    (38.0, whoosh(0.9, 2400, 300, True), 0.6), (38.3, marker(0.7, 13), 0.6), (39.3, impact(0.8), 0.9), (39.3, stamp(), 0.8), (40.4, zip_(), 0.4),
    (40.5, end_chime(), 0.7),
]
import json
EDIT = json.load(open(os.path.join(os.path.dirname(os.path.abspath(a.video)), 'edit.json'), encoding='utf-8'))
def cv(tc):
    """原动画时间 → 成片时间；落在被视频段替换掉的动画时间里返回 None。"""
    for sg in EDIT['segments']:
        if 'canvas' in sg and sg['canvas'] <= tc < sg['canvas'] + (sg['o1'] - sg['o0']):
            return sg['o0'] + tc - sg['canvas']
    return None
CLIP_EVENTS = [
    # 钩子 v1：开场重击 + 喷嘴嘶声 + 红笔 + 打字
    (0.0, impact(1.0), 0.9), (0.0, gas_hiss(2.0), 0.5), (0.4, marker(0.35, 1), 0.9), *[(1.6 + i / 16, type_click(), 0.9) for i in range(10)],
    (2.6, riser(0.6), 0.35),
    # v4 俯拍爬坡 → v3 飞过一排车
    (3.2, whoosh(0.4, 2400, 400), 0.6), (3.45, stamp(), 0.9), (5.0, whoosh(0.35, 400, 3000), 0.6), (5.25, stamp(), 0.9), (6.1, gas_hiss(1.0), 0.5), (6.6, impact(0.5), 0.6),
    # 回到纸桌面
    (7.4, photo_drop(), 0.9),
    # v2 喷嘴往下喷
    (18.9, glitch(), 0.5), (18.9, gas_hiss(2.0), 0.85), (19.15, stamp(), 0.8),
    # v5 后喷嘴起步
    (41.1, impact(0.8), 0.8), (41.15, gas_hiss(2.2), 0.9), (41.1, whoosh(0.8, 300, 4000), 0.5),
]
def clip_audio():
    """现场原声：只当底噪（里面可能有人声和人群声），每段 0.08 秒淡入淡出。"""
    out = np.zeros(N)
    for sg in EDIT['segments']:
        if 'clip' not in sg: continue
        d = sg['o1'] - sg['o0']
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(sg['src']), '-t', str(d), '-i',
                              os.path.join(os.path.dirname(os.path.abspath(a.video)), 'footage', sg['clip'] + '.mp4'),
                              '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, '<i2').astype(float) / 32768
        f = int(0.08 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
        put(out, x, sg['o0'])
    return out
def sfx_track():
    s = np.zeros(N)
    for at, x, gain in EVENTS:
        o = cv(at)
        if o is not None: put(s, x, o, gain)
    for at, x, gain in CLIP_EVENTS: put(s, x, at, gain)
    return s


def write_wav(path, x):
    x = np.clip(x, -1, 1); st = np.stack([x, x], 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
def mux(audio, out):
    with tempfile.TemporaryDirectory() as d:
        wp = os.path.join(d, 'a.wav'); write_wav(wp, audio[:int(DUR * SR)])
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', a.video, '-i', wp, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                        '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', out], check=True)
    print('成片 →', out)

sfx = sfx_track()
mus = music()
live = clip_audio()
mix = mus / (np.abs(mus).max() + 1e-9) * 0.42 + sfx / (np.abs(sfx).max() + 1e-9) * 0.75 + live * 0.3
mux(mix / np.abs(mix).max() * 0.9, a.out)
if a.no_music:
    nm = sfx / np.abs(sfx).max() * 0.75 + live * 0.3
    mux(nm / np.abs(nm).max() * 0.9, a.no_music)
