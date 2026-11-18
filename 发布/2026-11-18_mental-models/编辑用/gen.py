"""十张工程师思维模型卡，中文版（1080×1440，左上角账号头像 + 名字）。"""
import os

N = 10
CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1440px;background:#f7f6f3;font-family:"Noto Sans CJK SC","Noto Sans SC",sans-serif;color:#141821;overflow:hidden}
.page{position:relative;width:1080px;height:1440px;padding:34px 56px 0;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:16px;height:76px}
.top img{width:68px;height:68px;border-radius:50%;border:3px solid #FFE600}
.top .nm{font-size:32px;font-weight:700;color:#E8833A}
.top .sl{font-size:22px;color:#9a9a9a;margin-left:4px}
.top .no{margin-left:auto;font-size:22px;letter-spacing:3px;color:#7d8597}
.kick{margin-top:26px;font-size:22px;letter-spacing:4px;color:#7d8597}
h1{font-size:84px;font-weight:900;line-height:1.08;margin-top:6px;letter-spacing:1px}
h1 small{font-size:30px;font-weight:500;color:#9aa3b5;margin-left:14px;letter-spacing:0}
.q{font-size:36px;font-weight:700;color:#6f7f9f;margin-top:10px}
.intro{font-size:27px;line-height:1.6;color:#3d4350;margin-top:16px}
hl{background:linear-gradient(transparent 55%,#FFE600 55%,#FFE600 92%,transparent 92%);font-weight:700;color:#141821}
.body{margin-top:20px;flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:30px}
.box{border-radius:20px;padding:18px 22px}
.b{background:#e4ecf7}.g{background:#e3f0e5}.o{background:#fbeadb}.p{background:#f8e1e1}.v{background:#ebe7f6}.y{background:#fdf3cf}.w{background:#fff;border:2px solid #e6e3dc}
.t{font-size:28px;font-weight:800}
.d{font-size:22px;line-height:1.5;color:#4a5160;margin-top:4px}
.num{display:inline-flex;width:34px;height:34px;border-radius:50%;background:#141821;color:#FFE600;font-size:20px;font-weight:800;align-items:center;justify-content:center;margin-right:8px;vertical-align:3px}
.take{margin:0 0 52px;background:#141821;color:#fff;border-radius:24px;padding:26px 32px;display:flex;gap:22px;align-items:center}
.take .k{font-size:20px;letter-spacing:4px;color:#FFE600;writing-mode:horizontal-tb;white-space:nowrap;border-right:2px solid #555;padding-right:22px}
.take .s{font-size:30px;font-weight:700;line-height:1.5}
.take .s b{color:#FFE600}
.row{display:flex;gap:16px}
.ph img{display:block;max-width:100%;border-radius:18px}
.arr{font-size:40px;color:#6f7f9f;font-weight:700}
.lab{font-size:20px;letter-spacing:3px;color:#7d8597;font-weight:700;margin-bottom:10px}
.bar{height:16px;border-radius:8px;background:#e3e1db;overflow:hidden;flex:1}
.bar i{display:block;height:100%;border-radius:8px}
"""

def page(i, en, cn, q, intro, body, take):
    return f"""<html><head><meta charset=utf-8><style>{CSS}</style></head><body><div class=page>
<div class=top><img src="avatar.png"><span class=nm>Krypto说AI</span><span class=sl>AI builder</span><span class=no>{i:02d} / {N:02d}</span></div>
<div class=kick>工程师的思维模型</div>
<h1>{cn}<small>{en}</small></h1>
<div class=q>{q}</div>
<div class=intro>{intro}</div>
<div class=body>{body}</div>
<div class=take><span class=k>一句话记住</span><span class=s>{take}</span></div>
</div></body></html>"""

def node(cls, n, t, d, img=None, w=None):
    im = f'<img src="crops/{img}.png" style="height:64px;float:right;margin-left:10px;border-radius:10px">' if img else ""
    st = f' style="width:{w}px"' if w else ""
    return f'<div class="box {cls}"{st}>{im}<div class=t>{f"<span class=num>{n}</span>" if n else ""}{t}</div><div class=d>{d}</div></div>'

cards = []

# 1 第一性原理
cards.append(page(1, "First-Principles Thinking", "第一性原理", "这件事最底层，什么是真的？",
 "不照搬类比、惯例和前人留下的假设，先把复杂问题<hl>拆到最基本的事实</hl>，再从这些事实往上推出解法。",
 """<div class="box w" style="padding:34px 20px 26px">
 <div class=row style="justify-content:space-around;font-size:30px;font-weight:800;text-align:center;margin-bottom:14px">
 <div style="width:300px">一个复杂问题</div><div style="width:300px">拆到最基本的事实</div><div style="width:300px">搭出更清楚的解法</div></div>
 <img src="crops/cube.png" style="width:100%;display:block"></div>
 <div class=row style="margin-top:28px">
 <div class="box p" style="flex:1;padding:26px"><div class=t style="font-size:32px">类比思维</div><div class=d style="font-size:25px;margin-top:10px">别人怎么做，我就怎么做。<br>结果是做得跟别人差不多。</div></div>
 <div class="box g" style="flex:1;padding:26px"><div class=t style="font-size:32px">第一性原理</div><div class=d style="font-size:25px;margin-top:10px">这件事由什么构成？每一部分<br>最少要花多少？从这里重新算。</div></div></div>""",
 "先问<b>「什么是真的」</b>，再问「怎么做」。"))

# 2 拆解
sub = [("b","ic_design","外形设计",["CAD 建模","运动学","工作范围"]),("g","ic_control","控制",["PID 控制","运动规划","反馈回路"]),
       ("b","ic_elec","电子",["电机驱动","传感器","供电系统"]),("p","ic_mech","机械结构",["材料","结构强度","加工制造"]),("y","ic_test","测试验证",["性能","可靠性","安全"])]
cols = "".join(f'''<div style="flex:1;text-align:center"><div class="box {c}" style="padding:24px 6px"><img src="crops/{im}.png" style="height:96px"><div class=t style="font-size:28px;margin-top:10px">{t}</div></div>
<div class=arr style="font-size:30px;line-height:1.3">↓</div><div class="box w" style="padding:18px 6px;font-size:24px;line-height:2;color:#4a5160">{"<br>".join(xs)}</div></div>''' for c,im,t,xs in sub)
cards.append(page(2, "Decomposition", "拆解", "这个问题由哪些小问题组成？",
 "一件大到无从下手的事，拆开以后，每一块都是<hl>今天就能动手</hl>的小任务。",
 f"""<div style="display:flex;justify-content:center"><div class="box b" style="display:flex;align-items:center;gap:24px;padding:14px 36px">
 <img src="crops/arm_icon.png" style="height:160px"><div style="font-size:46px;font-weight:900">造一条机械臂</div></div></div>
 <div class=arr style="text-align:center;line-height:1.4">↓</div><div class=row style="gap:12px">{cols}</div>""",
 "把复杂问题拆成<b>能处理的小块</b>，逐个解决，再拼回去。"))

# 3 系统思维
cards.append(page(3, "Systems Thinking", "系统思维", "各部分之间怎么互相影响？",
 "把问题当成一个整体来看，弄清楚各部分之间的<hl>相互作用、依赖和反馈</hl>。",
 f"""<div style="display:grid;grid-template-columns:300px 1fr 300px;grid-template-rows:auto auto auto;gap:14px 16px;align-items:center">
 <div style="grid-column:2;grid-row:1">{node("o","2","控制","规划动作、发出指令、纠正误差","board")}</div>
 <div style="grid-column:1;grid-row:2">{node("b","1","感知","观察环境，比如物体和位置","cam")}</div>
 <div style="grid-column:3;grid-row:2">{node("g","3","执行","把指令变成实际动作：电机、驱动器","motor")}</div>
 <div style="grid-column:1;grid-row:3">{node("v","5","环境","机器人要打交道的外部世界","cube3")}</div>
 <div style="grid-column:3;grid-row:3">{node("p","4","机械","传递力和运动的结构","link")}</div>
 <div style="grid-column:2;grid-row:2/4;text-align:center"><img src="crops/arm.png" style="height:420px"></div></div>
 <div style="text-align:center;margin-top:16px;font-size:26px"><span class="box b" style="padding:8px 20px;font-weight:800">反馈回路</span>
 <span style="color:#4a5160;margin-left:12px">感知 → 决策 → 执行 → 观察，循环往复</span></div>""",
 "系统的表现来自各部分的相互作用。<b>要优化整体</b>，只盯一个零件没用。"))

# 4 约束
cons = [("o","功率","≤ 300 W，续航 ≥ 2 小时"),("b","重量","≤ 20 kg，一个人搬得动"),("g","成本","每台 ≤ 5000 美元"),("p","环境","−10 到 50 °C，防尘防雨"),("v","时间","8 周内做出原型")]
cards.append(page(4, "Constraints", "约束", "什么在限制可能的方案？",
 "先把边界找出来：资源、物理规律、时间、成本和需求。<hl>它们决定了什么做得到</hl>。",
 f"""<div class=row style="align-items:center">
 <div style="width:450px"><div class="box b" style="margin-bottom:12px"><div class=lab>问题</div><div style="font-size:34px;font-weight:900;line-height:1.35">为崎岖地形设计<br>一台野外机器人</div></div>
 <img src="crops/dog.png" style="width:440px;border-radius:18px"></div>
 <div style="flex:1;display:flex;flex-direction:column;gap:10px"><div class=lab>约束条件</div>
 {"".join(f'<div class="box {c}" style="padding:12px 20px"><div class=t style="font-size:26px">{t}</div><div class=d>{d}</div></div>' for c,t,d in cons)}</div></div>
 <div class=row style="margin-top:18px;align-items:center">
 <div class="box p" style="flex:1;display:flex;gap:12px;align-items:center"><div><div class=t style="font-size:24px">✗ 没有约束</div><div class=d>过度设计，又重又贵</div></div><img src="crops/dog_bad.png" style="height:110px;margin-left:auto"></div>
 <div class=arr>→</div>
 <div class="box g" style="flex:1;display:flex;gap:12px;align-items:center"><div><div class=t style="font-size:24px">✓ 有约束</div><div class=d>轻巧专注，刚好满足真实需求</div></div><img src="crops/dog_good.png" style="height:110px;margin-left:auto"></div></div>""",
 "约束会让创造力<b>聚焦</b>。好的工程方案，都是在真实的限制里做出来的。"))

# 5 取舍
def bars(vals, color):
    names = ["速度","重量","续航","耐用","成本"]
    return "".join(f'<div style="display:flex;align-items:center;gap:14px;margin:9px 0"><span style="width:60px;font-size:22px;color:#4a5160">{n}</span><div class=bar><i style="width:{int(v*100)}%;background:{color}"></i></div></div>' for n,v in zip(names, vals))
pareto = """<svg width="470" height="300" viewBox="0 0 470 300"><defs><linearGradient id=gg x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#c9d8ef"/><stop offset=1 stop-color="#c9d8ef" stop-opacity=".15"/></linearGradient></defs>
<line x1=60 y1=20 x2=60 y2=250 stroke="#555" stroke-width=2 /><line x1=60 y1=250 x2=450 y2=250 stroke="#555" stroke-width=2 />
<path d="M80,40 C130,120 180,175 270,205 S400,235 440,238 L440,250 L80,250 Z" fill="url(#gg)"/>
<path d="M80,40 C130,120 180,175 270,205 S400,235 440,238" fill=none stroke="#3d5f9e" stroke-width=3 />
<g fill="#fff" stroke="#3d5f9e" stroke-width=3><circle cx=80 cy=40 r=7 /><circle cx=125 cy=105 r=7 /><circle cx=185 cy=165 r=7 /><circle cx=270 cy=205 r=7 /><circle cx=360 cy=228 r=7 /><circle cx=440 cy=238 r=7 /></g>
<text x=10 y=140 font-size=20 fill="#4a5160">重量</text><text x=330 y=280 font-size=20 fill="#4a5160">飞行时间</text>
<rect x=230 y=70 rx=14 width=150 height=34 fill="#dfe7f5"/><text x=244 y=94 font-size=21 font-weight=700 fill="#141821">帕累托前沿</text>
<text x=232 y=128 font-size=18 fill="#6f7f9f">没有免费的提升</text></svg>"""
cards.append(page(5, "Trade-offs", "取舍", "得到什么，又放弃什么？",
 "提升一项性能，往往要牺牲另一项。工程就是<hl>选出合适的平衡</hl>。",
 f"""<div class=row style="align-items:stretch">
 <div class="box b" style="flex:1"><img src="crops/drone_a.png" style="width:100%;border-radius:12px"><div class=t style="margin:6px 0 2px">性能型</div>{bars([1,.2,.47,.47,.7],"#7fb07f")}</div>
 <div style="align-self:center;font-size:30px;font-weight:900;color:#7d8597">VS</div>
 <div class="box o" style="flex:1"><img src="crops/drone_b.png" style="width:100%;border-radius:12px"><div class=t style="margin:6px 0 2px">耐用型</div>{bars([.35,.85,.7,1,.78],"#d8b37a")}</div></div>
 <div class=row style="margin-top:16px;align-items:center"><div style="flex:1"><div class=lab>取舍曲线</div><div style="font-size:26px;line-height:1.6;color:#3d4350">你没法同时把所有指标拉满。<br>目标是为自己的场景，<hl>找到合适的折中</hl>。</div></div>{pareto}</div>""",
 "没有完美的设计，只有最适合你的<b>目标、约束和现实场景</b>的那个取舍。"))

# 6 反馈回路
alt = """<svg width="470" height="250" viewBox="0 0 470 250"><line x1=50 y1=20 x2=50 y2=205 stroke="#555" stroke-width=2 /><line x1=50 y1=205 x2=455 y2=205 stroke="#555" stroke-width=2 />
<line x1=50 y1=95 x2=455 y2=95 stroke="#888" stroke-dasharray="8 6" stroke-width=2 />
<path d="M50,175 C95,170 110,70 150,62 C185,56 200,100 230,102 C260,104 270,92 300,95 L455,95" fill=none stroke="#2f62d6" stroke-width=4 />
<text x=8 y=100 font-size=18 fill="#4a5160">10 米</text><text x=8 y=180 font-size=18 fill="#4a5160">6 米</text>
<text x=380 y=232 font-size=18 fill="#4a5160">时间（秒）</text><text x=300 y=84 font-size=18 fill="#555">目标 10 米</text><text x=110 y=40 font-size=18 fill="#2f62d6">实际高度</text></svg>"""
cards.append(page(6, "Feedback Loops", "反馈回路", "系统怎么发现并纠正误差？",
 "测量系统的输出，跟想要的结果比较，再<hl>用这个差值去调整输入</hl>。",
 f"""<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:center">
 <div></div>{node("b","1","目标值","想要的状态：高度 10 米")}<div></div>
 {node("b","6","测量","感知实际状态：高度 9.2 米","cam6")}<div style="text-align:center"><img src="crops/drone6.png" style="width:300px;border-radius:14px"></div>{node("g","2","误差","目标减实际：差 0.8 米")}
 {node("v","5","被控对象","实际的物理系统：无人机在动")}{node("y","4","执行器","把指令落到实处：电机加速")}{node("p","3","控制器","比如 PID，算出修正：加大推力")}</div>
 <div class=row style="margin-top:16px;align-items:center"><div class="box w" style="padding:10px 12px"><div class=lab style="margin:0 0 0 6px">例子：高度控制</div>{alt}</div>
 <div class="box g" style="flex:1"><div class=lab>生活里的例子</div><div style="font-size:23px;line-height:1.9;color:#3d4350">恒温器：保持温度<br>无人机：保持姿态和位置<br>电机控制：保持转速<br>定速巡航：保持车速</div></div></div>""",
 "测量 → 比较 → 纠正 → 重复。反馈让一个系统变得<b>稳定、可靠、精确</b>。"))

# 7 瓶颈
st = [("上料",120),("加工",100),("检测",60),("装配",110),("包装",120)]
lab = "".join(f'<div class="box {"p" if v==60 else "w"}" style="flex:1;text-align:center;padding:10px 4px"><div style="font-size:21px;color:#7d8597">第 {i+1} 环</div><div class=t style="font-size:27px{";color:#c0392b" if v==60 else ""}">{n}</div><div style="font-size:21px{";color:#c0392b;font-weight:800" if v==60 else ""}">{v} 件/小时</div></div>' for i,(n,v) in enumerate(st))
bl = "".join(f'<div style="display:flex;align-items:center;gap:12px;margin:7px 0"><span style="width:76px;font-size:21px">第 {i+1} 环</span><div class=bar><i style="width:{v/1.2:.0f}%;background:{"#e57373" if v==60 else "#8fbf8f"}"></i></div><span style="width:56px;font-size:21px;text-align:right">{v}</span></div>' for i,(n,v) in enumerate(st))
cards.append(page(7, "Bottlenecks", "瓶颈", "是什么在限制整体表现？",
 "一个系统的总产出，取决于它<hl>最慢、最受限的那一环</hl>。",
 f"""<div class=row style="gap:10px">{lab}</div><img src="crops/line.png" style="width:100%;margin-top:10px;border-radius:14px">
 <div class=row style="margin-top:12px">
 <div class="box w" style="flex:1.1"><div class=t style="font-size:25px">系统产出 = <span style="color:#c0392b">60 件/小时</span></div><div class=d style="margin-bottom:4px">总产出被最慢的一环卡住</div>{bl}</div>
 <div style="flex:1;display:flex;flex-direction:column;gap:10px"><div class=lab style="margin:4px 0 0">改对地方</div>
 <div class="box p"><div class=t style="font-size:24px">✗ 第 1 环提速 120 → 150</div><div class=d>产出还是 60，一点没变</div></div>
 <div class="box g"><div class=t style="font-size:24px">✓ 第 3 环提速 60 → 110</div><div class=d>产出升到 100</div></div></div></div>""",
 "要改的是<b>瓶颈那一环</b>。最忙、最显眼的那一环，改了也没用。"))

# 8 数量级估算
steps = [("1","功耗","中型无人机约 200 W（10² W 量级）"),("2","所需能量","E = P × t ≈ 200 W × 1 h = 200 Wh"),("3","算上损耗","约 20% 损耗：200 Wh × 1.2 ≈ 240 Wh")]
tbl = [("人的体重","10² kg","≈ 100 kg"),("汽车功率","10⁵ W","≈ 100 kW"),("无人机电池","10² Wh","≈ 100–300 Wh"),("一栋楼一天用电","10⁵ Wh","≈ 100 kWh")]
why = [("可行性","很快知道想法现不现实"),("验算","抓出计算和设计里的大错"),("更快决策","设计早期够用了"),("建立直觉","对真实世界的尺度有感觉")]
cards.append(page(8, "Order-of-Magnitude", "数量级估算", "大概是什么量级？",
 "用简单推理和整数，快速得到一个近似答案，<hl>用来判断可行性、发现错误、更快做决定</hl>。",
 f"""<div class=row style="align-items:stretch"><div style="width:450px;position:relative"><img src="crops/drone8.png" style="width:100%;height:100%;object-fit:cover;border-radius:18px">
 <div class="box w" style="position:absolute;left:14px;right:14px;bottom:14px;padding:12px 16px"><div class=lab style="margin:0">例子</div><div style="font-size:25px;font-weight:800">飞 1 小时，需要多大的电池？</div></div></div>
 <div style="flex:1;display:flex;flex-direction:column;gap:8px">
 {"".join(f'<div class="box b" style="padding:10px 16px"><div class=t style="font-size:23px"><span class=num style="width:28px;height:28px;font-size:16px">{n}</span>{t}</div><div class=d style="font-size:20px">{d}</div></div><div class=arr style="text-align:center;font-size:22px;line-height:.9">↓</div>' for n,t,d in steps)}
 <div class="box y" style="padding:12px 16px;font-size:26px;font-weight:900">估算 ≈ 250 Wh（10² Wh 量级）</div></div></div>
 <div class=row style="margin-top:14px"><div class="box w" style="flex:1.15"><div class=lab>用 10 的次方快速想</div>
 {"".join(f'<div style="display:flex;font-size:21px;padding:5px 0;border-top:1px solid #eee"><span style="flex:1.4">{a}</span><span style="flex:.9;font-weight:800">{b}</span><span style="flex:1.2;color:#4a5160">{c}</span></div>' for a,b,c in tbl)}</div>
 <div class="box g" style="flex:1"><div class=lab>为什么有用</div>{"".join(f'<div style="font-size:21px;line-height:1.75"><b>{a}</b>：{b}</div>' for a,b in why)}</div></div>""",
 "很多时候不需要精确数字，<b>量级对了</b>，就足够做出靠谱的工程决定。"))

# 9 失效分析
fl = [("f1","1","观察"),("f2","2","提出假设"),("f3","3","测试"),("f4","4","找到根因"),("f5","5","修复并验证")]
cards.append(page(9, "Failure Analysis", "失效分析", "它会怎么坏，为什么坏？",
 "一套系统化的方法，找到<hl>根本原因</hl>，不停在表面症状上。",
 f"""<div style="position:relative;height:440px"><img src="crops/gear.png" style="position:absolute;right:0;top:0;height:440px;border-radius:18px">
 <div class="box p" style="position:absolute;left:0;top:120px;width:330px;padding:22px 24px"><div class=t style="color:#c0392b">✗ 症状</div><div class=d style="font-size:25px;color:#141821;margin-top:8px">机械臂没了扭矩，<br>开始打滑。</div></div></div>
 <div class=lab style="margin-top:20px">失效分析五步</div><div class=row style="gap:10px;align-items:center">
 {"<div class=arr style='font-size:26px'>→</div>".join(f'<div style="flex:1;text-align:center"><div class=t style="font-size:23px;margin-bottom:8px"><span class=num style="width:28px;height:28px;font-size:16px">{n}</span>{t}</div><img src="crops/{im}.png" style="width:100%;border-radius:14px"></div>' for im,n,t in fl)}</div>""",
 "把每一次故障，都<b>变成一条信息</b>。"))

# 10 迭代
gf = """<svg width="440" height="270" viewBox="0 0 440 270"><defs><linearGradient id=g2 x1=0 y1=0 x2=0 y2=1><stop offset=0 stop-color="#c9d8ef"/><stop offset=1 stop-color="#c9d8ef" stop-opacity=".1"/></linearGradient></defs>
<line x1=70 y1=15 x2=70 y2=225 stroke="#555" stroke-width=2 /><line x1=70 y1=225 x2=425 y2=225 stroke="#555" stroke-width=2 />
<path d="M100,193 L205,165 L310,128 L405,91 L405,225 L100,225Z" fill="url(#g2)"/><path d="M100,193 L205,165 L310,128 L405,91" fill=none stroke="#2f62d6" stroke-width=4 />
<g fill="#fff" stroke="#2f62d6" stroke-width=3><circle cx=100 cy=193 r=8 /><circle cx=205 cy=165 r=8 /><circle cx=310 cy=128 r=8 /><circle cx=405 cy=91 r=8 /></g>
<g font-size=20 fill="#4a5160"><text x=88 y=252>v1</text><text x=193 y=252>v2</text><text x=298 y=252>v3</text><text x=393 y=252>v4</text>
<text x=84 y=180>7</text><text x=190 y=152>15</text><text x=295 y=115>25</text><text x=388 y=78>35</text><text x=0 y=120>抓力</text><text x=0 y=145>（牛）</text></g></svg>"""
vl = [("v1","原型"),("v2","更结实"),("v3","更轻"),("v4","打磨定型 ✓")]
cards.append(page(10, "Iteration", "迭代", "怎么一步步把它变好？",
 "先做一个简单版本，测试，从结果里学习，<hl>下一轮做得更好</hl>。",
 f"""<img src="crops/grip.png" style="width:100%;border-radius:18px"><div class=row style="margin-top:10px;gap:10px">
 {"".join(f'<div class="box {"g" if v=="v4" else "w"}" style="flex:1;text-align:center;padding:10px;font-size:24px"><b>{v}</b> {t}</div>' for v,t in vl)}</div>
 <div class=row style="margin-top:16px;align-items:center"><div class="box w" style="flex:1;text-align:center"><div class=lab>迭代循环</div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:26px;font-weight:800">
 <div class="box b" style="padding:12px">① 构建</div><div class="box o" style="padding:12px">② 测试</div><div class="box g" style="padding:12px">④ 改进</div><div class="box v" style="padding:12px">③ 学习</div></div>
 <div class=d style="margin-top:8px">构建 → 测试 → 学习 → 改进，再来一轮</div></div>
 <div class="box w"><div class=lab>每一轮的结果</div>{gf}</div></div>""",
 "进步来自<b>把这个循环跑很多遍</b>。第一次就做到完美，几乎不可能。"))

for i, h in enumerate(cards, 1):
    open(f"card{i:02d}.html", "w").write(h)
print("ok", len(cards))
