# -*- coding: utf-8 -*-
"""参考配音：用户自己的复刻音色（S_DRo7Kc2k2），一个人分饰各角。
每个角色一条语气指令 + 一个变调量（rubberband 保共振峰），再按镜头时长压速。Key 由云端代理加头。
  python tts_lines.py            # 合成 shots.json 里所有带台词的镜 → vo/<镜号>.wav（48k 单声道）+ vo/lines.json
  python tts_lines.py 05 16      # 只重做这几镜
账号现在只开通了复刻音色，官方多音色用不了（11-19 探过，seed-tts 报 not granted）。"""
import base64, json, subprocess, sys, uuid, wave, urllib.request
from pathlib import Path
HERE = Path(__file__).resolve().parent; VO = HERE / 'vo'; VO.mkdir(exist_ok=True)
ROLES = {   # 语气指令、变调（半音）、语速、每秒字数上限
 '旁白':     ('纪录片旁白，男声中低，语速慢，平静克制，不加演绎，句尾收住', -1.0, 5, 3.4),
 '使者':     ('朝廷使者在宣读赐死的诏令，官腔，语气冰冷平板，没有感情', -2.0, 10, 3.8),
 '蒙恬少年': ('十六岁的少年，将门之子，声音明快爽朗，带着笑意和一点挑衅，像在跟同龄人下战书', 3.0, 25, 4.2),
 '嬴政少年': ('十五岁的少年，在异国当了多年人质，清冷克制，话少，声音略哑，句尾收得干脆', 2.0, 15, 4.2),
 '嬴政秦王': ('三十岁的君王，声音低沉，有胸腔共鸣，语速慢，句与句之间留空，威严但克制', -3.0, 5, 4.0),
 '蒙恬将军': ('四十岁的将军，声音厚重沉稳，句尾下沉，对君王说话，恭敬而坚定', -4.5, 10, 4.0),
}
def synth(text, ctx, rate):
    body = {"user": {"uid": "krypto"}, "req_params": {"text": text, "speaker": "S_DRo7Kc2k2", "model": "seed-tts-2.0-expressive", "tone_fidelity": False,
            "audio_params": {"format": "pcm", "sample_rate": 48000, "speech_rate": rate}, "additions": json.dumps({"context_texts": [ctx]}, ensure_ascii=False)}}
    req = urllib.request.Request("https://openspeech.bytedance.com/api/v3/tts/unidirectional", json.dumps(body).encode(),
          {"Content-Type": "application/json", "X-Api-Resource-Id": "seed-icl-2.0", "X-Api-Request-Id": str(uuid.uuid4())})
    pcm = bytearray()
    with urllib.request.urlopen(req, timeout=120) as r:
        for line in r:
            line = line.strip()
            if not line: continue
            d = json.loads(line)
            if d.get("data"): pcm += base64.b64decode(d["data"])
            elif d.get("code") not in (0, 20000000, None): sys.exit(f"error: {d}")
    return bytes(pcm)
def dur(p):
    with wave.open(str(p)) as w: return w.getnframes() / w.getframerate()
shots = json.loads((HERE / 'shots.json').read_text(encoding='utf-8'))['shots']; only = set(sys.argv[1:]); info = {}
old = VO / 'lines.json'
if old.exists(): info = json.loads(old.read_text(encoding='utf-8'))
for s in shots:
    if 'text' not in s or (only and s['id'] not in only): continue
    ctx, semi, rate, _ = ROLES[s['who']]; raw = VO / f"{s['id']}_raw.wav"; out = VO / f"{s['id']}.wav"
    with wave.open(str(raw), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(synth(s['text'], ctx, rate))
    d0 = dur(raw); room = s['dur'] - 0.45                      # 切点后 0.3 秒起，尾上留一点
    tempo = min(1.3, max(1.0, d0 / room))                      # 念不完就压速，最多 1.3 倍
    # 去头尾静音 → 变调（保共振峰）→ 压速
    af = f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,rubberband=pitch={2 ** (semi / 12):.5f}:tempo={tempo:.4f}:formant=preserved"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw), '-af', af, '-ar', '48000', '-ac', '1', str(out)], check=True)
    d1 = dur(out); info[s['id']] = {'who': s['who'], 'text': s['text'], 'raw': round(d0, 2), 'dur': round(d1, 2), 'tempo': round(tempo, 3), 'shot': s['dur']}
    print(s['id'], s['who'], f"原 {d0:.2f}s → {d1:.2f}s（镜 {s['dur']}s，压速 {tempo:.2f}）", '⚠ 仍超出' if d1 > s['dur'] - 0.2 else '', flush=True)
old.write_text(json.dumps(info, ensure_ascii=False, indent=1), encoding='utf-8')
