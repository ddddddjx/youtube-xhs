// 三毫米：3 分钟看懂偏头痛（science-film 工程）
// 世界布局（一镜到底，镜头在这几处之间穿行）：
//   头 HEAD 在原点（侧脸朝 +x），点云大脑在里面；先兆光弧 AURA 浮在脸前 (2.6, .3, 0)
//   拉什利的纸 PAPER 在 (10, 0, 0)；兔子皮层薄片 SLICE 在 (0, -12, 0)
//   血管 VESSEL 贴在头的太阳穴；暖光房间 ROOM 在 (-6, 2, -22)；全世界的光点 WORLD 包着这一切
export const post = { bloom: .8, radius: .55, threshold: .5, vignette: .6, grain: .02 };

export async function setup(c) {
  const { THREE, scene, camera, hud, W, H, at, end, smooth, easeOut, clamp, lerp, win, pulse, rng, cameraRig, project } = c;
  scene.background = new THREE.Color('#050b14');
  scene.fog = new THREE.FogExp2('#050b14', .018);
  scene.add(camera);
  scene.add(new THREE.AmbientLight('#8fa6c8', .55));
  const key = new THREE.DirectionalLight('#dfe8ff', 1.1); key.position.set(4, 6, 8); scene.add(key);

  // ---------------- 氛围：全场颗粒 + 镜头前散景 + 冷光柱 ----------------
  const motes = c.particles({ n: 3500, box: [60, 40, 70], center: [0, -6, -8], size: [1.5, 4], color: ['#7fb8d8', '#5d8fb0', '#9fd8e8'], opacity: .45, seed: 2 });
  const bokeh = c.particles({ n: 18, box: [6, 10, 2], center: [0, 0, -4.5], size: [60, 150], color: ['#2a5a7a', '#1d4058'], opacity: .18, soft: .95, seed: 4 });
  camera.add(bokeh);
  const rays = c.rays({ n: 5, color: '#bcd8f0', spread: 12, length: 40, tilt: -.4, opacity: .04, center: [0, 0, -8] });
  scene.add(motes);

  // ---------------- 先兆光弧：锯齿状的 C 形，闪烁 ----------------
  function zigzag(n = 46, amp = .1, span = 1.25 * Math.PI) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const th = Math.PI - span / 2 + span * i / n + Math.PI;           // 开口朝右（朝着脸外）
      const r = 1 + (i % 2 ? amp : -amp);
      pts.push([Math.cos(th) * r, Math.sin(th) * r]);
    }
    return [pts];
  }
  const aura = new THREE.Group();
  const auraA = c.dotOutline({ paths: zigzag(), spacing: .012, color: '#fff1c8', size: [1.8, 2.8], seed: 31 });
  const auraB = c.dotOutline({ paths: zigzag(46, .1).map(p => p.map(([x, y]) => [x * 1.035, y * 1.035])), spacing: .02, color: '#7fe8ff', size: [1.2, 2.2], seed: 32 });
  const auraC = c.dotOutline({ paths: zigzag(46, .1).map(p => p.map(([x, y]) => [x * .965, y * .965])), spacing: .02, color: '#ff9a8a', size: [1.2, 2], seed: 33 });
  aura.add(auraA, auraB, auraC);
  const AURA = new THREE.Vector3(2.6, .3, 0);
  aura.position.copy(AURA); aura.position.z += .02;
  scene.add(aura);
  // 手机屏幕：一排排「字」，光弧圈到的地方字被吃掉（暗点），弧线经过的地方闪
  const page = new THREE.Group(); page.position.copy(AURA).add(new THREE.Vector3(0, 0, -.06)); scene.add(page);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 3.1), new THREE.MeshBasicMaterial({ color: '#141b26', transparent: true }));
  panel.position.z = -.01; page.add(panel);
  const words = [], WR = rng(91);
  for (let row = 0; row < 15; row++) {
    let x = -.72; const y = 1.3 - row * .19;
    while (x < .68) {
      const w = .08 + WR() * .22; if (x + w > .72) break;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, .055), new THREE.MeshBasicMaterial({ color: '#b9c4d4', transparent: true, opacity: .8 }));
      m.position.set(x + w / 2, y, 0); page.add(m); words.push(m); x += w + .05;
    }
  }
  const auraFade = a => { [auraA, auraB, auraC].forEach(p => { p.material.uniforms.uOpacity.value = a * .7; p.visible = a > .01; }); };

  // ---------------- 头和点云大脑 ----------------
  const head = c.jelly({ r: 1, scale: [1.45, 1.75, 1.3], color: '#24405e', rim: '#a9d4ff', inner: .18, rimPow: 2.4, granules: 0 });
  head.position.set(0, 0, 0); scene.add(head);
  const brain = c.cloud({ sampler: c.shapes.brain(.95), n: 3200, color: '#7fa8ff', size: [1.5, 3.6], links: 2, linkDist: .16, linkColor: '#5f86e0', linkOpacity: .18, seed: 12 });
  brain.position.set(-.05, .35, 0); brain.rotation.y = Math.PI / 2; head.add(brain);
  // 波：从后脑（视觉皮层）往前推。改每个点的颜色：波前亮，波后暗（熄灯）
  const bPts = brain.children[0], bCol = bPts.geometry.getAttribute('aColor'), bBase = bCol.array.slice();
  const bP = brain.points;
  // 后脑在大脑局部坐标里是 -z（rotation.y 之后朝 -x，也就是脸的反方向）
  const OCC = [0, .05, -1.15];
  const bDist = bP.map(p => Math.hypot(p[0] - OCC[0], p[1] - OCC[1], p[2] - OCC[2]));
  function wave(colAttr, base, dist, d, wdt, on) {
    const a = colAttr.array;
    for (let i = 0; i < dist.length; i++) {
      let r = base[i * 3], g = base[i * 3 + 1], b = base[i * 3 + 2];
      if (on > 0) {
        const x = dist[i] - d;
        const front = Math.exp(-(x * x) / (wdt * wdt));               // 波前：亮的一圈
        const behind = x < 0 ? Math.min(1, -x / (wdt * 1.5)) : .45;   // 波后：暗下去；波前方也压暗一点，让亮带跳出来
        r = r * (1 - .75 * behind * on) + 1.3 * front * on; g = g * (1 - .75 * behind * on) + 1.2 * front * on; b = b * (1 - .75 * behind * on) + .8 * front * on;
      }
      a[i * 3] = r; a[i * 3 + 1] = g; a[i * 3 + 2] = b;
    }
    colAttr.needsUpdate = true;
  }
  // 太阳穴的痛：一团红光一下下跳
  const pain = c.particles({ n: 320, box: [.8, .8, .8], center: [0, 0, 0], size: [4, 9], color: ['#ff5a3c', '#ff8a5a'], opacity: .9, drift: .03, seed: 41 });
  pain.position.set(1.05, .75, .75); head.add(pain);

  // ---------------- 三个人里有一个 ----------------
  const people = new THREE.Group();
  const pm = [0, 1, 2].map(i => {
    const m = new THREE.MeshStandardMaterial({ color: '#c9d3e0', roughness: .6, emissive: '#000000' });
    const g = new THREE.Group();
    const hd = new THREE.Mesh(new THREE.SphereGeometry(.17, 32, 24), m); hd.position.y = .58;
    const bd = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .38, 8, 24), m); bd.position.y = .2;
    g.add(hd, bd); g.position.set((i - 1) * .75, 0, 0); people.add(g); return m;
  });
  people.visible = false;

  // ---------------- 拉什利的纸 ----------------
  const PAPER = new THREE.Vector3(10, 0, 0);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 4.2), new THREE.MeshStandardMaterial({ color: '#4a3f33', roughness: .95 }));
  paper.position.copy(PAPER); scene.add(paper);
  const warm = new THREE.PointLight('#ffd9a8', 5, 12); warm.position.set(11.5, 1.5, 3); scene.add(warm);
  // 纸上一道道弧（墨线），从小到大，位置往外推
  const arcs = [], arcGlow = [];
  for (let k = 0; k < 6; k++) {
    const r = .28 + k * .24;
    const pts = zigzag(30 + k * 6, .07)[0].map(([x, y]) => new THREE.Vector3(PAPER.x - .6 + x * r, PAPER.y + .2 + y * r, PAPER.z + .01));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: '#3d2b1c', transparent: true, opacity: .9 }));
    line.geometry.setDrawRange(0, 0); scene.add(line); arcs.push({ line, n: pts.length });
    const glow = c.dotOutline({ paths: [pts.map(p => [p.x - PAPER.x, p.y - PAPER.y])], spacing: .008, color: '#ffc46b', size: [1.8, 2.8], seed: 50 + k });
    glow.position.set(PAPER.x, PAPER.y, PAPER.z + .02); glow.material.uniforms.uOpacity.value = 0; scene.add(glow); arcGlow.push(glow);
  }

  // ---------------- 兔子皮层薄片 ----------------
  const SLICE = new THREE.Vector3(0, -12, 0);
  const slice = c.cloud({ sampler: R => { const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 2.2; return [Math.cos(a) * r, (R() - .5) * .12, Math.sin(a) * r]; },
    n: 2600, color: '#8fd8c8', size: [1.5, 3.4], links: 2, linkDist: .17, linkColor: '#5fb8a8', linkOpacity: .2, seed: 21 });
  slice.position.copy(SLICE); scene.add(slice);
  const sCol = slice.children[0].geometry.getAttribute('aColor'), sBase = sCol.array.slice();
  const sDist = slice.points.map(p => Math.hypot(p[0], p[2]));
  const sRing = c.ring({ color: '#bff5e8', r: .25 }); sRing.position.copy(SLICE).add(new THREE.Vector3(0, .1, 0)); scene.add(sRing);

  // ---------------- 血管 + CGRP 分子 + 锁 ----------------
  const vPts = [[1.35, 1.3, .2], [1.25, .95, .7], [1.0, .55, 1.05], [.7, .05, 1.2], [.55, -.45, 1.15]];
  const vessel = c.path3({ points: vPts, color: '#d9473c', width: .026 });
  head.add(vessel);
  const curve = new THREE.CatmullRomCurve3(vPts.map(p => new THREE.Vector3(...p)));
  const R = rng(77), mol = [], molGrp = new THREE.Group(); head.add(molGrp);
  for (let i = 0; i < 70; i++) {
    const u = R(), p = curve.getPoint(u), off = new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize().multiplyScalar(.09 + R() * .22);
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.022 + R() * .012, 1), new THREE.MeshBasicMaterial({ color: '#ffae4a', transparent: true, opacity: 0 }));
    m.position.copy(p).add(off); molGrp.add(m); mol.push({ m, t: R(), base: m.position.clone(), off });
  }
  const locks = [];
  for (let i = 0; i < 9; i++) {
    const p = curve.getPoint(.08 + i * .105);
    const l = new THREE.Mesh(new THREE.TorusGeometry(.045, .014, 10, 24), new THREE.MeshStandardMaterial({ color: '#f2f5fa', emissive: '#4a5a6a', roughness: .3 }));
    l.position.copy(p).add(new THREE.Vector3(.06, .02, .05)); l.visible = false; head.add(l); locks.push(l);
  }

  // ---------------- 全世界的光点 ----------------
  const world = c.particles({ n: 2600, box: [70, 50, 70], center: [0, 0, -10], size: [3, 7], color: ['#ffc46b', '#ffb06a', '#ffd9a0'], opacity: .0, drift: .05, seed: 61 });
  scene.add(world);

  // ---------------- 暖光房间 ----------------
  const ROOM = new THREE.Vector3(-6, 2, -22);
  const room = new THREE.Group(); room.position.copy(ROOM); scene.add(room);
  const tbl = c.table({ color: '#7a4a2a', size: [7, 5] }); room.add(tbl);
  const mugO = c.mug({ color: '#efe8dc', band: '#c9a46a' }); mugO.position.set(-.5, 0, .3); room.add(mugO);
  const bookO = c.book({ color: '#8b9776' }); bookO.position.set(.9, 0, .5); bookO.rotation.y = -.3; room.add(bookO);
  const roomLight = new THREE.PointLight('#ffcf94', 0, 14); roomLight.position.set(2.5, 3.5, 2); room.add(roomLight);
  const roomRays = c.rays({ n: 5, color: '#ffd9a0', spread: 5, length: 14, tilt: .55, opacity: .0, center: [0, 3, -1.5] }); room.add(roomRays);

  // ---------------- 镜头 ----------------
  const A = AURA.toArray();
  const rig = cameraRig(camera, [
    { t: 0, pos: [A[0], A[1], 4.6], look: A, fov: 42 },
    { t: at('hook1', 3.0), pos: [A[0], A[1], 5.0], look: A, fov: 42 },
    { t: at('hook2', 1.2), pos: [1.0, -1.0, 12], look: [1.0, -1.5, 0], fov: 42, zoom: true },
    { t: at('hook4'), pos: [1.0, -1.0, 12.6], look: [1.0, -1.5, 0], fov: 42 },
    { t: at('hook4', 1.1), pos: [PAPER.x - .4, .1, 7.6], look: [PAPER.x - .4, .1, 0], fov: 42 },
    { t: end('lashley'), pos: [PAPER.x - .5, .1, 7.0], look: [PAPER.x - .5, .1, 0], fov: 42 },
    { t: at('calc', .9), pos: [-5.4, .9, 4.4], look: [-.4, .3, 0], fov: 42 },
    { t: end('calc'), pos: [-5.1, 1.0, 4.1], look: [-.4, .3, 0], fov: 42 },
    { t: end('q1', -.2), pos: [-2.2, 3.0, 4.4], look: [.3, .4, 0], fov: 42 },
    { t: at('leao', .9), pos: [0, -9.2, 4.6], look: [0, -12, 0], fov: 42 },
    { t: end('leao3'), pos: [0, -8.6, 5.6], look: [0, -12, 0], fov: 42 },
    { t: at('mri', .7), pos: [1.0, .5, 12.4], look: [1.0, .1, 0], fov: 42 },
    { t: end('mri2'), pos: [1.0, .5, 12.0], look: [1.0, .1, 0], fov: 42 },
    { t: at('q2', 1.2), pos: [3.9, 1.2, 4.6], look: [.9, .35, .8], fov: 40, zoom: true },
    { t: end('result'), pos: [3.7, 1.2, 4.4], look: [.9, .35, .8], fov: 40 },
    { t: at('world', 2.2), pos: [4, 4, 46], look: [0, 0, -10], fov: 46, zoom: true },
    { t: at('light', 1.6), pos: [.6, .2, 8.2], look: [0, -.2, 0], fov: 42, zoom: true },
    { t: end('light'), pos: [.5, .2, 7.6], look: [0, -.2, 0], fov: 42 },
    { t: at('lesson', 1.4), pos: [PAPER.x - .4, .1, 7.4], look: [PAPER.x - .4, .1, 0], fov: 42 },
    { t: end('lesson'), pos: [PAPER.x - .4, .1, 9.0], look: [PAPER.x - .4, .1, 0], fov: 42 },
    { t: at('ask', 1.2), pos: [A[0], A[1], 5.2], look: A, fov: 42 },
    { t: end('end', 2), pos: [A[0], A[1], 6.2], look: A, fov: 42 },
  ]);

  // ---------------- 信息层 ----------------
  const u = hud.u, S = hud.safe;
  hud.add(new c.Corner({ text: '示意' }));
  // 三个人里一个：右侧小注
  hud.add({
    alpha: t => win(t, at('hook3'), end('hook3')), texts: () => [],
    draw(ctx, t) {
      const cx = (S.l + S.r) / 2, y = H * .6, gap = 150 * u;
      [0, 1, 2].forEach(i => {
        const x = cx + (i - 1) * gap, lit = i === 2 ? smooth((t - at('hook3', .8)) / .4) : 0;
        ctx.fillStyle = lit ? `rgba(255,${lerp(220, 170, lit)},${lerp(230, 80, lit)},${.55 + .45 * lit})` : 'rgba(200,214,232,.55)';
        if (lit) { ctx.shadowColor = 'rgba(255,170,80,.9)'; ctx.shadowBlur = 30 * u * lit; }
        ctx.beginPath(); ctx.arc(x, y - 52 * u, 26 * u, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.roundRect(x - 38 * u, y - 18 * u, 76 * u, 96 * u, 34 * u); ctx.fill(); ctx.shadowBlur = 0;
      });
    } });
  hud.add(new c.TitleCard({ from: at('title', .2), to: end('title'), title: '三毫米', kicker: 'MIGRAINE AURA', subtitle: '偏头痛的那道光', size: 150, y: H * .22 }));
  hud.add(new c.Chapter({ from: at('lashley'), to: end('calc'), year: '1941', title: '拉什利 · 画下自己的先兆', cite: 'Lashley · Arch Neurol Psychiatry · 1941' }));
  // 纸上每道弧旁边的分钟数
  const mins = ['0', '3', '6', '9', '12', '15'];
  hud.add({
    alpha: t => win(t, at('lashley'), end('lashley', .3)), texts: () => mins.map(m => m + ' 分钟'),
    draw(ctx, t) {
      arcs.forEach((a, k) => {
        const k0 = at('lashley') + k * .55; if (t < k0 + .3) return;
        const r = .28 + k * .24, p = project(new THREE.Vector3(PAPER.x - .6 - r * 1.05, PAPER.y + .2 + r * .55, 0), camera, W, H);
        ctx.globalAlpha = Math.min(1, (t - k0 - .3) / .3) * this.alpha(t);
        ctx.font = `700 ${24 * u}px ${c.F.sans}`; ctx.fillStyle = '#2a1d12'; ctx.textAlign = 'right'; ctx.fillText(mins[k] + ' 分钟', p.x, p.y);
      });
    } });
  hud.add(new c.Chip({ from: at('calc', 1.0), to: end('q1', -.5), x: S.l, y: H * .3, a: '≈ 3 毫米 / 分钟', b: '拉什利推算', color: '#ffc46b' }));
  hud.add(new c.Chapter({ from: at('leao'), to: end('leao3'), year: '1944', title: '莱昂 · 兔子皮层上的波', cite: 'Leão · J Neurophysiol · 1944' }));
  hud.add(new c.Label({ from: at('leao', 1.0), to: end('leao2'), x: S.l, y: H * .3, zh: '刺激点', en: 'stimulus', note: '一处被刺激，波从这里出发', anchor: () => project(SLICE.clone().add(new THREE.Vector3(0, .1, 0)), camera, W, H) }));
  hud.add(new c.Checklist({ from: at('leao3'), to: end('leao3'), x: S.l + 10 * u, y: H * .3, items: [
    { at: .2, text: '拉什利 1941 · 推算 ≈ 3 毫米 / 分钟', color: '#ffc46b' }, { at: 1.0, text: '莱昂 1944 · 实测 每分钟几毫米', color: '#8fd8c8' }] }));
  hud.add(new c.Chapter({ from: at('mri'), to: end('mri2'), year: '2001', title: '哈佛 · 磁共振看见这道波', cite: 'Hadjikhani 等 · PNAS · 2001' }));
  hud.add(new c.Chip({ from: at('mri2', .2), to: end('mri2'), x: S.l, y: H * .3, a: '3.5 毫米 / 分钟', b: '人脑实测', color: '#bfe8ff' }));
  // 波和光弧之间的连线
  hud.add({
    alpha: t => win(t, at('mri2', .4), end('mri2'), .5, .3), texts: () => [],
    draw(ctx, t) {
      const a = project(head.localToWorld(new THREE.Vector3(-.35, .5, .15)), camera, W, H), b = project(AURA.clone().add(new THREE.Vector3(-.9, 0, 0)), camera, W, H);
      ctx.setLineDash([6 * u, 6 * u]); ctx.strokeStyle = 'rgba(255,241,200,.75)'; ctx.lineWidth = 1.6 * u;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    } });
  hud.add(new c.Chapter({ from: at('cgrp'), to: end('cgrp'), year: '1990', title: '埃德温森 & 戈兹比 · 血里的分子', cite: 'Goadsby, Edvinsson 等 · Ann Neurol · 1990' }));
  hud.add(new c.Label({ from: at('cgrp', 1.2), to: end('cgrp2'), x: S.l, y: H * .3, zh: 'CGRP', en: 'calcitonin gene-related peptide', note: '会让脑膜血管扩张的一种分子',
    anchor: () => project(mol[3].m.getWorldPosition(new THREE.Vector3()), camera, W, H) }));
  hud.add(new c.Chapter({ from: at('cgrp2'), to: end('cgrp2'), year: '2002', title: '奥列森团队 · 输注实验', cite: 'Lassen 等 · Cephalalgia · 2002' }));
  // 12 个小格子一个个变红
  hud.add({
    alpha: t => win(t, at('cgrp2', .3), end('cgrp2')), texts: () => ['12 人里头痛'],
    draw(ctx, t) {
      const x0 = S.l + 4 * u, y0 = H * .52, s = 46 * u, gap = 12 * u;
      ctx.font = `600 ${20 * u}px ${c.F.sans}`; ctx.fillStyle = c.C.sub; ctx.textAlign = 'left'; ctx.fillText('12 人里头痛', x0, y0 - 16 * u);
      for (let i = 0; i < 12; i++) {
        const k = smooth((t - at('cgrp2', .5) - i * .18) / .2), x = x0 + (i % 6) * (s + gap), y = y0 + Math.floor(i / 6) * (s + gap);
        ctx.fillStyle = `rgba(${lerp(60, 255, k)},${lerp(80, 90, k)},${lerp(110, 70, k)},${lerp(.35, .9, k)})`;
        ctx.beginPath(); ctx.roundRect(x, y, s, s, 8 * u); ctx.fill();
      }
    } });
  hud.add(new c.Chapter({ from: at('drug'), to: end('result'), year: '2018', title: '首个 CGRP 阻断药获批', cite: 'FDA · 2018-05-17' }));
  hud.add(new c.Checklist({ from: at('result', .2), to: end('result'), x: S.l + 10 * u, y: H * .3, items: [
    { at: .2, text: '高剂量组：50% 的人发作天数减半以上', color: '#ffc46b' },
    { at: 1.2, text: '安慰剂组：26.6%', color: '#9fb4c8' },
    { at: 2.0, text: 'STRIVE 试验 · 955 人 · 6 个月 · NEJM 2017', color: '#9fb4c8' },
    { at: 2.8, text: '这类药统称 CGRP 靶向药，能不能用请问医生', color: '#ffc46b' }] }));
  hud.add(new c.Text({ from: at('world', 1.0), to: end('world'), text: '11.6 亿', y: H * .36, size: 120, font: c.F.latinSerif, weight: 300 }));
  hud.add(new c.Text({ from: at('world', 1.4), to: end('world'), text: '全球偏头痛患者 · GBD 2021', y: H * .36 + 60 * u, size: 22, font: c.F.sans, weight: 400, color: c.C.sub }));
  hud.add(new c.TitleCard({ from: at('end', .1), to: end('end', 2), title: '三毫米', kicker: 'MIGRAINE AURA', subtitle: '偏头痛的那道光', size: 120, y: H * .22 }));
  hud.add(new c.Credits({ from: at('end', .6), to: end('end', 2), y: H * .36, lines: [
    '全片代码实时渲染 · 画面为示意',
    'Lashley 1941 · Leão 1944 · Hadjikhani 等 PNAS 2001',
    'Goadsby 等 Ann Neurol 1990 · Lassen 等 Cephalalgia 2002',
    'Goadsby 等 NEJM 2017 · GBD 2021 · WHO'] }));

  // ---------------- 每帧 ----------------
  return t => {
    rig(t);
    [motes, bokeh, head, brain, slice, world, auraA, auraB, auraC, ...arcGlow, pain].forEach(o => o.update && o.update(t));

    // 光弧：冷开场里扩大、散去；mri 段跟着脑里的波一起长；ask 段又亮起
    let ar = .2, aa = 0;
    if (t < end('hook2')) { const k = clamp(t / (at('hook2', 2.2))); ar = lerp(.12, .8, easeOut(k)); aa = Math.min(1, t / .25) * (1 - smooth((t - at('hook2', 1.4)) / 1.2)); }
    else if (t >= at('mri') && t < end('mri2')) { const k = clamp((t - at('mri', .4)) / (end('mri2') - at('mri', .4))); ar = lerp(.2, 1.0, k); aa = win(t, at('mri', .3), end('mri2'), .6, .5); }
    else if (t >= at('q2') && t < at('q2', 1.2)) { ar = 1.0; aa = 1 - smooth((t - at('q2')) / .8); }
    else if (t >= at('ask')) { const k = clamp((t - at('ask')) / 6); ar = lerp(.25, .6, easeOut(k)); aa = smooth((t - at('ask', .2)) / .8); }
    aura.scale.setScalar(ar); aura.rotation.z = .03 * Math.sin(t * .7);
    const pageA = Math.max(1 - smooth((t - at('hook2', .6)) / 1.0), win(t, at('ask', .2), end('ask'), .8, .5));
    page.visible = pageA > .01; panel.material.opacity = pageA;
    words.forEach(w => {
      const d = Math.hypot(w.position.x, w.position.y) / Math.max(ar, .01);
      const eaten = d < .92 ? .08 : d < 1.12 ? .35 + .65 * Math.abs(Math.sin(t * 19 + w.position.x * 40)) : 1;
      w.material.opacity = .8 * pageA * (aa > .05 ? eaten : 1);
    });
    auraFade(aa * (.85 + .15 * Math.sin(t * 23)));                  // 先兆的闪烁

    // 头：冷开场 hook2 起出现，世界段远去时淡
    head.fade(Math.max(win(t, at('hook2', .3), at('world', 2.5), 1.0, 1.2), win(t, at('light', .6), end('light', .4), 1.0, .8)));
    pain.material.uniforms.uOpacity.value = (t >= at('hook2', 1.2) && t < end('hook3') ? .35 + .65 * Math.max(pulse(t, at('hook2', 1.6), .5), pulse(t, at('hook2', 2.4), .5), pulse(t, at('hook3', .4), .5), pulse(t, at('hook3', 1.3), .5)) : 0)
      + (t >= at('cgrp') && t < end('cgrp2') ? .25 + .5 * Math.abs(Math.sin(t * 3.2)) : 0);


    // 纸：冷开场和世界段不出现
    const pv = win(t, at('hook4', .2), at('calc', 1.0), .6, .8) + win(t, at('lesson', .3), end('lesson', .5), .8, .6);
    const paperDim = 1;
    paper.material.opacity = clamp(pv); paper.material.transparent = true; paper.visible = pv > .01; warm.intensity = 5 * clamp(pv) * paperDim;
    // 纸上的弧：hook4 画出第一道；lashley 段一道道补齐；title 段整体发光；lesson 段微光
    arcs.forEach((a, k) => {
      const t0 = k === 0 ? at('hook4', 1.2) : at('lashley') + k * .55, d = k === 0 ? 1.6 : .5;
      a.line.geometry.setDrawRange(0, Math.floor(a.n * clamp((t - t0) / d)));
    });
    arcGlow.forEach((g, k) => {
      const t0 = k === 0 ? at('hook4', 1.0) : at('lashley') + k * .55, d = k === 0 ? 1.8 : .55;
      const n = g.geometry.getAttribute('position').count;
      g.geometry.setDrawRange(0, Math.floor(n * clamp((t - t0) / d)));
      g.material.uniforms.uOpacity.value = clamp(pv) * (1 + .6 * win(t, at('lesson'), end('lesson'), .8, .6));
    });

    // 大脑里的波：calc / q1 段从后脑往前推；mri 段再推一次
    let wd = 0, won = 0;
    if (t >= at('calc', .6) && t < end('q1')) { wd = (t - at('calc', .6)) * .32; won = win(t, at('calc', .6), end('q1', -.4), .5, .5); }
    if (t >= at('mri', .3) && t < end('mri2')) { wd = (t - at('mri', .3)) * .3; won = win(t, at('mri', .3), end('mri2'), .5, .5); }
    wave(bCol, bBase, bDist, wd, .12, won);
    // 情绪段：脑里的波平息，整颗大脑转成暖金色
    const warmK = win(t, at('light', .8), end('lesson'), 1.2, .8);
    if (warmK > 0) { const a = bCol.array; for (let i = 0; i < a.length; i += 3) { a[i] = lerp(a[i], 1.25, warmK); a[i + 1] = lerp(a[i + 1], .82, warmK); a[i + 2] = lerp(a[i + 2], .42, warmK); } bCol.needsUpdate = true; }

    // 皮层薄片：leao 段从中心扩散
    slice.fade(win(t, at('q1', 1.5), at('mri', 1.0), .8, .8));
    sRing.face(camera); sRing.fire(t, at('leao', .4), 1.0, 2.5);
    let sd = 0, son = 0;
    if (t >= at('leao', .5)) { sd = (t - at('leao', .5)) * .28; son = win(t, at('leao', .5), end('leao3'), .3, .6); }
    wave(sCol, sBase, sDist, sd, .16, son);

    // 血管和分子
    const vOn = win(t, at('q2', .6), at('world', 1.5), .6, .8);
    vessel.fade(vOn); vessel.draw(clamp((t - at('q2', .6)) / 1.0));
    const swell = t >= at('cgrp') && t < at('result', 1.5) ? .3 + .35 * Math.abs(Math.sin(t * 3.2)) * (1 - smooth((t - at('result')) / 1.5)) : 0;
    vessel.scale.setScalar(1 + swell * .12);
    const nMol = t < at('cgrp', .4) ? 0 : t < at('cgrp2') ? 25 * clamp((t - at('cgrp', .4)) / 2.5) : t < at('drug') ? 25 + 45 * clamp((t - at('cgrp2')) / 3) : 70;
    const blocked = smooth((t - at('drug', .6)) / 1.2), fadeMol = 1 - smooth((t - at('result', 1.0)) / 2.0);
    mol.forEach((o, i) => {
      const on = i < nMol ? 1 : 0;
      o.m.material.opacity = on * vOn * fadeMol * (1 - .55 * blocked);
      o.m.material.color.set(blocked > .5 ? '#8f98a4' : '#ffae4a');
      const wob = .03 * Math.sin(t * 2 + i), bounce = blocked * .12 * (1 - Math.abs(Math.sin(t * 1.6 + i)));
      o.m.position.copy(o.base).addScaledVector(o.off, wob * 10 + bounce * 6);
    });
    locks.forEach((l, i) => { const k = smooth((t - at('drug', .4) - i * .12) / .25); l.visible = k > 0 && t < at('world', 1.5); l.scale.setScalar(.001 + (k ? 1.6 - .6 * k : 0)); });

    // 全世界的光点、房间
    const wk = win(t, at('world', .3), at('light', 1.6), 1.2, 1.0);
    world.material.uniforms.uBase.value = wk; world.setScale(1 + 1.5 * wk); scene.fog.density = lerp(.018, .003, wk);
    const rk = win(t, at('light', .2), end('light', .6), 1.0, .8);
    room.visible = false;
    arcs.forEach(a => { a.line.visible = false; });
  };
}
