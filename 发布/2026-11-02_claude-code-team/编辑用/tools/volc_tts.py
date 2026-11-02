# -*- coding: utf-8 -*-
"""火山豆包声音复刻 2.0 合成：用户自己的音色念一句旁白。
Key 不在这里：云端环境 Network secrets 里配了 openspeech.bytedance.com 的 X-Api-Key，代理自动加头。
  python volc_tts.py "要念的话" out.wav [speech_rate] [fidelity 1/0] [语气指令，传 - 表示不用]
"""
import base64, json, sys, uuid, urllib.request

SPEAKER = "S_DRo7Kc2k2"
text, out = sys.argv[1], sys.argv[2]
# 11-02 用户试听三版选 C：语速 40、还原模式关（开着太平）
rate = int(sys.argv[3]) if len(sys.argv) > 3 else 15   # 11-02 v4：用户嫌快，40 → 15
fidelity = (sys.argv[4] != "0") if len(sys.argv) > 4 else False
# 11-02 用户定：加语气指令（豆包 2.0 的 additions.context_texts），不加太平
# 11-02 v4：「兴奋、惊讶」那条像在表演，AI 感重；用户试听三版选 A（聊天语气）
CTX = "像在跟朋友聊一件自己觉得有意思的事，语气自然、放松，不要播音腔，也不要刻意兴奋，说到关键处稍微放慢"
ctx = (sys.argv[5] if len(sys.argv) > 5 else CTX)
ctx = "" if ctx == "-" else ctx
body = {"user": {"uid": "krypto"},
        "req_params": {"text": text, "speaker": SPEAKER, "model": "seed-tts-2.0-expressive", "tone_fidelity": fidelity,
                       "audio_params": {"format": "pcm", "sample_rate": 48000, "speech_rate": rate}}}
if ctx: body["req_params"]["additions"] = json.dumps({"context_texts": [ctx]}, ensure_ascii=False)
req = urllib.request.Request("https://openspeech.bytedance.com/api/v3/tts/unidirectional", json.dumps(body).encode(),
                             {"Content-Type": "application/json", "X-Api-Resource-Id": "seed-icl-2.0",
                              "X-Api-Request-Id": str(uuid.uuid4())})
pcm = bytearray()
with urllib.request.urlopen(req, timeout=120) as r:
    for line in r:
        line = line.strip()
        if not line: continue
        d = json.loads(line)
        if d.get("data"): pcm += base64.b64decode(d["data"])
        elif d.get("code") not in (0, 20000000, None): sys.exit(f"error: {d}")
import wave
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(bytes(pcm))
print(out, f"{len(pcm)/96000:.2f}s")
