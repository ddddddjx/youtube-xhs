// 兵马俑 TikTok v3.1：Vox 黑卡调查墙（huashu-art-motion y2 语法，方向 B），按独立审片（审片/v3_独立审片.md）重排。
// 60 秒，1080×1920，英文字幕＋中文小字幕（深色底板、硬切），配乐 音频/配乐.wav。v2 在 eras_v2.js，v1 在 eras_v1.js。
window.FILM_SIZE = [1080, 1920];
window.SCENE_LIBS = ['tt/kit.js', 'tt/film.js', 'tt/wall.js'];
window.SCENE_DIR = 'ttdirs_none';
window.FILM_DURATION = 60;
const ALL = ['000', '036', '125', '067', '071', '074', '072', '082', '002', '031', 'emp1', 'rows1'].map(k => 'img/' + k + '.jpg');
// 字幕：深色底板＋白字，中文暖黄；切换时 0.1 秒轻弹，不淡入（审片：浅底上粗描边糊字、新旧字幕叠化）
const wrapEn = (c, s, max) => { const out = []; let line = ''; for (const w of s.split(' ')) { const tr = line ? line + ' ' + w : w; if (c.measureText(tr).width > max && line) { out.push(line); line = w; } else line = tr; } if (line) out.push(line); return out; };
const wrapZh = (c, s, max) => { const out = []; let line = ''; for (const ch of s) { if (c.measureText(line + ch).width > max && line) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; };
function cap(c, lt, en, zh, { y = 1300, size = 62, hl } = {}) {
  c.save(); c.font = `800 ${size}px "Inter"`; const L = wrapEn(c, en, 860); c.font = '44px "PuHui-Bold"'; const Z = zh ? wrapZh(c, zh, 860) : [];
  const lh = size * 1.18, zh_h = 56, hgt = L.length * lh + Z.length * zh_h + 34;
  c.font = `800 ${size}px "Inter"`; let wmax = 0; L.forEach(l => wmax = Math.max(wmax, c.measureText(l).width)); c.font = '44px "PuHui-Bold"'; Z.forEach(l => wmax = Math.max(wmax, c.measureText(l).width));
  const k = 1 + 0.05 * (1 - U.clamp(lt / 0.1)); c.translate(520, y + hgt / 2); c.scale(k, k); c.translate(-520, -(y + hgt / 2));
  c.fillStyle = 'rgba(16,14,12,.84)'; c.beginPath(); c.roundRect(520 - wmax / 2 - 30, y - 14, wmax + 60, hgt, 18); c.fill();
  c.textAlign = 'center'; c.textBaseline = 'top';
  c.font = `800 ${size}px "Inter"`; L.forEach((l, i) => { c.fillStyle = hl && l.includes(hl) ? '#ffd23f' : '#fff'; c.fillText(l, 520, y + 4 + i * lh); });
  c.font = '44px "PuHui-Bold"'; c.fillStyle = '#ffd66b'; Z.forEach((l, i) => c.fillText(l, 520, y + 8 + L.length * lh + i * zh_h));
  c.restore(); }
const SUBS = [
  [0.0, 2.4, "They weren't always gray.", '它们原本不是灰色的', 'gray'],
  [2.4, 5.4, '1974. Farmers digging a well hit a clay head.', '1974 年，农民打井，挖到一颗陶土人头'],
  [5.4, 8.0, 'Under it: an entire army.', '它下面，是一整支军队', 'army'],
  [8.0, 12.0, 'Over 8,000 soldiers. Every one life-size.', '八千多个兵俑，个个真人大小', '8,000'],
  [12.0, 15.0, 'Pit 1 alone is longer than two football fields.', '光一号坑，就比两个美式橄榄球场还长', 'two football fields'],
  [15.0, 18.0, 'Pit 2: cavalry. Pit 3: the command post. Pit 4: left empty.', '二号坑骑兵，三号坑指挥部，四号坑是空的', 'empty'],
  [18.0, 20.0, 'And every soldier faces east...', '所有兵俑，都面朝东方'],
  [20.0, 22.5, "...guarding one man's tomb, a mile away.", '守着一英里外，一个人的墓', 'one man'],
  [22.5, 26.0, "Qin Shi Huang. China's First Emperor.", '秦始皇，中国第一个皇帝'],
  [26.0, 28.5, 'Every face is different.', '每一张脸都不一样', 'different'],
  [28.5, 31.0, 'No two alike. Over 8,000 of them.', '没有两张一样，一共八千多张'],
  [31.0, 35.0, 'Scans show a hidden chamber about 100 feet down.', '扫描显示，地下约 30 米有一座地宫', '100 feet'],
  [35.0, 39.0, 'Ancient records: rivers of mercury. Crossbows set to fire.', '史书记载：水银做的江河，会自动发射的弩', 'mercury'],
  [39.0, 42.5, 'Today, mercury above the tomb is way higher than normal.', '今天测到，封土上方的汞远超正常', 'way higher'],
  [42.5, 46.0, 'Records say the workers were sealed inside with him.', '史书还说，修墓的工匠被一起封在了里面', 'sealed inside'],
  [46.0, 49.5, 'Last time they dug, the colors died in minutes.', '上一次挖开，颜色几分钟就没了', 'minutes'],
  [49.5, 53.0, 'So his tomb stays sealed. For now.', '所以他的主墓一直封着。至少现在是', 'sealed'],
];
window.ERAS = [
  // 0–2.4 钩子：满幅彩色脸，颜料剥落只剩灰陶
  { id: 's1', dur: 2.4, assets: ALL, draw(c, lt, t) {
    TF.hook(c, lt, { z: 1.08 + lt * 0.05, peel: U.clamp((lt - 0.55) / 1.55), t0: 0.55, t1: 2.1 }); TF.vignette(c, 0.5);
    MD.label(c, lt < 1.2 ? 'AS PAINTED · 210 BC (RECONSTRUCTION)' : 'AS FOUND · 1974', 540, 260, { size: 36, fam: 'Inter', align: 'center', bg: lt < 1.2 ? '#b8433f' : '#191817', t: lt, at: lt < 1.2 ? 0 : 1.2, rate: 40 });
    cap(c, lt, SUBS[0][2], SUBS[0][3], { hl: 'gray' }); } },
  // 2.4–60 调查墙
  { id: 'wall', dur: 57.6, assets: ALL, draw(c, lt, t) {
    WALL.draw(c, t);
    // 8–12 满屏实拍：一号坑一排排兵俑（砸入 → 快推 → 横移）
    if (t >= 8.0 && t < 12.0) { const k = CAM.track({ x: 540, y: 960, z: 1 }, [{ at: 8.0, kind: 'slam' }, { at: 9.3, kind: 'punch', k: 0.28, x: 600, y: 1000 }, { at: 10.6, kind: 'pan', x: 470, y: 1000 }], t);
      CAM.with(c, k, c => TF.cover(c, TF.im('rows1'), { fx: 0.52, fy: 0.62, z: 1.0 })); MD.label(c, 'PIT 1 · TODAY', 70, 300, { size: 46, fam: 'Inter', t, at: 8.1, rate: 30 }); }
    TF.vignette(c, 0.3);
    for (const [a, b, en, zh, hl] of SUBS) if (t >= a && t < b) cap(c, t - a, en, zh, { hl });
    if (t >= 54.0) cap(c, t - 54.0, 'Would you open it?', '换你，你会打开吗？', { y: 230, size: 92, hl: 'open' }); } },
];
