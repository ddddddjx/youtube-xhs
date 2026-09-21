#!/usr/bin/env python3
"""下载 YouTube 视频 + 英文字幕 + YouTube 官方中文翻译字幕，并输出视频信息。
X / Twitter 链接（x.com / twitter.com）走 fetch_x()：下视频 + 推文信息，再用 transcribe.py 本地转写字幕。

用法:
  python3 fetch.py <URL> <工作目录> [--subs-only]
  X 链接额外参数: --item N（一条推文有多个视频时选第 N 个）
                 --cookies chrome（需要登录才能看的推文，读 Chrome 登录态；先征得用户同意）
                 --no-asr（只下载不转写）

工作目录产物:
  video.mp4            ≤1080p（--subs-only 时不下载）
  video.info.json      元数据（标题 / 频道 / 时长 / 许可 / 章节）
  en.srt               英文字幕（优先人工字幕，没有才用自动字幕）
  zh.srt               中文字幕（YouTube 官方机器翻译，优先翻译自人工字幕那条轨）
  meta.txt             摘要：标题、频道、时长、许可、字幕来源、章节

限流（HTTP 429）自动退避重试：1 → 2 → 4 → 8 → 8 分钟，约 23 分钟后放弃。
已经下好的文件不会重复下载，失败后直接重跑同一条命令即可续上。
依赖: ~/bin/yt-dlp（官方独立版）、~/bin/ffmpeg
"""
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import time

def _find(name):
    local = os.path.expanduser(f"~/bin/{name}")
    return local if os.path.exists(local) else shutil.which(name)


YTDLP = _find("yt-dlp")
_ff = _find("ffmpeg")
FFDIR = os.path.dirname(_ff) if _ff else None
BACKOFF = [60, 120, 240, 480, 480]


def ytdlp(args):
    if not YTDLP:
        sys.exit("找不到 yt-dlp：本地请放到 ~/bin/yt-dlp；云端可试 pip install yt-dlp")
    base = [YTDLP, "--no-playlist"] + (["--ffmpeg-location", FFDIR] if FFDIR else [])
    for i in range(len(BACKOFF) + 1):
        p = subprocess.run(base + args, capture_output=True, text=True)
        if "429" not in p.stderr and "Too Many Requests" not in p.stderr:
            return p
        if i == len(BACKOFF):
            break
        print(f"YouTube 限流(429)，{BACKOFF[i] // 60} 分钟后重试 {i + 1}/{len(BACKOFF)}", flush=True)
        time.sleep(BACKOFF[i])
    return p


def pick_tracks(info):
    """返回 (英文轨, 英文来源, 中文轨, 中文来源)。"""
    human = [k for k in info.get("subtitles", {}) if k == "en" or k.startswith("en-")]
    auto = info.get("automatic_captions", {})
    if human:
        en_key, en_src = human[0], "人工字幕"
    elif "en-orig" in auto or "en" in auto:
        en_key, en_src = ("en-orig" if "en-orig" in auto else "en"), "自动字幕"
    else:
        return None, None, None, None
    if f"zh-Hans-{en_key}" in auto:
        return en_key, en_src, f"zh-Hans-{en_key}", f"YouTube 机器翻译（译自{en_src}）"
    if "zh-Hans" in auto:
        return en_key, en_src, "zh-Hans", "YouTube 机器翻译（译自自动英文字幕，质量较差）"
    return en_key, en_src, None, None


