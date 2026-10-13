// 兵马俑 TikTok 成片：实拍照片（Wikimedia Commons，见 素材/署名.md）＋代码运镜、剥色、数字、字幕。竖屏 1080×1920。
(() => {
const { clamp, lerp, ss } = U, E = U.ease, P = PAINT;
const W = 1080, H = 1920;
const F = window.TF = {};
const im = (k) => IMG['img/' + k + '.jpg'];

// 照片铺满竖屏：fx/fy 是焦点（图内 0..1），z 是在「刚好铺满」基础上的放大倍数。返回图→屏的变换，方便在图坐标里叠画。
F.cover = (c, img, { fx = 0.5, fy = 0.5, z = 1, filter = 'none', alpha = 1, box = [0, 0, W, H] } = {}) => {
  const [bx, by, bw, bh] = box, s = Math.max(bw / img.width, bh / img.height) * z, w = img.width * s, h = img.height * s;
  const x = clamp(bx + bw / 2 - fx * w, bx + bw - w, bx), y = clamp(by + bh / 2 - fy * h, by + bh - h, by);
  c.save(); c.globalAlpha = alpha; c.filter = filter; c.drawImage(img, x, y, w, h); c.restore();
  return { x, y, s };
};
// 进段一下冲击（放大 4% 回落），模拟剪辑点的 punch-in
F.kick = (lt, amp = 0.05) => 1 + amp * Math.pow(1 - clamp(lt / 0.35), 2);
F.vignette = (c, a = 0.55) => { const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); };
F.grain = (c, t) => { const n = P.cached('ttfilm_grain', 540, 960, (g) => { const d = g.createImageData(540, 960), r = U.rng(9); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; } g.putImageData(d, 0, 0); });
  c.save(); c.globalCompositeOperation = 'overlay'; const o = Math.floor(t * 24) % 4; c.drawImage(n, -o * 30, -o * 17, W + 120, H + 70); c.restore(); };
F.flash = (c, lt, dur = 0.12) => { if (lt < dur) { c.fillStyle = `rgba(255,248,235,${0.55 * (1 - lt / dur)})`; c.fillRect(0, 0, W, H); } };

// ---------- 字幕：英文大字（白、黑描边，自动换行）＋中文小字（暖黄）。TikTok 安全区：底部 ~440、右侧 ~140 留给界面 ----------
const wrap = (c, text, max) => { const out = []; let line = ''; for (const w of text.split(' ')) { const tryL = line ? line + ' ' + w : w; if (c.measureText(tryL).width > max && line) { out.push(line); line = w; } else line = tryL; } if (line) out.push(line); return out; };
F.subs = (c, lt, en, zh, { y = 1170, size = 78, inAt = 0, hl } = {}) => {
  const p = clamp((lt - inAt) / 0.18); if (p <= 0) return;
  c.save(); c.globalAlpha = p; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  const cx = 520, sc = 1 + 0.08 * (1 - E.out(p)); c.translate(cx, y); c.scale(sc, sc); c.translate(-cx, -y);
  c.font = `900 ${size}px "Inter"`; const lines = wrap(c, en, 860);
  lines.forEach((l, i) => { const yy = y + i * size * 1.14; c.strokeStyle = 'rgba(0,0,0,.92)'; c.lineWidth = size * 0.17; c.strokeText(l, cx, yy);
    c.fillStyle = hl && l.includes(hl) ? '#ffd23f' : '#ffffff'; c.fillText(l, cx, yy); });
  if (zh) { const zy = y + (lines.length - 1) * size * 1.14 + size * 0.95; c.font = `46px "PuHui-Bold"`; c.strokeStyle = 'rgba(0,0,0,.88)'; c.lineWidth = 9; c.strokeText(zh, cx, zy); c.fillStyle = '#ffd66b'; c.fillText(zh, cx, zy); }
  c.restore(); };
// 大数字砸进来：弹簧放大落定＋一圈冲击波
F.slam = (c, lt, at, num, label, { y = 640, size = 250, col = '#ffd23f' } = {}) => {
  const q = lt - at; if (q < 0) return; const p = clamp(q / 0.28), sc = q < 0.28 ? lerp(2.2, 0.94, E.out(p)) : 1 - 0.06 * Math.exp(-(q - 0.28) * 9) * Math.cos((q - 0.28) * 30);
  c.save(); c.translate(520, y);
  if (q < 0.6) { c.strokeStyle = `rgba(255,220,120,${0.7 * (1 - q / 0.6)})`; c.lineWidth = 10; c.beginPath(); c.arc(0, -size * 0.32, 80 + q * 900, 0, U.TAU); c.stroke(); }
  c.scale(sc, sc); c.textAlign = 'center'; c.lineJoin = 'round'; c.font = `900 ${size}px "Inter"`;
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 30; c.strokeStyle = 'rgba(0,0,0,.9)'; c.lineWidth = size * 0.1; c.strokeText(num, 0, 0); c.shadowBlur = 0; c.fillStyle = col; c.fillText(num, 0, 0);
  if (label) { c.font = `800 ${size * 0.26}px "Inter"`; c.lineWidth = 12; c.strokeText(label, 0, size * 0.36); c.fillStyle = '#fff'; c.fillText(label, 0, size * 0.36); }
  c.restore(); };

