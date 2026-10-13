// 兵马俑 TikTok v2：60 秒（1080×1920，英文大字幕＋中文小字幕，无口播，配乐 音频/配乐.wav）。镜头表见 ../脚本.md
// v2 思路：少推照片，多用动画图解讲「布局」——地层剖面、一号坑平面列阵、四个坑、1 英里外的陵园、封土下的地宫。v1 留在 eras_v1.js（--film v1）。
window.FILM_SIZE = [1080, 1920];
window.SCENE_LIBS = ['tt/kit.js', 'tt/film.js', 'tt/map.js'];
window.SCENE_DIR = 'ttdirs_none';
window.FILM_DURATION = 60;
const lerp = U.lerp;
const A = (...k) => k.map(x => 'img/' + x + '.jpg');
const post = (c, lt, t, v = 0.5) => { TF.vignette(c, v); TF.grain(c, t); };
// 段内字幕表：[[起, 止, en, zh, opts]]
const subsAt = (c, lt, list, base = {}) => { for (const [a, b, en, zh, o] of list) if (lt >= a && lt < b) TF.subs(c, lt - a, en, zh, { ...base, ...(o || {}) }); };
const MAP = { k1: () => TM.cam(0, 0, 4.2), k2: () => TM.cam(36, -55, 2.95), k3: () => TM.cam(-820, 120, 0.28) };
window.ERAS = [
  // 0–3.5 钩子：满彩的脸，颜料卷曲剥落，只剩灰陶
  { id: 's1', dur: 3.5, assets: A('000'), draw(c, lt, t) {
    TF.hook(c, lt, { z: 1.08 + lt * 0.03, peel: U.clamp((lt - 0.8) / 1.9), t0: 0.8, t1: 2.7 }); post(c, lt, t);
    TF.subs(c, lt, "They weren't always gray.", '它们原本不是灰色的', { inAt: 0.1, hl: 'gray' }); } },

  // 3.5–9 1974：地层剖面，井往下挖，碰到一张脸；X 光扫出下面整支军队
  { id: 's2', dur: 5.5, draw(c, lt, t) {
    const GY = 640; TM.bg(c, [540, 300]); TM.strata(c, GY);
    TM.hud(c, t, ['LINTONG, XI\'AN · CHINA', 'MARCH 1974 · 34.38°N 109.27°E']);
    // 井：越挖越深，土块往上翻
    const d = 360 * U.ss(0.2, 2.3, lt); c.fillStyle = '#0a0705'; c.fillRect(505, GY - 2, 70, d + 2); c.strokeStyle = 'rgba(224,179,84,.5)'; c.lineWidth = 2; c.strokeRect(505, GY - 2, 70, d + 2);
    if (lt < 2.4) PAINT.particles(18, 3, t, { x0: 500, x1: 580, y0: GY + d, y1: GY - 120, speed: 200, drift: 40, life: 0.8 }).forEach(p => { c.fillStyle = '#7a5a3c'; c.fillRect(p.x, p.y, 7, 7); });
    // 碰到脸
    if (lt > 2.3) { const q = lt - 2.3; TT.head(c, 540, GY + 440, 0.34, { keyBase: 'well' });
      c.save(); c.strokeStyle = `rgba(255,210,63,${Math.max(0, 1 - q / 0.8)})`; c.lineWidth = 6; c.beginPath(); c.arc(540, GY + 430, 70 + q * 260, 0, U.TAU); c.stroke(); c.restore(); }
    TM.xray(c, lt, 3.9, GY);
    post(c, lt, t, 0.35);
    subsAt(c, lt, [[0.1, 2.3, '1974. Farmers in China dig a well.', '1974 年，中国西安，农民在打井'], [2.3, 3.9, 'Then they hit a face.', '然后，铲子碰到了一张脸', { hl: 'face' }], [3.9, 6, 'Under it: an entire army.', '它下面，是一整支军队', { hl: 'army' }]], { y: 360 }); } },

  // 9–35 平面图一镜到底：一号坑列阵 → 橄榄球场对比 → 真实照片 → 四个坑 → 全部朝东 → 拉远到 1 英里外的陵园
  { id: 's3', dur: 26, assets: A('107'), draw(c, lt, t) {
    let k = MAP.k1();
    if (lt > 10 && lt < 20) k = TM.lerpCam(MAP.k1(), MAP.k2(), U.ease.inOut(U.clamp((lt - 10) / 1.4)));
    if (lt >= 20) k = TM.lerpCam(MAP.k2(), MAP.k3(), U.ease.inOut(U.clamp((lt - 20) / 3.2)));
    TM.bg(c); TM.grid(c, k);
    TM.rect(c, k, ...TM.PIT1, U.clamp(lt / 0.9), { lw: 3 });
    TM.army(c, k, lt, 0.5, 3.4);
    TM.football(c, k, -112, -26, U.clamp((lt - 4.2) / 0.5) * (lt < 7 ? 1 : 0));
    TM.football(c, k, 1, -26, U.clamp((lt - 4.6) / 0.5) * (lt < 7 ? 1 : 0));
    if (lt < 7) TM.callout(c, k.X(-115), k.Y(-31), 160, 470, 'PIT 1', lt, 1.0, { size: 46, sub: '755 FT LONG · 203 FT WIDE' });
    // 其余三个坑
    TM.poly(c, k, TM.PIT2, U.clamp((lt - 10.6) / 0.9)); TM.rect(c, k, ...TM.PIT3, U.clamp((lt - 13.1) / 0.6));
    if (lt > 15.6) { const q = lt - 15.6; TM.rect(c, k, ...TM.PIT4, 1, { col: '#ff6a4a', lw: 3, dash: [12, 8] }); if (q > 0.3) TM.text(c, '?', k.X(-3), k.Y(-73) + 26, { size: Math.min(70, 22 * k.s) + Math.sin(q * 5) * 4, col: '#ff6a4a', align: 'center', weight: 900, a: U.clamp((q - 0.3) / 0.3) }); }
    if (lt > 10 && lt < 19.6) { const n = (x, y) => [k.X(x), k.Y(y)];
      TM.callout(c, ...n(188, -142), 820, 420, 'PIT 2', lt, 11.2, { size: 40, sub: 'CAVALRY + CHARIOTS', col: '#e0b354' });
      TM.callout(c, ...n(-112, -78), 140, 420, 'PIT 3', lt, 13.5, { size: 40, sub: 'COMMAND POST' });
      TM.callout(c, ...n(-3, -102), 520, 300, 'PIT 4', lt, 16.0, { size: 40, sub: 'EMPTY · NEVER FINISHED', col: '#ff6a4a' }); }
    // 全部朝东
    if (lt > 18 && lt < 21) TM.eastArrows(c, k, lt, 18.2, [[60, -15], [60, 15], [-40, 0], [150, -110], [-86, -66], [100, 0]]);
    if (lt > 18) TM.text(c, 'ALL FACING EAST →', 540, 990, { size: 40, col: '#ffd23f', align: 'center', weight: 900, a: U.clamp((lt - 18.3) / 0.3) * (lt < 22.5 ? 1 : U.clamp((23 - lt) / 0.5)) });
    // 1 英里外的陵园
    if (lt > 21) { const q = lt - 21; c.save(); c.setLineDash([10, 10]); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(k.X(-120), k.Y(0)); c.lineTo(k.X(lerp(-120, -1030, U.clamp(q / 1.2))), k.Y(0)); c.stroke(); c.restore();
      if (q > 1.0) TM.text(c, '1 MILE', k.X(-575), k.Y(0) - 18, { size: 30, col: '#fff', align: 'center', weight: 800, a: U.clamp((q - 1) / 0.3) });
      TM.necropolis(c, k, -1500, 0, lt, 22.2);
      if (q > 2.0) TM.callout(c, k.X(-1500), k.Y(175), 600, 1030, "FIRST EMPEROR'S TOMB", lt, 23.0, { size: 30, sub: 'SEALED SINCE 210 BC', col: '#ff6a4a' }); }
    if (lt > 24.2) TF.slam(c, lt, 24.2, '20+ SQ MI', 'THE WHOLE BURIAL COMPLEX', { y: 420, size: 120, col: '#ffd23f' });
    TM.north(c); if (lt < 7 || lt > 10) TM.scaleBar(c, k);
    TM.hud(c, t, lt < 21 ? ['SITE MAP · TERRACOTTA ARMY PITS', 'TOP-DOWN · NOT TO EXACT SCALE'] : ['SITE MAP · QIN SHI HUANG NECROPOLIS', 'TOP-DOWN · APPROXIMATE']);
    // 7–10 秒：真照片叠进来
    if (lt > 6.8 && lt < 10.2) { const a = U.clamp((lt - 6.8) / 0.5) * U.clamp((10.2 - lt) / 0.5); TF.cover(c, TF.im('107'), { fx: lerp(0.35, 0.6, (lt - 6.8) / 3.4), fy: 0.62, z: 1.12, alpha: a });
      TM.text(c, 'PIT 1 TODAY', 60, 300, { size: 34, col: '#fff', weight: 900, a }); }
    post(c, lt, t, 0.4);
    subsAt(c, lt, [
      [0.3, 4.1, 'Pit 1 alone is 755 feet long.', '光一号坑，就长 230 米', { hl: '755 feet' }],
      [4.1, 6.8, "That's more than two football fields.", '比两个美式橄榄球场还长', { hl: 'two football fields' }],
      [6.8, 10.2, 'Thousands of soldiers, in battle formation.', '几千个兵俑，排成战阵'],
      [10.6, 13.2, 'Pit 2: cavalry and war chariots.', '二号坑：骑兵和战车'],
      [13.2, 15.7, 'Pit 3: the command post.', '三号坑：指挥部'],
      [15.7, 18.1, 'Pit 4: empty. Never finished.', '四号坑：空的，没修完', { hl: 'empty' }],
      [18.1, 21, 'And every soldier faces east...', '所有兵俑，都面朝东方'],
      [21, 24.1, "...guarding one man's tomb, a mile away.", '守着一英里外，一个人的墓', { hl: 'one man' }],
      [24.1, 26, 'Qin Shi Huang. The First Emperor of China.', '秦始皇，中国第一个皇帝'],
    ], { y: 1200 }); } },

  // 35–41 人脸墙：九张脸一格格翻出来
  { id: 's4', dur: 6, assets: A('071', '074', '072', '082', '075', '002', '031', '084', '000'), draw(c, lt, t) {
    c.fillStyle = '#0c0a08'; c.fillRect(0, 0, 1080, 1920);
    const T = [['071', 0.42, 0.28, 1.6], ['082', 0.56, 0.38, 1.2], ['074', 0.5, 0.3, 1.4], ['000', 0.53, 0.47, 1.0, 'grayscale(1) sepia(.18) brightness(.82)'], ['072', 0.27, 0.33, 1.5], ['031', 0.5, 0.17, 2.2], ['075', 0.4, 0.24, 1.7], ['084', 0.33, 0.25, 2.4], ['002', 0.52, 0.42, 1.3]];
    const tw = 340, th = 300, gx = 15, x0 = (1080 - 3 * tw - 2 * gx) / 2, y0 = 150;
    T.forEach(([id, fx, fy, z, f], i) => { const r = Math.floor(i / 3), col = i % 3, x = x0 + col * (tw + gx), y = y0 + r * (th + gx), at = 0.1 + [0, 4, 2, 6, 1, 7, 3, 8, 5][i] * 0.13, p = U.ease.outBack(U.clamp((lt - at) / 0.35));
      if (p <= 0) return; c.save(); c.translate(x + tw / 2, y + th / 2); c.scale(Math.max(0.01, p), 1); c.translate(-tw / 2, -th / 2);
      c.beginPath(); c.rect(0, 0, tw, th); c.clip(); TF.cover(c, TF.im(id), { fx, fy, z: z * (1 + 0.02 * Math.sin(lt + i)), filter: f || 'contrast(1.08)', box: [0, 0, tw, th] });
      c.strokeStyle = 'rgba(224,179,84,.8)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, tw - 3, th - 3); c.restore(); });
    if (lt > 2.4) { const n = Math.round(9 + (8000 - 9) * U.ease.in(U.clamp((lt - 2.4) / 1.6))); TM.text(c, `× ${n.toLocaleString('en-US')}`, 1040, 1100, { size: 64, col: '#ffd23f', align: 'right', weight: 900 }); }
    post(c, lt, t, 0.35);
    subsAt(c, lt, [[0.2, 2.6, 'Every face is different.', '每一张脸都不一样', { hl: 'different' }], [2.6, 6, 'No two alike. Over 8,000 of them.', '没有两张一样，一共八千多张']], { y: 1220 }); } },

  // 41–51 封土剖面：雷达扫出地下宫殿，水银江河，弩机，汞含量
  { id: 's5', dur: 10, draw(c, lt, t) {
    const GY = 640; TM.moundSide(c, GY); TM.radar(c, GY, lt, 0.1);
    TM.palace(c, GY, lt, 0.7); TM.mercuryRivers(c, GY, lt, 3.6); TM.crossbows(c, GY, lt, 4.6);
    TM.hud(c, t, ['SCAN · QIN SHI HUANG TOMB MOUND', 'GROUND-PENETRATING SURVEY']); TM.meter(c, lt, 7.0, 830, 250);
    post(c, lt, t, 0.35);
    subsAt(c, lt, [
      [0.2, 3.6, 'Scans found a hidden chamber about 100 feet underground.', '扫描发现，地下约 30 米有一座地宫', { hl: '100 feet' }],
      [3.6, 7.0, 'Ancient records: rivers of mercury. Crossbows rigged to fire.', '史书记载：里面有水银江河，还有会自动发射的弩', { hl: 'mercury' }],
      [7.0, 10, 'Today, mercury above the tomb is way higher than normal.', '今天测到，封土上方的汞含量远超正常', { hl: 'way higher' }],
    ], { y: 1300, size: 72 }); } },

  // 51–56 为什么不挖：上次一挖开，颜色几分钟就没了
  { id: 's6', dur: 5, assets: A('067'), draw(c, lt, t) {
    const g = U.ss(0.6, 2.2, lt);
    TF.cover(c, TF.im('067'), { fx: lerp(0.38, 0.62, lt / 5), fy: 0.55, z: 1.25, filter: `grayscale(${g}) brightness(${1 - 0.15 * g})` });
    if (lt > 2.7) { c.fillStyle = `rgba(0,0,0,${0.55 * U.clamp((lt - 2.7) / 0.4)})`; c.fillRect(0, 0, 1080, 1920);
      c.save(); c.translate(540, 700); c.rotate(-0.12); const p = U.clamp((lt - 2.9) / 0.25), s = lerp(1.8, 1, U.ease.out(p)); c.scale(s, s); c.globalAlpha = p;
      c.strokeStyle = '#ff4a3a'; c.lineWidth = 10; c.strokeRect(-330, -95, 660, 190); c.font = '900 130px "Inter"'; c.textAlign = 'center'; c.fillStyle = '#ff4a3a'; c.fillText('SEALED', 0, 46); c.restore(); }
    post(c, lt, t);
    subsAt(c, lt, [[0.1, 2.8, 'Last time they dug, the colors died in minutes.', '上一次挖开，颜色几分钟就没了', { hl: 'minutes' }], [2.8, 5, 'So his tomb stays sealed. For now.', '所以他的主墓一直封着。至少现在是', { hl: 'sealed' }]], { y: 1220 }); } },

  // 56–60 夜里的封土，地宫在下面发光：你会打开吗？
  { id: 's7', dur: 4, draw(c, lt, t) {
    const GY = 900; TM.moundSide(c, GY, { night: 1 });
    const pu = 0.5 + 0.5 * Math.sin(lt * 3); c.save(); const g = c.createRadialGradient(540, GY + 260, 10, 540, GY + 260, 380); g.addColorStop(0, `rgba(191,230,255,${0.35 + 0.2 * pu})`); g.addColorStop(1, 'rgba(191,230,255,0)'); c.fillStyle = g; c.fillRect(0, GY, 1080, 700);
    c.strokeStyle = 'rgba(127,243,255,.7)'; c.setLineDash([16, 10]); c.lineWidth = 3; c.strokeRect(260, GY + 170, 560, 200); c.restore();
    post(c, lt, t, 0.45);
    TF.subs(c, lt, 'Would you open it?', '换你，你会打开吗？', { y: 520, size: 110, inAt: 0.2, hl: 'open' }); } },
];
