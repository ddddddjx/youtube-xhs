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
    add("✓" if 22 <= med <= 49 else "⚠", f"段落中位 {med:.0f} 字（原号 {BASE['para_median']:.0f}，四分位 {BASE['para_q'][0]} 到 {BASE['para_q'][2]}）")
    long_share = sum(x > 80 for x in lens) / len(lens)
    add("✓" if long_share <= 0.12 else "⚠", f"超过 80 字的段落占 {long_share:.0%}（原号 {BASE['long_gt80']:.0%}）：长段拆开，一段一两句")
    for p in paras:
        if len(p) > 130:
            add("✗", f"这一段 {len(p)} 字，原号几乎没有这么长的段：{p[:24]}…")
    short = sum(x <= 20 for x in lens) / len(lens)
    add("✓" if 0.12 <= short <= 0.4 else "⚠", f"20 字以内的短段占 {short:.0%}（原号 {BASE['short_le20']:.0%}）：短段是节拍和钩子，太少读着闷，太多像口号")

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
    if not re.search(TIME, first[:20]):
        add("⚠", f"第一段没有时间锚（最近 / 昨天 / 刚 / 这两天……，原号 {BASE['first_para_time']:.0%} 有）：{first[:24]}…")
    if not any("我" in p for p in paras[:3]):
        add("⚠", f"开头三段没有「我」（原号成熟期 {BASE['first3_has_wo']:.0%} 有）：用一个真实的「我」的动作起笔")
    if not re.search(CONTRAST, "".join(paras[1:5])):
        add("⚠", "前 5 段没有反差（但 / 却 / 其实 / 没想到……，原号 64% 在前 5 段转折）：第一段写场景，紧接着给一个相反的事实")
    if not re.search(r"当然|不过|还没|还不|未必|也有问题|短板|局限|翻车|不完美|代价", text):
        add("⚠", "全文没有让步或局限（当然 / 不过 / 短板……）：原号成熟期至少写一处翻车，夸奖才可信")
    zz = text.count("真正")
    if zz == 0:
        add("⚠", "一次「真正」都没有：这是原号第一口头禅（真正的门槛、真正难的是），留一两处")
    elif zz / k > 4:
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
            add("⚠", "结尾三段没有回扣标题里的任何一个词：原号至少 25 篇在结尾逐字回扣标题")


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
    main_title = titles[1] if len(titles) > 1 and titles[1] else titles[0]   # 标题.txt 优先，其次 front matter
    check_cover(meta, [main_title], os.path.dirname(os.path.abspath(draft)))
    check_body(meta, paras, allow_gh)
    for level in ("✗", "⚠", "✓"):
        for msg in results[level]:
            print(f"{level} {msg}")
    print(f"\n{len(results['✗'])} 个 ✗，{len(results['⚠'])} 个 ⚠")
    sys.exit(1 if results["✗"] else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
