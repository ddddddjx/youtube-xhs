// v3.1 · Vox 黑卡调查墙：一整面墙（世界坐标），相机按 CAM.track 在证据之间移动。审片（审片/v3_独立审片.md）后重排：
// 中段米色图解压到 8 秒、加满屏兵阵实拍；印章和标签全部在字幕带（y 1250–1500）以上；字幕改深色底板硬切；
// 标签打完再走；脸改清晰灰度照片；陵墓旁加秦始皇画像；画出弩机；结尾拉到墙宽 80% 并一路在动。
// 画风锁：近黑纸板＋灰度照片（白边、胶带、图钉）＋索引卡＋旧地图卡（红墨）＋红线＋撕边标签；元素 12fps 一拍二，相机平滑。
// 色板：#1c1b19 板 / #e4dccf 旧地图纸 / #f2efe6 纸白 / #b8433f 线索红 / #93403c 暗红 / #dacf08 荧光（只划重点）。
(() => {
const { clamp, lerp } = U, W = 1080, H = 1920;
const RED = '#b8433f', RED2 = '#93403c', INK = '#1b1b1a', PAPER = '#f2efe6', MAPP = '#e4dccf';
const im = k => IMG['img/' + k + '.jpg'];
const S = (t) => MO.step(t, 12);
const W3 = window.WALL = {};
const LT = MO.longTail;

// ---------- 相机 ----------
W3.camEvents = [
  { at: 2.4, kind: 'to', x: 560, y: 690, z: 1.3, dur: 0.8, ease: LT },       // 从照片拉出 → 露出墙
  { at: 5.4, kind: 'to', x: 800, y: 930, z: 1.75, dur: 0.3 },                // 横到出土照片
  { at: 8.0, kind: 'cut', x: 890, y: 1890, z: 9.4 },                         // （8–12 满屏实拍盖住）地图卡上的一号坑
  { at: 15.0, kind: 'to', x: 915, y: 1878, z: 6.9, dur: 0.5, ease: LT },     // 四个坑
  { at: 20.0, kind: 'to', x: 540, y: 2150, z: 0.95, dur: 1.0, ease: LT },    // 拉出：地图＋往下连到陵墓
  { at: 22.5, kind: 'to', x: 540, y: 2690, z: 1.05, dur: 0.6, ease: LT },    // 陵墓＋秦始皇
  { at: 26.0, kind: 'cut', x: 540, y: 3560, z: 1.0 },                        // 人脸墙
  { at: 31.0, kind: 'cut', x: 540, y: 4550, z: 1.06 },                       // 剖面卡
  { at: 35.0, kind: 'to', x: 300, y: 5200, z: 1.75, dur: 0.5, ease: LT },    // 史记卡
  { at: 39.0, kind: 'pan', x: 790, y: 5230, dur: 0.3 },                      // 汞卡
  { at: 42.5, kind: 'to', x: 540, y: 5900, z: 1.7, dur: 0.4, ease: LT },     // 工匠卡
  { at: 24.0, kind: 'punch', k: 0.2, x: 790, y: 2700 },                    // 推近：秦始皇
  { at: 28.5, kind: 'punch', k: 0.18, x: 540, y: 3620 },                   // 推近：人脸
  { at: 33.3, kind: 'punch', k: 0.22, x: 540, y: 4680 },                   // 推近：地宫
  { at: 37.0, kind: 'punch', k: 0.2, x: 280, y: 5140 },                    // 推近：荧光那两行
  { at: 40.7, kind: 'punch', k: 0.2, x: 780, y: 5270 },                    // 推近：红线下划线
  { at: 44.5, kind: 'punch', k: 0.2, x: 440, y: 5930 },                    // 推近：None came out
  { at: 46.0, kind: 'cut', x: 330, y: 610, z: 2.0 }, { at: 46.0, kind: 'slam' },          // 回到开场那张脸（回扣）
  { at: 49.5, kind: 'cut', x: 300, y: 2700, z: 1.8 }, { at: 49.7, kind: 'slam' }, { at: 49.7, kind: 'shake', amp: 18 },   // 盖章
  { at: 53.0, kind: 'to', x: 545, y: 2507, z: 0.72, dur: 1.3, ease: LT },
  { at: 56.8, kind: 'punch', k: 0.15, x: 545, y: 2560 },                  // 最后朝陵墓轻推一下，之后停住    // 拉出：地图卡＋陵墓（盖着 SEALED）＋画像整体居中入画，之后不再漂，红线光点在跑
];
W3.cam = t => CAM.track({ x: 330, y: 600, z: 2.6 }, W3.camEvents, t);

// ---------- 素材件 ----------
const gsrc = (key, k, w, h, fx, fy, z, filter = 'grayscale(1) contrast(1.15)') => PAINT.cached('w3g_' + key + filter, w, h, g => { g.filter = filter; MD.cover(g, im(k), { w, h, fx, fy, z }); });
const print = (c, src, x, y, r, { b = 14, tape = true } = {}) => { const w = src.width + b * 2, h = src.height + b * 2;
  CL.placed(c, x, y, r, g => { CL.shadowed(g, () => { g.fillStyle = PAPER; g.fillRect(-w / 2, -h / 2, w, h); }, { col: 'rgba(0,0,0,.55)', blur: 16, x: 4, y: 9 }); g.drawImage(src, -w / 2 + b, -h / 2 + b, src.width, src.height);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,200,170,.18)'; g.fillRect(-w / 2 + b, -h / 2 + b, src.width, src.height); g.restore();
    if (tape) { CL.tape(g, -w / 2 + 34, -h / 2 + 4, -0.6, 100); CL.tape(g, w / 2 - 34, -h / 2 + 4, 0.55, 100); } }); };
const hand = (c, s, x, y, size, col = '#2a2622', r = 0, n = 1e9) => { c.save(); c.translate(x, y); c.rotate(r); c.font = `600 ${size}px "Caveat-600"`; c.fillStyle = col; c.fillText([...s].slice(0, Math.max(0, n)).join(''), 0, 0); c.restore(); };
const typed = (t, at, rate = 24) => t < at ? 0 : Math.ceil((S(t - at) + 1 / 12) * rate);
// 多行手写：按总字数依次打出
const handLines = (c, lines, x, y, lh, size, t, at, rate, r = 0, col) => { let used = 0; const n = typed(t, at, rate); lines.forEach((s, i) => { hand(c, s, x, y + i * lh, size, col, r, n - used); used += s.length; }); };
const card = (c, x, y, w, h, r, fill = '#f6f3ea', ruled = true) => CL.placed(c, x, y, r, g => { CL.shadowed(g, () => { g.fillStyle = fill; g.fillRect(-w / 2, -h / 2, w, h); }, { col: 'rgba(0,0,0,.55)', blur: 16, x: 4, y: 9 });
  if (ruled) { g.strokeStyle = 'rgba(80,120,170,.3)'; g.lineWidth = 1.5; for (let yy = -h / 2 + 70; yy < h / 2; yy += 46) { g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke(); } g.strokeStyle = 'rgba(184,67,63,.5)'; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 46); g.lineTo(w / 2, -h / 2 + 46); g.stroke(); } });
