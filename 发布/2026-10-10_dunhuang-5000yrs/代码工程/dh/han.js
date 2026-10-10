// 设定帧共用内容：汉·丝路驼队（在 0..1920 × 0..1080 坐标里画，调用方负责平移缩放和裁切）
(() => {
const { C, F } = DH;
DH.han = (c, t, { pan = 0 } = {}) => {
  // 远山（石青、石绿交替）
  c.save(); c.translate(-pan * 0.4, 0);
  DH.hills(c, [[160, 640, 420, 230], [520, 620, 380, 260], [880, 650, 460, 220], [1260, 630, 400, 250], [1640, 650, 460, 230], [2000, 640, 420, 240], [2360, 640, 420, 220]], { seed: 3 });
  c.restore();
  c.save(); c.translate(-pan * 0.7, 0);
  DH.hills(c, [[0, 760, 360, 170], [360, 770, 300, 150], [1120, 770, 340, 160], [1480, 760, 300, 140], [2200, 770, 340, 160]], { col: C.green2, dk: C.green, seed: 5, edge: 20 });
  c.restore();
  // 沙地
  c.fillStyle = '#c99a62'; c.fillRect(-10, 760, 1940, 330);
  c.strokeStyle = 'rgba(122,46,30,.45)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); for (let x = -10; x < 1940; x += 10) { const y = 790 + k * 46 + Math.sin((x + pan + k * 90) * 0.012) * 8; x < 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  // 云
  [[300, 180, 1.1, 0], [900, 130, 0.9, 1], [1500, 200, 1.2, 2], [1900, 120, 0.8, 3]].forEach(([x, y, s, k]) => DH.cloud(c, ((x - t * (30 + k * 8) - pan * 0.2) % 2200 + 2200) % 2200 - 140, y + Math.sin(t * 1.3 + k) * 5, s, t, t * 3 + k));
  // 驼队：三峰骆驼 + 两个牵驼人，从左往右走
  const ph = t * 4.2;
  DH.walker(c, 1530, 900, 1.25, ph + 1.2, { robe: C.red, hat: 'futou', jie: true });
  DH.camel(c, 1270, 790, 1.15, ph);
  DH.walker(c, 980, 900, 1.2, ph + 2.6, { robe: C.green, hat: C.red });
  DH.camel(c, 720, 800, 1.05, ph + 1.7, { col: '#d89a5a' });
  DH.camel(c, 260, 806, 0.98, ph + 3.1, { col: C.ochre2 });
};
})();
