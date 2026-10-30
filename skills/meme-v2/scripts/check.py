#!/usr/bin/env python3
"""meme-v2 检查：查「说没说完、有没有人话、是不是在场」，不查虚词百分比。

用法:
  python3 check.py <meme版目录 或 draft.md> [--allow-cn-brand-title] [--allow-ganghao]

16 条 ✗（必须改）、26 条 ⚠（逐条看，能说出理由的留）、2 条提示。meme_check 是 44 ✗ 81 ⚠。规则出处见 references/writing_guide.md，
为什么比 meme_check 少见 references/changelog.md。
"""
import os
import re
import sys

CN_NAMES = ("阿里 阿里云 通义 千问 夸克 淘宝 天猫 支付宝 蚂蚁 钉钉 腾讯 微信 混元 元宝 字节 抖音 豆包 火山 飞书 即梦 扣子 "
            "智谱 月之暗面 阶跃 百度 文心 美团 快手 可灵 京东 知乎 小红书 拼多多 网易 华为 小米 理想 蔚来 小鹏 比亚迪 "
            "宇树 智元 商汤 旷视 讯飞 零一万物 百川 面壁 深度求索 英伟达 谷歌 微软 苹果 亚马逊 特斯拉 "
            "黄仁勋 马斯克 奥特曼 扎克伯格 李飞飞 吴恩达 陶哲轩 雷军 马化腾 张一鸣 梁文锋 杨植麟 李彦宏 周鸿祎 李录 芒格").split()
GENERIC = {"AI", "Agent", "Agents", "API", "APP", "App", "LLM", "GPU", "CEO", "CTO", "PPT", "Prompt", "Token", "SaaS", "ToB", "ToC", "HR", "PM", "OK"}
GANGHAO = r"刚好|正好|恰好|刚巧|恰巧"
ADS = r"零门槛|0门槛|没有门槛|不用学任何|小白也能|一键搞定|人人都能|保证|稳赚|最强|第一名|唯一|100%"
OUTLINK = r"微信|公众号|二维码|加我|私信我|链接在|http"
IDENTITY = r"我以前在|老东家|前同事|小股东|我持有|我们团队|我的团队|我朋友|一个朋友|朋友跟我|群里有人|饭局|我表妹|我学弟|我同学"
BACKSTAGE = r"读到第[二三四五]遍|读了[两三四]遍|看了[两三四]遍|数了一遍|从头读到尾|翻了一遍|一项项|一页页|把.{0,12}(读|看|翻|数|捋|梳理)了一遍|全文翻完|顺手翻完"
PROCESS = r"素材里|整理稿|两份稿子|文字稿里|这份转录|原文截图里|我用的素材"
PREFIX = r"这条我(站|认|同意|不同意)|这点我(也)?(认同|同意|站)|这句我|整篇我就认|我的看法(是|：)|我的想法是|我的做法是|我很认|我也说一句|局限我也说一句|说句实话"
EXPERT = r"我早就看明白|早就把.{0,8}玩明白|我研究.{0,6}(很多|好几)年|我已经在头部|这个我太懂了"
PREVIEW = r"下一期|下篇再|下次再讲|敬请期待|关注我|点个关注|记得关注"
DUILIAN = (r"不是[^。，；？]{1,20}[，,]\s*(而)?是[^。，；]{1,20}"
           r"|能[^。，；]{1,12}[，,]\s*不能[^。，；]{1,12}"
           r"|[^。，；]{1,10}的是[^。，；]{1,14}[，,]\s*[^。，；]{1,10}的是[^。，；]{1,14}"
           r"|一个说[^。，；]{1,14}[，,]\s*一个说"
           r"|与其[^。]{1,20}[，,]\s*不如")
