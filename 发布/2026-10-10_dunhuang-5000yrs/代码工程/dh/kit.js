// 敦煌风共用画具（本片专用）：矿物色板、铁线描填色、地仗纹理、做旧罩层、祥云、青绿山、骆驼、行人、飘带、手、边饰、榜题。
// 所有随机用种子；所有缓存按 key。画布 1920×1080。
(() => {
const W = 1920, H = 1080, { clamp, lerp, rng } = U, P = PAINT, K = KIT;
const C = { red: '#a5452f', redDk: '#7a2e1e', ochre: '#c9783a', ochre2: '#e0a060', green: '#3f8f6e', green2: '#6ab08e', greenDk: '#2c6a50',
  blue: '#2f5f8f', blue2: '#5a86b0', white: '#ecdfc4', ink: '#2a1a14', line: '#5a2414', skin: '#efd6bc', gold: '#d8b05a', plaster: '#d8c6a2', brown: '#8a4a2a' };
const DH = window.DH = { C, W, H };
const LW = 2.6;
DH.F = (c, p, fill, lw = LW, line = C.line) => { if (fill) { c.fillStyle = fill; c.fill(p); } if (lw) { c.strokeStyle = line; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(p); } };
const F = DH.F;
DH.sm = (pts, closed = true) => { const d = K.densify(closed ? pts.concat([pts[0], pts[1]]) : pts, 6); const p = new Path2D(); (closed ? d.slice(6, d.length - 6 + 1) : d).forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
DH.ell = (x, y, rx, ry, a = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); return p; };

// ---------- 地仗：土红 / 白灰 / 赭黄 ----------
DH.wall = (key, base = C.red, dark = '#7a3020', seed = 3, w = W, h = H) => P.cached('dhw_' + key, w, h, (g) => {
  const img = g.createImageData(w, h), d = img.data, b = P.hex(base), dk = P.hex(dark), r = rng(seed);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = P.fbm(x * 0.003 + seed, y * 0.003, 5), gr = (r() - .5) * 16, i = (y * w + x) * 4;
    const cc = P.mix(b, dk, clamp(n * 1.2 + 0.25)); d[i] = cc[0] + n * 30 + gr; d[i + 1] = cc[1] + n * 30 + gr; d[i + 2] = cc[2] + n * 24 + gr; d[i + 3] = 255; }
  g.putImageData(img, 0, 0);
});
// ---------- 做旧罩层：粉化、剥落露白灰地仗（避开保护区）、龟裂、烟熏 ----------
// keep: [[x0,y0,x1,y1],...] 主体保护区；amt：剥落阈值（越大越少）
DH.aging = (key, { keep = [], amt = 0.31, cracks = 420, smoke = 300, seed = 91, w = W, h = H } = {}) => P.cached('dha_' + key, w, h, (g) => {
  const img = g.createImageData(w, h), d = img.data, pl = P.hex(C.plaster), r = rng(seed);
  const inK = (x, y) => keep.some(b => x > b[0] && x < b[2] && y > b[1] && y < b[3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
    const n = P.fbm(x * 0.0032 + seed * 0.13, y * 0.0032 + 4, 5) + 0.12 * P.noise(x * 0.03, y * 0.03), k = inK(x, y);
    if (!k && n > amt) { const v = (r() - 0.5) * 22 + (n - amt) * 60; d[i] = pl[0] + v; d[i + 1] = pl[1] + v; d[i + 2] = pl[2] + v * 0.8; d[i + 3] = 255; }
    else if (!k && n > amt - 0.02) { d[i] = 70; d[i + 1] = 45; d[i + 2] = 30; d[i + 3] = 140; }
    else { const m = P.fbm(x * 0.02, y * 0.02 + 7, 3); d[i] = 255; d[i + 1] = 245; d[i + 2] = 225; d[i + 3] = clamp(m * 0.5 + 0.1) * 70; } }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(50,25,15,.32)'; g.lineWidth = 1;
  for (let k = 0; k < cracks; k++) { let x = r() * w, y = r() * h, a = r() * 6.28; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 5 + r() * 8; s++) { a += (r() - .5) * 1.4; x += Math.cos(a) * (5 + r() * 12); y += Math.sin(a) * (5 + r() * 12); g.lineTo(x, y); } g.stroke(); }
  if (smoke) { const sg = g.createLinearGradient(0, 0, 0, smoke); sg.addColorStop(0, 'rgba(40,20,10,.32)'); sg.addColorStop(1, 'rgba(40,20,10,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, smoke); }
});
// 褪色＋土纹（整幅），再叠做旧
DH.fade = (c, ageKey, ageOpt) => {
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,.28)'; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.45; c.drawImage(P.texture('dh_dirt', '#e8dcc8', { scale: 0.002, amt: 40, grain: 20, seed: 9 }), 0, 0); c.restore();
  if (ageKey) c.drawImage(DH.aging(ageKey, ageOpt), 0, 0);
};

// ---------- 祥云 ----------
DH.cloud = (c, x, y, s, t, ph = 0, col = C.white) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = col; c.fill(K.ribbon(K.densify([[24, 8], [60, 14 + Math.sin(ph) * 3], [100, 6 + Math.sin(ph + 1) * 6], [130, 12]], 5), q => 18 * (1 - q) + 1));
  c.strokeStyle = C.line; c.lineWidth = 2.2 / s;
  [[0, 0, 18], [-22, 6, 13], [20, 6, 14], [-8, -14, 12], [10, -12, 11]].forEach(([dx, dy, r]) => { c.fillStyle = col; c.beginPath(); c.arc(dx, dy, r, 0, Math.PI * 2); c.fill(); c.stroke(); });
  c.fillStyle = col; c.beginPath(); c.ellipse(0, 4, 32, 12, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = C.green; [[0, 0, 10], [-22, 6, 7], [20, 6, 8]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(dx, dy, r, 0.3, Math.PI * 1.7); c.stroke(); });
  c.restore();
};

// ---------- 青绿山（敦煌式：一个个馒头形小山层叠，边缘晕染、白线勾、山头小树） ----------
DH.hills = (c, list, { col = C.green, dk = C.greenDk, edge = 26, trees = true, seed = 7 } = {}) => {
  const r = rng(seed);
  list.forEach(([x, y, w, h], k) => {
    const pts = [[x - w / 2, y], [x - w * 0.36, y - h * 0.55], [x - w * 0.14, y - h * 0.95], [x + w * 0.08, y - h], [x + w * 0.3, y - h * 0.7], [x + w / 2, y]];
    const p = new Path2D(); const d = K.densify(pts, 8); d.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath();
    const cc = k % 3 === 2 ? C.blue2 : col, cd = k % 3 === 2 ? C.blue : dk;
    c.fillStyle = cc; c.fill(p);
    c.save(); c.clip(p); c.strokeStyle = cd; c.globalAlpha = 0.7; c.lineWidth = edge; c.stroke(p); c.globalAlpha = 0.35; c.lineWidth = edge * 2.2; c.stroke(p); c.restore();
    c.strokeStyle = C.white; c.lineWidth = 2; c.globalAlpha = 0.8; c.beginPath(); d.slice(4, -4).forEach((q, i) => i ? c.lineTo(q[0], q[1] + 10) : c.moveTo(q[0], q[1] + 10)); c.stroke(); c.globalAlpha = 1;
    c.strokeStyle = C.line; c.lineWidth = 2.2; c.stroke(p);
    c.save(); c.clip(p); c.strokeStyle = cd; c.globalAlpha = 0.55; c.lineWidth = 2; for (let j = 0; j < 4; j++) { const sx = x - w * 0.3 + r() * w * 0.6, sy = y - h * (0.2 + r() * 0.5); c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + 20, sy + 30, sx + 6 + r() * 30, sy + 60); c.stroke(); } c.restore();
    if (trees) for (let j = 0; j < 2; j++) { const q = d[Math.floor(d.length * (0.3 + 0.35 * j + r() * 0.1))]; DH.tree(c, q[0], q[1] + 2, 0.6 + r() * 0.4); }
  });
};
DH.tree = (c, x, y, s) => { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = C.brown; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26); c.stroke();
  [[-9, -26], [9, -30], [0, -40], [-4, -18], [6, -16]].forEach(([dx, dy]) => { c.fillStyle = C.greenDk; c.beginPath(); c.ellipse(dx, dy, 9, 6, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.line; c.lineWidth = 1.4; c.stroke(); }); c.restore(); };

