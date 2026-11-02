// 正文.html 按手机宽度截长图预览：node preview.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve(__dirname, '../正文.html'));
  await p.addStyleTag({ content: 'body{margin:0;padding:20px 18px;background:#fff}' });
  await p.screenshot({ path: path.resolve(__dirname, '../预览_手机长图.png'), fullPage: true });
  await b.close();
})();
