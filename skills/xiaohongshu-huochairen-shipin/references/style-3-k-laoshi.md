# Style 3：K 老师漫画风（Krypto说AI 专属）

选了 Style 3 就读这份。和 `style-catalog.md`、`omni-flash-prompt-contract.md` 冲突的地方，以这份为准；没提到的（五段心跳结构、三拍节奏、首尾衔接、音频双锁、不出字）照原规范走。

## 为什么能稳定

只靠文字描述，视频模型每段都会把 K 老师画得不一样（头发变白、领带变色、长出写实的脸）。所以 Style 3 用三层锁：

1. **图锁**（最稳）：`scripts/render_refs.py` 用漫画图文同一份 `characters.py` 出图——
   - `ref_k_laoshi.png`：K 老师 8 个姿势表情；`ref_cast.png`：K 老师 / 小白 / 普通 bot / 主角 bot
   - `clipNN.png`：每段的首帧（可选 `clipNN_end.png` 尾帧）
   生成时，界面能上传参考图就传 `ref_k_laoshi.png`（有配角再加 `ref_cast.png`）；能指定首帧就传 `clipNN.png`（图生视频）。只能传一张时优先传首帧，因为首帧里已经画了人
2. **接力锁**：第 2 段起，如果界面支持拿上一段的最后一帧当首帧，就用生成出来的真实尾帧，比预渲染的 `clipNN.png` 更接得上
3. **文字锁**：下面的角色锚点**逐字**写进每一条 prompt，不改写、不缩短

## 角色锚点（英文逐字照抄）

**不要在 prompt 里写 "Einstein" 或任何真人名字**：模型会往写实肖像画，也可能触发公众人物限制。画面里、台词里他只叫「K 老师」。

**K 老师**，第 1 段：
```text
A hand-drawn 2D cartoon stick-figure professor mascot: a big round white head with a thick black outline, a large jagged starburst of light-grey spiky hair sticking out all around the head, two small solid black dot eyes with thin arched eyebrows, a thick light-grey curled mustache, and a small red tongue sticking out under the mustache in a cheeky playful look. Body: a small black triangular jacket over a vertical bright lemon-yellow tie, thin straight black stick arms and legs, small solid black oval feet. Thick uniform black marker outlines with a slightly wobbly hand-drawn line, flat colors only, no shading.
```

**K 老师**，第 2–N 段：
```text
The same hand-drawn stick-figure professor mascot as the reference image: jagged light-grey starburst hair, big round white head, black dot eyes, light-grey curled mustache, small red tongue out, black triangular jacket with a bright lemon-yellow tie, thin black stick limbs, black oval feet. Identical proportions, line weight and colors in every frame.
```

**小白**（有配角时加）：
```text
A plain round-headed stick figure with three short black hair strands sticking straight up, black dot eyes, a simple line mouth, a light-grey triangular t-shirt, thin black stick limbs and black oval feet, same thick wobbly marker line.
```

**bot**（代表 AI / Agent / 模型）：
```text
A stick-figure robot with a square white head with rounded corners, a short antenna ending in a small circle, black dot eyes, a black triangular jacket with a light-grey tie, thin black stick limbs. The featured model version has a bright lemon-yellow tie and a lemon-yellow antenna tip.
```

表情只用这几种，写 prompt 时用英文描述：吐舌 tongue（招牌）、眯眼笑 happy、斜眼得意 smug、思考 think（一边眉毛挑起、不吐舌）、惊讶 surprise（圆眼 + 张嘴）、难过 sad、无语 meh（半闭眼 + 嘴一条线）。

## 画面与配色

```text
Flat pure white background with at most one flat light-grey ground band. Bold hand-drawn black marker lines. The only accent color is bright lemon yellow; light grey for hair, mustache and ground; the small red tongue is the only red.
```

- 强调色只有**柠檬黄**一种（对应头像底色），不再像 Style 1 那样挑三种。「好 / 答案 / 主角」用黄，「坏 / 翻车」用红色叉或灰色
- 道具从 `xiaohongshu-manhua-jiangjie/scripts/characters.py` 的 `PROPS` 里挑（laptop / browser / doc / checklist / bulb / chart / bars / clock / coin / robot / box / wall / question / exclaim / cross / check / tangle / arrow / basket / stack / timeline / bill / brick / pan / chefhat …），这样首帧能画出来、视频和图文用的是同一套道具
- 动作从 `POSES` 里挑（stand wave point shrug cheer think hold walk carry push kneel headache run sit lean），首帧摆的就是这一拍开头的姿势
- 节奏照原规范：每 2–3 秒画面要有变化，但变化靠**人做动作 + 道具进出场 + 镜头推拉**，不靠变形特效

## 构图

- 默认 `9:16`（小红书）。人物和道具放在画面中间偏下；**上方约 1/5、下方约 1/6 留空**，后期放「K老师讲AI」栏目名、标题和字幕（`render_refs.py` 的竖版首帧已按这个位置排）
- `16:9` 时左中右三段站位，照原规范

## 口播

- **默认中文普通话口播**，用户要英文再换英文。每段 10 秒约 **40–50 个汉字**（60 秒约 240–300 字）；英文仍按原规范每段 20–25 词
- 口播就是 K 老师在讲课：说「你」，嘴有点欠但讲得明白；小白负责替观众提问。不用「原帖」「作者说」「视频里说」这类转述腔（同漫画图文规则）
- 旁白锁（每条 prompt 逐字重复）：
  ```text
  Identical narrator: a playful, sharp middle-aged male voice speaking clear standard Mandarin Chinese, lightly teasing but warm, relaxed lecture pace, voice-first mix, audio voiceover only, strictly no speech bubbles or dialogue boxes.
  ```
- BGM 锁：第 1 段 `light playful pizzicato strings and soft marimba, curious and upbeat`；第 2–N 段 `seamlessly continues the identical light playful pizzicato strings and soft marimba from clip 1, same tempo and instrumentation`

## 负面约束（Style 3 每条都加）

```text
Negative constraints: not a realistic person, not a caricature of any real scientist, no photorealistic face, no wrinkles, no detailed pupils or irises, no nose, no 3D rendering, no gradients, no shading, no paper texture; the hair always stays light-grey and spiky, never smooth, white or brown; the tie always stays lemon yellow; the tongue stays small; no extra characters beyond those described; no speech bubbles, no captions, no subtitles, no visible words, letters or numbers.
```

## 后期（出片之后）

- 生成的片段不带字。字幕、栏目名、标题钩子后期加，版式参考 `youtube-xhs/templates/video_frame.md`（1080×1920：顶部栏目名 + 标题钩子，底部字幕）；这里没有英文原声，字幕只放中文一行即可
- 结尾那段口播落在「可以被反对的判断 + 你站 A 还是 B」，和图文版的「回头看」页同一件事
- 如果某段 K 老师还是走样：先换成接力首帧重生成；还不行就把这段改成更简单的动作（stand / point / think），别在一段里塞跑跳 + 道具 + 配角
