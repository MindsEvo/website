(function () {
  "use strict";

  var COLORS = {
    purple: "#a855f7",
    orange: "#f97316",
    green: "#22c55e"
  };

  var state = {
    running: false,
    paused: false,
    sessionToken: 0,
    nextId: 1,
    fallers: [],
    spawnTimer: null,
    rafId: null,
    speedPxPerSec: 92,
    spawnEveryMs: 1200,
    counts: {
      correct: 0,
      wrong: 0,
      miss: 0
    },
    events: [],
    activeDrag: null,
    maxConcurrentFallers: 1,
    lang: "en",
    musicEnabled: true,
    sfxEnabled: true,
    audioCtx: null,
    musicTimer: null,
    musicNodes: []
  };

  var runtimeCtrl = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController("clio-sorting-workshop")
    : null;

  var els = {
    playfield: document.getElementById("playfield"),
    basketsWrap: document.getElementById("baskets"),
    baskets: Array.prototype.slice.call(document.querySelectorAll(".basket")),
    correctCount: document.getElementById("correctCount"),
    wrongCount: document.getElementById("wrongCount"),
    missCount: document.getElementById("missCount"),
    feedbackText: document.getElementById("feedbackText"),
    startBtn: document.getElementById("startBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    resetBtn: document.getElementById("resetBtn"),
    dumpBtn: document.getElementById("dumpBtn"),
    speedBar: document.getElementById("speedBar"),
    speedValue: document.getElementById("speedValue"),
    speedUnit: document.getElementById("speedUnit"),
    speedTitle: document.getElementById("speedTitle"),
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    logTitle: document.getElementById("logTitle"),
    correctLabel: document.getElementById("correctLabel"),
    wrongLabel: document.getElementById("wrongLabel"),
    missLabel: document.getElementById("missLabel"),
    langBtn: document.getElementById("langBtn"),
    musicBtn: document.getElementById("musicBtn"),
    sfxBtn: document.getElementById("sfxBtn")
  };

  var TEXT = {
    en: {
      title: "Sorting Workshop",
      subtitle: "Clio MVP · classify falling colors into baskets",
      logTitle: "Latest Feedback",
      correct: "Correct",
      wrong: "Wrong",
      miss: "Miss",
      speed: "Speed",
      unit: "px/s",
      start: "Start",
      pause: "Pause",
      reset: "Reset",
      dump: "Dump Session JSON",
      pressStart: "Press Start",
      running: "Running",
      paused: "Paused",
      resumed: "Resumed",
      dragging: "Dragging {0}...",
      speedMsg: "Speed: {0} px/s",
      dropLane: "Drop into a basket lane",
      sessionDumped: "Session dumped to DevTools console",
      noSession: "No session in localStorage",
      parseFailed: "Session parse failed",
      on: "On",
      off: "Off",
      music: "Music",
      sfx: "SFX",
      turnZh: "中文",
      turnEn: "EN",
      basketNames: { purple: "Purple", orange: "Orange", green: "Green" }
    },
    zh: {
      title: "分拣工坊",
      subtitle: "Clio MVP · 将下落颜色拖入对应篮子",
      logTitle: "最新反馈",
      correct: "正确",
      wrong: "错误",
      miss: "错过",
      speed: "速度",
      unit: "像素/秒",
      start: "开始",
      pause: "暂停",
      reset: "重置",
      dump: "导出会话 JSON",
      pressStart: "点击开始",
      running: "运行中",
      paused: "已暂停",
      resumed: "继续运行",
      dragging: "正在拖动 {0}...",
      speedMsg: "速度：{0} 像素/秒",
      dropLane: "拖到篮子区域即可",
      sessionDumped: "会话已输出到 DevTools 控制台",
      noSession: "localStorage 中没有会话",
      parseFailed: "会话解析失败",
      on: "开",
      off: "关",
      music: "音乐",
      sfx: "音效",
      turnZh: "中文",
      turnEn: "EN",
      basketNames: { purple: "紫色", orange: "橙色", green: "绿色" }
    }
  };

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function tf(key, value) {
    return t(key).replace("{0}", value);
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
      gain.gain.value = 0.025;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
      state.musicNodes.push(osc);
      index += 1;
    }, 320);
  }

  function stopIfIdle() {
    if (!state.running) {
      stopMusic();
    }
  }

  function refreshLocale() {
    els.titleText.textContent = t("title");
    els.subtitleText.textContent = t("subtitle");
    els.logTitle.textContent = t("logTitle");
    els.correctLabel.textContent = t("correct");
    els.wrongLabel.textContent = t("wrong");
    els.missLabel.textContent = t("miss");
    els.speedTitle.textContent = t("speed");
    els.speedUnit.textContent = t("unit");
    els.startBtn.textContent = t("start");
    els.pauseBtn.textContent = t("pause");
    els.resetBtn.textContent = t("reset");
    els.dumpBtn.textContent = t("dump");
    if (!state.running && state.counts.correct === 0 && state.counts.wrong === 0 && state.counts.miss === 0) {
      setFeedback(t("pressStart"), "");
    }
    els.baskets.forEach(function (basket) {
      var color = basket.getAttribute("data-color");
      var label = basket.querySelector(".basket-label");
      if (label) {
        label.textContent = t("basketNames")[color];
      }
    });
    els.langBtn.textContent = state.lang === "zh" ? "中文" : "EN";
    els.langBtn.classList.toggle("active", state.lang === "zh");
    els.musicBtn.textContent = t("music") + ": " + (state.musicEnabled ? t("on") : t("off"));
    els.sfxBtn.textContent = t("sfx") + ": " + (state.sfxEnabled ? t("on") : t("off"));
  }

  function nowMs() {
    return Date.now();
  }

  function randomColorKey() {
    var keys = Object.keys(COLORS);
    var idx = Math.floor(Math.random() * keys.length);
    return keys[idx];
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
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

  function persistSession() {
    var payload = {
      game_id: "clio-sorting-workshop-mvp",
      ts: new Date().toISOString(),
      counts: state.counts,
      events: state.events
    };
    localStorage.setItem("me:clio:sorting:mvp:latest", JSON.stringify(payload));
  }

  function pushEvent(eventObj) {
    state.events.push(eventObj);
    persistSession();
  }

  function getPlayfieldRect() {
    return els.playfield.getBoundingClientRect();
  }

  function clearSpawnTimer() {
    if (runtimeCtrl) {
      runtimeCtrl.clearTimer("spawn");
      state.spawnTimer = null;
      return;
    }
    if (state.spawnTimer) {
      window.clearTimeout(state.spawnTimer);
      state.spawnTimer = null;
    }
  }

  function scheduleSpawnLoop(expectedSessionToken) {
    if (!state.running || state.paused) {
      return;
    }
    if (expectedSessionToken !== state.sessionToken) {
      return;
    }

    if (runtimeCtrl) {
      runtimeCtrl.setTimer("spawn", state.spawnEveryMs, function () {
        if (!state.running || state.paused || expectedSessionToken !== state.sessionToken) {
          return;
        }
        spawnFaller();
        scheduleSpawnLoop(expectedSessionToken);
      });
      state.spawnTimer = 1;
      return;
    }

    state.spawnTimer = window.setTimeout(function () {
      if (!state.running || state.paused || expectedSessionToken !== state.sessionToken) {
        return;
      }
      spawnFaller();
      scheduleSpawnLoop(expectedSessionToken);
    }, state.spawnEveryMs);
  }

  function spawnFaller() {
    if (!state.running || state.paused) {
      return;
    }

    var activeCount = state.fallers.filter(function (f) {
      return !f.removed;
    }).length;
    if (activeCount >= state.maxConcurrentFallers) {
      return;
    }

    var rect = getPlayfieldRect();
    var id = "obj-" + state.nextId++;
    var colorKey = randomColorKey();
    var size = 48;
    var x = Math.random() * (rect.width - size);

    var el = document.createElement("div");
    el.className = "faller";
    el.style.background = COLORS[colorKey];
    el.style.left = x + "px";
    el.style.top = "0px";
    el.setAttribute("data-id", id);

    var faller = {
      id: id,
      color: colorKey,
      shape: "circle",
      x: x,
      y: 0,
      w: size,
      h: size,
      bornAt: nowMs(),
      dragging: false,
      dragPointerId: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      touched: false,
      removed: false,
      el: el
    };

    wireDrag(faller);

    state.fallers.push(faller);
    els.playfield.appendChild(el);
  }

  function removeFaller(faller) {
    if (faller.removed) {
      return;
    }
    faller.removed = true;
    if (faller.el && faller.el.parentNode) {
      faller.el.parentNode.removeChild(faller.el);
    }
  }

  function basketAtClientPoint(clientX, clientY) {
    var i;
    var candidate = null;
    var nearestDist = Number.POSITIVE_INFINITY;

    for (i = 0; i < els.baskets.length; i++) {
      var basket = els.baskets[i];
      var r = basket.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return basket;
      }

      // Fallback: if released in basket lane zone, map by nearest basket center.
      var basketZoneTop = r.top - 18;
      var basketZoneBottom = r.bottom + 40;
      if (clientY >= basketZoneTop && clientY <= basketZoneBottom) {
        var centerX = r.left + r.width / 2;
        var dist = Math.abs(clientX - centerX);
        if (dist < nearestDist) {
          nearestDist = dist;
          candidate = basket;
        }
      }
    }

    if (candidate) {
      return candidate;
    }

    return null;
  }

  function basketByLane(clientX) {
    var i;
    var nearest = null;
    var nearestDist = Number.POSITIVE_INFINITY;

    for (i = 0; i < els.baskets.length; i++) {
      var basket = els.baskets[i];
      var r = basket.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) {
        return basket;
      }

      var cx = r.left + r.width / 2;
      var dist = Math.abs(clientX - cx);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = basket;
      }
    }

    return nearest;
  }

  function clearBasketHighlight() {
    els.baskets.forEach(function (b) {
      b.classList.remove("active");
      b.classList.remove("locked");
    });
  }

  function snapToBasketCenter(faller, basket) {
    var fieldRect = getPlayfieldRect();
    var basketRect = basket.getBoundingClientRect();
    var x = basketRect.left - fieldRect.left + (basketRect.width - faller.w) / 2;
    var y = basketRect.top - fieldRect.top + (basketRect.height - faller.h) / 2;

    faller.x = clamp(x, 0, fieldRect.width - faller.w);
    faller.y = clamp(y, 0, fieldRect.height - faller.h);
    faller.el.style.left = faller.x + "px";
    faller.el.style.top = faller.y + "px";
  }

  function onDrop(faller, basket) {
    var actual = basket ? basket.getAttribute("data-color") : null;
    var expected = faller.color;
    var rt = nowMs() - faller.bornAt;

    if (!actual) {
      return;
    }

    if (actual === expected) {
      snapToBasketCenter(faller, basket);
      state.counts.correct += 1;
      setFeedback((state.lang === "zh" ? "正确：" : "Correct: ") + (state.lang === "zh" ? t("basketNames")[expected] : expected), "feedback-ok");
      pushEvent({
        object_id: faller.id,
        object_color: expected,
        object_shape: "circle",
        target_basket: expected,
        actual_basket: actual,
        result: "correct",
        reaction_time_ms: rt,
        difficulty_dimension: {
          category_count: 3,
          speed_level: "L1",
          distractor_type: "boundary_color"
        }
      });
        playTone(880, 0.15, 0.16, "sine");
      removeFaller(faller);
    } else {
      snapToBasketCenter(faller, basket);
      state.counts.wrong += 1;
      setFeedback(
        state.lang === "zh"
          ? ("错误：应为" + t("basketNames")[expected] + "，实际是" + t("basketNames")[actual])
          : ("Wrong: expected " + expected + ", got " + actual),
        "feedback-bad"
      );
      pushEvent({
        object_id: faller.id,
        object_color: expected,
        object_shape: "circle",
        target_basket: expected,
        actual_basket: actual,
        result: "wrong",
        reaction_time_ms: rt,
        difficulty_dimension: {
          category_count: 3,
          speed_level: "L1",
          distractor_type: "boundary_color"
        }
      });
      playTone(200, 0.20, 0.15, "sawtooth");
      removeFaller(faller);
    }

    updateCounters();
  }

  function cleanupActiveDrag() {
    if (!state.activeDrag) {
      return;
    }
    var drag = state.activeDrag;
    drag.faller.dragging = false;
    drag.faller.dragPointerId = null;
    if (drag.faller.el) {
      drag.faller.el.classList.remove("dragging");
    }
    clearBasketHighlight();
    state.activeDrag = null;
  }

  function handleGlobalPointerMove(ev) {
    if (!state.activeDrag) {
      return;
    }
    var faller = state.activeDrag.faller;
    if (faller.removed || state.paused || !state.running) {
      cleanupActiveDrag();
      return;
    }
    if (state.activeDrag.pointerId !== ev.pointerId) {
      return;
    }

    var fieldRect = getPlayfieldRect();
    var x = ev.clientX - fieldRect.left - faller.dragOffsetX;
    var y = ev.clientY - fieldRect.top - faller.dragOffsetY;

    faller.x = clamp(x, 0, fieldRect.width - faller.w);
    faller.y = clamp(y, 0, fieldRect.height - faller.h);

    faller.el.style.left = faller.x + "px";
    faller.el.style.top = faller.y + "px";

    clearBasketHighlight();
    var target = basketByLane(ev.clientX);

    state.activeDrag.hoverBasket = target || null;
    if (target) {
      target.classList.add("active");
      target.classList.add("locked");
    }
  }

  function handleGlobalPointerUp(ev) {
    if (!state.activeDrag) {
      return;
    }
    if (state.activeDrag.pointerId !== ev.pointerId) {
      return;
    }

    var faller = state.activeDrag.faller;
    var droppedBasket = state.activeDrag.hoverBasket || basketByLane(ev.clientX);

    cleanupActiveDrag();

    if (!faller.removed) {
      onDrop(faller, droppedBasket);
      if (!droppedBasket) {
        setFeedback(t("dropLane"), "feedback-miss");
      }
    }
  }

  function wireDrag(faller) {
    var el = faller.el;

    el.addEventListener("pointerdown", function (ev) {
      if (!state.running || state.paused || faller.removed) {
        return;
      }

      ev.preventDefault();
      cleanupActiveDrag();
      faller.dragging = true;
      faller.touched = true;
      faller.dragPointerId = ev.pointerId;
      el.classList.add("dragging");
      state.activeDrag = {
        faller: faller,
        pointerId: ev.pointerId,
        hoverBasket: null
      };

      var rect = el.getBoundingClientRect();
      faller.dragOffsetX = ev.clientX - rect.left;
      faller.dragOffsetY = ev.clientY - rect.top;
      setFeedback(tf("dragging", state.lang === "zh" ? t("basketNames")[faller.color] : faller.color), "");
    });
  }

  function updateLoop(lastTs, expectedSessionToken) {
    if (!state.running || expectedSessionToken !== state.sessionToken) {
      return;
    }

    var now = performance.now();
    var dtMs = now - lastTs;
    var dt = dtMs / 1000;

    var fieldRect = getPlayfieldRect();

    state.fallers = state.fallers.filter(function (faller) {
      if (faller.removed) {
        return false;
      }

      if (!state.paused && !faller.dragging) {
        faller.y += state.speedPxPerSec * dt;
        faller.el.style.top = faller.y + "px";
      }

      if (faller.y + faller.h >= fieldRect.height) {
        if (faller.touched) {
          var rr = faller.el.getBoundingClientRect();
          var autoBasket = basketByLane(rr.left + rr.width / 2);
          onDrop(faller, autoBasket);
          return false;
        }

        state.counts.miss += 1;
        setFeedback(
          state.lang === "zh"
            ? ("错过：" + t("basketNames")[faller.color])
            : ("Miss: " + faller.color),
          "feedback-miss"
        );
        pushEvent({
          object_id: faller.id,
          object_color: faller.color,
          object_shape: "circle",
          target_basket: faller.color,
          actual_basket: null,
          result: "miss",
          reaction_time_ms: nowMs() - faller.bornAt,
          difficulty_dimension: {
            category_count: 3,
            speed_level: "L1",
            distractor_type: "boundary_color"
          }
        });
        playTone(180, 0.22, 0.14, "square");
        removeFaller(faller);
        updateCounters();
        return false;
      }

      return true;
    });

    state.rafId = window.requestAnimationFrame(function () {
      updateLoop(now, expectedSessionToken);
    });
  }

  function startGame() {
    if (state.running) {
      state.paused = false;
      setFeedback(t("resumed"), "");
      scheduleSpawnLoop(state.sessionToken);
      playMusic();
      return;
    }

    state.sessionToken = runtimeCtrl ? runtimeCtrl.resetSession() : (state.sessionToken + 1);
    state.running = true;
    state.paused = false;
    setFeedback(t("running"), "");

    spawnFaller();
    scheduleSpawnLoop(state.sessionToken);
    state.rafId = window.requestAnimationFrame(function (ts) {
      updateLoop(ts, state.sessionToken);
    });
    playMusic();
  }

  function pauseGame() {
    if (!state.running) {
      return;
    }
    state.paused = !state.paused;
    setFeedback(state.paused ? t("paused") : t("resumed"), "");
    if (state.paused) {
      clearSpawnTimer();
      stopMusic();
    } else {
      scheduleSpawnLoop(state.sessionToken);
      playMusic();
    }
  }

  function resetGame() {
    state.sessionToken = runtimeCtrl ? runtimeCtrl.resetSession() : (state.sessionToken + 1);
    state.running = false;
    state.paused = false;
    cleanupActiveDrag();

    clearSpawnTimer();
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    state.fallers.forEach(function (f) {
      removeFaller(f);
    });

    state.fallers = [];
    state.counts.correct = 0;
    state.counts.wrong = 0;
    state.counts.miss = 0;
    state.events = [];
    updateCounters();
    setFeedback(t("pressStart"), "");
    stopMusic();
    persistSession();
  }

  function dumpSession() {
    var raw = localStorage.getItem("me:clio:sorting:mvp:latest");
    if (!raw) {
      setFeedback(t("noSession"), "");
      return;
    }

    try {
      var data = JSON.parse(raw);
      console.log("[Clio MVP session]", data);
      setFeedback(t("sessionDumped"), "");
    } catch (e) {
      setFeedback(t("parseFailed"), "feedback-bad");
    }
  }

  function bindUI() {
    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.startBtn, startGame);
      runtimeCtrl.bindTap(els.pauseBtn, pauseGame);
      runtimeCtrl.bindTap(els.resetBtn, resetGame);
      runtimeCtrl.bindTap(els.dumpBtn, dumpSession);
    } else {
      els.startBtn.addEventListener("click", startGame);
      els.pauseBtn.addEventListener("click", pauseGame);
      els.resetBtn.addEventListener("click", resetGame);
      els.dumpBtn.addEventListener("click", dumpSession);
    }

    els.speedBar.addEventListener("input", function (ev) {
      var v = Number(ev.target.value);
      if (!Number.isFinite(v)) {
        return;
      }
      state.speedPxPerSec = v;
      els.speedValue.textContent = String(v);
      setFeedback(tf("speedMsg", v), "");
    });

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.langBtn, function () {
        state.lang = state.lang === "zh" ? "en" : "zh";
        refreshLocale();
      });
    } else {
      els.langBtn.addEventListener("click", function () {
        state.lang = state.lang === "zh" ? "en" : "zh";
        refreshLocale();
      });
    }

    var onMusicTap = function () {
      state.musicEnabled = !state.musicEnabled;
      refreshLocale();
      if (state.musicEnabled && state.running && !state.paused) {
        playMusic();
      } else {
        stopMusic();
      }
    };

    var onSfxTap = function () {
      state.sfxEnabled = !state.sfxEnabled;
      refreshLocale();
      if (state.sfxEnabled) {
        ensureAudio();
      }
    };

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.musicBtn, onMusicTap);
      runtimeCtrl.bindTap(els.sfxBtn, onSfxTap);
      runtimeCtrl.onLifecyclePause(function () {
        if (state.running && !state.paused) {
          pauseGame();
        }
      });
    } else {
      els.musicBtn.addEventListener("click", onMusicTap);
      els.sfxBtn.addEventListener("click", onSfxTap);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden && state.running && !state.paused) {
          pauseGame();
        }
      });
    }

    document.addEventListener("pointermove", handleGlobalPointerMove);
    document.addEventListener("pointerup", handleGlobalPointerUp);
    document.addEventListener("pointercancel", handleGlobalPointerUp);
  }

  bindUI();
  updateCounters();
  refreshLocale();
  persistSession();
})();
