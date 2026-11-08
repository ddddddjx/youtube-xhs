/* 冲下阿勒泰 · Krypto说AI 原创小游戏
 * 小红书小工具容器约束：不联网、脚本外置、语法不超过 ES2017（Chrome 61）。
 * 不用 ?. / ?? / 对象展开 / Array.prototype.flat / ctx.roundRect / flex gap。
 */
(function () {
  "use strict";

  // ======================= 平台能力 =======================
  function getMiniTool() { return (window.xhs && window.xhs.miniTool) || null; }
  function hasApi(name) { var mt = getMiniTool(); return !!mt && typeof mt[name] === "function"; }
  function readBuildVersion(lo) {
    var env = lo && lo.miniToolEnv;
    return Number(env && env.buildVersion) || 0;
  }
  var bvPromise = null;
  function getBuildVersion() {
    if (bvPromise) return bvPromise;
    bvPromise = (async function () {
      var xhs = window.xhs;
      var v = readBuildVersion(xhs && xhs.launchOptions);
      if (v) return v;
      if (!hasApi("getLaunchOptions")) return 0;
      try { return readBuildVersion(await getMiniTool().getLaunchOptions()); } catch (e) { return 0; }
    })();
    return bvPromise;
  }
  async function canUse(name, minClient) {
    if (!hasApi(name)) return false;
    var v = await getBuildVersion();
    if (!v) return true;
    return Math.floor(v / 1000) >= minClient;
  }

  // ---------- 存储：平台 Storage（9.46+），否则 localStorage ----------
  var STORE_KEY = "altay-ski-best";
  async function saveBest(obj) {
    var s;
    try { s = JSON.stringify(obj); } catch (e) { return false; }
    if (await canUse("setStorage", 9460)) {
      try { await getMiniTool().setStorage({ key: STORE_KEY, data: s }); return true; } catch (e) { /* 降级 */ }
    }
    try { window.localStorage.setItem(STORE_KEY, s); return true; } catch (e) { return false; }
  }
  async function loadBest() {
    var s = null;
    if (await canUse("getStorage", 9460)) {
      try { var r = await getMiniTool().getStorage({ key: STORE_KEY }); s = r && r.data; } catch (e) { s = null; }
    }
    if (!s) { try { s = window.localStorage.getItem(STORE_KEY); } catch (e) { s = null; } }
    if (!s) return null;
    try {
      var o = JSON.parse(s);
      if (o && typeof o.dist === "number" && o.dist >= 0) return o;
    } catch (e) { /* 损坏 */ }
    return null;
  }

  async function vibrate(type) {
    if (!(await canUse("vibrateShort", 9500))) return;
    try { await getMiniTool().vibrateShort({ type: type || "light" }); } catch (e) { /* 忽略 */ }
  }

  // ======================= 页面 =======================
  function $(id) { return document.getElementById(id); }
  function showLayer(id) {
    var ls = ["menu", "hud", "result"];
    for (var i = 0; i < ls.length; i++) $(ls[i]).className = "layer" + (ls[i] === id ? " on" : "");
  }
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast on";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2200);
  }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  // 顶部避让：容器返回安全区和右上角按钮时用它
  (async function () {
    if (!(await canUse("getWindowInfo", 9490))) return;
    try {
      var info = await getMiniTool().getWindowInfo();
      var top = (info && info.safeArea && info.safeArea.top) || 0;
      var mb = info && info.menuButtons;
      var btnB = 0;
      if (mb) {
        ["back", "me", "share"].forEach(function (k) { if (mb[k] && mb[k].bottom > btnB) btnB = mb[k].bottom; });
      }
      var v = Math.max(top + 8, btnB + 8, 20);
      document.documentElement.style.setProperty("--top", v + "px");
    } catch (e) { /* 用默认值 */ }
  })();

  // ======================= 画布 =======================
  var cv = $("game");
  var ctx = cv.getContext("2d");
  var W = 390, H = 844, DPR = 1;
  function resize() {
    W = window.innerWidth || 390;
    H = window.innerHeight || 844;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ======================= 颜色 =======================
  var C = {
    snow: "#F6FAFC", snowShade: "#E3EEF3", track: "#C9D9E1",
    skyTop: "#9FD6DC", skyBot: "#E6F5F6",
    mtn1: "#7FA8B6", mtn2: "#A9C8D2", mtn3: "#C9DEE4",
    pine: "#2E5E4E", pineDark: "#234A3D", trunk: "#6B4A35",
    rock: "#8D9AA4", rockDark: "#6F7C86",
    wood: "#9A6A45", woodDark: "#7A5034", roofSnow: "#FFFFFF", window: "#FFD86B",
    ink: "#1A1A1A", yellow: "#FFE600", red: "#E8574B"
  };

  // ======================= 绘图小件 =======================
  function ellipse(c, x, y, rx, ry, fill) {
    c.beginPath();
    c.save(); c.translate(x, y); c.scale(1, ry / rx); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore();
    c.fillStyle = fill; c.fill();
  }
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  // 云杉：底部中心 (x, y)，s 为尺度
  function drawPine(c, x, y, s) {
    ellipse(c, x + s * 0.15, y + s * 0.05, s * 0.55, s * 0.18, "rgba(90,130,150,0.18)");
    c.fillStyle = C.trunk;
    c.fillRect(x - s * 0.07, y - s * 0.25, s * 0.14, s * 0.27);
    var tiers = [[0.62, 0.25, 0.75], [0.5, 0.6, 0.62], [0.36, 0.92, 0.5]];
    for (var i = 0; i < tiers.length; i++) {
      var hw = s * tiers[i][0], by = y - s * tiers[i][1], th = s * tiers[i][2];
      c.beginPath(); c.moveTo(x - hw, by); c.lineTo(x + hw, by); c.lineTo(x, by - th); c.closePath();
      c.fillStyle = i === 0 ? C.pineDark : C.pine; c.fill();
      // 积雪
      c.beginPath();
      c.moveTo(x - hw * 0.55, by - th * 0.45); c.lineTo(x, by - th); c.lineTo(x + hw * 0.55, by - th * 0.45);
      c.quadraticCurveTo(x + hw * 0.2, by - th * 0.35, x, by - th * 0.5);
      c.quadraticCurveTo(x - hw * 0.2, by - th * 0.35, x - hw * 0.55, by - th * 0.45);
      c.closePath(); c.fillStyle = "#FFFFFF"; c.fill();
    }
  }
  function drawRock(c, x, y, s) {
    ellipse(c, x + s * 0.1, y + s * 0.05, s * 0.6, s * 0.2, "rgba(90,130,150,0.18)");
    c.beginPath();
    c.moveTo(x - s * 0.55, y); c.lineTo(x - s * 0.42, y - s * 0.35); c.lineTo(x - s * 0.1, y - s * 0.5);
    c.lineTo(x + s * 0.3, y - s * 0.42); c.lineTo(x + s * 0.55, y - s * 0.1); c.lineTo(x + s * 0.5, y);
    c.closePath(); c.fillStyle = C.rock; c.fill();
    c.beginPath();
    c.moveTo(x + s * 0.05, y - s * 0.46); c.lineTo(x + s * 0.3, y - s * 0.42); c.lineTo(x + s * 0.55, y - s * 0.1);
    c.lineTo(x + s * 0.5, y); c.lineTo(x + s * 0.15, y); c.closePath(); c.fillStyle = C.rockDark; c.fill();
    c.beginPath();
    c.moveTo(x - s * 0.42, y - s * 0.35); c.lineTo(x - s * 0.1, y - s * 0.5); c.lineTo(x + s * 0.3, y - s * 0.42);
    c.quadraticCurveTo(x, y - s * 0.32, x - s * 0.42, y - s * 0.35); c.closePath(); c.fillStyle = "#FFFFFF"; c.fill();
  }
  // 禾木风格木屋
  function drawCabin(c, x, y, s) {
    ellipse(c, x + s * 0.1, y + s * 0.04, s * 0.8, s * 0.2, "rgba(90,130,150,0.18)");
    var w = s * 1.3, h = s * 0.6;
    c.fillStyle = C.wood; c.fillRect(x - w / 2, y - h, w, h);
    c.strokeStyle = C.woodDark; c.lineWidth = Math.max(1, s * 0.03);
    for (var i = 1; i < 5; i++) { var ly = y - h + (h / 5) * i; c.beginPath(); c.moveTo(x - w / 2, ly); c.lineTo(x + w / 2, ly); c.stroke(); }
    c.fillStyle = C.window; c.fillRect(x - s * 0.15, y - h * 0.7, s * 0.3, s * 0.24);
    c.strokeStyle = C.woodDark; c.lineWidth = Math.max(1, s * 0.04); c.strokeRect(x - s * 0.15, y - h * 0.7, s * 0.3, s * 0.24);
    // 雪屋顶
    c.beginPath();
    c.moveTo(x - w * 0.62, y - h + s * 0.04); c.lineTo(x, y - h - s * 0.55); c.lineTo(x + w * 0.62, y - h + s * 0.04);
    c.quadraticCurveTo(x, y - h - s * 0.08, x - w * 0.62, y - h + s * 0.04);
    c.closePath(); c.fillStyle = C.roofSnow; c.fill();
    c.strokeStyle = "#D5E3EA"; c.lineWidth = Math.max(1, s * 0.03); c.stroke();
  }
  function drawFlake(c, x, y, s, t) {
    var bob = Math.sin(t * 4 + x) * s * 0.12;
    c.save(); c.translate(x, y - s * 0.6 + bob); c.rotate(t * 1.2);
    c.beginPath(); c.arc(0, 0, s * 0.62, 0, Math.PI * 2); c.fillStyle = "rgba(150,210,235,0.35)"; c.fill();
    c.strokeStyle = "#5BB7DA"; c.lineWidth = Math.max(1.5, s * 0.1); c.lineCap = "round";
    for (var i = 0; i < 6; i++) {
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.45);
      c.moveTo(0, -s * 0.28); c.lineTo(s * 0.1, -s * 0.38);
      c.moveTo(0, -s * 0.28); c.lineTo(-s * 0.1, -s * 0.38);
      c.stroke(); c.rotate(Math.PI / 3);
    }
    c.restore();
  }
  // 滑雪者：中心 (x, y)，lean -1..1
  function drawSkier(c, x, y, s, lean, tumble) {
    c.save();
    c.translate(x, y);
    if (tumble) c.rotate(tumble);
    ellipse(c, s * 0.12, s * 0.42, s * 0.42, s * 0.12, "rgba(90,130,150,0.25)");
    c.rotate(lean * 0.35);
    // 雪板
    c.strokeStyle = C.ink; c.lineWidth = s * 0.1; c.lineCap = "round";
    c.beginPath(); c.moveTo(-s * 0.18, -s * 0.15); c.lineTo(-s * 0.18, s * 0.55); c.stroke();
    c.beginPath(); c.moveTo(s * 0.18, -s * 0.15); c.lineTo(s * 0.18, s * 0.55); c.stroke();
    // 雪杖
    c.strokeStyle = "#555"; c.lineWidth = s * 0.04;
    c.beginPath(); c.moveTo(-s * 0.38, -s * 0.05); c.lineTo(-s * 0.5, s * 0.45); c.stroke();
    c.beginPath(); c.moveTo(s * 0.38, -s * 0.05); c.lineTo(s * 0.5, s * 0.45); c.stroke();
    // 身体（黄外套）
    c.beginPath(); c.moveTo(-s * 0.3, s * 0.2); c.quadraticCurveTo(-s * 0.36, -s * 0.2, 0, -s * 0.25);
    c.quadraticCurveTo(s * 0.36, -s * 0.2, s * 0.3, s * 0.2); c.closePath();
    c.fillStyle = C.yellow; c.fill(); c.strokeStyle = C.ink; c.lineWidth = s * 0.06; c.stroke();
    // 头 + 毛线帽
    c.beginPath(); c.arc(0, -s * 0.38, s * 0.17, 0, Math.PI * 2); c.fillStyle = "#F3C9A5"; c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -s * 0.42, s * 0.17, Math.PI, 0); c.closePath(); c.fillStyle = C.ink; c.fill();
    c.beginPath(); c.arc(0, -s * 0.62, s * 0.07, 0, Math.PI * 2); c.fillStyle = C.yellow; c.fill(); c.stroke();
    c.restore();
  }

  // 远山 + 树 + 木屋：首页背景和成绩卡顶部共用
  function drawScene(c, x0, y0, w, h, t) {
    var g = c.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, C.skyTop); g.addColorStop(1, C.skyBot);
    c.fillStyle = g; c.fillRect(x0, y0, w, h);
    // 太阳
    c.beginPath(); c.arc(x0 + w * 0.78, y0 + h * 0.2, w * 0.06, 0, Math.PI * 2); c.fillStyle = "rgba(255,250,220,0.9)"; c.fill();
    function range(base, amp, seed, color, snowcap) {
      c.beginPath(); c.moveTo(x0, y0 + h);
      var pts = [];
      for (var i = 0; i <= 8; i++) {
        var px = x0 + (w / 8) * i;
        var py = y0 + h * base - Math.abs(Math.sin(i * 1.7 + seed)) * h * amp;
        pts.push([px, py]); c.lineTo(px, py);
      }
      c.lineTo(x0 + w, y0 + h); c.closePath(); c.fillStyle = color; c.fill();
      if (snowcap) {
        for (var j = 1; j < pts.length - 1; j++) {
          var p = pts[j];
          if (p[1] < pts[j - 1][1] && p[1] < pts[j + 1][1]) {
            c.beginPath();
            c.moveTo(p[0] - w * 0.045, p[1] + h * 0.07); c.lineTo(p[0], p[1]); c.lineTo(p[0] + w * 0.045, p[1] + h * 0.07);
            c.lineTo(p[0] + w * 0.015, p[1] + h * 0.05); c.lineTo(p[0] - w * 0.01, p[1] + h * 0.075); c.closePath();
            c.fillStyle = "#FFFFFF"; c.fill();
          }
        }
      }
    }
    range(0.55, 0.32, 0.3, C.mtn1, true);
    range(0.68, 0.22, 2.1, C.mtn2, true);
    range(0.8, 0.12, 4.0, C.mtn3, false);
    // 雪地
    c.fillStyle = C.snow; c.fillRect(x0, y0 + h * 0.8, w, h * 0.2);
    c.beginPath(); c.moveTo(x0, y0 + h * 0.82);
    c.quadraticCurveTo(x0 + w * 0.5, y0 + h * 0.74, x0 + w, y0 + h * 0.82); c.lineTo(x0 + w, y0 + h); c.lineTo(x0, y0 + h); c.closePath();
    c.fillStyle = C.snow; c.fill();
    // 树和木屋
    var s = w * 0.06;
    drawPine(c, x0 + w * 0.08, y0 + h * 0.86, s * 1.1);
    drawPine(c, x0 + w * 0.17, y0 + h * 0.83, s * 0.8);
    drawCabin(c, x0 + w * 0.32, y0 + h * 0.87, s * 1.05);
    drawPine(c, x0 + w * 0.7, y0 + h * 0.84, s * 0.85);
    drawCabin(c, x0 + w * 0.82, y0 + h * 0.88, s * 0.9);
    drawPine(c, x0 + w * 0.94, y0 + h * 0.86, s * 1.15);
    // 炊烟
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = Math.max(2, w * 0.006); c.lineCap = "round";
    c.beginPath();
    var sx = x0 + w * 0.34, sy = y0 + h * 0.79;
    c.moveTo(sx, sy);
    for (var k = 1; k <= 6; k++) c.lineTo(sx + Math.sin(t * 1.5 + k) * w * 0.012, sy - k * h * 0.025);
    c.stroke();
  }

  // ======================= 飘雪粒子 =======================
  var flakes = [];
  function initSnow() {
    flakes = [];
    for (var i = 0; i < 70; i++) flakes.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2.2, v: 0.2 + Math.random() * 0.6, p: Math.random() * 6 });
  }
  initSnow();
  function drawSnowfall(dt, rise) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += (f.v * 0.08 - rise) * dt;
      f.x += Math.sin(f.p + f.y * 6) * 0.0006;
      if (f.y > 1.02) f.y = -0.02;
      if (f.y < -0.02) f.y = 1.02;
      if (f.x > 1) f.x -= 1;
      if (f.x < 0) f.x += 1;
      ctx.beginPath(); ctx.arc(f.x * W, f.y * H, f.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ======================= 游戏状态 =======================
  var state = "menu"; // menu | play | crash | result
  var G = null;
  var best = null;
  var lastT = 0, clock = 0;

  function newGame() {
    G = {
      scroll: 0,          // 已下滑的世界像素
      speed: W * 0.7,     // 像素 / 秒
      maxSpeed: W * 0.7,
      px: W / 2, tx: W / 2, vx: 0,
      py: H * 0.3,
      objs: [],
      nextY: H * 0.9,
      safeX: W / 2,
      flakes: 0,
      trail: [],
      tumble: 0, crashT: 0,
      bursts: [],
      started: 0
    };
  }
  var PX_PER_M = function () { return W / 15; };

  function spawnRow(wy, diff) {
    // 安全通道左右游走，保证总有路
    G.safeX += (Math.random() - 0.5) * W * 0.35;
    G.safeX = Math.max(W * 0.2, Math.min(W * 0.8, G.safeX));
    var clear = W * (0.17 - diff * 0.04);
    var n = 1 + Math.floor(Math.random() * (1.6 + diff * 2.2));
    var placed = [];
    for (var i = 0; i < n; i++) {
      var tries = 0, x;
      do {
        x = W * 0.06 + Math.random() * W * 0.88;
        tries++;
      } while (tries < 12 && (Math.abs(x - G.safeX) < clear || placed.some(function (p) { return Math.abs(p - x) < W * 0.16; })));
      if (tries >= 12) continue;
      placed.push(x);
      var r = Math.random();
      var type = r < 0.62 ? "pine" : (r < 0.88 ? "rock" : "cabin");
      var s = type === "pine" ? W * (0.085 + Math.random() * 0.04) : (type === "rock" ? W * (0.07 + Math.random() * 0.03) : W * 0.085);
      var hit = type === "pine" ? s * 0.32 : (type === "rock" ? s * 0.42 : s * 0.62);
      G.objs.push({ type: type, x: x, y: wy + (Math.random() - 0.5) * W * 0.08, s: s, r: hit });
    }
    if (Math.random() < 0.55) {
      G.objs.push({ type: "flake", x: G.safeX + (Math.random() - 0.5) * clear, y: wy + W * 0.15, s: W * 0.06, r: W * 0.06, got: false });
    }
  }

  function difficulty() {
    var m = G.scroll / PX_PER_M();
    return Math.min(1, m / 2500);
  }

  function update(dt) {
    clock += dt;
    if (state === "play") {
      G.started += dt;
      var diff = difficulty();
      G.speed = Math.min(W * 2.1, G.speed + W * (0.022 + diff * 0.02) * dt);
      if (G.speed > G.maxSpeed) G.maxSpeed = G.speed;
      G.scroll += G.speed * dt;

      // 转向：平滑追手指
      var k = Math.min(1, dt * 9);
      var nx = G.px + (G.tx - G.px) * k;
      G.vx = (nx - G.px) / Math.max(dt, 0.001);
      G.px = Math.max(W * 0.07, Math.min(W * 0.93, nx));

      // 生成
      var gap = W * (0.62 - diff * 0.3);
      while (G.nextY < G.scroll + H + W * 0.4) { spawnRow(G.nextY, diff); G.nextY += gap * (0.8 + Math.random() * 0.4); }

      // 雪痕
      G.trail.push({ x: G.px, y: G.scroll + G.py });
      if (G.trail.length > 90) G.trail.shift();

      // 碰撞
      var pyW = G.scroll + G.py;
      var pr = W * 0.035;
      for (var i = 0; i < G.objs.length; i++) {
        var o = G.objs[i];
        var dy = (o.y - (o.type === "flake" ? o.s * 0.6 : o.s * 0.15)) - pyW;
        var dx = o.x - G.px;
        if (Math.abs(dy) > W * 0.2) continue;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (o.type === "flake") {
          if (!o.got && d < o.r + pr * 1.4) {
            o.got = true; G.flakes++; vibrate("light");
            burst(o.x, o.y - o.s * 0.6, "#8FD3EC", 10);
          }
        } else if (d < o.r + pr) {
          crash(o);
          break;
        }
      }
      // 回收
      G.objs = G.objs.filter(function (o) { return o.y - G.scroll > -W * 0.4 && !(o.type === "flake" && o.got); });

      $("hudDist").textContent = fmt(G.scroll / PX_PER_M()) + " 米";
      $("hudFlake").textContent = "❄ " + G.flakes;
      if (G.started > 2.5) $("tip").style.opacity = "0";
    } else if (state === "crash") {
      G.crashT += dt;
      G.speed *= Math.pow(0.05, dt);
      G.scroll += G.speed * dt;
      G.tumble += dt * 9 * (1 - Math.min(1, G.crashT / 0.9));
      if (G.crashT > 1.1) { state = "result"; finish(); }
    }
    if (G) {
      for (var b = 0; b < G.bursts.length; b++) {
        var p = G.bursts[b];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += W * 0.8 * dt;
      }
      G.bursts = G.bursts.filter(function (p) { return p.t < p.life; });
    }
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = W * (0.2 + Math.random() * 0.5);
      G.bursts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - W * 0.3, t: 0, life: 0.5 + Math.random() * 0.4, color: color, r: 1.5 + Math.random() * 3 });
    }
  }

  function crash(o) {
    state = "crash";
    G.crashT = 0;
    burst(G.px, G.scroll + G.py, "#FFFFFF", 26);
    vibrate("heavy");
  }

  // ======================= 渲染 =======================
  function drawObj(o, sy) {
    if (o.type === "pine") drawPine(ctx, o.x, sy, o.s);
    else if (o.type === "rock") drawRock(ctx, o.x, sy, o.s);
    else if (o.type === "cabin") drawCabin(ctx, o.x, sy, o.s);
    else if (o.type === "flake" && !o.got) drawFlake(ctx, o.x, sy, o.s, clock);
  }

  function render() {
    if (state === "menu") {
      drawScene(ctx, 0, 0, W, H * 0.62, clock);
      ctx.fillStyle = C.snow; ctx.fillRect(0, H * 0.62 - 1, W, H * 0.38 + 1);
      drawSkier(ctx, W * 0.5, H * 0.58, W * 0.12, Math.sin(clock * 1.6) * 0.5, 0);
      drawSnowfall(1 / 60, 0);
      return;
    }
    // 雪道
    ctx.fillStyle = C.snow; ctx.fillRect(0, 0, W, H);
    // 雪面起伏的阴影带，跟着滚动
    var band = W * 0.9;
    var off = -(G.scroll % band);
    for (var y = off; y < H + band; y += band) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.quadraticCurveTo(W * 0.5, y + band * 0.25, W, y);
      ctx.lineTo(W, y + band * 0.18); ctx.quadraticCurveTo(W * 0.5, y + band * 0.43, 0, y + band * 0.18); ctx.closePath();
      ctx.fillStyle = C.snowShade; ctx.fill();
    }
    // 两侧树林边
    ctx.fillStyle = "rgba(46,94,78,0.12)";
    ctx.fillRect(0, 0, W * 0.03, H); ctx.fillRect(W * 0.97, 0, W * 0.03, H);

    // 雪痕
    if (G.trail.length > 1) {
      ctx.strokeStyle = C.track; ctx.lineWidth = Math.max(1.5, W * 0.006); ctx.lineCap = "round";
      for (var side = -1; side <= 1; side += 2) {
        ctx.beginPath();
        for (var i = 0; i < G.trail.length; i++) {
          var tp = G.trail[i];
          var sx = tp.x + side * W * 0.018, sy = tp.y - G.scroll + W * 0.02;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
    }

    // 物件按纵向排序，玩家插在中间
    var objs = G.objs.slice().sort(function (a, b) { return a.y - b.y; });
    var pyW = G.scroll + G.py;
    var drewPlayer = false;
    var lean = Math.max(-1, Math.min(1, G.vx / (W * 1.5)));
    for (var j = 0; j < objs.length; j++) {
      var o = objs[j];
      if (!drewPlayer && o.y > pyW + W * 0.03) {
        drawSkier(ctx, G.px, G.py, W * 0.09, lean, G.tumble); drewPlayer = true;
      }
      var syo = o.y - G.scroll;
      if (syo > -W * 0.3 && syo < H + W * 0.4) drawObj(o, syo);
    }
    if (!drewPlayer) drawSkier(ctx, G.px, G.py, W * 0.09, lean, G.tumble);

    // 粒子
    for (var b = 0; b < G.bursts.length; b++) {
      var p = G.bursts[b];
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.beginPath(); ctx.arc(p.x, p.y - G.scroll, p.r, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 速度线
    if (state === "play" && G.speed > W * 1.3) {
      ctx.strokeStyle = "rgba(160,190,205," + Math.min(0.5, (G.speed - W * 1.3) / (W * 1.6)) + ")";
      ctx.lineWidth = 1.5;
      for (var s = 0; s < 6; s++) {
        var lx = ((s * 97 + clock * 300) % W);
        var ly = (s * 173 + clock * G.speed * 0.5) % H;
        ctx.beginPath(); ctx.moveTo(lx, H - ly); ctx.lineTo(lx, H - ly - W * 0.15); ctx.stroke();
      }
    }
    drawSnowfall(1 / 60, state === "play" ? G.speed / H * 0.012 : 0);
  }

  function loop(ts) {
    var t = ts / 1000;
    var dt = lastT ? Math.min(0.05, t - lastT) : 1 / 60;
    lastT = t;
    if (state !== "result") {
      if (state !== "menu") update(dt); else clock += dt;
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ======================= 操作 =======================
  function pointerX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
    return e.clientX;
  }
  var dragging = false, dragStartX = 0, dragStartPx = 0;
  function onDown(e) {
    if (state !== "play") return;
    dragging = true; dragStartX = pointerX(e); dragStartPx = G.tx;
    if (e.cancelable) e.preventDefault();
  }
  function onMove(e) {
    if (!dragging || state !== "play") return;
    // 相对拖动，手指不用一直压在角色上
    G.tx = Math.max(W * 0.07, Math.min(W * 0.93, dragStartPx + (pointerX(e) - dragStartX) * 1.25));
    if (e.cancelable) e.preventDefault();
  }
  function onUp() { dragging = false; }
  cv.addEventListener("touchstart", onDown, { passive: false });
  cv.addEventListener("touchmove", onMove, { passive: false });
  cv.addEventListener("touchend", onUp);
  cv.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  // 电脑上调试用方向键
  window.addEventListener("keydown", function (e) {
    if (state !== "play") return;
    if (e.keyCode === 37) G.tx = Math.max(W * 0.07, G.tx - W * 0.12);
    if (e.keyCode === 39) G.tx = Math.min(W * 0.93, G.tx + W * 0.12);
  });

  function start() {
    newGame();
    state = "play";
    $("tip").style.opacity = "1";
    showLayer("hud");
    vibrate("medium");
  }

  // ======================= 结算 =======================
  var result = null;
  function rankTitle(m) {
    if (m < 300) return "刚穿上雪板";
    if (m < 800) return "绿道选手";
    if (m < 1600) return "蓝道常客";
    if (m < 3000) return "黑道老炮";
    return "阿勒泰粉雪之王";
  }

  async function finish() {
    var dist = Math.round(G.scroll / PX_PER_M());
    var kmh = Math.round(G.maxSpeed / PX_PER_M() * 3.6);
    var prevBest = best ? best.dist : 0;
    var isBest = dist > prevBest;
    if (isBest) { best = { dist: dist, flakes: G.flakes, t: Date.now() }; saveBest(best); }
    result = { dist: dist, flakes: G.flakes, kmh: kmh, best: Math.max(dist, prevBest), isBest: isBest, title: rankTitle(dist), dataUrl: null, filePath: null };
    result.dataUrl = drawCard(result);
    $("cardImg").src = result.dataUrl;
    showLayer("result");
    $("result").scrollTop = 0;
    refreshFollow();
    submitAndShowRank(dist);
    updateBestLine();
  }

  function drawCard(r) {
    var cc = $("cardCanvas");
    var c = cc.getContext("2d");
    var CW = 1080, CH = 1440, P = 80;
    var FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
    c.fillStyle = "#F6FAFC"; c.fillRect(0, 0, CW, CH);
    drawScene(c, 0, 0, CW, 620, 0.6);
    drawSkier(c, CW * 0.5, 560, 120, 0.4, 0);

    // 顶部标签
    c.fillStyle = "#FFFFFF"; rrect(c, P, 60, 300, 64, 32); c.fill();
    c.lineWidth = 5; c.strokeStyle = C.ink; c.stroke();
    c.fillStyle = C.ink; c.font = "900 34px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("冲下阿勒泰", P + 150, 93);

    // 主数
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.fillStyle = "#4E5A60"; c.font = "700 40px " + FONT;
    c.fillText("我在阿勒泰雪山一口气滑了", P, 720);
    c.fillStyle = C.ink; c.font = "900 150px " + FONT;
    var numText = fmt(r.dist);
    c.fillText(numText, P, 880);
    var nw = c.measureText(numText).width;
    c.font = "900 64px " + FONT; c.fillText("米", P + nw + 16, 880);

    // 称号
    c.font = "900 52px " + FONT;
    var tw = c.measureText(r.title).width;
    c.fillStyle = C.yellow; rrect(c, P, 920, tw + 56, 84, 18); c.fill();
    c.lineWidth = 5; c.strokeStyle = C.ink; c.stroke();
    c.fillStyle = C.ink; c.fillText(r.title, P + 28, 980);
    if (r.isBest && best && r.dist > 0) {
      c.font = "800 34px " + FONT; c.fillStyle = C.red;
      c.fillText("新纪录！", P + tw + 90, 978);
    }

    // 三格数据
    var stats = [["捡到雪花", String(r.flakes)], ["峰值时速", r.kmh + " km/h"], ["个人纪录", fmt(r.best) + " 米"]];
    var bw = (CW - P * 2 - 40) / 3;
    for (var i = 0; i < 3; i++) {
      var bx = P + i * (bw + 20), by = 1060;
      c.fillStyle = "#FFFFFF"; rrect(c, bx, by, bw, 170, 22); c.fill();
      c.lineWidth = 4; c.strokeStyle = C.ink; c.stroke();
      c.textAlign = "center";
      c.fillStyle = "#8A979E"; c.font = "700 30px " + FONT; c.fillText(stats[i][0], bx + bw / 2, by + 62);
      c.fillStyle = C.ink; c.font = "900 46px " + FONT; c.fillText(stats[i][1], bx + bw / 2, by + 128);
    }

    // 底部
    c.textAlign = "left"; c.fillStyle = "#4E5A60"; c.font = "700 32px " + FONT;
    c.fillText("你能滑过我吗？", P, 1330);
    c.textAlign = "right"; c.fillStyle = C.ink; c.font = "900 32px " + FONT;
    c.fillText("@Krypto说AI", CW - P, 1330);
    c.textAlign = "left";
    return cc.toDataURL("image/png");
  }

  async function getFilePath() {
    if (result.filePath) return result.filePath;
    if (!hasApi("writeTempFile")) return result.dataUrl;
    try {
      var r = await getMiniTool().writeTempFile({ data: result.dataUrl });
      if (r && r.filePath) { result.filePath = r.filePath; return r.filePath; }
    } catch (e) { /* 降级 */ }
    return result.dataUrl;
  }

  async function onSave() {
    if (!result) return;
    if (!(await canUse("saveImageToPhotosAlbum", 9420))) { toast("请在小红书 App 里打开再存图"); return; }
    try { await getMiniTool().saveImageToPhotosAlbum({ filePath: await getFilePath() }); toast("已存到相册"); }
    catch (e) { toast("没存成功，可能没给相册权限"); }
  }

  async function onPost() {
    if (!result) return;
    if (!hasApi("postNote")) { toast("请在小红书 App 里打开再发笔记"); return; }
    var title = "我在阿勒泰滑了" + result.dist + "米"; // ≤ 20 字
    var content = "在小红书小工具「冲下阿勒泰」里滑了 " + fmt(result.dist) + " 米，捡到 " + result.flakes +
      " 片雪花，峰值时速 " + result.kmh + " km/h，称号「" + result.title + "」。\n\n你能滑过我吗？\n\n#阿勒泰 #滑雪 #禾木 #小游戏";
    try {
      await getMiniTool().postNote({
        title: title, content: content.slice(0, 1000), pageType: "photo_publish",
        mediaInfo: { image_resources: [{ url: await getFilePath() }] }
      });
    } catch (e) { toast("没打开发布页，再试一次"); }
  }

  async function onPk() {
    if (!result) return;
    if (!(await canUse("interactionOpenApi", 9490))) { toast("当前版本不支持，升级小红书后再试"); return; }
    var p = await getFilePath();
    if (!p || p.indexOf("data:") === 0) { toast("成绩图没准备好，先点「存到相册」试试"); return; }
    try {
      await getMiniTool().interactionOpenApi({
        payload: {
          action: "post_comment",
          content: "我滑了 " + fmt(result.dist) + " 米（" + result.title + "），来比比？",
          media_bean: [{ media_type: "image", cover_image_url: p }],
          miniToolSnapshotInfo: JSON.stringify({ dist: result.dist })
        },
        saveToAlbum: false
      });
    } catch (e) { toast("没打开评论区，再试一次"); }
  }

  // ---------- 排行榜（9.51+，内测；未授权就隐藏） ----------
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function submitAndShowRank(dist) {
    var box = $("rankBox");
    box.style.display = "none";
    if (!(await canUse("submitScore", 9510)) || !hasApi("getRankList")) return;
    var mt = getMiniTool();
    try {
      if (dist > 0) await mt.submitScore({ board: 1, score: dist });
    } catch (e) {
      if (e && (e.errCode === 1005 || e.errCode === 10003)) return; // 未授权，不显示
    }
    var list = null;
    var waits = [500, 1000, 2000, 4000];
    for (var i = 0; i <= waits.length; i++) {
      try { list = await mt.getRankList({ board: 1, period: "week" }); break; }
      catch (e) {
        if (e && e.errCode === 2002 && i < waits.length) { await sleep(waits[i]); continue; }
        return;
      }
    }
    if (!list || !list.data) return;
    var ul = $("rankList");
    ul.innerHTML = "";
    var rows = list.data.slice(0, 10);
    if (!rows.length) {
      var li0 = document.createElement("li"); li0.textContent = "还没人上榜，现在就冲一把"; ul.appendChild(li0);
    }
    rows.forEach(function (row) {
      var li = document.createElement("li");
      var n = document.createElement("span"); n.className = "n"; n.textContent = row.rank;
      var nm = document.createElement("span"); nm.textContent = row.nickname || "小红薯";
      var s = document.createElement("span"); s.className = "s"; s.textContent = fmt(row.score) + " 米";
      li.appendChild(n); li.appendChild(nm); li.appendChild(s); ul.appendChild(li);
    });
    box.style.display = "block";
    if (hasApi("getMyRank")) {
      try {
        var my = await mt.getMyRank({ board: 1, period: "week" });
        var txt = "";
        if (my && my.status === "EXACT") txt = "你本周第 " + my.rank + " 名 · " + fmt(my.score) + " 米";
        else if (my && my.status === "OVER_LIMIT") txt = "你本周在 500 名以外，再冲一次";
        $("myRank").textContent = txt;
      } catch (e) { /* 忽略 */ }
    }
  }

  // ---------- 关注（9.51+） ----------
  var followPending = false;
  function renderFollow(status, note) {
    var btn = $("btnFollow");
    if (status === 1) { btn.textContent = "已关注"; btn.disabled = true; }
    else if (status === 2) { $("followBox").style.display = "none"; }
    else { btn.textContent = "关注 Krypto说AI"; btn.disabled = followPending; }
    $("followState").textContent = note || "";
  }
  async function refreshFollow() {
    if (!(await canUse("getFollowStatus", 9510))) { renderFollow(0, ""); return; }
    try { var r = await getMiniTool().getFollowStatus(); renderFollow(r && r.follow_status, ""); }
    catch (e) { renderFollow(0, ""); }
  }
  async function onFollow() {
    if (followPending) return;
    if (!(await canUse("followAuthor", 9510))) { toast("在小红书搜 Krypto说AI 就能找到我"); return; }
    followPending = true; renderFollow(0, "");
    var note = "", status = 0;
    try {
      var r = await getMiniTool().followAuthor();
      status = r && r.follow_status;
      if (status === -1) note = "暂时没关注上，稍后再试";
    } catch (e) {
      if (e && e.errCode === 15404) note = "今天的关注提醒次数用完了";
    } finally {
      followPending = false; renderFollow(status, note);
    }
  }

  // ======================= 启动 =======================
  function updateBestLine() {
    $("bestLine").innerHTML = best && best.dist > 0 ? "个人纪录 <b>" + fmt(best.dist) + " 米</b> · " + rankTitle(best.dist) : "";
  }
  $("btnStart").addEventListener("click", start);
  $("btnAgain").addEventListener("click", start);
  $("btnSave").addEventListener("click", onSave);
  $("btnPost").addEventListener("click", onPost);
  $("btnPk").addEventListener("click", onPk);
  $("btnFollow").addEventListener("click", onFollow);

  loadBest().then(function (b) { best = b; updateBestLine(); });

  // 测试钩子：只在浏览器预览时用，不影响容器内
  window.__altay = { state: function () { return state; }, G: function () { return G; } };
})();
