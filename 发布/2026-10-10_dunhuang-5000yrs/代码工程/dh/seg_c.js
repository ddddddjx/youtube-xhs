// 四库全书 → 尾声
(() => {
const { C, F } = DH, { clamp, lerp } = U, BAR = DHW.BAR, K = KIT, E = DHW.ease, SY = DHW.SEAM_Y, flow = DHW.flow;

// ================= 四库全书 =================
const SK = ['#3f8f6e', '#a5452f', '#2f5f8f', '#b8a888'];   // 经 史 子 集
const SLOTS = (() => { const o = []; for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) o.push([i, j]); const r = U.rng(5); return o.map((p, k) => [...p, k / 28 * 7.5 + r() * 0.3]); })();
DHW.add({ id: 'siku', label: ['四库全书', '一七七二年'], wall: 'red', focus: [1100, 520], zoom: 1.2,
  keep: [[340, 200, 1700, 960]],
  silk: (r, t) => flow([[0, SY], [200, 300], [420, 640], [560, 800], [700, 830], [860, 800], [960, 640], [1200, 200], [1920, SY]], t, 6),
  draw(c, r, t) {
    // 书架：四层七格
    F(c, new Path2D('M560 200 L1700 200 L1700 760 L560 760 Z'), C.redDk, 3);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) { const x = 580 + i * 160, y = 220 + j * 134; F(c, new Path2D(`M${x} ${y} L${x + 148} ${y} L${x + 148} ${y + 122} L${x} ${y + 122} Z`), '#4a1e12', 1.6); }
    // 书函按经史子集四色插进去（从右侧滑入，落位一顿）；第 3 小节后剩下的一起补满
    SLOTS.forEach(([i, j, t0], k) => { const tt = r > 2 * BAR ? Math.min(t0, 2 * BAR + (k % 7) * 0.06 + j * 0.05) : t0, q = clamp((r - tt) / 0.35); if (q <= 0) return; const e = E.out3(q), x = 586 + i * 160, y = 226 + j * 134;
      for (let b = 0; b < 4; b++) { const xx = x + b * 35 + (1 - e) * 600, col = SK[j]; F(c, new Path2D(`M${xx} ${y + 4} L${xx + 32} ${y + 4} L${xx + 32} ${y + 112} L${xx} ${y + 112} Z`), col, 1.8);
        c.fillStyle = C.white; c.fillRect(xx + 8, y + 18, 16, 40); c.strokeStyle = C.line; c.lineWidth = 1; c.strokeRect(xx + 8, y + 18, 16, 40); }
      if (q >= 1 && r - tt < 0.8) { const dq = (r - tt - 0.35) / 0.45; c.fillStyle = `rgba(236,223,196,${0.7 * (1 - dq)})`; for (let m = 0; m < 4; m++) { c.beginPath(); c.arc(x + 20 + m * 36, y + 118, 6 + dq * 12, 0, Math.PI * 2); c.fill(); } } });
    // 案上一函：丝带系住
    F(c, new Path2D('M340 860 L1000 860 L980 900 L360 900 Z'), C.brown, 2.4);
    F(c, new Path2D('M480 700 L900 700 L900 860 L480 860 Z'), C.green, 3); F(c, new Path2D('M480 700 L520 668 L940 668 L900 700 Z'), C.green2, 2.4); F(c, new Path2D('M900 700 L940 668 L940 828 L900 860 Z'), C.greenDk, 2.4);
    F(c, new Path2D('M620 720 L760 720 L760 840 L620 840 Z'), C.white, 2); c.font = '30px "LXGWWenKai-500"'; c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'top'; ['四', '库', '全', '书'].forEach((ch, i) => c.fillText(ch, 690, 728 + i * 28));
    // 烛与浮尘
    F(c, new Path2D('M1780 960 L1820 960 L1820 820 L1780 820 Z'), C.white, 2); const fl = 1 + Math.sin(t * 17) * 0.12; F(c, new Path2D(`M1790 820 Q1800 ${800 - 30 * fl} 1800 ${784 - 30 * fl} Q1810 ${800 - 20 * fl} 1810 820 Z`), '#f2a43a', 1.8);
    for (let k = 0; k < 20; k++) { const ph = (t * 0.1 + k * 0.05) % 1; c.fillStyle = 'rgba(236,223,196,.6)'; c.beginPath(); c.arc(600 + (k * 211) % 1100 + Math.sin(t + k) * 20, 900 - ph * 700, 2.5, 0, Math.PI * 2); c.fill(); }
  } });

