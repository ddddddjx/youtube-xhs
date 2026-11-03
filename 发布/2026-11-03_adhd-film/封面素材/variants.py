import subprocess, pathlib
HEAD = '''<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1080px;height:1440px;overflow:hidden;background:#fff;font-family:"Noto Sans CJK SC","PingFang SC",sans-serif;color:#171717}
.av{position:absolute;left:56px;top:24px;width:96px;height:96px;border-radius:50%;object-fit:cover}
.nm{position:absolute;left:176px;top:22px;font-size:38px;font-weight:500;color:#EE9632}
.sl{position:absolute;left:390px;top:30px;font-size:27px;color:#AAAAAA}
.loc{position:absolute;left:176px;top:78px;font-size:29px;color:#AAAAAA}
.hl{background:linear-gradient(transparent 58%,#FFE03D 58%,#FFE03D 92%,transparent 92%)}
.o{color:#EE9632}
.box{position:absolute;border-radius:22px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.18)}
.box img{width:100%;height:100%;object-fit:cover;display:block}
.play{position:absolute;left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;background:rgba(255,255,255,.88);box-shadow:0 4px 18px rgba(0,0,0,.3)}
.play:after{content:"";position:absolute;left:44px;top:31px;border-left:36px solid #171717;border-top:24px solid transparent;border-bottom:24px solid transparent}
.dur{position:absolute;right:16px;bottom:14px;background:rgba(0,0,0,.6);color:#fff;font-size:24px;font-weight:700;padding:4px 12px;border-radius:8px}
@@CSS@@</style></head><body>
<img class="av" src="avatar.png"><div class="nm">Krypto说AI</div><div class="sl">AI builder · 带你拉开和身边人的差距</div><div class="loc">发布于 香港</div>
@@BODY@@</body></html>'''
V = {
# A 画面在上：大画面紧贴页头，标题压在下半
'A_画面在上': ('''.t{position:absolute;left:56px;right:56px;top:860px;font-size:92px;font-weight:900;line-height:1.2}
.s{position:absolute;left:56px;right:56px;top:1105px;font-size:38px;line-height:1.55}
.chips{position:absolute;left:56px;top:1290px;display:flex;gap:16px}.chips span{border:2px solid #171717;border-radius:40px;padding:8px 22px;font-size:28px;font-weight:700}''',
'''<div class="box" style="left:56px;top:160px;width:968px;height:660px"><img src="hero.jpg"><div class="play"></div><div class="dur">1:00</div></div>
<div class="t">ADHD：注意力<br><span class="hl">真的不够</span>吗？</div>
<div class="s">分心的东西会把光拽走。用一支<b class="o">手电筒</b>，60 秒讲清 ADHD 的原理。</div>
<div class="chips"><span>超专注</span><span>时间近视</span><span>前额晚熟</span></div>'''),
# B 四宫格：四个关键时刻
'B_四宫格': ('''.t{position:absolute;left:56px;right:56px;top:170px;font-size:84px;font-weight:900;line-height:1.22}
.s{position:absolute;left:56px;right:56px;top:400px;font-size:36px}
.g{position:absolute;left:56px;top:480px;width:968px;display:grid;grid-template-columns:1fr 1fr;gap:20px}
.g div{position:relative;height:300px;border-radius:18px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.15)}.g img{width:100%;height:100%;object-fit:cover}
.g b{position:absolute;left:12px;top:12px;background:#FFE03D;color:#171717;font-size:26px;padding:4px 12px;border-radius:8px}
.foot{position:absolute;left:56px;right:56px;top:1170px;font-size:40px;font-weight:700;line-height:1.5}''',
'''<div class="t">ADHD：<br>注意力<span class="hl">真的不够</span>吗？</div>
<div class="s">60 秒动画 · 一支手电筒讲清它的原理</div>
<div class="g"><div><img src="big_05.jpg"><b>① 超专注四小时</b></div><div><img src="hero.jpg"><b>② 分心把光拽走</b></div><div><img src="big_33.jpg"><b>③ 最后一晚才看见</b></div><div><img src="big_42.jpg"><b>④ 前额晚熟三年</b></div></div>
<div class="foot">你不是不够努力，<br>只是比别人<span class="hl">晚一点看见</span>。</div>'''),
# C 大字金句：文字为主，画面小
'C_金句': ('''.q{position:absolute;left:56px;right:56px;top:180px;font-size:92px;font-weight:900;line-height:1.25}
.s{position:absolute;left:56px;right:56px;top:690px;font-size:38px;line-height:1.55;color:#171717}
.bar{position:absolute;left:56px;top:690px;width:8px;height:118px;background:#EE9632}''',
'''<div class="q">你不是<br>不够努力，<br>只是<span class="hl">晚一点</span><br>看见。</div>
<div class="s" style="left:84px">ADHD：注意力真的不够吗？<br>60 秒动画，一支<b class="o">手电筒</b>讲清原理。</div><div class="bar"></div>
<div class="box" style="left:56px;top:860px;width:968px;height:545px"><img src="hero.jpg"><div class="play"></div><div class="dur">1:00</div></div>'''),
# D 换钩子：大脑晚熟
'D_大脑钩子': ('''.t{position:absolute;left:56px;right:56px;top:170px;font-size:84px;font-weight:900;line-height:1.22}
.s{position:absolute;left:56px;right:56px;top:395px;font-size:36px;line-height:1.55}
.num{position:absolute;left:56px;top:1110px;display:flex;gap:24px;width:968px}
.num div{flex:1;border:2px solid #EEEEEE;border-radius:18px;padding:18px 22px}
.num b{display:block;font-size:64px;font-weight:900}.num span{font-size:26px;color:#666}''',
'''<div class="t">ADHD 的大脑，<br>前额<span class="hl">晚熟三年</span></div>
<div class="s">不是懒，也不是糖吃多了。60 秒动画讲清注意力为什么<b class="o">不听自己的手</b>。</div>
<div class="box" style="left:56px;top:520px;width:968px;height:560px"><img src="big_42.jpg"><div class="play"></div><div class="dur">1:00</div></div>
<div class="num"><div><b>7.5 岁</b><span>一般孩子 · 前额皮层峰值</span></div><div><b class="o">10.5 岁</b><span>ADHD 孩子 · Shaw 等 2007</span></div></div>'''),
}
out = pathlib.Path('../封面版本'); out.mkdir(exist_ok=True)
for k, (css, body) in V.items(): (pathlib.Path(f'v_{k}.html')).write_text(HEAD.replace("@@CSS@@", css).replace("@@BODY@@", body), encoding='utf-8')
