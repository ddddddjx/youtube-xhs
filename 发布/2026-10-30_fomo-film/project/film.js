/* 《错过》FOMO · B 寓言 · 分镜表见 ../storyboard.md
 * 全片的形象：窗。你在一扇亮着的窗里；手机把对面整栋楼的窗都点亮。那把尺子：左上角「错过感」仪表（示意）。
 * 事实（10-30 核对）：Przybylski 等 2013 Computers in Human Behavior 29(4)；Kahneman & Tversky 1979 / 1992 损失厌恶 1.5–2.5 倍；
 *   Festinger 1954 社会比较；McGinnis 2004 Harbus。窗的数量、仪表读数、时间轴格子是示意。
 * 颜色：金 = 规则 / 答案；红 = 被放大的东西（仪表超标、亏损牌、FOMO）。
 * 这一版先做到第 13 句（规则卡），给用户看 30 秒样片和最难那一镜。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, hash, rng, rgba } = VK;
const K = VKit, P = K.PAL.flat;

const T = { h2: 4.0, h3: 11.4, title: 22.6, titleIn: 23.2, w1: 34.6, w2: 38.4, w3: 42.2, tl: 46.2, card: 57.4, end: 62.0 };
const SUBS = [
  { a: .4,   b: 3.6,  zh: '周五晚上十点，你窝在沙发上。' },
  { a: 4.2,  b: 7.4,  zh: '手机亮了：朋友们在天台聚会。' },
  { a: 7.9,  b: 11.1, zh: '又亮一下：同事在海边看日落。' },
  { a: 11.7, b: 14.8, zh: '面还是那碗面，书还是那本书。' },
  { a: 15.2, b: 18.5, zh: '可这个晚上，突然{!不香了}。' },
  { a: 19.0, b: 22.3, zh: '什么都没少，为什么像丢了东西？' },
  { a: 35.0, b: 38.1, zh: '你只能待在一个房间里。' },
  { a: 38.7, b: 41.9, zh: '手机却给你打开了四十扇窗。' },
  { a: 42.5, b: 45.9, zh: '每扇窗里，都是别人最好的那一刻。' },
  { a: 46.6, b: 49.7, zh: '你拿来比的，是自己一整个晚上，' },
  { a: 50.1, b: 53.0, zh: '连洗碗和发呆也算进去。' },
  { a: 53.4, b: 56.9, zh: '别人的窗里，只放剪出来的那三秒。' },
  { a: 57.9, b: 61.6, zh: '你在拿自己的{全片}，比别人的预告片。' },
];

/* ---------- 色 ---------- */
const C = {
  wall: '#3A3350', wall2: '#2C2740', floor: '#4A3A3A', lamp: '#FFD9A0', sofa: '#9A5B4B', sofa2: '#7E4639', skin: '#1F1A26', hair: '#16121C',
  table: '#6A4A38', table2: '#4F3628', bowl: '#EFE8DA', noodle: '#E9C27A', book: '#C9473A', page: '#F4EAD6', phone: '#16141C',
  sky: '#161A30', sky2: '#2A2546', bldg: '#2B2A3C', bldg2: '#232233', winOff: '#3B3954', winOn: '#FFD58A', red: P.red, gold: P.gold,
};

/* 错过感读数（示意）：钩子里随手机涨；屋里不变，只有它在变 */
const MISS = [[0, 20], [4.3, 20], [5.3, 70], [8.1, 72], [9.1, 98], [13.5, 99], [15.6, 128], [22.6, 128]];
const missAt = t => K.track(MISS, t);

