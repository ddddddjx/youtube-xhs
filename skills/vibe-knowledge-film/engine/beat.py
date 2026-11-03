# -*- coding: utf-8 -*-
"""分析用户发来的配乐：BPM、第一拍、小节线、乐句，再按片长截一段完整的乐句（Krypto说AI 11-03 加）。

  python beat.py <曲子.mp3> <目标片长秒> [--hit 秒] [--phrase 小节数] [--out 工程/audio/beat.json]

输出（同时写进 --out 的 json）：
  bpm / beat（一拍几秒）/ bar（一小节几秒，按 4/4）/ first（第一个强拍在原曲的第几秒）
  dur     建议片长：取整到小节，离目标最近（片子按这个长度做，切点才能都落在小节线上）
  start   从原曲第几秒开始截：一定是某个乐句的开头（默认 8 小节一句）
  bars    截出来那段里，每条小节线在成片里的时刻 —— 分镜表的切点、字幕进场对齐这些数
  entries 截出来那段里，配乐明显变强（新的一段进来）的时刻 —— 最大的揭晓对到其中一个
--hit 12.5：希望成片第 12.5 秒正好是配乐"进来"的那一拍，就按这个挑起点。
截出来的那段交给 audio.py：python audio.py <工程> --bgm 曲子.mp3 -8 --from <start>（结尾自动淡出 2.5 秒，不拦腰截断）。
只依赖 numpy / scipy 和 ffmpeg。
"""
import json, subprocess, sys
import numpy as np
from scipy.signal import stft

SR = 22050

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def onset_env(x):
    hop = 512; f, t, Z = stft(x, SR, nperseg=2048, noverlap=2048 - hop, boundary=None)
    mag = np.log1p(100 * np.abs(Z)); flux = np.maximum(0, np.diff(mag, axis=1)).sum(0)
    low = np.maximum(0, np.diff(mag[f < 200], axis=1)).sum(0)      # 低频的冲击（底鼓）单独留一份，找强拍用
    fps = SR / hop; norm = lambda v: (v - v.mean()) / (v.std() + 1e-9)
    return norm(flux), norm(low), fps

def tempo(env, fps, lo=70, hi=180):
    ac = np.correlate(env, env, "full")[len(env) - 1:]; best, bpm = -1e9, 120.0
    for b in np.arange(lo, hi, .1):
        lag = 60 / b * fps; i = int(round(lag)); score = ac[i] + .5 * ac[int(round(2 * lag))] + .25 * ac[int(round(lag / 2))]
        score *= np.exp(-.5 * (np.log2(b / 120)) ** 2 / .9 ** 2)       # 偏好 120 附近，避免半速 / 倍速
        if score > best: best, bpm = score, b
    return round(bpm, 2)

def phase(env, low, fps, beat):
    n = len(env); best, off = -1e9, 0.0
    for o in np.arange(0, beat, .005):
        idx = (np.arange(o, n / fps, beat) * fps).astype(int); idx = idx[idx < n]
        s = env[idx].sum()
        if s > best: best, off = s, o
    bar_s = [low[(np.arange(off + k * beat, n / fps, 4 * beat) * fps).astype(int).clip(0, n - 1)].sum() for k in range(4)]
    return off + int(np.argmax(bar_s)) * beat                       # 四个相位里低频冲击最强的那个当强拍

def main(a):
    path, target = a[0], float(a[1])
    hit = float(a[a.index("--hit") + 1]) if "--hit" in a else None
    phrase = int(a[a.index("--phrase") + 1]) if "--phrase" in a else 8
    out = a[a.index("--out") + 1] if "--out" in a else None
    x = load(path); song = len(x) / SR
    env, low, fps = onset_env(x); bpm = tempo(env, fps); beat = 60 / bpm; bar = 4 * beat
    first = (phase(env, low, fps, beat) + 1536 / SR) % bar           # 差分后第 i 帧的中心在 (1024 + 512(i+1)) / SR 秒：补回这 70 毫秒
    nbar = max(1, round(target / bar)); dur = round(nbar * bar, 3)
    rms = np.array([np.sqrt(np.mean(x[int((first + k * bar) * SR):int((first + (k + 1) * bar) * SR)] ** 2) + 1e-12) for k in range(int((song - first) / bar))])
    db = 20 * np.log10(rms + 1e-9); entries_all = [k for k in range(1, len(db)) if db[k] - db[max(0, k - 2):k].mean() > 2.0]
    starts = [first + k * phrase * bar for k in range(int((song - first) / (phrase * bar)) + 1) if first + k * phrase * bar + dur <= song + .01]
    if not starts:   # 曲子比片子短：从第一拍起，audio.py 会循环垫满
        starts = [first]
    if hit is not None and entries_all:
        cand = [first + k * bar - round(hit / bar) * bar for k in entries_all]
        cand = [c for c in cand if c >= first - .01 and c + dur <= song + .01]
        start = min(cand, key=lambda c: abs(((c - first) / bar) % phrase)) if cand else starts[0]
    else:
        start = starts[0]
    bars = [round(k * bar, 3) for k in range(nbar + 1)]
    entries = [float(round(first + k * bar - start, 3)) for k in entries_all if 0 < first + k * bar - start < dur]
    res = dict(file=path, song=round(song, 2), bpm=bpm, beat=round(beat, 4), bar=round(bar, 4), first=round(first, 3),
               phrase_bars=phrase, target=target, dur=dur, start=round(start, 3), bars=bars, entries=entries)
    if out: json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"BPM {bpm}  一拍 {beat:.3f}s  一小节 {bar:.3f}s  第一个强拍 {first:.2f}s  原曲 {song:.1f}s")
    print(f"建议片长 {dur}s（{nbar} 小节）  从原曲 {start:.2f}s 截起（乐句开头）")
    print("成片里配乐变强的时刻：", entries or "无明显变化")
    return res

if __name__ == "__main__":
    if len(sys.argv) < 3: sys.exit(__doc__)
    main(sys.argv[1:])
