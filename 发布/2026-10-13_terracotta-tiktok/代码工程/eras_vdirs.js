// Vox 拼贴三方向设定帧（--film vdirs）
window.FILM_SIZE = [1080, 1920];
window.SCENE_LIBS = ['tt/kit.js', 'tt/film.js', 'tt/vdirs.js'];
window.SCENE_DIR = 'ttdirs_none';
const AS = ['img/107.jpg', 'img/125.jpg', 'img/000.jpg'];
const sub = (c) => TF.subs(c, 1, "...guarding one man's tomb, a mile away.", '守着一英里外，一个人的墓', { y: 1760, size: 64, hl: 'one man' });
window.ERAS = ['A', 'B', 'C'].map(k => ({ id: 'v' + k, dur: 3, assets: AS, draw(c, lt, t) { VX[k](c, lt, t); sub(c); } }));
