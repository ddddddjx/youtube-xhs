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

def trim(a, th=300):                     # 去掉每句首尾静音，停顿统一由我们加
    idx = np.where(np.abs(a) > th)[0]
    return a[max(0, idx[0] - 1200): idx[-1] + 2400] if len(idx) else a

def say(text, out, cfg):
    sents = [s for s in re.split(r"(?<=[。？！])", text) if s.strip()]
    gap = np.zeros(int(cfg["pause"] * 48000), dtype=np.int16); parts = []
    for s in sents: parts += [trim(synth(s, cfg)), gap]
    a = np.concatenate(parts[:-1])
    with wave.open(str(out), "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(a.tobytes())
    print(f"{out}  {len(a) / 48000:.2f}s  {len(sents)} 句")
    return len(a) / 48000

P = Path(sys.argv[1]).resolve(); args = sys.argv[2:]
plan = json.loads((P / "plan.json").read_text(encoding="utf-8")) if (P / "plan.json").exists() else {}
cfg = {**DEF, **plan.get("narration", {})}
if args[:1] == ["--try"]:
    say(args[1], Path(args[2]), cfg); sys.exit()
force = "--force" in args; only = [a for a in args if a != "--force"]
(P / "narration").mkdir(exist_ok=True); tot = 0
for k, t in plan["lines"]:
    out = P / "narration" / f"{k}.wav"
    if out.exists() and not force and k not in only:
        with wave.open(str(out)) as w: tot += w.getnframes() / w.getframerate()
        continue
    tot += say(t, out, cfg)
print(f"旁白合计 {tot:.1f}s")
