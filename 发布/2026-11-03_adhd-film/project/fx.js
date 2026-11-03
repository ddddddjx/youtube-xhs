/* fx.js —《手电筒》的特效件（11-03 第二版）。都是 t 的纯函数，随机全部按序号取 hash。
 * beam     体积光：曲线光锥（被扳动时像绳子一样甩弯）+ 光里浮动的尘埃 + 光圈
 * flare    镜头上的横向光晕和几个鬼影
 * tendrils 分心的东西伸出来的发光触须，一路爬到光圈上把它拽走
 * ripples  一圈圈往外扩的提醒波纹
 * tunnel   超专注：光圈以外压黑 + 从光圈往外射的时间流线
 * sparks   一次爆开的火星（带重力）
 * leak     换场时的暖色漏光 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rgba, noise1 } = VK;

const qb = (p0, c, p1, u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]];
const qd = (p0, c, p1, u) => [2 * (1 - u) * (c[0] - p0[0]) + 2 * u * (p1[0] - c[0]), 2 * (1 - u) * (c[1] - p0[1]) + 2 * u * (p1[1] - c[1])];

/* 体积光。head、tg 屏幕坐标；bend：控制点相对中点的偏移（像素）；R、ry 光圈半径 */
function beam(fr, t, head, tg, R, ry, on, bend = [0, 0], o = {}) {
  if (on <= 0) return;
  const x = fr.x, mid = [(head[0] + tg[0]) / 2 + bend[0], (head[1] + tg[1]) / 2 + bend[1]], N = 28;
  const wAt = u => lerp(30, R * .95, Math.pow(u, .9));
  const pts = [], nrm = [];
  for (let i = 0; i <= N; i++) { const u = i / N, p = qb(head, mid, tg, u), d = qd(head, mid, tg, u), l = Math.hypot(d[0], d[1]) || 1; pts.push(p); nrm.push([-d[1] / l, d[0] / l]); }
  x.save(); x.globalCompositeOperation = 'lighter';
  const g = x.createLinearGradient(head[0], head[1], tg[0], tg[1]); const col = o.color || [255, 214, 140];
  g.addColorStop(0, `rgba(${col},${.16 * on})`); g.addColorStop(.55, `rgba(${col},${.06 * on})`); g.addColorStop(1, `rgba(${col},${.035 * on})`);
  for (const L of [1, .82, .64, .46, .28]) {   // 软边：五层越来越窄的锥叠起来
    x.beginPath();
    for (let i = 0; i <= N; i++) { const w = wAt(i / N) * L; x.lineTo(pts[i][0] + nrm[i][0] * w, pts[i][1] + nrm[i][1] * w * (ry / R)); }
    for (let i = N; i >= 0; i--) { const w = wAt(i / N) * L; x.lineTo(pts[i][0] - nrm[i][0] * w, pts[i][1] - nrm[i][1] * w * (ry / R)); }
    x.closePath(); x.fillStyle = g; x.fill();
  }
  /* 光里浮动的尘埃：沿光锥慢慢漂，越靠中线越亮 */
  const M = o.motes == null ? 220 : o.motes;
  for (let i = 0; i < M; i++) {
    const u = (hash(i * 1.7) + t * (.012 + .02 * hash(i + 4))) % 1, v = hash(i * 2.3 + 1) * 2 - 1 + Math.sin(t * .6 + i) * .08;
    const k = Math.floor(u * N), f = u * N - k, p0 = pts[k], p1 = pts[Math.min(N, k + 1)], nn = nrm[k], w = wAt(u) * .9;
    const px = lerp(p0[0], p1[0], f) + nn[0] * w * v, py = lerp(p0[1], p1[1], f) + nn[1] * w * v * (ry / R);
    const tw = .5 + .5 * Math.sin(t * (1.3 + hash(i + 9) * 2) + i), a = on * (1 - v * v) * (.25 + .75 * hash(i + 3)) * tw * (.35 + .65 * u);
    const s = hash(i + 7) > .9 ? 3.2 : 1.8;
    x.fillStyle = `rgba(255,236,190,${a * .9})`; x.fillRect(px - s / 2, py - s / 2, s, s);
  }
  /* 光圈：中心亮、边缘软 */
  const rg = x.createRadialGradient(tg[0], tg[1], 0, tg[0], tg[1], R * 1.1);
  rg.addColorStop(0, `rgba(255,226,160,${.22 * on})`); rg.addColorStop(.55, `rgba(246,200,120,${.14 * on})`); rg.addColorStop(1, 'rgba(246,200,120,0)');
  x.fillStyle = rg; x.beginPath(); x.ellipse(tg[0], tg[1], R * 1.1, ry * 1.1, 0, 0, Math.PI * 2); x.fill();
  x.restore();
}

