/* Claude Code 团队怎么用 Claude Code · 横版解说片动画层
 * 分镜见 ../storyboard.md；时间线 timeline.json 由 build_timeline.py 生成，render.js 注入 window.TL。
 * 原片画面不在这里画：这里只在卡片位置画边框和光晕，原片由 compose.py 用圆角遮罩叠在上面（RECTS 两边共用）。
 * 贯穿形象：「人 → Claude」的指令线。开头一串气泡（一句一步、一个个「允许」），每个转变少一样，最后只剩一张金色「目标」卡。 */
(function () {
'use strict';
const W = 1920, H = 1080;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { bg0: '#0D1230', bg1: '#1B1340', text: '#F4F1EA', dim: '#9AA3C7', gold: '#F2B84B', orange: '#FF8A3D', blue: '#5B8CFF',
            teal: '#3CC8B4', red: '#FF5A5F', card: 'rgba(22,26,56,.92)', line: 'rgba(255,255,255,.85)' };
const FONT = '"Noto Sans CJK SC","Noto Sans CJK JP","WenQuanYi Zen Hei",sans-serif';
const RECTS = window.RECTS;

/* ---------- 小工具 ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const back = k => { k = clamp(k); const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const win = (t, a, d = .45) => ease((t - a) / d);            // a 秒开始，d 秒内 0→1
function rr(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function font(px, w = 700, it = false) { g.font = `${it ? 'italic ' : ''}${w} ${px}px ${FONT}`; }
function text(s, x, y, px, col = C.text, align = 'center', w = 700, it = false) { font(px, w, it); g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function tw(s, px, w = 700, it = false) { font(px, w, it); return g.measureText(s).width; }
function alpha(a, fn) { g.save(); g.globalAlpha *= clamp(a); fn(); g.restore(); }

/* ---------- 底：深蓝紫 + 漂动光斑 ---------- */
const ORBS = [[.15, .25, 380, C.orange, .16], [.82, .2, 420, C.blue, .18], [.7, .8, 360, C.teal, .12], [.3, .85, 300, C.blue, .12], [.5, .45, 500, '#7A5BFF', .08], [.95, .6, 260, C.orange, .1]];
function bg(t) {
  const lg = g.createLinearGradient(0, 0, W, H); lg.addColorStop(0, C.bg0); lg.addColorStop(1, C.bg1);
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  ORBS.forEach(([x, y, r, col, a], i) => {
    const cx = (x + .03 * Math.sin(t * .13 + i * 1.7)) * W, cy = (y + .03 * Math.cos(t * .11 + i)) * H;
    const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    alpha(a, () => { g.fillStyle = rg; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); });
  });
}

/* ---------- 通用组件 ---------- */
function chapter(s, col = C.gold) {          // 左上常驻章节标签
  g.fillStyle = col; g.beginPath(); g.arc(70, 60, 7, 0, 7); g.fill();
  text(s, 88, 61, 28, 'rgba(244,241,234,.86)', 'left', 600);
}
function pill(s, x, y, px = 36, en = '', a = 1, col = C.line) {   // 居中胶囊，可带英文斜体
  alpha(a, () => {
    const w1 = tw(s, px), w2 = en ? tw(en, px * .72, 500, true) + 16 : 0, w = w1 + w2 + px * 1.3, h = px * 1.7;
    rr(x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = 'rgba(16,20,46,.9)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = col; g.stroke();
    text(s, x - w / 2 + px * .65 + w1 / 2, y + 1, px);
    if (en) text(en, x - w / 2 + px * .65 + w1 + 16 + (w2 - 16) / 2, y + 2, px * .72, C.gold, 'center', 500, true);
  });
}
function card(x, y, w, h, r = 22, fill = C.card, stroke = 'rgba(255,255,255,.18)') { rr(x, y, w, h, r); g.fillStyle = fill; g.fill(); g.lineWidth = 2; g.strokeStyle = stroke; g.stroke(); }
function glowFrame(R, a = 1, col = C.orange) {     // 原片卡片的外框和光晕（原片由 compose 叠在框里）
  alpha(a, () => {
    g.save(); g.shadowColor = col; g.shadowBlur = 50; rr(R.x - 4, R.y - 4, R.w + 8, R.h + 8, R.r + 4); g.fillStyle = 'rgba(0,0,0,.6)'; g.fill(); g.restore();
    rr(R.x - 3, R.y - 3, R.w + 6, R.h + 6, R.r + 3); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
  });
}
function subNar(s, a) {                         // 旁白字幕：底部单行中文
  alpha(a, () => { const w = tw(s, 40, 600) + 56; rr(W / 2 - w / 2, 958, w, 66, 10); g.fillStyle = 'rgba(0,0,0,.72)'; g.fill(); text(s, W / 2, 992, 40, C.text, 'center', 600); });
}
function subClip(zh, en, a) {                   // 原声字幕：中文大 + 英文小
  alpha(a, () => {
    const w = Math.max(tw(zh, 40, 700), tw(en, 25, 500)) + 64; rr(W / 2 - w / 2, 918, w, 118, 12); g.fillStyle = 'rgba(0,0,0,.74)'; g.fill();
    text(zh, W / 2, 955, 40, C.text, 'center', 700); text(en, W / 2, 1006, 25, 'rgba(244,241,234,.72)', 'center', 500);
  });
}
function check(x, y, s, col = C.teal, k = 1) {
  g.save(); g.strokeStyle = col; g.lineWidth = s * .16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  const pts = [[x - s * .35, y], [x - s * .08, y + s * .28], [x + s * .4, y - s * .32]];
  const L1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), L2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]), L = (L1 + L2) * clamp(k);
  g.moveTo(...pts[0]);
  if (L <= L1) g.lineTo(lerp(pts[0][0], pts[1][0], L / L1), lerp(pts[0][1], pts[1][1], L / L1));
  else { g.lineTo(...pts[1]); const q = (L - L1) / L2; g.lineTo(lerp(pts[1][0], pts[2][0], q), lerp(pts[1][1], pts[2][1], q)); }
  g.stroke(); g.restore();
}
function cross(x, y, s, col = C.red) { g.save(); g.strokeStyle = col; g.lineWidth = s * .16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - s * .3, y - s * .3); g.lineTo(x + s * .3, y + s * .3); g.moveTo(x + s * .3, y - s * .3); g.lineTo(x - s * .3, y + s * .3); g.stroke(); g.restore(); }
function goalCard(x, y, s = 1, a = 1) {         // 金色「目标」卡
  alpha(a, () => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.shadowColor = C.gold; g.shadowBlur = 40; rr(-170, -70, 340, 140, 24); g.fillStyle = '#2A2140'; g.fill(); g.shadowBlur = 0;
    g.lineWidth = 4; g.strokeStyle = C.gold; g.stroke();
    [34, 22, 10].forEach((r, i) => { g.beginPath(); g.arc(-90, 0, r, 0, 7); g.fillStyle = i % 2 ? '#2A2140' : C.gold; g.fill(); }); text('目标', 34, 0, 56, C.gold);
    g.restore();
  });
}