// ================= 1949 =================
function star(c, cx, cy, R, rot) { const p = []; for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, rr = i % 2 ? R * 0.382 : R; p.push([cx + Math.sin(a) * rr, cy - Math.cos(a) * rr]); } c.fill(U.poly(p)); }
function flag(c, x, y, w, t, unfurl) { // 国旗：30×20 网格；左上为旗杆侧；按列做波浪
  const h = w * 2 / 3, u = w / 30, ww = w * unfurl; if (ww < 4) return;
  const off = xx => Math.sin(xx / w * 5 - t * 4) * h * 0.06 * (xx / w);
  c.save(); const p = new Path2D(); for (let xx = 0; xx <= ww; xx += 6) p.lineTo(x + xx, y + off(xx)); for (let xx = ww; xx >= 0; xx -= 6) p.lineTo(x + xx, y + h * (0.9 + 0.1 * unfurl) + off(xx)); p.closePath();
  c.fillStyle = '#c8302a'; c.fill(p); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke(p); c.clip(p);
  if (unfurl > 0.5) { c.fillStyle = '#f2c94c'; const o = off(5 * u); star(c, x + 5 * u, y + 5 * u + o, 3 * u, 0);
    [[10, 2], [12, 4], [12, 7], [10, 9]].forEach(([sx, sy]) => { const a = Math.atan2(5 - sy, 5 - sx); star(c, x + sx * u, y + sy * u + off(sx * u), u, a + Math.PI / 2); }); }
  c.restore(); }
