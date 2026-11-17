# -*- coding: utf-8 -*-
"""用用户的复刻音色给旁白配音：plan.json 的 lines → narration/<id>.wav（48k 单声道）。
  python tts.py <工作目录> [--force] [id ...]          已有的不重配，除非 --force 或点名 id
  python tts.py <工作目录> --try "要念的一句话" out.wav   单句试听（不写 narration/）
火山「豆包声音复刻模型 2.0」。Key 不在这里：云端环境 Network secrets 给 openspeech.bytedance.com 配了 X-Api-Key，代理自动加头（见 tools/volc-voice/README.md）。
用户 11-02 一路试出来的默认（plan.json 的 narration 可以改）：
- speaker S_DRo7Kc2k2；语速 25（40 嫌快、15 嫌慢；参数效果不明显，再要快就混音时 atempo）；tone_fidelity 关（开着更平）
- 语气指令（additions.context_texts）用聊天口吻；「兴奋、惊讶、强调」那条像在表演，AI 感重，用户试听后弃用
- **按句合成**，每句去掉首尾静音，句间插 0.45 秒停顿（一口气念完的 AI 感最重）；build_timeline 靠这个停顿把字幕对到每句
- 火山偶尔 502，自动重试 5 次（2/4/8/16/32 秒）
- **每句单独给情绪（用户 11-17：整条一个语气指令「非常平，没有任何情感和节奏变化」）**：旁白里每句前面写〔情绪指令〕，
  可带语速和句后停顿：〔你可以压低声音、放慢说吗？像在讲悬疑故事｜r=0｜p=0.9〕。没写的句子沿用上一句。
  指令要写成**请求口吻**（「你可以用……的语气说吗？」）：11-17 同一句实测，描述式指令音高跨度 5.8 个半音、
  请求式 10.0 个半音，响度起伏 12 → 15 dB；接口的 emotion 参数对复刻音色几乎没用（6.0）。
  build_timeline 显示字幕时会把〔〕去掉
- **每句再做一层后期（11-17）**：火山的指令只能拉开句内起伏，各段整体音高只差 1.5 个半音，听着还是一个调子。
  〔…｜k=-1.5｜s=0.9｜g=-2〕：k 变调（半音，rubberband 保留共振峰，±2 以内不失真）、s 语速倍数、g 音量 dB。
  悬念 / 沉重：k -1.5 到 -2、s 0.85 到 0.9；揭晓 / 惊讶：k +1.5 到 +2、g +2；轻松带笑：k +1、s 1.05
- 每句合成结果按（文本、指令、语速、音色）缓存在 narration/.cache/，只改后期参数不会重新扣费
"""
import base64, json, re, sys, time, uuid, wave, urllib.request
from pathlib import Path
import numpy as np

DEF = {"speaker": "S_DRo7Kc2k2", "rate": 25, "fidelity": False, "pause": 0.45,
       "ctx": "像在跟朋友聊一件自己觉得有意思的事，语气自然、放松，不要播音腔，也不要刻意兴奋，说到关键处稍微放慢"}

def synth(t, cfg):
    rp = {"text": t, "speaker": cfg["speaker"], "model": "seed-tts-2.0-expressive", "tone_fidelity": cfg["fidelity"],
          "audio_params": {"format": "pcm", "sample_rate": 48000, "speech_rate": cfg["rate"]}}
    if cfg.get("ctx"): rp["additions"] = json.dumps({"context_texts": [cfg["ctx"]]}, ensure_ascii=False)
    err = None
    for i in range(5):
        try:
            req = urllib.request.Request("https://openspeech.bytedance.com/api/v3/tts/unidirectional",
                json.dumps({"user": {"uid": "krypto"}, "req_params": rp}).encode(),
                {"Content-Type": "application/json", "X-Api-Resource-Id": "seed-icl-2.0", "X-Api-Request-Id": str(uuid.uuid4())})
            pcm = bytearray()
            with urllib.request.urlopen(req, timeout=120) as r:
                for line in r:
                    line = line.strip()
                    if not line: continue
                    d = json.loads(line)
                    if d.get("data"): pcm += base64.b64decode(d["data"])
                    elif d.get("code") not in (0, 20000000, None): raise RuntimeError(d)
            return np.frombuffer(bytes(pcm), dtype=np.int16)
        except Exception as e:
            err = e; time.sleep(2 ** (i + 1))
    raise SystemExit(f"tts failed: {err}")

