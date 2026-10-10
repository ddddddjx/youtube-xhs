// 长卷骨架：时间轴（88 BPM 小节网格）、镜头（停 → 横移落在下一朝第一拍 → 第 3 小节快推 → 第 4 小节拉回）、一匹丝（全片一根）、边饰、做旧。
// 每一朝一个段：DHW.add({ id, name, year, draw(c, r, t), front?(c, r, t), silk(r, t) → 本段局部点列（从 (0, SEAM_Y) 进、到 (1920, SEAM_Y) 出）,
//                       tip?(r) → 本段丝带露出的比例 0..1, focus: [x, y] 快推中心, keep: 不剥落的框, wall: 'ochre'|'red' })
// r = 本段局部时间（本段第一拍为 0，可为负）；段的世界坐标 x0 = 序号 × 1920。
(() => {
const W = 1920, H = 1080, { clamp, lerp } = U, { C, F } = DH;
const BAR = 240 / 88;
const DHW = window.DHW = { BAR, SEAM_Y: 250, segs: [], TOP: 124, BOT: 980 };
const ease = { inOut5: p => p < .5 ? 16 * p ** 5 : 1 - Math.pow(-2 * p + 2, 5) / 2, out3: p => 1 - Math.pow(1 - p, 3), inOut3: U.ease.inOut };
DHW.ease = ease;
DHW.add = (s) => { s.k = DHW.segs.length; s.x0 = s.k * W; s.bars = s.bars || 4; DHW.segs.push(s); };
DHW.finalize = () => { let acc = 0; for (const s of DHW.segs) { s.T = acc; acc += s.bars * BAR; s.T1 = acc; } DHW.total = acc; };
const PAN_IN = 0.75, PAN_OUT = 0.05;
// 当前段（以「段起点」划分；横移从下一段起点前 0.75s 开始）
DHW.cur = (t) => { let k = 0; DHW.segs.forEach((s, i) => { if (t >= s.T) k = i; }); return k; };
DHW.cam = (t) => {
  const k = DHW.cur(t), s = DHW.segs[k], r = t - s.T, nx = DHW.segs[k + 1];
  let x = s.x0, z = 1, f = s.focus || [960, 560], shake = 0;
  if (s.cam) { const o = s.cam(r, t); if (o) return o; }
  if (nx && t > nx.T - PAN_IN) { const p = ease.inOut5(clamp((t - (nx.T - PAN_IN)) / (PAN_IN + PAN_OUT))); x = lerp(s.x0, nx.x0, p); return { x, z: 1, fx: 960, fy: 540 }; }
  if (k > 0 && r < PAN_OUT) { const pv = DHW.segs[k - 1], p = ease.inOut5(clamp((r + PAN_IN) / (PAN_IN + PAN_OUT))); x = lerp(pv.x0, s.x0, p); return { x, z: 1, fx: 960, fy: 540 }; }
  // 落地冲击：1.03 → 1
  const hit = k > 0 ? Math.max(0, 1 - (r - PAN_OUT) / 0.3) : 0; z = 1 + 0.03 * ease.out3(hit) * hit;
  // 快推：第 3 小节第一拍推 1.22×（0.28s），第 4 小节中拉回（0.3s）
  const pin = s.punchAt != null ? s.punchAt : 2 * BAR, pout = s.pullAt != null ? s.pullAt : 3.5 * BAR, zz = s.zoom || 1.22;
  if (s.bars >= 2 && r >= pin) { const a = ease.inOut3(clamp((r - pin) / 0.45)), b = ease.inOut3(clamp((r - pout) / 0.45)); z *= 1 + (zz - 1) * a * (1 - b); }
  return { x, z, fx: f[0], fy: f[1] };
};
// 丝带露出比例（默认）：进场横移时快速冲进来，停留时慢慢往前，离场前跑完
DHW.tipDefault = (r) => r < -PAN_IN ? 0 : r < PAN_OUT ? 0.35 * ease.out3((r + PAN_IN) / (PAN_IN + PAN_OUT)) : r < 9.4 ? 0.35 + 0.45 * ease.inOut3((r - PAN_OUT) / (9.4 - PAN_OUT)) : r < 10.2 ? 0.8 + 0.2 * ease.inOut3((r - 9.4) / 0.8) : 1;

// ---------- 丝带：沿弧长画，正反面随扭转交替（石青正面带白点，土红反面），带头是金结＋流苏 ----------
function drawSilk(c, pts, t, headTassel = true) {
  if (pts.length < 2) return;
  const D = KIT.resample(pts, 6), n = D.length; if (n < 3) return;
  const W0 = 30, taper = pts[0][0] < 1920 ? 90 : 0, tw = i => Math.sin(i * 6 * 0.0105 - t * 2.4 + 0.6), wid = i => W0 * (0.25 + 0.75 * Math.abs(tw(i))) * (i > n - 30 ? 0.55 + 0.45 * (n - i) / 30 : 1) * (i < taper ? 0.06 + 0.94 * (i / taper) ** 1.5 : 1);
  // 分段：按扭转正负切块，每块单独成带
  let a = 0;
  for (let i = 1; i <= n; i++) {
    if (i === n || Math.sign(tw(i)) !== Math.sign(tw(a))) {
      const seg = D.slice(Math.max(0, a - 1), Math.min(n, i + 1)); if (seg.length >= 2) {
        const face = tw(a) > 0, p = KIT.ribbon(seg, q => wid(a + q * (seg.length - 1)));
        F(c, p, face ? C.blue2 : C.red, 2.2);
        if (face) { c.fillStyle = C.white; seg.forEach((q, j) => { if ((a + j) % 7 === 3 && wid(a + j) > 14) { c.beginPath(); c.arc(q[0], q[1], 2.8, 0, Math.PI * 2); c.fill(); } }); }
        else { c.strokeStyle = C.gold; c.lineWidth = 1.6; c.beginPath(); seg.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }
      }
      a = i;
    }
  }
  if (headTassel) { const e = D[n - 1], d = D[n - 4] || D[0], ang = Math.atan2(e[1] - d[1], e[0] - d[0]);
    c.save(); c.translate(e[0], e[1]); c.rotate(ang);
    c.strokeStyle = C.gold; c.lineWidth = 2.2; for (let j = -3; j <= 3; j++) { c.beginPath(); c.moveTo(0, j * 3); c.quadraticCurveTo(14, j * 4 + Math.sin(t * 9 + j) * 4, 26 + Math.abs(j) * 2, j * 6 + Math.sin(t * 7 + j * 1.3) * 6); c.stroke(); }
    F(c, DH.ell(0, 0, 8, 8), C.gold, 2); F(c, DH.ell(0, 0, 3, 3), C.red, 0); c.restore(); }
  return D[n - 1];
}
DHW.drawSilk = drawSilk;
// 截取点列前 s（按弧长）
DHW.cut = (pts, s) => { if (s >= 1) return pts; if (s <= 0) return []; const D = KIT.resample(pts, 4), m = Math.max(2, Math.round(D.length * s)); return D.slice(0, m); };

// ---------- 边饰：上（暗红＋卷草＋垂幔），下（石青卷草＋联珠），段界（竖卷草） ----------
function frame(c, s, t) {
  c.fillStyle = C.redDk; c.fillRect(0, 0, W, 22); DH.vineBand(c, 0, 18, W + 1, 52, { ph: s.x0 });
  c.fillStyle = C.redDk; c.fillRect(0, 70, W + 1, 6); DH.valance(c, 0, 76, W + 1, { tri: 64, h: 40, ph: t * 2 });
  DH.vineBand(c, 0, DHW.BOT, W + 1, 58, { bg: C.blue, ph: s.x0 }); DH.pearlBand(c, 0, DHW.BOT + 58, W + 1, 42);
  if (false) { c.fillStyle = C.green; c.fillRect(-14, DHW.TOP, 28, DHW.BOT - DHW.TOP); c.strokeStyle = C.white; c.lineWidth = 2.5;
    for (let y = DHW.TOP + 20; y < DHW.BOT; y += 44) { c.beginPath(); c.arc((Math.floor(y / 44) % 2 ? 4 : -4), y, 7, 0, Math.PI * 1.4); c.stroke(); }
    c.strokeStyle = C.line; c.lineWidth = 2.5; c.strokeRect(-14, DHW.TOP, 28, DHW.BOT - DHW.TOP); }
}
const WALLS = { ochre: ['#d6aa78', '#a8683e', 4], red: ['#b25a3a', '#7a3020', 5], pale: ['#e2cfa6', '#b8945e', 6] };
function segLayer(c, s, t, part) {
  const r = t - s.T;
  if (part === 'back') {
    const w = WALLS[s.wall || 'ochre'], wim = DH.wall(s.wall || 'ochre', w[0], w[1], w[2]); c.drawImage(wim, 0, 0);
    if (s.k > 0) for (let j = 0; j < 16; j++) { c.globalAlpha = (j + 1) / 17; c.drawImage(wim, 1920 - 320 + j * 20, 0, 20, 1080, -320 + j * 20, 0, 20, 1080); } c.globalAlpha = 1;
    c.save(); c.beginPath(); c.rect(0, DHW.TOP, W, DHW.BOT - DHW.TOP); c.clip(); s.draw(c, r, t); c.restore();
  } else if (part === 'front') {
    c.save(); c.beginPath(); c.rect(0, DHW.TOP, W, DHW.BOT - DHW.TOP); c.clip(); if (s.front) s.front(c, r, t); c.restore();
    frame(c, s, t);
    c.drawImage(DH.aging('seg' + s.k, { keep: (s.keep || []).concat(s.label ? [[(s.labelX ?? 60) - 4, (s.labelY ?? 150) - 4, (s.labelX ?? 60) + 160, (s.labelY ?? 150) + 420]] : []), amt: s.amt || 0.3, smoke: 0, seed: 91 + s.k * 7 }), 0, 0);
  } else if (part === 'label') {
    const pin = s.punchAt != null ? s.punchAt : 2 * BAR, pout = s.pullAt != null ? s.pullAt : 3.5 * BAR;
    const al = 1 - clamp((r - pin + 0.1) / 0.25) + clamp((r - pout - 0.2) / 0.3);
    if (s.label && al > 0.01) DH.bangti(c, s.labelX ?? 60, s.labelY ?? 150, s.label, { size: 40, seed: s.k + 3, alpha: Math.min(1, al) });
  }
}
DHW.silkWorld = (t, upto) => {   // 全片丝带点列（世界坐标），只取 [k0, k1] 段
  const out = []; const k = DHW.cur(t);
  for (let j = Math.max(0, upto[0]); j <= Math.min(DHW.segs.length - 1, upto[1]); j++) { const s = DHW.segs[j]; if (!s.silk) continue; const r = t - s.T;
    const sf = s.tip ? s.tip(r) : DHW.tipDefault(r); if (sf <= 0) break;
    const pts = DHW.cut(s.silk(r, t), sf).map(q => [q[0] + s.x0, q[1]]); out.push(...pts); if (sf < 1) break; }
  return out;
};
DHW.draw = (c, t) => { if (!DHW.total) DHW.finalize();
  const cam = DHW.cam(t); if (cam.custom) return cam.custom(c, t);
  c.fillStyle = '#7a3020'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(cam.fx, cam.fy); c.scale(cam.z, cam.z); c.translate(-cam.fx - cam.x, -cam.fy);
  const vx0 = cam.x + cam.fx - cam.fx / cam.z, vx1 = cam.x + cam.fx + (W - cam.fx) / cam.z;
  const vis = DHW.segs.filter(s => s.x0 + W + 20 > vx0 && s.x0 - 20 < vx1 && !s.offWorld);
  vis.forEach(s => { c.save(); c.translate(s.x0, 0); segLayer(c, s, t, 'back'); c.restore(); });
  const k0 = Math.max(0, vis[0].k - 1), k1 = vis[vis.length - 1].k;
  vis.forEach(s => { c.save(); c.translate(s.x0, 0); segLayer(c, s, t, 'front'); c.restore(); });
  c.save(); c.beginPath(); c.rect(vx0 - 10, DHW.TOP, vx1 - vx0 + 20, DHW.BOT - DHW.TOP); c.clip(); drawSilk(c, DHW.silkWorld(t, [0, k1]), t); c.restore();
  c.restore();
  DH.petals(c, t, { n: 10, y0: 100, y1: 1000, speed: 50, scale: 1.2 });
  c.save(); c.translate(cam.fx, cam.fy); c.scale(cam.z, cam.z); c.translate(-cam.fx - cam.x, -cam.fy);
  vis.forEach(s => { c.save(); c.translate(s.x0, 0); segLayer(c, s, t, 'label'); c.restore(); }); c.restore();
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,.22)'; c.fillRect(0, 0, W, H); c.restore();
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35; c.drawImage(PAINT.texture('dh_dirt', '#e8dcc8', { scale: 0.002, amt: 40, grain: 20, seed: 9 }), 0, 0); c.restore();
};
})();
