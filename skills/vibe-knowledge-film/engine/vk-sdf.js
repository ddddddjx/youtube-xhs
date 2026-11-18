/* vk-sdf.js — 用距离场捏模型（Krypto说AI，11-18）
 *
 * 做法：把一个形体写成「空间里每一点到表面的距离」的函数，几个基本形（球、椭球、胶囊、圆角盒）用「软并」揉在一起，
 * 再用 surface nets 把距离为 0 的那层面抽成网格。捏出来的东西是一整块圆润的形体（衣褶、肩颈、发髻都连成一体），
 * 比拿圆柱和盒子硬拼的好看。思路学自 Crimson Loong（纯 three.js 的龙片），代码是自己写的，不依赖 three 以外的东西。
 *
 *   const S = VKSdf;
 *   const body = S.union(0.06, S.ellipsoid([0, .25, 0], [.17, .24, .11]), S.capsule([0, 0, 0], [0, -.7, 0], .15, .3));
 *   const geo = S.mesh(body, [-.4, -.8, -.4], [.4, .6, .4], 0.02, THREE, (x, y, z) => y > .3 ? [.9, .8, .7] : [.2, .2, .3]);
 * 距离函数的写法：f(x, y, z) → 数，里面为负、外面为正。
 */
(function (G) {
'use strict';
const len = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

const sphere = (c, r) => (x, y, z) => len(x - c[0], y - c[1], z - c[2]) - r;
/* 椭球（近似距离，够抽面用） */
const ellipsoid = (c, r) => { const m = Math.min(r[0], r[1], r[2]); return (x, y, z) => (len((x - c[0]) / r[0], (y - c[1]) / r[1], (z - c[2]) / r[2]) - 1) * m; };
/* 胶囊，两头半径可以不一样（袖子、裙摆、小腿） */
const capsule = (a, b, ra, rb = ra) => { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], bb = bx * bx + by * by + bz * bz || 1e-9;
  return (x, y, z) => { const px = x - a[0], py = y - a[1], pz = z - a[2], h = clamp((px * bx + py * by + pz * bz) / bb, 0, 1); return len(px - bx * h, py - by * h, pz - bz * h) - (ra + (rb - ra) * h); }; };
/* 圆角盒：half 是半边长，r 是圆角 */
const rbox = (c, half, r = 0) => (x, y, z) => { const qx = Math.abs(x - c[0]) - half[0] + r, qy = Math.abs(y - c[1]) - half[1] + r, qz = Math.abs(z - c[2]) - half[2] + r;
  return len(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; };
/* 软并：k 越大揉得越圆（米）。k = 0 是硬并 */
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const union = (k, ...fs) => (x, y, z) => { let d = fs[0](x, y, z); for (let i = 1; i < fs.length; i++) d = smin(d, fs[i](x, y, z), k); return d; };
/* 从 a 里挖掉 b */
const sub = (k, a, b) => (x, y, z) => -smin(-a(x, y, z), b(x, y, z), k);
/* 给表面加起伏：g(x, y, z) 返回要鼓出来的米数（衣褶、鳞、木纹） */
const bump = (f, g) => (x, y, z) => f(x, y, z) - g(x, y, z);
/* 压扁 / 拉长：把形体沿各轴缩放（近似，缩放别太极端） */
const scale = (f, s) => { const m = Math.min(s[0], s[1], s[2]); return (x, y, z) => f(x / s[0], y / s[1], z / s[2]) * m; };

/* surface nets：mn / mx 是包围盒，cell 是格子边长（米，越小越细、越慢；人物用 0.012–0.02）。
 * color(x, y, z, nx, ny, nz) 可选，返回 [r, g, b]（线性色），写进顶点色。 */
function mesh(f, mn, mx, cell, T, color) {
  const nx = Math.max(2, Math.ceil((mx[0] - mn[0]) / cell)), ny = Math.max(2, Math.ceil((mx[1] - mn[1]) / cell)), nz = Math.max(2, Math.ceil((mx[2] - mn[2]) / cell));
  const dx = (mx[0] - mn[0]) / nx, dy = (mx[1] - mn[1]) / ny, dz = (mx[2] - mn[2]) / nz, sx = nx + 1, sy = ny + 1, sxy = sx * sy;
  const V = new Float32Array(sx * sy * (nz + 1));
  for (let k = 0, p = 0; k <= nz; k++) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) V[p++] = f(mn[0] + i * dx, mn[1] + j * dy, mn[2] + k * dz);
  const id = new Int32Array(nx * ny * nz).fill(-1), pos = [], C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], v = new Float32Array(8);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let m = 0; for (let c = 0; c < 8; c++) { v[c] = V[(i + C[c][0]) + (j + C[c][1]) * sx + (k + C[c][2]) * sxy]; if (v[c] < 0) m |= 1 << c; }
    if (m === 0 || m === 255) continue;
    let px = 0, py = 0, pz = 0, n = 0;
    for (const [a, b] of E) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); px += C[a][0] + (C[b][0] - C[a][0]) * t; py += C[a][1] + (C[b][1] - C[a][1]) * t; pz += C[a][2] + (C[b][2] - C[a][2]) * t; n++; }
    id[i + j * nx + k * nx * ny] = pos.length / 3; pos.push(mn[0] + (i + px / n) * dx, mn[1] + (j + py / n) * dy, mn[2] + (k + pz / n) * dz);
  }
  const idx = [], at = (i, j, k) => id[i + j * nx + k * nx * ny];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
  for (let k = 0; k <= nz; k++) for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const s = V[i + j * sx + k * sxy] < 0;
    if (i < nx && j > 0 && k > 0 && j < ny && k < nz && s !== (V[i + 1 + j * sx + k * sxy] < 0)) quad(at(i, j - 1, k - 1), at(i, j, k - 1), at(i, j, k), at(i, j - 1, k), !s);
    if (j < ny && i > 0 && k > 0 && i < nx && k < nz && s !== (V[i + (j + 1) * sx + k * sxy] < 0)) quad(at(i - 1, j, k - 1), at(i - 1, j, k), at(i, j, k), at(i, j, k - 1), !s);
    if (k < nz && i > 0 && j > 0 && i < nx && j < ny && s !== (V[i + j * sx + (k + 1) * sxy] < 0)) quad(at(i - 1, j - 1, k), at(i, j - 1, k), at(i, j, k), at(i - 1, j, k), !s);
  }
  const P = new Float32Array(pos), N = new Float32Array(pos.length), e = cell * 0.5, col = color ? new Float32Array(pos.length) : null;
  for (let p = 0; p < P.length; p += 3) {
    const x = P[p], y = P[p + 1], z = P[p + 2];
    let gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e); const l = len(gx, gy, gz) || 1; gx /= l; gy /= l; gz /= l;
    N[p] = gx; N[p + 1] = gy; N[p + 2] = gz;
    if (col) { const c = color(x, y, z, gx, gy, gz); col[p] = c[0]; col[p + 1] = c[1]; col[p + 2] = c[2]; }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(P, 3)); g.setAttribute('normal', new T.BufferAttribute(N, 3));
  if (col) g.setAttribute('color', new T.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeBoundingSphere(); return g;
}
/* sRGB 十六进制 → 线性 [r, g, b]（顶点色要线性） */
const lin = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });

G.VKSdf = { sphere, ellipsoid, capsule, rbox, union, sub, bump, scale, smin, mesh, lin };
})(window);
