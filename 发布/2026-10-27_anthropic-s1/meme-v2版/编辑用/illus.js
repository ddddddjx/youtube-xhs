const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch();
  for (const f of process.argv.slice(2)) { const p = await b.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 2 });
    await p.goto('file://' + path.resolve(f)); await p.waitForTimeout(300);
    await p.screenshot({ path: f.replace(/\.html$/, '.png'), fullPage: true }); await p.close(); console.log(f, 'ok'); }
  await b.close(); })();
