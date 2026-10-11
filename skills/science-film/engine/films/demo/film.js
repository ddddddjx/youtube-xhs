// 引擎演示：一颗绿藻在光柱里，开关控制蓝光；推近眼点；画一张对比小图；片名卡。
export const post = {};

export async function setup(c) {
  const { THREE, scene, camera, hud, W, H, at, end, prog, smooth, pulse, cameraRig, project } = c;
  scene.background = new THREE.Color('#06161c');
  scene.fog = new THREE.FogExp2('#06161c', .035);

  const motes = c.particles({ n: 1400, box: [16, 26, 16], size: [2, 5], color: ['#7fe0c8', '#5fb8a0'], opacity: .55 });
  const bokeh = c.particles({ n: 26, box: [10, 16, 3], center: [0, 0, 5.5], size: [40, 110], color: ['#3d9c86', '#1f5f6a'], opacity: .22, soft: .9, seed: 3 });
  const rays = c.rays({ n: 6, color: '#d6f0d4', spread: 10, length: 40, tilt: -.35, opacity: .05 });
  const cell = c.jelly({ r: 1, scale: [.85, 1.1, .85], color: '#1f7a4a', rim: '#c8f7dc', inner: .45 });
  const eyespot = c.cloud({ sampler: c.shapes.ellipsoid(.16, .16, .1), n: 260, color: '#ff8a3c', size: [2, 4], links: 0, seed: 21 });
  eyespot.position.set(.42, .35, .55); cell.add(eyespot);
  const beam = c.beam({ from: [-.4, 9, 2], to: [.4, .3, .5], r0: .05, r1: .5, color: '#3fa9ff' });
  const ring = c.ring({ color: '#9fd8ff', r: .45 }); ring.position.copy(eyespot.position); cell.add(ring);
  scene.add(motes, bokeh, rays, cell, beam);

  // 开关：hook1 开、hook2 前半关、后半再开
  const flips = [at('hook1', .15), at('hook2', .1), at('hook2', 1.6)];
  const on = t => flips.filter(f => t >= f).length % 2 === 1;
  const lastFlip = t => Math.max(-9, ...flips.filter(f => t >= f));

  const rig = cameraRig(camera, [
    { t: 0, pos: [0, .2, 7], look: [0, 0, 0], fov: 42 },
    { t: at('hook2', 2.4), pos: [.3, .3, 6], look: [0, 0, 0], fov: 42 },
    { t: at('eye', .9), pos: [1.0, .8, 2.4], look: [.42, .35, .55], fov: 40, zoom: true },
    { t: at('fast', 0), pos: [1.0, .8, 2.4], look: [.42, .35, .55], fov: 40 },
    { t: at('fast', 1.0), pos: [.4, 2.4, 7.5], look: [.2, 2.0, 0], fov: 42 },
    { t: at('title'), pos: [.4, 2.4, 7.5], look: [.2, 2.0, 0], fov: 42 },
    { t: end('title'), pos: [0, -2, 12], look: [0, 0, 0], fov: 46, zoom: true },
  ]);

  const toggle = hud.add(new c.Toggle({ from: at('hook1'), to: end('hook2'), x: W * .72, y: H * .2, label: '蓝光', state: on,
    switchK: t => { const k = smooth((t - lastFlip(t)) / .18); return on(t) ? k : 1 - k; } }));
  hud.add(new c.Label({ from: at('eye', .8), to: end('eye'), x: W * .08, y: H * .2, zh: '眼点', en: 'eyespot', note: '细胞表面一个橙红色的小点',
    anchor: () => project(eyespot, camera, W, H) }));
  hud.add(new c.Chapter({ from: at('fast'), to: end('fast'), year: '1991', title: '黑格曼 · 眼点电流', cite: 'Harz & Hegemann · Nature · 1991' }));
  hud.add(new c.Chart({ from: at('fast', .2), to: end('fast'), x: W * .12, y: H * .3, w: 560, h: 200, xr: [0, 12], yr: [0, 1], ticks: [0, 5, 10],
    xlabel: '时间（毫秒）', ylabel: '电信号', big: '≈ 0.5', unit: '毫秒', bigAt: 1.2,
    series: [{ name: '绿藻', color: '#7BE0A0', pts: [[0, 0], [.4, 0], [.6, .8], [1.2, .95], [6, 1]] },
             { name: '人眼', color: '#b7a6ff', pts: [[0, 0], [9.5, 0], [10.5, .2], [12, .5]], delay: .9 }] }));
  hud.add(new c.Toggle({ from: at('ask'), to: end('ask', 1), x: W * .5, y: H * .2, label: '蓝光', state: () => true }));
  hud.add(new c.TitleCard({ from: at('title', .2), to: end('title'), title: '追光', kicker: 'OPTOGENETICS', subtitle: '3 分钟看懂 · 引擎演示' }));
  hud.add(new c.Corner({ text: '示意' }));

  return t => {
    rig(t);
    [motes, bokeh, rays, cell].forEach(o => o.update(t));
    const lit = on(t) ? 1 : 0, sinceFlip = t - lastFlip(t);
    beam.power(on(t) ? smooth(sinceFlip / .12) : 1 - smooth(sinceFlip / .1));
    cell.glow(.25 * lit);
    // 开着灯时细胞朝光转身、慢慢游；关灯停住
    const swim = flips.reduce((acc, f, i) => acc + (i % 2 === 0 ? Math.max(0, Math.min(t, flips[i + 1] ?? 1e9) - f) : 0), 0);
    cell.rotation.z = -.25 * Math.sin(swim * 1.4); cell.position.y = swim * .08;
    ring.face(camera); ring.fire(t, Math.max(...flips.filter(f => t >= f && on(f + .01)), -9), 1.0);
    if (t > at('fast', .3)) ring.fire(t, at('fast', .5), 1.2, 3);
  };
}
