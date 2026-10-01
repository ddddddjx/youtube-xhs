// 偏头痛 60 秒科普 —— 逐帧确定性渲染：window.render(t)
const W = 1080, H = 1920;
const T = window.TIMING, LN = T.lines, TOTAL = T.total;
const cv = document.getElementById('c'), g = cv.getContext('2d');

// ---------- utils ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - t, 3);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eob = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const at = (i, sub, after = false) => { const l = LN[i]; const k = l.text.indexOf(sub); if (k < 0) throw new Error('missing ' + sub); return l.start + (l.end - l.start) * ((k + (after ? sub.length : 0)) / l.text.length); };
const pop = (t, t0, d = .45) => eob(P(t, t0, t0 + d));
const fade = (t, t0, d = .4) => eo(P(t, t0, t0 + d));

const C = { bg: '#050816', cyan: '#46e3ff', pink: '#ff3d7f', red: '#ff4747', amber: '#ffb000', yellow: '#ffd84a', violet: '#9b8cff', white: '#f4f7ff', dim: 'rgba(220,230,255,0.6)' };
const F = (s, w = 700) => `${w} ${s}px "Noto Sans SC", sans-serif`;

// ---------- scenes & timing ----------
const ORDER = ['hook', 'title', 'trigger', 'aura', 'nerve', 'cgrp', 'amp', 'end'];
const SC = {};
ORDER.forEach((n, k) => { const i = LN.findIndex(l => l.scene === n); SC[n] = { start: k ? LN[i].start - 0.3 : 0 }; });
ORDER.forEach((n, k) => SC[n].end = k < ORDER.length - 1 ? SC[ORDER[k + 1]].start : TOTAL);
const CHAPTER = { hook: '它长什么样', title: '总览', trigger: '① 触发', aura: '② 先兆', nerve: '③ 神经报警', cgrp: '④ 发炎', amp: '⑤ 放大', end: '怎么办' };

const HOOK_BEATS = []; for (let b = 0.45; b < SC.title.start - 0.2; b += 0.8) HOOK_BEATS.push(b);
const T_HAMMER = at(6, '于是');
const CGRP_BEATS = []; for (let b = T_HAMMER + 0.25; b < SC.cgrp.end - 0.15; b += 0.72) CGRP_BEATS.push(b);
const T_CROSS = at(3, '推过') + 0.35;
const T_CARD = at(8, '偏头痛') - 0.25;
const T_BLOCK = at(8, '专门阻断') - 0.4;
const pulseOf = (t, beats, k = 5) => { let s = 0; for (const b of beats) if (t >= b) s += Math.exp(-(t - b) * k); return Math.min(s, 1.2); };

// ---------- drawing helpers ----------
function txt(c, s, x, y, o = {}) {
  c.save(); c.font = F(o.size || 48, o.w || 700); c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  c.globalAlpha *= (o.a ?? 1);
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 30; }
  c.fillStyle = o.color || C.white; c.fillText(s, x, y); c.restore();
}
function rich(c, parts, x, y, o = {}) {
  c.save(); c.font = F(o.size || 76, o.w || 900); c.textBaseline = 'middle'; c.textAlign = 'left';
  const ws = parts.map(p => c.measureText(p[0]).width); const tw = ws.reduce((a, b) => a + b, 0);
  let xx = x - tw / 2; c.globalAlpha *= (o.a ?? 1);
  parts.forEach((p, k) => {
    const col = p[1] || C.white; c.fillStyle = col;
    c.shadowColor = col === C.white ? 'rgba(120,160,255,0.35)' : col; c.shadowBlur = col === C.white ? 12 : 28;
    c.fillText(p[0], xx, y); xx += ws[k];
  });
  c.restore();
}
// 顶部大标题：入场上浮 + 退场
function headline(c, t, t0, t1, parts, o = {}) {
  const a = fade(t, t0, .45) * (t1 ? 1 - P(t, t1 - .3, t1) : 1); if (a <= 0) return;
  rich(c, parts, 540, (o.y || 300) + (1 - fade(t, t0, .45)) * 30, { size: o.size || 78, a });
}
function chip(c, s, x, y, o = {}) {
  const a = o.a ?? 1; if (a <= 0.001) return;
  c.save(); const size = o.size || 38; c.font = F(size, o.w || 700);
  const w = c.measureText(s).width + size * 1.3, h = size * 1.75;
  c.translate(x, y); const sc = o.scale ?? 1; c.scale(sc, sc); c.globalAlpha *= a;
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h / 2); c.fillStyle = o.bg || 'rgba(10,16,40,0.85)'; c.fill();
  const col = o.color || C.cyan; c.lineWidth = 3; c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 18; c.stroke(); c.shadowBlur = 0;
  c.fillStyle = o.tc || C.white; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 2); c.restore();
}
function glowLine(c, pts, col, lw, frac = 1, blur = 24) {
  if (frac <= 0) return;
  const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let left = tot * frac; c.save(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const d = seg[i - 1]; const f = Math.min(1, left / d);
    c.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= d;
  }
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = blur; c.stroke(); c.restore();
}
function along(pts, f) { // 折线上按长度取点
  const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let L = clamp(f) * tot; for (let i = 1; i < pts.length; i++) { if (L <= seg[i - 1]) { const k = L / seg[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } L -= seg[i - 1]; }
  return pts[pts.length - 1];
}
function dot(c, x, y, r, col, a = 1, blur = 20) { c.save(); c.globalAlpha *= a; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = blur; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore(); }
function ring(c, x, y, r, col, lw, a) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = 20; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); c.restore(); }

