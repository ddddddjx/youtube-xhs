// 公众号版配图：封面海报 + 两张对照表 + 扇出流程图（Playwright 截图）
// 用法：node figs.js   （在本目录跑，输出到 ../图/ 和 ../封面.png）
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '../图');
const SHOT = (n) => 'data:image/jpeg;base64,' + fs.readFileSync(path.resolve(__dirname, '../../编辑用/shots/' + n)).toString('base64');
const FONT = `'Noto Sans CJK SC','Noto Sans SC',sans-serif`;

const torn = (() => { // 撕纸边：上下两条锯齿
  const pts = [];
  const n = 60;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n * 100).toFixed(2)}% ${(6 + Math.sin(i * 7.3) * 4 + (i % 3) * 2).toFixed(1)}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n * 100).toFixed(2)}% ${(94 - Math.cos(i * 5.1) * 4 - (i % 4) * 1.5).toFixed(1)}%`);
  return `polygon(${pts.join(',')})`;
})();

const cover = `
<html><body style="margin:0;width:1800px;height:766px;overflow:hidden;font-family:${FONT}">
<div style="position:absolute;inset:0;background:#D7000F"></div>
<img src="${SHOT('t229.jpg')}" style="position:absolute;left:0;top:-120px;width:1800px;filter:grayscale(1) contrast(1.9) brightness(1.05);mix-blend-mode:multiply;opacity:.95">
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(215,0,15,0) 30%,rgba(120,0,8,.55) 100%)"></div>
<div style="position:absolute;left:260px;top:228px;width:1280px;height:330px;background:#F3EEE4;clip-path:${torn};transform:rotate(-2.5deg);box-shadow:0 0 0 #000"></div>
<div style="position:absolute;left:0;right:0;top:262px;text-align:center;transform:rotate(-2.5deg)">
  <div style="font-size:128px;font-weight:900;letter-spacing:-3px;color:#111;line-height:1">Claude Code</div>
  <div style="margin-top:26px;font-size:46px;font-weight:900;color:#D7000F;letter-spacing:6px">团队这一年 · 只给目标</div>
</div>
</body></html>`;

const table = (title, head, rows, widths) => `
<html><body style="margin:0;background:#fff;font-family:${FONT}">
<div id="t" style="width:1080px;padding:36px 40px 28px;box-sizing:border-box;background:#F7F7F7">
<div style="font-size:32px;font-weight:700;color:#111;margin-bottom:18px">${title}</div>
<table style="width:100%;border-collapse:collapse;font-size:31px;line-height:1.5;color:#222">
<tr>${head.map((h, i) => `<th style="text-align:left;padding:12px 14px;border-bottom:2px solid #222;font-weight:700;width:${widths[i]}">${h}</th>`).join('')}</tr>
${rows.map(r => `<tr>${r.map((c, i) => `<td style="vertical-align:top;padding:16px 14px;border-bottom:1px solid #DDD;${i === 0 ? 'font-weight:700;color:#111' : ''}">${c}</td>`).join('')}</tr>`).join('')}
</table></div></body></html>`;

const t1 = table('Claude Code 团队的用法：一年前 vs 现在',
  ['', '一年前', '现在'],
  [
    ['交给模型的任务', '实现一个类、写一个函数', '提升一条转化漏斗、开发一个需要多人参与的内部工具'],
    ['人的入口', '终端里逐条写提示、给反馈', '在 Slack 里 @ Claude Tag；约两成工作才打开终端或桌面端'],
    ['人盯着什么', '每次工具调用、每个决定、每个权限确认', '目标和最终结果'],
    ['模型拿到的上下文', '当前这段对话', '产品背景、团队决策、用户反馈和埋点数据'],
    ['运行方式', '本地电脑，合上就停', '云端容器持续运行，每天跑例行任务'],
  ], ['26%', '31%', '43%']);

const t2 = table('为补模型短板而做的功能，后来怎样了',
  ['功能', '当时补的短板', '后来'],
  [
    ['待办清单', '做不了长线任务：给五件事，做完三件就放弃', '约一年后不再需要，由更复杂的记忆状态接替'],
    ['提问工具<br><span style="font-weight:400;color:#888;font-size:21px">Ask User Question</span>', '模型不会主动向人确认需求，早期也很难用好这个工具', '模型直接生成带图示和样稿的页面，在页面里向人提问'],
    ['人工逐行审代码', '小毛病要靠人一行行找', '小问题由 Claude 自己找、自己改，人只看设计和边界'],
  ], ['22%', '39%', '39%']);

const box = (txt, sub, bg = '#fff', fg = '#111', bd = '#222') =>
  `<div style="background:${bg};color:${fg};border:2px solid ${bd};border-radius:10px;padding:16px 18px;text-align:center;font-size:25px;font-weight:700;line-height:1.4">${txt}${sub ? `<div style="font-size:20px;font-weight:400;opacity:.75;margin-top:6px">${sub}</div>` : ''}</div>`;
const arrow = `<div style="text-align:center;font-size:30px;color:#D7000F;line-height:1;margin:10px 0">▼</div>`;
const fan = `
<html><body style="margin:0;background:#fff;font-family:${FONT}">
<div id="t" style="width:1080px;padding:36px 60px 36px;box-sizing:border-box;background:#F7F7F7">
<div style="font-size:26px;font-weight:700;color:#111;margin-bottom:22px">代码审查工作流：扇出、对抗审查、汇总</div>
${box('一次代码改动', '')}
${arrow}
<div style="display:flex;gap:14px">${[1, 2, 3, 4, 5].map(i => `<div style="flex:1">${box('子 agent ' + i, '并行找 bug')}</div>`).join('')}</div>
${arrow}
<div style="display:flex;gap:14px">${['视角一', '视角二', '视角三'].map(v => `<div style="flex:1">${box(v, '这个 bug 是真的吗')}</div>`).join('')}</div>
<div style="text-align:center;font-size:21px;color:#666;margin-top:8px">每个疑似 bug 都过一遍三方对抗式审查</div>
${arrow}
${box('汇总、筛选', '确定性的代码编排：for 循环不漏任何一项')}
${arrow}
${box('人只看真正需要关注的几条', '', '#D7000F', '#fff', '#D7000F')}
</div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setViewportSize({ width: 1800, height: 766 });
  await page.setContent(cover, { waitUntil: 'load' });
  await page.screenshot({ path: path.resolve(__dirname, '../封面.png') });
  fs.copyFileSync(path.resolve(__dirname, '../封面.png'), path.join(OUT, 'hero.png'));
  // 1:1 群聊转发缩略图（中间正方形）
  await page.screenshot({ path: path.resolve(__dirname, '../封面_1x1预览.png'), clip: { x: 517, y: 0, width: 766, height: 766 } });
  for (const [name, html] of [['table1.png', t1], ['table2.png', t2], ['fanout.png', fan]]) {
    await page.setViewportSize({ width: 1080, height: 800 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.locator('#t').screenshot({ path: path.join(OUT, name) });
  }
  await browser.close();
  console.log('ok');
})();
