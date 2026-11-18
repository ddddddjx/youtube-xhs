/* vk-cine.js — Three.js 场景的「电影感后期包」（Krypto说AI，11-18）
 *
 * 给 K.three() 的 3D 画面加一条后期链，全部手写、只依赖 three 本体：
 *   HDR 场景（半浮点 + 深度）→ 高度雾 / 大气霾 → 柔边特效层（雾团、尘埃、光锥）→ 4 级辉光 → 穿雾光柱 → 调色（曝光、ACES、分离色调、暗角、色差、颗粒）
 * 另带三样时间工具：节拍表 beats、镜头轨 rail、打击包络 env。
 * 每一帧只由传进来的 t 决定，不记上一帧，可以任意跳帧、逐帧导出。
 *
 * 用法（film.js 里）：
 *   const g3 = K.three(W, H), cine = VKCine.create(g3);          // 只建一次
 *   const scene = new THREE.Scene(), fx = new THREE.Scene();      // fx 里只放 cine.motes / cine.mist / cine.beam 这类柔边东西
 *   ... 按 t 摆好物体和相机 ...
 *   cine.render(scene, fx, camera, { t, fog: {...}, bloom: {...}, shafts: {...}, grade: {...} });
 *   fr.x.drawImage(g3.canvas, 0, 0); fr.look.bloom = 0; fr.look.grain = 0;   // 2D 层自己的辉光和颗粒关掉，免得叠两遍
 * 参数表见 references/cine.md。
 */
