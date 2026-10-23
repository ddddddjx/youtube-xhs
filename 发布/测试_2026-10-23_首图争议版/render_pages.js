// 测试用：赛博老奶式正文页排版（不进 skill）。用法：node render_pages.js <outdir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2];
const R = '/home/user/youtube-xhs/发布/2026-10-23_a16z-andreessen-gap/meme-v2版/编辑用/';
const b64 = (f) => 'data:image/' + (f.endsWith('.jpg') ? 'jpeg' : 'png') + ';base64,' + fs.readFileSync(f).toString('base64');
const AV = b64('/home/user/youtube-xhs/skills/meme-xhs/assets/avatar.png');
let FS = 40;
const CSSF = () => `
body{margin:0;width:1080px;background:#fff;font-family:"Noto Sans CJK SC","PingFang SC",sans-serif;color:#171717}
.bar{height:132px;display:flex;align-items:center;padding:0 55px;border-bottom:2px solid #eee;box-sizing:border-box}
.bar .back{font-size:56px;color:#333;margin-right:40px;font-weight:300}
.bar img{width:84px;height:84px;border-radius:50%}
.bar b{font-size:38px;font-weight:500;margin-left:26px}.bar span{font-size:27px;color:#aaa;margin-left:22px}
.bar .dots{margin-left:auto;font-size:44px;letter-spacing:4px;color:#222}
.body{padding:40px 55px 0}
p{font-size:${FS}px;line-height:1.65;margin:0 0 44px}
u{color:#c0251f;text-decoration:none;border-bottom:5px solid #c0251f;padding-bottom:2px}
.quote{background:#fdf1f1;border-left:8px solid #b42020;padding:22px 30px;font-size:${FS-2}px;line-height:1.6;color:#333;margin:0 0 44px}
.shot{border-bottom:10px solid #c0251f;padding-bottom:10px;margin:0 0 44px}.shot img{width:100%;display:block}
`;
const P = (h) => ({ t: 'p', h });
const Q = (h) => ({ t: 'quote', h });
const IMG = (f) => ({ t: 'img', f });
const blocks = [
  P('差距拉开的速度来自模型本身。AI 的能力每周都在往前推进，他每天打交道的那批创业者和工程师，也就每过一周比传统公司里的人更领先一步。公司层面的分化更明显：AI 原生的初创公司和各行业的老公司，对「AI 能拿来做什么」持有完全不同的两套认知。'),
  Q('Andreessen 的原话：1994 年做浏览器的时候，要是手里有 Claude 和 Codex，他和 Ben Horowitz 当年能做出的东西会完全不同。'),
  P('接下来的创业者会带着这种能力进场，产品计划更复杂，商业计划更有野心，公司扩张得更迅速。他们也不会再把自己定义成一家软件公司、硬件公司，甚至不会自称 AI 公司，而是像概念艺术家一样，把几个领域组合在一起。这句话背后的逻辑是，过去一家公司能触及几个领域，取决于它招得起几种人；现在一个人配上一组 agent 就能同时做软件、硬件和内容，<u>公司的边界只剩下创始人想做什么。</u>'),
  IMG('shots/10_gesture.jpg'),
  P('这段话里最值得留意的是「以周为单位」。知识不会以周为单位拉开差距，因为知识一篇文章就能补齐。能以周为单位累积的，只有一个人把整件事交给 AI 之后，每周多做出来的那些成果。所以在接下来两年里，<u>决定差距的变量并非谁用的模型更先进，而是谁肯把整件事连同权限一起交出去。</u>一个人加一组 agent，已经能完成以前一个十人小组的工作。'),
  P('这个节奏我自己也能感觉到。AI 的军备竞赛已经公开化，几乎每家模型公司都以周为单位发布新模型或新功能。很多人听到「差距以周为单位拉开」，第一反应多半是来不及了。上周我让 Grok 的 bot 替我申请 Muse 的使用权限，接着又让它去申请另一个 Hackathon 的名额。它自己打开我的 Outlook，完成注册、登记和填表，连生日和个人信息都是它填的，<u>整个过程我没有碰键盘。</u>'),
  P('同一件事换到国内的环境里，大概率办不成。国内几家大厂的生态倾向于在自己的体系内闭环，外部的模型和 agent 拿不到访问权限。agent 能不能替人办事，取决于它能否拿到权限，而权限掌握在平台手里。平台把门关上，用户再熟练也只能停在聊天框里。<u>差距就是在这种用户看不见的地方拉开的。</u>'),
  P('我是做产品出身，当年在公司的 Hackathon 上赢过一次。那次我带了一个完整的团队，前端、后端、测试、设计都有人，一共十个校招生。我们干了整整一周，做出一个带 GPS 定位的约会功能。前天晚上，我给另一个产品做同一类组件，从动手到 MVP 上线，<u>只用了一个人和一个晚上。</u>'),
  IMG('compare.png'),
  P('这就是 Andreessen 说的那道差距落在一个人身上的样子。同一个功能，两次之间隔的并非技术，两次用的技术栈差别不大。隔的是我这一年养成的工作方式：需求、代码、测试整件事交出去，我只负责拍板和返工。'),
  P('前几天我发了一篇讲 Claude 的内容，评论区里有几位明显没有用过，结论却已经先下了。这类评论我看得很平静。他们还不相信，说明这道差距暂时还在。'),
  P('Andreessen 说差距以周为单位拉开。这句话反过来也成立：今天交出去一件完整的工作，<u>一周之后，你和身边的人之间也就有了一周的差距。</u>'),
];
const html = (b) => b.t === 'p' ? `<p>${b.h}</p>` : b.t === 'quote' ? `<div class="quote">${b.h}</div>` : `<div class="shot"><img src="${b64(R + b.f)}"></div>`;
const bar = `<div class="bar"><span class="back">&lt;</span><img src="${AV}"><b>Krypto说AI</b><span>AI builder · 活全交给 AI 两年</span><span class="dots">•••</span></div>`;
const page = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSSF()}</style></head><body>${bar}<div class="body">${inner}</div></body></html>`;
const LIMIT = 1440 - 132 - 40 - 30;   // 正文区高度
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await br.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 });
  // 量高度：每个块（含 margin）
  const measure = async (bs) => {
    await pg.setContent(page(bs.map((b, i) => `<div class="m" id="m${i}">${html(b)}</div>`).join('')), { waitUntil: 'load' });
    return await pg.evaluate(() => [...document.querySelectorAll('.m')].map(e => e.getBoundingClientRect().height));
  };
  // 段落按句切分，便于跨页
  const splitSent = (h) => { const parts = h.match(/[^。]*。|[^。]+$/g) || [h]; return parts.filter(s => s.trim()); };
  const paginate = async () => {
  let pages = [], cur = [], used = 0;
  for (const b of blocks) {
    const [hgt] = await measure([b]);
    if (used + hgt <= LIMIT) { cur.push(b); used += hgt; continue; }
    if (b.t === 'p' && LIMIT - used > 200) {           // 拆句跨页
      const sents = splitSent(b.h); let head = '', rest = '';
      for (let k = 0; k < sents.length; k++) {
        const tryH = sents.slice(0, k + 1).join('');
        const [th] = await measure([P(tryH)]);
        if (used + th <= LIMIT) head = tryH; else { rest = sents.slice(k).join(''); break; }
      }
      if (head) { cur.push(P(head)); pages.push(cur); cur = []; used = 0; if (rest) { const [rh] = await measure([P(rest)]); cur.push(P(rest)); used = rh; } continue; }
    }
    pages.push(cur); cur = [b]; used = hgt;
  }
  if (cur.length) pages.push(cur);
  return [pages, used];
  };
  let [pages, lastUsed] = await paginate();
  if (lastUsed < 320 && pages.length > 1) { FS = 38; [pages, lastUsed] = await paginate(); }
  console.log('FS', FS, 'last page used', Math.round(lastUsed));
  // 出图：首页用 a16z_test.png，正文从 02 起
  fs.copyFileSync(path.join(OUT, '..', 'a16z_test.png'), path.join(OUT, '01.png'));
  for (let i = 0; i < pages.length; i++) {
    await pg.setContent(page(pages[i].map(html).join('')), { waitUntil: 'load' });
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(OUT, String(i + 2).padStart(2, '0') + '.png'), clip: { x: 0, y: 0, width: 1080, height: 1440 } });
  }
  fs.copyFileSync('/home/user/youtube-xhs/发布/2026-10-23_a16z-andreessen-gap/meme-v2版/07.png', path.join(OUT, String(pages.length + 2).padStart(2, '0') + '.png'));
  console.log('pages', pages.length + 2);
  await br.close();
})();
