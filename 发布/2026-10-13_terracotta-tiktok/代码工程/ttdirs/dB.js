// 方向 B「铁锹」：1974 年，一把铁锹砸进土里，土块崩开，下面一张陶脸
SCENES['dB'] = { draw(c, lt, t) { const { C, F } = TT; c.fillStyle = C.earth; c.fillRect(0, 0, 1080, 1920); c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(TT.grain('soil', 1080, 1920, '#d0b090', 9, 40), 0, 0); c.restore();
  const hx = 540, hy = 1000, s = 1.9; TT.head(c, hx, hy, s, { keyBase: 'B', v: { mus: 1 } });
  // 土块：盖住脸的一半，往外崩
  const r = U.rng(11), q = U.ease.out(U.clamp((lt - 0.3) / 0.8));
  for (let k = 0; k < 26; k++) { const a = r() * 6.28, d = 120 + r() * 380, x0 = hx + Math.cos(a) * d * 0.7, y0 = hy - 80 + Math.sin(a) * d * 0.6, sz = 60 + r() * 120;
    const x = x0 + Math.cos(a) * q * 260, y = y0 + Math.sin(a) * q * 200 + q * q * 200;
    c.save(); c.translate(x, y); c.rotate(r() * 3 + q * (r() - .5) * 2); const p = TT.sm([[-sz, -sz * 0.4], [-sz * 0.2, -sz * 0.7], [sz * 0.8, -sz * 0.3], [sz * 0.6, sz * 0.5], [-sz * 0.5, sz * 0.6]]); F(c, p, k % 3 ? C.earth2 : '#5a4434', 2, 'rgba(0,0,0,.5)'); c.restore(); }
  // 铁锹刃（前景，右上斜插）
  c.save(); c.translate(760, 560 + (1 - q) * -200); c.rotate(-0.5); F(c, new Path2D('M-90 0 L90 0 L70 260 Q0 310 -70 260 Z'), '#6a6a68', 4, '#222'); F(c, new Path2D('M-16 -600 L16 -600 L16 0 L-16 0 Z'), '#7a5030', 3, '#222'); c.restore();
  TT.dust(c, t, { n: 80, a: 0.7 }); TT.subs(c, ['1974. A farmer', 'digs a well...'], '1974 年，一个农民在挖井……', { y: 1500, size: 92 }); } };
