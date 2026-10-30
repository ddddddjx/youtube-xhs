/* 《错过》后半段（第 14–37 句 + 片尾）。共用的道具和场景从 film.js 的 window.FOMO 拿。
 * 事实：Festinger 1954 社会比较；Kahneman & Tversky 1979 / 1992 损失厌恶（常见估计 1.5–2.5 倍）；
 *   Przybylski, Murayama, DeHaan, Gladwell 2013（第一个 FoMO 量表，10 题；开车看消息出自埃塞克斯大学同年新闻稿，示意）；
 *   McGinnis 2004 Harbus 让 FOMO 这个词流行。窗数、仪表读数、曲线、城市都是示意。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rng } = VK;
const K = VKit, P = K.PAL.flat;
const CH = (window.CH = window.CH || {});
const F = () => window.FOMO;
const S = { ruler: 56.4, coin: 66.0, scale: 79.2, tags: 83.4, street: 88.0, city: 93.0, survey: 97.6, car: 102.8, fomo: 111.3, chart: 120.4, card2: 124.8, room2: 128.6, steps: 133.8, table2: 140.4, wide2: 144.5, back: 152.6, end: 157.4, refs: 163.8, fin: 168.6 };
CH.S = S;
const BG = (fr, c) => { const x = fr.x; x.fillStyle = c; x.fillRect(0, 0, W, H); };
const note = (fr, s, a, y = 64) => fr.text(s, W - 80, y, { font: 'sansm', size: 26, color: P.dim, align: 'r', a });

/* ---------- 14–15：回到两栋楼。一把金色卷尺从对面的窗量到你的窗；对面每扇窗挂上红色「−」 ----------
 * 这是什么：两栋楼 + 一把卷尺 / 在干什么：拿别人的窗量你的窗；没去的窗被记成亏损 / 明白什么：比较是本能，错过记成损失 */
CH.ruler = function (fr, t) {
  const cam = { s: .92, fx: 1000, fy: 560 };
  const k = ss(t, 57.4, 59.4);
  F().towers(fr, t, cam, {
    tag: i => ss(t, 62.6 + (i * 7 % 40) * .045, 62.9 + (i * 7 % 40) * .045),
    extra: f => { if (k <= 0) return; const x0 = 1250, y0 = 560, x1 = 300, y1 = 680, xe = lerp(x0, x1, E.io3(k)), ye = lerp(y0, y1, E.io3(k));
      f.line(x0, y0, xe, ye, { color: '#E9B44A', w: 22, cap: 'butt' });
      const n = Math.floor(Math.hypot(xe - x0, ye - y0) / 30); for (let j = 1; j <= n; j++) { const q = j * 30 / Math.hypot(x1 - x0, y1 - y0), px = lerp(x0, x1, q), py = lerp(y0, y1, q); f.line(px, py - 11, px, py - (j % 5 ? 2 : -6), { color: '#6A4A20', w: 2 }); }
      f.rect(x0 - 26, y0 - 34, 60, 68, { r: 12, fill: '#C9902E' }); f.circle(x0 + 4, y0, 14, { fill: '#8A6020' }); }
  });
  note(fr, 'Festinger, 1954 · 社会比较', ss(t, 57.8, 58.4) * (1 - ss(t, 61.3, 61.8)));
};

/* ---------- 16–19：茶几上一枚硬币、两摞钱；再换成一架天平 ----------
 * 这是什么：一枚旋转的硬币、两摞百元钞 / 在干什么：右边一张张往上摞，到 150–250 才点头 / 明白什么：输的分量比赢的重 */
