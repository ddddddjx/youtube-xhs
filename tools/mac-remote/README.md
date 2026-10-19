# Mac mini 常驻 Remote Control：人在外面用手机开会话

目的：Mac mini 放家里一直开着，手机 Claude app 随时在它上面新开会话（发公众号 / X 这类只能在 Mac 上跑的活）。
依据：官方文档 https://code.claude.com/docs/en/remote-control （10-19 查）。

## 原理

- `claude remote-control` 是 **server 模式**：一个进程挂多个会话（默认上限 32），手机或 claude.ai/code 可以随时新开。
  `claude --rc` 和 `/rc` 是交互模式，一个窗口只有一个远程会话，不用这个。
- `--spawn worktree`：每个新会话各用一个 git worktree，并行写稿不互相改坏文件。运行中按 `w` 可切回共用目录。
- Mac 主动往外连，不用开端口、不用公网 IP。
- server 模式断网约 10 分钟会**直接退出**，所以交给 launchd（`KeepAlive`）退出就拉起。停掉后 4 小时内旧会话还能接上，超过只能新开。

前提：Pro / Max / Team / Enterprise 订阅，不能是 API key 登录；Team / Enterprise 要管理员先打开 Remote Control 开关。

## 一次性设置（在 Mac mini 上）

1. **先手动跑一遍**，把登录、授权、信任目录这些交互确认做完：
   ```bash
   cd <仓库目录> && claude remote-control --spawn worktree --name "Mac mini"
   ```
   手机 Claude app 里能看到「Mac mini」就 Ctrl+C 退出。顺手跑 `claude remote-control --help`，对一下参数跟当前版本一致。
2. **不让 Mac 睡**：
   ```bash
   sudo pmset -a sleep 0 disksleep 0 autorestart 1 womp 1
   ```
   系统设置 → 用户与群组 → 打开**自动登录**（停电重启后不用人去输密码；launchd 的用户服务要登录后才起）。能插网线就别用 Wi-Fi。
3. **交给 launchd 常驻**：
   ```bash
   zsh tools/mac-remote/install.sh
   ```
   之后崩溃、断网退出、重启都会自己起来。卸载：`zsh tools/mac-remote/install.sh uninstall`。
4. **保底通道（推荐）**：Mac 和手机都装 Tailscale 登同一账号，Mac 打开 系统设置 → 通用 → 共享 → 远程登录。
   Remote Control 挂了，手机用 Termius 之类 SSH 进来：
   ```bash
   tail -50 ~/Library/Logs/claude-rc.log
   launchctl kickstart -k gui/$(id -u)/com.krypto.claude-rc
   ```

## 日常

- 手机 Claude app → Code → 选「Mac mini」→ 新建会话。
- 想少点确认弹窗，可在 install.sh 的启动命令后加 `--permission-mode acceptEdits`，重跑 install.sh。
- 改了 install.sh 里的参数要重跑一次才生效。

## 没核实的

- launchd 不是官方推荐方式（文档只提 tmux / screen）；如果 launchd 下启动卡在交互确认，看日志，退回 `tmux new -d -s rc 'cd <仓库目录> && claude remote-control --spawn worktree'`（停电后不会自己起来）。
- 长时间空闲后登录态会不会过期，文档没写；过期了日志里会有，SSH 进去重新 `claude` 登录一次。
