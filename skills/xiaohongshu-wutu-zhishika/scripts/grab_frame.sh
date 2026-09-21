#!/bin/bash
# 按时间点抽原分辨率帧，可选裁剪（例如只保留投影幕布 / PPT 区域）。
# 用法: grab_frame.sh <video> <秒数或 HH:MM:SS> <输出.png> [crop=w:h:x:y]
#   crop 按原视频像素（1920x1080）计算；不传则整帧输出。
# 例:  grab_frame.sh video.mp4 380 ev_01.png 1040:620:360:0
set -euo pipefail
VIDEO="$1"; T="$2"; OUT="$3"; CROP="${4:-}"
FF=~/bin/ffmpeg; [ -x "$FF" ] || FF=ffmpeg
VF="null"
[ -n "$CROP" ] && VF="crop=$CROP"
# -ss 放在 -i 之前：跳到最近关键帧再解码到目标时间，精确且快（放在 -i 之后会从头解码，长视频要几分钟）
"$FF" -hide_banner -loglevel error -y -ss "$T" -i "$VIDEO" -vf "$VF" -frames:v 1 -update 1 "$OUT"
echo "$OUT"
