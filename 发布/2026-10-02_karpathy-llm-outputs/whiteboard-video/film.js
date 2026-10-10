// 让 AI 说人话 — Whiteboard Explainer, vertical 1080×1920. One tall board read top to bottom, no hands.
// VO start times live in VO; board beats hang off the spoken text via at(id, '词') (proportional to characters, no ASR here).
import * as W from './engine/wb.js';
import { clamp, lerp, TAU, mulberry } from '/core/lib.js';

export const SW = 1080, SH = 1920;
W.setView(SW, SH);
const { INK } = W;
export const BPM = 96, BEAT = 60 / BPM;
export const VO = { v01: 0.6, v02: 4.1, v03: 8.6, v04: 13.7, v05: 19.0, v06: 26.6, v07: 29.9, v08: 32.2, v09: 35.3, v10: 38.9, v11: 43.6, v12: 46.4 };
export const END = 51.2;
const SIL1 = [23.9, 24.5], SIL2 = [38.2, 38.8];         // the two silences: before the eraser, before the reveal

export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const HZ = await (await fetch('fonts/hanzi.json')).json();
  const lines = await (await fetch('lines.json')).json();
  const DUR = await (await fetch('voices/dur.json')).json();
  const L = Object.fromEntries(lines.map(l => [l.id, l]));
  // time when the spoken text of line id reaches substring w (k-th occurrence), proportional to characters of what is said
  const at = (id, w, end = false, k = 0) => {
    const s = (L[id].say || L[id].text).replace(/\s/g, ''); let i = -1;
    for (let n = 0; n <= k; n++) i = s.indexOf(w, i + 1);
    if (i < 0) throw new Error(`${w} not in ${id}`);
    return VO[id] + DUR[id] * (i + (end ? w.length : 0)) / s.length;
  };
  const vend = id => VO[id] + DUR[id];

  const tl = new W.Timeline();
  const K = new W.Pen('black', INK.black, { park: [1320, 1500] });
  const O = new W.Pen('orange', INK.orange, { park: [1380, 1250] });
  const B = new W.Pen('blue', INK.blue, { park: [1280, 1700] });
  const PENS = [K, O, B];

  // ───────── mixed handwriting: hanzi from stroke-order medians (makemeahanzi), Latin from the single-line font
  // y = baseline of the hanzi em box; s = em size. Returns Stroke[] in writing order, with .width
  const PUNCT = {                                          // drawn in the same hand, em units 0..1 (y down)
    '，': [[[.22, .78, .27, .84, .25, .93, .18, .99]]],
    '。': [[[.25, .80, .19, .85, .21, .93, .29, .95, .34, .88, .30, .81, .24, .80]]],
    '：': [[[.45, .38, .47, .40]], [[.45, .80, .47, .82]]],
    '←': [[[.95, .55, .08, .55]], [[.30, .36, .07, .55, .30, .74]]],
    '≤': [[[.80, .20, .22, .45, .80, .66]], [[.22, .84, .80, .84]]],
    '=': [[[.20, .45, .80, .45]], [[.20, .66, .80, .66]]],
  };
  function htext(str, x, y, o = {}) {
    const s = o.s ?? 96, adv = o.adv ?? 1.0, R = mulberry(o.seed ?? (x * 7 + y * 13) | 0), out = [];
    const w = o.w ?? Math.max(6, s * .085);
    let cx = x;
    for (const ch of str) {
      if (ch === ' ') { cx += s * .35; continue; }
      const rot = (R() - .5) * .06, dy = (R() - .5) * s * .05, sc = 1 + (R() - .5) * .06;
      const mk = (pts, kind = 'text') => {                // em coords (0..1, y down) → world, with per-glyph jitter
        const p = [];
        for (let i = 0; i < pts.length; i += 2) {
          const px = (pts[i] - .5) * s * sc, py = (pts[i + 1] - .5) * s * sc;
          p.push(cx + s / 2 + px * Math.cos(rot) - py * Math.sin(rot), y - s / 2 + dy + px * Math.sin(rot) + py * Math.cos(rot));
        }
        return new W.Stroke(p, { w, color: o.color, jitter: .3, wav: 90, kind, smooth: 1 });
      };
      if (HZ[ch]) {
        for (const m of HZ[ch]) out.push(mk(m.flatMap(([mx, my]) => [mx / 1024, (900 - my) / 1024])));
        cx += s * adv;
      } else if (PUNCT[ch]) {
        for (const [pts] of PUNCT[ch]) out.push(mk(pts));
        cx += s * (/[，。：]/.test(ch) ? .55 : adv);
      } else {                                             // Latin / digits from the single-line font
        const h = s * .62, t = W.text(ch, cx, y - s * .14, { h, color: o.color, w: w * .95, seed: R() * 1e6 | 0 });
        out.push(...t); cx += t.width * 1.04;
      }
    }
    out.width = cx - x; return out;
  }
  const hwidth = (str, s, adv = 1) => { let n = 0; for (const ch of str) n += HZ[ch] ? adv : /[，。：]/.test(ch) ? .55 : ch === ' ' ? .35 : PUNCT[ch] ? adv : .48; return n * s; };
  const hcenter = (str, cx, y, o = {}) => htext(str, cx - hwidth(str, o.s ?? 96, o.adv) / 2, y, o);

  // ───────── layout (world units, board 1400 × 6200)
  const BW = 1400, BH = 5900, CX = 700;
  const A = { y: 960 }, Bz = { y: 2150 }, C = { y: 2950 }, D = { y: 3700 }, E = { y: 5000 };

  // ghost marks: faint residue of old lessons
  const ghosts = [], gR = mulberry(77);
  for (let i = 0; i < 34; i++) {
    const x = gR() * 1200 + 100, y = gR() * 6000 + 100, k = gR();
    const o = { w: 11, alpha: .05 + gR() * .05, color: gR() < .25 ? '#8aa0c8' : '#9aa0a8' };
    if (k < .3) ghosts.push(...W.text(['x = 4', 'Q3', 'v2', 'todo', '→ 12', 'ok', 'p.17', 'API'][i % 8], x, y, { h: 44 + gR() * 30, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 40 + gR() * 90, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 400, y + (gR() - .5) * 260, o));
    else ghosts.push(W.line(x, y, x + 160 + gR() * 380, y + (gR() - .5) * 60, o));
  }

  // ───────── 1 · the tangle (AI's answer)
  const tangle = (() => {                                  // one long looping line that knots up
    const R = mulberry(5), p = []; let a = 0;
    for (let i = 0; i <= 520; i++) {
      const u = i / 520, r = 60 + 230 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (.55 + .45 * Math.sin(u * 23.1 + 1.3));
      a += .19 + .07 * Math.sin(i * .37);
      p.push(CX - 330 + 660 * u + Math.cos(a) * r * .55, A.y + 40 + Math.sin(a) * r * .72 + Math.sin(u * 9) * 30);
    }
    return W.curve(p, { w: 9 });
  })();
  const titleEnd = tl.draw(K, hcenter('AI 的回答', CX, A.y - 360, { s: 120 }), at('v01', '诶爱') + .02, { by: at('v01', '回答', true) + .1 });
  tl.draw(K, tangle, titleEnd + .08, { by: at('v01', '读完') + .2, tag: 'tangle' });
  // the orange question mark lands on 没懂
  const qm = [W.curve([[1090, A.y + 160], [1088, A.y + 60], [1150, A.y + 30], [1205, A.y + 60], [1200, A.y + 130], [1150, A.y + 180], [1145, A.y + 260]], { w: 12, over: 4 }), W.line(1145, A.y + 320, 1146, A.y + 322, { w: 18 })];
  tl.draw(O, qm, at('v01', '没懂') - .05, { by: vend('v01') + .2 });

  // ───────── 2 · the maintenance manual (plane, wrench, name)
  const py0 = Bz.y - 330;
  const plane = [
    W.curve([[360, py0], [470, py0 + 8], [760, py0 + 6], [960, py0 + 18], [1040, py0 + 52], [990, py0 + 88], [760, py0 + 96], [470, py0 + 90], [380, py0 + 76], [360, py0]], { w: 9, smooth: 2 }),
    W.poly([[380, py0 + 4], [330, py0 - 120], [400, py0 - 118], [500, py0 + 8]], { w: 9 }),
    W.poly([[650, py0 + 80], [530, py0 + 230], [610, py0 + 234], [790, py0 + 86]], { w: 9 }),
    ...[0, 1, 2, 3, 4, 5].map(i => W.line(600 + i * 62, py0 + 42, 604 + i * 62, py0 + 43, { w: 16 })),
  ];
  const plEnd = tl.draw(K, plane, at('v02', '给的'), { by: at('v02', '飞机') - .05, tag: 'plane' });
  tl.draw(K, hcenter('飞机维修手册', CX, Bz.y + 40, { s: 104 }), plEnd + .05, { by: vend('v02') + .2 });
  tl.draw(K, hcenter('ASD-STE100', CX, Bz.y + 200, { s: 96 }), vend('v02') + .3, { by: VO.v03 + .9 });
  // wrench on 拿扳手, orange ring around the plane on 一架飞机
  const wx = 300, wy = Bz.y + 330;
  const wrench = [W.line(wx, wy + 230, wx + 170, wy + 60, { w: 12 }), W.arc(wx + 205, wy + 25, 52, 2.6, 2.6 + 4.5, { w: 11 }), W.circle(wx - 10, wy + 242, 22, { w: 9 })];
  const wrEnd = tl.draw(K, wrench, at('v03', '拿扳手'), { by: at('v03', '人看') - .1 });
  tl.draw(K, htext('拿扳手的人', wx + 300, wy + 190, { s: 70 }), wrEnd + .06, { by: at('v03', '一句') + .4 });
  tl.draw(O, W.circle(CX, py0 + 30, 400, { ry: 230, w: 11, lap: .3 }), at('v03', '一架飞机') - .1, { by: vend('v03') + .2 });

  // ───────── 3 · the rules (blue)
  tl.draw(B, htext('一句 ≤ 20 词', 250, C.y, { s: 104 }), at('v04', '一句'), { by: at('v04', '个词', true) + .2 });
  tl.draw(B, htext('1 词 = 1 义', 250, C.y + 180, { s: 104 }), at('v04', '一个词') - .05, { by: vend('v04') + .25 });

  // ───────── 4 · the sentence, and the eraser that rewrites it
  const S = 100, X0 = 200, LY = [D.y - 130, D.y + 30, D.y + 190];
  const l1 = '在开始操作之前，', l2 = '请务必确保液压油箱', l3 = '已被充分补充。';
  const w0 = VO.v05 + .1, wE = SIL1[0] - .1, per = (wE - w0) / (l1.length + l2.length + l3.length);
  tl.draw(K, htext(l1, X0, LY[0], { s: S }), w0, { by: w0 + per * l1.length - .05 });
  tl.draw(K, htext(l2, X0, LY[1], { s: S }), w0 + per * l1.length, { by: w0 + per * (l1.length + l2.length) - .05 });
  tl.draw(K, htext(l3, X0, LY[2], { s: S }), w0 + per * (l1.length + l2.length), { by: wE });
  const box = (row, i0, n) => { const x = X0 + i0 * S, y = LY[row] - S; return [x + 8, y + 10, n * S - 16, S - 14]; };
  // back-and-forth passes; corners repeated so the engine's path smoothing can't round them off short of the box ends
  const sweep = ([x, y, w, h], n) => { const p = [], r = 38, xa = Math.min(x + r, x + w / 2), xb = Math.max(x + w - r, x + w / 2 + 1); for (let i = 0; i < n; i++) { const yy = y + h * (.18 + .64 * i / (n - 1)), xs = i % 2 ? [xb, xa] : [xa, xb]; for (const xx of xs) p.push([xx, yy], [xx, yy], [xx, yy]); } return p; };
  const eras = [[box(0, 0, 1), 3], [box(0, 5, 1), 3], [box(1, 0, 5), 3], [[X0 + 8, LY[2] - S + 10, 6.5 * S, S - 14], 3]];
  let te = SIL1[1];
  const ER = [];
  for (const [bx, n] of eras) {
    const d = .28 + bx[2] / 1100;
    tl.erase(sweep(bx, n), te, d, { width: 92, strength: .9 });
    ER.push(tl.erasers[tl.erasers.length - 1]); te += d + .22;
  }
  const eraseEnd = te - .22;
  tl.draw(O, htext('先把', X0 + 3 * S, LY[1], { s: S }), at('v06', '先把') - .05, { by: at('v06', '先把', true) + .15 });
  tl.draw(O, htext('加满。', X0, LY[2], { s: S }), at('v06', '加满') - .05, { by: vend('v06') + .2 });
  tl.draw(B, W.poly([[560, LY[2] - 50], [600, LY[2] - 10], [680, LY[2] - 110]], { w: 11 }), at('v07', '没少') - .1, { by: vend('v07') + .15 });

  // ───────── 5 · the ladder: text → diagram → web page → video
  const BXW = 460, BXH = 170, BX = 230, BY = [E.y - 520, E.y - 150, E.y + 220, E.y + 590];
  const labels = ['文字', '图', '网页', '视频'], spoken = ['文字', '图', '网页', '视频'];
  tl.draw(B, htext('还有更好的', BX, BY[0] - 90, { s: 80 }), at('v08', '还有'), { by: vend('v08') + .1 });
  let tc = 0;
  labels.forEach((lab, i) => {
    const t0 = at('v09', spoken[i]) - .15, t1 = (i < 3 ? at('v09', spoken[i + 1]) - .2 : vend('v09') + .25);
    const sh = [W.roundRect(BX, BY[i], BXW, BXH, 26, { w: 9 }), ...hcenter(lab, BX + BXW / 2, BY[i] + BXH / 2 + 46, { s: 92 })];
    if (i) sh.unshift(...W.arrow(BX + BXW / 2, BY[i - 1] + BXH + 25, BX + BXW / 2, BY[i] - 25, { w: 9, head: 28 }));
    tl.draw(K, sh, t0, { by: t1 });
  });
  // "← you are watching this" next to the video box
  tl.draw(O, htext('←你在看的', BX + BXW + 30, BY[3] + BXH / 2 + 38, { s: 76 }), at('v10', '你正在') - .05, { by: at('v10', '这条', true) + .05 });
  // the double circle around 文字
  tl.draw(O, W.circle(BX + BXW / 2, BY[0] + BXH / 2, 300, { ry: 135, w: 12, lap: TAU + .35, a0: -2.6 }), at('v11', '第一招') - .45, { by: vend('v11') + .35 });
  const capAt = vend('v12') + .55;
  tl.cue(capAt, 'cap');
  tl.cue(SIL1[0], 'silence'); tl.cue(SIL2[0], 'silence');
  tl.end();

  // ───────── camera (x, y, zoom): read the board top to bottom, pull back once, whip back to the answer
  const cam = new W.Camera([
    [0, CX, A.y - 20, 1.06], [3.6, CX, A.y - 10, 1.14, 0, 's'],
    [4.4, CX, A.y + 120, 1.10], [6.0, CX, Bz.y - 80, 1.04, 0, 'io'],               // ride down to the plane
    [8.6, CX, Bz.y - 60, 1.0], [10.5, CX, Bz.y + 30, .92, 0, 's'], [13.2, CX, Bz.y + 40, .92],
    [14.2, CX, C.y + 60, 1.10, 0, 'io'], [18.4, CX, C.y + 90, 1.14, 0, 's'],
    [19.4, 660, D.y + 60, 1.02, 0, 'io'], [SIL1[1], 660, D.y + 60, 1.04], [eraseEnd, 650, D.y + 60, 1.1, 0, 's'],
    [31.0, 650, D.y + 60, 1.1], [32.6, 580, E.y - 380, 1.02, 0, 'io'],          // track into the ladder
    [VO.v09, 580, E.y - 120, 1.02], [vend('v09'), 580, E.y + 80, 1.0, 0, 's'],
    [SIL2[1] + .4, 620, E.y + 160, 1.02, 0, 's'], [at('v10', '就是') + .05, 620, E.y + 170, 1.02],
    [at('v10', '出来', true) + .2, CX, 3396, .265, 0, 'io'],                          // the whole board
    [VO.v11 - .7, CX, 3396, .265], [VO.v11 - .1, BX + BXW / 2 + 20, BY[0] + BXH / 2, 1.42, 0, 'io'],   // whip back to 文字
    [END, BX + BXW / 2 + 20, BY[0] + BXH / 2 - 10, 1.5, 0, 's'],
  ]);

  // ───────── pens: park off-frame between phrases; the camera never shows a hand
  const pose = (p, t) => W.penPose(p, t, cam);
  // one felt eraser that hops between the four wipes
  function eraserPose(t) {
    const first = ER[0], last = ER[ER.length - 1];
    if (t < first.t0 - .45 || t > last.t1 + .5) return null;
    if (t < first.t0) { const u = (t - first.t0 + .45) / .45, [x, y] = first.path.start; return { x: x + 500 * (1 - u), y: y + 600 * (1 - u) ** 2, lift: 1 - u }; }
    if (t > last.t1) { const u = (t - last.t1) / .5, [x, y] = last.path.end; return { x: x + 500 * u, y: y + 600 * u * u, lift: u }; }
    for (let i = 0; i < ER.length; i++) {
      const e = ER[i];
      if (t >= e.t0 && t <= e.t1) { const [x, y] = e.path.at(e.path.len * (t - e.t0) / (e.t1 - e.t0)); return { x, y, lift: 0 }; }
      const n = ER[i + 1];
      if (n && t > e.t1 && t < n.t0) { const u = (t - e.t1) / (n.t0 - e.t1), s = u * u * (3 - 2 * u), [ax, ay] = e.path.end, [bx, by] = n.path.start; return { x: lerp(ax, bx, s), y: lerp(ay, by, s), lift: Math.sin(Math.PI * u) }; }
    }
    return null;
  }
  function drawEraserAt(ctx, p, t, c) {                    // the engine's felt eraser, drawn at a pose with lift
    if (!p) return;
    const [sx, sy] = W.toScreen(c, p.x, p.y), z = c.z, w = 92 * 1.9 * z, h = 92 * z, up = p.lift * 30 * z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.filter = `blur(${(8 + p.lift * 12) * z}px)`; ctx.fillStyle = `rgba(40,40,50,${.3 - p.lift * .1})`;
    ctx.beginPath(); ctx.roundRect(sx - w / 2 + 10 * z + up, sy - h / 2 + 16 * z + up, w, h, 14 * z); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(sx, sy - up); ctx.rotate(-.08 + Math.sin(t * 17) * .02);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#4a4f58'); g.addColorStop(.5, '#2e3239'); g.addColorStop(1, '#1d2025');
    ctx.fillStyle = '#c9c4ba'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2 + h * .72, w, h * .3, 8 * z); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h * .78, 14 * z); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 12 * z, -h / 2 + 8 * z, w - 24 * z, h * .16, 8 * z); ctx.fill();
    ctx.restore();
  }

  const board = new W.Board(tl, { W: BW, H: BH, ghosts });
  board.objs.push({ draw: (ctx, t, c) => drawEraserAt(ctx, eraserPose(t), t, c) });
  if (!new URLSearchParams(location.search).has('nopens')) board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, pose(p, t), c, t); } });

  // ───────── subtitles: clauses of each line, timed by characters
  const subs = [];
  for (const l of lines) {
    const parts = l.text.match(/[^，：。]+[，：。]?/g).reduce((acc, p) => {
      const last = acc[acc.length - 1];
      if (last != null && (last + p).replace(/[，。]$/, '').length <= 15) acc[acc.length - 1] += p; else acc.push(p); return acc;
    }, []);
    const tot = l.text.replace(/\s/g, '').length; let c0 = 0;
    for (const p of parts) {
      const n = p.replace(/\s/g, '').length;
      subs.push({ t0: VO[l.id] + DUR[l.id] * c0 / tot - .08, t1: VO[l.id] + DUR[l.id] * (c0 + n) / tot + .35, text: p.replace(/[，。：]$/, '') });
      c0 += n;
    }
  }
  for (let i = 0; i < subs.length; i++) {                   // hold ≥ 1.8 s unless the next caption needs the slot
    const nx = subs[i + 1]; subs[i].t1 = Math.max(subs[i].t1, subs[i].t0 + 1.8);
    if (nx) subs[i].t1 = Math.min(subs[i].t1, nx.t0 - .04);
  }
  window.__subs = subs;
  board.overlays.push({
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      ctx.font = '700 50px SUB';
      const w = ctx.measureText(s.text).width + 72, h = 92, y0 = SH - 150 - h;
      ctx.globalAlpha = a * .92; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(SW / 2 - w / 2, y0, w, h, 16); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = INK.orange; ctx.fillRect(SW / 2 - w / 2 + 24, y0 + h - 14, 40, 5);
      ctx.fillStyle = '#23262c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.text, SW / 2, y0 + h / 2 + 2);
    }
  });

  // ───────── frame render with camera motion blur on fast moves
  const off = new OffscreenCanvas(SW, SH), oc = off.getContext('2d');
  const Q = new URLSearchParams(location.search);
  if (Q.has('nosubs')) board.overlays.length = 0;
  function render(ctx, t) {
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(10, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); o.draw(ctx, t); ctx.restore(); }
  }

  const ev = [...tl.ev, ...Object.entries(VO).map(([id, t]) => ({ t, type: 'vo', id }))].sort((a, b) => a.t - b.t);
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - SW / 2) / 900, -.6, .6).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < SW + 100 && py > -100 && py < SH + 100 ? 1 : 0; }
  return { dur: END, render, ev, subs, cam, tl, cues: { BEAT, SIL1, SIL2, eraseStart: SIL1[1], eraseEnd, capAt, pull0: at('v10', '就是'), pull1: at('v10', '出来', true) + .2, whip: VO.v11 - .7, v: VO, subs } };
}
