/* 你在 AI 第几层 · Krypto说AI 小工具
 * 约束（小红书小工具容器）：不联网、不用内联脚本、语法不超过 ES2017（Chrome 61）。
 * 不用 ?. / ?? / 对象展开 / Array.prototype.flat / CanvasRenderingContext2D.roundRect / flex gap。
 */
(function () {
  "use strict";

  // ---------- 题目：每题 4 个选项，依次 0 / 1 / 2 / 3 分 ----------
  var QUESTIONS = [
    {
      q: "最近一周，你用 AI 的频率是？",
      o: ["几乎没用", "每周几次", "每天都用", "一天里大部分工作都经过它"]
    },
    {
      q: "你上一次把一整件活交给 AI，是什么时候？",
      h: "整件活：从头到尾交给它做完，你只看结果。",
      o: ["从来没有过", "一个月以前", "这周", "今天，而且不止一件"]
    },
    {
      q: "你最常让 AI 做的事是？",
      o: ["问问题，当搜索用", "改写、润色、翻译", "做完一件有交付物的活（报告、表格、代码）", "让它跨好几步自己做完，我只验收"]
    },
    {
      q: "你交给 AI 的最大一件活，自己做原本要多久？",
      o: ["10 分钟以内", "1 小时左右", "一整天", "几天到几周"]
    },
    {
      q: "能自己动手的 agent（Claude Code、Codex、Manus 这类，会自己读写文件、开浏览器），你用过吗？",
      o: ["没听说过", "听过，没用过", "用过几次", "每周都在用"]
    },
    {
      q: "AI 交上来的东西出错了，你一般怎么办？",
      o: ["不用了，觉得 AI 不行", "自己动手改", "告诉它哪里错了，让它重做", "交活时先给检查标准，让它自己验证再交"]
    },
    {
      q: "你给 AI 的指令通常长什么样？",
      o: ["一句话", "几句话，带点要求", "背景、目标、格式、例子都写清楚", "写成能反复用的文档、skill 或配置"]
    },
    {
      q: "有没有让 AI 定时、没人看着也在跑的任务？",
      h: "比如每天早上自动整理行业早报。",
      o: ["没有", "想过，还没弄", "有一个在跑", "好几个，每天自己产出"]
    },
    {
      q: "你会同时让几个 AI 干不同的活吗？",
      o: ["从不", "偶尔开两个窗口", "经常 2 到 3 个", "5 个以上 agent 并行"]
    },
    {
      q: "你对「AI 现在有多强」的判断，主要从哪来？",
      o: ["新闻和别人说的", "偶尔自己试试", "每天用出来的体感", "不断给它更难的活，自己摸它的边界"]
    }
  ];
  var MAX_SCORE = QUESTIONS.length * 3; // 30

  // ---------- 四层：对应 Karpathy 漏斗 ----------
  var LAYERS = [
    {
      n: 1, min: 0, max: 8,
      name: "第 1 层",
      tag: "还没真正用起来",
      crowd: "60 亿人 · 75%",
      desc: "装过也打开过，但 AI 还没进你的一天。Karpathy 说地球上四分之三的人在这一层，不丢人，只是起点。",
      next: "明天挑一件要写的东西，一封邮件或一段周报，先让 AI 写初稿，你只负责改。"
    },
    {
      n: 2, min: 9, max: 17,
      name: "第 2 层",
      tag: "把 AI 当好一点的搜索",
      crowd: "10 到 20 亿人 · 20%",
      desc: "你每天在用，问问题、改改字。Karpathy 说很多高管也在这层：对 AI 的判断是二手的，因为没把一件大活交出去过。",
      next: "别再问它问题。把手上最花时间的那件活整个交出去，背景、目标、交付格式写清楚，三天的活交一次就知道差别。"
    },
    {
      n: 3, min: 18, max: 25,
      name: "第 3 层",
      tag: "0.2%，用 agent 干活",
      crowd: "2000 万人 · 0.2%",
      desc: "你已经把整件活交出去过，亲眼见过几天的活十几分钟做完。这一层的人，正在经历曲线竖直上升的那种眩晕。",
      next: "让它没人看着也能跑：先做一个每天自动产出的定时任务，再给它一条自己检查结果的标准。"
    },
    {
      n: 4, min: 26, max: 30,
      name: "第 4 层门口",
      tag: "做法已经和实验室一样",
      crowd: "5000 人",
      desc: "真正的第 4 层是实验室里用未发布模型的 5000 人，你差的只是一张门禁卡。多 agent 并行、自己验收、长时间无人值守，这些你已经在做。",
      next: "你的瓶颈变成了人的审查速度。给 agent 的产出建一道验收，让你不用逐行看也敢放手。"
    }
  ];

  function layerOf(score) {
    for (var i = 0; i < LAYERS.length; i++) {
      if (score >= LAYERS[i].min && score <= LAYERS[i].max) return LAYERS[i];
    }
    return LAYERS[0];
  }

  // ---------- 平台能力 ----------
  function getMiniTool() {
    return (window.xhs && window.xhs.miniTool) || null;
  }
  function hasApi(name) {
    var mt = getMiniTool();
    return !!mt && typeof mt[name] === "function";
  }
  function readBuildVersion(launchOptions) {
    var env = launchOptions && launchOptions.miniToolEnv;
    return Number(env && env.buildVersion) || 0;
  }
  var buildVersionPromise = null;
  function getBuildVersion() {
    if (buildVersionPromise) return buildVersionPromise;
    buildVersionPromise = (async function () {
      var xhs = window.xhs;
      var v = readBuildVersion(xhs && xhs.launchOptions);
      if (v) return v;
      if (!hasApi("getLaunchOptions")) return 0;
      try {
        return readBuildVersion(await getMiniTool().getLaunchOptions());
      } catch (e) {
        return 0;
      }
    })();
    return buildVersionPromise;
  }
  // 客户端版本 >= min（如 9510 表示 9.51.0）且方法存在
  async function canUse(name, minClient) {
    if (!hasApi(name)) return false;
    var v = await getBuildVersion();
    if (!v) return true; // 拿不到版本号时按方法存在处理，调用失败再兜底
    return Math.floor(v / 1000) >= minClient;
  }

  // ---------- 存储：优先平台 Storage（9.46+），否则 localStorage ----------
  var STORE_KEY = "ai-layer-last";
  async function saveLast(obj) {
    var s;
    try { s = JSON.stringify(obj); } catch (e) { return false; }
    if (await canUse("setStorage", 9460)) {
      try { await getMiniTool().setStorage({ key: STORE_KEY, data: s }); return true; } catch (e) { /* 走降级 */ }
    }
    try { window.localStorage.setItem(STORE_KEY, s); return true; } catch (e) { return false; }
  }
  async function loadLast() {
    var s = null;
    if (await canUse("getStorage", 9460)) {
      try {
        var r = await getMiniTool().getStorage({ key: STORE_KEY });
        s = r && r.data;
      } catch (e) { s = null; }
    }
    if (!s) {
      try { s = window.localStorage.getItem(STORE_KEY); } catch (e) { s = null; }
    }
    if (!s) return null;
    try {
      var o = JSON.parse(s);
      if (o && typeof o.score === "number" && o.score >= 0 && o.score <= MAX_SCORE) return o;
    } catch (e) { /* 数据损坏 */ }
    return null;
  }

  // ---------- 页面 ----------
  function $(id) { return document.getElementById(id); }
  function show(id) {
    var ps = document.querySelectorAll(".page");
    for (var i = 0; i < ps.length; i++) ps[i].className = "page";
    $(id).className = "page on";
    window.scrollTo(0, 0);
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast on";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2200);
  }

  var answers = [];
  var cur = 0;
  var result = null; // { score, layer, dataUrl, filePath }

  function renderQuestion() {
    var item = QUESTIONS[cur];
    $("bar").style.width = Math.round((cur / QUESTIONS.length) * 100) + "%";
    $("qmeta").textContent = "第 " + (cur + 1) + " / " + QUESTIONS.length + " 题";
    $("qtext").textContent = item.q;
    $("qhint").textContent = item.h || "";
    var box = $("opts");
    box.innerHTML = "";
    item.o.forEach(function (label, idx) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt" + (answers[cur] === idx ? " pick" : "");
      b.textContent = label;
      b.addEventListener("click", function () { pick(idx, b); });
      box.appendChild(b);
    });
    $("btnBack").style.visibility = cur === 0 ? "hidden" : "visible";
  }

  var picking = false;
  function pick(idx, el) {
    if (picking) return;
    picking = true;
    answers[cur] = idx;
    el.className = "opt pick";
    vibrate();
    setTimeout(function () {
      picking = false;
      if (cur < QUESTIONS.length - 1) {
        cur++;
        renderQuestion();
      } else {
        finish();
      }
    }, 180);
  }

  async function vibrate() {
    if (!(await canUse("vibrateShort", 9500))) return;
    try { await getMiniTool().vibrateShort({ type: "light" }); } catch (e) { /* 无马达等，忽略 */ }
  }

  function sum(arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i] || 0;
    return s;
  }

  async function finish() {
    var score = sum(answers);
    await showResult(score);
    saveLast({ score: score, t: Date.now() });
  }

  async function showResult(score) {
    var layer = layerOf(score);
    var dataUrl = drawCard(score, layer);
    result = { score: score, layer: layer, dataUrl: dataUrl, filePath: null };
    $("cardImg").src = dataUrl;
    show("pResult");
    refreshFollow();
  }

  // ---------- 结果卡：1080 × 1440 ----------
  var FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 按宽度折行（中文逐字，英文单词不拆）
  function wrap(ctx, text, maxW) {
    var tokens = text.match(/[A-Za-z0-9.%+\-]+|\s+|[^A-Za-z0-9.%+\-\s]/g) || [];
    var lines = [];
    var line = "";
    for (var i = 0; i < tokens.length; i++) {
      var test = line + tokens[i];
      var isPunct = /^[，。、；：！？）」』”]$/.test(tokens[i]);
      if (ctx.measureText(test).width > maxW && line && !isPunct) {
        lines.push(line.replace(/\s+$/, ""));
        line = tokens[i].replace(/^\s+/, "");
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawLines(ctx, lines, x, y, lh) {
    for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lh);
    return y + lines.length * lh;
  }

  function drawCard(score, layer) {
    var cv = $("cv");
    var ctx = cv.getContext("2d");
    var W = 1080, H = 1440, P = 80;

    ctx.fillStyle = "#FAFAF7";
    ctx.fillRect(0, 0, W, H);

    // 顶部
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = "#111111";
    rr(ctx, P, 70, 330, 58, 29);
    ctx.fill();
    ctx.fillStyle = "#FFE600";
    ctx.font = "800 30px " + FONT;
    ctx.fillText("你在 AI 第几层？", P + 28, 110);

    ctx.fillStyle = "#999999";
    ctx.font = "500 28px " + FONT;
    ctx.textAlign = "right";
    ctx.fillText("得分 " + score + " / " + MAX_SCORE, W - P, 110);

    // 层名
    ctx.textAlign = "left";
    ctx.fillStyle = "#111111";
    ctx.font = "900 112px " + FONT;
    ctx.fillText("我在" + layer.name, P, 268);
    // 荧光笔
    ctx.font = "800 46px " + FONT;
    var tagW = ctx.measureText(layer.tag).width;
    ctx.fillStyle = "#FFE600";
    ctx.fillRect(P - 6, 318, tagW + 12, 30);
    ctx.fillStyle = "#111111";
    ctx.fillText(layer.tag, P, 340);

    // 漏斗
    var tiers = [
      { t: "60 亿人", s: "几乎没碰过", w: 920, bg: "#DADADA", fg: "#333333" },
      { t: "10 到 20 亿", s: "免费版，当搜索用", w: 780, bg: "#B5B5B5", fg: "#222222" },
      { t: "2000 万 · 0.2%", s: "用 agent 干活", w: 640, bg: "#FFE600", fg: "#111111" },
      { t: "5000 人", s: "实验室内部", w: 500, bg: "#111111", fg: "#FFFFFF" }
    ];
    var ty = 400, th = 104, gap = 14;
    for (var i = 0; i < tiers.length; i++) {
      var tr = tiers[i];
      var x = (W - tr.w) / 2;
      var y = ty + i * (th + gap);
      var mine = (i + 1) === layer.n;
      ctx.globalAlpha = mine ? 1 : 0.35;
      ctx.fillStyle = tr.bg;
      rr(ctx, x, y, tr.w, th, 18);
      ctx.fill();
      if (mine) {
        ctx.lineWidth = 6;
        ctx.strokeStyle = i === 3 ? "#FFE600" : "#111111";
        rr(ctx, x - 3, y - 3, tr.w + 6, th + 6, 20);
        ctx.stroke();
      }
      ctx.fillStyle = tr.fg;
      ctx.textAlign = "center";
      ctx.font = "800 38px " + FONT;
      ctx.fillText("第 " + (i + 1) + " 层 · " + tr.t, W / 2, y + 50);
      ctx.font = "500 26px " + FONT;
      ctx.fillText(tr.s, W / 2, y + 86);
      ctx.globalAlpha = 1;
    }

    // 解读
    var y0 = ty + 4 * (th + gap) + 50;
    ctx.textAlign = "left";
    ctx.fillStyle = "#111111";
    ctx.font = "500 34px " + FONT;
    var yy = drawLines(ctx, wrap(ctx, layer.desc, W - 2 * P), P, y0, 52);

    // 下一步
    yy += 26;
    ctx.font = "500 32px " + FONT;
    var nextLines = wrap(ctx, layer.next, W - 2 * P - 60);
    var boxH = 90 + nextLines.length * 48;
    ctx.fillStyle = "#FFFFFF";
    rr(ctx, P, yy, W - 2 * P, boxH, 22);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#111111";
    ctx.stroke();
    ctx.fillStyle = "#111111";
    ctx.font = "900 32px " + FONT;
    ctx.fillText(layer.n < 4 ? "往下一层，只做一件事" : "接下来要解决的事", P + 30, yy + 58);
    ctx.font = "500 32px " + FONT;
    drawLines(ctx, nextLines, P + 30, yy + 108, 48);

    // 底部
    ctx.fillStyle = "#999999";
    ctx.font = "500 24px " + FONT;
    ctx.textAlign = "left";
    ctx.fillText("分层与人数：Andrej Karpathy，2026 年 10 月推文中的粗算", P, H - 70);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111111";
    ctx.font = "800 26px " + FONT;
    ctx.fillText("@Krypto说AI", W - P, H - 70);

    return cv.toDataURL("image/png");
  }

  // ---------- 结果卡转本地文件（大 base64 先落临时文件） ----------
  async function getFilePath() {
    if (result.filePath) return result.filePath;
    if (!hasApi("writeTempFile")) return result.dataUrl;
    try {
      var r = await getMiniTool().writeTempFile({ data: result.dataUrl });
      if (r && r.filePath) {
        result.filePath = r.filePath;
        return r.filePath;
      }
    } catch (e) { /* 降级用 base64 */ }
    return result.dataUrl;
  }

  async function onSave() {
    if (!result) return;
    if (!(await canUse("saveImageToPhotosAlbum", 9420))) {
      toast("当前环境不支持存图，请在小红书 App 里打开");
      return;
    }
    try {
      var p = await getFilePath();
      await getMiniTool().saveImageToPhotosAlbum({ filePath: p });
      toast("已存到相册");
    } catch (e) {
      toast("没存成功，可能没给相册权限");
    }
  }

  async function onPost() {
    if (!result) return;
    if (!hasApi("postNote")) {
      toast("当前环境不支持发笔记，请在小红书 App 里打开");
      return;
    }
    var L = result.layer;
    var title = "测了一下，我在AI" + (L.n < 4 ? "第" + L.n + "层" : "第4层门口"); // ≤ 20 字
    var content = "Karpathy 把用 AI 的人分成四层：60 亿人没碰过，10 到 20 亿人当搜索用，2000 万人（0.2%）用 agent 干活，5000 人在实验室内部。\n\n" +
      "我测出来是「" + L.name + "：" + L.tag + "」，" + result.score + " / " + MAX_SCORE + " 分。\n\n" +
      "往下一层要做的事：" + L.next + "\n\n" +
      "你在第几层？\n\n#AI #Karpathy #AI认知 #Claude";
    try {
      var p = await getFilePath();
      await getMiniTool().postNote({
        title: title,
        content: content.slice(0, 1000),
        pageType: "photo_publish",
        mediaInfo: { image_resources: [{ url: p }] }
      });
    } catch (e) {
      toast("没打开发布页，再试一次");
    }
  }

  async function onPk() {
    if (!result) return;
    if (!(await canUse("interactionOpenApi", 9490))) {
      toast("当前版本不支持，升级小红书后再试");
      return;
    }
    var p = await getFilePath();
    if (!p || p.indexOf("data:") === 0) {
      toast("结果图没准备好，先点「存到相册」试试");
      return;
    }
    try {
      var L = result.layer;
      await getMiniTool().interactionOpenApi({
        payload: {
          action: "post_comment",
          content: "我在" + L.name + "（" + result.score + " 分），你呢？",
          media_bean: [{ media_type: "image", cover_image_url: p }],
          miniToolSnapshotInfo: JSON.stringify({ score: result.score })
        },
        saveToAlbum: false
      });
    } catch (e) {
      toast("没打开评论区，再试一次");
    }
  }

  // ---------- 关注作者（9.51+） ----------
  var followPending = false;
  function renderFollow(status, note) {
    var btn = $("btnFollow");
    var st = $("followState");
    if (status === 1) {
      btn.textContent = "已关注";
      btn.disabled = true;
    } else if (status === 2) {
      $("followBox").style.display = "none";
    } else {
      btn.textContent = "关注 Krypto说AI";
      btn.disabled = followPending;
    }
    st.textContent = note || "";
  }
  async function refreshFollow() {
    if (!(await canUse("getFollowStatus", 9510))) {
      renderFollow(0, "");
      return;
    }
    try {
      var r = await getMiniTool().getFollowStatus();
      renderFollow(r && r.follow_status, "");
    } catch (e) {
      renderFollow(0, "");
    }
  }
  async function onFollow() {
    if (followPending) return;
    if (!(await canUse("followAuthor", 9510))) {
      toast("在小红书搜 Krypto说AI 就能找到我");
      return;
    }
    followPending = true;
    renderFollow(0, "");
    var note = "";
    var status = 0;
    try {
      var r = await getMiniTool().followAuthor();
      status = r && r.follow_status;
      if (status === -1) note = "暂时没关注上，稍后再试";
    } catch (e) {
      if (e && e.errCode === 15404) note = "今天的关注提醒次数用完了";
    } finally {
      followPending = false;
      renderFollow(status, note);
    }
  }

  // ---------- 启动 ----------
  function start() {
    answers = [];
    cur = 0;
    renderQuestion();
    show("pQuiz");
  }

  $("btnStart").addEventListener("click", start);
  $("btnAgain").addEventListener("click", start);
  $("btnBack").addEventListener("click", function () {
    if (cur > 0) { cur--; renderQuestion(); }
  });
  $("btnSave").addEventListener("click", onSave);
  $("btnPost").addEventListener("click", onPost);
  $("btnPk").addEventListener("click", onPk);
  $("btnFollow").addEventListener("click", onFollow);

  loadLast().then(function (last) {
    if (!last) return;
    var b = $("btnLast");
    b.style.display = "block";
    b.addEventListener("click", function () { showResult(last.score); });
  });
})();