// ---------- icons ----------
function iconStyle(c, x, y, r, col, a) { c.save(); c.translate(x, y); c.globalAlpha *= a; c.strokeStyle = col; c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 22; c.lineWidth = r * 0.12; c.lineCap = 'round'; c.lineJoin = 'round'; }
function sun(c, x, y, r, col, a = 1, spin = 0) {
  if (a <= 0) return; iconStyle(c, x, y, r, col, a); c.beginPath(); c.arc(0, 0, r * 0.38, 0, 6.283); c.fill();
  for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4 + spin; c.beginPath(); c.moveTo(Math.cos(an) * r * 0.6, Math.sin(an) * r * 0.6); c.lineTo(Math.cos(an) * r * 0.95, Math.sin(an) * r * 0.95); c.stroke(); }
  c.restore();
}
function speaker(c, x, y, r, col, a = 1, wave = 1) {
  if (a <= 0) return; iconStyle(c, x, y, r, col, a);
  c.beginPath(); c.moveTo(-r * .8, -r * .25); c.lineTo(-r * .45, -r * .25); c.lineTo(-r * .05, -r * .62); c.lineTo(-r * .05, r * .62); c.lineTo(-r * .45, r * .25); c.lineTo(-r * .8, r * .25); c.closePath(); c.fill();
  for (let k = 0; k < 3; k++) { c.globalAlpha = a * clamp(wave * 3 - k); c.beginPath(); c.arc(0, 0, r * (.35 + k * .27), -.75, .75); c.stroke(); }
  c.restore();
}
function nausea(c, x, y, r, col, a = 1, spin = 0) {
  if (a <= 0) return; iconStyle(c, x, y, r, col, a); c.rotate(spin); c.beginPath();
  for (let th = 0; th < Math.PI * 4.2; th += 0.1) { const rr = r * 0.075 * th; const px = Math.cos(th) * rr, py = Math.sin(th) * rr; th ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke(); c.restore();
}
function comb(c, x, y, r, col, a = 1) {
  if (a <= 0) return; iconStyle(c, x, y, r, col, a);
  c.beginPath(); c.roundRect(-r * .85, -r * .5, r * 1.7, r * .32, r * .1); c.fill();
  for (let k = 0; k < 9; k++) { const xx = -r * .72 + k * r * .18; c.beginPath(); c.moveTo(xx, -r * .2); c.lineTo(xx, r * .55); c.stroke(); }
  c.restore();
}
function bolt(c, x, y, r, col, a = 1) {
  if (a <= 0) return; iconStyle(c, x, y, r, col, a);
  c.beginPath(); c.moveTo(r * .15, -r); c.lineTo(-r * .45, r * .1); c.lineTo(-r * .02, r * .1); c.lineTo(-r * .2, r); c.lineTo(r * .45, -r * .15); c.lineTo(r * .02, -r * .15); c.closePath(); c.fill(); c.restore();
}

// ---------- brain ----------
const BR = new Path2D(); (p => { p.moveTo(70, 250); p.bezierCurveTo(20, 170, 80, 50, 220, 30); p.bezierCurveTo(330, 5, 480, 25, 545, 120); p.bezierCurveTo(595, 195, 585, 285, 520, 315); p.bezierCurveTo(470, 335, 420, 322, 395, 328); p.bezierCurveTo(350, 338, 300, 322, 255, 342); p.bezierCurveTo(200, 365, 150, 338, 125, 310); p.bezierCurveTo(100, 295, 80, 280, 70, 250); p.closePath(); })(BR);
const CB = new Path2D(); CB.ellipse(468, 345, 88, 46, -0.12, 0, Math.PI * 2);
const ST = new Path2D(); ST.moveTo(368, 322); ST.bezierCurveTo(362, 370, 372, 410, 362, 455); ST.lineTo(412, 455); ST.bezierCurveTo(410, 410, 420, 370, 428, 326); ST.closePath();
const GYRI = (() => { const r = rng(7), arr = []; for (let k = 0; k < 95; k++) { let x = 50 + r() * 540, y = 25 + r() * 320, a = r() * 6.28; const pts = [[x, y]]; for (let s = 0; s < 14; s++) { a += (r() - .5) * 1.9; x += Math.cos(a) * 14; y += Math.sin(a) * 14; pts.push([x, y]); } arr.push(pts); } return arr; })();
function drawBrain(c, cx, cy, s, o = {}) {
  c.save(); c.translate(cx - 300 * s, cy - 240 * s); c.scale(s, s); c.globalAlpha *= (o.a ?? 1);
  const line = o.line || 'rgba(150,190,255,0.95)', lw = (o.lw || 3) / s;
  for (const p of [ST, CB]) { c.fillStyle = o.fill2 || 'rgba(34,44,110,0.95)'; c.fill(p); c.strokeStyle = line; c.lineWidth = lw; c.shadowColor = o.glow || C.cyan; c.shadowBlur = 16; c.stroke(p); c.shadowBlur = 0; }
  c.save(); c.clip(CB); c.strokeStyle = 'rgba(200,220,255,0.25)'; c.lineWidth = 2.2 / s; for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(468, 300 + k * 14, 110, 30, -0.12, 0.2, Math.PI - 0.2); c.stroke(); } c.restore();
  const gr = c.createLinearGradient(0, 20, 0, 360); gr.addColorStop(0, o.fillTop || 'rgba(70,95,210,0.92)'); gr.addColorStop(1, o.fillBot || 'rgba(36,36,120,0.92)');
  c.fillStyle = gr; c.fill(BR);
  c.save(); c.clip(BR);
  c.lineCap = 'round'; c.strokeStyle = o.gyri || 'rgba(205,220,255,0.22)'; c.lineWidth = 4.5;
  for (const pts of GYRI) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); c.stroke(); }
  c.strokeStyle = 'rgba(210,225,255,0.45)'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(165, 272); c.bezierCurveTo(240, 236, 310, 212, 405, 204); c.stroke();
  c.beginPath(); c.moveTo(336, 22); c.bezierCurveTo(318, 90, 300, 150, 272, 214); c.stroke();
  if (o.inner) o.inner(c);
  c.restore();
  c.strokeStyle = line; c.lineWidth = lw * 1.3; c.shadowColor = o.glow || C.cyan; c.shadowBlur = 30; c.stroke(BR); c.shadowBlur = 0;
  if (o.after) o.after(c);
  c.restore();
}
const brainPt = (cx, cy, s, x, y) => [cx - 300 * s + x * s, cy - 240 * s + y * s];

// ---------- head ----------
const HEAD = new Path2D('M400 790 C400 700 450 640 470 560 C520 420 505 120 300 58 C160 20 40 120 40 262 C40 322 30 350 22 380 L0 450 L30 468 L30 500 L18 530 L36 546 L30 582 C40 622 80 632 140 622 C200 640 212 700 212 790 Z');

// =============== SCENES ===============
const S = {};

