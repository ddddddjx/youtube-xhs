// v3 · Vox 黑卡调查墙：一整面墙（世界坐标，宽约 1080、高约 5800），相机按 CAM.track 在证据之间移动。
// 画风锁：近黑纸板＋网点照片（白边、胶带、图钉）＋旧地图卡（红墨）＋红线＋黑/纸白撕边标签；元素 12fps 一拍二，相机平滑。
// 色板：#1c1b19 板 / #e4dccf 旧地图纸 / #f2efe6 纸白 / #b8433f 线索红 / #93403c 暗红 / #dacf08 荧光（只划重点）。
(() => {
const { clamp, lerp } = U, W = 1080, H = 1920;
const RED = '#b8433f', RED2 = '#93403c', INK = '#1b1b1a', PAPER = '#f2efe6', MAPP = '#e4dccf';
const im = k => IMG['img/' + k + '.jpg'];
const S = (t) => MO.step(t, 12);                      // 元素层一拍二
const W3 = window.WALL = {};

// ---------- 相机 ----------
const LT = MO.longTail;
W3.camEvents = [
  { at: 2.95, kind: 'to', x: 560, y: 690, z: 1.3, dur: 0.85, ease: LT },     // 从照片拉出 → 露出整面墙
  { at: 5.6, kind: 'to', x: 800, y: 930, z: 1.75, dur: 0.3 },                 // 横到出土照片
  { at: 8.6, kind: 'to', x: 890, y: 1900, z: 9.4, dur: 1.1, ease: LT },       // 沿红线追进地图卡上的一号坑
  { at: 15.8, kind: 'to', x: 790, y: 1190, z: 2.2, dur: 0.7, ease: LT },      // 找到一号坑照片
  { at: 16.45, kind: 'punch', k: 0.3 },                                       // 推进照片 → 16.8 硬切高清
  { at: 19.0, kind: 'cut', x: 904, y: 1878, z: 6.9 },                         // 回到地图：四个坑
  { at: 28.6, kind: 'to', x: 540, y: 1960, z: 1.1, dur: 1.0, ease: LT },      // 拉出：整张地图，陵在西边
  { at: 31.0, kind: 'to', x: 380, y: 2700, z: 1.8, dur: 0.6, ease: LT },      // 沿线到陵墓照片
  { at: 35.0, kind: 'cut', x: 540, y: 3420, z: 1.0 },                         // 人脸墙
  { at: 41.0, kind: 'cut', x: 540, y: 4300, z: 1.06 },                        // 剖面卡
  { at: 44.6, kind: 'to', x: 300, y: 4980, z: 1.75, dur: 0.5, ease: LT },     // 史记卡
  { at: 47.8, kind: 'pan', x: 790, y: 5010, dur: 0.3 },                       // 汞检测卡
  { at: 51.0, kind: 'to', x: 540, y: 5560, z: 1.6, dur: 0.5, ease: LT },      // 红漆甲片
  { at: 53.6, kind: 'cut', x: 380, y: 2700, z: 1.8 }, { at: 53.75, kind: 'slam' }, { at: 53.75, kind: 'shake', amp: 18 },   // 回到陵墓照片盖章
  { at: 56.0, kind: 'to', x: 540, y: 3000, z: 0.38, dur: 1.4, ease: LT },     // 拉远：整面墙
];
W3.cam = t => CAM.track({ x: 330, y: 600, z: 2.6 }, W3.camEvents, t);

// ---------- 素材件 ----------
const ht = (key, k, w, h, fx = 0.5, fy = 0.5, z = 1, o = {}) => CL.halftone('w3_' + key, PAINT.cached('w3src_' + key, w, h, g => { g.filter = o.filter || 'none'; MD.cover(g, im(k), { w, h, fx, fy, z }); }), { cell: o.cell || 4, ink: '#1b1b1b', paper: '#ece6d8', contrast: 1.25 });
const colorSrc = (key, k, w, h, fx, fy, z, filter = 'none') => PAINT.cached('w3c_' + key + filter, w, h, g => { g.filter = filter; MD.cover(g, im(k), { w, h, fx, fy, z }); });
// 冲印件：白边＋图＋胶带＋投影；返回四角世界坐标需要的尺寸
const print = (c, src, x, y, r, { b = 14, tape = true, pinAt } = {}) => { const w = src.width + b * 2, h = src.height + b * 2;
  CL.placed(c, x, y, r, g => { CL.shadowed(g, () => { g.fillStyle = PAPER; g.fillRect(-w / 2, -h / 2, w, h); }, { col: 'rgba(0,0,0,.55)', blur: 16, x: 4, y: 9 }); g.drawImage(src, -w / 2 + b, -h / 2 + b, src.width, src.height);
    if (tape) { CL.tape(g, -w / 2 + 34, -h / 2 + 4, -0.6, 100); CL.tape(g, w / 2 - 34, -h / 2 + 4, 0.55, 100); } }); };
const hand = (c, s, x, y, size, col = '#2a2622', r = 0, n = 1e9) => { c.save(); c.translate(x, y); c.rotate(r); c.font = `600 ${size}px "Caveat-600"`; c.fillStyle = col; c.fillText([...s].slice(0, Math.max(0, n)).join(''), 0, 0); c.restore(); };
const typed = (t, at, rate = 14) => t < at ? 0 : Math.ceil((S(t - at) + 1 / 12) * rate);
const card = (c, x, y, w, h, r, fill = '#f6f3ea', ruled = true) => CL.placed(c, x, y, r, g => { CL.shadowed(g, () => { g.fillStyle = fill; g.fillRect(-w / 2, -h / 2, w, h); }, { col: 'rgba(0,0,0,.55)', blur: 16, x: 4, y: 9 });
  if (ruled) { g.strokeStyle = 'rgba(80,120,170,.3)'; g.lineWidth = 1.5; for (let yy = -h / 2 + 70; yy < h / 2; yy += 46) { g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke(); } g.strokeStyle = 'rgba(184,67,63,.5)'; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 46); g.lineTo(w / 2, -h / 2 + 46); g.stroke(); } });
// 红线：a→b，按 12fps 从 at 起 dur 秒描完（world 坐标，线宽给屏幕像素）
const string = (c, a, b, t, at, dur, z, sag = 0.06) => { if (t < at) return; const pts = CL.stringPts(a, b, sag), cum = DG.cum(pts), L = cum[cum.length - 1];
  CL.string(c, pts, cum, L * MO.cubicOut(clamp((S(t) - at) / dur)), { lw: 5 / z, shadow: 'rgba(0,0,0,.35)' }); };
const circle = (c, x, y, rx, ry, q, lw) => { if (q <= 0) return; c.save(); c.strokeStyle = RED; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); const n = 60; for (let i = 0; i <= n * q * 1.08; i++) { const a = -1.2 + i / n * 6.6, rr = 1 + 0.05 * Math.sin(i * 0.7); const X = x + Math.cos(a) * rx * rr, Y = y + Math.sin(a) * ry * rr; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); c.restore(); };