function bills(fr, x, y, n, tint, a = 1, lab = '100') {                 // 一摞钱，n 张（每张 100）
  for (let i = 0; i < n; i++) { const yy = y - i * 40; fr.rect(x - 190, yy - 52, 380, 52, { r: 6, fill: tint, a }); fr.rect(x - 190, yy - 52, 380, 52, { r: 6, color: '#3E5A38', w: 3, a: .6 * a }); fr.circle(x, yy - 26, 16, { color: '#3E5A38', w: 3, a: .6 * a }); fr.text(lab, x + 130, yy - 24, { font: 'latinm', size: 30, color: '#2E4428', a: .8 * a }); }
}
function coin(fr, x, y, r, t, spin) {
  const sx = spin ? Math.abs(Math.cos(t * 7)) * .9 + .1 : 1;
  fr.ellipse(x, y + r * 1.05, r * .9, r * .18, { fill: '#000', a: .3 });
  fr.g({ at: [x, y], s: [sx, 1] }, () => { fr.circle(0, 0, r, { fill: '#D9A441' }); fr.circle(0, 0, r * .82, { color: '#9C7426', w: 4 }); fr.text('¥', 0, 4, { font: 'sansh', size: r * .9, color: '#8A6420' }); });
}
CH.coin = function (fr, t) {
  BG(fr, '#5A3E30'); for (let i = 0; i < 9; i++) fr.rect(0, 120 * i + 30, W, 3, { fill: '#4A3226', a: .6 });
  coin(fr, 960, 430, 130, t, t < 75.3);
  /* 左：输了，你给我 100 */
  const aL = ss(t, 66.6, 67.2);
  fr.text('输了', 520, 250, { font: 'sansh', size: 46, color: P.ink, a: aL }); fr.text('你给我', 520, 304, { font: 'sansm', size: 30, color: P.dim, a: aL });
  bills(fr, 520, 700, 1, '#9FC58E', aL); fr.text('−100', 520, 780, { font: 'sansh', size: 56, color: P.red, a: aL });
  /* 右：赢了，我给你多少？——第 18 句一张张摞到 250 */
  const aR = ss(t, 71.0, 71.6), grow = K.track([[75.5, 1], [76.5, 1.5], [77.2, 1.5], [77.9, 2], [78.4, 2.5], [79.2, 2.5]], t), n = t < 75.5 ? 0 : Math.round(grow * 2) / 2;
  fr.text('赢了', 1400, 250, { font: 'sansh', size: 46, color: P.ink, a: aR }); fr.text('我给你', 1400, 304, { font: 'sansm', size: 30, color: P.dim, a: aR });
  if (n > 0) bills(fr, 1400, 700, Math.round(n * 2), '#C9DDB0', aR, '50');
  fr.text(n > 0 ? '+' + Math.round(n * 100) : '+ ?', 1400, 780, { font: 'sansh', size: 56, color: n > 0 ? P.gold : P.dim, a: aR });
  const ok = ss(t, 77.0, 77.4);
  if (ok > 0) { fr.text('✓ 才肯赌', 1640, 560, { font: 'sansh', size: 40, color: P.gold, align: 'l', a: ok }); }
  note(fr, 'Kahneman & Tversky · 损失厌恶 · 常见估计 1.5–2.5 倍', ss(t, 75.6, 76.2));
};
CH.scale = function (fr, t) {
  BG(fr, '#5A3E30'); for (let i = 0; i < 9; i++) fr.rect(0, 120 * i + 30, W, 3, { fill: '#4A3226', a: .6 });
  const tilt = .26 * E.out3(ss(t, 80.0, 81.4)) + .015 * Math.sin(t * 2.2) * ss(t, 81.4, 82);
  const cx = 960, cy = 300, arm = 460;
  fr.rect(cx - 16, cy, 32, 470, { fill: '#2E2622' }); fr.rect(cx - 160, 770, 320, 26, { r: 8, fill: '#2E2622' });
  fr.g({ at: [cx, cy], rot: tilt }, () => { fr.rect(-arm, -10, arm * 2, 20, { r: 10, fill: '#3A302A' }); fr.circle(0, 0, 26, { fill: '#C9A050' }); });
  [[-1, '捡到', '#9FC58E'], [1, '丢了', '#D98A7A']].forEach(([sd, lab, col]) => {
    const px = cx + Math.cos(tilt) * arm * sd, py = cy + Math.sin(tilt) * arm * sd;
    fr.line(px, py, px - 110, py + 200, { color: '#3A302A', w: 3 }); fr.line(px, py, px + 110, py + 200, { color: '#3A302A', w: 3 });
    fr.path(`M ${px - 150},${py + 200} L ${px + 150},${py + 200} Q ${px},${py + 270} ${px - 150},${py + 200} Z`, { fill: '#4A3E36' });
    bills(fr, px, py + 196, 1, col);
    fr.text(lab + ' 100', px, py + 320, { font: 'sansh', size: 40, color: sd > 0 ? P.red : P.ink });
  });
};