(function (G) {
'use strict';

/* ---------- 时间工具（不依赖 three）---------- */
/* 节拍表：beats(120).at(小节, 拍) → 秒。小节和拍都从 1 数；画面事件和 meta.music 的 drop 用同一张表 */
function beats(bpm = 120, t0 = 0, perBar = 4) {
  const beat = 60 / bpm, bar = beat * perBar;
  const at = (b, k = 1) => +(t0 + (b - 1) * bar + (k - 1) * beat).toFixed(4);
  return { bpm, beat, bar, at, sheet: o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? at(v[0], v[1]) : at(v)])), barOf: t => Math.floor((t - t0) / bar) + 1, phase: t => (((t - t0) / beat) % 1 + 1) % 1 };
}
/* 镜头轨：keys = [[t, x, y, z, ...], ...]，单调三次插值（两个关键帧之间不会回摆、不会停顿）。返回 f(t) → 数组 */
function rail(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), dim = keys[0].length - 1, ms = [];
  for (let c = 0; c < dim; c++) {
    const ys = keys.map(k => k[c + 1]), d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0] || 0; m[n - 1] = d[n - 2] || 0;
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
    ms.push([ys, m]);
  }
  return t => {
    if (t <= xs[0]) return keys[0].slice(1); if (t >= xs[n - 1]) return keys[n - 1].slice(1);
    let i = 0; while (t > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (t - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return ms.map(([ys, m]) => (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1]);
  };
}
/* 打击包络：t0 起 att 秒冲到 1，再按 dec 秒指数衰减。闪光、震动、辉光加码都乘它 */
const env = (t, t0, att = 0.04, dec = 0.5) => t < t0 ? 0 : t < t0 + att ? (t - t0) / att : Math.exp(-(t - t0 - att) / dec);
/* 震动：包络 k 下的确定性抖动（返回 [dx, dy]，单位随意） */
const shake = (t, k, f = 23) => [Math.sin(t * f * 6.283 + 1.3) * Math.sin(t * f * 2.71), Math.sin(t * f * 5.1 + 0.4) * Math.cos(t * f * 3.3)].map(v => v * k);

/* 确定性随机数（mulberry32）：相邻几个数之间没有相关性，粒子不会排成线 */
const rng = seed => () => { let z = (seed += 0x6D2B79F5); z = Math.imul(z ^ (z >>> 15), z | 1); z ^= z + Math.imul(z ^ (z >>> 7), z | 61); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };

/* ---------- GLSL 片段 ---------- */
const VS = 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const NOISE = `
float cH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float cN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(cH(i), cH(i + vec2(1, 0)), f.x), mix(cH(i + vec2(0, 1)), cH(i + vec2(1, 1)), f.x), f.y); }
float cF(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * cN(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }`;
/* 特效层的材质共用：对着场景深度手动做柔边（特效层本身没有深度缓冲） */
const SOFT = `uniform sampler2D tDepth; uniform float uNear, uFar; uniform vec2 uRes;
float sceneZ(){ float d = texture2D(tDepth, gl_FragCoord.xy / uRes).x; return (uNear * uFar) / ((uFar - uNear) * d - uFar); }
float softZ(float myViewZ, float soft){ return clamp((myViewZ - sceneZ()) / soft, 0.0, 1.0); }`;

function create(g3, opts = {}) {
  const T = g3.THREE, R = g3.renderer;
  const w = g3.canvas.width, h = g3.canvas.height, sc = opts.scale || 1, W = Math.round(w * sc), H = Math.round(h * sc);
  R.toneMapping = T.NoToneMapping; R.autoClear = true;
  const HF = { type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false, stencilBuffer: false };
  const rtMain = new T.WebGLRenderTarget(W, H, { ...HF, depthBuffer: true, samples: opts.samples == null ? 4 : opts.samples });
  rtMain.depthTexture = new T.DepthTexture(W, H); rtMain.depthTexture.minFilter = rtMain.depthTexture.magFilter = T.NearestFilter;
  const rtFog = new T.WebGLRenderTarget(W, H, HF);
  const bl = []; for (let i = 0, bw = W >> 1, bh = H >> 1; i < 4; i++, bw >>= 1, bh >>= 1) bl.push([new T.WebGLRenderTarget(bw, bh, HF), new T.WebGLRenderTarget(bw, bh, HF)]);
  const rtG = [new T.WebGLRenderTarget(W >> 2, H >> 2, HF), new T.WebGLRenderTarget(W >> 2, H >> 2, HF)];

  const tri = new T.BufferGeometry(); tri.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const quad = new T.Mesh(tri, null); quad.frustumCulled = false; const qs = new T.Scene(); qs.add(quad); const qc = new T.Camera();
  const mk = (fs, uniforms) => new T.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const pass = (m, target) => { quad.material = m; R.setRenderTarget(target); R.render(qs, qc); };
  const V2 = (x = 0, y = 0) => ({ value: new T.Vector2(x, y) }), V3 = () => ({ value: new T.Vector3() }), F = v => ({ value: v }), TX = () => ({ value: null });

  /* 特效层共用的 uniform */
  const fxU = { tDepth: { value: rtMain.depthTexture }, uNear: F(0.1), uFar: F(1000), uRes: V2(W, H), uTime: F(0) };

  /* 1 雾：从深度还原世界坐标；高度雾沿视线解析积分 + 均匀大气霾；朝光的方向染成光的颜色 */
  const mFog = mk(`uniform sampler2D tColor, tDepth; uniform mat4 uPI, uVI; uniform vec3 uCam, uFogCol, uSunCol, uSunDir;
    uniform float uDens, uH0, uFall, uHaze, uSunK, uMax, uSky; varying vec2 vUv;
    void main(){ vec3 col = texture2D(tColor, vUv).rgb; float d = texture2D(tDepth, vUv).x;
      vec4 v = uPI * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); v /= v.w; vec3 ray = (uVI * v).xyz - uCam; float L = length(ray); vec3 dir = ray / L;
      if (d >= 0.99999) { L = uSky; ray = dir * L; }
      float k = uFall * ray.y, f = abs(k) > 1e-4 ? (1.0 - exp(-k)) / k : 1.0;
      float opt = uDens * exp(-(uCam.y - uH0) * uFall) * L * f + uHaze * L;
      float tr = max(exp(-opt), 1.0 - uMax);
      vec3 ins = mix(uFogCol, uSunCol, pow(max(dot(dir, uSunDir), 0.0), uSunK));
      gl_FragColor = vec4(col * tr + ins * (1.0 - tr), 1.0); }`,
    { tColor: { value: rtMain.texture }, tDepth: fxU.tDepth, uPI: { value: new T.Matrix4() }, uVI: { value: new T.Matrix4() }, uCam: V3(), uFogCol: { value: new T.Color() }, uSunCol: { value: new T.Color() }, uSunDir: V3(),
      uDens: F(0), uH0: F(0), uFall: F(0.1), uHaze: F(0), uSunK: F(8), uMax: F(1), uSky: F(200) });

  /* 2 辉光：软阈值提亮部 → 逐级缩小 + 9 抽头高斯（线性采样 5 次）*/
  const mBright = mk(`uniform sampler2D tColor; uniform float uTh, uKnee; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tColor, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float s = clamp(l - uTh + uKnee, 0.0, 2.0 * uKnee); s = s * s / (4.0 * uKnee + 1e-4);
      gl_FragColor = vec4(min(c * max(s, l - uTh) / max(l, 1e-4), vec3(24.0)), 1.0); }`, { tColor: TX(), uTh: F(1), uKnee: F(0.5) });
  const mBlur = mk(`uniform sampler2D tColor; uniform vec2 uDir; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tColor, vUv).rgb * 0.2270270270;
      c += (texture2D(tColor, vUv + uDir * 1.3846153846).rgb + texture2D(tColor, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
      c += (texture2D(tColor, vUv + uDir * 3.2307692308).rgb + texture2D(tColor, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
      gl_FragColor = vec4(c, 1.0); }`, { tColor: TX(), uDir: V2() });

  /* 3 光柱：亮部（可选只取天空）朝光源的屏幕位置做两遍径向模糊，1/4 分辨率 */
  const mGMask = mk(`uniform sampler2D tColor, tDepth; uniform float uTh, uSkyOnly; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tColor, vUv).rgb; float m = mix(1.0, step(0.99999, texture2D(tDepth, vUv).x), uSkyOnly);
      gl_FragColor = vec4(max(c - uTh, 0.0) * m, 1.0); }`, { tColor: TX(), tDepth: fxU.tDepth, uTh: F(1), uSkyOnly: F(0) });
  const mGod = mk(`uniform sampler2D tColor; uniform vec2 uC; uniform float uLen, uDecay; varying vec2 vUv;
    void main(){ vec2 d = (uC - vUv) * uLen / 12.0; vec2 p = vUv; vec3 s = vec3(0.0); float wgt = 1.0, tot = 0.0;
      for (int i = 0; i < 12; i++) { s += texture2D(tColor, p).rgb * wgt; tot += wgt; wgt *= uDecay; p += d; }
      gl_FragColor = vec4(s / tot, 1.0); }`, { tColor: TX(), uC: V2(), uLen: F(0.5), uDecay: F(0.92) });

  /* 4 调色 */
  const mFinal = mk(`uniform sampler2D tColor, tB0, tB1, tB2, tB3, tGod; uniform vec4 uBW; uniform vec3 uGodCol, uShadow, uHigh, uTint;
    uniform float uBloom, uGod, uExp, uCon, uSat, uVig, uFringe, uGrain, uFrame, uFade, uWhite, uAsp, uLens; uniform vec2 uLensC; varying vec2 vUv;
    ${NOISE}
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    void main(){ vec2 uv = vUv, dc = uv - 0.5;
      if (uLens > 0.0) { vec2 q = (uv - uLensC) * vec2(uAsp, 1.0); float r = length(q); uv -= normalize(q + 1e-5) / vec2(uAsp, 1.0) * uLens * exp(-r * r * 30.0) * 0.06; }   // 冲击：画面从一点向外鼓一下
      vec3 c; float fr = uFringe * dot(dc, dc) * 4.0;
      if (fr > 1e-5) { c.r = texture2D(tColor, uv + dc * fr).r; c.g = texture2D(tColor, uv).g; c.b = texture2D(tColor, uv - dc * fr).b; } else c = texture2D(tColor, uv).rgb;
      vec3 b = texture2D(tB0, uv).rgb * uBW.x + texture2D(tB1, uv).rgb * uBW.y + texture2D(tB2, uv).rgb * uBW.z + texture2D(tB3, uv).rgb * uBW.w;
      c += b * uBloom + texture2D(tGod, uv).rgb * uGodCol * uGod;
      c = aces(c * uExp * uTint);
      c = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));       // 线性 → sRGB
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat); c = (c - 0.5) * uCon + 0.5;
      c += uShadow * (1.0 - l) * (1.0 - l) + uHigh * l * l;                                    // 分离色调：暗部和亮部各偏一个颜色
      float vg = length(dc * vec2(mix(1.0, uAsp, 0.5), 1.0)); c *= 1.0 - uVig * smoothstep(0.35, 0.95, vg);
      c += (cH(gl_FragCoord.xy + uFrame * 17.0) - 0.5) * uGrain;
      c = mix(c * uFade, vec3(1.0), uWhite);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }`,
    { tColor: { value: rtFog.texture }, tB0: { value: bl[0][0].texture }, tB1: { value: bl[1][0].texture }, tB2: { value: bl[2][0].texture }, tB3: { value: bl[3][0].texture }, tGod: { value: rtG[0].texture },
      uBW: { value: new T.Vector4(0.4, 0.3, 0.2, 0.1) }, uGodCol: { value: new T.Color(1, 1, 1) }, uShadow: { value: new T.Color(0, 0, 0) }, uHigh: { value: new T.Color(0, 0, 0) }, uTint: { value: new T.Color(1, 1, 1) },
      uBloom: F(0), uGod: F(0), uExp: F(1), uCon: F(1), uSat: F(1), uVig: F(0), uFringe: F(0), uGrain: F(0), uFrame: F(0), uFade: F(1), uWhite: F(0), uAsp: F(W / H), uLens: F(0), uLensC: V2(0.5, 0.5) });

  const col = (u, v) => { if (v == null) return; if (v.isColor) u.value.copy(v); else if (Array.isArray(v)) u.value.setRGB(v[0], v[1], v[2]); else u.value.set(v); };
  const tmp = new T.Vector3(), tmp4 = new T.Vector4();

  /* look：见 references/cine.md。plain: true 时跳过全部后期（做前后对比用） */
  function render(scene, fx, camera, look = {}) {
    const t = look.t || 0; fxU.uTime.value = t; fxU.uNear.value = camera.near; fxU.uFar.value = camera.far;
    camera.updateMatrixWorld(true);
    if (look.plain) { R.toneMapping = T.ACESFilmicToneMapping; R.setRenderTarget(null); R.render(scene, camera); R.toneMapping = T.NoToneMapping; return; }
    R.setRenderTarget(rtMain); R.render(scene, camera);

    const fg = look.fog || {}, u = mFog.uniforms;
    u.uPI.value.copy(camera.projectionMatrixInverse); u.uVI.value.copy(camera.matrixWorld); u.uCam.value.setFromMatrixPosition(camera.matrixWorld);
    col(u.uFogCol, fg.color || 0x8090a8); col(u.uSunCol, fg.sunColor || fg.color || 0x8090a8);
    if (fg.sunDir) u.uSunDir.value.copy(fg.sunDir).normalize(); else u.uSunDir.value.set(0, 1, 0);
    u.uDens.value = fg.density || 0; u.uH0.value = fg.height || 0; u.uFall.value = fg.falloff == null ? 0.15 : fg.falloff; u.uHaze.value = fg.haze || 0;
    u.uSunK.value = fg.sunPower || 8; u.uMax.value = fg.max == null ? 1 : fg.max; u.uSky.value = fg.sky == null ? camera.far * 0.5 : fg.sky;
    pass(mFog, rtFog);

    if (fx && fx.children.length) { const ac = R.autoClear; R.autoClear = false; R.setRenderTarget(rtFog); R.render(fx, camera); R.autoClear = ac; }

    const bm = look.bloom || {}, bs = bm.strength == null ? 0.6 : bm.strength;
    if (bs > 0) {
      mBright.uniforms.tColor.value = rtFog.texture; mBright.uniforms.uTh.value = bm.threshold == null ? 1 : bm.threshold; mBright.uniforms.uKnee.value = bm.knee == null ? 0.5 : bm.knee;
      pass(mBright, bl[0][1]);
      for (let i = 0; i < 4; i++) {
        const [a, b] = bl[i], src = i ? bl[i - 1][0] : b;
        mBlur.uniforms.tColor.value = src.texture; mBlur.uniforms.uDir.value.set(1 / a.width, 0); pass(mBlur, i ? b : a);
        mBlur.uniforms.tColor.value = (i ? b : a).texture; mBlur.uniforms.uDir.value.set(0, 1 / a.height); pass(mBlur, i ? a : b);
        if (!i) { mBlur.uniforms.tColor.value = b.texture; mBlur.uniforms.uDir.value.set(0, 0); pass(mBlur, a); }   // 第 0 级多倒一次，让结果都落在 [0]
      }
    }
    const sh = look.shafts || {}; let gk = 0;
    if (sh.strength > 0 && (sh.pos || sh.dir)) {
      if (sh.pos) tmp.copy(sh.pos); else tmp.copy(sh.dir).normalize().multiplyScalar(camera.far * 0.9).add(u.uCam.value);
      tmp4.set(tmp.x, tmp.y, tmp.z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
      if (tmp4.w > 0) {
        const sx = tmp4.x / tmp4.w * 0.5 + 0.5, sy = tmp4.y / tmp4.w * 0.5 + 0.5, off = Math.max(0, Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)) - 0.5);
        gk = sh.strength * Math.max(0, 1 - off * 1.5);                                         // 光源出画越远，光柱越淡
        if (gk > 0) {
          mGMask.uniforms.tColor.value = rtFog.texture; mGMask.uniforms.uTh.value = sh.threshold == null ? 0.8 : sh.threshold; mGMask.uniforms.uSkyOnly.value = sh.skyOnly ? 1 : 0; pass(mGMask, rtG[1]);
          mGod.uniforms.uC.value.set(sx, sy); mGod.uniforms.uDecay.value = sh.decay == null ? 0.93 : sh.decay;
          mGod.uniforms.tColor.value = rtG[1].texture; mGod.uniforms.uLen.value = sh.length == null ? 0.6 : sh.length; pass(mGod, rtG[0]);
          mGod.uniforms.tColor.value = rtG[0].texture; mGod.uniforms.uLen.value = (sh.length == null ? 0.6 : sh.length) / 12; pass(mGod, rtG[1]);
          mGod.uniforms.tColor.value = rtG[1].texture; mGod.uniforms.uLen.value = (sh.length == null ? 0.6 : sh.length) / 144; pass(mGod, rtG[0]);
        }
      }
    }
    const g = look.grade || {}, f = mFinal.uniforms;
    f.uBloom.value = bs; if (bm.weights) f.uBW.value.fromArray(bm.weights);
    f.uGod.value = gk; col(f.uGodCol, sh.color || 0xffffff);
    f.uExp.value = g.exposure == null ? 1 : g.exposure; f.uCon.value = g.contrast == null ? 1 : g.contrast; f.uSat.value = g.saturation == null ? 1 : g.saturation;
    col(f.uShadow, g.shadows || 0x000000); col(f.uHigh, g.highlights || 0x000000); col(f.uTint, g.tint || 0xffffff);
    f.uVig.value = g.vignette || 0; f.uFringe.value = g.fringe || 0; f.uGrain.value = g.grain || 0; f.uFrame.value = Math.round(t * 30) % 251;
    f.uFade.value = g.fade == null ? 1 : g.fade; f.uWhite.value = g.white || 0;
    f.uLens.value = g.lens || 0; if (g.lensAt) { tmp4.set(g.lensAt.x, g.lensAt.y, g.lensAt.z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix); f.uLensC.value.set(tmp4.x / tmp4.w * 0.5 + 0.5, tmp4.y / tmp4.w * 0.5 + 0.5); } else f.uLensC.value.set(0.5, 0.5);
    pass(mFinal, null);
  }

  /* ---------- 柔边特效件：都放进 fx 场景，位置全是 uTime 的函数 ---------- */
  const PRE = { blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, blendEquation: T.AddEquation, depthTest: false, depthWrite: false, transparent: true, fog: false, toneMapped: false };
  /* 聚光灯参数（尘埃只在光里发亮）：pos, dir（Vector3），cos = [外沿, 内沿] 的余弦，range 米 */
  const spotU = () => ({ uLPos: V3(), uLDir: { value: new T.Vector3(0, -1, 0) }, uLCos: V2(0.8, 0.95), uLRange: F(20), uLCol: { value: new T.Color(1, 1, 1) }, uLK: F(0) });
  const SPOT = `uniform vec3 uLPos, uLDir, uLCol; uniform vec2 uLCos; uniform float uLRange, uLK;
    vec3 spotAt(vec3 wp){ vec3 d = wp - uLPos; float L = length(d); float c = dot(d / max(L, 1e-4), uLDir);
      return uLCol * uLK * smoothstep(uLCos.x, uLCos.y, c) * clamp(1.0 - L / uLRange, 0.0, 1.0) / (1.0 + 0.06 * L * L); }`;

  /* 尘埃：box = [cx, cy, cz, sx, sy, sz]。在盒子里循环飘，进了聚光灯才亮 */
  function motes(o = {}) {
    const n = o.count || 600, b = o.box || [0, 2, 0, 10, 4, 10], geo = new T.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n * 4);
    const rnd = rng(o.seed || 7);
    for (let i = 0; i < n; i++) { p[i * 3] = rnd(); p[i * 3 + 1] = rnd(); p[i * 3 + 2] = rnd(); s[i * 4] = rnd(); s[i * 4 + 1] = rnd(); s[i * 4 + 2] = rnd(); s[i * 4 + 3] = rnd(); }
    geo.setAttribute('position', new T.BufferAttribute(p, 3)); geo.setAttribute('aS', new T.BufferAttribute(s, 4));
    const U = { ...fxU, ...spotU(), uC: { value: new T.Vector3(b[0], b[1], b[2]) }, uB: { value: new T.Vector3(b[3], b[4], b[5]) }, uWind: { value: new T.Vector3(...(o.wind || [0.05, -0.02, 0.02])) },
      uSize: F(o.size || 0.03), uCol: { value: new T.Color(o.color == null ? 0xfff2d8 : o.color) }, uAmb: F(o.ambient || 0), uK: F(1), uPx: F(H) };
    const m = new T.ShaderMaterial({ ...PRE, uniforms: U,
      vertexShader: `attribute vec4 aS; uniform vec3 uC, uB, uWind; uniform float uTime, uSize, uPx; varying vec3 vW; varying float vZ, vTw;
        void main(){ vec3 q = fract(position + uWind * uTime / uB * (0.5 + aS.x) + 0.02 * vec3(sin(uTime * (0.3 + aS.y) + aS.z * 6.28), cos(uTime * (0.25 + aS.z) + aS.x * 6.28), sin(uTime * (0.2 + aS.w) + aS.y * 6.28)));
          vec3 wp = uC + (q - 0.5) * uB; vW = wp; vec4 mv = viewMatrix * vec4(wp, 1.0); vZ = mv.z; gl_Position = projectionMatrix * mv;
          vTw = 0.55 + 0.45 * sin(uTime * (1.5 + aS.w * 3.0) + aS.x * 40.0);
          gl_PointSize = max(1.5, uSize * (0.5 + aS.y) * uPx * projectionMatrix[1][1] / -mv.z * 0.5); }`,
      fragmentShader: `${SOFT} ${SPOT} uniform vec3 uCol; uniform float uAmb, uK; varying vec3 vW; varying float vZ, vTw;
        void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.05, length(d)) * softZ(vZ, 0.3) * smoothstep(-0.15, -0.6, vZ);
          vec3 c = uCol * (uAmb + spotAt(vW)) * vTw * uK; gl_FragColor = vec4(c * a, 0.0); }` });
    const pts = new T.Points(geo, m); pts.frustumCulled = false; pts.userData.U = U; return pts;
  }

  /* 雾团：一群对着镜头的软片，沿风循环飘，边缘用噪声撕开。光打到的地方染上光色 */
  function mist(o = {}) {
    const n = o.count || 40, b = o.box || [0, 1, 0, 20, 2, 20], geo = new T.InstancedBufferGeometry(), base = new T.PlaneGeometry(1, 1);
    geo.index = base.index; geo.setAttribute('position', base.getAttribute('position')); geo.setAttribute('uv', base.getAttribute('uv'));
    const p = new Float32Array(n * 3), s = new Float32Array(n * 4); const rnd = rng(o.seed || 11);
    for (let i = 0; i < n; i++) { p[i * 3] = rnd(); p[i * 3 + 1] = rnd(); p[i * 3 + 2] = rnd(); s[i * 4] = rnd(); s[i * 4 + 1] = rnd(); s[i * 4 + 2] = rnd(); s[i * 4 + 3] = rnd(); }
    geo.setAttribute('aP', new T.InstancedBufferAttribute(p, 3)); geo.setAttribute('aS', new T.InstancedBufferAttribute(s, 4)); geo.instanceCount = n;
    const U = { ...fxU, ...spotU(), uC: { value: new T.Vector3(b[0], b[1], b[2]) }, uB: { value: new T.Vector3(b[3], b[4], b[5]) }, uWind: { value: new T.Vector3(...(o.wind || [0.3, 0, 0.05])) },
      uSize: F(o.size || 4), uCol: { value: new T.Color(o.color == null ? 0x9aa6b8 : o.color) }, uAmb: F(o.ambient == null ? 1 : o.ambient), uK: F(o.opacity == null ? 0.25 : o.opacity), uSoft: F(o.soft || 1.2), uCover: F(o.cover == null ? 0.5 : o.cover) };
    const m = new T.ShaderMaterial({ ...PRE, uniforms: U,
      vertexShader: `attribute vec3 aP; attribute vec4 aS; uniform vec3 uC, uB, uWind; uniform float uTime, uSize; varying vec2 vUv; varying vec3 vW; varying float vZ, vSeed, vEdge;
        void main(){ vec3 q = fract(aP + uWind * uTime / uB * (0.6 + 0.8 * aS.x)); vec3 e = smoothstep(0.0, 0.15, q) * smoothstep(1.0, 0.85, q); vEdge = e.x * e.z;
          vec3 wp = uC + (q - 0.5) * uB; vW = wp; vec4 mv = viewMatrix * vec4(wp, 1.0); float sz = uSize * (0.6 + 0.9 * aS.y);
          mv.xy += position.xy * sz * vec2(1.0 + aS.z, 0.6 + 0.4 * aS.w); vZ = mv.z; vUv = uv; vSeed = aS.x * 31.0; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `${SOFT} ${SPOT} ${NOISE} uniform vec3 uCol; uniform float uAmb, uK, uSoft, uTime, uCover; varying vec2 vUv; varying vec3 vW; varying float vZ, vSeed, vEdge;
        void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0; float n = cF(vUv * 3.0 + vSeed + vec2(uTime * 0.05, 0.0));
          float a = smoothstep(1.0, 0.2, r + (0.5 - n) * 0.9) * uK * vEdge * softZ(vZ, uSoft) * smoothstep(-0.3, -2.0, vZ);
          vec3 c = uCol * uAmb + spotAt(vW) * 0.6; gl_FragColor = vec4(c * a, a * uCover); }` });
    const mesh = new T.Mesh(geo, m); mesh.frustumCulled = false; mesh.userData.U = U; return mesh;
  }

  /* 光锥：尖在原点、沿 +Z 张开（mesh.position 放在灯上，mesh.lookAt(目标)）。加法，侧面看边缘虚掉，里面有慢慢流动的条纹 */
  function beam(o = {}) {
    const len = o.length || 8, ang = o.angle || 0.3, geo = new T.ConeGeometry(Math.tan(ang) * len, len, 48, 1, true);
    geo.translate(0, -len / 2, 0); geo.rotateX(-Math.PI / 2);                               // 尖在原点，朝 +Z
    const U = { ...fxU, uCol: { value: new T.Color(o.color == null ? 0xffe9b0 : o.color) }, uK: F(o.strength == null ? 0.5 : o.strength), uLen: F(len) };
    const m = new T.ShaderMaterial({ ...PRE, side: T.DoubleSide, uniforms: U,
      vertexShader: `varying vec3 vN, vV, vL; varying float vZ; void main(){ vL = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = mv.z; vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `${SOFT} ${NOISE} uniform vec3 uCol; uniform float uK, uLen, uTime; varying vec3 vN, vV, vL; varying float vZ;
        void main(){ float along = vL.z / uLen; float face = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
          float ang = atan(vL.y, vL.x); float streak = 0.75 + 0.5 * cF(vec2(ang * 2.5, along * 2.0 - uTime * 0.12));
          float a = face * streak * (1.0 - along) * (1.0 - along) * smoothstep(0.0, 0.06, along) * softZ(vZ, 0.6) * smoothstep(-0.1, -0.8, vZ) * uK * 0.5;
          gl_FragColor = vec4(uCol * a, 0.0); }` });
    const mesh = new T.Mesh(geo, m); mesh.frustumCulled = false; mesh.userData.U = U; return mesh;
  }
  /* 把一盏 SpotLight 的位置、朝向、张角同步给尘埃 / 雾团（每帧调一次） */
  function lightTo(obj, spot, k = 1) {
    const U = obj.userData.U; spot.updateMatrixWorld(true); spot.target.updateMatrixWorld(true);
    U.uLPos.value.setFromMatrixPosition(spot.matrixWorld); U.uLDir.value.setFromMatrixPosition(spot.target.matrixWorld).sub(U.uLPos.value).normalize();
    U.uLCos.value.set(Math.cos(spot.angle), Math.cos(spot.angle * (1 - spot.penumbra * 0.9))); U.uLRange.value = spot.distance || 40; U.uLCol.value.copy(spot.color); U.uLK.value = k;
  }

  return { render, motes, mist, beam, lightTo, fxU, GLSL_SOFT: SOFT, GLSL_NOISE: NOISE, size: [W, H], targets: { rtMain, rtFog } };
}

G.VKCine = { create, beats, rail, env, shake };
})(window);
