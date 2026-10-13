// v2 动画图解：考古平面图（世界坐标＝米，x 向东、y 向南）、地层剖面、封土剖面、HUD。深色底＋金线，纪录片档案风。
(() => {
const { clamp, lerp, ss } = U, E = U.ease, P = PAINT;
const W = 1080, H = 1920, GOLD = '#e0b354', GOLD2 = 'rgba(224,179,84,', CLAY = '#c79a6c';
const M = window.TM = { GOLD };

// ---------- 底：深色、暗角光晕、颗粒 ----------
M.bg = (c, glow = [540, 820]) => { c.fillStyle = '#0c0a08'; c.fillRect(0, 0, W, H);
  const g = c.createRadialGradient(glow[0], glow[1], 50, glow[0], glow[1], 1100); g.addColorStop(0, 'rgba(70,52,30,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); };
M.text = (c, s, x, y, { size = 30, col = GOLD, align = 'left', weight = 700, a = 1, track = 0.12 } = {}) => { c.save(); c.globalAlpha = a; c.font = `${weight} ${size}px "Inter"`; c.textAlign = align; c.fillStyle = col;
  try { c.letterSpacing = `${size * track}px`; } catch (e) {} c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 8; c.fillText(s, x, y); c.restore(); };
// 打字机式标签：按时间逐字出现
M.type = (c, s, x, y, lt, at, o = {}) => { const n = Math.floor(clamp((lt - at) / 0.6) * s.length); if (n > 0) M.text(c, s.slice(0, n), x, y, o); };
M.hud = (c, t, lines) => { c.save(); M.text(c, lines[0], 60, 190, { size: 26, a: 0.85 }); if (lines[1]) M.text(c, lines[1], 60, 228, { size: 22, col: 'rgba(224,179,84,.6)', weight: 500 });
  if (Math.floor(t * 2) % 2) { c.fillStyle = '#ff4a3a'; c.beginPath(); c.arc(42, 181, 7, 0, U.TAU); c.fill(); } c.restore(); };

// ---------- 平面图相机 ----------
// cam = { cx, cy（米）, s（像素/米） }；屏幕锚点 (540, 760)
M.cam = (cx, cy, s) => ({ cx, cy, s, X: x => 540 + (x - cx) * s, Y: y => 760 + (y - cy) * s });
// 两个相机之间对数插值（拉远拉近看起来匀速）
M.lerpCam = (a, b, p) => { const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), p)), w = (a.s === b.s) ? p : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s); return M.cam(lerp(a.cx, b.cx, w), lerp(a.cy, b.cy, w), s); };
M.grid = (c, k) => { let sp = 10; for (const v of [10, 50, 100, 500, 1000, 5000]) { if (v * k.s >= 70) { sp = v; break; } }
  c.save(); c.strokeStyle = 'rgba(224,179,84,.08)'; c.lineWidth = 1; c.beginPath();
  const x0 = Math.floor((k.cx - 540 / k.s) / sp) * sp, y0 = Math.floor((k.cy - 760 / k.s) / sp) * sp;
  for (let x = x0; k.X(x) < W; x += sp) { c.moveTo(k.X(x), 0); c.lineTo(k.X(x), H); }
  for (let y = y0; k.Y(y) < H; y += sp) { c.moveTo(0, k.Y(y)); c.lineTo(W, k.Y(y)); } c.stroke(); c.restore(); return sp; };
// 比例尺（左下，地图区内）：英尺＋米
M.scaleBar = (c, k) => { const nice = [5, 10, 20, 50, 100, 200, 500, 1000, 2000]; let m = nice[0]; for (const v of nice) if (v * k.s <= 260) m = v;
  const x = 60, y = 1080, w = m * k.s; c.save(); c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 10); c.lineTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y - 10); c.stroke(); c.restore();
  const ft = Math.round(m * 3.28084); M.text(c, `${m >= 1000 ? m / 1000 + ' km' : m + ' m'} · ${ft >= 5280 ? (ft / 5280).toFixed(1) + ' mi' : ft.toLocaleString('en-US') + ' ft'}`, x, y - 20, { size: 22 }); };
M.north = (c) => { c.save(); c.translate(990, 300); c.strokeStyle = GOLD; c.fillStyle = GOLD; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 34, 0, U.TAU); c.stroke();
  c.beginPath(); c.moveTo(0, -30); c.lineTo(10, 6); c.lineTo(0, 0); c.lineTo(-10, 6); c.closePath(); c.fill(); c.restore(); M.text(c, 'N', 990, 252, { size: 22, align: 'center' }); };
