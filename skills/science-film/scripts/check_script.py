#!/usr/bin/env python3
"""写完 script.json、跑完 timeline.py 之后查：前 5 秒抓不抓人、中段有没有掉线的空档、结尾有没有转化动作、数字有没有出处。

  python3 check_script.py <工程目录>

红灯（✗）必须改；黄灯（⚠）写理由也可以留。规则的来历见 references/完播与转化.md。
script.json 里除了 beats，还要有：
  "hook":   {"type": "现象|反差|问题|数字|后果", "promise": "看完你会知道……", "payoff": "<兑现承诺的那一拍 id>"}
  "terms":  ["光遗传学", "视紫红质通道蛋白", ...]      # 术语表：前 5 秒不许出现
  "target": [60, 100]                                   # 片长范围（秒），默认竖屏 60–100、横屏 120–200
每一拍可以带：visual（画面里的物在做什么，必填）、facts（引用 facts.json 的 id）、turn（转折 / 新问题）、emotion（情绪高点）、cta（结尾互动）
"""
import json, os, re, sys

proj = sys.argv[1]
S = json.load(open(os.path.join(proj, 'script.json'), encoding='utf-8'))
if os.path.getmtime(os.path.join(proj, 'script.json')) > os.path.getmtime(os.path.join(proj, 'timeline.json')):
    sys.exit('script.json 比 timeline.json 新：先跑 timeline.py 再检查')
T = json.load(open(os.path.join(proj, 'timeline.json'), encoding='utf-8'))
facts = {}
fp = os.path.join(proj, 'facts.json')
if os.path.exists(fp):
    facts = {f['id']: f for f in json.load(open(fp, encoding='utf-8'))}
beats = T['beats']; total = T['total']; portrait = T.get('format', '9:16') == '9:16'
spoken = [b for b in beats if b.get('zh') and not b.get('nosub')]
R, Y = [], []

BANNED = ['治愈', '根治', '疗效', '包治', '神药', '偏方', '排毒', '抗癌', '防癌', '逆转', '最好', '最佳', '第一', '唯一', '100%', '百分百',
          'cure', 'detox', 'miracle', 'guaranteed']
zh_len = lambda s: len(re.sub(r'[\s，。、！？：；—…,.!?「」“”\-]', '', s or ''))

# ---------- 前 5 秒 ----------
first = spoken[0] if spoken else None
if not first or first['start'] > .3:
    R.append('第一句字幕要在 0.3 秒内出来（现在 %.2f 秒）：抖音 / TikTok 前 1 秒没信息就划走' % (first['start'] if first else -1))
if beats and beats[0].get('nosub') and beats[0]['start'] < .1:
    R.append(f"片子以无字的「{beats[0]['id']}」开头：开头不放片名卡、不放黑场、不放纯风景")
hook = S.get('hook') or {}
if hook.get('type') not in ('现象', '反差', '问题', '数字', '后果'):
    R.append('script.json 缺 hook.type（现象 / 反差 / 问题 / 数字 / 后果 选一个），见 references/完播与转化.md 的五种钩子')
if not hook.get('promise'):
    R.append('缺 hook.promise：开头向观众许诺了什么（「看完你会知道……」），不写清楚就兑现不了')
pay = hook.get('payoff')
ids = [b['id'] for b in beats]
if not pay or pay not in ids:
    R.append('缺 hook.payoff，或者那一拍 id 不存在：钩子许诺的东西在哪一拍兑现')
else:
    pb = beats[ids.index(pay)]
    if pb['start'] < total * .5:
        Y.append(f'承诺在 {pb["start"]:.0f} 秒就兑现了（全片 {total:.0f} 秒）：兑现得太早，后半段没人等；放到 60% 之后，或者中段再开一个新问题')
early = [b for b in spoken if b['start'] < 5]
terms = S.get('terms', [])
for b in early:
    for w in terms:
        if w in b['zh']:
            R.append(f'前 5 秒出现了术语「{w}」（{b["id"]}）：开头只讲观众看到的现象，术语放到片名之后')
    if re.search(r'[A-Za-z]{3,}', b['zh']):
        Y.append(f'前 5 秒中文字幕里有英文词（{b["id"]}）')
if early and not any(re.search(r'[？?]|\d|不|却|但|竟|只有|没有|一.{1,3}就|立刻', b['zh']) for b in early):
    Y.append('前 5 秒没有反常、否定、数字或问题，钩子可能不够硬')
