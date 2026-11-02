// 逐帧渲染动画层：seek(t) → JPEG → 管道给 ffmpeg → <工作目录>/renders/anim.mp4
//   node render.js <工作目录> [fps=30] [t0 t1]        t0/t1 只渲一段，输出 renders/anim_<t0>.mp4（改一小段时用，再拼回去）
//   node render.js <工作目录> --stills 3 15.5 40       只出静帧 renders/still_<t>.png，先看版式再整片渲
// 加载顺序：kit.js（组件库 + 通用镜头）→ 工作目录里的 scenes.js（可选，本期专用镜头 / 原声右侧小图）
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const HERE = __dirname, P = path.resolve(process.argv[2]);
const read = f => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8'));
const TL = read('timeline.json'), PLAN = read('plan.json');
const RECTS = fs.existsSync(path.join(P, 'rects.json')) ? read('rects.json') : JSON.parse(fs.readFileSync(path.join(HERE, 'rects.json'), 'utf8'));
const stills = process.argv[3] === '--stills';
(async () => {
  fs.mkdirSync(path.join(P, 'renders'), { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('file://' + path.join(HERE, 'film.html'));
  await pg.evaluate(([tl, r, p]) => { window.TL = tl; window.RECTS = r; window.PLAN = p; }, [TL, RECTS, PLAN]);
  await pg.addScriptTag({ path: path.join(HERE, 'kit.js') });
  if (fs.existsSync(path.join(P, 'scenes.js'))) await pg.addScriptTag({ path: path.join(P, 'scenes.js') });
  await pg.evaluate(() => document.fonts.ready);
  if (stills) {
    for (const t of process.argv.slice(4).map(Number)) {
      await pg.evaluate(t => window.seek(t), t);
      await pg.locator('canvas').screenshot({ path: path.join(P, 'renders', `still_${t}.png`) });
    }
    console.log(errs.join('\n') || 'stills ok'); await b.close(); return;
  }
  const fps = +(process.argv[3] || 30), t0 = +(process.argv[4] || 0), t1 = +(process.argv[5] || TL.dur);
  const out = path.join(P, 'renders', process.argv[4] ? `anim_${t0}.mp4` : 'anim.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * fps);
  for (let i = 0; i < n; i++) {
    const t = t0 + i / fps;
    await pg.evaluate(t => window.seek(t), t);
    const buf = await pg.locator('canvas').screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${n}  t=${t.toFixed(1)}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
  if (errs.length) console.log('page errors:\n' + errs.join('\n'));
  console.log('done', out);
})();
