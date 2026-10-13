// 兵马俑 TikTok v3：Vox 黑卡调查墙（huashu-art-motion y2 语法，方向 B）。60 秒，1080×1920，英文大字幕＋中文小字幕，配乐 音频/配乐.wav。
// 一面墙一台相机：开场剥色钩子 → 从照片拉出露出整面墙 → 沿红线在证据之间移动 → 结尾拉远看全墙。v2 动画图解版在 eras_v2.js，v1 在 eras_v1.js。
window.FILM_SIZE = [1080, 1920];
window.SCENE_LIBS = ['tt/kit.js', 'tt/film.js', 'tt/wall.js'];
window.SCENE_DIR = 'ttdirs_none';
window.FILM_DURATION = 60;
const ALL = ['000', '036', '107', '125', '067', '071', '074', '072', '082', '075', '002', '031', '084'].map(k => 'img/' + k + '.jpg');
const SUBS = [
  [3.4, 5.6, '1974. Farmers in China dig a well.', '1974 年，中国西安，农民在打井'],
  [5.6, 7.4, 'Then they hit a face.', '然后，铲子碰到了一张脸', 'face'],
  [7.4, 9.6, 'Under it: an entire army.', '它下面，是一整支军队', 'army'],
  [9.8, 13.2, 'Pit 1 alone is 755 feet long.', '光一号坑，就长 230 米', '755 feet'],
  [13.2, 16.8, "That's more than two football fields.", '比两个美式橄榄球场还长', 'two football fields'],
  [16.8, 19.0, 'Thousands of soldiers, in battle formation.', '几千个兵俑，排成战阵'],
  [19.6, 22.1, 'Pit 2: cavalry and war chariots.', '二号坑：骑兵和战车'],
  [22.1, 24.6, 'Pit 3: the command post.', '三号坑：指挥部'],
  [24.6, 27.2, 'Pit 4: empty. Never finished.', '四号坑：空的，没修完', 'empty'],
  [27.2, 29.2, 'And every soldier faces east...', '所有兵俑，都面朝东方'],
  [29.2, 32.2, "...guarding one man's tomb, a mile away.", '守着一英里外，一个人的墓', 'one man'],
  [32.2, 35.0, 'Qin Shi Huang. The First Emperor of China.', '秦始皇，中国第一个皇帝'],
  [35.0, 37.6, 'Every face is different.', '每一张脸都不一样', 'different'],
  [37.6, 41.0, 'No two alike. Over 8,000 of them.', '没有两张一样，一共八千多张'],
  [41.0, 44.6, 'Scans found a hidden chamber about 100 feet underground.', '扫描发现，地下约 30 米有一座地宫', '100 feet'],
  [44.6, 47.8, 'Ancient records: rivers of mercury. Crossbows rigged to fire.', '史书记载：里面有水银江河，还有会自动发射的弩', 'mercury'],
  [47.8, 51.0, 'Today, mercury above the tomb is way higher than normal.', '今天测到，封土上方的汞含量远超正常', 'way higher'],
  [51.0, 53.6, 'Last time they dug, the colors died in minutes.', '上一次挖开，颜色几分钟就没了', 'minutes'],
  [53.6, 56.0, 'So his tomb stays sealed. For now.', '所以他的主墓一直封着。至少现在是', 'sealed'],
];
window.ERAS = [
  // 0–2.95 钩子：满幅彩色脸，颜料剥落只剩灰陶（真实照片满幅＋代码剥色）
  { id: 's1', dur: 2.95, assets: ALL, draw(c, lt, t) {
    TF.hook(c, lt, { z: 1.08 + lt * 0.03, peel: U.clamp((lt - 0.7) / 1.8), t0: 0.7, t1: 2.5 }); TF.vignette(c, 0.5);
    TF.subs(c, lt, "They weren't always gray.", '它们原本不是灰色的', { y: 1330, inAt: 0.1, hl: 'gray' }); } },
  // 2.95–60 调查墙
  { id: 'wall', dur: 57.05, assets: ALL, draw(c, lt, t) {
    WALL.draw(c, t);
    // 推进一号坑照片 → 硬切成满幅高清原图（Vox 转场：推满照片→切成同一张图的高清扫描）
    if (t >= 16.8 && t < 19.0) { TF.cover(c, TF.im('107'), { fx: 0.5, fy: 0.62, z: 1.15 }); MD.label(c, 'PIT 1 · TODAY', 70, 330, { size: 46, fam: 'Inter', t, at: 16.95 }); }
    TF.vignette(c, 0.35);   // Vox：纸纹是静态的，不叠逐帧颗粒
    for (const [a, b, en, zh, hl] of SUBS) if (t >= a && t < b) TF.subs(c, t - a, en, zh, { y: 1330, size: 70, hl });
    if (t >= 56.4) TF.subs(c, t - 56.4, 'Would you open it?', '换你，你会打开吗？', { y: 1250, size: 108, hl: 'open' }); } },
];
