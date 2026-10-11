#!/usr/bin/env python3
"""声音：代码合成的氛围配乐 + 状态音效 +（可选）旁白 → 混好、响度拉到 -14 LUFS，和画面合成成片。

  python3 sound.py <工程目录> --video 画面.mp4 --out 成片.mp4 [--narration 旁白.wav] [--music 自带音乐.mp3]

配乐默认代码合成（无版权问题，两个平台都能发）：Am–F–C–G 慢和弦铺底 + 低频长音，跟着拍子的 music 字段变：
  "music": "low"   只有长音和很轻的铺底（冷开场默认）
  "music": "swell" 主旋律进来（片名卡、情绪高点）
  "music": "solo"  收成单音（落到一个人、结尾问题）
  "music": "drop"  0.4 秒静音后重进（转折）
音效写在拍子里："sfx": [{"at": 0.15, "name": "click"}]，at 是相对这一拍开始的秒数。
  click 开关 ｜ on 光亮起的嗡 ｜ ding 标签出现 ｜ whoosh 镜头穿越 ｜ boom 片名 / 揭晓 ｜ tick 清单一条 ｜ pulse 电流
"""
import argparse, json, os, subprocess, sys, tempfile, wave
import numpy as np

SR = 48000
ap = argparse.ArgumentParser()
ap.add_argument('proj'); ap.add_argument('--video', required=True); ap.add_argument('--out', required=True)
ap.add_argument('--narration'); ap.add_argument('--music'); ap.add_argument('--music-db', type=float, default=None)
ap.add_argument('--seed', type=int, default=3)
a = ap.parse_args()
tl = json.load(open(os.path.join(a.proj, 'timeline.json'), encoding='utf-8'))
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video], capture_output=True, text=True).stdout)
N = int(dur * SR) + SR
t = np.arange(N) / SR
R = np.random.default_rng(a.seed)


