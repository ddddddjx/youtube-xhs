#!/bin/bash
# 抽片头 / 片尾各 N 秒的总览图，给 AI 找「All rights reserved」「Copyright」「版权所有」、
# 机构 logo 版权页之类需要删掉的片段。
# 用法: scan_edges.sh <video.mp4> <输出目录> [秒数，默认 30]
# 输出: head.jpg（0s 起）、tail.jpg（结尾前 N 秒起），每秒 2 帧，6 列一行 = 每行 3 秒
set -euo pipefail
VIDEO="$1"; OUT="$2"; N="${3:-30}"
FF=~/bin/ffmpeg; [ -x "$FF" ] || FF=$(command -v ffmpeg)
mkdir -p "$OUT"
FONT=/System/Library/Fonts/Supplemental/Arial.ttf
[ -f "$FONT" ] || FONT=$(fc-match -f '%{file}' sans 2>/dev/null || true)
ROWS=$(( (N * 2 + 5) / 6 ))
VF="fps=2,scale=480:-1,drawtext=fontfile=${FONT}:text='%{pts\:hms}':x=8:y=8:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=6x${ROWS}"
"$FF" -hide_banner -loglevel error -y -t "$N" -i "$VIDEO" -vf "$VF" -frames:v 1 "$OUT/head.jpg"
"$FF" -hide_banner -loglevel error -y -sseof "-$N" -i "$VIDEO" -vf "$VF" -frames:v 1 "$OUT/tail.jpg"
DUR=$( ("$FF" -i "$VIDEO" 2>&1 || true) | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' | head -1 || true)
echo "时长 $DUR"
echo "$OUT/head.jpg  （时间戳 = 视频内时间）"
echo "$OUT/tail.jpg  （时间戳从 0 起，实际时间 = 时长 - $N + 时间戳）"
