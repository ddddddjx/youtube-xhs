#!/usr/bin/env python3
"""meme-xhs 终审：拿 draft.md 和 MemeInformation 成熟期 77 篇的基线对一遍，再查账号的硬规则。

用法:
  python3 meme_check.py <图文版目录 或 draft.md> [--allow-cn-brand-title] [--allow-ganghao]

  --allow-cn-brand-title  用户明确指示过，本篇标题可以用中文专名开头（品牌、机构、人名）
  --allow-ganghao         用户明确指示过，本篇可以用「刚好 / 正好」把品牌引进来
两个开关只在用户当次明确说了才加；英文品牌名开头的标题（MiniMax、Qwen、Claude）不用开关。

✗ 必须改到没有；⚠ 逐条看，能说出理由的可以留。基线见 references/baseline.json。
"""
import json
import os
import re
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = json.load(open(os.path.join(HERE, "..", "references", "baseline.json"), encoding="utf-8"))

# 中文专名：品牌、机构、人名。标题以这些开头要用户明确同意（09-24 复盘：人名 / 机构开头 4.9–8.2%）
CN_NAMES = ("阿里 阿里云 通义 千问 夸克 淘宝 天猫 支付宝 蚂蚁 钉钉 腾讯 微信 混元 元宝 字节 抖音 豆包 火山 飞书 即梦 扣子 "
            "智谱 月之暗面 阶跃 稀宇 百度 文心 美团 快手 可灵 京东 知乎 小红书 拼多多 网易 华为 小米 理想 蔚来 小鹏 比亚迪 "
            "宇树 智元 商汤 旷视 科大讯飞 讯飞 零一万物 百川 面壁 深度求索 英伟达 谷歌 微软 苹果 亚马逊 特斯拉 "
            "斯坦福 哈佛 麻省理工 清华 北大 伯克利 卡内基梅隆 "
            "黄仁勋 老黄 马斯克 奥特曼 扎克伯格 李飞飞 吴恩达 陶哲轩 雷军 马化腾 张一鸣 梁文锋 杨植麟 王小川 李彦宏 周鸿祎 罗永浩 朱啸虎 李诞").split()
GANGHAO = r"刚好|正好|恰好|刚巧|恰巧"
ZERO_BAR = r"零门槛|0门槛|没有门槛|完全没有门槛|不用学任何|小白也能|一键搞定|人人都能"
IDENTITY = r"我以前在|老东家|前同事|小股东|我持有|我们团队|我的团队|我在做一个|我朋友|一个朋友|朋友跟我|群里有人|饭局|我表妹|我学弟|我同学"
EMO_TITLE = r"笑鼠|炸裂|救命|特么|啊[？?]|哇，|凉凉|懵了|崩了"
CONTRAST = r"但|却|可是|然而|没想到|反而|不过|偏偏|其实|谁能想到|原来|居然|竟然|结果|本来以为|以为"
ATTR = r"他说|她说|他写|她写|作者|原文|文章里|报告显示|报告里|研究显示|他认为|她认为|他的办法|他提到|她提到|据.{0,6}报道|他在.{0,10}里|公告里|博客里"
BACKSTAGE = r"读到第[二三四五]遍|读了[两三四]遍|看了[两三四]遍|数了一遍|从头读到尾|从头到尾读|翻了一遍|一项项|一页页|把.{0,12}(读|看|翻|数|捋|梳理)了一遍|全文翻完|顺手翻完"
SPEAK = r"^我(展开|举个|截个|先说|说下|再说|补一句)[^。]{0,8}[。：:]$"   # 说话人的动作孤段，全篇最多 1 处
SOURCE_FIRST = r"(写了|发了|发表了|更了|出了)(一)?(篇|期|条)|在 ?X 上|推特上|播客里|的一篇|这篇(长文|文章)|看完觉得"
OBJECTION = r"有人(可能|也许)?(会|要)?(说|问|觉得|反驳)|有人说|大家应该都|你可能会(说|问|觉得)|很多人(会|第一反应)"
TIME = r"[一二两三四五六七八九十\d]+\s*(天|周|个月|年)前|最近|昨天|今天|前几天|前段时间|这两天|这两年|上周|上个月|去年|前阵子|刚|今年|这几天|那天|\d{1,4}\s*[年月日号点]"

results = {"✗": [], "⚠": [], "✓": []}


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
    paras = [l.strip().replace("**", "") for l in md.splitlines()
             if l.strip() and not l.strip().startswith(("!", "|", "#", ">"))]
    return meta, paras


