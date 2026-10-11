#!/usr/bin/env python3
"""成片验收：开头抓不抓眼、中段有没有死画面、文字有没有压字幕 / 出安全区、响度对不对，并导出封面候选。

  python3 qa.py <工程目录> --video 成片.mp4 [--layout layout.json] [--out qa/]

红灯（✗）不交付。封面候选写到 <out>/封面_*.jpg：开头钩子、片名卡、情绪高点、最亮的一帧。
"""
import argparse, json, os, re, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('proj'); ap.add_argument('--video', required=True); ap.add_argument('--layout'); ap.add_argument('--out', default=None)
a = ap.parse_args()
out = a.out or os.path.join(a.proj, 'qa'); os.makedirs(out, exist_ok=True)
tl = json.load(open(os.path.join(a.proj, 'timeline.json'), encoding='utf-8'))
R, Y, G = [], [], []

# ---------- 画面：12fps、240 宽灰度 ----------
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', a.video], capture_output=True, text=True).stdout
pj = json.loads(probe); W0, H0 = pj['streams'][0]['width'], pj['streams'][0]['height']; dur = float(pj['format']['duration'])
w = 240; h = int(H0 * w / W0) // 2 * 2; fps = 12
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', f'fps={fps},scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
luma = fr.mean(axis=(1, 2))
diff = np.r_[0, np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))]
edges = np.array([(np.abs(np.diff(f, axis=1)) > 18).mean() for f in fr])

if luma[0] < 10:
    R.append(f'第一帧几乎全黑（亮度 {luma[0]:.0f}）：开头不要从黑场淡入，第一帧就要有主角')
m1 = diff[1:fps + 1].mean()
if m1 < .6:
    R.append(f'第 1 秒画面几乎不动（平均帧差 {m1:.2f}）：开头要有一个正在发生的动作')
else:
    G.append(f'第 1 秒有动作（帧差 {m1:.2f}）')
# 前 5 秒至少一次明显的状态变化（亮起、开关、砸入）
if diff[:5 * fps].max() < 3:
    Y.append(f'前 5 秒最大帧差 {diff[:5 * fps].max():.1f}：没有一次明显的状态变化（光亮起、开关拨动）')
# 中段死画面：连续 1.5 秒帧差 < 0.15
still = diff < .15; run = 0
for i, s in enumerate(still):
    run = run + 1 if s else 0
    if run == int(1.5 * fps) and fps * 1 < i < len(fr) - fps * 2:
        Y.append(f'{(i - run) / fps:.1f} 秒起画面停了 1.5 秒以上：环境层（颗粒、光柱）至少要在动')
# 空画面：亮度很低且几乎没有边缘，连续 0.5 秒
empty = (luma < 8) & (edges < .002); run = 0
for i, e in enumerate(empty):
    run = run + 1 if e else 0
    if run == int(.5 * fps) and fps < i < len(fr) - fps:
        R.append(f'{(i - run) / fps:.1f} 秒起有 0.5 秒以上的空黑画面')

# ---------- 文字框 ----------
if a.layout and os.path.exists(a.layout):
    lay = json.load(open(a.layout))
    hit_safe, hit_over = set(), set()
    for fr_ in lay:
        sf = fr_['safe']; bx = fr_['boxes']
        for b in bx:
            if b['x'] < sf['l'] - 2 or b['x'] + b['w'] > sf['r'] + 2 or b['y'] < sf['t'] - 2 or b['y'] + b['h'] > sf['b'] + 2:
                hit_safe.add((b['kind'], round(fr_['t'])))
        for i in range(len(bx)):
            for j in range(i + 1, len(bx)):
                A, B = bx[i], bx[j]
                ox = min(A['x'] + A['w'], B['x'] + B['w']) - max(A['x'], B['x']); oy = min(A['y'] + A['h'], B['y'] + B['h']) - max(A['y'], B['y'])
                if ox > 8 and oy > 8:
                    hit_over.add((A['kind'], B['kind'], round(fr_['t'])))
    for k, t in sorted(hit_safe, key=lambda x: x[1])[:12]:
        R.append(f'{t} 秒：{k} 出了安全区（会被平台界面挡住）')
    for k1, k2, t in sorted(hit_over, key=lambda x: x[2])[:12]:
        R.append(f'{t} 秒：{k1} 和 {k2} 的文字框重叠')
else:
    Y.append('没给 --layout：没查文字重叠和安全区（render.py 加 --layout layout.json 导出）')

# ---------- 声音 ----------
r = subprocess.run(['ffmpeg', '-v', 'info', '-i', a.video, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
if not m:
    R.append('成片没有音轨')
else:
    I = float(m[-1])
    (G if abs(I + 14) <= 1.5 else Y).append(f'响度 {I:.1f} LUFS（目标 -14）')

# ---------- 封面候选 ----------
picks = {}
beats = tl['beats']
first = next((b for b in beats if b.get('zh')), None)
if first: picks['钩子'] = first['start'] + min(1.5, (first['end'] - first['start']) * .7)
tc = next((b for b in beats if b['id'].startswith('title')), None)
if tc: picks['片名'] = tc['start'] + min(2.0, (tc['end'] - tc['start']) * .7)
emo = next((b for b in beats if b.get('emotion')), None)
if emo: picks['情绪'] = emo['start'] + (emo['end'] - emo['start']) * .6
picks['最亮'] = float(np.argmax(luma * (edges + .01))) / fps
for k, t in picks.items():
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{min(t, dur - .1):.2f}', '-i', a.video, '-frames:v', '1', '-q:v', '3', os.path.join(out, f'封面_{k}.jpg')])
G.append('封面候选：' + '、'.join(f'封面_{k}.jpg（{t:.1f}s）' for k, t in picks.items()))

for x in R: print('✗', x)
for x in Y: print('⚠', x)
for x in G: print('✓', x)
print(f'{len(R)} 个红灯，{len(Y)} 个黄灯。' + ('红灯清零再交付。' if R else '可以交付。'))
sys.exit(1 if R else 0)
