// hud.js —— 叠在 3D 画面上的 2D 信息层：章节头、物体标签、数据小图、流程对比、开关、芯片、比例尺、清单、片名卡、字幕、署名。
// 每个元素是声明式的：setup 时 hud.add(...)，给出出现 / 消失时刻；draw 时按 t 画。texts() 用来预加载字体。
import { win, clamp, smooth, easeOut, lerp, TL } from './core.js';

export const C = {
  ink: '#EDE6D6', sub: 'rgba(237,230,214,.62)', faint: 'rgba(237,230,214,.38)', gold: '#E8B04B',
  line: 'rgba(237,230,214,.55)', chip: 'rgba(16,30,52,.72)', chipLine: 'rgba(120,170,255,.65)', blue: '#4FA8FF', green: '#7BE0A0',
};
export const F = {
  serif: '"Noto Serif SC", "Cormorant Garamond", serif',
  sans: '"Noto Sans SC", "Inter", sans-serif',
  latinSerif: '"Cormorant Garamond", "Noto Serif SC", serif',
  latin: '"Inter", "Noto Sans SC", sans-serif',
};

export class HUD {
  constructor(W, H) {
    this.W = W; this.H = H; this.u = Math.min(W, H) / 1080 * (H > W ? 1.3 : 1); this.items = [];  // 竖屏信息层放大 1.3 倍，手机上看得清
    this.portrait = H > W;
    // 安全区：竖屏避开抖音 / TikTok 的上 12%、下 25%、右 15%
    this.safe = this.portrait ? { l: W * .06, r: W * .85, t: H * .12, b: H * .75 } : { l: W * .05, r: W * .95, t: H * .07, b: H * .93 };
  }
  add(item) { item.hud = this; this.items.push(item); return item; }
  texts() { return this.items.flatMap(i => (i.texts ? i.texts() : [])); }
  draw(ctx, t) { for (const i of this.items) { const a = i.alpha(t); if (a > 0.002) { ctx.save(); ctx.globalAlpha = a; i.draw(ctx, t, a); ctx.restore(); } } }
  // 记录每帧文字框，qa 用它查重叠和出安全区
  boxes(t) { return this.items.filter(i => i.alpha(t) > .5 && i.box).map(i => ({ kind: i.constructor.name, ...i.box(t) })); }
}

class Item {
  constructor(o) { Object.assign(this, { fi: .4, fo: .3 }, o); }
  alpha(t) { return win(t, this.from, this.to, this.fi, this.fo); }
  rise(t) { return (1 - smooth((t - this.from) / this.fi)) * 6 * this.hud.u; }   // 入场上移 6px
}

function txt(ctx, s, x, y, font, color, { align = 'left', base = 'alphabetic', spacing = 0 } = {}) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  if (spacing) { ctx.letterSpacing = spacing + 'px'; }
  ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  return ctx.measureText(s).width;
}

// 章节头：大号衬线年份 | 人名 · 发现；下一行出处
export class Chapter extends Item {
  texts() { return [this.year, this.title, this.cite || ''] }
  draw(ctx, t) {
    const { u, safe } = this.hud, x = this.x ?? safe.l, y = (this.y ?? safe.t + 90 * u) - this.rise(t);
    const w = txt(ctx, this.year, x, y, `400 ${92 * u}px ${F.latinSerif}`, C.ink);
    ctx.fillStyle = C.line; ctx.fillRect(x + w + 18 * u, y - 62 * u, 1.5 * u, 66 * u);
    txt(ctx, this.title, x + w + 36 * u, y - 18 * u, `600 ${30 * u}px ${F.sans}`, C.ink, { spacing: 2 * u });
    if (this.cite) txt(ctx, '— ' + this.cite, x, y + 40 * u, `400 ${20 * u}px ${F.latin}`, C.sub);
  }
  box() { const { u, safe } = this.hud; return { x: this.x ?? safe.l, y: (this.y ?? safe.t + 90 * u) - 70 * u, w: 620 * u, h: 120 * u }; }
}

