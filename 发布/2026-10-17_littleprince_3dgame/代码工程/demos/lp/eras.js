// 小王子 3D 游戏：一个人 16 天的 AI 制作流程（竖版 1080×1920，约 91 秒）
//   渲染 render.py --film demos/lp --width 1080 --height 1920 --fps 30 --out 成片.mp4
// 画面：原片实机录像满幅当主画面（clips_lp/），新做的部分是同一张纸本桌面上的纸片、便签、冲印件。
window.PUNCH = 0;
window.FILM_SIZE = [1080, 1920];
window.SCENE_LIBS = ['demos/lp/lp.js'];
window.EXTRA_ASSETS = ['clips_lp/stills/compare.jpg', 'clips_lp/stills/chair.jpg', 'clips_lp/stills/library.jpg'];
const CL_ = (dir, n, o = {}) => ({ dir: 'clips_lp/' + dir, fps: 60, n, ...o });
window.ERAS = [
  { id: 'lp01', dur: 3.2, clip: CL_('rose', 123, { speed: 0.62 }) },
  { id: 'lp02', dur: 3.2, clip: CL_('chair', 201, { speed: 1.0 }) },
  { id: 'lp03', dur: 3.0, clip: CL_('door', 123, { speed: 0.68 }) },
  { id: 'lp04', dur: 3.0, clip: CL_('king', 207, { speed: 1.15 }) },
  { id: 'lp05', dur: 3.6, clip: CL_('theater', 183, { speed: 0.84 }) },
  { id: 'lp06', dur: 5.0 },
  { id: 'lp07', dur: 6.0 },
  { id: 'lp08', dur: 6.0 },
  { id: 'lp09', dur: 4.5, clip: CL_('garden_wire', 171, { speed: 0.32 }) },
  { id: 'lp10', dur: 4.5, clips: { wire: CL_('garden_wire', 171, { in: 1.44, speed: 0.3 }), color: CL_('garden', 171, { in: 1.44, speed: 0.3 }) } },
  { id: 'lp11', dur: 5.5 },
  { id: 'lp12', dur: 5.0, clip: CL_('observ', 117, { speed: 0.38 }) },
  { id: 'lp13', dur: 5.0, clip: CL_('run', 255, { speed: 0.84 }) },
  { id: 'lp14', dur: 5.0, clip: CL_('rose', 123, { speed: 0.4 }) },
  { id: 'lp15', dur: 5.0, clip: CL_('gl1', 216, { speed: 0.71 }) },
  { id: 'lp16', dur: 5.0, clip: CL_('gl2', 252, { speed: 0.83 }) },
  { id: 'lp17', dur: 5.0 },
  { id: 'lp18', dur: 5.0, clip: CL_('fox', 225, { speed: 0.37 }) },
  { id: 'lp19', dur: 5.5, clip: CL_('fox', 225, { in: 1.85, speed: 0.34 }) },
  { id: 'lp20', dur: 6.0, clip: CL_('crash', 225, { speed: 0.62 }) },
  { id: 'lp21', dur: 5.5, clip: CL_('hill', 165, { speed: 0.5 }) },
];
