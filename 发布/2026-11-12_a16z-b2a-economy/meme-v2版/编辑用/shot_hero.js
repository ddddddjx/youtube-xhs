const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1360}});
await p.goto('file://'+require('path').resolve('hero_a16z.html'));await p.waitForTimeout(500);
await p.screenshot({path:'hero_a16z.jpg',quality:92,type:'jpeg'});await b.close();})();