// 物体标签：中文名 + 英文小型大写 + 一行说明，引线连到 anchor()（返回屏幕坐标 {x,y}）
export class Label extends Item {
  texts() { return [this.zh, this.en || '', this.note || ''] }
  draw(ctx, t) {
    const { u } = this.hud, a = this.anchor(t), x = this.x, y = this.y - this.rise(t);
    const k = smooth((t - this.from) / .5);
    // 引线：文字下方一条短横线，从靠近锚点的那一端拉到锚点
    ctx.font = `700 ${30 * u}px ${F.serif}`; const tw = Math.max(ctx.measureText(this.zh).width, 140 * u);
    const ly = y + 64 * u, lx = a.x > x + tw / 2 ? x + tw : x;
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.2 * u; ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + tw * k, ly); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lerp(lx, a.x, k), lerp(ly, a.y, k)); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(a.x, a.y, 4 * u * k, 0, 7); ctx.fill();
    txt(ctx, this.zh, x, y, `700 ${30 * u}px ${F.serif}`, C.ink);
    if (this.en) txt(ctx, this.en.toUpperCase(), x, y + 28 * u, `500 ${16 * u}px ${F.latinSerif}`, C.sub, { spacing: 3 * u });
    if (this.note) txt(ctx, this.note, x, y + 52 * u, `400 ${17 * u}px ${F.sans}`, C.sub);
  }
  box(t) { const { u } = this.hud; return { x: this.x, y: this.y - 32 * u, w: 340 * u, h: 92 * u }; }
}

// 数据小图：折线（会长出来）+ 一个大号关键数字 + 参照线
// series: [{name, color, pts:[[x,y],...]}]（数据坐标），xr/yr 坐标范围，big：'≈ 0.5'，unit：'毫秒'
export class Chart extends Item {
  texts() { return [this.title || '', this.big || '', this.unit || '', this.xlabel || '', this.ylabel || '', ...(this.series || []).map(s => s.name), ...(this.notes || []).map(n => n.text)] }
  draw(ctx, t) {
    const { u } = this.hud, x = this.x, y = this.y - this.rise(t), w = this.w * u, h = this.h * u;
    const X = v => x + (v - this.xr[0]) / (this.xr[1] - this.xr[0]) * w, Y = v => y + h - (v - this.yr[0]) / (this.yr[1] - this.yr[0]) * h;
    if (this.title) txt(ctx, this.title, x - 10 * u, y - 60 * u, `600 ${30 * u}px ${F.sans}`, C.ink);
    ctx.strokeStyle = C.faint; ctx.lineWidth = 1.2 * u; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke();
    if (this.ylabel) txt(ctx, this.ylabel, x + 10 * u, y - 4 * u, `400 ${18 * u}px ${F.sans}`, C.sub);
    if (this.xlabel) txt(ctx, this.xlabel, x + w, y + h + 62 * u, `400 ${18 * u}px ${F.sans}`, C.sub, { align: 'right' });
    (this.ticks || []).forEach(v => txt(ctx, String(v), X(v), y + h + 30 * u, `400 ${18 * u}px ${F.latin}`, C.sub, { align: 'center' }));
    (this.series || []).forEach((s, i) => {
      const t0 = this.from + .3 + (s.delay || i * .6), k = clamp((t - t0) / (s.dur || 1.2));
      if (k <= 0) return;
      const P = s.pts, n = P.length - 1, upto = k * n;
      ctx.strokeStyle = s.color; ctx.lineWidth = 3 * u; ctx.shadowColor = s.color; ctx.shadowBlur = 12 * u; ctx.beginPath();
      for (let j = 0; j <= Math.floor(upto); j++) { const p = P[j]; j ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); }
      const j = Math.floor(upto); if (j < n) { const f = upto - j, p = [lerp(P[j][0], P[j + 1][0], f), lerp(P[j][1], P[j + 1][1], f)]; ctx.lineTo(X(p[0]), Y(p[1])); }
      ctx.stroke(); ctx.shadowBlur = 0;
      if (k >= 1) { const p = P[n]; ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 5 * u, 0, 7); ctx.fill();
        txt(ctx, s.name, X(p[0]) + 12 * u, Y(p[1]) - 10 * u, `600 ${22 * u}px ${F.sans}`, s.color); }
    });
    if (this.big) {
      const kb = smooth((t - this.from - (this.bigAt || .9)) / .5);
      ctx.globalAlpha *= kb;
      const [fx, fy] = this.bigPos || [.42, .72];                       // 大数字放在图里的空处，默认右下
      const bw = txt(ctx, this.big, x + w * fx, y + h * fy, `300 ${86 * u}px ${F.latinSerif}`, C.ink);
      if (this.unit) txt(ctx, this.unit, x + w * fx + bw + 8 * u, y + h * fy, `600 ${24 * u}px ${F.sans}`, C.ink);
    }
    (this.notes || []).forEach(nt => { if (t > this.from + (nt.at || 0)) txt(ctx, nt.text, X(nt.x), Y(nt.y), `600 ${20 * u}px ${F.sans}`, nt.color || C.ink); });
  }
  box() { const { u } = this.hud; return { x: this.x - 10 * u, y: this.y - 90 * u, w: this.w * u + 40 * u, h: this.h * u + 130 * u }; }
}

