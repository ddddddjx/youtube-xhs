// v3 版式（10-23 用户定，对标赛博老奶首页）：render_meme.py 读到 front matter `style: v3` 时调用本脚本。
// 首页 = 作者块 + 粉底红竖线三行大字（headline，用 | 换行）+ 一句导语（lead，==半句== 标红下划线）+ 素材图压红粗线（hero）+ 粉底引用块（cover_quote，可选）
// 正文页 = 顶栏 + 段落（==句子== 红字下划线）+ `> ` 开头的段落做粉底引用块 + 图片压红粗线；末页名片卡（card / card: off）。
// 分页按实际块高度量，段落按句跨页，末页太薄自动缩一号字。
// 用法：node render_v3.js <draft.md> <输出目录> <avatar.png> <名片卡文案> <slogan>
// 依赖 playwright（node 全局包）和 Chromium（PLAYWRIGHT_BROWSERS_PATH 或 CHROME 环境变量）。
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [,, SRC, OUT, AVATAR, CARD, SLOGAN] = process.argv;
const BASE = path.dirname(path.resolve(SRC));
const b64 = (f) => 'data:image/' + (f.toLowerCase().endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mark = (s) => esc(s).replace(/==(.+?)==/g, '<u>$1</u>');

// ---------- 解析 draft.md ----------
const md = fs.readFileSync(SRC, 'utf8');
const meta = {}; let body = md;
const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
if (fm) { for (const l of fm[1].split('\n')) { const i = l.indexOf(':'); if (i > 0 && !l.trim().startsWith('#')) meta[l.slice(0, i).trim()] = l.slice(i + 1).replace(/\s+#\s.*$/, '').trim(); } body = md.slice(fm[0].length); }
const blocks = [];
for (const raw of body.split('\n')) {
  const s = raw.trim(); if (!s) continue;
  const im = s.match(/^!\[(.*?)\]\((.+?)\)$/);
  if (im) blocks.push({ t: 'img', f: im[2] });
  else if (s.startsWith('>')) blocks.push({ t: 'quote', h: mark(s.replace(/^>\s*/, '')) });
  else if (s.startsWith('#')) blocks.push({ t: 'head', h: esc(s.replace(/^#+\s*/, '')) });
  else blocks.push({ t: 'p', h: mark(s.replace(/\*\*/g, '')) });
}

// ---------- 样式 ----------
let FS = 40;
const AV = b64(AVATAR);
const css = () => `
body{margin:0;width:1080px;background:#fff;font-family:"Noto Sans CJK SC","PingFang SC","Hiragino Sans GB",sans-serif;color:#171717;overflow:hidden}
.top{display:flex;align-items:center;padding:34px 55px 0}
.top img{width:92px;height:92px;border-radius:50%}
.name{margin-left:28px}.name b{font-size:38px;color:#ee9632;font-weight:600}
.name span{font-size:27px;color:#aaa;margin-left:22px}.name .loc{display:block;font-size:26px;color:#aaa;margin-top:2px;margin-left:0}
.block{position:relative;margin:70px 55px 0;background:#fdeeee;padding:26px 40px}
.block:before{content:"";position:absolute;left:0;top:0;width:8px;height:140px;background:#b42020}
.block:after{content:"";position:absolute;right:0;bottom:0;width:8px;height:140px;background:#b42020}
.h{font-size:${meta.headline_size || 96}px;font-weight:900;line-height:1.22;letter-spacing:1px;color:#1a1212}
.lead{margin:44px 55px 0;font-size:40px;line-height:1.65}
.cshot{margin:40px 55px 0;border-bottom:10px solid #c0251f;padding-bottom:10px}
.cshot img{width:100%;display:block;max-height:${meta.hero_max || 330}px;object-fit:cover;object-position:top}
.cquote{margin:34px 55px 0;background:#fdf1f1;border-left:8px solid #b42020;padding:22px 30px;font-size:36px;line-height:1.55;color:#444}
.bar{height:132px;display:flex;align-items:center;padding:0 55px;border-bottom:2px solid #eee;box-sizing:border-box}
.bar .back{font-size:56px;color:#333;margin-right:40px;font-weight:300}
.bar img{width:84px;height:84px;border-radius:50%}
.bar b{font-size:38px;font-weight:500;margin-left:26px}.bar span{font-size:27px;color:#aaa;margin-left:22px}
.bar .dots{margin-left:auto;font-size:44px;letter-spacing:4px;color:#222}
.body{padding:40px 55px 0}
p{font-size:${FS}px;line-height:1.65;margin:0 0 44px}
p.head{font-weight:700}
u{color:#c0251f;text-decoration:none;border-bottom:5px solid #c0251f;padding-bottom:2px}
.quote{background:#fdf1f1;border-left:8px solid #b42020;padding:22px 30px;font-size:${FS - 2}px;line-height:1.6;color:#333;margin:0 0 44px}
.shot{border-bottom:10px solid #c0251f;padding-bottom:10px;margin:0 0 44px}.shot img{width:100%;display:block}
.card{height:1440px;display:flex;flex-direction:column;align-items:center;padding-top:330px;box-sizing:border-box}
.card img{width:260px;height:260px;border-radius:50%}
.card .n{font-size:64px;font-weight:600;color:#ee9632;margin-top:50px}
.card .c{font-size:52px;font-weight:600;margin-top:60px;text-align:center;padding:0 80px;line-height:1.5}
`;
const doc = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${css()}</style></head><body>${inner}</body></html>`;
const html = (b) => b.t === 'p' ? `<p>${b.h}</p>` : b.t === 'head' ? `<p class="head">${b.h}</p>` : b.t === 'quote' ? `<div class="quote">${b.h}</div>` : `<div class="shot"><img src="${b64(path.join(BASE, b.f))}"></div>`;
const slogan = (meta.slogan === 'off') ? '' : `<span>${esc(meta.slogan || SLOGAN)}</span>`;
const account = esc(meta.account || 'Krypto说AI');
const bar = `<div class="bar"><span class="back">&lt;</span><img src="${AV}"><b>${account}</b>${slogan}<span class="dots">•••</span></div>`;
const coverHtml = () => {
  const lines = (meta.headline || '').split('|').map(s => esc(s.trim())).filter(Boolean).join('<br>');
  const loc = meta.location ? `<span class="loc">发布于 ${esc(meta.location)}</span>` : '';
  const shot = meta.hero ? `<div class="cshot"><img src="${b64(path.join(BASE, meta.hero))}"></div>` : '';
  const q = meta.cover_quote ? `<div class="cquote">${mark(meta.cover_quote)}</div>` : '';
  return `<div class="top"><img src="${AV}"><div class="name"><b>${account}</b>${slogan}${loc}</div></div>
<div class="block"><div class="h">${lines}</div></div><div class="lead">${mark(meta.lead || '')}</div>${shot}${q}`;
};
const cardHtml = () => `<div class="card"><img src="${AV}"><div class="n">${account}</div><div class="c">${esc(meta.card || CARD)}</div></div>`;
const LIMIT = 1440 - 132 - 40 - 30;

(async () => {
  const exe = process.env.CHROME || fs.readdirSync(process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).map(d => path.join(process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers', d, 'chrome-linux/chrome')).find(fs.existsSync);
  const br = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 });
  const measure = async (bs) => {
    await pg.setContent(doc(bar + `<div class="body">` + bs.map((b, i) => `<div class="m">${html(b)}</div>`).join('') + `</div>`), { waitUntil: 'load' });
    return await pg.evaluate(() => [...document.querySelectorAll('.m')].map(e => e.getBoundingClientRect().height));
  };
  const sents = (h) => (h.match(/[^。]*。|[^。]+$/g) || [h]).filter(s => s.trim());
  const paginate = async () => {
    let pages = [], cur = [], used = 0;
    for (const b of blocks) {
      const [hgt] = await measure([b]);
      if (used + hgt <= LIMIT) { cur.push(b); used += hgt; continue; }
      if (b.t === 'p' && LIMIT - used > 200) {
        const ss = sents(b.h); let head = '', rest = '';
        for (let k = 0; k < ss.length; k++) {
          const tryH = ss.slice(0, k + 1).join('');
          if (/<u>[^<]*$/.test(tryH)) continue;           // 不在红线中间断句
          const [th] = await measure([{ t: 'p', h: tryH }]);
          if (used + th <= LIMIT) head = tryH; else { rest = ss.slice(k).join(''); break; }
        }
        if (head) { cur.push({ t: 'p', h: head }); pages.push(cur); cur = []; used = 0; if (rest) { const [rh] = await measure([{ t: 'p', h: rest }]); cur.push({ t: 'p', h: rest }); used = rh; } continue; }
      }
      pages.push(cur); cur = [b]; used = hgt;
    }
    if (cur.length) pages.push(cur);
    return [pages, used];
  };
  let [pages, last] = await paginate();
  if (last < 320 && pages.length > 1) { FS = 38; [pages, last] = await paginate(); }
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (/^\d{2}\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  const shots = [coverHtml(), ...pages.map(p => bar + `<div class="body">` + p.map(html).join('') + `</div>`)];
  if (meta.card !== 'off') shots.push(cardHtml());
  for (let i = 0; i < shots.length; i++) {
    await pg.setContent(doc(shots[i]), { waitUntil: 'load' }); await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(OUT, String(i + 1).padStart(2, '0') + '.png'), clip: { x: 0, y: 0, width: 1080, height: 1440 } });
  }
  await br.close();
  console.log(JSON.stringify({ pages: shots.length, body_pages: pages.length, last_fill: +(last / LIMIT).toFixed(2), font: FS }));
})();
