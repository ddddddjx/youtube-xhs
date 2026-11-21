# -*- coding: utf-8 -*-
"""火山豆包语音合成的公共模块（11-21 起，explainer-film 和 youtube-xhs 共用）。

音色表 VOICES：名字 → speaker + resource。也可以直接传音色 ID：S_ 开头按复刻音色走 seed-icl-2.0，其余按官方音色走 seed-tts-2.0。
  本人      用户复刻音色（豆包声音复刻模型 2.0，resource seed-icl-2.0，要传 model 和 tone_fidelity）
  刘飞2.0   官方预置音色（豆包语音合成模型 2.0，resource seed-tts-2.0）

Key 不在这里：云端环境 Network secrets 给 openspeech.bytedance.com 配了 X-Api-Key，代理自动加头（见 README.md）。
Mac 本地用时设环境变量 VOLC_SPEECH_API_KEY，这里会自己加 X-Api-Key。
VOLC_TTS_FAKE=1 时不调接口，按字数出一段低音量正弦波，用来测剪辑流程，不扣费。

  python3 volc_tts.py 刘飞2.0 "要念的一句话" out.wav [--rate 0] [--ctx "语气指令"]
"""
import base64, hashlib, json, os, re, ssl, sys, time, uuid, wave, urllib.request, urllib.error
import numpy as np

SR = 48000
VOICES = {
    "本人": {"speaker": "S_DRo7Kc2k2", "resource": "seed-icl-2.0", "model": "seed-tts-2.0-expressive", "clone": True},
    "刘飞2.0": {"speaker": "zh_male_liufei_uranus_bigtts", "resource": "seed-tts-2.0"},
}
URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"


def voice(name_or_id):
    if name_or_id in VOICES:
        return VOICES[name_or_id]
    if name_or_id.startswith("S_"):
        return {"speaker": name_or_id, "resource": "seed-icl-2.0", "model": "seed-tts-2.0-expressive", "clone": True}
    return {"speaker": name_or_id, "resource": "seed-tts-2.0"}


def _ctx():
    ca = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
    return ssl.create_default_context(cafile=ca) if ca else None


def synth(text, v="刘飞2.0", rate=0, ctx=None, fidelity=False):
    """一句话 → int16 单声道 48k。火山偶尔 502，自动重试 5 次。权限没开通（45000030）直接报错不重试。"""
    vo = voice(v) if isinstance(v, str) else v
    if os.environ.get("VOLC_TTS_FAKE"):
        n = int(SR * max(0.6, len(text) * 0.22))
        t = np.arange(n) / SR
        return (np.sin(2 * np.pi * 220 * t) * 3000).astype(np.int16)
    rp = {"text": text, "speaker": vo["speaker"],
          "audio_params": {"format": "pcm", "sample_rate": SR, "speech_rate": rate}}
    if vo.get("clone"):
        rp["model"], rp["tone_fidelity"] = vo["model"], fidelity
    if ctx:
        rp["additions"] = json.dumps({"context_texts": [ctx]}, ensure_ascii=False)
    head = {"Content-Type": "application/json", "X-Api-Resource-Id": vo["resource"]}
    if os.environ.get("VOLC_SPEECH_API_KEY"):
        head["X-Api-Key"] = os.environ["VOLC_SPEECH_API_KEY"]
    err = None
    for i in range(5):
        try:
            req = urllib.request.Request(URL, json.dumps({"user": {"uid": "krypto"}, "req_params": rp}).encode(),
                                         {**head, "X-Api-Request-Id": str(uuid.uuid4())})
            pcm = bytearray()
            with urllib.request.urlopen(req, timeout=120, context=_ctx()) as r:
                for line in r:
                    line = line.strip()
                    if not line:
                        continue
                    d = json.loads(line)
                    if d.get("data"):
                        pcm += base64.b64decode(d["data"])
                    elif d.get("code") not in (0, 20000000, None):
                        raise RuntimeError(d)
            if not pcm:
                raise RuntimeError("返回了空音频")
            return np.frombuffer(bytes(pcm), dtype=np.int16)
        except urllib.error.HTTPError as e:
            body = e.read()[:300].decode("utf-8", "ignore")
            if "45000030" in body:
                raise SystemExit(f"音色 {vo['speaker']} 的服务没开通（{vo['resource']}）：{body}\n"
                                 "去火山控制台开通对应的语音合成服务；刚开通的等几分钟再试")
            err = f"{e.code} {body}"
        except Exception as e:  # noqa: BLE001
            err = e
        time.sleep(2 ** (i + 1))
    raise SystemExit(f"tts failed: {err}")


def trim(a, th=300):
    """去掉首尾静音，句间停顿统一由我们加。"""
    idx = np.where(np.abs(a) > th)[0]
    return a[max(0, idx[0] - 1200): idx[-1] + 2400] if len(idx) else a


def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[。？！?!])", text) if s.strip()]


def say(text, v="刘飞2.0", rate=0, ctx=None, pause=0.45, fidelity=False):
    """按句合成、句间插停顿（一口气念完的 AI 感最重）。返回 (音频, [(句子, 开始秒, 结束秒)])。"""
    gap = np.zeros(int(pause * SR), dtype=np.int16)
    parts, marks, t = [], [], 0.0
    for s in sentences(text):
        a = trim(synth(s, v, rate, ctx, fidelity))
        marks.append((s, t, t + len(a) / SR))
        parts += [a, gap]
        t += (len(a) + len(gap)) / SR
    return (np.concatenate(parts[:-1]) if parts else np.zeros(0, np.int16)), marks


def write_wav(path, a):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(a.tobytes())


def key(*parts):
    return hashlib.md5(json.dumps(parts, ensure_ascii=False).encode()).hexdigest()[:10]


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("voice"); ap.add_argument("text"); ap.add_argument("out")
    ap.add_argument("--rate", type=int, default=0); ap.add_argument("--ctx")
    a = ap.parse_args()
    audio, marks = say(a.text, a.voice, a.rate, a.ctx)
    write_wav(a.out, audio)
    print(f"{a.out}  {len(audio) / SR:.2f}s  {len(marks)} 句")
