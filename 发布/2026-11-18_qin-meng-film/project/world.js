/* 渭水岸边的世界：暮色天空（带云）、河面、河滩、远山、芦苇。全部代码生成，没有贴图文件。
 * 坐标：+X 向右，+Y 向上，镜头在 +Z 一侧朝 −Z 看；河在 z < −3，太阳在河对岸偏右，人物逆光。
 * 每样东西的运动都只读 uTime（片内秒），可以任意跳帧。 */
(function () {
'use strict';
const QM = window.QM = window.QM || {};

/* CPU 上的值噪声（摆地形、种芦苇用） */
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const n2 = (x, y) => { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
  return (h2(i, j) * (1 - a) + h2(i + 1, j) * a) * (1 - b) + (h2(i, j + 1) * (1 - a) + h2(i + 1, j + 1) * a) * b; };
const fbm = (x, y) => n2(x, y) * .5 + n2(x * 2.03 + 9, y * 2.03 + 4) * .25 + n2(x * 4.1 + 3, y * 4.1 + 7) * .125 + n2(x * 8.2, y * 8.2) * .0625;
QM.n2 = n2; QM.fbm = fbm;
const rng = seed => () => { let z = (seed += 0x6D2B79F5); z = Math.imul(z ^ (z >>> 15), z | 1); z ^= z + Math.imul(z ^ (z >>> 7), z | 61); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };
QM.rng = rng;

/* 河滩高度：水边低，往岸上缓缓抬起，决斗的那块地压平 */
function groundY(x, z) {
  const rise = Math.min(1, Math.max(0, (z + 3.4) / 3.2)), flat = Math.exp(-(x * x / 30 + z * z / 6));
  return -0.32 + rise * rise * (3 - 2 * rise) * 0.36 + (fbm(x * .35, z * .35) - .45) * .22 * (1 - flat * .85) * rise + Math.max(0, z - 5) * .02;
}
QM.groundY = groundY;

const GLSL_NOISE = `
float wH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float wN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wH(i), wH(i + vec2(1, 0)), f.x), mix(wH(i + vec2(0, 1)), wH(i + vec2(1, 1)), f.x), f.y); }
float wF(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * wN(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float wF3(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * wN(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }`;
/* 天空：地平线橙金 → 中天玫紫 → 天顶深蓝；太阳的光晕；一层被夕阳从下面照亮的云 */
const GLSL_SKY = `uniform vec3 uSun; uniform float uTime;
vec3 skyBase(vec3 d){ float h = clamp(d.y, 0.0, 1.0);
  vec3 c = mix(vec3(1.15, 0.50, 0.16), vec3(0.40, 0.17, 0.24), smoothstep(0.0, 0.17, h)); c = mix(c, vec3(0.025, 0.045, 0.16), smoothstep(0.09, 0.55, h));
  float s = max(dot(d, uSun), 0.0); c += vec3(1.4, 0.62, 0.2) * pow(s, 10.0) * 0.5 + vec3(3.0, 1.5, 0.5) * pow(s, 140.0);
  return c; }
vec3 skyCloud(vec3 d, vec3 c, float oct){ if (d.y < 0.015) return c;
  vec2 uv = d.xz / (d.y + 0.16) * 0.55 + vec2(uTime * 0.012, uTime * 0.004);
  float n = oct > 3.5 ? wF(uv) : wF3(uv); float dens = smoothstep(0.44, 0.72, n);
  vec2 ts = normalize(uSun.xz) * 0.22; float n2 = oct > 3.5 ? wF(uv + ts) : wF3(uv + ts);
  float lit = clamp(0.5 + (n - n2) * 4.0, 0.0, 1.0);                                   // 朝太阳那一侧更薄 → 更亮
  float s = max(dot(d, uSun), 0.0);
  vec3 cc = mix(vec3(0.07, 0.055, 0.12), vec3(1.9, 0.75, 0.28) * (0.25 + 0.75 * pow(s, 3.0)) + vec3(0.32, 0.13, 0.18), lit);
  return mix(c, cc, dens * smoothstep(0.015, 0.14, d.y) * 0.92); }`;
QM.GLSL_NOISE = GLSL_NOISE; QM.GLSL_SKY = GLSL_SKY;

QM.buildWorld = function (THREE, scene, cine) {
  const SUN = new THREE.Vector3(0.34, 0.15, -1).normalize(), U = { uSun: { value: SUN }, uTime: cine.fxU.uTime, uCam: { value: new THREE.Vector3() } };
  const W = { SUN, U };

  /* ---- 天空 ---- */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `${GLSL_NOISE} ${GLSL_SKY} varying vec3 vD;
      void main(){ vec3 d = normalize(vD); vec3 c = skyBase(d); c = skyCloud(d, c, 5.0);
        float s = max(dot(d, uSun), 0.0); c += vec3(34.0, 19.0, 7.0) * smoothstep(0.9994, 0.9998, s);                     // 日面
        c = mix(c, vec3(0.5, 0.3, 0.3), smoothstep(0.0, -0.08, d.y)); gl_FragColor = vec4(c, 1.0); }` }));
  sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

  /* ---- 河面：流动的法线噪声 + 菲涅尔反射天空 + 太阳的碎金 + 岸边一线白沫 ---- */
  const river = new THREE.Mesh(new THREE.PlaneGeometry(1400, 500), new THREE.ShaderMaterial({ fog: false, uniforms: U,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${GLSL_NOISE} ${GLSL_SKY} uniform vec3 uCam; varying vec3 vW;
      float hgt(vec2 p){ return wF3(p * vec2(0.30, 1.1) + vec2(uTime * 0.55, uTime * 0.05)) * 0.65 + wN(p * vec2(1.3, 4.2) + vec2(uTime * 1.5, -uTime * 0.2)) * 0.22; }
      void main(){ vec2 p = vW.xz; float dist = length(vW - uCam), e = 0.12 + dist * 0.004;
        vec3 n = normalize(vec3(hgt(p - vec2(e, 0)) - hgt(p + vec2(e, 0)), 2.0 * e * (1.4 + dist * 0.05), hgt(p - vec2(0, e)) - hgt(p + vec2(0, e))));
        vec3 v = normalize(uCam - vW), r = reflect(-v, n); r.y = abs(r.y) + 0.02; r = normalize(r);
        float fres = 0.05 + 0.95 * pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 sk = skyCloud(r, skyBase(r), 3.0);
        vec3 c = mix(vec3(0.015, 0.035, 0.05), sk, fres);
        float gl = pow(max(dot(r, uSun), 0.0), 700.0); c += vec3(16.0, 8.0, 2.6) * gl * (0.35 + 0.65 * wN(p * 6.0 + uTime * 2.0));    // 碎金
        float shore = smoothstep(1.3, 0.0, -3.05 - vW.z + (wN(p * vec2(1.6, 3.0) + vec2(uTime * 0.6, 0.0)) - 0.5) * 0.9);
        c = mix(c, vec3(0.75, 0.55, 0.45), shore * 0.5 * wN(p * 9.0 + vec2(uTime * 1.2, 0.0)));
        gl_FragColor = vec4(c, 1.0); }` }));
  river.rotation.x = -Math.PI / 2; river.position.set(0, -0.2, -252.9); scene.add(river);

  /* ---- 河滩 ---- */
  { const g = new THREE.PlaneGeometry(90, 24, 220, 60); g.rotateX(-Math.PI / 2); g.translate(0, 0, 8);
    const P = g.attributes.position, C = new Float32Array(P.count * 3), wet = VKSdf.lin(0x2b2620), sand = VKSdf.lin(0x8c7450), grass = VKSdf.lin(0x4c5326);
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), y = groundY(x, z); P.setY(i, y);
      const k = Math.min(1, Math.max(0, (z + 3.3) / 2.2)), gk = Math.min(1, Math.max(0, (fbm(x * .5 + 30, z * .5) - .46) * 6)) * Math.min(1, Math.max(0, (z + .5) / 3)) * (1 - Math.exp(-(x * x / 20 + z * z / 5)));
      const sp = .82 + .36 * n2(x * 6, z * 6);
      for (let c = 0; c < 3; c++) C[i * 3 + c] = ((wet[c] * (1 - k) + sand[c] * k) * (1 - gk) + grass[c] * gk) * sp; }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, metalness: 0 })); m.receiveShadow = true; scene.add(m); }

  /* ---- 远山和对岸：几层剪影，靠后期的霾拉开远近 ---- */
  const ridge = (z, base, amp, freq, color, seed) => { const N = 240, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const x = -700 + 1400 * i / N, hh = base + amp * (fbm(x * freq + seed, seed * 3.1) * 1.5 - .35) + amp * .3 * Math.max(0, 1 - Math.abs(n2(x * freq * 3 + seed, 1.7) - .5) * 4);
      pos.push(x, -2, z, x, Math.max(0.2, hh), z); if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color }))); };
  ridge(-420, 30, 70, .006, new THREE.Color(0.10, 0.07, 0.13), 5); ridge(-300, 16, 46, .009, new THREE.Color(0.065, 0.045, 0.09), 21);
  ridge(-200, 6, 24, .014, new THREE.Color(0.04, 0.03, 0.06), 43); ridge(-110, 1.2, 5, .06, new THREE.Color(0.02, 0.02, 0.03), 77);

  /* ---- 芦苇：一根 = 一条细长的带子 + 顶上的穗。实例化，顶点着色器里摆位、迎风倒、被兵刃的气浪推开 ---- */
  const SEG = 7, bp = [], bi = [];
  for (let s = 0; s <= SEG; s++) { bp.push(s / SEG, -1, s / SEG, 1); if (s < SEG) { const a = s * 2; bi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const rg = new THREE.InstancedBufferGeometry(); rg.setAttribute('aQ', new THREE.Float32BufferAttribute(bp, 2)); rg.setIndex(bi);
  const inst = [], r = rng(20261118);
  const plant = (n, fx) => { for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) { const p = fx(); if (!p) continue; inst.push(p[0], groundY(p[0], p[1]) - 0.03, p[1], p[2], r() * 6.283, r(), r(), r()); i++; } };
  /* 前景一带（镜头从里面升起来）：中间矮、两边高；镜头最后停的地方（z < 4.9）不种 */
  plant(3000, () => { const x = (r() * 2 - 1) * 16, z = 5.1 + r() * r() * 6.5; if (fbm(x * .4, z * .4) < .36 || (Math.abs(x + 1) < 5.5 && r() < .62)) return null; return [x, z, (Math.abs(x) < 3.5 ? 0.85 : 1.25) + r() * (Math.abs(x) < 3.5 ? 0.55 : 1.0)]; });
  /* 两侧 */
  plant(2600, () => { const sgn = r() < .5 ? -1 : 1, x = sgn * (5.2 + r() * 13), z = -2.9 + r() * 8; if (fbm(x * .3 + 7, z * .3) < .40) return null; return [x, z, 1.3 + r() * 1.1]; });
  /* 水边一线：人物身后稀一点，别把剪影搅乱 */
  plant(1500, () => { const x = (r() * 2 - 1) * 22, z = -3.25 + r() * 1.2; if (Math.abs(x) < 5 && r() < .72) return null; return [x, z, 0.9 + r() * 1.0]; });
  const ia = new THREE.InstancedInterleavedBuffer(new Float32Array(inst), 8);
  rg.setAttribute('aP', new THREE.InterleavedBufferAttribute(ia, 4, 0)); rg.setAttribute('aR', new THREE.InterleavedBufferAttribute(ia, 4, 4)); rg.instanceCount = inst.length / 8;
  const RU = { ...U, uShock: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, -99, 0)) } };
  const reeds = new THREE.Mesh(rg, new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: false, uniforms: RU,
    vertexShader: `attribute vec2 aQ; attribute vec4 aP, aR; uniform float uTime; uniform vec4 uShock[6]; varying float vT, vSeed; varying vec3 vW; varying float vSide;
      void main(){ float tt = aQ.x, side = aQ.y, hgt = aP.w; vT = tt; vSeed = aR.y; vSide = side;
        float plume = smoothstep(0.72, 0.86, tt) * smoothstep(1.0, 0.9, tt);
        float wd = mix(0.009, 0.002, tt) + plume * (0.013 + 0.012 * aR.z);
        vec3 base = aP.xyz; float c = cos(aR.x), s = sin(aR.x);
        /* 风从右往左吹过河滩；一道道阵风是斜着扫过来的波 */
        float gust = 0.5 + 0.5 * sin(base.x * 0.22 - base.z * 0.13 + uTime * 1.25 + sin(base.z * 0.4) * 0.8);
        float sway = sin(uTime * (1.6 + aR.y) + aR.z * 6.283 + base.x * 0.7) * 0.05 + sin(uTime * 4.3 + aR.w * 20.0) * 0.012;
        vec2 bend = vec2(-(0.10 + 0.34 * gust * gust) - sway, sway * 0.6 + (aR.w - 0.5) * 0.16);
        /* 气浪：一圈往外走的壳，壳到了就被推倒，再弹回来晃几下 */
        for (int i = 0; i < 6; i++) { vec4 sh = uShock[i]; float age = uTime - sh.z; if (age < 0.0 || age > 4.0 || sh.w <= 0.0) continue;
          vec2 dv = base.xz - sh.xy; float dd = length(dv), a2 = age - dd / 16.0; if (a2 < 0.0) continue;
          bend += normalize(dv + 1e-4) * sh.w * exp(-a2 * 2.2) * cos(a2 * 9.0) / (1.0 + dd * dd * 0.06); }
        float k = tt * tt;
        vec3 p = base + vec3(c, 0.0, s) * side * wd + vec3(bend.x, 0.0, bend.y) * k * hgt * 0.55;
        p.y += tt * hgt * (1.0 - 0.18 * dot(bend, bend) * k);
        vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uSun, uCam; varying float vT, vSeed, vSide; varying vec3 vW;
      void main(){ float plume = smoothstep(0.72, 0.86, vT);
        vec3 stem = mix(vec3(0.10, 0.12, 0.045), vec3(0.42, 0.36, 0.16), smoothstep(0.1, 0.8, vT)) * (0.75 + 0.5 * vSeed);
        vec3 col = mix(stem, vec3(0.50, 0.40, 0.28), plume);
        vec3 v = normalize(vW - uCam); float back = pow(max(dot(v, uSun), 0.0), 2.5);
        float fuzz = plume * (1.0 - abs(vSide) * 0.75);
        col = col * (0.16 + 0.34 * vT) + col * vec3(1.0, 0.62, 0.30) * back * (0.9 + 2.2 * fuzz) + vec3(0.05, 0.07, 0.12) * (1.0 - vT) * 0.4;   // 逆光：穗子透亮
        gl_FragColor = vec4(col, 1.0); }` }));
  reeds.frustumCulled = false; scene.add(reeds); W.reedU = RU;

  /* ---- 灯光：太阳在身后压着地平线（勾边 + 长影），天光补蓝，镜头这边一点冷的补光让脸能看见 ---- */
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.58, 0.26), 5.5); sun.position.copy(SUN).multiplyScalar(40); sun.target.position.set(0, 0.6, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 6; sc.bottom = -6; sc.near = 5; sc.far = 90; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(new THREE.Color(0.30, 0.36, 0.62), new THREE.Color(0.42, 0.28, 0.2), 1.25));
  const fill = new THREE.DirectionalLight(new THREE.Color(0.55, 0.62, 0.9), 0.85); fill.position.set(-2, 3, 8); scene.add(fill);
  W.sun = sun;

  W.update = (camera) => { U.uCam.value.setFromMatrixPosition(camera.matrixWorld); };
  /* 登记一次气浪：(x, z) 处、t0 时刻、强度（米级的倒伏量） */
  W.setShock = (i, x, z, t0, k) => RU.uShock.value[i].set(x, z, t0, k);
  return W;
};
})();
