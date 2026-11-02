# 按句合成 + 句间停顿，测试自然度：python tts_nat.py "全文" out.wav rate fidelity(0/1) ctx|- pause
import base64, json, re, sys, uuid, urllib.request, wave, time
import numpy as np
text, out, rate, fid, ctx, pause = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4] == "1", sys.argv[5], float(sys.argv[6])
def synth(t):
    rp = {"text": t, "speaker": "S_DRo7Kc2k2", "model": "seed-tts-2.0-expressive", "tone_fidelity": fid,
          "audio_params": {"format": "pcm", "sample_rate": 48000, "speech_rate": rate}}
    if ctx != "-": rp["additions"] = json.dumps({"context_texts": [ctx]}, ensure_ascii=False)
    for i in range(5):
        try:
            req = urllib.request.Request("https://openspeech.bytedance.com/api/v3/tts/unidirectional",
                json.dumps({"user": {"uid": "krypto"}, "req_params": rp}).encode(),
                {"Content-Type": "application/json", "X-Api-Resource-Id": "seed-icl-2.0", "X-Api-Request-Id": str(uuid.uuid4())})
            pcm = bytearray()
            with urllib.request.urlopen(req, timeout=120) as r:
                for line in r:
                    line = line.strip()
                    if line:
                        d = json.loads(line)
                        if d.get("data"): pcm += base64.b64decode(d["data"])
            return np.frombuffer(bytes(pcm), dtype=np.int16)
        except Exception as e:
            time.sleep(2 ** (i + 1))
    raise SystemExit("tts failed")
def trim(a, th=300):                      # 去掉每句首尾静音，停顿统一由我们加
    idx = np.where(np.abs(a) > th)[0]
    return a[max(0, idx[0] - 1200): idx[-1] + 2400] if len(idx) else a
sents = [s for s in re.split(r"(?<=[。？！])", text) if s.strip()]
gap = np.zeros(int(pause * 48000), dtype=np.int16); parts = []
for s in sents: parts += [trim(synth(s)), gap]
a = np.concatenate(parts[:-1])
with wave.open(out, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(a.tobytes())
print(out, f"{len(a)/48000:.2f}s", len(sents), "sentences")