def env_adsr(n, a_=.01, r=.2):
    e = np.ones(n); ai = max(1, int(a_ * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e


def hz(note):  # 'A3'
    names = {'C': -9, 'D': -7, 'E': -5, 'F': -4, 'G': -2, 'A': 0, 'B': 2}
    return 440 * 2 ** ((names[note[0]] + 12 * (int(note[-1]) - 4)) / 12)


# ---------------- 配乐 ----------------
def synth_music():
    # 每拍的配乐强度：0 静、1 low、2 正常、3 swell、solo 单音
    level = np.full(N, 1.0); solo = np.zeros(N)
    mode = 'low'
    for b in tl['beats']:
        mode = b.get('music', mode if mode != 'drop' else 'normal')
        s, e = int(b['start'] * SR), int(min(dur, b['end'] + .25) * SR)
        val = {'low': 1.0, 'normal': 2.0, 'swell': 3.0, 'solo': .6, 'drop': 2.0}.get(mode, 2.0)
        level[s:] = val
        solo[s:] = 1.0 if mode == 'solo' else 0.0
        if mode == 'drop':
            level[s:s + int(.4 * SR)] = 0.0
    # 平滑 0.8 秒
    k = int(.8 * SR); ker = np.ones(k) / k
    level = np.convolve(level, ker, mode='same'); solo = np.convolve(solo, ker, mode='same')
    chords = [['A2', 'E3', 'A3', 'C4', 'E4'], ['F2', 'C3', 'F3', 'A3', 'C4'], ['C3', 'G3', 'C4', 'E4', 'G4'], ['G2', 'D3', 'G3', 'B3', 'D4']]
    bar = 4.0
    pad = np.zeros(N)
    for i in range(int(dur / bar) + 2):
        notes = chords[i % 4]; s = int(i * bar * SR); n = int((bar + 1.5) * SR)
        if s >= N: break
        n = min(n, N - s); tt = np.arange(n) / SR
        e = np.minimum(1, tt / 1.2) * np.minimum(1, (bar + 1.5 - tt) / 1.5)
        for j, nt in enumerate(notes):
            f = hz(nt) * (1 + .0015 * (j - 2))
            pad[s:s + n] += e * (np.sin(2 * np.pi * f * tt) + .3 * np.sin(2 * np.pi * 2 * f * tt + 1) ) / len(notes)
    drone = .5 * np.sin(2 * np.pi * hz('A1') * t) * (.6 + .4 * np.sin(2 * np.pi * .05 * t))
    # 主旋律：swell 时进来，五声音阶慢动机
    mel = np.zeros(N); motif = ['E4', 'A4', 'B4', 'C5', 'B4', 'G4', 'A4', 'E4']
    step = 1.0
    for i in range(int(dur / step)):
        nt = motif[i % len(motif)]; s = int(i * step * SR); n = min(int(2.2 * SR), N - s)
        tt = np.arange(n) / SR; f = hz(nt)
        mel[s:s + n] += np.exp(-tt * 1.6) * (np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * 3 * f * tt)) * .35
    mel_gain = np.clip(level - 2, 0, 1)
    lone = .35 * np.sin(2 * np.pi * hz('E4') * t) * (.7 + .3 * np.sin(2 * np.pi * .2 * t))
    out = (pad * np.clip(level / 2, 0, 1.3) * (1 - solo) + drone * np.clip(level, 0, 1) * (1 - .7 * solo)
           + mel * mel_gain * (1 - solo) + lone * solo)
    # 简单混响：几组衰减延迟
    rev = np.zeros_like(out)
    for d, g in [(.031, .35), (.047, .3), (.071, .25), (.113, .2), (.173, .15)]:
        k = int(d * SR); rev[k:] += out[:-k] * g
    out = out + .6 * rev
    return out / (np.abs(out).max() + 1e-9) * .5


# ---------------- 音效 ----------------
def sfx(name):
    if name == 'click':
        n = int(.06 * SR); tt = np.arange(n) / SR
        return (R.standard_normal(n) * np.exp(-tt * 180) * .6 + np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 120) * .5)
    if name == 'tick':
        n = int(.05 * SR); tt = np.arange(n) / SR
        return np.sin(2 * np.pi * 1600 * tt) * np.exp(-tt * 90) * .45
    if name == 'on':
        n = int(.5 * SR); tt = np.arange(n) / SR; f = 110 + 60 * tt
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / .03) * np.exp(-tt * 4) * .5 + .15 * np.sin(2 * np.pi * 880 * tt) * np.exp(-tt * 10)
    if name == 'ding':
        n = int(1.2 * SR); tt = np.arange(n) / SR
        return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * g for f, d, g in [(1318, 3.5, .35), (2637, 6, .12), (1975, 5, .1)])
    if name == 'whoosh':
        n = int(.9 * SR); tt = np.arange(n) / SR; w = R.standard_normal(n)
        # 低通 → 高通扫：用移动平均窗口从长到短
        out = np.zeros(n); seg = n // 30
        for i in range(30):
            k = int(np.interp(i, [0, 29], [40, 4])); s = slice(i * seg, (i + 1) * seg)
            out[s] = np.convolve(w, np.ones(k) / k, mode='same')[s]
        return out * np.sin(np.pi * tt / tt[-1]) ** 2 * 1.4
    if name == 'boom':
        n = int(2.0 * SR); tt = np.arange(n) / SR; f = 70 * np.exp(-tt * 1.5) + 38
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2) * .9 + R.standard_normal(n) * np.exp(-tt * 30) * .15
    if name == 'pulse':
        n = int(.35 * SR); tt = np.arange(n) / SR
        return np.sign(np.sin(2 * np.pi * 120 * tt)) * np.exp(-tt * 12) * .12 + np.sin(2 * np.pi * 240 * tt) * np.exp(-tt * 10) * .2
    sys.exit(f'没有这个音效：{name}')


fx = np.zeros(N)
for b in tl['beats']:
    for s in b.get('sfx', []):
        x = sfx(s['name']) * s.get('gain', 1.0); i = int((b['start'] + s.get('at', 0)) * SR)
        if 0 <= i < N:
            m = min(len(x), N - i); fx[i:i + m] += x[:m]

tmp = tempfile.mkdtemp(prefix='snd_')


def wav(path, x):
    x = np.clip(x, -1, 1); w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()


music_db = a.music_db if a.music_db is not None else (-20 if a.narration else -9)
fx_path, mus_path = os.path.join(tmp, 'fx.wav'), os.path.join(tmp, 'music.wav')
wav(fx_path, fx * .5)
if not a.music:
    wav(mus_path, synth_music())
inputs = ['-i', a.video, '-i', a.music or mus_path, '-i', fx_path]
filt = f'[1:a]aformat=sample_rates={SR}:channel_layouts=stereo,volume={music_db}dB,atrim=0:{dur},afade=t=out:st={max(0, dur - 2.5)}:d=2.5[m];' \
       f'[2:a]aformat=sample_rates={SR}:channel_layouts=stereo,volume=-6dB[f];'
mix = '[m][f]'; n_in = 2
if a.narration:
    inputs += ['-i', a.narration]
    filt += f'[3:a]aformat=sample_rates={SR}:channel_layouts=stereo,volume=0dB[v];'
    mix += '[v]'; n_in = 3
filt += f'{mix}amix=inputs={n_in}:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11[a]'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', filt, '-map', '0:v', '-map', '[a]',
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', f'{dur}', '-movflags', '+faststart', a.out], check=True)
print('成片 →', a.out, f'（配乐 {"自带" if a.music else "代码合成"}，{"有" if a.narration else "无"}旁白，响度 -14 LUFS）')
