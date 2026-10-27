const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1300, height: 1200 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve(process.argv[2]), { waitUntil: 'load', timeout: 180000 });
  const find = async (needle) => p.evaluateHandle((needle) => {
    // page divs: direct children with height:792pt
    const pages = [...document.querySelectorAll('div')].filter(d => d.style && d.style.height === '792pt');
    return pages.find(d => d.textContent.includes(needle));
  }, needle);
  // cover page
  let el = await find('symbol “ANT.”');
  const box = await el.boundingBox();
  await p.evaluate(e => e.scrollIntoView(), el);
  const b1 = await el.boundingBox();
  await p.screenshot({ path: 'shots/cover_full.png', clip: { x: b1.x, y: b1.y, width: b1.width, height: b1.height } });
  // crop: top band of the cover (title row + first paragraphs)
  await p.screenshot({ path: 'shots/cover.png', clip: { x: b1.x, y: b1.y + 150, width: b1.width, height: 128 } });
  // ANT line: find the text node line containing 'symbol “ANT.”' and box it
  const antBox = await p.evaluate((needle) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) { if (n.textContent.includes(needle)) { const r = n.parentElement.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; } }
  }, 'symbol “ANT.”');
  console.log('ant line', antBox);
  await p.evaluate((bx) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${bx.x-6}px;top:${bx.y-4}px;width:${bx.w+12}px;height:${bx.h+8}px;border:4px solid #c0251f;border-radius:4px;z-index:9999;pointer-events:none`; d.id = 'kbox'; document.body.appendChild(d); }, antBox);
  await p.screenshot({ path: 'shots/ant.png', clip: { x: b1.x, y: antBox.y - 108, width: b1.width, height: 200 } });
  await p.evaluate(() => document.getElementById('kbox').remove());
  // risk paragraph
  el = await find('lose visibility across certain processes');
  await p.evaluate(e => e.scrollIntoView(), el);
  const b2 = await el.boundingBox();
  const lines = await p.evaluate(() => {
    const needles = ['lose visibility across certain processes', 'way that may become difficult for any individual'];
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n; while ((n = walker.nextNode())) { for (const nd of needles) if (n.textContent.includes(nd)) { const r = n.parentElement.getBoundingClientRect(); out.push({ x: r.x, y: r.y, w: r.width, h: r.height }); } }
    return out;
  });
  console.log('risk lines', lines);
  const x0 = Math.min(...lines.map(l => l.x)), y0 = Math.min(...lines.map(l => l.y));
  const x1 = Math.max(...lines.map(l => l.x + l.w)), y1 = Math.max(...lines.map(l => l.y + l.h));
  await p.evaluate((bx) => { const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${bx.x0-6}px;top:${bx.y0-4}px;width:${bx.x1-bx.x0+12}px;height:${bx.y1-bx.y0+3}px;border:4px solid #c0251f;border-radius:4px;z-index:9999;pointer-events:none`; document.body.appendChild(d); }, { x0, y0, x1, y1 });
  await p.screenshot({ path: 'shots/risk.png', clip: { x: b2.x, y: y0 - 130, width: b2.width, height: 330 } });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
