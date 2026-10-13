// Vox 拼贴三方向设定帧（同一刻：「每个兵俑都面朝东，守着一英里外一个人的墓」）。竖屏 1080×1920。
(() => {
const W = 1080, H = 1920, RED = '#b8433f', INK = '#1b1b1a';
const im = k => IMG['img/' + k + '.jpg'];
const V = window.VX = {};
// 照片 → 指定尺寸的灰度网点件（缓存）
V.ht = (key, k, w, h, fx = 0.5, fy = 0.5, z = 1, o = {}) => CL.halftone('vx_' + key, PAINT.cached('vxsrc_' + key, w, h, g => MD.cover(g, im(k), { w, h, fx, fy, z })), { cell: o.cell || 5, ink: o.ink || '#1b1b1b', paper: o.paper || '#ece6d8', contrast: o.contrast || 1.25 });
// 冲印件：白边＋网点照片＋胶带＋投影
V.print = (c, src, x, y, r, { border = 16, tape = true } = {}) => { const w = src.width + border * 2, h = src.height + border * 2;
  CL.placed(c, x, y, r, g => { CL.shadowed(g, () => { g.fillStyle = '#f2efe6'; g.fillRect(-w / 2, -h / 2, w, h); }); g.drawImage(src, -w / 2 + border, -h / 2 + border);
    if (tape) { CL.tape(g, -w / 2 + 40, -h / 2 + 4, -0.6, 120); CL.tape(g, w / 2 - 40, -h / 2 + 4, 0.55, 120); } }); return { w, h }; };
// 彩色冲印件（不网点）
V.colorPrint = (c, k, w, h, x, y, r, fx, fy, z = 1) => CL.placed(c, x, y, r, g => { const b = 14; CL.shadowed(g, () => { g.fillStyle = '#f4f1e8'; g.fillRect(-w / 2 - b, -h / 2 - b, w + 2 * b, h + 2 * b); });
  MD.cover(g, im(k), { x: -w / 2, y: -h / 2, w, h, fx, fy, z }); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,200,170,.22)'; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
  CL.tape(g, -w / 2 + 30, -h / 2 - 6, -0.5, 110); CL.tape(g, w / 2 - 30, h / 2 + 6, -0.5, 110); });
// 红线（整根）
V.line = (c, a, b, sag = 0.06, lw = 6, d = 1e9) => { const pts = CL.stringPts(a, b, sag), cum = DG.cum(pts); CL.string(c, pts, cum, d, { lw }); };
V.hand = (c, s, x, y, size = 52, col = '#2a2622', r = 0) => { c.save(); c.translate(x, y); c.rotate(r); c.font = `600 ${size}px "Caveat-600"`; c.fillStyle = col; c.fillText(s, 0, 0); c.restore(); };
// 手画红圈
V.circle = (c, x, y, rx, ry, q = 1, lw = 6) => { c.save(); c.strokeStyle = RED; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); const n = 60; for (let i = 0; i <= n * q * 1.08; i++) { const a = -1.2 + i / n * 6.6, rr = 1 + 0.04 * Math.sin(i * 0.7); const X = x + Math.cos(a) * rx * rr, Y = y + Math.sin(a) * ry * rr; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); c.restore(); };
// 索引卡（横线纸）
V.card = (c, x, y, w, h, r, lines, { size = 50 } = {}) => CL.placed(c, x, y, r, g => { CL.shadowed(g, () => { g.fillStyle = '#f6f3ea'; g.fillRect(-w / 2, -h / 2, w, h); });
  g.strokeStyle = 'rgba(80,120,170,.35)'; g.lineWidth = 2; for (let yy = -h / 2 + 90; yy < h / 2; yy += 62) { g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke(); }
  g.strokeStyle = 'rgba(184,67,63,.5)'; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 60); g.lineTo(w / 2, -h / 2 + 60); g.stroke();
  lines.forEach((s, i) => V.hand(g, s, -w / 2 + 34, -h / 2 + 140 + i * 62, size)); });

