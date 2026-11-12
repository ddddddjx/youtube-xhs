const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:970,height:600}, deviceScaleFactor:2 });
  for (const n of process.argv.slice(2)) {
    await p.goto('file://' + require('path').resolve(n + '.html')); await p.waitForTimeout(400);
    await p.locator('.w').screenshot({ path: n + '.png' }); console.log('ok', n);
  }
  await b.close();
})();