GENERIC = {"AI", "Agent", "Agents", "API", "APP", "App", "LLM", "GPU", "CEO", "CTO", "PPT", "Prompt", "Token", "SaaS", "ToB", "ToC"}


def brand_in(text):
    """段落里有没有品牌：中文专名表，或者不是通用词的英文专名（MiniMax、Qwen3.7、TRAE）。"""
    if any(n in text for n in CN_NAMES):
        return True
    return any(w not in GENERIC for w in re.findall(r"[A-Z][A-Za-z0-9.]*[A-Za-z0-9]|[A-Za-z]+\d[\w.]*", text))


def check_title(t, allow_cn):
    t = t.strip()
    if not t:
        return
    n = len(t)
    add("✓" if n <= 20 else "✗", f"标题「{t}」{n} 字（小红书上限 20，原号中位 18）")
    head = next((x for x in CN_NAMES if t.startswith(x)), None)
    if head and not allow_cn:
        add("✗", f"标题「{t}」以中文专名「{head}」开头：借句式，开头换成数字或读者处境，专名放后半句"
                 "（用户明确要求时加 --allow-cn-brand-title）")
    elif not head and re.match(r"^[一-龥]{2,4}(是|又|再|开始|正在|终于|这波|把)", t) \
            and not re.match(r"^(很多人|打字|冷知识|别再|我|你|这|那|为什么|如果|AI|看完|逛完|听完)", t):
        add("⚠", f"标题「{t}」开头像是中文专名：是的话换成数字或读者处境开头（英文品牌名开头不受限）")
    if re.search(r"[！!]", t):
        add("⚠", f"标题「{t}」有感叹号：原号 180 篇只有 4 篇用，成熟期几乎不用")
    if re.search(EMO_TITLE, t):
        add("⚠", f"标题「{t}」是原号早期情绪口语期的写法，他们成熟期自己收掉了，换成冷静的判断句")
    if re.search(r"下一期|干货|教你|一文读懂|必看", t):
        add("✗", f"标题「{t}」有禁用词")


def bigrams(t):
    t = re.sub(r"==|<br\s*/?>|[^0-9A-Za-z一-龥]", "", t)
    return {t[i:i + 2] for i in range(len(t) - 1)}


def overlap(cover, title):
    """封面大字的二字组里，有多少在标题里也出现。"""
    c = bigrams(cover)
    return len(c & bigrams(title)) / len(c) if c else 0


def check_cover(meta, titles, base):
    """封面：信息流里只露出这一张，它和标题各管一个钩子。"""
    hl = re.sub(r"\s", "", meta.get("headline", ""))
    if hl and len(hl) > 22:
        add("⚠", f"headline {len(hl)} 字：突出标题一到两行，20 字以内")
    if hl and re.search(r"刷\s*X|外网|推特|英文圈|油管|帖子", hl):
        add("✗", "headline 里出现了外网信源的说法")
    cover = meta.get("cover", "")
    if not cover:
        if not hl and not meta.get("hero"):
            add("⚠", "首页没有 headline 和 hero：信息流里只露出前几行正文，前两段要能单独把人拉进来")
        return
    lines = [re.sub(r"==", "", l).strip() for l in re.split(r"<br\s*/?>", cover) if l.strip()]
    n = sum(len(re.sub(r"\s", "", l)) for l in lines)
    wide = max(sum(1 if ord(c) > 0x2E7F else 0.56 for c in l) for l in lines)
    if len(lines) > 3 or n > 16 or wide > 7.6:
        add("✗", f"封面大字 {len(lines)} 行 {n} 字，最宽一行约 {wide:.1f} 字：最多 3 行、每行 7 字以内、合计 16 字以内，缩略图里才读得出")
    else:
        add("✓", f"封面大字 {len(lines)} 行 {n} 字")
    flat = "".join(lines)
    if "==" not in cover:
        add("⚠", "封面大字没有 ==高亮==：把最要紧的 2 到 4 个字打上黄底")
    if re.search(r"刷\s*X|外网|推特|英文圈|油管|帖子", flat + meta.get("cover_kicker", "")):
        add("✗", "封面上出现了外网信源的说法（刷 X / 外网 / 帖子）：封面只讲事，不讲从哪看来的")
    head = next((x for x in CN_NAMES if flat.startswith(x)), None)
    if head:
        add("⚠", f"封面大字以中文专名「{head}」开头：开头换成读者处境或画面，专名放后半句")
    if len(re.sub(r"\s", "", meta.get("cover_kicker", ""))) > 20:
        add("⚠", "cover_kicker 超过 20 字：小字引子只放一行")
    for t in titles:
        if t and overlap(cover, t) >= 0.5:
            add("✗", f"封面大字和标题「{t}」说的是同一句话（重合 {overlap(cover, t):.0%}）："
                     "封面讲画面或反差，标题讲读者的问题并带上可搜的词，两句连着念应该是上下半句")
    for a in [x.strip() for x in meta.get("cover_alts", "").split("||") if x.strip()]:
        for t in titles:
            if t and overlap(a, t) >= 0.5:
                add("⚠", f"备选封面「{re.sub('==|<br>', '', a)}」和标题重合 {overlap(a, t):.0%}：选它的话标题要换")
    img = meta.get("cover_image")
    if not img:
        add("⚠", "没有 cover_image：封面最好带一张单主体的插图（浅底扁平插画、人物照、原文配图）")
    elif not os.path.exists(os.path.join(base, img)):
        add("✗", f"找不到封面插图 {img}")
    else:
        try:
            from PIL import Image
            px = list(Image.open(os.path.join(base, img)).convert("L").resize((160, 120)).getdata())
            mean, dark = sum(px) / len(px), sum(v < 70 for v in px) / len(px)
            if mean < 70 or dark > 0.70:
                add("✗", f"封面插图太暗（平均亮度 {mean:.0f}，深色像素 {dark:.0%}）：缩略图里是一块黑。"
                         "代码 / 文档 / 界面截图和暗色油画不上封面，换成单主体、明暗分明的图")
            else:
                add("✓", f"封面插图亮度 {mean:.0f}，深色像素 {dark:.0%}")
        except ImportError:
            pass