if not any(b.get('sfx') for b in beats if b['start'] < 5):
    Y.append('前 5 秒没有任何音效：第一个状态变化（开关、亮起、砸入）配一个声音')

# ---------- 片名卡 ----------
tc = [b for b in beats if b['id'].startswith('title')]
if tc:
    s = tc[0]['start']
    if s < 8:
        R.append(f'片名卡在 {s:.1f} 秒：太早，先用现象抓住人，8 秒之后再亮片名')
    if s > max(25, total * .25):
        Y.append(f'片名卡在 {s:.1f} 秒：偏晚，观众还不知道这是什么片子')
else:
    Y.append('没有片名卡（id 以 title 开头的拍）：系列号靠片名卡让人认得出')

# ---------- 中段：每 15 秒要有一个新钩子 ----------
marks = [b['start'] for b in spoken if re.search(r'[？?]|\d', b['zh']) or b.get('turn')] + [b['start'] for b in beats if b['id'].startswith('title')]
marks = sorted(set(marks + [0.0]))
for a_, b_ in zip(marks, marks[1:] + [total]):
    if b_ - a_ > 15 and a_ < total - 8:
        R.append(f'{a_:.0f}–{b_:.0f} 秒之间 {b_ - a_:.0f} 秒没有问题、数字或转折：观众会在这里划走。加一个问题句、一个带参照物的数字，或标 turn 的转折')

# ---------- 结尾 ----------
if spoken:
    last = [b for b in spoken if not b.get('credits')][-1]
    if not re.search(r'[？?]$', last['zh'].strip()):
        R.append('最后一句不是问句：结尾抛一个人人能答的问题（「如果……，你最想……？」），评论区靠它')
    elif '你' not in last['zh']:
        Y.append('结尾问题里没有「你」：问观众自己，不问抽象的问题')
    if not last.get('cta'):
        Y.append('结尾问题那一拍没标 cta: true')
emo = [b for b in beats if b.get('emotion')]
if not emo:
    R.append('没有情绪高点（emotion: true 的拍）：信息片也要有一个「光，回来了」那样的时刻，放在 70%–90%')
elif not any(total * .6 <= b['start'] <= total * .95 for b in emo):
    Y.append('情绪高点不在 60%–95% 之间')

# ---------- 句子、时长、出处 ----------
for b in spoken:
    n = zh_len(b['zh'])
    if n > (16 if portrait else 22):
        R.append(f'{b["id"]}：中文 {n} 字，太长（{"竖屏 ≤16" if portrait else "横屏 ≤22"}）')
    if b.get('en') and len(b['en'].split()) > 12:
        Y.append(f'{b["id"]}：英文 {len(b["en"].split())} 个词，偏长（≤12）')
    if b['end'] - b['start'] > 6.5:
        Y.append(f'{b["id"]}：一拍 {b["end"] - b["start"]:.1f} 秒，画面要在里面再变一次，否则拆成两拍')
    if not b.get('visual'):
        R.append(f'{b["id"]}：没写 visual（这一拍画面里的物在做什么）')
    if re.search(r'\d', b['zh']):
        refs = b.get('facts', [])
        if not refs:
            R.append(f'{b["id"]}：字幕里有数字「{b["zh"]}」，但没引用 facts.json')
        for r in refs:
            if r not in facts:
                R.append(f'{b["id"]}：引用的事实 {r} 不在 facts.json 里')
            elif not facts[r].get('url'):
                R.append(f'facts.json 的 {r} 没有出处链接')
    for w in BANNED:
        if w.lower() in (b['zh'] + ' ' + b.get('en', '')).lower():
            R.append(f'{b["id"]}：违禁 / 夸大词「{w}」')
for f in facts.values():
    if not f.get('url'):
        R.append(f'facts.json 的 {f.get("id")} 没有出处链接')

lo, hi = S.get('target', [60, 100] if portrait else [120, 200])
if not lo <= total <= hi:
    Y.append(f'片长 {total:.0f} 秒，不在目标 {lo}–{hi} 秒内')

for r in R: print('✗', r)
for y in Y: print('⚠', y)
print(f'{len(R)} 个红灯，{len(Y)} 个黄灯。' + ('红灯清零再写画面代码。' if R else '可以写画面代码。'))
sys.exit(1 if R else 0)