/* ---------- 道具 ---------- */
/* 一碗面：碗、面、筷子、热气。steam 0..1 */
function bowl(fr, x, y, s, t, steam) {
  fr.g({ at: [x, y], s }, () => {
    fr.ellipse(0, 46, 120, 16, { fill: '#000', a: .25 });
    fr.path('M -110,-6 Q -100,62 0,64 Q 100,62 110,-6 Z', { fill: C.bowl });
    fr.path('M -110,-6 Q -100,62 0,64 Q 100,62 110,-6 Z', { fill: '#C9BFA9', a: .35 });
    fr.rect(-80, 18, 160, 6, { r: 3, fill: '#5E8BB0', a: .8 });
    fr.ellipse(0, -6, 110, 22, { fill: '#F6F0E4' });
    fr.ellipse(0, -4, 96, 16, { fill: '#C98A4A' });
    for (let i = 0; i < 7; i++) fr.path(`M ${-70 + i * 22},-8 q 10,-10 20,0 t 20,0`, { color: C.noodle, w: 5, cap: 'round' });
    fr.circle(36, -10, 15, { fill: '#F7F2E6' }); fr.circle(36, -10, 7, { fill: '#F2B33A' });
    fr.line(-30, -96, 70, 6, { color: '#B88A5A', w: 6, cap: 'round' }); fr.line(-14, -102, 80, 2, { color: '#A57A4D', w: 6, cap: 'round' });
    if (steam > 0) for (let i = 0; i < 3; i++) {
      const ph = (t * .45 + i / 3) % 1, sx = -40 + i * 40, a = Math.sin(ph * Math.PI) * steam * .55;
      const pts = []; for (let k = 0; k <= 14; k++) { const yy = -20 - k * 9 - ph * 50; pts.push([sx + Math.sin(k * .55 + t * 2 + i) * 10, yy]); }
      fr.poly(pts, { color: '#FFF6E6', w: 7, a, cap: 'round' });
    }
  });
}
/* 一本摊开的书 */
function book(fr, x, y, s) {
  fr.g({ at: [x, y], s }, () => {
    fr.path('M -150,10 L 0,24 L 150,10 L 150,-60 L 0,-46 L -150,-60 Z', { fill: C.book });
    fr.path('M -140,0 L 0,14 L 0,-50 L -140,-64 Z', { fill: C.page }); fr.path('M 140,0 L 0,14 L 0,-50 L 140,-64 Z', { fill: '#EADFC8' });
    for (let i = 0; i < 5; i++) { fr.line(-120, -48 + i * 9, -20, -36 + i * 9, { color: '#B5A88E', w: 2 }); fr.line(20, -36 + i * 9, 120, -48 + i * 9, { color: '#B5A88E', w: 2 }); }
  });
}
/* 一部手机，平放或立着。lit 0..1 屏幕亮度；pic(fr, w, h) 在屏里画内容 */
function phone(fr, x, y, w, h, lit, pic, rot = 0) {
  fr.g({ at: [x, y], rot }, () => {
    fr.rect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, { r: 22, fill: C.phone });
    fr.rect(-w / 2, -h / 2, w, h, { r: 14, fill: '#0E0D14' });
    if (lit > 0) fr.g({ a: lit, clip: [-w / 2, -h / 2, w, h] }, () => { if (pic) pic(fr, w, h); });
    if (lit > 0) fr.glow(0, 0, Math.max(w, h) * .9, '#BFD4FF', .18 * lit);
  });
}
/* 一个剪影小人（背影 / 站姿），用在窗里和屏里。s 尺寸，arm 举手 0..1 */
function person(fr, x, y, s, color, arm = 0) {
  fr.g({ at: [x, y], s }, () => {
    fr.circle(0, -78, 15, { fill: color }); fr.path('M -18,-60 Q 0,-66 18,-60 L 22,-14 L -22,-14 Z', { fill: color });
    fr.rect(-16, -16, 13, 32, { fill: color }); fr.rect(3, -16, 13, 32, { fill: color });
    fr.line(18, -54, 18 + 14 * (1 - arm), -54 - 30 * arm + 34 * (1 - arm), { color, w: 9, cap: 'round' });
    fr.line(-18, -54, -24, -22, { color, w: 9, cap: 'round' });
  });
}
/* 手机屏里的两张照片 */
function picRoof(fr, w, h) {                       // 天台聚会：夜空、一串灯泡、四个人举杯
  fr.rect(-w / 2, -h / 2, w, h, { fill: fr.grad(0, -h / 2, 0, h / 2, [[0, '#2A2F5A', 1], [1, '#5A3F6A', 1]]) });
  const bulbs = []; for (let i = 0; i <= 12; i++) { const xx = -w / 2 + i * w / 12; bulbs.push([xx, -h * .28 + Math.sin(i / 12 * Math.PI) * 40]); }
  fr.poly(bulbs, { color: '#222', w: 2 }); bulbs.forEach(b => { fr.circle(b[0], b[1] + 8, 7, { fill: '#FFD58A' }); fr.glow(b[0], b[1] + 8, 26, '#FFD58A', .5); });
  fr.rect(-w / 2, h * .22, w, h * .3, { fill: '#2A2236' });
  [-.3, -.1, .1, .3].forEach((k, i) => person(fr, k * w, h * .26, 1.15, ['#3A2E4A', '#46365A', '#3A2E4A', '#46365A'][i], 1));
  fr.text('天台 · 22:04', -w / 2 + 18, -h / 2 + 30, { font: 'sansm', size: 22, color: '#FFF4DE', align: 'l' });
}
function picSea(fr, w, h) {                        // 海边日落：大太阳、海平线、一个人的剪影
  fr.rect(-w / 2, -h / 2, w, h, { fill: fr.grad(0, -h / 2, 0, h * .1, [[0, '#F29A5A', 1], [1, '#F6D08A', 1]]) });
  fr.circle(0, h * .06, w * .22, { fill: '#FFF0C0' }); fr.glow(0, h * .06, w * .6, '#FFE0A0', .5);
  fr.rect(-w / 2, h * .1, w, h * .4, { fill: fr.grad(0, h * .1, 0, h / 2, [[0, '#4C6E9A', 1], [1, '#2C3E66', 1]]) });
  for (let i = 0; i < 5; i++) fr.line(-w * .2 + i * 8, h * .14 + i * 12, w * .2 - i * 8, h * .14 + i * 12, { color: '#FFE6B0', w: 3, a: .6 });
  person(fr, -w * .26, h * .44, 1.25, '#1E2236', .4);
  fr.text('海边 · 22:07', -w / 2 + 18, -h / 2 + 30, { font: 'sansm', size: 22, color: '#3A2420', align: 'l' });
}
/* 一条通知横幅，从屏幕上沿滑下 */
function notice(fr, w, h, k, who) {
  if (k <= 0) return; const y = -h / 2 + lerp(-80, 18, E.out3(k));
  fr.rect(-w / 2 + 14, y, w - 28, 70, { r: 16, fill: '#F4F1EA', a: .94 });
  fr.circle(-w / 2 + 52, y + 35, 18, { fill: '#5E8BB0' });
  fr.text(who, -w / 2 + 84, y + 36, { font: 'sansm', size: 22, color: '#2A2632', align: 'l' });
}