// ---------- 开场：彩绘层（把 000 号照片按五官上色）与灰陶底 ----------
// 000.jpg 1280×1920，图坐标：脸椭圆中心 (680,1000)；发髻 (380,370)；发际线约 y=650；八字胡 (760–960,1060–1140)；嘴 (800,1160)；领巾 y 1420–1720
const HEAD = { fx: 0.53, fy: 0.5 };
// 彩绘版照片：在图坐标（1280×1920）里一次算好，羽化遮罩逐区上色，之后每帧只按相机变换画出来
const feather = (key, shapes, blur) => P.cached('ttmask_' + key, 1280, 1920, (g) => { g.filter = `blur(${blur}px)`; g.fillStyle = '#fff'; shapes(g); g.filter = 'none'; });
const ell = (g, x, y, rx, ry, a = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, U.TAU); g.fill(); };
function tintVia(g, mask, col, mode, alpha = 1) { const L = P.scratch('tttint'); L.width = 1280; L.height = 1920; const l = L.getContext('2d');
  l.clearRect(0, 0, 1280, 1920); l.drawImage(mask, 0, 0); l.globalCompositeOperation = 'source-in'; l.fillStyle = col; l.fillRect(0, 0, 1280, 1920); l.globalCompositeOperation = 'source-over';
  g.save(); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.drawImage(L, 0, 0); g.restore(); }
