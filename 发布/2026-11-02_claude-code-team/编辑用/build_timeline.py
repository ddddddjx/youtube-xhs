# -*- coding: utf-8 -*-
"""按旁白实际时长和原声片段时长排时间线，出 timeline.json（动画页面和合成脚本共用）。
  python build_timeline.py
"""
import json, re, wave
from pathlib import Path

P = Path(__file__).resolve().parent
clips = json.loads((P / "clips.json").read_text())
lines = dict(json.loads((P / "narration.json").read_text(encoding="utf-8"))["lines"])

def wav_dur(k):
    with wave.open(str(P / "narration" / f"{k}.wav")) as w:
        return w.getnframes() / w.getframerate()

# 片段内字幕：片源秒数 → 中英
CLIP_SUBS = {
    "C2": [(100.4, 102.4, "caring about each individual tool call", "以前在意每一次工具调用、"),
           (102.4, 104.9, "and each individual decision that the model makes", "模型做的每一个决定；"),
           (104.9, 110.2, "to just zoomed out view of like, I have a goal and I'd like to achieve this goal.", "现在退远一步：我有一个目标，我想把它达成。"),
           (110.9, 114.5, "And you just kind of give that goal to the model to achieve for you.", "然后把这个目标交给模型，让它替你完成。")],
    "C4": [           (212.8, 216.8, "You'd give it like five things to do and it would do three things and just give up.", "给它五件事，做完三件就放弃了。"),
           (217.4, 220.8, "So we were like, oh, maybe you give it a to-do list and it'll do really well.", "我们就想：要不给它一张待办清单？效果很好。"),
           (227.2, 231.4, "But a year from then, it's disappeared. You don't really need the to-do list anymore.", "可一年后，它就消失了，待办清单已经用不上了。"),
           (236.2, 241.3, "…you got to be very unattached to the things you're building", "你得对自己做的东西毫不留恋，"),
           (241.3, 244.1, "because they're going to go away fairly quickly.", "因为它们很快就会消失。")],
    "C5": [(312.9, 318.4, "So I think in some ways, we're this hyperbolic time chamber of where software development is going.", "某种程度上，我们就是软件开发未来的「精神时光屋」。")],
    "C6": [(575.4, 579.1, "and they would pick out three little nitpicks to post.", "审代码的人会挑出三个小毛病发上去，"),
           (579.4, 583.1, "It was kind of just like, I'm signaling to you that I read this code.", "其实就是在告诉你：这段代码我看过了。"),
           (589.3, 594.7, "Now, you can have Claude figure out those little things and address them autonomously.", "现在，这些小问题可以交给 Claude 自己找、自己改。"),
           (595.1, 598.0, "That's not really the important part of human code review anymore.", "这已经不是人审代码的重点了。")],
    "C7": [(927.6, 930.9, "And that abstraction was like a little scary to get through at first.", "这层抽象，一开始有点吓人。"),
           (931.0, 934.1, "I can't see everything that Claude is thinking as it's thinking it.", "我看不到 Claude 当下在想的每一件事。"),
           (951.7, 955.5, "And like being forced even to let Claude cook.", "就像被逼着放手，让它自己发挥。")],
}
WHO = {"C2": "Sid Bidasaria", "C4": "Sid Bidasaria", "C5": "Thariq Shihipar", "C6": "Robert Boyce", "C7": "Robert Boyce"}
LAYOUT = {"C2": "center", "C4": "left", "C5": "center", "C6": "left", "C7": "center"}

def src_to_local(k, s):
    off = 0.0
    for a, b in clips[k]["segs"]:
        if a - 0.05 <= s <= b + 0.05:
            return off + max(0.0, s - a)
        off += b - a
    raise ValueError((k, s))

def split_nar(text):
    """旁白按句切成字幕行：句号 / 问号 / 冒号 / 破折号断开，过长的再按逗号断。"""
    parts = [p for p in re.split(r"(?<=[。？！：；—])", text) if p.strip()]
    out = []
    for p in parts:
        if len(p) > 24 and "，" in p:
            out += [q for q in re.split(r"(?<=，)", p) if q.strip()]
        else:
            out.append(p)
    return [o.strip().rstrip("，。；：") for o in out]

def weight(s):
    # 英文单词按 1.6 个汉字算
    return len(re.sub(r"[A-Za-z]+", "", s)) + 1.6 * len(re.findall(r"[A-Za-z]+", s))

