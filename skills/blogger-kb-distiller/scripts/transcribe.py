#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
转写辅助：把视频变成可熔合的逐字稿文本。

策略（按优先级）：
  1. 优先用现成字幕：01_视频/{file} 同名的 .srt/.vtt/.ass -> 清洗时间戳 -> 03_逐字稿/{num:02d}_{title}.txt
  2. 无字幕且 whisper 可用 -> 用 openai-whisper 转写（需自行 pip install openai-whisper）
  3. 否则跳过并给出明确提示（需用户在 adapter 阶段确保拿到文字）

用法:
  python transcribe.py <workdir>

依赖: <workdir>/_ingest.json（含 items: num/title/file）与 01_视频/ 媒体文件
"""
import json
import os
import re
import sys
import glob

SUB_RE = re.compile(r"\d{2}:\d{2}:\d{2}[,.]\d{3}.*")
TAG_RE = re.compile(r"<[^>]+>")


def subtitle_to_text(path):
    """读取 srt/vtt/ass，去时间戳与标签，拼成纯文本段落。"""
    lines = open(path, encoding="utf-8", errors="ignore").read().splitlines()
    out = []
    buf = []
    for ln in lines:
        s = ln.strip()
        if not s:
            if buf:
                out.append("".join(buf))
                buf = []
            continue
        if TAG_RE.search(s) or SUB_RE.match(s) or re.match(r"^\d+$", s):
            continue  # 标签/时间轴/序号行
        buf.append(s)
    if buf:
        out.append("".join(buf))
    return "\n".join(out)


def main():
    if len(sys.argv) < 2:
        print("usage: python transcribe.py <workdir>")
        sys.exit(1)
    workdir = sys.argv[1]
    ingest = os.path.join(workdir, "_ingest.json")
    if not os.path.exists(ingest):
        print(f"[ERR] 找不到 {ingest}")
        sys.exit(1)
    items = json.load(open(ingest, encoding="utf-8")).get("items", [])
    vid_dir = os.path.join(workdir, "01_视频")
    art_dir = os.path.join(workdir, "03_逐字稿")
    os.makedirs(art_dir, exist_ok=True)

    try:
        import whisper  # noqa
        whisper_ok = True
    except Exception:
        whisper_ok = False

    done = skip = fail = 0
    for it in items:
        num = it.get("num")
        title = it.get("title", "")
        vfile = it.get("file", "")
        vpath = os.path.join(vid_dir, vfile) if vfile else None
        if not vpath or not os.path.exists(vpath):
            # 尝试按标题/编号模糊匹配
            cands = glob.glob(os.path.join(vid_dir, f"{num:02d}_*")) if isinstance(num, int) else []
            vpath = cands[0] if cands else None
        out_path = os.path.join(art_dir, f"{num:02d}_{title}.txt")

        # 1) 现成字幕
        stem = os.path.splitext(vpath)[0] if vpath else None
        sub = None
        for ext in (".srt", ".vtt", ".ass"):
            if stem and os.path.exists(stem + ext):
                sub = stem + ext
                break
        if sub:
            txt = subtitle_to_text(sub)
            open(out_path, "w", encoding="utf-8").write(txt)
            done += 1
            continue

        # 2) whisper
        if whisper_ok and vpath and os.path.exists(vpath):
            try:
                model = whisper.load_model("base")
                res = model.transcribe(vpath, language="zh")
                open(out_path, "w", encoding="utf-8").write(res.get("text", ""))
                done += 1
                continue
            except Exception as e:
                print(f"[WARN] whisper 转写失败 {vpath}: {e}")

        # 3) 跳过
        if os.path.exists(out_path):
            skip += 1
        else:
            print(f"[SKIP] 无字幕且无法转写：num={num} {title}（请检查 01_视频/ 或在 adapter 阶段确保有文字）")
            fail += 1

    print(f"[OK] 转写完成：字幕/whisper 成功 {done}，已存在跳过 {skip}，需人工 {fail}")
    if fail and not whisper_ok:
        print("[提示] 需转写视频但 whisper 不可用：在隔离 venv 执行 `pip install openai-whisper` 后重跑本脚本。")


if __name__ == "__main__":
    main()
