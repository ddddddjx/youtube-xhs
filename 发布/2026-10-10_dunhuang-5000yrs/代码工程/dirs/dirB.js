// 方向 B「一盏灯」：黑暗的洞窟，一只手托着油灯，灯光照到哪里，哪一段壁画才亮起来。
SCENES['dirB'] = (() => { const { C, W, H } = DH;
  const mural = () => PAINT.cached('dirB_mural', W, H, () => {});
  return { draw(c, lt, t) {
    // 壁画（满墙）
    const m = PAINT.scratch('dirB_m'), g = m.getContext('2d'); g.reset();
    g.drawImage(DH.wall('B', '#b8603e', '#7a3020', 6), 0, 0);
    g.save(); g.translate(0, -60); DH.han(g, t, { pan: lt * 20 }); g.restore();
    DH.vineBand(g, 0, 0, W, 50, { ph: lt * 20 });
    DH.bangti(g, 120, 140, ['张骞通西域', '公元前一三八年'], { size: 40 });
    DH.fade(g, 'B', { keep: [[200, 500, 1700, 900]], amt: 0.32 });
    c.drawImage(m, 0, 0);
    // 灯光：灯在右下，光圈半径随火苗起伏；圈外是洞窟的暗
    const lx = 1452, ly = 790, fl = 1 + Math.sin(t * 17) * 0.02 + Math.sin(t * 29) * 0.015, R = 900 * fl;
    const dark = PAINT.scratch('dirB_d'), d = dark.getContext('2d'); d.reset();
    d.fillStyle = '#140a06'; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    const gr = d.createRadialGradient(lx - 260, ly - 160, 40, lx - 260, ly - 160, R); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.92)'); gr.addColorStop(0.8, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr; d.fillRect(0, 0, W, H);
    c.drawImage(dark, 0, 0);
    c.save(); c.globalCompositeOperation = 'soft-light'; const wg = c.createRadialGradient(lx, ly - 80, 10, lx, ly - 80, 700); wg.addColorStop(0, 'rgba(255,190,90,.75)'); wg.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = wg; c.fillRect(0, 0, W, H); c.restore();
    // 前景：托灯的手（只出手）
    DH.handUp(c, 1560, 800, 1.7, { a: -0.12 });
    DH.lamp(c, 1452, 846, 1.25, t);
    c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(1452, 790, 4, 1452, 790, 140); hg.addColorStop(0, 'rgba(255,200,100,.5)'); hg.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = hg; c.fillRect(1310, 650, 280, 280); c.restore();
  } }; })();
