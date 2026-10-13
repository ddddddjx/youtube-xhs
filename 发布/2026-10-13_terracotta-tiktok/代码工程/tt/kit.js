// 兵马俑画具：陶土质感、俑头（正面，雕塑式五官，无瞳孔）、彩绘层、剥落、坑道、尘土。竖屏 1080×1920。
(() => {
const { clamp, lerp, rng } = U, P = PAINT, K = KIT;
const C = { clay: '#a88466', clay2: '#8c6a50', clayHi: '#c9a888', clayDk: '#5e4434', earth: '#3a2a20', earth2: '#4e3a2c', dust: '#d8c4a8',
  skin: '#e8b49a', skinDk: '#c98e74', black: '#1e1a18', red: '#b8322a', green: '#3f7a5a', lacing: '#c8402e', gold: '#d8a84a', white: '#efe6d6' };
const TT = window.TT = { C };
const F = TT.F = (c, p, fill, lw = 0, line = 'rgba(40,24,16,.55)') => { if (fill) { c.fillStyle = fill; c.fill(p); } if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(p); } };
TT.sm = (pts, closed = true) => { const d = K.densify(closed ? pts.concat([pts[0], pts[1]]) : pts, 8); const p = new Path2D(); (closed ? d.slice(8, d.length - 8 + 1) : d).forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
TT.ell = (x, y, rx, ry, a = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); return p; };
// 陶土颗粒纹理（任意尺寸，缓存）
TT.grain = (key, w, h, base, seed = 3, amt = 26) => P.cached('ttg_' + key, w, h, (g) => {
  const img = g.createImageData(w, h), d = img.data, b = P.hex(base), r = rng(seed);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = P.fbm(x * 0.012 + seed, y * 0.012, 4), gr = (r() - .5) * 22, pit = r() < 0.004 ? -40 : 0, i = (y * w + x) * 4;
    d[i] = b[0] + n * amt + gr + pit; d[i + 1] = b[1] + n * amt + gr + pit; d[i + 2] = b[2] + n * amt * 0.8 + gr + pit; d[i + 3] = 255; }
  g.putImageData(img, 0, 0); });
// 在路径内铺纹理（multiply）
TT.texIn = (c, p, key, x, y, w, h, base, alpha = 0.55) => { c.save(); c.clip(p); c.globalCompositeOperation = 'multiply'; c.globalAlpha = alpha; c.drawImage(TT.grain(key, w, h, base), x, y); c.restore(); };
// 光影：在路径内叠径向渐变（左上主光）
TT.shade = (c, p, x, y, r, dark = 'rgba(30,18,10,.55)', lightA = 0.25) => { c.save(); c.clip(p);
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.15); g.addColorStop(0, `rgba(255,240,220,${lightA})`); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, dark); c.fillStyle = g; c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4); c.restore(); };
// 一道雕刻线：暗线 + 下侧一道亮边
TT.carve = (c, pts, w = 4, dark = 'rgba(40,24,16,.7)', hi = 'rgba(230,205,175,.45)') => { const D = K.densify(pts, 6);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = hi; c.lineWidth = w * 0.7; c.beginPath(); D.forEach((q, i) => i ? c.lineTo(q[0] + 1.5, q[1] + 2.5) : c.moveTo(q[0] + 1.5, q[1] + 2.5)); c.stroke();
  c.strokeStyle = dark; c.lineWidth = w; c.beginPath(); D.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); };

