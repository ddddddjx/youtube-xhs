/* 《一死酬知己，此身寄长城》第一章 · 渭水之畔（先做前 10 秒样片）
 * 世界在 world.js，人物在 chars.js，招式特效在 fx.js。这里只管时间：节拍表、姿势关键帧、镜头轨、字幕。
 * 120 BPM，一小节 2 秒。所有画面只由 t 决定。 */
(function () {
'use strict';
const { W, H, clamp, lerp, ss } = VK;
const K = VKit, C = VKCine, QM = window.QM; let THREE;
const Q = new URLSearchParams(location.search), PLAIN = Q.has('plain'), FAST = Q.has('fast');

const B = C.beats(120);
const T = { TURN: 1.0, STANCE: 2.0, WIND: 2.6, LUNGE: 3.0, DODGE: 3.3, CAST: 5.0, L1: 5.5, H1: 6.0, H2: 6.5, H3: 7.0, SHIELD: 7.4, SWEEP: 7.9, end: 10 };
/* 关键帧最初是按「晚一秒」排的：2.1 秒之后的整体提前一秒，之前的压紧（开场更快进到动作）*/
const early = ks => ks.map(k => [k[0] > 2.1 ? +(k[0] - 1).toFixed(3) : +(k[0] * 0.64).toFixed(3), ...k.slice(1)]);
const PI = Math.PI, HITS = [T.H1, T.H2, T.H3];
/* 姿势关键帧：[t, x, y, z, yaw, lean, twist, hy, hp, rsx, rsz, re, lsx, lsz, le, aim, legR, legL, sh] */
const KM = [   // 蒙恬：左边，脸朝 +X（yaw = π/2）。右手戈，左臂盾
  [0.0, -2.5, 0, 0.05, PI / 2, 0.02, 0.15, 0, 0, -0.35, -0.12, 1.0, 0.1, 0.15, 0.5, 0.5, 0.05, -0.05, 0.2],
  [2.2, -2.5, 0, 0.05, PI / 2, 0.02, 0.15, 0, 0, -0.35, -0.12, 1.0, 0.1, 0.15, 0.5, 0.5, 0.05, -0.05, 0.2],
  [2.8, -2.45, 0, 0.05, PI / 2, 0.08, 0.3, 0, -0.05, -1.25, -0.1, 0.25, 0.1, 0.2, 0.6, 0.0, 0.15, -0.1, 0.2],     // 戈尖一指：「怎么，你不敢？」
  [3.5, -2.45, 0, 0.05, PI / 2, 0.08, 0.3, 0, -0.05, -1.25, -0.1, 0.25, 0.1, 0.2, 0.6, 0.0, 0.15, -0.1, 0.2],
  [3.95, -2.6, -0.14, 0.05, PI / 2, 0.3, 0.75, -0.4, -0.1, 0.35, -0.25, 1.5, -0.5, 0.2, 1.1, 0.1, -0.5, 0.45, 0.4], // 蓄力：沉身、戈收到身后
  [4.35, -0.45, -0.16, 0.1, PI / 2, 0.52, -0.5, 0.3, -0.25, -1.5, -0.05, 0.05, -0.2, 0.3, 1.2, 0.0, 0.85, -0.8, 0.5], // 突刺到位
  [4.9, -0.4, -0.08, 0.1, PI / 2, 0.25, -0.2, 0.2, -0.1, -1.2, -0.1, 0.5, -0.3, 0.25, 1.1, 0.1, 0.4, -0.4, 0.5],
  [6.0, -0.45, -0.06, 0.1, PI / 2, 0.1, 0.25, 0, 0, -0.9, -0.15, 1.1, -0.5, 0.2, 1.0, 0.9, 0.3, -0.3, 0.4],       // 横戈于胸
  [8.05, -0.95, -0.06, 0.1, PI / 2, 0.02, 0.3, 0, 0, -0.95, -0.15, 1.15, -0.5, 0.2, 1.0, 1.0, 0.25, -0.35, 0.4],  // 三击之间被震退（震退量另加）
  [8.45, -1.0, -0.12, 0.1, PI / 2, 0.2, -0.7, 0.5, 0, 0.2, -0.3, 1.2, -1.35, 0.1, 1.25, 0.6, 0.35, -0.4, 0.0],    // 收戈，盾往前一横
  [8.85, -0.95, -0.16, 0.1, PI / 2, 0.25, -1.0, 0.7, 0, 0.3, -0.3, 1.2, -1.4, 0.3, 1.2, 0.6, 0.4, -0.45, -0.3],   // 蓄势
  [9.3, -0.6, -0.1, 0.15, PI / 2, 0.15, 1.1, -0.7, 0, 0.1, -0.4, 0.9, -1.35, -0.5, 0.7, 0.4, -0.3, 0.5, 0.6],     // 横扫
  [10.0, -0.55, -0.06, 0.15, PI / 2, 0.08, 0.8, -0.5, 0, 0.0, -0.3, 0.9, -1.2, -0.3, 0.8, 0.5, -0.2, 0.4, 0.5],
  [10.7, -1.3, -0.03, 0.1, PI / 2, 0.03, 0.25, 0, 0, -0.5, -0.15, 1.1, -0.6, 0.2, 1.0, 0.8, 0.2, -0.25, 0.35],    // 收戈撤盾，退开
  [11.0, -1.3, -0.03, 0.1, PI / 2, 0.03, 0.25, 0, 0, -0.5, -0.15, 1.1, -0.6, 0.2, 1.0, 0.8, 0.2, -0.25, 0.35],
];
const KZ = [   // 嬴政：右边。先面朝河水（yaw = π），再转身（3π/2 = 脸朝 −X）。左手短刃
  [0.0, 2.1, 0, -0.5, PI, 0.0, 0, 0, 0.02, 0.05, -0.08, 0.15, 0.05, 0.08, 0.15, -1.3, 0, 0, 0],
  [1.5, 2.1, 0, -0.5, PI, 0.0, 0, 0, 0.02, 0.05, -0.08, 0.15, 0.05, 0.08, 0.15, -1.3, 0, 0, 0],
  [2.3, 2.1, 0, -0.5, PI, 0.0, 0.15, 0.95, 0.0, 0.05, -0.08, 0.15, 0.05, 0.08, 0.15, -1.3, 0, 0, 0],             // 侧过头
  [2.9, 2.1, 0, -0.5, PI, 0.0, 0.15, 0.95, 0.0, 0.05, -0.08, 0.15, 0.05, 0.08, 0.15, -1.3, 0, 0, 0],
  [3.6, 2.05, -0.07, -0.4, PI * 1.5, 0.06, -0.35, 0.3, 0, -0.3, -0.2, 0.9, -0.15, 0.25, 1.0, 0.2, 0.25, -0.25, 0], // 转身，起手
  [4.25, 2.05, -0.08, -0.4, PI * 1.5, 0.06, -0.35, 0.3, 0, -0.3, -0.2, 0.9, -0.15, 0.25, 1.0, 0.2, 0.25, -0.25, 0],
  [4.85, 3.0, -0.1, 0.45, PI * 1.5, -0.12, -0.6, 0.55, 0, 0.3, -0.5, 0.5, -0.2, 0.5, 0.9, 0.3, -0.35, 0.3, 0],    // 侧身滑步
  [5.6, 3.0, -0.06, 0.45, PI * 1.5, -0.03, -0.5, 0.45, 0, 0.2, -0.3, 0.6, -0.1, 0.3, 1.3, 0.9, -0.2, 0.2, 0],     // 刃收到腰间
  [6.0, 3.0, -0.04, 0.45, PI * 1.5, 0.05, 0.25, -0.2, 0, 0.25, -0.35, 0.5, -1.45, 0.25, 0.12, 0.25, 0.2, -0.25, 0], // 指尖一振：刃尖前指
  [8.1, 3.0, -0.04, 0.45, PI * 1.5, 0.05, 0.25, -0.2, 0, 0.25, -0.35, 0.5, -1.4, 0.25, 0.15, 0.2, 0.2, -0.25, 0],
  [9.0, 3.05, -0.08, 0.45, PI * 1.5, 0.08, -0.3, 0.25, 0, -0.2, -0.25, 0.9, -0.5, 0.3, 1.1, 0.5, 0.25, -0.25, 0],  // 收势，再起手
  [10.0, 3.05, -0.08, 0.45, PI * 1.5, 0.08, -0.3, 0.25, 0, -0.2, -0.25, 0.9, -0.5, 0.3, 1.1, 0.5, 0.25, -0.25, 0],
  [10.7, 2.9, -0.02, 0.4, PI * 1.5, 0.0, -0.1, 0.1, 0, 0.05, -0.1, 0.25, 0.0, 0.15, 0.35, -0.9, 0.1, -0.1, 0],       // 收了剑势
  [11.0, 2.9, -0.02, 0.4, PI * 1.5, 0.0, -0.1, 0.1, 0, 0.05, -0.1, 0.25, 0.0, 0.15, 0.35, -0.9, 0.1, -0.1, 0],
];
const poseM = C.rail(early(KM)), poseZ = C.rail(early(KZ));
/* 镜头：从前景芦苇丛里升起来 → 跟着突刺推进 → 绕到嬴政身侧看剑影 → 三击 → 拉开 */
const camP = C.rail(early([[0, -3.6, 1.25, 8.6], [1.6, -2.2, 1.45, 7.8], [3.4, -0.3, 1.75, 6.9], [4.4, 0.6, 1.2, 4.3], [5.6, 2.6, 1.35, 4.5], [6.6, 3.7, 1.5, 4.4], [7.4, 1.6, 1.25, 5.2], [8.2, 1.2, 1.2, 4.9], [9.2, -0.2, 1.25, 4.3], [10, 0.4, 1.35, 5.0], [11, 0.85, 1.3, 6.3]]));
const camL = C.rail(early([[0, 0, 1.2, -1], [3.4, -0.2, 1.05, 0], [4.4, 0.6, 1.0, 0], [5.6, 1.6, 1.15, 0], [6.6, 0.8, 1.35, 0.2], [7.4, 1.1, 1.15, 0], [8.2, 1.0, 1.1, 0], [9.2, -0.2, 1.05, 0.1], [10, 0.6, 1.05, 0], [11, 0.85, 1.05, 0]]));
const camF = C.rail(early([[0, 36], [3.4, 40], [4.4, 46], [5.6, 40], [7, 40], [8.3, 38], [10, 40], [11, 36]]));

const HOOK = '公元前 247 年 · {渭水}之畔';
const SUBS = [
  { a: 1.3, b: 2.8, zh: '蒙恬：怎么，你{不敢}？' },
  { a: 5.0, b: 5.9, zh: '三道{剑影}，自他身前飞射而出' },
  { a: 8.9, b: 9.95, zh: '数十回合，{不分胜负}' },
];

let S = null;
function build() {
  THREE = window.THREE;
  const g3 = K.three(W, H), cine = C.create(g3, FAST ? { scale: 0.6, samples: 0 } : { samples: 4 });
  g3.renderer.shadowMap.enabled = true; g3.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), fx = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 2000);
  const world = QM.buildWorld(THREE, scene, cine);
  const M = QM.buildFighter(THREE, 'meng'), Z = QM.buildFighter(THREE, 'zheng'); scene.add(M.root, Z.root);
  /* 把两个人摆到 t 时刻（特效要取以前时刻的兵刃位置，所以单独拎出来）*/
  const poseAt = (t) => { const pm = poseM(t), pz = poseZ(t);
    for (const h of HITS) { const e = C.env(t, h, 0.03, 0.18); pm[0] -= 0.1 * e; pm[4] -= 0.14 * e; pm[10] += 0.25 * e; }      // 每一击：人往后一震、戈被压回
    pm[1] += 0.012 * Math.sin(t * 2.4); pz[1] += 0.008 * Math.sin(t * 2.0 + 1);                                                 // 呼吸
    M.apply(pm); Z.apply(pz); };
  const F = QM.buildFx(THREE, scene, fx, cine, { T, M, Z, world, poseAt });
  return { g3, cine, scene, fx, cam, world, M, Z, F, poseAt };
}

