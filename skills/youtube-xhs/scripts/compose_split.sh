#!/bin/bash
# 分屏成片：上半屏原视频（带黄底中英字幕），下半屏补充知识卡。
# 用法: compose_split.sh <工作目录> <下半屏.png> <输出.mp4> [ass文件名]
#   工作目录里要有 video.mp4 和 merge_subs.py 生成的 ass（默认 bilingual_box.ass）
#   下半屏.png 用 render_panel.py 出，默认 1080x832
# 画布 1080x1440（小红书竖版视频）：视频缩到 1080 宽居中放上半屏，剩下的贴知识卡。
set -euo pipefail
WORK="$1"; PANEL="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"; OUT="$3"; ASS="${4:-bilingual_box.ass}"
CW=1080; CH=1440
FF=~/bin/ffmpeg; [ -x "$FF" ] || FF=$(command -v ffmpeg)
if "$FF" -hide_banner -encoders 2>/dev/null | grep -q h264_videotoolbox; then
  VENC=(-c:v h264_videotoolbox -b:v 5M -maxrate 7M -bufsize 10M)
else
  VENC=(-c:v libx264 -preset veryfast -crf 21)
fi
FONTS=/System/Library/Fonts; [ -d "$FONTS" ] || FONTS=/usr/share/fonts

# 下半屏高度按知识卡实际高度来，视频区 = 画布高 - 知识卡高
# ffmpeg -i 只读信息时退出码是 1，pipefail 下要吃掉，否则脚本在这里就退出了
PH=$({ "$FF" -hide_banner -i "$PANEL" 2>&1 || true; } | sed -n 's/.*, \([0-9]\{2,\}\)x\([0-9]\{2,\}\).*/\2/p' | head -1)
VH=$((CH - PH))
[ "$VH" -gt 100 ] || { echo "下半屏太高（${PH}px），画布放不下视频"; exit 1; }

cd "$WORK"
[ -f "$ASS" ] || { echo "找不到 $ASS，先跑 merge_subs.py"; exit 1; }
# 字幕先按原分辨率烧进画面，再整体缩放；视频在上半屏垂直居中，空隙用米白填
"$FF" -hide_banner -loglevel error -stats -y -i video.mp4 -i "$PANEL" \
  -filter_complex "[0:v]ass=$ASS:fontsdir=$FONTS,scale=$CW:-2,pad=$CW:$VH:0:(oh-ih)/2:color=0xF7F2E8,\
pad=$CW:$CH:0:0:color=0xF7F2E8[bg];[bg][1:v]overlay=0:$VH[v]" \
  -map "[v]" -map 0:a? "${VENC[@]}" -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart "$OUT"
echo "$OUT"
