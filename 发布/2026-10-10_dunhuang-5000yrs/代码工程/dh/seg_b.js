// 造纸 → 郑和
(() => {
const { C, F } = DH, { clamp, lerp } = U, BAR = DHW.BAR, K = KIT, E = DHW.ease, SY = DHW.SEAM_Y, flow = DHW.flow;
const bamboo = (c, x, y0, h, t, k) => { const sw = Math.sin(t * 1.4 + k) * 10; c.strokeStyle = C.greenDk; c.lineWidth = 16; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + sw * 0.3, y0 - h / 2, x + sw, y0 - h); c.stroke();
  c.strokeStyle = C.green2; c.lineWidth = 3; for (let y = y0 - 60; y > y0 - h; y -= 70) { const q = (y0 - y) / h; c.beginPath(); c.moveTo(x - 9 + sw * q * q, y); c.lineTo(x + 9 + sw * q * q, y); c.stroke(); }
  for (let j = 0; j < 7; j++) { const q = 0.35 + j * 0.09, yy = y0 - h * q, xx = x + sw * q * q, d = j % 2 ? 1 : -1; F(c, K.ribbon([[xx, yy], [xx + d * 40, yy + 14 + Math.sin(t * 2 + j) * 4], [xx + d * 80, yy + 34]], q2 => 16 * Math.sin(Math.PI * Math.min(1, q2 * 1.1 + 0.05))), C.green, 1.8); } };

// ================= 蔡伦造纸 =================
const SHEETS = [[1080, 2.0], [1250, 3.0], [1420, 4.0], [1590, 5.2], [1760, 6.4]];
const sag = x => 330 + Math.sin((x - 960) / 960 * Math.PI) * 0 + 40 * Math.sin(((x - 960) / 860) * Math.PI);
DHW.add({ id: 'paper', label: ['蔡伦造纸', '一〇五年'], wall: 'pale', focus: [560, 520], zoom: 1.28,
  keep: [[200, 330, 980, 960], [1000, 300, 1860, 760]],
  silk: (r, t) => { const pts = [[0, SY], [300, 260], [700, 300], [980, 330]]; for (let x = 1060; x <= 1840; x += 60) pts.push([x, 330 + 30 * Math.sin((x - 980) / 860 * Math.PI)]); pts.push([1920, SY]); return flow(pts, t, 4, 0.02, 2); },
  draw(c, r, t) {
    bamboo(c, 90, 980, 760, t, 0); bamboo(c, 170, 980, 640, t, 1);
    // 纸浆槽
    F(c, new Path2D('M230 700 L960 700 L930 930 L260 930 Z'), C.brown, 3); F(c, DH.ell(595, 702, 365, 36), '#e8e0c8', 3);
    c.save(); c.clip(DH.ell(595, 702, 360, 32)); c.strokeStyle = 'rgba(138,74,42,.35)'; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = 250 + (i * 97) % 700, y = 680 + (i * 37) % 44; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y + 6 + Math.sin(t + i) * 3, x + 26, y + 2); c.stroke(); } c.restore();
    for (let i = 0; i < 3; i++) { const q = (t * 0.3 + i / 3) % 1; c.strokeStyle = `rgba(236,223,196,${0.8 * (1 - q)})`; c.lineWidth = 4; c.beginPath(); for (let j = 0; j <= 10; j++) { const y = 680 - q * 200 - j * 10, x = 400 + i * 180 + Math.sin(j * 0.7 + t * 2 + i) * 12; j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    // 竹帘：两次「下槽—抄起」，第 3 小节高高抄起（快推）
    const cyc = r < 2 * BAR ? (r % BAR) / BAR : 1, dip = r < 2 * BAR ? Math.sin(cyc * Math.PI) : 0, lift = r >= 2 * BAR ? E.out3(clamp((r - 2 * BAR) / 0.5)) : 0;
    const sy = 600 + dip * 120 - lift * 170, wet = r > 2 * BAR ? 1 : clamp((cyc - 0.5) * 3);
    c.save(); c.translate(595, sy); c.rotate(Math.sin(t * 2) * 0.02 - lift * 0.05);
    F(c, new Path2D('M-300 -14 L300 -14 L300 14 L-300 14 Z'), C.red, 2.4);
    F(c, new Path2D('M-284 14 L284 14 L284 40 L-284 40 Z'), wet > 0 ? `rgba(244,236,214,${0.4 + 0.6 * wet})` : '#c9a86a', 2);
    c.strokeStyle = 'rgba(122,70,40,.6)'; c.lineWidth = 1.2; for (let x = -280; x < 284; x += 9) { c.beginPath(); c.moveTo(x, 14); c.lineTo(x, 40); c.stroke(); }
    c.restore();
    // 滴水
    if (wet > 0.3 && sy < 700) for (let k = 0; k < 10; k++) { const ph = (t * 1.6 + k * 0.137) % 1, x = 330 + k * 56 + Math.sin(k * 3) * 10, y = sy + 46 + ph * (720 - sy - 46); c.fillStyle = 'rgba(236,240,232,.95)'; c.beginPath(); c.ellipse(x, y, 3.5, 7, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.blue2; c.lineWidth = 1.2; c.stroke(); }
    // 晾纸：一张张挂上绳（绳就是丝带），微微摆
    SHEETS.forEach(([x, tin], k) => { const q = E.out3(clamp((r - tin) / 0.4)); if (q <= 0) return; const y = 330 + 30 * Math.sin((x - 980) / 860 * Math.PI), sw = Math.sin(t * 2 + k) * 0.05;
      c.save(); c.translate(x, y); c.rotate(sw); c.scale(1, q); F(c, new Path2D('M-66 0 L66 0 L62 300 L-62 300 Z'), '#f4ecd8', 2.4); c.strokeStyle = 'rgba(160,120,80,.25)'; c.lineWidth = 1; for (let j = 0; j < 8; j++) { c.beginPath(); c.moveTo(-60, 30 + j * 34); c.lineTo(60, 34 + j * 34); c.stroke(); }
      F(c, new Path2D('M-10 -8 L10 -8 L10 12 L-10 12 Z'), C.brown, 1.4); c.restore(); });
  } });

// ================= 莫高开窟 =================
const CAVES = (() => { const o = [], r = U.rng(77); for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) o.push([1110 + i * 120 + (row % 2) * 50 + r() * 16, 390 + row * 170 + r() * 10, 0.6 + (row * 6 + i) * 0.38 + r() * 0.2]); return o; })();
DHW.add({ id: 'mogao', label: ['莫高开窟', '三六六年'], wall: 'ochre', focus: [520, 420], zoom: 1.3,
  keep: [[220, 200, 900, 760], [1040, 200, 1900, 900]],
  silk: (r, t) => flow([[0, SY], [260, 200], [620, 190], [900, 300], [1100, 400], [1300, 395], [1520, 400], [1700, 330], [1920, SY]], t, 10),
  draw(c, r, t) {
    // 三危山：三座尖峰；第 3 小节山头放金光
    const glow = r > 2 * BAR ? E.out3(clamp((r - 2 * BAR) / 0.6)) : 0.15;
    c.save(); c.translate(560, 560); c.rotate(t * 0.05);
    for (let k = 0; k < 24; k++) { c.rotate(Math.PI / 12); c.fillStyle = k % 2 ? `rgba(216,176,90,${0.55 * glow})` : `rgba(236,223,196,${0.35 * glow})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, -900); c.lineTo(40, -900); c.closePath(); c.fill(); }
    c.restore();
    if (glow > 0.3) for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.28, d = 260 + (k % 3) * 70 + Math.sin(t * 2 + k) * 6, x = 560 + Math.cos(a) * d, y = 560 + Math.sin(a) * d * 0.8; c.globalAlpha = clamp((glow - 0.3) * 2 - k * 0.05);
      c.strokeStyle = C.gold; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 24, 0, Math.PI * 2); c.stroke(); F(c, DH.sm([[x - 14, y + 26], [x - 8, y - 2], [x, y - 10], [x + 8, y - 2], [x + 14, y + 26]]), C.gold, 1.6); c.globalAlpha = 1; }
    F(c, new Path2D('M180 780 L330 470 L420 560 L560 330 L700 560 L780 460 L940 780 Z'), '#b8603e', 3);
    c.save(); c.clip(new Path2D('M180 780 L330 470 L420 560 L560 330 L700 560 L780 460 L940 780 Z')); c.strokeStyle = C.redDk; c.lineWidth = 26; c.globalAlpha = 0.6; c.stroke(new Path2D('M180 780 L330 470 L420 560 L560 330 L700 560 L780 460 L940 780')); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(90,36,20,.5)'; c.lineWidth = 2.4; [[330, 480, 300, 700], [560, 340, 520, 720], [560, 340, 620, 700], [780, 470, 820, 720]].forEach(([a, b, x2, y2]) => { c.beginPath(); c.moveTo(a, b + 10); c.quadraticCurveTo((a + x2) / 2 + 20, (b + y2) / 2, x2, y2); c.stroke(); }); c.restore();
    // 崖壁
    const cliff = new Path2D('M1040 230 L1900 230 L1900 900 L1010 900 Z'); F(c, cliff, '#c99a62', 3);
    c.save(); c.clip(cliff); c.strokeStyle = 'rgba(122,46,30,.35)'; c.lineWidth = 3; for (let y = 280; y < 900; y += 46) { c.beginPath(); for (let x = 1000; x < 1920; x += 20) { const yy = y + Math.sin(x * 0.02 + y) * 4; x === 1000 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); } c.restore();
    // 石窟一个接一个凿开（尘土冒出）
    CAVES.forEach(([x, y, t0]) => { const q = clamp((r - t0) / 0.35); if (q <= 0) return; const s = E.out3(q);
      c.save(); c.translate(x, y); c.scale(s, s); F(c, new Path2D('M-34 50 L-34 -6 Q0 -50 34 -6 L34 50 Z'), '#3a1a10', 2.4); c.fillStyle = 'rgba(216,176,90,.55)'; c.beginPath(); c.arc(0, 26, 12, 0, Math.PI * 2); c.fill(); c.restore();
      const dq = clamp((r - t0) / 1.0); if (dq < 1) for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.5; c.fillStyle = `rgba(236,223,196,${0.8 * (1 - dq)})`; c.beginPath(); c.arc(x + Math.cos(a) * dq * 70, y + 40 + Math.sin(a) * dq * 40, 10 + dq * 14, 0, Math.PI * 2); c.fill(); } });
    // 大泉河与白杨
    c.fillStyle = '#5a86b0'; c.fillRect(0, 900, 1920, 80); c.strokeStyle = C.white; c.lineWidth = 2.5; for (let k = 0; k < 8; k++) { const x = ((k * 260 - t * 40) % 2080 + 2080) % 2080 - 80; c.beginPath(); c.arc(x, 940, 18, Math.PI, Math.PI * 1.8); c.stroke(); }
    for (let k = 0; k < 9; k++) { const x = 60 + k * 120 + (k > 6 ? 900 : 0), sw = Math.sin(t * 1.5 + k) * 4; if (x > 1000 && x < 1900 && k <= 6) continue; F(c, DH.sm([[x - 18, 900], [x - 24 + sw, 820], [x + sw, 700], [x + 24 + sw, 820], [x + 18, 900]]), C.green, 2); c.strokeStyle = C.brown; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 900); c.lineTo(x, 930); c.stroke(); }
  } });

// ================= 开元盛世：飞天 =================
function feitian(c, x, y, s, t) {
  // 横飞向右：头在右（背面高髻，不露脸），上身前倾，琵琶抱在胸前，长裙和双足拖在左后方
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.1 + Math.sin(t * 1.6) * 0.04);
  const wv = k => Math.sin(t * 4 - k) * 8;
  // 长裙：两层，向后拖成尖尾；裙下双足
  const skirt = DH.sm([[10, -18], [-90, -24], [-190, -16 + wv(1)], [-280, -2 + wv(2)], [-360, 12 + wv(3)], [-300, 22 + wv(2)], [-190, 28 + wv(1)], [-80, 28], [10, 22]]);
  F(c, skirt, C.green, 2.4);
  const under = DH.sm([[-60, 10], [-160, 22 + wv(1)], [-250, 30 + wv(2)], [-330, 46 + wv(3)], [-260, 44 + wv(2)], [-160, 38 + wv(1)], [-60, 30]]); F(c, under, C.blue2, 2);
  c.strokeStyle = C.white; c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-10 - k * 60, -16); c.quadraticCurveTo(-40 - k * 60, 0, -24 - k * 64, 22); c.stroke(); }
  F(c, DH.sm([[-150, 26 + wv(1)], [-176, 50 + wv(1)], [-190, 58 + wv(1)], [-168, 60 + wv(1)], [-140, 34 + wv(1)]]), C.skin, 2, '#8a3a24');
  F(c, DH.sm([[-196, 30 + wv(2)], [-226, 52 + wv(2)], [-240, 58 + wv(2)], [-216, 62 + wv(2)], [-186, 38 + wv(2)]]), C.skin, 2, '#8a3a24');
  // 红披帛两条（飞天身上自己的飘带）
  F(c, K.ribbon(K.densify([[20, -30], [-60, -70 + wv(0)], [-160, -60 + wv(1)], [-260, -84 + wv(2)]], 5), q => 12 * (1 - q * 0.7)), C.red, 1.8);
  F(c, K.ribbon(K.densify([[40, 20], [-40, 60 + wv(1)], [-140, 74 + wv(2)], [-230, 96 + wv(3)]], 5), q => 10 * (1 - q * 0.7)), C.red, 1.8);
  // 腰带垂绦
  F(c, K.ribbon([[0, 10], [-30, 40 + wv(0) * 0.5], [-70, 60 + wv(1)]], q => 8 - q * 4), C.red, 1.6);
  // 上身：红色半臂，背面
  F(c, DH.sm([[0, -24], [60, -44], [118, -40], [128, -8], [90, 18], [8, 22]]), C.red, 2.4);
  c.strokeStyle = C.gold; c.lineWidth = 3; c.beginPath(); c.moveTo(60, -42); c.quadraticCurveTo(70, -10, 52, 18); c.stroke();
  // 远侧手臂（托琵琶颈）
  F(c, K.ribbon([[100, -36], [150, -50], [196, -64]], q => 15 - q * 5), C.skin, 2, '#8a3a24');
  // 琵琶：梨形腹在胸前下方，颈朝右上
  c.save(); c.translate(150, 6); c.rotate(-1.05);
  F(c, DH.sm([[0, 34], [34, 0], [30, -50], [0, -70], [-30, -50], [-34, 0]]), C.ochre2, 2.4); F(c, DH.ell(0, -8, 9, 9), C.brown, 1.4);
  c.strokeStyle = C.line; c.lineWidth = 1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 4, -64); c.lineTo(k * 4, 24); c.stroke(); }
  F(c, new Path2D('M-6 -70 L6 -70 L4 -150 L-4 -150 Z'), C.brown, 1.6); F(c, new Path2D('M-10 -150 L10 -150 L4 -172 L-12 -166 Z'), C.brown, 1.4); c.restore();
  // 近侧手臂（拨弦）
  F(c, K.ribbon([[90, -10], [120, 26], [160, 30]], q => 16 - q * 5), C.skin, 2, '#8a3a24');
  // 头：头光＋背面高髻（脸朝画里，看不见）
  c.strokeStyle = C.gold; c.lineWidth = 3; c.beginPath(); c.arc(150, -76, 46, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(106,176,142,.22)'; c.fill();
  F(c, DH.sm([[126, -54], [140, -46], [152, -50], [148, -40], [130, -38]]), C.skin, 1.6, '#8a3a24');   // 后颈
  F(c, DH.ell(146, -76, 25, 26), C.ink, 2); F(c, DH.ell(152, -108, 17, 14, 0.4), C.ink, 1.6); F(c, DH.ell(166, -122, 11, 10), C.ink, 1.6);
  c.fillStyle = C.gold; c.save(); c.translate(146, -96); c.rotate(-0.4); c.fillRect(-16, -2, 34, 4); c.restore();
  [[128, -100, C.red], [172, -106, C.white], [134, -118, C.green2]].forEach(([fx, fy, fc]) => { for (let j = 0; j < 5; j++) { c.fillStyle = fc; c.beginPath(); c.arc(fx + Math.cos(j * 1.26) * 5, fy + Math.sin(j * 1.26) * 5, 4, 0, Math.PI * 2); c.fill(); } });
  c.restore();
}
const ftX = r => lerp(380, 1180, E.inOut3(clamp((r + 0.3) / 9.6))), ftY = (r, t) => 610 + Math.sin(r * 0.9) * 40;
DHW.add({ id: 'tang', label: ['开元盛世', '七一三年'], wall: 'red', focus: [0, 0], zoom: 1.3,
  get focusDyn() { return null; },
  keep: [[0, 260, 1920, 860]],
  silk: (r, t) => { const x = ftX(r), y = ftY(r, t), s = 1.7; const sx = x + 60 * s, sy = y - 30 * s;
    // 丝带从左上来，搭上飞天肩头，绕过头顶一个大弧，再甩到身后、向右上飞出
    const pts = [[0, SY], [x * 0.4, 280], [x - 380, y - 150], [x - 80, y - 40], [sx, sy], [x + 300, y - 200], [x + 250, y - 340], [x + 40, y - 330], [x - 100, y - 260], [x - 200, y - 330]];
    const tail = [[x - 120, y - 420], [x + 300, y - 400], [Math.max(x + 560, 1560), 280], [1920, SY]]; return flow(pts.concat(tail), t, 14, 0.025, 3.6); },
  draw(c, r, t) {
    // 长安：塔与城门（远景）
    F(c, new Path2D('M60 980 L60 820 L400 820 L400 980 Z'), '#c99a62', 2.4); F(c, new Path2D('M30 820 L230 760 L430 820 Z'), C.greenDk, 2.4); F(c, new Path2D('M190 980 L190 900 Q230 860 270 900 L270 980 Z'), '#3a1a10', 2);
    for (let k = 0; k < 7; k++) { const w = 150 - k * 16, y = 980 - k * 80; F(c, new Path2D(`M${1640 - w / 2} ${y} L${1640 + w / 2} ${y} L${1640 + w / 2 - 8} ${y - 60} L${1640 - w / 2 + 8} ${y - 60} Z`), '#d8b88a', 2.2); F(c, new Path2D(`M${1640 - w / 2 - 24} ${y - 60} L${1640 + w / 2 + 24} ${y - 60} L${1640} ${y - 84} Z`), C.redDk, 2); }
    // 云
    [[400, 300, 1.6, 0], [900, 220, 1.3, 1], [1400, 340, 1.8, 2], [700, 760, 1.4, 3], [1250, 700, 1.2, 4]].forEach(([x, y, s, k]) => DH.cloud(c, ((x - t * (26 + k * 6)) % 2100 + 2100) % 2100 - 90, y + Math.sin(t + k) * 6, s, t, t * 2 + k));
  },
  front(c, r, t) { feitian(c, ftX(r), ftY(r, t), 1.7, t);
    if (r > 2 * BAR) DH.petals(c, t, { n: 40, seed: 99, x0: 200, x1: 1800, y0: 130, y1: 980, speed: 120, scale: 2.2 }); } });
// 快推焦点跟飞天
DHW.segs[DHW.segs.length - 1].focus = [ftX(2 * BAR) + 60, ftY(2 * BAR) - 60];

// ================= 毕昇活字 =================
const TXT = '庆历中有布衣毕昇又为活板其法用胶泥刻字薄如钱唇每';
const slot = i => [300 + (5 - (i / 4 | 0)) * 96, 380 + (i % 4) * 96];   // 竖排：右起第一列从上往下
DHW.add({ id: 'huozi', label: ['毕昇活字', '一〇四〇年'], wall: 'ochre', focus: [540, 520], zoom: 1.24,
  keep: [[240, 300, 900, 840], [1100, 260, 1820, 900]],
  silk: (r, t) => { const pr = r > 2 * BAR ? 1 : 0; return flow([[0, SY], [140, 300], [240, 330 - 0], [560, 336], [880, 330], [1050, 300], [1400, 250], [1920, SY]], t, pr ? 2 : 8); },
  draw(c, r, t) {
    // 字架（右）：一格格泥字
    F(c, new Path2D('M1120 280 L1800 280 L1800 900 L1120 900 Z'), C.red, 3);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) { const x = 1140 + i * 110, y = 300 + j * 86; F(c, new Path2D(`M${x} ${y} L${x + 96} ${y} L${x + 96} ${y + 74} L${x} ${y + 74} Z`), C.redDk, 1.6);
      for (let m = 0; m < 3; m++) F(c, new Path2D(`M${x + 6 + m * 30} ${y + 30} l26 0 l0 36 l-26 0 Z`), '#c99a62', 1.2); }
    // 烛
    F(c, new Path2D('M980 900 L1020 900 L1020 760 L980 760 Z'), C.white, 2); const fl = 1 + Math.sin(t * 17) * 0.12; F(c, new Path2D(`M990 760 Q1000 ${740 - 30 * fl} 1000 ${724 - 30 * fl} Q1010 ${740 - 20 * fl} 1010 760 Z`), '#f2a43a', 1.8);
    // 铁范
    F(c, new Path2D('M270 350 L880 350 L880 790 L270 790 Z'), '#4a3a30', 3); F(c, new Path2D('M290 370 L860 370 L860 770 L290 770 Z'), '#6a5a4a', 2);
    // 泥字一个个跳进字盘
    const N = 24, fill = r < 2 * BAR ? (r / (2 * BAR - 0.4)) * N : N;
    for (let i = 0; i < N; i++) { const q = clamp(fill - i); if (q <= 0) continue; const [x, y] = slot(i), src = [1180 + (i % 6) * 110, 330 + ((i * 3) % 7) * 86], e = E.out3(q), hop = Math.sin(q * Math.PI) * 160;
      const xx = lerp(src[0], x, e), yy = lerp(src[1], y, e) - hop, land = q >= 1 ? Math.max(0, 1 - (fill - i - 1) * 4) : 0;
      c.save(); c.translate(xx + 44, yy + 44); c.scale(1 + land * 0.08, 1 - land * 0.08); F(c, new Path2D('M-42 -42 L42 -42 L42 42 L-42 42 Z'), '#c99a62', 2);
      c.font = '56px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = C.redDk; c.scale(-1, 1); c.fillText(TXT[i], 0, 4); c.restore(); }
    // 第 3 小节：纸砸下去，压平，再揭起来露出印好的字
    if (r > 2 * BAR) { const q = r - 2 * BAR, down = E.out3(clamp(q / 0.17)), peel = E.inOut3(clamp((q - 1.6) / 1.2));
      c.save(); c.translate(575, 360); const h = 420 * (1 - peel * 0.9);
      c.fillStyle = 'rgba(42,26,20,.25)'; if (down > 0.9 && peel < 0.05) c.fillRect(-290, 0, 580, 420);
      c.translate(0, -120 * (1 - down)); c.scale(1 + 0.2 * (1 - down), 1 + 0.2 * (1 - down));
      F(c, new Path2D(`M-300 0 L300 0 L300 ${h} L-300 ${h} Z`), '#f4ecd8', 2.4);
      if (peel > 0) { c.save(); c.beginPath(); c.rect(-300, 0, 600, h); c.clip(); c.font = '56px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = C.ink;
        for (let i = 0; i < N; i++) { const [x, y] = slot(i); c.fillText(TXT[i], x + 44 - 575, y + 44 - 360 + 10); } c.restore(); }
      if (peel > 0) F(c, new Path2D(`M-300 ${h} L300 ${h} L300 ${h + 40 * peel} Q0 ${h + 90 * peel} -300 ${h + 40 * peel} Z`), '#e6dcc0', 2);
      c.restore(); }
  } });

// ================= 郑和下西洋 =================
const wave = (c, y, t, col, ph, sp) => { c.fillStyle = col; c.beginPath(); c.moveTo(-20, 1000); for (let x = -20; x <= 1940; x += 8) c.lineTo(x, y + Math.sin((x + t * sp) * 0.012 + ph) * 16); c.lineTo(1940, 1000); c.closePath(); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.2; c.stroke();
  c.strokeStyle = C.white; c.lineWidth = 3; for (let x = ((-t * sp) % 160 + 160) % 160 - 160; x < 1940; x += 160) { const yy = y + Math.sin((x + t * sp) * 0.012 + ph) * 16; c.beginPath(); c.arc(x + 20, yy + 4, 16, Math.PI * 1.1, Math.PI * 2.2); c.stroke(); c.beginPath(); c.arc(x + 24, yy + 6, 7, Math.PI * 1.2, Math.PI * 2.4); c.stroke(); } };
const shipY = (r, t) => 640 + Math.sin(t * 1.8) * 10, shipX = r => 760 + r * 18;
DHW.add({ id: 'zhenghe', label: ['郑和下西洋', '一四〇五年'], wall: 'pale', focus: [1220, 680], zoom: 1.28,
  keep: [[300, 220, 1500, 840]],
  silk: (r, t) => { const x = shipX(r), y = shipY(r, t); return flow([[0, SY], [x - 500, 220], [x - 30, y - 400], [x + 40, y - 430], [x + 300, y - 440], [x + 520, y - 400], [1920, SY]], t, 16, 0.03, 4.5); },
  draw(c, r, t) {
    [[300, 220, 1.3, 0], [1500, 260, 1.6, 1]].forEach(([x, y, s, k]) => DH.cloud(c, x - (t * 20) % 400, y, s, t, t + k));
    for (let k = 0; k < 5; k++) { const x = (1700 - t * 50 + k * 140) % 1900, y = 300 + k * 26 + Math.sin(t * 3 + k) * 8, f = Math.sin(t * 9 + k) * 10; c.strokeStyle = C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 16, y - f); c.quadraticCurveTo(x - 6, y - 4, x, y); c.quadraticCurveTo(x + 6, y - 4, x + 16, y - f); c.stroke(); }
    wave(c, 700, t, C.blue, 0, 60);
    // 宝船
    const x = shipX(r), y = shipY(r, t); c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.8 + 0.6) * 0.025);
    [[-300, 0.86], [-150, 1], [0, 1.08], [150, 1], [290, 0.8]].forEach(([mx, s], k) => { F(c, new Path2D(`M${mx - 5} 0 L${mx + 5} 0 L${mx + 4} ${-380 * s} L${mx - 4} ${-380 * s} Z`), C.brown, 1.8);
      const sp = new Path2D(`M${mx - 4} ${-360 * s} Q${mx + 80 * s} ${-370 * s} ${mx + 110 * s} ${-350 * s} L${mx + 120 * s} ${-60} Q${mx + 60 * s} ${-40} ${mx - 4} ${-50} Z`); F(c, sp, C.red, 2.4);
      c.save(); c.clip(sp); c.strokeStyle = C.redDk; c.lineWidth = 4; for (let j = 1; j < 8; j++) { const yy = -360 * s + j * (300 * s / 8); c.beginPath(); c.moveTo(mx - 4, yy); c.quadraticCurveTo(mx + 60 * s, yy + 14 + Math.sin(t * 3 + j + k) * 4, mx + 130 * s, yy + 6); c.stroke(); } c.restore(); });
    const hull = new Path2D('M-470 -40 L-420 -70 L-260 -40 L330 -40 L470 -110 L500 -100 L440 40 L-380 60 Z'); F(c, hull, '#8a4a2a', 3);
    c.save(); c.clip(hull); c.fillStyle = C.redDk; c.fillRect(-500, -10, 1000, 18); c.fillStyle = C.gold; for (let k = -380; k < 420; k += 70) { c.beginPath(); c.arc(k, 26, 9, 0, Math.PI * 2); c.fill(); } c.restore();
    F(c, new Path2D('M-470 -40 L-470 -150 L-300 -150 L-300 -40 Z'), C.red, 2.4); F(c, new Path2D('M-500 -150 L-270 -150 L-290 -180 L-480 -180 Z'), C.greenDk, 2);
    c.restore();
    // 船头浪花（快推时劈开）
    const sp = r > 2 * BAR ? 1.6 : 1; for (let k = 0; k < 12; k++) { const q = (t * 1.4 * sp + k / 12) % 1, a = -0.3 - q * 1.6 + (k % 3) * 0.2; c.fillStyle = C.white; c.beginPath(); c.arc(x + 450 + Math.cos(a) * q * 120 * sp, y + 20 + Math.sin(a) * q * 90 * sp + q * q * 120, 8 * (1 - q) + 2, 0, Math.PI * 2); c.fill(); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke(); }
  },
  front(c, r, t) { wave(c, 800, t, C.green, 2, 90); wave(c, 900, t, C.blue2, 4, 130); } });
})();
