# 盯梢清单

用户问「今天做什么」时扫这些来源近 48 小时的新内容，按 topic_score.md 打分，给前 3 个候选。
用户可以随时增删；每行一个来源。下面是起步清单，跑两周后按复盘结果调整。

## YouTube 频道
- Lex Fridman
- Dwarkesh Patel
- Y Combinator
- a16z
- Sequoia Capital
- No Priors
- Latent Space
- Stanford Online
- Anthropic
- OpenAI
- Google DeepMind
- Lenny's Podcast
- 20VC with Harry Stebbings
- Andrej Karpathy
- AI Engineer

## X 账号（只看有长视频 / 长文的）
- @karpathy
- @sama
- @DarioAmodei
- @swyx
- @simonw

## 扫描方法
`yt-dlp --flat-playlist --playlist-end 5 --print "%(upload_date)s %(title)s %(url)s" "https://www.youtube.com/@<频道>/videos"`
X 账号没有稳定接口，用浏览器看；看不了就跳过并告诉用户。