/* ---------- 场景：你的客厅（背后看过去） ----------
 * 这是什么：一间夜里的客厅，沙发、茶几、一碗面、一本书、窗外有楼 / 在干什么：你窝在沙发上 / 明白什么：一个普通又舒服的晚上 */
function room(fr, t, o = {}) {
  const x = fr.x;
  x.fillStyle = C.wall; x.fillRect(0, 0, W, H);
  fr.glow(1420, 300, 760, C.lamp, .32 * (1 - (o.grey || 0) * .5));
  /* 窗：对面的楼 */
  fr.g({ at: [200, 0] }, () => {
  fr.rect(260, 110, 640, 430, { fill: C.sky });
  fr.rect(330, 220, 220, 320, { fill: C.bldg }); fr.rect(600, 170, 250, 370, { fill: C.bldg2 });
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { const on = hash(r * 7 + c * 13) > .55; fr.rect(350 + c * 48, 240 + r * 48, 26, 28, { fill: on ? C.winOn : C.winOff, a: on ? .75 : 1 }); }
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const on = hash(r * 5 + c * 11 + 3) > .55; fr.rect(622 + c * 56, 190 + r * 48, 30, 28, { fill: on ? C.winOn : C.winOff, a: on ? .75 : 1 }); }
  fr.rect(250, 100, 660, 450, { color: '#5A5070', w: 20 }); fr.line(580, 110, 580, 540, { color: '#5A5070', w: 12 });
  });
  /* 落地灯 */
  fr.line(1500, 260, 1500, 780, { color: '#2A2436', w: 10 }); fr.path('M 1420,260 L 1580,260 L 1550,170 L 1450,170 Z', { fill: '#F2D49A' }); fr.glow(1500, 230, 260, C.lamp, .5);
  /* 地板、茶几 */
  fr.rect(0, 600, W, 480, { fill: C.floor });
  fr.rect(560, 560, 820, 46, { r: 8, fill: C.table }); fr.rect(600, 606, 30, 120, { fill: C.table2 }); fr.rect(1310, 606, 30, 120, { fill: C.table2 });
  bowl(fr, 760, 520, .9, t, o.steam == null ? 1 : o.steam);
  book(fr, 1060, 548, .8);
  phone(fr, 1250, 552, 80, 130, o.phoneLit || 0, null, -.25);
  /* 沙发靠背和你的背影（前景） */
  fr.rect(380, 690, 1160, 150, { r: 40, fill: C.sofa }); fr.rect(380, 690, 1160, 26, { r: 14, fill: '#B0705E' });
  fr.g({ at: [930, 700] }, () => {
    fr.path('M -120,10 Q -110,-90 0,-96 Q 110,-90 120,10 Z', { fill: C.skin });
    fr.circle(0, -150, 64, { fill: C.hair }); fr.ellipse(-8, -186, 56, 30, { fill: '#221B2C' });
  });
  fr.rect(380, 780, 1160, 60, { fill: C.sofa2 });
}