// 红线：a→b，从 at 起 dur 秒描完；线宽按屏幕像素
const STR = [];
const string = (c, a, b, t, at, dur, z, sag = 0.06) => { if (t < at) return; const pts = CL.stringPts(a, b, sag), cum = DG.cum(pts), L = cum[cum.length - 1];
  CL.string(c, pts, cum, L * MO.cubicOut(clamp((S(t) - at) / dur)), { lw: 5 / z, shadow: 'rgba(0,0,0,.35)' }); STR.push({ pts, cum, L }); };
const circle = (c, x, y, rx, ry, q, lw) => { if (q <= 0) return; c.save(); c.strokeStyle = RED; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); const n = 60; for (let i = 0; i <= n * q * 1.08; i++) { const a = -1.2 + i / n * 6.6, rr = 1 + 0.05 * Math.sin(i * 0.7); const X = x + Math.cos(a) * rx * rr, Y = y + Math.sin(a) * ry * rr; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); c.restore(); };
// 弩：木臂＋弓＋弦＋扳机，箭射出
const crossbow = (c, x, y, s, d, t, at) => { if (t < at) return; c.save(); c.translate(x, y); c.scale(d * s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(-60, 0); c.lineTo(40, 0); c.stroke();                       // 弩臂
  c.lineWidth = 6; c.strokeStyle = RED2; c.beginPath(); c.moveTo(40, -46); c.quadraticCurveTo(62, 0, 40, 46); c.stroke();   // 弓
  c.lineWidth = 2; c.strokeStyle = INK; c.beginPath(); c.moveTo(40, -46); c.lineTo(10, 0); c.lineTo(40, 46); c.stroke();  // 弦
  c.lineWidth = 5; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-26, 18); c.stroke();                                         // 扳机
  const f = ((S(t) - at - 0.3) % 1.6); if (f > 0 && f < 0.5) { const ax = 20 + f * 520; c.strokeStyle = RED; c.lineWidth = 4; c.beginPath(); c.moveTo(ax, 0); c.lineTo(ax + 46, 0); c.stroke(); c.fillStyle = RED; c.beginPath(); c.moveTo(ax + 58, 0); c.lineTo(ax + 44, -8); c.lineTo(ax + 44, 8); c.closePath(); c.fill(); }
  c.restore(); };

