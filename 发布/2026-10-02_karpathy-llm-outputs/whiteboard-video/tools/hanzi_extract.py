"""Collect every CJK character used in film.js and write their stroke-order medians to fonts/hanzi.json.
Source: hanzi-writer-data (makemeahanzi, Arphic Public License). python3 tools/hanzi_extract.py <hanzi-writer-data/package dir>"""
import sys, os, re, json
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
chars = sorted(set(re.findall(r'[一-鿿]', open(os.path.join(HERE, 'film.js'), encoding='utf-8').read())))
out, miss = {}, []
for c in chars:
    p = os.path.join(src, c + '.json')
    if os.path.exists(p): out[c] = json.load(open(p, encoding='utf-8'))['medians']
    else: miss.append(c)
json.dump(out, open(os.path.join(HERE, 'fonts', 'hanzi.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'chars', 'missing:', ''.join(miss) or '-')