PPT = r"^(先说|再说|最后说|说说|聊聊|理由有|原因有|有[两三四]点|第[一二三]点|先看|再看|接下来|下面|最后给|总结一下|回到正题)[^。]{0,10}[。：:]$"
ROADSIGN = r"^(说回正题|先把这个讲完|跑远了|扯远了|回来说|咱一步步|一步步来)"
CONCRETE = r"\d|假设|比如|举个|[A-Za-z]{3,}|上午|下午|晚上|周[一二三四五六日末]|点钟|块钱|地铁|打车|邮件|日历|面试|那天|那次|客户|同事|实习"
GRADE = r"这条|这一条|这篇|这份报告|这篇文章|原文|这期|作者|文里"
EMPTY_CONCEDE = r"^(他|她|作者|原文|这话|这个说法)?(可能|也许|大概)(是对的|没错|有道理)[。，]"
CAUSAL = r"因为|所以|但|即使|这样一来|不然|否则|毕竟|比如|于是|结果|哪怕|只要|一旦"
HUMAN_NOTE = r"是|的|约|相当于|做|搞|这|那|一个|叫|用|讲|说|写|在|有|给|把|上"   # 专名后面接着说人话的痕迹，没有就是报表

results = {"✗": [], "⚠": [], "提示": []}


def add(level, msg):
    results[level].append(msg)


def parse(md):
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n", md, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line and not line.strip().startswith("#"):
                k, v = line.split(":", 1)
                meta[k.strip()] = re.sub(r"\s+#\s.*$", "", v).strip()
        md = md[m.end():]
    paras = [l.strip().replace("**", "").replace("==", "") for l in md.splitlines()
             if l.strip() and not l.strip().startswith(("!", "|", "#", ">"))]
    images = re.findall(r"!\[[^\]]*\]\(([^)]+)\)", md)
    return meta, paras, images


def cjk_len(s):
    return len(re.findall(r"[一-鿿]", s))



def opening_family(s):
    if re.search(r"(看完|看了|读完|读了|刷到|听完|听了|追完)", s[:20]):
        return "汇报看了什么"
    if s.startswith(("「", "“", "\"")):
        return "原话"
    if re.search(r"我|我们", s):
        return "自己的场景或处境"
    if re.search(r"朋友|同事|表妹|学弟|老板", s):
        return "身边人的场景"
    return "事实或主角场景"


def previous_opening(draft_path):
    """找发布目录里排在本篇之前、最近一篇 meme-v2 draft 的第一句。"""
    if not draft_path:
        return ""
    here = os.path.abspath(draft_path)
    pub = here.split(os.sep + "发布" + os.sep)[0] + os.sep + "发布"
    cur = here.split(os.sep + "发布" + os.sep)[1].split(os.sep)[0]
    dirs = sorted(d for d in os.listdir(pub) if d < cur and os.path.isdir(os.path.join(pub, d, "meme-v2版", "编辑用")))
    for d in reversed(dirs):
        f = os.path.join(pub, d, "meme-v2版", "编辑用", "draft.md")
        if os.path.exists(f):
            body = open(f, encoding="utf-8").read().split("\n---\n", 1)[-1]
            for para in body.split("\n\n"):
                para = para.strip()
                if para and not para.startswith(("!", ">", "#")):
                    return re.split(r"[。！？]", para, maxsplit=1)[0]
    return ""

def check_meta(meta, draft_dir):
    for k in ("stance", "stance_line", "reader", "keyword", "title"):
        if not meta.get(k):
            add("✗", f"front matter 缺 `{k}`")
    if meta.get("stance_line") and meta["stance_line"][0] not in "ABCD":
        add("✗", f"stance_line 要是 A / B / C / D 之一，现在是「{meta['stance_line']}」")
    st = meta.get("stance", "")
    if st and re.search(GRADE, st):
        add("✗", f"stance 的宾语是文章不是世界：「{st}」。判断对着公司 / 行业 / 一群人 / 未来下")
    if st and not re.search(r"会|不会|才|比|取决于|靠|正在|已经|要|值钱|不值|够|不够|难|容易|先|后|越", st):
        add("⚠", f"stance 看起来放哪都对，没有一个能出错的说法：「{st}」")
    # stance 贴标签（10-21 晚用户退回「这是我整场听下来最想说的一句」）：判断只论证一次，不给它贴给脚本看的标签
    reader = meta.get("reader", "")
    if reader and cjk_len(reader) <= 8 and not re.search(r"时|天|周|晚|早|正在|刚|还没|不敢|要交|被", reader):
        add("⚠", f"reader 像职业身份不像具体时刻：「{reader}」。写成「周五下午要交周报、但手上正经活一件没交出去的人」那种")
    if not meta.get("cost"):
        add("提示", "front matter 没写 `cost`（这篇用到的那次代价）。经历库「代价」列没有合适的就空着，别编")
    sq = meta.get("stance_quote", "")
    if sq:
        src = os.path.join(draft_dir, "source.md")
        if os.path.exists(src):
            text = open(src, encoding="utf-8").read()
            if re.sub(r"\s", "", sq)[:20] not in re.sub(r"\s", "", text):
                add("✗", f"stance_quote 在 source.md 里找不到原句：「{sq[:30]}」")


