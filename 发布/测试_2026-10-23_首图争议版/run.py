import sys; sys.path.insert(0, sys.argv[1]); from make_cover import build
R="/home/user/youtube-xhs/发布/"; O=sys.argv[2]+"/"
build(O+"a16z_test.png", ["做产品的都去看看","a16z这两分钟：","差距正按周拉开"],
      "Marc Andreessen 说这是他职业生涯里见过最大的一道差距，<u>而且正以周为单位继续拉开。</u>",
      R+"2026-10-23_a16z-andreessen-gap/meme-v2版/编辑用/shots/08_smile.jpg",
      "a16z 最近一期播客，Andreessen 讲早期用上 AI 的人和其他人的差距。", fs=96, imgh=330)
build(O+"openai_fde_test.png", ["OpenAI自己派人","驻场两个月","才把AI用上"],
      "OpenAI 的 FDE 团队，一个项目第一次部署用了两个月，<u>推广到第二个团队只用了一天。</u>",
      R+"2026-10-23_openai-fde/meme-v2版/编辑用/gap.png",
      "Colin Jarvis《What FDE means at OpenAI》，10-22 发布。", fs=100, imgh=330)
build(O+"claude_duet_test.png", ["Claude Duet：","AI不等你问","自己找上门了"],
      "Anthropic 凌晨发的新应用，十几个小时四百多万浏览，<u>第一次由 AI 来决定什么时候该打扰你。</u>",
      R+"2026-10-22_claude-duet/meme-v2版/编辑用/shots/02b_phone_draft.jpg",
      "官方演示 100 秒：它先起草好，最后一步永远是你按。", fs=100, imgh=330)
