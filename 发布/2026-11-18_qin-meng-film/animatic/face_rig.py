# -*- coding: utf-8 -*-
"""脸的「提线」数据：landmarks.json（face_landmarks.py 用 MediaPipe 在定帧上认出来的 478 个点）+ 配音的响度包络 → faces.js。
着色器拿这些数在定帧上做局部形变：下巴跟着配音开合、眨眼、头微微点。脸还是用户定帧里的那张脸，没有重建。
  python face_rig.py        # 读 landmarks.json、../sound/vo/*.wav → faces.js"""
import json, wave
from pathlib import Path
import numpy as np
HERE = Path(__file__).resolve().parent; A = 16 / 9
lm = json.loads((HERE / 'landmarks.json').read_text()); faces = {}
for sid, fs in lm.items():
    if not fs: continue
    f = max(fs, key=lambda F: abs(F[33][0] - F[263][0]))                       # 一镜里取最大的那张脸
    P = lambda i: np.array([f[i][0] * A, f[i][1]])                              # 换成「高 = 1」的坐标，方向和距离才对
    eL, eR = (P(33) + P(133)) / 2, (P(362) + P(263)) / 2; chin = P(152); mid = (eL + eR) / 2
    down = (chin - mid) / np.linalg.norm(chin - mid); right = np.array([down[1], -down[0]]); right *= np.sign(np.dot(P(291) - P(61), right)) or 1
    m = (P(13) + P(14)) / 2; hw = np.linalg.norm(P(291) - P(61)) / 2
    def eye(c0, c1, up, lo): c = (P(c0) + P(c1)) / 2; return [c[0] / A, c[1], np.linalg.norm(P(c1) - P(c0)) / 2, max(0.004, np.dot(P(lo) - P(up), down))]
    faces[sid] = {'mouth': [m[0] / A, m[1], hw, float(np.dot(chin - m, down))], 'down': [float(down[0]), float(down[1])], 'right': [float(right[0]), float(right[1])],
        'eyeL': eye(33, 133, 159, 145), 'eyeR': eye(362, 263, 386, 374), 'head': [P(1)[0] / A, P(1)[1], float(np.linalg.norm(chin - P(10)))]}
env = {}
for w in sorted((HERE.parent / 'sound' / 'vo').glob('[0-9][0-9].wav')):
    with wave.open(str(w)) as f: x = np.frombuffer(f.readframes(f.getnframes()), '<i2').astype(float) / 32768; sr = f.getframerate()
    hop = sr // 60; r = np.array([np.sqrt((x[i:i + hop * 2] ** 2).mean()) for i in range(0, len(x) - hop, hop)]); r = r / (np.percentile(r, 92) + 1e-9)
    r = np.clip(r, 0, 1.15) ** 0.7; out = np.zeros(len(r)); v = 0
    for i, t in enumerate(r): v += (t - v) * (0.55 if t > v else 0.3); out[i] = v                # 张得快、合得慢一点
    env[w.stem] = [round(float(v), 3) for v in out]                                              # 60 帧 / 秒
(HERE / 'faces.js').write_text('/* 由 face_rig.py 生成，别手改 */\nwindow.FACES = ' + json.dumps(faces, separators=(',', ':')) + ';\nwindow.VOENV = ' + json.dumps(env, separators=(',', ':')) + ';\n', encoding='utf-8')
print('faces:', sorted(faces), ' 配音包络:', len(env))