// ---------- 俑头（正面）。局部坐标：脸中心 (0,0)，脸宽约 300，s 缩放。paint: 0..1 彩绘程度；faceVar: 不同面孔参数 ----------
TT.head = (c, x, y, s, { paint = 0, v = {}, keyBase = 'h' } = {}) => {
  const fw = v.fw || 1, jaw = v.jaw || 1, mus = v.mus ?? 1, brow = v.brow || 0, beard = v.beard || 0, bun = v.bun ?? 1;
  c.save(); c.translate(x, y); c.scale(s, s);
  const skin = paint > 0 ? null : C.clay;
  // 颈与铠甲领
  const neck = TT.sm([[-80, 120], [80, 120], [96, 230], [-96, 230]]); F(c, neck, C.clay2);
  const collar = TT.sm([[-230, 220], [0, 190], [230, 220], [260, 330], [-260, 330]]); F(c, collar, C.clay2);
  TT.texIn(c, collar, keyBase + 'col', -260, 180, 520, 160, '#ffffff', 0.5); TT.shade(c, collar, 0, 240, 260);
  for (let i = -3; i <= 3; i++) for (let j = 0; j < 2; j++) { const px = i * 66, py = 236 + j * 46; const pl = new Path2D(); pl.roundRect(px - 30, py, 60, 40, 6); F(c, pl, C.clay, 2);
    c.fillStyle = 'rgba(40,24,16,.6)'; [[-20, 8], [20, 8], [-20, 32], [20, 32]].forEach(([a, b]) => { c.beginPath(); c.arc(px + a, py + b, 3, 0, Math.PI * 2); c.fill(); }); }
  // 发髻（右侧偏髻）与头发
  const hairCol = C.clay2;
  const skull = TT.sm([[-150 * fw, -40], [-140 * fw, -150], [-60, -215], [60, -215], [140 * fw, -150], [150 * fw, -40], [0, -90]]); F(c, skull, hairCol);
  if (bun) { const b = TT.ell(110, -230, 62, 52, 0.4); F(c, b, hairCol); TT.texIn(c, b, keyBase + 'bun', 40, -290, 140, 120, '#ffffff', 0.45); TT.shade(c, b, 110, -230, 70);
    for (let k = 0; k < 5; k++) TT.carve(c, [[70 + k * 14, -270], [90 + k * 12, -232], [80 + k * 14, -190]], 2.4); }
  // 脸
  const face = TT.sm([[-150 * fw, -70], [-148 * fw, 10], [-128 * jaw, 90], [-70 * jaw, 150], [0, 168], [70 * jaw, 150], [128 * jaw, 90], [148 * fw, 10], [150 * fw, -70], [100, -120], [0, -132], [-100, -120]]);
  F(c, face, C.clay); TT.texIn(c, face, keyBase + 'face', -170, -150, 340, 330, '#ffffff', 0.55);
  // 耳
  [-1, 1].forEach(d => { const e = TT.sm([[d * 148 * fw, -40], [d * 176 * fw, -56], [d * 184 * fw, -10], [d * 170 * fw, 40], [d * 148 * fw, 36]]); F(c, e, C.clay); TT.shade(c, e, d * 166 * fw, -10, 50); TT.carve(c, [[d * 160 * fw, -40], [d * 172 * fw, -10], [d * 160 * fw, 24]], 3); });
  // 发际线与梳理纹
  const hairline = TT.sm([[-152 * fw, -60], [-120, -128], [0, -140], [120, -128], [152 * fw, -60], [130, -150], [0, -175], [-130, -150]]); F(c, hairline, hairCol);
  for (let k = -6; k <= 6; k++) TT.carve(c, [[k * 22, -140 + Math.abs(k) * 3], [k * 26, -185], [k * 18, -210]], 2.2);
  // 眉弓
  [-1, 1].forEach(d => TT.carve(c, [[d * 112, -58 - brow * 4], [d * 70, -72 - brow * 8], [d * 24, -62]], 6));
  // 眼：杏仁形刻线＋上睑阴影（雕塑，无瞳孔）
  [-1, 1].forEach(d => { const ex = d * 66; const eye = TT.sm([[ex - 36, -28], [ex, -44], [ex + 36, -30], [ex + 2, -18]]); F(c, eye, 'rgba(70,46,32,.35)');
    TT.carve(c, [[ex - 38, -28], [ex, -46], [ex + 38, -30]], 4); TT.carve(c, [[ex - 34, -26], [ex, -16], [ex + 34, -28]], 2.4, 'rgba(40,24,16,.5)');
    TT.carve(c, [[ex - 30, -54], [ex + 4, -62], [ex + 32, -52]], 2, 'rgba(40,24,16,.35)'); });
  // 鼻
  const nose = TT.sm([[-10, -36], [10, -36], [22, 30], [32, 48], [0, 58], [-32, 48], [-22, 30]]); F(c, nose, C.clayHi); TT.shade(c, nose, 0, 20, 60, 'rgba(30,18,10,.35)', 0.3);
  TT.carve(c, [[-30, 48], [-18, 58], [0, 56], [18, 58], [30, 48]], 3); TT.carve(c, [[22, 4], [30, 40]], 2.4, 'rgba(40,24,16,.35)');
  // 胡须：上翘八字
  if (mus) { [-1, 1].forEach(d => { const m = TT.sm([[d * 6, 74], [d * 46, 70], [d * 84, 50], [d * 100, 30], [d * 92, 52], [d * 50, 86], [d * 8, 86]]); F(c, m, hairCol); for (let k = 0; k < 4; k++) TT.carve(c, [[d * (14 + k * 16), 82], [d * (40 + k * 16), 72], [d * (60 + k * 12), 58]], 1.6); }); }
  // 嘴
  TT.carve(c, [[-40, 102], [-14, 98], [0, 102], [14, 98], [40, 102]], 4); const lip = TT.sm([[-30, 106], [0, 116], [30, 106], [0, 124]]); F(c, lip, 'rgba(60,36,24,.22)');
  if (beard) { const bd = TT.sm([[-22, 132], [22, 132], [10, 170], [0, 178], [-10, 170]]); F(c, bd, hairCol); for (let k = -2; k <= 2; k++) TT.carve(c, [[k * 7, 136], [k * 5, 170]], 1.6); }
  // 法令、颧骨
  [-1, 1].forEach(d => { TT.carve(c, [[d * 40, 40], [d * 62, 80], [d * 70, 112]], 2.4, 'rgba(40,24,16,.3)'); });
  TT.shade(c, face, 0, 0, 210, 'rgba(30,18,10,.6)', 0.28);
  // ---------- 彩绘层（paint 0..1）：在脸上覆盖肤色、黑发、红唇、黑眉；按 paint 的剥落遮罩露出陶土 ----------
  c.restore();
};
// 彩绘版：同一个头先画陶土，再把彩色层画在离屏、按剥落遮罩擦掉
TT.paintLayer = (key, w, h, drawFn) => { const cv = P.scratch(key), g = cv.getContext('2d'); g.reset(); g.clearRect(0, 0, cv.width, cv.height); drawFn(g); return cv; };
// 剥落遮罩：值 = 该像素在第几「秒」剥落（0..1 归一），flake 形状用 fbm 阈值
TT.peelMask = (key, w, h, seed = 7) => P.cached('ttpm_' + key, w, h, (g) => { const img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = P.fbm(x * 0.011 + seed, y * 0.011, 4) * 0.5 + 0.5, cell = P.noise(x * 0.06, y * 0.06) * 0.15, i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = clamp((n + cell) * 1.25 - 0.1) * 255; }
  g.putImageData(img, 0, 0); });