/* ---------- 20：回到两栋楼，红牌全亮，仪表冲上去 ---------- */
CH.tags = function (fr, t) {
  F().towers(fr, t, { s: .92, fx: 1000, fy: 560 }, { tag: () => 1, extra: f => { const p = .5 + .5 * Math.sin(t * 6); if (t > 84) for (let i = 0; i < 40; i++) { const c = i % 8, r = Math.floor(i / 8); f.glow(880 + c * 124 + 72, 180 + r * 150 + 6, 40, P.red, .18 * p); } } });
};

/* ---------- 21–22：一条老街只亮三扇窗 → 镜头拉远，整座城的窗都亮着 ----------
 * 这是什么：老街的几栋矮房子 / 整座城的楼 / 在干什么：亮着的窗从 3 扇变成数不清 / 明白什么：手机把能看见的别处放大了 */
function street(fr, a) {
  fr.g({ a }, () => {
    fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, '#2B2440', 1], [1, '#4A3A44', 1]]) });
    fr.rect(0, 760, W, 320, { fill: '#2A2230' });
    [[260, 360], [620, 300], [980, 380], [1340, 320], [1700, 360]].forEach(([x, w], k) => {
      const top = 760 - w * .9; fr.rect(x - w / 2, top, w, w * .9, { fill: ['#5E4A4A', '#6A5248', '#56464E', '#64504A', '#5A4850'][k] });
      fr.path(`M ${x - w / 2 - 20},${top} L ${x},${top - 110} L ${x + w / 2 + 20},${top} Z`, { fill: '#3E3036' });
      for (let j = 0; j < 2; j++) { const on = (k === 1 && j === 0) || (k === 2 && j === 1) || (k === 4 && j === 0); fr.rect(x - 90 + j * 110, top + 70, 70, 84, { fill: on ? C().winOn : '#3A3040' }); if (on) fr.glow(x - 55 + j * 110, top + 112, 110, C().winOn, .35); }
    });
  });
}
const C = () => F().C;
function city(fr, a, t) {
  if (a <= 0) return; const r = rng(77);
  fr.g({ a }, () => {
    fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, '#0E1028', 1], [1, '#2A2240', 1]]) });
    for (let layer = 0; layer < 3; layer++) {
      const base = 560 + layer * 130, sc = .5 + layer * .25;
      for (let x = -40; x < W + 40;) {
        const w = (60 + r() * 90) * sc, h = (180 + r() * 380) * sc; fr.rect(x, base - h, w, h + 300, { fill: ['#1E1E34', '#242440', '#2C2A48'][layer] });
        for (let yy = base - h + 12 * sc; yy < Math.min(base + 240, 830); yy += 26 * sc) for (let xx = x + 8 * sc; xx < x + w - 12 * sc; xx += 20 * sc) if (hash(xx * 1.3 + yy * .7) > .35) fr.rect(xx, yy, 10 * sc, 13 * sc, { fill: C().winOn, a: .55 + .4 * Math.sin(t * 1.3 + xx) * .3 });
        x += w + 6 * sc;
      }
    }
  });
}
CH.street = function (fr, t) {
  const k = ss(t, 93.3, 95.6);
  if (k < 1) fr.g({ at: [960, 760], s: lerp(1, .18, E.io3(k)) }, () => fr.g({ at: [-960, -760] }, () => street(fr, 1)));
  city(fr, ss(t, 93.6, 95.2), t);
  if (k > .6) fr.g({ at: [960, 760], s: .18 }, () => fr.g({ at: [-960, -760] }, () => street(fr, 1)));
  const a1 = ss(t, 88.6, 89.2) * (1 - ss(t, 93.0, 93.4)), a2 = ss(t, 95.0, 95.6);
  fr.text('3', 960, 150, { font: 'sansh', size: 90, color: P.ink, a: a1 }); fr.text('亮着的窗（示意）', 960, 216, { font: 'sansm', size: 28, color: P.dim, a: a1 });
  fr.text('整座城', 960, 150, { font: 'sansh', size: 80, color: P.ink, a: a2 }); fr.text('一直对着你亮（示意）', 960, 216, { font: 'sansm', size: 28, color: P.dim, a: a2 });
};

