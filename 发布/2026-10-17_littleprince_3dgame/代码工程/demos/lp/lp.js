// 小王子 3D 游戏解说片：一张纸本桌面贯穿全片。上方是这一步的名字，中间是主画面（原片实机录像满幅，或桌上的纸片），下方是字幕。
// 镜头只在事件上动：字幕换句的那一帧快推 0.28s，数字和标签砸入 0.17s，其余时间停住。纸片、胶带、标签按 12fps 步进。
(() => {
const W = 1080, H = 1920;
const { clamp, lerp } = U;
const seg = MO.seg, step = MO.step;
// 色板：paper 纸本，accent 换成小王子围巾的金色做副强调
const C = { bg: '#F3EDE2', surface: '#FBF8F2', ink: '#1B1A17', sub: '#6B655B', red: '#C8402F', gold: '#D99A1E', desk: '#E7DDCA' };
const PANEL = { x: 0, y: 360, w: 1080, h: 1040 };
const CAP_Y = 1520;
const tile = () => CL.paperTile('lpbg', C.bg, { amt: 8, fibers: 220 });
const deskTile = () => CL.paperTile('lpdesk', C.desk, { amt: 12, fibers: 320, fiberCol: [110, 95, 70] });

// ---------- 通用版面 ----------
const bg = (c) => CL.fillPaper(c, tile(), 0, 0, W, H);
// 上方：步骤标签（黑底撕边）＋一句标题
const top = (c, lt, s) => {
  if (s.tag) MD.label(c, s.tag, 64, 196, { size: 40, bg: C.red, t: lt, at: 0, rate: 30 });
  if (s.head) {
    const k = MO.slam(lt, 0.08, { from: 1.25 }) || 0; if (!k) return;
    TY.text(c, s.head, 64, 318, { size: s.headSize || 74, fam: 'PuHui-Black', color: C.ink, align: 'left', scale: k, ox: 64, oy: 290 });
  }
};
// 下方：字幕。caps = [{at, text}]，text 里「|」换行，【】里的字用强调色
const capDraw = (c, lt, caps) => {
  let cur = null; for (const cp of caps) if (lt >= cp.at) cur = cp; if (!cur) return;
  const a = clamp((lt - cur.at) / 0.22), dy = (1 - MO.cubicOut(a)) * 26;
  const lines = cur.text.split('|'), size = cur.size || 58, lh = size * 1.42;
  c.save(); c.globalAlpha = a; c.font = TY.font(size, 'PuHui-Heavy'); c.textBaseline = 'alphabetic';
  lines.forEach((ln, i) => {
    const parts = []; let hot = false, buf = '';
    for (const ch of ln) { if (ch === '【' || ch === '】') { if (buf) parts.push([buf, hot]); buf = ''; hot = ch === '【'; } else buf += ch; }
    if (buf) parts.push([buf, hot]);
    const wsum = parts.reduce((s, p) => s + c.measureText(p[0]).width, 0);
    let x = W / 2 - wsum / 2; const y = CAP_Y + i * lh + dy;
    for (const [s, h] of parts) { c.fillStyle = h ? C.red : C.ink; c.fillText(s, x, y); x += c.measureText(s).width; }
  });
  c.restore();
};
// 主画面里的小字：素材出处
const credit = (c, txt = '实录画面') => {
  c.save(); c.font = TY.font(26, 'PuHui-Medium'); const w = c.measureText(txt).width;
  c.fillStyle = 'rgba(20,18,15,.55)'; c.fillRect(PANEL.x + 24, PANEL.y + PANEL.h - 64, w + 28, 42);
  c.fillStyle = '#F3EDE2'; c.textBaseline = 'middle'; c.fillText(txt, PANEL.x + 38, PANEL.y + PANEL.h - 43); c.restore();
};
// 镜头：每个事件时刻快推一下（k 是相对推近量），只算 z
const zoomAt = (lt, evs) => CAM.track({ x: 0, y: 0, z: 1 }, evs.map(e => (typeof e === 'number' ? { at: e, k: 0.12 } : e)), lt).z;
// 满幅录像
const footage = (c, im, o) => MD.cover(c, im, { ...PANEL, fx: o.fx ?? 0.5, fy: o.fy ?? 0.5, z: o.z ?? 1, crop: o.crop });
// 一条细边框，让主画面像嵌在纸上
const frameLine = (c) => { c.save(); c.strokeStyle = 'rgba(27,26,23,.85)'; c.lineWidth = 4; c.strokeRect(PANEL.x + 2, PANEL.y, PANEL.w - 4, PANEL.h); c.restore(); };
const deskPanel = (c) => { c.save(); c.beginPath(); c.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); c.clip(); CL.fillPaper(c, deskTile(), PANEL.x, PANEL.y, PANEL.w, PANEL.h); c.restore(); };
// 纸片：撕边、投影
const paperSlip = (g, w, h, seed, col = C.surface) => {
  CL.shadowed(g, () => { g.save(); g.translate(-w / 2, -h / 2); CL.tornRect(g, w, h, seed, 4); g.fillStyle = col; g.fill(); g.restore(); });
  g.save(); g.translate(-w / 2, -h / 2); CL.tornRect(g, w, h, seed, 4); g.clip(); CL.fillPaper(g, CL.paperTile('slip' + col, col, { amt: 6, fibers: 120 }), 0, 0, w, h); g.restore();
};
// 打字：12fps 步进，rate 字/秒，按行宽折行
const typedLines = (g, text, x, y, maxW, size, lh, n, fam = 'PuHui-Medium', color = C.ink, marks = []) => {
  g.save(); g.font = TY.font(size, fam); g.textBaseline = 'alphabetic';
  const toks = text.match(/[A-Za-z0-9.\-]+|\n|./gu) || []; let cx = x, cy = y, i = 0; const pos = [];
  for (let ti = 0; ti < toks.length; ti++) { const tk = toks[ti];
    if (tk === '\n') { cx = x; cy += lh; i++; continue; }
    const tw = g.measureText(tk).width, nx = toks[ti + 1];
    const punctNext = nx && /^[，。、；：！？）」]$/.test(nx) ? g.measureText(nx).width : 0;
    if (cx > x && cx + tw + punctNext > x + maxW) { cx = x; cy += lh; }
    for (const ch of tk) { pos.push([ch, cx, cy, i]); cx += g.measureText(ch).width; i++; } }
  // 荧光笔先画在字下面
  for (const m of marks) { const ps = pos.filter(p => p[3] >= m.from && p[3] < m.to); if (!ps.length || m.q <= 0) continue;
    const rows = {}; for (const p of ps) (rows[p[2]] = rows[p[2]] || []).push(p);
    let acc = 0; const tot = ps.length; for (const r of Object.values(rows)) { const x0 = r[0][1], x1 = r[r.length - 1][1] + g.measureText(r[r.length - 1][0]).width;
      const q = clamp(m.q * tot / r.length - acc / r.length); acc += r.length; CL.highlight(g, x0 - 4, r[0][2] - size * 0.9, x1 - x0 + 8, size * 1.15, q, 'rgba(217,154,30,.55)'); } }
  g.fillStyle = color; for (const p of pos) if (p[3] < n) g.fillText(p[0], p[1], p[2]);
  g.restore();
};
const circle = (c, x, y, rx, ry, q, col = C.red, lw = 8) => { if (q <= 0) return; const pts = DG.ellipsePts(x, y, rx, ry, 64).map(([a, b], i) => [a + Math.sin(i * 1.3) * 3, b + Math.cos(i * 0.9) * 3]);
  const L = DG.cum(pts); c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; DG.drawPartial(c, pts, L, L[L.length - 1] * MO.cubicOut(q) * 1.06); c.restore(); };

// ---------- 镜头表（与 镜头表.md 一致） ----------
const SH = {};
// 1–5：开场，原片高光
SH.lp01 = { head: '一个人，16 天，一款 3D 游戏', fx: 0.55, ev: [], caps: [{ at: 0.1, text: '这不是哪家游戏公司的预告片' }] };
SH.lp02 = { head: '一个人，16 天，一款 3D 游戏', fx: 0.5, ev: [0.02], caps: [{ at: 0.0, text: '是【一个人】|用 AI 做了 16 天' }] };
SH.lp03 = { head: '《小王子》的星球，能走进去', fx: 0.5, ev: [], caps: [{ at: 0.0, text: '小王子去过的星球|每一颗都做成了能逛的场景' }] };
SH.lp04 = { head: '《小王子》的星球，能走进去', fx: 0.56, ev: [1.9], caps: [{ at: 0.0, text: '国王、点灯人、狐狸|一颗颗星球找过去' }] };
SH.lp05 = { head: '', fx: 0.5, ev: [], caps: [{ at: 0.0, text: '首发那条推文 【332 万】次观看|近 1 万人收藏' }] };
// 6：工具箱
SH.lp06 = { head: '他用了哪几样工具', caps: [{ at: 0.1, text: '拆开看，是一条五步流水线' }, { at: 3.3, text: '下面一步一步讲' }] };
// 7：第 1 步
SH.lp07 = { tag: '第 1 步 · 写需求', head: '先让 AI 写需求文档', caps: [{ at: 0.1, text: '【Fable 5.1】 先把场景、人物、|剧情线写成文字' }, { at: 3.4, text: '后面每一步，都拿它当说明书' }] };
// 8：第 2 步
SH.lp08 = { tag: '第 2 步 · 出图', head: '把文字变成参考图', caps: [{ at: 0.1, text: '【Image 2.5】 出场景图|先定画风和配色' }, { at: 3.2, text: '再补俯视、斜侧几个角度|人物出 T-pose 四视图' }] };
// 9–10：第 3 步
SH.lp09 = { tag: '第 3 步 · 变 3D', head: '把图片变成 3D 模型', fx: 0.6, caps: [{ at: 0.1, text: '先让 AI 在参考图上圈出|哪些道具交给 【Tripo】 单独生成' }] };
SH.lp10 = { tag: '第 3 步 · 变 3D', head: '把图片变成 3D 模型', fx: 0.6, ev: [2.2], caps: [{ at: 0.0, text: '道具用 【H3.1】|人物用 【Smart Mesh P2.0】' }, { at: 2.2, text: '网格没问题，再生成贴图' }] };
// 11–14：第 4 步
SH.lp11 = { tag: '第 4 步 · 搭起来', head: '让 Opus 5.5 动手搭', caps: [{ at: 0.1, text: 'Blender、Unity 都接给 Claude|它直接改工程' }, { at: 2.8, text: '提示词里关键的一句：|【再派一个 agent 专门挑刺】' }] };
SH.lp12 = { tag: '第 4 步 · 搭起来', head: '多机位对照参考图', fx: 0.62, ev: [0.9, 2.1, 3.3], caps: [{ at: 0.0, text: '俯视、正面、侧面各截一张|和参考图对' }, { at: 2.6, text: '不像就再改，一轮一轮迭代' }] };
SH.lp13 = { tag: '第 4 步 · 让人动', head: '绑骨骼，套动作', fx: 0.56, ev: [], caps: [{ at: 0.0, text: '人物用 【Auto-Rig Pro】 绑骨蒙皮' }, { at: 2.4, text: '跑、走从 【Mixamo】 下载|让 Opus 对到小王子的骨骼上' }] };
SH.lp14 = { tag: '第 4 步 · 让人动', head: '现成动作不够用的时候', fx: 0.55, ev: [{ at: 2.3, k: 0.32 }], caps: [{ at: 0.0, text: '提水壶这种手碰道具的动作|Mixamo 没有' }, { at: 2.4, text: '就让 Opus 在 Blender 里|一点点调手指和水壶的位置' }] };
// 15–17：第 5 步
SH.lp15 = { tag: '第 5 步 · 修 bug', head: '把录屏丢给 AI 验收', ev: [], caps: [{ at: 0.0, text: '流程里修 bug 用 【Codex Astra】|他还另外试了 Glimpse' }, { at: 2.5, text: '“帮我验收这个场景|有 bug 带上对应时间戳”' }] };
SH.lp16 = { tag: '第 5 步 · 修 bug', head: '点时间戳，直接跳到出错那帧', headSize: 64, ev: [1.45], caps: [{ at: 0.0, text: '点一下 【0:13】|镜头钻进门板那帧就跳出来' }, { at: 2.6, text: '穿进门框、提示框叠在一起|都标了时间' }] };
SH.lp17 = { tag: '第 5 步 · 修 bug', head: '同一段录屏，两个 AI 比一比', headSize: 64, caps: [{ at: 0.0, text: '同一段 63 秒录屏|左边 Codex Astra，右边 Glimpse' }, { at: 2.4, text: 'Glimpse 挑出的设计问题|是 Codex 的【三四倍】' }] };
// 18–19：判断
SH.lp18 = { head: '我看完的判断', fx: 0.42, ev: [], caps: [{ at: 0.1, text: '代码已经不是门槛了' }, { at: 2.0, text: '这 16 天，他交给 AI 的是活|自己攥着的是【标准】' }] };
SH.lp19 = { head: '我看完的判断', fx: 0.42, ev: [{ at: 0.02, k: 0.22 }], caps: [{ at: 0.0, text: '哪张图算对、哪里算 bug|得他先讲清楚' }, { at: 2.7, text: '审查 agent 能挑刺|挑刺的尺子还是人给的' }] };
// 20–21：收尾
SH.lp20 = { head: '想自己试一下', fx: 0.42, ev: [3.0], caps: [{ at: 0.1, text: '别一上来做整个宇宙|先做一颗星球、一个角色' }, { at: 3.0, text: '他说会开源全部代码和制作细节' }] };
SH.lp21 = { head: '', fx: 0.5, ev: [], caps: [{ at: 0.2, text: '关注我|看 AI builder 怎么把活交给 AI' }] };

// 录像镜头的通用画法
const footShot = (id, extra) => (c, lt, t) => {
  const s = SH[id], e = ERAS.find(x => x.id === id);
  bg(c);
  const z = zoomAt(lt, s.ev || []);
  const geo = footage(c, e._im, { fx: s.fx, fy: s.fy, z, crop: s.crop });
  if (extra) { c.save(); c.beginPath(); c.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); c.clip(); extra(c, lt, t, z, geo); c.restore(); }
  if (!s.noCredit) credit(c, s.credit);
  frameLine(c);
  top(c, lt, s); capDraw(c, lt, s.caps);
};
const deskShot = (id, body) => (c, lt, t) => {
  const s = SH[id]; bg(c); deskPanel(c);
  c.save(); c.beginPath(); c.rect(PANEL.x, PANEL.y, PANEL.w, PANEL.h); c.clip(); body(c, lt, t); c.restore();
  frameLine(c); top(c, lt, s); capDraw(c, lt, s.caps);
};

