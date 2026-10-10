// 方向 C「一口藻井」：仰看窟顶。正中一朵莲花，莲心里是这一朝的画；镜头每次往莲心里钻，钻进去就是下一朝。
SCENES['dirC'] = (() => { const { C, W, H, F } = DH;
  return { draw(c, lt, t) {
    const cx = 960, cy = 540;
    c.drawImage(DH.wall('C', C.redDk, '#4a1a10', 8), 0, 0);
    // 两侧：团花砖
    for (let x = 0; x < W; x += 120) for (let y = 0; y < H; y += 120) { if (Math.abs(x + 60 - cx) < 540) continue; DH.lotus(c, x + 60, y + 60, 40, (x + y) * 0.01); }
    // 藻井：外框垂幔 → 方井（石绿）→ 斗四（转 45° 的石青方）→ 圆：莲瓣一圈 → 莲心画
    c.save(); c.translate(cx, cy);
    const S = 1000; c.fillStyle = C.green; c.fillRect(-S / 2, -S / 2, S, S);
    c.save(); c.translate(-S / 2, -S / 2); DH.pearlBand(c, 0, 0, S, 30); DH.pearlBand(c, 0, S - 30, S, 30); c.restore();
    c.save(); c.translate(-S / 2, -S / 2 + 30); DH.valance(c, 0, 0, S, { tri: 50, h: 36, ph: t * 2 }); c.restore();
    c.save(); c.rotate(Math.PI / 4); const S2 = 700; c.fillStyle = C.blue; c.fillRect(-S2 / 2, -S2 / 2, S2, S2); c.strokeStyle = C.white; c.lineWidth = 6; c.strokeRect(-S2 / 2 + 14, -S2 / 2 + 14, S2 - 28, S2 - 28); c.strokeStyle = C.line; c.lineWidth = 3; c.strokeRect(-S2 / 2, -S2 / 2, S2, S2); c.restore();
    // 四角飞动的小莲
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], k) => DH.lotus(c, sx * 380, sy * 380, 50, t * 0.6 + k));
    // 莲瓣环（慢转）
    c.save(); c.rotate(t * 0.15); for (let k = 0; k < 16; k++) { c.save(); c.rotate(k * Math.PI / 8); F(c, DH.sm([[0, -300], [-60, -360], [0, -430], [60, -360]]), k % 2 ? C.white : C.green2, 2.4); c.restore(); } c.restore();
    c.restore();
    // 莲心：圆窗里是汉·驼队
    c.save(); c.beginPath(); c.arc(cx, cy, 300, 0, Math.PI * 2); c.clip();
    c.translate(cx, cy); c.scale(0.42, 0.42); c.translate(-960, -620);
    c.fillStyle = '#e6d3a8'; c.fillRect(-200, 0, 2400, 1200); DH.han(c, t, { pan: lt * 30 });
    c.restore();
    c.strokeStyle = C.gold; c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, 300, 0, Math.PI * 2); c.stroke(); c.strokeStyle = C.line; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 306, 0, Math.PI * 2); c.stroke();
    DH.bangti(c, 1560, 160, ['张骞通西域', '公元前一三八年'], { size: 40 });
    DH.petals(c, t, { n: 18 });
    if (!window.NOFADE) DH.fade(c, 'C', { keep: [[cx - 320, cy - 320, cx + 320, cy + 320]], amt: 0.31 });
  } }; })();