/* ---------- 23–25：一张问卷，十道题一格格打勾 → 夜里开车，手机亮着 ---------- */
CH.survey = function (fr, t) {
  BG(fr, '#5A3E30'); for (let i = 0; i < 9; i++) fr.rect(0, 120 * i + 30, W, 3, { fill: '#4A3226', a: .6 });
  const a = ss(t, 97.8, 98.4);
  fr.g({ a, at: [960, 430 + (1 - a) * 40], rot: -.02 }, () => {
    fr.rect(-470, -380, 940, 760, { r: 8, fill: '#000', a: .3 }); fr.rect(-480, -392, 940, 760, { r: 8, fill: '#F4EEE2' });
    fr.text('FoMO 量表', -440, -330, { font: 'sansh', size: 40, color: '#3A2A22', align: 'l' }); fr.text('Przybylski 等，2013', 420, -330, { font: 'sansm', size: 24, color: '#7A6550', align: 'r' });
    const Q = ['担心别人过得比我精彩', '朋友玩得开心而我不在，会难受', '错过聚会会让我不安', '想把自己的事随时分享出去', '没跟上朋友的梗会焦虑'];
    Q.forEach((q, i) => {
      const y = -250 + i * 120; fr.text(`${i + 1}. ${q}`, -440, y, { font: 'sansm', size: 28, color: '#3A2A22', align: 'l' });
      for (let j = 0; j < 5; j++) { const bx = -440 + j * 70, by = y + 26; fr.rect(bx, by, 40, 40, { r: 6, color: '#8A7560', w: 2.5 }); const pick = 3 + (i % 2), k = ss(t, 98.8 + i * .5, 99.1 + i * .5); if (j === pick && k > 0) fr.path(`M ${bx + 8},${by + 20} L ${bx + 17},${by + 30} L ${bx + 34},${by + 8}`, { color: P.red, w: 5, a: k, cap: 'round' }); }
    });
    fr.text('…… 共 10 题', 420, 330, { font: 'sansm', size: 24, color: '#7A6550', align: 'r' });
  });
};
CH.car = function (fr, t) {
  BG(fr, '#0C0E1C');
  /* 挡风玻璃外：夜路，两条车道线往远处跑 */
  fr.rect(0, 0, W, 520, { fill: fr.grad(0, 0, 0, 520, [[0, '#121634', 1], [1, '#2A2C4A', 1]]) });
  fr.path('M 760,520 L 1160,520 L 1700,820 L 220,820 Z', { fill: '#1A1A26' });
  for (let i = 0; i < 6; i++) { const q = ((t * .9 + i / 6) % 1), y = lerp(530, 820, q * q), w = lerp(4, 26, q); fr.rect(960 - w / 2, y, w, lerp(10, 60, q * q), { fill: '#D8D0B0', a: .7 }); }
  fr.glow(1500, 470, 60, '#FFD58A', .6); fr.glow(1540, 470, 60, '#FFD58A', .6);
  /* 车里：仪表台、方向盘、握方向盘的手 */
  fr.rect(0, 560, W, 300, { fill: '#121018' });
  fr.circle(700, 760, 230, { color: '#2A2632', w: 42 }); fr.line(700, 760, 520, 820, { color: '#2A2632', w: 30 }); fr.line(700, 760, 880, 820, { color: '#2A2632', w: 30 });
  fr.ellipse(520, 610, 54, 40, { fill: '#2C2430' }); fr.ellipse(880, 610, 54, 40, { fill: '#2C2430' });
  /* 支架上的手机亮着，消息一条条进来 */
  const lit = .85 + .15 * Math.sin(t * 5);
  F().phone(fr, 1250, 640, 170, 290, lit, (f, w, h) => { f.rect(-w / 2, -h / 2, w, h, { fill: '#1E2238' }); for (let i = 0; i < 3; i++) { const k = ss(t, 103.4 + i * .9, 103.8 + i * .9); f.rect(-w / 2 + 12, -h / 2 + 20 + i * 76, w - 24, 62, { r: 10, fill: '#F2EFE6', a: k }); } });
  fr.glow(1250, 640, 260, '#BFD4FF', .25);
  note(fr, '同一研究 · 示意', ss(t, 103.4, 104));
};

