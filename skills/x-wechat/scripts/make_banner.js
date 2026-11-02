// K说AI 公众号品牌横幅（正文顶部第一张图，学 Z Finance 的品牌条，用户 11-02 定）
// 用法：node skills/x-wechat/scripts/make_banner.js   → skills/x-wechat/assets/banner.png（1080×236）
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const AV = 'data:image/png;base64,' + fs.readFileSync(path.resolve(__dirname, '../../meme-xhs/assets/avatar.png')).toString('base64');
const FONT = `'Noto Sans CJK SC','Noto Sans SC',sans-serif`;
const html = `
<html><body style="margin:0;width:1080px;height:236px;overflow:hidden;font-family:${FONT}">
<div style="position:absolute;inset:0;background:#FFE600"></div>
<div style="position:absolute;left:640px;top:0;width:200px;height:236px;background:#F5DA00;transform:skewX(-18deg)"></div>
<div style="position:absolute;left:760px;top:0;width:60px;height:236px;background:#EFD300;transform:skewX(-18deg)"></div>
<div style="position:absolute;right:58px;top:22px;width:192px;height:192px;background:#111;transform:skewX(-8deg);box-shadow:10px 10px 0 rgba(0,0,0,.18)"></div>
<div style="position:absolute;right:58px;top:22px;width:192px;height:192px;display:flex;align-items:center;justify-content:center;font:900 168px/1 'Arial Black',Arial,sans-serif;color:#FFE600;transform:skewX(-8deg)">K</div>
<div style="position:absolute;left:60px;top:48px;width:140px;height:140px;border-radius:50%;border:6px solid #111;overflow:hidden;box-sizing:border-box"><img src="${AV}" style="width:100%;height:100%"></div>
<div style="position:absolute;left:232px;top:52px;font-size:74px;font-weight:900;color:#111;letter-spacing:1px;line-height:1">K说AI</div>
<div style="position:absolute;left:236px;top:144px;font-size:28px;font-weight:700;color:#111;letter-spacing:3px">AI builder · 活全交给 AI 两年</div>
</body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 236 } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: path.resolve(__dirname, '../assets/banner.png') });
  await b.close();
  console.log('ok');
})();
