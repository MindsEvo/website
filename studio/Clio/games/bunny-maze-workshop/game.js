(function () {
  "use strict";

  var DATA   = window.CLIO_BUNNY_MAZE_DATA;
  var bridge = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController(DATA.id)
    : null;

  // ── state ──────────────────────────────────────────────────────────────────

  var state = {
    lang:         (window.shell && window.shell.lang) || "zh",
    phase:        "idle",   // "idle" | "playing" | "won"
    levelIndex:   0,
    grid:         [],
    rows:         0,
    cols:         0,
    playerRow:    0,
    playerCol:    0,
    goalRow:      0,
    goalCol:      0,
    moves:        0,
    wallHits:     0,
    timerStart:   0,
    elapsedMs:    0,
    timerRaf:     null,
    musicEnabled: true,
    sfxEnabled:   true,
    audioCtx:     null,
    musicLoop:    null,
    musicBeat:    0
  };

  // ── element refs ───────────────────────────────────────────────────────────

  var els = {
    titleText:    document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn:      document.getElementById("langBtn"),
    startBtn:     document.getElementById("startBtn"),
    musicBtn:     document.getElementById("musicBtn"),
    sfxBtn:       document.getElementById("sfxBtn"),
    levelLabel:   document.getElementById("levelLabel"),
    levelText:    document.getElementById("levelText"),
    moveLabel:    document.getElementById("moveLabel"),
    moveCount:    document.getElementById("moveCount"),
    wallLabel:    document.getElementById("wallLabel"),
    wallCount:    document.getElementById("wallCount"),
    timeLabel:    document.getElementById("timeLabel"),
    timeText:     document.getElementById("timeText"),
    mazeCanvas:   document.getElementById("mazeCanvas"),
    startOverlay: document.getElementById("startOverlay"),
    startBigBtn:  document.getElementById("startBigBtn"),
    dpadTitle:    document.getElementById("dpadTitle"),
    dirCenter:    document.getElementById("dirCenter"),
    btnUp:        document.getElementById("btnUp"),
    btnLeft:      document.getElementById("btnLeft"),
    btnRight:     document.getElementById("btnRight"),
    btnDown:      document.getElementById("btnDown"),
    feedbackText: document.getElementById("feedbackText"),
    hintText:     document.getElementById("hintText"),
    winLayer:     document.getElementById("winLayer"),
    winTitle:     document.getElementById("winTitle"),
    winSub:       document.getElementById("winSub"),
    nextBtn:      document.getElementById("nextBtn"),
    replayBtn:    document.getElementById("replayBtn")
  };

  var ctx  = els.mazeCanvas.getContext("2d");
  var CELL = 36;

  // ── i18n ───────────────────────────────────────────────────────────────────

  var TEXT = {
    zh: {
      title:       "兔兔方向迷宫",
      subtitle:    "点击方向控制，带小兔找到胡萝卜！",
      levelLabel:  "关卡",
      moveLabel:   "步数",
      wallLabel:   "撞墙",
      timeLabel:   "用时",
      start:       "▶ 开始",
      reset:       "↺ 重置",
      music:       "音乐",
      sfx:         "音效",
      on:          "开",
      off:         "关",
      dpadTitle:   "方向控制",
      dirCenter:   "方向\n控制",
      lang:        "中文 / EN",
      idleMsg:     "▶ 点击【开始】或任意方向按钮开始游戏！",
      startMsg:    "进入 {0}，加油！🐰",
      moved:       "走一步！继续加油！",
      blocked:     "哎呀，走不通！换个方向试试。",
      won:         "太棒了！找到胡萝卜了！🥕",
      wonSub:      "用了 {0} 步，撞了 {1} 次墙，用时 {2}。",
      allDone:     "全部通关！你是迷宫小英雄！🌟",
      allDoneSub:  "所有关卡完成，太厉害啦！",
      nextBtn:     "下一关 →",
      replayBtn:   "再玩一次",
      hintPrefix:  "提示：先试试",
      dirUp:       "上",
      dirDown:     "下",
      dirLeft:     "左",
      dirRight:    "右"
    },
    en: {
      title:       "Bunny Direction Maze",
      subtitle:    "Tap direction controls to lead the bunny to the carrot!",
      levelLabel:  "Level",
      moveLabel:   "Moves",
      wallLabel:   "Walls",
      timeLabel:   "Time",
      start:       "▶ Start",
      reset:       "↺ Reset",
      music:       "Music",
      sfx:         "SFX",
      on:          "On",
      off:         "Off",
      dpadTitle:   "Direction",
      dirCenter:   "Direction\nControl",
      lang:        "EN / 中文",
      idleMsg:     "▶ Click Start or any direction button to begin!",
      startMsg:    "Starting {0}! Go! 🐰",
      moved:       "One step! Keep going!",
      blocked:     "Oops, blocked! Try another direction.",
      won:         "Amazing! Found the carrot! 🥕",
      wonSub:      "{0} moves, {1} wall hits, {2}.",
      allDone:     "All levels cleared! You're a maze hero! 🌟",
      allDoneSub:  "Every level complete — brilliant!",
      nextBtn:     "Next Level →",
      replayBtn:   "Play Again",
      hintPrefix:  "Hint: try",
      dirUp:       "Up",
      dirDown:     "Down",
      dirLeft:     "Left",
      dirRight:    "Right"
    }
  };

  function t(key) { return TEXT[state.lang][key] || key; }

  function tf(key) {
    var str = t(key);
    var args = Array.prototype.slice.call(arguments, 1);
    return str.replace(/\{(\d+)\}/g, function (_, i) { return args[i] !== undefined ? args[i] : ""; });
  }

  // ── audio ───────────────────────────────────────────────────────────────────

  function ensureAudioCtx() {
    if (!state.audioCtx) {
      try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playHop() {
    if (!state.sfxEnabled) return;
    var ac = ensureAudioCtx(); if (!ac) return;
    var osc = ac.createOscillator(), gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.setValueAtTime(520, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ac.currentTime + 0.055);
    gain.gain.setValueAtTime(0.18, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.11);
  }

  function playBump() {
    if (!state.sfxEnabled) return;
    var ac = ensureAudioCtx(); if (!ac) return;
    var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.07), ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.8;
    var src = ac.createBufferSource(), gain = ac.createGain();
    src.buffer = buf; src.connect(gain); gain.connect(ac.destination);
    gain.gain.value = 0.28; src.start(ac.currentTime);
  }

  function playWin() {
    if (!state.sfxEnabled) return;
    var ac = ensureAudioCtx(); if (!ac) return;
    [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
      var osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = freq; osc.type = "sine";
      var t0 = ac.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0.22, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
      osc.start(t0); osc.stop(t0 + 0.32);
    });
  }

  // ── background music ───────────────────────────────────────────────────────

  // Kid-friendly pentatonic loop: C-D-E-G-A-G-E-D
  var MELODY = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];

  function playMusicNote() {
    if (!state.musicEnabled) return;
    var ac = ensureAudioCtx(); if (!ac) return;
    var freq = MELODY[state.musicBeat % MELODY.length];
    state.musicBeat++;
    var osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = "sine"; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.06, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.42);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 0.48);
    state.musicLoop = setTimeout(playMusicNote, 520);
  }

  function startMusic() {
    stopMusic();
    state.musicBeat = 0;
    playMusicNote();
  }

  function stopMusic() {
    if (state.musicLoop) { clearTimeout(state.musicLoop); state.musicLoop = null; }
  }

  // ── voice (TTS for direction feedback) ─────────────────────────────────────

  function speak(text) {
    if (!state.musicEnabled) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var utt = new SpeechSynthesisUtterance(text);
    utt.lang  = state.lang === "zh" ? "zh-CN" : "en-US";
    utt.rate  = 0.9;
    utt.volume = 1.0;
    window.speechSynthesis.speak(utt);
  }

  // ── timer ──────────────────────────────────────────────────────────────────

  function tickTimer() {
    if (state.phase !== "playing") return;
    state.elapsedMs = Date.now() - state.timerStart;
    els.timeText.textContent = (state.elapsedMs / 1000).toFixed(1) + "s";
    state.timerRaf = requestAnimationFrame(tickTimer);
  }

  function stopTimer() {
    if (state.timerRaf) { cancelAnimationFrame(state.timerRaf); state.timerRaf = null; }
    stopMusic();
  }

  function formatTime(ms) {
    var s = ms / 1000;
    if (s < 60) return s.toFixed(1) + "s";
    return Math.floor(s / 60) + "m " + (s % 60).toFixed(0) + "s";
  }

  // ── maze parsing ───────────────────────────────────────────────────────────

  function parseLevel(levelDef) {
    var grid = levelDef.grid.map(function (row) { return row.split(""); });
    var pr = 0, pc = 0, gr = 0, gc = 0;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === "S") { pr = r; pc = c; grid[r][c] = " "; }
        if (grid[r][c] === "E") { gr = r; gc = c; grid[r][c] = " "; }
      }
    }
    return { grid: grid, playerRow: pr, playerCol: pc, goalRow: gr, goalCol: gc };
  }

  // ── canvas ─────────────────────────────────────────────────────────────────

  function recalcCellSize() {
    var card = document.querySelector(".maze-canvas-card");
    var pad  = 28;
    var maxW, maxH;
    if (card && card.clientWidth > 50) {
      maxW = card.clientWidth - pad;
    } else {
      // Fallback before layout settles: viewport minus D-pad + gutters
      maxW = Math.max(window.innerWidth - 280, 120);
    }
    maxH = Math.max(window.innerHeight * 0.56 - pad, 100);
    var cellByW = Math.floor(maxW / state.cols);
    var cellByH = Math.floor(maxH / state.rows);
    CELL = Math.min(cellByW, cellByH);
    CELL = Math.max(CELL, 16);
    CELL = Math.min(CELL, 68);
    els.mazeCanvas.width  = state.cols * CELL;
    els.mazeCanvas.height = state.rows * CELL;
  }

  function drawMaze() {
    var grid = state.grid;
    ctx.clearRect(0, 0, els.mazeCanvas.width, els.mazeCanvas.height);

    for (var r = 0; r < state.rows; r++) {
      for (var c = 0; c < state.cols; c++) {
        var x = c * CELL, y = r * CELL;
        if (grid[r][c] === "#") {
          ctx.fillStyle = "#1e3a8a";
          ctx.fillRect(x, y, CELL, CELL);
          // top edge highlight
          ctx.fillStyle = "rgba(255,255,255,0.14)";
          ctx.fillRect(x, y, CELL, Math.ceil(CELL * 0.12));
          // bottom-right shadow
          ctx.fillStyle = "rgba(0,0,0,0.18)";
          ctx.fillRect(x, y + CELL - Math.ceil(CELL * 0.12), CELL, Math.ceil(CELL * 0.12));
        } else {
          ctx.fillStyle = "#f0f8ff";
          ctx.fillRect(x, y, CELL, CELL);
          ctx.strokeStyle = "rgba(100,140,200,0.15)";
          ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
        }
      }
    }

    var emojiSize = Math.floor(CELL * 0.72) + "px serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    // goal: bright orange halo so carrot is always visible
    var gx = state.goalCol * CELL + CELL / 2;
    var gy = state.goalRow * CELL + CELL / 2;
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(gx, gy, CELL * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = emojiSize;
    ctx.fillText("🥕", gx, gy);

    // player: white disc so bunny stands out on any background
    var px = state.playerCol * CELL + CELL / 2;
    var py = state.playerRow * CELL + CELL / 2;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(px, py, CELL * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = Math.floor(CELL * 0.76) + "px serif";
    ctx.fillText("🐰", px, py);
  }

  // ── hint ───────────────────────────────────────────────────────────────────

  function computeFirstHint() {
    var r = state.playerRow, c = state.playerCol;
    var DIRS = [
      { dr: -1, dc:  0, key: "dirUp"    },
      { dr: +1, dc:  0, key: "dirDown"  },
      { dr:  0, dc: -1, key: "dirLeft"  },
      { dr:  0, dc: +1, key: "dirRight" }
    ];
    var names = DIRS.filter(function (d) {
      var nr = r + d.dr, nc = c + d.dc;
      return nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols && state.grid[nr][nc] !== "#";
    }).map(function (d) { return t(d.key); });
    if (!names.length) return "";
    return t("hintPrefix") + " " + names.join(" / ") + "。";
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  function updateHUD() {
    els.levelText.textContent = (state.levelIndex + 1) + "/" + DATA.levels.length;
    els.moveCount.textContent = String(state.moves);
    els.wallCount.textContent = String(state.wallHits);
    // timeText is updated by tickTimer
  }

  function setFeedback(text, isBlocked) {
    els.feedbackText.textContent = text;
    if (isBlocked) {
      els.feedbackText.classList.remove("maze-blocked");
      void els.feedbackText.offsetWidth;
      els.feedbackText.classList.add("maze-blocked");
    } else {
      els.feedbackText.classList.remove("maze-blocked");
    }
  }

  // ── start / load ───────────────────────────────────────────────────────────

  function startGame() {
    if (state.phase === "playing") return;
    state.phase      = "playing";
    state.timerStart = Date.now();
    els.startOverlay.hidden = true;
    els.startBtn.textContent = t("reset");
    var levelName = DATA.levels[state.levelIndex]["name" + (state.lang === "zh" ? "Zh" : "En")];
    setFeedback(tf("startMsg", levelName), false);
    els.hintText.textContent = computeFirstHint();
    speak(levelName);
    tickTimer();
    startMusic();
  }

  function loadLevel(index) {
    if (bridge) { bridge.resetSession(); }
    stopTimer();

    state.levelIndex = index;
    state.phase      = "idle";
    var def    = DATA.levels[index];
    var parsed = parseLevel(def);
    state.grid       = parsed.grid;
    state.playerRow  = parsed.playerRow;
    state.playerCol  = parsed.playerCol;
    state.goalRow    = parsed.goalRow;
    state.goalCol    = parsed.goalCol;
    state.rows       = parsed.grid.length;
    state.cols       = parsed.grid[0].length;
    state.moves      = 0;
    state.wallHits   = 0;
    state.elapsedMs  = 0;

    els.timeText.textContent    = "0.0s";
    els.winLayer.hidden         = true;
    els.startOverlay.hidden     = false;
    els.startBtn.textContent    = t("start");
    els.hintText.textContent    = "";
    setFeedback(t("idleMsg"), false);
    updateHUD();

    // Draw immediately with viewport-based fallback size,
    // then re-draw once the grid layout has settled (80 ms is enough).
    recalcCellSize();
    drawMaze();
    setTimeout(function () { recalcCellSize(); drawMaze(); }, 80);
  }

  // ── movement ───────────────────────────────────────────────────────────────

  function tryMove(dr, dc) {
    if (state.phase === "idle") { startGame(); }
    if (state.phase !== "playing") return;

    var newR = state.playerRow + dr;
    var newC = state.playerCol + dc;

    if (
      newR < 0 || newR >= state.rows ||
      newC < 0 || newC >= state.cols ||
      state.grid[newR][newC] === "#"
    ) {
      state.wallHits++;
      updateHUD();
      setFeedback(t("blocked"), true);
      playBump();
      return;
    }

    state.playerRow = newR;
    state.playerCol = newC;
    state.moves++;
    els.hintText.textContent = "";   // clear hint after first move
    updateHUD();
    drawMaze();
    playHop();

    if (newR === state.goalRow && newC === state.goalCol) {
      stopTimer();
      state.phase = "won";
      var isLast  = state.levelIndex >= DATA.levels.length - 1;
      els.winTitle.textContent = isLast ? t("allDone")    : t("won");
      els.winSub.textContent   = isLast
        ? t("allDoneSub")
        : tf("wonSub", state.moves, state.wallHits, formatTime(state.elapsedMs));
      els.nextBtn.hidden = isLast;
      els.winLayer.hidden = false;
      playWin();
      speak(isLast ? t("allDone") : t("won"));
    } else {
      setFeedback(t("moved"), false);
    }
  }

  // ── direction press handler ────────────────────────────────────────────────

  function makeDirHandler(btn, dr, dc) {
    return function () {
      btn.classList.add("pressed");
      if (bridge) {
        bridge.setTimer("press-" + btn.id, 130, function () { btn.classList.remove("pressed"); });
      } else {
        setTimeout(function () { btn.classList.remove("pressed"); }, 130);
      }
      tryMove(dr, dc);
    };
  }

  function bindDirBtn(btn, dr, dc) {
    var handler = makeDirHandler(btn, dr, dc);
    if (bridge) { bridge.bindTap(btn, handler); }
    else { btn.addEventListener("click", handler); }
  }

  // ── keyboard ───────────────────────────────────────────────────────────────

  function bindKeyboard() {
    document.addEventListener("keydown", function (e) {
      if      (e.key === "ArrowUp"    || e.key === "w" || e.key === "W") { e.preventDefault(); tryMove(-1,  0); }
      else if (e.key === "ArrowDown"  || e.key === "s" || e.key === "S") { e.preventDefault(); tryMove(+1,  0); }
      else if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") { e.preventDefault(); tryMove( 0, -1); }
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); tryMove( 0, +1); }
    });
  }

  // ── locale ─────────────────────────────────────────────────────────────────

  function applyLocale() {
    var lang = state.lang;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title = lang === "en" ? "Bunny Direction Maze | Clio" : "兔兔方向迷宫 | Clio";
    els.titleText.textContent    = DATA.title[lang];
    els.subtitleText.textContent = DATA.subtitle[lang];
    els.langBtn.textContent      = t("lang");
    els.startBtn.textContent     = state.phase === "playing" ? t("reset") : t("start");
    els.musicBtn.textContent     = t("music") + ": " + (state.musicEnabled ? t("on") : t("off"));
    els.sfxBtn.textContent       = t("sfx")   + ": " + (state.sfxEnabled   ? t("on") : t("off"));
    els.dpadTitle.textContent    = t("dpadTitle");
    els.dirCenter.innerHTML      = t("dirCenter").replace("\n", "<br>");
    els.levelLabel.textContent   = t("levelLabel");
    els.moveLabel.textContent    = t("moveLabel");
    els.wallLabel.textContent    = t("wallLabel");
    els.timeLabel.textContent    = t("timeLabel");
    els.nextBtn.textContent      = t("nextBtn");
    els.replayBtn.textContent    = t("replayBtn");
    updateHUD();
    if (state.phase === "idle") setFeedback(t("idleMsg"), false);
  }

  // ── init ───────────────────────────────────────────────────────────────────

  function init() {
    // direction buttons
    bindDirBtn(els.btnUp,    -1,  0);
    bindDirBtn(els.btnDown,  +1,  0);
    bindDirBtn(els.btnLeft,   0, -1);
    bindDirBtn(els.btnRight,  0, +1);

    // start/reset button (toolbar + big overlay)
    function handleStart() {
      if (state.phase === "idle") { startGame(); }
      else { loadLevel(state.levelIndex); }
    }
    els.startBtn.addEventListener("click", handleStart);
    if (bridge) { bridge.bindTap(els.startBigBtn, handleStart); }
    else { els.startBigBtn.addEventListener("click", handleStart); }

    // win overlay
    els.nextBtn.addEventListener("click", function () {
      if (state.levelIndex < DATA.levels.length - 1) loadLevel(state.levelIndex + 1);
    });
    els.replayBtn.addEventListener("click", function () { loadLevel(state.levelIndex); });

    // lang toggle
    els.langBtn.addEventListener("click", function () {
      state.lang = state.lang === "zh" ? "en" : "zh";
      applyLocale();
      drawMaze();
    });

    // music toggle
    els.musicBtn.addEventListener("click", function () {
      ensureAudioCtx();
      state.musicEnabled = !state.musicEnabled;
      els.musicBtn.textContent = t("music") + ": " + (state.musicEnabled ? t("on") : t("off"));
      if (state.musicEnabled && state.phase === "playing") { startMusic(); }
      else { stopMusic(); }
    });

    // sfx toggle
    els.sfxBtn.addEventListener("click", function () {
      ensureAudioCtx();   // unlock audio context on user gesture
      state.sfxEnabled = !state.sfxEnabled;
      els.sfxBtn.textContent = t("sfx") + ": " + (state.sfxEnabled ? t("on") : t("off"));
    });

    // resize
    window.addEventListener("resize", function () { recalcCellSize(); drawMaze(); });

    // keyboard
    bindKeyboard();

    // lifecycle pause
    if (bridge) {
      bridge.onLifecyclePause(function () {
        if (state.phase === "playing") stopTimer();
      });
    }

    applyLocale();
    loadLevel(0);
  }

  init();
})();

