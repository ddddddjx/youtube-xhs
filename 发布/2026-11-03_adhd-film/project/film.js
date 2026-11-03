/* 《手电筒》ADHD · A 鎏金 · 60 秒横屏 · 分镜见 ../storyboard.md，事实见 ../facts.md
 * 一个故事：一张书桌、一支手电筒（= 注意力）。能锁死在游戏上四小时，却照不到下周的截止日期，直到只剩一晚。
 * 事实：Shaw 等 2007 PNAS（皮层厚度峰值 10.5 岁 vs 7.5 岁）；Polanczyk 等 2007（约 5%）；Hupfeld 等 2019（超专注自述）；Barkley 1997（时间近视，一种解释）。
 * 示意：「四个小时」「距截止 12 小时」「7 天」「今晚只写一段」、所有物件的样子。
 * 三层：背景（墙、窗、挂钟 / 远处）0.2 · 中景（桌上的东西 / 日历卡）0.6 · 前景（手和手电筒、虚光斑）1.4。
 * 颜色：金 = 光、正事、办法；红 = 把光扳走的东西、截止日期的警报。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rgba, mix } = VK;
const K = VKit, P = K.PAL.gilt;

const T = { night2: 9.2, row: 22.2, brain: 39.8, grid: 43.6, row2: 47.2, desk2: 51.2, end: 60 };
const DIPS = [T.night2, T.row, T.brain, T.grid, T.row2, T.desk2];
const HOOK = 'ADHD：注意力{真的不够}吗？';
const SUBS = [
  { a: 0,    b: 3.0,  zh: 'ADHD，名字叫「注意力缺陷」。' },
  { a: 3.2,  b: 6.4,  zh: '可游戏一开，一停就是四个小时。' },
  { a: 6.6,  b: 9.0,  zh: '这是注意力太少，还是太多？' },
  { a: 9.4,  b: 12.6, zh: '晚上九点，报告明天要交。' },
  { a: 12.8, b: 15.6, zh: '光刚照到文档，手机亮了。' },
  { a: 15.8, b: 18.6, zh: '窗外一声响，它又转了过去。' },
  { a: 19.0, b: 22.0, zh: '手电筒不暗，只是不听自己的手。' },
  { a: 22.4, b: 25.6, zh: '那下周的截止日期呢？' },
  { a: 25.8, b: 29.0, zh: '光，只照得到{今天}。' },
  { a: 29.4, b: 32.4, zh: '一天天过去——' },
  { a: 32.6, b: 36.0, zh: '直到只剩一晚，它突然{!掉进光里}。' },
  { a: 36.4, b: 39.6, zh: '不是拖到最后，是最后才看见。', tone: 'gold' },
  { a: 40.0, b: 43.4, zh: '不是懒：前额那一片，平均晚熟约三年。' },
  { a: 43.8, b: 47.0, zh: '每 20 个孩子里，大约就有 1 个。' },
  { a: 47.4, b: 51.0, zh: '别硬扳手电筒，把下周拆成今晚一小步。' },
  { a: 51.4, b: 54.6, zh: '晚上九点，手机又亮了一下。' },
  { a: 55.0, b: 59.7, zh: '你不是不够努力，|只是比别人晚一点{看见}。', big: 1 },
];

/* ---------- 镜头漂移与三层 ---------- */
const D = t => [Math.sin(t * .21) * 16, Math.cos(t * .17) * 9];
const layer = (fr, t, d, fn) => K.depth(fr, t, d, fn, { drift: D, zoom: 0 });
const scr = (t, p, d) => { const q = D(t); return [p[0] + q[0] * d, p[1] + q[1] * d]; };   // 某一层里的点在屏幕上的位置
const note = (fr, s, x, y, a, o = {}) => fr.text(s, x, y, Object.assign({ font: 'serifm', size: 26, track: 3, color: P.dim, a, shadow: .8, shadowBlur: 10 }, o));
const ease = (keys, t) => {   // [[t, [x, y]], ...]：两个关键帧之间 io3 缓动，可以停住
  if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [a, p] = keys[i], [b, q] = keys[i + 1]; if (t <= b) { const k = E.io3(seg(t, a, b)); return [lerp(p[0], q[0], k), lerp(p[1], q[1], k)]; } }
  return keys[keys.length - 1][1];
};