import hashlib, subprocess
def post(a, tone):                       # 每句的变调 / 变速 / 音量
    k, sp, gdb = tone.get("k", 0), tone.get("s", 1), tone.get("g", 0)
    if not (k or sp != 1 or gdb): return a
    f = f"rubberband=pitch={2 ** (k / 12):.5f}:tempo={sp}:formant=preserved:transients=smooth,volume={gdb}dB"
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "s16le", "-ar", "48000", "-ac", "1", "-i", "-", "-af", f, "-f", "s16le", "-ar", "48000", "-ac", "1", "-"],
                       input=a.tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.int16)

def cached(s, c):
    key = hashlib.md5(json.dumps([s, c["speaker"], c["rate"], c["fidelity"], c.get("ctx")], ensure_ascii=False).encode()).hexdigest()
    f = CACHE / f"{key}.npy"
    if f.exists(): return np.load(f)
    a = synth(s, c); np.save(f, a); return a

def trim(a, th=300):                     # 去掉每句首尾静音，停顿统一由我们加
    idx = np.where(np.abs(a) > th)[0]
    return a[max(0, idx[0] - 1200): idx[-1] + 2400] if len(idx) else a

TONE = re.compile(r"〔([^〕]*)〕")
def sentences(text):
    """按句切，每句带上自己的〔情绪｜r=语速｜p=句后停顿〕；没写的沿用上一句。"""
    out, tone = [], {}
    marks = TONE.findall(text); body = TONE.sub("\x00", text)          # 指令里也有问号，先抠出来再按句切
    it = iter(marks)
    for s in [x for x in re.split(r"(?<=[。？！])", body) if x.strip()]:
        s = re.sub("\x00", lambda _: "〔" + next(it) + "〕", s)
        m = TONE.search(s)
        if m:
            tone = {}
            for i, part in enumerate(m.group(1).split("｜")):
                if part.startswith("r="): tone["rate"] = int(part[2:])
                elif part.startswith("p="): tone["pause"] = float(part[2:])
                elif part[:2] in ("k=", "s=", "g="): tone[part[0]] = float(part[2:])
                elif part.strip(): tone["ctx"] = part.strip()
        out.append((TONE.sub("", s).strip(), dict(tone)))
    return out

def say(text, out, cfg):
    parts = []
    for s, tone in sentences(text):
        c = {**cfg, **tone}
        parts += [post(trim(cached(s, c)), tone), np.zeros(int(c["pause"] * 48000), dtype=np.int16)]
    sents = parts[::2]
    a = np.concatenate(parts[:-1])
    with wave.open(str(out), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(a.tobytes())
    print(f"{out}  {len(a) / 48000:.2f}s  {len(sents)} 句")
    return len(a) / 48000

P = Path(sys.argv[1]).resolve(); args = sys.argv[2:]
plan = json.loads((P / "plan.json").read_text(encoding="utf-8")) if (P / "plan.json").exists() else {}
cfg = {**DEF, **plan.get("narration", {})}
CACHE = P / "narration" / ".cache"
if args[:1] == ["--try"]:
    CACHE.mkdir(parents=True, exist_ok=True)
    say(args[1], Path(args[2]), cfg); sys.exit()
force = "--force" in args; only = [a for a in args if a != "--force"]
(P / "narration").mkdir(exist_ok=True); tot = 0
CACHE = P / "narration" / ".cache"; CACHE.mkdir(exist_ok=True)
for k, t in plan["lines"]:
    out = P / "narration" / f"{k}.wav"
    if out.exists() and not force and k not in only:
        with wave.open(str(out)) as w: tot += w.getnframes() / w.getframerate()
        continue
    tot += say(t, out, cfg)
print(f"旁白合计 {tot:.1f}s")