// 世界矩形（逐渐画出的描边：p 0..1 走完一圈）
M.rect = (c, k, x0, y0, x1, y1, p = 1, { col = GOLD, lw = 3, fill, dash } = {}) => { const X0 = k.X(x0), Y0 = k.Y(y0), X1 = k.X(x1), Y1 = k.Y(y1), w = X1 - X0, h = Y1 - Y0, per = 2 * (w + h);
  c.save(); if (fill && p >= 1) { c.fillStyle = fill; c.fillRect(X0, Y0, w, h); }
  c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); else { c.setLineDash([per * p, per]); }
  c.shadowColor = col; c.shadowBlur = 12; c.strokeRect(X0, Y0, w, h); c.restore(); };
M.poly = (c, k, pts, p = 1, { col = GOLD, lw = 3, fill } = {}) => { const S = pts.map(q => [k.X(q[0]), k.Y(q[1])]); let per = 0; for (let i = 0; i < S.length; i++) { const a = S[i], b = S[(i + 1) % S.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  c.save(); c.beginPath(); S.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); if (fill && p >= 1) { c.fillStyle = fill; c.fill(); }
  c.setLineDash([per * p, per]); c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = 12; c.stroke(); c.restore(); };

// ---------- 兵马俑坑（真实布局的简化：一号坑 230×62 m；二号坑 L 形在东北；三号坑小、在西北；四号坑空、在二三之间） ----------
M.PIT1 = [-115, -31, 115, 31];
M.PIT2 = [[64, -142], [188, -142], [188, -52], [64, -52], [64, -98], [94, -98], [94, -142]].map(q => q);   // L 形（缺西南角）
M.PIT2 = [[94, -142], [188, -142], [188, -52], [64, -52], [64, -100], [94, -100]];
M.PIT3 = [-112, -78, -84, -54];
M.PIT4 = [-50, -102, 44, -56];
// 一号坑：11 条过洞，点阵兵俑由东往西列队进场（at 起，dur 秒走完）
M.army = (c, k, lt, at, dur = 3, { a = 1 } = {}) => { const [x0, y0, x1, y1] = M.PIT1, rows = 11, per = (y1 - y0) / rows, step = Math.max(1.6, 4 / k.s);
  c.save(); c.globalAlpha = a;
  for (let r = 0; r < rows; r++) { const ry = y0 + per * r;
    if (r > 0) { c.fillStyle = 'rgba(224,179,84,.25)'; c.fillRect(k.X(x0), k.Y(ry) - 0.8, (x1 - x0) * k.s, 1.6); }
    for (let col = 0; col < 3; col++) { const yy = ry + per * (col + 1) / 4;
      for (let x = x1 - 2; x > x0 + 1; x -= step) { const q = (lt - at - (x1 - x) / (x1 - x0) * dur * 0.8 - r * 0.02); if (q < 0) continue; const s2 = Math.max(1.2, Math.min(3.2, 0.9 * k.s)), j = U.hash(Math.round(x * 10), r * 7 + col);
        c.fillStyle = q < 0.15 ? '#fff3c8' : j < 0.06 ? '#f0d79a' : CLAY; c.fillRect(k.X(x) - s2 / 2, k.Y(yy + (j - 0.5) * 0.5) - s2 / 2, s2, s2); } } }
  c.restore(); };
// 朝东的箭头群（世界坐标位置）
M.eastArrows = (c, k, lt, at, spots) => { const q = lt - at; if (q < 0) return; c.save(); c.strokeStyle = '#ffd23f'; c.fillStyle = '#ffd23f'; c.lineWidth = 5; c.shadowColor = '#ffd23f'; c.shadowBlur = 14;
  spots.forEach(([x, y], i) => { const p = clamp((q - i * 0.08) / 0.4); if (p <= 0) return; const X = k.X(x), Y = k.Y(y), L = 70 * E.out(p), bob = Math.sin((lt - at) * 6 + i) * 6;
    c.globalAlpha = p; c.beginPath(); c.moveTo(X + bob, Y); c.lineTo(X + L + bob, Y); c.stroke(); c.beginPath(); c.moveTo(X + L + 18 + bob, Y); c.lineTo(X + L + bob, Y - 13); c.lineTo(X + L + bob, Y + 13); c.closePath(); c.fill(); }); c.restore(); };
// 带引线的标签
M.callout = (c, x, y, tx, ty, label, lt, at, { col = GOLD, size = 30, sub } = {}) => { const q = lt - at; if (q < 0) return; const p = E.out(clamp(q / 0.4));
  c.save(); c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, tx, p), lerp(y, ty, p)); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(x, y, 6, 0, U.TAU); c.fill(); c.restore();
  if (q > 0.3) { const al = tx < x ? 'right' : 'left', dx = tx < x ? -12 : 12; M.type(c, label, tx + dx, ty + size * 0.35, lt, at + 0.3, { size, col, align: al, weight: 800 }); if (sub) M.type(c, sub, tx + dx, ty + size * 0.35 + size * 1.1, lt, at + 0.6, { size: size * 0.7, col: 'rgba(255,255,255,.75)', align: al, weight: 500 }); } };
