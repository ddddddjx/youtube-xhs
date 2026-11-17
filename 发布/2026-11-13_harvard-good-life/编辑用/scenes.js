/* 哈佛成人发展研究（Waldinger TED）解说片的专用镜头。
 * 贯穿形象：一个光点 = 一个人。724 个光点沿着年龄轴往右走，走到头的留在原地变暗。
 * 每一步只改一样：① 给光点连线 / 去掉连线 → 两条健康曲线；② 在 50 岁处放两只表，看哪只指向 80 岁；③ 两个光点之间的那根线，护住上面的大脑。
 * 时间点跟着字幕走（K.subAt），原声右侧小图用片段内秒数 lt（词级时间戳减片段起点）。 */
(function (K) {
'use strict';
const { W, H, g, C, PX, clamp, lerp, ease, back, win, rr, text, tw, alpha, chapter, pill, card, check, cross, stepChapter, S, panels, subAt } = K;

/* ---------- 基础：伪随机、发光点 ---------- */
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sprites = {};
function sprite(col) {
  if (sprites[col]) return sprites[col];
  const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d');
  const rg = q.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, '#fff'); rg.addColorStop(.18, col); rg.addColorStop(.5, col + '55'); rg.addColorStop(1, col + '00');
  q.fillStyle = rg; q.fillRect(0, 0, 64, 64); return sprites[col] = c;
}
function dot(x, y, r, col, a = 1) { if (a <= 0.01) return; const ga = g.globalAlpha; g.globalAlpha = ga * clamp(a); g.drawImage(sprite(col), x - r * 3, y - r * 3, r * 6, r * 6); g.globalAlpha = ga; }   // 乘在外层透明度上，外层淡出才生效
function lighter(fn) { g.save(); g.globalCompositeOperation = 'lighter'; fn(); g.restore(); }
const GOLD = '#F2B84B', BLUE = '#6FA0FF', TEAL = '#3CC8B4', RED = '#FF5A5F', GREY = '#8890B5';

/* ---------- 724 个人 ---------- */
const N = 724, NH = 268;                      // 268 位哈佛大二学生 + 456 位波士顿男孩 = 724
const P = [];
for (let i = 0; i < N; i++) {
  const grp = i < NH ? 0 : 1, k = grp ? i - NH : i, n = grp ? N - NH : NH;
  const ang = k * 2.39996, rad = Math.sqrt((k + .5) / n);
  const alive = rnd(i * 3 + 1) < 60 / N;      // 演讲时约 60 人在世，多数 90 多岁
  P.push({ grp, ang, rad, a0: i * 2.39996, r0: Math.sqrt((i + .5) / N),
    lane: (rnd(i * 7 + 2) + rnd(i * 11 + 5) + rnd(i * 13 + 9) - 1.5) * 230, lag: Math.pow(rnd(i * 29 + 4), 1.6) * 11,
    life: alive ? 999 : 30 + 50 * Math.pow(rnd(i * 5 + 3), .6), tw: rnd(i * 17) * 6.28, alive });
}
const AX0 = 230, AX1 = 1690, AGE0 = 19, AGE1 = 94;
const ageX = a => lerp(AX0, AX1, (a - AGE0) / (AGE1 - AGE0));
function axis(y, a, hi = []) {
  alpha(a, () => {
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(AX0 - 30, y); g.lineTo(AX1 + 30, y); g.stroke();
    for (let age = 20; age <= 90; age += 10) {
      const x = ageX(age), on = hi.includes(age);
      g.fillStyle = on ? GOLD : 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x, y, on ? 9 : 5, 0, 7); g.fill();
      text(age + ' 岁', x, y + 44, on ? 34 : 26, on ? GOLD : C.dim, 'center', on ? 700 : 500);
    }
  });
}