/* ---------- 指令线：一串气泡（S1 / S3 / S8 共用） ---------- */
const MSGS = ['把这个函数改一下', '可以运行 npm test 吗？', '先别动别的文件', '要修改 auth.ts，允许吗？', '这里改成 async', '要删除 3 行，允许吗？', '再跑一遍测试', '要执行 git commit，允许吗？', '变量名换一下', '要安装依赖，允许吗？'];
function bubbles(t, x, top, bottom, scroll, collapse = 0, a = 1) {
  g.save(); rr(x - 20, top, 700, bottom - top, 20); g.clip();
  const step = 92, n = 40;
  for (let i = 0; i < n; i++) {
    let y = top + 40 + i * step - scroll;
    if (y < top - step || y > bottom + step) continue;
    const mid = (top + bottom) / 2; y = lerp(y, mid, collapse);
    const user = i % 2 === 0, m = MSGS[i % MSGS.length], ask = m.includes('允许');
    const w = tw(m, 28, 500) + 48 + (ask ? 190 : 0), bx = user ? x + 660 - w : x;
    alpha(a * (1 - collapse), () => {
      rr(bx, y, w, 66, 18); g.fillStyle = user ? 'rgba(91,140,255,.85)' : 'rgba(255,255,255,.12)'; g.fill();
      text(m, bx + 24, y + 34, 28, C.text, 'left', 500);
      if (ask) {
        const clicked = clamp((top + 360 - (top + 40 + i * step - scroll)) / 60);   // 气泡滚到上半屏时「允许」被点掉
        rr(bx + w - 176, y + 13, 78, 40, 10); g.fillStyle = clicked > .5 ? C.teal : 'rgba(60,200,180,.35)'; g.fill(); text('允许', bx + w - 137, y + 34, 22, C.text);
        rr(bx + w - 92, y + 13, 78, 40, 10); g.fillStyle = 'rgba(255,255,255,.15)'; g.fill(); text('拒绝', bx + w - 53, y + 34, 22, C.dim);
      }
    });
  }
  g.restore();
}

