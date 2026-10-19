#!/bin/zsh
# 在 Mac mini 上跑一次：把 claude remote-control（server 模式）交给 launchd 常驻
# 用法：zsh tools/mac-remote/install.sh          安装 / 重装
#       zsh tools/mac-remote/install.sh uninstall 卸载
set -e
LABEL=com.krypto.claude-rc
PLIST=~/Library/LaunchAgents/$LABEL.plist
REPO=${0:A:h:h:h}
LOG=~/Library/Logs/claude-rc.log

if [[ $1 == uninstall ]]; then
  launchctl bootout gui/$(id -u)/$LABEL 2>/dev/null || true
  rm -f $PLIST
  echo "已卸载"; exit 0
fi

command -v claude >/dev/null || { echo "找不到 claude，先装 Claude Code"; exit 1; }

mkdir -p ~/Library/LaunchAgents ~/Library/Logs
cat > $PLIST <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string><string>-lc</string>
    <string>cd '$REPO' &amp;&amp; exec claude remote-control --spawn worktree --name "Mac mini"</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict></plist>
PLIST

launchctl bootout gui/$(id -u)/$LABEL 2>/dev/null || true
launchctl bootstrap gui/$(id -u) $PLIST
echo "已启动，仓库：$REPO"
echo "日志：tail -f $LOG"
echo "重启：launchctl kickstart -k gui/$(id -u)/$LABEL"