/* ---------- 26–27：红色大字 FOMO，前面出现过的道具围在四周 ---------- */
CH.fomo = function (fr, t) {
  BG(fr, '#14101A');
  const a = ss(t, 112.1, 112.8), fade = 1 - .7 * ss(t, 116.4, 118);
  fr.text('FOMO', 960, 470, { font: 'sansh', size: 260, track: 30, color: P.red, a: a * fade, glow: 30, glowColor: P.red, glowA: .35 });
  fr.text('Fear of Missing Out · 害怕错过', 960, 640, { font: 'sansm', size: 40, track: 4, color: P.ink, a: ss(t, 112.9, 113.5) * fade });
  const pa = ss(t, 113.4, 114.2) * (1 - ss(t, 116.2, 117));
  if (pa > 0) {
    fr.g({ at: [330, 250], s: .9, a: pa }, () => { fr.rect(-60, -70, 120, 140, { fill: C().winOn }); fr.rect(-60, -70, 120, 140, { color: '#2A2838', w: 10 }); fr.rect(14, -86, 50, 36, { r: 6, fill: P.red }); fr.text('−', 39, -68, { font: 'sansh', size: 30, color: '#fff' }); });
    fr.g({ a: pa }, () => coin(fr, 1600, 260, 70, t, false));
    fr.g({ at: [330, 700], a: pa }, () => { fr.line(-90, 0, 90, 30, { color: '#C9A050', w: 10 }); fr.line(0, 10, 0, 120, { color: '#C9A050', w: 10 }); fr.rect(-110, 30, 60, 14, { fill: '#9FC58E' }); fr.rect(60, 60, 60, 14, { fill: '#D98A7A' }); });
    F().phone(fr, 1600, 700, 90, 150, .9, (f, w, h) => f.rect(-w / 2, -h / 2, w, h, { fill: '#F2C45A' }), .2);
  }
  note(fr, '2004 年因 McGinnis 的文章流行起来', ss(t, 113.2, 113.8) * fade);
};