// ---------- 地图卡：米 → 世界坐标（0.4 单位/米），兵马俑坑原点在 (890,1900) ----------
const MX = x => 890 + x * 0.4, MY = y => 1900 + y * 0.4;
const inkRect = (c, x0, y0, x1, y1, q, lw, col = RED, dash) => { if (q <= 0) return; const X0 = MX(x0), Y0 = MY(y0), w = MX(x1) - X0, h = MY(y1) - Y0, per = 2 * (w + h);
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || [per * q, per]); c.strokeRect(X0, Y0, w, h); c.restore(); };
const inkPoly = (c, pts, q, lw, col = RED) => { if (q <= 0) return; const P = pts.map(p => [MX(p[0]), MY(p[1])]); let per = 0; P.forEach((p, i) => { const n = P[(i + 1) % P.length]; per += Math.hypot(n[0] - p[0], n[1] - p[1]); });
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash([per * q, per]); c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); c.restore(); };
function mapCard(c, t, z) { const lw = 3.2 / z;
  card(c, 540, 1960, 920, 1240, 0.008, MAPP, false);
  c.save(); c.strokeStyle = 'rgba(60,50,40,.13)'; c.lineWidth = 1.2 / Math.max(1, z * 0.5); for (let x = 100; x < 990; x += 40) { c.beginPath(); c.moveTo(x, 1345); c.lineTo(x, 2575); c.stroke(); } for (let y = 1360; y < 2575; y += 40) { c.beginPath(); c.moveTo(85, y); c.lineTo(995, y); c.stroke(); } c.restore();
  hand(c, 'Lintong, Xi\'an — site plan', 110, 1400, 34, 'rgba(40,34,28,.7)');
  // 一号坑：11 条过洞，兵俑点阵由东往西列队（12fps 步进）
  const t1 = 9.9; inkRect(c, -115, -31, 115, 31, clamp((S(t) - 9.7) / 0.6), lw);
  if (t > t1) { c.fillStyle = INK; const rows = 11, per = 62 / rows;
    for (let r = 0; r < rows; r++) { if (r) { c.fillStyle = 'rgba(147,64,60,.45)'; c.fillRect(MX(-115), MY(-31 + per * r) - 0.08, 92, 0.16); c.fillStyle = INK; }
      for (let k = 0; k < 3; k++) { const yy = -31 + per * r + per * (k + 1) / 4; for (let x = 113; x > -114; x -= 2.2) { if ((S(t) - t1) * 1.0 < (113 - x) / 230 * 2.6 + r * 0.02) break; c.fillRect(MX(x) - 0.13, MY(yy) - 0.13, 0.26, 0.26); } } } }
  // 两个橄榄球场（109.7×48.8 m）贴在坑下方比长度
  const fq = clamp((S(t) - 13.2) / 0.5); if (fq > 0 && t < 19) { c.save(); c.globalAlpha = fq; for (let i = 0; i < 2; i++) { const x0 = -112 + i * 112, y0 = 40;
    c.fillStyle = 'rgba(242,239,230,.9)'; c.fillRect(MX(x0), MY(y0), 109.7 * 0.4, 48.8 * 0.4); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.strokeRect(MX(x0), MY(y0), 109.7 * 0.4, 48.8 * 0.4);
    c.lineWidth = lw * 0.4; for (let j = 0; j <= 10; j++) { const x = x0 + 9.14 + j * 9.14; c.beginPath(); c.moveTo(MX(x), MY(y0)); c.lineTo(MX(x), MY(y0 + 48.8)); c.stroke(); } } c.restore(); }
  // 其余三个坑
  inkPoly(c, [[94, -142], [188, -142], [188, -52], [64, -52], [64, -100], [94, -100]], clamp((S(t) - 19.6) / 0.7), lw);
  inkRect(c, -112, -78, -84, -54, clamp((S(t) - 22.1) / 0.5), lw);
  if (t > 24.6) { inkRect(c, -50, -102, 44, -56, 1, lw, RED, [6 / z, 5 / z]); if (t > 24.9) { c.save(); c.font = `800 ${16}px "Inter"`; c.textAlign = 'center'; c.fillStyle = RED; c.fillText('?', MX(-3), MY(-72)); c.restore(); } }
  // 朝东的红箭头（全部）
  if (t > 27.2) [[60, -12], [60, 12], [-40, 0], [150, -110], [-86, -66], [140, -70]].forEach(([x, y], i) => { const q = clamp((S(t) - 27.2 - i * 0.08) / 0.35); if (q <= 0) return; const X = MX(x), Y = MY(y), L = 14 * q;
    c.save(); c.strokeStyle = RED; c.fillStyle = RED; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + L, Y); c.stroke(); c.beginPath(); c.moveTo(X + L + 4, Y); c.lineTo(X + L, Y - 3); c.lineTo(X + L, Y + 3); c.closePath(); c.fill(); c.restore(); });
  // 陵园（西 1.5 km）：外城 940×2165、内城 580×1355、封土 350 见方
  if (t > 29.2) { const q = clamp((S(t) - 29.2) / 0.8), mx = -1500;
    inkRect(c, mx - 470, -1082, mx + 470, 1082, q, 3.2 / z, INK); inkRect(c, mx - 290, -677, mx + 290, 677, clamp((S(t) - 29.5) / 0.7), 3.2 / z, INK);
    if (t > 30.0) { c.fillStyle = 'rgba(147,64,60,.75)'; c.fillRect(MX(mx - 175), MY(-175), 140, 140); }
    c.save(); c.setLineDash([10, 8]); c.strokeStyle = RED; c.lineWidth = 3.5 / z; c.beginPath(); c.moveTo(MX(-125), MY(0)); c.lineTo(lerp(MX(-125), MX(mx + 180), clamp((S(t) - 29.4) / 0.8)), MY(0)); c.stroke(); c.restore();
    if (t > 30.2) hand(c, '1 mile', MX(-760), MY(0) - 14, 40, RED, 0, typed(t, 30.2));
    if (t > 29.8) hand(c, "Emperor's tomb", MX(mx) - 120, MY(-1082) - 18, 40, INK, 0, typed(t, 29.8)); }
}