// 美式橄榄球场（含端区 109.7×48.8 m）
M.football = (c, k, x0, y0, p) => { if (p <= 0) return; const L = 109.7, Wd = 48.8; c.save(); c.globalAlpha = p;
  c.fillStyle = 'rgba(60,150,80,.35)'; c.fillRect(k.X(x0), k.Y(y0), L * k.s, Wd * k.s); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.strokeRect(k.X(x0), k.Y(y0), L * k.s, Wd * k.s);
  c.lineWidth = 1.2; for (let i = 0; i <= 10; i++) { const x = x0 + 9.14 + i * 9.14; c.beginPath(); c.moveTo(k.X(x), k.Y(y0)); c.lineTo(k.X(x), k.Y(y0 + Wd)); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(k.X(x0), k.Y(y0), 9.14 * k.s, Wd * k.s); c.fillRect(k.X(x0 + L - 9.14), k.Y(y0), 9.14 * k.s, Wd * k.s); c.restore(); };
// 陵园：封土 350 m 见方、内城 580×1355 m、外城 940×2165 m（南北长）；以封土中心为 (mx,my)
M.necropolis = (c, k, mx, my, lt, at) => { const q = lt - at; if (q < 0) return;
  const R = (w, h) => [mx - w / 2, my - h / 2, mx + w / 2, my + h / 2];
  M.rect(c, k, ...R(940, 2165), clamp(q / 1.2), { lw: 3, col: 'rgba(224,179,84,.7)' });
  M.rect(c, k, ...R(580, 1355), clamp((q - 0.4) / 1.0), { lw: 3 });
  const pm = clamp((q - 0.9) / 0.6); if (pm > 0) { const [a, b, cc, d] = R(350, 350); c.save(); c.globalAlpha = pm; const g = c.createRadialGradient(k.X(mx), k.Y(my), 2, k.X(mx), k.Y(my), 175 * k.s * 1.2); g.addColorStop(0, 'rgba(255,90,60,.9)'); g.addColorStop(1, 'rgba(255,90,60,.1)'); c.fillStyle = g; c.fillRect(k.X(a), k.Y(b), (cc - a) * k.s, (d - b) * k.s); c.restore();
    M.rect(c, k, a, b, cc, d, 1, { col: '#ff6a4a', lw: 3 }); }
  // 脉冲：有东西在下面
  const pu = (q * 0.7) % 1; c.save(); c.strokeStyle = `rgba(255,106,74,${(1 - pu) * 0.8})`; c.lineWidth = 3; c.beginPath(); c.arc(k.X(mx), k.Y(my), (40 + pu * 200), 0, U.TAU); c.stroke(); c.restore(); };

// ---------- 地层剖面（1974：打井）。地面 y=GY ----------
M.strata = (c, GY) => { const g = c.createLinearGradient(0, GY, 0, H); g.addColorStop(0, '#4a3524'); g.addColorStop(1, '#140d08'); c.fillStyle = g; c.fillRect(0, GY, W, H - GY);
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.7; c.drawImage(TT.grain('strata', W, 700, '#c8a888', 21, 60), 0, GY, W, H - GY); c.restore();
  c.save(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; for (let i = 1; i < 7; i++) { const y = GY + i * 120; c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.01 + i) * 10); c.stroke(); } c.restore();
  // 地面：麦田一线
  c.fillStyle = '#2e3a1c'; c.fillRect(0, GY - 14, W, 16); c.strokeStyle = '#6c7a3a'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x < W; x += 9) { c.moveTo(x, GY - 12); c.lineTo(x + 3, GY - 34 - (x * 7919 % 13)); } c.stroke(); };