/* ---------- 28–29：一张图：看过的窗越多，错过感越高 ---------- */
CH.chart = function (fr, t) {
  BG(fr, '#1C1824');
  const x0 = 360, y0 = 760, x1 = 1600, y1 = 170, a = ss(t, 120.5, 121.0);
  fr.line(x0, y0, x1, y0, { color: P.dim, w: 3, a }); fr.line(x0, y0, x0, y1, { color: P.dim, w: 3, a });
  fr.text('看过的窗（示意）', x1, y0 + 50, { font: 'sansm', size: 30, color: P.dim, align: 'r', a }); fr.text('错过感', x0 - 20, y1 - 10, { font: 'sansm', size: 30, color: P.dim, align: 'r', a });
  const pts = []; for (let i = 0; i <= 60; i++) { const q = i / 60; pts.push([lerp(x0, x1 + 120, q), y0 - (y0 - y1 + 140) * Math.pow(q, 1.5)]); }
  const k = ss(t, 121.0, 123.8); fr.poly(pts, { color: P.ink, w: 6, k, a });
  const red = pts.filter(p => p[1] < y1); if (k > .85 && red.length) fr.poly([pts[pts.length - red.length - 1], ...red], { color: P.red, w: 8, k: ss(t, 123.2, 123.8) });
  const M = [[.1, '老街 3 扇', 121.4], [.45, '对面楼 40 扇', 122.3], [.86, '整座城', 123.2]];
  M.forEach(([q, lab, at]) => { const p = pts[Math.round(q * 60)], m = ss(t, at, at + .4); fr.circle(p[0], p[1], 14, { fill: q > .8 ? P.red : P.gold, a: m }); fr.text(lab, p[0] + (q > .8 ? -24 : 24), p[1] + (q > .8 ? -36 : 40), { font: 'sansm', size: 32, color: q > .8 ? P.red : P.ink, align: q > .8 ? 'r' : 'l', a: m }); });
};
CH.card2 = function (fr, t) {
  BG(fr, '#1C1824');
  const a = ss(t, 124.9, 125.4);
  fr.g({ a, at: [960, 430 + (1 - a) * 30], rot: -.017 }, () => {
    fr.rect(-540, -220, 1080, 440, { r: 6, fill: '#000', a: .35 }); fr.rect(-550, -232, 1080, 440, { r: 6, fill: P.paper });
    for (let i = 0; i < 6; i++) fr.line(-510, -170 + i * 60, 490, -170 + i * 60, { color: '#B9AE98', w: 1.5, a: .6 });
    [3, 12, 40].forEach((n, k) => { const cx = -350 + k * 350; for (let i = 0; i < n; i++) fr.rect(cx - 140 + (i % 8) * 36, -180 + Math.floor(i / 8) * 40, 26, 30, { fill: '#E9B44A' }); fr.text(`看 ${n} 扇`, cx, 70, { font: 'sansh', size: 44, color: '#4A3428' }); fr.text(`错过 ${n} 扇`, cx, 140, { font: 'sansh', size: 50, color: '#B8402A' }); });
  });
};

/* ---------- 30–35：回到客厅 → 三步 → 回到两栋楼 ---------- */
const STEPS = ['拉上窗帘', '回到屋里', '只在一个房间'];
function stepBar(fr, t) {
  const a = ss(t, 134.0, 134.6) * (1 - ss(t, 151.0, 151.6)); if (a <= 0) return;
  const on = [ss(t, 136.4, 136.9), ss(t, 140.6, 141.1), ss(t, 144.7, 145.2)];
  STEPS.forEach((s, i) => { const x = 760 + i * 380, y = 60; fr.rect(x - 170, y, 340, 70, { r: 35, fill: '#14101A', a: .8 * a }); fr.rect(x - 170, y, 340, 70, { r: 35, color: on[i] > .5 ? P.gold : '#6A6070', w: 3, a }); fr.text(`${i + 1}  ${s}`, x, y + 37, { font: 'sansh', size: 32, color: on[i] > .5 ? P.gold : P.dim, a }); });
}
CH.room2 = function (fr, t) {                               // 30–32：你在窗外；三步；拉上窗帘
  const curtain = ss(t, 137.0, 139.4), grey = .45 * (1 - curtain);
  const s = lerp(1.0, 1.08, seg(t, S.room2, S.table2));
  fr.g({ at: [960, 540], s }, () => fr.g({ at: [-960, -540] }, () => F().room(fr, t, { steam: 0, grey, phoneLit: .9 * (1 - ss(t, 138.0, 139.0)), curtain })));
  if (grey > 0) { const x = fr.x; x.save(); x.globalCompositeOperation = 'saturation'; x.fillStyle = `rgba(128,128,128,${grey * .85})`; x.fillRect(0, 0, W, H); x.restore(); }
  stepBar(fr, t);
};
CH.table2 = function (fr, t) {                              // 33：回到屋里，书翻开，筷子夹起面
  BG(fr, F().C.table); for (let i = 0; i < 9; i++) fr.rect(0, 120 * i + 30, W, 3, { fill: F().C.table2, a: .5 });
  F().bowl(fr, 640, 600, 2.1, t, ss(t, 141.4, 143.0) * .6);
  fr.g({ at: [1380, 640], s: 1.7 }, () => F().book(fr, 0, 0, 1));
  const lift = E.io3(seg(t, 141.0, 142.6)); fr.g({ at: [640, 560 - lift * 120] }, () => { for (let i = 0; i < 5; i++) fr.path(`M ${-30 + i * 12},0 q 6,${60 + i * 6} 0,${120 + i * 10}`, { color: F().C.noodle, w: 7, a: lift }); });
  stepBar(fr, t);
};
CH.wide2 = function (fr, t) {                               // 34–35：对面的窗一扇扇暗下去，只剩你这扇；你的窗暖起来
  const pushK = E.in2(seg(t, 150.8, S.back)), s = Math.exp(lerp(Math.log(.92), Math.log(4.2), pushK));
  const fx = lerp(560, 281, pushK), fy = lerp(560, 678, pushK);
  F().towers(fr, t, { s, fx, fy }, { off: i => ss(t, 144.9 + (i * 13 % 40) * .05, 145.3 + (i * 13 % 40) * .05), mineGlow: 1 + 1.4 * ss(t, 147.8, 149.6) });
  stepBar(fr, t);
};
CH.back = function (fr, t) {                                // 36：回到第一镜，面又冒起热气
  const s = lerp(1.05, 1.0, E.io3(seg(t, S.back, S.back + 3)));
  fr.g({ at: [960, 540], s }, () => fr.g({ at: [-960, -540] }, () => F().room(fr, t, { steam: ss(t, 153.4, 155.0), curtain: 0 })));
  fr.text('周五 22:00', 1780, 90, { font: 'sansh', size: 40, color: P.gold, align: 'r', a: ss(t, 153.2, 153.8) });
};

