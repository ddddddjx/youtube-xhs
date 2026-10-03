#!/usr/bin/env python3
"""检查小红书文案是否可以直接复制粘贴、会不会踩平台规则：
不能有 Markdown 符号、占位提示、站外链接 / 导流用语；标题不超过 20 字，且不和封面大字说同一句话；
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
    if re.match(r"\s*[A-Za-z]+\s+[A-Za-z]+", text) and not re.match(r"\s*[A-Z][a-z]+\s+[A-Z][a-z]+", text) or re.match(r"\s*[a-z]", text):
        problems.append(f"  {tag}以英文句子开头（产品名 + 中文可以，How to / 英文短语不行）：{text}")
    if re.search(r"how\s*to", text, re.I):
        problems.append(f"  {tag}含 How to：改成人话痛点或「为什么…」：{text}")
    if re.search(r"教你|干货|必看|震惊|保姆级|求收藏|收藏起来|建议收藏", text):
        warns.append(f"  ⚠ {tag}有「教你 / 干货 / 必看」类词（dbs-content：所有让你讲干货的都是不专业的）：{text}")
    head = re.sub(r"^[A-Za-z][A-Za-z0-9 .]*?(?=[\u4e00-\u9fff])", "", text)[:8]  # 去掉开头的英文产品名再数 8 字
    ORG = r"斯坦福|哈佛|MIT|CMU|谷歌|微软|苹果|英伟达|OpenAI|教授|博主|公开课|网课|长文"
    if re.search(ORG, head) or re.match(r"\s*[A-Z][a-z]+\s+[A-Z][a-z]+", text):
        warns.append(f"  ⚠ {tag}以人名 / 机构开头（09-24 复盘：这类开头 4.9–8.2%，数字开头 12.3%）：人名机构挪到后半句做背书：{text}")
    plain = bool(re.search(r"。$", text.strip()) and re.match(r"\s*(我|感觉|头一回|第一次|终于|这次|今年|最近)", text))  # 10-04 起：平常话 + 句号（对标小盖）
    if not plain and not re.search(r"\d|你|总是|越.*越|又.*了", head):
        warns.append(f"  ⚠ {tag}前 8 字没有数字，也没有读者处境（你的 / 总是 / 越用越）：{head}")
    if not plain and not re.search(r"[？?]|不是.*[是而]|反而|为什么|凭什么|怎么|如何|不.*(也能|就能|砍|反)", text):
        warns.append(f"  ⚠ {tag}没有问句、「不是 X 是 Y」或「反而」：可能把答案写进了标题，念一遍看读者还要不要点：{text}")
    if re.search(r"优雅|爆涨|暴涨|震惊|最根本原因，", text):
        warns.append(f"  ⚠ {tag}有自嗨词 / 新闻腔（优雅、爆涨）：换成读者的处境：{text}")
    if re.search(r"^(额度|模型|上下文|窗口|成本|token)", text.strip()):
        problems.append(f"  {tag}主语路人看不懂（「额度」是什么额度？）：前面补产品名，如「Claude 额度」：{text}")
    terms = re.findall(TERMS, text)
    if len(terms) > 1:
        warns.append(f"  ⚠ {tag}术语 {len(terms)} 个（{', '.join(terms)}）：最多 1 个，其余翻成人话")
    if re.search(r"[！!]$", text.strip()):
        warns.append(f"  ⚠ {tag}以感叹号结尾")


def cover_text(folder):
    """从 编辑用/ 里找封面大字：cards.json 的封面页、comic.json 的封面页、draft.md 的 cover。"""
    import json
    ed = os.path.join(folder, "编辑用")
    for name in ("cards.json", "comic.json"):
        p = os.path.join(ed, name)
        if os.path.exists(p):
            try:
                pages = json.load(open(p, encoding="utf-8")).get("pages", [])
            except ValueError:
                continue
            if pages and pages[0].get("title"):
                return pages[0]["title"]
    p = os.path.join(ed, "draft.md")
    if os.path.exists(p):
        m = re.search(r"^cover:\s*(.+)$", open(p, encoding="utf-8").read(), re.M)
        if m:
            return re.sub(r"\s+#\s.*$", "", m.group(1))
    return ""


def bigrams(t):
    t = re.sub(r"==|<br\s*/?>|\\n|[^0-9A-Za-z\u4e00-\u9fff]", "", t)
    return {t[i:i + 2] for i in range(len(t) - 1)}


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
        cov = bigrams(cover_text(os.path.dirname(path)))
        if cov:
            share = len(cov & bigrams(text)) / len(cov)
            if share >= 0.5:
                problems.append(f"  标题和封面大字说的是同一句话（重合 {share:.0%}），浪费了一个钩子位："
                                "封面讲画面或反差，标题讲读者的问题并带上可搜的词")
    if os.path.basename(path) == "正文.txt":
        body = "\n".join(lines)
        # meme版（meme-xhs）忠实还原 MemeInformation：原号没有二选一和领取物，缺了只提醒不拦
        meme = os.path.basename(os.path.dirname(path)).startswith("meme版")
        cta = warns if meme else problems
        pre = "  ⚠ " if meme else "  "
        head = "\n".join(l for l in lines if l.strip()[:6])
        if not re.search(r"打\s*A\s*或\s*B|A\s*还是\s*B", body):
            cta.append(pre + "正文没有二选一互动问题（「你是 A 还是 B，评论区打 A 或 B」）")
        if re.search(r"下一期[：:]", body):
            problems.append("  正文里有「下一期：…」，这行只放图文末页名片卡，正文里删掉")
        if re.search(r"我的(看法|观点|想法|判断|做法)(是|[：:，])", body):
            problems.append("  正文里有「我的看法是 / 我的看法：」这类领起语；直接把判断说出来（09-30 用户要求）")
        if re.search(r"扣\s*1|扣一|后台数据每周公开|AI ?全权运营", body):
            problems.append("  正文里有「评论区扣 1 领」或「AI 全权运营 / 后台数据公开」：09-30 起不写（领取物想给就在评论里直接给）")
        n_body = len(re.sub(r"#\S+", "", body).strip())
        if n_body > 1000:
            problems.append(f"  正文 {n_body} 字（不含标签），超过小红书 1000 字上限")
        first = [l for l in lines if l.strip()][:8]
        if meme:
            first = None
        if any(re.search(r"^\s*\S{2,8}\s*(#\s*\d+|[｜|·]\s*第\s*\d+\s*期)\s*$", l) for l in lines[:3]):
            problems.append("  正文开头有栏目期数（海外精读 #N / K老师讲AI｜第 N 期）：09-29 起期数只记在 log 里，第一行留给钩子")
        if first is not None and not any(re.search(r"我不同意|我试了|我照着|会失败|我只想|越.{0,6}越觉得|我更想|我顺着", l) for l in first):
            warns.append("  ⚠ 正文前 8 行没看到你的判断：立场要前置到第一屏（不带标签）")
        tags = re.findall(r"#(\S+)", body)
        kw_file = os.path.join(os.path.dirname(path), "编辑用", "draft.md")
        if os.path.exists(kw_file):
            m = re.search(r"^keyword:\s*(.+)$", open(kw_file, encoding="utf-8").read(), re.M)
            if m:
                core = [w for w in re.split(r"[\s，,、]+", m.group(1).strip()) if w]
                main = max(core, key=len).lower() if core else ""
                first = next((l for l in lines if l.strip()), "")
                if main and main not in first.lower():
                    warns.append(f"  ⚠ 正文第一句没有主关键词「{main}」（搜索权重最高的位置之一）")
                if main and not any(main in t.lower() for t in tags):
                    warns.append(f"  ⚠ 标签里没有主关键词「{main}」：原样加一个 #{main}")
        if meme and not re.search(r"这个号|每天一篇|每周|AI 全权运营|AI全权运营|扣\s*1", body):
            warns.append("  ⚠ 正文里没有关注理由（一句这个号持续给什么，或者领取物）：读者在图下文字里也要看到一次")
        if re.search(r"你怎么看|大家怎么看|欢迎讨论|你觉得呢", body):
            warns.append("  ⚠ 有开放式提问（你怎么看）：改成二选一")
    if os.path.basename(path) == "置顶评论.txt" and re.search(r"扣\s*1|扣一", "\n".join(lines)):
        problems.append("  置顶评论里有「扣 1」：09-30 起不写，想给的东西直接写进评论")
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