// X 光扫描线：从 x0 扫到 x1，扫过的区域显出底下的一排排兵俑（金色轮廓）
M.xray = (c, lt, at, GY) => { const q = lt - at; if (q < 0) return; const sx = lerp(-60, 1140, E.inOut(clamp(q / 1.3)));
  c.save(); c.beginPath(); c.rect(0, GY + 330, sx, 560); c.clip(); c.fillStyle = 'rgba(10,30,40,.55)'; c.fillRect(0, GY + 330, W, 560);
  for (let row = 0; row < 3; row++) for (let i = -1; i < 12; i++) { const x = 30 + i * 96 + (row % 2) * 48, y = GY + 520 + row * 170, s = 0.62 - row * 0.06;
    c.save(); c.globalAlpha = 0.85 - row * 0.2; c.filter = 'sepia(1) saturate(3) hue-rotate(-10deg) brightness(1.3)'; TT.soldier(c, x, y, s, { v: i + row * 5 }); c.restore(); }
  c.restore();
  if (q < 1.45) { c.save(); c.strokeStyle = '#7ff3ff'; c.lineWidth = 4; c.shadowColor = '#7ff3ff'; c.shadowBlur = 24; c.beginPath(); c.moveTo(sx, GY + 320); c.lineTo(sx, GY + 900); c.stroke(); c.restore(); } };

// ---------- 封土剖面（侧视）：地面 GY；封土梯形；地下 30 m 地宫（虚线）；雷达扫描；水银河；弩机；汞含量表 ----------
M.moundSide = (c, GY, { night = 0 } = {}) => { // 天空、星
  const sk = c.createLinearGradient(0, 0, 0, GY); sk.addColorStop(0, '#060812'); sk.addColorStop(1, night ? '#1a1830' : '#2a2a3a'); c.fillStyle = sk; c.fillRect(0, 0, W, GY);
  const r = U.rng(5); c.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { c.globalAlpha = 0.2 + r() * 0.6; c.fillRect(r() * W, r() * (GY - 200), 2, 2); } c.globalAlpha = 1;
  // 封土（截顶金字塔侧影）＋树线
  const m = new Path2D('M 90 ' + GY + ' L 330 ' + (GY - 250) + ' Q 540 ' + (GY - 290) + ' 750 ' + (GY - 250) + ' L 990 ' + GY + ' Z');
  const g = c.createLinearGradient(0, GY - 290, 0, GY); g.addColorStop(0, '#2c3a22'); g.addColorStop(1, '#141c10'); c.fillStyle = g; c.fill(m);
  c.save(); c.clip(m); c.fillStyle = 'rgba(0,0,0,.25)'; const r2 = U.rng(8); for (let i = 0; i < 260; i++) { c.beginPath(); c.arc(90 + r2() * 900, GY - r2() * 290, 6 + r2() * 12, 0, U.TAU); c.fill(); } c.restore();
  c.strokeStyle = 'rgba(224,179,84,.5)'; c.lineWidth = 2; c.stroke(m);
  // 地下
  const sg = c.createLinearGradient(0, GY, 0, H); sg.addColorStop(0, '#3a2a1c'); sg.addColorStop(1, '#0a0705'); c.fillStyle = sg; c.fillRect(0, GY, W, H - GY);
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.6; c.drawImage(TT.grain('strata2', W, 700, '#c8a888', 33, 60), 0, GY, W, H - GY); c.restore();
  c.fillStyle = '#4c3a26'; c.fillRect(0, GY - 3, W, 6); };
M.PAL = [200, 0, 880, 0];   // 地宫左右（y 由 GY 算）
M.radar = (c, GY, lt, at) => { const q = lt - at; if (q < 0) return; c.save(); for (let i = 0; i < 4; i++) { const u = ((q * 0.9 + i * 0.25) % 1); c.strokeStyle = `rgba(127,243,255,${0.7 * (1 - u)})`; c.lineWidth = 3;
    c.beginPath(); c.arc(540, GY - 260, 60 + u * 760, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); } c.restore(); };
