#!/usr/bin/env python3
"""检查小红书文案是否可以直接复制粘贴、会不会踩平台规则：
不能有 Markdown 符号、占位提示、站外链接 / 导流用语；标题不超过 20 字；
极限词、投资用语给 ⚠ 提醒（不算失败）；「仅供学习」的视频版不能带发布文案。

用法: python3 check_paste.py <目录>   # 检查目录下所有 标题.txt / 标题备选.txt / 正文.txt / 开头卡.txt / 置顶评论.txt
有问题时退出码 1 并列出行号。
"""
import os
import re
import sys

RULES = [
    (r"\*\*|__", "Markdown 加粗符号 ** / __"),
    (r"^\s*#{1,6}\s", "Markdown 标题（行首 # 加空格）"),
    (r"^\s*>\s?", "Markdown 引用 >"),
    (r"`", "反引号 `"),
    (r"^\s*[-*]\s", "Markdown 列表符 - / *（改用 1. 或 · 或 emoji）"),
    (r"\[[^\]]*\]\([^)]*\)", "Markdown 链接 [文字](网址)"),
    (r"==", "高亮标记 =="),
    (r"^\s*[-=_]{3,}\s*$", "分隔线 --- / ==="),
    (r"（在这里|TODO|待补|占位|草稿供参考", "给作者看的占位提示"),
    (r"https?://|www\.|youtu\.be|youtube\.com|x\.com/|twitter\.com|t\.co/", "站外链接（出处只写频道名 + 标题）"),
    (r"油管|去\s*(YouTube|推特|X)\s*(上)?(搜|看|找)|翻墙|科学上网|梯子|VPN|vpn", "站外导流 / 翻墙用语"),
    (r"微信|VX|vx|V信|威信|加我|私我领|公众号|tg群|Telegram|电报群", "私域导流用语"),
]

WARNS = [
    (r"全网(最|第一|首发|独家)|史上最|世界第一|第一名|No\.?\s?1|100%|百分百|绝对|永久|万能|顶级|唯一", "极限词"),
    (r"稳赚|必涨|暴涨|翻倍|抄底|上车|梭哈|财富自由|荐股|喊单|带单|买入|建仓|百倍币|空投", "投资 / 荐币用语"),
    (r"比特币|BTC|以太坊|ETH|币圈|加密货币|炒币|山寨币", "加密货币话题（小红书严管，确认不是行情 / 荐币内容）"),
]
TEXT_FILES = ("标题.txt", "正文.txt", "标题备选.txt", "开头卡.txt", "置顶评论.txt")
STUDY_ONLY = "仅供学习_勿上传.txt"

TERMS = r"skills?|Agents?|harness|tokens?|prompt|RAG|LLM|MCP|workflow|pipeline"


def title_check(text, problems, warns, tag="标题"):
    """dbs-xhs-title 五条铁律里能机器查的部分。"""
    if re.match(r"\s*[A-Za-z]", text):
        problems.append(f"  {tag}以英文开头（前 8 字要有人名 / 机构 / 数字，不用 How to）：{text}")
    if re.search(r"how\s*to", text, re.I):
        problems.append(f"  {tag}含 How to：改成人话痛点或「为什么…」：{text}")
    if re.search(r"教你|干货|必看|震惊|保姆级|收藏", text):
        warns.append(f"  ⚠ {tag}有「教你 / 干货 / 必看」类词（dbs-content：所有让你讲干货的都是不专业的）：{text}")
    head = text[:8]
    if not re.search(r"\d|[A-Z][a-z]+|[A-Z]{2,}", head) and not re.search(r"斯坦福|哈佛|MIT|CMU|谷歌|微软|苹果|英伟达|OpenAI|教授|博主", head):
        warns.append(f"  ⚠ {tag}前 8 字没有人名 / 机构 / 数字（搜索入口）：{head}")
    terms = re.findall(TERMS, text)
    if len(terms) > 1:
        warns.append(f"  ⚠ {tag}术语 {len(terms)} 个（{', '.join(terms)}）：最多 1 个，其余翻成人话")
    if re.search(r"[！!]$", text.strip()):
        warns.append(f"  ⚠ {tag}以感叹号结尾")


def check(path):
    problems, warns = [], []
    lines = open(path, encoding="utf-8").read().splitlines()
    for i, line in enumerate(lines, 1):
        for pat, why in RULES:
            if re.search(pat, line):
                problems.append(f"  第 {i} 行 {why}: {line.strip()[:40]}")
        for pat, why in WARNS:
            m = re.search(pat, line)
            if m:
                warns.append(f"  ⚠ 第 {i} 行 {why}「{m.group(0)}」: {line.strip()[:40]}")
    if os.path.basename(path) == "标题.txt":
        text = "".join(l.strip() for l in lines if l.strip())
        if len([l for l in lines if l.strip()]) != 1:
            problems.append("  标题.txt 应该只有一行")
        if len(text) > 20:
            problems.append(f"  标题 {len(text)} 字，超过 20 字：{text}")
        title_check(text, problems, warns)
    if os.path.basename(path) == "正文.txt":
        body = "\n".join(lines)
        head = "\n".join(l for l in lines if l.strip()[:6])
        if not re.search(r"打\s*A\s*或\s*B|A\s*还是\s*B", body):
            problems.append("  正文没有二选一互动问题（「你是 A 还是 B，评论区打 A 或 B」）")
        if "下一期" not in body:
            problems.append("  正文没有「下一期：…」预告")
        if not re.search(r"扣\s*1|扣 ?一", body):
            problems.append("  正文没有可领取物提示（「评论区扣 1 发你」）")
        first = [l for l in lines if l.strip()][:8]
        if not any(re.search(r"精读\s*#|第\s*\d+\s*期", l) for l in first):
            warns.append("  ⚠ 正文前 8 行没有栏目期数（海外精读 #N / K老师讲AI｜第 N 期）")
        if not any(re.search(r"我的看法|我不同意|我试了|会失败", l) for l in first):
            warns.append("  ⚠ 正文前 8 行没看到你的判断：「我的看法」要前置到第一屏")
        if re.search(r"你怎么看|大家怎么看|欢迎讨论|你觉得呢", body):
            warns.append("  ⚠ 有开放式提问（你怎么看）：改成二选一")
    if os.path.basename(path) == "开头卡.txt":
        for i, l in enumerate(lines, 1):
            if len(l.strip()) > 16:
                warns.append(f"  ⚠ 第 {i} 行开头卡 {len(l.strip())} 字，超过 16 字（大字卡读不完）：{l.strip()}")
    if os.path.basename(path) == "标题备选.txt":
        for i, l in enumerate(lines, 1):
            if len(l.strip()) > 20:
                problems.append(f"  第 {i} 行标题 {len(l.strip())} 字，超过 20 字：{l.strip()}")
            if l.strip():
                title_check(l.strip(), problems, warns, f"第 {i} 行")
    return problems, warns


def main(root):
    bad = False
    for dirpath, _, files in os.walk(root):
        if STUDY_ONLY in files and any(f in files for f in TEXT_FILES):
            print(f"✗ {os.path.relpath(dirpath, root)}: 标了「仅供学习」却带发布文案，删掉 标题.txt / 正文.txt / 开头卡.txt / 置顶评论.txt")
            bad = True
        for f in sorted(files):
            if f in TEXT_FILES:
                p = os.path.join(dirpath, f)
                probs, warns = check(p)
                print(("✗ " if probs else "✓ ") + os.path.relpath(p, root))
                for x in probs + warns:
                    print(x)
                bad = bad or bool(probs)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main(sys.argv[1])
