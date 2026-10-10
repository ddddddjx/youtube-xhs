"""Kokoro offline voice with misaki's Chinese G2P (pinyin tones) instead of espeak-ng.
python tools/tts_misaki.py lines.json voices/ [--voice zm_yunxi] [--speed 1.0]
Each line: {id, text, say?}; `say` is what is spoken when it differs from the subtitle text.
Writes voices/<id>.wav (24 kHz, trimmed), voices/dur.json, voices/phonemes.json."""
import sys, os, json, argparse, numpy as np, soundfile as sf
ap = argparse.ArgumentParser(); ap.add_argument('lines'); ap.add_argument('out')
ap.add_argument('--voice', default='zm_yunxi'); ap.add_argument('--speed', type=float, default=1.0)
a = ap.parse_args()
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
from kokoro_onnx import Kokoro
from misaki import zh
k = Kokoro(os.path.join(LIB, 'core/tts/kokoro-v1.0.onnx'), os.path.join(LIB, 'core/tts/voices-v1.0.bin'))
g2p = zh.ZHG2P(); vocab = k.tokenizer.vocab
os.makedirs(a.out, exist_ok=True); dur, phs = {}, {}
for L in json.load(open(a.lines, encoding='utf-8')):
    r = g2p(L.get('say', L['text'])); ph = r if isinstance(r, str) else r[0]
    lost = sorted({c for c in ph if c not in vocab and c != ' '})
    if lost: sys.exit(f"line {L['id']}: phonemes not in Kokoro's vocab: {lost} ({ph})")
    wav, sr = k.create(ph, voice=L.get('voice', a.voice), speed=L.get('speed', a.speed), is_phonemes=True)
    nz = np.where(np.abs(wav) > np.abs(wav).max() * .02)[0]
    wav = wav[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.08 * sr)]
    sf.write(os.path.join(a.out, L['id'] + '.wav'), wav, sr)
    dur[L['id']] = round(len(wav) / sr, 3); phs[L['id']] = ph
    print(L['id'], dur[L['id']], ph)
json.dump(dur, open(os.path.join(a.out, 'dur.json'), 'w'), indent=1)
json.dump(phs, open(os.path.join(a.out, 'phonemes.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