/* ---------- 开场后：两组人 → 沿年龄轴走完一生 ---------- */
S.n1 = (t, s) => {
  chapter('哈佛成人发展研究 · 1938 年起', C.gold);
  const tSplit = subAt(s, /分两组|哈佛的大二/, 1.2), tB = subAt(s, /波士顿/, 4), tFlow = subAt(s, /每两年/, 7.5), tQ = subAt(s, /问卷/, 9.5), tEnd = subAt(s, /九十多岁/, 13);
  const kS = ease((t - tSplit) / 1.3), kF = ease((t - tFlow + .3) / 1.6);
  const front = clamp((t - tFlow) / Math.max(3, s.t1 - tFlow - .6)), age = lerp(AGE0, 93, ease(front) * .55 + front * .45);
  const Y = 600;
  axis(Y + 190, kF);
  // 每两年回访一次：光点走过的地方亮起刻度
  alpha(kF, () => { for (let a = AGE0; a <= age; a += 2) { const x = ageX(a), near = clamp(1 - (age - a) / 6);
    g.strokeStyle = `rgba(242,184,75,${.18 + .6 * near})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y + 172); g.lineTo(x, Y + 190); g.stroke(); } });
  lighter(() => {
    for (let i = 0; i < N; i++) {
      const p = P[i];
      const x0 = W / 2 + Math.cos(p.a0) * p.r0 * 330, y0 = 540 + Math.sin(p.a0) * p.r0 * 330;
      const cx = p.grp ? 1330 : 560, R = p.grp ? 290 : 215;
      const x1 = cx + Math.cos(p.ang) * p.rad * R, y1 = 520 + Math.sin(p.ang) * p.rad * R;
      const a = Math.max(AGE0, Math.min(age - p.lag * clamp((age - AGE0) / 12), p.life)), gone = age - p.lag > p.life;
      const x2 = ageX(a) + (rnd(i * 23) - .5) * 26, y2 = Y - 10 + p.lane * .62;
      const x = lerp(lerp(x0, x1, kS), x2, kF), y = lerp(lerp(y0, y1, kS), y2, kF);
      const inn = win(t, s.t0 + p.r0 * .9, .5), twk = .75 + .25 * Math.sin(t * 2.2 + p.tw);
      const col = kS < .05 ? GOLD : (p.grp ? BLUE : GOLD);
      dot(x, y, gone ? 2.2 : 3.4, gone ? GREY : col, inn * (gone ? .3 : twk * lerp(1, .6, kF)));
    }
  });
  g.globalAlpha = 1;
  // 两组的名牌
  const lab = (1 - kF);
  alpha(win(t, tSplit + .7) * lab, () => { pill('哈佛大二学生', 560, 800, 34, '268 人', 1, GOLD); });
  alpha(win(t, tB + .2) * lab, () => { pill('波士顿最穷街区的男孩', 1330, 870, 34, '456 人', 1, BLUE); });
  alpha((1 - kS) * win(t, s.t0 + .2), () => text('724', W / 2, 130, 110, C.gold));
  alpha(win(t, tSplit) * lab, () => text('724 个人，分两组', W / 2, 130, 56, C.text));
  // 时间轴阶段：年份 + 回访手段
  alpha(kF, () => {
    const yr = Math.round(1938 + (age - AGE0));
    text('每两年回访一次', W / 2, 120, 56, C.text);
    text(String(Math.min(yr, 2013)), ageX(age), Y - 215, 54, C.gold);
    g.strokeStyle = 'rgba(242,184,75,.5)'; g.lineWidth = 2; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(ageX(age), Y - 180); g.lineTo(ageX(age), Y + 170); g.stroke(); g.setLineDash([]);
  });
  ['问卷', '病历', '抽血', '脑部扫描'].forEach((n, i) => pill(n, 560 + i * 270, 230, 34, '', win(t, tQ + i * .55) * kF, i === 3 ? TEAL : C.line));
  alpha(win(t, tEnd + .3), () => { pill('约 60 人还在世', ageX(82), Y + 140, 30, '多数 90 多岁', 1, GOLD); });
};

/* ---------- C1：75 年、724 人 ---------- */
panels.C1 = lt => {
  alpha(win(lt, .4), () => { pill('哈佛成人发展研究', PX, 220, 34, '', 1, GOLD); });
  // 75 年：年份条
  const k75 = ease((lt - 8.1) / 2.2), x0 = PX - 320, x1 = PX + 320;
  alpha(win(lt, 1.2), () => { text('1938', x0, 330, 30, C.dim, 'center', 600); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, 372); g.lineTo(x1, 372); g.stroke(); });
  if (k75 > 0) { g.strokeStyle = GOLD; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, 372); g.lineTo(lerp(x0, x1, k75), 372); g.stroke();
    lighter(() => dot(lerp(x0, x1, k75), 372, 7, GOLD, 1));
    alpha(k75, () => { text('2013', x1, 330, 30, C.dim, 'center', 600); text(Math.round(75 * k75) + ' 年', PX, 300, 78, C.gold); }); }
  // 724 人：光点一格格亮起
  const k724 = clamp((lt - 11.6) / 2.2), cols = 38, gap = 17, gx = PX - (cols - 1) * gap / 2, gy = 500;
  if (lt > 10.8) {
    lighter(() => { for (let i = 0; i < N; i++) { const on = clamp(k724 * N - i * .98 + 6, 0, 1); if (on <= 0) continue;
      dot(gx + (i % cols) * gap, gy + Math.floor(i / cols) * gap, 2.6, i < NH ? GOLD : BLUE, on * (.7 + .3 * Math.sin(lt * 2 + i))); } });
    g.globalAlpha = 1;
    alpha(win(lt, 11.4), () => text(Math.round(724 * ease(k724)) + ' 人', PX, 440, 64, C.text));
  }
};

/* ---------- C2：不是财富、名望、拼命工作 ---------- */
panels.C2 = lt => {
  const items = [['财富', 1.8], ['名望', 3.0], ['拼命工作', 4.1]];
  const fade = 1 - .6 * win(lt, 6.6, .8);
  items.forEach(([n, at], i) => {
    const y = 250 + i * 110, a = win(lt, .3 + i * .25) * fade, k = ease((lt - at) / .5);
    alpha(a, () => { card(PX - 230, y - 42, 460, 84, 20, 'rgba(22,26,56,.9)', k > 0 ? 'rgba(255,90,95,.6)' : 'rgba(255,255,255,.25)');
      text(n, PX, y, 42, k > .5 ? 'rgba(244,241,234,.45)' : C.text);
      if (k > 0) { g.strokeStyle = RED; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(PX - 190, y); g.lineTo(lerp(PX - 190, PX + 190, k), y); g.stroke(); } });
  });
  alpha(win(lt, 7.0) * (1 - win(lt, 13.2)), () => text('75 年里最明确的一条', PX, 640, 36, C.dim, 'center', 600));
  const kr = win(lt, 13.5, .7);
  if (kr > 0) {
    const y = 680, dx = lerp(40, 150, back(kr));
    alpha(kr, () => { g.save(); g.shadowColor = GOLD; g.shadowBlur = 30; g.strokeStyle = GOLD; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(PX - dx, y); g.lineTo(PX + dx, y); g.stroke(); g.restore(); });
    lighter(() => { dot(PX - dx, y, 16, GOLD, kr); dot(PX + dx, y, 16, GOLD, kr); });
    alpha(kr, () => text('好的关系', PX, y - 70, 60, C.gold));
    pill('更快乐', PX - 130, y + 90, 34, '', win(lt, 15.6), TEAL); pill('更健康', PX + 130, y + 90, 34, '', win(lt, 16.7), TEAL);
    alpha(win(lt, 17.8, .3), () => text('就这样。', PX, y + 170, 34, C.text, 'center', 600));
  }
};

/* ---------- 第一步：有连接的一群，和落单的一个 ---------- */
const NET = [[0, 0], [110, -70], [-120, -50], [70, 90], [-80, 100], [190, 40], [-200, 50], [20, -150], [-30, 190]];
const EDG = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [1, 7], [2, 7], [3, 5], [4, 6], [3, 8], [4, 8]];
function network(cx, cy, sc, k, t) {
  g.save(); g.lineCap = 'round';
  EDG.forEach(([a, b], i) => { const q = clamp(k * EDG.length - i); if (q <= 0) return;
    const [x1, y1] = NET[a], [x2, y2] = NET[b]; g.strokeStyle = `rgba(242,184,75,${.55 + .2 * Math.sin(t * 2 + i)})`; g.lineWidth = 3;
    g.beginPath(); g.moveTo(cx + x1 * sc, cy + y1 * sc); g.lineTo(cx + lerp(x1, x2, q) * sc, cy + lerp(y1, y2, q) * sc); g.stroke(); });
  g.restore();
  lighter(() => NET.forEach(([x, y], i) => dot(cx + x * sc, cy + y * sc, 9 * sc, GOLD, .8 + .2 * Math.sin(t * 2 + i))));
}
S.n3 = (t, s) => {
  chapter(stepChapter(0));
  const a = win(t, s.t0 + .1);
  alpha(a, () => network(620, 500, 1.5, clamp((t - s.t0 - .3) / 1.2), t));
  pill('有连接', 620, 840, 36, '', win(t, s.t0 + .8), GOLD);
  const lone = subAt(s, /没有关系/, 1.6);
  alpha(win(t, lone), () => { g.setLineDash([10, 12]); g.strokeStyle = 'rgba(111,160,255,.45)'; g.lineWidth = 3; g.beginPath(); g.arc(1340, 500, 150 + 6 * Math.sin(t * 1.5), 0, 7); g.stroke(); g.setLineDash([]); });
  lighter(() => dot(1340, 500, 13, BLUE, win(t, lone) * (.6 + .2 * Math.sin(t * 2))));
  pill('孤独', 1340, 840, 36, '', win(t, lone + .4), BLUE);
};

/* ---------- C3：两条线，孤独的那条先往下走 ---------- */
panels.C3 = lt => {
  const x0 = PX - 330, x1 = PX + 330, yT = 320, yB = 720, ax = a => lerp(x0, x1, (a - 20) / 70), hy = h => lerp(yB, yT, h);
  const hC = a => .92 - .3 * Math.pow(clamp((a - 20) / 70), 3.2);
  const hL = a => a < 38 ? .92 - .06 * (a - 20) / 18 : .86 - .74 * Math.pow((a - 38) / 40, 1.35);
  alpha(win(lt, .2), () => {
    text('健康', x0 - 6, yT - 46, 26, C.dim, 'left', 600);
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, yT - 20); g.lineTo(x0, yB + 30); g.lineTo(x1 + 20, yB + 30); g.stroke();
    [20, 40, 60, 80].forEach(a => text(a + ' 岁', ax(a), yB + 64, 24, C.dim, 'center', 500));
  });
  const curve = (h, aEnd, col, lw) => { if (aEnd <= 20) return; g.save(); g.shadowColor = col; g.shadowBlur = 18; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    for (let a = 20; a <= aEnd; a += .5) { const x = ax(a), y = hy(h(a)); a === 20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.restore();
    lighter(() => dot(ax(aEnd), hy(h(aEnd)), 7, col, 1)); };
  // 有连接：第一段原声里画到 60 岁，之后陪着另一条线走完
  const aC = lerp(20, 60, ease((lt - 1.2) / 3.2)) + 28 * ease((lt - 12.5) / 8.5);
  curve(hC, aC, GOLD, 6);
  alpha(win(lt, 1.6), () => text('有连接', ax(34), hy(hC(34)) - 40, 30, C.gold));
  // 孤独：跟着他说的四件事往下走
  const stops = [[7.2, 38], [12.5, 46], [14.8, 58], [17.7, 69], [20.1, 78]];
  let aL = 20;
  if (lt > 4.7) { aL = lerp(20, 30, ease((lt - 4.7) / 1.2)); stops.forEach(([at, to], i) => { const from = i ? stops[i - 1][1] : 30; aL += (to - from) * ease((lt - at) / 1.9); }); }
  curve(hL, aL, lt > 12.5 ? '#7F8FD0' : BLUE, 6);
  alpha(win(lt, 4.9), () => text('孤独', ax(27), hy(hL(27)) + 44, 30, BLUE));
  const marks = [[12.5, 44, '没那么快乐'], [14.8, 57, '健康更早下滑'], [17.7, 68, '大脑更早衰退']];
  marks.forEach(([at, a, n], i) => alpha(win(lt, at + .9), () => { const x = ax(a), y = hy(hL(a));
    g.fillStyle = RED; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); text(n, x - 16, y + 46 + i * 6, 26, C.text, 'right', 600); }));
  alpha(win(lt, 21.4), () => { const x = ax(78), y = hy(hL(78)); cross(x, y, 44, RED); text('寿命更短', x + 6, y + 56, 28, RED, 'center', 700); });
};

/* ---------- 第二步：80 岁往回翻 50 岁的记录 ---------- */
S.n4 = (t, s) => {
  chapter(stepChapter(1));
  const t80 = subAt(s, /八十多岁/, 1.2), t50 = subAt(s, /五十岁/, 4), tP = subAt(s, /预测/, 7.5), Y = 660;
  axis(Y, win(t, s.t0 + .1), [t >= t50 ? 50 : -1, t >= t80 ? 80 : -1]);
  const k80 = win(t, t80, .6), k50 = win(t, t50, .5);
  lighter(() => { dot(ageX(80), Y - 70, 16, GOLD, k80); });
  alpha(k80, () => text('活到 80 多岁', ageX(80) + 150, Y - 70, 36, C.text));
  ['问卷', '病历', '血样', '脑扫描', '访谈'].forEach((n, i) => {
    const k = back((t - t50 - i * .16) / .5), x = ageX(50) + (i - 2) * 150, y = Y - 300 + Math.abs(i - 2) * 16;
    if (k <= 0) return;
    g.save(); g.translate(x, lerp(Y - 40, y, k)); g.rotate((i - 2) * .05 * k); alpha(clamp(k * 2), () => { card(-74, -100, 148, 200, 16, 'rgba(30,36,74,.97)', 'rgba(255,255,255,.4)');
      text(n, 0, -58, 28, C.text); for (let j = 0; j < 4; j++) { rr(-50, -20 + j * 26, 100 - j * 14, 10, 5); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill(); } }); g.restore();
  });
  alpha(k50, () => text('50 岁时的全部记录', ageX(50), Y - 470, 40, C.text));
  const kp = ease((t - tP) / 1.2);
  if (kp > 0) { const xa = ageX(50) + 20, xb = ageX(80) - 40, y = Y - 70; g.save(); g.setLineDash([14, 12]); g.strokeStyle = GOLD; g.lineWidth = 5; g.beginPath(); g.moveTo(xa, y); g.lineTo(lerp(xa, xb, kp), y); g.stroke(); g.restore();
    alpha(kp, () => { pill('哪一项能提前预测？', (xa + xb) / 2, Y + 130, 36, '', 1, GOLD); }); }
};

/* ---------- C4：两只表，哪只指向 80 岁 ---------- */
function gauge(cx, cy, r, v, col, label, a, dim) {
  alpha(a * (dim ? .4 : 1), () => {
    g.lineCap = 'round'; g.lineWidth = 18; g.strokeStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(cx, cy, r, Math.PI, 2 * Math.PI); g.stroke();
    g.save(); g.shadowColor = col; g.shadowBlur = 20; g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, r, Math.PI, Math.PI * (1 + clamp(v))); g.stroke(); g.restore();
    const an = Math.PI * (1 + clamp(v)); g.strokeStyle = C.text; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(an) * (r - 30), cy + Math.sin(an) * (r - 30)); g.stroke();
    g.fillStyle = C.text; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
    text(label, cx, cy + 50, 32, C.text);
  });
}
panels.C4 = lt => {
  const cy = 430, xa = PX - 195, xb = PX + 195;
  alpha(win(lt, 3.8), () => pill('50 岁', PX, 230, 38, '', 1, GOLD));
  const notC = win(lt, 8.3, .5), isR = ease((lt - 11.9) / 1.4);
  gauge(xa, cy, 120, .55 + .08 * Math.sin(lt * 1.3), lt > 6.2 && notC < 1 ? C.text : GREY, '胆固醇', win(lt, 4.6), notC >= 1);
  if (notC > 0) cross(xa, cy - 50, 120 * notC, RED);
  gauge(xb, cy, 120, lerp(.5 + .06 * Math.sin(lt * 1.7), .9, isR), isR > 0 ? GOLD : GREY, '关系满意度', win(lt, 5.0), false);
  // 指向 80 岁
  const kA = ease((lt - 16.4) / 1.4), y0 = cy + 90, y1 = 690;
  if (kA > 0) { const ye = lerp(y0, 726, kA); g.save(); g.strokeStyle = GOLD; g.lineWidth = 5; g.lineCap = 'round'; g.setLineDash([12, 10]); g.beginPath(); g.moveTo(xb, y0); g.lineTo(xb, ye); g.stroke(); g.setLineDash([]); g.beginPath(); g.moveTo(xb - 14, ye - 16); g.lineTo(xb, ye); g.lineTo(xb + 14, ye - 16); g.stroke(); g.restore(); }
  alpha(win(lt, 17.6), () => { pill('80 岁', PX - 290, 760, 34, '', 1, GOLD);
    rr(PX - 200, 742, 500, 36, 18); g.fillStyle = 'rgba(255,255,255,.14)'; g.fill(); });
  const kH = ease((lt - 20.6) / 1.4);
  if (kH > 0) { g.save(); g.shadowColor = GOLD; g.shadowBlur = 24; rr(PX - 200, 742, 500 * .92 * kH, 36, 18); g.fillStyle = GOLD; g.fill(); g.restore();
    alpha(kH, () => text('最健康', PX + 50, 826, 38, C.gold)); }
};

/* ---------- 大脑：云朵外轮廓 + 里面一张记忆的网 ---------- */
const BN = []; for (let i = 0; i < 34; i++) { const a = i * 2.39996 + .4, r = Math.sqrt((i + .6) / 34); BN.push([Math.cos(a) * r * 172 + (rnd(i) - .5) * 14, Math.sin(a) * r * 108 - 4 + (rnd(i + 50) - .5) * 14]); }
const BE = []; BN.forEach((p, i) => { BN.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 62) BE.push([i, j]); }); });
function brain(cx, cy, sc, lit, a, t) {
  alpha(a, () => {
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    const lobes = []; for (let k = 0; k < 11; k++) { const an = k / 11 * 6.28 + .2; lobes.push([Math.cos(an) * 172, Math.sin(an) * 108, 62 + 12 * rnd(k + 70)]); }
    lobes.push([118, 118, 36]);                                    // 小脑
    g.fillStyle = 'rgba(255,255,255,.7)'; rr(52, 120, 44, 86, 18); g.fill(); g.fillStyle = '#171B3C'; rr(56, 110, 36, 92, 15); g.fill();   // 脑干
    g.fillStyle = 'rgba(255,255,255,.7)'; lobes.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r + 4, 0, 7); g.fill(); });
    g.fillStyle = '#171B3C'; lobes.forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); g.beginPath(); g.ellipse(0, 0, 175, 112, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 3; g.lineCap = 'round';                       // 几道沟回
    [[-150, -30, -90, -95, -20, -60], [-40, -100, 30, -40, 90, -95], [60, -20, 120, -60, 170, -10], [-160, 40, -90, 10, -40, 70], [-10, 60, 60, 20, 130, 60]].forEach(([a, b, c, d, e, f]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(c, d, e, f); g.stroke(); });
    BE.forEach(([i, j], n) => { const on = (n % 10) / 10 < lit; g.strokeStyle = on ? `rgba(242,184,75,${.35 + .25 * Math.sin(t * 3 + n)})` : 'rgba(255,255,255,.1)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(BN[i][0], BN[i][1]); g.lineTo(BN[j][0], BN[j][1]); g.stroke(); });
    g.globalCompositeOperation = 'lighter';
    BN.forEach(([x, y], i) => { const on = (i % 10) / 10 < lit; dot(x, y, on ? 6 : 3.5, on ? GOLD : GREY, on ? .7 + .3 * Math.sin(t * 3.3 + i * 1.7) : .4); });
    g.restore();
  });
  g.globalAlpha = 1;
}
function pair(cx, y, dx, link, t, lw = 8, col = GOLD) {
  if (link > 0) { g.save(); g.shadowColor = col; g.shadowBlur = 26; g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - dx, y); g.lineTo(lerp(cx - dx, cx + dx, link), y); g.stroke(); g.restore(); }
  lighter(() => { dot(cx - dx, y, 17, GOLD, .9 + .1 * Math.sin(t * 2)); dot(cx + dx, y, 17, GOLD, .9 + .1 * Math.cos(t * 2)); });
}
function shield(cx, cy, r, k) { if (k <= 0) return; g.save(); g.strokeStyle = TEAL; g.lineWidth = 5; g.shadowColor = TEAL; g.shadowBlur = 22; g.globalAlpha *= clamp(k); g.setLineDash([26, 14]);
  g.beginPath(); g.ellipse(cx, cy, r * 1.25, r * .92, 0, -Math.PI * (.5 + k), -Math.PI * (.5 - k)); g.stroke(); g.restore(); }

S.n5 = (t, s) => {
  chapter(stepChapter(2));
  brain(W / 2, 480, 1.5, .45, win(t, s.t0 + .1, .6), t);
  pill('什么在保护大脑', W / 2, 800, 40, '', win(t, s.t0 + .5), TEAL);
};
panels.C5 = lt => {
  const lit = lerp(.5, 1, ease((lt - 14.6) / 1.6));
  brain(PX, 400, 1.15, lit, win(lt, .2, .5), lt);
  shield(PX, 400, 215, ease((lt - 7.4) / 1.2));
  alpha(win(lt, 8.2), () => text('一种保护', PX, 168, 32, TEAL, 'center', 600));
  const y = 740, link = ease((lt - 1.9) / 1.4);
  alpha(win(lt, .8), () => pair(PX, y, 130, link, lt, lt > 12 ? 12 : 7));
  // 线往上托住大脑
  alpha(win(lt, 12.3), () => { g.save(); g.strokeStyle = 'rgba(242,184,75,.6)'; g.lineWidth = 3; g.setLineDash([8, 10]); g.beginPath(); g.moveTo(PX, y - 14); g.lineTo(PX, 545); g.stroke(); g.restore(); });
  alpha(win(lt, 2.6) * (1 - win(lt, 11.8)), () => text('让人安心的关系', PX, y + 70, 32, C.text));
  alpha(win(lt, 12.2), () => text('需要的时候，指望得上', PX, y + 70, 32, C.gold));
  pill('记忆清晰得更久', PX, 630, 34, '', win(lt, 15.2), GOLD);
};
S.n6 = (t, s) => {
  chapter(stepChapter(2));
  const tB = subAt(s, /拌嘴/, 3), tK = subAt(s, /靠得住/, 6), tM = subAt(s, /记忆/, 8.5), cx = W / 2, y = 800;
  brain(cx, 360, 1.3, 1, win(t, s.t0 + .1, .5), t);
  pair(cx, y, 230, win(t, s.t0 + .3, .8), t, t > tK ? 13 : 5);
  // 拌嘴：两人之间的红色锯齿
  const kb = win(t, tB, .4) * (1 - .55 * win(t, tK + .6, .8));
  if (kb > 0) { g.save(); g.globalAlpha *= kb; g.strokeStyle = RED; g.lineWidth = 5; g.lineJoin = 'miter'; g.shadowColor = RED; g.shadowBlur = 16; g.beginPath();
    for (let i = 0; i <= 16; i++) { const x = cx - 180 + i * 22.5, yy = y - 62 + (i % 2 ? -1 : 1) * (16 + 12 * Math.sin(t * 9 + i * 1.3)); i ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); g.restore();
    pill('天天拌嘴', cx, y - 122, 32, '', kb, RED); }
  pill('关键时刻靠得住', cx, y + 76, 36, '', win(t, tK + .2), GOLD);
  alpha(win(t, tK + .4), () => { g.save(); g.strokeStyle = 'rgba(242,184,75,.55)'; g.lineWidth = 3; g.setLineDash([8, 10]); g.beginPath(); g.moveTo(cx, y - 160); g.lineTo(cx, 590); g.stroke(); g.restore(); });
  shield(cx, 360, 245, ease((t - tM) / 1.2));
  pill('记忆不受影响', cx + 480, 360, 34, '', win(t, tM + .5), TEAL);
};

/* ---------- 现在能做什么 ---------- */
function phone(x, y, s, a) { alpha(a, () => { rr(x - 34 * s, y - 60 * s, 68 * s, 120 * s, 12 * s); g.fillStyle = '#10142E'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
  rr(x - 24 * s, y - 44 * s, 48 * s, 78 * s, 5 * s); g.fillStyle = 'rgba(111,160,255,.5)'; g.fill(); }); }
S.n7 = (t, s) => {
  chapter('现在能做什么', C.gold);
  alpha(win(t, s.t0 + .1), () => text('那现在能做什么？', W / 2, 400, 84, C.text));
  alpha(win(t, subAt(s, /办法/, 1.8)), () => text('他给的办法都很小', W / 2, 540, 52, C.gold));
  [0, 1, 2].forEach(i => alpha(win(t, s.t0 + 1.2 + i * .25) * .7, () => { card(W / 2 - 420 + i * 290, 660, 260, 120, 20); text(K.NUM[i], W / 2 - 290 + i * 290, 720, 52, C.dim); }));
};
panels.C6 = lt => {
  const rows = [[2.2, '把屏幕时间', '换成跟人在一起'], [6.8, '一起做点新的事', '散步 · 约会'], [14.2, '联系那位', '多年没说话的家人']];
  rows.forEach(([at, a1, a2], i) => {
    const k = back((lt - at) / .55), y = 300 + i * 200; if (k <= 0) return;
    alpha(clamp(k * 2), () => {
      g.save(); g.translate(0, (1 - k) * 40);
      card(PX - 340, y - 80, 680, 160, 24, 'rgba(22,26,56,.95)', i === 2 ? GOLD : 'rgba(255,255,255,.3)');
      text(K.NUM[i], PX - 280, y, 56, C.gold);
      text(a1, PX - 215, y - 30, 36, C.text, 'left'); text(a2, PX - 215, y + 30, 36, i === 1 ? C.dim : C.gold, 'left', i === 1 ? 500 : 700);
      const ix = PX + 250;
      if (i === 0) { phone(ix - 52, y, .62, 1 - .6 * win(lt, at + 1.4)); text('→', ix - 6, y, 36, C.dim); g.globalCompositeOperation = 'lighter'; dot(ix + 34, y, 10, GOLD, 1); dot(ix + 70, y, 10, GOLD, 1); }
      if (i === 1) { g.globalCompositeOperation = 'lighter'; const w = Math.sin(lt * 2.2) * 6; dot(ix - 10 + w, y - 8, 10, GOLD, 1); dot(ix + 32 + w, y + 8, 10, GOLD, 1); }
      if (i === 2) { const q = ease((lt - at - .8) / 1.6); g.strokeStyle = GOLD; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(ix - 40, y); g.lineTo(lerp(ix - 40, ix + 60, q), y); g.stroke(); g.setLineDash([]);
        g.globalCompositeOperation = 'lighter'; dot(ix - 48, y, 10, GOLD, 1); dot(ix + 68, y, 10, BLUE, .5 + .5 * q); }
      g.restore();
    });
  });
  g.globalAlpha = 1;
};


/* =====================================================================
 * 11-17 第二版：原声段不再放原片，整屏重画（用户：原片画面抹掉，只留音轨，用自己的动画配合讲解）
 * 每个原声段一个整屏镜头 S.<原声id>(t, seg)，lt = 片段内秒数（按词级时间戳对到他说的那个词）
 * ===================================================================== */
const SRC = 'Robert Waldinger 原声 | TED';
function stars(t, a = 1, n = 260) {                    // 背景里的 724 个人：慢慢漂的暗星点，所有整屏镜头共用
  lighter(() => { for (let i = 0; i < n; i++) { const x = (rnd(i * 3 + 7) * W + t * (6 + rnd(i) * 8)) % W, y = rnd(i * 5 + 1) * H;
    dot(x, y, 1.6 + rnd(i + 9) * 1.2, i % 3 ? GOLD : BLUE, a * (.12 + .12 * Math.sin(t * 1.3 + i))); } }); g.globalAlpha = 1;
}
function scaled(cx0, cy0, cx1, cy1, sc, fn) { g.save(); g.translate(cx1, cy1); g.scale(sc, sc); g.translate(-cx0, -cy0); fn(); g.restore(); }
function big(s1, x, y, px, col, a) { alpha(a, () => { g.save(); g.shadowColor = col; g.shadowBlur = 30; text(s1, x, y, px, col); g.restore(); }); }

/* ---------- C1：「哈佛成人发展研究……75 年，724 位男性」 ---------- */
const ERAS = [[1938, '研究开始'], [1945, '二战结束'], [1969, '人类登月'], [1989, '柏林墙倒塌'], [2007, '第一代 iPhone'], [2013, '演讲前两年']];
S.C1 = (t, s) => {
  const lt = t - s.t0; stars(t, win(lt, 0, .6)); chapter(SRC, C.orange);
  const tA = win(lt, .3, .6) * (1 - win(lt, 7.6, .6));
  alpha(tA, () => { text('哈佛成人发展研究', W / 2, 190, 76, C.text); text('Harvard Study of Adult Development', W / 2, 262, 30, C.gold, 'center', 500, true); });
  pill('同类研究里做得最久的一项', W / 2, 330, 32, '', win(lt, 3.9) * (1 - win(lt, 7.6, .6)), GOLD);
  // 年代轴：游标从 1938 走到 2013，经过的年代点亮
  const y = 470, x0 = 230, x1 = 1690, k = clamp((lt - .6) / 11.4), yr = lerp(1938, 2013, ease(k) * .3 + k * .7), xc = lerp(x0, x1, (yr - 1938) / 75);
  alpha(win(lt, .5), () => {
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.save(); g.shadowColor = GOLD; g.shadowBlur = 20; g.strokeStyle = GOLD; g.lineWidth = 6; g.beginPath(); g.moveTo(x0, y); g.lineTo(xc, y); g.stroke(); g.restore();
    ERAS.forEach(([e, n], i) => { const x = lerp(x0, x1, (e - 1938) / 75), on = yr >= e - .2, up = i % 2;
      alpha(on ? 1 : .25, () => { g.fillStyle = on ? GOLD : GREY; g.beginPath(); g.arc(x, y, on ? 9 : 6, 0, 7); g.fill();
        text(String(e), x, y + (up ? -44 : 46), 26, on ? C.gold : C.dim, 'center', 700); text(n, x, y + (up ? -80 : 82), 24, on ? C.text : C.dim, 'center', 500); }); });
    lighter(() => dot(xc, y, 12, GOLD, 1));
  });
  // 75 年
  alpha(win(lt, 7.9, .6), () => { big(Math.round(lerp(0, 75, ease((lt - 7.9) / 1.4))) + ' 年', W / 2 - 230, 200, 120, C.gold, 1); });
  // 724 个人：光点从轴上落下来排成方阵
  const k7 = clamp((lt - 11.4) / 2.4), cols = 46, gap = 26, gx = W / 2 - (cols - 1) * gap / 2, gy = 600;
  if (lt > 11) { lighter(() => { for (let i = 0; i < N; i++) { const on = clamp(k7 * N * 1.15 - i), tx = gx + (i % cols) * gap, ty = gy + Math.floor(i / cols) * gap;
      if (on <= 0) continue; const sx = lerp(x0, x1, rnd(i)), e = ease(on);
      dot(lerp(sx, tx, e), lerp(y, ty, e), 3.2, i < NH ? GOLD : BLUE, .85); } }); g.globalAlpha = 1;
    alpha(win(lt, 11.4), () => big(Math.round(724 * ease(k7)) + ' 人', W / 2 + 230, 200, 120, C.text, 1)); }
};

/* ---------- n1 / q1：几万页记录压成一句话 ---------- */
S.q1 = (t, s) => {
  stars(t, .7); chapter('75 年的结论', C.gold);
  const tEnd = subAt(s, /最后/, 3.2), grow = ease((t - s.t0) / Math.max(1.5, tEnd - s.t0)), col = ease((t - tEnd) / 1.1);
  const n = 90, base = 820;
  for (let i = 0; i < n; i++) {                        // 一摞记录往上长，再被压扁成一行
    const on = clamp(grow * n - i); if (on <= 0) continue;
    const y0 = base - i * 6.2, y1 = 520, y = lerp(y0, y1, col), w = lerp(560 + rnd(i) * 40, 900, col), h = lerp(5, 3, col), x = W / 2 - w / 2 + lerp((rnd(i + 3) - .5) * 30, 0, col);
    g.globalAlpha = on * lerp(.85, 0, Math.min(1, col * 1.3)); g.fillStyle = i % 9 === 0 ? '#E9E2CF' : '#C9C2B0'; g.fillRect(x, y, w, h);
  }
  g.globalAlpha = 1;
  alpha(grow * (1 - col), () => { text('几万页', W / 2 + 470, base - n * 6.2 * grow, 44, C.gold, 'left'); text('75 年的问卷、病历、访谈', W / 2 + 470, base - n * 6.2 * grow + 50, 26, C.dim, 'left', 500); });
  alpha(col, () => { g.save(); g.shadowColor = GOLD; g.shadowBlur = 40; rr(W / 2 - 460, 470, 920, 100, 50); g.strokeStyle = GOLD; g.lineWidth = 4; g.stroke(); g.restore();
    text('只 有 一 句 话', W / 2, 522, 46, C.gold); });
};

/* ---------- C2：不是财富、名望、拼命工作 → 好的关系。就这样。 ---------- */
function coins(x, y, a, k) { alpha(a, () => { for (let i = 0; i < 7; i++) { const yy = y + 60 - i * 22 + (k > 0 ? i * k * 40 * (i % 2 ? 1 : -.4) : 0);
  g.save(); g.translate(x + (k > 0 ? (i - 3) * k * 18 : 0), yy); g.beginPath(); g.ellipse(0, 0, 90, 26, 0, 0, 7); g.fillStyle = '#B98A2E'; g.fill();
  g.beginPath(); g.ellipse(0, -8, 90, 26, 0, 0, 7); g.fillStyle = '#F2C55C'; g.fill(); g.strokeStyle = '#8E6A22'; g.lineWidth = 3; g.stroke(); g.restore(); } }); }
function starIcon(x, y, r, a, t) { alpha(a, () => { g.save(); g.translate(x, y); g.rotate(Math.sin(t) * .05);
  for (let i = 0; i < 12; i++) { g.strokeStyle = 'rgba(255,230,160,.35)'; g.lineWidth = 3; g.beginPath(); const an = i / 12 * 6.28; g.moveTo(Math.cos(an) * r * 1.2, Math.sin(an) * r * 1.2); g.lineTo(Math.cos(an) * r * 1.75, Math.sin(an) * r * 1.75); g.stroke(); }
  g.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; g.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2); }
  g.closePath(); g.fillStyle = '#FFD66B'; g.shadowColor = '#FFD66B'; g.shadowBlur = 30; g.fill(); g.restore(); }); }
function laptop(x, y, a, t) { alpha(a, () => { g.save(); g.translate(x, y);
  rr(-120, -110, 240, 150, 12); g.fillStyle = '#20264F'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.stroke();
  for (let i = 0; i < 5; i++) { rr(-95, -88 + i * 24, 120 + 60 * rnd(i + Math.floor(t * 3)), 10, 5); g.fillStyle = 'rgba(111,160,255,.6)'; g.fill(); }
  g.beginPath(); g.moveTo(-150, 48); g.lineTo(150, 48); g.lineTo(130, 62); g.lineTo(-130, 62); g.closePath(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill();
  g.beginPath(); g.arc(110, -110, 40, 0, 7); g.fillStyle = '#10142E'; g.fill(); g.strokeStyle = C.orange; g.lineWidth = 4; g.stroke();
  g.strokeStyle = C.text; g.lineWidth = 4; g.beginPath(); g.moveTo(110, -110); g.lineTo(110 + 26 * Math.sin(t * 6), -110 - 26 * Math.cos(t * 6)); g.stroke(); g.restore(); }); }
function strike(x, y, w, k) { if (k <= 0) return; g.save(); g.strokeStyle = RED; g.lineWidth = 10; g.lineCap = 'round'; g.shadowColor = RED; g.shadowBlur = 16;
  g.beginPath(); g.moveTo(x - w / 2, y + 30); g.lineTo(x - w / 2 + w * k, y + 30 - 60 * k); g.stroke(); g.restore(); }
S.C2 = (t, s) => {
  const lt = t - s.t0; stars(t, .8); chapter(SRC, C.orange);
  const out = win(lt, 6.6, .9), xs = [460, 960, 1460], at = [1.8, 3.0, 4.1], names = ['财富', '名望', '拼命工作'];
  const drop = k => (1 - out) * 1 + 0 * k;
  xs.forEach((x, i) => {
    const a = win(lt, .2 + i * .25) * (1 - out), k = ease((lt - at[i]) / .5), y = 420 + out * 120;
    if (i === 0) coins(x, y, a * (1 - .45 * k), 0);
    if (i === 1) starIcon(x, y - 10, 90, a * (1 - .45 * k), lt);
    if (i === 2) laptop(x, y, a * (1 - .45 * k), lt);
    alpha(a, () => text(names[i], x, y + 150, 44, k > .5 ? 'rgba(244,241,234,.45)' : C.text));
    alpha(a, () => strike(x, y, 300, k));
  });
  alpha(win(lt, 7.0) * (1 - win(lt, 13.2, .5)), () => { text('75 年里，最明确的一条结论', W / 2, 470, 58, C.text); text('the clearest message', W / 2, 545, 30, C.gold, 'center', 500, true); });
  // 好的关系：两团光从两侧靠近、连上，再在全屏点亮一张网
  const kc = ease((lt - 12.9) / 1.0), link = ease((lt - 13.6) / .8), web = ease((lt - 15.2) / 2.2);
  if (lt > 12.7) {
    const dx = lerp(700, 170, kc), y = 470;
    lighter(() => { for (let i = 0; i < 120; i++) { const a = rnd(i * 7) * 6.28, r = 260 + rnd(i * 3) * 620, x1 = W / 2 + Math.cos(a) * r * 1.4, y1 = y + Math.sin(a) * r * .6;
        const j = (i * 37) % 120, a2 = rnd(j * 7) * 6.28, r2 = 260 + rnd(j * 3) * 620, x2 = W / 2 + Math.cos(a2) * r2 * 1.4, y2 = y + Math.sin(a2) * r2 * .6, q = clamp(web * 120 - i * .8);
        if (q <= 0) continue; g.globalAlpha = .22 * q; g.strokeStyle = GOLD; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(lerp(x1, x2, .5 * q), lerp(y1, y2, .5 * q)); g.stroke(); dot(x1, y1, 3, GOLD, q * .8); } });
    g.globalAlpha = 1;
    if (link > 0) { g.save(); g.shadowColor = GOLD; g.shadowBlur = 40; g.strokeStyle = GOLD; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 - dx, y); g.lineTo(W / 2 - dx + 2 * dx * link, y); g.stroke(); g.restore(); }
    lighter(() => { dot(W / 2 - dx, y, 26, GOLD, kc); dot(W / 2 + dx, y, 26, GOLD, kc); });
    big('好的关系', W / 2, 330, 84, C.gold, win(lt, 13.7, .5));
    pill('更快乐', W / 2 - 150, 620, 40, '', win(lt, 15.5), TEAL); pill('更健康', W / 2 + 150, 620, 40, '', win(lt, 16.6), TEAL);
    alpha(win(lt, 17.8, .3), () => text('就这样。', W / 2, 740, 50, C.text));
  }
};

/* ---------- CQ：人群里也会孤独；看的不是朋友的数量，是质量 ---------- */
S.CQ = (t, s) => {
  const lt = t - s.t0; stars(t, .6); chapter(SRC, C.orange);
  const p1 = 1 - win(lt, 5.6, .6), cx1 = 620, cx2 = 1330, cy = 470;
  // 左：人群里的一个人
  alpha(win(lt, .4) * p1, () => {
    lighter(() => { for (let i = 0; i < 110; i++) { const a = i * 2.4, r = 70 + Math.sqrt(i / 110) * 230; dot(cx1 + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r, 4, GOLD, .55 + .2 * Math.sin(lt * 2 + i)); } });
    g.setLineDash([8, 10]); g.strokeStyle = 'rgba(111,160,255,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(cx1, cy, 52 + 4 * Math.sin(lt * 2), 0, 7); g.stroke(); g.setLineDash([]);
    lighter(() => dot(cx1, cy, 12, BLUE, .9));
  });
  pill('在人群中孤独', cx1, 800, 36, '', win(lt, 2.0) * p1, BLUE);
  // 右：婚姻里的两个人，中间那根线是断的
  alpha(win(lt, 3.8) * p1, () => {
    g.setLineDash([16, 20]); g.strokeStyle = 'rgba(111,160,255,.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx2 - 130, cy); g.lineTo(cx2 - 25, cy - 18); g.moveTo(cx2 + 25, cy + 18); g.lineTo(cx2 + 130, cy); g.stroke(); g.setLineDash([]);
    lighter(() => { dot(cx2 - 140, cy, 16, BLUE, .9); dot(cx2 + 140, cy, 16, BLUE, .9); });
  });
  pill('在婚姻里孤独', cx2, 800, 36, '', win(lt, 4.3) * p1, BLUE);
  // 第二条结论：数量 vs 质量
  const p2 = win(lt, 6.0, .6);
  alpha(p2, () => { text('第二条结论', W / 2, 150, 40, C.dim, 'center', 600); });
  const qk = ease((lt - 14.9) / 1.2), lx = 600, rx = 1320, y2 = 480;
  alpha(win(lt, 6.6) * (1 - .55 * qk), () => {
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28 + .3, r = 210 + 30 * rnd(i), x = lx + Math.cos(a) * r, y = y2 + Math.sin(a) * r * .8, q = clamp((lt - 8.6) * 4 - i * .25);
      g.strokeStyle = 'rgba(200,205,230,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(lx, y2); g.lineTo(lerp(lx, x, q), lerp(y2, y, q)); g.stroke();
      lighter(() => dot(x, y, 6, GREY, q * .8)); }
    lighter(() => dot(lx, y2, 14, C.text, 1));
    text('朋友的数量', lx, 790, 40, C.text); text('14 个点头之交', lx, 840, 26, C.dim, 'center', 500);
  });
  alpha(win(lt, 13.0) * (1 - .55 * qk), () => text('有没有伴侣', lx, y2 - 260, 30, C.dim, 'center', 600));
  if (qk > 0) {
    [[-200, -90], [190, 110]].forEach(([dx, dy], i) => { const q = clamp(qk * 1.6 - i * .5);
      g.save(); g.shadowColor = GOLD; g.shadowBlur = 30; g.strokeStyle = GOLD; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx, y2); g.lineTo(rx + dx * q, y2 + dy * q); g.stroke(); g.restore();
      lighter(() => dot(rx + dx, y2 + dy, 18, GOLD, q)); });
    lighter(() => dot(rx, y2, 20, GOLD, qk));
    alpha(qk, () => { big('关系的质量', rx, 790, 52, C.gold, 1); text('两个靠得住的人', rx, 842, 26, C.dim, 'center', 500); });
    alpha(win(lt, 16.2), () => text('＞', W / 2 - 40, y2, 90, C.gold));
  }
};

/* ---------- 第一层：孤独伤身（整屏健康曲线，沿用小图的画法放大） ---------- */
S.C3 = (t, s) => {
  const lt = t - s.t0; stars(t, .5); chapter(SRC, C.orange);
  alpha(win(lt, .2), () => text('第一层 · 孤独伤的是身体', W / 2, 105, 40, C.text));
  scaled(PX, 520, W / 2, 505, 1.32, () => panels.C3(lt));
};
/* ---------- 第二层：50 岁的两只表 → 80 岁 ---------- */
S.C4 = (t, s) => {
  const lt = t - s.t0; stars(t, .5); chapter(SRC, C.orange);
  alpha(win(lt, .3), () => { text('50', 210, 520, 260, 'rgba(242,184,75,.07)'); text('80', W - 210, 520, 260, 'rgba(242,184,75,.07)'); });
  scaled(PX, 500, W / 2, 470, 1.32, () => panels.C4(lt));
};
/* ---------- 第三层：靠得住的人护住大脑 ---------- */
S.C5 = (t, s) => {
  const lt = t - s.t0; stars(t, .5); chapter(SRC, C.orange);
  scaled(PX, 470, W / 2, 455, 1.2, () => panels.C5(lt));
};
/* ---------- 他给的办法 ---------- */
S.C6 = (t, s) => {
  const lt = t - s.t0; stars(t, .5); chapter(SRC, C.orange);
  scaled(PX, 500, W / 2, 490, 1.3, () => panels.C6(lt));
};

/* ---------- 片尾：屏幕和人 ---------- */
S.n8 = (t, s) => {
  stars(t, .6); chapter('最后', C.gold);
  const tAI = subAt(s, /十年过去/, 4), tGive = subAt(s, /能交给/, 9), tSave = subAt(s, /省下来/, 12), end = window.TL.dur;
  const px = 640, py = 470, kAI = win(t, tAI, .6), give = ease((t - tGive) / 1.4), save = ease((t - tSave) / 1.3);
  // 一部手机，里面是一屏 AI 对话
  alpha(win(t, s.t0 + .1) * (1 - save * .85), () => {
    g.save(); g.translate(px, py); rr(-150, -260, 300, 520, 40); g.fillStyle = '#10142E'; g.fill(); g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.75)'; g.stroke();
    for (let i = 0; i < 7; i++) { const me = i % 2 === 0, w = 120 + 70 * rnd(i + 4), y = -200 + i * 62 - give * (i + 1) * 30, a = clamp(kAI * 7 - i) * (1 - give);
      if (a <= 0) continue; g.globalAlpha = a; rr(me ? 120 - w : -120, y, w, 44, 16); g.fillStyle = me ? 'rgba(111,160,255,.85)' : 'rgba(255,255,255,.18)'; g.fill();
      if (!me) text('AI', -100 + 18, y + 22, 18, C.gold, 'left', 700); }
    g.globalAlpha = 1; g.restore();
  });
  pill('每天聊得最多的对象', px, 790, 32, '', kAI * (1 - give), BLUE);
  // 交出去：对话气泡飞进右边的 AI 方块
  alpha(give * (1 - save * .8), () => { g.save(); g.translate(1260, py); rr(-120, -120, 240, 240, 36); g.fillStyle = 'rgba(111,160,255,.18)'; g.fill(); g.strokeStyle = BLUE; g.lineWidth = 4; g.stroke();
    text('AI', 0, -6, 80, C.text); g.restore(); });
  alpha(give * (1 - save), () => text('能交给 AI 的事，都交出去', 1260, 680, 34, C.text));
  // 留给人：两颗光点连上，背景的星星也一对对连起来
  if (save > 0) {
    lighter(() => { for (let i = 0; i < 40; i++) { const x = rnd(i * 13) * W, y = 160 + rnd(i * 17) * 700, x2 = x + 40 + 50 * rnd(i), q = clamp(save * 2 - i * .03);
      g.globalAlpha = .4 * q; g.strokeStyle = GOLD; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, x2, q), y + 10); g.stroke(); dot(x, y, 4, GOLD, q * .7); dot(x2, y + 10, 4, GOLD, q * .7); } });
    g.globalAlpha = 1; pair(W / 2, 470, 220 * save, save, t, 12);
    big('省下来的时间，留给靠得住的人', W / 2, 650, 56, C.gold, win(t, tSave + .3, .6));
  }
  alpha(win(t, end - 2.8, .6), () => { text((window.PLAN || {}).account || 'Krypto说AI', W - 90, H - 120, 34, C.text, 'right'); text('AI builder · 带你拉开和身边人的差距', W - 90, H - 76, 22, C.dim, 'right', 500); });
};
})(window.KIT);
