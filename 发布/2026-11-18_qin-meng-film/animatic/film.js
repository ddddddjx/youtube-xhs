/* 《一死酬知己，此身寄长城》动态分镜：定帧（用户出的 26 张）+ 景深视差 + 代码叠的特效 + 后期字幕。
 * 画面不是模型生成的视频：人不会张嘴、不会走动，只有镜头在动（推、移、视差）、光在动、粒子在动。
 * 等图生视频出来以后，把对应镜头的定帧换成视频就行，时间线和声音不用改。
 * 默认渲镜 05–09（15 秒样片）；?range=01-26 渲全部。 */
(function () {
'use strict';
const { W, H, clamp, lerp, ss } = VK;
const K = VKit, C = VKCine; let THREE;
const ids = window.RANGE, SH = window.SHOTS.filter(s => ids.includes(s.id));
let acc = 0; for (const s of SH) { s.a = acc; acc += s.dur; s.b = acc; }
const END = acc;

/* 每一镜的镜头：z 推拉、pan 平移（画面宽的比例）、par 视差（近处比远处多移多少）、focus 哪一层不动（0 远 1 近）。
 * fx(fr, lt, s) 画这一镜自己的叠加特效；post 给着色器的额外量 */
const M = {
  '05': { z: [1.03, 1.10], pan: [[-0.012, 0.004], [0.012, -0.004]], par: [[0.020, 0], [-0.020, 0.004]], focus: 0.55, motes: 46, glint: 1, glintTop: 0.66 },
  '06': { z: [1.06, 1.12], pan: [[0.010, 0], [-0.008, 0]], par: [[-0.016, 0], [0.016, 0]], focus: 0.8, motes: 26, glint: 0 },
  '07': { z: [1.02, 1.08], pan: [[0.008, 0.006], [-0.006, -0.004]], par: [[0.014, 0.004], [-0.016, 0]], focus: 0.6, motes: 40, glint: 1, glintTop: 0.7 },
  '08': { z: [1.10, 1.02], pan: [[0, 0.012], [0, -0.006]], par: [[0.0, 0.012], [0.0, -0.014]], focus: 0.55, motes: 50, glint: 1, glintTop: 0.42, ring: [0.404, 0.372] },
  '09': { z: [1.02, 1.09], pan: [[-0.014, 0], [0.004, 0.004]], par: [[0.026, 0], [-0.012, 0]], focus: 0.6, motes: 30, glint: 0, hit: 0.5, hitAt: [0.50, 0.86] },
};
const DEF = { z: [1.03, 1.08], pan: [[0, 0], [0, 0]], par: [[0.012, 0], [-0.012, 0]], focus: 0.5, motes: 30, glint: 0.6 };

let S = null;
function build() {
  THREE = window.THREE; const g3 = K.three(W, H), R = g3.renderer;
  const tex = im => { const t = new THREE.Texture(im); t.colorSpace = THREE.NoColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.needsUpdate = true; return t; };
  const T = {}; for (const id of ids) T[id] = [tex(window.IMG[id]), tex(window.DEP[id])];
  const U = { tImg: { value: null }, tDep: { value: null }, uZoom: { value: 1 }, uPan: { value: new THREE.Vector2() }, uPar: { value: new THREE.Vector2() }, uFocus: { value: 0.5 }, uTime: { value: 0 },
    uGlint: { value: 0 }, uGlintTop: { value: 0 }, uRing: { value: new THREE.Vector4(0.5, 0.5, 0, 0) }, uHit: { value: new THREE.Vector4(0.5, 0.5, 0, 0) }, uFade: { value: 1 }, uWhite: { value: 0 }, uShake: { value: new THREE.Vector2() }, uBreath: { value: 0 } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tImg, tDep; uniform float uZoom, uFocus, uTime, uGlint, uGlintTop, uFade, uWhite, uBreath; uniform vec2 uPan, uPar, uShake; uniform vec4 uRing, uHit; varying vec2 vUv;
      float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n1(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
      vec2 warp(vec2 b){ vec2 uv = b; for (int i = 0; i < 4; i++) { float d = texture2D(tDep, uv).r; uv = b + (d - uFocus) * uPar; } return uv; }   // 视差：近处比远处多移一点
      vec3 shot(vec2 uv0){ vec2 b = (uv0 - 0.5) / uZoom + 0.5 + uPan + uShake; vec2 uv = warp(b);
        float d = texture2D(tDep, uv).r;
        /* 风：只动近处的草和发梢这种「细碎的近景」——用景深的局部起伏当遮罩，人身上（景深平）不动 */
        float e = abs(texture2D(tDep, uv + vec2(0.006, 0.0)).r - texture2D(tDep, uv - vec2(0.006, 0.0)).r);
        float m = smoothstep(0.02, 0.12, e) * smoothstep(0.15, 0.5, d);
        uv.x += (n1(vec2(uv.x * 6.0 + uTime * 0.9, uv.y * 4.0)) - 0.5) * 0.004 * m * uBreath;
        return texture2D(tImg, uv).rgb; }
      void main(){ vec2 uv = vUv; vec2 asp = vec2(16.0 / 9.0, 1.0); vec2 ib = (uv - 0.5) / uZoom + 0.5 + uPan + uShake;   // 图上的坐标：光晕要钉在图里的东西上，跟着镜头走
        /* 冲击：朝冲击点做几次径向取样（瞬间的拉伸感）*/
        vec3 c; float pk = uHit.w;
        if (pk > 0.01) { vec2 dir = (uv - uHit.xy); c = vec3(0.0); for (int i = 0; i < 10; i++) c += shot(uv - dir * pk * 0.008 * float(i)); c /= 10.0; } else c = shot(uv);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        /* 水面的碎光：亮的地方按噪声一闪一闪 */
        float gl = smoothstep(0.6, 0.9, l) * pow(n1(ib * vec2(150.0, 260.0) + uTime * vec2(0.8, 3.0)), 3.0) * n1(ib * 40.0 - uTime * 1.6) * smoothstep(uGlintTop, uGlintTop - 0.08, ib.y);   // 只在水面那一带（uGlintTop 以下）
        c += vec3(1.0, 0.85, 0.55) * gl * 2.2 * uGlint;
        /* 掌心的金环：一圈细线在呼吸 + 外面一层晕 */
        if (uRing.w > 0.0) { float r = length((ib - uRing.xy) * asp); c += vec3(1.0, 0.72, 0.28) * (exp(-r * r / 0.02) * 0.3 + exp(-pow((r - uRing.z) * 55.0, 2.0)) * 0.35) * uRing.w; }   // 原图已经有环，这里只加一层会呼吸的晕
        /* 盾底的金光 */
        if (uHit.z > 0.0) { vec2 q = (ib - uHit.xy) * asp; float r = length(q); c += vec3(1.0, 0.74, 0.3) * (exp(-r * r / 0.03) * 0.9 + exp(-abs(q.y) * 30.0) * exp(-abs(q.x) * 2.2) * 0.8) * uHit.z; }
        /* 高光轻微溢出、暗角、颗粒 */
        c += vec3(1.0, 0.85, 0.6) * pow(max(l - 0.7, 0.0), 2.0) * 0.6;
        vec2 dc = uv - 0.5; c *= 1.0 - 0.38 * smoothstep(0.3, 0.9, length(dc * vec2(1.25, 1.0)));
        c += (h1(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.028;
        c = mix(c * uFade, vec3(1.0, 0.97, 0.9), uWhite);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }` });
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const q = new THREE.Mesh(tri, mat); q.frustumCulled = false; const scene = new THREE.Scene(); scene.add(q);
  return { g3, R, T, U, scene, cam: new THREE.Camera() };
}

/* 逆光里的浮尘：按镜号定种子，慢慢往一侧飘，近的大、虚 */
function motes(fr, s, lt, n) {
  const x = fr.x, r = VK.rng(1000 + (+s.id) * 77); x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const px = r(), py = r(), z = r(), ph = r() * 6.28, sp = 0.006 + 0.02 * z;
    const X = ((px + lt * sp * (0.6 + r())) % 1.1 - 0.05) * W, Y = (py + Math.sin(lt * 0.5 + ph) * 0.012 - lt * 0.004 * z) * H * 0.92, R = 1.2 + z * z * 7, a = (0.10 + 0.22 * z) * (0.6 + 0.4 * Math.sin(lt * (1 + z * 2) + ph));
    const g = x.createRadialGradient(X, Y, 0, X, Y, R * 2.2); g.addColorStop(0, `rgba(255,226,170,${a})`); g.addColorStop(1, 'rgba(255,226,170,0)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R * 2.2, 0, 6.2832); x.fill(); }
  x.restore();
}
/* 盾击的火星和沙：从冲击点炸开，带重力 */
function burst(fr, s, lt, t0, at) {
  const age = lt - t0; if (age < 0 || age > 1.4) return; const x = fr.x, r = VK.rng(909); x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
  for (let i = 0; i < 90; i++) { const an = -Math.PI * (0.05 + 0.9 * r()), v = (0.25 + 0.75 * r() * r()) * 900, life = 0.35 + r() * 0.9, w = 1 + r() * 2.4, side = (r() - 0.5) * 500;
    if (age > life) continue; const k = age / life, d = v * (1 - Math.exp(-age * 3.2)) / 3.2;
    const X = at[0] * W + side * 0.25 + Math.cos(an) * d, Y = at[1] * H + Math.sin(an) * d + 620 * age * age, tl = 0.035 * v * (1 - k);
    x.strokeStyle = `rgba(255,${190 + Math.round(40 * r())},${90 + Math.round(60 * r())},${(1 - k) * 0.9})`; x.lineWidth = w * (1 - k * 0.6);
    x.beginPath(); x.moveTo(X, Y); x.lineTo(X - Math.cos(an) * tl, Y - Math.sin(an) * tl - 30 * age); x.stroke(); }
  x.restore();
}

function shot(fr, t) {
  if (fr.collecting) return;
  S = S || build(); const { g3, R, T, U, scene, cam } = S;
  const s = SH.find(q => t >= q.a && t < q.b) || SH[SH.length - 1], lt = t - s.a, k = clamp(lt / s.dur), m = M[s.id] || DEF, e = k * k * (3 - 2 * k) * 0.35 + k * 0.65;   // 匀速里带一点点缓动：切进来就在动
  U.tImg.value = T[s.id][0]; U.tDep.value = T[s.id][1]; U.uTime.value = t; U.uFocus.value = m.focus; U.uGlint.value = m.glint || 0; U.uGlintTop.value = m.glintTop == null ? 0.6 : m.glintTop; U.uBreath.value = 1;
  let z = lerp(m.z[0], m.z[1], e), sx = 0, sy = 0, hit = 0, punch = 0, ring = 0, white = 0;
  if (m.hit != null) { hit = C.env(lt, m.hit, 0.03, 0.5); punch = C.env(lt, m.hit, 0.02, 0.09); const sk = C.shake(t, C.env(lt, m.hit, 0.02, 0.25) * 0.008); sx = sk[0]; sy = sk[1]; z += 0.05 * C.env(lt, m.hit, 0.03, 0.3); white = 0.28 * C.env(lt, m.hit, 0.015, 0.06);
    z -= 0.03 * ss(lt, 0, m.hit) * (lt < m.hit ? 1 : 0); }                                    // 冲击前镜头略微蓄一下
  if (m.ring) { ring = 0.75 + 0.25 * Math.sin(lt * 9); U.uRing.value.set(m.ring[0], 1 - m.ring[1], 0.046 + 0.003 * Math.sin(lt * 9), ring * ss(lt, 0, 0.3)); } else U.uRing.value.w = 0;
  U.uZoom.value = z; U.uPan.value.set(lerp(m.pan[0][0], m.pan[1][0], e), -lerp(m.pan[0][1], m.pan[1][1], e)); U.uPar.value.set(lerp(m.par[0][0], m.par[1][0], e), -lerp(m.par[0][1], m.par[1][1], e)); U.uShake.value.set(sx, sy);
  if (m.hitAt) U.uHit.value.set(m.hitAt[0], 1 - m.hitAt[1], hit * 0.9, punch); else U.uHit.value.set(0.5, 0.5, 0, 0);
  U.uFade.value = (ss(t, 0, 0.25) * 0.5 + 0.5) * (1 - 0.6 * ss(t, END - 0.35, END)); U.uWhite.value = white;
  R.setRenderTarget(null); R.render(scene, cam); fr.x.drawImage(g3.canvas, 0, 0); fr.look.bloom = 0; fr.look.grain = 0;
  motes(fr, s, lt, m.motes || 0);
  if (m.hitAt) burst(fr, s, lt, m.hit, m.hitAt);
  /* 字幕：切点后 0.3 秒起，跟配音一样长；角色名小一号 */
  if (s.text) { const a0 = 0.3, a1 = Math.min(s.dur - 0.05, a0 + (s.vo || s.dur - 0.6) + 0.35), al = ss(lt, a0 - 0.05, a0 + 0.12) * (1 - ss(lt, a1 - 0.12, a1)); if (al > 0) { const x = fr.x; x.save(); x.globalAlpha = al; x.textAlign = 'center'; x.textBaseline = 'middle';
      const g = x.createLinearGradient(0, H - 260, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = g; x.fillRect(0, H - 260, W, 260);
      const body = (s.sub || s.text), who = s.who === '旁白' ? '' : s.who.slice(0, 2);
      x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 14; x.shadowOffsetY = 2;
      if (who) { x.font = '500 30px "VK Sans"'; x.fillStyle = '#E2C07A'; x.fillText(who, W / 2, H - 172); }
      x.font = '600 50px "VK Serif"'; x.fillStyle = '#F4EFE4'; x.fillText(body, W / 2, H - 112); x.restore(); } }
}

VK.film({ dur: END, theme: 'gilt', meta: { title: '一死酬知己 · 动态分镜 ' + ids[0] + '–' + ids[ids.length - 1] }, draw(fr, t) { shot(fr, t); } });
})();