// lp05：332 万砸在画面上方的幕布上
const lp05x = (c, lt) => {
  const k = MO.slam(lt, 0.35); if (!k) return;
  c.save(); c.translate(W / 2, PANEL.y + 150); c.scale(k * 0.82, k * 0.82);
  c.fillStyle = 'rgba(20,16,12,.55)'; c.fillRect(-330, -150, 660, 250);
  TY.text(c, '332万', 0, 40, { size: 190, fam: 'PuHui-Black', color: '#F6D46B' });
  TY.text(c, '首发推文观看', 0, 92, { size: 38, fam: 'PuHui-Heavy', color: '#F3EDE2' });
  c.restore();
};
// lp06：五张工具纸条依次落到桌上
const TOOLS = [['1', '写需求', 'Fable 5.1'], ['2', '出图', 'Image 2.5'], ['3', '变 3D', 'Tripo'], ['4', '搭起来', 'Opus 5.5 + Blender + Unity'], ['5', '修 bug', 'Codex Astra']];
const lp06 = (c, lt) => {
  TOOLS.forEach(([n, v, tool], i) => {
    const y = PANEL.y + 120 + i * 196, r = [-0.018, 0.014, -0.01, 0.02, -0.014][i];
    CL.slideIn(c, lt, 0.15 + i * 0.5, W / 2, y, r, (g) => {
      paperSlip(g, 940, 160, 31 + i * 7);
      g.fillStyle = i === 3 ? C.red : C.ink; g.beginPath(); g.arc(-390, 0, 46, 0, Math.PI * 2); g.fill();
      TY.text(g, n, -390, 18, { size: 54, fam: 'PuHui-Black', color: C.surface });
      TY.text(g, v, -315, 20, { size: 60, fam: 'PuHui-Black', color: C.ink, align: 'left' });
      TY.text(g, tool, 440, 18, { size: i === 3 ? 40 : 52, fam: 'PuHui-Heavy', color: i === 3 ? C.red : C.sub, align: 'right' });
    }, { from: [0, -260], tilt: 0.12, dur: 0.42 });
  });
  // 第 4 步是重头戏：最后圈一下
  circle(c, W / 2 + 230, PANEL.y + 120 + 3 * 196, 270, 86, seg(lt, 3.3, 3.9));
};
// lp07：需求文档打字
const PRD = '场景：故事里的每一颗星球\n人物：小王子、国王、狐狸、飞行员\n剧情线：从一朵玫瑰出发，一路到沙漠';
const lp07 = (c, lt) => {
  CL.placed(c, W / 2, PANEL.y + 500, -0.015, (g) => {
    paperSlip(g, 900, 780, 77);
    g.strokeStyle = 'rgba(47,93,98,.18)'; g.lineWidth = 2; for (let y = -230; y < 360; y += 74) { g.beginPath(); g.moveTo(-430, y); g.lineTo(430, y); g.stroke(); }
    TY.text(g, '游戏需求文档 PRD', -400, -290, { size: 56, fam: 'PuHui-Black', color: C.ink, align: 'left' });
    g.fillStyle = C.ink; g.fillRect(-400, -262, 800, 4);
    typedLines(g, PRD, -400, -170, 800, 44, 128, TY.typedCount(lt, 0.4, 16, 12), 'PuHui-Medium', C.ink,
      [{ from: 0, to: 2, q: seg(lt, 3.4, 3.7) }, { from: 14, to: 16, q: seg(lt, 3.7, 4.0) }, { from: 31, to: 34, q: seg(lt, 4.0, 4.3) }]);
  });
  MD.label(c, '示意', PANEL.w - 150, PANEL.y + 60, { size: 30 });
  // 盖章：Fable 5.1
  const k = MO.slam(lt, 2.7); if (k) { c.save(); c.translate(W - 250, PANEL.y + 870); c.rotate(-0.16); c.scale(k, k);
    c.strokeStyle = C.red; c.lineWidth = 7; c.strokeRect(-170, -58, 340, 116); TY.text(c, 'Fable 5.1 写', 0, 20, { size: 52, fam: 'PuHui-Black', color: C.red }); c.restore(); }
};
// lp08：两张成品冲印件＋提示词纸条
const PROMPT2 = '基于上传的场景参考图，帮我生成一张该场景的全面貌参考图片，包括整体环境的多视角视图以及局部细节的展示。';
const lp08 = (c, lt, IMG) => {
  CL.slideIn(c, lt, 0.05, 330, PANEL.y + 250, -0.05, (g) => MD.print(g, IMG['clips_lp/stills/chair.jpg'], 460, 290, { key: 'chair', fx: 0.5, caption: '游戏里的成品画面' }), { from: [-500, 0], dur: 0.4 });
  CL.slideIn(c, lt, 0.45, 760, PANEL.y + 330, 0.04, (g) => MD.print(g, IMG['clips_lp/stills/library.jpg'], 460, 290, { key: 'lib', fx: 0.5, caption: '游戏里的成品画面' }), { from: [500, 0], dur: 0.4 });
  CL.slideIn(c, lt, 1.0, W / 2, PANEL.y + 760, -0.012, (g) => {
    paperSlip(g, 920, 400, 55, '#FFF8E6');
    TY.text(g, '参考提示词', -420, -130, { size: 38, fam: 'PuHui-Black', color: C.red, align: 'left' });
    typedLines(g, PROMPT2, -420, -60, 840, 40, 62, TY.typedCount(lt, 1.3, 22, 12), 'PuHui-Medium', C.ink, [{ from: PROMPT2.indexOf('多视角'), to: PROMPT2.indexOf('多视角') + 5, q: seg(lt, 3.6, 4.0) }]);
  }, { from: [0, 400], dur: 0.4 });
  MD.label(c, '这两张是游戏成品截图，不是参考图', W / 2, PANEL.y + 530, { size: 32, align: 'center', t: lt, at: 0.8, rate: 30 });
};
// lp09：线稿上圈道具（示意）
const lp09x = (c, lt, t, z, geo) => {
  const P = (u, v) => MD.toScreen(geo, [u, v]);
  const marks = [[0.69, 0.26, 150, 150, 0.6], [0.43, 0.18, 70, 90, 1.3]];
  for (const [u, v, rx, ry, at] of marks) { const [x, y] = P(u, v); circle(c, x, y, rx, ry, seg(lt, at, at + 0.45)); }
  const [lx, ly] = P(0.69, 0.26); MD.label(c, '交给 Tripo', lx - 100, ly - 190, { size: 38, bg: C.red, t: lt, at: 0.9 });
  MD.label(c, '示意', PANEL.w - 140, PANEL.y + 50, { size: 30, bg: '#191817' });
};
// lp10：线稿 → 上色，一条刷子从左往右扫过去
const lp10 = (c, lt) => {
  const e = ERAS.find(x => x.id === 'lp10'), s = SH.lp10, z = zoomAt(lt, s.ev);
  bg(c);
  const wire = CLIPF(e, 'wire', lt), col = CLIPF(e, 'color', lt);
  footage(c, wire, { fx: 0.6, z });
  const p = MO.cubicInOut(seg(lt, 2.2, 3.0)), xw = PANEL.w * p;
  if (p > 0) { c.save(); c.beginPath(); c.rect(PANEL.x, PANEL.y, xw, PANEL.h); c.clip(); footage(c, col, { fx: 0.6, z }); c.restore();
    if (p < 1) { c.fillStyle = C.gold; c.fillRect(xw - 6, PANEL.y, 12, PANEL.h); } }
  MD.label(c, '道具：H3.1', 60, PANEL.y + 110, { size: 40, t: lt, at: 0.3 });
  MD.label(c, '人物：Smart Mesh P2.0', 60, PANEL.y + 200, { size: 40, t: lt, at: 0.9 });
  if (lt >= 2.2) MD.label(c, '贴图', PANEL.w - 60, PANEL.y + 110, { size: 40, bg: C.red, t: lt, at: 2.4, align: 'right' });
  MD.label(c, p < 0.5 ? '示意 · 线稿' : '实机画面', PANEL.w - 60, PANEL.y + PANEL.h - 50, { size: 28, align: 'right' });
  frameLine(c); top(c, lt, s); capDraw(c, lt, s.caps);
};
// lp11：给 Opus 的那段提示词
const PROMPT4 = '根据上传的场景参考图以及生成好的 Tripo 3D 资产，对照参考图进行完美级的复刻。实现完成后，派一个独立的审查 agent 进行多机位的场景盲审，发现和参考图有差异，就不断迭代完善。';
const lp11 = (c, lt) => {
  CL.slideIn(c, lt, 0.05, W / 2, PANEL.y + 470, 0.01, (g) => {
    paperSlip(g, 940, 760, 91, '#FFF8E6');
    TY.text(g, '给 Opus 5.5 的提示词', -430, -300, { size: 40, fam: 'PuHui-Black', color: C.red, align: 'left' });
    const at = PROMPT4.indexOf('派一个独立的审查'), to = PROMPT4.indexOf('盲审') + 2;
    typedLines(g, PROMPT4, -430, -220, 860, 46, 74, TY.typedCount(lt, 0.25, 40, 12), 'PuHui-Medium', C.ink, [{ from: at, to, q: seg(lt, 2.8, 3.4) }]);
  }, { from: [0, 420], dur: 0.38 });
  MD.label(c, '节选', PANEL.w - 150, PANEL.y + 60, { size: 30 });
  const k = MO.slam(lt, 2.9); if (k) { c.save(); c.translate(W - 230, PANEL.y + 925); c.rotate(-0.08); c.scale(k, k); MD.label(c, '审查 agent', 0, 0, { size: 44, bg: C.red, align: 'center' }); c.restore(); }
};
// lp12：机位标签依次砸入
const lp12x = (c, lt) => {
  [['截图', 0.9], ['对照', 2.1], ['再改', 3.3]].forEach(([s, at], i) => {
    const k = MO.slam(lt, at); if (!k) return;
    c.save(); c.translate(90 + i * 300, PANEL.y + 110); c.scale(k, k); MD.label(c, s + (i < 2 ? ' →' : ''), 0, 0, { size: 46, bg: i === 2 ? C.red : '#191817' }); c.restore();
  });
};
const lp13x = (c, lt) => { MD.label(c, '绑骨：Auto-Rig Pro', 50, PANEL.y + 100, { size: 40, t: lt, at: 0.2 }); MD.label(c, '动作：Mixamo', 50, PANEL.y + 190, { size: 40, bg: C.red, t: lt, at: 2.4 }); };
const lp14x = (c, lt) => { if (lt >= 2.4) MD.label(c, '提水壶：Opus 在 Blender 里调', W - 60, PANEL.y + PANEL.h - 140, { size: 40, bg: C.red, t: lt, at: 2.5, align: 'right' }); };
// lp15/16：Glimpse 界面，裁到要看的那块
SH.lp15.crop = [0.2, 0.0, 0.6, 0.86];
SH.lp16.crop = [0.54, 0.02, 0.46, 0.62];
const lp16x = (c, lt) => { const k = lt < 2.9 ? MO.slam(lt, 1.45) : 0; if (k) { c.save(); c.translate(W / 2, PANEL.y + PANEL.h - 150); c.scale(k, k); MD.label(c, '0:13–0:14 推门时镜头钻进门板', 0, 0, { size: 40, bg: C.red, align: 'center' }); c.restore(); } };
// lp17：原作者的对比图，冲印件，圈出结论
const lp17 = (c, lt, IMG) => {
  const im = IMG['clips_lp/stills/compare.jpg'];
  const z = zoomAt(lt, [{ at: 2.4, k: 0.3 }]);
  c.save(); c.translate(W / 2, PANEL.y + 500); c.scale(z, z); c.translate(0, -120 * (z - 1) / 0.3); c.rotate(-0.012);
  MD.print(c, im, 980, 675, { key: 'cmp', caption: '实录画面' });
  circle(c, 0, 675 * (0.885 - 0.5), 420, 46, seg(lt, 2.5, 3.1), C.red, 7);
  c.restore();
};
// lp18/19：狐狸那场戏
const lp19x = (c, lt) => {};
// lp20：坠机现场
// lp21：结尾，小王子站在云海上，标签贴在天上
const lp21x = (c, lt) => {
  MD.label(c, '《The Little Prince: Among the Stars》', W / 2, PANEL.y + 190, { size: 34, align: 'center', bg: C.red, t: lt, at: 1.0, rate: 40 });
};

