#!/usr/bin/env python3
"""长稿终审：拿 draft.md 和 elsewhere 语料的基线对一遍，同时查每个数字、每句引语有没有出处。

用法:
  python3 style_check.py <图文版目录>          # 读 编辑用/ 下的 draft.md、参考资料.md、场景卡.md、时间线.md、出入清单.md、source.md
  python3 style_check.py <draft.md>            # 只查文风，不查出处

✗ 必须改到没有；⚠ 逐条看，能解释就留。基线来自 elsewhere 46 篇 1500 字以上的稿子。
"""
import os
import re
import statistics
import sys

BANNED = ["值得注意的是", "值得一提", "不难发现", "不难看出", "可以看出", "众所周知", "毋庸置疑", "不得不说",
          "综上所述", "综上", "总而言之", "总结一下", "总的来说", "换句话说", "从某种意义上", "毫无疑问",
          "赋能", "抓手", "闭环", "底层逻辑", "震惊", "重磅", "炸裂", "揭秘", "干货", "一文读懂",
          "让我们", "未来已来", "拭目以待", "值得期待", "引人深思", "发人深省", "笔者", "小编",
          "首先，", "其次，", "此外，"]
SOFT = ["颠覆", "另一方面", "与此同时", "本质上", "事实上", "某种意义上", "坦率地说", "怎么说呢", "说实话"]
NO_SUBJECT = ["研究表明", "研究显示", "数据显示", "数据表明", "有研究", "专家认为", "专家表示", "业内人士",
              "据悉", "据报道", "有报道称", "有分析认为", "调查显示"]
FAKE_INTERVIEW = r"我问了|我采访|我见到了?他|告诉我|对我说|跟我说|向我|我和[^，。]{1,10}聊|我约了|我找到了?[^，。]{0,6}(本人|创始人)"
BACKSTAGE = r"我(查|找|搜|翻|核对|对照|逐条|一条条)|找了出来|出处|没有?读到|没查到|查不到|资料显示|资料里|[一二三四五六七八九十几百\d]+(份|条)(资料|出处|材料|文献)|人机验证|付费墙"
ANON = r"一位接近[^，。]{0,10}的人|知情人士|接近交易|据「?我们?」?了解|据我了解|江湖盛传|有投资人(告诉|对)"
BAD_OPEN = r"^(随着|近年来|在当今|当今|在这个|在[^，。]{0,12}(时代|浪潮|背景下)|众所周知|自从)"
BAD_HEAD = r"(背景|分析|总结|启示|原因|意义|影响|概述|介绍|结论|思考|展望|小结)"
TIME_OPEN = r"^(\d{4}\s*年|\d{1,2}\s*月|[一二三四五六七八九十两半\d]+\s*(年|个月|天|周|小时|分钟)(后|前|过去)|那年|那时|当时|后来|直到|此后|时间回到|再往前)"
HEDGE = r"可能|大概|似乎|或许|也许|某种程度|未必|不必然|恐怕|多半"

results = {"✗": [], "⚠": [], "✓": []}


def add(level, msg):
    results[level].append(msg)


def outside_count(text, w):
    return strip_quotes(text).count(w)


def strip_quotes(text):
    return re.sub(r"[「“\"][^」”\"]{0,200}[」”\"]", "", text)


def load(path):
    return open(path, encoding="utf-8").read() if os.path.exists(path) else ""


def parse_draft(md):
    md = re.sub(r"^---\n.*?\n---\n", "", md, flags=re.S)
    heads, paras, sections = [], [], []
    for line in md.splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^#{1,2}\s+(.+)$", line)
        if m:
            heads.append(m.group(1).replace("{看法}", "").strip())
            sections.append([])
            continue
        if line.startswith(("![", "|")):
            continue
        line = line.lstrip("> ").strip()
        paras.append(line)
        if sections:
            sections[-1].append(line)
    return heads, paras, sections


