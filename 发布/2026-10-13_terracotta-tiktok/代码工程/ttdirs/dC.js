// 方向 C「8000 张脸」：从一只眼睛猛地拉远，变成一整个坑的兵阵
SCENES['dC'] = { draw(c, lt, t) { const { C } = TT; c.fillStyle = '#2a1e16'; c.fillRect(0, 0, 1080, 1920);
  const z = Math.exp(-U.clamp(lt / 2.5) * 3.4) * 9 + 0.0;   // 9 → ~0.3
  c.save(); c.translate(540, 900); const zz = Math.max(0.3, z); c.scale(zz, zz);
  // 坑道：一排排俑，近大远小（用 y 位置模拟透视）
  for (let row = 14; row >= 0; row--) { const y = -900 + row * 130, sc = 0.45 + row * 0.04, n = 18;
    c.fillStyle = 'rgba(70,50,36,.9)'; c.fillRect(-2400, y - 10, 4800, 26);
    for (let i = -n; i <= n; i++) { const x = i * 120 * (0.8 + row * 0.02) + (row % 2) * 40; if (row === 7 && i === 0) continue; TT.soldier(c, x, y, sc, { v: i * 7 + row, dark: 0.2 - row * 0.01 }); } }
  TT.head(c, 0, -920 + 7 * 130 - 120 * 1.0, 0.45, { keyBase: 'C' });
  c.restore(); TT.dust(c, t, { n: 40 });
  TT.subs(c, ['8,000 soldiers.', 'No two faces alike.'], '八千兵俑，没有两张脸一样', { y: 1520, size: 88 }); } };
