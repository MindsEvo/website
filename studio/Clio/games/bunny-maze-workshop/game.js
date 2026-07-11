(function () {
  "use strict";

  var DATA = window.CLIO_BUNNY_MAZE_DATA;
  var bridge = window.ClioRuntimeBridge.createController(DATA.id);

  var DIRS = {
    up: { dr: -1, dc: 0 },
    down: { dr: 1, dc: 0 },
    left: { dr: 0, dc: -1 },
    right: { dr: 0, dc: 1 }
  };

  var TEXT = {
    zh: {
      title: "兔兔方向迷宫",
      subtitle: "点击四只兔子方向键，控制迷宫移动。",
      music: "音乐",
      sfx: "音效",
      on: "开",
      off: "关",
      start: "开始",
      reset: "重置",
      dump: "导出 JSON",
      level: "关卡",
      steps: "步数",
      bump: "撞墙",
      time: "用时",
      controls: "方向控制",
      ready: "点击开始，进入第 1 关。",
      running: "进行中：找到胡萝卜。",
      bumped: "撞墙了，换个方向试试。",
      moved: "继续前进。",
      levelClear: "过关！准备下一关。",
      allClear: "全部通关，做得太棒了！",
      paused: "已暂停（切到后台）。",
      dumped: "会话已输出到控制台",
      noSession: "暂无会话数据",
      tipPrefix: "提示："
    },
    en: {
      title: "Bunny Direction Maze",
      subtitle: "Tap four rabbit controls to move in the maze.",
      music: "Music",
      sfx: "SFX",
      on: "On",
      off: "Off",
      start: "Start",
      reset: "Reset",
      dump: "Dump JSON",
      level: "Level",
      steps: "Steps",
      bump: "Bumps",
      time: "Time",
      controls: "Direction Controls",
      ready: "Press Start to enter level 1.",
      running: "In progress: find the carrot.",
      bumped: "Bumped into a wall. Try another direction.",
      moved: "Keep moving.",
      levelClear: "Level clear! Get ready for the next one.",
      allClear: "All levels clear. Great job!",
      paused: "Paused (background).",
      dumped: "Session dumped to console",
      noSession: "No session data yet",
      tipPrefix: "Tip: "
    }
  };

  var state = {
    lang: (window.shell && window.shell.lang) || "zh",
    running: false,
    paused: false,
    currentIndex: 0,
    levelStartAt: 0,
    steps: 0,
    bumps: 0,
    levelPlayer: { r: 0, c: 0 },
    levelTarget: { r: 0, c: 0 },
    levelGrid: [],
    sessionStartedAt: null,
    events: [],
    musicEnabled: true,
    sfxEnabled: true,
    audioCtx: null,
    musicTimer: null,
    musicNodes: []
  };

  var els = {
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn: document.getElementById("langBtn"),
    musicBtn: document.getElementById("musicBtn"),
    sfxBtn: document.getElementById("sfxBtn"),
    startBtn: document.getElementById("startBtn"),
    resetBtn: document.getElementById("resetBtn"),
    dumpBtn: document.getElementById("dumpBtn"),
    levelLabel: document.getElementById("levelLabel"),
    stepsLabel: document.getElementById("stepsLabel"),
    bumpLabel: document.getElementById("bumpLabel"),
    timeLabel: document.getElementById("timeLabel"),
    levelValue: document.getElementById("levelValue"),
    levelTotal: document.getElementById("levelTotal"),
    stepsValue: document.getElementById("stepsValue"),
    bumpValue: document.getElementById("bumpValue"),
    timeValue: document.getElementById("timeValue"),
    tipText: document.getElementById("tipText"),
    board: document.getElementById("board"),
    feedbackText: document.getElementById("feedbackText"),
    padCenter: document.getElementById("padCenter"),
    upBtn: document.getElementById("upBtn"),
    downBtn: document.getElementById("downBtn"),
    leftBtn: document.getElementById("leftBtn"),
    rightBtn: document.getElementById("rightBtn")
  };

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function bindPress(el, handler) {
    if (!el) return;
    el.addEventListener("click", function () {
      handler();
    }, false);
  }

  function nowMs() {
    return Date.now();
  }

  function ensureAudio() {
    if (!state.audioCtx) {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }
      state.audioCtx = new AudioContextCtor();
    }
    if (state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playTone(freq, duration, gainValue, type) {
    var ctx = ensureAudio();
    if (!ctx || !state.sfxEnabled) {
      return;
    }
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function stopMusic() {
    if (state.musicTimer) {
      window.clearInterval(state.musicTimer);
      state.musicTimer = null;
    }
    while (state.musicNodes.length) {
      var node = state.musicNodes.pop();
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e2) {}
    }
  }

  function playMusic() {
    var ctx = ensureAudio();
    if (!ctx || !state.musicEnabled) {
      return;
    }
    stopMusic();

    var sequence = [392, 523.25, 659.25, 523.25, 493.88, 587.33];
    var index = 0;
    state.musicTimer = window.setInterval(function () {
      if (!state.musicEnabled || state.paused || !state.running) {
        return;
      }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = sequence[index % sequence.length];
      gain.gain.value = 0.025;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      state.musicNodes.push(osc);
      index += 1;
    }, 280);
  }

  function updateAudioButtons() {
    els.musicBtn.textContent = t("music") + ": " + (state.musicEnabled ? t("on") : t("off"));
    els.sfxBtn.textContent = t("sfx") + ": " + (state.sfxEnabled ? t("on") : t("off"));
  }

  function timeText(ms) {
    return (Math.max(0, ms) / 1000).toFixed(1) + "s";
  }

  function setFeedback(key, cls) {
    els.feedbackText.className = "feedback" + (cls ? " " + cls : "");
    els.feedbackText.textContent = t(key);
  }

  function updateHud() {
    els.levelValue.textContent = String(state.currentIndex + 1);
    els.levelTotal.textContent = String(DATA.levels.length);
    els.stepsValue.textContent = String(state.steps);
    els.bumpValue.textContent = String(state.bumps);
    var elapsed = state.running ? nowMs() - state.levelStartAt : 0;
    els.timeValue.textContent = timeText(elapsed);
  }

  function renderLocale() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    document.title = state.lang === "en" ? "Bunny Direction Maze | Clio" : "兔兔方向迷宫 | Clio";

    els.titleText.textContent = t("title");
    els.subtitleText.textContent = t("subtitle");
    els.startBtn.textContent = t("start");
    els.resetBtn.textContent = t("reset");
    els.dumpBtn.textContent = t("dump");
    els.levelLabel.textContent = t("level");
    els.stepsLabel.textContent = t("steps");
    els.bumpLabel.textContent = t("bump");
    els.timeLabel.textContent = t("time");
    els.padCenter.textContent = t("controls");
    els.langBtn.textContent = state.lang === "zh" ? "中文 / EN" : "EN / 中文";
    updateAudioButtons();

    var level = DATA.levels[state.currentIndex];
    if (level) {
      var tip = state.lang === "en" ? level.tipEn : level.tipZh;
      els.tipText.textContent = t("tipPrefix") + tip;
    }
  }

  function loadLevel(index) {
    var level = DATA.levels[index];
    state.levelGrid = [];
    state.levelPlayer = { r: 0, c: 0 };
    state.levelTarget = { r: 0, c: 0 };

    for (var r = 0; r < level.map.length; r += 1) {
      var row = level.map[r];
      var parsed = [];
      for (var c = 0; c < row.length; c += 1) {
        var token = row.charAt(c);
        if (token === "S") {
          state.levelPlayer = { r: r, c: c };
          parsed.push(".");
        } else if (token === "T") {
          state.levelTarget = { r: r, c: c };
          parsed.push("T");
        } else {
          parsed.push(token);
        }
      }
      state.levelGrid.push(parsed);
    }

    state.steps = 0;
    state.bumps = 0;
    state.levelStartAt = nowMs();
    renderBoard();
    updateHud();
    renderLocale();
    setFeedback("running");
  }

  function makeCellClass(token, isTarget, r, c) {
    if (token === "#") return "cell wall";
    if (isTarget) return "cell target";
    return (r + c) % 2 === 0 ? "cell path" : "cell path-alt";
  }

  function renderBoard() {
    var rows = state.levelGrid.length;
    var cols = rows ? state.levelGrid[0].length : 0;
    els.board.style.gridTemplateColumns = "repeat(" + cols + ", var(--cell-size))";
    var html = "";

    for (var r = 0; r < rows; r += 1) {
      for (var c = 0; c < cols; c += 1) {
        var token = state.levelGrid[r][c];
        var isPlayer = r === state.levelPlayer.r && c === state.levelPlayer.c;
        var isTarget = r === state.levelTarget.r && c === state.levelTarget.c;
        var cls = makeCellClass(token, isTarget, r, c);
        var content = "";
        if (isTarget) content = "<span class=\"target-icon\">🥕</span>";
        if (isPlayer) content = "<span class=\"player\">🐰</span>";
        html += "<div class=\"" + cls + "\" role=\"gridcell\">" + content + "</div>";
      }
    }

    els.board.innerHTML = html;
  }

  function pushEvent(type, payload) {
    state.events.push({
      ts: new Date().toISOString(),
      level_id: DATA.levels[state.currentIndex].id,
      type: type,
      payload: payload || {}
    });
  }

  function animatePress(dir) {
    var btn = els[dir + "Btn"];
    if (!btn) return;
    bridge.commitAnimationStart(btn);
    bridge.nextFrame(function () {
      btn.classList.add("active");
      window.setTimeout(function () {
        btn.classList.remove("active");
      }, 110);
    }, 1);
  }

  function attemptMove(dir) {
    if (!state.running) return;

    animatePress(dir);
    playTone(720, 0.05, 0.05, "square");
    var delta = DIRS[dir];
    var nextR = state.levelPlayer.r + delta.dr;
    var nextC = state.levelPlayer.c + delta.dc;
    var cell = state.levelGrid[nextR] && state.levelGrid[nextR][nextC];

    if (cell === "#" || typeof cell === "undefined") {
      state.bumps += 1;
      playTone(180, 0.12, 0.08, "sawtooth");
      updateHud();
      setFeedback("bumped", "warn");
      pushEvent("bump", { dir: dir, at: { r: state.levelPlayer.r, c: state.levelPlayer.c } });
      return;
    }

    state.steps += 1;
    state.levelPlayer = { r: nextR, c: nextC };
    updateHud();
    renderBoard();
    pushEvent("move", { dir: dir, to: { r: nextR, c: nextC } });

    if (nextR === state.levelTarget.r && nextC === state.levelTarget.c) {
      playTone(880, 0.07, 0.06, "triangle");
      playTone(1174.66, 0.1, 0.05, "triangle");
      onLevelClear();
      return;
    }

    setFeedback("moved", "good");
  }

  function onLevelClear() {
    var elapsed = nowMs() - state.levelStartAt;
    setFeedback("levelClear", "good");
    pushEvent("level_clear", {
      steps: state.steps,
      bumps: state.bumps,
      elapsed_ms: elapsed
    });

    state.running = false;
    stopMusic();
    bridge.clearTimer("next_level");
    bridge.setTimer("next_level", 850, function () {
      if (state.currentIndex >= DATA.levels.length - 1) {
        setFeedback("allClear", "good");
        pushEvent("session_clear", {
          levels: DATA.levels.length,
          total_events: state.events.length
        });
        return;
      }
      state.currentIndex += 1;
      state.running = true;
      loadLevel(state.currentIndex);
      playMusic();
    });
  }

  function start() {
    bridge.resetSession();
    bridge.clearTimers();
    state.currentIndex = 0;
    state.events = [];
    state.sessionStartedAt = new Date().toISOString();
    state.running = true;
    state.paused = false;
    loadLevel(0);
    playMusic();
    pushEvent("session_start", { version: DATA.version });
  }

  function reset() {
    state.running = false;
    state.paused = false;
    stopMusic();
    bridge.resetSession();
    bridge.clearTimers();
    state.currentIndex = 0;
    state.events = [];
    loadLevel(0);
    setFeedback("ready");
  }

  function dumpSession() {
    if (!state.sessionStartedAt || state.events.length === 0) {
      setFeedback("noSession", "bad");
      return;
    }

    var payload = {
      game_id: DATA.id,
      ts: new Date().toISOString(),
      lang: state.lang,
      difficulty_dimension: "directional_control_maze",
      session_started_at: state.sessionStartedAt,
      content_version: DATA.version,
      events: state.events.slice(0)
    };

    console.log("[Clio Bunny Maze Session]", payload);
    setFeedback("dumped", "good");
  }

  function bindControl(id, dir) {
    bindPress(els[id], function () {
      attemptMove(dir);
    });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", function (ev) {
      if (!state.running) return;
      if (ev.key === "ArrowUp") attemptMove("up");
      if (ev.key === "ArrowDown") attemptMove("down");
      if (ev.key === "ArrowLeft") attemptMove("left");
      if (ev.key === "ArrowRight") attemptMove("right");
    });
  }

  function bootstrap() {
    bindControl("upBtn", "up");
    bindControl("downBtn", "down");
    bindControl("leftBtn", "left");
    bindControl("rightBtn", "right");
    bindKeyboard();

    bindPress(els.startBtn, start);
    bindPress(els.resetBtn, reset);
    bindPress(els.dumpBtn, dumpSession);
    bindPress(els.musicBtn, function () {
      state.musicEnabled = !state.musicEnabled;
      if (state.musicEnabled && state.running) {
        playMusic();
      } else {
        stopMusic();
      }
      updateAudioButtons();
    });
    bindPress(els.sfxBtn, function () {
      state.sfxEnabled = !state.sfxEnabled;
      if (state.sfxEnabled) {
        playTone(660, 0.06, 0.05, "square");
      }
      updateAudioButtons();
    });
    bindPress(els.langBtn, function () {
      state.lang = state.lang === "zh" ? "en" : "zh";
      if (window.shell) {
        window.shell.setLang(state.lang);
      }
      renderLocale();
    });

    bridge.onLifecyclePause(function () {
      if (!state.running) return;
      state.running = false;
      state.paused = true;
      bridge.clearTimers();
      stopMusic();
      setFeedback("paused", "warn");
    });

    loadLevel(0);
    setFeedback("ready");
  }

  bootstrap();
})();