/* ---------- 钩子 ---------- */
function hook1(fr, t) {                                    // 全景：周五晚上十点，你窝在沙发上
  const s = lerp(1.0, 1.05, E.io3(seg(t, 0, 4)));
  fr.g({ at: [960, 540], s }, () => fr.g({ at: [-960, -540] }, () => room(fr, t, { steam: 1 })));
  fr.text('周五 22:00', 1780, 90, { font: 'sansh', size: 40, color: P.gold, align: 'r', a: ss(t, .5, 1.1) });
}
/* 近景：茶几上的手机亮了，两张照片先后到 —— 屋里的东西在画面边上，都没动 */
function hook2(fr, t) {
  const x = fr.x; x.fillStyle = C.table; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) fr.rect(0, 120 * i + 30, W, 3, { fill: C.table2, a: .5 });
  bowl(fr, 360, 640, 2.0, t, 1);
  fr.g({ at: [1580, 760], s: 1.6 }, () => book(fr, 0, 0, 1));
  const k1 = ss(t, 4.2, 4.7), k2 = ss(t, 8.0, 8.5);
  const pw = 520, ph = 720;
  phone(fr, 1010, 470, pw, ph, Math.max(k1, .0), (fr2, w, h) => {
    picRoof(fr2, w, h); if (k2 > 0) fr2.g({ at: [lerp(w, 0, E.out3(k2)), 0] }, () => picSea(fr2, w, h));
    notice(fr2, w, h, seg(t, 4.2, 4.7) * (1 - ss(t, 6.4, 6.9)), '小林 发了 4 张照片');
    notice(fr2, w, h, seg(t, 8.0, 8.5) * (1 - ss(t, 10.2, 10.7)), '陈姐 分享了一条动态');
  });
  if (t < 4.6) fr.glow(1010, 470, 300 * (1 - seg(t, 4.2, 4.6)), '#FFFFFF', .2 * seg(t, 4.1, 4.2));
}
/* 中景：面还是那碗面，书还是那本书 —— 然后屋里变灰，热气停了 */
function hook3(fr, t) {
  const grey = ss(t, 15.4, 18.0), steam = 1 - ss(t, 15.4, 17.0);
  const s = lerp(1.25, 1.32, seg(t, T.h3, T.title));
  fr.g({ at: [960, 560], s }, () => fr.g({ at: [-960, -520] }, () => room(fr, t, { steam, grey, phoneLit: .9 })));
  if (grey > 0) { const x = fr.x; x.save(); x.globalCompositeOperation = 'saturation'; x.fillStyle = rgba('#808080', grey * .85); x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'multiply'; x.fillStyle = rgba('#8A8A9A', grey * .45); x.fillRect(0, 0, W, H); x.restore(); }
}

/* ---------- 片名 ---------- */
function titleMotif(fr, lt, a) {                           // 母题：一扇亮着的小窗
  const k = ss(lt, .9, 1.6) * a; if (k <= 0) return; const cx = W / 2, cy = 640;
  fr.rect(cx - 46, cy - 56, 92, 112, { color: '#DDBD74', w: 3, a: k }); fr.line(cx, cy - 56, cx, cy + 56, { color: '#DDBD74', w: 2, a: k }); fr.line(cx - 46, cy, cx + 46, cy, { color: '#DDBD74', w: 2, a: k });
  fr.rect(cx + 2, cy + 2, 42, 52, { fill: '#F4D48A', a: .55 * k }); fr.glow(cx + 22, cy + 28, 90, '#F4D48A', .35 * k);
}
function title(fr, t) {
  const lt = t - T.titleIn, a = 1 - ss(t, T.w1 - .6, T.w1); if (lt < -.6) return;
  const x = fr.x; x.fillStyle = '#100C14'; x.fillRect(0, 0, W, H);
  if (lt > 0) K.titleGilt(fr, lt, { cy: 440, size: 200, track: 40, rays: 1.0, tagDy: 330, la: 'FEAR OF MISSING OUT', zh: '错过', tag: '为什么别人的晚上，总比你的好看', motif: titleMotif, a });
}

/* ---------- 窗：两栋楼 ----------
 * 这是什么：夜里两栋公寓楼 / 在干什么：你这扇亮着，对面四十扇一扇扇亮起 / 明白什么：你只有一个晚上，屏上同时是四十个 */
