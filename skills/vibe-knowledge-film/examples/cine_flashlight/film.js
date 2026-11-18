/* ★ vk-cine 示例 ·「手电筒」一镜（10 秒，120 BPM）
 * 这是什么：黑屋里一张书桌、一支手电筒（= 注意力）。它在干什么：光先锁在游戏机上，被扳走去找截止日期，第 4 小节第 1 拍截止卡砸进光里。
 * 观众明白了什么：注意力不是不够，是照不到还没到眼前的事。
 * 这条示例只为演示 engine/vk-cine.js：?plain 关掉全部后期（同一个场景，前后对比用）。画面是示意，不带事实数据。 */
(function () {
'use strict';
const { W, H, clamp, lerp, ss } = VK;
const K = VKit, C = VKCine; let THREE;                                // Three.js 是 module，晚于本文件载入：用到时再取
const PLAIN = new URLSearchParams(location.search).has('plain');

const B = C.beats(120);                                              // 一小节 2 秒
const T = B.sheet({ LOCK: 1, PULL: 2, SEARCH: 3, HIT: 4, HOLD: 5 }); T.end = 10;
const HOOK = 'ADHD：注意力真的{不够}吗？';
const SUBS = [
  { a: 0.3, b: 3.6, zh: '光能在{游戏}上锁四个小时' },
  { a: 3.9, b: 5.8, zh: '却照不到下周的事' },
  { a: 6.1, b: 9.6, zh: '直到它只剩{!一个晚上}' },
];

let S = null;
function build() {
  THREE = window.THREE;
  const FAST = new URLSearchParams(location.search).has('fast');     // ?fast：3D 按 0.75 倍渲、不开 MSAA（预览用）
  const g3 = K.three(W, H), cine = C.create(g3, FAST ? { scale: 0.75, samples: 0 } : { samples: 4 });
  const scene = new THREE.Scene(), fx = new THREE.Scene(); scene.background = new THREE.Color(0x020308);
  const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 60);
  const std = (c, r = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...o });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; scene.add(b); return b; };
  box(14, 0.1, 12, std(0x2a1d14, 0.9), 0, -0.05, -1);                 // 地板
  box(14, 6, 0.1, std(0x23252e, 0.95), 0, 3, -3.6);                   // 后墙
  const wood = std(0x6b4628, 0.7);
  box(2.6, 0.07, 1.2, wood, 0, 0.78, -1);                             // 桌面
  for (const [x, z] of [[-1.2, -0.5], [1.2, -0.5], [-1.2, -1.5], [1.2, -1.5]]) box(0.07, 0.76, 0.07, wood, x, 0.38, z);
  box(0.5, 0.05, 0.36, std(0x7a2f2a, 0.8), 0.75, 0.84, -1.15); box(0.46, 0.05, 0.34, std(0x2f4a6a, 0.8), 0.77, 0.89, -1.13); box(0.42, 0.04, 0.3, std(0xcdb98a, 0.8), 0.74, 0.935, -1.16);   // 一摞书
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.12, 24), std(0xe8e2d6, 0.5)); cup.position.set(0.25, 0.875, -1.35); cup.castShadow = cup.receiveShadow = true; scene.add(cup);
  /* 游戏机：机身 + 发光屏 */
  const con = new THREE.Group(); con.position.set(-0.62, 0.83, -0.92); con.rotation.set(-0.5, 0.35, 0); scene.add(con);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.03), std(0x30333d, 0.5)); body.castShadow = true; con.add(body);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.16), new THREE.MeshBasicMaterial({ color: 0x35e0c8 })); scr.position.z = 0.017; con.add(scr);
  const glow = new THREE.PointLight(0x35e0c8, 0.5, 2.5, 2); glow.position.set(-0.55, 1.0, -0.8); scene.add(glow);
  /* 墙上的日历 */
  const cal = document.createElement('canvas'); cal.width = 512; cal.height = 384; { const x = cal.getContext('2d'); x.fillStyle = '#d9d2c2'; x.fillRect(0, 0, 512, 384); x.fillStyle = '#8a3a30'; x.fillRect(0, 0, 512, 56);
    x.strokeStyle = '#8d8676'; x.lineWidth = 2; for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) x.strokeRect(12 + i * 70, 68 + j * 62, 66, 58); x.fillStyle = '#b3261e'; x.beginPath(); x.arc(12 + 4 * 70 + 33, 68 + 3 * 62 + 29, 20, 0, 6.3); x.fill(); }
  const calT = new THREE.CanvasTexture(cal); calT.colorSpace = THREE.SRGBColorSpace;
  const calM = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.82), new THREE.MeshStandardMaterial({ map: calT, roughness: 0.9 })); calM.position.set(-1.9, 1.9, -3.54); calM.receiveShadow = true; scene.add(calM);
  /* 截止卡 */
  const cc = document.createElement('canvas'); cc.width = 512; cc.height = 320; { const x = cc.getContext('2d'); x.fillStyle = '#f2ece0'; x.fillRect(0, 0, 512, 320); x.fillStyle = '#b3261e'; x.fillRect(0, 0, 512, 70);
    x.fillStyle = '#fff'; x.font = '700 40px "VK Sans"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('截止日期', 256, 37); x.fillStyle = '#1a1a1a'; x.font = '900 104px "VK Sans"'; x.fillText('明天 9:00', 256, 190); }
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 8;
  const card = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.39, 0.012), [0, 1, 2, 3].map(() => std(0xe8e0d0)).concat([new THREE.MeshStandardMaterial({ map: ct, color: 0x6e6e6e, roughness: 0.75, emissive: 0xff2a1a, emissiveIntensity: 0 })   /* 卡面压到四成亮：它正对着灯，不压就曝成一块白 */, std(0xe8e0d0)]));
  card.castShadow = true; scene.add(card);
  /* 手电筒 */
  const torch = new THREE.Group(); scene.add(torch);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 20), std(0x1c1d22, 0.4, { metalness: 0.6 })); tb.rotation.x = Math.PI / 2; tb.position.z = -0.13; torch.add(tb);
  const th = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.09, 24), std(0x2a2b31, 0.4, { metalness: 0.6 })); th.rotation.x = -Math.PI / 2; th.position.z = 0.035; torch.add(th);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.052, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 7.6, 5) })); lens.position.z = 0.081; torch.add(lens);
  const spot = new THREE.SpotLight(0xffe2b0, 160, 14, 0.26, 0.6, 2); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0004; spot.shadow.camera.near = 0.3; spot.shadow.camera.far = 14; scene.add(spot, spot.target);
  scene.add(new THREE.HemisphereLight(0x4a5c96, 0x1a120c, 1.3));
  g3.renderer.shadowMap.enabled = true; g3.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* 柔边特效层 */
  const motes = cine.motes({ count: 900, box: [0.2, 1.3, -0.8, 5, 2.4, 4.5], size: 0.022, wind: [0.04, -0.015, 0.02] });
  const mist = cine.mist({ count: 26, box: [0, 1.0, -1.4, 8, 1.6, 4], size: 2.2, color: 0x56617a, ambient: 0.04, opacity: 0.14, cover: 0.1, wind: [0.12, 0, 0.02] });
  const beam = cine.beam({ length: 5.2, angle: 0.2, color: 0xffe2b0, strength: 0.34 });
  fx.add(mist, beam, motes);
  return { g3, cine, scene, fx, cam, spot, torch, beam, motes, mist, card, glow, scr };
}

