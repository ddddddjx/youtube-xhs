#!/usr/bin/env python3
"""逐帧渲染 film.html：本地 http 服务 → 无头 Chromium → 每帧 renderFrame(t) → 读 canvas → ffmpeg。

uv run --with playwright==1.56.0 python -I render.py --stills 0.5,1.0,2.5 --out 静帧/
uv run --with playwright==1.56.0 python -I render.py --out 画面.mp4 [--fps 30] [--from 0 --to 42]
"""
import argparse, base64, functools, http.server, subprocess, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True)
ap.add_argument('--stills')
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--from', dest='t0', type=float, default=0)
ap.add_argument('--to', dest='t1', type=float)
a = ap.parse_args()

root = Path(__file__).resolve().parent


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x):
        pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_address[1]}/film.html'

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.goto(url)
    pg.evaluate('window.__ready')
    grab = "t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }"
    if a.stills:
        out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
        for s in a.stills.split(','):
            t = float(s)
            (out / f't{t:06.2f}.png').write_bytes(base64.b64decode(pg.evaluate(grab, t)))
        print('stills ->', out)
    else:
        t1 = a.t1 if a.t1 is not None else pg.evaluate('window.__total')
        n = round((t1 - a.t0) * a.fps)
        ff = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'png', '-i', '-',
                               '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-g', str(a.fps), '-movflags', '+faststart', a.out],
                              stdin=subprocess.PIPE)
        for i in range(n):
            ff.stdin.write(base64.b64decode(pg.evaluate(grab, a.t0 + i / a.fps)))
            if i % 150 == 0:
                print(f'{i}/{n}', flush=True)
        ff.stdin.close(); ff.wait()
        print('video ->', a.out)
    b.close()
srv.shutdown()
if errors:
    print('页面报错：', *errors, sep='\n  ', file=sys.stderr)
    sys.exit(1)