// ---------- 骆驼（侧面朝右，四腿行走；ph 步态相位） ----------
DH.camel = (c, x, y, s, ph, { col = C.ochre2, load = true } = {}) => {
  c.save(); c.translate(x, y); c.scale(s, s);
  const leg = (hx, hy, a, len1 = 62, len2 = 64, fill = col) => { const kx = hx + Math.sin(a) * 20, ky = hy + len1, lift = Math.max(0, Math.sin(a)) * 14, fx = kx + Math.sin(a - 0.5) * 10, fy = ky + len2 - lift;
    const p = K.ribbon(K.densify([[hx, hy - 24], [hx + (kx - hx) * 0.5, hy + len1 * 0.45], [kx, ky], [fx, fy]], 5), q => q < 0.4 ? 34 - q * 40 : q < 0.62 ? 18 + Math.sin((q - 0.4) / 0.22 * Math.PI) * 5 : 15 - (q - 0.62) * 10); F(c, p, fill, 2.2);
    F(c, DH.ell(fx + 4, fy + 1, 13, 6), C.brown, 1.8); };
  const g = 0;
  leg(-58, 30, ph + Math.PI, 62, 64, C.ochre); leg(52, 30, ph, 62, 64, C.ochre);   // 远侧腿（暗一点）
  // 身体＋双峰
  const body = DH.sm([[-92, 10], [-80, -30], [-56, -44], [-38, -80], [-18, -48], [8, -46], [26, -84], [48, -50], [80, -30], [96, 0], [88, 34], [40, 42], [-40, 42], [-86, 34]]);
  F(c, body, col);
  // 脖子＋头（往前伸、上下点头）
  const nod = Math.sin(ph * 2) * 4;
  const neck = K.ribbon(K.densify([[84, -6], [120, 10], [146, -20 + nod], [154, -60 + nod]], 6), q => 34 - q * 14); F(c, neck, col);
  const head = DH.sm([[142, -66 + nod], [160, -78 + nod], [190, -70 + nod], [196, -58 + nod], [176, -52 + nod], [150, -50 + nod]]); F(c, head, col);
  c.fillStyle = C.line; c.beginPath(); c.arc(170, -68 + nod, 2.6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.moveTo(150, -76 + nod); c.lineTo(146, -86 + nod); c.lineTo(156, -80 + nod); c.stroke();   // 耳
  // 驼毛（颈下、峰顶）：短弧线
  c.strokeStyle = C.brown; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(112 + i * 6, 16 - i * 6, 6, 0.2, 2.2); c.stroke(); }
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-40 + i * 4, -74 + i * 2, 5, 3.4, 5.4); c.stroke(); c.beginPath(); c.arc(24 + i * 4, -78 + i * 2, 5, 3.4, 5.4); c.stroke(); }
  if (load) { // 驮包：两峰之间的条纹毯子＋丝绸卷
    const blanket = DH.sm([[-22, -50], [10, -50], [16, 6], [-28, 6]]); F(c, blanket, C.red, 2);
    c.save(); c.clip(blanket); for (let k = -30; k < 20; k += 10) { c.fillStyle = k % 20 ? C.white : C.green; c.fillRect(-40, k + 4, 70, 4); } c.restore(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke(blanket);
    F(c, DH.ell(-6, -54, 20, 10), C.blue2, 2); F(c, DH.ell(-6, -54, 6, 10), C.white, 1.6);
  }
  leg(-50, 30, ph, 62, 64); leg(60, 30, ph + Math.PI, 62, 64);
  // 尾巴
  c.strokeStyle = C.line; c.lineWidth = 3; c.beginPath(); c.moveTo(-90, 0); c.quadraticCurveTo(-104, 20 + Math.sin(ph * 2) * 4, -98, 40); c.stroke();
  c.restore();
};
// ---------- 行人（侧影，朝右走；胡帽、长袍；脸被帽檐和角度遮住，只露一点侧脸轮廓） ----------
DH.walker = (c, x, y, s, ph, { robe = C.blue, hat = C.white, staff = true, back = false, jie = false } = {}) => {
  c.save(); c.translate(x, y); c.scale(back ? -s : s, s);
  const st = Math.sin(ph) * 16;
  // 腿（袍下露小腿和靴）
  [[-st, C.line], [st, C.ink]].forEach(([d, cl]) => { c.strokeStyle = C.ink; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -40); c.lineTo(d, 0); c.stroke(); });
  // 袍：梯形，下摆随步伐摆
  const robeP = DH.sm([[-14, -128], [14, -128], [24, -70], [32 + st * 0.3, -30], [-30 + st * 0.3, -28], [-22, -70]]);
  F(c, robeP, robe); c.strokeStyle = C.white; c.lineWidth = 3; c.beginPath(); c.moveTo(6, -126); c.lineTo(-2, -92); c.stroke();   // 交领
  c.fillStyle = C.red; c.fillRect(-20, -86, 42, 6);   // 腰带
  // 手臂（前摆）
  const arm = K.ribbon([[2, -118], [14 + st * 0.4, -92], [26 + st * 0.2, -76]], q => 14 - q * 4); F(c, arm, robe, 2);
  F(c, DH.ell(28 + st * 0.2, -74, 6, 6), C.skin, 1.8);
  if (staff && !jie) { c.strokeStyle = C.brown; c.lineWidth = 4; c.beginPath(); c.moveTo(34 + st * 0.2, -120); c.lineTo(22 + st * 0.2, 0); c.stroke(); }
  if (jie) { // 汉节：竹竿＋三重牦牛尾节旄，随风摆
    const bx = 30 + st * 0.2; c.strokeStyle = C.brown; c.lineWidth = 4.5; c.beginPath(); c.moveTo(bx + 6, -250); c.lineTo(bx - 4, 0); c.stroke();
    for (let k = 0; k < 3; k++) { const yy = -246 + k * 34, sw = Math.sin(ph * 0.7 + k) * 6; c.fillStyle = C.red; c.beginPath(); c.moveTo(bx + 6 - k, yy); c.quadraticCurveTo(bx - 14 + sw, yy + 10, bx - 22 + sw * 1.6, yy + 30); c.quadraticCurveTo(bx - 4 + sw, yy + 22, bx + 10 - k, yy + 4); c.closePath(); c.fill(); c.strokeStyle = C.line; c.lineWidth = 1.6; c.stroke(); c.fillStyle = C.gold; c.fillRect(bx + 1 - k, yy - 3, 10, 5); } }
  // 头：侧脸剪影（额、鼻、唇、下巴一笔勾出，不画眼），幞头或尖顶胡帽
  F(c, DH.sm([[-10, -128], [6, -128], [12, -134], [16, -140], [14, -144], [19, -150], [15, -153], [15, -160], [6, -170], [-10, -168], [-16, -150]]), C.skin, 2, '#8a3a24');
    if (hat === 'futou') { F(c, DH.sm([[-18, -152], [10, -162], [12, -176], [-2, -186], [-18, -176]]), C.ink, 1.6); c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(-16, -168); c.quadraticCurveTo(-34, -164 + Math.sin(ph) * 3, -40, -150); c.stroke(); }
  else F(c, DH.sm([[-20, -156], [16, -158], [6, -176], [-4, -194], [-14, -174]]), hat, 2);
  F(c, DH.sm([[2, -166], [-12, -168], [-17, -150], [-12, -132], [-4, -130], [-2, -142], [0, -154]]), C.ink, 0);   // 后脑头发（只露前半张侧脸）
  c.restore();
};
// ---------- 飘带（丝绸）：点列 → 双色带＋白点纹；返回末端点 ----------
DH.silk = (c, pts, w, { face = C.blue2, back = C.red, dots = true, t = 0 } = {}) => {
  const D = K.densify(pts, 5);
  const wq = q => w * (0.6 + 0.4 * Math.abs(Math.sin(q * 7 - t * 2.4))) * (1 - q * 0.35);
  F(c, K.ribbon(D, q => wq(q) * 1.18), back, 0);
  F(c, K.ribbon(D, wq), face, 2.2);
  if (dots) { c.fillStyle = C.white; D.forEach((p, i) => { if (i % 6 !== 3) return; c.beginPath(); c.arc(p[0], p[1], 2.6, 0, Math.PI * 2); c.fill(); }); }
  return D[D.length - 1];
};
// ---------- 莲花（俯视，八瓣两层） ----------
DH.lotus = (c, x, y, r, rot = 0) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  for (let L = 0; L < 2; L++) for (let k = 0; k < 8; k++) { c.save(); c.rotate(k * Math.PI / 4 + L * Math.PI / 8); const rr = r * (L ? 0.68 : 1);
    const p = DH.sm([[0, -rr * 0.15], [-rr * 0.22, -rr * 0.55], [0, -rr], [rr * 0.22, -rr * 0.55]]); F(c, p, L ? C.white : (k % 2 ? C.green2 : C.blue2), 2); c.restore(); }
  F(c, DH.ell(0, 0, r * 0.26, r * 0.26), C.gold, 2); c.fillStyle = C.red; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(Math.cos(k) * r * 0.13, Math.sin(k) * r * 0.13, r * 0.035, 0, Math.PI * 2); c.fill(); }
  c.restore();
};
// ---------- 边饰：卷草带（水平），联珠带 ----------
DH.vineBand = (c, x0, y0, x1, h, { bg = C.green, fg = C.white, ph = 0 } = {}) => {
  c.fillStyle = bg; c.fillRect(x0, y0, x1 - x0, h); c.strokeStyle = fg; c.lineWidth = 3;
  c.beginPath(); for (let x = x0; x <= x1; x += 4) { const y = y0 + h / 2 + Math.sin((x + ph) * 0.045) * h * 0.22; x === x0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
  for (let x = x0 + ((-ph) % 70 + 70) % 70; x < x1; x += 70) { const y = y0 + h / 2 + Math.sin((x + ph) * 0.045) * h * 0.22, up = Math.floor((x + ph) / 70) % 2; c.beginPath(); c.arc(x, y + (up ? -h * 0.16 : h * 0.16), h * 0.17, up ? Math.PI : 0, (up ? Math.PI : 0) + Math.PI * 1.5); c.stroke(); }
  c.strokeStyle = C.line; c.lineWidth = 2.5; c.strokeRect(x0, y0, x1 - x0, h);
};
DH.pearlBand = (c, x0, y0, x1, h, { bg = C.redDk, fg = C.white } = {}) => {
  c.fillStyle = bg; c.fillRect(x0, y0, x1 - x0, h); c.fillStyle = fg; for (let x = x0 + h / 2; x < x1; x += h * 1.1) { c.beginPath(); c.arc(x, y0 + h / 2, h * 0.32, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = C.line; c.lineWidth = 2; c.strokeRect(x0, y0, x1 - x0, h);
};
DH.valance = (c, x0, y0, x1, { tri = 64, h = 50, ph = 0 } = {}) => {   // 垂幔：三角垂帐＋金珠
  const cols = [C.blue, C.green, C.white, C.red];
  for (let x = x0, k = 0; x < x1; x += tri, k++) { c.fillStyle = cols[k % 4]; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + tri, y0); c.lineTo(x + tri / 2, y0 + h + Math.sin(ph + k) * 2); c.closePath(); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
    c.fillStyle = C.gold; c.beginPath(); c.arc(x + tri / 2, y0 + h + 5 + Math.sin(ph + k) * 2, 5, 0, Math.PI * 2); c.fill(); }
};
// ---------- 榜题：竖长方块，墨书竖排（敦煌壁画旁的题记框） ----------
DH.bangti = (c, x, y, lines, { size = 44, w, pad = 18, bg = '#e6d6b2', col = C.ink, sub, subCol = C.redDk, seed = 4, alpha = 1 } = {}) => {
  const cols = Array.isArray(lines) ? lines : [lines], n = Math.max(...cols.map(s => [...s].length));
  const bw = w || cols.length * size * 1.25 + pad * 2, bh = n * size * 1.12 + pad * 2;
  c.save(); c.globalAlpha = alpha; c.fillStyle = bg; c.fillRect(x, y, bw, bh); c.strokeStyle = C.line; c.lineWidth = 3; c.strokeRect(x, y, bw, bh); c.lineWidth = 1.5; c.strokeRect(x + 6, y + 6, bw - 12, bh - 12);
  c.font = `${size}px "LXGWWenKai-500"`; c.textAlign = 'center'; c.textBaseline = 'top';
  cols.forEach((s, j) => { c.fillStyle = j === 0 ? col : subCol; const cx = x + bw - pad - size * 0.62 - j * size * 1.25; [...s].forEach((ch, i) => c.fillText(ch, cx, y + pad + i * size * 1.12)); });
  const r = rng(seed); c.fillStyle = 'rgba(216,198,162,.85)'; for (let i = 0; i < 9; i++) { c.beginPath(); K.blob(c, x + r() * bw, y + r() * bh, 3 + r() * 7, i + seed, 0.3, 8); c.fill(); }
  c.restore(); return [bw, bh];
};
// ---------- 天花（散花）粒子 ----------
DH.petals = (c, t, { n = 24, seed = 13, x0 = 0, x1 = W, y0 = 0, y1 = H, speed = 70, scale = 1.4 } = {}) => {
  P.particles(n, seed, t, { x0, x1, y0, y1, speed, drift: 50, life: 4 }).forEach(p => { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.scale(p.s * scale, p.s * scale * (Math.abs(Math.cos(t * 3 + p.i)) * 0.8 + 0.2));
    const fc = [C.white, C.red, C.green2, '#e8a0a0'][p.i % 4]; for (let j = 0; j < 4; j++) { c.rotate(Math.PI / 2); c.fillStyle = fc; c.beginPath(); c.ellipse(0, -7, 4, 8, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.line; c.lineWidth = 1.2; c.stroke(); } c.restore(); });
};
// ---------- 手（敦煌菩萨式：掌心向上托物；袖口石青白边）。(x,y)=掌心，a=手腕方向角 ----------
DH.handUp = (c, x, y, s, { sleeve = C.blue, cuff = C.white, a = 0 } = {}) => {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  // 袖
  F(c, DH.sm([[60, 30], [240, 70], [300, 210], [150, 230], [40, 110]]), sleeve, 3);
  c.strokeStyle = C.white; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(110 + k * 40, 70 + k * 10); c.quadraticCurveTo(150 + k * 40, 130, 130 + k * 46, 200); c.stroke(); }
  F(c, DH.sm([[40, 20], [80, 30], [76, 120], [30, 104]]), cuff, 3);
  // 金钏
  F(c, DH.sm([[36, 26], [52, 30], [56, 104], [38, 108]]), C.gold, 2.2);
  // 掌：掌心向上，四指并拢向左平伸，指尖微翘（菩萨托物式）
  const palm = DH.sm([[40, 34], [42, 100], [0, 112], [-46, 104], [-92, 92], [-136, 80], [-160, 66], [-166, 54], [-150, 50], [-110, 56], [-70, 54], [-30, 44], [0, 36]]);
  F(c, palm, C.skin, 2.6, '#8a3a24');
  c.strokeStyle = '#8a3a24'; c.lineWidth = 1.8;
  [[-60, 66, -150, 58], [-56, 78, -140, 72], [-50, 90, -124, 86]].forEach(([a1, b1, a2, b2]) => { c.beginPath(); c.moveTo(a1, b1); c.quadraticCurveTo((a1 + a2) / 2, (b1 + b2) / 2 + 5, a2, b2); c.stroke(); });
  c.beginPath(); c.moveTo(20, 60); c.quadraticCurveTo(-10, 84, -40, 80); c.stroke();   // 掌纹
  // 拇指：从掌根向上翘起
  F(c, DH.sm([[24, 38], [0, 18], [-22, 2], [-34, -4], [-36, 6], [-20, 22], [-6, 40]]), C.skin, 2.4, '#8a3a24');
  c.restore();
};
DH.lamp = (c, x, y, s, t) => {   // 灯盏＋火苗（x,y 盏口中心）
  c.save(); c.translate(x, y); c.scale(s, s);
  F(c, new Path2D('M-46 0 Q0 30 46 0 L38 18 Q0 40 -38 18 Z'), C.gold, 2.4);
  F(c, new Path2D('M-12 30 L12 30 L18 46 L-18 46 Z'), C.gold, 2);
  const fl = 1 + Math.sin(t * 17) * 0.12 + Math.sin(t * 29) * 0.08, sw = Math.sin(t * 11) * 5;
  F(c, new Path2D(`M-10 0 Q${-14 + sw} ${-10 - 20 * fl} ${sw} ${-50 * fl} Q${16 + sw * 0.5} ${-14 * fl} 10 0 Z`), '#f2a43a', 2);
  c.fillStyle = '#fbe7a0'; c.beginPath(); c.ellipse(sw * 0.4, -10, 5, 12 * fl, 0, 0, Math.PI * 2); c.fill();
  c.restore();
};
})();