# 11-02 v2：开场换成原片画面 + 旁白快速交代背景和人物（o1–o3），再接「一年前」气泡（o4）；停顿收紧压回 2 分钟
# 11-02 v4：学 Jim 的旁白形式——人物介绍 → 问题 + 答案前置 → 判断 → 三步路线图 → 每步回顾一句 → 片尾回到判断；不卡 2 分钟
PLAN = [("nar", "o1", .25), ("nar", "o2", .15), ("nar", "o3", .15), ("nar", "q1", .35), ("nar", "q2", .3), ("nar", "q3", .3),
        ("nar", "n3", .4), ("bridge", "C2", 0), ("clip", "C2", .05), ("nar", "r1", .3),
        ("nar", "n4", .5), ("clip", "C4", .25), ("nar", "n5", .25), ("clip", "C5", .25), ("nar", "r2", .3),
        ("nar", "n6", .5), ("clip", "C6", .25), ("nar", "n7", .25), ("clip", "C7", .3), ("nar", "n8", .4)]
OPEN_WIN = {"o1": ("WIDE", "wide", 2.0), "o2": ("THARIQ", "wide", 0.5), "o3": ("DUO", "wide", 0.3),
            # 11-02 用户：问题 / 判断 / 路线图这三段画面上也要带原片（左卡片原片，右边答案卡、盖章、路线图）
            "q1": ("Q1", "left", 0.0), "q2": ("Q2", "left", 0.0), "q3": ("Q3", "left", 0.0)}
BRIDGE_LABEL = {"C2": "Sid：从盯每一步，到只给目标"}

t = 0.0
segs, subs, windows, audio = [], [], [], []
for kind, k, pad in PLAN:
    t += pad
    if kind == "nar":
        d = wav_dur(k)
        segs.append({"kind": "nar", "id": k, "t0": round(t, 3), "t1": round(t + d, 3)})
        audio.append({"src": f"narration/{k}.wav", "at": round(t, 3), "gain": 1.0})
        rows = split_nar(lines[k]); tot = sum(weight(r) for r in rows); a = t
        for r in rows:
            b = a + d * weight(r) / tot
            subs.append({"a": round(a, 3), "b": round(b - .05, 3), "zh": r, "kind": "nar"})
            a = b
        if k in OPEN_WIN:   # 开场三句：画面是原片（全景 → Thariq 近景 → Robert 和 Sid）
            src, rect, off = OPEN_WIN[k]
            nxt = PLAN[[p[1] for p in PLAN].index(k) + 1][2]
            windows.append({"src": f"clips/{src}.mov", "t0": round(t - (.25 if k == "o1" else 0), 3), "t1": round(t + d + (nxt if k not in ("o3", "q3") else 0), 3), "off": off, "rect": rect, "mute": True})
        t += d
    elif kind == "bridge":
        d = 1.0
        segs.append({"kind": "bridge", "id": k, "t0": round(t, 3), "t1": round(t + d, 3), "label": BRIDGE_LABEL[k]})
        windows.append({"src": f"clips/{k}.mov", "t0": round(t, 3), "t1": round(t + d, 3), "off": 0.0, "rect": "mini", "mute": True})
        t += d
    else:
        d = clips[k]["dur"]
        segs.append({"kind": "clip", "id": k, "t0": round(t, 3), "t1": round(t + d, 3), "who": WHO[k], "layout": LAYOUT[k],
                     "cuts": [round(t + c, 3) for c in clips[k]["cuts"]]})
        windows.append({"src": f"clips/{k}.mov", "t0": round(t, 3), "t1": round(t + d, 3), "off": 0.0, "rect": LAYOUT[k], "mute": False})
        audio.append({"src": f"clips/{k}.mov", "at": round(t, 3), "gain": 1.0})
        for sa, sb, en, zh in CLIP_SUBS[k]:
            subs.append({"a": round(t + src_to_local(k, sa), 3), "b": round(t + src_to_local(k, sb), 3), "zh": zh, "en": en, "kind": "clip"})
        t += d
t += 2.5   # 片尾停留
tl = {"dur": round(t, 3), "segs": segs, "subs": subs, "windows": windows, "audio": audio}
(P / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"total {t:.2f}s")
for s in segs: print(f"{s['kind']:6} {s['id']:3} {s['t0']:7.2f} → {s['t1']:7.2f}")
