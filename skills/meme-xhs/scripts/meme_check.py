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
CONTRAST = r"但|却|可是|然而|没想到|反而|不过|偏偏|其实|谁能想到|原来|居然|竟然"
TIME = r"最近|昨天|今天|前几天|前段时间|这两天|这两年|上周|上个月|去年|前阵子|刚|今年|这几天|那天|\d{1,4}\s*[年月日号点]"

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
    elif not head and re.match(r"^[一-龥]{2,4}(，|是|的|又|再|开始|正在|终于|这波|把)", t) \
            and not re.match(r"^(很多人|打字|冷知识|别再|我|你|这|那|为什么|如果|AI|看完|逛完|听完)", t):
        add("⚠", f"标题「{t}」开头像是中文专名：是的话换成数字或读者处境开头（英文品牌名开头不受限）")
    if re.search(r"[！!]", t):
        add("⚠", f"标题「{t}」有感叹号：原号 180 篇只有 4 篇用，成熟期几乎不用")
    if re.search(EMO_TITLE, t):
        add("⚠", f"标题「{t}」是原号早期情绪口语期的写法，他们成熟期自己收掉了，换成冷静的判断句")
    if re.search(r"下一期|干货|教你|一文读懂|必看", t):
        add("✗", f"标题「{t}」有禁用词")


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
        if re.search(r"下一期|下期见|关注我|点赞收藏|求关注|我的看法：", p):
            add("✗", f"账号禁用：{p[:24]}…（不预告下一期、不空喊关注、不写「我的看法：」标签）")
        if re.search(r"https?://|www\.|微信|公众号|二维码", p):
            add("✗", f"站外导流：{p[:24]}…")

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
    check_body(meta, paras, allow_gh)
    for level in ("✗", "⚠", "✓"):
        for msg in results[level]:
            print(f"{level} {msg}")
    print(f"\n{len(results['✗'])} 个 ✗，{len(results['⚠'])} 个 ⚠")
    sys.exit(1 if results["✗"] else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
