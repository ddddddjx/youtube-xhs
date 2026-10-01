// node render.js <start> <end> <out> | preview: node render.js preview t1,t2,...
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const FPS = 30;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => { console.error('PAGEERR', e.message); process.exit(1); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  // 预加载所有用到的字形
  const chars = [...new Set((fs.readFileSync(__dirname + '/anim.js', 'utf8') + fs.readFileSync(__dirname + '/timing.js', 'utf8')).replace(/[\x00-\x7f]/g, ''))].join('') + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789≈=+→';
  await page.evaluate(async (chars) => {
    const pre = document.getElementById('pre');
    for (const w of [400, 700, 900]) { const d = document.createElement('div'); d.style.cssText = `font-family:"Noto Sans SC";font-weight:${w}`; d.textContent = chars; pre.appendChild(d); await document.fonts.load(`${w} 40px "Noto Sans SC"`, chars); }
    await document.fonts.ready;
  }, chars);
  if (process.argv[2] === 'preview') {
    for (const t of process.argv[3].split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await page.locator('canvas').screenshot({ path: `${process.argv[4] || '.'}/f_${t.toFixed(2)}.png` });
    }
    if (process.argv[5]) fs.writeFileSync(process.argv[5], JSON.stringify(await page.evaluate(() => window.EVENTS)));
    await browser.close(); return;
  }
  const [a, b, out] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = a; f < b; f++) {
    const data = await page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f / FPS);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await browser.close();
})();