S.hook = (c, t) => {
  const hs = 1.1, hx = 540 - 255 * hs, hy = 975 - 420 * hs;
  const pulse = pulseOf(t, HOOK_BEATS, 4.5);
  const app = fade(t, 0, .8);
  // head
  c.save(); c.translate(hx, hy); c.scale(hs, hs); c.globalAlpha *= app;
  const hg = c.createLinearGradient(0, 0, 500, 800); hg.addColorStop(0, 'rgba(40,52,120,0.9)'); hg.addColorStop(1, 'rgba(14,18,50,0.9)');
  c.fillStyle = hg; c.fill(HEAD); c.strokeStyle = 'rgba(170,200,255,0.9)'; c.lineWidth = 4; c.shadowColor = C.cyan; c.shadowBlur = 26; c.stroke(HEAD); c.restore();
  // brain inside head
  const [bx, by] = [hx + (60 + 300 * .74) * hs, hy + (88 + 240 * .74) * hs];
  drawBrain(c, bx, by, .74 * hs, { a: .55 * app });
  // temple pain
  const tx = hx + 150 * hs, ty = hy + 300 * hs;
  c.save(); const rr = 170 + 90 * pulse; const rg = c.createRadialGradient(tx, ty, 0, tx, ty, rr);
  rg.addColorStop(0, `rgba(255,60,90,${0.15 + 0.6 * pulse})`); rg.addColorStop(1, 'rgba(255,60,90,0)'); c.fillStyle = rg; c.globalAlpha *= app;
  c.beginPath(); c.arc(tx, ty, rr, 0, 6.283); c.fill(); c.restore();
  for (const b of HOOK_BEATS) if (t >= b && t < b + 1.1) ring(c, tx, ty, 30 + (t - b) * 330, C.pink, 6 * (1 - (t - b) / 1.1), (1 - (t - b) / 1.1) * app);
  dot(c, tx, ty, 16 + 8 * pulse, '#ff8aa8', app, 40);
  // headline
  const s0 = LN[0].start;
  const k = pop(t, s0, .5);
  c.save(); c.translate(540, 300); c.scale(k, k); rich(c, [['约 ', C.white], ['10 亿', C.pink], [' 人', C.white]], 0, 0, { size: 132, a: clamp(k) }); c.restore();
  txt(c, '都被这种痛折磨过', 540, 420, { size: 52, w: 700, a: fade(t, s0 + .5), color: C.dim });
  // symptoms
  const s1 = LN[1].start;
  chip(c, '半边头', tx - 10, ty - 120, { a: fade(t, at(1, '半边头') - .1, .3), scale: pop(t, at(1, '半边头') - .1, .4), color: C.pink, size: 40 });
  chip(c, '一跳一跳地疼', tx + 40, ty + 115, { a: fade(t, at(1, '一跳') - .1, .3), scale: pop(t, at(1, '一跳') - .1, .4), color: C.pink, size: 40 });
  const ic = (word, x, y, fn, label) => {
    const t0 = at(1, word) - .15, a = fade(t, t0, .35), sc = pop(t, t0, .45);
    c.save(); c.translate(x, y); c.scale(sc, sc); fn(0, 0, a); c.restore();
    txt(c, label, x, y + 95, { size: 40, a, color: C.white });
  };
  ic('怕光', 140, 1180, (x, y, a) => sun(c, x, y, 62, C.yellow, a, t * .6), '怕光');
  ic('怕吵', 940, 760, (x, y, a) => speaker(c, x, y, 62, C.cyan, a, (t * 1.5) % 1), '怕吵');
  ic('想吐', 940, 1180, (x, y, a) => nausea(c, x, y, 62, '#7dffb0', a, t * 2), '想吐');
};

S.title = (c, t) => {
  const s0 = LN[2].start;
  const k = pop(t, s0 - .1, .55);
  c.save(); c.translate(540, 600); c.scale(k, k); rich(c, [['偏头痛', C.white]], 0, 0, { size: 200, a: clamp(k) }); c.restore();
  // ≠ 普通头疼
  const tn = at(2, '它不是'); const a1 = fade(t, tn - .1);
  c.save(); c.globalAlpha *= a1; rich(c, [['不是 ', C.dim], ['普通头疼', C.white]], 540, 790, { size: 60, w: 700 });
  const sw = P(t, tn + .4, tn + .8); c.strokeStyle = C.red; c.lineWidth = 8; c.shadowColor = C.red; c.shadowBlur = 16; c.beginPath(); c.moveTo(560, 795); c.lineTo(560 + 250 * sw, 795); c.stroke(); c.restore();
  const tc = at(2, '而是') ;
  rich(c, [['而是大脑里的一场', C.white], ['连锁反应', C.pink]], 540, 930, { size: 64, a: fade(t, tc) });
  // chain of 5
  const names = ['触发', '先兆', '神经报警', '发炎', '放大'], cols = [C.amber, C.cyan, C.yellow, C.pink, C.red];
  const xs = [150, 345, 540, 735, 930], y = 1170, t0 = at(2, '连锁') - .2;
  for (let i = 0; i < 5; i++) {
    const ti = t0 + i * .22, a = fade(t, ti - .15, .3), lit = P(t, ti, ti + .25);
    if (i < 4) glowLine(c, [[xs[i] + 62, y], [xs[i + 1] - 62, y]], 'rgba(255,255,255,0.5)', 5, P(t, ti, ti + .22), 10);
    c.save(); c.globalAlpha *= a; c.beginPath(); c.arc(xs[i], y, 62, 0, 6.283); c.fillStyle = 'rgba(12,18,44,0.95)'; c.fill();
    c.lineWidth = 6; c.strokeStyle = cols[i]; c.shadowColor = cols[i]; c.shadowBlur = 10 + 30 * lit; c.stroke(); c.restore();
    txt(c, String(i + 1), xs[i], y + 2, { size: 56, w: 900, a, color: cols[i], glow: cols[i], blur: 20 * lit });
    txt(c, names[i], xs[i], y + 110, { size: 38, w: 700, a });
  }
  // travelling spark
  const sp = P(t, t0 + 1.2, t0 + 2.6); if (sp > 0 && sp < 1) dot(c, lerp(150, 930, eio(sp)), y - 95, 10, C.white, 1 - Math.abs(sp - .5) * 1.6, 30);
};