// 把 src（彩色层）按剥落进度 p 擦掉：遮罩 alpha < p 的部分消失。返回离屏。
TT.peel = (src, maskKey, p, seed) => { const w = src.width, h = src.height, m = TT.peelMask(maskKey, w, h, seed), out = P.scratch('ttpeel_' + maskKey), g = out.getContext('2d', { willReadFrequently: true }); g.reset(); g.clearRect(0, 0, w, h);
  g.drawImage(src, 0, 0); const id = g.getImageData(0, 0, w, h), mm = m.getContext('2d').getImageData(0, 0, w, h).data, d = id.data, th = p * 255;
  for (let i = 3; i < d.length; i += 4) { const a = mm[i]; if (a < th) d[i] = 0; else if (a < th + 10) { d[i - 3] *= 0.6; d[i - 2] *= 0.55; d[i - 1] *= 0.5; } }
  g.putImageData(id, 0, 0); return out; };
// 彩色面部层：肤色、黑发、红唇、眉、胡须、铠甲红绿
TT.headPaint = (g, x, y, s, v = {}) => { const fw = v.fw || 1, jaw = v.jaw || 1;
  g.save(); g.translate(x, y); g.scale(s, s);
  const face = TT.sm([[-150 * fw, -70], [-148 * fw, 10], [-128 * jaw, 90], [-70 * jaw, 150], [0, 168], [70 * jaw, 150], [128 * jaw, 90], [148 * fw, 10], [150 * fw, -70], [100, -120], [0, -132], [-100, -120]]);
  g.globalAlpha = 0.86; F(g, face, C.skin);
  [-1, 1].forEach(d => F(g, TT.ell(d * 92, 40, 40, 26), 'rgba(220,120,110,.35)'));
  F(g, TT.sm([[-152 * fw, -60], [-120, -128], [0, -140], [120, -128], [152 * fw, -60], [130, -150], [0, -175], [-130, -150]]), C.black);
  F(g, TT.sm([[-150 * fw, -40], [-140 * fw, -150], [-60, -215], [60, -215], [140 * fw, -150], [150 * fw, -40], [130, -130], [0, -140], [-130, -130]]), C.black);
  F(g, TT.ell(110, -230, 62, 52, 0.4), C.black); F(g, new Path2D('M60 -240 L160 -210 L156 -198 L58 -228 Z'), C.red);
  [-1, 1].forEach(d => { g.strokeStyle = C.black; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(d * 112, -60); g.quadraticCurveTo(d * 70, -78, d * 24, -64); g.stroke();
    F(g, TT.sm([[d * 66 - 34, -28], [d * 66, -42], [d * 66 + 34, -30], [d * 66 + 2, -20]]), C.white); F(g, TT.ell(d * 66, -31, 11, 11), C.black); });
  F(g, TT.sm([[-30, 106], [0, 100], [30, 106], [0, 122]]), C.red);
  [-1, 1].forEach(d => F(g, TT.sm([[d * 6, 74], [d * 46, 70], [d * 84, 50], [d * 100, 30], [d * 92, 52], [d * 50, 86], [d * 8, 86]]), C.black));
  for (let i = -3; i <= 3; i++) for (let j = 0; j < 2; j++) { const px = i * 66, py = 236 + j * 46; const pl = new Path2D(); pl.roundRect(px - 30, py, 60, 40, 6); F(g, pl, (i + j) % 2 ? '#2a2a30' : '#3a3434');
    g.strokeStyle = (i + j) % 2 ? C.lacing : C.green; g.lineWidth = 5; g.beginPath(); g.moveTo(px - 20, py + 8); g.lineTo(px + 20, py + 32); g.moveTo(px + 20, py + 8); g.lineTo(px - 20, py + 32); g.stroke(); }
  F(g, TT.sm([[-230, 220], [0, 190], [230, 220], [236, 236], [0, 206], [-236, 236]]), C.red);
  g.restore(); };
