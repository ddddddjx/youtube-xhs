/* 范例：Claude Code 团队怎么用 Claude Code（2026-11-02）的专用镜头。kit.js 的通用镜头不够表达的，在这里写。
 * 贯穿形象：「人 → Claude」的指令线。一串气泡（一句一步、一个个「允许」）→ 收拢成一张金色「目标」卡。
 * 写法：从 window.KIT 拿组件，往 K.S[段 id] 放镜头函数 (t, seg, spec, tl)，往 K.panels[原声 id] 放原声右侧小图 (lt 片段内秒数, seg)。
 * 时间点尽量用 K.subAt(seg, /字幕里的词/, 默认秒) 跟着旁白走，不写死秒数，旁白重配后不用改。 */
(function (K) {
'use strict';
const { W, H, g, C, PX, STEPS, clamp, lerp, ease, back, win, rr, text, tw, alpha, chapter, pill, card, glowFrame, check, keyCard, stepChapter, S, panels } = K;

/* ---------- 指令线：一串气泡 ---------- */
const MSGS = ['把这个函数改一下', '可以运行 npm test 吗？', '先别动别的文件', '要修改 auth.ts，允许吗？', '这里改成 async', '要删除 3 行，允许吗？', '再跑一遍测试', '要执行 git commit，允许吗？', '变量名换一下', '要安装依赖，允许吗？'];
function bubbles(t, x, top, bottom, scroll, collapse = 0, a = 1) {
  g.save(); rr(x - 20, top, 700, bottom - top, 20); g.clip();
  const step = 92;
  for (let i = 0; i < 40; i++) {
    let y = top + 40 + i * step - scroll;
    if (y < top - step || y > bottom + step) continue;
    y = lerp(y, (top + bottom) / 2, collapse);
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
  if (k <= 0) return; const cx = x + 240, cy = y + 50 + line * 44;
  g.save(); g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, 150, 30, -.05, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * k); g.stroke(); g.restore();
}

/* ---------- 第一步：气泡收拢成目标卡，飞进 Slack ---------- */
S.n3 = (t, s) => {
  chapter(stepChapter(0));
  pill('目标', W / 2, 150, 40, 'goal', win(t, s.t0));
  const col = ease((t - s.t0 - .3) / 1.4);
  bubbles(t, 160, 240, 900, 1200 + (t - s.t0) * 70, col, 1 - col * .3);
  const fly = ease((t - s.t0 - 1.6) / 1.2);
  alpha(win(t, s.t0 + .8), () => {
    card(1050, 260, 700, 560, 22); rr(1050, 260, 180, 560, 22); g.fillStyle = 'rgba(74,21,75,.9)'; g.fill();
    text('# claude-tag', 1140, 310, 24, C.text, 'center', 600); text('Slack', 1400, 300, 26, C.dim, 'left', 600);
  });
  keyCard('目标', lerp(510, 1480, fly), lerp(570, 470, fly), lerp(1, .85, fly), clamp((t - s.t0 - .9) / .5));
  alpha(win(t, s.t0 + 3), () => { text('70–80%', 1480, 680, 80, C.gold); text('Sid 的工作在 Claude Tag 上完成', 1480, 760, 28, C.dim, 'center', 500); });
};
S.bridge_C2 = (t, s) => {
  chapter(stepChapter(0));
  const k = win(t, s.t0, .5);
  card(lerp(1050, 200, k), lerp(260, 330, k), lerp(700, 560, k), lerp(560, 400, k), 22); keyCard('目标', lerp(1480, 480, k), 530, .85);
  K.GEN.bridge(t, s);
};

/* ---------- 第二步：待办清单 / 每两个月 ---------- */
S.n4 = (t, s) => {
  chapter(stepChapter(1));
  pill('随时准备删', W / 2, 150, 40, 'temporary', win(t, s.t0));
  alpha(win(t, s.t0 + .2), () => {
    card(W / 2 - 260, 300, 520, 520, 26); text('待办清单', W / 2, 360, 38, C.text);
    for (let i = 0; i < 5; i++) { rr(W / 2 - 200, 420 + i * 72, 40, 40, 8); g.lineWidth = 3; g.strokeStyle = C.dim; g.stroke(); rr(W / 2 - 140, 432 + i * 72, 300 - i * 30, 16, 8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); }
  });
  alpha(win(t, s.t0 + .9), () => { g.save(); g.translate(W / 2 + 240, 320); g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fillStyle = '#2A2140'; g.fill(); g.lineWidth = 5; g.strokeStyle = C.orange; g.stroke();
    const a = (t - s.t0) * 4; g.strokeStyle = C.text; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(38 * Math.sin(a), -38 * Math.cos(a)); g.moveTo(0, 0); g.lineTo(0, -26); g.stroke(); g.restore(); });
};
S.n5 = (t, s) => {
  chapter(stepChapter(1));
  pill('每 2 个月', W / 2, 150, 40, 'every two months', win(t, s.t0));
  const y = 640, x0 = 240, x1 = 1680, names = ['待办清单', '功能 B', '功能 C', '功能 D', '功能 E'];
  alpha(win(t, s.t0 + .1), () => { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); });
  for (let i = 0; i < 5; i++) {
    const x = x0 + 120 + i * 300, at = s.t0 + .3 + i * .55;
    alpha(win(t, at, .3), () => { g.fillStyle = C.gold; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); text(i === 0 ? '现在' : `+${i * 2} 个月`, x, y + 50, 26, C.dim, 'center', 500); });
    const up = back((t - at) / .5), gone = ease((t - at - .9) / .5);
    alpha(up * (1 - gone * .75), () => { card(x - 110, y - 210 - gone * 60, 220, 110, 18, i === 0 ? 'rgba(242,184,75,.22)' : C.card, i === 0 ? C.gold : 'rgba(255,255,255,.3)'); text(names[i], x, y - 155 - gone * 60, 30, C.text); });
  }
};
panels.C4 = lt => {                    // 片段从「给它五件事」开始；剪口在 8.0（一年后）和 12.2（毫不留恋）
  const boxes = all => { for (let i = 0; i < 5; i++) { const y = 330 + i * 86; rr(PX - 150, y, 56, 56, 12); g.lineWidth = 4; g.strokeStyle = C.dim; g.stroke();
    const done = i < 3 ? win(lt, .7 + i * .45, .3) : (all ? win(lt, 5.8 + (i - 3) * .5, .3) : 0); if (done > 0) check(PX - 122, y + 28, 46, C.teal, done);
    rr(PX - 70, y + 20, 200 - i * 12, 16, 8); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); } };
  alpha(win(lt, 0) * (1 - win(lt, 7.8)), () => {
    text('5 件事', PX, 270, 34, C.text); boxes(lt > 4.6);
    alpha(win(lt, 2.6) * (1 - win(lt, 4.6)), () => text('放弃', PX + 170, 330 + 3 * 86 + 28, 32, C.red));
    alpha(win(lt, 4.6, .5), () => pill('待办清单', PX, 790, 30, 'to-do list', 1, C.gold));
  });
  alpha(win(lt, 8.1) * (1 - win(lt, 12.2)), () => {
    g.save(); g.setLineDash([14, 12]); rr(PX - 200, 330, 400, 420, 24); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke(); g.restore();
    text('待办清单', PX, 520, 36, 'rgba(244,241,234,.35)'); text('一年后', PX, 270, 34, C.gold);
  });
  alpha(win(lt, 12.5), () => { pill('毫不留恋', PX, 470, 40, 'unattached', 1, C.gold); text('做出来的东西，很快会消失', PX, 580, 28, C.dim, 'center', 500); });
};