def rng(name, value, lo, hi, unit="", base=""):
    shown = f"{value:.0%}" if unit == "%" else f"{value:.1f}{unit}"
    msg = f"{name} {shown}（elsewhere {base}）"
    add("✓" if lo <= value <= hi else "⚠", msg)


def check_style(heads, paras, sections):
    body = [p for p in paras]
    text = "\n".join(body)
    plain = text.replace("==", "")
    n = len(re.sub(r"\s", "", plain))
    k = max(n / 1000, 0.001)
    add("✓" if 2400 <= n <= 5000 else "⚠", f"全文 {n} 字（一页一个场景，2500 到 4500 字最合适；太短多半是研究不够，太长读者划不完）")

    for w in BANNED:
        c = plain.count(w)
        if c:
            add("✗", f"禁用词「{w.rstrip('，')}」{c} 处")
    for w in SOFT:
        c = outside_count(plain, w)
        if c > 1:
            add("⚠", f"「{w}」{c} 处：elsewhere 全库里这个词很少见，留一处就够")
    for w in NO_SUBJECT:
        c = plain.count(w)
        if c:
            add("✗", f"没有主语的信源「{w}」{c} 处：写出是谁、哪一年、在哪里说的")
    outside = strip_quotes(plain)
    ex = outside.count("！") + outside.count("!")
    if ex:
        add("✗", f"叙述里有 {ex} 个感叹号（elsewhere 的感叹号只出现在引语里）")
    # 读者看不到后台：检索过程不进稿子
    for m in re.finditer(BACKSTAGE, outside):
        s = outside[max(0, m.start() - 12): m.end() + 12].replace("\n", " ")
        add("✗", f"叙述里露出了研究过程：「…{s}…」 读者要的是故事，不是检索记录。删掉，或改成叙事式交代（「据他后来的说法」「传记里是另一个版本」）")
    for m in re.finditer(FAKE_INTERVIEW, outside):
        s = outside[max(0, m.start() - 12): m.end() + 12].replace("\n", " ")
        add("✗", f"像是采访过本人：「…{s}…」 这个账号没有采访，「我」只能做读、查、数、算、试用这些事")
    for m in re.finditer(ANON, outside):
        s = outside[max(0, m.start() - 10): m.end() + 10].replace("\n", " ")
        add("⚠", f"匿名信源措辞：「…{s}…」 只能转述原文里已有的，并说明是哪篇报道写的")

    lens = [len(re.sub(r"\s", "", p.replace("==", ""))) for p in body]
    rng("段落中位数", statistics.median(lens), 45, 80, " 字", "62，四分位 53 到 74")
    rng("超过 120 字的段落占", sum(1 for x in lens if x > 120) / len(lens), 0, 0.15, "%", "8%")
    single = sum(1 for p in body if len([s for s in re.split(r"[。！？!?]+", p) if s.strip()]) <= 1) / len(body)
    rng("单句段占", single, 0.25, 0.58, "%", "43%，四分位 33% 到 49%")
    long_ones = [p for p, x in zip(body, lens) if x > 190]
    for p in long_ones:
        add("✗", f"这一段 {len(p)} 字，拆开：{p[:24]}…")
    rng("数字密度", len(re.findall(r"\d+(?:\.\d+)?", plain)) / k, 5, 40, " 个/千字", "7，交易稿 16")
    rng("以时间起句的段落占", sum(1 for p in body if re.match(TIME_OPEN, p)) / len(body), 0.05, 0.3, "%",
        "叙事稿 11% 到 17%")
    rng("留余地的词（可能、大概、似乎、或许）", len(re.findall(HEDGE, outside)) / k, 0.5, 5, " 个/千字", "1.7")
    nb = len(re.findall(r"不是[^。！？\n]{1,40}?[，,]\s*(?:而)?是", outside)) / k
    rng("「不是 X，是 Y」句式", nb, 0, 1.0, " 处/千字", "中位数 0，九成稿子不到 0.7")
    rng("破折号", plain.count("——") / k, 0, 3.0, " 个/千字", "1.2")
    rng("问句结尾的段落占", sum(1 for p in body if p.rstrip("=").endswith(("？", "?"))) / len(body), 0, 0.12, "%", "4%")

    marks = re.findall(r"==(.+?)==", text)
    body_secs = max(len(sections) - 1, 1)
    if len(marks) > body_secs + 2:
        add("⚠", f"==短评== 有 {len(marks)} 句，全文只有 {len(sections)} 节：elsewhere 不是每节都收一句金句，留最好的几句")
    for mk in marks:
        if len(mk) > 28 and not mk.endswith(("？", "?")):
            add("⚠", f"短评太长（{len(mk)} 字）：{mk}")
    ended = sum(1 for s in sections if s and re.fullmatch(r"==.+==", s[-1]))
    if len(sections) >= 4 and ended == len(sections):
        add("⚠", "每一节都用一句加粗短评收尾，节奏太整齐：有的节停在原话或动作上就够了")

    if body and (re.match(BAD_OPEN, body[0]) or len(body[0]) > 70):
        add("✗", f"第一段要是一个具体的时间、人或事，70 字以内：{body[0][:30]}…")
    for h in heads[1:-1] if len(heads) > 2 else heads[1:]:      # 最后一节是看法页，标题是一句判断，不查
        flat = re.sub(r"^[一二三四五六七八九十\d]+[、.．]\s*", "", h.replace("<br>", ""))
        if re.match(BAD_HEAD, flat) or (len(flat) <= 6 and re.search(BAD_HEAD, flat)):
            add("✗", f"小标题是功能名，换成物件、意象、原话或问句：{flat}")
        if any(units(x) > 13.5 for x in h.split("<br>")):
            add("⚠", f"小标题一行超过 13 个字，会折行：{flat}")
    # 小标题形态：elsewhere 同一篇里长短、句式都在变（Cursor：No hand-waving / 新房子 / 负重起飞 / 证毕）。
    # 统一的是框和语气，不是句式。一个模子刻出来的小标题既呆板又有 AI 味。
    def shape(h):
        f = h.replace("<br>", "")
        if re.search(r"[、，,].{0,12}和", f):
            return "A、B 和 C"
        if f.endswith(("？", "?")):
            return "问句"
        if re.search(r"[「“].+[」”]", f):
            return "引号词"
        if re.fullmatch(r"[\d.,%％\s第页年月日万亿个家张条次倍]+.{0,3}", f):
            return "数字"
        if "<br>" in h:
            return "两行"
        n = units(f)
        return "短词" if n <= 5 else ("短语" if n <= 9 else "长句")
    body_heads = heads[:-1] if len(heads) > 2 else heads      # 看法页标题是一句判断，不算
    shapes = [shape(h) for h in body_heads]
    abc = shapes.count("A、B 和 C")
    if abc > 1:
        add("✗", f"「A、B 和 C」式小标题用了 {abc} 次：全篇最多一次，其余换成短词、原话、问句、数字或物件")
    for a, b, ha, hb in zip(shapes, shapes[1:], body_heads, body_heads[1:]):
        if a == b and a not in ("短词", "短语"):
            add("⚠", f"相邻两个小标题是同一种形态（{a}）：{ha.replace('<br>', '')} ｜ {hb.replace('<br>', '')}")
    if len(body_heads) >= 4 and len(set(shapes)) <= 2:
        add("✗", f"{len(body_heads)} 个小标题只有 {len(set(shapes))} 种形态（{'、'.join(sorted(set(shapes)))}）：长短、句式都要变")
    lens = [units(h.replace("<br>", "")) for h in body_heads]
    if len(lens) >= 4 and max(lens) - min(lens) < 4:
        add("⚠", "小标题长度都差不多（" + "、".join(str(int(x)) for x in lens) + " 字）：放一两个两三字的短词进去")
    print("小标题：" + " ｜ ".join(h.replace("<br>", "") for h in heads))
    last_body = [s for s in sections[:-1] if s]
    if last_body:
        tail = last_body[-1][-1]
        if re.search(r"^(总之|所以说|由此可见|可见)|未来|我们应该|启示|告诉我们", tail):
            add("⚠", f"叙事的最后一段在讲道理，换成一句原话、一个动作或回扣开头的物件：{tail[:30]}…")
    return plain


