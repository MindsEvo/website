(function () {
  "use strict";

  var DATA = window.CLIO_TEMPLATE_DATA;
  var bridge = window.ClioRuntimeBridge.createController(DATA.id);

  var state = {
    lang: (window.shell && window.shell.lang) || "zh",
    running: false,
    score: 0
  };

  var els = {
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn: document.getElementById("langBtn"),
    startBtn: document.getElementById("startBtn"),
    resetBtn: document.getElementById("resetBtn"),
    statusText: document.getElementById("statusText"),
    scoreLabel: document.getElementById("scoreLabel"),
    scoreValue: document.getElementById("scoreValue"),
    targetBtn: document.getElementById("targetBtn")
  };

  var TEXT = {
    zh: {
      start: "开始",
      reset: "重置",
      ready: "准备就绪",
      running: "运行中",
      paused: "已暂停（后台）",
      score: "得分"
    },
    en: {
      start: "Start",
      reset: "Reset",
      ready: "Ready",
      running: "Running",
      paused: "Paused (background)",
      score: "Score"
    }
  };

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function renderLocale() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    document.title = state.lang === "en" ? "Clio Runtime Template" : "Clio 运行时模板";
    els.titleText.textContent = DATA.title[state.lang];
    els.subtitleText.textContent = DATA.subtitle[state.lang];
    els.startBtn.textContent = t("start");
    els.resetBtn.textContent = t("reset");
    els.scoreLabel.textContent = t("score");
    els.langBtn.textContent = state.lang === "zh" ? "中文 / EN" : "EN / 中文";
  }

  function updateStatus(text) {
    els.statusText.textContent = text;
  }

  function updateScore() {
    els.scoreValue.textContent = String(state.score);
  }

  function loopTick() {
    if (!state.running) {
      return;
    }

    bridge.commitAnimationStart(els.targetBtn);
    bridge.nextFrame(function () {
      els.targetBtn.classList.add("pop");
      setTimeout(function () {
        els.targetBtn.classList.remove("pop");
      }, 120);
    }, 2);

    bridge.setTimer("tick", 1200, loopTick);
  }

  function start() {
    bridge.resetSession();
    bridge.clearTimers();
    state.running = true;
    updateStatus(t("running"));
    bridge.setTimer("tick", 400, loopTick);
  }

  function reset() {
    state.running = false;
    state.score = 0;
    bridge.resetSession();
    bridge.clearTimers();
    updateStatus(t("ready"));
    updateScore();
  }

  function bootstrap() {
    renderLocale();
    updateStatus(t("ready"));
    updateScore();

    bridge.bindTap(els.targetBtn, function () {
      if (!state.running) return;
      state.score += 1;
      updateScore();
    });

    bridge.bindTap(els.startBtn, start);
    bridge.bindTap(els.resetBtn, reset);
    bridge.bindTap(els.langBtn, function () {
      state.lang = state.lang === "zh" ? "en" : "zh";
      if (window.shell) {
        window.shell.setLang(state.lang);
      }
      renderLocale();
      updateStatus(state.running ? t("running") : t("ready"));
    });

    bridge.onLifecyclePause(function () {
      if (!state.running) return;
      state.running = false;
      bridge.clearTimers();
      updateStatus(t("paused"));
    });
  }

  bootstrap();
})();
