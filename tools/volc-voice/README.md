# 火山声音复刻：用户自己的声音做视频旁白（11-02 起）

用户要用自己的声音给解说视频配旁白（对标 `对标/Jim_AI_Notebook/`），走火山引擎「豆包声音复刻模型 2.0」。

## 已完成（用户在火山控制台做的）

- 开通了「豆包声音复刻模型 2.0」和「音色槽位」
- 在控制台体验页（https://console.volcengine.com/speech/new/experience/tts?projectName=default ）新增了音色。**音色 ID 不是 `S_` 开头**，具体格式等用户在新会话里贴出来再看（音色 ID 不是机密，可以在对话里发）
- 控制台是新版，只给 API Key，没有 APP ID + Access Token

## Key 怎么给 Claude

Key 不进对话、不进仓库、不进环境变量，存在云端环境的 **Network secrets** 里，由代理在请求里自动加头：

- Allowed websites：`openspeech.bytedance.com`
- Header name：`X-Api-Key`，Prefix 留空，Value 是 Key

所以会话里**读不到 Key**，脚本也不用传 Key：直接向 `https://openspeech.bytedance.com` 发请求，代理会补上 `X-Api-Key`。新会话才生效。

## 新会话第一件事：验证连通

1. 用 `/api/v3/tts/get_voice` 查一次用户给的音色 ID（只读，不扣费），请求头带 `X-Api-Resource-Id: volc.megatts.voiceclone`，不带 Key。返回 401 / 403 说明 secret 没配好或没生效；返回音色状态（2 或 4 = 可合成）说明通了
2. 通了再合成一句 5 秒左右的试听（会产生少量费用，先跟用户说一声），用 `/api/v3/tts/unidirectional`，Resource-Id `seed-icl-2.0`，`sample_rate` 显式传 48000。发给用户听像不像
3. 新版控制台的音色 ID 格式和旧文档不同，Resource-Id 和请求体字段如有出入，以接口返回的错误信息为准调整，接口细节参考 `skills/huashu-art-motion/references/口播API.md`（那份是旧版 APP ID + Token 鉴权的实测记录）

## 11-02 第一次验证记录

- **Key 通了**：请求不带 Key 也没有 401 / 403，不同 Resource-Id 返回不同的授权结果（`volc.service_type.10029`、`volc.megatts.default` 报 `45000030 not granted`，`seed-icl-2.0` / `volc.megatts.voiceclone` 能进到音色校验），说明代理加头生效、账号被识别
- **音色 ID 不对**：用户给的「本人」在 get_voice 和 unidirectional 都返回 `55000000 resource ID is mismatched with speaker related resource`，跟随手编的假 ID `S_notexist123` 返回一模一样，判断「本人」是控制台里音色的**名称**，不是 ID。待用户从控制台音色列表复制「音色 ID」那一列（通常是一串字母数字）
- 拿到真 ID 后按上面第 1、2 步重跑：get_voice 用 `volc.megatts.voiceclone`，合成用 `seed-icl-2.0`

## 还没做

- `skills/huashu-art-motion/scripts/koubo.py` 只支持 APP ID + Access Token 鉴权（`X-Api-App-Id` / `X-Api-Access-Key`），要改成「无凭证也能发、交给代理加头」，验证通了再改
- 用户在控制台训练时用的录音是哪段，没确认；如果是随手录的短样本，不像的话请用户按 `对标/Jim_AI_Notebook/` 那次对话给的约 450 字朗读稿重录 2 到 3 分钟，在同一槽位重训
- 横版还是竖版、要不要固化成 skill，用户还没定（见 CLAUDE.md 摘要 10-30 Jim AI Notebook 条）
