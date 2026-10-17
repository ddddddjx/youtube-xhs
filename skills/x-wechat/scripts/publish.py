#!/usr/bin/env python3
"""在 Mac 上跑的发布脚本（只用标准库，不用 pip 装东西）。

云端会话连不上 api.x.com 和 api.weixin.qq.com（10-17 测过），公众号接口还要 IP 白名单，
所以写稿、出图、打包在云端，发布这一步在 Mac 上：

  git pull
  python3 skills/x-wechat/scripts/publish.py check                    # 第一次用：验两边的凭证
  python3 skills/x-wechat/scripts/publish.py wechat 发布/<目录>        # 推进公众号草稿箱，你去后台点发布
  python3 skills/x-wechat/scripts/publish.py x 发布/<目录>             # 列出整条 thread，你输入 y 才发
  python3 skills/x-wechat/scripts/publish.py x 发布/<目录> --dry-run   # 只列，不发

凭证放 ~/.config/krypto-publish.env（格式见 skills/x-wechat/publish.env.example），环境变量同名的优先。
不要放进仓库。

发过的 id 记在 推特版/posted.json、公众号版/posted.json：
- X 中途断了（网络、额度用完），重跑从断的那条接着回复，不会重发前面的
- 公众号已经推过草稿，重跑会拒；要再推一份加 --again
"""
import base64
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ENV_FILE = os.path.expanduser("~/.config/krypto-publish.env")
X_API = "https://api.x.com/2"
WX_API = "https://api.weixin.qq.com/cgi-bin"


# ---------- 公共 ----------

def load_env():
    conf = {}
    if os.path.isfile(ENV_FILE):
        for line in open(ENV_FILE, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                conf[k.strip()] = v.strip().strip('"').strip("'")
    for k in list(conf) + ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET",
                           "WECHAT_APPID", "WECHAT_SECRET"]:
        if os.environ.get(k):
            conf[k] = os.environ[k]
    return conf


def need(conf, keys):
    miss = [k for k in keys if not conf.get(k)]
    if miss:
        sys.exit(f"✗ 缺凭证 {', '.join(miss)}：写进 {ENV_FILE}（模板 skills/x-wechat/publish.env.example）")


