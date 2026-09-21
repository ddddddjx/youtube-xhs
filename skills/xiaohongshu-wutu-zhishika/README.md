# 小红书五图知识卡格式 — 完整导出包

可分享给其他助手 / Cursor Skill 使用。

## 包内结构

```
SKILL.md                          # 主 Skill（先读这个）
README.md                         # 本说明
templates/
  dotey_voice.md                  # @dotey 权威开篇文风
  xhs_heili_engagement.md         # 「这很盒里」兴趣转化
  xhs_visual_highlight.md         # 崔璀式首图可视化 + 整句高亮
  xhs_ronnie_format.md            # 罗尼研报笔记并列轨
samples/
  dankoe_v4_no_cta/               # 默认轨黄金样张 01–05 + CAPTION.md
  ronnie_refs/                    # 罗尼轨参考截图
templates/video_keyframes.md      # （新增）YouTube 视频 → 关键帧证据卡流程
scripts/                          # （新增）
  extract_keyframes.py            # 场景检测抽候选帧 + 带时间戳总览图
  grab_frame.sh                   # 按时间点抽原分辨率帧，可裁剪
  render_cards.py                 # cards.json → 1080×1440 罗尼轨卡片 PNG + overview.jpg
```

## 如何导入

1. **Cursor / Grok Bot Skill**：把整个文件夹放到 skills 目录，或把 `SKILL.md` 内容新建为 Skill，同时保留同级 `templates/` 与 `samples/`。
2. **只给别人文案规则**：至少附上 `SKILL.md` + `templates/` 四个 md；样张可选但强烈建议带上，用于 1:1 对标。
3. **出图前**：先定风格轨（默认五图 Dankoe，或点名罗尼研报笔记），再按对应模板执行。

## 许可与注意

- 样张仅作版式参考；内容版权归原作者 / 原账号。
- 导出时已去掉本机绝对路径与内部协作角色名，改为相对路径与通用称呼。
