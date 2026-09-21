"""字幕翻译辅助：Claude 自己翻译，时间轴与原字幕一一对应。

1) 导出待译文本（每行「序号<TAB>原文」，按批次切文件，每批 ≤ 120 条）:
   python3 sub_translate.py dump en.srt <输出目录>
   → <输出目录>/batch_01.txt, batch_02.txt …
2) Claude 逐批翻译，写同名 *.zh.txt，格式同样是「序号<TAB>译文」，序号一个不能少
3) 组装：python3 sub_translate.py build en.srt <输出目录> zh.srt
   检查缺号 / 多号 / 空行，有问题退出码 1 并列出序号
"""
import glob
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from merge_subs import fmt_srt, read_srt  # noqa: E402

BATCH = 120


def dump(src, out):
    cues = read_srt(src)
    os.makedirs(out, exist_ok=True)
    for b in range(0, len(cues), BATCH):
        with open(os.path.join(out, f"batch_{b // BATCH + 1:02}.txt"), "w", encoding="utf-8") as f:
            for i in range(b, min(b + BATCH, len(cues))):
                f.write(f"{i + 1}\t{cues[i][2]}\n")
    print(f"{len(cues)} 条 → {(len(cues) + BATCH - 1) // BATCH} 批，写在 {out}/batch_XX.txt；"
          f"译文写到 batch_XX.zh.txt")


def build(src, out, dst):
    cues = read_srt(src)
    zh = {}
    for p in sorted(glob.glob(os.path.join(out, "batch_*.zh.txt"))):
        for line in open(p, encoding="utf-8"):
            if "\t" in line:
                n, t = line.rstrip("\n").split("\t", 1)
                if n.strip().isdigit():
                    zh[int(n)] = t.strip()
    missing = [i for i in range(1, len(cues) + 1) if not zh.get(i)]
    extra = [n for n in zh if n > len(cues)]
    if missing or extra:
        sys.exit(f"缺译文序号: {missing[:50]}{' …' if len(missing) > 50 else ''}  多出序号: {extra[:20]}")
    with open(dst, "w", encoding="utf-8") as f:
        for i, (s, e, _) in enumerate(cues, 1):
            f.write(f"{i}\n{fmt_srt(s)} --> {fmt_srt(e)}\n{zh[i]}\n\n")
    print(f"✓ {len(cues)} 条 → {dst}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "dump":
        dump(sys.argv[2], sys.argv[3])
    elif cmd == "build":
        build(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)