// 尘土粒子
TT.dust = (c, t, { n = 60, seed = 4, w = 1080, h = 1920, speed = 20, a = 0.5 } = {}) => P.particles(n, seed, t, { x0: 0, x1: w, y0: h, y1: -20, speed, drift: 30, life: 9 }).forEach(p => { c.fillStyle = `rgba(230,210,180,${a * Math.sin(p.q * Math.PI)})`; c.beginPath(); c.arc(p.x, p.y, 1.5 + p.s * 2.5, 0, Math.PI * 2); c.fill(); });
// 字幕：英文大字（白、黑描边）＋中文小字（暖黄），底部安全区以上
TT.subs = (c, en, zh, { y = 1420, a = 1, size = 74, pop = 0 } = {}) => { if (!en && !zh) return; c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
  const sc = 1 + 0.12 * (1 - U.ease.out(clamp(pop))); c.translate(540, y); c.scale(sc, sc); c.translate(-540, -y);
  const lines = Array.isArray(en) ? en : [en]; c.font = `900 ${size}px "Inter"`;
  lines.forEach((l, i) => { const yy = y + i * size * 1.12; c.strokeStyle = 'rgba(0,0,0,.9)'; c.lineWidth = size * 0.16; c.strokeText(l, 540, yy); c.fillStyle = '#ffffff'; c.fillText(l, 540, yy); });
  if (zh) { const zy = y + lines.length * size * 1.12 + 6; c.font = `52px "PuHui-Bold"`; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 10; c.strokeText(zh, 540, zy); c.fillStyle = '#ffd66b'; c.fillText(zh, 540, zy); }
  c.restore(); };
})();
// 全身小俑（远景用，站立，正面）。x,y=脚底中心，s≈1 时高约 300
(() => { const { C, F } = TT;
TT.soldier = (c, x, y, s, { v = 0, dark = 0 } = {}) => { c.save(); c.translate(x, y); c.scale(s, s);
  const cl = C.clay, cd = C.clay2;
  F(c, new Path2D('M-30 0 L-12 0 L-14 -70 L-30 -70 Z'), cd); F(c, new Path2D('M12 0 L30 0 L30 -70 L14 -70 Z'), cd);
  F(c, TT.sm([[-48, -60], [48, -60], [40, -150], [-40, -150]]), cl);   // 袍
  const ar = TT.sm([[-50, -140], [50, -140], [44, -230], [-44, -230]]); F(c, ar, cd);   // 甲
  c.fillStyle = 'rgba(40,24,16,.5)'; for (let j = 0; j < 4; j++) for (let i = -2; i <= 2; i++) c.fillRect(i * 17 - 6, -224 + j * 22, 12, 16);
  F(c, TT.sm([[-50, -226], [-74, -170], [-62, -130], [-46, -180]]), cl); F(c, TT.sm([[50, -226], [74, -170], [62, -130], [46, -180]]), cl);   // 臂
  F(c, TT.ell(0, -262, 26, 32), cl); F(c, TT.ell(10 + (v % 3) * 2, -294, 14, 11), cd);   // 头、髻
  c.strokeStyle = 'rgba(40,24,16,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -266); c.lineTo(-4, -266); c.moveTo(4, -266); c.lineTo(12, -266); c.moveTo(-8, -246); c.quadraticCurveTo(0, -242 + (v % 2) * 3, 8, -246); c.stroke();
  const g = c.createLinearGradient(-60, -300, 60, 0); g.addColorStop(0, 'rgba(255,235,210,.18)'); g.addColorStop(1, `rgba(20,12,8,${0.35 + dark})`); c.fillStyle = g; c.globalCompositeOperation = 'source-atop'; c.fillRect(-80, -320, 160, 330);
  c.restore(); };
})();