S.trigger = (c, t) => {
  const st = SC.trigger.start;
  headline(c, t, st + .1, 0, [['天生', C.white], ['更敏感', C.amber], ['的大脑', C.white]]);
  const top = 600, bot = 1260, hh = bot - top, wid = 210, thr = 0.8, thY = bot - hh * thr;
  const tanks = [{ x: 310, label: '普通大脑', lv: 0.32, col: C.cyan }, { x: 770, label: '偏头痛大脑', lv: 0.56, col: C.amber }];
  const chips = [['睡不好', 600], ['压力大', 790], ['激素波动', 960]];
  let mlv = 0.56; chips.forEach(([w]) => { mlv += 0.07 * eio(P(t, at(3, w) + .45, at(3, w) + .9)); });
  mlv += 0.13 * eo(P(t, T_CROSS - .35, T_CROSS + .2));
  tanks[1].lv = mlv;
  const crossed = t > T_CROSS;
  tanks.forEach((k, i) => {
    const a = fade(t, st + .2 + i * .25, .5); if (a <= 0) return;
    c.save(); c.globalAlpha *= a;
    const x0 = k.x - wid / 2; const lvY = bot - hh * k.lv * eo(P(t, st + .3 + i * .25, st + 1.2 + i * .25));
    c.save(); c.beginPath(); c.roundRect(x0, top, wid, hh, 30); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x0, top, wid, hh);
    let col = k.col; if (i === 1 && crossed) col = C.red;
    const lg = c.createLinearGradient(0, lvY, 0, bot); lg.addColorStop(0, col); lg.addColorStop(1, 'rgba(20,20,60,0.6)');
    c.fillStyle = lg; c.globalAlpha *= 0.85; c.beginPath(); c.moveTo(x0, bot);
    for (let x = x0; x <= x0 + wid; x += 6) c.lineTo(x, lvY + Math.sin(x * .05 + t * (i ? 5 : 3)) * (i && crossed ? 14 : 7));
    c.lineTo(x0 + wid, bot); c.closePath(); c.fill(); c.restore();
    c.beginPath(); c.roundRect(x0, top, wid, hh, 30); c.lineWidth = 5; c.strokeStyle = 'rgba(200,215,255,0.8)'; c.shadowColor = col; c.shadowBlur = 20; c.stroke();
    c.restore();
    txt(c, k.label, k.x, bot + 60, { size: 44, w: 900, a, color: i ? C.amber : C.white });
  });
  // threshold
  const ta = fade(t, st + .9); c.save(); c.globalAlpha *= ta; c.setLineDash([22, 14]); c.strokeStyle = C.red; c.lineWidth = 5; c.shadowColor = C.red; c.shadowBlur = 16;
  c.beginPath(); c.moveTo(150, thY); c.lineTo(930, thY); c.stroke(); c.restore();
  txt(c, '临界点', 540, thY - 34, { size: 36, w: 900, a: ta, color: C.red });
  // trigger chips falling in
  chips.forEach(([w, x0]) => {
    const t0 = at(3, w) - .1, p = P(t, t0, t0 + 1.0); if (p <= 0 || p >= 1) return;
    const lvY = bot - hh * mlv; const y = lerp(470, lvY, eio(P(p, .3, 1))), x = lerp(x0, 770, eio(P(p, .3, 1)));
    chip(c, w, x, y, { a: 1 - P(p, .8, 1), scale: Math.min(pop(t, t0, .3), 1 - .4 * P(p, .5, 1)), color: C.amber, size: 40 });
  });
  // crossing burst
  if (crossed) {
    const q = t - T_CROSS;
    ring(c, 770, thY, 40 + q * 600, C.red, 8, 1 - clamp(q / .9));
    const k = pop(t, T_CROSS, .4); c.save(); c.translate(770, 470); c.scale(k, k); chip(c, '发作', 0, 0, { color: C.red, size: 52, tc: '#fff', bg: 'rgba(80,10,20,0.9)' }); c.restore();
    bolt(c, 620, 470, 46, C.yellow, clamp(k)); bolt(c, 920, 470, 46, C.yellow, clamp(k));
  }
};

S.aura = (c, t) => {
  const st = SC.aura.start, t2 = at(4, '这是一波') - .2;
  headline(c, t, st + .1, t2, [['先看到', C.white], ['闪光和锯齿', C.yellow]]);
  headline(c, t, t2, 0, [['先兆：皮层上的一圈', C.white], ['“水波”', C.cyan]]);
  const m = eio(P(t, t2, t2 + .9)); // 视野框从大到小
  const vx = lerp(540, 250, m), vy = lerp(930, 1340, m), vr = lerp(330, 135, m);
  const waveP = P(t, st + .3, SC.aura.end + .3);
  // visual field
  c.save(); c.globalAlpha *= fade(t, st + .2, .5);
  c.beginPath(); c.arc(vx, vy, vr, 0, 6.283); const vg = c.createRadialGradient(vx, vy, 0, vx, vy, vr); vg.addColorStop(0, '#26315f'); vg.addColorStop(1, '#0b0f26'); c.fillStyle = vg; c.fill();
  c.lineWidth = 4; c.strokeStyle = 'rgba(200,215,255,0.7)'; c.stroke();
  c.save(); c.clip();
  const R = vr * (0.18 + 0.75 * eo(waveP)), cx0 = vx + vr * .08, cy0 = vy - vr * .05;
  // scotoma
  c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.arc(cx0, cy0, R * .92, -1.9, 2.3); c.fill();
  // zigzag fortification
  const N = 44, a0 = -1.9, a1 = 2.3; let prev = null;
  for (let k = 0; k <= N; k++) {
    const an = lerp(a0, a1, k / N), rr = R + (k % 2 ? vr * .07 : 0);
    const p = [cx0 + Math.cos(an) * rr, cy0 + Math.sin(an) * rr];
    if (prev) { c.strokeStyle = `hsl(${(k * 37 + t * 520) % 360},100%,68%)`; c.lineWidth = Math.max(3, vr * .022); c.shadowColor = c.strokeStyle; c.shadowBlur = 14; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(p[0], p[1]); c.stroke(); }
    prev = p;
  }
  c.restore(); dot(c, vx, vy, 5, '#fff', .8, 8);
  c.restore();
  txt(c, '你眼中看到的', vx, vy - vr - (m > .5 ? 34 : 50), { size: m > .5 ? 32 : 42, a: fade(t, st + .3), color: C.dim });
  // brain with spreading depression
  const ba = fade(t, t2 + .75, .5); if (ba > 0) {
    const bcx = 540, bcy = 800, bs = 1.45;
    const Rw = 20 + 500 * P(t, t2 + .8, SC.aura.end + .2), ox = 548, oy = 205;
    drawBrain(c, bcx, bcy, bs, {
      a: ba, inner: cc => {
        if (Rw > 70) { cc.fillStyle = 'rgba(2,4,18,0.78)'; cc.beginPath(); cc.arc(ox, oy, Rw - 70, 0, 6.283); cc.fill(); }
        const wg = cc.createRadialGradient(ox, oy, Math.max(Rw - 75, 0), ox, oy, Rw + 22);
        wg.addColorStop(0, 'rgba(70,227,255,0)'); wg.addColorStop(.72, 'rgba(120,240,255,0.95)'); wg.addColorStop(1, 'rgba(70,227,255,0)');
        cc.fillStyle = wg; cc.beginPath(); cc.arc(ox, oy, Rw + 22, 0, 6.283); cc.fill();
        const r = rng(Math.floor(t * 15)); for (let k = 0; k < 40; k++) { const an = r() * 6.283, rr = Rw - 30 + r() * 40; dot(cc, ox + Math.cos(an) * rr, oy + Math.sin(an) * rr, 2 + r() * 3, '#e9ffff', .9, 10); }
      }
    });
    const [px, py] = brainPt(bcx, bcy, bs, ox, oy);
    dot(c, px, py, 12, '#fff', ba, 30);
    chip(c, '起点：视觉皮层', px - 60, py - 120, { a: ba * (1 - P(t, at(4, '每分钟') - .4, at(4, '每分钟'))), size: 32, color: C.cyan });
    // legend
    const la = fade(t, at(4, '像水波') - .2);
    c.save(); c.globalAlpha *= la;
    dot(c, 520, 1250, 14, C.cyan, 1, 20); txt(c, '神经元集体放电', 545, 1250, { size: 34, align: 'left' });
    dot(c, 520, 1320, 14, '#1a2350', 1, 0); ring(c, 520, 1320, 14, 'rgba(200,215,255,0.6)', 2, 1); txt(c, '随后进入“沉默”', 545, 1320, { size: 34, align: 'left' });
    c.restore();
    const sk = at(4, '每分钟') - .15;
    c.save(); c.translate(720, 1410); const k = pop(t, sk, .45); c.scale(k, k); chip(c, '≈ 3 毫米 / 分钟', 0, 0, { a: clamp(k), color: C.cyan, size: 40 }); c.restore();
  }
};

