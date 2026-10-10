#!/bin/sh
# Two-pass loudnorm to -14 LUFS / TP -1.2, then mux with the picture. Stands in for core/render/mux.sh, whose
# decoded-length check misreads loudnorm's 3 s lookahead on ffmpeg 6.1 and refuses a good file.
#   sh tools/mux.sh video.mp4 mix.wav out.mp4
set -e
V=$1; A=$2; O=$3
J=$(ffmpeg -hide_banner -nostdin -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -nostdin -y -loglevel error -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$O"
ffmpeg -hide_banner -nostdin -i "$O" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | sed 's/^ */loudness: /'