def units(text):
    return sum(1 if ord(c) > 0x2E7F else 0.56 for c in text)


def check_sources(folder, plain):
    ed = os.path.join(folder, "编辑用")
    refs = load(os.path.join(ed, "参考资料.md"))
    pool = "\n".join(load(os.path.join(ed, f)) for f in ("参考资料.md", "场景卡.md", "时间线.md", "出入清单.md", "source.md"))
    if not refs:
        add("✗", "没有 编辑用/参考资料.md")
        return
    items = [l for l in refs.splitlines() if re.match(r"^\s*(?:[-*]\s+|R\d+\s*[-–—]\s*)\[(一手|二手|原文)\]", l)]
    first = [l for l in items if "[一手]" in l]
    add("✓" if len(items) >= 12 else "✗", f"参考资料 {len(items)} 条（至少 12 条，每条以「R1 - [一手]」「R2 - [二手]」这样开头）")
    add("✓" if len(first) >= 5 else "✗", f"其中一手 {len(first)} 条（至少 5 条：本人的博客、推文、论文、财报、公告、播客文字稿、传记）")
    undated = [l for l in items if not re.search(r"(19|20)\d{2}", l)]
    if undated:
        add("⚠", f"{len(undated)} 条参考资料没有年份：{undated[0][:40]}…")
    if not load(os.path.join(ed, "场景卡.md")):
        add("✗", "没有 编辑用/场景卡.md")
    if not load(os.path.join(ed, "时间线.md")):
        add("⚠", "没有 编辑用/时间线.md")
    pool_digits = re.sub(r"[,，\s]", "", pool)
    missing = []
    for m in re.finditer(r"\d[\d,]*(?:\.\d+)?", plain):
        tok = m.group(0).replace(",", "")
        if len(tok.replace(".", "")) < 2:
            continue
        if tok not in pool_digits and tok not in missing:
            missing.append(tok)
    if missing:
        add("✗", f"这些数字在参考资料、场景卡、时间线、出入清单和素材里都找不到：{'、'.join(missing[:20])}"
                 f"{' 等' if len(missing) > 20 else ''}。查到出处补进资料，查不到就删")
    else:
        add("✓", "稿子里两位以上的数字都能在资料里找到")
    lost = []
    for q in re.findall(r"[「“]([^」”]{10,120})[」”]", plain):
        key = re.sub(r"\s", "", q)[:8]
        if key not in re.sub(r"\s", "", pool):
            lost.append(q[:20])
    if lost:
        add("⚠", f"{len(lost)} 句引语在资料里找不到原文（翻译过的引语，把中文译文也记进场景卡）：" + "；".join(lost[:5]))


def main(arg):
    folder = None
    if os.path.isdir(arg):
        folder = arg
        draft = os.path.join(arg, "编辑用", "draft.md")
    else:
        draft = arg
    if not os.path.exists(draft):
        sys.exit(f"找不到 {draft}")
    heads, paras, sections = parse_draft(load(draft))
    if not paras:
        sys.exit("draft.md 是空的")
    plain = check_style(heads, paras, sections)
    if folder:
        check_sources(folder, plain)
    for level in ("✗", "⚠", "✓"):
        for msg in results[level]:
            print(f"{level} {msg}")
    print(f"\n{len(results['✗'])} 个 ✗，{len(results['⚠'])} 个 ⚠")
    sys.exit(1 if results["✗"] else 0)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
