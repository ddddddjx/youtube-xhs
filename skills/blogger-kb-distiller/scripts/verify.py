#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
蒸馏质量门禁：校验「溯源 + 时间锚定」是否真的做到位。

用法:
  python verify.py <workdir> [--min-coverage 0.8]

检查项:
  1. 每个 05_*.md（排除 00_学习知识地图.md / 溯源与时间索引.md）是否含文档级来源区块
  2. 段末内联标注数量；正文段落的标注覆盖率
  3. 每个内联标注里的视频编号/日期是否与 _provenance_map.json 一致
     - 单源 （来源：视频#N，发布 YYYY-MM-DD）：校验编号存在且日期一致
     - 多源 （来源：视频#N + #M）：校验所有编号存在（不校验单一日期）

退出码:
  0 = 通过（或仅有警告）
  1 = 存在错误（缺文档级区块 / 标注编号或日期无效 / 某篇零标注）

依赖: <workdir>/_provenance_map.json 与 05_精读摘要/ 下长文
"""
import json
import os
import re
import sys
import glob

# 文档级来源区块标志
DOC_BLOCK = re.compile(r'来源视频（共')
# 内联标注整体：捕获「视频#...」到「）」之间的内容
ANN_OUTER = re.compile(r'（来源：视频#(.*?)）')
# 提取所有 #编号
ANN_NUMS = re.compile(r'#(\d+)')

# 非正文段落的判定前缀
SKIP_PREFIXES = ('>', '#', '-', '*', '+', '|', '！', '!')
SEPARATORS = {'---', '***', '___'}


def load_provenance(workdir):
    p = os.path.join(workdir, "_provenance_map.json")
    if not os.path.exists(p):
        return {}, False
    try:
        data = json.load(open(p, encoding="utf-8"))
    except Exception:
        return {}, False
    m = {}
    for it in data:
        if isinstance(it, dict) and it.get("num") is not None:
            m[int(it["num"])] = it.get("date", "")
    return m, True


def parse_annotation(inner):
    """返回 (nums:list[int], date:str|None, kind:'single'|'multi'|'unknown')

    注意：外圈正则 `（来源：视频#(.*?)）` 已吃掉首个 `#`，
    故第一个编号前无 `#`，需单独提取；其余 `#N` 用 ANN_NUMS 取。
    兼容真实变体：
      - 单源完整日期：57，发布 2025-06-27
      - 单源仅有编号（无日期）：57
      - 多源无日期：184、#151、#186
      - 多源带多日期：2、#56，发布 2026-08-07、2025-03-07
      - 年月简写：55、#54、#53，发布 2025-03
    """
    m = re.match(r"\s*(\d+)", inner)
    first = int(m.group(1)) if m else None
    rest = inner[m.end():] if m else inner
    rest_nums = [int(x) for x in ANN_NUMS.findall(rest)]
    nums = ([first] if first is not None else []) + rest_nums
    if not nums:
        return [], None, "unknown"
    dates = re.findall(r"\d{4}-\d{2}(?:-\d{2})?", inner)
    if len(nums) == 1:
        return nums, (dates[0] if dates else None), "single"
    return nums, None, "multi"


def date_match(ann_date, prov_date):
    """标注日期与 provenance 日期是否一致（兼容年月简写）。"""
    if not prov_date:
        return True  # provenance 缺日期则不苛求
    if not ann_date:
        return True  # 标注未给日期（如纯编号）不苛求
    return (ann_date == prov_date
            or prov_date.startswith(ann_date)
            or ann_date.startswith(prov_date))


def split_paragraphs(text):
    """按空行切分，返回正文段落（过滤引用块/标题/列表/分隔线/表格）。"""
    paras = []
    for raw in text.split("\n\n"):
        lines = [l for l in raw.split("\n") if l.strip() != ""]
        if not lines:
            continue
        first = lines[0].strip()
        if first.startswith(SKIP_PREFIXES) or first in SEPARATORS:
            continue
        paras.append(raw)
    return paras


def verify_file(path, prov):
    errors = []
    warnings = []
    text = open(path, encoding="utf-8").read()

    # 1) 文档级来源区块
    has_doc = bool(DOC_BLOCK.search(text))
    if not has_doc:
        errors.append("缺少文档级来源区块")

    # 2) 段末内联标注 + 校验
    inline_count = 0
    invalid = []
    for inner in ANN_OUTER.findall(text):
        nums, date, kind = parse_annotation(inner)
        if kind == "unknown":
            invalid.append(f"无法解析标注「视频#{inner}」")
            continue
        inline_count += 1
        for n in nums:
            if n not in prov:
                invalid.append(f"标注视频#{n} 不在 provenance_map 中")
        if kind == "single" and nums:
            expect = prov.get(nums[0], "")
            if not date_match(date, expect):
                invalid.append(f"视频#{nums[0]} 标注日期 {date} 与 provenance({expect or '空'}) 不一致")

    if inline_count == 0:
        errors.append("无任何段末内联标注")

    # 3) 段落覆盖率
    paras = split_paragraphs(text)
    annotated = 0
    for p in paras:
        # 段末含内联标注（去尾空白后）
        tail = p.rstrip()
        if ANN_OUTER.search(tail) and tail.rstrip().endswith("）"):
            annotated += 1
    coverage = (annotated / len(paras)) if paras else 1.0
    # 约定只给实质性段落加标注（非逐段必标），覆盖率仅作警示，不判失败
    if 0 < coverage < 0.5:
        warnings.append(f"段落标注覆盖率偏低 {coverage:.0%}（{annotated}/{len(paras)}）——请确认是否漏标实质段落")
    elif 0.5 <= coverage < 0.8:
        warnings.append(f"段落标注覆盖率 {coverage:.0%}（{annotated}/{len(paras)}）")

    return {
        "has_doc": has_doc,
        "inline": inline_count,
        "invalid": invalid,
        "coverage": coverage,
        "paras": len(paras),
        "annotated": annotated,
        "errors": errors,
        "warnings": warnings,
    }


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    min_cov = 0.8
    for f in flags:
        if f.startswith("--min-coverage"):
            try:
                min_cov = float(f.split("=", 1)[1])
            except Exception:
                pass

    if len(args) < 1:
        print("usage: python verify.py <workdir> [--min-coverage 0.8]")
        sys.exit(1)
    workdir = args[0]
    art_dir = os.path.join(workdir, "05_精读摘要")
    if not os.path.isdir(art_dir):
        print(f"[ERR] 找不到 {art_dir}")
        sys.exit(1)

    prov, ok = load_provenance(workdir)
    if not ok:
        print(f"[ERR] 找不到或未解析 {os.path.join(workdir, '_provenance_map.json')}，请先跑 build_provenance.py")
        sys.exit(1)
    if not prov:
        print("[WARN] provenance_map 为空，无法校验标注一致性")

    files = sorted(glob.glob(os.path.join(art_dir, "[0-9][0-9]_*.md")))
    # 排除索引与知识地图（非单篇长文）
    files = [f for f in files
             if "溯源与时间索引" not in os.path.basename(f)
             and not os.path.basename(f).startswith("00_")]
    total = len(files)
    pass_files = 0
    all_errors = []
    all_warnings = []
    total_inline = 0
    total_invalid = 0

    print(f"=== 蒸馏质量门禁：{total} 篇长文，provenance 编号 {len(prov)} 个 ===\n")
    for fp in files:
        name = os.path.basename(fp)
        r = verify_file(fp, prov)
        total_inline += r["inline"]
        total_invalid += len(r["invalid"])
        status = "OK" if not r["errors"] else "FAIL"
        if not r["errors"]:
            pass_files += 1
        line = f"[{status}] {name} | 文档级={'✓' if r['has_doc'] else '✗'} | 标注{r['inline']}段 | 覆盖{r['coverage']:.0%}"
        print(line)
        for e in r["errors"]:
            all_errors.append(f"{name}: {e}")
            print(f"    ✗ {e}")
        for w in r["warnings"]:
            all_warnings.append(f"{name}: {w}")
            print(f"    ⚠ {w}")
        for inv in r["invalid"]:
            print(f"    ✗ 无效标注：{inv}")

    print("\n=== 汇总 ===")
    print(f"长文总数: {total}，通过(无错误): {pass_files}，失败: {total - pass_files}")
    print(f"段末内联标注总数: {total_inline}，无效标注: {total_invalid}")
    cov_rate = (pass_files / total) if total else 1.0
    print(f"溯源合规率(无错误篇数占比): {cov_rate:.0%}")

    if all_warnings:
        print(f"\n警告({len(all_warnings)}):")
        for w in all_warnings:
            print(f"  ⚠ {w}")

    if all_errors or total_invalid > 0:
        print(f"\n✗ 不通过：{len(all_errors)} 个错误，{total_invalid} 处无效标注")
        sys.exit(1)
    print("\n✓ 通过：文档级区块齐全、段末标注有效、日期与 provenance 一致。")
    sys.exit(0)


if __name__ == "__main__":
    main()