const NERVE = (() => {
  const G = [175, 368];
  const main = [
    [G, [140, 330], [96, 284], [62, 214], [68, 140], [118, 76], [200, 42]],
    [G, [232, 330], [300, 302], [380, 292], [462, 300], [528, 282]],
    [G, [212, 300], [252, 222], [292, 152], [332, 92], [362, 36]],
    [[292, 152], [380, 122], [462, 104], [534, 134]],
    [[380, 292], [430, 240], [500, 210], [560, 200]],
  ];
  const r = rng(11), twigs = [];
  main.forEach((b, bi) => { for (let i = 1; i < b.length - 1; i++) { const [x0, y0] = b[i], [x1, y1] = b[i + 1]; const dir = Math.atan2(y1 - y0, x1 - x0) + (r() < .5 ? 1 : -1) * (0.6 + r() * .6), len = 28 + r() * 34; const mid = [x0 + Math.cos(dir) * len * .5 + (r() - .5) * 10, y0 + Math.sin(dir) * len * .5]; twigs.push({ bi, i, n: b.length, pts: [[x0, y0], mid, [x0 + Math.cos(dir) * len, y0 + Math.sin(dir) * len]] }); } });
  return { G, main, twigs };
})();

S.nerve = (c, t) => {
  const st = SC.nerve.start, tb = at(5, '真正报警') - .2;
  headline(c, t, st + .1, tb, [['大脑本身', C.white], ['感觉不到疼', C.cyan]]);
  headline(c, t, tb, 0, [['报警的是：', C.white], ['三叉神经', C.yellow]]);
  const bcx = 540, bcy = 860, bs = 1.4;
  const memP = eio(P(t, tb + .2, tb + 1.4)), nerveP = P(t, tb + .9, tb + 2.6);
  const hot = P(t, SC.nerve.end - 1.6, SC.nerve.end - .4);
  const ncol = hot > 0 ? `rgb(255,${Math.round(lerp(216, 90, hot))},${Math.round(lerp(74, 60, hot))})` : C.yellow;
  drawBrain(c, bcx, bcy, bs, {
    a: fade(t, st, .4), after: cc => {
      if (memP > 0) {
        cc.save(); cc.setLineDash([1700 * memP, 3000]); cc.lineCap = 'round';
        cc.strokeStyle = 'rgba(255,170,80,0.35)'; cc.lineWidth = 30; cc.stroke(BR);
        cc.strokeStyle = 'rgba(255,190,110,0.95)'; cc.lineWidth = 3.5; cc.shadowColor = C.amber; cc.shadowBlur = 20; cc.stroke(BR); cc.restore();
      }
      NERVE.main.forEach((b, i) => glowLine(cc, b, ncol, 7, P(nerveP, i * .1, .6 + i * .1), 26));
      NERVE.twigs.forEach(w => glowLine(cc, w.pts, ncol, 3.5, P(nerveP, .45 + w.bi * .08 + w.i * .03, .75 + w.bi * .08 + w.i * .03), 14));
      if (nerveP > 0) dot(cc, NERVE.G[0], NERVE.G[1], 18, ncol, clamp(nerveP * 3), 40);
      // 报警信号：沿神经向神经节回传
      if (nerveP >= 1) NERVE.main.forEach((b, i) => { for (let k = 0; k < 2; k++) { const f = 1 - (((t - tb) * .9 + i * .23 + k * .5) % 1); dot(cc, ...along(b, f), 7, '#fff', .9, 18); } });
    }
  });
  // 阶段 A：无痛觉感受器
  const aA = fade(t, st + .4) * (1 - P(t, tb - .1, tb + .3));
  if (aA > 0) {
    [[380, 700], [560, 640], [720, 760]].forEach(([x, y], i) => {
      const ti = st + .6 + i * .3; const a = aA * fade(t, ti, .3);
      bolt(c, x, y, 44, C.pink, a);
      const sl = P(t, ti + .4, ti + .7); c.save(); c.globalAlpha *= a; c.strokeStyle = C.white; c.lineWidth = 7; c.shadowColor = '#fff'; c.shadowBlur = 12; c.beginPath(); c.arc(x, y, 58, 0, 6.283 * sl); c.stroke();
      if (sl >= 1) { c.beginPath(); c.moveTo(x - 41, y - 41); c.lineTo(x + 41, y + 41); c.stroke(); } c.restore();
    });
    chip(c, '脑组织里没有痛觉感受器', 540, 1300, { a: aA * fade(t, st + 1.2), size: 40, color: C.cyan });
  }
  chip(c, '脑膜', ...brainPt(bcx, bcy, bs, 330, -10), { a: fade(t, tb + .7), scale: pop(t, tb + .7), color: C.amber, size: 38 });
  const [gx, gy] = brainPt(bcx, bcy, bs, NERVE.G[0], NERVE.G[1]);
  chip(c, '三叉神经', gx + 30, gy + 110, { a: fade(t, tb + 1.0), scale: pop(t, tb + 1.0), color: C.yellow, size: 40 });
};