def check_title(meta, out_dir, allow_cn):
    titles = []
    for name in ("标题.txt", "标题备选.txt"):
        p = os.path.join(out_dir, name)
        if os.path.exists(p):
            titles += [l.strip() for l in open(p, encoding="utf-8") if l.strip()]
    main = meta.get("title", "")
    if main:
        titles.insert(0, main)
    seen, uniq = set(), []
    for t in titles:
        if t not in seen:
            seen.add(t)
            uniq.append(t)
    titles = uniq
    kw = meta.get("keyword", "")
    for i, t in enumerate(titles):
        is_main = i == 0
        lvl = "✗" if is_main else "⚠"
        n = len(re.findall(r"[一-鿿]", t)) + len(re.findall(r"[A-Za-z0-9]", t)) + len(re.findall(r"[，。：！？、]", t))
        if n > 20:
            add(lvl, f"标题 {n} 字超过 20：「{t}」")
        if re.search(r"[!！]", t):
            add(lvl, f"标题有感叹号：「{t}」")
        if re.search(ADS, t):
            add(lvl, f"标题有极限词 / 广告话：「{t}」")
        if re.search(r"[0-9一二三四五六七八九十]+\s*(条|个|招|步|种)[^，。]{0,6}(教你|带你|学会|搞定)", t):
            add(lvl, f"教程腔标题（账号最低点击率 10.5%）：「{t}」")
        if kw:
            if kw.lower() not in t.lower():
                add(lvl, f"标题里没有主关键词「{kw}」：「{t}」")
            elif t.lower().find(kw.lower()) > 6:
                add("⚠", f"主关键词「{kw}」不在标题前 6 字：「{t}」")
        head = re.match(r"^[一-鿿]{2,5}", t)
        if head and not allow_cn and any(t.startswith(nm) for nm in CN_NAMES) and not (kw and t.lower().startswith(kw.lower())):
            add("⚠", f"标题以不是 keyword 的中文专名开头：「{t}」")
    if len(titles) < 3:
        add("⚠", f"标题备选只有 {len(titles)} 条，要三条三种句式")
    if titles and not any(re.search(r"推荐|都去看|很少见|没读懂|没看懂|看来|听说|竟|居然|真的|[。]$", t) for t in titles):
        add("⚠", "三条备选里没有一条「情绪 + 名字」或认知差句")


