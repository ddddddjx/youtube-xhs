#!/usr/bin/env python3
"""建一个小红书账号的工作区。CLAUDE.md 是记忆入口：在工作区里启动 Claude Code 会自动加载它，
对应原流程里 WorkBuddy 的 .workbuddy/memory/。

用法:
  python3 init_workspace.py <账号名> [--root ~/Documents/小红书冷启动]

已存在的文件不覆盖，可以重复运行补齐缺的文件。
"""
import argparse
import datetime
import os

TODAY = datetime.date.today().isoformat()

FILES = {
    "CLAUDE.md": """# {name}：小红书账号工作区

在这个目录里做这个号的一切事。每一步做完，把结论写回下面的文件，并更新本页的摘要。
流程说明见 skill `xhs-cold-start`。

## 摘要（每次改完档案都同步这里）
- 一句话定位：（待定，第 3 步）
- 变现路径：（待定，第 1 步）
- 人设标签：（待定）
- 语气：（待定）
- 目标读者：（待定）
- 更新频率：（待定）
- 当前阶段：养号期，建于 {today}

## 内容边界（绝不发）
- 不提具体收益数字，不承诺效果
- 不引流站外（微信、公众号、二维码、链接）
- 不用极限词（最、第一、唯一、100%）
- 不改写、不复述对标笔记的具体内容，只学结构
- 不编造用户没有提供的个人经历
- AI 起草的笔记，发布时标注 AI 辅助

## 写稿规则
- 标题只用 选题库.md 里的公式填空，不超过 20 字，念一遍看像不像真人说的话
- 正文结构按 爆款公式.md
- 写完跑 ai_tone.py 和 check_paste.py

## 文件
- 账号档案.md：变现、定位卡、账号四件套、内容边界
- 爆款公式.md：对标样本和拆出来的公式；末尾是自己账号验证过的规律
- 选题库.md：七类 × 5 个选题和状态
- 排期.md：本周排期
- 对标/：对标笔记截图和文本
- 笔记/：每篇一个目录
- 复盘/：每周一份
- 发布日志.csv：每篇的数据
""",
    "账号档案.md": """# 账号档案：{name}

## 变现（第 1 步）
- 路径：接商单 / 开店卖货 / 挂链接带货 / 导流私域 / 卖课或服务（选一个为主）
- 已有的产品或能力：
- 愿意长期写的内容：

## 访谈记录（第 3 步）
### 第一轮 你是谁
### 第二轮 你服务谁
### 第三轮 你做什么
### 第四轮 你怎么做

## 定位卡
- 一句话定位：
- 人设标签（3 个）：
- 目标用户画像：
- 差异化：

## 账号四件套
- 名字（人格名 + 领域关键词）：
- 简介：我是 ___ ／ 帮 ___ 解决 ___ ／ 这里分享 ___ ／ 希望你在这里 ___
- 头像：
- 背景图：

## 内容边界
""",
    "爆款公式.md": """# 爆款公式（第 2 步）

## 样本
| # | 标题 | 粉丝 | 赞 | 藏 | 发布 | 形态 |
|---|---|---|---|---|---|---|

## 表面结构

## 底层引擎
低粉高赞 = 信息差焦虑选题 × 高收藏内容形态 × 过来人信任 × 低门槛转化

| 样本 | 信息差焦虑 | 高收藏形态 | 过来人信任 | 低门槛转化 |
|---|---|---|---|---|

## 可复制公式

## 自己账号验证过的规律
""",
    "选题库.md": """# 选题库（第 4 步）

状态：待写 / 已写 / 已发
""",
    "排期.md": """# 排期（第 7 步）

新号先养 3 到 5 天再发第一篇。养号开始日：
""",
}

DIRS = ["对标", "笔记", "复盘"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--root", default="~/Documents/小红书冷启动")
    a = ap.parse_args()
    ws = os.path.join(os.path.expanduser(a.root), a.name)
    os.makedirs(ws, exist_ok=True)
    for d in DIRS:
        os.makedirs(os.path.join(ws, d), exist_ok=True)
    for fn, tpl in FILES.items():
        p = os.path.join(ws, fn)
        if os.path.exists(p):
            print(f"  = {fn}（已存在，不覆盖）")
            continue
        with open(p, "w", encoding="utf-8") as f:
            f.write(tpl.format(name=a.name, today=TODAY))
        print(f"  + {fn}")
    print(f"✓ 工作区：{ws}\n  以后在这个目录里启动 Claude Code（cd \"{ws}\" && claude），CLAUDE.md 会自动加载")


if __name__ == "__main__":
    main()
