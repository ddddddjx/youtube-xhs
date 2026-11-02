const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1440 } });
await p.goto('file://' + __dirname + '/cover.html'); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/封面.png' }); await b.close(); })();