S.cgrp = (c, t) => {
  const st = SC.cgrp.start, tr = at(6, '释放') - .1, td = at(6, '血管扩张') - .2, ti = at(6, '发炎') - .3;
  headline(c, t, st + .1, T_HAMMER, [['释放 ', C.white], ['CGRP', C.amber]]);
  headline(c, t, T_HAMMER, 0, [['每次心跳 = ', C.white], ['一记重锤', C.red]]);
  chip(c, '放大看：脑膜上的血管', 540, 430, { a: fade(t, st + .2) * (1 - P(t, tr + 1, tr + 1.4)), size: 34, color: 'rgba(200,215,255,0.8)' });
  const pulse = pulseOf(t, CGRP_BEATS, 6);
  const dil = eio(P(t, td, td + 1.1)), inflam = fade(t, ti, 1.2);
  const r = 100 + 48 * dil + 20 * pulse, yc = x => 1000 + 26 * Math.sin(x * .006 + .8);
  const pts = []; for (let x = -60; x <= 1140; x += 20) pts.push([x, yc(x)]);
  const strokePts = (lw, col, blur = 0, bc) => { c.save(); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.lineWidth = lw; c.strokeStyle = col; c.lineCap = 'butt'; c.lineJoin = 'round'; if (blur) { c.shadowColor = bc || col; c.shadowBlur = blur; } c.stroke(); c.restore(); };
  const va = fade(t, st, .5); c.save(); c.globalAlpha *= va;
  if (inflam > 0) { strokePts(2 * r + 120 + 40 * pulse, `rgba(255,50,100,${0.16 * inflam})`, 80, 'rgba(255,40,90,0.9)'); }
  strokePts(2 * r + 34, pulse > .3 ? '#ff5f86' : '#d2456c', 30 + 30 * pulse, C.pink);
  strokePts(2 * r, '#3b0a22');
  strokePts(2 * r - 60, 'rgba(120,20,50,0.5)');
  // red blood cells
  const rr = rng(5); for (let k = 0; k < 26; k++) {
    const lane = (rr() - .5) * 1.5, sp = 120 + rr() * 90, x = ((rr() * 1300 + t * sp) % 1300) - 110, y = yc(x) + lane * (r - 30);
    c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2 + k) * .4); c.fillStyle = '#ff4d6d'; c.shadowColor = '#ff2d55'; c.shadowBlur = 12; c.beginPath(); c.ellipse(0, 0, 30, 15, 0, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(120,0,30,0.55)'; c.beginPath(); c.ellipse(0, 0, 15, 6, 0, 0, 6.283); c.fill(); c.restore();
  }
  c.restore();
  // inflammation sparks
  if (inflam > 0) { const q = rng(Math.floor(t * 8)); for (let k = 0; k < 14; k++) { const x = q() * 1080; const side = q() < .5 ? -1 : 1; dot(c, x, yc(x) + side * (r + 40 + q() * 60), 3 + q() * 5, '#ff7a9c', inflam * (.4 + q() * .6), 14); } }
  // nerves
  const hit = pulse;
  const ncol = hit > .25 ? '#ff5a5a' : C.yellow;
  const nerves = [{ path: [[60, 560], [220, 600], [380, 700], [520, yc(520) - r - 75]], out: -1 }, { path: [[600, 1540], [610, 1420], [630, yc(630) + r + 75]], out: 1 }];
  nerves.forEach((n, i) => {
    const p = n.path; p[p.length - 1][1] = i ? yc(630) + r + 70 : yc(520) - r - 70;
    glowLine(c, p, ncol, 16, fade(t, st + .3 + i * .2, .8), 30);
    const e = p[p.length - 1]; const ea = fade(t, st + .9 + i * .2);
    dot(c, e[0], e[1], 26 + 10 * hit, ncol, ea, 40 + 30 * hit);
    // CGRP 粒子
    if (t > tr) for (let k = 0; k < 70; k++) {
      const tb = tr + k * .085 + i * .04; if (t < tb) break;
      const q = rng(k * 7 + i * 1000), dur = 0.9 + q() * .7, f = (t - tb) / dur; if (f > 1.35) continue;
      const tx = e[0] + (q() - .5) * 420, ty = yc(tx) + (i ? (r + 12) : -(r + 12));
      const ff = eo(clamp(f)); const x = lerp(e[0], tx, ff), y = lerp(e[1], ty, ff) + Math.sin(f * 9 + k) * 6;
      dot(c, x, y, 8, C.amber, f > 1 ? 1 - (f - 1) / .35 : 1, 18);
    }
  });
  chip(c, 'CGRP', 820, 690, { a: fade(t, tr + .2), scale: pop(t, tr + .2), color: C.amber, size: 46, w: 900, tc: C.amber });
  chip(c, '血管扩张', 230, 1320, { a: fade(t, td + .1), scale: pop(t, td + .1), color: C.pink, size: 40 });
  chip(c, '发炎', 880, 1320, { a: fade(t, ti + .1), scale: pop(t, ti + .1), color: C.red, size: 40 });
  // dilation arrows
  const da = fade(t, td, .4) * (1 - P(t, T_HAMMER, T_HAMMER + .4));
  if (da > 0) [[900, -1], [900, 1]].forEach(([x, s]) => { const y0 = yc(x) + s * (r + 30), y1 = y0 + s * 70; glowLine(c, [[x, y0], [x, y1]], '#fff', 6, 1, 12); c.save(); c.globalAlpha *= da; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 16, y1 - s * 4); c.lineTo(x + 16, y1 - s * 4); c.lineTo(x, y1 + s * 22); c.fill(); c.restore(); });
  // heartbeat hammer
  CGRP_BEATS.forEach((b, i) => {
    if (t < b || t > b + .7) return; const q = (t - b) / .7;
    const x = i % 2 ? 820 : 260, y = i % 2 ? 1180 : 820;
    c.save(); c.translate(x, y); const k = 0.6 + 0.6 * eob(clamp(q * 2.5)); c.scale(k, k); txt(c, '咚', 0, 0, { size: 120, w: 900, color: C.red, glow: C.red, blur: 40, a: 1 - q }); c.restore();
    ring(c, 520, yc(520) - r - 70, 30 + q * 420, C.red, 7, 1 - q);
  });
};

