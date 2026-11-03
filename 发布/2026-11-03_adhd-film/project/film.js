/* 《手电筒》ADHD · A 鎏金 · 60 秒横屏 · 分镜见 ../storyboard.md，事实见 ../facts.md
 * 一个故事：一张书桌、一支手电筒（= 注意力）。能锁死在游戏上四小时，却照不到下周的截止日期，直到只剩一晚。
 * 事实：Shaw 等 2007 PNAS（皮层厚度峰值 10.5 岁 vs 7.5 岁）；Polanczyk 等 2007（约 5%）；Hupfeld 等 2019（超专注自述）；Barkley 1997（时间近视，一种解释）。
 * 示意：「四个小时」「距截止 12 小时」「7 天」「今晚只写一段」、所有物件的样子。
 * 三层：背景（墙、窗、挂钟 / 远处）0.2 · 中景（桌上的东西 / 日历卡）0.6 · 前景（手和手电筒、虚光斑）1.4。
 * 颜色：金 = 光、正事、办法；红 = 把光扳走的东西、截止日期的警报。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rgba, mix, noise1 } = VK;
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
  const b = scr(t, BASE, 1.4), tg = scr(t, target, .6), bend = o.bend || [0, 0];
  const c = [(b[0] + tg[0]) / 2 + bend[0], (b[1] + tg[1]) / 2 + bend[1]], ang = Math.atan2(c[1] - b[1], c[0] - b[0]);   // 手电筒朝着光柱起始的方向
  const dir = [Math.cos(ang), Math.sin(ang)], head = [b[0] + dir[0] * 212, b[1] + dir[1] * 212];
  const R = o.r || 200, ry = o.ry || R * .78, on = o.on == null ? 1 : o.on;
  FX.beam(fr, t, head, tg, R, ry, on, bend, { motes: o.motes });
  fr.g({ at: b, rot: ang, s: 1.25 }, () => {   // 手电筒：深色金属筒身 + 金色环 + 镜头；一只握着它的手
    fr.rect(-150, -30, 270, 60, { r: 14, fill: fr.grad(0, -30, 0, 30, [[0, '#4A3E33'], [.45, '#2A221C'], [1, '#120E0B']]) });
    fr.rect(110, -44, 60, 88, { r: 10, fill: fr.grad(0, -44, 0, 44, [[0, '#6A5644'], [.5, '#3A2E24'], [1, '#17110D']]) });
    fr.rect(104, -46, 10, 92, { r: 3, fill: '#C9A45E' }); fr.rect(-60, -31, 8, 62, { fill: '#B8934F', a: .8 });
    fr.rect(-148, -30, 266, 6, { r: 3, fill: '#8A7458', a: .35 });                                                       // 筒身高光
    fr.ellipse(170, 0, 7, 40, { fill: '#FFF4D6', a: .9 * on + .1 });
    fr.ellipse(-10, 0, 70, 52, { fill: '#2B1F17' }); fr.ellipse(-30, -22, 34, 18, { fill: '#3A2A1F' });
    for (let i = 0; i < 4; i++) fr.ellipse(28 - i * 24, -40, 13, 16, { fill: '#33251B' });
    fr.ellipse(-5, 5, 68, 50, { color: '#C9A45E', w: 1.2, a: .25 });
  });
  FX.flare(fr, head, on * (o.flare == null ? 1 : o.flare), t);
  return { tg, R, ry, head };
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
  const sp = seg(t, 3.3, 6.3); if (sp > 0 && sp < 1) for (let g = 1; g <= 6; g++) {   // 时间飞过：指针拖出残影
    const hg = clockHM(t - g * .03), mg = (hg % 1) * Math.PI * 2 - Math.PI / 2; fr.line(cx, cy, cx + Math.cos(mg) * r * .78, cy + Math.sin(mg) * r * .78, { w: 5, color: '#5A3F25', a: .5 * (1 - g / 7) });
  }
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
    fr.rect(796, 406, 328, 222, { fill: k > .5 ? '#D4CCBC' : '#E9E3D6' });   // 亮着时压一档，不然光圈 + 辉光会冲成一片白
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
/* 光要照的点（世界坐标），写成 t 的函数：光柱的弯曲要用前一刻的位置 */
function aimDesk(t) {
  if (t < T.night2) return TG.tablet;
  if (t < T.row) return ease([[9.4, TG.tablet], [11.4, TG.laptop], [12.85, TG.laptop], [13.2, TG.phone], [15.85, TG.phone], [16.2, TG.window], [19.1, TG.window], [19.9, TG.laptop], [20.5, TG.laptop], [21.4, TG.phone]], t);
  return ease([[51.2, TG.laptop], [51.75, TG.laptop], [52.05, TG.half], [52.6, TG.laptop]], t);
}
/* 光柱的弯：被猛地扳走时像绳子一样甩出一道弧；19–21 秒手硬扳向文档，手机的拉力把光柱拽弯 */
function bendDesk(t) {
  const now = aimDesk(t), prev = aimDesk(Math.max(0, t - .14)), whip = [(prev[0] - now[0]) * 1.3, (prev[1] - now[1]) * 1.3];
  const pk = fade(t, 19.6, 21.4, .4, .3), pull = [(TG.phone[0] - now[0]) * .28 * pk, (TG.phone[1] - now[1]) * .5 * pk];
  return [whip[0] + pull[0], whip[1] + pull[1]];
}
function sceneDesk(fr, t) {
  const tgt = aimDesk(t); let tags = {};
  if (t >= T.night2 && t < T.row) tags = { ping: PING1(t), lines: 0 };
  if (t >= T.desk2) tags = { ping: PING2(t), lines: Math.floor(1 + 5 * seg(t, 52.8, 54.0)), check: ss(t, 54.0, 54.4), tools: ss(t, 51.4, 52.2) };
  const sp = scr(t, tgt, .6), q = D(t), spotBg = [sp[0] - q[0] * .2, sp[1] - q[1] * .2];
  const endDark = ss(t, 55.0, 58.5);
  deskRoom(fr, t, Math.hypot(tgt[0] - TG.window[0], tgt[1] - TG.window[1]) < 260 ? spotBg : null, tags, tgt);
  /* 游戏的拉力：平板上不停往外冒彩色的小方块，像磁铁一样吸着光 */
  if (t < T.night2) { const x = fr.x; x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) { const ph = (hash(i) + t * (.25 + .3 * hash(i + 1))) % 1, a0 = hash(i + 2) * Math.PI * 2, r0 = 40 + ph * 260, px = sp[0] + Math.cos(a0) * r0 * 1.2, py = sp[1] + Math.sin(a0) * r0 * .7 - ph * 60;
      x.fillStyle = rgba(['#E8B84A', '#4FC3C9', '#E06A5A', '#9C7CE0'][i % 4], .5 * Math.sin(ph * Math.PI)); x.fillRect(px - 4, py - 4, 8, 8); }
    x.restore(); }
  if (endDark > 0) fr.rect(0, 0, W, H, { fill: '#050302', a: .62 * endDark });   // 结尾屋子暗下去，光还在
  /* 分心的东西：提醒波纹 + 伸过来的触须 */
  const ph = scr(t, TG.phone, .6), wn = scr(t, TG.window, .2), lap = scr(t, TG.laptop, .6);
  FX.ripples(fr, t, 12.75, 13.6, ph[0], ph[1], '#F0563E');
  FX.tendrils(fr, t, ph, lap, seg(t, 12.75, 13.15) * (1 - ss(t, 15.4, 15.9)), '#F0563E', 5, 1);
  FX.ripples(fr, t, 15.7, 16.4, wn[0], wn[1], '#A9C8FF', .4, 260);
  FX.tendrils(fr, t, wn, ph, seg(t, 15.75, 16.15) * (1 - ss(t, 18.4, 18.9)), '#A9C8FF', 4, 2);
  FX.tendrils(fr, t, ph, scr(t, tgt, .6), ss(t, 19.5, 20.0) * (1 - ss(t, 21.6, 22.1)), '#F0563E', 6, 3);
  FX.ripples(fr, t, 51.65, 52.3, ph[0], ph[1], '#F0563E', .45, 160);
  FX.tendrils(fr, t, ph, lap, seg(t, 51.7, 52.0) * (1 - ss(t, 52.3, 52.8)), '#F0563E', 3, 4);
  flashlight(fr, t, tgt, { r: 210, bend: bendDesk(t) });
  /* 超专注：四个小时像被压缩成三秒，光圈以外全黑，时间从光圈往外飞 */
  FX.tunnel(fr, t, sp, fade(t, 3.3, 6.6, .6, .6));
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

