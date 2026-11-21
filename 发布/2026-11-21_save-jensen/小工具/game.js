/* 拯救黄仁勋 · 平行宇宙像素小游戏（Krypto说AI，粉丝向，纯属虚构）
 * 容器约束：离线、经典外置脚本、ES2017（Chrome 61）、平台能力按在线文档 2026-11-19 版判断版本。
 * 不用 ?. / ?? / 对象展开 / Array.prototype.at / flat / ctx.roundRect / flex gap。
 */
(function () {
  "use strict";

  // ======================= 平台能力（在线文档 §3.6 写法） =======================
  function readBuildVersion(launchOptions) {
    var env = launchOptions && launchOptions.miniToolEnv;
    var value = env && env.buildVersion;
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (!/^[1-9]\d{6,}$/.test(String(value))) return null;
    var v = Number(value);
    return Number.isSafeInteger(v) ? v : null;
  }
  var bvPromise = null;
  function getBuildVersion() {
    if (bvPromise) return bvPromise;
    bvPromise = (async function () {
      var xhs = window.xhs;
      var sync = readBuildVersion(xhs && xhs.launchOptions);
      if (sync !== null) return sync;
      var mt = xhs && xhs.miniTool;
      if (!mt || typeof mt.getLaunchOptions !== "function") return null;
      try { return readBuildVersion(await mt.getLaunchOptions()); } catch (e) { return null; }
    })();
    return bvPromise;
  }
  function clientAtLeast(bv, min) {
    if (!Number.isSafeInteger(bv) || bv <= 0) return false;
    return Math.floor(bv / 1000) >= min;
  }
  // 版本未知或过低、SDK 或方法缺失，都按不可用处理
  async function getMiniTool(minClient, names) {
    var bv = await getBuildVersion();
    if (!clientAtLeast(bv, minClient)) return null;
    var mt = window.xhs && window.xhs.miniTool;
    if (!mt) return null;
    for (var i = 0; i < names.length; i++) if (typeof mt[names[i]] !== "function") return null;
    return mt;
  }
  function rawMiniTool(name) {
    var mt = window.xhs && window.xhs.miniTool;
    return mt && typeof mt[name] === "function" ? mt : null;
  }

  // 存储：只用容器 Storage（9.46+），失败返回 false，不回退浏览器存储
  var STORE_KEY = "save-jensen-best";
  async function saveBest(obj) {
    var s;
    try { s = JSON.stringify(obj); } catch (e) { return false; }
    var mt = await getMiniTool(9460, ["setStorage"]);
    if (!mt) return false;
    try { var r = await mt.setStorage({ key: STORE_KEY, data: s }); return !!r && r.errMsg === "setStorage:ok"; }
    catch (e) { return false; }
  }
  async function loadBest() {
    var mt = await getMiniTool(9460, ["getStorage"]);
    if (!mt) return null;
    try {
      var r = await mt.getStorage({ key: STORE_KEY });
      if (!r || typeof r.data !== "string") return null;
      var o = JSON.parse(r.data);
      return o && typeof o.score === "number" ? o : null;
    } catch (e) { return null; }
  }
  async function vibrate(type) {
    var mt = await getMiniTool(9500, ["vibrateShort"]);
    if (!mt) return;
    try { await mt.vibrateShort({ type: type }); } catch (e) { /* 无马达等 */ }
  }

  // ======================= DOM =======================
  function $(id) { return document.getElementById(id); }
  var LAYERS = ["menu", "storyLayer", "hud", "failLayer", "result"];
  function show(id) {
    for (var i = 0; i < LAYERS.length; i++) $(LAYERS[i]).className = "layer" + (LAYERS[i] === "result" ? " scroll" : "") + (LAYERS[i] === id ? " on" : "");
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.className = "toast on";
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = "toast"; }, 2200);
  }

  // ======================= 画布 =======================
  var cv = $("game"), ctx = cv.getContext("2d");
  var HX = 42;              // 你在画面里的横坐标（逻辑像素）
  var SW = 390, SH = 844, DPR = 1, LW = 128, LH = 277, SC = 1, GROUND = 320;
  function resize() {
    SW = window.innerWidth || 390; SH = window.innerHeight || 844;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(SW * DPR); cv.height = Math.round(SH * DPR);
    cv.style.width = SW + "px"; cv.style.height = SH + "px";
    SC = SW / LW;
    LH = Math.round(SH / SC);
    GROUND = Math.round(LH * 0.64);
  }
  window.addEventListener("resize", resize);
  resize();
  function px() { ctx.setTransform(SC * DPR, 0, 0, SC * DPR, 0, 0); ctx.imageSmoothingEnabled = false; }
  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }

  // ======================= 像素角色（底部中心 x, 脚底 y） =======================
  var INK = "#1a1a1a", SKIN = "#f2c39b", YEL = "#FFE600";
  function drawHero(c, x, y, f) {           // 你：黄外套 + 黑毛线帽
    x = Math.round(x) - 5; y = Math.round(y) - 16;
    var leg = f % 2;
    R(c, x + 2, y + 0, 6, 1, YEL);           // 帽球
    R(c, x + 1, y + 1, 8, 3, INK);           // 帽子
    R(c, x + 2, y + 4, 6, 3, SKIN);          // 脸
    R(c, x + 6, y + 5, 1, 1, INK);           // 眼
    R(c, x + 1, y + 7, 8, 5, YEL);           // 外套
    R(c, x + 1, y + 7, 8, 1, "#e0c800");
    R(c, x + 0, y + 8, 1, 3, YEL); R(c, x + 9, y + 8, 1, 3, YEL);
    R(c, x + 2, y + 12, 6, 2, "#333");       // 裤
    R(c, x + (leg ? 1 : 3), y + 14, 2, 2, INK);
    R(c, x + (leg ? 6 : 5), y + 14, 2, 2, INK);
  }
  function drawJensen(c, x, y, f, mood) {   // 老黄：灰黑背头 + 黑皮衣
    x = Math.round(x) - 5; y = Math.round(y) - 17;
    var leg = f % 2;
    R(c, x + 2, y + 0, 6, 1, "#555");        // 头发
    R(c, x + 1, y + 1, 8, 2, "#3a3a3a");
    R(c, x + 2, y + 3, 6, 4, SKIN);          // 脸
    R(c, x + 2, y + 3, 6, 1, "#3a3a3a");
    R(c, x + 6, y + 4, 1, 1, INK);
    if (mood === "happy") R(c, x + 4, y + 6, 3, 1, "#a0522d"); else R(c, x + 4, y + 6, 2, 1, "#a0522d");
    R(c, x + 1, y + 8, 8, 6, "#111");        // 皮衣
    R(c, x + 3, y + 8, 4, 4, "#2b2b2b");     // T 恤
    R(c, x + 2, y + 8, 1, 5, "#666");        // 领口高光
    R(c, x + 7, y + 9, 1, 3, "#555");
    R(c, x + 0, y + 9, 1, 4, "#111"); R(c, x + 9, y + 9, 1, 4, "#111");
    R(c, x + 2, y + 14, 6, 1, "#222");
    R(c, x + (leg ? 1 : 3), y + 15, 2, 2, INK);
    R(c, x + (leg ? 6 : 5), y + 15, 2, 2, INK);
  }
  // 拉走老黄的人
  function drawVillain(c, kind, x, y, t) {
    x = Math.round(x); y = Math.round(y);
    if (kind === "snack") {                 // 臭豆腐摊
      R(c, x - 8, y - 12, 16, 12, "#8b4a2b"); R(c, x - 9, y - 15, 18, 3, "#e23b3b");
      R(c, x - 5, y - 18, 10, 3, "#f5e6b8");
      for (var i = 0; i < 3; i++) R(c, x - 4 + i * 4, y - 23 - ((t * 8 + i * 3) % 6), 1, 3, "#7bd36b");
      return;
    }
    var suit = kind === "hunter" ? "#2f3b6b" : (kind === "board" ? "#666" : (kind === "fan" ? "#d94f8a" : "#4b4b4b"));
    R(c, x - 3, y - 17, 6, 3, "#4a3524"); R(c, x - 3, y - 14, 6, 4, SKIN);
    R(c, x - 4, y - 10, 8, 7, suit); R(c, x - 3, y - 3, 2, 3, INK); R(c, x + 1, y - 3, 2, 3, INK);
    if (kind === "hunter") { R(c, x + 4, y - 7, 6, 5, "#6b4a2b"); R(c, x + 6, y - 6, 2, 3, YEL); }        // 公文包
    if (kind === "board") { R(c, x + 4, y - 11, 6, 8, "#fff"); R(c, x + 5, y - 9, 4, 1, "#e23b3b"); }    // 解聘书
    if (kind === "fan") { R(c, x - 2, y - 26, 12, 8, "#fff"); R(c, x - 1, y - 23, 10, 2, "#e23b3b"); R(c, x + 3, y - 18, 1, 8, "#8b6b4b"); }
    if (kind === "paparazzi") { R(c, x + 3, y - 12, 6, 4, INK); if (Math.floor(t * 6) % 2) R(c, x + 9, y - 14, 4, 4, "#fff"); }
  }

  // 障碍物 [宽, 高]
  var OBS = {
    stall: [14, 14], scooter: [16, 9], lantern: [5, 24],
    cone: [7, 9], paparazzi: [9, 18], car: [24, 11],
    docs: [12, 12], guard: [9, 21], box: [14, 14]
  };
  function drawObstacle(c, o, x, y, t) {
    x = Math.round(x); y = Math.round(y);
    var w = o.w, h = o.h;
    switch (o.type) {
      case "stall":
        R(c, x, y - h + 4, w, h - 4, "#8b4a2b"); R(c, x - 1, y - h, w + 2, 4, "#e23b3b"); R(c, x + 2, y - h, 3, 4, "#fff"); R(c, x + 8, y - h, 3, 4, "#fff");
        R(c, x + 3, y - 7, 8, 3, "#f5c06b"); break;
      case "scooter":
        R(c, x + 2, y - h, 10, 5, "#3fa7d6"); R(c, x + 11, y - h - 3, 2, 5, "#999"); R(c, x, y - 4, 4, 4, INK); R(c, x + 12, y - 4, 4, 4, INK); break;
      case "lantern":
        R(c, x + 2, y - h, 1, h, "#8b6b4b"); R(c, x, y - h + 2, 5, 6, "#ff4d3d"); R(c, x + 1, y - h + 3, 3, 4, "#ffb347"); break;
      case "cone":
        R(c, x + 2, y - h, 3, 3, "#ff7a1a"); R(c, x + 1, y - h + 3, 5, 3, "#fff"); R(c, x, y - 3, 7, 3, "#ff7a1a"); break;
      case "car":
        R(c, x + 4, y - h, 14, 4, "#c0392b"); R(c, x, y - h + 4, w, 5, "#e74c3c"); R(c, x + 6, y - h + 1, 4, 3, "#bde0fe");
        R(c, x + 3, y - 3, 4, 3, INK); R(c, x + 17, y - 3, 4, 3, INK); break;
      case "paparazzi":
        drawVillain(c, "paparazzi", x + 4, y, t); break;
      case "docs":
        for (var i = 0; i < 4; i++) R(c, x + (i % 2), y - 3 - i * 3, w - 1, 3, i % 2 ? "#f5f5f5" : "#dcdcdc");
        R(c, x + 2, y - h - 1, 6, 1, "#e23b3b"); break;
      case "guard":
        R(c, x + 1, y - h, 7, 3, INK); R(c, x + 2, y - h + 3, 5, 4, SKIN); R(c, x, y - h + 7, w, 9, "#2c3e50"); R(c, x + 3, y - h + 8, 3, 2, YEL);
        R(c, x + 1, y - 5, 3, 5, INK); R(c, x + 5, y - 5, 3, 5, INK); break;
      case "box":
        R(c, x, y - h, w, h, "#c8955a"); R(c, x, y - h + 6, w, 2, "#a8773f"); R(c, x + 5, y - h, 3, h, "#a8773f"); break;
    }
  }
  function drawLetter(c, x, y, t) {
    y = Math.round(y + Math.sin(t * 5 + x * 0.1) * 1.5); x = Math.round(x);
    R(c, x - 4, y - 3, 9, 7, "#fff"); R(c, x - 4, y - 3, 9, 1, "#d0d0d0");
    R(c, x - 3, y - 2, 1, 1, "#e23b3b"); R(c, x + 3, y - 2, 1, 1, "#e23b3b"); R(c, x - 2, y - 1, 5, 1, "#e23b3b"); R(c, x, y, 1, 1, "#e23b3b");
  }

  // ======================= 关卡 =======================
  var STAGES = [
    {
      key: "夜市", tag: "第一关", name: "台北夜市",
      story: "被解聘的老黄一个人跑去夜市吃卤肉饭散心。穿过人群找到他，拉他上路。",
      sky: ["#1b1d3a", "#3d2b5c"], far: "#2a2448", near: "#3a2f5a", ground: "#3b3b4f", line: "#55557a",
      obs: ["stall", "scooter", "lantern"], speed: 70, length: 2100,
      qte: [{ at: 0.38, who: "snack", text: "臭豆腐的香味把老黄勾走了！", need: 9 },
            { at: 0.74, who: "fan", text: "粉丝围上来要签名！", need: 10 }]
    },
    {
      key: "湾区", tag: "第二关", name: "湾区街头",
      story: "带老黄赶回圣克拉拉。猎头和狗仔一路围堵，沿路捡起员工联名信。",
      sky: ["#f08a4b", "#fbd38d"], far: "#d9774a", near: "#b85c3c", ground: "#6b5a4e", line: "#8a7563",
      obs: ["cone", "paparazzi", "car"], speed: 82, length: 2500,
      qte: [{ at: 0.34, who: "hunter", text: "猎头递来天价 offer！", need: 11 },
            { at: 0.7, who: "paparazzi", text: "狗仔堵住了去路！", need: 11 }]
    },
    {
      key: "总部", tag: "第三关", name: "英伟达总部",
      story: "最后一段。冲过文件堆和保安，带着联名信闯进董事会。联名信越多，翻盘越容易。",
      sky: ["#7cc6ee", "#dff4ff"], far: "#a9d3e8", near: "#7fb0c8", ground: "#5b6470", line: "#7a8491",
      obs: ["docs", "guard", "box"], speed: 94, length: 2800,
      qte: [{ at: 0.45, who: "board", text: "董事拦在门口，递出解聘书！", need: 12 }],
      finale: true
    }
  ];

  // ======================= 状态 =======================
  var state = "boot";      // boot | menu | story | play | qte | fail | ending | result
  var G = null;            // 整局
  var S = null;            // 当前关
  var clock = 0, lastTs = 0, running = true;
  var best = null;

  function newRun() {
    G = { stage: 0, letters: 0, lettersTotal: 0, hearts: 3, time: 0, pulls: 0, qteWin: 0, qteAll: 0 };
  }
  function newStage(i) {
    var cfg = STAGES[i];
    S = {
      cfg: cfg, dist: 0, speed: cfg.speed, objs: [], nextX: 140, hearts: 3,
      py: 0, vy: 0, jumps: 0, onGround: true, inv: 0, hist: [],
      jx: HX - 22, jPull: 0, qteIdx: 0, qte: null, villain: null, frame: 0, ftime: 0,
      lettersAtStart: G.letters, lettersTotalAtStart: G.lettersTotal, finaleDone: false
    };
  }
  function letterTotalFor() { return G.lettersTotal; }

  function spawn() {
    var cfg = S.cfg;
    while (S.nextX < S.dist + LW + 40 && S.nextX < cfg.length - 60) {
      var type = cfg.obs[Math.floor(Math.random() * cfg.obs.length)];
      var d = OBS[type];
      S.objs.push({ kind: "obs", type: type, x: S.nextX, w: d[0], h: d[1] });
      // 信封放在障碍物上方或两个障碍物之间
      if (Math.random() < 0.75) {
        var high = Math.random() < 0.5;
        S.objs.push({ kind: "letter", x: S.nextX + (high ? d[0] / 2 : 40), y: high ? -(d[1] + 14) : -10, got: false });
        G.lettersTotal++;
      }
      S.nextX += 92 + Math.random() * 70 - Math.min(20, cfg.speed - 70);
    }
  }

  function heroBox() { return { x: HX - 4, y: GROUND + S.py - 14, w: 8, h: 14 }; }
  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function jump() {
    if (S.jumps < 2) { S.vy = S.jumps === 0 ? -205 : -175; S.jumps++; S.onGround = false; }
  }

  function startQte(def, finale) {
    var need = def.need;
    if (finale) {
      var ratio = G.lettersTotal ? G.letters / G.lettersTotal : 0;
      need = Math.max(8, Math.round(20 - ratio * 12));
    }
    S.qte = { def: def, need: need, got: 0, t: 0, limit: finale ? 4 : 3.6, finale: !!finale };
    S.villain = { kind: def.who, x: S.jx - 18 };
    state = "qte";
    G.qteAll++;
    $("qteText").textContent = def.text;
    $("qteCount").textContent = "连点屏幕 0 / " + need;
    $("qte").className = "on";
    vibrate("medium");
  }
  function endQte(win) {
    $("qte").className = "";
    var q = S.qte;
    S.qte = null;
    if (win) {
      G.qteWin++;
      S.villain.fly = 1;
      if (!q.finale) { G.letters += 2; G.lettersTotal += 2; }
      toast(q.finale ? "董事会松口了！" : "拉回来了！员工又送来 2 封联名信");
      vibrate("light");
    } else {
      S.villain.fly = 1;
      loseHeart(q.finale ? "董事会没被说服，再冲一次" : "老黄被拉走一阵子，扣一颗心");
    }
    S.jPull = 0;
    // 慢放期间障碍物可能滑到脚下：清掉身边的，再给 1 秒无敌
    S.objs = S.objs.filter(function (o) { var rx = o.x - S.dist; return !(o.kind === "obs" && rx > -30 && rx < 70); });
    if (S.inv < 1) S.inv = 1;
    if (q.finale) {
      if (win) { goEnding(); return; }
      if (state === "fail") return;
      S.finaleDone = false;
      S.dist = S.cfg.length - 120;  // 退后一点再冲
    }
    if (state !== "fail") state = "play";
  }

  function loseHeart(msg) {
    G.hearts--;
    S.inv = 1.2;
    vibrate("heavy");
    if (msg) toast(msg);
    if (G.hearts <= 0) {
      state = "fail";
      $("failTitle").textContent = "老黄又被拉走了";
      $("failText").textContent = "从" + S.cfg.tag + "重新开始，已经拿到的联名信会保留。";
      show("failLayer");
    }
  }

  function update(dt) {
    clock += dt;
    if (state !== "play" && state !== "qte") return;
    G.time += dt;
    var cfg = S.cfg;
    var slow = state === "qte" ? 0.18 : 1;
    S.speed = cfg.speed + (S.dist / cfg.length) * 18;
    S.dist += S.speed * slow * dt;
    S.ftime += dt * slow;
    if (S.ftime > 0.12) { S.ftime = 0; S.frame++; }
    if (S.inv > 0) S.inv -= dt;

    // 跳跃物理
    S.vy += 620 * dt;
    S.py += S.vy * dt;
    if (S.py >= 0) { S.py = 0; S.vy = 0; S.jumps = 0; S.onGround = true; }
    // 老黄走你走过的路（延迟复刻高度）
    S.hist.push(S.py);
    if (S.hist.length > 240) S.hist.shift();

    spawn();

    if (state === "play") {
      var hb = heroBox();
      for (var i = 0; i < S.objs.length; i++) {
        var o = S.objs[i];
        var sx = o.x - S.dist + HX;
        if (o.kind === "obs") {
          if (S.inv <= 0 && hit(hb, { x: sx + 1, y: GROUND - o.h + 1, w: o.w - 2, h: o.h - 1 })) {
            G.lastHit = o.type + "@" + Math.round(S.py);
            loseHeart("撞上了！扣一颗心");
            if (state === "fail") return;
          }
        } else if (!o.got) {
          if (hit(hb, { x: sx - 5, y: GROUND + o.y - 5, w: 11, h: 10 })) { o.got = true; G.letters++; }
        }
      }
      S.objs = S.objs.filter(function (o) { return o.x - S.dist > -80 && !(o.kind === "letter" && o.got); });

      var prog = S.dist / cfg.length;
      if (S.qteIdx < cfg.qte.length && prog >= cfg.qte[S.qteIdx].at) { startQte(cfg.qte[S.qteIdx]); S.qteIdx++; }
      if (prog >= 1) {
        if (cfg.finale && !S.finaleDone) {
          S.finaleDone = true;
          startQte({ who: "board", text: "董事会投票！联名信越多，需要点得越少", need: 12 }, true);
        } else if (!cfg.finale) {
          stageClear();
          return;
        }
      }
    } else if (state === "qte") {
      var q = S.qte;
      q.t += dt;
      S.jPull = Math.min(1, S.jPull + dt * 0.35);
      $("qteBar").style.width = Math.max(0, 100 - (q.t / q.limit) * 100) + "%";
      if (q.got >= q.need) endQte(true);
      else if (q.t >= q.limit) endQte(false);
      if (!S || state === "ending" || state === "fail") return;
    }
    if (S.villain && S.villain.fly) { S.villain.fly += dt * 3; if (S.villain.fly > 3) S.villain = null; }

    updateHud();
  }

  function updateHud() {
    var h = ""; for (var i = 0; i < 3; i++) h += i < G.hearts ? "♥" : "♡";
    $("hudHearts").textContent = h;
    $("hudLetters").textContent = "✉ " + G.letters;
    $("hudBar").style.width = Math.min(100, (S.dist / S.cfg.length) * 100) + "%";
  }

  // ======================= 渲染 =======================
  function drawBg(cfg, dist) {
    var g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, cfg.sky[0]); g.addColorStop(1, cfg.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, LW, GROUND);
    var i, x;
    if (cfg.key === "夜市") {
      for (i = 0; i < 26; i++) R(ctx, (i * 53) % LW, (i * 37) % (GROUND - 120), 1, 1, "#fff");
      var off = -((dist * 0.25) % 60);
      for (x = off; x < LW + 60; x += 60) { R(ctx, x, GROUND - 90, 40, 90, cfg.far); R(ctx, x + 6, GROUND - 80, 4, 4, "#ffd166"); R(ctx, x + 20, GROUND - 64, 4, 4, "#ffd166"); }
      off = -((dist * 0.6) % 36);
      for (x = off; x < LW + 36; x += 36) { R(ctx, x, GROUND - 40, 1, 40, "#222"); R(ctx, x - 2, GROUND - 46, 6, 6, (Math.floor(x) % 2) ? "#ff4d3d" : "#ff8c42"); }
      R(ctx, 0, GROUND - 47, LW, 1, "#552");
    } else if (cfg.key === "湾区") {
      R(ctx, LW - 50, 40, 22, 22, "#ffe8a3");
      var off2 = -((dist * 0.2) % 90);
      for (x = off2; x < LW + 90; x += 90) { ctx.fillStyle = cfg.far; ctx.beginPath(); ctx.moveTo(x, GROUND - 30); ctx.lineTo(x + 45, GROUND - 110); ctx.lineTo(x + 90, GROUND - 30); ctx.fill(); }
      off2 = -((dist * 0.55) % 70);
      for (x = off2; x < LW + 70; x += 70) { R(ctx, x + 10, GROUND - 50, 3, 50, "#5a3d2b"); R(ctx, x + 2, GROUND - 54, 19, 4, "#2f7a3e"); R(ctx, x + 6, GROUND - 58, 11, 4, "#3c9a4f"); }
    } else {
      var off3 = -((dist * 0.2) % 80);
      for (x = off3; x < LW + 80; x += 80) { R(ctx, x, GROUND - 120, 50, 120, cfg.far); for (i = 0; i < 6; i++) R(ctx, x + 6 + (i % 3) * 14, GROUND - 110 + Math.floor(i / 3) * 20, 8, 10, "#e8f6ff"); }
      off3 = -((dist * 0.5) % 50);
      for (x = off3; x < LW + 50; x += 50) R(ctx, x, GROUND - 26, 30, 26, cfg.near);
    }
    // 地面
    R(ctx, 0, GROUND, LW, LH - GROUND, cfg.ground);
    var lo = -(dist % 16);
    for (x = lo; x < LW; x += 16) R(ctx, x, GROUND + 6, 8, 2, cfg.line);
    R(ctx, 0, GROUND, LW, 1, "#000");
  }

  function drawGoal(cfg) {
    // 关卡终点：最后一关是总部大楼
    var gx = cfg.length - S.dist + HX + 30;
    if (gx > LW + 60) return;
    if (cfg.finale) {
      R(ctx, gx, GROUND - 110, 80, 110, "#2d3436"); R(ctx, gx + 4, GROUND - 104, 72, 2, "#76b900");
      for (var i = 0; i < 12; i++) R(ctx, gx + 8 + (i % 4) * 17, GROUND - 92 + Math.floor(i / 4) * 24, 10, 14, "#9fd6ff");
      R(ctx, gx + 30, GROUND - 22, 20, 22, "#111"); R(ctx, gx + 18, GROUND - 120, 44, 10, "#fff");
      R(ctx, gx + 22, GROUND - 117, 36, 4, "#2d3436");
    } else {
      R(ctx, gx, GROUND - 36, 2, 36, "#fff"); R(ctx, gx + 2, GROUND - 36, 14, 9, YEL);
    }
  }

  function render() {
    px();
    if (!S) { // 首页背景
      drawBg(STAGES[0], clock * 30);
      drawJensen(ctx, 70, GROUND, Math.floor(clock * 4), "sad");
      drawVillain(ctx, "board", 104, GROUND, clock);
      drawHero(ctx, 34, GROUND, Math.floor(clock * 8));
      return;
    }
    var cfg = S.cfg;
    drawBg(cfg, S.dist);
    drawGoal(cfg);
    var i, o, sx;
    for (i = 0; i < S.objs.length; i++) {
      o = S.objs[i]; sx = o.x - S.dist + HX;
      if (sx < -40 || sx > LW + 40) continue;
      if (o.kind === "obs") drawObstacle(ctx, o, sx, GROUND, clock);
      else if (!o.got) drawLetter(ctx, sx, GROUND + o.y, clock);
    }
    // 老黄：落后 22 像素，按延迟复刻你的跳跃高度
    var lag = Math.max(1, Math.round((22 / Math.max(S.speed, 1)) * 60));
    var jy = S.hist.length > lag ? S.hist[S.hist.length - 1 - lag] : 0;
    var jx = S.jx - S.jPull * 16;
    if (S.villain) {
      var vx = S.villain.fly ? S.villain.x - (S.villain.fly - 1) * 60 : jx - 16;
      var vy = S.villain.fly ? GROUND - (S.villain.fly - 1) * 40 : GROUND;
      drawVillain(ctx, S.villain.kind, vx, vy, clock);
      if (state === "qte") { R(ctx, vx + 3, GROUND - 9, jx - vx - 6, 1, "#fff"); }
    }
    if (state === "qte") { R(ctx, jx + 4, GROUND - 9, HX - jx - 8, 1, YEL); } // 你拽着他的手
    drawJensen(ctx, jx, GROUND + jy, S.frame, "sad");
    if (!(S.inv > 0 && Math.floor(clock * 12) % 2)) drawHero(ctx, HX, GROUND + S.py, S.onGround ? S.frame : 1);
  }

  // ======================= 结局动画 =======================
  var endT = 0;
  function goEnding() {
    state = "ending"; endT = 0;
    show("none");
    vibrate("medium");
  }
  function drawEndingScene(c, w, h, t) {
    // 在 w × h 的逻辑画布上画：大屏、聚光灯、老黄上台、台下欢呼；返回大屏区域供写字
    var stageY = h - Math.max(20, Math.round(h * 0.3));
    var scrB = stageY - 24;
    R(c, 0, 0, w, h, "#0d0e1f");
    R(c, 6, 5, w - 12, scrB - 5, "#2a2f3a"); R(c, 8, 7, w - 16, scrB - 9, "#0b0b0b");
    R(c, 8, scrB - 4, w - 16, 2, "#76b900");
    c.fillStyle = "rgba(255,240,170,0.16)";
    c.beginPath(); c.moveTo(w / 2 - 5, scrB); c.lineTo(w / 2 + 5, scrB); c.lineTo(w / 2 + 22, stageY); c.lineTo(w / 2 - 22, stageY); c.closePath(); c.fill();
    R(c, 0, stageY, w, 5, "#3b2f2f"); R(c, 0, stageY + 5, w, h - stageY - 5, "#14152b");
    drawJensen(c, w / 2, stageY, Math.floor(t * 3), "happy");
    R(c, w / 2 + 6, stageY - 14, 1, 5, "#ccc");
    var n = Math.max(6, Math.floor(w / 10));
    for (var i = 0; i < n; i++) {
      var bx = 6 + i * ((w - 12) / (n - 1)), by = h - 3 - ((Math.floor(t * 6) + i) % 2) * 2;
      R(c, bx - 3, by - 10, 6, 5, i % 3 === 0 ? YEL : "#ddd"); R(c, bx - 4, by - 5, 8, 5, "#555");
      if ((i + Math.floor(t * 4)) % 4 === 0) R(c, bx - 1, by - 15, 2, 4, "#fff");
    }
    return { cx: w / 2, top: 7, bottom: scrB - 4 };
  }
  function renderEnding(dt) {
    endT += dt;
    px();
    var scr = drawEndingScene(ctx, LW, LH, endT);
    var mid = (scr.top + scr.bottom) / 2;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif";
    ctx.fillText("黄仁勋回来了！", scr.cx, mid - 2);
    ctx.fillStyle = "#FFE600"; ctx.font = "7px sans-serif";
    ctx.fillText("董事会撤回决定，他重新站上舞台", scr.cx, mid + 10);
    if (endT > 3.2) finish();
  }

  // ======================= 结算 =======================
  var result = null;
  function rankTitle(r) {
    if (r < 0.3) return "临时救火员";
    if (r < 0.6) return "员工代表";
    if (r < 0.85) return "董事会克星";
    return "老黄的贴身心腹";
  }
  function fmtTime(s) { var m = Math.floor(s / 60), x = Math.round(s % 60); return m + "分" + (x < 10 ? "0" : "") + x + "秒"; }

  async function finish() {
    state = "result";
    var ratio = G.lettersTotal ? G.letters / G.lettersTotal : 0;
    var score = Math.max(0, Math.round(G.letters * 100 + G.hearts * 300 + G.qteWin * 200 - G.time * 5));
    result = {
      letters: G.letters, total: G.lettersTotal, hearts: G.hearts, time: G.time, score: score,
      title: rankTitle(ratio), qte: G.qteWin + "/" + G.qteAll, dataUrl: null, filePath: null
    };
    result.dataUrl = drawCard(result);
    $("cardImg").src = result.dataUrl;
    show("result");
    $("result").scrollTop = 0;
    if (!best || score > best.score) { best = { score: score, title: result.title }; saveBest(best); }
    refreshFollow();
    submitAndRank(score);
  }

  function rrect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function drawCard(r) {
    var cc = $("cardCanvas"), c = cc.getContext("2d");
    var W = 1080, P = 72, FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "#fffdf2"; c.fillRect(0, 0, W, 1440);
    // 像素场景：180 × 100 放大 6 倍
    c.save(); c.setTransform(9, 0, 0, 9, 0, 0); c.imageSmoothingEnabled = false;
    var scr = drawEndingScene(c, 120, 66, 1.2);
    c.restore();
    c.textAlign = "center"; c.fillStyle = YEL;
    c.font = "900 64px " + FONT;
    c.fillText("欢迎回来，老黄", scr.cx * 9, ((scr.top + scr.bottom) / 2) * 9 + 22);
    c.fillStyle = "#1a1a1a"; c.fillRect(0, 600, W, 10);

    c.textBaseline = "alphabetic"; c.textAlign = "left";
    c.fillStyle = "#1a1a1a"; c.font = "900 40px " + FONT;
    c.fillText("拯救黄仁勋 · 任务完成", P, 690);
    c.font = "900 92px " + FONT;
    c.fillText("我把老黄带回了", P, 800);
    c.fillText("英伟达", P, 905);
    // 称号
    c.font = "900 50px " + FONT;
    var tw = c.measureText(r.title).width;
    c.fillStyle = YEL; rrect(c, P, 945, tw + 56, 84, 8); c.fill();
    c.lineWidth = 6; c.strokeStyle = "#1a1a1a"; c.stroke();
    c.fillStyle = "#1a1a1a"; c.fillText(r.title, P + 28, 1005);

    var stats = [["员工联名信", r.letters + " 封"], ["拉回老黄", r.qte + " 次"], ["用时", fmtTime(r.time)]];
    var bw = (W - P * 2 - 40) / 3;
    for (var i = 0; i < 3; i++) {
      var bx = P + i * (bw + 20), by = 1075;
      c.fillStyle = "#fff"; rrect(c, bx, by, bw, 160, 8); c.fill(); c.lineWidth = 5; c.stroke();
      c.textAlign = "center"; c.fillStyle = "#888"; c.font = "700 30px " + FONT; c.fillText(stats[i][0], bx + bw / 2, by + 58);
      c.fillStyle = "#1a1a1a"; c.font = "900 44px " + FONT; c.fillText(stats[i][1], bx + bw / 2, by + 122);
    }
    c.textAlign = "left"; c.fillStyle = "#999"; c.font = "500 26px " + FONT;
    c.fillText("平行宇宙 · 纯属虚构的粉丝向小游戏", P, 1320);
    c.fillText("与英伟达公司及黄仁勋本人无关", P, 1360);
    c.textAlign = "right"; c.fillStyle = "#1a1a1a"; c.font = "900 32px " + FONT;
    c.fillText("@Krypto说AI", W - P, 1360);
    c.textAlign = "left";
    return cc.toDataURL("image/png");
  }

  async function getFilePath() {
    if (result.filePath) return result.filePath;
    var mt = rawMiniTool("writeTempFile");
    if (!mt) return result.dataUrl;
    try { var r = await mt.writeTempFile({ data: result.dataUrl }); if (r && r.filePath) { result.filePath = r.filePath; return r.filePath; } }
    catch (e) { /* 用 data URI */ }
    return result.dataUrl;
  }
  async function onSave() {
    if (!result) return;
    var mt = rawMiniTool("saveImageToPhotosAlbum");
    if (!mt) { toast("请在小红书 App 里打开再存图"); return; }
    try { await mt.saveImageToPhotosAlbum({ filePath: await getFilePath() }); toast("已存到相册"); }
    catch (e) { toast("没存成功，可能没给相册权限"); }
  }
  async function onPost() {
    if (!result) return;
    var mt = rawMiniTool("postNote");
    if (!mt) { toast("请在小红书 App 里打开再发笔记"); return; }
    var content = "平行宇宙版：黄仁勋被董事会解聘，我带着 " + result.letters + " 封员工联名信把他请回了英伟达，称号「" + result.title + "」。\n\n" +
      "纯属虚构的粉丝向像素小游戏，你能救得更快吗？\n\n#拯救黄仁勋 #黄仁勋 #英伟达 #像素游戏 #小游戏";
    try {
      await mt.postNote({ title: "我把黄仁勋带回了英伟达", content: content, pageType: "photo_publish",
        mediaInfo: { image_resources: [{ url: await getFilePath() }] } });
    } catch (e) { toast("没打开发布页，再试一次"); }
  }
  async function onShare() {
    var mt = await getMiniTool(9530, ["share"]);
    if (!mt) { toast("升级到新版小红书后可以分享给好友"); return; }
    try { await mt.share({ type: "card" }); }
    catch (e) { toast(e && e.errCode === 15503 ? "今天的分享次数用完了" : "没能打开分享面板"); }
  }
  async function onPk() {
    if (!result) return;
    var mt = await getMiniTool(9490, ["interactionOpenApi"]);
    if (!mt) { toast("升级到新版小红书后可以带图去评论区"); return; }
    var p = await getFilePath();
    if (!p || p.indexOf("data:") === 0) { toast("成绩图还没准备好，先点「存到相册」试试"); return; }
    try {
      await mt.interactionOpenApi({
        payload: { action: "post_comment", content: "我带着 " + result.letters + " 封联名信把老黄救回来了（" + result.title + "），你呢？",
          media_bean: [{ media_type: "image", cover_image_url: p }], miniToolSnapshotInfo: JSON.stringify({ s: result.score }) },
        saveToAlbum: false
      });
    } catch (e) { toast("没打开评论区，再试一次"); }
  }

  // 排行榜（9.51+ 内测；未授权隐藏）
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function submitAndRank(score) {
    $("rankBox").style.display = "none";
    var mt = await getMiniTool(9510, ["submitScore", "getRankList"]);
    if (!mt) return;
    try { await mt.submitScore({ board: 1, score: score }); }
    catch (e) { if (e && (e.errCode === 1005 || e.errCode === 10003)) return; }
    var list = null, waits = [500, 1000, 2000, 4000];
    for (var i = 0; i <= waits.length; i++) {
      try { list = await mt.getRankList({ board: 1, period: "week" }); break; }
      catch (e) { if (e && e.errCode === 2002 && i < waits.length) { await sleep(waits[i]); continue; } return; }
    }
    if (!list || !list.data) return;
    var ul = $("rankList"); ul.innerHTML = "";
    var rows = list.data.slice(0, 10);
    if (!rows.length) { var li0 = document.createElement("li"); li0.textContent = "还没人上榜，你来开个头"; ul.appendChild(li0); }
    rows.forEach(function (row) {
      var li = document.createElement("li");
      var n = document.createElement("span"); n.className = "n"; n.textContent = row.rank;
      var nm = document.createElement("span"); nm.textContent = row.nickname || "小红薯";
      var s = document.createElement("span"); s.className = "s"; s.textContent = row.score + " 分";
      li.appendChild(n); li.appendChild(nm); li.appendChild(s); ul.appendChild(li);
    });
    $("rankBox").style.display = "block";
    if (typeof mt.getMyRank === "function") {
      try {
        var my = await mt.getMyRank({ board: 1, period: "week" });
        $("myRank").textContent = my && my.status === "EXACT" ? "你本周第 " + my.rank + " 名" : (my && my.status === "OVER_LIMIT" ? "你本周在 500 名以外" : "");
      } catch (e) { /* 忽略 */ }
    }
  }

  // 关注（9.51+）
  var followPending = false;
  function renderFollow(status, note) {
    var b = $("btnFollow");
    if (status === 1) { b.textContent = "已关注"; b.disabled = true; }
    else if (status === 2) { $("followBox").style.display = "none"; }
    else { b.textContent = "关注 Krypto说AI"; b.disabled = followPending; }
    $("followState").textContent = note || "";
  }
  async function refreshFollow() {
    var mt = await getMiniTool(9510, ["getFollowStatus"]);
    if (!mt) { renderFollow(0, ""); return; }
    try { var r = await mt.getFollowStatus(); renderFollow(r && r.follow_status, ""); } catch (e) { renderFollow(0, ""); }
  }
  async function onFollow() {
    if (followPending) return;
    var mt = await getMiniTool(9510, ["followAuthor"]);
    if (!mt) { toast("在小红书搜 Krypto说AI 就能找到我"); return; }
    followPending = true; renderFollow(0, "");
    var status = 0, note = "";
    try { var r = await mt.followAuthor(); status = r && r.follow_status; if (status === -1) note = "暂时没关注上，稍后再试"; }
    catch (e) { if (e && e.errCode === 15404) note = "今天的关注提醒次数用完了"; }
    finally { followPending = false; renderFollow(status, note); }
  }

  // ======================= 流程 =======================
  function openStory(i) {
    var cfg = STAGES[i];
    state = "story";
    S = null;
    $("storyTag").textContent = cfg.tag;
    $("storyTitle").textContent = cfg.name;
    $("storyText").textContent = cfg.story;
    $("storyHow").style.display = i === 0 ? "block" : "none";
    show("storyLayer");
  }
  function startStage() {
    newStage(G.stage);
    G.hearts = 3;
    state = "play";
    $("hudStage").textContent = S.cfg.tag + " · " + S.cfg.name;
    $("tip").style.display = G.stage === 0 ? "block" : "none";
    $("qte").className = "";
    updateHud();
    show("hud");
  }
  function stageClear() {
    G.stage++;
    vibrate("light");
    openStory(G.stage);
  }
  function retryStage() {
    G.hearts = 3;
    G.letters = S ? S.lettersAtStart : G.letters;
    G.lettersTotal = S ? S.lettersTotalAtStart : G.lettersTotal;
    startStage();
  }

  // 输入：触摸和鼠标都处理，触摸后忽略模拟出来的鼠标事件
  var lastTouch = 0;
  function onTap(e) {
    if (state !== "play" && state !== "qte") return;
    if (e.type === "touchstart") { lastTouch = Date.now(); if (e.cancelable) e.preventDefault(); }
    else if (Date.now() - lastTouch < 600) return;
    if (state === "qte" && S.qte) {
      S.qte.got++;
      $("qteCount").textContent = "连点屏幕 " + Math.min(S.qte.got, S.qte.need) + " / " + S.qte.need;
      G.pulls++;
      S.jPull = Math.max(0, S.jPull - 0.12);
    } else {
      jump();
      if (G.stage === 0) $("tip").style.display = "none";
    }
  }
  cv.addEventListener("touchstart", onTap, { passive: false });
  cv.addEventListener("mousedown", onTap);
  window.addEventListener("keydown", function (e) { if (e.keyCode === 32 || e.keyCode === 38) onTap({ type: "key" }); });

  $("btnStart").addEventListener("click", function () { newRun(); openStory(0); });
  $("btnGo").addEventListener("click", startStage);
  $("btnRetry").addEventListener("click", retryStage);
  $("btnHome").addEventListener("click", function () { S = null; state = "menu"; show("menu"); });
  $("btnAgain").addEventListener("click", function () { newRun(); openStory(0); });
  $("btnSave").addEventListener("click", onSave);
  $("btnPost").addEventListener("click", onPost);
  $("btnShare").addEventListener("click", onShare);
  $("btnPk").addEventListener("click", onPk);
  $("btnFollow").addEventListener("click", onFollow);

  // 主循环；页面隐藏时停下，回来重置时间差
  function loop(ts) {
    if (!running) return;
    var t = ts / 1000;
    var dt = lastTs ? Math.min(0.05, t - lastTs) : 1 / 60;
    lastTs = t;
    try {
      if (state === "ending") renderEnding(dt);
      else if (state !== "result") { update(dt); render(); }
    } catch (err) {
      // 单帧出错不让主循环停下
      if (window.console) console.warn("frame error", err && err.message);
    }
    requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; lastTs = 0; requestAnimationFrame(loop); }
  });

  // 就绪：首屏已在 HTML 里，这里画出首个场景后开放按钮
  try {
    state = "menu";
    render();
    requestAnimationFrame(loop);
    $("bootStatus").textContent = best ? "" : "点屏幕跳跃，三关把老黄带回英伟达。";
    $("btnStart").disabled = false;
    loadBest().then(function (b) { best = b; if (b) $("bootStatus").textContent = "你的纪录：" + b.score + " 分 · " + b.title; });
  } catch (err) {
    $("bootStatus").textContent = "第一关没准备好，请退出后重新打开。";
  }

  // 仅供浏览器预览自测，容器里不调用
  window.__sj = { state: function () { return state; }, G: function () { return G; }, S: function () { return S; } };
})();