def check_body(meta, paras, allow_gh):
    text = "".join(paras)
    n = len(re.sub(r"\s", "", text))
    k = max(n / 1000, 0.001)
    lo, _, hi = BASE["chars_q"]
    add("✓" if 1000 <= n <= 3400 else "⚠", f"正文 {n} 字（原号中位 {BASE['chars_median']:.0f}，四分位 {lo} 到 {hi}）")

    lens = [len(p) for p in paras]
    med = statistics.median(lens)
    # 10-04 起往小盖靠：一段两三句、40 到 80 字；原号「一句一段」被读者认成 AI 腔
    add("✓" if 30 <= med <= 85 else "⚠", f"段落中位 {med:.0f} 字（10-04 起目标 30 到 85，一段两三句；原号 {BASE['para_median']:.0f}）")
    long_share = sum(x > 110 for x in lens) / len(lens)
    add("✓" if long_share <= 0.15 else "⚠", f"超过 110 字的段落占 {long_share:.0%}：手机上超过五行，拆一下")
    for p in paras:
        if len(p) > 150:
            add("✗", f"这一段 {len(p)} 字，手机上要七八行，拆开：{p[:24]}…")
    lone = [p for p in paras if len(p) <= 22 and not re.match(r"\d+[.、]|[「“\"]", p)]
    cap = max(3, n // 300)   # 10-03 起每 300 字 1 处（小盖 Kimi 稿 1400 字有七八处，但全是三种允许的类型）
    add("✓" if len(lone) <= cap else "⚠", f"单独成段的短句 {len(lone)} 处（上限 {cap}，每 300 字 1 处；只许三种：带态度的判断 / 说话人动作 / 给上文起名）" +
        ("" if len(lone) <= cap else "：" + " / ".join(f"「{p}」" for p in lone[:6]) + " 并进上一段或下一段"))
    speak = [p for p in paras if re.match(SPEAK, p)]
    if len(speak) > 1:
        add("⚠", f"说话人动作的孤段 {len(speak)} 处（「我展开说下。」这类全篇最多 1 处）：" + " / ".join(f"「{p}」" for p in speak))
    # 10-03 起（小盖第二批）：编号笔记体的编号句要是完整判断，不是提纲
    for p in paras:
        m_ = re.match(r"^(\d+)[、.]\s*(.*)", p)
        if not m_:
            continue
        lead = re.split(r"[。！？]", m_.group(2))[0]
        if len(lead) < 10 or re.match(r"^(第?[一二三四五六七八九]|原因|理由|问题|好处|坑|关键|重点|最后|下面)[：:，]?$", lead):
            add("⚠", f"编号句「{p[:20]}」像提纲：编号开头那句要自己就是一个判断（「5、理解了这个训练逻辑，就会知道 X 根本不是小模型。」），读者只读编号句就能拿走结论")
    # 10-03 起：换一群读者再讲一遍、回指已发稿（都是 ⚠，有就记，没有看情况）
    if not re.search(r"程序员|不写代码|非技术|换成.{0,6}(人|同学|读者)|换个说法|伪代码", text):
        add("⚠", "全篇没有「换一群读者再讲一遍」的痕迹（程序员版给伪代码 / 不写代码的人给工作场景）：两群读者只碰到了一群")
    if not re.search(r"上[周次一]那篇|上一篇|之前那篇|前几篇|前两篇|我写过|写过一篇|上周我|那篇.{0,6}我(写|讲)过", text):
        add("⚠", "没有回指已经发过的稿子（「上周那篇 X 我写过……」）：有可回指的才加，一个「再」字就是关注理由；没有就忽略这条")
    for m_ in re.finditer(r"[^。]*(早就[^。]{0,8}(看明白|玩明白|看透|想明白)|我研究[^。]{0,8}(很多年|多年)|作为[^。]{0,6}(老|资深)[^。]{0,4}(粉|玩家|用户))[^。]*", text):
        add("⚠", f"自称内行：「{m_.group(0)[:30]}」（用户 10-04：不写「XX 我早就看明白了」）。爱好和经历只写事实，不写自己有多懂")
    if re.search(r"F1|高尔夫|赛车|球童|扩散器", text):
        add("⚠", "出现了 F1 / 高尔夫：这两样的比喻暂时不用（用户 10-04），确认是事实陈述而不是比喻")
    bridge = re.findall(r"说人话就是|最硬的一句|最狠的一句|的日常版|一把[^，。]{0,4}尺子|长成了[^，。]{0,8}的形状", text)
    if bridge:
        add("⚠", f"写出来的修辞 / 搭桥句：{'、'.join(dict.fromkeys(bridge))}（10-04 对标小盖）：比喻从生活里随手拿（F1、高尔夫、买菜、通勤），技术解释用「可以很粗略地理解成」")

    # 观点和产出：不做解读号。原号转述词每千字中位 0
    att = len(re.findall(ATTR, text)) / k
    if att > 3:
        add("✗", f"转述词（作者说 / 他写 / 原文 / 研究显示……）每千字 {att:.1f} 次，读起来是一篇解读（原号中位 0）："
                 "事实用自己的话直接讲，出处首页点一次")
    elif att > 1.5:
        add("⚠", f"转述词每千字 {att:.1f} 次（原号中位 0，四分之三的稿子低于 0.5）：再删几处「作者说」")
    for key, what in (("stance", "一句原文没说过的判断"), ("output", "读者能拿走的产出（改法 / 清单 / 算账 / 自测）")):
        if not meta.get(key):
            add("✗", f"front matter 缺 {key}：{what}。没有它就是解读号，不利于涨粉")
    st_ = re.sub(r"\s", "", meta.get("stance", ""))
    grams = {st_[i:i + 2] for i in range(len(st_) - 1) if re.fullmatch(r"[一-龥]{2}", st_[i:i + 2])}
    head = re.sub(r"\s", "", "".join(paras[:6]))
    if grams and sum(g in head for g in grams) < 3:
        add("⚠", "首页（前 6 段）看不到 stance 里的说法：原文结论一两段带过，第三四段就亮出你自己的判断")
    if meta.get("output") and not re.search(r"我会|我先|我建议|可以这样|这么改|三条|几条|清单|自测|算一笔|分成三类", text):
        add("⚠", "正文里找不到产出（我会这么改 / 三条 / 清单……）：产出要写进图里，不只写在 front matter")

    # 首屏测试：原号第一张图约 13 行、208 字（四分位 154 到 254）。178 篇里 83% 有「我」、81% 有时间锚、82% 有数字、61% 在首屏内就转折。
    screen, acc = [], 0
    for p in paras:
        screen.append(p)
        acc += len(p)
        if acc >= 200:
            break
    st = "".join(screen)
    miss = [name for name, pat in (("我", r"我"), ("时间锚", TIME), ("数字", r"\d|[一二两三四五六七八九十百千万]+\s*[个次版轮天页条家篇年月倍万亿]"), ("反差词", CONTRAST)) if not re.search(pat, st)]
    add("✓" if not miss else "⚠", "首屏（前 200 字）" + ("四样都有：我、时间锚、数字、反差" if not miss else f"缺 {'、'.join(miss)}（原号首屏 83% 有我、81% 有时间锚、82% 有数字、61% 有反差）"))
    if re.search(r"这两天我读了|昨天我看到|最近我在|我刷到", st[:40]) and not re.search(r"\d", st[:80]):
        add("⚠", "首屏开头是「我读了 / 我刷到」但前 80 字没有一个具体数字或画面：原号的第一段是一个人在做一件具体的事，不是交代信源")
    if not re.search(r"朋友|同事|老板|客户|吃饭|会上|办公室|家里|地铁|排队|群里|后台|截图|照片|会议|饭桌|车上|门口", st) and not re.search(r"\d", st):
        add("⚠", "首屏既没有具体场景也没有数字：读者 5 秒内要看到一个画面")
    p0 = paras[0]
    if re.search(SOURCE_FIRST, p0) and not re.search(r"^.{0,30}(觉得|认为|其实|根本|没必要|很难|不是|想|打算|最在意|不同意|才是)", p0):
        add("⚠", f"第一段先交代信源：「{p0[:30]}…」 10-03 起第一句是判断或意图（「越来越觉得 X 很难垄断」「想言简意赅写写我对 X 的理解」），信源压成半句放第二段以后")
    # 搜索关键词（writing_guide 8.5）：标题、首页、正文前 150 字都要有主关键词
    kw = meta.get("keyword", "").strip()
    if not kw:
        add("⚠", "front matter 缺 keyword（读者会搜的主关键词）：搜索流量吃不到，09 月搜索来源不到 1%")
    else:
        kwn = re.sub(r"\s", "", kw).lower()
        norm = lambda t: re.sub(r"\s", "", t).lower()
        core = [w for w in re.split(r"[\s，,、]+", kw) if w]        # 「Dots 是什么」拆成 Dots / 是什么，主词按最长的那个查
        main = max(core, key=len).lower() if core else kwn
        hl_ = norm(meta.get("headline", ""))
        for name, t in (("标题", norm(meta.get("title", ""))), ("headline", hl_), ("正文前 150 字", norm("".join(paras))[:150])):
            if t and main not in t:
                add("⚠", f"{name}里没有主关键词「{main}」：搜索靠它命中")
        if not any(main in norm(p) and re.search(r"是|指|就是|叫", p) for p in paras[:8]):
            add("⚠", f"前 8 段里没有一句直接解释「{main}」是什么：搜这个词进来的人要在前两页看到答案")
    # 热点稿（front matter hot: true）：首屏要有时效和紧迫感（09-30 用户要求）
    if str(meta.get("hot", "")).lower() in ("true", "1", "yes", "是"):
        if not re.search(r"刚|昨晚|昨夜|昨天夜里|今天早上|今早|凌晨|小时前|刚刚|刚才|今天凌晨", st):
            add("✗", "热点稿首屏没有时效（刚发 / 昨晚 / 今天早上 / 几小时前）：读者要在第一屏知道这是刚发生的事")
        if not re.search(r"今天就能|现在就能|已经上线|已经开放|今天起|现在就可以|马上能|只有.{0,6}天|几周内|限时|先到先得|今天就开", st):
            add("⚠", "热点稿首屏没有「现在就能怎样」的紧迫感（有一半今天就能用 / 现在就能开 / 几周后才有）：给读者一个今天就点进来的理由")
    # 个人观点密度：活人感靠判断，不靠转述
    op = len(re.findall(r"我觉得|我不会|我会|我最|我反而|我不太|我更|我倒|我自己|我不|我宁", text))
    if op < 3:
        add("⚠", f"全文只有 {op} 处第一人称判断（我觉得 / 我的看法 / 我不会 / 我最……）：至少 3 处，读者要听到这个人怎么看，不只是他读到什么")
    print("—— 首屏（读者在信息流里点进来先看到的）——")
    for p in screen:
        print("  " + p)
    print("——")
    first = paras[0] if paras else ""
    if not re.search(TIME, first[:20]) and not re.search(r"\d", first[:40]):
        add("⚠", f"第一段既没有时间锚也没有数字（10-04 起可以直接讲事实 + 数字，或时间锚 + 我；原号 {BASE['first_para_time']:.0%} 有时间锚）：{first[:24]}…")
    if not any("我" in p for p in paras[:3]):
        add("⚠", f"开头三段没有「我」（原号成熟期 {BASE['first3_has_wo']:.0%} 有）：用一个真实的「我」的动作起笔")
    if not re.search(CONTRAST, "".join(paras[1:5])):
        add("⚠", "前 5 段没有反差（但 / 却 / 其实 / 没想到……，原号 64% 在前 5 段转折）：第一段写场景，紧接着给一个相反的事实")
    if not re.search(r"当然|不过|还没|还不|未必|也有问题|短板|局限|翻车|不完美|代价", text):
        add("⚠", "全文没有局限或翻车：写一处具体的局限（中文没有官方版本 / 要 API key），夸奖才可信。别写成单独一段「当然，有个坑。」")
    zz = text.count("真正")
    if zz / k > 4:
        add("⚠", f"「真正」{zz} 次，每千字 {zz / k:.1f}（原号中位 {BASE['per1k']['真正'][0]}）：多了就成了模仿腔")
    ex = text.count("！") + text.count("!")
    if ex > 1:
        add("⚠", f"正文 {ex} 个感叹号：原号成熟期正文几乎不用")

    for i, p in enumerate(paras):
        gh = re.search(GANGHAO, p) and not re.search(r"(正好|恰好)(相反|反过来|是反|说明|对应)", p)
        if gh and brand_in(p) and not allow_gh:
            add("✗", f"「刚好」式品牌引入：{p[:30]}… 这是原号配合商业合作的话术，我们用会像软广；"
                     "改成先讲透问题再让主角出场（用户明确要求时加 --allow-ganghao）")
        elif gh and not allow_gh:
            add("⚠", f"「刚好 / 正好」：{p[:24]}… 确认它没有在引出品牌")
        if re.search(ZERO_BAR, p):
            add("⚠", f"「零门槛」话术：{p[:24]}… 原号里这句只出现在广告味最重的稿子里")
        if re.search(IDENTITY, p):
            add("⚠", f"身份或朋友场景：{p[:26]}… 只写用户给过的真实经历，没有就删掉，不编朋友、团队、持股")
        if re.search(r"我的(看法|观点|想法|判断|读法|做法)是|我的(看法|观点|想法|判断)[：:，]", p):
            add("✗", f"「我的看法是 / 我的做法是」这类领起语：{p[:24]}… 直接把判断说出来（09-30 用户要求）")
        if re.search(r"我很认|我也说一句|也说一句|说句实话|说句真心话|我个人认为", p):
            add("✗", f"给自己的话加前缀：{p[:24]}…「我很认 / 我也说一句」这类不写（用户 10-03）：认同就写理由，局限直接写成事")
        if re.search(r"扣\s*1|扣一|评论区.{0,4}领|后台数据每周公开|AI 全权运营|AI全权运营", p):
            add("✗", f"图上不写「评论区扣 1 领」「AI 全权运营 / 后台数据公开」：{p[:24]}…（09-30 用户要求）")
        if re.search(r"下一期|下期见|关注我|点赞收藏|求关注|我的看法：", p):
            add("✗", f"账号禁用：{p[:24]}…（不预告下一期、不空喊关注、不写「我的看法：」标签）")
        if re.search(r"https?://|www\.|微信|公众号|二维码", p):
            add("✗", f"站外导流：{p[:24]}…")
        if re.search(BACKSTAGE, p):
            add("✗", f"后台叙述（读到第三遍 / 数了一遍 / 从头读到尾……）：{p[:30]}… 这是 AI 腔，读者不关心你读了几遍；直接说发现了什么")

    tail = paras[-1] if paras else ""
    if re.search(r"总之|综上|总的来说|让我们|未来可期|值得期待", tail):
        add("⚠", f"结尾在总结或展望：{tail[:24]}… 原号收在对仗判断、回扣标题原词或一个具体动作上")
    title = meta.get("title", "")
    if title:
        t = re.sub(r"\s", "", title)
        tail3 = re.sub(r"\s", "", "".join(paras[-3:]))
        stop = {"为什", "什么", "这件", "件事", "开始", "正在", "没有", "可以", "一个", "我们", "你的", "真正"}
        key = re.findall(r"\d+(?:\.\d+)?", t) + re.findall(r"[A-Za-z]{3,}", t) + \
            [t[i:i + 2] for i in range(len(t) - 1) if re.fullmatch(r"[一-龥]{2}", t[i:i + 2]) and t[i:i + 2] not in stop]
        if key and not any(w in tail3 for w in key if len(w) >= 2):
            add("✓", "结尾没有回扣标题里的词（10-04 起往下收也可以：一句平常的评价就停）")


# ---- 中文 AI 腔句式黑名单（10-02 Karpathy 稿被评论区骂「AI 味溢出屏幕」后加）----
# 中文的 AI 腔不是词难、句长，是套路句式：结构词单独成段、单句总结段、先让步再转折、一是二是。
STRUCT = [
    r"^(先说|再说|说回|回到|接着说|下面说|然后说)[^，。！？]{0,10}[。：:]$",          # 先说这份手册。
    r"^(最后|下面|接下来)(给|说|再|补|看|是)[^。]{0,10}[。：:]$",                      # 最后给一个选法：
    r"(有|就)(两|三|四|几)(个|点|条|处)(原因|理由|问题|区别|好处|坑|变化|办法)?[。：:]$",  # 理由有两个。
    r"^(原因|理由|区别|答案|关键|重点|问题)(很简单|有[两三几]|是什么|在哪)",
    r"有(个|一个|几个)(坑|问题|前提|代价|bug)[。：:]$",                                  # 当然，这招有个坑。
    r"没(这么|那么)简单|问题来了|重点来了|关键来了|有意思的是|印象挺深|值得一说|值得说说|话说回来",
]
SUMMARY = r"一般是|本质上|说到底|归根结底|这就是|这才是|才是关键|就够了|还挺合身|说白了|得先立|一句话[，:：]|换句话说"
CONCEDE = r"(可能|也许|或许|确实|当然|诚然|固然|的确)[^。]{0,16}(是对的|没错|有道理|是这样|成立|说得对)"
TURN = r"^(但|不过|可是|然而|只是)"
MODAL = r"必须|务必|一定要|禁止|不得|严禁|不要|别|不许|确保|需要|应该|要|得"


def check_ai_tone(meta, paras, draft_dir):
    """中文 AI 腔：结构词孤段、单句总结段、先让步再转折、一是二是、立场稻草人、改写丢语气。"""
    n_hit, flagged = 0, set()
    for i, p in enumerate(paras):
        short = len(p) <= 18
        if short and any(re.search(r, p) for r in STRUCT):
            add("✗", f"结构词单独成段：「{p}」 这是写给自己看的路标，读者读到的是 AI 在列提纲。删掉，直接写下一段的内容")
            n_hit += 1
            flagged.add(p)
            continue
        if len(p) <= 24 and re.search(SUMMARY, p) and not re.search(r"[「“\"]", p):
            add("✗", f"单句总结段：「{p}」 一句抽象结论单独成段、像金句，是最典型的 AI 腔。并进上一段，或者换成一个具体的事实 / 数字")
            n_hit += 1
            flagged.add(p)
            continue
        # 先让步再转折：同一段「确实……但」，或者这一段让步、后两段内「但」起头
        if re.search(CONCEDE, p):
            nxt = paras[i + 1:i + 3]
            prev = paras[i - 1] if i else ""
            if re.search(OBJECTION, p) or re.search(OBJECTION, prev):
                add("✓", f"替读者问出的反驳后让步：「{p[:20]}…」（10-03 起放行，让步句要带事实）")
            elif re.search(CONCEDE + r"[^。]*[，,；;]\s*(但|不过|可是)", p) or any(re.search(TURN, q) for q in nxt):
                add("✗", f"先让步再转折：「{p[:24]}」→「但……」 这是 AI 最爱的稳妥句式。判断直接下，局限写成具体的事")
                n_hit += 1
        if re.search(r"(固然|诚然)[^。]*(但|不过|可是)", p):
            add("✗", f"先让步再转折（固然 / 诚然……但）：{p[:24]}…")
            n_hit += 1
        if re.search(r"至少(现在|目前|眼下)", p):
            add("⚠", f"「至少现在」式留后路：{p[:24]}… 立场要么下，要么不下，别一边下一边退")
    text = "\n".join(paras)
    m = re.search(r"(一是|一来|其一|首先)[^\n]{0,4}.{0,120}?(二是|二来|其二|其次)", text, re.S)
    if m:
        add("✗", f"「一是……二是……」/「首先……其次」：{m.group(0)[:30]}… 公文腔。两个理由就写两段，各用自己的事开头")
        n_hit += 1
    # 短段里有多少是没有事实的空句：没数字、没引号、没英文、没「我 / 你」、不是问句
    empty = [p for p in paras if len(p) <= 22 and p not in flagged and not re.search(r"\d|[「“\"]|[A-Za-z]|我|你|[？?]", p)]
    if len(empty) >= 3:
        add("⚠", f"没有事实的短段 {len(empty)} 个：" + " / ".join(f"「{p}」" for p in empty[:6]) +
                 " 钩子短段要带信息（一个数字、一个具体的物件、半句话），不要带态度")
    add("✓" if n_hit == 0 else "⚠", f"中文 AI 腔黑名单命中 {n_hit} 处" + ("" if n_hit == 0 else "（见上面的 ✗）"))

    # 立场不许反对原文没说过的观点（10-02：Karpathy 只说「最看好视频」，稿子却「不同意先用视频」）
    st = meta.get("stance", "")
    if re.search(r"不同意|反对|不认同|不赞同|我不信|说错了", st):
        q = meta.get("stance_quote", "").strip().strip("「」\"“”")
        if not q:
            add("✗", "stance 是「不同意原文」，但 front matter 没有 stance_quote：把你反对的那句原文原样贴进来。"
                     "贴不出来，说明你在反对一个原文没说过的观点，换一个 stance")
        else:
            src = os.path.join(draft_dir, "source.md")
            norm = lambda t: re.sub(r"[\s\"“”「」'‘’]", "", t).lower()
            if os.path.exists(src) and norm(q) not in norm(open(src, encoding="utf-8").read()):
                add("✗", f"stance_quote「{q[:30]}」在 source.md 里找不到原句：要逐字贴原文，不是你的转述")
            else:
                add("✓", "stance 反对的观点在原文里找得到原句")

    # 改写示例要保住语气强度（10-02：「请务必确保」改成「先把油箱加满」，把「必须」删了）
    for i, p in enumerate(paras):
        if not re.search(r"原句|原文|改前|原来的", p):
            continue
        before = re.findall(r"「([^」]+)」", p)
        if not before or not re.search(MODAL, "".join(before)):
            continue
        for q in paras[i + 1:i + 4]:
            after = re.findall(r"「([^」]+)」", q)
            if after and re.search(r"改完|改成|改后|改写|简化后", q):
                if not re.search(MODAL, "".join(after)):
                    lost = "、".join(dict.fromkeys(re.findall(MODAL, "".join(before))))
                    add("✗", f"改写丢了语气强度：原句有「{lost}」，改后的「{after[0][:20]}」里没有。"
                             "简化只删套话，不删必须 / 禁止 / 可能这些分量；对照英文原例逐词核一遍")
                break


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    allow_cn, allow_gh = "--allow-cn-brand-title" in argv, "--allow-ganghao" in argv
    if len(args) != 1:
        sys.exit(__doc__)
    arg = args[0]
    folder = arg if os.path.isdir(arg) else None
    draft = os.path.join(arg, "编辑用", "draft.md") if folder else arg
    if not os.path.exists(draft):
        sys.exit(f"找不到 {draft}")
    meta, paras = parse(open(draft, encoding="utf-8").read())
    if not paras:
        sys.exit("draft.md 是空的")
    titles = [meta.get("title", "")]
    if folder:
        for f in ("标题.txt", "标题备选.txt"):
            p = os.path.join(folder, f)
            if os.path.exists(p):
                titles += [l for l in open(p, encoding="utf-8").read().splitlines() if l.strip()]
    for t in dict.fromkeys(titles):
        check_title(t, allow_cn)
    if folder and not any(re.search(r"和|跟|与|比|不一样|不是一回事|完全|路子|反过来|另一条路", t) for t in titles if t):
        add("⚠", "三条标题备选里没有对比站队句（「X 的路子，和 Y 完全不一样。」）：素材有两边可站时补一条，评论靠它（小盖站队稿评论是知识稿的 14 倍）")
    main_title = titles[1] if len(titles) > 1 and titles[1] else titles[0]   # 标题.txt 优先，其次 front matter
    check_cover(meta, [main_title], os.path.dirname(os.path.abspath(draft)))
    check_body(meta, paras, allow_gh)
    check_ai_tone(meta, paras, os.path.dirname(os.path.abspath(draft)))
    for level in ("✗", "⚠", "✓"):
        for msg in results[level]:
            print(f"{level} {msg}")
    print(f"\n{len(results['✗'])} 个 ✗，{len(results['⚠'])} 个 ⚠")
    sys.exit(1 if results["✗"] else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