/* ---------- 日历卡：一排日子从近处排向远处（景深：离焦点越远越虚）---------- */
const VP = [1660, 300], NEAR = [620, 820], LABELS = ['周一 · 今天', '周二', '周三', '周四', '周五', '周六', '周日 · 截止'];
function slot(u) { const z = 1 + Math.max(u, -.8) * 1.0, s = 1 / z; return { x: VP[0] + (NEAR[0] - VP[0]) * s, y: VP[1] + (NEAR[1] - VP[1]) * s, s }; }
function card(fr, u, label, o = {}) {
  const p = slot(u), w = 420 * p.s, h = 330 * p.s, a = (o.a == null ? 1 : o.a) * (u < 0 ? clamp(1 + u * 3) : 1); if (a <= 0) return;
  const red = o.red || 0, lit_ = o.lit || 0, dead = o.dead ? 1 : 0, off = o.off || [0, 0];
  fr.g({ a, blur: o.blur || 0, at: off, add: o.add }, () => {
    fr.ellipse(p.x, p.y + 6 * p.s, w * .55, 14 * p.s, { fill: '#000', a: .5 });
    fr.rect(p.x - w / 2, p.y - h, w, h, { r: 10 * p.s, fill: mix(mix('#3A3026', '#EFE4CC', lit_), '#C8402C', red * .85) });
    fr.rect(p.x - w / 2, p.y - h, w, h * .22, { r: 10 * p.s, fill: mix(mix(dead ? '#8A2416' : '#4A2A1C', '#B8873C', lit_ * (1 - dead)), '#7A1A10', red) });
    if (dead) fr.glow(p.x, p.y - h * .6, 160 * p.s + 30, '#E8442E', .22 * (1 - red));
    fr.text(label, p.x, p.y - h * .5, { font: 'serif', size: 46 * p.s, color: mix(mix('#8A7B68', '#3A2A1C', lit_), '#FFF1E0', red) });
  });
  if (red > 0 && !o.add) fr.glow(p.x, p.y - h / 2, 380 * p.s, '#E8442E', .35 * red);
}
function floorBg(fr, t) {
  layer(fr, t, .2, () => {
    fr.rect(-60, -60, W + 120, H + 120, { fill: fr.grad(0, 0, 0, H, [[0, '#0B0806'], [.35, '#120C08'], [1, '#1E140C']]) });
    for (let i = 0; i < 9; i++) { const k = i / 8; fr.line(VP[0], VP[1], lerp(-400, 2400, k), 1100, { w: 1, color: '#B8934F', a: .07 }); }   // 地板的透视线
    for (let i = 0; i < 7; i++) { const p = slot(i - .5); fr.line(-200, p.y, W + 200, p.y, { w: 1, color: '#B8934F', a: .05 * p.s }); }  // 横向的地板缝
    fr.glow(VP[0], VP[1], 260, '#3A2814', .5);
  });
}
const STEPS = [29.6, 30.2, 30.8, 31.4, 32.0, 32.8];   // 最后一步 33.25 秒落进光里，冲击就在这一刻
const stepsAt = t => STEPS.reduce((s, a) => s + E.io3(seg(t, a, a + .45)), 0);
/* 截止卡碎成的碎片：4×3 格，每格对角切成两块 */
const SHARDS = (() => { const out = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x0 = c / 4 - .5, x1 = (c + 1) / 4 - .5, y0 = r / 3 - 1, y1 = (r + 1) / 3 - 1; out.push([[x0, y0], [x1, y0], [x1, y1]], [[x0, y0], [x1, y1], [x0, y1]]); } return out; })();
function sceneRow(fr, t) {
  floorBg(fr, t);
  const second = t >= T.row2, steps = second ? 0 : stepsAt(t), vel = second ? 0 : (stepsAt(t) - stepsAt(t - .05)) / .05;
  const spot = [NEAR[0], NEAR[1] - 170], sh = FX.shake(t, 33.25, 22, .8);
  fr.g({ at: sh }, () => {
    layer(fr, t, .6, () => {
      for (let k = 6; k >= 0; k--) {
        const u = k - steps; if (u < -.35) continue;   // 已经过去的日子很快淡掉，不让它放大压到字幕上
        const isDead = k === 6, inLight = clamp(1 - Math.abs(u) * 1.4), blur = Math.min(6, Math.abs(u) * 1.6);
        let red = isDead ? clamp(inLight * 1.2) : 0; if (isDead && t > 33.25 && !second) red = Math.max(red, .75 + .25 * Math.sin((t - 33.25) * 9) * (1 - ss(t, 34.2, 35.5)));
        if (second && isDead) {   // 截止卡先飞到眼前，再碎掉
          const fly = E.io3(seg(t, 47.6, 48.2)), uu = lerp(6, 1.2, fly);
          if (t < 48.2) card(fr, uu, LABELS[k], { dead: true, red: fly * .8, blur: Math.min(6, Math.abs(uu) * 1.6) * (1 - fly) });
          continue;
        }
        for (let g = 1; g <= 3 && vel > .3 && u > .1; g++) card(fr, u + vel * .04 * g, LABELS[k], { lit: inLight * .6, a: .22 / g, blur: blur + 3 });   // 日子往前挪时拖出的残影
        card(fr, u, LABELS[k], { lit: inLight * (isDead ? .4 : 1), red, dead: isDead, blur: blur * (1 - inLight) });
        if (isDead && !second) { const ca = 1 - ss(t, 33.25, 33.8); if (t > 33.25 && ca > 0) { card(fr, u, LABELS[k], { red: 1, add: true, a: .3 * ca, off: [8 * ca, 0] }); card(fr, u, LABELS[k], { red: 1, add: true, a: .2 * ca, off: [-8 * ca, 2 * ca] }); } }
      }
      if (second) shatter(fr, t);
    });
    flashlight(fr, t, spot, { r: 300, ry: 250, bend: [0, -40 * Math.sin(t * .7)] });
  });
  /* 撞进光里的那一下：冲击波、火星、红色脉冲 */
  const hitP = slot(0); FX.ripples(fr, t, 33.25, 33.35, hitP.x, hitP.y - 165, '#FF6A48', .1, 700);
  FX.sparks(fr, t, 33.25, hitP.x, hitP.y - 165, 120, '255,140,90', 7, 1100);
  const pulse = (1 - ss(t, 33.25, 34.1)) * (t > 33.25 ? 1 : 0); if (pulse > 0) fr.rect(0, 0, W, H, { fill: fr.rgrad(W / 2, H / 2, H * .3, W * .7, [[0, '#E8442E', 0], [1, '#E8442E', .35 * pulse]]) });
  layer(fr, t, 1.4, () => { for (let i = 0; i < 5; i++) fr.glow(200 + i * 420, 1010, 80, '#E9C77A', .09); });
  const days = Math.max(1, Math.round(7 - steps)), ca = second ? 0 : fade(t, 25.8, 39.6, .5, .4), glitch = t > 33.2 && t < 33.65 ? Math.round(noise1(t * 60) * 6) : 0;
  note(fr, `距截止 ${days} 天（示意）`, 1500 + glitch, 150, ca, { size: 34, color: days <= 1 ? '#F06A50' : P.gold });
  note(fr, 'Barkley · 时间近视（一种解释）', 1500, 200, fade(t, 36.6, 39.6, .4, .4), { size: 24 });
}
/* 截止卡在眼前碎成 24 块，碎片飞散后收拢成三张小卡，落到今天、明天、后天，第一张亮在光里 */
function shatter(fr, t) {
  if (t < 48.2) return;
  const c0 = slot(1.2), W0 = 420 * c0.s, H0 = 330 * c0.s, names = ['今晚：只写一段', '明晚：再写一段', '周三：改一遍'];
  const ex = E.out3(seg(t, 48.2, 48.9)), ga = E.io3(seg(t, 48.75, 49.5)), fa = 1 - ss(t, 49.25, 49.6);
  SHARDS.forEach((tri, i) => {
    if (fa <= 0) return;
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, dirx = cx + (hash(i) - .5) * .6, diry = cy + .5 + (hash(i + 3) - .5) * .6;
    const tgtS = slot(i % 3), ox = c0.x + cx * W0 + dirx * 520 * ex, oy = c0.y + cy * H0 + diry * 380 * ex + 120 * ex * ex;
    const px = lerp(ox, tgtS.x, ga), py = lerp(oy, tgtS.y - 330 * tgtS.s * .5, ga), rot = (hash(i + 7) - .5) * 6 * ex * (1 - ga), sc = lerp(1, .25, ga);
    const pts = tri.map(([u, v]) => { const lx = (u - cx) * W0 * sc, ly = (v - cy) * H0 * sc; return [px + lx * Math.cos(rot) - ly * Math.sin(rot), py + lx * Math.sin(rot) + ly * Math.cos(rot)]; });
    fr.poly(pts, { fill: mix('#C8402C', '#F2C26E', ga), close: true, a: fa });
    fr.poly(pts.concat([pts[0]]), { color: '#FFD9A0', w: 1.5, a: .8 * fa, glow: 8 });
  });
  FX.sparks(fr, t, 48.2, c0.x, c0.y - H0 / 2, 70, '255,170,110', 11, 800);
  names.forEach((nm, i) => {
    const to = slot(i), s = to.s * .95, x = to.x, y = to.y - 330 * to.s * .5, a = ss(t, 49.3, 49.7), g = i === 0 ? ss(t, 49.5, 49.9) : 0;
    fr.g({ a }, () => { fr.rect(x - 230 * s, y - 70 * s, 460 * s, 140 * s, { r: 8 * s, fill: mix('#3A3026', '#F6E7C2', i === 0 ? g : .25) }); fr.rect(x - 230 * s, y - 70 * s, 10 * s, 140 * s, { fill: '#C99A3A' }); fr.text(nm, x, y, { font: 'serif', size: 40 * s, color: mix('#B8A88C', '#3A2A1C', i === 0 ? g : .3) }); });
    if (g > 0) fr.glow(x, y, 220, '#F6CF86', .4 * g);
  });
  FX.sparks(fr, t, 49.6, slot(0).x, slot(0).y - 165, 50, '255,214,140', 13, 600);
}