/* ---------- 各镜头 ---------- */
const S = {};
/* 11-02 v2 开场：画面是原片（全景 → Thariq → Robert 和 Sid），旁白快速交代背景和人物；o4 再接「一年前」的气泡 */
function openCard(t, k0) {
  const R = RECTS.wide;
  glowFrame(R, win(t, 0, .3), C.blue);
  alpha(win(t, .1, .4), () => {
    const a1 = 'Claude Code 团队，', a2 = '自己怎么用 Claude Code？', w1 = tw(a1, 52), w2 = tw(a2, 52), x0 = W / 2 - (w1 + w2) / 2;
    text(a1, x0, 82, 52, C.text, 'left'); text(a2, x0 + w1, 82, 52, C.gold, 'left');
  });
}
S.o1 = (t, s) => {
  chapter('Anthropic 官方对谈', C.blue); openCard(t);
  pill('Claude Code 团队 · 三位工程师', W / 2, RECTS.wide.y + RECTS.wide.h + 46, 28, '', win(t, s.t0 + .8), 'rgba(255,255,255,.55)');
};
S.o2 = (t, s) => {
  chapter('Anthropic 官方对谈', C.blue); openCard(t);
  pill('Thariq Shihipar · 提问', W / 2, RECTS.wide.y + RECTS.wide.h + 46, 30, '', win(t, s.t0 + .1), C.gold);
};
S.o3 = (t, s) => {
  chapter('Anthropic 官方对谈', C.blue); openCard(t);
  const R = RECTS.wide;
  pill('Sid Bidasaria', R.x + R.w * .74, R.y + R.h + 46, 30, '', win(t, s.t0 + .1), C.gold);
  pill('Robert Boyce · 在做 Claude Tag', R.x + R.w * .26, R.y + R.h + 46, 30, '', win(t, s.t0 + 1.2), C.gold);
};
/* 11-02 v4：学 Jim 的旁白形式。q1 问题 + 答案前置，q2 判断（盖章），q3 三步路线图，r1/r2 每步回顾一句，n8 回到判断 */
const STEPS = ['从盯过程到给目标', '功能随时准备删', '人最后还剩什么'];
const PX = 1500;   // 右侧小图 / 右栏中心
const subsOf = s => window.TL.subs.filter(x => x.a >= s.t0 - .01 && x.a < s.t1);
const subAt = (s, re, dflt) => { const x = subsOf(s).find(x => re.test(x.zh)); return x ? x.a : s.t0 + dflt; };   // 按字幕内容找时间点，不按行号
function stamp(x, y, k, s1 = '站得住', col = C.teal) {       // 判断的「章」
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(-.12); const sc = lerp(1.8, 1, back(k)); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2);
  rr(-130, -50, 260, 100, 16); g.lineWidth = 6; g.strokeStyle = col; g.stroke(); text(s1, 0, 2, 50, col); g.restore();
}
function roadmap(t, active, done, y = 520, sc = 1, a = 1, t0 = 0) {   // 三步路线图
  alpha(a, () => STEPS.forEach((n, i) => {
    const x = W / 2 + (i - 1) * 520 * sc, on = i === active, ok = i < done;
    alpha(win(t, t0 + i * .25), () => {
      card(x - 230 * sc, y - 110 * sc, 460 * sc, 220 * sc, 26 * sc, on ? 'rgba(242,184,75,.16)' : C.card, on ? C.gold : ok ? 'rgba(60,200,180,.7)' : 'rgba(255,255,255,.22)');
      text(['①', '②', '③'][i], x, y - 42 * sc, 64 * sc, on ? C.gold : ok ? C.teal : C.dim);
      text(n, x, y + 48 * sc, 36 * sc, on || ok ? C.text : 'rgba(244,241,234,.6)');
    });
  }));
}
/* 11-02 用户：q1–q3 画面上也要带原片。版式：顶部一行问题，左卡片原片（compose 叠进 RECTS.left），右边答案卡 / 盖章 / 竖排路线图 */
function headline(t, a1, a2, t0) {
  alpha(win(t, t0, .4), () => { const w1 = tw(a1, 50), w2 = a2 ? tw(a2, 50) : 0, x0 = W / 2 - (w1 + w2) / 2;
    text(a1, x0, 82, 50, a2 ? C.text : C.gold, 'left'); if (a2) text(a2, x0 + w1, 82, 50, C.gold, 'left'); });
}
S.q1 = (t, s) => {                    // 问题 → 答案先放在前面
  const ans = subAt(s, /^答案/, 2.5), col = subAt(s, /下指令/, 4);
  chapter('答案先放在前面', C.gold);
  headline(t, '做 Claude Code 的人，', '自己怎么用 Claude Code？', s.t0);
  glowFrame(RECTS.left, win(t, s.t0, .3), C.blue);
  alpha(win(t, ans, .4), () => text('答案先放在前面', PX, 290, 32, C.dim, 'center', 600));
  goalCard(PX, 440, lerp(.6, 1, ease((t - col) / .7)), win(t, col, .5));
  alpha(win(t, col + .6, .5), () => { text('不下指令，', PX, 590, 44, C.text); text('只给目标', PX, 652, 44, C.gold); });
};
S.q2 = (t, s) => {                    // 判断：站得住，前提是模型够好
  const yes = subAt(s, /^站得住/, 1.6), pre = subAt(s, /^模型得先/, 3);
  chapter('判断', C.gold);
  headline(t, '这句话站得住吗？', '', s.t0);
  glowFrame(RECTS.left, 1, C.blue);
  goalCard(PX, 390, .9, 1); text('不下指令，只给目标', PX, 500, 32, C.text);
  stamp(PX + 150, 300, (t - yes) / .45);
  alpha(win(t, pre, .4), () => { pill('前提：模型得先好到', PX, 640, 34, '', 1, C.teal); text('让人敢放手', PX, 730, 40, C.teal); });
};
S.q3 = (t, s) => {                    // 三步路线图（竖排），随旁白依次点亮
  let active = -1;
  [/^第一/, /^第二/, /^第三/].forEach((re, i) => { if (t >= subAt(s, re, 1e9)) active = i; });
  chapter('分三步看', C.gold);
  headline(t, '分三步看', '', s.t0);
  glowFrame(RECTS.left, 1, C.blue);
  STEPS.forEach((n, i) => alpha(win(t, s.t0 + .2 + i * .25), () => {
    const y = 300 + i * 190, on = i === active;
    card(PX - 300, y - 75, 600, 150, 24, on ? 'rgba(242,184,75,.16)' : C.card, on ? C.gold : 'rgba(255,255,255,.22)');
    text(['①', '②', '③'][i], PX - 220, y, 56, on ? C.gold : C.dim);
    text(n, PX + 40, y, 38, on ? C.text : 'rgba(244,241,234,.6)');
  }));
};
function recap(t, s, sentence, step) {   // 每步结尾：这一步只要记住一句
  chapter(`第${'一二三'[step]}步 · ${STEPS[step]}`, C.gold);
  roadmap(t, -1, step + 1, 170, .55, win(t, s.t0, .4));
  alpha(win(t, s.t0 + .1, .4), () => {
    card(W / 2 - 640, 360, 1280, 400, 32, 'rgba(22,26,56,.95)', C.gold);
    text('这一步只要记住一句', W / 2, 440, 34, C.dim, 'center', 600);
  });
  const parts = sentence.split('，');
  parts.forEach((p, i) => alpha(win(t, s.t0 + .6 + i * .5, .4), () => text(p + (i < parts.length - 1 ? '，' : ''), W / 2, 560 + i * 92, 64, i === parts.length - 1 ? C.gold : C.text)));
}
S.r1 = (t, s) => recap(t, s, '交给它一个目标，步骤让它自己排', 0);
S.r2 = (t, s) => recap(t, s, '今天救命的功能，明年可能就是包袱', 1);
S.n3 = (t, s) => {                    // ① 不盯过程，只给目标
  const p = clamp((t - s.t0) / (s.t1 - s.t0));
  chapter('第一步 · ' + STEPS[0]);
  pill('目标', W / 2, 150, 40, 'goal', win(t, s.t0));
  const col = ease((t - s.t0 - .3) / 1.4);
  bubbles(t, 160, 240, 900, 1200 + (t - s.t0) * 70, col, 1 - col * .3);
  const fly = ease((t - s.t0 - 1.6) / 1.2);
  // Slack 样的对话框
  alpha(win(t, s.t0 + .8), () => {
    card(1050, 260, 700, 560, 22); rr(1050, 260, 180, 560, 22); g.fillStyle = 'rgba(74,21,75,.9)'; g.fill();
    text('# claude-tag', 1140, 310, 24, C.text, 'center', 600); text('Slack', 1400, 300, 26, C.dim, 'left', 600);
  });
  goalCard(lerp(510, 1480, fly), lerp(570, 470, fly), lerp(1, .85, fly), clamp((t - s.t0 - .9) / .5));
  alpha(win(t, s.t0 + 3), () => { text('70–80%', 1480, 680, 80, C.gold); text('Sid 的工作在 Claude Tag 上完成', 1480, 760, 28, C.dim, 'center', 500); });
};
S.bridge = (t, s) => {                // 过桥：动画卡缩到左边 + 原片小窗 + 一行要点
  chapter('第一步 · ' + STEPS[0]);
  const k = win(t, s.t0, .5);
  alpha(1, () => { card(lerp(1050, 200, k), lerp(260, 330, k), lerp(700, 560, k), lerp(560, 400, k), 22); goalCard(lerp(1480, 480, k), 530, .85); });
  glowFrame(RECTS.mini, k);
  alpha(k, () => text(s.label, RECTS.mini.x + RECTS.mini.w / 2, RECTS.mini.y + RECTS.mini.h + 50, 32, C.text));
};
S.n4 = (t, s) => {                    // ② 功能是临时的
  chapter('第二步 · ' + STEPS[1]);
  pill('随时准备删', W / 2, 150, 40, 'temporary', win(t, s.t0));
  alpha(win(t, s.t0 + .2), () => {
    card(W / 2 - 260, 300, 520, 520, 26);
    text('待办清单', W / 2, 360, 38, C.text);
    for (let i = 0; i < 5; i++) { rr(W / 2 - 200, 420 + i * 72, 40, 40, 8); g.lineWidth = 3; g.strokeStyle = C.dim; g.stroke(); rr(W / 2 - 140, 432 + i * 72, 300 - i * 30, 16, 8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); }
  });
  alpha(win(t, s.t0 + .9), () => { g.save(); g.translate(W / 2 + 240, 320); g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fillStyle = '#2A2140'; g.fill(); g.lineWidth = 5; g.strokeStyle = C.orange; g.stroke();
    const a = (t - s.t0) * 4; g.strokeStyle = C.text; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(38 * Math.sin(a), -38 * Math.cos(a)); g.moveTo(0, 0); g.lineTo(0, -26); g.stroke(); g.restore(); });
};
S.n5 = (t, s) => {                    // 每两个月换一次
  chapter('第二步 · ' + STEPS[1]);
  pill('每 2 个月', W / 2, 150, 40, 'every two months', win(t, s.t0));
  const y = 640, x0 = 240, x1 = 1680;
  alpha(win(t, s.t0 + .1), () => { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); });
  const names = ['待办清单', '功能 B', '功能 C', '功能 D', '功能 E'];
  for (let i = 0; i < 5; i++) {
    const x = x0 + 120 + i * 300, at = s.t0 + .3 + i * .55;
    alpha(win(t, at, .3), () => { g.fillStyle = C.gold; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); text(i === 0 ? '现在' : `+${i * 2} 个月`, x, y + 50, 26, C.dim, 'center', 500); });
    const up = back((t - at) / .5), gone = ease((t - at - .9) / .5);
    alpha(up * (1 - gone * .75), () => { card(x - 110, y - 210 - gone * 60, 220, 110, 18, i === 0 ? 'rgba(242,184,75,.22)' : C.card, i === 0 ? C.gold : 'rgba(255,255,255,.3)'); text(names[i], x, y - 155 - gone * 60, 30, C.text); });
  }
};
S.n6 = (t, s) => {                    // ③ 人只看大局：以前审代码
  chapter('第三步 · ' + STEPS[2]);
  pill('人还剩什么', W / 2, 150, 40, 'big picture', win(t, s.t0));
  codeBlock(W / 2 - 420, 260, 840, 600, win(t, s.t0 + .1));
  [[.3, 3], [.9, 6], [1.5, 9]].forEach(([d, line]) => circle(W / 2 - 420, 260, line, win(t, s.t0 + d, .3)));
};
function codeBlock(x, y, w, h, a) {
  alpha(a, () => {
    card(x, y, w, h, 20, 'rgba(12,14,30,.95)');
    const cols = [C.blue, C.teal, C.text, C.orange, C.dim];
    for (let i = 0; i < 12; i++) { const ly = y + 50 + i * 44, ind = [0, 1, 1, 2, 2, 1, 2, 2, 1, 0, 1, 1][i], len = [380, 300, 420, 260, 340, 200, 380, 300, 240, 120, 360, 280][i];
      text(String(i + 1), x + 40, ly, 22, 'rgba(154,163,199,.6)', 'center', 500);
      rr(x + 80 + ind * 40, ly - 9, len * w / 840, 18, 9); g.fillStyle = cols[i % 5]; g.globalAlpha *= .55; g.fill(); g.globalAlpha /= .55; }
  });
}
function circle(x, y, line, k, col = C.red) {
  if (k <= 0) return; const cx = x + 80 + 160, cy = y + 50 + line * 44;
  g.save(); g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, 150, 30, -.05, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * k); g.stroke(); g.restore();
}
S.n7 = (t, s) => {                    // 拉远成服务地图：只盯接口和边界；盖住思考过程
  chapter('第三步 · ' + STEPS[2]);
  const d = s.t1 - s.t0, z = ease((t - s.t0) / 1.2);
  alpha(1 - z, () => codeBlock(W / 2 - 420, 260, 840, 600, 1));
  const nodes = [[560, 380, 'API'], [960, 330, '订单'], [1360, 380, '支付'], [700, 650, '用户'], [1220, 650, '通知']];
  const edges = [[0, 1], [1, 2], [0, 3], [1, 4], [3, 4], [2, 4]];
  alpha(z, () => {
    edges.forEach(([a, b], i) => { const hl = i === 0 || i === 4; g.strokeStyle = hl ? C.gold : 'rgba(255,255,255,.3)'; g.lineWidth = hl ? 6 : 3; g.beginPath(); g.moveTo(nodes[a][0], nodes[a][1]); g.lineTo(nodes[b][0], nodes[b][1]); g.stroke(); });
    nodes.forEach(([x, y, n]) => { card(x - 100, y - 48, 200, 96, 18); text(n, x, y, 32, C.text); });
  });
  alpha(win(t, s.t0 + 1.4), () => { pill('接口怎么设计', 760, 250, 28, '', 1, C.gold); });
  alpha(win(t, s.t0 + 2.4), () => { pill('边界划在哪', 960, 760, 28, '', 1, C.gold); });
  const veil = win(t, s.t0 + d * .62, .6);
  alpha(veil, () => { rr(380, 200, 1160, 640, 30); g.fillStyle = 'rgba(13,18,48,.86)'; g.fill(); text('思考过程', W / 2, 470, 44, C.dim, 'center', 500); text('· · ·', W / 2, 540, 44, C.dim); });
  alpha(win(t, s.t0 + d * .62 + .5), () => { card(W / 2 - 150, 640, 300, 100, 20, 'rgba(60,200,180,.2)', C.teal); text('结果', W / 2 - 20, 690, 36, C.text); check(W / 2 + 70, 690, 44, C.teal, 1); });
};
S.n8 = (t, s, seg, tl) => {           // 收尾：回到开头那个判断（目标卡 + 章），三步全亮
  const end = tl.dur, because = subAt(s, /^站得住/, 1.5);
  chapter('回到开头的判断', C.gold);
  roadmap(t, -1, 3, 170, .55, win(t, s.t0, .4));
  goalCard(W / 2, 520, 1.3, win(t, s.t0 + .1, .5));
  stamp(W / 2 + 360, 430, (t - because) / .45);
  alpha(win(t, because + .4, .5), () => text('因为模型已经好到，让人敢放手', W / 2, 720, 40, C.teal));
  alpha(win(t, end - 2.8, .6), () => { text('Krypto说AI', W - 90, H - 120, 34, C.text, 'right'); text('AI builder · 活全交给 AI 两年', W - 90, H - 76, 22, C.dim, 'right', 500); });
};

