#!/usr/bin/env python3
"""把一张 HTML / SVG 插图截成 PNG，给封面的 cover_image 用。

用法:
  python3 render_illus.py <illus.html> <cover.png> [宽 高]      # 默认 970 680，输出是 2 倍图

截图引擎: macOS Google Chrome → PATH 里的 google-chrome / chromium。
"""
import os
import shutil
import subprocess
import sys
import tempfile
import time


def find_chrome():
    mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(mac):
        return mac
    for name in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if shutil.which(name):
            return shutil.which(name)
    sys.exit("找不到 Chrome / Chromium")


def main(src, out, w=970, h=680):
    src, out = os.path.abspath(src), os.path.abspath(out)
    if os.path.exists(out):
        os.remove(out)
    profile = tempfile.mkdtemp(prefix="xhs-illus-")
    proc = subprocess.Popen(
        [find_chrome(), "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
         "--allow-file-access-from-files", f"--user-data-dir={profile}", "--force-device-scale-factor=2",
         f"--window-size={w},{h}", "--virtual-time-budget=2000", f"--screenshot={out}", "file://" + src],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    last, deadline = -1, time.time() + 60          # 无头 Chrome 截完图有时不退出：文件大小稳定后主动结束
    while time.time() < deadline and proc.poll() is None:
        time.sleep(0.5)
        size = os.path.getsize(out) if os.path.exists(out) else -1
        if size > 0 and size == last:
            break
        last = size
    if proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(5)
        except subprocess.TimeoutExpired:
            proc.kill()
    shutil.rmtree(profile, ignore_errors=True)
    if not os.path.exists(out):
        sys.exit("截图失败")
    print(out)


if __name__ == "__main__":
    if len(sys.argv) not in (3, 5):
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], *map(int, sys.argv[3:5]))