/* ---------- 两个侧脸：里面是一张神经网，成熟的波从后脑往前额推进 ---------- */
const HEAD = 'M -110,150 C -125,70 -175,-10 -155,-90 C -135,-175 -40,-205 35,-192 C 118,-178 165,-118 160,-38 L 178,10 L 160,26 L 168,58 C 160,80 148,90 128,94 L 118,145 L 20,152 L 18,205 L -102,205 Z';
const NET = (() => {   // 头里撒 120 个节点，每个连最近的两三个
  const cv = document.createElement('canvas').getContext('2d'), P2 = new Path2D(HEAD), r = VK.rng(2007), nodes = [];
  for (let k = 0; k < 4000 && nodes.length < 120; k++) { const x = -170 + r() * 345, y = -200 + r() * 340; if (!cv.isPointInPath(P2, x, y) || x < -150 && y > 60) continue; if (nodes.every(n => Math.hypot(n[0] - x, n[1] - y) > 23)) nodes.push([x, y]); }
  const edges = []; nodes.forEach((a, i) => { nodes.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])]).filter(([j, d]) => j !== i && d < 70).sort((p, q) => p[1] - q[1]).slice(0, 3).forEach(([j]) => { if (i < j) edges.push([i, j]); }); });
  return { nodes, edges };
})();
function head(fr, cx, cy, peak, age, label, a, t, frontal) {
  const front = lerp(-200, 200, clamp((age - 5) / (peak - 5))), litAt = n => ss(front - n[0], -30, 30);
  fr.g({ a }, () => {
    fr.path(HEAD, { at: [cx, cy], fill: fr.rgrad(cx, cy - 40, 20, 260, [[0, '#2E241C'], [1, '#17110D']]) });
    const x = fr.x; x.save(); x.translate(cx, cy); x.clip(new Path2D(HEAD));
    const band = x.createLinearGradient(front - 70, 0, front + 10, 0); band.addColorStop(0, 'rgba(242,194,110,0)'); band.addColorStop(.85, 'rgba(242,194,110,.28)'); band.addColorStop(1, 'rgba(242,194,110,0)');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = band; x.fillRect(front - 70, -220, 80, 440); x.restore();   // 正在往前推的那道成熟的波
    NET.edges.forEach(([i, j], e) => {
      const A = NET.nodes[i], B = NET.nodes[j], l = Math.min(litAt(A), litAt(B));
      fr.line(cx + A[0], cy + A[1], cx + B[0], cy + B[1], { w: 1.2 + l, color: l > .05 ? '#F2C26E' : '#5A4A3A', a: .25 + .55 * l, add: l > .05 });
      if (l > .6 && e % 3 === 0) { const u = (t * .9 + hash(e)) % 1; fr.glow(cx + lerp(A[0], B[0], u), cy + lerp(A[1], B[1], u), 7, '#FFF0C8', .8 * l); }   // 跑过去的电信号
    });
    NET.nodes.forEach(n => { const l = litAt(n); fr.circle(cx + n[0], cy + n[1], 2.4 + 1.6 * l, { fill: l > .05 ? '#FFE3A6' : '#6A5A48', a: .5 + .5 * l }); if (l > .3) fr.glow(cx + n[0], cy + n[1], 14, '#F2C26E', .3 * l); });
    fr.path(HEAD, { at: [cx, cy], color: '#D9B46A', w: 3, a: .85, glow: 10 });
    if (frontal > 0) { fr.ellipse(cx + 100, cy - 105, 92, 74, { color: '#F06A50', w: 2, a: .8 * frontal, dash: [8, 8] }); fr.line(cx + 185, cy - 120, cx + 215, cy - 150, { w: 1.5, color: '#F06A50', a: .7 * frontal }); fr.text('前额叶 · 管计划和刹车', cx + 222, cy - 158, { font: 'serifm', size: 22, color: '#F6B39A', a: frontal, align: 'l' }); }
    fr.text(label, cx, cy - 250, { font: 'serif', size: 34, color: P.ink });
    /* 年龄标尺 5–13 岁 */
    const x0 = cx - 230, x1 = cx + 230, y = cy + 270, X = v => lerp(x0, x1, (v - 5) / 8);
    fr.line(x0, y, x1, y, { w: 2, color: '#8A7B68' });
    for (let v = 5; v <= 13; v++) { fr.line(X(v), y - 8, X(v), y + 8, { w: 2, color: '#8A7B68' }); if (v % 2 === 1) fr.text(String(v), X(v), y + 30, { font: 'latin', size: 24, color: P.mute }); }
    fr.line(x0, y, X(Math.min(age, 13)), y, { w: 5, color: '#C99A3A' }); fr.circle(X(Math.min(age, 13)), y, 9, { fill: '#F4E0B7' }); fr.glow(X(Math.min(age, 13)), y, 30, '#F2C26E', .5);
    if (age >= peak) { fr.circle(X(peak), y, 14, { color: '#F06A50', w: 3 }); fr.text(`${peak} 岁`, X(peak), y - 36, { font: 'serif', size: 28, color: '#F4E0B7', a: ss(age, peak, peak + .6) }); }
  });
}
function sceneBrain(fr, t) {
  floorBg(fr, t);
  const age = 5 + 7 * seg(t, 40.2, 43.3), a = ss(t, T.brain, T.brain + .4);
  layer(fr, t, .6, () => {
    head(fr, 620, 470, 7.5, age, '一般孩子', a, t, 0);
    head(fr, 1300, 470, 10.5, age, 'ADHD 孩子', a, t, fade(t, 40.6, 43.4, .4, .3));
  });
  note(fr, '前额皮层厚度达到峰值的中位年龄 · Shaw 等, 2007, PNAS', 960, 140, fade(t, 40.3, 43.4, .4, .3), { size: 24 });
}