/* ---------- 手和手电筒（前景）：base 是手腕所在的世界坐标，target 是光要照的中景点 ---------- */
const BASE = [1985, 640];   // 手从画面右侧中间伸进来：光柱整条都在字幕线（y≈915）以上
function flashlight(fr, t, target, o = {}) {
  const b = scr(t, BASE, 1.4), tg = scr(t, target, .6), ang = Math.atan2(tg[1] - b[1], tg[0] - b[0]);
  const dir = [Math.cos(ang), Math.sin(ang)], pr = [-dir[1], dir[0]], head = [b[0] + dir[0] * 212, b[1] + dir[1] * 212];
  const R = o.r || 200, ry = o.ry || R * .78, on = o.on == null ? 1 : o.on;
  if (on > 0) {   // 光柱：从镜头到光圈的一道锥形
    const x = fr.x, g = x.createLinearGradient(head[0], head[1], tg[0], tg[1]);
    g.addColorStop(0, rgba('#FFE3A6', .30 * on)); g.addColorStop(.6, rgba('#F2C26E', .10 * on)); g.addColorStop(1, rgba('#F2C26E', .05 * on));
    fr.poly([[head[0] + pr[0] * 38, head[1] + pr[1] * 38], [tg[0] + pr[0] * R * .92, tg[1] + pr[1] * ry * .92], [tg[0] - pr[0] * R * .92, tg[1] - pr[1] * ry * .92], [head[0] - pr[0] * 38, head[1] - pr[1] * 38]], { fill: g, close: true, add: true });
    fr.glow(tg[0], tg[1], R * 1.15, '#F6CF86', .32 * on);
    fr.glow(head[0], head[1], 70, '#FFF1C8', .55 * on);
  }
  fr.g({ at: b, rot: ang, s: 1.25 }, () => {   // 手电筒：深色金属筒身 + 金色环 + 镜头；一只握着它的手
    fr.rect(-150, -30, 270, 60, { r: 14, fill: fr.grad(0, -30, 0, 30, [[0, '#4A3E33'], [.45, '#2A221C'], [1, '#120E0B']]) });
    fr.rect(110, -44, 60, 88, { r: 10, fill: fr.grad(0, -44, 0, 44, [[0, '#6A5644'], [.5, '#3A2E24'], [1, '#17110D']]) });
    fr.rect(104, -46, 10, 92, { r: 3, fill: '#C9A45E' }); fr.rect(-60, -31, 8, 62, { fill: '#B8934F', a: .8 });
    fr.ellipse(170, 0, 7, 40, { fill: '#FFF4D6', a: .9 * on + .1 });
    fr.ellipse(-10, 0, 70, 52, { fill: '#2B1F17' }); fr.ellipse(-30, -22, 34, 18, { fill: '#3A2A1F' });                 // 手
    for (let i = 0; i < 4; i++) fr.ellipse(28 - i * 24, -40, 13, 16, { fill: '#33251B' });                                  // 指节
    fr.ellipse(-5, 5, 68, 50, { color: '#C9A45E', w: 1.2, a: .25 });
  });
  return { tg, R, ry };
}
/* 光圈之内画亮的版本：clip 一个椭圆，在这个层的坐标里 */
function lit(fr, spot, fn) { if (!spot) return; const x = fr.x; x.save(); x.beginPath(); x.ellipse(spot[0], spot[1], spot[2], spot[3], 0, 0, Math.PI * 2); x.clip(); fn(); x.restore(); }

