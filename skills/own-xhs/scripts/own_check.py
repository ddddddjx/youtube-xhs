#!/usr/bin/env python3
"""own-xhs 的检查：量的是输入有没有进稿子，不是句式。

和 meme_check 的区别（10-08，对照小盖 Personal Agent 稿）：
- 不查「假设我」上限、押注上限、「我觉得」上限、结尾对仗、结构词孤段、首屏时间锚 / 反差、转述词密度。小盖那篇这些全违规，
  读者没觉得是 AI，因为前后都贴着他自己的场景。
- 查三样：① 编辑用/输入.md 里用户的判断至少 3 条进了稿子，而且原文里找不到；② 用户的日程至少 3 条进了稿子，带日期或地点；
  ③ 连续 3 段以上没有一个具体东西（抽象接抽象）。
- 李录四条照旧 ✗：成品里不露生产过程、不用直译比喻、不给文章打分、开头有具体东西。
- 账号硬规则照旧：不预告下一期、不导流、标题 20 字。

用法:
  python3 own_check.py <meme版目录 或 draft.md>
"""
import difflib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "meme-xhs", "scripts"))
import meme_check as mc  # noqa: E402  复用 parse / check_title / 词表

add, results = mc.add, mc.results

PROCESS = (r"^(推荐看看|非常推荐|推荐大家|强烈推荐|推荐你)", r"^先说.{0,4}是谁", r"讲了很长一段|下面是.{0,6}讲|下面是.{0,6}的部分",
           r"整理稿|两份稿子|稿子对不上|素材里|这份素材|这篇素材|这份材料")
TRANSLATED = r"不在一个坐标系|同一个坐标系|一个坐标系|一把尺子|多一把尺|量这项技术|一个量法|的尺子"
GRADE = r"这条我站|这点我同意|这点我也认同|这条我认|这条我暂时|我暂时站|我站他|这个分法我同意|整篇我就认|这条我不同意"
DATE = r"\d{1,2}\s*月\s*\d{1,2}|\d{1,2}\s*[日号]|周[一二三四五六日末]|上周|这周|下周|上个月|昨天|今天|前天|上午|下午|晚上|\d{1,2}\s*点|国庆|放假|周末"
PLACE = r"香港|上海|北京|深圳|美国|新加坡|东京|巴厘岛|公司|办公室|家里|机场|地铁|会议室|客户|出差|海底捞|商学院"
FORBID = r"下一期|下期|后面还想单独写|后面再写|下次再写|关注我|求关注|点个关注|公众号|二维码|加我微信|加微信|私信我"
EXTREME = r"最[好强牛快贵便宜]|第一名|唯一|100%|全网|史上"


def read(path):
    return open(path, encoding="utf-8").read() if os.path.exists(path) else ""


def bullets(section):
    return [re.sub(r"^[-*\d.、)）\s]+", "", l).strip() for l in section.splitlines() if re.match(r"^\s*[-*\d]", l)]


def parse_input(txt):
    """编辑用/输入.md：## 判断 / ## 日程 / ## 原话 三节，每节一行一条，用户原话不改。"""
    out = {"判断": [], "日程": [], "原话": []}
    for name in out:
        m = re.search(rf"^##\s*{name}[^\n]*\n(.*?)(?=^##\s|\Z)", txt, re.S | re.M)
        if m:
            out[name] = [b for b in bullets(m.group(1)) if b]
    return out


def found_in(item, paras, thresh=0.5):
    """一条输入有没有进稿子：和任一段的相似度，或 8 字片段命中。"""
    item_c = re.sub(r"[\s，。、！？!?,.:：;；「」“”\"'（）()]", "", item)
    for p in paras:
        p_c = re.sub(r"[\s，。、！？!?,.:：;；「」“”\"'（）()]", "", p)
        if not p_c:
            continue
        if difflib.SequenceMatcher(None, item_c, p_c).ratio() >= thresh:
            return True
        for i in range(0, max(1, len(item_c) - 7)):
            if len(item_c[i:i + 8]) == 8 and item_c[i:i + 8] in p_c:
                return True
    return False


