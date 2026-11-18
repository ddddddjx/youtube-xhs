/* 两个少年：嬴政（素衣、短刃）和蒙恬（甲、盾、短戈）。
 * 身体用距离场捏（engine/vk-sdf.js）：躯干和下裳是一整块，头、发髻、手臂各一块，挂在一副简单的骨架上。
 * 造型按「战国末年的秦人少年」自己设计，没有照任何游戏的角色原画。
 * 人物局部坐标：脸朝 +Z，右手在 −X。姿势是一组数字（POSE），由 film.js 的关键帧给。 */
(function () {
'use strict';
const QM = window.QM = window.QM || {};
const POSE = ['x', 'y', 'z', 'yaw', 'lean', 'twist', 'hy', 'hp', 'rsx', 'rsz', 're', 'lsx', 'lsz', 'le', 'aim', 'legR', 'legL', 'sh'];
QM.POSE = POSE;

QM.buildFighter = function (THREE, kind) {
  const S = VKSdf, L = S.lin, zheng = kind === 'zheng';
  const skin = L(0xd8a889), hair = L(0x120f0e), mat = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, ...o });
  const part = (geo, m) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; return me; };
  const ang = (x, z) => Math.atan2(z, x);

  /* ---- 躯干 + 下裳（一整块）。原点在胯，肩在 y = 0.40 ---- */
  const hem = zheng ? -0.70 : -0.44;
  const chest = S.ellipsoid([0, 0.29, 0], [0.165, 0.2, 0.108]), waist = S.ellipsoid([0, 0.08, 0], [0.135, 0.15, 0.098]);
  const shoulders = S.capsule([-0.165, 0.395, 0], [0.165, 0.395, 0], 0.066), neck = S.capsule([0, 0.42, 0], [0, 0.52, 0.006], 0.046);
  const skirt0 = S.capsule([0, 0.0, 0], [0, hem - 0.25, 0], 0.15, zheng ? 0.36 : 0.3);   // 伸到下摆以下再切平：下摆是敞开的一圈，不是一个球
  const skirt = S.bump(skirt0, (x, y, z) => { const d = Math.min(1, Math.max(0, -y / 0.5)); return (zheng ? 0.02 : 0.008) * d * Math.sin(ang(x, z) * (zheng ? 9 : 14) + Math.sin(y * 9) * 0.8); });
  let torsoF = S.union(0.05, chest, waist, shoulders, neck, skirt);
  if (!zheng) torsoF = S.union(0.02, torsoF, S.ellipsoid([-0.2, 0.41, 0], [0.085, 0.05, 0.085]), S.ellipsoid([0.2, 0.41, 0], [0.085, 0.05, 0.085]));   // 肩甲
  torsoF = S.sub(0.02, torsoF, S.rbox([0, hem - 0.3, 0], [0.6, 0.3, 0.6], 0));                                                                       // 下摆切平
  const robe = L(0xe6e0d2), band = L(0x1d1b22), sash = L(0x6a1f1b), teal = L(0x1c3436), bronze = L(0x8a6a3a), plate = L(0x3a3026), red = L(0x7a221c);
  const torso = part(S.mesh(torsoF, [-0.36, hem - 0.02, -0.34], [0.36, 0.56, 0.34], 0.0125, THREE, (x, y, z) => {
    if (y > 0.455) return skin;
    if (zheng) {
      const lap = Math.abs(x + (y - 0.2) * 0.42) < 0.022 && z > 0 && y > 0.05 && y < 0.46;                 // 交领右衽
      if (lap || (y > 0.435)) return band; if (y > -0.01 && y < 0.07) return sash;
      if (y < hem + 0.05) return band; const sh = 0.9 + 0.1 * Math.sin(ang(x, z) * 9 + Math.sin(y * 9) * 0.8); return robe.map(c => c * sh);
    }
    if (y > 0.36 && Math.abs(x) > 0.12) { const e = Math.abs(Math.sin(y * 90)) < 0.25; return e ? bronze : plate; }                                 // 肩甲
    if (y > 0.07 && y < 0.40) { const row = Math.floor(y / 0.048), a = ang(x, z) * 9 + (row % 2) * 0.5, edge = (y / 0.048 - row) < 0.14 || (a - Math.floor(a)) < 0.1; return edge ? bronze : plate; }   // 札甲
    if (y > 0.0 && y <= 0.07) return red;
    if (y < 0) { const a = ang(x, z) * 5; return (a - Math.floor(a)) < 0.08 || y < hem + 0.035 ? bronze : (Math.floor(-y / 0.07) % 2 ? plate : plate.map(c => c * 1.5)); }           // 甲裙
    return teal;
  }), mat());

  /* ---- 头。原点在颈顶，脸朝 +Z ---- */
  const skull = S.ellipsoid([0, 0.112, 0.004], [0.087, 0.105, 0.097]), jaw = S.ellipsoid([0, 0.05, 0.02], [0.064, 0.062, 0.07]), nose = S.ellipsoid([0, 0.088, 0.098], [0.013, 0.026, 0.02]);
  const ears = S.union(0, S.ellipsoid([-0.088, 0.1, 0.0], [0.012, 0.026, 0.018]), S.ellipsoid([0.088, 0.1, 0.0], [0.012, 0.026, 0.018]));
  const hairF = S.union(0.02, S.ellipsoid([0, 0.138, -0.02], [0.094, 0.098, 0.1]), S.capsule([0, 0.21, -0.025], [0, 0.25, -0.03], 0.03, 0.042), S.sphere([0, 0.265, -0.032], 0.045),
    zheng ? S.capsule([0, 0.1, -0.09], [0, -0.1, -0.12], 0.05, 0.02) : S.sphere([0, 0.1, -0.08], 0.05));                                              // 嬴政脑后垂一束发
  const pin = S.capsule([-0.085, 0.262, -0.032], [0.085, 0.262, -0.032], 0.008);
  const headF = S.union(0.012, S.union(0.03, skull, jaw), nose, ears, hairF, pin);
  const gold = L(0xc9a04a), white = L(0xe8e2d4), lip = L(0xa6695a), ribbon = zheng ? L(0xe6e0d2) : L(0x8a231c);
  const head = part(S.mesh(headF, [-0.12, -0.14, -0.16], [0.12, 0.33, 0.14], 0.0075, THREE, (x, y, z) => {
    if (pin(x, y, z) < 0.004) return gold;
    if (y > 0.195 && y < 0.225 && hairF(x, y, z) < 0.01) return ribbon;                                         // 束发带
    const face = z > 0.02 - Math.max(0, y - 0.15) * 0.9 && y < 0.178 - Math.abs(x) * 0.25;                       // 发际线
    if (hairF(x, y, z) < 0.008 && !face) return hair;
    const ax = Math.abs(x);
    if (z > 0.06) {
      const ex = (ax - 0.034) / 0.017, ey = (y - 0.118) / 0.0075; if (ex * ex + ey * ey < 1) return (ax - 0.034) * (ax - 0.034) + (y - 0.118) * (y - 0.118) < 0.000055 ? hair : white;   // 眼
      const by = y - (0.137 + (zheng ? 0.004 : -0.002) * (ax - 0.02) / 0.03); if (ax > 0.014 && ax < 0.056 && Math.abs(by) < 0.0042) return hair;                                       // 眉
      if (ax < 0.021 && Math.abs(y - 0.047) < 0.0042) return lip;
    }
    return skin;
  }), mat({ roughness: 0.7 }));

  /* ---- 手臂。上臂原点在肩，垂向 −Y；前臂原点在肘 ---- */
  const upF = S.capsule([0, 0.0, 0], [0, -0.25, 0], 0.056, 0.05);
  const upper = () => part(S.mesh(upF, [-0.08, -0.32, -0.08], [0.08, 0.07, 0.08], 0.0125, THREE, (x, y) => zheng ? robe : (y < -0.2 ? teal : plate)), mat());
  const foreF = zheng ? S.bump(S.capsule([0, 0.02, 0], [0, -0.2, 0], 0.052, 0.1), (x, y, z) => 0.008 * Math.sin(ang(x, z) * 6) * Math.min(1, -y / 0.1))
    : S.union(0.01, S.capsule([0, 0.01, 0], [0, -0.23, 0], 0.048, 0.04), S.capsule([0, -0.07, 0], [0, -0.2, 0], 0.05, 0.046));
  const handF = S.ellipsoid([0, -0.275, 0.005], [0.036, 0.046, 0.04]);
  const fore = () => part(S.mesh(S.union(0.012, foreF, handF), [-0.13, -0.34, -0.13], [0.13, 0.09, 0.13], 0.0125, THREE, (x, y) => {
    if (y < (zheng ? -0.245 : -0.235)) return skin; if (zheng) return y < -0.19 ? band : robe; return y < -0.06 && y > -0.21 ? (Math.abs(Math.sin(y * 70)) < 0.3 ? bronze : plate) : teal; }), mat());
  /* ---- 腿：胯到脚一根，脚尖朝 +Z ---- */
  const legF = S.union(0.03, S.capsule([0, 0, 0], [0, -0.74, 0], 0.07, 0.045), S.ellipsoid([0, -0.775, 0.045], [0.045, 0.04, 0.095]));
  const leg = () => part(S.mesh(legF, [-0.1, -0.84, -0.1], [0.1, 0.06, 0.16], 0.014, THREE, (x, y) => y < -0.56 ? L(0x1a1614) : (zheng ? L(0xbdb6a6) : teal)), mat());

  /* ---- 骨架 ---- */
  const G = () => new THREE.Group();
  const root = G(), body = G(), headG = G(), shR = G(), elR = G(), haR = G(), shL = G(), elL = G(), haL = G(), lgR = G(), lgL = G();
  root.add(body, lgR, lgL); body.add(torso, headG, shR, shL); headG.position.set(0, 0.5, 0.004); headG.add(head);
  shR.position.set(-0.215, 0.395, 0); shL.position.set(0.215, 0.395, 0);
  shR.add(upper(), elR); shL.add(upper(), elL); elR.position.y = elL.position.y = -0.25; elR.add(fore(), haR); elL.add(fore(), haL); haR.position.y = haL.position.y = -0.275;
  lgR.position.set(-0.085, 0, 0); lgL.position.set(0.085, 0, 0); lgR.add(leg()); lgL.add(leg());

  const F = { root, body, headG, haR, haL, elL, kind };
  if (zheng) {
    /* 短刃：握在左手（朝镜头的那只手）。剑身自发青光，casting 时调亮 */
    const sh = new THREE.Shape(); sh.moveTo(-0.021, 0); sh.lineTo(-0.016, 0.34); sh.lineTo(0, 0.42); sh.lineTo(0.016, 0.34); sh.lineTo(0.021, 0); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 }); bg.translate(0, 0.06, -0.004); bg.rotateX(Math.PI / 2);   // 剑尖朝 +Z
    const bladeM = new THREE.MeshStandardMaterial({ color: 0x9fb4b8, roughness: 0.3, metalness: 0.6, emissive: new THREE.Color(0.1, 0.9, 1.0), emissiveIntensity: 0 });
    const blade = part(bg, bladeM), hilt = part(new THREE.CylinderGeometry(0.014, 0.016, 0.13, 10), new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.7 })); hilt.rotation.x = Math.PI / 2;
    const guard = part(new THREE.BoxGeometry(0.075, 0.016, 0.02), new THREE.MeshStandardMaterial({ color: 0xb08a3c, roughness: 0.4, metalness: 0.5 })); guard.position.z = 0.065;
    const wp = G(); wp.add(blade, hilt, guard); haL.add(wp); F.weapon = wp; F.bladeM = bladeM; F.tip = new THREE.Object3D(); F.tip.position.z = 0.45; wp.add(F.tip);
  } else {
    /* 短戈：木柲 + 青铜戈头（横出的援和下垂的胡），握在右手 */
    const shaft = part(new THREE.CylinderGeometry(0.014, 0.016, 1.05, 10), new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.75 })); shaft.rotation.x = Math.PI / 2; shaft.position.z = 0.22;
    /* 戈头：援（横出的窄刃，略上翘）+ 胡（贴着柲往回的一段）+ 内（穿过柲的短尾） */
    const gs = new THREE.Shape(); gs.moveTo(-0.07, -0.014); gs.lineTo(0.0, -0.022); gs.lineTo(0.17, -0.016); gs.lineTo(0.27, 0.014); gs.lineTo(0.17, 0.03); gs.lineTo(0.0, 0.028); gs.lineTo(-0.07, 0.022); gs.closePath();
    const gg = new THREE.ExtrudeGeometry(gs, { depth: 0.01, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 });
    gg.translate(0, 0, -0.005); gg.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));   // 援横出（+Y），厚度在 X
    const geM = new THREE.MeshStandardMaterial({ color: 0xc9a25a, roughness: 0.32, metalness: 0.55, emissive: new THREE.Color(1.0, 0.6, 0.15), emissiveIntensity: 0.05 });
    const ge = part(gg, geM); ge.position.set(0, 0.0, 0.7);
    const hu = part(new THREE.BoxGeometry(0.01, 0.034, 0.17), geM); hu.position.set(0, 0.03, 0.6);
    const cap = part(new THREE.SphereGeometry(0.022, 10, 8), geM); cap.position.z = -0.31;
    const wp = G(); wp.add(shaft, ge, hu, cap); haR.add(wp); F.weapon = wp; F.geM = geM; F.tip = new THREE.Object3D(); F.tip.position.set(0, 0.26, 0.715); wp.add(F.tip); F.mid = new THREE.Object3D(); F.mid.position.z = 0.42; wp.add(F.mid);
    /* 盾：挂在左前臂。圆角长盾，中间一个铜泡，边上一圈铜箍 */
    const shF = S.union(0.01, S.rbox([0, 0, 0], [0.2, 0.3, 0.014], 0.014), S.ellipsoid([0, 0.02, 0.02], [0.07, 0.07, 0.035]));
    const shield = part(S.mesh(S.bump(shF, (x, y, z) => -x * x * 0.35), [-0.24, -0.34, -0.09], [0.24, 0.34, 0.08], 0.011, THREE, (x, y, z) => {
      const rim = Math.max(Math.abs(x) / 0.2, Math.abs(y) / 0.3) > 0.9, boss = x * x + (y - 0.02) * (y - 0.02) < 0.0056, bar = Math.abs(Math.abs(y - 0.02) - 0.17) < 0.012 || (Math.abs(x) < 0.012 && Math.abs(y - 0.02) > 0.08);
      return rim || boss || bar ? L(0xb8923f) : (z < 0 ? L(0x2a1c14) : L(0x5c1a15)); }), mat({ roughness: 0.5, metalness: 0.25 }));
    const sg = G(); sg.add(shield); sg.position.set(0.06, -0.14, 0); elL.add(sg); F.shield = sg;
    F.shTop = new THREE.Object3D(); F.shTop.position.set(0, 0.3, 0.03); F.shBot = new THREE.Object3D(); F.shBot.position.set(0, -0.3, 0.03); sg.add(F.shTop, F.shBot);
  }

  /* 摆姿势。p 是按 POSE 顺序的一组数（弧度 / 米） */
  F.apply = (a) => { const p = {}; POSE.forEach((k, i) => p[k] = a[i]);
    root.position.set(p.x, 0.83 + p.y + QM.groundY(p.x, p.z), p.z); root.rotation.set(0, p.yaw, 0);
    body.rotation.set(p.lean, p.twist, 0, 'YXZ'); headG.rotation.set(p.hp, p.hy, 0, 'YXZ');
    shR.rotation.set(p.rsx, 0, p.rsz); elR.rotation.set(-p.re, 0, 0); shL.rotation.set(p.lsx, 0, p.lsz); elL.rotation.set(-p.le, 0, 0);
    lgR.rotation.x = p.legR; lgL.rotation.x = p.legL;
    if (zheng) { F.weapon.rotation.set(-p.aim - p.lsx + p.le - p.lean, 0, 0); }
    else { F.weapon.rotation.set(-p.aim - p.rsx + p.re - p.lean, 0, 0); F.shield.rotation.set(-p.lsx + p.le - p.lean, p.sh, 0, 'YXZ'); }
    root.updateMatrixWorld(true); };
  return F;
};
})();