/* ---------- 书桌这一屋 ---------- */
const TG = { tablet: [470, 625], laptop: [960, 520], phone: [1365, 712], window: [340, 340], half: [1180, 610] };
function clockHM(t) {   // 挂钟：钩子里 21:00 → 01:00，之后回到 21:00
  if (t < T.night2) return 21 + 4 * E.io3(seg(t, 3.3, 6.3));
  if (t < T.desk2) return 21 + seg(t, T.night2, 22) * .2;
  return 21 + seg(t, T.desk2, 60) * .15;
}
function windowBg(fr, t, bright) {
  fr.rect(150, 160, 380, 360, { r: 6, fill: '#2B2017', a: bright });
  fr.rect(168, 178, 344, 324, { fill: fr.grad(0, 178, 0, 502, [[0, '#0E1A30'], [1, '#081020']]), a: bright });
  for (let i = 0; i < 26; i++) fr.circle(180 + hash(i) * 320, 190 + hash(i + 9) * 150, 1.4, { fill: '#9FB4D8', a: (.3 + .5 * hash(i + 3)) * bright });   // 远处的灯
  const car = seg(t, 15.7, 17.2); if (car > 0 && car < 1) {   // 窗外车灯扫过
    const x = lerp(120, 560, E.io3(car)); fr.g({ clip: [168, 178, 344, 324] }, () => fr.glow(x, 430, 160, '#FFE6B0', .7 * Math.sin(car * Math.PI)));
  }
  fr.rect(336, 178, 8, 324, { fill: '#2B2017', a: bright }); fr.rect(168, 336, 344, 8, { fill: '#2B2017', a: bright });
}
function clock(fr, t) {
  const cx = 1600, cy = 300, r = 120, hm = clockHM(t), ha = (hm % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = (hm % 1) * Math.PI * 2 - Math.PI / 2;
  fr.circle(cx, cy, r * 1.1, { fill: '#2A1F16' }); fr.circle(cx, cy, r, { fill: fr.rgrad(cx, cy - 30, 10, r, [[0, '#E9DDC2'], [1, '#B9A882']]), a: .78 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; fr.line(cx + Math.cos(a) * r * .8, cy + Math.sin(a) * r * .8, cx + Math.cos(a) * r * .92, cy + Math.sin(a) * r * .92, { w: i % 3 ? 3 : 6, color: '#3A2A1C', cap: 'butt' }); }
  fr.line(cx, cy, cx + Math.cos(ha) * r * .5, cy + Math.sin(ha) * r * .5, { w: 9, color: '#2A1D12' });
  fr.line(cx, cy, cx + Math.cos(ma) * r * .78, cy + Math.sin(ma) * r * .78, { w: 5, color: '#2A1D12' });
  fr.circle(cx, cy, 8, { fill: '#B8934F' });
}
function deskRoom(fr, t, spotT, tags, tgt) {
  const spin = seg(t, 3.3, 6.3);
  layer(fr, t, .2, () => {   // 背景：墙、窗、挂钟
    fr.rect(-60, -60, W + 120, 760, { fill: fr.grad(0, 0, 0, 700, [[0, '#120C08'], [1, '#1C130C']]) });
    windowBg(fr, t, .4); clock(fr, t);
    lit(fr, spotT && [spotT[0], spotT[1], 230, 190], () => { fr.glow(spotT[0], spotT[1], 220, '#F2C88A', .25); windowBg(fr, t, 1); });
    if (spin > 0 && spin < 1) fr.glow(1600, 300, 220, '#F2C26E', .25 * Math.sin(spin * Math.PI));
  });
  layer(fr, t, .6, () => {   // 中景：书桌和桌上的东西
    fr.path(`M -80,640 L ${W + 80},640 L ${W + 80},1140 L -80,1140 Z`, { fill: fr.grad(0, 640, 0, 1140, [[0, '#2C1C10'], [.25, '#24170D'], [1, '#0E0905']]) });
    fr.rect(-80, 636, W + 160, 6, { fill: '#5A3F25', a: .7 });
    desk(fr, t, .2, tags);
    lit(fr, [tgt[0], tgt[1], 240, 175], () => desk(fr, t, 1, tags));
    tools(fr, t, tags);
  });
}
/* 桌上的东西：平板（游戏）、笔记本电脑（文档）、手机、（结尾）计时器和小卡。k = 亮度 */
function desk(fr, t, k, tags) {
  const ping = tags.ping || 0;
  fr.g({ a: k }, () => {
    /* 平板 + 小游戏：方块往下掉，分数在涨 */
    fr.rect(318, 548, 304, 164, { r: 16, fill: '#15110E' }); fr.rect(330, 560, 280, 140, { r: 8, fill: '#0D1630' });
    fr.g({ clip: [330, 560, 280, 140] }, () => {
      for (let i = 0; i < 14; i++) { const c = ['#E8B84A', '#4FC3C9', '#E06A5A', '#9C7CE0'][i % 4], x = 345 + (i * 53) % 250, y = 560 + ((t * (40 + i * 7) + i * 37) % 170) - 20; fr.rect(x, y, 22, 22, { r: 3, fill: c }); }
      fr.text('SCORE ' + String(1200 + Math.floor(t * 137)).padStart(5, '0'), 470, 578, { font: 'mono', size: 16, color: '#FFE9A8' });
    });
    /* 笔记本电脑：屏幕上是一份文档 */
    fr.path('M 760,640 L 1160,640 L 1200,676 L 720,676 Z', { fill: '#2A2520' }); fr.rect(780, 392, 360, 250, { r: 10, fill: '#1A1714' });
    fr.rect(796, 406, 328, 222, { fill: '#E9E3D6' });
    fr.text('报告.docx', 960, 428, { font: 'sansm', size: 18, color: '#5A5148' });
    const lines = tags.lines || 0; for (let i = 0; i < 7; i++) fr.rect(822, 456 + i * 22, i < lines ? 280 - (i % 3) * 40 : 0, 8, { r: 3, fill: '#8F877B' });
    if (!lines) fr.text('0 字', 1100, 610, { font: 'sansm', size: 15, color: '#9A9186', align: 'r' });
    if (tags.check > 0) fr.path('M 1052,560 L 1072,582 L 1110,530', { color: '#C99A3A', w: 8, a: tags.check, cap: 'round' });
    /* 手机：屏幕朝上，来消息时亮 */
    fr.rect(1300, 688, 140, 56, { r: 10, fill: '#111' });
    fr.rect(1306, 693, 128, 46, { r: 7, fill: mix('#14161C', '#F04E3E', ping) });
    if (ping > 0) { fr.rect(1316, 703, 90, 8, { r: 3, fill: '#FFF', a: ping }); fr.rect(1316, 718, 60, 7, { r: 3, fill: '#FFF', a: ping * .7 }); }
  });
  if (ping > 0 && k > .5) fr.glow(1370, 715, 120, '#F04E3E', .35 * ping);
}
/* 结尾：计时器和小卡，不受光圈明暗影响（这是办法，要看得清） */
function tools(fr, t, tags) {
  if (tags.tools > 0) fr.g({ a: tags.tools }, () => {
      fr.circle(640, 760, 58, { fill: '#2E2620' }); fr.circle(640, 760, 48, { fill: '#E9DDC2' });
      fr.arc(640, 760, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - seg(t, 51.4, 80)), { color: '#D9583C', w: 7 });
      fr.text('25:00', 640, 762, { font: 'mono', size: 18, color: '#2A1D12' });
      fr.rect(1010, 700, 210, 70, { r: 6, fill: '#F1E8D6' }); fr.rect(1010, 700, 6, 70, { fill: '#C99A3A' });
      fr.text('今晚只写一段', 1118, 736, { font: 'serif', size: 24, color: '#3A2A1C' });
      fr.glow(640, 760, 120, '#F2C26E', .15); fr.glow(1115, 735, 160, '#F2C26E', .12);
    });
}
const PING1 = t => fade(t, 12.85, 15.4, .1, .8), PING2 = t => fade(t, 51.7, 53.0, .1, .6);
function sceneDesk(fr, t) {
  let tgt, tags = {};
  if (t < T.night2) tgt = TG.tablet;
  else if (t < T.row) tgt = ease([[9.4, TG.tablet], [11.4, TG.laptop], [12.85, TG.laptop], [13.2, TG.phone], [15.85, TG.phone], [16.2, TG.window], [19.1, TG.window], [19.9, TG.laptop], [20.5, TG.laptop], [21.4, TG.phone]], t);
  else tgt = ease([[51.2, TG.laptop], [51.75, TG.laptop], [52.05, TG.half], [52.6, TG.laptop]], t);
  if (t >= T.night2 && t < T.row) tags = { ping: PING1(t), lines: 0 };
  if (t >= T.desk2) tags = { ping: PING2(t), lines: Math.floor(1 + 5 * seg(t, 52.8, 54.0)), check: ss(t, 54.0, 54.4), tools: ss(t, 51.4, 52.2) };
  const sp = scr(t, tgt, .6), q = D(t), spotBg = [sp[0] - q[0] * .2, sp[1] - q[1] * .2];
  const endDark = ss(t, 55.0, 58.5);
  deskRoom(fr, t, Math.hypot(tgt[0] - TG.window[0], tgt[1] - TG.window[1]) < 260 ? spotBg : null, tags, tgt);
  if (endDark > 0) fr.rect(0, 0, W, H, { fill: '#050302', a: .62 * endDark });   // 结尾屋子暗下去，光还在
  flashlight(fr, t, tgt, { r: 210 });
  layer(fr, t, 1.4, () => { for (let i = 0; i < 6; i++) fr.glow(120 + i * 330 + Math.sin(t * .3 + i) * 30, 980 + (i % 2) * 40, 70 + (i % 3) * 20, '#E9C77A', .10); });   // 前景虚光斑
  /* 小字 */
  note(fr, '超专注 · 常见自述（示意）', 1600, 470, fade(t, 3.6, 6.4, .4, .4));
  note(fr, '距截止 12 小时（示意）', 960, 360, fade(t, 10.6, 18.4, .5, .5), { color: P.gold });
  if (t > 55) { note(fr, 'Shaw 等 2007 · Polanczyk 等 2007 · Hupfeld 等 2019 · Barkley 1997', 960, 128, ss(t, 55.6, 56.4) * .9, { size: 22 }); note(fr, '诊断与治疗请咨询专业医生', 960, 164, ss(t, 55.8, 56.6) * .9, { size: 22 }); }
  /* 大字：0–2 秒的钩子、"你猜？" */
  const scrim = Math.max(t < 3 ? 1 - ss(t, 2.5, 2.9) : 0, fade(t, 6.6, 9.0, .3, .3));
  if (scrim > 0) fr.rect(0, 0, W, H, { fill: fr.rgrad(960, 450, 0, 760, [[0, '#000', .62 * scrim], [1, '#000', 0]]) });
  if (t < 3.0) { K.headline(fr, t, '注意力{!缺陷}？', { a1: 2.9, cy: 450 }); }
  if (t > 6.5 && t < 9.1) K.headline(fr, t, '你猜？', { a0: 6.6, a1: 9.0, cy: 450, size: 120 });
}

/* ---------- 日历卡：一排日子从近处排向远处 ---------- */
const VP = [1660, 300], NEAR = [620, 820], LABELS = ['周一 · 今天', '周二', '周三', '周四', '周五', '周六', '周日 · 截止'];
function slot(u) { const z = 1 + Math.max(u, -.8) * 1.0, s = 1 / z; return { x: VP[0] + (NEAR[0] - VP[0]) * s, y: VP[1] + (NEAR[1] - VP[1]) * s, s }; }
function card(fr, u, label, o = {}) {
  const p = slot(u), w = 420 * p.s, h = 330 * p.s, a = (o.a == null ? 1 : o.a) * (u < 0 ? clamp(1 + u * 1.6) : 1); if (a <= 0) return;
  const red = o.red || 0, lit_ = o.lit || 0, dead = o.dead ? 1 : 0;
  fr.g({ a }, () => {
    fr.ellipse(p.x, p.y + 6 * p.s, w * .55, 14 * p.s, { fill: '#000', a: .5 });
    fr.rect(p.x - w / 2, p.y - h, w, h, { r: 10 * p.s, fill: mix(mix('#3A3026', '#EFE4CC', lit_), '#C8402C', red * .85) });
    fr.rect(p.x - w / 2, p.y - h, w, h * .22, { r: 10 * p.s, fill: mix(mix(dead ? '#8A2416' : '#4A2A1C', '#B8873C', lit_ * (1 - dead)), '#7A1A10', red) });
    if (dead) fr.glow(p.x, p.y - h * .6, 160 * p.s + 30, '#E8442E', .22 * (1 - red));
    fr.text(label, p.x, p.y - h * .5, { font: 'serif', size: 46 * p.s, color: mix(mix('#8A7B68', '#3A2A1C', lit_), '#FFF1E0', red) });
  });
  if (red > 0) fr.glow(p.x, p.y - h / 2, 380 * p.s, '#E8442E', .35 * red);
}
function floorBg(fr, t) {
  layer(fr, t, .2, () => {
    fr.rect(-60, -60, W + 120, H + 120, { fill: fr.grad(0, 0, 0, H, [[0, '#0B0806'], [.35, '#120C08'], [1, '#1E140C']]) });
    for (let i = 0; i < 9; i++) { const k = i / 8; fr.line(VP[0], VP[1], lerp(-400, 2400, k), 1100, { w: 1, color: '#B8934F', a: .07 }); }   // 地板的透视线
    fr.glow(VP[0], VP[1], 260, '#3A2814', .5);
  });
}
function sceneRow(fr, t) {
  floorBg(fr, t);
  const second = t >= T.row2;
  const steps = second ? 0 : [29.6, 30.2, 30.8, 31.4, 32.0, 32.85].reduce((s, a) => s + E.io3(seg(t, a, a + .45)), 0);
  const spot = [NEAR[0], NEAR[1] - 170];
  layer(fr, t, .6, () => {
    for (let k = 6; k >= 0; k--) {
      const u = k - steps; if (u < -.7) continue;
      const isDead = k === 6, inLight = clamp(1 - Math.abs(u) * 1.4);
      let red = isDead ? clamp(inLight * 1.2) : 0; if (isDead && t > 32.9 && !second) red = Math.max(red, .75 + .25 * Math.sin((t - 32.9) * 9) * (1 - ss(t, 34, 35.5)));
      if (second && isDead) { card(fr, u, LABELS[k], { a: 1 - ss(t, 48.0, 48.5), dead: true }); continue; }
      card(fr, u, LABELS[k], { lit: inLight * (isDead ? .4 : 1), red, dead: isDead });
    }
    if (second) {   // 截止卡拆成三张小卡，第一张滑进今天的光里
      const from = slot(6), names = ['今晚：只写一段', '明晚：再写一段', '周三：改一遍'];
      names.forEach((nm, i) => {
        const k = E.io3(seg(t, 48.3 + i * .25, 49.6 + i * .25)), to = slot(i), x = lerp(from.x, to.x, k), y = lerp(from.y - 40 * from.s, to.y - 330 * to.s * .5, k), s = lerp(from.s, to.s, k) * .95;   // 落在对应那张日历卡的下半截上，不碰字幕线
        if (k <= 0 && t < 48.3) return; const a = ss(t, 48.1, 48.5), g = i === 0 ? ss(t, 49.5, 49.9) : 0;
        fr.g({ a }, () => { fr.rect(x - 230 * s, y - 70 * s, 460 * s, 140 * s, { r: 8 * s, fill: mix('#3A3026', '#F6E7C2', i === 0 ? g : .25) }); fr.rect(x - 230 * s, y - 70 * s, 10 * s, 140 * s, { fill: '#C99A3A' }); fr.text(nm, x, y, { font: 'serif', size: 40 * s, color: mix('#B8A88C', '#3A2A1C', i === 0 ? g : .3) }); });
        if (g > 0) fr.glow(x, y, 200, '#F6CF86', .35 * g);
      });
    }
  });
  flashlight(fr, t, spot, { r: 300, ry: 250 });
  layer(fr, t, 1.4, () => { for (let i = 0; i < 5; i++) fr.glow(200 + i * 420, 1010, 80, '#E9C77A', .09); });
  const days = Math.max(1, Math.round(7 - steps)), ca = second ? 0 : fade(t, 25.8, 39.6, .5, .4);
  note(fr, `距截止 ${days} 天（示意）`, 1500, 150, ca, { size: 34, color: days <= 1 ? '#F06A50' : P.gold });
  note(fr, 'Barkley · 时间近视（一种解释）', 1500, 200, fade(t, 36.6, 39.6, .4, .4), { size: 24 });
}

/* ---------- 两个侧脸：前额那一片，按年龄亮起来 ---------- */
const HEAD = 'M -110,150 C -125,70 -175,-10 -155,-90 C -135,-175 -40,-205 35,-192 C 118,-178 165,-118 160,-38 L 178,10 L 160,26 L 168,58 C 160,80 148,90 128,94 L 118,145 L 20,152 L 18,205 L -102,205 Z';
function head(fr, cx, cy, fill, peak, age, label, a) {
  fr.g({ a }, () => {
    fr.path(HEAD, { at: [cx, cy], fill: fr.rgrad(cx, cy - 40, 20, 260, [[0, '#4A3A2C'], [1, '#2A2019']]) });
    const x = fr.x; x.save(); x.translate(cx, cy); x.clip(new Path2D(HEAD));
    const g = x.createRadialGradient(110, -120, 10, 110, -120, 190); g.addColorStop(0, rgba('#F6D58C', .95)); g.addColorStop(1, rgba('#C99A3A', .55));
    x.globalAlpha *= fill; x.fillStyle = g; x.beginPath(); x.ellipse(105, -110, 120 * (.4 + .6 * fill), 100 * (.4 + .6 * fill), 0, 0, Math.PI * 2); x.fill(); x.restore();
    fr.path(HEAD, { at: [cx, cy], color: '#D9B46A', w: 3, a: .85 });
    if (fill > .02) fr.glow(cx + 105, cy - 110, 160, '#F2C26E', .25 * fill);
    fr.text(label, cx, cy - 250, { font: 'serif', size: 34, color: P.ink });
    /* 年龄标尺 5–13 岁 */
    const x0 = cx - 230, x1 = cx + 230, y = cy + 270, X = v => lerp(x0, x1, (v - 5) / 8);
    fr.line(x0, y, x1, y, { w: 2, color: '#8A7B68' });
    for (let v = 5; v <= 13; v++) { fr.line(X(v), y - 8, X(v), y + 8, { w: 2, color: '#8A7B68' }); if (v % 2 === 1) fr.text(String(v), X(v), y + 30, { font: 'latin', size: 24, color: P.mute }); }
    fr.line(x0, y, X(Math.min(age, 13)), y, { w: 5, color: '#C99A3A' }); fr.circle(X(Math.min(age, 13)), y, 9, { fill: '#F4E0B7' });
    if (age >= peak) { fr.circle(X(peak), y, 14, { color: '#F06A50', w: 3 }); fr.text(`${peak} 岁`, X(peak), y - 36, { font: 'serif', size: 28, color: '#F4E0B7', a: ss(age, peak, peak + .6) }); }
  });
}
function sceneBrain(fr, t) {
  floorBg(fr, t);
  const age = 5 + 7 * seg(t, 40.2, 43.3), a = ss(t, T.brain, T.brain + .4);
  layer(fr, t, .6, () => {
    head(fr, 620, 470, clamp((age - 5) / 2.5), 7.5, age, '一般孩子', a);
    head(fr, 1300, 470, clamp((age - 5) / 5.5), 10.5, age, 'ADHD 孩子', a);
  });
  note(fr, '前额皮层厚度达到峰值的中位年龄 · Shaw 等, 2007, PNAS', 960, 140, fade(t, 40.3, 43.4, .4, .3), { size: 24 });
}

/* ---------- 二十支小手电筒：其中一支的光在乱晃 ---------- */
function mini(fr, x, y, ang, a, odd) {
  fr.g({ at: [x, y], rot: ang, a }, () => {
    fr.path('M 0,-30 L -42,-150 L 42,-150 Z', { fill: odd ? '#F06A50' : '#F2C26E', a: .16, add: true });
    fr.rect(-13, -30, 26, 72, { r: 6, fill: '#3A2E24' }); fr.rect(-17, -38, 34, 16, { r: 4, fill: '#6A5644' }); fr.rect(-17, -24, 34, 3, { fill: '#C9A45E' });
  });
  fr.glow(x + Math.sin(ang) * 150, y - Math.cos(ang) * 150, 46, odd ? '#F06A50' : '#F2C26E', .25 * a);
}
function sceneGrid(fr, t) {
  floorBg(fr, t);
  layer(fr, t, .6, () => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
      const i = r * 10 + c, odd = i === 13, a = ss(t, 43.8 + i * .04, 44.2 + i * .04);
      const ang = odd ? Math.sin(t * 5.3) * .55 + Math.sin(t * 2.1) * .3 : Math.sin(t * .8 + i) * .03;
      mini(fr, 330 + c * 140, 420 + r * 300, ang, a, odd);
    }
  });
  note(fr, '约 5% · Polanczyk 等, 2007, American Journal of Psychiatry', 960, 830, fade(t, 44.4, 47.0, .4, .3), { size: 24 });
}