// ---------- 整面墙 ----------
const FACES = [['071', 0.42, 0.28, 1.6], ['082', 0.56, 0.38, 1.2], ['074', 0.5, 0.3, 1.4], ['000', 0.53, 0.47, 1.0], ['072', 0.27, 0.33, 1.5], ['031', 0.5, 0.17, 2.2], ['075', 0.4, 0.24, 1.7], ['084', 0.33, 0.25, 2.4], ['002', 0.52, 0.42, 1.3]];
W3.draw = (c, t) => {
  const cam = W3.cam(t), z = cam.z;
  CAM.with(c, cam, c => {
    CL.fillPaper(c, CL.paperTile('w3board', '#1c1b19', { amt: 6, fiberCol: [70, 64, 55] }), -3000, -3000, 7000, 12000);
    // 1 面孔照片（开场那张）＋ 1974 卡 ＋ 出土照片
    print(c, ht('face', '000', 420, 540, 0.53, 0.47, 1.0), 330, 600, -0.04); CL.pin(c, 330, 330);
    card(c, 790, 420, 440, 270, 0.035); const n74 = typed(t, 3.7);
    if (n74) { hand(c, 'March 1974', 600, 380, 52, '#2a2622', 0.035, n74); hand(c, 'Lintong, China', 605, 430, 44, '#2a2622', 0.035, n74 - 10); hand(c, 'farmers digging a well', 610, 478, 40, '#2a2622', 0.035, n74 - 24); }
    print(c, ht('dig', '036', 520, 390, 0.62, 0.58, 1.25), 800, 930, 0.03); CL.pin(c, 800, 720);
    circle(c, 812, 905, 46, 62, clamp((S(t) - 6.0) / 0.65), 6);       // 036 号照片里那张脸
    string(c, [330, 330], [800, 720], t, 3.0, 0.5, z);
    // 地图卡 ＋ 一号坑照片 ＋ 陵墓照片
    mapCard(c, t, z);
    print(c, ht('pit', '107', 440, 320, 0.5, 0.62, 1.15), 790, 1190, 0.04); CL.pin(c, 790, 1010);
    string(c, [800, 1110], [890, 1888], t, 8.5, 0.6, z, 0.03);
    string(c, [790, 1010], [895, 1890], t, 15.6, 0.4, z, 0.02);
    print(c, ht('tomb', '125', 480, 330, 0.47, 0.45, 1.3), 380, 2700, -0.03); CL.pin(c, 380, 2510);
    if (t > 30.6) string(c, [380, 2510], [MX(-1500), MY(0)], t, 30.6, 0.5, z, 0.02);
    // 人脸墙（35 秒起一张张钉上去）
    FACES.forEach(([k, fx, fy, fz], i) => { const at = 35.05 + [0, 4, 2, 6, 1, 7, 3, 8, 5][i] * 0.13; if (t < at) return; const r = Math.floor(i / 3), col = i % 3;
      print(c, ht('f' + k, k, 280, 240, fx, fy, fz, { filter: k === '000' ? 'grayscale(1)' : 'none' }), 205 + col * 335 + (r % 2) * 10, 3080 + r * 300, ((i * 37) % 7 - 3) * 0.015, { tape: false }); CL.pin(c, 205 + col * 335 + (r % 2) * 10, 2945 + r * 300); });
    if (t > 34.6) string(c, [380, 2860], [540, 2940], t, 34.6, 0.3, z);
    // 剖面卡（纸白方格）：封土、地下宫殿、深度、水银、弩机、雷达
    section(c, t, z);
    // 史记卡、汞检测卡
    card(c, 300, 4980, 500, 380, -0.03); const nq = typed(t, 44.9, 46);
    if (nq) { const L = ['Sima Qian, c. 94 BC:', '"mercury was made into', ' rivers and seas..."', '"crossbows set to shoot', ' anyone who comes near"']; let used = 0;
      L.forEach((s, i) => { hand(c, s, 80, 4880 + i * 46, i < 1 ? 36 : 42, i < 1 ? 'rgba(40,34,28,.7)' : '#2a2622', -0.03, nq - used); used += s.length; });
      CL.highlight(c, 76, 4895, 400, 38, clamp((S(t) - 46.0) / 0.6)); CL.highlight(c, 76, 4941, 300, 38, clamp((S(t) - 46.5) / 0.5)); }
    card(c, 790, 5010, 440, 340, 0.04); const nh = typed(t, 48.0, 30);
    if (nh) { hand(c, 'Hg  (mercury)', 600, 4920, 54, RED2, 0.04, nh); hand(c, '2020 study: air above', 600, 4980, 40, '#2a2622', 0.04, nh - 13); hand(c, 'the mound has far more', 600, 5026, 40, '#2a2622', 0.04, nh - 34); hand(c, 'mercury than normal', 600, 5072, 40, '#2a2622', 0.04, nh - 56); }
    if (t > 49.6) { c.save(); c.strokeStyle = RED; c.lineWidth = 5; c.beginPath(); c.moveTo(600, 5090); c.lineTo(lerp(600, 960, clamp((S(t) - 49.6) / 0.5)), 5100); c.stroke(); c.restore(); }
    string(c, [540, 4720], [300, 4800], t, 44.3, 0.3, z); string(c, [300, 4800], [790, 4850], t, 47.6, 0.3, z);
    // 红漆甲片（彩色，51 秒后褪成灰）
    const g = clamp((t - 51.6) / 1.4); print(c, colorSrc('paint' + Math.round(g * 12), '067', 600, 440, 0.5, 0.55, 1.25, `grayscale(${Math.round(g * 12) / 12})`), 540, 5560, -0.02); CL.pin(c, 540, 5325);
    string(c, [790, 5180], [540, 5325], t, 50.8, 0.3, z);
  });
  // 屏幕层：标签（世界坐标 → 屏幕，最后画，压在最上层）
  const L = (wx, wy, text, at, o = {}) => { if (t < at || (o.until && t > o.until)) return; const [sx, sy] = CAM.toScreen(cam, wx, wy); MD.label(c, text, sx, sy, { size: o.size || 46, fam: 'Inter', t, at, align: o.align || 'center', bg: o.bg, fg: o.fg, r: o.r || 0 }); };
  L(800, 1140, 'AN ENTIRE ARMY', 7.4, { bg: RED, size: 56, r: -0.03, until: 9.6 });
  L(MX(-115), MY(-31) - 3, 'PIT 1 · 755 FT', 10.2, { until: 19, align: 'left' });
  L(MX(-3), MY(100), '2 FOOTBALL FIELDS', 13.5, { bg: PAPER, fg: INK, size: 40, until: 19 });
  L(MX(188), MY(-142) - 3, 'PIT 2 · CAVALRY + CHARIOTS', 19.9, { align: 'right', size: 38, until: 28.6 });
  L(MX(-112), MY(-43), 'PIT 3 · COMMAND POST', 22.4, { align: 'left', size: 38, until: 28.6 });
  L(MX(-3), MY(-102) - 3, 'PIT 4 · EMPTY', 24.9, { bg: RED, size: 38, until: 28.6 });
  L(MX(40), MY(30), 'ALL FACING EAST →', 27.4, { bg: PAPER, fg: INK, size: 44, until: 28.7 });
  L(380, 2900, 'ONE MAN', 31.5, { bg: RED, size: 60, r: -0.03, until: 35 });
  L(380, 2470, '20+ SQ MI BURIAL COMPLEX', 32.3, { bg: PAPER, fg: INK, size: 40, until: 35 });
  L(800, 2905, '× 8,000', 37.6, { bg: RED, size: 70, until: 41 });
  if (t > 53.75 && t < 56.2) { const [sx, sy] = CAM.toScreen(cam, 380, 2700); c.save(); c.translate(sx, sy); c.rotate(-0.14); const k = MO.slamK((t - 53.75) / 0.17); c.scale(k, k);
    c.strokeStyle = RED; c.lineWidth = 12; c.strokeRect(-310, -90, 620, 180); c.font = '900 124px "Inter"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = RED; c.fillText('SEALED', 0, 6); c.restore(); }
  return cam;
};

// 剖面卡：纸白方格卡，墨线画封土、地面、地宫（红虚线）、100 ft 标注、水银河（银灰）、弩机、雷达弧
function section(c, t, z) { const cx = 540, cy = 4300, w = 940, h = 760;
  card(c, cx, cy, w, h, 0.0, PAPER, false);
  c.save(); c.strokeStyle = 'rgba(80,120,170,.18)'; c.lineWidth = 1; for (let x = cx - w / 2; x < cx + w / 2; x += 30) { c.beginPath(); c.moveTo(x, cy - h / 2); c.lineTo(x, cy + h / 2); c.stroke(); } for (let y = cy - h / 2; y < cy + h / 2; y += 30) { c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx + w / 2, y); c.stroke(); } c.restore();
  hand(c, 'Cross-section: tomb mound', cx - 430, cy - 330, 38, 'rgba(40,34,28,.75)');
  const GY = cy - 70;
  c.save(); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 460, GY); c.lineTo(cx - 360, GY); c.lineTo(cx - 170, GY - 190); c.quadraticCurveTo(cx, GY - 220, cx + 170, GY - 190); c.lineTo(cx + 360, GY); c.lineTo(cx + 460, GY); c.stroke();
  c.lineWidth = 1.5; for (let i = 0; i < 30; i++) { const x = cx - 340 + i * 23; c.beginPath(); c.moveTo(x, GY); c.lineTo(x + 30, GY - 30); c.stroke(); } c.restore();   // 剖面线
  // 雷达弧（41.2 起）
  if (t > 41.2) { c.save(); for (let i = 0; i < 3; i++) { const u = ((S(t) - 41.2) * 0.8 + i / 3) % 1; c.strokeStyle = `rgba(184,67,63,${0.8 * (1 - u)})`; c.lineWidth = 3; c.beginPath(); c.arc(cx, GY - 200, 40 + u * 420, 0.18 * Math.PI, 0.82 * Math.PI); c.stroke(); } c.restore(); }
  // 地宫
  const top = GY + 140, bot = GY + 300, pq = clamp((S(t) - 41.8) / 0.6);
  if (pq > 0) { c.save(); c.globalAlpha = pq; c.strokeStyle = RED; c.lineWidth = 4; c.setLineDash([14, 9]); c.strokeRect(cx - 300, top, 600, bot - top); c.setLineDash([]); c.strokeRect(cx - 120, top + 40, 240, bot - top - 70); c.restore();
    if (t > 42.3) { c.save(); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 400, GY); c.lineTo(cx + 400, top); c.moveTo(cx + 385, GY); c.lineTo(cx + 415, GY); c.moveTo(cx + 385, top); c.lineTo(cx + 415, top); c.stroke(); c.restore(); hand(c, '~100 ft', cx + 330, GY + 90, 44, INK, 0, typed(t, 42.3)); hand(c, 'hidden chamber', cx - 280, top - 14, 40, RED, 0, typed(t, 42.0)); } }
  // 水银河（银灰，44 起流）＋弩机（45 起）
  if (t > 44.0) { const f = clamp((S(t) - 44.0) / 1.6); for (let k = 0; k < 3; k++) { const yb = top + 45 + k * 40, pts = []; for (let x = cx - 290; x <= cx + 290; x += 10) pts.push([x, yb + Math.sin(x * 0.02 + k * 1.7) * 9]); const n = Math.floor(pts.length * f); if (n < 2) continue;
    c.save(); c.lineCap = 'round'; for (const [lw, col] of [[10, 'rgba(150,158,165,.45)'], [4, '#8d949a']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.slice(0, n).forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); }
    hand(c, 'mercury rivers?', cx - 280, bot + 46, 40, '#5f666c', 0, typed(t, 44.4)); }
  if (t > 45.0) [[cx - 300, 1], [cx + 300, -1]].forEach(([x, d]) => { c.save(); c.translate(x, (top + bot) / 2); c.scale(d, 1); c.strokeStyle = RED; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -24); c.quadraticCurveTo(22, 0, 0, 24); c.stroke(); c.beginPath(); c.moveTo(-12, 0); c.lineTo(36, 0); c.stroke(); c.restore(); });
}
})();
