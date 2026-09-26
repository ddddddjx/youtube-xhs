#!/bin/bash
# 打包 skills/ 下的全部 skill：
#   dist/<skill>.zip          → claude.ai 网页 / 桌面 Chat 上传（设置 → Customize → Skills）
#   dist/krypto-xhs.plugin    → Cowork 插件（Customize → Plugins 上传）
# 并同步安装到本机 Claude Code（~/.claude/skills/）。
# 用法: bash build.sh            打包 + 本机安装
#       bash build.sh --no-install   只打包
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/skills"; DIST="$ROOT/dist"
SKILLS=(youtube-xhs xiaohongshu-wutu-zhishika xiaohongshu-manhua-jiangjie xiaohongshu-huochairen-shipin blogger-kb-distiller article-to-xhs)
VERSION="$(date +%Y.%m.%d)"

# 1. 校验：frontmatter name 与目录同名、只含小写字母数字连字符、description ≤1024 字符
for s in "${SKILLS[@]}"; do
  python3 - "$SRC/$s/SKILL.md" "$s" <<'EOF'
import re, sys
path, folder = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
if not m: sys.exit(f"{path}: 缺少 frontmatter")
fm = m.group(1)
name = re.search(r"^name:\s*(\S+)", fm, re.M).group(1)
desc = re.search(r"^description:\s*>-?\n((?:  .*\n?)+)", fm + "\n", re.M)
desc = " ".join(l.strip() for l in desc.group(1).splitlines()) if desc else \
       re.search(r"^description:\s*(.+)$", fm, re.M).group(1)
errs = []
if name != folder: errs.append(f"name={name} 与目录 {folder} 不一致")
if not re.fullmatch(r"[a-z0-9-]{1,64}", name): errs.append(f"name={name} 只能用小写字母/数字/连字符，≤64")
if len(desc) > 1024: errs.append(f"description {len(desc)} 字符 > 1024")
if errs: sys.exit(f"{path}:\n  " + "\n  ".join(errs))
print(f"✓ {folder}: name ok, description {len(desc)} 字符")
EOF
done

# 1b. 路径只能是 ASCII 且无空格（上传校验会报 "Zip file contains path with invalid characters"）
BAD=$(cd "$SRC" && for s in "${SKILLS[@]}"; do find "$s" ! -name .DS_Store -print; done \
      | LC_ALL=C grep -E '[^A-Za-z0-9._/-]' || true)
if [ -n "$BAD" ]; then
  echo "✗ 以下路径含中文 / 空格 / 特殊字符，请改成英文文件名："; echo "$BAD" | sed 's/^/  /'; exit 1
fi
echo "✓ 所有路径均为 ASCII"

# 2. 打包 zip（skill 文件夹放在 zip 根目录）
rm -rf "$DIST"; mkdir -p "$DIST"
for s in "${SKILLS[@]}"; do
  (cd "$SRC" && zip -qr "$DIST/$s.zip" "$s" -x '*.DS_Store' -x '*__pycache__*')
done

# 3. Cowork 插件：.claude-plugin/plugin.json + skills/
STAGE="$(mktemp -d)"
mkdir -p "$STAGE/.claude-plugin" "$STAGE/skills"
cat > "$STAGE/.claude-plugin/plugin.json" <<EOF
{
  "name": "krypto-xhs",
  "version": "$VERSION",
  "description": "Krypto说AI：YouTube 链接 → 小红书视频版 + 图文知识卡 + K 老师漫画 / 火柴人视频",
  "author": {"name": "Krypto说AI"}
}
EOF
for s in "${SKILLS[@]}"; do cp -R "$SRC/$s" "$STAGE/skills/"; done
find "$STAGE" -name .DS_Store -delete; find "$STAGE" -name __pycache__ -prune -exec rm -rf {} +
(cd "$STAGE" && zip -qr "$DIST/krypto-xhs.plugin" .claude-plugin skills)
rm -rf "$STAGE"

# 4. 本机 Claude Code 安装
if [ "${1:-}" != "--no-install" ]; then
  for s in "${SKILLS[@]}"; do
    rm -rf "$HOME/.claude/skills/$s"
    cp -R "$SRC/$s" "$HOME/.claude/skills/$s"
    find "$HOME/.claude/skills/$s" -name .DS_Store -delete
  done
  echo "✓ 已同步到 ~/.claude/skills/"
fi

ls -lh "$DIST" | awk 'NR>1 {print "  " $5 "\t" $9}'
