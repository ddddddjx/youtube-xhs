# vk-cine：Three.js 镜头的电影感后期包

`engine/vk-cine.js`（11-18 加）。给 `K.three()` 的 3D 画面加一条后期链，只依赖 three 本体，全部手写。
做法学自 Crimson Loong（chetaslua.github.io/crimson-loong，一条纯 three.js 的 90 秒龙片）：只学结构，没有搬它的代码（那个仓库没有开源协议）。

什么时候用：一镜里有真 3D 物体和灯光，想要空气感、光锥、辉光、打击感。纯 2D 的 Canvas 镜头用不上，照旧用 `fr.look`。

## 最小用法

```js
let S = null, THREE;                                   // Three.js 是 module，晚于 film.js 载入：在函数里取 window.THREE，别在文件顶上取
function build() {
  THREE = window.THREE;
  const g3 = K.three(W, H), cine = VKCine.create(g3);  // 只建一次
  const scene = new THREE.Scene(), fx = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 60);
  // scene 放实物和灯；fx 只放 cine.motes / cine.mist / cine.beam
  return { g3, cine, scene, fx, cam };
}
function shot(fr, t) {
  if (fr.collecting) { /* 只登记 fr.sfx */ return; }   // 导出音效表时不渲 3D
  S = S || build();
  // 按 t 摆好物体、灯、相机
  S.cine.render(S.scene, S.fx, S.cam, { t, fog: {...}, bloom: {...}, shafts: {...}, grade: {...} });
  fr.x.drawImage(S.g3.canvas, 0, 0); fr.look.bloom = 0; fr.look.grain = 0;   // 2D 层自己的辉光和颗粒关掉，免得叠两遍
}
```

字幕、钩子行照旧用 `K.subs` / `K.hookBar` 画在 3D 画面之上。

## 后期链

HDR 场景（半浮点 + 深度，4×MSAA）→ 雾（从深度还原世界坐标）→ 特效层（没有深度缓冲，材质自己对着场景深度做柔边）→ 辉光（4 级）→ 光柱（1/4 分辨率，三遍径向模糊）→ 调色。

## `cine.render(scene, fx, camera, look)` 的 look

| 组 | 参数 | 说明 |
|---|---|---|
| | `t` | 片内时间（秒）。颗粒和特效层都靠它，必须传 |
| | `plain: true` | 跳过全部后期，three 直出。做前后对比用 |
| `fog` | `color`、`density`、`height`、`falloff` | 高度雾：`height` 处密度为 `density`，每升高 1 米按 `falloff` 指数变薄 |
| | `haze` | 不随高度变的均匀霾（每米）。远景发灰靠它 |
| | `sunDir`、`sunColor`、`sunPower` | 朝这个方向看，雾染成 `sunColor`。室内就填「镜头 → 灯」的方向 |
| | `max`（默认 1）、`sky` | 雾最多盖住多少；天空像素按多远算 |
| `bloom` | `strength`、`threshold`、`knee`、`weights` | 亮度超过 `threshold` 的部分才发光。实物不想发白就把阈值抬到 1.4 以上 |
| `shafts` | `pos`（世界坐标）或 `dir`、`strength`、`threshold`、`length`、`decay`、`color`、`skyOnly` | 光柱从光源的屏幕位置向外拉。室外太阳用 `dir` + `skyOnly: true` |
| `grade` | `exposure`、`contrast`、`saturation`、`tint` | three 自带的 ACES 先乘了 1/0.6，要对上它的亮度，`exposure` 给 1.5 左右 |
| | `shadows`、`highlights` | 分离色调：暗部和亮部各加一点颜色，如 `[0, 0.012, 0.03]` 冷暗部、`[0.03, 0.012, 0]` 暖亮部 |
| | `vignette`、`grain`、`fringe` | 暗角、颗粒、边缘色差。平时 0.4 / 0.035 / 0.003 |
| | `lens`、`lensAt` | 冲击鼓包：画面从 `lensAt`（世界坐标）向外鼓。只留三四帧（`env(t, t0, 0.02, 0.09)`），再久字会被扭歪 |
| | `fade`、`white` | 整体压暗、闪白 |

## 柔边特效件（放进 fx 场景）

| | |
|---|---|
| `cine.motes({ count, box, size, wind, color, ambient })` | 尘埃。`box = [cx, cy, cz, sx, sy, sz]`，在盒子里循环飘，进了聚光灯才亮 |
| `cine.mist({ count, box, size, wind, color, ambient, opacity, cover })` | 雾团。`cover` 0 是纯发光、不压暗场景，1 是实打实遮挡；室内暗场景给 0.1 |
| `cine.beam({ length, angle, color, strength })` | 光锥。尖在原点、沿 +Z 张开：`beam.position.copy(灯口); beam.lookAt(目标)` |
| `cine.lightTo(件, spotLight, k)` | 每帧调一次，把 SpotLight 的位置、朝向、张角同步给尘埃或雾团 |
| `cine.GLSL_SOFT`、`cine.fxU` | 自己写特效材质时用：`softZ(viewZ, 柔边米数)` 对着场景深度淡出 |

## 时间工具（不依赖 three，2D 镜头也能用）

| | |
|---|---|
| `VKCine.beats(bpm)` | 节拍表。`B.at(小节, 拍)` → 秒；`B.sheet({ HIT: 4, PULL: [2, 3] })` 一次换一整张。画面事件和 `meta.music` 的 `drop` 读同一张表，音画就对在一拍上 |
| `VKCine.rail([[t, x, y, z, …], …])` | 镜头轨 / 任何随时间走的量。单调三次插值，关键帧之间不回摆、不停顿。返回 `f(t)` → 数组 |
| `VKCine.env(t, t0, 起, 落)` | 打击包络：t0 起冲到 1 再指数衰减。闪白、震动、辉光加码都乘它 |
| `VKCine.shake(t, k)` | 确定性抖动 `[dx, dy]`，加在相机位置上 |

## 规矩和坑

- **全是 t 的函数。** 特效件的运动写在着色器里、只读 `uTime`；不要在 JS 里累加位置。`render.py --det` 要能过。
- **VK 的 `ss` 是 `ss(t, a, b)`**，时间在前。写反了不报错，值会一直卡在一头（11-18 示例片的淡入就这么暗了一整版）。
- **正对着灯的浅色面会曝成一块白。** 卡片、纸这类要读字的面，材质 `color` 压到四成（`0x6e6e6e`），别正对灯。
- **雾团别用高 `cover`。** 几十片半透明叠起来会把整个场景压暗。
- **耗时**：云端软件渲染，1920×1080、一盏带阴影的聚光灯、约 2000 个粒子，约 1.1 秒一帧（实测 300 帧 5 分 38 秒；60 秒片约 35 分钟，`--jobs 4` 没在 3D 片上测过）。`VKCine.create(g3, { scale: 0.75, samples: 0 })` 实测约 0.85 秒一帧，边缘有锯齿，只当预览档（示例里是 `VK_QUERY=fast`）。
- **不做的**：体积云、4096 阴影、水面倒影。这些在云端一帧要十几秒。

示例：`examples/cine_flashlight/`（10 秒，黑屋里的手电筒），前后对比图 `examples/look_cine_flashlight.jpg`。`VK_QUERY=plain python engine/render.py <工程> --stills …` 出关掉后期的版本。