/* ---------- 第三步：审代码 → 服务地图 → 盖住思考过程 ---------- */
S.n6 = (t, s) => {
  chapter(stepChapter(2));
  pill('人还剩什么', W / 2, 150, 40, 'big picture', win(t, s.t0));
  codeBlock(W / 2 - 420, 260, 840, 600, win(t, s.t0 + .1));
  [[.3, 3], [.9, 6], [1.5, 9]].forEach(([d, line]) => circle(W / 2 - 420, 260, line, win(t, s.t0 + d, .3)));
};
panels.C6 = lt => {
  alpha(win(lt, .1), () => { g.save(); g.translate(PX - 330, 250); g.scale(.78, .78); codeBlock(0, 0, 840, 600, 1);
    [[.6, 3], [1.4, 6], [2.2, 9]].forEach(([d, line], i) => { const erase = win(lt, 8.6 + i * .5, .4); circle(0, 0, line, win(lt, d, .3) * (1 - erase)); if (erase > 0) check(480, 50 + line * 44, 50, C.teal, erase); });
    g.restore(); });
  alpha(win(lt, 3.8) * (1 - win(lt, 7.6)), () => pill('我看过了', PX, 800, 32, '', 1, C.red));
  alpha(win(lt, 8.3) * (1 - win(lt, 12.6)), () => pill('Claude 自己找、自己改', PX, 800, 30, '', 1, C.teal));
  alpha(win(lt, 12.8), () => pill('重点不在这里', PX, 800, 32, '', 1, C.gold));
};
S.n7 = (t, s) => {
  chapter(stepChapter(2));
  const d = s.t1 - s.t0, z = ease((t - s.t0) / 1.2);
  alpha(1 - z, () => codeBlock(W / 2 - 420, 260, 840, 600, 1));
  const nodes = [[560, 380, 'API'], [960, 330, '订单'], [1360, 380, '支付'], [700, 650, '用户'], [1220, 650, '通知']];
  const edges = [[0, 1], [1, 2], [0, 3], [1, 4], [3, 4], [2, 4]];
  alpha(z, () => {
    edges.forEach(([a, b], i) => { const hl = i === 0 || i === 4; g.strokeStyle = hl ? C.gold : 'rgba(255,255,255,.3)'; g.lineWidth = hl ? 6 : 3; g.beginPath(); g.moveTo(nodes[a][0], nodes[a][1]); g.lineTo(nodes[b][0], nodes[b][1]); g.stroke(); });
    nodes.forEach(([x, y, n]) => { card(x - 100, y - 48, 200, 96, 18); text(n, x, y, 32, C.text); });
  });
  alpha(win(t, s.t0 + 1.4), () => pill('接口怎么设计', 760, 250, 28, '', 1, C.gold));
  alpha(win(t, s.t0 + 2.4), () => pill('边界划在哪', 960, 760, 28, '', 1, C.gold));
  alpha(win(t, s.t0 + d * .62, .6), () => { rr(380, 200, 1160, 640, 30); g.fillStyle = 'rgba(13,18,48,.86)'; g.fill(); text('思考过程', W / 2, 470, 44, C.dim, 'center', 500); text('· · ·', W / 2, 540, 44, C.dim); });
  alpha(win(t, s.t0 + d * .62 + .5), () => { card(W / 2 - 150, 640, 300, 100, 20, 'rgba(60,200,180,.2)', C.teal); text('结果', W / 2 - 20, 690, 36, C.text); check(W / 2 + 70, 690, 44, C.teal, 1); });
};
})(window.KIT);