def in_source(item, source):
    s = re.sub(r"\s", "", source)
    c = re.sub(r"[\s，。、！？!?,.:：;；「」“”]", "", item)
    return any(c[i:i + 10] in s for i in range(0, max(1, len(c) - 9)) if len(c[i:i + 10]) == 10)


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    arg = args[0]
    folder = arg if os.path.isdir(arg) else os.path.dirname(os.path.dirname(os.path.abspath(arg)))
    edit = os.path.join(folder, "编辑用")
    draft_p = os.path.join(edit, "draft.md")
    if not os.path.exists(draft_p):
        sys.exit(f"找不到 {draft_p}")
    raw = read(draft_p)
    meta, paras = mc.parse(raw)
    source = read(os.path.join(edit, "source.md"))
    inp = parse_input(read(os.path.join(edit, "输入.md")))
    body = "".join(paras)
    n_chars = len(re.sub(r"\s", "", body))

    # 标题
    titles = [meta.get("title", "")]
    for f in ("标题.txt", "标题备选.txt"):
        titles += [l for l in read(os.path.join(folder, f)).splitlines() if l.strip()]
    for t in dict.fromkeys(t for t in titles if t):
        mc.check_title(t, "--allow-cn-brand-title" in argv)
    if not any(re.search(r"\d|[一二两三四五六七八九十百千万]+\s*[万千百个人篇条]", t) for t in titles if t):
        add("⚠", "标题没有数字（10-07 公式：数字 + 社会证明 + 痛点动词 + 可搜词，点击率数据撑着的，own 模式照用）")

    # 输入三样
    if not inp["判断"] and not inp["日程"]:
        add("✗", "没有 编辑用/输入.md，或者里面没有「## 判断」「## 日程」：own 模式的稿子只能从用户的回答里长出来，先问再写")
    else:
        j_in = [j for j in inp["判断"] if found_in(j, paras)]
        j_src = [j for j in inp["判断"] if in_source(j, source)]
        add("✓" if len(j_in) >= 3 else "✗", f"用户的判断 {len(inp['判断'])} 条，进了稿子 {len(j_in)} 条（至少 3 条，每条当一个编号句）"
            + ("" if len(j_in) >= 3 else "：没进的 " + " / ".join(f"「{j[:16]}」" for j in inp["判断"] if j not in j_in)))
        for j in j_src:
            add("⚠", f"判断「{j[:20]}」原文里已经说过，不算自己的判断，换一条或往前推一步")
        s_ok = [s for s in inp["日程"] if re.search(DATE, s) or re.search(PLACE, s)]
        for s in inp["日程"]:
            if s not in s_ok:
                add("⚠", f"日程「{s[:20]}」没有日期也没有地点：回去再问一句「哪天、在哪」")
        s_in = [s for s in inp["日程"] if found_in(s, paras)]
        add("✓" if len(s_in) >= 3 else ("⚠" if len(s_in) >= 2 else "✗"),
            f"用户的日程 {len(inp['日程'])} 条，进了稿子 {len(s_in)} 条（至少 3 条，每个编号下面放一个；小盖那篇 5 个）")
        for q in inp["原话"]:
            if not found_in(q, paras, 0.8):
                add("⚠", f"原话「{q[:20]}」被改写或没用：原话原样放，带「不知道」「可能吧」也照放，这是稿子里唯一没法生成的东西")

    # 原文里的人只在第一段出现
    people = [x.strip() for x in re.split(r"[,，、]", meta.get("people", "")) if x.strip()]
    for who in people:
        later = sum(p.count(who) for p in paras[1:])
        if later:
            add("⚠", f"「{who}」在第一段之后还出现 {later} 次：own 模式里素材只是引子，第一句点一下就够，后面是自己的判断（要转述他就用 meme-xhs 的 retell）")

    # 抽象接抽象
    run, worst = 0, 0
    for p in paras:
        if re.search(mc.CONCRETE, p) or re.search(PLACE, p) or re.search(DATE, p):
            run = 0
        else:
            run += 1
            worst = max(worst, run)
    if worst >= 4:
        add("✗", f"连续 {worst} 段没有一个具体东西（数字 / 时间 / 地点 / 产品名 / 比如）：抽象接抽象是读者认出 AI 的第一标记，中间插一个你的场景")
    elif worst == 3:
        add("⚠", "有连续 3 段没有具体东西：小盖那篇最多也就 3 段，再多就露了")
    else:
        add("✓", f"抽象段最长连 {worst} 段")

    # 李录四条
    for i, p in enumerate(paras):
        for pat in PROCESS:
            if re.search(pat, p):
                add("✗", f"露了生产过程：「{p[:24]}」 读者看到的只能是成品（用户 10-07 李录稿）")
        m = re.search(TRANSLATED, p)
        if m:
            add("✗", f"直译味的比喻「{m.group(0)}」：换成口头会说的（「根本不是一回事」「怎么看待」）")
        m = re.search(GRADE, p)
        if m:
            add("✗", f"给文章打分「{m.group(0)}」：评委的位置。把自己的事直接说出来")
    first = paras[0] if paras else ""
    if not (re.search(mc.CONCRETE, first) or re.search(PLACE, first) or re.search(DATE, first)):
        add("⚠", f"第一段没有具体东西：「{first[:30]}」 第一句点一下素材（谁、什么），或者一件你这周的事")

    # 账号硬规则
    for p in paras:
        m = re.search(FORBID, p)
        if m:
            add("✗", f"账号禁用「{m.group(0)}」：{p[:24]}…（不预告、不导流、不喊关注）")
        m = re.search(EXTREME, p)
        if m:
            add("⚠", f"极限词「{m.group(0)}」：{p[:24]}…（平台规则，改掉或换说法）")

    # 篇幅、图、节奏（只报数）
    add("✓" if 1800 <= n_chars <= 3500 else "⚠", f"字数 {n_chars}（own 模式 1800 到 3500；小盖 3252）")
    n_img = len(re.findall(r"!\[[^\]]*\]\(", raw)) + (1 if meta.get("hero") else 0) + (1 if meta.get("extra_pages") else 0)
    add("✓" if n_img >= 2 else "⚠", f"图 {n_img} 张（至少两张，点击率数据撑着的）")
    L = [len(p) for p in paras]
    short = sum(1 for x in L if x <= 22)
    n_wo = len(re.findall(r"我", body))
    n_scene = len(re.findall(mc.SCENE, body))
    n_bet = len(re.findall(mc.BET, body))
    add("✓", f"只报数不限：「我」{n_wo} 次、假设 / 比如我 {n_scene} 处、对未来的话 {n_bet} 处、22 字以内短段 {short} 个、段长中位 {sorted(L)[len(L)//2] if L else 0}（小盖：40 / 3 / 3+ / 5 / 48）")

    for level in ("✗", "⚠", "✓"):
        for msg in results[level]:
            print(f"{level} {msg}")
    print(f"\n{len(results['✗'])} 个 ✗，{len(results['⚠'])} 个 ⚠")
    sys.exit(1 if results["✗"] else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
