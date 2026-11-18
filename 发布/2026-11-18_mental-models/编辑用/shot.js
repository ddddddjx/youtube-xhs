const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1080,height:1440}, deviceScaleFactor:1 });
  for (let i=1;i<=10;i++){ const n=String(i).padStart(2,'0');
    await p.goto('file://'+require('path').resolve('card'+n+'.html')); await p.waitForTimeout(300);
    const h = await p.evaluate(()=>{const t=document.querySelector('.take').getBoundingClientRect().top;const els=[...document.querySelectorAll('.body *')];return Math.max(...els.map(e=>e.getBoundingClientRect().bottom))-t;});
    console.log(n,'overlap',Math.round(h));
    await p.screenshot({path:'../'+n+'.png'}); }
  await b.close(); })();
