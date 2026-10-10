// 序 → 张骞：前六段
(() => {
const { C, F } = DH, { clamp, lerp, ss } = U, BAR = DHW.BAR, K = KIT, E = DHW.ease;
const SY = DHW.SEAM_Y;
// 丝带路径小工具：控制点加密后叠一层沿法线的飘动
const flow = (ctrl, t, amp = 14, k = 0.02, sp = 3) => { const D = K.densify(ctrl, 10); return D.map((p, i) => { const a = D[Math.max(0, i - 1)], b = D[Math.min(D.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, e = Math.min(1, i / 12, (D.length - 1 - i) / 12); const o = Math.sin(i * k * 10 - t * sp) * amp * e; return [p[0] - dy / L * o, p[1] + dx / L * o]; }); };
DHW.flow = flow;

// ================= 序：桑叶、蚕、茧 =================
DHW.add({ id: 'xu', bars: 2, wall: 'pale', noSeam: true, focus: [1390, 470], punchAt: BAR, pullAt: 4.25, zoom: 1.3,
  keep: [[150, 200, 1200, 980], [1240, 300, 1560, 700]],
  silk: (r, t) => flow([[1395, 520], [1500, 470], [1650, 330], [1800, 280], [1920, SY]], t, 10),
  tip: r => r < BAR ? 0 : r < 4.7 ? 0.55 * E.out3((r - BAR) / (4.7 - BAR)) : 0.55 + 0.45 * E.inOut3(clamp((r - 4.7) / 0.6)),
  draw(c, r, t) {
    // 桑枝
    c.strokeStyle = C.brown; c.lineCap = 'round'; c.lineWidth = 20; c.beginPath(); c.moveTo(-20, 980); c.bezierCurveTo(300, 760, 900, 620, 1560, 330); c.stroke();
    c.lineWidth = 10; c.beginPath(); c.moveTo(1180, 470); c.quadraticCurveTo(1300, 420, 1390, 440); c.stroke();
    c.strokeStyle = C.line; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-20, 970); c.bezierCurveTo(300, 750, 900, 610, 1560, 322); c.stroke();
    // 桑叶（大）：被啃出一圈缺口
    const sw = Math.sin(t * 1.6) * 0.03;
    c.save(); c.translate(520, 720); c.rotate(-0.35 + sw);
    const leaf = DH.sm([[0, 0], [120, -170], [330, -300], [560, -330], [700, -250], [650, -110], [520, 20], [300, 90], [120, 60]]);
    // 叶缘上的一串缺口：沿叶尖往回啃（圆心在叶缘外侧一点）
    const EDGE = [[690, -262], [640, -318], [580, -334], [515, -332], [450, -322], [385, -308], [325, -292]];
    const bites = Math.min(EDGE.length - 1, Math.floor(clamp(r / 2.6) * (EDGE.length - 1))); const clip = new Path2D(); clip.rect(-200, -600, 1200, 1000);
    for (let i = 0; i < bites; i++) { const [ex, ey] = EDGE[i]; clip.moveTo(ex + 36, ey - 6); clip.arc(ex, ey - 6, 36, 0, Math.PI * 2); }
    const chew = r < 2.6 ? (Math.sin(r * 14) * 0.5 + 0.5) : 0, [bx, by0] = EDGE[bites], by = by0 - 6;
    clip.moveTo(bx + 14 + 22 * chew, by); clip.arc(bx, by, 14 + 22 * chew, 0, Math.PI * 2);
    c.save(); c.clip(clip, 'evenodd');
    F(c, leaf, C.green, 3); c.save(); c.clip(leaf); c.strokeStyle = C.greenDk; c.globalAlpha = 0.6; c.lineWidth = 40; c.stroke(leaf); c.restore();
    c.strokeStyle = C.green2; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(300, -120, 640, -230); c.stroke();
    c.lineWidth = 3; for (let i = 1; i < 6; i++) { const x = i * 110, y = -i * 40; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 90, x + 70, y - 150 + i * 6); c.stroke(); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 50, y + 50, x + 110, y + 70 - i * 10); c.stroke(); }
    c.restore();
    // 蚕：伏在缺口边，一口口啃
    c.save(); c.translate(bx - 10, by + 58); c.rotate(-0.15); c.scale(1.45, 1.45);
    for (let i = 7; i >= 0; i--) { const lift = i === 0 ? -chew * 10 : Math.sin(t * 6 - i * 0.7) * 2.5, rr = i === 0 ? 17 : 22 - Math.abs(i - 3) * 1.5; F(c, DH.ell(-i * 26, lift, rr * 0.9, rr), '#f1e6cf', 2.2); if (i === 2 || i === 5) { c.strokeStyle = 'rgba(90,36,20,.6)'; c.lineWidth = 2.5; c.beginPath(); c.arc(-i * 26, lift - 4, 7, 3.6, 5.8); c.stroke(); } }
    c.strokeStyle = '#7a5a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(14, -chew * 10 + 4); c.lineTo(20, -chew * 10 + 8); c.stroke();
    c.restore(); c.restore();
    // 茧：挂在小枝上，被抽丝时转
    c.save(); c.translate(1395, 470); const spin = r > BAR ? (r - BAR) * 5 : 0; c.rotate(Math.sin(spin) * 0.18 + (r > BAR ? 0.2 : 0));
    c.strokeStyle = C.white; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -30); c.lineTo(-6, -72); c.stroke();
    const co = DH.sm([[-60, -10], [-50, -38], [0, -48], [50, -38], [64, 0], [50, 36], [0, 46], [-50, 36]]); F(c, co, '#f4ead4', 2.6);
    c.save(); c.clip(co); c.strokeStyle = 'rgba(160,120,80,.45)'; c.lineWidth = 1.4; for (let i = -6; i < 8; i++) { const o = ((i * 14 + spin * 30) % 196 + 196) % 196 - 98; c.beginPath(); c.ellipse(o, 0, 14, 50, 0.3, 0, Math.PI * 2); c.stroke(); } c.restore();
    c.restore();
  } });

