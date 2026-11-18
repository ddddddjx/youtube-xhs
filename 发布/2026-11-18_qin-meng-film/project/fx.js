/* 招式特效（自己设计的，不照任何游戏的技能画面）：
 *   嬴政「三影」：短刃一振，三道青色剑影在身侧成形，一道接一道射出
 *   蒙恬「突刺」「盾扫」：戈尖和盾沿拖出金色的弧
 *   每一击：一团白光、一圈气浪、四溅的火星、脚下的扬尘；气浪推倒远处的芦苇
 * 全部是 t 的函数：粒子的位置由「出生时刻 + 初速」直接算，拖尾靠把人物摆回前几帧的姿势取点。 */
(function () {
'use strict';
const QM = window.QM = window.QM || {};
QM.buildFx = function (THREE, scene, fx, cine, ctx) {
  const { T, M, Z, world, poseAt } = ctx, C = VKCine, V3 = THREE.Vector3;
  const PRE = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true, fog: false, toneMapped: false };
  const U = cine.fxU, SOFT = cine.GLSL_SOFT, NOISE = cine.GLSL_NOISE, r = QM.rng(77);
  const HT = [T.H1, T.H2, T.H3], LT = [T.L1, T.L1 + 0.5, T.L1 + 1.0];

  /* 三击的落点：把蒙恬摆到那一刻的姿势，取戈柲中段 */
  const HP = HT.map(h => { poseAt(h - 0.001); return M.mid.getWorldPosition(new V3()); });
  /* 剑影成形的位置：嬴政身侧，扇形 */
  poseAt(T.CAST + 0.3); const zr = Z.root.getWorldPosition(new V3());
  const HOV = [new V3(zr.x - 0.5, zr.y + 0.45, zr.z + 0.62), new V3(zr.x - 0.35, zr.y + 1.0, zr.z + 0.05), new V3(zr.x - 0.5, zr.y + 0.5, zr.z - 0.6)];

  /* ---- 剑影：实心的刃（进主场景，自己发光）+ 一条拖尾（进特效层）---- */
  const bs = new THREE.Shape(); bs.moveTo(-0.04, 0); bs.lineTo(-0.028, 0.72); bs.lineTo(0, 0.95); bs.lineTo(0.028, 0.72); bs.lineTo(0.04, 0); bs.lineTo(0, -0.1); bs.closePath();
  const bg = new THREE.ExtrudeGeometry(bs, { depth: 0.012, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 }); bg.translate(0, -0.45, -0.006); bg.rotateX(Math.PI / 2);
  const tg = new THREE.BufferGeometry(); { const p = [], uv = [], ix = []; for (let k = 0; k < 2; k++) { const b = k * 4; for (const [u, v] of [[0, -1], [0, 1], [1, -1], [1, 1]]) { p.push(k ? 0 : v * 0.16, k ? v * 0.16 : 0, 0.5 - u * 3.2); uv.push(u, v); } ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    tg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); tg.setIndex(ix); }
  const blades = [0, 1, 2].map(i => {
    const m = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 2.4, 2.9), transparent: true, opacity: 1 })); scene.add(m);
    const tu = { ...U, uK: { value: 0 }, uLen: { value: 0.2 } };
    const tr = new THREE.Mesh(tg, new THREE.ShaderMaterial({ ...PRE, side: THREE.DoubleSide, uniforms: tu,
      vertexShader: `uniform float uLen; varying vec2 vUv; varying float vZ; void main(){ vUv = uv; vec3 p = position; p.z = 0.5 - (0.5 - p.z) * uLen; vec4 mv = modelViewMatrix * vec4(p, 1.0); vZ = mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `${SOFT} ${NOISE} uniform float uK, uTime; varying vec2 vUv; varying float vZ;
        void main(){ float a = (1.0 - vUv.x) * (1.0 - vUv.x) * exp(-vUv.y * vUv.y * 9.0) * (0.6 + 0.4 * cN(vec2(vUv.x * 9.0 - uTime * 14.0, vUv.y * 3.0))) * softZ(vZ, 0.4) * uK;
          gl_FragColor = vec4(vec3(0.15, 1.0, 1.3) * a * 2.2, 0.0); }` }));
    tr.frustumCulled = false; fx.add(tr); return { m, tr, tu };
  });

  /* ---- 火星 ---- */
  const NS = 90, sp = [], sa = []; for (let h = 0; h < 3; h++) for (let i = 0; i < NS; i++) { const th = r() * 6.283, ph = Math.acos(r() * 2 - 1), v = 1.5 + r() * r() * 7; sp.push(Math.sin(ph) * Math.cos(th) * v - 1.2, Math.cos(ph) * v + 1.0, Math.sin(ph) * Math.sin(th) * v); sa.push(h, r(), r(), r()); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.Float32BufferAttribute(sa, 4));
  const SU = { ...U, uHP: { value: HP }, uHT: { value: HT }, uPx: { value: cine.size[1] } };
  const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({ ...PRE, uniforms: SU,
    vertexShader: `attribute vec4 aS; uniform vec3 uHP[3]; uniform float uHT[3]; uniform float uTime, uPx; varying float vA, vC; varying float vZ;
      void main(){ int h = int(aS.x + 0.5); float age = uTime - uHT[h], life = 0.45 + 0.75 * aS.y; vA = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); if (age < 0.0 || age > life) return;
        vec3 p = uHP[h] + position * (1.0 - exp(-age * 3.5)) / 3.5 + vec3(0.0, -3.2 * age * age, 0.0); p.y = max(p.y, 0.03);
        vec4 mv = viewMatrix * vec4(p, 1.0); vZ = mv.z; gl_Position = projectionMatrix * mv; vA = 1.0 - age / life; vC = aS.z;
        gl_PointSize = max(1.5, (0.012 + 0.03 * aS.w) * vA * uPx * projectionMatrix[1][1] / -mv.z * 0.5); }`,
    fragmentShader: `${SOFT} varying float vA, vC, vZ; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.1, d) * vA * softZ(vZ, 0.2);
      vec3 c = mix(vec3(3.0, 1.9, 0.6), vec3(0.6, 2.6, 3.0), step(0.62, vC)); gl_FragColor = vec4(c * a * 2.0, 0.0); }` }));
  sparks.frustumCulled = false; fx.add(sparks);

  /* ---- 一击的白光和气浪环（对着镜头的两片）---- */
  const disc = new THREE.PlaneGeometry(1, 1);
  const hitFx = HT.map(() => { const u = { ...U, uK: { value: 0 }, uR: { value: 0 } };
    const m = new THREE.Mesh(disc, new THREE.ShaderMaterial({ ...PRE, uniforms: u,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `${NOISE} uniform float uK, uR, uTime; varying vec2 vUv;
        void main(){ float d = length(vUv), an = atan(vUv.y, vUv.x);
          float core = exp(-d * d * 90.0) * 2.4 + exp(-d * 9.0) * 0.3;                                                  // 白光
          float star = pow(abs(cos(an * 2.0 + 0.6)), 60.0) * exp(-d * 4.0) * 1.1;                                       // 十字芒
          float ring = exp(-pow((d - uR) * 26.0, 2.0)) * (0.6 + 0.4 * cN(vec2(an * 5.0, uTime * 3.0))) * (1.0 - uR);    // 气浪
          vec3 c = (vec3(1.0, 0.95, 0.85) * (core + star) + vec3(0.5, 0.95, 1.1) * ring * 1.6) * uK; gl_FragColor = vec4(c, 0.0); }` }));
    m.frustumCulled = false; fx.add(m); return { m, u }; });

  /* ---- 扬尘：几处地面事件，每处一捧软团 ---- */
  const DE = [[T.WIND + 0.3, -2.6, 0.05, -1, 1.0], [T.LUNGE + 0.3, -0.6, 0.1, 1, 1.3], [T.DODGE + 0.15, 2.2, -0.3, 1, 0.8], [T.DODGE + 0.5, 3.0, 0.45, 1, 0.9], [T.H1, -0.6, 0.1, -1, 0.5], [T.H2, -0.7, 0.1, -1, 0.5], [T.H3, -0.85, 0.1, -1, 0.9], [T.SWEEP + 0.2, -0.8, 0.15, 1, 1.4]];
  const ND = 26, dp = [], da = []; for (let e = 0; e < DE.length; e++) for (let i = 0; i < ND; i++) { dp.push((r() - 0.3) * 1.6 * DE[e][3], 0.15 + r() * 0.8, (r() - 0.5) * 1.4); da.push(e, r(), r(), r()); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aS', new THREE.Float32BufferAttribute(da, 4));
  const DU = { ...U, uE: { value: DE.map(e => new THREE.Vector4(e[1], e[2], e[0], e[4])) }, uPx: { value: cine.size[1] }, uSun: { value: world.SUN } };
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ ...PRE, uniforms: DU,
    vertexShader: `attribute vec4 aS; uniform vec4 uE[${DE.length}]; uniform float uTime, uPx; varying float vA, vS, vZ;
      void main(){ vec4 e = uE[int(aS.x + 0.5)]; float age = uTime - e.z, life = 1.1 + 0.9 * aS.y; vA = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); if (age < 0.0 || age > life) return;
        float k = 1.0 - exp(-age * 3.0); vec3 p = vec3(e.x, 0.04, e.y) + position * k * e.w * vec3(1.0, 0.75, 1.0) + vec3(-0.35 * age, 0.0, 0.0);
        vec4 mv = viewMatrix * vec4(p, 1.0); vZ = mv.z; gl_Position = projectionMatrix * mv; vA = smoothstep(0.0, 0.08, age) * pow(1.0 - age / life, 1.5) * e.w; vS = aS.z * 31.0;
        gl_PointSize = clamp((0.25 + 0.55 * k) * (0.6 + 0.8 * aS.w) * e.w * uPx * projectionMatrix[1][1] / -mv.z * 0.5, 2.0, 240.0); }`,
    fragmentShader: `${SOFT} ${NOISE} varying float vA, vS, vZ; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q) * 2.0;
      float a = smoothstep(1.0, 0.15, d + (0.5 - cF(gl_PointCoord * 2.5 + vS)) * 0.9) * vA * 0.24 * softZ(vZ, 0.35);
      gl_FragColor = vec4(vec3(1.05, 0.62, 0.30) * a, a * 0.55); }` }));
  dust.frustumCulled = false; fx.add(dust);

  /* ---- 兵刃拖尾：把人摆回前 N 个时刻，取两个点连成一条带子 ---- */
  const NT = 12, DT = 0.016;
  const mkTrail = (col) => { const g = new THREE.BufferGeometry(), pos = new Float32Array((NT + 1) * 6), uv = new Float32Array((NT + 1) * 4), ix = [];
    for (let k = 0; k <= NT; k++) { uv[k * 4] = k / NT; uv[k * 4 + 1] = 0; uv[k * 4 + 2] = k / NT; uv[k * 4 + 3] = 1; if (k < NT) { const a = k * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(ix);
    const u = { ...U, uK: { value: 0 }, uCol: { value: new THREE.Color(col[0], col[1], col[2]) } };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ ...PRE, side: THREE.DoubleSide, uniforms: u,
      vertexShader: `varying vec2 vUv; varying float vZ; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `${SOFT} uniform float uK; uniform vec3 uCol; varying vec2 vUv; varying float vZ;
        void main(){ float e = sin(vUv.y * 3.1416); float a = (1.0 - vUv.x) * (1.0 - vUv.x) * (0.35 * e + 1.2 * pow(vUv.y, 6.0)) * uK * softZ(vZ, 0.25); gl_FragColor = vec4(uCol * a, 0.0); }` }));
    m.frustumCulled = false; fx.add(m); return { g, pos, u }; };
  const trGe = mkTrail([3.2, 1.9, 0.55]), trSh = mkTrail([3.0, 2.0, 0.8]);
  const a = new V3(), b = new V3();
  const fillTrail = (tr, t, oa, ob, k) => { tr.u.uK.value = k; if (k <= 0.001) return;
    for (let i = 0; i <= NT; i++) { poseAt(t - i * DT); oa.getWorldPosition(a); ob.getWorldPosition(b); tr.pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); }
    tr.g.attributes.position.needsUpdate = true; };

  /* ---- 一盏点光：剑影的青光、撞击的白光都算在它头上 ---- */
  const lamp = new THREE.PointLight(0x66eeff, 0, 9, 2); scene.add(lamp);
  /* 芦苇的气浪 */
  world.setShock(0, -1.6, 0.1, T.LUNGE + 0.15, 0.55); HT.forEach((h, i) => world.setShock(1 + i, HP[i].x, HP[i].z, h, [0.5, 0.6, 1.0][i])); world.setShock(4, -0.8, 0.2, T.SWEEP + 0.25, 1.1);

  const p = new V3(), q = new V3(), lastHit = new V3().copy(HP[0]);
  function update(t, cam) {
    /* 拖尾先算（会把人物摆到别的时刻），最后把人物摆回 t */
    const thrust = C.env(t, T.LUNGE + 0.02, 0.1, 0.22) * (t < T.LUNGE + 0.9 ? 1 : 0), sweep = VK.ss(t, T.SWEEP - 0.05, T.SWEEP + 0.12) * (1 - VK.ss(t, T.SWEEP + 0.42, T.SWEEP + 0.75));
    fillTrail(trGe, t, M.mid, M.tip, Math.max(thrust * 1.3, sweep * 0.5)); fillTrail(trSh, t, M.shBot, M.shTop, sweep * 1.5);
    poseAt(t);
    let lp = 0, lx = 0, ly = 0, lz = 0, lc = 0;
    blades.forEach((bl, i) => {
      const born = T.CAST + i * 0.11, on = t >= born - 0.02 && t < HT[i];
      bl.m.visible = on; bl.tu.uK.value = 0; if (!on) return;
      const grow = VK.ss(t, born, born + 0.28), fly = VK.clamp((t - LT[i]) / (HT[i] - LT[i])), f = fly * fly * fly;
      Z.tip.getWorldPosition(q); p.copy(q).lerp(HOV[i], grow * grow * (3 - 2 * grow)); p.y += 0.035 * Math.sin(t * 5 + i * 2) * (1 - fly); p.lerp(HP[i], f);
      bl.m.position.copy(p); bl.m.lookAt(HP[i]); bl.m.rotateZ(t * 2.5 * (1 - fly) + i); bl.m.scale.setScalar(0.25 + 0.75 * grow); bl.m.material.opacity = 0.55 + 0.45 * grow;
      bl.tr.position.copy(p); bl.tr.quaternion.copy(bl.m.quaternion); bl.tu.uK.value = grow * (0.35 + 1.4 * fly); bl.tu.uLen.value = 0.25 + 1.0 * fly * fly;
      lx += p.x; ly += p.y; lz += p.z; lc++; lp += 14 * grow;
    });
    hitFx.forEach((h, i) => { const age = t - HT[i]; h.m.visible = age >= 0 && age < 0.7; if (!h.m.visible) return;
      h.m.position.copy(HP[i]); h.m.quaternion.copy(cam.quaternion); h.m.scale.setScalar(i === 2 ? 4.2 : 3.0); h.u.uR.value = 1 - Math.exp(-age * 5.5); h.u.uK.value = Math.exp(-age * 8) * (i === 2 ? 1.2 : 0.85); lastHit.copy(HP[i]); });
    const flash = Math.max(...HT.map(h => C.env(t, h, 0.015, 0.1)));
    if (flash > 0.02) { const i = t >= HT[2] ? 2 : t >= HT[1] ? 1 : 0; lamp.position.copy(HP[i]); lamp.color.setRGB(1, 0.95, 0.85); lamp.intensity = 22 * flash; }
    else if (lc) { lamp.position.set(lx / lc, ly / lc, lz / lc); lamp.color.setRGB(0.35, 0.95, 1.0); lamp.intensity = lp / lc * 0.6; }
    else lamp.intensity = 0;
    return lastHit;
  }
  return { update, HP };
};
})();