S.amp = (c, t) => {
  const st = SC.amp.start;
  headline(c, t, st + .1, 0, [['整个系统被', C.white], ['调高音量', C.pink]]);
  const bcx = 540, bcy = 800, bs = 1.25;
  const heat = eo(P(t, at(7, '整个系统') - .3, at(7, '整个系统') + 1.5));
  const nodes = { G: [175, 368], S: [395, 400], Th: [322, 232] }, tops = [[180, 82], [330, 38], [470, 92]];
  const paths = tops.map(tp => [nodes.G, [280, 410], nodes.S, [370, 300], nodes.Th, tp]);
  const drawP = P(t, st + .3, st + 2.0);
  drawBrain(c, bcx, bcy, bs, {
    a: fade(t, st, .4), fillTop: `rgba(${Math.round(lerp(70, 160, heat))},${Math.round(lerp(95, 50, heat))},${Math.round(lerp(210, 120, heat))},0.92)`,
    inner: cc => { if (heat > 0) { const hg = cc.createRadialGradient(330, 150, 20, 330, 150, 420); hg.addColorStop(0, `rgba(255,80,110,${.55 * heat})`); hg.addColorStop(1, 'rgba(255,60,90,0)'); cc.fillStyle = hg; cc.fillRect(0, 0, 620, 420); } },
    after: cc => {
      paths.forEach(p => glowLine(cc, p, C.yellow, 5, drawP, 20));
      Object.values(nodes).forEach(([x, y]) => dot(cc, x, y, 13, '#fff', drawP > .2 ? 1 : 0, 26));
      if (drawP >= 1) paths.forEach((p, i) => { for (let k = 0; k < 2; k++) { const f = ((t - st) * (.7 + heat * .6) + i * .33 + k * .5) % 1; dot(cc, ...along(p, f), 9 + 5 * heat, heat > .5 ? '#ff6b8a' : '#fff', 1, 24); } });
    }
  });
  const L = (k, s, x, y, col) => { const tt = st + .5 + k * .35; chip(c, s, x, y, { a: fade(t, tt), scale: pop(t, tt), size: 32, color: col }); };
  L(0, '三叉神经', 270, 1060, C.yellow); L(1, '脑干', 780, 1060, C.yellow); L(2, '丘脑', 790, 760, C.yellow); L(3, '大脑皮层', 300, 520, C.pink);
  // volume meter
  const ma = fade(t, at(7, '整个系统') - .4);
  if (ma > 0) {
    txt(c, '敏感度', 150, 1205, { size: 36, w: 900, a: ma, color: C.dim });
    const n = 12, lit = 3 + 9 * heat;
    for (let k = 0; k < n; k++) {
      const x = 260 + k * 58, h = 22 + k * 6.5, on = k < lit;
      const col = k < 4 ? C.cyan : k < 8 ? C.amber : C.red;
      c.save(); c.globalAlpha *= ma * (on ? 1 : .18); c.fillStyle = col; if (on) { c.shadowColor = col; c.shadowBlur = 18; } c.beginPath(); c.roundRect(x, 1230 - h, 40, h, 6); c.fill(); c.restore();
    }
  }
  const ic = (word, x, fn, label) => { const t0 = at(7, word) - .15, a = fade(t, t0, .3), k = pop(t, t0, .45); c.save(); c.translate(x, 1360); c.scale(k, k); fn(a); c.restore(); txt(c, label, x, 1455, { size: 38, w: 700, a }); };
  ic('光更', 230, a => sun(c, 0, 0, 60, C.yellow, a, t), '光：更刺眼');
  ic('声音', 540, a => speaker(c, 0, 0, 60, C.cyan, a, (t * 2) % 1), '声：更吵');
  ic('连梳头', 850, a => comb(c, 0, 0, 60, C.pink, a), '梳头：也疼');
};

S.end = (c, t) => {
  const st = SC.end.start;
  const aA = 1 - P(t, T_CARD - .3, T_CARD + .2);
  if (aA > 0) {
    c.save(); c.globalAlpha *= aA;
    headline(c, t, st + .1, 0, [['新药：专门', C.white], ['阻断 CGRP', C.cyan]]);
    // membrane
    const my = 1180; c.save(); c.globalAlpha *= fade(t, st + .1);
    for (let x = 40; x <= 1040; x += 26) { dot(c, x, my, 9, 'rgba(160,180,255,0.7)', 1, 0); dot(c, x, my + 46, 9, 'rgba(160,180,255,0.7)', 1, 0); }
    c.strokeStyle = 'rgba(160,180,255,0.35)'; c.lineWidth = 3; for (let x = 40; x <= 1040; x += 26) { c.beginPath(); c.moveTo(x - 3, my + 9); c.lineTo(x - 3, my + 37); c.moveTo(x + 3, my + 9); c.lineTo(x + 3, my + 37); c.stroke(); }
    c.restore();
    txt(c, '神经细胞上的 CGRP 受体', 540, my + 120, { size: 34, a: fade(t, st + .4), color: C.dim });
    const RX = [210, 430, 650, 870];
    RX.forEach((x, i) => {
      const tb = T_BLOCK + i * .18, blocked = t > tb + .55;
      // receptor cup
      c.save(); c.globalAlpha *= fade(t, st + .2 + i * .1); c.strokeStyle = C.violet; c.lineWidth = 14; c.lineCap = 'round'; c.shadowColor = C.violet; c.shadowBlur = 18;
      c.beginPath(); c.moveTo(x - 38, my - 70); c.lineTo(x - 30, my - 10); c.moveTo(x + 38, my - 70); c.lineTo(x + 30, my - 10); c.stroke(); c.restore();
      // CGRP 掉落
      for (let k = 0; k < 6; k++) {
        const t0 = st + .4 + k * .62 + i * .17, f = (t - t0) / .9; if (f < 0 || f > 1.6) continue;
        const arriveBlocked = t0 + .9 > tb + .4;
        let y = lerp(520, my - 52, eio(clamp(f))), x0 = x + Math.sin(k * 3 + i) * 50, xx = lerp(x0, x, eio(clamp(f))), a = 1;
        if (f > 1) { if (arriveBlocked) { y = my - 52 - (f - 1) * 260; xx = x + (f - 1) * 120 * (i % 2 ? 1 : -1); a = 1 - (f - 1) / .6; } else { a = 1 - (f - 1) / .6; ring(c, x, my - 40, 30 + (f - 1) * 120, C.red, 5, a); } }
        dot(c, xx, y, 13, C.amber, Math.max(a, 0), 20);
      }
      // 抗体/阻断剂 Y
      const p = P(t, tb, tb + .55); if (p > 0) {
        const yy = lerp(420, my - 62, eob(p)); c.save(); c.translate(x, yy); c.globalAlpha *= clamp(p * 3); c.strokeStyle = C.cyan; c.lineWidth = 12; c.lineCap = 'round'; c.shadowColor = C.cyan; c.shadowBlur = 26;
        c.beginPath(); c.moveTo(0, 10); c.lineTo(0, -40); c.moveTo(0, -40); c.lineTo(-28, -78); c.moveTo(0, -40); c.lineTo(28, -78); c.stroke(); c.restore();
        if (blocked) ring(c, x, my - 50, 30 + (t - tb - .55) * 160, C.cyan, 4, 1 - clamp((t - tb - .55) / .6));
      }
    });
    chip(c, 'CGRP', 150, 560, { a: fade(t, st + .4), color: C.amber, size: 36, tc: C.amber });
    chip(c, '阻断剂', 930, 560, { a: fade(t, T_BLOCK), scale: pop(t, T_BLOCK), color: C.cyan, size: 36, tc: C.cyan });
    c.restore();
  }
  // end card
  const ca = fade(t, T_CARD, .6); if (ca <= 0) return;
  c.save(); c.globalAlpha *= ca;
  const br = 1 + .02 * Math.sin(t * 2.4);
  drawBrain(c, 540, 690, .78 * br, { a: 1, glow: C.cyan });
  const k = pop(t, T_CARD + .1, .5); c.save(); c.translate(540, 1010); c.scale(k, k); rich(c, [['偏头痛', C.white], ['不是矫情', C.pink]], 0, 0, { size: 104 }); c.restore();
  rich(c, [['是一种', C.white], ['真实的脑部疾病', C.cyan]], 540, 1150, { size: 64, w: 900, a: fade(t, at(8, '是一种') - .1) });
  const fa = fade(t, at(8, '是一种') + .6);
  c.save(); c.globalAlpha *= fa; c.strokeStyle = 'rgba(200,215,255,0.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(340, 1260); c.lineTo(740, 1260); c.stroke(); c.restore();
  txt(c, '反复发作、头痛变样，记得去神经内科', 540, 1320, { size: 36, a: fa, color: C.dim });
  txt(c, '科普内容，不替代医生诊断', 540, 1378, { size: 30, a: fa, color: 'rgba(220,230,255,0.45)' });
  c.restore();
};

