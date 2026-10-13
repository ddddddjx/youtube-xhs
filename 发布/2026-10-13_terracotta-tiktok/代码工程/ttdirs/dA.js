// 方向 A「颜色死亡」：特写一张彩绘的脸，颜料 2 秒内卷曲剥落，露出灰陶
SCENES['dA'] = { draw(c, lt, t) { const { C } = TT; c.fillStyle = '#120c08'; c.fillRect(0, 0, 1080, 1920);
  const g = c.createRadialGradient(540, 760, 50, 540, 760, 900); g.addColorStop(0, 'rgba(120,80,50,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
  const s = 2.3, hx = 540, hy = 820; TT.head(c, hx, hy, s, { keyBase: 'A' });
  const layer = TT.paintLayer('Apaint', 1080, 1920, gg => TT.headPaint(gg, hx, hy, s));
  const p = U.clamp((lt - 0.6) / 2.0); c.drawImage(TT.peel(layer, 'A', p, 5), 0, 0);
  TT.dust(c, t, { n: 50 }); TT.subs(c, ["They weren't", 'always gray.'], '它们原本不是灰色的', { y: 1480, size: 96 }); } };