/* ---------- 二十支小手电筒：体积光往上打，其中一支的光在乱晃、拖出残影 ---------- */
function mini(fr, t, x, y, ang, a, odd) {
  const head = [x + Math.sin(ang) * 40, y - Math.cos(ang) * 40], tg = [x + Math.sin(ang) * 230, y - Math.cos(ang) * 230];
  if (odd) for (let g = 1; g <= 5; g++) { const ag = oddAng(t - g * .05); FX.beam(fr, t, [x + Math.sin(ag) * 40, y - Math.cos(ag) * 40], [x + Math.sin(ag) * 230, y - Math.cos(ag) * 230], 46, 30, a * .22 / g, [0, 0], { motes: 0, color: [255, 120, 90] }); }
  FX.beam(fr, t, head, tg, 46, 30, a * (odd ? 1 : .7), [0, 0], { motes: 18, color: odd ? [255, 130, 100] : [255, 214, 140] });
  fr.g({ at: [x, y], rot: ang, a }, () => {
    fr.rect(-13, -30, 26, 72, { r: 6, fill: '#3A2E24' }); fr.rect(-17, -38, 34, 16, { r: 4, fill: '#6A5644' }); fr.rect(-17, -24, 34, 3, { fill: '#C9A45E' });
  });
}
const oddAng = t => Math.sin(t * 5.3) * .55 + Math.sin(t * 2.1) * .3;
function sceneGrid(fr, t) {
  floorBg(fr, t);
  const push = 1 + .05 * seg(t, T.grid, T.row2);
  fr.g({ at: [W / 2, H / 2], s: push }, () => fr.g({ at: [-W / 2, -H / 2] }, () => layer(fr, t, .6, () => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
      const i = r * 10 + c, odd = i === 13, a = ss(t, 43.8 + i * .04, 44.2 + i * .04);
      mini(fr, t, 330 + c * 140, 430 + r * 300, odd ? oddAng(t) : Math.sin(t * .8 + i) * .03, a, odd);
    }
  })));
  note(fr, '约 5% · Polanczyk 等, 2007, American Journal of Psychiatry', 960, 830, fade(t, 44.4, 47.0, .4, .3), { size: 24 });
}