// ---------- A：浅色档案桌（Missing Chapter）：网点照片＋索引卡＋红线 ----------
V.A = (c, lt, t) => {
  CL.fillPaper(c, CL.paperTile('vxdeskA', '#e4ddcf'), 0, 0, W, H);
  V.card(c, 330, 330, 560, 330, -0.06, ['Pits: all face EAST', 'Tomb: ~1 mile west', 'Sealed since 210 BC']);
  CL.highlight(c, 90, 320, 380, 44, 1);
  const pit = V.ht('A107', '107', 720, 520, 0.5, 0.62, 1.15); V.print(c, pit, 600, 820, 0.035);
  const tomb = V.ht('A125', '125', 600, 420, 0.47, 0.45, 1.3); V.print(c, tomb, 420, 1370, -0.05);
  CL.pin(c, 830, 610); CL.pin(c, 600, 1180);
  V.line(c, [830, 610], [600, 1180], 0.08);
  MD.label(c, 'PIT 1', 290, 1060, { size: 48, fam: 'Inter', r: -0.03 }); MD.label(c, "THE EMPEROR'S TOMB", 210, 1610, { size: 44, fam: 'Inter', r: 0.02 });
  MD.label(c, '1 MILE', 760, 900 + 30, { size: 40, fam: 'Inter', bg: RED });
  V.circle(c, 420, 1350, 150, 70);
};
// ---------- B：黑卡调查墙（Vox Borders）：中间一张旧地图卡，红墨画出坑和陵，四周钉照片 ----------
V.B = (c, lt, t) => {
  CL.fillPaper(c, CL.paperTile('vxdeskB', '#1c1b19', { amt: 6, fiberCol: [70, 64, 55] }), 0, 0, W, H);
  // 地图卡
  CL.placed(c, 540, 860, 0.01, g => { CL.shadowed(g, () => { g.fillStyle = '#e4dccf'; g.fillRect(-420, -300, 840, 600); }, { col: 'rgba(0,0,0,.5)' });
    g.strokeStyle = 'rgba(60,50,40,.18)'; g.lineWidth = 1.5; for (let i = -400; i < 420; i += 60) { g.beginPath(); g.moveTo(i, -300); g.lineTo(i, 300); g.stroke(); } for (let j = -280; j < 300; j += 60) { g.beginPath(); g.moveTo(-420, j); g.lineTo(420, j); g.stroke(); }
    g.strokeStyle = RED; g.lineWidth = 4; g.strokeRect(-330, -170, 120, 300); g.strokeRect(-260, -110, 260 * 0 + 50, 160); // 外城、内城（缩略）
    g.fillStyle = 'rgba(184,67,63,.35)'; g.fillRect(-300, -60, 60, 60);
    g.fillStyle = INK; g.fillRect(230, -20, 90, 24); g.fillRect(300, -70, 50, 40); g.fillRect(240, -60, 14, 14);
    g.setLineDash([12, 10]); g.strokeStyle = RED; g.beginPath(); g.moveTo(-200, -30); g.lineTo(225, -10); g.stroke(); g.setLineDash([]);
    for (let k = 0; k < 4; k++) { const y = -60 + k * 30; g.beginPath(); g.moveTo(340, y); g.lineTo(390, y); g.stroke(); g.beginPath(); g.moveTo(398, y); g.lineTo(384, y - 9); g.lineTo(384, y + 9); g.closePath(); g.fillStyle = RED; g.fill(); }
    V.hand(g, '1 mile', -40, -50, 46, RED); V.hand(g, 'EAST →', 300, 120, 44, INK); });
  const face = V.ht('B000', '000', 300, 380, 0.53, 0.47, 1.0, { paper: '#e9e3d4' }); V.print(c, face, 230, 330, -0.06);
  const pit = V.ht('B107', '107', 420, 300, 0.5, 0.62, 1.2); V.print(c, pit, 770, 300, 0.05);
  const tomb = V.ht('B125', '125', 460, 320, 0.47, 0.45, 1.3); V.print(c, tomb, 300, 1400, 0.04);
  CL.pin(c, 230, 160); CL.pin(c, 770, 150); CL.pin(c, 300, 1230);
  V.line(c, [770, 150 + 20], [890, 850], 0.05, 5); V.line(c, [300, 1230], [240, 830], 0.05, 5); V.line(c, [230, 160 + 20], [860, 860], 0.12, 5);
  MD.label(c, '8,000 SOLDIERS', 640, 520, { size: 40, fam: 'Inter', bg: '#f0ece2', fg: INK, r: 0.03 });
  MD.label(c, 'ONE MAN', 520, 1420, { size: 52, fam: 'Inter', bg: RED, r: -0.03 });
};
// ---------- C：地图当桌面（Johnny Harris）：整幅旧地图满屏，彩色照片贴在地图上的位置，红线描路 ----------
V.C = (c, lt, t) => {
  CL.fillPaper(c, CL.paperTile('vxdeskC', '#cfb195', { amt: 14 }), 0, 0, W, H);
  // 等高线（骊山在南）
  c.save(); c.strokeStyle = 'rgba(110,80,50,.35)'; c.lineWidth = 2;
  for (let lv = 0; lv < 9; lv++) { c.beginPath(); for (let x = -20; x <= W + 20; x += 12) { const y = 1500 + lv * 55 - 120 * Math.sin(x * 0.004 + 1) - PAINT.fbm(x * 0.004, lv * 0.3, 3) * 160; x < 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); } c.restore();
  V.hand(c, 'Mt. Li', 780, 1720, 54, 'rgba(90,60,35,.8)', -0.05);
  // 渭河（北）
  c.save(); c.strokeStyle = 'rgba(70,110,130,.55)'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); for (let x = -20; x <= W + 20; x += 20) { const y = 230 + Math.sin(x * 0.006) * 40; x < 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); c.restore();
  V.hand(c, 'Wei River', 640, 190, 46, 'rgba(50,85,105,.9)');
  // 陵园（西）与兵马俑坑（东）墨线
  c.save(); c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(150, 760, 230, 520); c.strokeRect(205, 880, 120, 300); c.fillStyle = 'rgba(184,67,63,.45)'; c.fillRect(235, 990, 60, 60); c.strokeRect(235, 990, 60, 60);
  c.fillStyle = INK; c.fillRect(840, 980, 120, 30); c.fillRect(905, 930, 60, 40); c.fillRect(850, 940, 20, 20); c.restore();
  // 红线：从坑到陵
  c.save(); c.setLineDash([18, 12]); V.line(c, [840, 995], [300, 1020], 0.02, 7); c.restore();
  V.hand(c, '~1 mile', 470, 960, 60, RED, -0.02);
  for (let k = 0; k < 3; k++) { const y = 945 + k * 30; c.save(); c.strokeStyle = RED; c.lineWidth = 5; c.beginPath(); c.moveTo(975, y); c.lineTo(1030, y); c.stroke(); c.restore(); }
  // 贴在地图上的彩色照片
  V.colorPrint(c, '107', 470, 330, 760, 580, 0.04, 0.5, 0.62, 1.15);
  V.colorPrint(c, '125', 420, 290, 300, 1440, -0.05, 0.47, 0.45, 1.25);
  V.line(c, [760, 760], [900, 960], 0.0, 4); V.line(c, [300, 1300], [265, 1050], 0.0, 4);
  MD.label(c, 'TERRACOTTA ARMY', 760, 400, { size: 40, fam: 'Inter', align: 'center', r: 0.04 }); MD.label(c, "FIRST EMPEROR'S TOMB", 300, 1630, { size: 38, fam: 'Inter', align: 'center', r: -0.04 });
};
})();