// ---------- 地图卡：米 → 世界（0.4 单位/米），兵马俑坑原点 (890,1900) ----------
const MX = x => 890 + x * 0.4, MY = y => 1900 + y * 0.4;
const inkRect = (c, x0, y0, x1, y1, q, lw, col = RED, dash) => { if (q <= 0) return; const X0 = MX(x0), Y0 = MY(y0), w = MX(x1) - X0, h = MY(y1) - Y0, per = 2 * (w + h);
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || [per * q, per]); c.strokeRect(X0, Y0, w, h); c.restore(); };
const inkPoly = (c, pts, q, lw, col = RED) => { if (q <= 0) return; const P = pts.map(p => [MX(p[0]), MY(p[1])]); let per = 0; P.forEach((p, i) => { const n = P[(i + 1) % P.length]; per += Math.hypot(n[0] - p[0], n[1] - p[1]); });
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash([per * q, per]); c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); c.restore(); };
function mapCard(c, t, z) { const lw = 3.2 / z;
  card(c, 540, 1960, 920, 1240, 0.008, MAPP, false);
  c.save(); c.strokeStyle = 'rgba(60,50,40,.13)'; c.lineWidth = 1.2 / Math.max(1, z * 0.5); for (let x = 100; x < 990; x += 40) { c.beginPath(); c.moveTo(x, 1345); c.lineTo(x, 2575); c.stroke(); } for (let y = 1360; y < 2575; y += 40) { c.beginPath(); c.moveTo(85, y); c.lineTo(995, y); c.stroke(); } c.restore();
  hand(c, 'Lintong, Xi\'an — site plan', 110, 1400, 34, 'rgba(40,34,28,.7)');
  // 一号坑（12.0 起）：描边、墨点由东往西列队
  inkRect(c, -115, -31, 115, 31, clamp((S(t) - 12.0) / 0.4), lw);
  if (t > 12.1) { const rows = 11, per = 62 / rows;
    for (let r = 0; r < rows; r++) { if (r) { c.fillStyle = 'rgba(147,64,60,.45)'; c.fillRect(MX(-115), MY(-31 + per * r) - 0.08, 92, 0.16); } c.fillStyle = INK;
      for (let k = 0; k < 3; k++) { const yy = -31 + per * r + per * (k + 1) / 4; for (let x = 113; x > -114; x -= 2.2) { if (S(t) - 12.1 < (113 - x) / 230 * 1.6 + r * 0.015) break; c.fillRect(MX(x) - 0.13, MY(yy) - 0.13, 0.26, 0.26); } } } }
  // 两个橄榄球场（109.7×48.8 m）贴在坑上方比长度
  const fq = clamp((S(t) - 12.9) / 0.4); if (fq > 0 && t < 15.2) { c.save(); c.globalAlpha = fq; for (let i = 0; i < 2; i++) { const x0 = -112 + i * 112, y0 = -88;
    c.fillStyle = 'rgba(242,239,230,.95)'; c.fillRect(MX(x0), MY(y0), 109.7 * 0.4, 48.8 * 0.4); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.strokeRect(MX(x0), MY(y0), 109.7 * 0.4, 48.8 * 0.4);
    c.lineWidth = lw * 0.4; for (let j = 0; j <= 10; j++) { const x = x0 + 9.14 + j * 9.14; c.beginPath(); c.moveTo(MX(x), MY(y0)); c.lineTo(MX(x), MY(y0 + 48.8)); c.stroke(); } } c.restore(); }
  // 其余三个坑（15.3 / 15.8 / 16.3）
  inkPoly(c, [[94, -142], [188, -142], [188, -52], [64, -52], [64, -100], [94, -100]], clamp((S(t) - 15.3) / 0.5), lw);
  inkRect(c, -112, -78, -84, -54, clamp((S(t) - 15.8) / 0.4), lw);
  if (t > 16.3) { inkRect(c, -50, -102, 44, -56, 1, lw, RED, [6 / z, 5 / z]); c.save(); c.font = '800 16px "Inter"'; c.textAlign = 'center'; c.fillStyle = RED; c.fillText('?', MX(-3), MY(-72)); c.restore(); }
  // 朝东红箭头（18.0）
  if (t > 18.0) [[60, -12], [60, 12], [-40, 0], [150, -110], [-86, -66], [140, -70]].forEach(([x, y], i) => { const q = clamp((S(t) - 18.0 - i * 0.08) / 0.35); if (q <= 0) return; const X = MX(x), Y = MY(y), L = 14 * q;
    c.save(); c.strokeStyle = RED; c.fillStyle = RED; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + L, Y); c.stroke(); c.beginPath(); c.moveTo(X + L + 4, Y); c.lineTo(X + L, Y - 3); c.lineTo(X + L, Y + 3); c.closePath(); c.fill(); c.restore(); });
  // 陵园（20.2 起）
  if (t > 20.2) { const mx = -1500;
    inkRect(c, mx - 470, -1082, mx + 470, 1082, clamp((S(t) - 20.2) / 0.7), 3.2 / z, INK); inkRect(c, mx - 290, -677, mx + 290, 677, clamp((S(t) - 20.4) / 0.6), 3.2 / z, INK);
    if (t > 20.9) { c.fillStyle = 'rgba(147,64,60,.75)'; c.fillRect(MX(mx - 175), MY(-175), 140, 140); }
    c.save(); c.setLineDash([10, 8]); c.strokeStyle = RED; c.lineWidth = 3.5 / z; c.beginPath(); c.moveTo(MX(-125), MY(0)); c.lineTo(lerp(MX(-125), MX(mx + 180), clamp((S(t) - 20.3) / 0.7)), MY(0)); c.stroke(); c.restore();
    if (t > 20.9) hand(c, '1 mile', MX(-760), MY(0) - 14, 44, RED, 0, typed(t, 20.9));
    if (t > 20.6) hand(c, "Emperor's tomb", MX(mx) - 120, MY(-1082) - 18, 40, INK, 0, typed(t, 20.6)); }
}

