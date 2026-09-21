"""没有现成字幕的视频（X / Twitter 等）用 Whisper 本地转写成 srt。
Apple Silicon 用 mlx-whisper（GPU），首次运行会下载模型 ~1.6GB。

用法: python3 transcribe.py <工作目录> [--lang en|zh|auto] [--model 模型名]
  读 <工作目录>/video.mp4，写：
    en.srt（讲英文）或 zh.srt（讲中文）；其它语言写 src.srt
    asr_lang.txt   检测到的语言代码
    asr_check.txt  识别置信度低的句子（时间 + 原文），翻译前要对照视频 / 推文核对
  音乐、静音段里 Whisper 常幻觉出「Thank you」「you」「谢谢观看」之类，低置信度时自动丢弃
  字幕按句切，每条 ≤ 14 个英文词 / 28 个汉字、≤ 7 秒，适合压制

依赖: uv tool install mlx-whisper（脚本会自动找 ~/.local/share/uv/tools/mlx-whisper 的 Python 重新执行自己）
"""
import argparse
import os
import re
import shutil
import subprocess
import sys

TOOL_PY = os.path.expanduser("~/.local/share/uv/tools/mlx-whisper/bin/python")
MODEL = "mlx-community/whisper-large-v3-turbo"

try:
    import mlx_whisper
except ImportError:
    if os.path.exists(TOOL_PY) and os.path.realpath(sys.executable) != os.path.realpath(TOOL_PY):
        os.execv(TOOL_PY, [TOOL_PY, *sys.argv])
    sys.exit("缺少 mlx-whisper：先跑 `uv tool install mlx-whisper`（没有 uv：`curl -LsSf https://astral.sh/uv/install.sh | sh`）")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from merge_subs import fmt_srt  # noqa: E402

MAX_WORDS, MAX_CJK, MAX_SEC = 14, 28, 7.0
CJK = re.compile(r"[一-鿿]")
HALLU = re.compile(
    r"^\W*(thank you( (so much|very much|for watching))?|thanks( for watching)?|you|bye|"
    r"(please )?subscribe.*|like and subscribe.*|謝謝觀看|谢谢(观看|收看|大家)?|"
    r"字幕(由|提供|志愿者).*|请不吝点赞.*|明镜与点点栏目.*)\W*$", re.I)
END = re.compile(r"[.!?。！？]$")
SOFT = re.compile(r"[,;:，；：、]$")


def ffmpeg():
    local = os.path.expanduser("~/bin/ffmpeg")
    return local if os.path.exists(local) else shutil.which("ffmpeg")


def length(words):
    text = "".join(w["word"] for w in words)
    return len(CJK.findall(text)) / 2 + len(re.findall(r"[A-Za-z0-9']+", text))


def split_words(words):
    """把 Whisper 的词级时间戳重新切成适合字幕的短句"""
    cues, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        t = w["word"].strip()
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 99
        dur = w["end"] - cur[0]["start"]
        n = length(cur)
        if (not nxt or gap > 0.8 or END.search(t)
                or (SOFT.search(t) and n >= MAX_WORDS * 0.5)
                or n >= MAX_WORDS or dur >= MAX_SEC):
            cues.append(cur)
            cur = []
    out = []
    for c in cues:
        text = "".join(w["word"] for w in c).strip()
        if CJK.search(text):
            text = re.sub(r"\s+", "", text)
        if text:
            out.append((c[0]["start"], max(c[-1]["end"], c[0]["start"] + 0.6), text))
    # 结束时间不压到下一条
    for i in range(len(out) - 1):
        s, e, t = out[i]
        out[i] = (s, min(e, out[i + 1][0]), t)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("--lang", default="auto")
    ap.add_argument("--model", default=MODEL)
    args = ap.parse_args()

    wav = os.path.join(args.work, "audio16k.wav")
    if not os.path.exists(wav):
        subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y",
                        "-i", os.path.join(args.work, "video.mp4"),
                        "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    print(f"转写中（{args.model}）…", flush=True)
    res = mlx_whisper.transcribe(
        wav, path_or_hf_repo=args.model, word_timestamps=True,
        language=None if args.lang == "auto" else args.lang,
        condition_on_previous_text=False,       # 减少幻觉 / 重复
        hallucination_silence_threshold=2.0,
        initial_prompt="Hello, welcome. Let's get started." if args.lang == "en" else None,
    )
    lang = res.get("language") or args.lang
    keep, low = [], []
    for seg in res["segments"]:
        ws = seg.get("words") or []
        if not ws:
            continue
        minp = min(w["probability"] for w in ws)
        if HALLU.match(seg["text"].strip()) and (minp < 0.5 or seg.get("no_speech_prob", 0) > 0.5):
            print(f"丢弃疑似幻觉 {fmt_srt(seg['start'])} {seg['text'].strip()}")
            continue
        if seg.get("avg_logprob", 0) < -1.0 or minp < 0.05:
            low.append(f"{fmt_srt(seg['start'])}  {seg['text'].strip()}")
        keep.append(seg)
    words = [w for seg in keep for w in seg["words"]]
    cues = split_words(words)
    name = {"en": "en.srt", "zh": "zh.srt"}.get(lang, "src.srt")
    with open(os.path.join(args.work, name), "w", encoding="utf-8") as f:
        for i, (s, e, t) in enumerate(cues, 1):
            f.write(f"{i}\n{fmt_srt(s)} --> {fmt_srt(e)}\n{t}\n\n")
    open(os.path.join(args.work, "asr_lang.txt"), "w").write(lang + "\n")
    open(os.path.join(args.work, "asr_check.txt"), "w", encoding="utf-8").write("\n".join(low) + "\n")
    if low:
        print(f"{len(low)} 句置信度低，见 asr_check.txt")
    print(f"语言 {lang}，{len(cues)} 条 → {name}")


if __name__ == "__main__":
    main()