DHW.add({ id: 'prc', label: ['新中国成立', '一九四九年'], wall: 'pale', focus: [1520, 380], zoom: 1.24,
  keep: [[180, 240, 1500, 960], [1500, 160, 1900, 900]],
  silk: (r, t) => { const up = E.inOut3(clamp((r - 2 * BAR) / 0.8)); return flow([[0, SY], [240, 420], [700, 470], [1200, 470], [1500, 600], [1600, 700 - up * 500], [1620, 760 - up * 560], [1700, 200], [1920, SY]], t, 6); },
  draw(c, r, t) {
    // 城台（红墙、券门）
    F(c, new Path2D('M180 980 L180 640 L1300 640 L1300 980 Z'), '#b8402e', 3);
    for (const x of [380, 600, 740, 880, 1100]) { const w = x === 740 ? 110 : 84; F(c, new Path2D(`M${x - w / 2} 980 L${x - w / 2} ${x === 740 ? 820 : 850} Q${x} ${x === 740 ? 760 : 800} ${x + w / 2} ${x === 740 ? 820 : 850} L${x + w / 2} 980 Z`), '#3a1a10', 2); }
    // 城楼：汉白玉栏、红柱、重檐黄瓦
    F(c, new Path2D('M150 640 L1330 640 L1330 610 L150 610 Z'), C.white, 2.4); for (let x = 170; x < 1330; x += 40) F(c, new Path2D(`M${x} 610 l10 0 l0 -26 l-10 0 Z`), C.white, 1.4);
    F(c, new Path2D('M250 584 L1230 584 L1230 450 L250 450 Z'), '#b8402e', 2.4); for (let x = 270; x < 1230; x += 96) F(c, new Path2D(`M${x} 584 l18 0 l0 -134 l-18 0 Z`), '#8a2a1e', 1.6);
    const roof = (y, x0, x1, h) => { F(c, new Path2D(`M${x0 - 70} ${y + 10} Q${x0 + 40} ${y - 10} ${x0 + 60} ${y - h} L${x1 - 60} ${y - h} Q${x1 - 40} ${y - 10} ${x1 + 70} ${y + 10} Z`), C.gold, 2.6);
      c.save(); c.clip(new Path2D(`M${x0 - 70} ${y + 10} Q${x0 + 40} ${y - 10} ${x0 + 60} ${y - h} L${x1 - 60} ${y - h} Q${x1 - 40} ${y - 10} ${x1 + 70} ${y + 10} Z`)); c.strokeStyle = 'rgba(122,70,20,.5)'; c.lineWidth = 2; for (let x = x0 - 80; x < x1 + 80; x += 16) { c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x + (x - (x0 + x1) / 2) * 0.06, y - h); c.stroke(); } c.restore(); };
    roof(450, 230, 1250, 60); F(c, new Path2D('M330 392 L1150 392 L1150 330 L330 330 Z'), '#b8402e', 2); roof(330, 310, 1170, 70);
    // 红灯笼一盏盏亮
    for (let k = 0; k < 8; k++) { const x = 300 + k * 125, on = clamp((r - 0.4 - k * 0.42) / 0.25), sw = Math.sin(t * 2 + k) * 0.06; c.save(); c.translate(x, 470); c.rotate(sw); c.strokeStyle = C.line; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.stroke();
      if (on > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 60, 4, 0, 60, 90); g.addColorStop(0, `rgba(255,170,80,${0.45 * on})`); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(-90, -30, 180, 180); c.restore(); }
      F(c, DH.ell(0, 60, 34, 38), on > 0.5 ? '#e0402a' : '#9a3a2a', 2.2); c.fillStyle = C.gold; c.fillRect(-14, 18, 28, 6); c.fillRect(-14, 96, 28, 6); c.strokeStyle = C.gold; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 102); c.lineTo(0, 130); c.stroke(); c.restore(); }
    // 金水桥
    F(c, new Path2D('M300 980 Q740 900 1180 980 Z'), C.white, 2.4);
    // 和平鸽
    for (let k = 0; k < 9; k++) { const q = clamp((r - 2.8 - k * 0.25) / 5); if (q <= 0) continue; const x = 600 + k * 70 + q * (400 + k * 60), y = 900 - q * (560 + (k % 3) * 80), f = Math.sin(t * 12 + k) * 0.9;
      c.save(); c.translate(x, y); c.scale(1.2, 1.2); F(c, DH.sm([[-20, 0], [0, -6], [22, -2], [28, 2], [10, 8], [-16, 6]]), C.white, 1.6); F(c, DH.sm([[-4, -2], [6, -30 * f - 4], [16, -24 * f], [10, 0]]), C.white, 1.6); c.restore(); }
    // 旗杆
    F(c, new Path2D('M1612 960 L1626 960 L1622 170 L1616 170 Z'), C.white, 2); F(c, DH.ell(1619, 166, 8, 8), C.gold, 1.6); F(c, new Path2D('M1560 960 L1680 960 L1670 930 L1570 930 Z'), C.white, 2);
  },
  front(c, r, t) { const q = E.out3(clamp((r - 2 * BAR - 0.6) / 0.8)); if (q > 0) flag(c, 1624, 186, 270, t, q); } });