def multipart(fields, files):
    """fields: {name: str}; files: {name: path}。返回 (body, content_type)。"""
    boundary = "----krypto" + secrets.token_hex(12)
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, path in files.items():
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        name = os.path.basename(path)
        head = (f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{name}"\r\n'
                f"Content-Type: {ctype}\r\n\r\n").encode()
        parts.append(head + open(path, "rb").read() + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


def http(method, url, body=None, headers=None):
    req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, {"raw": raw.decode(errors="replace")[:500]}


def save(path, data):
    json.dump(data, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


# ---------- X ----------

def pct(s):
    return urllib.parse.quote(str(s), safe="-._~")


def oauth1(method, url, conf, extra=None, nonce=None, ts=None):
    """OAuth 1.0a HMAC-SHA1。JSON 和 multipart 的 body 不进签名，只有 query 和 extra 进。"""
    u = urllib.parse.urlsplit(url)
    base_url = f"{u.scheme}://{u.netloc}{u.path}"
    oa = {
        "oauth_consumer_key": conf["X_API_KEY"],
        "oauth_nonce": nonce or secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(ts or int(time.time())),
        "oauth_token": conf["X_ACCESS_TOKEN"],
        "oauth_version": "1.0",
    }
    params = list(oa.items()) + urllib.parse.parse_qsl(u.query) + list((extra or {}).items())
    norm = "&".join(f"{k}={v}" for k, v in sorted((pct(k), pct(v)) for k, v in params))
    base = "&".join([method.upper(), pct(base_url), pct(norm)])
    key = f"{pct(conf['X_API_SECRET'])}&{pct(conf['X_ACCESS_SECRET'])}"
    oa["oauth_signature"] = base64.b64encode(hmac.new(key.encode(), base.encode(), hashlib.sha1).digest()).decode()
    return "OAuth " + ", ".join(f'{pct(k)}="{pct(v)}"' for k, v in sorted(oa.items()))


def x_call(conf, method, path, payload=None, files=None, fields=None):
    url = X_API + path
    if files:
        body, ctype = multipart(fields or {}, files)
    elif payload is not None:
        body, ctype = json.dumps(payload, ensure_ascii=False).encode(), "application/json"
    else:
        body, ctype = None, None
    headers = {"Authorization": oauth1(method, url, conf)}
    if ctype:
        headers["Content-Type"] = ctype
    return http(method, url, body, headers)


def x_explain(code, data):
    s = json.dumps(data, ensure_ascii=False)
    if code == 401:
        return "401 凭证不对：四个 key 有没有抄错、Access Token 是不是这个号生成的"
    if code == 403 and ("oauth1" in s.lower() or "permission" in s.lower()):
        return "403 应用只有读权限：开发者后台把 App permissions 改成 Read and write，然后重新生成 Access Token"
    if code == 402 or "credit" in s.lower():
        return "额度用完：去 X 开发者后台充值或调支出上限"
    if code == 429:
        return "429 限流：过 15 分钟重跑，脚本会从断的那条接着发"
    if code == 403 and "duplicate" in s.lower():
        return "403 重复内容：X 不让发和自己最近一条一模一样的推"
    return f"{code} {s[:400]}"


def x_upload(conf, root, img):
    code, data = x_call(conf, "POST", "/media/upload",
                        fields={"media_category": "tweet_image"},
                        files={"media": os.path.join(root, img["path"])})
    mid = (data.get("data") or {}).get("id") or data.get("media_id_string")
    if code >= 300 or not mid:
        sys.exit(f"✗ 传图 {img['path']} 失败：{x_explain(code, data)}")
    if img.get("alt"):
        x_call(conf, "POST", "/media/metadata", {"id": mid, "metadata": {"alt_text": {"text": img["alt"]}}})
    return mid


def cmd_x(root, dry):
    src = os.path.join(root, "推特版", "thread.json")
    if not os.path.isfile(src):
        sys.exit(f"✗ 没有 {src}：云端先跑 thread_check.py，commit + push 后再 git pull")
    tweets = json.load(open(src, encoding="utf-8"))["tweets"]
    log_path = os.path.join(root, "推特版", "posted.json")
    log = json.load(open(log_path, encoding="utf-8")) if os.path.isfile(log_path) else {"ids": []}
    done = len(log["ids"])
    if done >= len(tweets):
        sys.exit(f"✓ 这条 thread {done} 条都发过了：https://x.com/i/status/{log['ids'][0]}")

    print(f"=== {root} → X，{len(tweets)} 条" + (f"（前 {done} 条已发，从第 {done + 1} 条接着发）" if done else ""))
    for i, t in enumerate(tweets, 1):
        mark = "已发" if i <= done else "待发"
        print(f"\n--- {i}/{len(tweets)} [{mark}] {t.get('weight', '?')}/280")
        print(t["text"])
        for img in t["images"]:
            print(f"   [图] {img['path']}")
    if dry:
        print("\n--dry-run：没发")
        return 0

    conf = load_env()
    need(conf, ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"])
    if input(f"\n发 {len(tweets) - done} 条到 X？输入 y 确认：").strip().lower() != "y":
        print("没发")
        return 0
    for i in range(done, len(tweets)):
        t = tweets[i]
        payload = {"text": t["text"]}
        mids = [x_upload(conf, root, img) for img in t["images"]]
        if mids:
            payload["media"] = {"media_ids": mids}
        if log["ids"]:
            payload["reply"] = {"in_reply_to_tweet_id": log["ids"][-1]}
        code, data = x_call(conf, "POST", "/tweets", payload)
        tid = (data.get("data") or {}).get("id")
        if code >= 300 or not tid:
            save(log_path, log)
            sys.exit(f"✗ 第 {i + 1} 条没发出去：{x_explain(code, data)}\n  前 {len(log['ids'])} 条已记进 posted.json，修好重跑会接着发")
        log["ids"].append(tid)
        log.setdefault("posted_at", time.strftime("%Y-%m-%d %H:%M"))
        save(log_path, log)
        print(f"  ✓ {i + 1}/{len(tweets)} {tid}")
        time.sleep(2)
    print(f"\n✓ 发完：https://x.com/i/status/{log['ids'][0]}")
    print("  记得 git add 推特版/posted.json 再 push，别的会话才知道这条发过了")
    return 0


# ---------- 公众号 ----------

def wx_token(conf):
    body = json.dumps({"grant_type": "client_credential", "appid": conf["WECHAT_APPID"],
                       "secret": conf["WECHAT_SECRET"]}).encode()
    code, data = http("POST", WX_API + "/stable_token", body, {"Content-Type": "application/json"})
    if "access_token" not in data:
        sys.exit("✗ 拿不到 access_token：" + wx_explain(data))
    return data["access_token"]


def wx_explain(data):
    err = data.get("errcode")
    msg = data.get("errmsg", "")
    if err == 40164:
        ip = msg.split("invalid ip ")[-1].split(" ")[0] if "invalid ip" in msg else "（看 errmsg）"
        return (f"40164 这台机器的 IP {ip} 不在白名单：公众号后台 → 设置与开发 → 开发接口管理 → "
                f"IP 白名单 加上它，等一两分钟重跑。家里宽带的出口 IP 会变，变了要再加一次")
    if err in (40001, 40125, 40013):
        return f"{err} AppID 或 AppSecret 不对：后台 开发接口管理 → 基本配置 重新复制，Secret 重置过旧的就失效"
    if err == 48001:
        return "48001 账号没有这个接口权限：多半是认证过期或主体类型不支持，去后台 接口权限 看草稿箱 / 素材管理是不是「已获得」"
    if err == 45009:
        return "45009 今天调用次数用完，明天再推"
    if err == 45166:
        return "45166 正文里有公众号不收的内容（外链、脚本），看 正文.html"
    return json.dumps(data, ensure_ascii=False)


def wx_upload(token, path, kind):
    """kind=body：正文图，返回 url；kind=cover：永久素材，返回 media_id。"""
    if kind == "body":
        url = f"{WX_API}/media/uploadimg?access_token={token}"
    else:
        url = f"{WX_API}/material/add_material?access_token={token}&type=image"
    body, ctype = multipart({}, {"media": path})
    code, data = http("POST", url, body, {"Content-Type": ctype})
    key = "url" if kind == "body" else "media_id"
    if key not in data:
        sys.exit(f"✗ 传图 {os.path.basename(path)} 失败：" + wx_explain(data))
    return data[key]


def cmd_wechat(root, again):
    wx = os.path.join(root, "公众号版")
    src = os.path.join(wx, "wechat.json")
    if not os.path.isfile(src):
        sys.exit(f"✗ 没有 {src}：云端先跑 render_wechat.py 和 prep_wechat.py，commit + push 后再 git pull")
    meta = json.load(open(src, encoding="utf-8"))
    log_path = os.path.join(wx, "posted.json")
    if os.path.isfile(log_path) and not again:
        old = json.load(open(log_path, encoding="utf-8"))
        sys.exit(f"✓ {old.get('pushed_at')} 已经推过一份草稿（media_id {old.get('media_id')}）。要再推一份加 --again")

    conf = load_env()
    need(conf, ["WECHAT_APPID", "WECHAT_SECRET"])
    token = wx_token(conf)
    html = open(os.path.join(wx, meta["html"]), encoding="utf-8").read()
    for rel in meta["images"]:
        url = wx_upload(token, os.path.join(wx, rel), "body")
        html = html.replace(f'src="{rel}"', f'src="{url}"')
        print(f"  ✓ 正文图 {rel}")
    thumb = wx_upload(token, os.path.join(wx, meta["cover"]), "cover")
    print("  ✓ 封面")

    article = {
        "title": meta["title"],
        "author": meta["author"],
        "digest": meta["digest"],
        "content": html,
        "thumb_media_id": thumb,
        "need_open_comment": meta.get("need_open_comment", 1),
        "only_fans_can_comment": 0,
    }
    # ensure_ascii=False：不这样中文会以 \uXXXX 原样存进草稿
    body = json.dumps({"articles": [article]}, ensure_ascii=False).encode("utf-8")
    code, data = http("POST", f"{WX_API}/draft/add?access_token={token}", body,
                      {"Content-Type": "application/json; charset=utf-8"})
    if "media_id" not in data:
        sys.exit("✗ 推草稿失败：" + wx_explain(data))
    save(log_path, {"media_id": data["media_id"], "pushed_at": time.strftime("%Y-%m-%d %H:%M")})
    print(f"\n✓ 已进草稿箱：{meta['title']}")
    print("  公众号后台 → 内容管理 → 草稿箱，打开这篇：")
    print("  1. 文末「创作来源」勾「内容由 AI 生成 / 辅助」（账号规矩：AI 起草的稿按平台入口标注）")
    print("  2. 封面裁剪：2.35:1 用整张，1:1 用默认居中（render_wechat 已按这个排）")
    print("  3. 手机预览一遍，再点发表")
    print("  记得 git add 公众号版/posted.json 再 push")
    return 0


# ---------- check ----------

def cmd_check():
    conf = load_env()
    ok = True
    if all(conf.get(k) for k in ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"]):
        code, data = x_call(conf, "GET", "/users/me")
        if code == 200:
            print(f"✓ X：@{data['data']['username']}")
        else:
            ok = False
            print("✗ X：" + x_explain(code, data))
    else:
        ok = False
        print(f"- X：{ENV_FILE} 里没填 X_* 四项")
    if conf.get("WECHAT_APPID") and conf.get("WECHAT_SECRET"):
        token = wx_token(conf)
        code, data = http("GET", f"{WX_API}/draft/count?access_token={token}")
        if "total_count" in data:
            print(f"✓ 公众号：草稿箱接口能用，现在有 {data['total_count']} 篇草稿")
        else:
            ok = False
            print("✗ 公众号：" + wx_explain(data))
    else:
        ok = False
        print(f"- 公众号：{ENV_FILE} 里没填 WECHAT_APPID / WECHAT_SECRET")
    return 0 if ok else 1


def main(argv):
    if not argv or argv[0] not in ("x", "wechat", "check"):
        sys.exit(__doc__)
    if argv[0] == "check":
        return cmd_check()
    if len(argv) < 2:
        sys.exit(__doc__)
    root = argv[1].rstrip("/")
    if argv[0] == "x":
        return cmd_x(root, "--dry-run" in argv)
    return cmd_wechat(root, "--again" in argv)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
