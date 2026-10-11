// core.js —— 时间、缓动、随机、节拍表、镜头。所有东西都是时间 t 的函数，同一个 t 渲两次逐像素一致。
import * as THREE from 'three';

// ---------- 随机：固定种子 ----------
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// ---------- 缓动 ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = k => { k = clamp(k); return k * k * k * (k * (k * 6 - 15) + 10); };   // 3b1b 的 smoothstep
export const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
export const easeIn = k => Math.pow(clamp(k), 3);
export const easeInOut = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
// 0→1 的进度：从 t0 开始、持续 d 秒
export const prog = (t, t0, d, ease = smooth) => ease((t - t0) / d);
// 窗口：t 在 [a, b] 内时 1，带 fi / fo 秒的淡入淡出
export function win(t, a, b, fi = .4, fo = .3) {
  if (t < a || t > b + fo) return 0;
  return Math.min(smooth((t - a) / fi), 1 - smooth((t - b) / fo));
}
// 砸入：0.17 秒 1.55 → 0.94 → 1
export function slam(t, t0) {
  const k = (t - t0) / .17;
  if (k <= 0) return 1.55; if (k >= 1) return 1;
  return k < .6 ? lerp(1.55, .94, easeOut(k / .6)) : lerp(.94, 1, smooth((k - .6) / .4));
}
// 脉冲：在 t0 起跳的一次 0→1→0
export const pulse = (t, t0, d = .6) => { const k = (t - t0) / d; return k < 0 || k > 1 ? 0 : Math.sin(Math.PI * k); };

// ---------- 节拍表 ----------
// window.TL 由 scripts/timeline.py 生成：{ total, beats: [{id, start, end, zh, en, key, ...}] }
export const TL = () => window.TL || { total: 10, beats: [] };
export function beat(id) {
  const b = TL().beats.find(x => x.id === id);
  if (!b) throw new Error('节拍表里没有这一拍：' + id);
  return b;
}
export const at = (id, off = 0) => beat(id).start + off;          // 这一拍开始的时刻（+偏移）
export const end = (id, off = 0) => beat(id).end + off;
export const during = (t, a, b) => t >= at(a) && t < (b ? end(b) : end(a));

// ---------- 镜头 ----------
// keys: [{t, pos:[x,y,z], look:[x,y,z], fov?, ease?}]，相邻两 key 之间插值；t 早于第一个 key 停在第一个，晚于最后一个停在最后一个。
// 推进 / 钻入用 log 插值距离（zoom: true），远近穿越不会前慢后猛。
export function cameraRig(camera, keys) {
  keys = keys.slice().sort((a, b) => a.t - b.t);
  const v = (a) => new THREE.Vector3(...a);
  return function update(t) {
    let i = keys.findIndex(k => k.t > t);
    if (i === -1) i = keys.length;
    const A = keys[Math.max(0, i - 1)], B = keys[Math.min(keys.length - 1, i)];
    const span = Math.max(1e-6, B.t - A.t);
    const k = A === B ? 0 : (B.ease || smooth)((t - A.t) / span);
    const pa = v(A.pos), pb = v(B.pos), la = v(A.look), lb = v(B.look);
    const look = la.clone().lerp(lb, k);
    let pos;
    if (B.zoom) {                                  // 沿视线做对数距离插值
      const da = pa.distanceTo(la), db = pb.distanceTo(lb);
      const d = Math.exp(lerp(Math.log(Math.max(da, 1e-4)), Math.log(Math.max(db, 1e-4)), k));
      const dir = pa.clone().sub(la).normalize().lerp(pb.clone().sub(lb).normalize(), k).normalize();
      pos = look.clone().add(dir.multiplyScalar(d));
    } else pos = pa.lerp(pb, k);
    camera.position.copy(pos);
    camera.lookAt(look);
    camera.fov = lerp(A.fov || 40, B.fov || 40, k);
    camera.updateProjectionMatrix();
  };
}

// 3D 点投影到屏幕像素（HUD 引线用）
export function project(obj, camera, W, H) {
  const p = (obj.isVector3 ? obj.clone() : obj.getWorldPosition(new THREE.Vector3())).project(camera);
  return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, behind: p.z > 1 };
}