M.palace = (c, GY, lt, at) => { const q = lt - at; if (q < 0) return; const top = GY + 300, bot = GY + 560, p = clamp(q / 1.2);
  c.save(); c.globalAlpha = p; c.fillStyle = 'rgba(127,243,255,.06)'; c.fillRect(200, top, 680, bot - top); c.strokeStyle = '#7ff3ff'; c.lineWidth = 3; c.setLineDash([16, 10]); c.shadowColor = '#7ff3ff'; c.shadowBlur = 16; c.strokeRect(200, top, 680, bot - top);
  c.setLineDash([]); c.strokeRect(390, top + 70, 300, bot - top - 110); c.restore();
  // 深度标注 100 ft
  if (q > 0.6) { const a = clamp((q - 0.6) / 0.4); c.save(); c.globalAlpha = a; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(940, GY); c.lineTo(940, top); c.moveTo(925, GY); c.lineTo(955, GY); c.moveTo(925, top); c.lineTo(955, top); c.stroke(); c.restore();
    M.text(c, '~100 FT', 930, (GY + top) / 2 + 10, { size: 30, col: '#fff', align: 'right', weight: 800, a }); M.text(c, 'HIDDEN CHAMBER', 540, top - 18, { size: 28, col: '#7ff3ff', align: 'center', weight: 800, a }); } };
M.mercuryRivers = (c, GY, lt, at) => { const q = lt - at; if (q < 0) return; const top = GY + 300, flow = ss(0, 2.2, q);
  for (let k = 0; k < 4; k++) { const yb = top + 60 + k * 50, pts = []; for (let x = 215; x <= 865; x += 10) pts.push([x, yb + Math.sin(x * 0.014 + k * 1.7) * 14]);
    const n = Math.floor(pts.length * flow); if (n < 2) continue; c.save(); c.lineCap = 'round';
    for (const [w, a, col] of [[18, 0.15, '#bfe6ff'], [8, 0.4, '#dff4ff'], [3, 0.95, '#ffffff']]) { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); pts.slice(0, n).forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
    c.fillStyle = '#fff'; for (let j = 0; j < 3; j++) { const u = (q * 0.4 + j / 3 + k * 0.17) % 1, p = pts[Math.floor(u * (n - 1))]; if (p) { c.beginPath(); c.arc(p[0], p[1], 4, 0, U.TAU); c.fill(); } } c.restore(); } };
// 弩机：入口两侧，箭射出
M.crossbows = (c, GY, lt, at) => { const q = lt - at; if (q < 0) return; const y = GY + 470;
  [[215, 1], [865, -1]].forEach(([x, d], i) => { const a = clamp((q - i * 0.2) / 0.3); c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(d, 1); c.strokeStyle = '#ff6a4a'; c.lineWidth = 5; c.shadowColor = '#ff6a4a'; c.shadowBlur = 12;
    c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(26, 0, 0, 30); c.stroke(); c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 30); c.lineWidth = 2; c.stroke(); c.lineWidth = 6; c.beginPath(); c.moveTo(-14, 0); c.lineTo(40, 0); c.stroke();
    const f = ((q - 0.5 - i * 0.3) % 1.4); if (f > 0 && f < 0.5) { const ax = 40 + f * 600; c.lineWidth = 4; c.beginPath(); c.moveTo(ax, 0); c.lineTo(ax + 50, 0); c.stroke(); c.beginPath(); c.moveTo(ax + 60, 0); c.lineTo(ax + 46, -8); c.lineTo(ax + 46, 8); c.closePath(); c.fillStyle = '#ff6a4a'; c.fill(); }
    c.restore(); }); };
// 汞含量表：竖条从正常值冲到爆表
M.meter = (c, lt, at, x = 820, y = 300) => { const q = lt - at; if (q < 0) return; const a = clamp(q / 0.3), v = E.out(clamp((q - 0.2) / 1.4)) * 0.95 + Math.sin(lt * 23) * 0.015 * (q > 1.6);
  c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x - 20, y - 20, 220, 470); c.strokeStyle = GOLD; c.lineWidth = 2; c.strokeRect(x - 20, y - 20, 220, 470);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 50, y + 40, 60, 360);
  const g = c.createLinearGradient(0, y + 400, 0, y + 40); g.addColorStop(0, '#3fd27a'); g.addColorStop(0.4, '#ffd23f'); g.addColorStop(1, '#ff3a2a'); c.fillStyle = g; c.fillRect(x + 50, y + 400 - 360 * v, 60, 360 * v);
  c.strokeStyle = '#fff'; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(x + 30, y + 400 - 360 * 0.12); c.lineTo(x + 130, y + 400 - 360 * 0.12); c.stroke(); c.restore();
  M.text(c, 'Hg', x + 80, y + 16, { size: 34, col: '#fff', align: 'center', weight: 900, a }); M.text(c, 'NORMAL', x + 136, y + 400 - 360 * 0.12 + 8, { size: 16, col: '#fff', weight: 600, a, track: 0.05 }); };
})();