/* ---------- 原声段（含右侧小图） ---------- */
function clipSeg(t, s) {
  const R = RECTS[s.layout];
  chapter(`${s.who} 原声 | Anthropic`, C.orange);
  glowFrame(R, win(t, s.t0 - .1, .35));
  const lt = t - s.t0;
  if (s.id === 'C4') panelC4(lt);
  if (s.id === 'C6') panelC6(lt);
}
function panelC4(lt) {               // 11-02 v2：片段从「给它五件事」开始；剪口在 8.0（一年后）和 12.2（毫不留恋）
  const boxes = all => { for (let i = 0; i < 5; i++) { const y = 330 + i * 86; rr(PX - 150, y, 56, 56, 12); g.lineWidth = 4; g.strokeStyle = C.dim; g.stroke();
    const done = i < 3 ? win(lt, .7 + i * .45, .3) : (all ? win(lt, 5.8 + (i - 3) * .5, .3) : 0); if (done > 0) check(PX - 122, y + 28, 46, C.teal, done);
    rr(PX - 70, y + 20, 200 - i * 12, 16, 8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); } };
  alpha(win(lt, 0) * (1 - win(lt, 7.8)), () => {
    text('5 件事', PX, 270, 34, C.text);
    boxes(lt > 4.6);
    alpha(win(lt, 2.6) * (1 - win(lt, 4.6)), () => text('放弃', PX + 170, 330 + 3 * 86 + 28, 32, C.red));
    alpha(win(lt, 4.6, .5), () => pill('待办清单', PX, 790, 30, 'to-do list', 1, C.gold));
  });
  alpha(win(lt, 8.1) * (1 - win(lt, 12.2)), () => {
    g.save(); g.setLineDash([14, 12]); rr(PX - 200, 330, 400, 420, 24); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke(); g.restore();
    text('待办清单', PX, 520, 36, 'rgba(244,241,234,.35)'); text('一年后', PX, 270, 34, C.gold);
  });
  alpha(win(lt, 12.5), () => { pill('毫不留恋', PX, 470, 40, 'unattached', 1, C.gold); text('做出来的东西，很快会消失', PX, 580, 28, C.dim, 'center', 500); });
}
function panelC6(lt) {
  const x = PX - 330, y = 250;
  alpha(win(lt, .1), () => { g.save(); g.translate(x, y); g.scale(.78, .78); codeBlock(0, 0, 840, 600, 1);
    [[.6, 3], [1.4, 6], [2.2, 9]].forEach(([d, line], i) => { const erase = win(lt, 8.6 + i * .5, .4); circle(0, 0, line, win(lt, d, .3) * (1 - erase)); if (erase > 0) check(400 + 80, 50 + line * 44, 50, C.teal, erase); });
    g.restore(); });
  alpha(win(lt, 3.8) * (1 - win(lt, 7.6)), () => pill('我看过了', PX, 800, 32, '', 1, C.red));
  alpha(win(lt, 8.3) * (1 - win(lt, 12.6)), () => pill('Claude 自己找、自己改', PX, 800, 30, '', 1, C.teal));
  alpha(win(lt, 12.8), () => pill('重点不在这里', PX, 800, 32, '', 1, C.gold));
}

/* ---------- 主绘制 ---------- */
window.seek = function (t) {
  const tl = window.TL;
  bg(t);
  // 当前段；落在两段之间的空隙时保持上一段的画面
  let seg = tl.segs.find(x => t >= x.t0 && t < x.t1);
  if (!seg) { const prev = tl.segs.filter(x => x.t1 <= t); seg = prev.length ? prev[prev.length - 1] : tl.segs[0]; }
  if (seg.kind === 'clip') clipSeg(t, seg);
  else if (seg.kind === 'bridge') S.bridge(t, seg);
  else (S[seg.id] || (() => {}))(t, seg, seg, tl);
  const sub = tl.subs.find(x => t >= x.a && t < x.b);
  if (sub) { const a = Math.min(win(t, sub.a, .15), 1 - win(t, sub.b - .12, .12)); sub.kind === 'clip' ? subClip(sub.zh, sub.en, a) : subNar(sub.zh, a); }
};
})();