// ================= 仰韶彩陶 =================
const fish = (c, x, y, s, flip = 1) => { c.save(); c.translate(x, y); c.scale(s * flip, s); c.fillStyle = C.ink;
  c.beginPath(); c.moveTo(-60, 0); c.lineTo(-36, -18); c.lineTo(30, -16); c.lineTo(58, 0); c.lineTo(30, 16); c.lineTo(-36, 18); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-58, 0); c.lineTo(-90, -22); c.lineTo(-84, 0); c.lineTo(-90, 22); c.closePath(); c.fill();
  c.strokeStyle = '#c96a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-30, -10); c.lineTo(20, 10); c.moveTo(-30, 10); c.lineTo(20, -10); c.stroke();
  c.fillStyle = '#c96a3a'; c.beginPath(); c.arc(38, -4, 4, 0, Math.PI * 2); c.fill(); c.restore(); };
DHW.add({ id: 'yangshao', label: ['仰韶彩陶', '约前四千年'], wall: 'ochre', focus: [960, 600],
  keep: [[480, 330, 1440, 900]],
  silk: (r, t) => flow([[0, SY], [300, 300], [520, 470], [960, 540], [1400, 470], [1600, 330], [1920, SY]], t, 12),
  draw(c, r, t) {
    // 粟（小米）：两侧成丛摇
    [[150, 980], [260, 980], [1700, 980], [1820, 980], [1580, 980]].forEach(([x, y], k) => { const sw = Math.sin(t * 1.8 + k) * 18; c.strokeStyle = C.greenDk; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - 260, x + sw + 40, y - 420); c.stroke();
      for (let j = 0; j < 9; j++) { const q = j / 9; F(c, DH.ell(x + sw * q + 40 * q * q + 10 + q * 30, y - 420 + 20 + q * 120, 12, 7, 0.9), C.gold, 1.6); } });
    // 陶轮
    const rot = t * 1.1;
    F(c, DH.ell(960, 880, 330, 52), C.brown, 2.6); F(c, DH.ell(960, 866, 330, 52), '#a8683e', 2.6);
    c.strokeStyle = C.line; c.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = rot + k * Math.PI / 4; c.beginPath(); c.moveTo(960 + Math.cos(a) * 60, 866 + Math.sin(a) * 9); c.lineTo(960 + Math.cos(a) * 320, 866 + Math.sin(a) * 50); c.stroke(); }
    // 彩陶盆：敞口、鼓腹
    const body = DH.sm([[600, 470], [1320, 470], [1300, 620], [1200, 790], [960, 850], [720, 790], [620, 620]]);
    F(c, body, '#c96a3a', 3);
    c.save(); c.clip(body);
    c.fillStyle = '#a8502a'; c.fillRect(560, 740, 800, 140);
    c.fillStyle = C.ink; c.fillRect(560, 486, 800, 22);
    // 鱼纹：随陶轮转，绕着盆身游（前半圈可见，按 cos 压缩）
    for (let k = 0; k < 5; k++) { const a = rot + k * Math.PI * 2 / 5, cz = Math.cos(a); if (cz < 0.05) continue; const leap = (k === 0 && r > 2 * BAR) ? 1 : 0; if (leap) continue;
      fish(c, 960 + Math.sin(a) * 330, 620, 1.1 * (0.4 + 0.6 * cz), 1); }
    c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(560, 700); c.lineTo(1360, 700); c.stroke();
    c.restore(); c.strokeStyle = C.line; c.lineWidth = 3; c.stroke(body);
    F(c, DH.ell(960, 470, 362, 40), '#d07a48', 3); F(c, DH.ell(960, 474, 330, 30), '#7a3020', 2);
    // 窑烟
    for (let i = 0; i < 4; i++) { const q = ((t * 0.25 + i / 4) % 1); DH.cloud(c, 1620 + q * 60, 520 - q * 320, 0.6 + q * 0.6, t, t + i, C.white); }
  },
  front(c, r, t) {
    // 快推时一条鱼跃出纹样：抛物线飞到丝带上，再沿丝带游
    const r0 = 2 * BAR + 0.15; if (r < r0) return;
    const q = clamp((r - r0) / 0.9), x = lerp(1030, 1420, q), y = lerp(620, 420, q) - Math.sin(q * Math.PI) * 260;
    const sw = q >= 1 ? Math.sin((r - r0) * 7) * 6 : 0, xx = q >= 1 ? 1420 + (r - r0 - 0.9) * 90 : x, yy = q >= 1 ? 420 - (r - r0 - 0.9) * 40 + sw : y;
    c.save(); c.translate(xx, yy); c.rotate(q < 1 ? Math.atan2(-Math.cos(q * Math.PI) * 260 * Math.PI - 200, 390) * 0.6 : -0.3 + sw * 0.02); fish(c, 0, 0, 1.2); c.restore();
    if (q < 1) { c.fillStyle = C.white; for (let k = 0; k < 8; k++) { const a = k * 0.8, d = q * 90; c.beginPath(); c.arc(1030 + Math.cos(a) * d, 600 + Math.sin(a) * d * 0.5 - q * 40, 5 * (1 - q), 0, Math.PI * 2); c.fill(); } }
  } });

