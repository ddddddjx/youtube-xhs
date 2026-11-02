# -*- coding: utf-8 -*-
"""素材准备：用户上传的几段 mp4 → 合并 → 抽音频 → 每 15 秒一帧的拼图 → Whisper 全文转录（带词级时间戳）。
  python prepare.py <工作目录> part-00.mp4 part-01.mp4 ...
产出（都在 <工作目录> 下）：src/full.mp4、src/full.wav（16k 单声道）、sheets/sheet_NN.jpg、transcript.json、transcript.txt
- Whisper 用 faster-whisper small.en（英文素材；中文素材换 small 并把 language 改 zh），CPU int8，21 分钟音频约 15 分钟
- faster-whisper 自带的 av 解码在这台机器上版本不兼容（open() got unexpected keyword 'metadata_errors'），所以用 wave + numpy 自己读
- HF 模型现在能直接下载（11-02 测过）；装不上就 pip install faster-whisper
- src/ 不进 git（.gitignore 已排除）
"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

P = Path(sys.argv[1]).resolve(); parts = [Path(x).resolve() for x in sys.argv[2:]]
(P / "src").mkdir(parents=True, exist_ok=True); (P / "sheets").mkdir(exist_ok=True)
full, wav = P / "src/full.mp4", P / "src/full.wav"
if not full.exists():
    lst = P / "src/list.txt"; lst.write_text("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(full)], check=True)
if not wav.exists():
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(full), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(full)]))
print(f"full.mp4 {dur:.1f}s")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(full), "-vf", "fps=1/15,scale=400:-1,tile=4x4", str(P / "sheets/sheet_%02d.jpg")], check=True)
print("sheets:", sorted(x.name for x in (P / "sheets").glob("*.jpg")))

if (P / "transcript.json").exists():
    print("transcript.json 已存在，跳过转录"); sys.exit()
from faster_whisper import WhisperModel
lang = "en"
m = WhisperModel("small.en" if lang == "en" else "small", device="cpu", compute_type="int8", cpu_threads=4)
w = wave.open(str(wav)); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
segs, _ = m.transcribe(a, language=lang, word_timestamps=True, vad_filter=True, beam_size=5)
out = []
for s in segs:
    out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                "words": [[round(x.start, 2), round(x.end, 2), x.word] for x in s.words]})
    print(f"[{s.start:7.1f}] {s.text.strip()}", flush=True)
(P / "transcript.json").write_text(json.dumps(out, ensure_ascii=False))
(P / "transcript.txt").write_text("\n".join(f"[{s['start']:7.1f}-{s['end']:7.1f}] {s['text']}" for s in out))
print(len(out), "segments")
