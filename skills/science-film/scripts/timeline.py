#!/usr/bin/env python3
"""script.json → timeline.json：每一拍什么时候开始、结束。画面代码只认拍的 id（at('hook1')），不写死秒数。

  python3 timeline.py <工程目录>                     按阅读速度排（无旁白）
  python3 timeline.py <工程目录> --narration 旁白.wav  按旁白音频里每句话的起止排（句数要和拍数一致）

script.json：
{
  "title": "追光", "format": "9:16", "cps": 4.6,
  "beats": [
    {"id": "hook1", "zh": "蓝光一亮，这只小鼠就开始原地转圈", "en": "Blue light on. The mouse starts spinning.", "key": "原地转圈",
     "min": 2.4, "gap": 0.25, "sfx": [{"at": 0.0, "name": "click"}]},
    {"id": "title", "nosub": true, "dur": 3.5},
    ...
  ]
}
  dur：固定时长（片名卡、纯画面段）；不写就按 中文字数 / cps + 0.7 秒，且不少于 min（默认 2.2）。
  gap：这一拍后面空多久再进下一拍（默认 0.25）。
"""
import json, os, re, subprocess, sys, argparse

ap = argparse.ArgumentParser()
ap.add_argument('proj')
ap.add_argument('--narration')
ap.add_argument('--noise', default='-35dB')
ap.add_argument('--min-silence', type=float, default=0.28)
a = ap.parse_args()

spec = json.load(open(os.path.join(a.proj, 'script.json'), encoding='utf-8'))
beats = spec['beats']
cps = spec.get('cps', 4.6)


def zh_len(s):
    return len(re.sub(r'[\s，。、！？：；—…,.!?「」“”\-]', '', s or ''))


out, t = [], 0.0
if a.narration:
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', a.narration, '-af', f'silencedetect=noise={a.noise}:d={a.min_silence}', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    h, m, sec = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r).groups()
    dur = int(h) * 3600 + int(m) * 60 + float(sec)
    starts = [float(x) for x in re.findall(r'silence_start: (-?[\d.]+)', r)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    # 讲话段 = 两段静音之间
    segs, cur = [], 0.0
    for s0, e0 in zip(starts, ends + [dur] * (len(starts) - len(ends))):
        if s0 - cur > .25:
            segs.append((cur, s0))
        cur = e0
    if dur - cur > .25:
        segs.append((cur, dur))
    spoken = [i for i, b in enumerate(beats) if b.get('zh') and not b.get('nosub') and not b.get('silent')]
    if len(segs) != len(spoken):
        sys.exit(f'旁白里切出 {len(segs)} 句，script.json 里有 {len(spoken)} 句要念的。'
                 f'调 --noise（现在 {a.noise}）或 --min-silence（现在 {a.min_silence}），或者录音时句间多停 0.4 秒。\n'
                 f'切出来的段：' + ', '.join(f'{s:.2f}-{e:.2f}' for s, e in segs))
    when = dict(zip(spoken, segs))
    # 不念的拍（片名卡、纯画面）放在前后两句之间的空隙里：录音时在那里留出相应长度的停顿
    for i, b in enumerate(beats):
        if i in when:
            s0, e0 = when[i]
        else:
            prev_end = max([when[k][1] for k in when if k < i], default=0.0)
            nxt = min([when[k][0] for k in when if k > i], default=dur)
            s0, e0 = prev_end + .1, max(prev_end + .2, nxt - .1)
            if b.get('dur') and e0 - s0 < b['dur'] - .3:
                print(f"注意：{b['id']} 想要 {b['dur']} 秒，旁白在这里只留了 {e0 - s0:.1f} 秒停顿", file=sys.stderr)
        out.append({**b, 'start': round(s0, 3), 'end': round(e0, 3)})
    total = round(dur + spec.get('tail', 1.0), 3)
else:
    for b in beats:
        if 'dur' in b:
            d = b['dur']
        else:
            d = max(b.get('min', 2.2), zh_len(b.get('zh')) / cps + 0.7)
        out.append({**b, 'start': round(t, 3), 'end': round(t + d, 3)})
        t += d + b.get('gap', 0.25)
    total = round(t + spec.get('tail', 1.0), 3)

ids = [b['id'] for b in out]
dup = {i for i in ids if ids.count(i) > 1}
if dup:
    sys.exit(f'拍 id 重复：{dup}')
tl = {'title': spec.get('title', ''), 'format': spec.get('format', '9:16'), 'total': total, 'beats': out}
json.dump(tl, open(os.path.join(a.proj, 'timeline.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{len(out)} 拍，总长 {total:.1f} 秒 → timeline.json')
for b in out:
    print(f"  {b['start']:6.2f}–{b['end']:6.2f}  {b['id']:<14} {b.get('zh', '')[:24]}")