/* 镜头光晕：一条横向的细长光 + 头上一团 + 沿画面中心方向的几个鬼影 */
function flare(fr, head, on, t) {
  if (on <= 0) return; const x = fr.x, fl = on * (.92 + .08 * noise1(t * 7));
  x.save(); x.globalCompositeOperation = 'lighter';
  for (const [w, h, a] of [[900, 5, .22], [420, 14, .16], [160, 40, .25]]) {
    const g = x.createRadialGradient(head[0], head[1], 0, head[0], head[1], w); g.addColorStop(0, `rgba(255,240,205,${a * fl})`); g.addColorStop(1, 'rgba(255,240,205,0)');
    x.fillStyle = g; x.save(); x.translate(head[0], head[1]); x.scale(1, h / w); x.beginPath(); x.arc(0, 0, w, 0, Math.PI * 2); x.fill(); x.restore();
  }
  const cx = W / 2, cy = H / 2;
  [[.55, 26, '120,180,255', .06], [.85, 14, '255,180,120', .08], [1.35, 46, '180,140,255', .04]].forEach(([k, r, c, a]) => {
    const gx = head[0] + (cx - head[0]) * k * 2, gy = head[1] + (cy - head[1]) * k * 2; const g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
    g.addColorStop(0, `rgba(${c},${a * fl})`); g.addColorStop(.7, `rgba(${c},${a * .6 * fl})`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.beginPath(); x.arc(gx, gy, r, 0, Math.PI * 2); x.fill();
  });
  x.restore();
}

/* 触须：从 from 伸向 to，k 0..1 是伸出去多少；几根带波动的发光曲线，线上跑着亮点 */
function tendrils(fr, t, from, to, k, color = '#F0563E', n = 5, seed = 1) {
  if (k <= 0) return;
  for (let j = 0; j < n; j++) {
    const s = seed * 31 + j, pts = [], ang = Math.atan2(to[1] - from[1], to[0] - from[0]), len = Math.hypot(to[0] - from[0], to[1] - from[1]), pr = [-Math.sin(ang), Math.cos(ang)];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, wob = Math.sin(u * Math.PI) * (40 + 60 * hash(s)) * Math.sin(u * (5 + 4 * hash(s + 1)) + t * (2 + hash(s + 2) * 2) + j) + (hash(s + 3) - .5) * 120 * Math.sin(u * Math.PI);
      pts.push([from[0] + Math.cos(ang) * len * u + pr[0] * wob, from[1] + Math.sin(ang) * len * u + pr[1] * wob]);
    }
    fr.poly(pts, { color, w: 2.2, a: .55, glow: 14, k: E.out3(clamp(k * (1.1 - j * .04))), add: true });
    const hk = E.out3(clamp(k * (1.1 - j * .04))), hp = fr.along(pts, hk); fr.glow(hp[0], hp[1], 16, color, .7 * (k < 1 ? 1 : .4));
    if (k >= 1) { const u = (t * .9 + hash(s + 5)) % 1, p = fr.along(pts, u); fr.glow(p[0], p[1], 10, '#FFD0B0', .6); }
  }
}

