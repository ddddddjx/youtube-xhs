// prims.js —— 3D 积木。每个函数返回一个 THREE.Object3D，带 .update(t)（可选）和 .fade(a)（整体透明度 0～1）。
// 质感只有三种：半透明果冻（jelly）、点云 + 连线（cloud）、玩具感实体（toy / mug / book / table）。外加光（beam / rays / ring）和氛围（particles）。
import * as THREE from 'three';
import { rng } from './core.js';

const col = c => new THREE.Color(c);

// 所有自写材质共用的透明度接口
function withOpacity(obj) {
  obj.fade = a => obj.traverse(o => {
    const m = o.material; if (!m) return;
    (Array.isArray(m) ? m : [m]).forEach(mm => {
      if (mm.uniforms && mm.uniforms.uOpacity) mm.uniforms.uOpacity.value = a;
      else { if (mm.__base === undefined) mm.__base = mm.opacity; mm.opacity = mm.__base * a; mm.transparent = true; }
    });
    o.visible = a > 0.001;
  });
  return obj;
}

// ---------- 漂浮颗粒 / 前景散景 ----------
// 散景：size 大（40～160）、离镜头近、少量；颗粒：size 小（2～6）、多。漂移由着色器按时间算，确定性。
export function particles({ n = 600, box = [20, 12, 20], center = [0, 0, 0], size = [2, 6], color = ['#7fe0c8'],
                            opacity = .8, drift = .15, seed = 7, soft = .5 } = {}) {
  const r = rng(seed), pos = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n), cl = new Float32Array(n * 3);
  const cs = (Array.isArray(color) ? color : [color]).map(col);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = center[k] + (r() - .5) * box[k];
    sz[i] = size[0] + r() * (size[1] - size[0]); ph[i] = r() * 100;
    const c = cs[Math.floor(r() * cs.length)]; cl.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uBase: { value: opacity }, uDrift: { value: drift }, uSoft: { value: soft },
                uScale: { value: 1 } },
    vertexShader: `attribute float aSize; attribute float aPhase; attribute vec3 aColor; uniform float uTime, uDrift, uScale;
      varying vec3 vC; varying float vTw;
      void main(){ vec3 p = position + uDrift * vec3(sin(uTime*.31+aPhase), sin(uTime*.23+aPhase*1.7), cos(uTime*.27+aPhase*.6));
        vec4 mv = modelViewMatrix * vec4(p,1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale * (10. / max(.5, -mv.z)); vC = aColor; vTw = .75 + .25*sin(uTime*1.3+aPhase*3.); }`,
    fragmentShader: `uniform float uOpacity, uBase, uSoft; varying vec3 vC; varying float vTw;
      void main(){ float d = length(gl_PointCoord-.5)*2.; float a = 1. - smoothstep(1.-uSoft, 1., d);
        if(a<.01) discard; gl_FragColor = vec4(vC, a*uOpacity*uBase*vTw); }`,
  });
  const pts = new THREE.Points(g, m);
  pts.update = t => { m.uniforms.uTime.value = t; };
  pts.setScale = s => { m.uniforms.uScale.value = s; };
  return withOpacity(pts);
}