const camRail = C.rail([[0, 0.55, 1.62, 3.5], [T.SEARCH, 0.1, 1.5, 3.2], [T.HIT, -0.35, 1.38, 2.9], [T.end, -0.15, 1.33, 2.6]]);
/* 光斑落点：游戏机 → 扫过墙上的日历 → 回到桌前（截止卡落下的地方） */
const aimRail = C.rail([[0, -0.62, 0.86, -0.92], [T.PULL, -0.62, 0.86, -0.92], [T.SEARCH, -1.7, 1.8, -3.5], [T.SEARCH + 1.2, 0.6, 1.5, -3.5], [T.HIT - 0.15, 0.05, 0.98, -0.75], [T.end, 0.05, 0.98, -0.75]]);
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

function shot(fr, t) {
  if (fr.collecting) { if (t >= T.HIT && t < T.HIT + 0.04) fr.sfx(T.HIT, 'hit'); return; }   // 导出音效表时不渲 3D（不然整片再跑一遍）
  S = S || build(); const { g3, cine, scene, fx, cam, spot, torch, beam, motes, mist, card, glow, scr } = S;
  const hit = C.env(t, T.HIT, 0.03, 0.55), [sx, sy] = C.shake(t, hit * 0.035);
  const cp = camRail(t); cam.position.set(cp[0] + sx, cp[1] + sy, cp[2]); cam.lookAt(0, 1.0, -1.1);
  /* 手电筒在右上方悬着，略微呼吸；被扳走那一下（PULL）手腕多转一点 */
  const tp = new THREE.Vector3(1.75 + 0.03 * Math.sin(t * 0.9), 1.72 + 0.02 * Math.sin(t * 1.3 + 1), 0.55), aim = V(aimRail(t));
  torch.position.copy(tp); torch.lookAt(aim);
  const mouth = tp.clone().add(aim.clone().sub(tp).normalize().multiplyScalar(0.09));
  spot.position.copy(mouth); spot.target.position.copy(aim); spot.intensity = 160 * (1 + 0.15 * hit);
  beam.position.copy(mouth); beam.lookAt(aim); beam.userData.U.uK.value = 0.16 + 0.08 * hit;
  cine.lightTo(motes, spot, 5); cine.lightTo(mist, spot, 0.5);
  /* 截止卡：HIT 前 0.35 秒从上方黑处落下，砸在桌面上立住，砸中后发红 */
  const fall = clamp((t - (T.HIT - 0.35)) / 0.35), fy = fall * fall, bounce = t > T.HIT ? Math.exp(-(t - T.HIT) * 7) * Math.sin((t - T.HIT) * 30) * 0.03 : 0;
  card.visible = t > T.HIT - 0.35; card.position.set(0.05, lerp(3.2, 1.01, fy) + Math.abs(bounce), -0.72); card.rotation.set(-0.12 + (1 - fy) * 0.9, -0.22, (1 - fy) * 0.5);   /* 卡面略朝镜头偏、不正对灯 */
  card.material[4].emissiveIntensity = 0.05 * hit + 0.02 * ss(t, T.HIT, T.HIT + 1.5);
  const flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3); glow.intensity = 0.5 * flick; scr.material.color.setRGB(0.21 * flick, 0.88 * flick, 0.78 * flick).multiplyScalar(1.6);
  cine.render(scene, PLAIN ? null : fx, cam, {
    t, plain: PLAIN,
    fog: { color: [0.012, 0.018, 0.035], sunColor: [0.2, 0.15, 0.09], sunDir: tp.clone().sub(cam.position), sunPower: 10, density: 0.03, height: 0.6, falloff: 0.5, haze: 0.005, max: 0.5, sky: 12 },
    bloom: { strength: 0.3 + 0.25 * C.env(t, T.HIT, 0.02, 0.25), threshold: 1.6, knee: 0.5 },
    shafts: { pos: mouth, strength: 0.18, threshold: 2.5, length: 0.45, color: [1.0, 0.86, 0.62] },
    grade: { exposure: 1.5, contrast: 1.08, saturation: 1.1,   /* three 自带的 ACES 先乘了 1/0.6；要对上它的亮度，曝光给到 1.5 左右 */ shadows: [0.0, 0.012, 0.03], highlights: [0.03, 0.012, 0.0], vignette: 0.4, fringe: 0.003 + 0.02 * C.env(t, T.HIT, 0.02, 0.2), grain: 0.035, lens: 0.7 * C.env(t, T.HIT, 0.02, 0.09), lensAt: card.position,   /* 鼓包只留三四帧：再久字就被扭歪了 */ white: 0.1 * C.env(t, T.HIT, 0.02, 0.09), fade: ss(t, 0, 0.5) * 0.75 + 0.25 },
  });
  fr.x.drawImage(g3.canvas, 0, 0); fr.look.bloom = 0; fr.look.grain = 0;
  if (t >= T.HIT && t < T.HIT + 0.04) fr.sfx(T.HIT, 'hit');
}

VK.film({
  dur: T.end, theme: 'gilt',
  meta: { title: 'vk-cine 示例：手电筒', music: { bpm: B.bpm, sections: [[0, 1], [T.SEARCH, 2]], drop: [T.HIT] } },   // 画面和配乐读同一张节拍表
  draw(fr, t) {
    shot(fr, t);
    K.hookBar(fr, t, HOOK, { style: 'gilt' });
    K.subs(fr, t, SUBS, 'gilt');
  },
});
})();
