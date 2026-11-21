CSS='''body{margin:0;width:970px;background:#fffdf5;font-family:"Noto Sans CJK SC",sans-serif;color:#111}.w{padding:36px 46px}h1{font-size:38px;margin:0 0 8px}.sub{font-size:21px;color:#777;margin-bottom:22px}hl{background:linear-gradient(transparent 58%,#FFE600 58%,#FFE600 92%,transparent 92%);font-weight:800}.row{display:flex;gap:18px}.box{flex:1;border:3px solid #111;border-radius:16px;background:#fff;padding:18px 22px}.box.y{background:#FFE600}.box.g{color:#888;border-color:#aaa}.box.g .t{border-color:#aaa}.t{font-size:27px;font-weight:900;margin-bottom:10px;padding-bottom:8px;border-bottom:3px solid #111}.d{font-size:21px;line-height:1.6}.q{margin-top:18px;background:#111;color:#fff;border-radius:14px;padding:14px 22px;font-size:21px;line-height:1.5}.q b{color:#FFE600}.flow{display:flex;align-items:center;gap:10px;margin:10px 0}.step{flex:1;border:3px solid #111;border-radius:14px;background:#fff;padding:14px 12px;font-size:21px;line-height:1.45;text-align:center}.step.y{background:#FFE600}.step.g{color:#888;border-color:#aaa}.arr{font-size:30px;font-weight:900}.en{font-size:19px;color:#888;line-height:1.5;margin-top:10px}.big{font-size:34px;font-weight:900;line-height:1.5}'''
P={}
P['val']='''<h1>上市前，别人劝他的<hl>一句话</hl></h1><div class=sub>Dario Amodei，11 月 13 日，Anthropic 上市路演</div>
<div class="box y"><div class=big>「永远别让你的公司，<br>比它真实的价值多值一美元。」</div><div class=en style="color:#444">Never let your company be worth a single dollar more than it's really worth.</div></div>
<div class=q>公司内部的说法：<b>underpromise and overdeliver，少承诺，多交付</b></div>'''
P['ship']='''<h1>发布一个模型的顺序：<hl>做好了再说</hl></h1><div class=sub>安全系统也按同样的顺序</div>
<div class=flow><div class=step>把模型<br>做出来</div><div class=arr>→</div><div class=step>确认<br>没有问题</div><div class=arr>→</div><div class="step y"><b>发布</b></div></div>
<div class=row style="margin-top:14px"><div class="box g"><div class=t>不做的</div><div class=d>提前放风<br>发含糊的预告</div></div><div class=box><div class=t>连上市也一样</div><div class=d>哪个月、哪一天、什么行情，<br>都不太在意</div></div></div>'''
P['expect']='''<h1>同一份交付，<hl>两种结果</hl></h1><div class=sub>差别在事先说了多少</div>
<div class=row><div class="box g"><div class=t>话先说满</div><div class=d>承诺 10 分 → 交付 8 分<br><b>对方记住的是：少了 2 分</b></div></div><div class="box y"><div class=t>少承诺</div><div class=d>承诺 6 分 → 交付 8 分<br><b>对方记住的是：多了 2 分</b></div></div></div>
<div class=q>预期先管理好，交付才有机会超出预期，<b>信任就是这样积累起来的</b></div>'''
P['market']='''<h1>模型每变强一截，<hl>多出一个新市场</hl></h1><div class=sub>Dario 的说法：后一个比前一个大得多</div>
<div style="display:flex;align-items:flex-end;gap:16px"><div class="step g" style="flex:1;padding:22px 10px">聊天机器人<br><span style="font-size:18px">2023 年人人在抢<br>已经走到拼价格</span></div><div class=arr>→</div><div class=step style="flex:1.5;padding:48px 10px"><b>编程</b><br><span style="font-size:18px">2023 年他们押的<br>现在开始成熟</span></div><div class=arr>→</div><div class="step y" style="flex:2.1;padding:80px 10px"><b>下一批</b><br><span style="font-size:18px">科学发现、生命科学<br>物理和材料、机器人、网络安全</span></div></div>
<div class=q>他们没有去争聊天机器人，<b>把力气放在了编程上</b></div>'''
P['me']='''<h1>同一段时间，<hl>两种结果</hl></h1><div class=sub>2023 到 2024 年，对话机器人正火</div>
<div class=row><div class=box><div class=t>Anthropic</div><div class=d>判断：模型已经能写代码<br>做法：不争聊天机器人<br><b>结果：编程做出来了</b></div></div><div class="box y"><div class=t>我</div><div class=d>想法：和团队做 agent 创业项目<br>当时：Character.ai 这类产品很火<br><b>结果：没能完全跑通</b></div></div></div>
<div class=q>方向想到的人不少，<b>差别在有没有把它做出来</b></div>'''
P['math']='''<h1>数学这几年：<hl>每一步都有人说是运气</hl></h1><div class=sub>Dario 在路演上讲的顺序</div>
<div class=flow><div class="step g"><b>2023</b><br>高中数学<br>都做不好</div><div class=arr>→</div><div class=step><b>2024</b><br>高中数学<br>做得不错</div><div class=arr>→</div><div class=step><b>2025</b><br>解出几个<br>没人解的小问题</div><div class=arr>→</div><div class="step y"><b>之后</b><br>一次上百个<br>再到大问题</div></div>
<div class=row style="margin-top:14px"><div class="box g"><div class=t>旁人当时怎么说</div><div class=d>「训练数据里本来就有」<br>「碰巧而已」「这道题刚好适合 AI」</div></div></div>
<div class=q>同样的过程在编程上发生过一遍，<b>现在轮到生物和机器人的早期</b></div>'''
P['next']='''<h1>他点名的下一批：<hl>五个方向</hl></h1><div class=sub>按他的说法，会比编程更大</div>
<div class=flow><div class=step>科学发现</div><div class=step>生命科学</div><div class=step>物理和材料</div><div class="step y"><b>机器人</b><br><span style="font-size:18px">我看好这个</span></div><div class=step>网络安全</div></div>
<div class=row style="margin-top:14px"><div class=box><div class=t>软件</div><div class=d>已经突破到很高的水平<br>Claude 操作硬件的能力很强</div></div><div class="box g"><div class=t>硬件</div><div class=d>还没有跟上</div></div></div>'''
P['skeptic']='''<h1>讲愿景的时候，<hl>他自己先泼冷水</hl></h1><div class=sub>关于治愈癌症、阿尔茨海默病、心脏病</div>
<div class=row><div class=box><div class=t>会不会成</div><div class=d>「我们没办法提前知道，<br>也许怀疑的人是对的。」</div><div class=en>Maybe the skeptics are right.</div></div><div class=box><div class=t>要多久</div><div class=d>「5 年、10 年、15 年，<br>我不知道具体多久。」</div><div class=en>I don't know exactly.</div></div></div>
<div class=q>但他也说了：<b>「听起来很疯狂，我是真的相信。」</b></div>'''
P['same']='''<h1>两件事，其实是<hl>同一件</hl></h1><div class=sub>少承诺多交付 × 下一个市场</div>
<div class=flow><div class=step>看到<br>下一个市场</div><div class=arr>→</div><div class="step g">提前<br>喊出来</div><div class=arr>→</div><div class="step y"><b>做出来<br>再开口</b></div></div>
<div class=row style="margin-top:14px"><div class="box g"><div class=t>人很多</div><div class=d>前两步</div></div><div class="box y"><div class=t>人很少</div><div class=d>第三步</div></div></div>
<div class=q>你现在看好的下一个市场是哪一个？<b>我的答案是机器人</b></div>'''
P['pharma']='''<h1>药企说卡在这三步，<hl>他说正在被解决</hl></h1><div class=sub>生物和医药，现在处在数学 2023 年的位置</div>
<div class=flow><div class=step>临床试验</div><div class=step>生产</div><div class=step>审批</div><div class=arr>→</div><div class="step y"><b>一点一点解决<br>几年内全部打通</b></div></div>
<div class=q>他也承认：在任何一个具体领域，<b>怀疑的人都可能是对的</b></div>'''
for k,v in P.items():
    open(k+'.html','w').write(f'<html><head><meta charset=utf-8><style>{CSS}</style></head><body><div class=w>{v}</div></body></html>')
print(' '.join(P))