const painted = () => P.cached('ttpainted', 1280, 1920, (g) => {
  const img = im('000'); g.filter = 'saturate(1.5) contrast(1.04)'; g.drawImage(img, 0, 0); g.filter = 'none';
  const face = feather('face', g2 => { ell(g2, 690, 1020, 350, 400, -0.12); ell(g2, 300, 930, 60, 140); }, 30);
  tintVia(g, face, 'rgb(238,182,156)', 'multiply', 0.8); tintVia(g, face, 'rgb(232,162,134)', 'color', 0.75);
  tintVia(g, feather('cheek', g2 => { ell(g2, 560, 1010, 120, 90); ell(g2, 960, 1020, 90, 80); }, 40), 'rgb(220,80,80)', 'soft-light', 0.8);
  const hair = feather('hair', g2 => { ell(g2, 410, 380, 175, 145, -0.6); g2.beginPath(); g2.moveTo(320, 830); g2.bezierCurveTo(290, 600, 420, 470, 640, 455); g2.bezierCurveTo(860, 450, 1010, 540, 1040, 690);
    g2.bezierCurveTo(960, 630, 860, 585, 760, 588); g2.bezierCurveTo(600, 590, 430, 620, 380, 700); g2.bezierCurveTo(350, 750, 340, 790, 320, 830); g2.closePath(); g2.fill(); }, 14);
  tintVia(g, hair, 'rgb(34,28,26)', 'multiply', 0.95); tintVia(g, hair, 'rgb(20,16,14)', 'color', 0.9);
  tintVia(g, feather('ribbon', g2 => { ell(g2, 680, 445, 110, 42, 0.15); }, 10), 'rgb(200,40,34)', 'color', 0.95);
  tintVia(g, feather('brow', g2 => { ell(g2, 610, 702, 95, 16, -0.12); ell(g2, 915, 742, 85, 15, 0.2); }, 8), 'rgb(40,30,28)', 'multiply', 0.75);
  tintVia(g, feather('scarf', g2 => { ell(g2, 640, 1600, 520, 190, 0.05); }, 30), 'rgb(60,140,112)', 'color', 0.85);
});
function paintLayer(g, img, z) {
  const T = F.cover(g, img, { ...HEAD, z }); g.clearRect(0, 0, W, H);
  g.save(); g.translate(T.x, T.y); g.scale(T.s, T.s); g.drawImage(painted(), 0, 0); g.restore(); return T;
}
const clayFilter = 'grayscale(1) sepia(.18) brightness(.82) contrast(1.15)';
// 剥落碎片：从脸上崩出、旋转、下落
function chips(c, T, lt, t0, t1) {
  const r = U.rng(31);
  for (let i = 0; i < 140; i++) {
    const a = r() * U.TAU, d = Math.sqrt(r()), ix = 690 + Math.cos(a) * d * 340, iy = 1010 + Math.sin(a) * d * 400, ts = lerp(t0, t1, r()), sz = 6 + r() * 18, col = r() < 0.18 ? '#1e1814' : r() < 0.1 ? '#b8322a' : `rgb(${220 + r() * 25 | 0},${150 + r() * 30 | 0},${120 + r() * 25 | 0})`;
    const q = lt - ts; if (q < 0 || q > 1.6) continue;
    const vx = (Math.cos(a) * 260 + (r() - 0.5) * 300), vy = -200 - r() * 300;
    const x = T.x + ix * T.s + vx * q, y = T.y + iy * T.s + vy * q + 1400 * q * q;
    c.save(); c.globalAlpha = 1 - q / 1.6; c.translate(x, y); c.rotate(q * (r() * 14 - 7)); c.scale(1, 0.3 + 0.7 * Math.abs(Math.cos(q * 9 + i)));
    c.fillStyle = col; c.beginPath(); c.moveTo(-sz, -sz * 0.4); c.lineTo(sz * 0.3, -sz * 0.7); c.lineTo(sz, sz * 0.2); c.lineTo(-sz * 0.2, sz * 0.6); c.closePath(); c.fill(); c.restore();
  }
}
F.hook = (c, lt, { z, peel, t0 = 0.8, t1 = 2.5, chipsOn = true }) => {
  const img = im('000');
  const T = F.cover(c, img, { ...HEAD, z, filter: clayFilter });
  if (peel < 1) { const cv = P.scratch('tthook'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.clearRect(0, 0, W, H); paintLayer(g, img, z);
    c.drawImage(peel > 0 ? TT.peel(cv, 'hook', peel, 5) : cv, 0, 0); }
  if (chipsOn) chips(c, T, lt, t0, t1);
  return T;
};

// ---------- 地下：水银河（代码画的剖面） ----------
F.mercury = (c, lt, top) => {
  const g = c.createLinearGradient(0, top, 0, H); g.addColorStop(0, '#3a2a1e'); g.addColorStop(1, '#0d0907'); c.fillStyle = g; c.fillRect(0, top, W, H - top);
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.6; c.drawImage(TT.grain('soil2', W, 600, '#c8a888', 12, 50), 0, top, W, H - top); c.restore();
  // 地宫轮廓
  const by = top + 120, rev = ss(0.3, 1.6, lt);
  c.save(); c.globalAlpha = rev; c.strokeStyle = 'rgba(220,190,140,.55)'; c.lineWidth = 4; c.setLineDash([14, 10]); c.strokeRect(150, by, 780, 400); c.setLineDash([]);
  c.font = '800 34px "Inter"'; c.fillStyle = 'rgba(230,205,160,.8)'; c.textAlign = 'center'; c.fillText('UNEXCAVATED TOMB CHAMBER', 540, by - 18); c.restore();
  // 水银河：多条流动的银线，带辉光
  const flow = ss(0.8, 3.2, lt);
  for (let k = 0; k < 6; k++) {
    const yb = by + 60 + k * 56, pts = [];
    for (let x = 170; x <= 910; x += 10) pts.push([x, yb + Math.sin(x * 0.012 + k * 1.7) * 22 + Math.sin(x * 0.031 + k) * 8]);
    const n = Math.floor(pts.length * flow); if (n < 2) continue;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [w, a, col] of [[22, 0.12, '#bfe6ff'], [10, 0.35, '#dff4ff'], [4, 0.95, '#ffffff']]) { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); pts.slice(0, n).forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }
    // 流动高光
    c.globalAlpha = 0.9; c.fillStyle = '#fff'; for (let j = 0; j < 4; j++) { const u = ((lt * 0.35 + j / 4 + k * 0.13) % 1), q = pts[Math.floor(u * (n - 1))]; if (q) { c.beginPath(); c.arc(q[0], q[1], 5, 0, U.TAU); c.fill(); } }
    c.restore();
  }
};

// 红漆残迹上的脉冲圈
F.ring = (c, x, y, lt, at) => { const q = lt - at; if (q < 0) return; for (let i = 0; i < 2; i++) { const u = ((q * 0.8 + i * 0.5) % 1); c.strokeStyle = `rgba(255,210,63,${0.9 * (1 - u)})`; c.lineWidth = 7; c.beginPath(); c.arc(x, y, 60 + u * 120, 0, U.TAU); c.stroke(); }
  c.strokeStyle = '#ffd23f'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 60, 0, U.TAU * clamp(q / 0.4)); c.stroke(); };
F.im = im;
})();
