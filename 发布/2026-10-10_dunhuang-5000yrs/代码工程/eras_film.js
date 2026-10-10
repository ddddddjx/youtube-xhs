// 敦煌风·上下五千年：一条长卷，一匹丝从五千年前飞到今天。
window.BPM = 88;
window.SCENE_LIBS = ['dh/kit.js', 'dh/han.js', 'dh/world.js', 'dh/seg_a.js', 'dh/seg_b.js', 'dh/seg_c.js'].concat(window.EXTRA_SEGS || []);
window.ERAS = [{ id: 'film', draw: (c, lt, t) => DHW.draw(c, t), dur: 180 }];
window.FILM_DURATION = 180;