def check_body(meta, paras, images, allow_gh):
    text = "\n".join(paras)
    n = cjk_len(text)
    k = max(n, 1) / 1000
    retell = meta.get("mode", "").startswith("retell")
    lo, hi = (500, 1100) if meta.get("hot") else (1200, 2400)
    if not (lo <= n <= hi):
        add("⚠", f"正文 {n} 字，建议 {lo} 到 {hi}")
    if len(images) < 2:
        add("⚠", f"只有 {len(images)} 张图，每篇至少两张（一张原文证据、一张对照）")

    # 硬规则
    if not allow_gh:
        for p in paras:
            brands = [w for w in re.findall(r"[A-Z][A-Za-z0-9]+", p) if w not in GENERIC] + [n for n in CN_NAMES if n in p]
            if re.search("(?:" + GANGHAO + r")[^。]{0,12}(" + "|".join(map(re.escape, brands)) + ")", p) if brands else False:
                add("✗", f"「刚好」式品牌引入：「{p[:40]}」")
    for pat, msg in ((ADS, "极限词 / 广告话"), (OUTLINK, "站外导流"), (BACKSTAGE, "后台叙述（读者不关心你读了几遍）"),
                     (PROCESS, "生产过程露出来了（读者没见过我们的素材）"), (PREFIX, "给自己的发言加前缀（判断直接说）"),
                     (EXPERT, "自称内行"), (PREVIEW, "预告下一期 / 喊关注（名片卡那句除外）")):
        hits = [p for p in paras if re.search(pat, p)]
        if hits:
            add("✗", f"{msg} {len(hits)} 处：" + "；".join(f"「{re.search(pat, p).group(0)}」" for p in hits[:4]))
    for p in paras:
        if re.search(IDENTITY, p):
            add("⚠", f"身份 / 朋友场景，确认是经历库里的真事，不是就删：「{p[:40]}」")

    # 对仗
    pairs = [p for p in paras if re.search(DUILIAN, p)]
    numbered = [p for p in pairs if re.match(r"^\d+[、.]", p)]
    if numbered or (pairs and pairs[-1] == paras[-1]):
        add("✗", f"对仗金句在编号句或最后一段：「{(numbered or pairs)[-1][:40]}」")
    elif len(pairs) > 2:
        add("⚠", f"对仗句 {len(pairs)} 处，超过 2：" + "；".join(f"「{p[:30]}」" for p in pairs[:3]))

    # 结构词孤段 vs 路标
    for p in paras:
        if cjk_len(p) <= 14 and re.match(PPT, p) and not re.match(ROADSIGN, p):
            add("✗", f"PPT 过渡页式的结构词孤段：「{p}」。删掉直接写内容；跑题拉回的「说回正题」可以留")
    # 空让步
    for i, p in enumerate(paras[:-1]):
        if re.match(EMPTY_CONCEDE, p) and cjk_len(p) <= 20 and re.match(r"^(但|可是|然而|不过)", paras[i + 1]):
            add("✗", f"空让步再转折：「{p}」→「{paras[i + 1][:20]}」。让步要带事实")
    # 一是二是
    if re.search(r"一是[^。]{2,30}[，。][^。]{0,40}二是", text):
        add("✗", "「一是……二是……」：两个理由写两段，各用自己的事开头")

    # 单句段性质
    abstract = []
    for i, p in enumerate(paras):
        if cjk_len(p) <= 22 and not re.match(r"^\d+[、.]", p) and i > 0:
            prev = paras[i - 1]
            if not re.search(CONCRETE, prev) and not re.search(CONCRETE, p) and "你" not in p and not p.endswith(("…", "……")):
                abstract.append(p)
    if abstract:
        add("⚠", f"抽象接抽象的单句段 {len(abstract)} 处（单句段只能是「你」的处境、前一段场景的口头重述、一句没说完的话）：" + "；".join(f"「{p}」" for p in abstract[:4]))

    # 专名首现后有没有人话
    seen = set()
    bare = []
    for p in paras:
        for m in re.finditer(r"[A-Z][A-Za-z0-9.]*[A-Za-z0-9](?: [A-Z][A-Za-z0-9.]*[A-Za-z0-9])?|[A-Za-z]+\d[\w.]*|" + "|".join(CN_NAMES), p):
            w = m.group(0)
            if w in GENERIC or w in seen:
                continue
            seen.add(w)
            tail = p[m.end():m.end() + 24]
            if cjk_len(tail) < 3 or not re.search(HUMAN_NOTE, tail):
                bare.append(w)
    if len(bare) >= 3:
        add("⚠", f"专名第一次出现后 20 字内没有半句人话 {len(bare)} 个（「Apple II，很多人小学机房里用的就是它」）：" + "、".join(bare[:6]))
    eng = len([w for w in re.findall(r"[A-Z][A-Za-z0-9.]*[A-Za-z0-9]", text) if w not in GENERIC])
    if eng / k > 25:
        add("⚠", f"英文专名每千字 {eng / k:.0f} 个（上限 25）。专名首页出现一次，后面用「他」「这个模型」")
    nums = len(re.findall(r"\d+(?:\.\d+)?\s*[%万亿个条篇人年月天GB]?", text))
    if nums / k > 8:
        add("⚠", f"数字每千字 {nums / k:.0f} 个（上限 8），一句话最多一个锚点")
    first3 = "".join(paras[:3])
    anchors = len([w for w in re.findall(r"[A-Z][A-Za-z0-9.]*[A-Za-z0-9](?: [A-Z][A-Za-z0-9.]*[A-Za-z0-9])?", first3) if w not in GENERIC]) + len(re.findall(r"\d+", first3))
    if anchors > 4:
        add("⚠", f"开头三段 {anchors} 个专名 / 数字（最多 4），第一句要是判断或处境")
    # 10-29 / 10-30：前三行要有一个人站在一个具体时刻里；起法不固定，跟上一篇不同
    if paras:
        p1 = paras[0]
        s1 = re.split(r"[。！？]", p1, maxsplit=1)[0]
        if re.search(r"^(这两天|这几天|最近|昨天|昨晚|今天|前几天|周末|上周|这周|趁[^，]{0,6})?[，,]?\s*(我)?(花了[^，]{0,8})?(看完|看了|读完|读了|刷到|听完|听了|追完)", s1):
            add("⚠", f"第一句在汇报自己看了 / 读了什么：「{s1[:40]}」。看过素材读者默认知道，换一种起法（writing_guide §3 七种）")
        if re.match(r"^(今年|去年|\d{4}\s*年|\d{1,2}\s*月)", s1) and "我" not in s1:
            add("⚠", f"第三人称背景交代开头：「{s1[:40]}」。前三行要有一个人站在一个具体时刻里")
        p1_anchors = len([w for w in re.findall(r"[A-Z][A-Za-z0-9.]*[A-Za-z0-9](?: [A-Z][A-Za-z0-9.]*[A-Za-z0-9])?", p1) if w not in GENERIC]) + len(re.findall(r"\d+", p1))
        if cjk_len(p1) > 80 or p1_anchors > 2:
            add("⚠", f"第一段 {cjk_len(p1)} 字、{p1_anchors} 个锚点（建议 60 字以内、锚点最多 2）。履历、机构分量、一串数字从第二段起")
        if re.match(r"^[^。]{0,24}(发布了|发了一篇|递交了|公布了|上线了|宣布)", s1) and not re.search(r"我", s1):
            add("⚠", f"新闻导语体开头：「{s1[:40]}」。发布信息放第二句以后")
        prev = previous_opening(meta.get("_draft_path", ""))
        if prev and opening_family(prev) == opening_family(s1):
            add("提示", f"起法跟上一篇同一种（{opening_family(s1)}）：上一篇「{prev[:24]}」，这一篇「{s1[:24]}」。换一种")

    # 句子说没说完
    causal = len(re.findall(CAUSAL, text))
    if causal / k < 6:
        add("⚠", f"因果连接词每千字 {causal / k:.1f} 个（因为 / 所以 / 但 / 即使 / 这样一来…，底线 6）。每句写到结果才停，不让读者自己补推理")
    mono = re.findall(r"(?:我|它|他|你)(?:特别|非常|很|也|都|只|先|再|就)?(认|翻|对|派|讲|评|框|改|算|修|填|建)(?=[：:。，、]|成|了)", text)
    adj = re.findall(r"(?:得|挺|很|太|不太|最|更|特别|非常|比较)(广|慌|信|稳|顶|贵|快|慢|准|火|乱|久|累|狠|猛|顺|丑|难|强|弱|全|深|浅|忙|懂|服|认)(?=[，。、；：！？」]|$)", text, re.M)
    if mono or adj:
        add("⚠", f"单字动词 / 形容词 {len(mono) + len(adj)} 处（认→认同、翻→翻译、传得挺广→传播得很广泛、不太信→不太相信）：" + "、".join(f"「{m}」" for m in (mono + adj)[:8]))
    # 口语名词「活」和单字口语谓语收尾（10-21 用户：要像科技栏目主编写的，不像聊天）
    huo = len(re.findall(r"(?<![生干复灵激])活(?![动力跃泼性着力])", text))
    if huo >= 2:
        add("⚠", f"口语名词「活」{huo} 处，换成工作 / 任务 / 项目（品牌 slogan 除外）")
    tail1 = re.findall(r"(?:去|就|才|都|能|会)(到|换|量|长|交|派|算|看)(?=[。，；！？])", text)
    if tail1:
        add("⚠", f"单字口语动词收尾 {len(tail1)} 处（到→到来 / 实现，换→换取，量→测出，长→建立）：" + "、".join(f"「{m}」" for m in tail1[:6]))
    tele = [c.strip() for c in re.split(r"[，。；：！？\n]", text)
            if 3 <= cjk_len(c.strip()) <= 5 and re.fullmatch(r"[一-鿿]+", c.strip())
            and not re.search(r"[的了是在就也都很不我你他它这那和与或但]", c)]
    if len(tele) / k > 4:
        add("⚠", f"电报式短分句每千字 {len(tele) / k:.1f} 个（上限 4）：" + "、".join(f"「{t}」" for t in tele[:6]))

    # 逗号串句（10-21 用户：断句奇怪、不像正常叙事）：一个句号里逗号 ≥4 的句子列出来念一遍，主语换了就换句号
    runon = [sent for p in paras for sent in re.split(r"[。！？]", p) if sent.count("，") >= 4]
    if runon:
        add("提示", f"逗号连了四个以上分句的句子 {len(runon)} 处，念一遍，主语换了就换句号：" + "；".join(f"「{s_[:28]}…」" for s_ in runon[:3]))
    # 「我」「你」
    you = sum(1 for p in paras if p.startswith("你") or "，你" in p or "。你" in p)
    if you == 0 and not retell:
        add("⚠", "没有一段主语是「你」。写 reader 那个具体时刻")
    if retell:
        wo = len(re.findall(r"我", text))
        if wo > 10:
            add("⚠", f"retell 稿「我」{wo} 次，超过 10；多出来的只许在结尾前那段判断里")

    labels = [p for p in paras if re.search(r"最想说的一(件事|句)|这是我.{0,8}最想说|我想讲清楚一件事", p)]
    if labels:
        add("✗", f"给判断贴标签 {len(labels)} 处（「我最想说的一件事是」「这是我整场听下来最想说的一句」），判断只论证一次，标签删掉：" + "；".join(f"「{p[:30]}」" for p in labels[:2]))
    # 「他」密度（10-21 用户看 Ilya 稿：「他」用得太频繁）：转述稿主语轮着来，名字 / 省略 / 内容当主语
    ta = text.count("他")
    if ta / k > 8:
        add("⚠", f"「他」每千字 {ta / k:.0f} 个（上限 8）。换成名字、省略主语、或拿内容当主语（「建议只留了一条」）")
    # 模仿腔
    for w, cap in (("真正", 2), ("其实", 3), ("当然", 2)):
        c = text.count(w)
        if c / k > cap:
            add("⚠", f"「{w}」每千字 {c / k:.1f} 次（上限 {cap}），成了口头禅")
    ex = text.count("！") + text.count("!")
    if ex > 4:
        add("⚠", f"感叹号 {ex} 个，最多 4 个")

    # 结尾
    last = paras[-1] if paras else ""
    if cjk_len(last) > 60:
        add("⚠", f"末段 {cjk_len(last)} 字，MemeInformation 85% 末段不超过 20 字：「{last[:30]}…」")
    if re.search(r"行业|未来|时代|趋势|所有人|终将|一定会", last) and not re.search(r"我|你", last):
        add("⚠", f"结尾停在行业判断上：「{last[:40]}」。三选一：自己的一件小事 / 往下收一句评价 / 以前现在")
    if re.search(r"总之|总结|综上|最后想说", last):
        add("⚠", f"结尾在总结：「{last[:30]}」")
    if not re.search(r"上周那篇|前几天那篇|之前(那篇|写过)|上一篇|前两天我也|那篇.{0,8}(写过|提过|说过|聊过)|上周写.{0,20}那篇", text):
        add("提示", "没有回指已发的稿子。有可回指的就回指一次，没有就算了")


def main(argv):
    allow_cn = "--allow-cn-brand-title" in argv
    allow_gh = "--allow-ganghao" in argv
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        sys.exit(2)
    target = args[0]
    if os.path.isdir(target):
        out_dir = target
        draft = os.path.join(target, "编辑用", "draft.md")
    else:
        draft = target
        out_dir = os.path.dirname(os.path.dirname(os.path.abspath(draft)))
    if not os.path.exists(draft):
        print(f"找不到 {draft}")
        sys.exit(2)
    md = open(draft, encoding="utf-8").read()
    meta, paras, images = parse(md)
    meta["_draft_path"] = draft
    draft_dir = os.path.dirname(os.path.abspath(draft))
    check_meta(meta, draft_dir)
    check_title(meta, out_dir, allow_cn)
    check_body(meta, paras, images, allow_gh)
    for lvl in ("✗", "⚠", "提示"):
        for msg in results[lvl]:
            print(f"{lvl} {msg}")
    print(f"\n{len(results['✗'])} ✗  {len(results['⚠'])} ⚠  {len(results['提示'])} 提示")
    sys.exit(1 if results["✗"] else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