/* 提醒波纹：t0 起，每 period 秒一圈，往外扩着淡掉 */
function ripples(fr, t, t0, t1, cx, cy, color = '#F0563E', period = .45, r1 = 220) {
  if (t < t0 || t > t1 + 1.2) return;
  for (let s = t0; s <= Math.min(t, t1); s += period) {
    const k = seg(t, s, s + 1.2); if (k <= 0 || k >= 1) continue;
    fr.circle(cx, cy, lerp(20, r1, E.out3(k)), { color, w: 3 * (1 - k) + .8, a: .7 * (1 - k), glow: 12, add: true });
  }
}

/* 超专注的隧道视野：光圈以外压黑；从光圈往外射时间流线 */
function tunnel(fr, t, spot, k, lines = true) {
  if (k <= 0) return; const x = fr.x;
  const g = x.createRadialGradient(spot[0], spot[1], 140, spot[0], spot[1], 900);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.18, `rgba(0,0,0,${.35 * k})`); g.addColorStop(1, `rgba(0,0,0,${.88 * k})`);
  x.save(); x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (lines) {
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) {
      const a = hash(i * 3.1) * Math.PI * 2, sp = .6 + hash(i + 2) * 1.4, ph = (hash(i + 5) + t * sp) % 1, r0 = 180 + ph * 900, len = 40 + 140 * ph;
      const al = k * Math.sin(ph * Math.PI) * (.15 + .25 * hash(i + 8));
      x.strokeStyle = `rgba(255,222,160,${al})`; x.lineWidth = 1.4; x.beginPath();
      x.moveTo(spot[0] + Math.cos(a) * r0, spot[1] + Math.sin(a) * r0 * .7); x.lineTo(spot[0] + Math.cos(a) * (r0 + len), spot[1] + Math.sin(a) * (r0 + len) * .7); x.stroke();
    }
  }
  x.restore();
}

/* 火星：t0 时刻从 (cx, cy) 爆开，带重力，1.4 秒内落下淡掉 */
function sparks(fr, t, t0, cx, cy, n = 90, color = '255,150,90', seed = 3, spd = 900) {
  const lt = t - t0; if (lt < 0 || lt > 1.6) return; const x = fr.x; x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = hash(seed * 17 + i) * Math.PI * 2, v = spd * (.25 + .75 * hash(seed * 13 + i * 1.3)), life = .6 + hash(i + seed) * .9; if (lt > life) continue;
    const px = cx + Math.cos(a) * v * lt * (1 - lt * .35), py = cy + Math.sin(a) * v * lt * (1 - lt * .35) + 600 * lt * lt, f = 1 - lt / life;
    const tx = px - Math.cos(a) * v * .025, ty = py - (Math.sin(a) * v - 1200 * lt) * .025;   // 拖尾
    x.strokeStyle = `rgba(${color},${f})`; x.lineWidth = 2.2 * f + .6; x.beginPath(); x.moveTo(tx, ty); x.lineTo(px, py); x.stroke();
  }
  x.restore();
}

/* 镜头抖：t0 起衰减 */
const shake = (t, t0, amp = 16, dur = .7) => { const k = seg(t, t0, t0 + dur); if (t < t0 || k >= 1) return [0, 0]; const d = amp * Math.pow(1 - k, 2); return [noise1(t * 40) * d, noise1(t * 40 + 9) * d]; };

/* 换场漏光：每个时刻附近一片暖色从一侧扫过 */
function leak(fr, t, times) {
  const x = fr.x;
  for (const c of times) {
    const k = 1 - clamp(Math.abs(t - c) / .45); if (k <= 0) continue;
    const gx = lerp(-200, W + 200, seg(t, c - .45, c + .45));
    const g = x.createRadialGradient(gx, H * .4, 0, gx, H * .4, 900); g.addColorStop(0, `rgba(255,170,90,${.35 * k})`); g.addColorStop(.5, `rgba(255,120,60,${.12 * k})`); g.addColorStop(1, 'rgba(255,120,60,0)');
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.restore();
  }
}

window.FX = { beam, flare, tendrils, ripples, tunnel, sparks, shake, leak, qb };
})();
