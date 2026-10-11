# 引擎 API（engine/）

一个片子工程 = 一个目录，里面 `script.json`（拍子）、`timeline.json`（timeline.py 生成）、`facts.json`、`film.js`（画面代码）。
`film.js` 导出 `setup(c)`，返回 `update(t)`；可选导出 `post`（后期参数）。示范：`engine/films/demo/`。

```js
export const post = { bloom: .75, radius: .5, threshold: .55, vignette: .55, grain: .045 };   // 都可不写
export async function setup(c) {
  const { THREE, scene, camera, hud, W, H, at, end } = c;   // c 里还有 core / prims / hud 的全部导出
  ...搭场景、hud.add(...)...
  return t => { ...每帧按 t 更新... };
}
```

## 时间（core.js）
- `at('id', 偏移)` / `end('id', 偏移)`：某一拍开始 / 结束的时刻。**画面代码只用拍子 id，不写死秒数**：改稿、换旁白之后时间轴自动跟着变。
- `prog(t, t0, d, ease)` 0→1 进度；`win(t, a, b, fi, fo)` 带淡入淡出的显示窗口；`slam(t, t0)` 砸入缩放（1.55→0.94→1）；`pulse(t, t0, d)` 一次 0→1→0。
- 缓动：`smooth`（默认）、`easeOut`、`easeIn`、`easeInOut`。随机：`rng(seed)`，不许用 `Math.random`。
- 镜头：`cameraRig(camera, keys)`，`keys = [{t, pos, look, fov, zoom, ease}]`；`zoom: true` 时距离做对数插值（推进 / 钻入 / 拉远都用它）；两个 key 相同就是停住。
- `project(obj, camera, W, H)` 把 3D 物体投到屏幕坐标，标签引线用。

## 3D 积木（prims.js）
每个都返回 Object3D，`.update(t)` 每帧调一下（有的话），`.fade(a)` 整体透明度。

| 积木 | 用途 | 关键参数 |
|---|---|---|
| `particles` | 水里漂的颗粒（size 2–6、多）；前景散景（size 40–160、少、离镜头近、soft .9） | n, box, center, size, color[], opacity, drift, seed |
| `jelly` | 半透明果冻：细胞、器官、透视的身体。`.glow(a)` 被照亮 | r, scale, color, rim, inner, granules |
| `cloud` + `shapes` | 点云 + 星座连线：大脑（`shapes.brain`）、神经网、器官。`.light([{c, r, a, color}])` 点亮一片 | sampler, n, color, links, linkDist |
| `path3` | 一条发光回路，`.draw(0..1)` 画到哪 | points, color, width |
| `beam` | 光束（母题），`.power(0..1)` 开关 | from, to, r0, r1, color, intensity |
| `rays` | 丁达尔光柱（背景） | n, color, spread, tilt, opacity |
| `ring` | 扩散光环，`.fire(t, t0, d, grow)`；每帧 `.face(camera)` | color, r |
| `dotOutline` + `outlines` | 琥珀色点阵轮廓：「他看见的画面」 | paths（二维折线）, spacing, color |
| `mug` / `book` / `table` / `toyMaterial` | 玩具感日常物、暖色桌面（配 THREE 的灯） | color |

要别的形状：直接用 THREE（几何体 + `toyMaterial`），或者给 `cloud` 写一个 sampler。人和动物：低细节圆润的组合体（球 + 胶囊），不追写实，不画血。

## 信息层（hud.js）
`hud.add(new c.X({from, to, ...}))`；from / to 用 `at()` / `end()`。所有元素 0.4 秒淡入 + 上移，0.3 秒淡出。竖屏自动放大 1.3 倍。安全区 `hud.safe`（竖屏避开平台界面）。

| 元素 | 用途 | 参数 |
|---|---|---|
| `Chapter` | 章节头：大号衬线年份｜人名 · 发现，下一行出处 | year, title, cite, x?, y? |
| `Label` | 物体标签：中文名 + 英文小型大写 + 说明，引线连到物体 | zh, en, note, x, y, anchor: () => project(obj, ...) |
| `Chart` | 现场画的折线 + 大号关键数字 + 参照线 | x, y, w, h, xr, yr, ticks, series[{name,color,pts,delay}], big, unit, bigPos:[fx,fy]（图内相对位置，默认 [.42,.72]）, notes |
| `Flow` | 流程对比（两行胶囊节点） | x, y, rows[{label, nodes[], end, tail, color, at}] |
| `Toggle` | iOS 开关 | x, y, label, state(t), switchK(t) |
| `Chip` | 胶囊芯片「● 蓝光 | 470 nm」 | x, y, a, b, color, align |
| `ScaleBar` | 比例尺 | x, y, w, text |
| `Checklist` | 一条条累加的结果 | x, y, items[{at, text, color}] |
| `TitleCard` | 片名卡（失焦到清晰） | title, subtitle, kicker, size |
| `Person` | 人物卡，锚定在 3D 物体下 | zh, en, did, meta, anchor |
| `Text` | 居中的金句、问题 | text, y, size, color |
| `Corner` | 右下角「示意」 | text |
| `Credits` | 片尾出处小字 | lines[] |

字幕（`Subtitles`）自动按 timeline.json 画：逐字出现，`key` 关键词点金色，有 `en` 时英文在下一行。拍子写 `nosub: true` 就不出字幕。

## 渲染
- `scripts/render.py <工程> --stills 1,5,9 --out 静帧/`：先出静帧看质感（几秒）。
- `scripts/render.py <工程> --out 画面.mp4 --fps 30 --layout layout.json`：整片（放后台跑），顺带导出文字框给 qa.py。
- `--scale .5` 出半分辨率草稿；`--from / --to` 只渲一段。
- 浏览器预览：把 engine 和工程目录按 render.py 的方式挂在 /engine/ 和 /film/ 下，打开 `/engine/index.html?t=秒`。
