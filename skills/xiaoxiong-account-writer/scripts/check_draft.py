#!/usr/bin/env python3
"""小熊先生稿件自检：只提示，不改稿，不判定合格。

用法：python3 check_draft.py [--voice] 稿件.md

--voice：额外对照林木求职 303 篇转写的口吻基线（linmu_baseline.json），见 references/voice-playbook.md。

正文 = 第一个单独一行的 --- 之前的内容；之后视为平台字段。
每条提示都需要人工确认：引号里的台词、引用的原文可能触发提示但不必改。
"""
import json
import os
import re
import sys

CHECKS = [
    ("先否定再纠正", [
        r"不是[^。！？\n]{0,24}(而是|，是|,是)",
        r"并非[^。！？\n]{0,24}而是",
        r"与其[^。！？\n]{0,24}不如",
        r"很多人以为",
        r"表面上[^。！？\n]{0,24}实际上",
        r"大错特错|误区",
        r"别只",
        r"才是(关键|重点|核心|本质)",
    ]),
    ("宣布或播报", [
        r"我的(判断|建议|答案|看法|结论)(是|很简单|就是)",
        r"先(给|说)一句我的",
        r"回到开头",
        r"下面(分|按)[^。\n]{0,8}(说|讲)",
        r"先问清",
        r"这篇(想|只想)?(回答|聊|讲)",
    ]),
    ("身份或经历越界（核对 identity-and-facts 已确认清单）", [
        r"我(辅导|带|面|招)过",
        r"我当年|我们团队|小熊先生认为|私信小熊",
        r"我见过(太多|很多)",
        r"很多人(问我|私信)|后台有人",
        r"我(有个|一个)(学妹|学弟|朋友|同事)",
    ]),
    ("服务承诺和引流", [
        r"免费|包过|保\s*offer|保面试|名额|限时",
        r"通过率(一定|大幅)",
        r"微信|二维码|加我",
    ]),
    ("空泛抽象词", [
        r"底层逻辑|赋能|抓手|闭环|认知升级|降维|核心竞争力",
    ]),
]

HEDGES = r"可能|也许|未必|不一定|或许"

VOICE = [
    ("问句", r"[？?]"),
    ("所以", r"所以"),
    ("序数(第一/第二/第三)", r"第[一二三四五]个?"),
    ("比如说/举个例子", r"比如说|举个例子|比如"),
    ("一定", r"一定"),
    ("其实", r"其实"),
    ("为什么", r"为什么"),
    ("核心", r"核心"),
    ("你", r"你"),
    ("对不对/是不是/你看", r"对不对|是不是|你看"),
    ("面试官/HR/老板/领导", r"面试官|HR|老板|领导|leader|senior|合伙人"),
]
VIEW = r"面试官|HR|senior|带教|合伙人|招人|对面|他会想|心里"


def voice_report(body_lines, n_chars):
    base_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "linmu_baseline.json")
    base = json.load(open(base_path, encoding="utf-8"))
    text = "\n".join(l for l in body_lines if not l.startswith("#"))
    print("\n== 口吻对照（每千字；目标落在林木 P25—中位数之间，口播口水词不算）==")
    for name, pat in VOICE:
        v = len(re.findall(pat, text)) * 1000 / n_chars if n_chars else 0
        b = base.get(name, {})
        lo, mid = b.get("p25", 0), b.get("median", 0)
        flag = "偏低" if v < lo else ("偏高" if v > b.get("p75", 99) * 1.5 else "在范围内")
        print(f"  {name}\t{v:.1f}\t林木 P25 {lo} / 中位 {mid}\t{flag}")
    paras = [l.strip() for l in body_lines if l.strip() and not l.startswith("#")]
    first = paras[0] if paras else ""
    second = paras[1] if len(paras) > 1 else ""
    q = bool(re.search(r"[？?]", first))
    print(f"  首句：{'问题' if q else '判断/场景'}「{first[:30]}」")
    if q and re.search(r"[？?]\s*$", second):
        print("  [开头] 第二段还是问句：问题之后第二句应直接给判断")
    head = "".join(paras[:5])
    if not re.search(r"第一|1、|一、|两个|三个|几个|两件|三件|三步|两类|三类", head):
        print("  [开头] 前五段没有报数或进入第一点")
    if not re.search(VIEW, text):
        print("  [视角] 全文没有出现招人方视角（面试官 / senior / 合伙人在想什么）")
    long_abs = 0
    for pgh in paras:
        if len(pgh) > 120 and not re.search(r"比如|举个例子|「|\d", pgh):
            long_abs += 1
    if long_abs:
        print(f"  [推进] {long_abs} 段超过 120 字且没有例子、引语或数字，检查是否抽象话连成片")
    if "说白了" in text:
        print("  [用词] 出现「说白了」，林木全量几乎不用")


def visible_len(s):
    return len(s.strip())


def main(path, voice=False):
    text = open(path, encoding="utf-8").read()
    lines = text.split("\n")
    split_at = next((i for i, l in enumerate(lines) if l.strip() == "---"), len(lines))
    body = lines[:split_at]
    fields = lines[split_at + 1:]
    body_text = "\n".join(l for l in body if not l.startswith("#"))
    n_chars = len(re.sub(r"\s", "", body_text))

    print(f"正文字数（不含标题行）：{n_chars}")
    found = 0
    for name, pats in CHECKS:
        for i, line in enumerate(body, 1):
            for p in pats:
                m = re.search(p, line)
                if m:
                    found += 1
                    print(f"[{name}] 第{i}行：…{line[max(0, m.start()-12):m.end()+12]}…")
                    break

    for i, line in enumerate(body, 1):
        if "*" in line:
            found += 1
            print(f"[半角星号] 第{i}行：平台会当作格式符号，改用卡片工具的加粗")

    hedges = len(re.findall(HEDGES, body_text))
    per_k = hedges * 1000 / n_chars if n_chars else 0
    print(f"对冲词 {hedges} 次（每千字 {per_k:.1f}）。只需检查每一处后面有没有写出具体条件。")

    title_idx = next((i for i, l in enumerate(fields) if "20字内标题" in l or "20字内短标题" in l), None)
    if title_idx is None:
        print("[平台字段] 没找到「20字内标题」")
    else:
        t = next((l for l in fields[title_idx + 1:] if l.strip()), "")
        n = visible_len(t)
        flag = "超出" if n > 20 else "通过"
        print(f"[平台字段] 20字内标题「{t.strip()}」{n} 字：{flag}")
    sum_idx = next((i for i, l in enumerate(fields) if "200字总结" in l), None)
    if sum_idx is None:
        print("[平台字段] 没找到「200字总结」")
    else:
        s = ""
        for l in fields[sum_idx + 1:]:
            if not l.strip():
                break
            s += l.strip()
        print(f"[平台字段] 总结 {len(s)} 字（参考 160—240）")

    print(f"共 {found} 条句型提示。逐条人工判断，引号内台词和原文引用可以保留。")
    if voice:
        voice_report(body, n_chars)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--voice"]
    if len(args) != 1:
        print(__doc__)
        sys.exit(1)
    main(args[0], voice="--voice" in sys.argv[1:])
