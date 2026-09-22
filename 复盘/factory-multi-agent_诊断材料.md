# meta
标题: The Multi-Agent Architecture That Actually Ships — Luke Alvoeiro, Factory
频道: AI Engineer
时长: 18:30   上传: 20260506
链接: https://www.youtube.com/watch?v=ow1we5PzK-o
许可: Standard YouTube License（未声明可再利用）
英文字幕: 自动字幕 (en-orig)，已清洗断句
中文字幕: Claude 翻译（YouTube 机翻中文因限流未取，且只能译自自动字幕）

# 标题
(无)

# 正文
(无)

# 开头卡
(无)

# 仅供学习
原视频是 Standard YouTube License（AI Engineer 频道），未获授权，字幕成片仅供自己学习，请勿上传小红书。想发视频版请先向原作者取得授权，或自己出镜解读、只引用十几秒片段。

# frame.json
{"tag": "K老师讲AI · 多 Agent 协作", "source": "2026 · AI Engineer Europe · Factory 分享",
 "title": "Agent 连跑 16 天不跑偏<br>靠的是三个角色",
 "speaker": {"name": "Luke Alvoeiro", "role": "Factory · Agent 核心框架负责人"},
 "credit": "中文字幕：Krypto说AI"}

# 目录
/Users/huangjiayi/Documents/Krypto说AI/2026-09-21_factory-multi-agent/视频版:
total 1297712
drwxr-xr-x  10 huangjiayi  staff        320 Sep 22 10:26 .
drwxr-xr-x   6 huangjiayi  staff        192 Sep 21 23:51 ..
-rw-r--r--@  1 huangjiayi  staff       6148 Sep 22 10:26 .DS_Store
-rw-r--r--@  1 huangjiayi  staff  345547084 Sep 21 23:50 factory-multi-agent_中英字幕.mp4
-rw-r--r--@  1 huangjiayi  staff  317967937 Sep 22 10:29 factory-multi-agent_竖版.mp4
-rw-r--r--   1 huangjiayi  staff      22878 Sep 21 23:48 中文字幕.srt
-rw-r--r--   1 huangjiayi  staff      40214 Sep 21 23:48 中英双语字幕.srt
-rw-r--r--   1 huangjiayi  staff        236 Sep 21 23:48 仅供学习_勿上传.txt
drwxr-xr-x   6 huangjiayi  staff        192 Sep 22 10:29 编辑用
-rw-r--r--   1 huangjiayi  staff      27413 Sep 21 23:48 英文字幕.srt

# 英文字幕前80行
1
00:00:15,040 --> 00:00:19,000
Hi everyone. My name is Luke and my goal is that 20 minutes

2
00:00:19,000 --> 00:00:23,560
from now you'll be able to assemble agent teams that can complete tasks orders

3
00:00:23,560 --> 00:00:27,600
of magnitude harder than what you can complete with a single agent today.

4
00:00:27,600 --> 00:00:29,120
A little bit about me.

5
00:00:29,120 --> 00:00:32,480
So I come from a background in dev tools.

6
00:00:32,480 --> 00:00:35,920
About 2 and 1/2 years ago I started a project at Block which is

7
00:00:35,920 --> 00:00:37,480
where I was working at the time.

8
00:00:37,480 --> 00:00:40,240
And that project evolved into Goose.

9
00:00:40,240 --> 00:00:45,840
Goose is now one of the leading coding agents is open source and

10
00:00:45,840 --> 00:00:50,800
it's recently was was donated to the agentic AI Foundation.

11
00:00:50,800 --> 00:00:52,880
So it's been really cool to see.

12
00:00:52,880 --> 00:00:57,480
Now nowadays I work at Factory where I lead our core agent harness and

13
00:00:57,480 --> 00:01:03,540
Factory's mission is to bring autonomy to the entire software development life cycle.

14
00:01:04,440 --> 00:01:06,240
So I want to start off with a claim.

15
00:01:06,240 --> 00:01:10,080
The bottleneck in software engineering nowadays is not intelligence.

16
00:01:10,080 --> 00:01:12,960
It's now limited by human attention.

17
00:01:12,960 --> 00:01:17,400
Even the best engineers can only complete a couple of tasks at a time.

18
00:01:17,400 --> 00:01:20,720
They may have a backlog of 50 features but they can only drive a

19
00:01:20,720 --> 00:01:24,080
few forward per day because every task requires their attention.

20
00:01:24,080 --> 00:01:26,620
Every commit needs their review.


# 中文字幕前80行
1
00:00:15,040 --> 00:00:19,000
大家好，我是 Luke。我希望 20 分钟后

2
00:00:19,000 --> 00:00:23,560
你们能学会组建 Agent 团队，完成的任务

3
00:00:23,560 --> 00:00:27,600
比今天单个 Agent 能做的难好几个数量级

4
00:00:27,600 --> 00:00:29,120
先简单介绍一下我自己

5
00:00:29,120 --> 00:00:32,480
我是做开发者工具出身的

6
00:00:32,480 --> 00:00:35,920
大约两年半前，我在 Block 发起了一个项目

7
00:00:35,920 --> 00:00:37,480
当时我在那里工作

8
00:00:37,480 --> 00:00:40,240
这个项目后来变成了 Goose

9
00:00:40,240 --> 00:00:45,840
Goose 现在是领先的开源编程 Agent 之一

10
00:00:45,840 --> 00:00:50,800
最近还捐给了 Agentic AI Foundation

11
00:00:50,800 --> 00:00:52,880
看到这些真的挺开心的

12
00:00:52,880 --> 00:00:57,480
现在我在 Factory，负责核心 Agent harness

13
00:00:57,480 --> 00:01:03,540
Factory 的使命是让整个软件开发流程实现自主化

14
00:01:04,440 --> 00:01:06,240
我想先抛出一个观点

15
00:01:06,240 --> 00:01:10,080
如今软件工程的瓶颈不是智力

16
00:01:10,080 --> 00:01:12,960
而是人的注意力

17
00:01:12,960 --> 00:01:17,400
再好的工程师，同一时间也只能做几件事

18
00:01:17,400 --> 00:01:20,720
他们可能积压了 50 个功能，但每天只能推进

19
00:01:20,720 --> 00:01:24,080
少数几个，因为每个任务都需要他们盯着

20
00:01:24,080 --> 00:01:26,620
每个 commit 都要他们 review


# log
﻿date,dir,series,no,topic,title_type,score,title,impr,ctr,likes,saves,comments,follows
2026-09-19,2026-09-19_cmu-agent-skills,,0,研报数据,教程,8,CMU 网课 AI Agents 教你如何写 skills,103,,5,10,0,
2026-09-16,2026-09-16_dankoe-delusional-goals,,,创业复盘,人物,,百万博主 Dan Koe：不是没自律，是目标太平庸,114,,12,12,0,
2026-09-19,2026-09-19_stanford-ai-supercycle,,,研报数据,数字,,斯坦福公开课：AI 收入两年爆涨 5 倍,59,,3,3,0,
2026-09-20,2026-09-20_dankoe-fix-life,,,创业复盘,冲突,8,你不是没自律，是你其实不想去,,,,,,
2026-09-21,2026-09-21_x-0xcodila-jev,K老师讲AI,1,工具教程,痛点悬念,6,Agent又慢又贵的最根本原因,,,,,,
2026-09-21,2026-09-21_factory-multi-agent,K老师讲AI,2,工具教程,冲突,8,多开Agent反而更乱？问题不在人手,,,,,,