// =============== compositor ===============
const STARS = (() => { const r = rng(3); return Array.from({ length: 120 }, () => ({ x: r() * W, y: r() * H, s: .6 + r() * 2.2, v: 4 + r() * 14, ph: r() * 6.28 })); })();
function bg(t) {
  g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(540, 860, 40, 540, 860, 1150); gr.addColorStop(0, '#111c4c'); gr.addColorStop(1, 'rgba(5,8,22,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const red = Math.max(pulseOf(t, HOOK_BEATS, 4.5) * .5 * (t < SC.title.start ? 1 : 0), pulseOf(t, CGRP_BEATS, 5) * .45, t > T_CROSS && t < T_CROSS + 1.2 ? (1 - (t - T_CROSS) / 1.2) * .6 : 0);
  if (red > 0) { const rg = g.createRadialGradient(540, 960, 200, 540, 960, 1250); rg.addColorStop(0, 'rgba(255,40,80,0)'); rg.addColorStop(1, `rgba(255,40,80,${red * .35})`); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  for (const p of STARS) { const y = ((p.y - p.v * t) % H + H) % H; g.globalAlpha = .2 + .35 * Math.sin(t * 1.3 + p.ph) ** 2; g.fillStyle = '#9fb4ff'; g.beginPath(); g.arc(p.x, y, p.s, 0, 6.283); g.fill(); }
  g.globalAlpha = 1;
}
function header(t) {
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(60, 70, 960, 6);
  g.fillStyle = C.cyan; g.shadowColor = C.cyan; g.shadowBlur = 12; g.fillRect(60, 70, 960 * clamp(t / TOTAL), 6); g.shadowBlur = 0;
  txt(g, '一分钟看懂 · 偏头痛', 60, 128, { size: 34, w: 700, align: 'left', color: 'rgba(230,236,255,0.8)' });
  ORDER.forEach(n => { const s = SC[n]; const a = Math.min(fade(t, s.start, .3), 1 - P(t, s.end - .2, s.end)); if (a > 0) txt(g, CHAPTER[n], 1020, 128, { size: 34, w: 900, align: 'right', a, color: C.cyan }); });
}
function wrap(c, s, maxW) {
  if (c.measureText(s).width <= maxW) return [s];
  const mid = s.length / 2; let best = -1, bd = 1e9;
  for (let i = 1; i < s.length - 1; i++) if ('，、：,'.includes(s[i])) { const d = Math.abs(i + 1 - mid); if (d < bd) { bd = d; best = i + 1; } }
  if (best < 0) best = Math.round(mid);
  return [s.slice(0, best).replace(/[，、]$/, ''), s.slice(best)];
}
function subtitle(t) {
  if (t > T_CARD - .1) return;
  let cur = null; LN.forEach(l => l.subs.forEach(s => { if (t >= s[0] - .05 && t < s[1] + .2) cur = s; }));
  if (!cur) return;
  const a = clamp(Math.min((t - cur[0] + .05) / .12, (cur[1] + .2 - t) / .15));
  g.save(); g.font = F(46, 700); const lines = wrap(g, cur[2], 900); const lh = 64, y0 = 1625 - (lines.length - 1) * lh / 2;
  const w = Math.max(...lines.map(s => g.measureText(s).width)) + 70, h = lines.length * lh + 34;
  g.globalAlpha = a; g.fillStyle = 'rgba(4,7,20,0.72)'; g.beginPath(); g.roundRect(540 - w / 2, y0 - lh / 2 - 17, w, h, 22); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((s, i) => g.fillText(s, 540, y0 + i * lh + 2));
  g.restore();
}
const LAYER = document.createElement('canvas'); LAYER.width = W; LAYER.height = H; const lc = LAYER.getContext('2d');
window.render = function (t) {
  bg(t);
  const shake = pulseOf(t, CGRP_BEATS, 9) * 7 + (t < SC.title.start ? pulseOf(t, HOOK_BEATS, 9) * 4 : 0) + (t > T_CROSS && t < T_CROSS + .4 ? (1 - (t - T_CROSS) / .4) * 10 : 0);
  ORDER.forEach((n, k) => {
    const s = SC[n]; const fi = k ? P(t, s.start - .2, s.start + .25) : 1, fo = k < ORDER.length - 1 ? 1 - P(t, s.end - .2, s.end + .2) : 1;
    const a = Math.min(fi, fo); if (a <= 0) return;
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, W, H); lc.globalAlpha = 1;
    S[n](lc, t);
    const z = 1 + .035 * (1 - eo(fi)) - .015 * (1 - fo);
    g.save(); g.globalAlpha = a; g.translate(540 + Math.sin(t * 61) * shake, 960 + Math.cos(t * 47) * shake); g.scale(z, z); g.drawImage(LAYER, -540, -960); g.restore();
  });
  header(t); subtitle(t);
};
window.EVENTS = {
  total: TOTAL, hookBeats: HOOK_BEATS, cgrpBeats: CGRP_BEATS, cross: T_CROSS, card: T_CARD, block: T_BLOCK,
  scenes: ORDER.map(n => SC[n].start).slice(1),
  pops: [at(1, '半边头'), at(1, '一跳'), at(1, '怕光'), at(1, '怕吵'), at(1, '想吐'), at(3, '睡不好'), at(3, '压力大'), at(3, '激素波动'), at(7, '光更'), at(7, '声音'), at(7, '连梳头')].map(x => x - .15),
};
