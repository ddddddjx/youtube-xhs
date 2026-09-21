#!/bin/bash
# 把字幕压进视频（H.264 硬件编码，手机 / 小红书兼容）。
# 用法: burn.sh <工作目录> <输出.mp4> [bilingual|zh]
#   bilingual（默认）: 中文大字在上、英文小字在下；zh: 只压中文
# 需要先跑 merge_subs.py 生成 bilingual.ass
set -euo pipefail
WORK="$1"; OUT="$2"; MODE="${3:-bilingual}"
FF=~/bin/ffmpeg; [ -x "$FF" ] || FF=$(command -v ffmpeg)
# macOS 用硬件编码，其它环境退回 libx264
if "$FF" -hide_banner -encoders 2>/dev/null | grep -q h264_videotoolbox; then
  VENC=(-c:v h264_videotoolbox -b:v 4M -maxrate 6M -bufsize 8M)
else
  VENC=(-c:v libx264 -preset veryfast -crf 21)
fi
FONTS=/System/Library/Fonts; [ -d "$FONTS" ] || FONTS=/usr/share/fonts
ASS="$WORK/bilingual.ass"
if [ "$MODE" = "zh" ]; then
  grep -v ",EN,," "$ASS" > "$WORK/zh_only.ass"
  ASS="$WORK/zh_only.ass"
fi
# ass 滤镜路径里的特殊字符需要转义，统一 cd 进目录用相对路径
cd "$WORK"
"$FF" -hide_banner -loglevel error -stats -y -i video.mp4 \
  -vf "ass=$(basename "$ASS"):fontsdir=$FONTS" \
  "${VENC[@]}" -pix_fmt yuv420p \
  -c:a copy -movflags +faststart "$OUT"
echo "$OUT"