const COLS = 8, ROWS = 5;
const winOrder = (() => { const r = rng(404), idx = []; for (let i = 0; i < COLS * ROWS; i++) idx.push(i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } const at = new Array(COLS * ROWS); idx.forEach((w, k) => at[w] = k); return at; })();
/* 窗里的高光：婚礼碰杯、雪山、烛光、演唱会 —— 小画，按 kind 画 */
function highlight(fr, kind, w, h) {
  if (kind === 0) { fr.rect(-w / 2, -h / 2, w, h, { fill: '#F3D6C8' }); [-1, 1].forEach(sd => fr.g({ at: [sd * w * .13, h * .02], rot: -sd * .22 }, () => { const o = { color: '#7A5A22', w: 2.5 }; fr.path(`M ${-w * .05},${-h * .3} L ${w * .05},${-h * .3} L ${w * .03},${-h * .08} Q 0,${-h * .04} ${-w * .03},${-h * .08} Z`, { fill: '#F5D27A' }); fr.path(`M ${-w * .05},${-h * .3} L ${w * .05},${-h * .3} L ${w * .03},${-h * .08} Q 0,${-h * .04} ${-w * .03},${-h * .08} Z`, o); fr.line(0, -h * .05, 0, h * .1, o); fr.line(-w * .045, h * .1, w * .045, h * .1, o); })); for (let k = 0; k < 5; k++) fr.circle(-w * .03 + (k % 3) * w * .03, -h * .36 - k * h * .025, 2.5, { fill: '#FFFFFF' }); person(fr, -w * .3, h * .45, w / 220, '#6A4A5A', 1); person(fr, w * .3, h * .45, w / 220, '#4A3A5A', 1); }
  else if (kind === 1) { fr.rect(-w / 2, -h / 2, w, h, { fill: '#A9C9E8' }); fr.path(`M ${-w / 2},${h * .3} L ${-w * .1},${-h * .3} L ${w * .1},${0} L ${w * .3},${-h * .15} L ${w / 2},${h * .3} Z`, { fill: '#F4F8FC' }); fr.path(`M ${-w * .1},${-h * .3} L ${-w * .02},${-h * .18} L ${-w * .18},${-h * .18} Z`, { fill: '#FFFFFF' }); person(fr, -w * .1, -h * .22, w / 400, '#C9473A', 1); }
  else if (kind === 2) { fr.rect(-w / 2, -h / 2, w, h, { fill: '#3A2230' }); fr.rect(-w * .4, h * .1, w * .8, h * .08, { fill: '#F2E6D4' }); fr.rect(-w * .04, -h * .12, w * .08, h * .22, { fill: '#F8F2E4' }); fr.ellipse(0, -h * .18, w * .03, h * .06, { fill: '#FFC24A' }); fr.glow(0, -h * .18, w * .5, '#FFB84A', .6); }
  else { fr.rect(-w / 2, -h / 2, w, h, { fill: '#1E1838' }); for (let i = 0; i < 4; i++) fr.path(`M ${-w * .3 + i * w * .2},${-h / 2} L ${-w * .05 + i * w * .03},${h * .1} L ${w * .05 + i * w * .03},${h * .1} Z`, { fill: ['#E84B75', '#64B8F6', '#F8D893', '#8477D0'][i], a: .35 }); for (let i = 0; i < 9; i++) person(fr, -w * .44 + i * w * .11, h * .52, w / 380, '#0E0B18', i % 2); }
}
function towers(fr, t, cam) {                              // cam: { s, fx, fy } 屏幕中心对着世界里的 (fx, fy)，缩放 s
  const x = fr.x; x.fillStyle = C.sky; x.fillRect(0, 0, W, H);
  fr.rect(0, 0, W, H, { fill: fr.grad(0, 0, 0, H, [[0, '#121530', 1], [1, '#2C2448', 1]]) });
  const r0 = rng(9); for (let i = 0; i < 90; i++) fr.circle(r0() * W, r0() * 520, 1 + r0() * 1.6, { fill: '#DDE4FF', a: .25 + .3 * r0() });
  fr.g({ clip: [0, 0, W, 836] }, () => fr.g({ at: [960, 540], s: cam.s }, () => fr.g({ at: [-cam.fx, -cam.fy] }, () => {
    /* 你的楼（左） */
    fr.rect(80, 260, 520, 900, { fill: C.bldg });
    for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) { const mine = r === 3 && c === 1; fr.rect(130 + c * 116, 310 + r * 110, 70, 76, { fill: mine ? C.winOn : C.winOff }); if (mine) { fr.glow(281, 668, 140, C.winOn, .5); fr.g({ clip: [246, 640, 70, 76] }, () => { fr.circle(281, 696, 14, { fill: '#2A2034' }); fr.rect(265, 708, 32, 20, { r: 6, fill: '#2A2034' }); }); } }
    /* 对面的楼（右） */
    fr.rect(820, 120, 1040, 1040, { fill: C.bldg2 });
    for (let i = 0; i < COLS * ROWS; i++) {
      const c = i % COLS, r = Math.floor(i / COLS), wx = 880 + c * 124, wy = 180 + r * 150, ww = 92, wh = 112;
      const on = ss(t, T.w2 + .3 + winOrder[i] * .07, T.w2 + .55 + winOrder[i] * .07);
      fr.rect(wx, wy, ww, wh, { fill: C.winOff });
      if (on > 0) fr.g({ a: on, clip: [wx, wy, ww, wh] }, () => fr.g({ at: [wx + ww / 2, wy + wh / 2] }, () => highlight(fr, (c + r * 3) % 4, ww, wh)));
      if (on > 0) fr.glow(wx + ww / 2, wy + wh / 2, 90, C.winOn, .12 * on);
      fr.rect(wx, wy, ww, wh, { color: '#17162A', w: 5 });
    }
    fr.rect(0, 1040, 2000, 200, { fill: '#141322' });
  })));
}
function windows(fr, t) {
  /* 镜头：先对着你那扇窗（近），拉出去看见整栋楼；再往右摇，对面的楼一扇扇亮；最后推近对面几扇 */
  const ls = K.track([[T.w1, Math.log(2.6)], [T.w1 + 2.6, Math.log(1.0)], [T.w2, Math.log(.92)], [T.w3, Math.log(.92)], [T.w3 + 1.6, Math.log(1.75)], [T.tl, Math.log(1.8)]], t);
  const fx = K.track([[T.w1, 281], [T.w1 + 2.6, 340], [T.w2, 340], [T.w2 + 1.2, 1000], [T.w3, 1000], [T.w3 + 1.6, 1180], [T.tl, 1190]], t);
  const fy = K.track([[T.w1, 680], [T.w1 + 2.6, 640], [T.w2, 640], [T.w2 + 1.2, 560], [T.w3, 560], [T.w3 + 1.6, 445], [T.tl, 445]], t);
  towers(fr, t, { s: Math.exp(ls), fx, fy });
  /* 计数：你 1 扇 / 屏上 40 扇（示意） */
  const lit = Math.round(40 * ss(t, T.w2 + .3, T.w2 + .55 + 39 * .07));
  const a1 = ss(t, T.w1 + 2.4, T.w1 + 3.0) * (1 - ss(t, T.w3 - .2, T.w3 + .3));
  if (a1 > 0) {
    fr.text('你', 330, 70, { font: 'sansm', size: 30, color: P.dim, a: a1 }); fr.text('1', 330, 140, { font: 'sansh', size: 80, color: P.ink, a: a1 });
    const a2 = a1 * ss(t, T.w2 + .6, T.w2 + 1.2);
    fr.text('屏上', 1330, 70, { font: 'sansm', size: 30, color: P.dim, a: a2 }); fr.text(String(lit), 1330, 140, { font: 'sansh', size: 80, color: P.ink, a: a2 }); fr.text('示意', 1450, 140, { font: 'sans', size: 22, color: P.mute, align: 'l', a: a2 });
  }
}