/* ---------- 37 + 片尾 ---------- */
CH.end = function (fr, t) {
  BG(fr, '#14101A');
  const a = ss(t, 157.6, 158.2);
  fr.g({ a, at: [960, 420], rot: -.015 }, () => {
    fr.rect(-520, -200, 1040, 400, { r: 6, fill: '#000', a: .35 }); fr.rect(-530, -212, 1040, 400, { r: 6, fill: P.paper });
    fr.text('你永远在错过；', 0, -60, { font: 'sansh', size: 64, color: '#4A3428' }); fr.text('你能过的，只有这一个晚上。', 0, 40, { font: 'sansh', size: 64, color: '#B8822A' });
    fr.rect(-30, 110, 60, 70, { fill: '#F4D48A' }); fr.rect(-30, 110, 60, 70, { color: '#4A3428', w: 5 }); fr.line(0, 110, 0, 180, { color: '#4A3428', w: 3 });
  });
};
CH.refs = function (fr, t) {
  BG(fr, '#100C14');
  const lt = t - S.refs;
  if (lt > 0) K.titleGilt(fr, lt + 1.6, { cy: 330, size: 140, track: 30, rays: .5, tagDy: 150, la: 'FEAR OF MISSING OUT', zh: '错过', tag: '为什么别人的晚上，总比你的好看', specks: .4, a: 1 - ss(t, S.fin - .8, S.fin) });
  const R = ['Przybylski, Murayama, DeHaan & Gladwell (2013). Computers in Human Behavior 29(4)', 'Kahneman & Tversky (1979). Prospect Theory. Econometrica', 'Festinger (1954). A Theory of Social Comparison Processes', 'McGinnis (2004). Social Theory at HBS: McGinnis’ Two FOs. The Harbus'];
  R.forEach((r, i) => fr.text(r, 960, 640 + i * 46, { font: 'latin', size: 28, color: P.mute, a: ss(t, S.refs + .8 + i * .2, S.refs + 1.3 + i * .2) * (1 - ss(t, S.fin - .8, S.fin)) }));
  fr.text('文献线索 · 图中数量与读数为示意', 960, 600, { font: 'sansm', size: 24, color: P.dim, a: ss(t, S.refs + .6, S.refs + 1.1) * (1 - ss(t, S.fin - .8, S.fin)) });
};
})();
