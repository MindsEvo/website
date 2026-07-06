(function () {
  "use strict";

  var DATA = window.CLIO_FIND_IT_DATA;

  var TEXT = {
    zh: {
      title: "寻找游戏 Find It",
      subtitle: "目标可重复出现，不给具体数量；持续点击正确目标直到全部找完。",
      speak: "朗读目标",
      music: "音乐",
      sfx: "音效",
      on: "开",
      off: "关",
      found: "目标状态",
      progressSearching: "寻找中",
      progressDone: "已完成",
      mistake: "误点",
      doneCount: "完成次数",
      targetTitle: "目标清单",
      firstHint: "任意点击目标物品开始寻找，找对为止。",
      hit: "找到了：{0}",
      miss: "这个不是当前目标，继续找。",
      done: "全部找到啦！",
      again: "再来一局",
      reset: "重置本局",
      dump: "导出简要状态",
      dumped: "简要状态已输出到 DevTools 控制台"
    },
    en: {
      title: "Find It",
      subtitle: "Targets may repeat and no exact count is shown; keep finding correct targets until all are cleared.",
      speak: "Read Targets",
      music: "Music",
      sfx: "SFX",
      on: "On",
      off: "Off",
      found: "Status",
      progressSearching: "Searching",
      progressDone: "Completed",
      mistake: "Miss Clicks",
      doneCount: "Completed",
      targetTitle: "Target List",
      firstHint: "Tap any target item to begin. Keep finding correct targets.",
      hit: "Found: {0}",
      miss: "Not a current target. Keep searching.",
      done: "All found!",
      again: "Play Again",
      reset: "Reset Round",
      dump: "Dump Summary",
      dumped: "Summary dumped to DevTools console"
    }
  };

  var state = {
    lang: "zh",
    items: [],
    targets: [],
    missCount: 0,
    completedCount: 0,
    sfxEnabled: true,
    musicEnabled: true,
    audioCtx: null,
    musicTimer: null,
    musicNodes: []
  };

  var runtimeCtrl = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController("clio-find-it-workshop")
    : null;

  var els = {
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn: document.getElementById("langBtn"),
    speakBtn: document.getElementById("speakBtn"),
    musicBtn: document.getElementById("musicBtn"),
    sfxBtn: document.getElementById("sfxBtn"),
    foundLabel: document.getElementById("foundLabel"),
    progressText: document.getElementById("progressText"),
    mistakeLabel: document.getElementById("mistakeLabel"),
    doneLabel: document.getElementById("doneLabel"),
    mistakeCount: document.getElementById("mistakeCount"),
    doneCount: document.getElementById("doneCount"),
    targetTitle: document.getElementById("targetTitle"),
    targets: document.getElementById("targets"),
    feedback: document.getElementById("feedback"),
    boardWrap: document.getElementById("boardWrap"),
    board: document.getElementById("board"),
    doneLayer: document.getElementById("doneLayer"),
    doneTitle: document.getElementById("doneTitle"),
    againBtn: document.getElementById("againBtn"),
    resetBtn: document.getElementById("resetBtn"),
    dumpBtn: document.getElementById("dumpBtn")
  };

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function tf(key, value) {
    return t(key).replace("{0}", value || "");
  }

  function labelOf(item) {
    return state.lang === "en" ? item.en : item.zh;
  }

  function shuffle(list) {
    var arr = list.slice();
    var i;
    for (i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function sample(list, count) {
    return shuffle(list).slice(0, Math.min(count, list.length));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

    var seq = [392.0, 440.0, 523.25, 440.0, 392.0, 329.63];
    var idx = 0;
    state.musicTimer = window.setInterval(function () {
      if (!state.musicEnabled) {
        return;
      }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = seq[idx % seq.length];
      gain.gain.value = 0.018;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      state.musicNodes.push(osc);
      idx += 1;
    }, 360);
  }

  function speakTargets() {
    if (!window.speechSynthesis) {
      return;
    }
    var text = state.targets.map(function (item) {
      return state.lang === "en" ? item.en : item.zh;
    }).join(state.lang === "en" ? ", " : "，");
    if (!text) {
      return;
    }
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = state.lang === "en" ? "en-US" : "zh-CN";
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function setFeedback(text, cls) {
    els.feedback.className = "feedback" + (cls ? (" " + cls) : "");
    els.feedback.textContent = text;
  }

  function saveCompletionStatus() {
    var payload = {
      completedCount: state.completedCount,
      lastCompletedAt: new Date().toISOString(),
      finished: true,
      targets: state.targets.map(function (it) { return it.id; })
    };
    localStorage.setItem("me:clio:find-it:status", JSON.stringify(payload));
  }

  function loadCompletionStatus() {
    var raw = localStorage.getItem("me:clio:find-it:status");
    if (!raw) {
      return;
    }
    try {
      var parsed = JSON.parse(raw);
      state.completedCount = Number(parsed.completedCount || 0);
    } catch (e) {
      state.completedCount = 0;
    }
  }

  function refreshHud() {
    els.progressText.textContent = checkDone() ? t("progressDone") : t("progressSearching");
    els.mistakeCount.textContent = String(state.missCount);
    els.doneCount.textContent = String(state.completedCount);
  }

  function buildRound() {
    var pool = DATA.object_pool;
    var targets = sample(pool, DATA.target_type_count);
    var targetMap = Object.create(null);
    targets.forEach(function (item) { targetMap[item.id] = true; });

    var targetInstances = [];
    targets.forEach(function (item) {
      var repeatCount = randInt(DATA.target_repeat_min, DATA.target_repeat_max);
      var i;
      for (i = 0; i < repeatCount; i += 1) {
        targetInstances.push(item);
      }
    });

    var nonTargets = sample(pool.filter(function (item) {
      return !targetMap[item.id];
    }), Math.max(0, DATA.total_count - targetInstances.length));

    state.targets = targets;
    state.items = shuffle(targetInstances.concat(nonTargets)).map(function (item, index) {
      return {
        uid: "it-" + index + "-" + item.id,
        id: item.id,
        emoji: item.emoji,
        en: item.en,
        zh: item.zh,
        target: !!targetMap[item.id],
        found: false,
        x: 0,
        y: 0
      };
    });
    state.missCount = 0;
  }

  function placeItems() {
    var placed = [];
    var rect = els.board.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    var size = 84;
    var pad = 14;
    var maxX = Math.max(pad, w - size - pad);
    var maxY = Math.max(pad, h - size - pad);

    state.items.forEach(function (item) {
      var tries;
      var minDist = DATA.min_distance;
      var done = false;
      for (tries = 0; tries < 140; tries += 1) {
        var x = pad + Math.random() * Math.max(1, maxX - pad);
        var y = pad + Math.random() * Math.max(1, maxY - pad);
        var cx = x + size / 2;
        var cy = y + size / 2;
        var ok = placed.every(function (p) {
          var dx = cx - p.cx;
          var dy = cy - p.cy;
          return Math.sqrt(dx * dx + dy * dy) >= minDist;
        });
        if (ok) {
          item.x = x;
          item.y = y;
          placed.push({ cx: cx, cy: cy });
          done = true;
          break;
        }
        if (tries > 0 && tries % 35 === 0) {
          minDist = Math.max(44, minDist - 8);
        }
      }
      if (!done) {
        item.x = pad + Math.random() * Math.max(1, maxX - pad);
        item.y = pad + Math.random() * Math.max(1, maxY - pad);
        placed.push({ cx: item.x + size / 2, cy: item.y + size / 2 });
      }
    });
  }

  function renderTargets() {
    els.targets.innerHTML = "";
    state.targets.forEach(function (item) {
      var typeDone = state.items.every(function (it) {
        return it.id !== item.id || !it.target || it.found;
      });
      var chip = document.createElement("div");
      chip.className = "target-item" + (typeDone ? " done" : "");
      chip.textContent = (typeDone ? "✓ " : "☐ ") + item.emoji + " " + labelOf(item);
      els.targets.appendChild(chip);
    });
  }

  function createItemNode(item) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item" + (item.found ? " found" : "");
    btn.style.left = item.x + "px";
    btn.style.top = item.y + "px";
    btn.dataset.uid = item.uid;

    var emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.textContent = item.emoji;

    var name = document.createElement("div");
    name.className = "name";
    name.textContent = labelOf(item);

    btn.appendChild(emoji);
    btn.appendChild(name);

    var onTap = function () {
      onItemTap(item, btn);
    };

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(btn, onTap);
    } else {
      btn.addEventListener("click", onTap);
    }

    return btn;
  }

  function renderBoard() {
    els.board.innerHTML = "";
    state.items.forEach(function (item) {
      els.board.appendChild(createItemNode(item));
    });
  }

  function checkDone() {
    return !state.items.some(function (item) {
      return item.target && !item.found;
    });
  }

  function showDone() {
    state.completedCount += 1;
    saveCompletionStatus();
    refreshHud();
    els.doneLayer.classList.add("show");
    els.doneLayer.setAttribute("aria-hidden", "false");
    setFeedback(t("done"), "ok");
    playTone(523, 0.1, 0.16, "sine");
    playTone(659, 0.12, 0.16, "sine");
    playTone(784, 0.16, 0.16, "sine");
  }

  function onItemTap(item, node) {
    if (item.found || els.doneLayer.classList.contains("show")) {
      return;
    }

    if (item.target) {
      item.found = true;
      node.classList.add("target-hit");
      playTone(880, 0.13, 0.16, "triangle");
      setFeedback(tf("hit", labelOf(item)), "ok");
      runtimeCtrl ? runtimeCtrl.setTimer("hide-" + item.uid, 220, function () {
        node.classList.add("found");
      }) : setTimeout(function () { node.classList.add("found"); }, 220);
      renderTargets();
      refreshHud();
      if (checkDone()) {
        showDone();
      }
      return;
    }

    state.missCount += 1;
    refreshHud();
    setFeedback(t("miss"), "bad");
    playTone(180, 0.16, 0.14, "sawtooth");
    els.board.classList.remove("shake");
    void els.board.offsetHeight;
    els.board.classList.add("shake");
  }

  function resetRound() {
    if (runtimeCtrl) {
      runtimeCtrl.resetSession();
      runtimeCtrl.clearTimers();
    }
    els.doneLayer.classList.remove("show");
    els.doneLayer.setAttribute("aria-hidden", "true");
    buildRound();
    placeItems();
    renderTargets();
    renderBoard();
    refreshHud();
    setFeedback(t("firstHint"), "");
  }

  function exportSummary() {
    var payload = {
      game_id: "clio-find-it-workshop",
      content_version: DATA.content_version,
      completed: checkDone(),
      completed_count: state.completedCount,
      remaining_target_instances: state.items.filter(function (item) { return item.target && !item.found; }).length,
      target_type_count: state.targets.length,
      miss_count: state.missCount,
      targets: state.targets.map(function (it) { return it.id; }),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("me:clio:find-it:latest", JSON.stringify(payload));
    console.log("Find It Summary:", payload);
    setFeedback(t("dumped"), "");
  }

  function applyLocale() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    document.title = state.lang === "en" ? "Find It | Clio" : "寻找游戏 Find It | Clio";
    els.titleText.textContent = t("title");
    els.subtitleText.textContent = t("subtitle");
    els.speakBtn.textContent = t("speak");
    els.musicBtn.textContent = t("music") + ": " + (state.musicEnabled ? t("on") : t("off"));
    els.sfxBtn.textContent = t("sfx") + ": " + (state.sfxEnabled ? t("on") : t("off"));
    els.foundLabel.textContent = t("found");
    els.mistakeLabel.textContent = t("mistake");
    els.doneLabel.textContent = t("doneCount");
    els.targetTitle.textContent = t("targetTitle");
    els.doneTitle.textContent = t("done");
    els.againBtn.textContent = t("again");
    els.resetBtn.textContent = t("reset");
    els.dumpBtn.textContent = t("dump");
    els.langBtn.textContent = state.lang === "zh" ? "中文 / EN" : "EN / 中文";
    renderTargets();
    renderBoard();
  }

  function bootstrap() {
    if (runtimeCtrl) {
      runtimeCtrl.resetSession();
    }

    var savedLang = localStorage.getItem("clio-games-lang");
    if (savedLang === "en" || savedLang === "zh") {
      state.lang = savedLang;
    }

    state.sfxEnabled = localStorage.getItem("clio-find-it-sfx") !== "off";
    state.musicEnabled = localStorage.getItem("clio-find-it-music") !== "off";

    loadCompletionStatus();
    resetRound();
    applyLocale();
    ensureAudio();
    if (state.musicEnabled) {
      playMusic();
    }

    var onLangTap = function () {
      state.lang = state.lang === "zh" ? "en" : "zh";
      localStorage.setItem("clio-games-lang", state.lang);
      applyLocale();
      setFeedback(t("firstHint"), "");
    };

    var onSpeakTap = function () {
      speakTargets();
    };

    var onMusicTap = function () {
      state.musicEnabled = !state.musicEnabled;
      localStorage.setItem("clio-find-it-music", state.musicEnabled ? "on" : "off");
      applyLocale();
      if (state.musicEnabled) {
        playMusic();
      } else {
        stopMusic();
      }
    };

    var onSfxTap = function () {
      state.sfxEnabled = !state.sfxEnabled;
      localStorage.setItem("clio-find-it-sfx", state.sfxEnabled ? "on" : "off");
      applyLocale();
      if (state.sfxEnabled) {
        ensureAudio();
      }
    };

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.langBtn, onLangTap);
      runtimeCtrl.bindTap(els.speakBtn, onSpeakTap);
      runtimeCtrl.bindTap(els.musicBtn, onMusicTap);
      runtimeCtrl.bindTap(els.sfxBtn, onSfxTap);
      runtimeCtrl.bindTap(els.againBtn, resetRound);
      runtimeCtrl.bindTap(els.resetBtn, resetRound);
      runtimeCtrl.bindTap(els.dumpBtn, exportSummary);
      runtimeCtrl.onLifecyclePause(function () {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      });
    } else {
      els.langBtn.addEventListener("click", onLangTap);
      els.speakBtn.addEventListener("click", onSpeakTap);
      els.musicBtn.addEventListener("click", onMusicTap);
      els.sfxBtn.addEventListener("click", onSfxTap);
      els.againBtn.addEventListener("click", resetRound);
      els.resetBtn.addEventListener("click", resetRound);
      els.dumpBtn.addEventListener("click", exportSummary);
    }

    window.addEventListener("resize", function () {
      placeItems();
      renderBoard();
    });
  }

  bootstrap();
})();
