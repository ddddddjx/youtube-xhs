# -*- coding: utf-8 -*-
"""打印一段时间里每个词的起止时间，用来把原声片段切准到词。
  python words.py <工作目录> 95 115 [226 245 ...]
"""
import json, sys
from pathlib import Path
d = json.loads((Path(sys.argv[1]) / "transcript.json").read_text())
r = list(map(float, sys.argv[2:]))
for a, b in zip(r[::2], r[1::2]):
    print(f"--- {a}-{b}")
    print(" ".join(f"{w[2].strip()}@{w[0]:.2f}" for s in d for w in s["words"] if a <= w[0] <= b))