// 流程对比：rows: [{label, nodes:['收光','传话','开门'], end:'电流', color}]，逐节点亮起
export class Flow extends Item {
  texts() { return (this.rows || []).flatMap(r => [r.label || '', ...r.nodes, r.end || '', r.tail || '']) }
  draw(ctx, t) {
    const { u } = this.hud; let y = this.y - this.rise(t);
    this.rows.forEach((r, ri) => {
      const t0 = this.from + (r.at ?? ri * 1.2);
      if (r.label) txt(ctx, r.label, this.x, y, `600 ${22 * u}px ${F.sans}`, C.sub);
      let x = this.x; const yy = y + 34 * u;
      [...r.nodes, r.end].filter(Boolean).forEach((nd, i) => {
        const k = smooth((t - t0 - i * .25) / .3); if (k <= 0) return;
        ctx.globalAlpha = k * win(t, this.from, this.to, this.fi, this.fo);
        ctx.font = `600 ${20 * u}px ${F.sans}`; const tw = ctx.measureText(nd).width, pw = tw + 30 * u;
        const isEnd = i === r.nodes.length;
        if (!isEnd) { ctx.fillStyle = C.chip; ctx.strokeStyle = r.color || C.chipLine; ctx.lineWidth = 1.2 * u;
          ctx.beginPath(); ctx.roundRect(x, yy - 18 * u, pw, 36 * u, 18 * u); ctx.fill(); ctx.stroke(); }
        txt(ctx, nd, x + (isEnd ? 0 : 15 * u), yy + 7 * u, `600 ${20 * u}px ${F.sans}`, isEnd ? (r.color || C.gold) : C.ink);
        x += (isEnd ? tw : pw) + 12 * u;
        if (i < r.nodes.length) { txt(ctx, '→', x, yy + 7 * u, `400 ${20 * u}px ${F.latin}`, C.sub); x += 28 * u; }
      });
      if (r.tail && t > t0 + (r.nodes.length + 1) * .25) txt(ctx, r.tail, x + 8 * u, yy + 8 * u, `700 ${24 * u}px ${F.sans}`, r.color || C.gold);
      y += 84 * u;
    });
  }
  box() { const { u } = this.hud; return { x: this.x, y: this.y - 30 * u, w: 760 * u, h: this.rows.length * 84 * u + 20 * u }; }
}

