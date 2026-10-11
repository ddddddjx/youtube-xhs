#!/usr/bin/env python3
"""逐帧渲染一个片子工程 → 无声画面 mp4（声音由 sound.py 另混）。

  uv run --with playwright==1.56.0 python render.py <工程目录> --out 画面.mp4 [--fps 30] [--from 0 --to 10]
  uv run --with playwright==1.56.0 python render.py <工程目录> --stills 0.5,3,8 --out 静帧/      只出几张 png
  ... --layout layout.json                                                                     顺带每 0.5 秒导出文字框（qa.py 用）

工程目录里要有 film.js（export async function setup(ctx) → update(t)）和 timeline.json（timeline.py 生成）。
画幅读 timeline.json 的 format：9:16 → 1080×1920，16:9 → 1920×1080；--scale 0.5 出半分辨率草稿。
云端没有显卡：Chromium 用 SwiftShader 软件渲染，慢；整片渲染放后台跑。
"""
import argparse, base64, functools, http.server, json, os, socketserver, subprocess, sys, tempfile, threading, time
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument('proj')
ap.add_argument('--out', required=True)
ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--from', dest='t0', type=float, default=0)
ap.add_argument('--to', dest='t1', type=float)
ap.add_argument('--stills')
ap.add_argument('--scale', type=float, default=1.0)
ap.add_argument('--crf', type=int, default=20)
ap.add_argument('--layout')
a = ap.parse_args()

ENGINE = Path(__file__).resolve().parent.parent / 'engine'
PROJ = Path(a.proj).resolve()
if not (ENGINE / 'node_modules' / 'three').exists():
    print('首次使用：安装引擎依赖（three + 字体）…', file=sys.stderr)
    subprocess.run(['npm', 'i', '--silent'], cwd=ENGINE, check=True)
tl = json.load(open(PROJ / 'timeline.json', encoding='utf-8'))
W, H = (1080, 1920) if tl.get('format', '9:16') == '9:16' else (1920, 1080)
W, H = int(W * a.scale) // 2 * 2, int(H * a.scale) // 2 * 2

root = Path(tempfile.mkdtemp(prefix='sf_'))
(root / 'engine').symlink_to(ENGINE)
(root / 'film').symlink_to(PROJ)


class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


class S(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


srv = S(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_address[1]}/engine/index.html?render=1&w={W}&h={H}'

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': min(W, 1280), 'height': min(H, 1280)})
    errs = []
    pg.on('console', lambda m: (print('[page]', m.text, file=sys.stderr), errs.append(m.text)) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: (print('[pageerror]', e, file=sys.stderr), errs.append(str(e))))
    pg.goto(url)
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=180000)
    bf = pg.evaluate('window.__bootFailed || null')
    if bf:
        sys.exit('片子加载失败：\n' + bf)
    total = pg.evaluate('window.__total')
    t1 = a.t1 if a.t1 is not None else total
    grab = lambda t: base64.b64decode(pg.evaluate('t => window.renderAt(t)', t))
    if a.stills:
        out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
        for s in a.stills.split(','):
            (out / f't{float(s):06.2f}.png').write_bytes(grab(float(s)))
        print('静帧 →', out)
    else:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'png', '-i', '-',
                               '-c:v', 'libx264', '-preset', 'medium', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out],
                              stdin=subprocess.PIPE)
        n0, n1 = round(a.t0 * a.fps), round(t1 * a.fps)
        st = time.time()
        for i in range(n0, n1):
            ff.stdin.write(grab(i / a.fps))
            if (i - n0) % (a.fps * 2) == 0:
                el = time.time() - st; done = i - n0 + 1
                print(f'  {i / a.fps:6.1f}s / {t1:.1f}s   {el / done:.2f}s/帧   预计还要 {el / done * (n1 - i) / 60:.1f} 分钟', file=sys.stderr, flush=True)
        ff.stdin.close(); ff.wait()
        print(f'画面 → {a.out}（{(n1 - n0) / a.fps:.1f} 秒，{W}×{H}@{a.fps}）')
    if a.layout:
        lay = [{'t': round(t / 2, 2), **pg.evaluate('t => window.layout(t)', t / 2)} for t in range(int(a.t0 * 2), int(t1 * 2))]
        json.dump(lay, open(a.layout, 'w'), ensure_ascii=False)
        print('文字框 →', a.layout)
    if errs:
        print(f'⚠ 页面报了 {len(errs)} 个错误，看上面的 [page] 行', file=sys.stderr)
    b.close()
