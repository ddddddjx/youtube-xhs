#!/usr/bin/env python3
"""找小红书笔记里的 AI 腔，给出改法。只查文风；违规词、导流、Markdown 残留交给 youtube-xhs 的 check_paste.py。

用法:
  python3 ai_tone.py <笔记目录或 正文.txt>

✗ 必须改；⚠ 看一眼，能说出理由就留。有 ✗ 时退出码 1。
"""
import os
import re
import sys

# 套话：换成具体的事（10-05 起「总之」放开：口语里一篇两三处可以，对标小盖）
CLICHE = ["首先", "其次", "再次", "最后，", "总而言之", "综上所述", "总的来说", "值得一提", "值得注意的是",
          "不难发现", "众所周知", "毋庸置疑", "不得不说", "在当今", "随着.{0,8}的发展", "赋能", "抓手", "闭环",
          "底层逻辑", "助力", "无缝", "一站式", "全方位", "深度解析", "让我们一起", "希望对你有所帮助",
          "希望这篇.{0,6}对你", "如果你也", "深受感动", "受益匪浅", "收获满满", "干货满满", "宝藏", "yyds",
          "绝绝子", "谁懂啊", "家人们", "姐妹们冲"]
# 空泛形容：问用户要一个具体的场景或数字
VAGUE = ["非常好用", "特别好用", "超级好用", "效率大幅提升", "大大提高", "极大地", "显著提升", "轻松搞定",
         "一键搞定", "事半功倍", "焕然一新", "质的飞跃", "彻底改变"]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐✅]")


def read_text(path):
    if os.path.isdir(path):
        path = os.path.join(path, "正文.txt")
    if not os.path.exists(path):
        sys.exit(f"找不到 {path}")
    return path, open(path, encoding="utf-8").read()


def main(path):
    path, text = read_text(path)
    bad, warn = [], []
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    body = [l for l in lines if not l.startswith("#")]
    joined = "\n".join(body)

    for w in CLICHE:
        for m in re.finditer(w, joined):
            ctx = joined[max(0, m.start() - 8):m.end() + 12].replace("\n", " ")
            bad.append(f"套话「{m.group(0)}」：…{ctx}…  → 删掉，或换成一件具体的事")
    for w in VAGUE:
        if w in joined:
            warn.append(f"空泛形容「{w}」 → 问用户要一个具体场景或数字（用了多久、省了几分钟、哪一次）")

    if not re.search(r"我", joined):
        warn.append("通篇没有「我」：转述荐读可以只在开头推荐一句、结尾认同一句，别的文体问用户要一个自己的场景")
    # 判断密度：10-06 起从「至少 3 处」改成「最多 4 处」（对标华一说AI：2000 字只有一句「这点我也认同」）
    judg = re.findall(r"我(觉得|感觉|认为|不会|不同意|更在意|最在意|的看法|的做法|会这么|不太信|怀疑|反而)", joined)
    if len(judg) > 4:
        warn.append(f"第一人称判断 {len(judg)} 处（10-06 起最多 4 处）：每段都在表态读起来像表演，留最想说的一两句")
    pairs = re.findall(r"不是[^。，；？\n]{1,20}[，,]\s*(?:而)?是|能[^。，；\n]{1,12}[，,]\s*不能|一个说[^。，；\n]{1,14}[，,]\s*一个说", joined)
    if len(pairs) > 2:
        warn.append(f"「不是 X 是 Y / 能 X 不能 Y」对仗 {len(pairs)} 处（10-06 起最多 2 处）：中文 AI 腔最重的标记，改成平铺直叙，原因用「因为」讲")
    if re.search(r"我(觉得|认为)(很|非常|挺)(有启发|有意思|有道理|不错|值得)", joined):
        warn.append("「我觉得很有启发」这类谁都不会反对的判断不算立场：换成一句会有人不同意的话")
    if not re.search(r"\d", joined):
        warn.append("通篇没有一个数字：加一个具体的时间、次数、金额或时长")
    if not re.search(r"(昨天|今天|上周|那天|那次|第一次|去年|前天|周[一二三四五六日末]|\d+\s*(月|号|点|分钟|小时|天))", joined):
        warn.append("没有任何时间锚（那天 / 上周 / 第一次 / 3 点）：AI 稿最常见的特征是没有「哪一次」")

    # 排比过整齐：连续 3 行以上用同样的前两个字开头
    heads = [re.sub(r"^[\d.、（）()\s]+", "", l)[:2] for l in body]
    run = 1
    for i in range(1, len(heads)):
        run = run + 1 if heads[i] and heads[i] == heads[i - 1] else 1
        if run == 3:
            warn.append(f"连续 3 行以上都以「{heads[i]}」开头，排比太整齐：改掉其中一两行的句式")

    # 句长太匀：AI 稿句子长度方差小
    sents = [s for s in re.split(r"[。！？!?\n]", joined) if len(s.strip()) > 3]
    if len(sents) >= 8:
        ls = [len(s) for s in sents]
        mean = sum(ls) / len(ls)
        sd = (sum((x - mean) ** 2 for x in ls) / len(ls)) ** 0.5
        if sd / mean < 0.35:
            warn.append(f"句子长短太匀（平均 {mean:.0f} 字，变化系数 {sd / mean:.2f}）：加几句 5 字以内的短句")

    n_emoji = len(EMOJI.findall(joined))
    if n_emoji > max(8, len(joined) // 60):
        warn.append(f"emoji {n_emoji} 个，偏多：每段最多一个，放在序号或段首")

    if re.search(r"(?m)^(注意|提示|总结|结论)[:：]", joined):
        warn.append("有「注意：」「总结：」这类标签行：改成一句话说出来")

    print(f"检查：{path}（{len(joined)} 字）")
    for m in bad:
        print("  ✗ " + m)
    for m in warn:
        print("  ⚠ " + m)
    if not bad and not warn:
        print("  ✓ 没发现明显的 AI 腔")
    print(f"\n{len(bad)} 个 ✗，{len(warn)} 个 ⚠")
    print("提醒：AI 起草、你改过的笔记，发布时按平台入口标注 AI 辅助（小红书 2026-04-27 / 08-07 规则）。")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
