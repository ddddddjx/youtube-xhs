# -*- coding: utf-8 -*-
"""按旁白实测时长和原声片段时长排时间线 → <工作目录>/timeline.json（动画层 render.js 和合成 compose.py 共用）。
  python build_timeline.py <工作目录>          # 工作目录 = 发布/<日期>_<名字>/编辑用
读：plan.json（plan / lines / clips / footage / bridge 标签）、narration/<id>.wav、clips.json（cut_clips.py 写的时长和剪口）。

时间规则（11-02 Claude Code 团队片一路改出来的，改之前先看 references/pitfalls.md）：
- 段与段之间至少留 0.45 秒（「多留一口气」）；bridge 和片头第一段不留
- 旁白按句合成、句间停 0.45 秒；字幕先按音频里 ≥0.42 秒的停顿切到每句，再在句内按字数分行
- footage：旁白段画面放原片（静音），同一组连续的 footage 窗口首尾相接，不留空档
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

P = Path(sys.argv[1]).resolve()
plan = json.loads((P / "plan.json").read_text(encoding="utf-8"))
clips_meta = json.loads((P / "clips.json").read_text())
lines = dict(plan["lines"])
CLIPS = plan["clips"]
FOOT = plan.get("footage", {})
GAP = plan.get("gap", .45)

def wav_dur(k):
    with wave.open(str(P / "narration" / f"{k}.wav")) as w:
        return w.getnframes() / w.getframerate()

def src_to_local(k, s):
    off = 0.0
    for a, b in CLIPS[k]["segs"]:
        if a - .05 <= s <= b + .05:
            return off + max(0.0, s - a)
        off += b - a
    raise ValueError(f"{k}: 字幕时间 {s} 不在片段里")

def split_nar(text):
    """一句旁白切成字幕行：。？！：；— 断开，过长再按逗号断；行尾标点去掉。"""
    parts = [p for p in re.split(r"(?<=[。？！：；—])", text) if p.strip()]
    out = []
    for p in parts:
        out += [q for q in re.split(r"(?<=，)", p) if q.strip()] if len(p) > 24 and "，" in p else [p]
    return [o.strip().rstrip("，。；：") for o in out]

def sentence_spans(k, n):
    """从音频里找句间停顿（≥0.42 秒；句内冒号处的自然停顿约 0.3 秒，不能算），得到每句 [起, 止]。段数对不上返回 None。"""
    with wave.open(str(P / "narration" / f"{k}.wav")) as w:
        sr = w.getframerate(); a = np.abs(np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)).astype(float)
    hop = int(.01 * sr); env = np.array([a[i:i + hop].max() for i in range(0, len(a) - hop, hop)])
    spans, start, quiet = [], None, 0
    for i, v in enumerate(env > 400):
        if v:
            start = i if start is None else start; quiet = 0
        elif start is not None:
            quiet += 1
            if quiet >= 42:
                spans.append([start / 100, (i - quiet + 1) / 100]); start, quiet = None, 0
    if start is not None: spans.append([start / 100, len(env) / 100])
    return spans if len(spans) == n else None

def weight(s):                                  # 英文单词按 1.6 个汉字算
    return len(re.sub(r"[A-Za-z]+", "", s)) + 1.6 * len(re.findall(r"[A-Za-z]+", s))

t = 0.0
segs, subs, windows, audio = [], [], [], []
items = plan["plan"]
for idx, it in enumerate(items):
    kind, k = it[0], it[1]
    pad = it[2] if len(it) > 2 else GAP
    t += (max(pad, GAP) if (kind != "bridge" and idx > 0) else pad)
    if kind == "nar":
        d = wav_dur(k)
        segs.append({"kind": "nar", "id": k, "t0": round(t, 3), "t1": round(t + d, 3)})
        audio.append({"src": f"narration/{k}.wav", "at": round(t, 3), "narration": True})
        sents = [x for x in re.split(r"(?<=[。？！])", lines[k]) if x.strip()]
        spans = sentence_spans(k, len(sents))
        if not spans: sents, spans = [lines[k]], [[0, d]]
        for sent, (sa, sb) in zip(sents, spans):
            rows = split_nar(sent); tot = sum(weight(r) for r in rows); a = t + sa
            for r in rows:
                b = a + (sb - sa) * weight(r) / tot
                subs.append({"a": round(a, 3), "b": round(b - .05, 3), "zh": r, "kind": "nar"})
                a = b
        if k in FOOT:                            # 这段旁白的画面是原片（静音）
            src, rect, off = FOOT[k]
            prev_f = idx > 0 and items[idx - 1][1] in FOOT
            next_f = idx + 1 < len(items) and items[idx + 1][1] in FOOT
            nxt_pad = max(items[idx + 1][2] if len(items[idx + 1]) > 2 else GAP, GAP) if next_f else 0
            t0 = t - (0 if prev_f else .25)
            windows.append({"src": f"clips/{src}.mov", "t0": round(t0, 3), "t1": round(t + d + nxt_pad, 3), "off": off,
                            "rect": rect, "mute": True, "seg": k})
        t += d
    elif kind == "bridge":                        # 进原声前的过桥：原片小窗 + 一行要点
        d = 1.0
        segs.append({"kind": "bridge", "id": "bridge_" + k, "clip": k, "t0": round(t, 3), "t1": round(t + d, 3), "label": it[3] if len(it) > 3 else ""})
        windows.append({"src": f"clips/{k}.mov", "t0": round(t, 3), "t1": round(t + d, 3), "off": 0.0, "rect": "mini", "mute": True, "seg": "bridge_" + k})
        t += d
    else:                                         # 原声
        c = CLIPS[k]; d = clips_meta[k]["dur"]
        segs.append({"kind": "clip", "id": k, "t0": round(t, 3), "t1": round(t + d, 3), "who": c.get("who", ""),
                     "layout": c.get("layout", "center"), "cuts": [round(t + x, 3) for x in clips_meta[k]["cuts"]]})
        windows.append({"src": f"clips/{k}.mov", "t0": round(t, 3), "t1": round(t + d, 3), "off": 0.0, "rect": c.get("layout", "center"),
                        "mute": False, "seg": k, "cuts": clips_meta[k]["cuts"]})
        audio.append({"src": f"clips/{k}.mov", "at": round(t, 3), "narration": False})
        for sa, sb, en, zh in c.get("subs", []):
            subs.append({"a": round(t + src_to_local(k, sa), 3), "b": round(t + src_to_local(k, sb), 3), "zh": zh, "en": en, "kind": "clip"})
        t += d
t += plan.get("tail", 2.5)

# 自检：原片窗口不能比片段还长（旁白改长后最容易漏，画面会在卡片里空掉）
for w in windows:
    k = Path(w["src"]).stem; need = w["t1"] - w["t0"] + w["off"]
    if need > clips_meta[k]["dur"] + .05:
        print(f"⚠ clips/{k}.mov 只有 {clips_meta[k]['dur']:.2f}s，窗口要 {need:.2f}s：把 plan.json 里 {k} 的 segs 拉长再跑 cut_clips.py")
tl = {"dur": round(t, 3), "segs": segs, "subs": subs, "windows": windows, "audio": audio}
(P / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"total {t:.2f}s（旁白 {sum(s['t1'] - s['t0'] for s in segs if s['kind'] == 'nar'):.1f}s，原声 {sum(s['t1'] - s['t0'] for s in segs if s['kind'] == 'clip'):.1f}s）")
for s in segs: print(f"{s['kind']:6} {s['id']:10} {s['t0']:7.2f} → {s['t1']:7.2f}")