// ---------- 整面墙 ----------
const FACES = [['071', 0.42, 0.3, 1.5], ['082', 0.56, 0.4, 1.25], ['074', 0.5, 0.32, 1.35], ['031', 0.5, 0.17, 2.3], ['002', 0.52, 0.42, 1.3], ['084', 0.33, 0.25, 2.4]];
W3.draw = (c, t) => {
  const cam = W3.cam(t), z = cam.z; STR.length = 0;
  CAM.with(c, cam, c => {
    CL.fillPaper(c, CL.paperTile('w3board', '#1c1b19', { amt: 6, fiberCol: [70, 64, 55] }), -3000, -3000, 7000, 12000);
    // 开场那张脸：灰；46–47 回扣时先变回彩色、再在 1.4 秒里褪成灰
    const back = t >= 46 && t < 49.5, fade = back ? clamp((t - 46.9) / 1.3) : 1, fk = Math.round(fade * 12) / 12;
    if (back && fk < 1) { const src = PAINT.cached('w3facecol' + fk, 420, 540, g => { g.filter = `grayscale(${fk}) brightness(${1 - 0.12 * fk})`; g.drawImage(TF.painted(), 0, -26, 420, 630); }); print(c, src, 330, 600, -0.04); }
    else print(c, gsrc('face', '000', 420, 540, 0.53, 0.47, 1.0), 330, 600, -0.04);
    CL.pin(c, 330, 330);
    // 1974 卡（手写＋井的草图）
    card(c, 790, 430, 440, 280, 0.035); handLines(c, ['March 1974', 'Lintong, China', 'farmers digging a well'], 600, 390, 50, 46, t, 2.9, 30, 0.035);
    if (t > 3.6) { c.save(); c.translate(930, 350); c.rotate(0.035); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 34, 12, 0, 0, U.TAU); c.stroke(); c.beginPath(); c.moveTo(-34, 0); c.lineTo(-34, 40); c.moveTo(34, 0); c.lineTo(34, 40); c.stroke(); c.restore(); }
    print(c, gsrc('dig', '036', 520, 390, 0.62, 0.58, 1.25), 800, 930, 0.03); CL.pin(c, 800, 720);
    circle(c, 812, 905, 46, 62, clamp((S(t) - 5.8) / 0.6), 6);
    string(c, [330, 330], [800, 720], t, 2.6, 0.5, z);
    string(c, [800, 1130], [700, 1345], t, 7.3, 0.4, z, 0.03);
    // 地图卡
    mapCard(c, t, z);
    // 陵墓照片＋秦始皇画像
    print(c, gsrc('tomb', '125', 420, 300, 0.47, 0.45, 1.3), 300, 2700, -0.03); CL.pin(c, 300, 2530);
    print(c, gsrc('emp', 'emp1', 380, 420, 0.4, 0.33, 1.2, 'grayscale(.15) sepia(.2) contrast(1.05)'), 790, 2720, 0.035); CL.pin(c, 790, 2490);
    string(c, [MX(-1500), MY(175)], [300, 2530], t, 21.2, 0.5, z, 0.02);
    string(c, [300, 2530], [790, 2490], t, 22.9, 0.4, z, 0.1);
    // 人脸墙（26.05 起一张张钉上）
    FACES.forEach(([k, fx, fy, fz], i) => { const at = 26.05 + [0, 3, 1, 4, 2, 5][i] * 0.15; if (t < at) return; const r = Math.floor(i / 2), col = i % 2, x = 300 + col * 480 + (r % 2) * 12, y = 3200 + r * 400;
      print(c, gsrc('f' + k, k, 420, 340, fx, fy, fz), x, y, ((i * 37) % 7 - 3) * 0.012, { tape: false }); CL.pin(c, x, y - 178); });
    string(c, [790, 2930], [780, 3022], t, 25.7, 0.3, z);
    // 剖面卡
    section(c, t, z);
    string(c, [540, 3990], [540, 4175], t, 30.7, 0.3, z);
    // 史记卡（引文＋荧光）、汞卡、工匠卡
    card(c, 300, 5200, 500, 400, -0.03);
    handLines(c, ['Sima Qian, c. 94 BC:', '"mercury was made into', ' rivers and seas..."', '"crossbows set to shoot', ' anyone who comes near"'], 80, 5100, 46, 42, t, 35.4, 46, -0.03);
    CL.highlight(c, 76, 5115, 400, 38, clamp((S(t) - 36.4) / 0.5)); CL.highlight(c, 76, 5161, 300, 38, clamp((S(t) - 36.9) / 0.4));
    card(c, 790, 5230, 440, 340, 0.04); handLines(c, ['Hg  (mercury)', '2020 study: air above', 'the mound has far more', 'mercury than normal'], 600, 5140, 46, 42, t, 39.2, 40, 0.04);
    if (t > 40.6) { c.save(); c.strokeStyle = RED; c.lineWidth = 5; c.beginPath(); c.moveTo(600, 5300); c.lineTo(lerp(600, 960, clamp((S(t) - 40.6) / 0.5)), 5310); c.stroke(); c.restore(); }
    card(c, 540, 5900, 620, 360, -0.02); handLines(c, ['Sima Qian also wrote:', 'the craftsmen were sealed', 'inside the tomb.', 'None came out.'], 270, 5820, 50, 46, t, 42.9, 40, -0.02);
    if (t > 44.4) CL.highlight(c, 266, 5922, 300, 40, clamp((S(t) - 44.4) / 0.4));
    string(c, [540, 4930], [300, 5000], t, 34.7, 0.3, z); string(c, [300, 5000], [790, 5060], t, 38.7, 0.3, z); string(c, [790, 5400], [540, 5720], t, 42.2, 0.3, z);
    // SEALED 印章（49.7 砸在陵墓照片上，之后一直在）
    if (t > 49.7) { c.save(); c.translate(300, 2700); c.rotate(-0.14); const k = MO.slamK((t - 49.7) / 0.17); c.scale(k, k);
      c.strokeStyle = RED; c.lineWidth = 7; c.strokeRect(-170, -50, 340, 100); c.font = '900 68px "Inter"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = RED; c.fillText('SEALED', 0, 4); c.restore(); }
    // 结尾：红线上跑的光点（线索全连上了）
    if (t > 54.2) STR.forEach((s, i) => { const u = ((t - 54.2) * 0.45 + i * 0.17) % 1; let j = 0; while (j < s.cum.length - 1 && s.cum[j] < u * s.L) j++; const p = s.pts[j];
      const gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 26 / z); gr.addColorStop(0, 'rgba(255,120,100,.95)'); gr.addColorStop(1, 'rgba(255,120,100,0)'); c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], 26 / z, 0, U.TAU); c.fill(); });
  });
  // 屏幕层：标签最后画、压在最上层（全部在字幕带以上）
  const L = (wx, wy, text, at, o = {}) => { if (t < at || (o.until && t > o.until)) return; const [sx, sy] = CAM.toScreen(cam, wx, wy); MD.label(c, text, sx, Math.min(sy, 1200), { size: o.size || 46, fam: 'Inter', t, at, align: o.align || 'center', bg: o.bg, fg: o.fg, r: o.r || 0, rate: 30 }); };
  L(800, 700, 'AN ENTIRE ARMY', 6.6, { bg: RED, size: 56, r: -0.03, until: 8.0 });
  L(MX(-115), MY(31) + 8, 'PIT 1 · 755 FT LONG', 12.2, { align: 'left', until: 15.0 });
  L(MX(0), MY(-88) - 6, '2 FOOTBALL FIELDS', 12.9, { bg: PAPER, fg: INK, size: 42, until: 15.2 });
  L(MX(178), MY(-142) - 3, 'PIT 2 · CAVALRY', 15.4, { align: 'right', size: 38, until: 20.0 });
  L(MX(-112), MY(-43), 'PIT 3 · COMMAND POST', 15.9, { align: 'left', size: 38, until: 20.0 });
  L(MX(-3), MY(-102) - 3, 'PIT 4 · EMPTY', 16.4, { bg: RED, size: 38, until: 20.0 });
  L(MX(-60), MY(-160), 'ALL FACING EAST →', 18.1, { bg: PAPER, fg: INK, size: 44, until: 20.0 });
  L(300, 2490, '20+ SQ MI BURIAL COMPLEX', 23.2, { bg: PAPER, fg: INK, size: 36, until: 26.0 });
  L(790, 2450, 'ONE MAN', 23.5, { bg: RED, size: 60, r: -0.03, until: 26.0 });
  L(540, 2950, '× 8,000', 28.4, { bg: RED, size: 70, until: 31.0 });
  return cam;
};