/* ---------- 最难的一镜：两条两小时的时间轴 ----------
 * 这是什么：两条胶片一样的时间轴，每一格是这个晚上的一件事 / 在干什么：你的全亮着；别人的只亮三秒那一格 / 明白什么：你拿全片比预告片 */
const MINE = [['煮面', 'pot'], ['吃面', 'bowl'], ['洗碗', 'sink'], ['发呆', 'couch'], ['看书', 'book'], ['刷手机', 'phone']];
const THEIRS = [['堵车', 'car'], ['加班', 'laptop'], ['碰杯', 'cheers'], ['等外卖', 'clock'], ['洗碗', 'sink'], ['发呆', 'couch']];
function icon(fr, kind, s, col) {                          // 一格里的小画：认得出的日常东西
  fr.g({ s }, () => {
    const o = { fill: col };
    if (kind === 'pot') { fr.rect(-44, -10, 88, 50, { r: 10, ...o }); fr.rect(-56, -18, 112, 12, { r: 6, ...o }); fr.line(44, 0, 72, -6, { color: col, w: 8, cap: 'round' }); for (let i = 0; i < 3; i++) fr.path(`M ${-20 + i * 20},-30 q 8,-12 0,-24 q -8,-12 0,-24`, { color: col, w: 4, a: .6 }); }
    else if (kind === 'bowl') { fr.path('M -56,-6 Q -50,40 0,42 Q 50,40 56,-6 Z', o); fr.line(-20, -56, 40, 0, { color: col, w: 5, cap: 'round' }); fr.line(-8, -60, 48, -4, { color: col, w: 5, cap: 'round' }); }
    else if (kind === 'sink') { fr.rect(-64, 0, 128, 40, { r: 8, ...o }); fr.path('M 20,0 L 20,-44 Q 20,-56 32,-56 L 50,-56', { color: col, w: 8 }); fr.ellipse(-16, -6, 30, 10, { fill: '#000', a: .25 }); for (let i = 0; i < 3; i++) fr.circle(-30 + i * 16, -24 - i * 6, 6, { color: col, w: 3 }); }
    else if (kind === 'couch') { fr.rect(-64, -6, 128, 40, { r: 10, ...o }); fr.rect(-64, -36, 128, 34, { r: 10, ...o, a: .7 }); fr.circle(0, -56, 14, o); fr.rect(-12, -44, 24, 30, { r: 8, ...o }); }
    else if (kind === 'book') { fr.path('M -60,20 L 0,30 L 60,20 L 60,-30 L 0,-20 L -60,-30 Z', o); fr.line(0, -20, 0, 30, { color: '#000', w: 3, a: .3 }); }
    else if (kind === 'phone') { fr.rect(-26, -46, 52, 92, { r: 10, ...o }); fr.rect(-18, -36, 36, 70, { r: 4, fill: '#000', a: .3 }); }
    else if (kind === 'car') { fr.path('M -66,16 L -60,-8 L -36,-30 L 30,-30 L 50,-8 L 66,-4 L 66,16 Z', o); fr.circle(-36, 18, 14, { fill: '#000', a: .45 }); fr.circle(40, 18, 14, { fill: '#000', a: .45 }); fr.rect(-30, -24, 54, 16, { fill: '#000', a: .25 }); }
    else if (kind === 'laptop') { fr.rect(-48, -42, 96, 62, { r: 6, ...o }); fr.rect(-62, 20, 124, 10, { r: 4, ...o }); fr.rect(-40, -34, 80, 46, { fill: '#000', a: .25 }); }
    else if (kind === 'cheers') { fr.path('M -44,-46 L -14,-46 L -22,0 L -36,0 Z', o); fr.line(-29, 0, -29, 34, { color: col, w: 5 }); fr.path('M 14,-46 L 44,-46 L 36,0 L 22,0 Z', o); fr.line(29, 0, 29, 34, { color: col, w: 5 }); for (let i = 0; i < 4; i++) fr.circle(-4 + i * 4, -56 - i * 8, 3 + i % 2, o); }
    else if (kind === 'clock') { fr.circle(0, 0, 40, { color: col, w: 7 }); fr.line(0, 0, 0, -26, { color: col, w: 6, cap: 'round' }); fr.line(0, 0, 18, 8, { color: col, w: 6, cap: 'round' }); }
  });
}
function strip(fr, y, cells, o) {                          // o: { lit(i) 0..1, label, sub, a, flash(i) }
  const x0 = 250, cw = 236, ch = 190, a = o.a;
  fr.g({ a }, () => {
    fr.rect(x0 - 30, y - 30, cw * 6 + 60, ch + 60, { r: 10, fill: '#17141E' });
    for (let i = 0; i < 26; i++) { fr.rect(x0 - 16 + i * 57, y - 22, 26, 12, { r: 3, fill: '#2E2A38' }); fr.rect(x0 - 16 + i * 57, y + ch + 10, 26, 12, { r: 3, fill: '#2E2A38' }); }
    cells.forEach(([name, kind], i) => {
      const cx = x0 + i * cw, lit = o.lit(i), hot = o.hot ? o.hot(i) : 0;
      const bg = lit > .5 ? '#F2E6CC' : '#3A3644';
      fr.rect(cx + 6, y, cw - 12, ch, { r: 6, fill: bg });
      if (lit > 0 && lit < 1) fr.rect(cx + 6, y, cw - 12, ch, { r: 6, fill: '#F2E6CC', a: lit });
      fr.g({ at: [cx + cw / 2, y + 82] }, () => icon(fr, kind, 1, lit > .5 ? '#6A4A38' : '#5A5668'));
      fr.text(name, cx + cw / 2, y + 160, { font: 'sansm', size: 28, color: lit > .5 ? '#4A3428' : '#77727F' });
      if (hot > 0) { fr.rect(cx + 2, y - 4, cw - 4, ch + 8, { r: 8, color: P.gold, w: 6, a: hot }); fr.glow(cx + cw / 2, y + ch / 2, 220, '#FFE2A0', .35 * hot); }
    });
    fr.text(o.label, x0 - 40, y + ch / 2 - 18, { font: 'sansh', size: 40, color: P.ink, align: 'r' });
    fr.text(o.sub, x0 - 40, y + ch / 2 + 30, { font: 'sansm', size: 26, color: P.mute, align: 'r' });
  });
}
function timelines(fr, t) {
  const x = fr.x; x.fillStyle = '#211C2A'; x.fillRect(0, 0, W, H);
  const aIn = ss(t, T.tl, T.tl + .6), aOut = 1 - ss(t, T.card - .2, T.card + .4);
  /* 你：一格一格亮起，洗碗、发呆在第 11 句时闪一下 */
  const blink = i => (i === 2 || i === 3) ? Math.sin(seg(t, 50.3, 51.9) * Math.PI) : 0;
  strip(fr, 170, MINE, { a: aIn * aOut, label: '你', sub: '2 小时', lit: i => ss(t, T.tl + .5 + i * .32, T.tl + .8 + i * .32), hot: blink });
  /* 别人：先也是一整条亮着，然后除了「碰杯」全灭 */
  const theirsIn = ss(t, 53.4, 53.9), dim = ss(t, 54.4, 55.6);
  strip(fr, 520, THEIRS, { a: theirsIn * aOut, label: '别人', sub: '2 小时', lit: i => i === 2 ? 1 : 1 - dim, hot: i => i === 2 ? ss(t, 55.2, 55.8) : 0 });
  const a3 = ss(t, 55.6, 56.1) * aOut;
  if (a3 > 0) { fr.text('3 秒', 250 + 2 * 236 + 118, 790, { font: 'sansh', size: 44, color: P.gold, a: a3 }); fr.line(250 + 2 * 236 + 118, 724, 250 + 2 * 236 + 118, 750, { color: P.gold, w: 3, a: a3 }); }
}
/* 规则卡：米色纸，左边一卷长胶片，右边一小段 */
function ruleCard(fr, t) {
  const a = ss(t, T.card, T.card + .5); if (a <= 0) return;
  const x = fr.x; x.fillStyle = '#211C2A'; x.fillRect(0, 0, W, H);
  fr.g({ a, at: [960, 430 + (1 - E.out3(a)) * 30], rot: -.017 }, () => {
    fr.rect(-560, -300, 1120, 600, { r: 6, fill: '#000', a: .35 }); fr.rect(-570, -312, 1120, 600, { r: 6, fill: P.paper });
    for (let i = 0; i < 9; i++) fr.line(-530, -240 + i * 60, 510, -240 + i * 60, { color: '#B9AE98', w: 1.5, a: .6 });
    fr.g({ at: [-250, -20] }, () => { fr.circle(0, 0, 130, { fill: '#3A3036' }); fr.circle(0, 0, 40, { fill: P.paper }); for (let i = 0; i < 6; i++) { const an = i / 6 * 6.283; fr.circle(Math.cos(an) * 86, Math.sin(an) * 86, 20, { fill: P.paper }); } fr.rect(120, 70, 160, 48, { fill: '#3A3036' }); });
    fr.text('全片', -250, 200, { font: 'sansh', size: 46, color: '#4A3428' }); fr.text('你的整个晚上', -250, 250, { font: 'sansm', size: 26, color: '#7A6550' });
    fr.g({ at: [270, -20] }, () => { fr.rect(-80, -60, 160, 120, { fill: '#3A3036' }); fr.rect(-56, -40, 112, 80, { fill: '#F4D48A' }); fr.g({ at: [0, 4] }, () => icon(fr, 'cheers', .7, '#6A4A38')); for (let i = 0; i < 4; i++) { fr.rect(-74 + i * 42, -56, 20, 10, { fill: P.paper }); fr.rect(-74 + i * 42, 46, 20, 10, { fill: P.paper }); } });
    fr.text('预告片', 270, 200, { font: 'sansh', size: 46, color: '#4A3428' }); fr.text('别人剪出来的三秒', 270, 250, { font: 'sansm', size: 26, color: '#7A6550' });
    fr.text('vs', 10, -10, { font: 'latinim', size: 60, color: '#9A8670' });
  });
}