VK.film({
  dur: T.end, theme: 'gilt',
  meta: { title: '手电筒', drone: 0 },                       // 用户 11-03：先不加配乐，只有音效
  draw(fr, t) {
    fr.look.bgo = { warm: 1, dust: .8 };
    const dim = K.dips(t, DIPS, .35);
    fr.g({ a: dim }, () => {
      if (t < T.row || t >= T.desk2) sceneDesk(fr, t);
      else if (t < T.brain || (t >= T.row2 && t < T.desk2)) sceneRow(fr, t);
      else if (t < T.grid) sceneBrain(fr, t);
      else sceneGrid(fr, t);
    });
    /* 音效 */
    [4.05, 4.8, 5.55, 6.3].forEach(s => t > s && fr.sfx(s, 'tick', { pitch: 4 }));
    if (t > 6.6) fr.sfx(6.6, 'ping'); if (t > 13.0) fr.sfx(12.95, 'whoosh', { dur: .6 }); if (t > 16.0) fr.sfx(15.9, 'whoosh', { dur: .7 });
    if (t > 19.3) fr.sfx(19.3, 'tick'); if (t > T.row) fr.sfx(T.row, 'whoosh', { dur: 1.0, gain: .7 });
    [29.6, 30.2, 30.8, 31.4, 32.0].forEach((s, i) => t > s && fr.sfx(s, 'tock', { pitch: i }));
    if (t > 32.9) fr.sfx(32.9, 'hit'); if (t > 41.2) fr.sfx(41.2, 'tick', { pitch: 2 }); if (t > 42.6) fr.sfx(42.6, 'tick', { pitch: 5 });
    if (t > 49.6) fr.sfx(49.6, 'ping', { pitch: 5 }); if (t > 51.75) fr.sfx(51.75, 'tock'); if (t > 54.0) fr.sfx(54.0, 'ping', { pitch: 7 }); if (t > 55.0) fr.sfx(55.0, 'hit', { gain: .45 });
    K.hookBar(fr, t, HOOK, { style: 'gilt' });
    K.subs(fr, t, SUBS, 'gilt');
  },
});
})();