// 剖面卡：纸白方格卡，墨线画封土、地宫（红虚线）、100 ft、水银河（银灰）、弩机、雷达弧
function section(c, t, z) { const cx = 540, cy = 4550, w = 940, h = 760;
  card(c, cx, cy, w, h, 0.0, PAPER, false);
  c.save(); c.strokeStyle = 'rgba(80,120,170,.18)'; c.lineWidth = 1; for (let x = cx - w / 2; x < cx + w / 2; x += 30) { c.beginPath(); c.moveTo(x, cy - h / 2); c.lineTo(x, cy + h / 2); c.stroke(); } for (let y = cy - h / 2; y < cy + h / 2; y += 30) { c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx + w / 2, y); c.stroke(); } c.restore();
  hand(c, 'Cross-section: the tomb mound', cx - 430, cy - 330, 38, 'rgba(40,34,28,.75)');
  const GY = cy - 110;
  c.save(); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 460, GY); c.lineTo(cx - 360, GY); c.lineTo(cx - 170, GY - 170); c.quadraticCurveTo(cx, GY - 200, cx + 170, GY - 170); c.lineTo(cx + 360, GY); c.lineTo(cx + 460, GY); c.stroke();
  c.lineWidth = 1.5; for (let i = 0; i < 30; i++) { const x = cx - 340 + i * 23; c.beginPath(); c.moveTo(x, GY); c.lineTo(x + 30, GY - 30); c.stroke(); } c.restore();
  if (t > 31.2) { c.save(); for (let i = 0; i < 3; i++) { const u = ((S(t) - 31.2) * 0.8 + i / 3) % 1; c.strokeStyle = `rgba(184,67,63,${0.8 * (1 - u)})`; c.lineWidth = 3; c.beginPath(); c.arc(cx, GY - 180, 40 + u * 420, 0.18 * Math.PI, 0.82 * Math.PI); c.stroke(); } c.restore(); }
  const top = GY + 120, bot = GY + 300, pq = clamp((S(t) - 31.8) / 0.5);
  if (pq > 0) { c.save(); c.globalAlpha = pq; c.strokeStyle = RED; c.lineWidth = 4; c.setLineDash([14, 9]); c.strokeRect(cx - 300, top, 600, bot - top); c.setLineDash([]); c.strokeRect(cx - 120, top + 40, 240, bot - top - 70); c.restore();
    if (t > 32.2) { c.save(); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 400, GY); c.lineTo(cx + 400, top); c.moveTo(cx + 385, GY); c.lineTo(cx + 415, GY); c.moveTo(cx + 385, top); c.lineTo(cx + 415, top); c.stroke(); c.restore(); hand(c, '~100 ft', cx + 330, GY + 80, 44, INK, 0, typed(t, 32.2)); hand(c, 'hidden chamber', cx - 290, top - 14, 40, RED, 0, typed(t, 32.0)); } }
  if (t > 33.0) { const f = clamp((S(t) - 33.0) / 1.2); for (let k = 0; k < 3; k++) { const yb = top + 50 + k * 42, pts = []; for (let x = cx - 290; x <= cx + 290; x += 10) pts.push([x, yb + Math.sin(x * 0.02 + k * 1.7) * 9]); const n = Math.floor(pts.length * f); if (n < 2) continue;
    c.save(); c.lineCap = 'round'; for (const [lw, col] of [[10, 'rgba(150,158,165,.45)'], [4, '#8d949a']]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.slice(0, n).forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); }
    hand(c, 'mercury?', cx + 130, top - 14, 40, '#5f666c', 0, typed(t, 33.2)); }
  crossbow(c, cx - 380, (top + bot) / 2, 0.9, 1, t, 33.6); crossbow(c, cx + 380, (top + bot) / 2, 0.9, -1, t, 33.8);
}
})();