// iOS 式开关：state(t) 返回 true/false；label 如 '蓝光'
export class Toggle extends Item {
  texts() { return [this.label + ' · 开', this.label + ' · 关'] }
  draw(ctx, t) {
    const { u } = this.hud, on = this.state(t), x = this.x, y = this.y, w = 92 * u, h = 52 * u;
    // 拨动动画：最近一次切换后 0.18s
    const k = this.switchK ? this.switchK(t) : (on ? 1 : 0);
    ctx.fillStyle = `rgba(${lerp(70, 64, k)},${lerp(70, 140, k)},${lerp(80, 255, k)},${lerp(.55, .95, k)})`;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#f5f7fb'; ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8 * u;
    ctx.beginPath(); ctx.arc(x - w / 2 + h / 2 + k * (w - h), y, h / 2 - 5 * u, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    if (k > .5) { ctx.strokeStyle = 'rgba(120,180,255,.5)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(x - w / 2 + h / 2 + k * (w - h), y, h / 2 + 6 * u, 0, 7); ctx.stroke(); }
    if (this.label) txt(ctx, `${this.label} · ${on ? '开' : '关'}`, x, y + h / 2 + 30 * u, `600 ${20 * u}px ${F.sans}`, C.ink, { align: 'center' });
  }
  box() { const { u } = this.hud; return { x: this.x - 60 * u, y: this.y - 30 * u, w: 120 * u, h: 90 * u }; }
}

// 胶囊芯片：'● 蓝光 | 470 nm'
export class Chip extends Item {
  texts() { return [this.a, this.b || ''] }
  draw(ctx, t) {
    const { u } = this.hud, y = this.y - this.rise(t);
    ctx.font = `600 ${22 * u}px ${F.sans}`; const wa = ctx.measureText(this.a).width;
    ctx.font = `400 ${20 * u}px ${F.latin}`; const wb = this.b ? ctx.measureText(this.b).width : 0;
    const w = 52 * u + wa + (this.b ? 30 * u + wb : 0), h = 44 * u, x = this.align === 'right' ? this.x - w : this.x;
    ctx.fillStyle = C.chip; ctx.strokeStyle = this.color || C.chipLine; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.roundRect(x, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.color || C.blue; ctx.beginPath(); ctx.arc(x + 22 * u, y, 5 * u, 0, 7); ctx.fill();
    txt(ctx, this.a, x + 38 * u, y + 8 * u, `600 ${22 * u}px ${F.sans}`, C.ink);
    if (this.b) { ctx.fillStyle = C.faint; ctx.fillRect(x + 50 * u + wa, y - 12 * u, 1 * u, 24 * u); txt(ctx, this.b, x + 64 * u + wa, y + 7 * u, `400 ${20 * u}px ${F.latin}`, C.sub); }
  }
  box() { const { u } = this.hud; return { x: this.align === 'right' ? this.x - 260 * u : this.x, y: this.y - 22 * u, w: 260 * u, h: 44 * u }; }
}

export class ScaleBar extends Item {
  texts() { return [this.text] }
  draw(ctx, t) {
    const { u } = this.hud, w = this.w * u; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(this.x - w / 2, this.y); ctx.lineTo(this.x + w / 2, this.y);
    ctx.moveTo(this.x - w / 2, this.y - 6 * u); ctx.lineTo(this.x - w / 2, this.y + 6 * u); ctx.moveTo(this.x + w / 2, this.y - 6 * u); ctx.lineTo(this.x + w / 2, this.y + 6 * u); ctx.stroke();
    txt(ctx, this.text, this.x, this.y + 26 * u, `400 ${18 * u}px ${F.latin}`, C.sub, { align: 'center' });
  }
}

// 清单：一条条累加（结果、数据），items: [{at, text}]（at 相对 from 的秒数）
export class Checklist extends Item {
  texts() { return this.items.map(i => i.text) }
  draw(ctx, t) {
    const { u } = this.hud;
    this.items.forEach((it, i) => {
      const k = smooth((t - this.from - it.at) / .4); if (k <= 0) return;
      ctx.globalAlpha = k * win(t, this.from, this.to, this.fi, this.fo);
      const y = this.y + i * 42 * u + (1 - k) * 6 * u;
      ctx.fillStyle = it.color || C.gold; ctx.beginPath(); ctx.arc(this.x, y - 8 * u, 4 * u, 0, 7); ctx.fill();
      txt(ctx, it.text, this.x + 18 * u, y, `600 ${24 * u}px ${F.sans}`, C.ink);
    });
  }
  box() { const { u } = this.hud; return { x: this.x - 10 * u, y: this.y - 30 * u, w: 600 * u, h: this.items.length * 42 * u + 20 * u }; }
}

// 片名卡：两个大字 + 副标题（字距加宽）+ 可选英文小字在上
export class TitleCard extends Item {
  texts() { return [this.title, this.subtitle || '', this.kicker || ''] }
  draw(ctx, t) {
    const { u, W, H } = this.hud, cx = this.x ?? W / 2, cy = this.y ?? H * (this.hud.portrait ? .4 : .42);
    const k = smooth((t - this.from) / 1.2), blur = (1 - k) * 18 * u;
    ctx.filter = blur > .3 ? `blur(${blur}px)` : 'none';
    if (this.kicker) txt(ctx, this.kicker, cx, cy - 120 * u, `500 ${18 * u}px ${F.latinSerif}`, C.sub, { align: 'center', spacing: 8 * u });
    ctx.shadowColor = 'rgba(255,240,210,.55)'; ctx.shadowBlur = 30 * u;
    txt(ctx, this.title, cx, cy, `700 ${(this.size || 130) * u}px ${F.serif}`, C.ink, { align: 'center', spacing: 12 * u });
    ctx.shadowBlur = 0;
    if (this.subtitle) txt(ctx, this.subtitle, cx, cy + 64 * u, `500 ${24 * u}px ${F.serif}`, C.sub, { align: 'center', spacing: 6 * u });
    ctx.filter = 'none';
  }
}

// 人物卡：名字 + 原名斜体 + 一句贡献 + 机构 · 出生年；锚定到 3D 物体下方
export class Person extends Item {
  texts() { return [this.zh, this.en, this.did, this.meta || ''] }
  draw(ctx, t) {
    const { u } = this.hud, a = this.anchor(t), y = a.y + 70 * u - this.rise(t);
    txt(ctx, this.zh, a.x, y, `700 ${28 * u}px ${F.serif}`, C.ink, { align: 'center' });
    txt(ctx, this.en, a.x, y + 26 * u, `italic 400 ${18 * u}px ${F.latinSerif}`, C.sub, { align: 'center' });
    txt(ctx, '• ' + this.did, a.x, y + 58 * u, `600 ${18 * u}px ${F.sans}`, C.green, { align: 'center' });
    if (this.meta) txt(ctx, this.meta, a.x, y + 82 * u, `400 ${15 * u}px ${F.sans}`, C.sub, { align: 'center' });
  }
}

// 自由文字（居中金句、问句）
export class Text extends Item {
  texts() { return [this.text] }
  draw(ctx, t) {
    const { u, W } = this.hud;
    txt(ctx, this.text, this.x ?? W / 2, this.y - this.rise(t), `${this.weight || 600} ${(this.size || 34) * u}px ${this.font || F.serif}`, this.color || C.ink, { align: this.align || 'center', spacing: (this.spacing || 2) * u });
  }
}

// 右下角「示意」、片尾署名
export class Corner extends Item {
  texts() { return [this.text || '示意'] }
  alpha(t) { return this.from === undefined ? .8 : super.alpha(t) * .8; }
  draw(ctx) { const { u, safe } = this.hud; txt(ctx, this.text || '示意', safe.r - 8 * u, safe.b - (this.hud.portrait ? 10 : 60) * u, `400 ${16 * u}px ${F.sans}`, C.faint, { align: 'right' }); }
}
export class Credits extends Item {
  texts() { return this.lines }
  draw(ctx) { const { u, W, H } = this.hud; this.lines.forEach((l, i) => txt(ctx, l, W / 2, (this.y ?? H * .62) + i * 24 * u, `400 ${15 * u}px ${F.latinSerif}`, C.faint, { align: 'center' })); }
}

// ---------- 字幕 ----------
// 跟节拍表逐字出现；key 关键词点金色；有 en 时英文一行在下、整句淡入。
export class Subtitles {
  constructor(hud, { cps = 9, size } = {}) { this.hud = hud; this.cps = cps; this.size = size; }
  texts() { return TL().beats.flatMap(b => [b.zh || '', b.en || '']); }
  draw(ctx, t) {
    const { W, H, portrait, safe } = this.hud, u = Math.min(W, H) / 1080;   // 字幕不吃竖屏 1.3 倍放大
    const b = TL().beats.find(x => t >= x.start && t < x.end + .25 && x.zh && !x.nosub);
    if (!b) return;
    let zhSize = (this.size || (portrait ? 56 : 38)) * u;
    const maxW = (safe.r - safe.l) * .96;
    ctx.font = `600 ${zhSize}px ${F.serif}`;
    const fullW = ctx.measureText(b.zh).width;
    if (fullW > maxW) zhSize *= maxW / fullW;                                   // 太长就整句缩小，不出安全区
    let enSize = Math.min(zhSize * .62, 36 * u);
    if (b.en) { ctx.font = `400 ${enSize}px ${F.latin}`; const ew = ctx.measureText(b.en).width; if (ew > maxW) enSize *= maxW / ew; }
    const y = portrait ? H * .70 : H * (b.en ? .86 : .9);
    const fadeOut = 1 - smooth((t - b.end) / .25);
    const chars = [...b.zh], n = chars.length;
    const speed = Math.max(this.cps, n / Math.max(.6, (b.end - b.start) * .55));   // 句子前 55% 时间内打完
    const shown = (t - b.start) * speed;
    ctx.font = `600 ${zhSize}px ${F.serif}`; ctx.textBaseline = 'alphabetic';
    const widths = chars.map(c => ctx.measureText(c).width), total = widths.reduce((a, c) => a + c, 0);
    let x = (safe.l + safe.r) / 2 - total / 2;
    const keyIdx = new Set(); if (b.key) { const i = b.zh.indexOf(b.key); if (i >= 0) for (let j = 0; j < [...b.key].length; j++) keyIdx.add([...b.zh.slice(0, i)].length + j); }
    // 字幕后面一条柔和的暗带：压在亮物体上也看得清
    const bandA = Math.min(1, (t - b.start) / .25) * fadeOut * .5, bh = zhSize * (b.en ? 3.4 : 2.2), by = y - zhSize * 1.3;
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, `rgba(2,8,14,${bandA})`); g.addColorStop(.75, `rgba(2,8,14,${bandA})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, by, W, bh);
    ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 10 * u;
    chars.forEach((c, i) => {
      const a = clamp(shown - i, 0, 1) * fadeOut; if (a <= 0) { x += widths[i]; return; }
      ctx.globalAlpha = a; ctx.fillStyle = keyIdx.has(i) ? C.gold : C.ink; ctx.fillText(c, x, y); x += widths[i];
    });
    if (b.en) {
      ctx.globalAlpha = smooth((t - b.start - .15) / .4) * fadeOut;
      txt(ctx, b.en, (safe.l + safe.r) / 2, y + enSize * 1.6, `400 ${enSize}px ${F.latin}`, 'rgba(237,230,214,.85)', { align: 'center' });
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  box(t) {
    const { W, H, portrait, safe } = this.hud, u = Math.min(W, H) / 1080; const b = TL().beats.find(x => t >= x.start && t < x.end && x.zh && !x.nosub); if (!b) return null;
    const y = portrait ? H * .70 : H * (b.en ? .86 : .9), s = (this.size || (portrait ? 56 : 38)) * u;
    return { kind: 'Subtitles', x: safe.l + (safe.r - safe.l) * .02, y: y - s, w: (safe.r - safe.l) * .96, h: s * (b.en ? 2.6 : 1.3) };
  }
}