function shot(fr, t) {
  if (fr.collecting) {
    for (const [a, n, p] of [[T.LUNGE, 'whoosh', { dur: .45 }], [T.CAST, 'ping', { pitch: 1.4 }], [T.L1, 'whoosh', { dur: .4 }], [T.H1, 'hit'], [T.H2, 'hit'], [T.H3, 'hit'], [T.SWEEP, 'whoosh', { dur: .5 }]]) if (t >= a && t < a + 0.04) fr.sfx(a, n, p || {});
    return;
  }
  S = S || build(); const { g3, cine, scene, fx, cam, world, M, Z, F, poseAt } = S;
  const hits = HITS, hit = Math.max(...hits.map(h => C.env(t, h, 0.02, 0.22))), big = C.env(t, T.H3, 0.02, 0.5);
  poseAt(t);
  Z.bladeM.emissiveIntensity = 2.5 * ss(t, T.CAST - 0.35, T.CAST) * (1 - ss(t, T.H3, T.H3 + 0.8)) + 0.15;
  /* 镜头 */
  const cp = camP(t), cl = camL(t), [sx, sy] = C.shake(t, hit * 0.03 + C.env(t, T.LUNGE + 0.3, 0.05, 0.2) * 0.015);
  cam.fov = camF(t)[0]; cam.updateProjectionMatrix(); cam.position.set(cp[0] + sx, cp[1] + sy, cp[2]); cam.lookAt(cl[0], cl[1], cl[2]); cam.updateMatrixWorld(true);
  world.update(cam);
  const hitAt = F.update(t, cam);
  cine.render(scene, PLAIN ? null : fx, cam, {
    t, plain: PLAIN,
    fog: { color: [0.10, 0.085, 0.17], sunColor: [0.85, 0.36, 0.13], sunDir: world.SUN, sunPower: 7, density: 0.01, height: 0.0, falloff: 0.3, haze: 0.0022, max: 0.8, sky: 0 },
    bloom: { strength: 0.32 + 0.22 * hit, threshold: 1.5, knee: 0.6 },
    shafts: { dir: world.SUN, skyOnly: true, strength: 0.3, threshold: 2.6, length: 0.5, decay: 0.94, color: [1.0, 0.72, 0.42] },
    grade: { exposure: 1.05, contrast: 1.12, saturation: 1.15, shadows: [0.0, 0.012, 0.035], highlights: [0.035, 0.015, 0.0], vignette: 0.42, grain: 0.03,
      fringe: 0.003 + 0.011 * hit, lens: 0.8 * Math.max(...hits.map(h => C.env(t, h, 0.02, 0.07))), lensAt: hitAt, white: 0.05 * C.env(t, T.H3, 0.02, 0.08), fade: ss(t, 0, 0.3) * 0.25 + 0.75 },
  });
  fr.x.drawImage(g3.canvas, 0, 0); fr.look.bloom = 0; fr.look.grain = 0;
  /* 上下各压一条暗边：电影感，也让钩子行和字幕在亮天、亮沙上读得清 */
  const x = fr.x; let g = x.createLinearGradient(0, 0, 0, 190); g.addColorStop(0, 'rgba(8,5,12,.62)'); g.addColorStop(1, 'rgba(8,5,12,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 190);
  g = x.createLinearGradient(0, H - 300, 0, H); g.addColorStop(0, 'rgba(8,5,12,0)'); g.addColorStop(1, 'rgba(8,5,12,.66)'); x.fillStyle = g; x.fillRect(0, H - 300, W, 300);
  const hk = 1 - ss(t, 1.0, 1.5); if (hk > 0) { g = x.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, 620); g.addColorStop(0, `rgba(8,5,12,${0.5 * hk})`); g.addColorStop(1, 'rgba(8,5,12,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }   // 片名后面垫一团暗
}

VK.film({
  dur: T.end, theme: 'gilt',
  meta: { title: '一死酬知己，此身寄长城 · 样片', drone: 0.4, music: { bpm: B.bpm, key: -3, sections: [[0, 2], [2, 3], [8, 1]], drop: [T.H1] } },
  draw(fr, t) {
    shot(fr, t);
    if (fr.collecting) return;
    K.headline(fr, t, '一死酬知己', { a1: 1.5, cy: H * 0.4, size: 150 });
    K.hookBar(fr, t, HOOK, { style: 'gilt' });
    K.subs(fr, t, SUBS, 'gilt');
  },
});
})();