// ================= 殷商：龟甲、火、青铜鼎 =================
const glyphs = { 王: [[[-20, -26], [20, -26]], [[-14, 0], [14, 0]], [[-24, 28], [24, 28]], [[0, -26], [0, 28]]], 贞: [[[-18, -24], [18, -24], [18, 18], [-18, 18], [-18, -24]], [[0, -24], [0, 18]], [[-12, 18], [-20, 34]], [[12, 18], [20, 34]]],
  雨: [[[-26, -28], [26, -28]], [[-22, -14], [22, -14]], [[0, -28], [0, -14]], [[-22, -14], [-22, 30]], [[22, -14], [22, 30]], [[-10, 0], [-10, 6]], [[-10, 14], [-10, 20]], [[10, 0], [10, 6]], [[10, 14], [10, 20]]], 卜: [[[0, -30], [0, 30]], [[0, -4], [18, -18]]] };
const glyph = (c, ch, x, y, s, p) => { const st = glyphs[ch]; c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#5a2414'; c.lineWidth = 5; c.lineCap = 'round'; const n = Math.ceil(st.length * p);
  st.slice(0, n).forEach(l => { c.beginPath(); l.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }); c.restore(); };
const crackLines = (() => { const r = U.rng(31), L = []; const grow = (x, y, a, len, d) => { const pts = [[x, y]]; for (let i = 0; i < len; i++) { a += (r() - .5) * 0.7; x += Math.cos(a) * 14; y += Math.sin(a) * 14; pts.push([x, y]); if (d < 3 && r() < 0.12) grow(x, y, a + (r() < .5 ? 1 : -1) * (0.6 + r() * 0.6), len * 0.5 | 0, d + 1); } L.push({ pts, d }); }; grow(0, -10, -Math.PI / 2, 12, 0); grow(0, -10, Math.PI / 2, 12, 0); grow(0, -10, 0.3, 10, 1); grow(0, -10, Math.PI + 0.3, 9, 1); return L; })();
DHW.add({ id: 'shang', label: ['殷商甲骨', '前一三〇〇年'], wall: 'red', focus: [640, 560], zoom: 1.28,
  keep: [[320, 260, 960, 960], [1100, 300, 1760, 960]],
  silk: (r, t) => flow([[0, SY], [500, 230], [1000, 260], [1240, 380], [1330, 470], [1420, 380], [1600, 300], [1920, SY]], t, 10),
  draw(c, r, t) {
    // 火盆＋火
    F(c, new Path2D('M420 860 L860 860 L820 950 L460 950 Z'), C.brown, 2.6); for (let k = 0; k < 7; k++) F(c, DH.ell(480 + k * 54, 856, 30, 12), '#4a2414', 1.6);
    for (let k = 0; k < 6; k++) { const x = 470 + k * 66, h = 120 + Math.sin(t * 11 + k * 2) * 26 + Math.sin(t * 17 + k) * 12, sw = Math.sin(t * 7 + k) * 10;
      F(c, new Path2D(`M${x - 26} 860 Q${x - 30 + sw} ${860 - h * 0.6} ${x + sw} ${860 - h} Q${x + 20 + sw * 0.5} ${860 - h * 0.5} ${x + 26} 860 Z`), k % 2 ? C.ochre2 : '#e0603a', 2); }
    // 龟甲（腹甲，倒置在火上）
    const sh = DH.sm([[640, 300], [760, 330], [800, 450], [790, 600], [740, 700], [640, 730], [540, 700], [490, 600], [480, 450], [520, 330]]);
    F(c, sh, '#e6cf9c', 3); c.save(); c.clip(sh); c.strokeStyle = 'rgba(122,70,40,.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(640, 290); c.lineTo(640, 740); for (const y of [400, 500, 620]) { c.moveTo(470, y); c.quadraticCurveTo(640, y + 20, 810, y); } c.stroke();
    // 烧灼点＋裂纹（快推时炸开）
    const g1 = clamp(r / 4), g2 = r > 2 * BAR ? E.out3(clamp((r - 2 * BAR) / 0.5)) : 0;
    [[590, 450], [690, 560]].forEach(([x, y], j) => { c.fillStyle = 'rgba(60,25,10,.75)'; c.beginPath(); c.arc(x, y, 10 + 8 * g1, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(x, y); c.strokeStyle = '#3a160a'; crackLines.forEach(L => { const m = Math.ceil(L.pts.length * clamp(g1 * 0.25 + g2 * (1.1 - L.d * 0.1))); if (m < 2) return; c.lineWidth = 3.4 - L.d * 0.8; c.beginPath(); L.pts.slice(0, m).forEach((q, i) => i ? c.lineTo(q[0] * (j ? -1 : 1), q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }); c.restore(); });
    // 甲骨文：裂纹旁刻字
    const gp = clamp((r - 6.4) / 2.2);
    if (gp > 0) [['贞', 540, 360], ['王', 540, 600], ['雨', 750, 420], ['卜', 750, 650]].forEach(([ch, x, y], i) => glyph(c, ch, x, y, 1.05, clamp(gp * 4 - i)));
    c.restore(); c.strokeStyle = C.line; c.lineWidth = 3; c.stroke(sh);
    if (g2 > 0 && g2 < 1) { c.fillStyle = C.gold; for (let k = 0; k < 14; k++) { const a = k * 0.45 + 0.2, d = 40 + g2 * 200; c.beginPath(); c.arc(640 + Math.cos(a) * d, 520 + Math.sin(a) * d, 6 * (1 - g2), 0, Math.PI * 2); c.fill(); } }
    // 烟
    for (let i = 0; i < 3; i++) { const q = (t * 0.3 + i / 3) % 1; DH.cloud(c, 660 + Math.sin(q * 6 + i) * 30, 280 - q * 150, 0.5 + q * 0.5, t, t + i, 'rgba(236,223,196,.85)'); }
    // 青铜鼎
    const dg = '#4f8a72', dg2 = '#2f6a54';
    F(c, new Path2D('M1150 560 L1710 560 L1690 760 Q1430 840 1170 760 Z'), dg, 3);
    c.save(); c.clip(new Path2D('M1150 560 L1710 560 L1690 760 Q1430 840 1170 760 Z')); c.fillStyle = dg2; c.fillRect(1140, 590, 600, 70);
    c.strokeStyle = '#a8d0b0'; c.lineWidth = 3; for (let x = 1165; x < 1700; x += 46) { c.beginPath(); let a = 0, R = 18; c.moveTo(x + R, 625); for (let k = 0; k < 4; k++) { R -= 4; c.lineTo(x + (k % 2 ? R : -R), 625 + (k % 4 < 2 ? -R : R)); } c.stroke(); }
    c.restore();
    F(c, new Path2D('M1130 540 L1730 540 L1730 572 L1130 572 Z'), dg, 3);
    [[1240, 1290], [1570, 1620]].forEach(([a, b]) => { F(c, new Path2D(`M${a} 540 L${a} 440 L${b} 440 L${b} 540 L${b - 16} 540 L${b - 16} 456 L${a + 16} 456 L${a + 16} 540 Z`), dg, 2.6); });
    [[1230, 1180], [1630, 1680], [1430, 1430]].forEach(([x, fx], k) => { F(c, new Path2D(`M${x - 26} 780 L${x + 26} 780 L${fx + 16} 940 L${fx - 16} 940 Z`), k === 2 ? dg2 : dg, 2.6); });
  },
  front(c, r, t) { // 鼎耳前半根压住丝带
    c.save(); c.beginPath(); c.rect(1240, 440, 70, 140); c.clip(); F(c, new Path2D('M1240 540 L1240 440 L1256 440 L1256 540 Z'), '#4f8a72', 2.6); c.restore(); } });

// ================= 孔子：竹简、编钟 =================
const TEXT = '学而时习之不亦说乎有朋自远方来不亦乐乎';
DHW.add({ id: 'kongzi', label: ['孔子讲学', '前五〇〇年'], wall: 'ochre', focus: [1380, 430], zoom: 1.26,
  keep: [[300, 520, 1180, 940], [960, 180, 1840, 640]],
  silk: (r, t) => { const hit = r > 2 * BAR - 0.25 ? clamp((r - (2 * BAR - 0.25)) / 0.25) : 0, back = clamp((r - 2 * BAR) / 0.6);
    return flow([[0, SY], [220, 560], [700, 640], [1120, 600], [1240, 520], [1300 - 40 * hit + 40 * back, 470 - 10 * hit], [1500, 360], [1920, SY]], t, 8); },
  tip: r => { const d = DHW.tipDefault(r); return r > 0 && r < 2 * BAR + 0.3 ? Math.min(d, 0.62 + 0.08 * clamp((r - 2 * BAR + 0.6) / 0.6)) : d; },
  draw(c, r, t) {
    // 编钟架
    F(c, new Path2D('M980 210 L1830 210 L1830 240 L980 240 Z'), C.red, 2.6); F(c, new Path2D('M1000 240 L1030 240 L1030 640 L1000 640 Z'), C.red, 2.6); F(c, new Path2D('M1780 240 L1810 240 L1810 640 L1780 640 Z'), C.red, 2.6);
    F(c, new Path2D('M970 640 L1060 640 L1060 668 L970 668 Z'), C.redDk, 2); F(c, new Path2D('M1750 640 L1840 640 L1840 668 L1750 668 Z'), C.redDk, 2);
    const hitT = 2 * BAR;
    for (let k = 0; k < 6; k++) { const x = 1110 + k * 120, s = 1.25 - k * 0.09, sw = k === 2 && r > hitT ? Math.sin((r - hitT) * 9) * 0.22 * Math.exp(-(r - hitT) * 0.9) : Math.sin(t * 1.3 + k) * 0.015;
      c.save(); c.translate(x, 240); c.rotate(sw); c.strokeStyle = C.line; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 40); c.stroke(); c.translate(0, 40); c.scale(s, s);
      const bell = new Path2D('M-18 0 L18 0 L40 150 Q0 132 -40 150 Z'); F(c, bell, '#5a9a7a', 2.6);
      c.save(); c.clip(bell); c.fillStyle = '#3f7a60'; c.fillRect(-50, 40, 100, 26); c.fillStyle = C.gold; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(-20 + i * 20, 80 + j * 22, 4, 0, Math.PI * 2); c.fill(); } c.restore(); c.restore();
      if (k === 2 && r > hitT && r < hitT + 2.5) { const q = (r - hitT) / 2.5; c.strokeStyle = `rgba(236,223,196,${1 - q})`; c.lineWidth = 4; for (let j = 0; j < 3; j++) { const R = 60 + (q * 3 - j * 0.4) * 90; if (R < 60) continue; c.beginPath(); c.arc(x, 360, R, -0.6, 0.6); c.stroke(); c.beginPath(); c.arc(x, 360, R, Math.PI - 0.6, Math.PI + 0.6); c.stroke(); } }
    }
    // 竹简：从右往左摊开
    const open = E.out3(clamp(r / 3.2)), n = 15, sw = 46;
    for (let i = 0; i < n; i++) { const shown = clamp(open * n - (n - 1 - i)); if (shown <= 0) continue; const x = 1120 - (n - i) * sw * shown - 20, y = 540 + Math.sin(i * 0.4) * 4;
      F(c, new Path2D(`M${x} ${y} L${x + sw - 6} ${y} L${x + sw - 6} ${y + 380} L${x} ${y + 380} Z`), i % 2 ? '#d8b878' : '#cfae6c', 2);
      c.font = '30px "LXGWWenKai-500"'; c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'top'; const ch = TEXT[(n - 1 - i) * 1 % TEXT.length]; for (let j = 0; j < 1; j++) c.fillText(TEXT[(n - 1 - i)] || '', x + sw / 2 - 3, y + 30);
      c.strokeStyle = 'rgba(90,36,20,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 8, y + 70); c.lineTo(x + 8, y + 360); c.stroke(); }
    // 卷着的那头
    F(c, DH.ell(1120, 730, 34, 200), '#cfae6c', 2.6); c.strokeStyle = 'rgba(90,36,20,.5)'; for (let j = 0; j < 3; j++) { c.beginPath(); c.ellipse(1120, 730, 26 - j * 8, 190 - j * 30, 0, 0, Math.PI * 2); c.stroke(); }
  } });

// ================= 秦长城 =================
const ridge = x => 560 - Math.sin(x * 0.004 + 0.6) * 120 - Math.sin(x * 0.011) * 40;
DHW.add({ id: 'changcheng', label: ['秦筑长城', '前二一四年'], wall: 'pale', focus: [1330, 400], zoom: 1.3,
  keep: [[0, 260, 1920, 760]],
  silk: (r, t) => { const pts = [[0, SY]]; for (let x = 160; x <= 1760; x += 160) pts.push([x, ridge(x) - 120 - Math.sin(x * 0.01 + 1) * 30]); pts.push([1920, SY]); return flow(pts, t, 10); },
  draw(c, r, t) {
    DH.hills(c, [[100, 760, 520, 420], [560, 760, 480, 520], [1000, 770, 560, 440], [1480, 760, 520, 520], [1880, 770, 500, 430]], { seed: 21, edge: 30 });
    DH.hills(c, [[300, 960, 420, 220], [900, 960, 400, 200], [1500, 970, 460, 230]], { col: C.green2, dk: C.green, seed: 22, edge: 20 });
    // 长城：沿山脊往右垒
    const built = 40 + E.out3(clamp(r / 4.5)) * 1880;
    const top = [], bot = []; for (let x = 0; x <= built; x += 10) { top.push([x, ridge(x) - 40]); bot.push([x, ridge(x) + 30]); }
    if (top.length > 1) { const p = new Path2D(); top.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); for (let i = bot.length - 1; i >= 0; i--) p.lineTo(bot[i][0], bot[i][1]); p.closePath(); F(c, p, '#d8b88a', 2.6);
      c.save(); c.clip(p); c.strokeStyle = 'rgba(122,46,30,.45)'; c.lineWidth = 2; for (let j = 0; j < 6; j++) { c.beginPath(); for (let x = 0; x <= built; x += 10) { const y = ridge(x) - 34 + j * 11 + Math.sin(x * 0.05 + j) * 1.5; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore(); }
    // 正在夯的那一版：夯杵上下
    if (r < 4.5) { const bx = built, q = Math.abs(Math.sin(r * 9)); F(c, new Path2D(`M${bx - 30} ${ridge(bx) - 44} l40 0 l0 14 l-40 0 Z`), '#c99a62', 2); F(c, new Path2D(`M${bx - 14} ${ridge(bx) - 60 - q * 50} l8 0 l0 -60 l-8 0 Z`), C.brown, 1.6); F(c, new Path2D(`M${bx - 20} ${ridge(bx) - 60 - q * 50} l20 0 l0 14 l-20 0 Z`), C.brown, 1.6); }
    // 烽火台
    [[420, 0], [1330, 1]].forEach(([x, k]) => { if (built < x) return; const y = ridge(x); F(c, new Path2D(`M${x - 50} ${y - 40} L${x + 50} ${y - 40} L${x + 40} ${y - 170} L${x - 40} ${y - 170} Z`), '#cfa878', 2.6);
      for (let j = 0; j < 4; j++) F(c, new Path2D(`M${x - 44 + j * 26} ${y - 170} l16 0 l0 -20 l-16 0 Z`), '#cfa878', 2);
      F(c, new Path2D(`M${x - 12} ${y - 40} l24 0 l0 -40 q-12 -14 -24 0 Z`), C.ink, 0);
      // 快推：烽火点燃，狼烟升起
      if (k === 1 && r > 2 * BAR) { const q = r - 2 * BAR; const fh = Math.min(1, q / 0.3) * (60 + Math.sin(t * 15) * 10);
        F(c, new Path2D(`M${x - 24} ${y - 190} Q${x - 20} ${y - 190 - fh * 0.6} ${x} ${y - 190 - fh} Q${x + 24} ${y - 190 - fh * 0.5} ${x + 24} ${y - 190} Z`), '#e0603a', 2);
        for (let i = 0; i < 7; i++) { const qq = q * 0.6 - i * 0.18; if (qq < 0) continue; const yy = y - 260 - qq * 260, xx = x + Math.sin(qq * 4 + i) * 30 + qq * 60; DH.cloud(c, xx, yy, 0.7 + qq * 0.5, t, t + i, i % 2 ? C.white : '#e6d6b2'); } } });
  } });

// ================= 张骞通西域 =================
DHW.add({ id: 'silkroad', label: ['张骞西行', '前一三八年'], wall: 'ochre', focus: [400, 640], zoom: 1.32,
  keep: [[200, 560, 1770, 980]],
  silk: (r, t) => flow([[0, SY], [300, 420], [560, 560], [700, 620], [860, 560], [1130, 520], [1270, 610], [1400, 520], [1640, 360], [1920, SY]], t, 8),
  draw(c, r, t) { c.save(); c.translate(1920, 40); c.scale(-1, 1); DH.han(c, t, { pan: -r * 25 }); c.restore(); } });
})();