// ---------- 半透明果冻：细胞、器官、透视的身体 ----------
// 菲涅尔边缘亮、中间透；内部可加颗粒。scale 可做椭球。
export function jelly({ r = 1, scale = [1, 1, 1], color = '#2f9a6a', rim = '#bff5e0', inner = .35, rimPow = 2.6, rimI = .7,
                        granules = 400, granColor = '#9fe8c0', seed = 3 } = {}) {
  const grp = new THREE.Group();
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uColor: { value: col(color) }, uRim: { value: col(rim).multiplyScalar(rimI) }, uInner: { value: inner }, uPow: { value: rimPow },
                uOpacity: { value: 1 }, uGlow: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.);
      vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor, uRim; uniform float uInner, uPow, uOpacity, uGlow; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.-abs(dot(vN,vV)), uPow);
        vec3 c = mix(uColor*(.6+uGlow), uRim*(1.+uGlow*.6), f);
        gl_FragColor = vec4(c, (uInner + f*.8)*uOpacity); }`,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), m);
  body.scale.set(...scale); grp.add(body);
  if (granules) {
    const R = rng(seed), p = [];
    for (let i = 0; i < granules; i++) {
      let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1);
      p.push(x * r * .85 * scale[0], y * r * .85 * scale[1], z * r * .85 * scale[2]);
    }
    const g = particles({ n: 1, size: [0, 0] });            // 占位：用同一个着色器
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    const n = granules, sz = new Float32Array(n), ph = new Float32Array(n), cl = new Float32Array(n * 3), c = col(granColor);
    for (let i = 0; i < n; i++) { sz[i] = 1.5 + R() * 3; ph[i] = R() * 100; cl.set([c.r, c.g, c.b], i * 3); }
    gg.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); gg.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    gg.setAttribute('aColor', new THREE.BufferAttribute(cl, 3));
    g.geometry = gg; g.material.uniforms.uBase.value = .55; g.material.uniforms.uDrift.value = .02 * r;
    grp.add(g); grp.granules = g;
  }
  grp.body = body;
  grp.glow = a => { m.uniforms.uGlow.value = a; };
  grp.update = t => { if (grp.granules) grp.granules.update(t); };
  return withOpacity(grp);
}

// ---------- 点云 + 连线：大脑、神经网、记忆、回路 ----------
// sampler(R) 返回一个点 [x,y,z]（在形状里均匀采样）；links 连最近邻，像星座。
export const shapes = {
  ellipsoid: (a, b, c) => R => { let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1); return [x * a, y * b, z * c]; },
  shell: (a, b, c, th = .12) => R => { let x, y, z, d; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; d = Math.hypot(x, y, z); } while (d > 1 || d < 1 - th); return [x * a, y * b, z * c]; },
  // 大脑：两个半球 + 小脑，够用的示意
  brain: (s = 1) => R => {
    const pick = R();
    const e = pick < .42 ? [-.55, .1, 0, 1.0, .75, .8] : pick < .84 ? [.55, .1, 0, 1.0, .75, .8] : [0, -.55, -.9, .7, .45, .45];
    let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1);
    return [(e[0] + x * e[3] * .62) * s, (e[1] + y * e[4]) * s, (e[2] + z * e[5] * 1.2) * s];
  },
};
export function cloud({ sampler = shapes.ellipsoid(1, 1, 1), n = 2500, color = '#9cc8ff', size = [1.5, 4], links = 2, linkDist = .18,
                        linkColor = '#6f9bff', linkOpacity = .25, seed = 11 } = {}) {
  const R = rng(seed), P = [];
  for (let i = 0; i < n; i++) P.push(sampler(R));
  const grp = new THREE.Group();
  const pts = particles({ n: 1, size: [0, 0] });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P.flat(), 3));
  const sz = new Float32Array(n), ph = new Float32Array(n), cl = new Float32Array(n * 3), c = col(color);
  for (let i = 0; i < n; i++) { sz[i] = size[0] + R() * (size[1] - size[0]); ph[i] = R() * 100; cl.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3));
  pts.geometry = g; pts.material.uniforms.uDrift.value = 0.004; grp.add(pts);
  if (links) {                                      // 网格分桶找近邻，确定性
    const cell = linkDist, key = p => p.map(v => Math.floor(v / cell)).join(','), buckets = new Map();
    P.forEach((p, i) => { const k = key(p); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); });
    const seg = [];
    P.forEach((p, i) => {
      const [bx, by, bz] = p.map(v => Math.floor(v / cell)); const cand = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++)
        (buckets.get([bx + dx, by + dy, bz + dz].join(',')) || []).forEach(j => { if (j > i) { const d = Math.hypot(p[0] - P[j][0], p[1] - P[j][1], p[2] - P[j][2]); if (d < linkDist) cand.push([d, j]); } });
      cand.sort((a, b) => a[0] - b[0]).slice(0, links).forEach(([, j]) => seg.push(...p, ...P[j]));
    });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const lm = new THREE.LineBasicMaterial({ color: linkColor, transparent: true, opacity: linkOpacity, blending: THREE.AdditiveBlending, depthWrite: false });
    grp.add(new THREE.LineSegments(lg, lm));
  }
  grp.points = P;
  grp.update = t => pts.update(t);
  // 点亮一个区域：中心 c、半径 rad、强度 a、颜色
  const base = cl.slice();
  grp.light = (spots) => {
    const a = g.getAttribute('aColor');
    for (let i = 0; i < n; i++) {
      let r = base[i * 3], gg2 = base[i * 3 + 1], b = base[i * 3 + 2];
      for (const s of spots) {
        const d = Math.hypot(P[i][0] - s.c[0], P[i][1] - s.c[1], P[i][2] - s.c[2]);
        const k = s.a * Math.max(0, 1 - d / s.r); if (k <= 0) continue; const sc = col(s.color || '#ffd59a');
        r += (sc.r * 2.2 - r) * k; gg2 += (sc.g * 2.2 - gg2) * k; b += (sc.b * 2.2 - b) * k;
      }
      a.array[i * 3] = r; a.array[i * 3 + 1] = gg2; a.array[i * 3 + 2] = b;
    }
    a.needsUpdate = true;
  };
  return withOpacity(grp);
}

// 一条回路：沿给定控制点的发光曲线，draw 0～1 控制画到哪
export function path3({ points, color = '#ff8a6a', width = .02, seed = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: col(color) }, uDraw: { value: 1 }, uOpacity: { value: 1 } },
    vertexShader: `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uDraw, uOpacity; varying float vU;
      void main(){ if(vU>uDraw) discard; float head = smoothstep(uDraw-.08, uDraw, vU); gl_FragColor = vec4(uColor*(1.2+head*2.), uOpacity); }`,
  });
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, width, 8, false), m);
  mesh.draw = k => { m.uniforms.uDraw.value = k; };
  return withOpacity(mesh);
}

// ---------- 光：光束、丁达尔光柱、扩散光环 ----------
export function beam({ from = [0, 6, 0], to = [0, 0, 0], r0 = .04, r1 = .35, color = '#3fa9ff', intensity = .55 } = {}) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), len = a.distanceTo(b);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: col(color) }, uI: { value: intensity }, uOpacity: { value: 1 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.);
      vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI, uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(vN,vV)), 3.); float along = mix(.25, 1., vUv.y);
        gl_FragColor = vec4(uColor*uI, edge*along*.55*uOpacity); }`,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 48, 1, true), m);
  mesh.position.copy(a.clone().add(b).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), b.clone().sub(a).normalize());
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r0 * .35, r0 * .35, len, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: col(color).multiplyScalar(1.6), transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
  mesh.add(core);
  mesh.power = k => { m.uniforms.uI.value = intensity * k; core.material.opacity = .8 * k; mesh.visible = k > .001; };
  return withOpacity(mesh);
}

