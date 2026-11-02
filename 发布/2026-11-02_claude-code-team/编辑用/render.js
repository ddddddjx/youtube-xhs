// 逐帧渲染动画层：seek(t) → JPEG → 管道给 ffmpeg 出 renders/anim.mp4
//   node render.js [fps=30] [t0] [t1]     （t0/t1 只渲一段做样片，输出 renders/anim_<t0>.mp4）
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const P = __dirname, fps = +(process.argv[2] || 30);
const TL = JSON.parse(fs.readFileSync(path.join(P, 'timeline.json'), 'utf8'));
const RECTS = JSON.parse(fs.readFileSync(path.join(P, 'rects.json'), 'utf8'));
const t0 = +(process.argv[3] || 0), t1 = +(process.argv[4] || TL.dur);
(async () => {
  fs.mkdirSync(path.join(P, 'renders'), { recursive: true });
  const out = path.join(P, 'renders', process.argv[3] ? `anim_${t0}.mp4` : 'anim.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto('file://' + path.join(P, 'film.html'));
  await pg.evaluate(([tl, r]) => { window.TL = tl; window.RECTS = r; }, [TL, RECTS]);
  await pg.addScriptTag({ path: path.join(P, 'film.js') });
  await pg.evaluate(() => document.fonts.ready);
  const n = Math.round((t1 - t0) * fps);
  for (let i = 0; i < n; i++) {
    const t = t0 + i / fps;
    await pg.evaluate(t => window.seek(t), t);
    const buf = await pg.locator('canvas').screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${n}  t=${t.toFixed(1)}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  console.log('done', out);
})();
