// 方向 A「一匹丝」：横向长卷。一条丝绸飘带贯穿全片，带头往右飞，镜头跟着它横穿五千年。
SCENES['dirA'] = (() => { const { C, W, H } = DH;
  return { draw(c, lt, t) {
    const pan = lt * 60;
    c.drawImage(DH.wall('A', '#b8603e', '#7a3020', 5), 0, 0);
    // 画心：上下边饰之间
    c.save(); c.beginPath(); c.rect(0, 120, W, 860); c.clip();
    const sg = c.createLinearGradient(0, 120, 0, 700); sg.addColorStop(0, '#d2a878'); sg.addColorStop(1, '#ddb98a'); c.fillStyle = sg; c.fillRect(0, 120, W, 860);
    DH.han(c, t, { pan });
    // 丝绸：从左边画外进来，在驼队上方起伏，带头在右侧
    const pts = []; for (let i = 0; i <= 14; i++) { const q = i / 14; pts.push([-60 + q * 1720, 470 - Math.sin(q * 7.5 - t * 3.2) * 95 * (0.35 + q * 0.75) - q * 110 + Math.sin(q * 17 - t * 6) * 18 * q]); }
    DH.silk(c, pts, 34, { t });
    c.restore();
    DH.valance(c, 0, 74, W, { ph: t * 2 }); c.fillStyle = C.redDk; c.fillRect(0, 0, W, 74); DH.vineBand(c, 0, 20, W, 50, { ph: pan });
    DH.vineBand(c, 0, 980, W, 60, { ph: pan, bg: C.blue }); DH.pearlBand(c, 0, 1040, W, 40);
    DH.bangti(c, 70, 180, ['张骞通西域', '公元前一三八年'], { size: 40 });
    DH.petals(c, t, { n: 14, y0: 120, y1: 980 });
    DH.fade(c, 'A', { keep: [[150, 640, 1700, 980], [60, 170, 230, 540], [0, 280, 1700, 560]], amt: 0.3 });
  } }; })();