export function rays({ n = 5, color = '#d9f2d0', spread = 8, length = 30, tilt = -.5, opacity = .05, seed = 5, center = [0, 0, -4] } = {}) {
  const R = rng(seed), grp = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const w = .8 + R() * 2.4;
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uColor: { value: col(color) }, uA: { value: opacity * (.5 + R()) }, uOpacity: { value: 1 }, uT: { value: 0 }, uPh: { value: R() * 9 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uColor; uniform float uA, uOpacity, uT, uPh; varying vec2 vUv;
        void main(){ float x = 1.-abs(vUv.x-.5)*2.; float y = smoothstep(0.,.35,vUv.y)*smoothstep(1.,.6,vUv.y);
          float fl = .8+.2*sin(uT*.7+uPh); gl_FragColor = vec4(uColor, pow(x,2.)*y*uA*fl*uOpacity); }`,
    });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, length), m);
    pl.position.set(center[0] + (R() - .5) * spread, center[1], center[2] + (R() - .5) * 2);
    pl.rotation.z = tilt + (R() - .5) * .08;
    grp.add(pl);
  }
  grp.update = t => grp.children.forEach(c => c.material.uniforms.uT.value = t);
  return withOpacity(grp);
}

// 扩散光环：在 t0 触发，一圈从小到大淡出；挂在物体上用 ring.position 定位，自动朝向镜头
export function ring({ color = '#9fd8ff', r = .5, width = .04 } = {}) {
  const m = new THREE.MeshBasicMaterial({ color: col(color).multiplyScalar(1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(r * (1 - width), r, 96), m);
  mesh.fire = (t, t0, d = 1.0, grow = 2.2) => {
    const k = (t - t0) / d; if (k < 0 || k > 1) { m.opacity = 0; return; }
    const s = 1 + (grow - 1) * (1 - Math.pow(1 - k, 3)); mesh.scale.setScalar(s); m.opacity = (1 - k) * .9;
  };
  mesh.face = cam => mesh.quaternion.copy(cam.quaternion);
  return mesh;
}

// ---------- 点阵轮廓：「他看见的画面」 ----------
// paths：二维折线数组（单位约 1），沿线等距撒点；amber 点阵 + 微闪
export function dotOutline({ paths, spacing = .05, color = '#ffb347', size = [3, 5], jitter = .006, seed = 9 } = {}) {
  const R = rng(seed), P = [];
  for (const path of paths) for (let i = 0; i < path.length - 1; i++) {
    const [x0, y0] = path[i], [x1, y1] = path[i + 1], L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(1, Math.round(L / spacing));
    for (let j = 0; j < k; j++) P.push(x0 + (x1 - x0) * j / k + (R() - .5) * jitter, y0 + (y1 - y0) * j / k + (R() - .5) * jitter, 0);
  }
  const n = P.length, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const sz = new Float32Array(n), ph = new Float32Array(n), cl = new Float32Array(n * 3), c = col(color);
  for (let i = 0; i < n; i++) { sz[i] = size[0] + R() * (size[1] - size[0]); ph[i] = R() * 100; cl.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3));
  const pts = particles({ n: 1, size: [0, 0] }); pts.geometry = g; pts.material.uniforms.uDrift.value = 0; pts.material.uniforms.uSoft.value = .35;
  return pts;
}
// 常用轮廓
export const outlines = {
  mug: () => [[[-.35, .4], [-.3, -.4], [.3, -.4], [.35, .4], [-.35, .4]], [[.34, .25], [.55, .22], [.56, -.05], [.32, -.18]]],
  rect: (w = 1, h = .7) => [[[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]]],
};

// ---------- 玩具感实体：日常物、桌面 ----------
export function toyMaterial(color, rough = .7) { return new THREE.MeshStandardMaterial({ color: col(color), roughness: rough, metalness: 0 }); }
export function mug({ color = '#f2ede4', band = '#c9a46a' } = {}) {
  const pts = [[0, 0], [.32, 0], [.34, .05], [.36, .7], [.33, .7], [.31, .06], [0, .06]].map(p => new THREE.Vector2(...p));
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 64), toyMaterial(color, .45)));
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.362, .358, .06, 64, 1, true), toyMaterial(band, .5)); b.position.y = .5; grp.add(b);
  const h = new THREE.Mesh(new THREE.TorusGeometry(.17, .04, 16, 48, Math.PI * 1.2), toyMaterial(color, .45));
  h.position.set(.37, .38, 0); h.rotation.z = -Math.PI * .6; grp.add(h);
  return withOpacity(grp);
}
export function book({ color = '#8f9a7a', w = 1, d = .7, h = .07 } = {}) {
  const grp = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toyMaterial(color)); b.position.y = h / 2; grp.add(b);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .8, 12), toyMaterial('#e0b23c', .4));
  pen.rotation.z = Math.PI / 2; pen.rotation.y = .5; pen.position.set(0, h + .02, 0); grp.add(pen);
  return withOpacity(grp);
}
export function table({ color = '#8a4f2a', size = [12, 8] } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(...size), toyMaterial(color, .55));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  return withOpacity(m);
}