const S = window.SCENES;
for (const e of ERAS) if (e.clip) e.clipDraw = (c, im) => { e._im = im; };
S.lp01 = { draw: footShot('lp01') };
S.lp02 = { draw: footShot('lp02') };
S.lp03 = { draw: footShot('lp03') };
S.lp04 = { draw: footShot('lp04') };
S.lp05 = { draw: footShot('lp05', lp05x) };
S.lp06 = { draw: deskShot('lp06', lp06) };
S.lp07 = { draw: deskShot('lp07', lp07) };
S.lp08 = { draw: (c, lt, t, IMG) => deskShot('lp08', (cc, l) => lp08(cc, l, IMG))(c, lt, t) };
S.lp09 = { draw: footShot('lp09', lp09x) };
S.lp10 = { draw: lp10 };
S.lp11 = { draw: deskShot('lp11', lp11) };
S.lp12 = { draw: footShot('lp12', lp12x) };
S.lp13 = { draw: footShot('lp13', lp13x) };
S.lp14 = { draw: footShot('lp14', lp14x) };
S.lp15 = { draw: footShot('lp15') };
S.lp16 = { draw: footShot('lp16', lp16x) };
S.lp17 = { draw: (c, lt, t, IMG) => deskShot('lp17', (cc, l) => lp17(cc, l, IMG))(c, lt, t) };
S.lp18 = { draw: footShot('lp18') };
S.lp19 = { draw: footShot('lp19', lp19x) };
S.lp20 = { draw: footShot('lp20') };
S.lp21 = { draw: footShot('lp21', lp21x) };
SH.lp09.noCredit = true;
SH.lp14.fy = 0.55;
window.LP = { SH, C, PANEL };
})();