VK.film({
  dur: T.end, theme: 'gilt',
  meta: { title: '手电筒', drone: 0 },                       // 用户 11-03：先不加配乐，只有音效；drone 0 连底噪一起关
  draw(fr, t) {
    fr.look.bgo = { warm: 1, dust: .8 };
    const dim = K.dips(t, DIPS, .35);
    if (!fr.collecting) fr.g({ a: dim }, () => {
      if (t < T.row || t >= T.desk2) sceneDesk(fr, t);
      else if (t < T.brain || (t >= T.row2 && t < T.desk2)) sceneRow(fr, t);
      else if (t < T.grid) sceneBrain(fr, t);
      else sceneGrid(fr, t);
    });
    if (!fr.collecting) FX.leak(fr, t, DIPS);
    /* 结尾那句：一道光从字上扫过 */
    if (t > 56 && t < 58.4) { const k = seg(t, 56, 58.4), x = lerp(300, 1620, E.io3(k)); fr.glow(x, 920, 180, '#FFE9B8', .22 * Math.sin(k * Math.PI)); }
    /* 音效：开头一声手电筒的咔哒 */
    if (t > .02) fr.sfx(.02, 'tock', { pitch: -3, gain: .8 });
    [4.05, 4.8, 5.55, 6.3].forEach(s => t > s && fr.sfx(s, 'tick', { pitch: 4 }));
    if (t > 3.35) fr.sfx(3.35, 'rise', { dur: 2.9, gain: .5 });
    if (t > 6.6) fr.sfx(6.6, 'ping'); if (t > 12.8) fr.sfx(12.8, 'ping', { pitch: 1, gain: .7 }); if (t > 13.0) fr.sfx(13.05, 'whoosh', { dur: .5 }); if (t > 16.0) fr.sfx(15.95, 'whoosh', { dur: .6 });
    if (t > 19.3) fr.sfx(19.3, 'tick'); if (t > T.row) fr.sfx(T.row, 'whoosh', { dur: 1.0, gain: .6 });
    STEPS.slice(0, 5).forEach((s, i) => t > s && fr.sfx(s, 'tock', { pitch: i }));
    if (t > 33.25) fr.sfx(33.25, 'hit'); if (t > 33.27) fr.sfx(33.27, 'shimmer', { gain: .6 });
    if (t > 41.2) fr.sfx(41.2, 'tick', { pitch: 2 }); if (t > 42.6) fr.sfx(42.6, 'tick', { pitch: 5 });
    if (t > 47.6) fr.sfx(47.6, 'whoosh', { dur: .6 }); if (t > 48.2) fr.sfx(48.2, 'stamp', { gain: .7 }); if (t > 48.22) fr.sfx(48.22, 'shimmer', { gain: .5 });
    if (t > 49.6) fr.sfx(49.6, 'ping', { pitch: 5 }); if (t > 51.7) fr.sfx(51.7, 'ping', { pitch: 1, gain: .5 }); if (t > 54.0) fr.sfx(54.0, 'ping', { pitch: 7 }); if (t > 55.0) fr.sfx(55.0, 'soft', { gain: .8 });
    K.hookBar(fr, t, HOOK, { style: 'gilt' });
    K.subs(fr, t, SUBS, 'gilt');
  },
});
})();
