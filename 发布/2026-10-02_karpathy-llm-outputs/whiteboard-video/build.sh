#!/bin/sh
# 让 AI 说人话 — vertical whiteboard explainer. One command rebuilds the film from this folder.
#   sh build.sh [--vo]      --vo re-synthesises the voice (Kokoro offline + misaki Chinese G2P)
# Needs the Lemo-Opuscar library (default ~/lemo-opuscar) with `setup.sh deps voice` and `fetch.sh instruments vcsl`,
# and `uv pip install "misaki[zh]"` in its .venv. On machines where Playwright's own browser is missing, set PLAYWRIGHT_CHROME.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY=$LIB/.venv/bin/python; SIZE=1080x1920
cd "$LIB"
[ "$1" = "--vo" ] && $PY "$HERE/tools/tts_misaki.py" "$HERE/lines.json" "$HERE/voices"
node core/render/events.mjs "$HERE" --size $SIZE
$PY "$HERE/music.py"
$PY "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size $SIZE --out "$HERE/out/video.mp4"
sh "$HERE/tools/mux.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/karpathy-whiteboard.mp4"
$PY "$HERE/tools/subs.py" && $PY core/render/srt.py "$HERE/out/cues.json" "$HERE/karpathy-whiteboard.srt"
node core/render/still.mjs "$HERE" 30.6 --size $SIZE --q 'nosubs=1&nopens=1' --prefix poster_ --out "$HERE/out" && cp "$HERE/out/poster_30.6.jpg" "$HERE/poster.jpg"
echo "built $HERE/karpathy-whiteboard.mp4"
