/* explainer-film 动画层组件库 + 通用镜头（render.js 注入 window.TL / RECTS / PLAN 后加载本文件，再加载项目的 scenes.js）
 * 原片画面不在这里画：这里只在卡片位置画边框和光晕，原片由 compose.py 用圆角遮罩叠上去（RECTS 两边共用）。
 * 每个镜头 = 一个函数 (t, seg) → 画一帧。查找顺序：项目 scenes.js 写的 KIT.S[id] → plan.json 里 scenes[id].type 对应的通用镜头。
 * 原声段：clipSeg 画外框 + 章节标签；项目可以在 KIT.panels[clipId] 写右侧小图（layout 为 left 时右栏 x≈1110–1890 是空的）。 */
(function () {
'use strict';
const W = 1920, H = 1080;
const cv = document.getElementById('c'), g = cv.getContext('2d');
const C = { bg0: '#0D1230', bg1: '#1B1340', text: '#F4F1EA', dim: '#9AA3C7', gold: '#F2B84B', orange: '#FF8A3D', blue: '#5B8CFF',
            teal: '#3CC8B4', red: '#FF5A5F', card: 'rgba(22,26,56,.92)', line: 'rgba(255,255,255,.85)' };
const FONT = '"Noto Sans CJK SC","Noto Sans CJK JP","WenQuanYi Zen Hei",sans-serif';
const RECTS = window.RECTS, PLAN = window.PLAN || {};
const PX = 1500;                                   // 右栏中心（left 版式时）

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
const subsOf = s => window.TL.subs.filter(x => x.a >= s.t0 - .01 && x.a < s.t1);
// 按字幕内容找时间点（不按行号：长句会被拆成几行，行号会错位）。re 可以是正则或字符串
const subAt = (s, re, dflt) => { const r = typeof re === 'string' ? new RegExp(re) : re; const x = subsOf(s).find(x => r.test(x.zh)); return x ? x.a : s.t0 + dflt; };

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
function pill(s, x, y, px = 36, en = '', a = 1, col = C.line) {   // 胶囊标签，可带英文斜体
  alpha(a, () => {
    const w1 = tw(s, px), w2 = en ? tw(en, px * .72, 500, true) + 16 : 0, w = w1 + w2 + px * 1.3, h = px * 1.7;
    rr(x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = 'rgba(16,20,46,.9)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = col; g.stroke();
    text(s, x - w / 2 + px * .65 + w1 / 2, y + 1, px);
    if (en) text(en, x - w / 2 + px * .65 + w1 + 16 + (w2 - 16) / 2, y + 2, px * .72, C.gold, 'center', 500, true);
  });
}
function card(x, y, w, h, r = 22, fill = C.card, stroke = 'rgba(255,255,255,.18)') { rr(x, y, w, h, r); g.fillStyle = fill; g.fill(); g.lineWidth = 2; g.strokeStyle = stroke; g.stroke(); }
function glowFrame(R, a = 1, col = C.orange) {     // 原片卡片的外框和光晕
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
function keyCard(label, x, y, s = 1, a = 1) {   // 金色关键词卡（贯穿形象的终点，比如「目标」）
  alpha(a, () => {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.shadowColor = C.gold; g.shadowBlur = 40; rr(-170, -70, 340, 140, 24); g.fillStyle = '#2A2140'; g.fill(); g.shadowBlur = 0;
    g.lineWidth = 4; g.strokeStyle = C.gold; g.stroke();
    [34, 22, 10].forEach((r, i) => { g.beginPath(); g.arc(-90, 0, r, 0, 7); g.fillStyle = i % 2 ? '#2A2140' : C.gold; g.fill(); }); text(label, 34, 0, 56, C.gold);
    g.restore();
  });
}
function stamp(x, y, k, s1 = '站得住', col = C.teal) {   // 判断的「章」
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.rotate(-.12); const sc = lerp(1.8, 1, back(k)); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2);
  rr(-130, -50, 260, 100, 16); g.lineWidth = 6; g.strokeStyle = col; g.stroke(); text(s1, 0, 2, 50, col); g.restore();
}
const STEPS = PLAN.steps || [];
const NUM = ['①', '②', '③', '④', '⑤'], CN = '一二三四五';
function roadmap(t, active, done, y = 520, sc = 1, a = 1, t0 = 0) {   // 横排路线图
  const n = STEPS.length;
  alpha(a, () => STEPS.forEach((s, i) => {
    const x = W / 2 + (i - (n - 1) / 2) * 520 * sc, on = i === active, ok = i < done;
    alpha(win(t, t0 + i * .25), () => {
      card(x - 230 * sc, y - 110 * sc, 460 * sc, 220 * sc, 26 * sc, on ? 'rgba(242,184,75,.16)' : C.card, on ? C.gold : ok ? 'rgba(60,200,180,.7)' : 'rgba(255,255,255,.22)');
      text(NUM[i], x, y - 42 * sc, 64 * sc, on ? C.gold : ok ? C.teal : C.dim);
      text(s, x, y + 48 * sc, 36 * sc, on || ok ? C.text : 'rgba(244,241,234,.6)');
    });
  }));
}
function headline(t, a1, a2, t0) {             // 顶部一行大字（两段：白 + 金；只给一段时整段金）
  alpha(win(t, t0, .4), () => { const w1 = tw(a1, 50), w2 = a2 ? tw(a2, 50) : 0, x0 = W / 2 - (w1 + w2) / 2;
    text(a1, x0, 82, 50, a2 ? C.text : C.gold, 'left'); if (a2) text(a2, x0 + w1, 82, 50, C.gold, 'left'); });
}
const stepChapter = i => `第${CN[i]}步 · ${STEPS[i]}`;
const hasFootage = s => window.TL.windows.some(w => w.seg === s.id);
const footRect = s => { const w = window.TL.windows.find(w => w.seg === s.id); return w ? RECTS[w.rect] : null; };

/* ---------- 通用镜头（plan.json scenes[id].type） ---------- */
const GEN = {};
// intro：开场人物介绍。画面是原片（footage），顶部一行大标题，卡片下方名牌。spec: chapter, headline[2], names[[文字, x 比例, 出现延迟]]
GEN.intro = (t, s, sp) => {
  const R = footRect(s) || RECTS.wide, first = window.TL.segs.find(x => (PLAN.scenes[x.id] || {}).type === 'intro') || s;
  chapter(sp.chapter || '', C.blue);
  glowFrame(R, win(t, first.t0 - .3, .3), C.blue);
  if (sp.headline) alpha(win(t, first.t0 - .2, .4), () => { const [a1, a2] = sp.headline, w1 = tw(a1, 52), w2 = tw(a2 || '', 52), x0 = W / 2 - (w1 + w2) / 2;
    text(a1, x0, 82, 52, a2 ? C.text : C.gold, 'left'); if (a2) text(a2, x0 + w1, 82, 52, C.gold, 'left'); });
  (sp.names || []).forEach(([n, fx, dl]) => pill(n, R.x + R.w * (fx ?? .5), R.y + R.h + 46, 30, '', win(t, s.t0 + (dl ?? .1)), C.gold));
};
// answer：问题 → 答案先放在前面。spec: headline[2], answer[2], card, cue_answer, cue_card
GEN.answer = (t, s, sp) => {
  const ans = subAt(s, sp.cue_answer || '^答案', 2.5), col = subAt(s, sp.cue_card || '.^', 4);
  chapter(sp.chapter || '答案先放在前面', C.gold);
  headline(t, sp.headline[0], sp.headline[1], s.t0);
  const R = footRect(s); if (R) glowFrame(R, win(t, s.t0, .3), C.blue);
  const cx = R ? PX : W / 2;
  alpha(win(t, ans, .4), () => text('答案先放在前面', cx, 290, 32, C.dim, 'center', 600));
  keyCard(sp.card, cx, 440, lerp(.6, 1, ease((t - col) / .7)), win(t, col, .5));
  alpha(win(t, col + .6, .5), () => { text(sp.answer[0], cx, 590, 44, C.text); if (sp.answer[1]) text(sp.answer[1], cx, 652, 44, C.gold); });
};
// judgment：判断盖章 + 前提。spec: headline, card, card_sub, stamp, premise[2], cue_stamp, cue_premise
GEN.judgment = (t, s, sp) => {
  const yes = subAt(s, sp.cue_stamp || '^站得住', 1.6), pre = subAt(s, sp.cue_premise || '.^', 3);
  chapter(sp.chapter || '判断', C.gold);
  headline(t, sp.headline, '', s.t0);
  const R = footRect(s); if (R) glowFrame(R, 1, C.blue);
  const cx = R ? PX : W / 2;
  keyCard(sp.card, cx, 390, .9, 1); if (sp.card_sub) text(sp.card_sub, cx, 500, 32, C.text);
  stamp(cx + 150, 300, (t - yes) / .45, sp.stamp || '站得住');
  if (sp.premise) alpha(win(t, pre, .4), () => { pill(sp.premise[0], cx, 640, 34, '', 1, C.teal); if (sp.premise[1]) text(sp.premise[1], cx, 730, 40, C.teal); });
};
// roadmap：几步路线图，随旁白「第一 / 第二 / 第三」依次点亮；有原片时竖排在右栏
GEN.roadmap = (t, s, sp) => {
  let active = -1;
  STEPS.forEach((_, i) => { if (t >= subAt(s, '^第' + CN[i], 1e9)) active = i; });
  chapter(sp.chapter || `分${CN[STEPS.length - 1]}步看`, C.gold);
  headline(t, sp.headline || `分${CN[STEPS.length - 1]}步看`, '', s.t0);
  const R = footRect(s);
  if (!R) return roadmap(t, active, 0, 540, 1, 1, s.t0 + .2);
  glowFrame(R, 1, C.blue);
  STEPS.forEach((n, i) => alpha(win(t, s.t0 + .2 + i * .25), () => {
    const y = 300 + i * 190, on = i === active;
    card(PX - 300, y - 75, 600, 150, 24, on ? 'rgba(242,184,75,.16)' : C.card, on ? C.gold : 'rgba(255,255,255,.22)');
    text(NUM[i], PX - 220, y, 56, on ? C.gold : C.dim);
    text(n, PX + 40, y, 38, on ? C.text : 'rgba(244,241,234,.6)');
  }));
};
// recap：每步结尾「这一步只要记住一句」。spec: step, sentence（逗号分两行，最后一段金色）
GEN.recap = (t, s, sp) => {
  chapter(stepChapter(sp.step), C.gold);
  roadmap(t, -1, sp.step + 1, 170, .55, win(t, s.t0, .4));
  alpha(win(t, s.t0 + .1, .4), () => { card(W / 2 - 640, 360, 1280, 400, 32, 'rgba(22,26,56,.95)', C.gold); text('这一步只要记住一句', W / 2, 440, 34, C.dim, 'center', 600); });
  const parts = sp.sentence.split('，');
  parts.forEach((p, i) => alpha(win(t, s.t0 + .6 + i * .5, .4), () => text(p + (i < parts.length - 1 ? '，' : ''), W / 2, 560 + i * 92, 64, i === parts.length - 1 ? C.gold : C.text)));
};
// ending：回到开头的判断 + 账号名。spec: card, stamp, line, cue
GEN.ending = (t, s, sp) => {
  const end = window.TL.dur, because = subAt(s, sp.cue || '^站得住', 1.5);
  chapter(sp.chapter || '回到开头的判断', C.gold);
  if (STEPS.length) roadmap(t, -1, STEPS.length, 170, .55, win(t, s.t0, .4));
  keyCard(sp.card, W / 2, 520, 1.3, win(t, s.t0 + .1, .5));
  stamp(W / 2 + 360, 430, (t - because) / .45, sp.stamp || '站得住');
  if (sp.line) alpha(win(t, because + .4, .5), () => text(sp.line, W / 2, 720, 40, C.teal));
  alpha(win(t, end - 2.8, .6), () => { text(PLAN.account || '', W - 90, H - 120, 34, C.text, 'right'); text(PLAN.slogan || '', W - 90, H - 76, 22, C.dim, 'right', 500); });
};
// pill：最朴素的旁白镜头：章节 + 胶囊关键词 + 可选一两行大字。spec: step, pill[2], big[]
GEN.pill = (t, s, sp) => {
  chapter(sp.step != null ? stepChapter(sp.step) : (sp.chapter || ''), C.gold);
  if (sp.pill) pill(sp.pill[0], W / 2, 150, 40, sp.pill[1] || '', win(t, s.t0));
  (sp.big || []).forEach((b, i) => alpha(win(t, s.t0 + .3 + i * .5), () => text(b, W / 2, 480 + i * 100, 64, i ? C.gold : C.text)));
};
// bridge：进原声前的过桥（原片小窗 + 一行要点）
GEN.bridge = (t, s) => {
  const k = win(t, s.t0, .5);
  glowFrame(RECTS.mini, k);
  alpha(k, () => text(s.label || '', RECTS.mini.x + RECTS.mini.w / 2, RECTS.mini.y + RECTS.mini.h + 50, 32, C.text));
};

/* ---------- 原声段 ---------- */
const panels = {};
function clipSeg(t, s) {
  const R = RECTS[s.layout];
  chapter(`${s.who} 原声${PLAN.source ? ' | ' + PLAN.source : ''}`, C.orange);
  glowFrame(R, win(t, s.t0 - .1, .35));
  if (panels[s.id]) panels[s.id](t - s.t0, s);
}

/* ---------- 主绘制 ---------- */
const S = {};
window.KIT = { W, H, g, C, PX, STEPS, NUM, CN, clamp, lerp, ease, back, win, rr, font, text, tw, alpha, subsOf, subAt,
               bg, chapter, pill, card, glowFrame, subNar, subClip, check, cross, keyCard, stamp, roadmap, headline, stepChapter,
               GEN, S, panels, clipSeg };
window.seek = function (t) {
  const tl = window.TL;
  bg(t);
  // 当前段；落在两段之间的空隙时保持上一段的画面
  let seg = tl.segs.find(x => t >= x.t0 && t < x.t1);
  if (!seg) { const prev = tl.segs.filter(x => x.t1 <= t); seg = prev.length ? prev[prev.length - 1] : tl.segs[0]; }
  const sp = (PLAN.scenes || {})[seg.id] || {};
  if (S[seg.id]) S[seg.id](t, seg, sp, tl);                       // 项目自己写的镜头优先
  else if (seg.kind === 'clip') clipSeg(t, seg);
  else if (seg.kind === 'bridge') GEN.bridge(t, seg);
  else if (GEN[sp.type]) GEN[sp.type](t, seg, sp, tl);
  else GEN.pill(t, seg, sp);
  const sub = tl.subs.find(x => t >= x.a && t < x.b);
  if (sub) { const a = Math.min(win(t, sub.a, .15), 1 - win(t, sub.b - .12, .12)); sub.kind === 'clip' ? subClip(sub.zh, sub.en, a) : subNar(sub.zh, a); }
};
})();