// ================= 东方红一号 =================
const SAT = (r, t) => { const a = -2.6 + r * 0.2; return [960 + Math.cos(a) * 760, 900 + Math.sin(a) * 520, a]; };
DHW.add({ id: 'dfh', label: ['东方红一号', '一九七〇年'], wall: 'red', focus: [0, 0], zoom: 1.35,
  keep: [[0, 124, 1920, 980]],
  silk: (r, t) => { const pts = [[0, SY], [140, 330]]; const [sx, sy, a] = SAT(r, t); for (let b = -2.9; b <= a; b += 0.08) pts.push([960 + Math.cos(b) * 760, 900 + Math.sin(b) * 520]); pts.push([sx, sy]); pts.push([sx + 160, sy - 160]); pts.push([1920, SY]); return flow(pts, t, 3, 0.02, 2); },
  draw(c, r, t) {
    c.fillStyle = '#1f3a52'; c.fillRect(0, 124, 1920, 860);
    const rs = U.rng(12); for (let k = 0; k < 90; k++) { const x = rs() * 1920, y = 130 + rs() * 600, tw = 0.5 + 0.5 * Math.sin(t * 3 + k); c.fillStyle = `rgba(236,223,196,${0.4 + 0.6 * tw})`; c.beginPath(); c.arc(x, y, 1.5 + rs() * 2.5, 0, Math.PI * 2); c.fill(); }
    // 地球边缘（石绿陆地＋石青海＋白云）
    const earth = DH.ell(960, 1500, 1300, 640); F(c, earth, C.blue, 3); c.save(); c.clip(earth);
    [[500, 900, 300, 80], [1200, 880, 360, 70], [1700, 960, 200, 90]].forEach(([x, y, w, h]) => F(c, DH.ell(x, y, w, h, -0.05), C.green, 2));
    [[700, 870, 1], [1450, 900, 1.3], [300, 950, 1.1]].forEach(([x, y, s], k) => DH.cloud(c, x - t * 10, y, s, t, t + k)); c.restore();
    c.strokeStyle = 'rgba(236,223,196,.5)'; c.lineWidth = 8; c.stroke(earth);
    // 火箭升空（开场）
    if (r < 4) { const q = clamp((r + 0.3) / 3.5), x = 260 + q * 300, y = 900 - q * q * 900; c.save(); c.translate(x, y); c.rotate(0.3 * q);
      F(c, new Path2D('M-14 0 L14 0 L14 -110 L0 -140 L-14 -110 Z'), C.white, 2); c.fillStyle = C.red; c.fillRect(-14, -60, 28, 10); F(c, new Path2D(`M-12 0 Q0 ${60 + Math.sin(t * 30) * 10} 12 0 Z`), '#f2a43a', 1.6); c.restore();
      for (let k = 0; k < 10; k++) { const qq = q - k * 0.04; if (qq < 0) continue; DH.cloud(c, 260 + qq * 300 - 10, 900 - qq * qq * 900 + 60, 0.4 + k * 0.05, t, k, 'rgba(236,223,196,.8)'); } }
    // 卫星：多面球＋四根鞭状天线；第 3 小节快推，电波一圈圈往外
    const [x, y, a] = SAT(r, t); c.save(); c.translate(x, y); c.rotate(t * 0.8);
    for (let k = 0; k < 4; k++) { c.strokeStyle = C.white; c.lineWidth = 2.5; const b = k * Math.PI / 2 + 0.6; c.beginPath(); c.moveTo(Math.cos(b) * 30, Math.sin(b) * 30); c.lineTo(Math.cos(b + 0.3) * 120, Math.sin(b + 0.3) * 120); c.stroke(); }
    const ball = DH.ell(0, 0, 40, 40); F(c, ball, C.gold, 2.6); c.save(); c.clip(ball); c.strokeStyle = 'rgba(90,36,20,.55)'; c.lineWidth = 1.6; for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(0, 0, Math.abs(k) * 13 + 1, 40, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(-40, k * 12); c.lineTo(40, k * 12); c.stroke(); } c.restore(); c.restore();
    if (r > 2 * BAR) for (let k = 0; k < 4; k++) { const q = ((r - 2 * BAR) * 0.7 + k / 4) % 1; c.strokeStyle = `rgba(216,176,90,${1 - q})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 50 + q * 220, -2.2, -0.9); c.stroke(); }
  } });
DHW.segs[DHW.segs.length - 1].focus = SAT(2 * BAR).slice(0, 2);

// ================= 高铁 =================
const TRK = 700, trainX = r => -2600 + r * 560;
DHW.add({ id: 'gaotie', label: ['高铁时代', '二〇〇八年'], wall: 'pale', focus: [1300, 640], zoom: 1.3,
  keep: [[0, 520, 1920, 760]],
  silk: (r, t) => flow([[0, SY], [200, 420], [500, 560], [900, 570], [1300, 570], [1700, 560], [1920, SY]], t, 5, 0.02, 6),
  draw(c, r, t) {
    DH.hills(c, [[200, 700, 500, 300], [700, 700, 520, 360], [1250, 700, 560, 300], [1750, 700, 520, 340]], { seed: 41 });
    // 河
    c.fillStyle = C.blue2; c.fillRect(0, 860, 1920, 120); c.strokeStyle = C.white; c.lineWidth = 2.5; for (let k = 0; k < 9; k++) { const x = ((k * 230 + t * 30) % 2070) - 80; c.beginPath(); c.arc(x, 910, 16, Math.PI, Math.PI * 1.8); c.stroke(); }
    // 高架桥
    F(c, new Path2D(`M-20 ${TRK} L1940 ${TRK} L1940 ${TRK + 40} L-20 ${TRK + 40} Z`), C.white, 2.6);
    for (let x = 60; x < 1920; x += 240) F(c, new Path2D(`M${x - 22} ${TRK + 40} L${x + 22} ${TRK + 40} L${x + 30} 980 L${x - 30} 980 Z`), '#e6d6b2', 2.2);
    // 列车：8 节，白车身土红腰线；车头流线
    const x0 = trainX(r);
    for (let k = 0; k < 8; k++) { const x = x0 + k * 320; if (x > 2000 || x + 320 < -100) continue; const head = k === 7;
      const p = head ? new Path2D(`M${x} ${TRK - 86} L${x + 230} ${TRK - 86} Q${x + 330} ${TRK - 70} ${x + 390} ${TRK - 6} L${x} ${TRK - 6} Z`) : new Path2D(`M${x} ${TRK - 86} L${x + 314} ${TRK - 86} L${x + 314} ${TRK - 6} L${x} ${TRK - 6} Z`);
      F(c, p, '#f4ecd8', 2.6); c.fillStyle = C.red; c.fillRect(x, TRK - 40, head ? 300 : 314, 8);
      c.fillStyle = '#2f4a5a'; if (head) { c.beginPath(); c.moveTo(x + 250, TRK - 80); c.quadraticCurveTo(x + 310, TRK - 74, x + 336, TRK - 54); c.lineTo(x + 250, TRK - 54); c.closePath(); c.fill(); }
      for (let w = 20; w < (head ? 220 : 300); w += 34) c.fillRect(x + w, TRK - 72, 22, 20); }
    // 第 3 小节：前景电线杆一根根闪过
    if (r > 2 * BAR) for (let k = 0; k < 6; k++) { const x = ((k * 420 - (r - 2 * BAR) * 2400) % 2520 + 2520) % 2520 - 300; F(c, new Path2D(`M${x} 980 L${x + 26} 980 L${x + 22} 300 L${x + 4} 300 Z`), C.brown, 2); c.strokeStyle = C.line; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 40, 330); c.lineTo(x + 70, 330); c.stroke(); }
    // 车速线
    if (x0 > -2600 && x0 < 2000) { c.strokeStyle = 'rgba(236,223,196,.8)'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { const yy = TRK - 90 + k * 16, xx = x0 + 8 * 320 + 30 - ((t * 900 + k * 130) % 600); c.beginPath(); c.moveTo(xx - 200, yy); c.lineTo(xx, yy); c.stroke(); } }
  } });

// ================= 嫦娥五号 =================
const ASC = r => r < 2 * BAR + 0.3 ? 0 : E.in(clamp((r - 2 * BAR - 0.3) / 3.6));
E.in = p => p * p;
DHW.add({ id: 'change', label: ['嫦娥五号', '二〇二〇年'], wall: 'red', focus: [1040, 560], zoom: 1.3,
  keep: [[0, 124, 1920, 980]],
  silk: (r, t) => { const a = ASC(r), cx = 1040 + a * 500, cy = 560 - a * 520; return flow([[0, SY], [300, 300], [700, 520], [930, 660], [cx - 40, cy + 30], [cx, cy], [cx + 40, cy - 40], [cx + 260, cy - 120], [1920, SY]], t, 6); },
  draw(c, r, t) {
    c.fillStyle = '#1f3a52'; c.fillRect(0, 124, 1920, 860);
    const rs = U.rng(21); for (let k = 0; k < 60; k++) { const x = rs() * 1920, y = 130 + rs() * 420; c.fillStyle = `rgba(236,223,196,${0.5 + 0.5 * Math.sin(t * 2 + k)})`; c.beginPath(); c.arc(x, y, 1.5 + rs() * 2, 0, Math.PI * 2); c.fill(); }
    // 地球
    const ea = DH.ell(1560, 290, 90, 90); F(c, ea, C.blue, 2.4); c.save(); c.clip(ea); F(c, DH.ell(1530, 270, 50, 30), C.green, 1.6); F(c, DH.ell(1600, 330, 40, 22), C.green, 1.6); c.fillStyle = 'rgba(31,58,82,.55)'; c.fillRect(1600, 190, 60, 200); c.restore();
    // 月面
    const ground = new Path2D('M-20 720 Q500 680 960 700 Q1500 720 1940 690 L1940 990 L-20 990 Z'); F(c, ground, '#d8cdb4', 3);
    c.save(); c.clip(ground); [[200, 820, 90], [620, 900, 60], [1400, 820, 110], [1760, 900, 70], [880, 780, 40]].forEach(([x, y, R]) => { F(c, DH.ell(x, y, R, R * 0.3), '#c4b898', 2); F(c, DH.ell(x, y - 4, R * 0.8, R * 0.2), '#b8aa88', 0); }); c.restore();
    // 着陆器：金箔箱体＋四腿＋太阳翼
    const lx = 1040, ly = 700;
    [[-150, 1], [150, 1], [-90, 0.6], [90, 0.6]].forEach(([dx, s]) => { c.strokeStyle = '#8a8070'; c.lineWidth = 8 * s; c.beginPath(); c.moveTo(lx + dx * 0.5, ly - 60); c.lineTo(lx + dx, ly + 20); c.stroke(); F(c, DH.ell(lx + dx, ly + 24, 22 * s, 7 * s), '#8a8070', 1.6); });
    F(c, new Path2D(`M${lx - 110} ${ly - 150} L${lx + 110} ${ly - 150} L${lx + 110} ${ly - 50} L${lx - 110} ${ly - 50} Z`), C.gold, 2.6);
    c.strokeStyle = 'rgba(122,70,20,.5)'; c.lineWidth = 1.5; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(lx - 110 + k * 36, ly - 150); c.lineTo(lx - 96 + k * 32, ly - 50); c.stroke(); }
    [[-1], [1]].forEach(([d]) => { F(c, new Path2D(`M${lx + d * 110} ${ly - 120} L${lx + d * 330} ${ly - 150} L${lx + d * 330} ${ly - 90} L${lx + d * 110} ${ly - 80} Z`), C.blue, 2.2); c.strokeStyle = C.white; c.lineWidth = 1.2; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(lx + d * (110 + k * 44), ly - 122 - k * 6); c.lineTo(lx + d * (110 + k * 44), ly - 82 - k * 2); c.stroke(); } });
    // 机械臂：伸下去铲一勺月壤，抬起倒进样品罐
    const ph = r < 5 ? r / 5 : 1, dig = Math.sin(clamp(ph * 1.3) * Math.PI), sh = [lx + 100, ly - 70], el = [lx + 220 + dig * 30, ly - 40 + dig * 60], hand = [lx + 260 + dig * 20, ly + 20 * dig - 80 * (1 - dig)];
    c.strokeStyle = C.white; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(...sh); c.lineTo(...el); c.lineTo(...hand); c.stroke(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
    F(c, new Path2D(`M${hand[0] - 20} ${hand[1]} L${hand[0] + 20} ${hand[1]} L${hand[0] + 14} ${hand[1] + 22} L${hand[0] - 14} ${hand[1] + 22} Z`), '#8a8070', 2);
    if (dig > 0.5 && ph < 0.75) { c.fillStyle = '#b8aa88'; for (let k = 0; k < 8; k++) { c.beginPath(); c.arc(hand[0] - 16 + k * 5, hand[1] - 2 - Math.sin(k) * 3, 4, 0, Math.PI * 2); c.fill(); } }
    // 上升器（顶上一个小舱）＋样品罐；第 3 小节点火起飞
    const a = ASC(r), ax = 1040 + a * 500, ay = ly - 150 - a * 520;
    if (a > 0) { for (let k = 0; k < 8; k++) { const q = (t * 3 + k / 8) % 1; c.fillStyle = `rgba(236,223,196,${0.7 * (1 - q)})`; c.beginPath(); c.arc(lx + (k - 4) * 30 * q, ly - 150 + q * 30, 10 + q * 30, 0, Math.PI * 2); c.fill(); }
      F(c, new Path2D(`M${ax - 14} ${ay + 40} Q${ax} ${ay + 120 + Math.sin(t * 30) * 12} ${ax + 14} ${ay + 40} Z`), '#f2a43a', 1.8); }
    c.save(); c.translate(ax, ay); c.rotate(a * 0.4); F(c, new Path2D('M-50 40 L50 40 L40 -30 L-40 -30 Z'), '#e6d6b2', 2.4); F(c, new Path2D('M-50 40 L-70 60 M50 40 L70 60'), null, 3); F(c, DH.ell(0, -40, 18, 14), C.white, 2); c.restore();
  } });

// ================= 尾声：飞回莫高窟 =================
// 第 1–2 小节：长卷里的莫高窟崖壁，丝带绕上九层楼钻进窟口；第 2 小节末「切」到全貌，第 3–4 小节拉远：满壁窟口里亮着前面走过的每一朝
const THUMB = {};
function thumb(k) { if (THUMB[k]) return THUMB[k]; const cv = PAINT.canvas(1920, 1080), g = cv.getContext('2d'), s = DHW.segs[k]; g.save(); g.fillStyle = '#c99a62'; g.fillRect(0, 0, 1920, 1080); g.translate(0, 0); s.draw(g, 4, s.T + 4); if (s.front) s.front(g, 4, s.T + 4); g.restore(); THUMB[k] = cv; return cv; }
function jiuceng(c, x, y, s, t) { c.save(); c.translate(x, y); c.scale(s, s);
  for (let k = 0; k < 9; k++) { const w = 300 - k * 22, yy = -k * 62; F(c, new Path2D(`M${-w / 2 + 10} ${yy} L${w / 2 - 10} ${yy} L${w / 2 - 10} ${yy - 44} L${-w / 2 + 10} ${yy - 44} Z`), '#b8402e', 2); for (let m = -w / 2 + 30; m < w / 2 - 20; m += 34) F(c, new Path2D(`M${m} ${yy - 6} l14 0 l0 -30 l-14 0 Z`), '#e6d6b2', 1.2);
    const eave = new Path2D(`M${-w / 2 - 34} ${yy - 40} Q${-w / 2} ${yy - 50} ${-w / 2 + 20} ${yy - 64} L${w / 2 - 20} ${yy - 64} Q${w / 2} ${yy - 50} ${w / 2 + 34} ${yy - 40} Z`); F(c, eave, k % 2 ? C.greenDk : C.green, 2);
    c.save(); c.translate(w / 2 + 30, yy - 40); c.rotate(Math.sin(t * 2.5 + k) * 0.25); c.strokeStyle = C.line; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke(); F(c, new Path2D('M-5 12 L5 12 L7 24 L-7 24 Z'), C.gold, 1.2); c.restore(); }
  F(c, new Path2D('M-30 -558 L30 -558 L0 -620 Z'), C.gold, 2); c.restore(); }
const CLIFF_CAVES = (() => { const o = [], r = U.rng(303); for (let row = 0; row < 5; row++) for (let i = 0; i < 12; i++) { const x = -1500 + i * 280 + (row % 2) * 140 + r() * 30, y = -250 + row * 210; if (Math.abs(x - 960) < 260) continue; o.push([x, y]); } return o; })();
function cliffFull(c, t, z, r) {
  // 世界坐标：中心 (960, 560)；崖面 x -1700..3600, y -500..1500
  c.fillStyle = '#d8b88a'; c.fillRect(-2600, -2400, 7200, 2050);
  for (let k = 0; k < 7; k++) { const x0 = -2400 + k * 1100; F(c, new Path2D(`M${x0} -350 Q${x0 + 550} -${700 + (k % 3) * 120} ${x0 + 1100} -350 Z`), k % 2 ? '#e0c08a' : '#d2a870', 2.4); }
  F(c, new Path2D('M-2600 -360 L4600 -360 L4600 1300 L-2600 1300 Z'), '#c99a62', 3);
  c.strokeStyle = 'rgba(122,46,30,.35)'; c.lineWidth = 4; for (let y = -320; y < 1300; y += 60) { c.beginPath(); for (let x = -2600; x <= 4600; x += 40) { const yy = y + Math.sin(x * 0.01 + y) * 6; x === -2600 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  // 窟口：每个窟里亮着一朝
  CLIFF_CAVES.forEach(([x, y], i) => { const k = 1 + (i % 15); const p = new Path2D(`M${x - 90} ${y + 80} L${x - 90} ${y - 20} Q${x} ${y - 100} ${x + 90} ${y - 20} L${x + 90} ${y + 80} Z`);
    F(c, p, '#3a1a10', 3); c.save(); c.clip(p); c.globalAlpha = 0.92; c.drawImage(thumb(k), x - 150, y - 100, 300, 169); c.globalAlpha = 1; c.restore(); c.strokeStyle = C.gold; c.lineWidth = 3; c.stroke(p); });
  // 白杨、沙地
  F(c, new Path2D('M-2600 1180 L4600 1180 L4600 2900 L-2600 2900 Z'), '#d8b88a', 2); c.strokeStyle = 'rgba(122,46,30,.3)'; c.lineWidth = 4; for (let k = 0; k < 10; k++) { c.beginPath(); for (let x = -2600; x <= 4600; x += 40) { const yy = 1320 + k * 150 + Math.sin(x * 0.004 + k) * 30; x === -2600 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); }
  for (let k = 0; k < 40; k++) { const x = -2500 + k * 180, sw = Math.sin(t * 1.4 + k) * 5; F(c, DH.sm([[x - 26, 1190], [x - 34 + sw, 1080], [x + sw, 900], [x + 34 + sw, 1080], [x + 26, 1190]]), C.green, 2.4); }
  jiuceng(c, 960, 1180, 1.7, t);
}
DHW.add({ id: 'wei', wall: 'ochre', focus: [960, 540], keep: [[0, 124, 1920, 980]],
  silk: (r, t) => { const d = E.inOut3(clamp((r - 0.4) / 2)); return flow([[0, SY], [400, 300], [800, 330 + d * 100], [900, 420 + d * 120], [1020, 380 + d * 200], [960, 560 + d * 120], [960 + (1 - d) * 960, 700 - (1 - d) * 450]], t, 8); },
  tip: r => r < -0.75 ? 0 : r < 0.05 ? 0.4 * E.out3((r + 0.75) / 0.8) : 0.4 + 0.6 * E.inOut3(clamp((r - 0.05) / 2.4)),
  draw(c, r, t) { c.save(); c.translate(960, 560); c.scale(0.42, 0.42); c.translate(-960, -560); cliffFull(c, t, 1, r); c.restore(); },
  cam(r, t) { if (r < 2 * BAR) return null;
    return { custom: (c, tt) => { const q = E.out3(clamp((r - 2 * BAR) / 3.6)), z = lerp(1.15, 0.5, q), cy = lerp(-120, 470, q);
      c.fillStyle = '#7a3020'; c.fillRect(0, 0, 1920, 1080);
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960, -cy); cliffFull(c, t, z, r);
      // 丝带：从九层楼顶甩出，在檐角飘
      const top = [960, 1180 - 620 * 1.7], pts = []; for (let i = 0; i <= 26; i++) { const qq = i / 26; pts.push([top[0] + qq * 900, top[1] + Math.sin(qq * 6 - t * 3) * 60 * qq - qq * 120]); } DHW.drawSilk(c, pts.reverse(), t, true);
      c.restore();
      // 最后两小节：题记落在崖面上（世界里的榜题，跟着镜头一起缩）
      const lq = clamp((r - 3 * BAR) / 0.5); if (lq > 0) { c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960, -cy); DH.bangti(c, 1240, -230, ['上下五千年', '敦煌莫高窟'], { size: 130, alpha: lq, seed: 8 }); c.restore(); }
      c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,.22)'; c.fillRect(0, 0, 1920, 1080); c.restore();
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35; c.drawImage(PAINT.texture('dh_dirt', '#e8dcc8', { scale: 0.002, amt: 40, grain: 20, seed: 9 }), 0, 0); c.restore();
      DH.petals(c, t, { n: 16, speed: 50, scale: 1.4 }); } }; } });
})();