def opt(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def is_x(url):
    return re.search(r"(^|//|\.)(x|twitter)\.com/|//t\.co/", url) is not None


def fetch_x(url, work):
    out = os.path.join(work, "video.%(ext)s")
    args = ["-o", out, "--write-info-json",
            "-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b", "--merge-output-format", "mp4"]
    if opt("--item"):
        args = ["--yes-playlist", "--playlist-items", opt("--item")] + args
    if opt("--cookies"):
        args += ["--cookies-from-browser", opt("--cookies")]
    if not os.path.exists(os.path.join(work, "video.mp4")):
        print("下载 X 视频…", flush=True)
        p = ytdlp(args + [url])
        if not os.path.exists(os.path.join(work, "video.mp4")):
            err = p.stderr[-1500:]
            hint = ""
            if "No video could be found" in err or "no video" in err.lower():
                hint = "\n这条推文里没有视频（可能是图片 / 外链卡片；外链是 YouTube 就直接用 YouTube 链接）"
            elif re.search(r"login|log in|authenticat|NSFW|age|protected|suspended", err, re.I):
                hint = "\n需要登录才能看：征得用户同意后加 --cookies chrome 重跑"
            sys.exit("X 视频下载失败：\n" + err + hint)
    info_path = os.path.join(work, "video.info.json")
    info = json.load(open(info_path)) if os.path.exists(info_path) else {}
    lang = ""
    if "--no-asr" not in sys.argv and not glob.glob(os.path.join(work, "asr_lang.txt")):
        here = os.path.dirname(os.path.abspath(__file__))
        subprocess.run([sys.executable, os.path.join(here, "transcribe.py"), work], check=True)
    if os.path.exists(os.path.join(work, "asr_lang.txt")):
        lang = open(os.path.join(work, "asr_lang.txt")).read().strip()
    ts = info.get("timestamp")
    date = time.strftime("%Y-%m-%d", time.localtime(ts)) if ts else info.get("upload_date")
    dur = info.get("duration") or 0
    handle = info.get("uploader_id") or info.get("channel_id") or ""
    meta = [
        "平台: X / Twitter",
        f"作者: {info.get('uploader')} (@{handle})",
        f"推文: {(info.get('description') or '').strip()}",
        f"时长: {int(dur) // 60}:{int(dur) % 60:02}   发布: {date}",
        f"链接: {info.get('webpage_url') or url}",
        f"数据: 点赞 {info.get('like_count')} / 转推 {info.get('repost_count')} / 评论 {info.get('comment_count')}",
        "许可: X 用户内容，版权归发布者（及视频原始出处），未声明可再利用",
        f"字幕: Whisper 本地转写（语言 {lang or '未转写'}），另一种语言需要 Claude 翻译",
    ]
    open(os.path.join(work, "meta.txt"), "w").write("\n".join(meta) + "\n")
    print("\n".join(meta))


def main():
    url, work = sys.argv[1], sys.argv[2]
    subs_only = "--subs-only" in sys.argv
    os.makedirs(work, exist_ok=True)
    if is_x(url):
        return fetch_x(url, work)
    out = os.path.join(work, "video.%(ext)s")
    info_path = os.path.join(work, "video.info.json")

    # 1. 元数据。人工字幕的中文译本在列表里时有时无，没看到就再拉两次
    for attempt in range(3):
        print("获取视频信息…", flush=True)
        p = ytdlp(["--skip-download", "--write-info-json", "-o", out, url])
        if not os.path.exists(info_path):
            sys.exit("获取视频信息失败：\n" + p.stderr[-1500:])
        info = json.load(open(info_path))
        en_key, en_src, zh_key, zh_src = pick_tracks(info)
        if en_key is None:
            sys.exit("这个视频没有英文字幕")
        if en_src != "人工字幕" or zh_key == f"zh-Hans-{en_key}":
            break
        time.sleep(20)
    if zh_key is None:
        sys.exit("YouTube 没有提供中文翻译字幕")

    # 2. 一次请求下载视频 + 两条字幕（请求越少越不容易被限流）
    need_video = not subs_only and not os.path.exists(os.path.join(work, "video.mp4"))
    need_en = not os.path.exists(os.path.join(work, "en.srt"))
    need_zh = not os.path.exists(os.path.join(work, "zh.srt"))
    langs = [k for k, need in [(en_key, need_en), (zh_key, need_zh)] if need]
    if need_video or langs:
        args = ["-o", out, "--sleep-subtitles", "3"]
        if need_video:
            args += ["-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
                     "--merge-output-format", "mp4"]
        else:
            args.append("--skip-download")
        if langs:
            args += ["--write-subs", "--write-auto-subs", "--sub-langs", ",".join(langs),
                     "--sub-format", "vtt", "--convert-subs", "srt"]
        print(f"下载{'视频 + ' if need_video else ''}字幕 {', '.join(langs)}…", flush=True)
        p = ytdlp(args + [url])
        for key, name in [(en_key, "en"), (zh_key, "zh")]:
            got = glob.glob(os.path.join(work, f"video.{key}.srt"))
            if got:
                shutil.move(got[0], os.path.join(work, f"{name}.srt"))
        missing = [n for n in ["en.srt", "zh.srt"] if not os.path.exists(os.path.join(work, n))]
        if need_video and not os.path.exists(os.path.join(work, "video.mp4")):
            missing.append("video.mp4")
        if missing:
            sys.exit(f"缺少 {missing}，稍后重跑同一条命令续传：\n" + p.stderr[-1000:])

    lic = info.get("license") or "Standard YouTube License（未声明可再利用）"
    meta = [
        f"标题: {info.get('title')}",
        f"频道: {info.get('channel')}  ({info.get('channel_url')})",
        f"时长: {info.get('duration_string')}   上传: {info.get('upload_date')}",
        f"链接: {info.get('webpage_url')}",
        f"许可: {lic}",
        f"英文字幕: {en_src} ({en_key})",
        f"中文字幕: {zh_src} ({zh_key})",
    ]
    if info.get("chapters"):
        meta.append("章节:")
        for c in info["chapters"]:
            s = int(c["start_time"])
            meta.append(f"  {s // 60:02}:{s % 60:02} {c['title']}")
    open(os.path.join(work, "meta.txt"), "w").write("\n".join(meta) + "\n")
    print("\n".join(meta))


if __name__ == "__main__":
    main()
