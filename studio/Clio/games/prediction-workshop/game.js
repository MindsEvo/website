(function () {
  "use strict";

  var COLORS = {
    red: "#ef4444",
    blue: "#3b82f6",
    yellow: "#facc15",
    green: "#22c55e",
    purple: "#a855f7",
    orange: "#f97316"
  };

  var MIX_RULES = {
    "blue+yellow": "green",
    "blue+red": "purple",
    "red+yellow": "orange"
  };

  var BASE_COMBOS = [
    ["yellow", "blue"],
    ["red", "blue"],
    ["red", "yellow"]
  ];

  var BETWEEN_MS = 950;

  var TEXT = {
    en: {
      title: "Prediction Workshop",
      subtitle: "Clio MVP · left demo + right practice, both random",
      mode: "Mode",
      modeValue: "Demo + Practice",
      correct: "Correct",
      wrong: "Wrong",
      miss: "Miss",
      start: "Start",
      pause: "Pause",
      reset: "Reset",
      dump: "Dump Session JSON",
      logTitle: "Latest Feedback",
      pressStart: "Press Start",
      running: "Running",
      paused: "Paused",
      resumed: "Resumed",
      demo: "Demo",
      practice: "Practice",
      autoResult: "Auto Result",
      chooseResult: "Choose Result",
      predictNow: "Practice lane: pick one color",
      observeHint: "Demo result: {0}",
      good: "Great!",
      bad: "Not this one. Watch practice result.",
      missed: "No answer in time. Watch practice result.",
      dumped: "Session dumped to console",
      noSession: "No session found",
      parseFailed: "Session parse failed",
      speed: "Speed",
      unit: "px/s",
      speedMsg: "Speed: {0} px/s",
      music: "Music",
      sfx: "SFX",
      on: "On",
      off: "Off",
      color: {
        red: "Red",
        blue: "Blue",
        yellow: "Yellow",
        green: "Green",
        purple: "Purple",
        orange: "Orange"
      }
    },
    zh: {
      title: "预测工坊",
      subtitle: "Clio MVP · 左侧演示 + 右侧练习，两边随机独立",
      mode: "模式",
      modeValue: "演示 + 练习",
      correct: "正确",
      wrong: "错误",
      miss: "错过",
      start: "开始",
      pause: "暂停",
      reset: "重置",
      dump: "导出会话 JSON",
      logTitle: "最新反馈",
      pressStart: "点击开始",
      running: "运行中",
      paused: "已暂停",
      resumed: "继续运行",
      demo: "演示",
      practice: "练习",
      autoResult: "自动结果",
      chooseResult: "选择结果",
      predictNow: "练习轨道：请选择一个颜色球",
      observeHint: "演示结果：{0}",
      good: "太棒了！",
      bad: "这次不对，请看练习轨道结果。",
      missed: "本轮未作答，请看练习轨道结果。",
      dumped: "会话已输出到控制台",
      noSession: "没有找到会话数据",
      parseFailed: "会话解析失败",
      speed: "速度",
      unit: "像素/秒",
      speedMsg: "速度：{0} 像素/秒",
      music: "音乐",
      sfx: "音效",
      on: "开",
      off: "关",
      color: {
        red: "红",
        blue: "蓝",
        yellow: "黄",
        green: "绿",
        purple: "紫",
        orange: "橙"
      }
    }
  };

  function createLaneState(kind) {
    return {
      kind: kind,
      phase: "idle",
      timerId: null,
      timerStartedAt: 0,
      timerRemainingMs: 0,
      combo: null,
      positions: null,
      selectedColor: null,
      selectedAt: 0,
      predictOpenedAt: 0,
      seenCombos: {
        "blue+yellow": 0,
        "blue+red": 0,
        "red+yellow": 0
      }
    };
  }

  var state = {
    lang: "en",
    running: false,
    paused: false,
    speedPxPerSec: 92,
    musicEnabled: true,
    sfxEnabled: true,
    audioCtx: null,
    musicTimer: null,
    musicNodes: [],
    counts: {
      correct: 0,
      wrong: 0,
      miss: 0
    },
    demoLane: createLaneState("demo"),
    practiceLane: createLaneState("practice"),
    demoEvents: [],
    practiceEvents: []
  };

  var els = {
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    modeLabel: document.getElementById("modeLabel"),
    modeValue: document.getElementById("modeValue"),
    correctLabel: document.getElementById("correctLabel"),
    wrongLabel: document.getElementById("wrongLabel"),
    missLabel: document.getElementById("missLabel"),
    correctCount: document.getElementById("correctCount"),
    wrongCount: document.getElementById("wrongCount"),
    missCount: document.getElementById("missCount"),
    demoLane: document.getElementById("demoLane"),
    practiceLane: document.getElementById("practiceLane"),
    demoTitle: document.getElementById("demoTitle"),
    practiceTitle: document.getElementById("practiceTitle"),
    demoBallA: document.getElementById("demoBallA"),
    demoBallB: document.getElementById("demoBallB"),
    practiceBallA: document.getElementById("practiceBallA"),
    practiceBallB: document.getElementById("practiceBallB"),
    demoResultFill: document.getElementById("demoResultFill"),
    practiceResultFill: document.getElementById("practiceResultFill"),
    demoBasketLabel: document.getElementById("demoBasketLabel"),
    practiceBasketLabel: document.getElementById("practiceBasketLabel"),
    choiceBalls: Array.prototype.slice.call(document.querySelectorAll(".choice-ball")),
    startBtn: document.getElementById("startBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    resetBtn: document.getElementById("resetBtn"),
    dumpBtn: document.getElementById("dumpBtn"),
    langBtn: document.getElementById("langBtn"),
    musicBtn: document.getElementById("musicBtn"),
    sfxBtn: document.getElementById("sfxBtn"),
    speedTitle: document.getElementById("speedTitle"),
    speedBar: document.getElementById("speedBar"),
    speedValue: document.getElementById("speedValue"),
    speedUnit: document.getElementById("speedUnit"),
    feedbackText: document.getElementById("feedbackText"),
    logTitle: document.getElementById("logTitle")
  };

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function colorName(colorKey) {
    return TEXT[state.lang].color[colorKey] || colorKey;
  }

  function tf(key, value) {
    return t(key).replace("{0}", value);
  }

  function getComboKey(a, b) {
    return [a, b].sort().join("+");
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function setFeedback(text, cls) {
    els.feedbackText.className = cls || "";
    els.feedbackText.textContent = text;
  }

  function updateCounters() {
    els.correctCount.textContent = String(state.counts.correct);
    els.wrongCount.textContent = String(state.counts.wrong);
    els.missCount.textContent = String(state.counts.miss);
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

    var sequence = [261.63, 329.63, 392.0, 329.63];
    var index = 0;
    state.musicTimer = window.setInterval(function () {
      if (!state.musicEnabled || state.paused || !state.running) {
        return;
      }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = sequence[index % sequence.length];
      gain.gain.value = 0.02;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
      state.musicNodes.push(osc);
      index += 1;
    }, 320);
  }

  function randomCombo() {
    return BASE_COMBOS[Math.floor(Math.random() * BASE_COMBOS.length)];
  }

  function laneBalls(lane) {
    if (lane.kind === "demo") {
      return { a: els.demoBallA, b: els.demoBallB, fill: els.demoResultFill, host: els.demoLane };
    }
    return { a: els.practiceBallA, b: els.practiceBallB, fill: els.practiceResultFill, host: els.practiceLane };
  }

  function setBallTransition(ballA, ballB, ms) {
    var tr = "left " + ms + "ms linear, top " + ms + "ms linear";
    ballA.style.transition = tr;
    ballB.style.transition = tr;
  }

  function setBallPos(ball, left, top) {
    ball.style.left = Math.round(left) + "px";
    ball.style.top = Math.round(top) + "px";
  }

  function computeLanePositions(host) {
    var rect = host.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    var xA = w * 0.36;
    var xB = w * 0.54;
    return {
      startA: { left: xA, top: 44 },
      startB: { left: xB, top: 44 },
      endA: { left: xA, top: h * 0.66 },
      endB: { left: xB, top: h * 0.66 }
    };
  }

  function computeFallDurationMs(pos) {
    var dA = Math.hypot(pos.endA.left - pos.startA.left, pos.endA.top - pos.startA.top);
    var dB = Math.hypot(pos.endB.left - pos.startB.left, pos.endB.top - pos.startB.top);
    var distance = Math.max(dA, dB);
    var ms = Math.round((distance / state.speedPxPerSec) * 1000);
    return Math.max(650, Math.min(4500, ms));
  }

  function clearLaneTimer(lane) {
    if (lane.timerId) {
      window.clearTimeout(lane.timerId);
      lane.timerId = null;
    }
  }

  function scheduleLaneTimer(lane, phase, ms, callback) {
    clearLaneTimer(lane);
    lane.phase = phase;
    lane.timerRemainingMs = ms;
    lane.timerStartedAt = performance.now();
    lane.timerId = window.setTimeout(function () {
      lane.timerId = null;
      lane.timerRemainingMs = 0;
      callback();
    }, ms);
  }

  function resetLaneVisual(lane) {
    var ui = laneBalls(lane);
    clearLaneTimer(lane);
    lane.phase = "idle";
    lane.combo = null;
    lane.positions = null;
    lane.selectedColor = null;
    lane.selectedAt = 0;
    lane.predictOpenedAt = 0;
    ui.a.classList.add("hidden");
    ui.b.classList.add("hidden");
    ui.fill.classList.add("hidden");
    ui.fill.style.background = "transparent";
  }

  function freezeBallAtCurrentPosition(ball, host) {
    if (ball.classList.contains("hidden")) {
      return;
    }
    var hostRect = host.getBoundingClientRect();
    var rect = ball.getBoundingClientRect();
    ball.style.transition = "none";
    setBallPos(ball, rect.left - hostRect.left, rect.top - hostRect.top);
  }

  function freezeLaneMotion(lane) {
    var ui = laneBalls(lane);
    freezeBallAtCurrentPosition(ui.a, ui.host);
    freezeBallAtCurrentPosition(ui.b, ui.host);
  }

  function persistSessions() {
    var base = {
      game_id: "clio-prediction-workshop-mvp-dual-lane",
      ts: nowIso(),
      lang: state.lang,
      counts: state.counts,
      difficulty_dimension: {
        ball_count: 2,
        fall_speed: "shared_dynamic",
        answer_mode: "demo_vs_recognition"
      }
    };

    localStorage.setItem("me:clio:prediction:demo:latest", JSON.stringify(Object.assign({}, base, {
      lane: "demo",
      phase: "discovery",
      events: state.demoEvents
    })));

    localStorage.setItem("me:clio:prediction:practice:latest", JSON.stringify(Object.assign({}, base, {
      lane: "practice",
      phase: "prediction",
      events: state.practiceEvents
    })));
  }

  function appendDemoEvent(combo, actualColor, lane) {
    var key = combo.comboKey;
    var seenCount = lane.seenCombos[key] || 0;
    lane.seenCombos[key] = seenCount + 1;

    state.demoEvents.push({
      phase: "discovery",
      lane: "demo",
      color_a: combo.colorA,
      color_b: combo.colorB,
      predicted_color: null,
      actual_color: actualColor,
      is_correct: null,
      reaction_time_ms: null,
      difficulty_dimension: {
        ball_count: 2,
        fall_speed: "shared_dynamic",
        answer_mode: "observe_only"
      },
      is_novel_combination: seenCount === 0,
      rootgene_tags: ["Observation", "Generalization"],
      at: nowIso()
    });
  }

  function appendPracticeEvent(combo, predictedColor, actualColor, reactionMs, lane) {
    var key = combo.comboKey;
    var seenCount = lane.seenCombos[key] || 0;
    var isNovel = seenCount === 0;
    lane.seenCombos[key] = seenCount + 1;

    state.practiceEvents.push({
      phase: "prediction",
      lane: "practice",
      color_a: combo.colorA,
      color_b: combo.colorB,
      predicted_color: predictedColor,
      actual_color: actualColor,
      is_correct: predictedColor === actualColor,
      reaction_time_ms: reactionMs,
      difficulty_dimension: {
        ball_count: 2,
        fall_speed: "shared_dynamic",
        answer_mode: "recognition_buttons"
      },
      is_novel_combination: isNovel,
      rootgene_tags: isNovel ? ["Prediction", "Hypothesis"] : ["Prediction"],
      at: nowIso()
    });
  }

  function enablePracticeChoices(enabled) {
    els.choiceBalls.forEach(function (btn) {
      btn.disabled = !enabled;
      if (!enabled) {
        btn.classList.remove("active");
      }
    });
    if (!enabled) {
      state.practiceLane.selectedColor = null;
      state.practiceLane.selectedAt = 0;
    }
  }

  function runLaneRound(lane) {
    if (!state.running || state.paused) {
      return;
    }

    resetLaneVisual(lane);
    var ui = laneBalls(lane);
    var pair = randomCombo();
    var key = getComboKey(pair[0], pair[1]);
    var combo = {
      colorA: pair[0],
      colorB: pair[1],
      comboKey: key,
      actualColor: MIX_RULES[key]
    };

    lane.combo = combo;
    lane.positions = computeLanePositions(ui.host);

    ui.a.style.background = COLORS[combo.colorA];
    ui.b.style.background = COLORS[combo.colorB];
    ui.a.classList.remove("hidden");
    ui.b.classList.remove("hidden");

    setBallTransition(ui.a, ui.b, 0);
    setBallPos(ui.a, lane.positions.startA.left, lane.positions.startA.top);
    setBallPos(ui.b, lane.positions.startB.left, lane.positions.startB.top);

    if (lane.kind === "practice") {
      enablePracticeChoices(true);
      lane.predictOpenedAt = performance.now();
      setFeedback(t("predictNow"), "");
    }

    var durationMs = computeFallDurationMs(lane.positions);
    setBallTransition(ui.a, ui.b, durationMs);
    window.requestAnimationFrame(function () {
      setBallPos(ui.a, lane.positions.endA.left, lane.positions.endA.top);
      setBallPos(ui.b, lane.positions.endB.left, lane.positions.endB.top);
    });

    scheduleLaneTimer(lane, "fall", durationMs, function () {
      finishLaneRound(lane);
    });
  }

  function finishLaneRound(lane) {
    if (!lane.combo) {
      return;
    }
    var ui = laneBalls(lane);
    ui.a.classList.add("hidden");
    ui.b.classList.add("hidden");
    ui.fill.classList.remove("hidden");
    ui.fill.style.background = COLORS[lane.combo.actualColor];

    if (lane.kind === "demo") {
      appendDemoEvent(lane.combo, lane.combo.actualColor, lane);
      if (Math.random() < 0.35) {
        setFeedback(tf("observeHint", colorName(lane.combo.actualColor)), "");
      }
    } else {
      var predicted = lane.selectedColor;
      var reaction = predicted ? Math.round(lane.selectedAt - lane.predictOpenedAt) : null;
      appendPracticeEvent(lane.combo, predicted, lane.combo.actualColor, reaction, lane);

      if (!predicted) {
        state.counts.miss += 1;
        setFeedback(t("missed"), "feedback-miss");
        playTone(120, 0.18, 0.03, "square");
      } else if (predicted === lane.combo.actualColor) {
        state.counts.correct += 1;
        setFeedback(t("good"), "feedback-ok");
        playTone(760, 0.12, 0.03, "triangle");
      } else {
        state.counts.wrong += 1;
        setFeedback(t("bad"), "feedback-bad");
        playTone(180, 0.16, 0.04, "sawtooth");
      }
      updateCounters();
      enablePracticeChoices(false);
    }

    persistSessions();
    scheduleLaneTimer(lane, "between", BETWEEN_MS, function () {
      runLaneRound(lane);
    });
  }

  function pauseLane(lane) {
    if (!lane.timerId) {
      return;
    }
    var elapsed = performance.now() - lane.timerStartedAt;
    lane.timerRemainingMs = Math.max(0, lane.timerRemainingMs - elapsed);
    clearLaneTimer(lane);
    if (lane.phase === "fall") {
      freezeLaneMotion(lane);
    }
  }

  function resumeLane(lane) {
    if (!state.running || state.paused) {
      return;
    }

    var ui = laneBalls(lane);
    var remaining = Math.max(40, Math.round(lane.timerRemainingMs || 0));

    if (lane.phase === "fall" && lane.combo && lane.positions) {
      setBallTransition(ui.a, ui.b, remaining);
      window.requestAnimationFrame(function () {
        setBallPos(ui.a, lane.positions.endA.left, lane.positions.endA.top);
        setBallPos(ui.b, lane.positions.endB.left, lane.positions.endB.top);
      });
      scheduleLaneTimer(lane, "fall", remaining, function () {
        finishLaneRound(lane);
      });
      return;
    }

    if (lane.phase === "between") {
      scheduleLaneTimer(lane, "between", remaining, function () {
        runLaneRound(lane);
      });
      return;
    }

    runLaneRound(lane);
  }

  function renderLocale() {
    els.titleText.textContent = t("title");
    els.subtitleText.textContent = t("subtitle");
    els.modeLabel.textContent = t("mode");
    els.modeValue.textContent = t("modeValue");
    els.correctLabel.textContent = t("correct");
    els.wrongLabel.textContent = t("wrong");
    els.missLabel.textContent = t("miss");
    els.startBtn.textContent = t("start");
    els.pauseBtn.textContent = t("pause");
    els.resetBtn.textContent = t("reset");
    els.dumpBtn.textContent = t("dump");
    els.logTitle.textContent = t("logTitle");
    els.demoTitle.textContent = t("demo");
    els.practiceTitle.textContent = t("practice");
    els.demoBasketLabel.textContent = t("autoResult");
    els.practiceBasketLabel.textContent = t("chooseResult");
    els.speedTitle.textContent = t("speed");
    els.speedUnit.textContent = t("unit");
    els.langBtn.textContent = state.lang === "en" ? "中文 / EN" : "EN / 中文";
    els.musicBtn.textContent = t("music") + ": " + (state.musicEnabled ? t("on") : t("off"));
    els.sfxBtn.textContent = t("sfx") + ": " + (state.sfxEnabled ? t("on") : t("off"));

    els.choiceBalls.forEach(function (btn) {
      btn.setAttribute("aria-label", colorName(btn.getAttribute("data-color")));
    });

    if (!state.running) {
      setFeedback(t("pressStart"), "");
    }
  }

  function startGame() {
    if (state.running) {
      if (state.paused) {
        pauseGame();
      }
      return;
    }

    state.running = true;
    state.paused = false;
    ensureAudio();
    playMusic();
    setFeedback(t("running"), "");
    runLaneRound(state.demoLane);
    runLaneRound(state.practiceLane);
  }

  function pauseGame() {
    if (!state.running) {
      return;
    }

    if (!state.paused) {
      state.paused = true;
      pauseLane(state.demoLane);
      pauseLane(state.practiceLane);
      stopMusic();
      setFeedback(t("paused"), "");
      return;
    }

    state.paused = false;
    setFeedback(t("resumed"), "");
    playMusic();
    resumeLane(state.demoLane);
    resumeLane(state.practiceLane);
  }

  function resetGame() {
    state.running = false;
    state.paused = false;
    state.counts.correct = 0;
    state.counts.wrong = 0;
    state.counts.miss = 0;
    state.demoEvents = [];
    state.practiceEvents = [];
    state.demoLane = createLaneState("demo");
    state.practiceLane = createLaneState("practice");
    stopMusic();
    resetLaneVisual(state.demoLane);
    resetLaneVisual(state.practiceLane);
    enablePracticeChoices(false);
    updateCounters();
    renderLocale();
    persistSessions();
  }

  function dumpSession() {
    var demoRaw = localStorage.getItem("me:clio:prediction:demo:latest");
    var practiceRaw = localStorage.getItem("me:clio:prediction:practice:latest");

    if (!demoRaw && !practiceRaw) {
      setFeedback(t("noSession"), "");
      return;
    }

    try {
      var out = {
        demo: demoRaw ? JSON.parse(demoRaw) : null,
        practice: practiceRaw ? JSON.parse(practiceRaw) : null
      };
      console.log("[Clio Prediction Workshop dual-lane session]", out);
      setFeedback(t("dumped"), "");
    } catch (err) {
      setFeedback(t("parseFailed"), "feedback-bad");
    }
  }

  function bindUI() {
    var lastTouchChoiceAt = 0;

    function handleChoiceInput(btn) {
      if (btn.disabled || !state.running || state.paused) {
        return;
      }
      els.choiceBalls.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      state.practiceLane.selectedColor = btn.getAttribute("data-color");
      state.practiceLane.selectedAt = performance.now();
      playTone(520, 0.06, 0.02, "triangle");
    }

    els.choiceBalls.forEach(function (btn) {
      btn.addEventListener("touchend", function (ev) {
        lastTouchChoiceAt = performance.now();
        if (ev.cancelable) {
          ev.preventDefault();
        }
        handleChoiceInput(btn);
      }, { passive: false });

      btn.addEventListener("click", function () {
        if (performance.now() - lastTouchChoiceAt < 500) {
          return;
        }
        handleChoiceInput(btn);
      });
    });

    els.speedBar.addEventListener("input", function (ev) {
      var v = Number(ev.target.value);
      if (!Number.isFinite(v)) {
        return;
      }
      state.speedPxPerSec = v;
      els.speedValue.textContent = String(v);
      setFeedback(tf("speedMsg", v), "");
    });

    els.startBtn.addEventListener("click", startGame);
    els.pauseBtn.addEventListener("click", pauseGame);
    els.resetBtn.addEventListener("click", resetGame);
    els.dumpBtn.addEventListener("click", dumpSession);

    els.langBtn.addEventListener("click", function () {
      state.lang = state.lang === "en" ? "zh" : "en";
      renderLocale();
    });

    els.musicBtn.addEventListener("click", function () {
      state.musicEnabled = !state.musicEnabled;
      renderLocale();
      ensureAudio();
      if (state.musicEnabled && state.running && !state.paused) {
        playMusic();
      } else {
        stopMusic();
      }
    });

    els.sfxBtn.addEventListener("click", function () {
      state.sfxEnabled = !state.sfxEnabled;
      renderLocale();
      if (state.sfxEnabled) {
        ensureAudio();
      }
    });
  }

  bindUI();
  updateCounters();
  enablePracticeChoices(false);
  els.speedValue.textContent = String(state.speedPxPerSec);
  renderLocale();
  persistSessions();
})();
