// 兵马俑 TikTok 60 秒（1080×1920，英文大字幕＋中文小字幕，无口播，配乐 音频/配乐.wav）。镜头表见 ../脚本.md
window.FILM_SIZE = [1080, 1920];
window.SCENE_LIBS = ['tt/kit.js', 'tt/film.js'];
window.SCENE_DIR = 'ttdirs_none';
window.FILM_DURATION = 60;
const A = (...k) => k.map(x => 'img/' + x + '.jpg');
const post = (c, lt, t) => { TF.vignette(c, 0.5); TF.grain(c, t); };
window.ERAS = [
  // 0–3 钩子：满彩的脸，颜料卷曲剥落，只剩灰陶
  { id: 's1', dur: 3, assets: A('000'), draw(c, lt, t) {
    const z = 1.08 + lt * 0.05, peel = U.clamp((lt - 0.8) / 1.7);
    TF.hook(c, lt, { z, peel }); post(c, lt, t);
    TF.subs(c, lt, "They weren't always gray.", '它们原本不是灰色的', { inAt: 0.1, hl: 'gray' }); } },
  // 3–6.5 灰脸快推到眼睛
  { id: 's2', dur: 3.5, assets: A('000'), draw(c, lt, t) {
    const z = 1.23 + Math.pow(lt / 3.5, 2) * 1.5;
    TF.cover(c, TF.im('000'), { fx: 0.5, fy: 0.42, z: z * TF.kick(lt), filter: 'grayscale(1) sepia(.18) brightness(.82) contrast(1.15)' }); post(c, lt, t);
    TF.subs(c, lt, 'Dug up, the paint curled and flaked off in minutes.', '一出土，颜料几分钟就卷起剥落', { hl: 'minutes' }); } },
  // 6.5–12 1974：出土现场
  { id: 's3', dur: 5.5, assets: A('036'), draw(c, lt, t) {
    TF.cover(c, TF.im('036'), { fx: 0.68, fy: 0.62, z: (1.05 + lt * 0.03) * TF.kick(lt, 0.08), filter: 'saturate(.85) contrast(1.08)' });
    TT.dust(c, t, { n: 70, a: 0.6 }); post(c, lt, t); TF.flash(c, lt);
    TF.slam(c, lt, 0.05, '1974', null, { y: 520, size: 230, col: '#fff' });
    TF.subs(c, lt, 'Farmers digging a well hit a clay head.', '农民打井，挖到一颗陶土人头', { inAt: 0.4 }); } },
  // 12–20 规模：一号坑全景横移，三个数字砸下
  { id: 's4', dur: 8, assets: A('107', '036'), draw(c, lt, t) {
    if (lt < 5.2) TF.cover(c, TF.im('107'), { fx: U.lerp(0.25, 0.75, U.ss(0, 5.2, lt)), fy: 0.62, z: 1.15 * TF.kick(lt) });
    else TF.cover(c, TF.im('036'), { fx: 0.2, fy: 0.3, z: (1.3 + (lt - 5.2) * 0.04) * TF.kick(lt - 5.2) });
    post(c, lt, t); if (lt > 5.2) TF.flash(c, lt - 5.2);
    if (lt < 2.6) TF.slam(c, lt, 0.1, '8,000', 'SOLDIERS');
    else if (lt < 5.2) TF.slam(c, lt, 2.6, '130', 'CHARIOTS');
    else TF.slam(c, lt, 5.2, '670', 'HORSES');
    TF.subs(c, lt, lt < 2.6 ? 'Over 8,000 soldiers.' : lt < 5.2 ? '130 war chariots.' : '670 horses.', lt < 2.6 ? '八千多个兵俑' : lt < 5.2 ? '一百三十辆战车' : '六百七十匹马', { y: 1240 }); } },
  // 20–28 每张脸都不一样：六张脸快切
  { id: 's5', dur: 8, assets: A('071', '074', '072', '082', '075', '002'), draw(c, lt, t) {
    const F = [['071', 0.42, 0.24, 1.9], ['074', 0.5, 0.3, 1.3], ['072', 0.27, 0.33, 1.7], ['082', 0.56, 0.36, 1.25], ['075', 0.4, 0.24, 1.9], ['002', 0.52, 0.42, 1.3]];
    const k = Math.min(5, Math.floor(lt / (8 / 6))), q = lt - k * (8 / 6), [id, fx, fy, z] = F[k];
    TF.cover(c, TF.im(id), { fx, fy, z: (z + q * 0.06) * TF.kick(q, 0.06), filter: 'contrast(1.08)' }); post(c, lt, t); TF.flash(c, q, 0.08);
    TF.subs(c, lt, 'Every single face is different.', '每一张脸都不一样', { hl: 'different' }); } },
  // 28–34 怎么做到的：上下两张脸对比
  { id: 's6', dur: 6, assets: A('071', '082'), draw(c, lt, t) {
    c.fillStyle = '#000'; c.fillRect(0, 0, 1080, 1920);
    const half = (id, y0, h, fx, fy, z, d) => { c.save(); c.beginPath(); c.rect(0, y0, 1080, h); c.clip(); TF.cover(c, TF.im(id), { fx, fy, z: z + lt * 0.03 * d, box: [0, y0, 1080, h] }); c.restore(); };
    const sl = U.ease.out(U.clamp(lt / 0.5));
    c.save(); c.translate((1 - sl) * -1080, 0); half('071', 0, 840, 0.42, 0.33, 1.15, 1); c.restore();
    c.save(); c.translate((1 - sl) * 1080, 0); half('082', 1110, 810, 0.56, 0.38, 1.0, -1); c.restore();
    c.fillStyle = '#ffd23f'; c.fillRect(0, 840, 1080, 8); c.fillRect(0, 1102, 1080, 8);
    post(c, lt, t);
    TF.subs(c, lt, 'Just 8 basic face molds. Every face finished by hand.', '只有约八种基础脸模，五官再一张张手工雕', { y: 925, size: 60, inAt: 0.4, hl: 'by hand' }); } },
  // 34–42 为了一个人：秦始皇陵封土，七十万人
  { id: 's7', dur: 8, assets: A('125'), draw(c, lt, t) {
    TF.cover(c, TF.im('125'), { fx: 0.47, fy: 0.45, z: (1.0 + lt * 0.035) * TF.kick(lt), filter: `saturate(${U.lerp(1, 0.6, U.ss(3, 5, lt))}) brightness(${U.lerp(1, 0.75, U.ss(3, 5, lt))})` });
    post(c, lt, t);
    if (lt < 3.6) TF.subs(c, lt, "All of it built for one man: China's first emperor.", '全都只为一个人：秦始皇', { hl: 'one man' });
    else { const n = Math.round(700000 * U.ease.out(U.clamp((lt - 3.6) / 1.6))); TF.slam(c, lt, 3.6, n.toLocaleString('en-US'), 'WORKERS', { size: 200 });
      TF.subs(c, lt, 'Records say 700,000 people worked on his tomb.', '史书记载，七十多万人为他修陵', { inAt: 3.7 }); } } },
  // 42–50 还留着原本颜色的跪射俑
  { id: 's8', dur: 8, assets: A('031', '067'), draw(c, lt, t) {
    if (lt < 3.5) { TF.cover(c, TF.im('031'), { fx: 0.5, fy: 0.42, z: (1.05 + lt * 0.05) * TF.kick(lt) }); post(c, lt, t);
      TF.subs(c, lt, 'Some still carry traces of their original paint.', '有些身上还留着当年的颜料', { hl: 'original paint' }); }
    else { const q = lt - 3.5, T = TF.cover(c, TF.im('067'), { fx: 0.5, fy: 0.55, z: (1.2 + q * 0.06) * TF.kick(q) }); post(c, lt, t); TF.flash(c, q);
      TF.ring(c, 250, 880, q, 0.5);
      TF.subs(c, q, 'Real Qin-dynasty red. 2,200 years old.', '秦朝的红，两千两百年前刷上去的', { hl: 'red' }); } } },
  // 50–57 主墓没打开：封土＋地下水银河剖面
  { id: 's9', dur: 7, assets: A('125'), draw(c, lt, t) {
    const top = 700; c.save(); c.beginPath(); c.rect(0, 0, 1080, top); c.clip(); c.translate(0, -560); TF.cover(c, TF.im('125'), { fx: 0.47, fy: 0.42, z: 1.0, filter: 'brightness(.55) saturate(.5) hue-rotate(-10deg)' }); c.restore();
    c.fillStyle = 'rgba(10,14,30,.35)'; c.fillRect(0, 0, 1080, top);
    TF.mercury(c, lt, top); post(c, lt, t);
    TF.slam(c, lt, 0.2, 'NEVER OPENED', null, { y: 300, size: 110, col: '#ff5a4a' });
    if (lt < 3.2) TF.subs(c, lt, 'His own tomb has never been opened.', '他自己的主墓，至今没有打开', { y: 1330, inAt: 0.2 });
    else TF.subs(c, lt, 'Ancient records say rivers of mercury flow inside.', '《史记》说，里面流着水银做的江河', { y: 1330, hl: 'mercury' }); } },
  // 57–60 回到彩色的脸：你会打开吗？
  { id: 's10', dur: 3, assets: A('000'), draw(c, lt, t) {
    TF.hook(c, lt, { z: 1.25 + lt * 0.12, peel: 0, chipsOn: false }); TF.flash(c, lt, 0.2); post(c, lt, t);
    TF.subs(c, lt, 'Would you open it?', '换你，你会打开吗？', { y: 1220, size: 104, inAt: 0.15, hl: 'open' }); } },
];
