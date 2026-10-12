#!/usr/bin/env python3
"""小熊先生稿件自检：只提示，不改稿，不判定合格。

用法：python3 check_draft.py 稿件.md

正文 = 第一个单独一行的 --- 之前的内容；之后视为平台字段。
每条提示都需要人工确认：引号里的台词、引用的原文可能触发提示但不必改。
"""
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


def visible_len(s):
    return len(s.strip())


def main(path):
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


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1])