const SHOTS = [[0, T.h2, hook1], [T.h2, T.h3, hook2], [T.h3, T.title, hook3], [T.title, T.w1, title], [T.w1, T.tl, windows], [T.tl, T.card, timelines], [T.card, T.end, ruleCard]];

VK.film({
  dur: T.end, theme: 'flat', meta: { title: '错过' },
  draw(fr, t) {
    fr.look.bgo = { color: '#100C14' };
    const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
    const cut = Math.min(ss(t, sh[0], sh[0] + (sh[0] ? .25 : .5)), 1 - ss(t, sh[1] - (sh[1] >= T.end ? .6 : .25), sh[1]));
    fr.g({ a: cut }, () => {
      sh[2](fr, t);
      const x = fr.x, g = x.createRadialGradient(W / 2, 520, H * .55, W / 2, 520, W * .72); g.addColorStop(0, 'rgba(20,10,10,0)'); g.addColorStop(1, 'rgba(20,10,10,.45)'); fr.rect(0, 0, W, H, { fill: g });
      const b = x.createLinearGradient(0, 820, 0, H); b.addColorStop(0, 'rgba(16,12,20,0)'); b.addColorStop(.5, 'rgba(16,12,20,.75)'); b.addColorStop(1, 'rgba(16,12,20,.9)'); fr.rect(0, 820, W, 260, { fill: b });
    });
    /* 常驻：错过感仪表（钩子里） */
    const ga = ss(t, .8, 1.4) * (1 - ss(t, T.title - .4, T.title));
    if (ga > 0) K.gauge(fr, 45, 35, { value: missAt(t), max: 150, redFrom: 100, label: '错过感', zone: '超标', caption: '示意', a: ga });
    /* 声音 */
    fr.sfx(.3, 'chord', { root: 0, gain: .5 });
    fr.sfx(4.2, 'soft', { gain: .8 }); fr.sfx(8.0, 'soft', { gain: .8 });
    fr.sfx(15.6, 'thud', { gain: .6 }); fr.sfx(T.titleIn, 'bloom', { gain: .9 });
    for (let i = 0; i < 40; i += 3) fr.sfx(+(T.w2 + .4 + i * .07).toFixed(2), 'tick', { pitch: i % 5, gain: .3 });
    for (let i = 0; i < 6; i++) fr.sfx(+(T.tl + .6 + i * .32).toFixed(2), 'tick', { pitch: 2, gain: .35 });
    fr.sfx(54.4, 'rise', { dur: 1.2, gain: .5 }); fr.sfx(55.4, 'tock', { pitch: 1 });
    fr.sfx(T.card + .1, 'stamp', { gain: .7 });
    K.subs(fr, t, SUBS, 'flat');
  },
});
})();
