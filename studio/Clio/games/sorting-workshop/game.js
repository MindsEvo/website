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
    maxConcurrentFallers: 1
  };

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
    speedValue: document.getElementById("speedValue")
  };

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
      setFeedback("Correct: " + expected, "feedback-ok");
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
      removeFaller(faller);
    } else {
      snapToBasketCenter(faller, basket);
      state.counts.wrong += 1;
      setFeedback("Wrong: expected " + expected + ", got " + actual, "feedback-bad");
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
        setFeedback("Drop into a basket lane", "feedback-miss");
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
      setFeedback("Dragging " + faller.color + "...", "");
    });
  }

  function updateLoop(lastTs) {
    if (!state.running) {
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
        setFeedback("Miss: " + faller.color, "feedback-miss");
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
        removeFaller(faller);
        updateCounters();
        return false;
      }

      return true;
    });

    state.rafId = window.requestAnimationFrame(function () {
      updateLoop(now);
    });
  }

  function startGame() {
    if (state.running) {
      state.paused = false;
      setFeedback("Resumed", "");
      return;
    }

    state.running = true;
    state.paused = false;
    setFeedback("Running", "");

    spawnFaller();
    state.spawnTimer = window.setInterval(spawnFaller, state.spawnEveryMs);
    state.rafId = window.requestAnimationFrame(function (ts) {
      updateLoop(ts);
    });
  }

  function pauseGame() {
    if (!state.running) {
      return;
    }
    state.paused = !state.paused;
    setFeedback(state.paused ? "Paused" : "Resumed", "");
  }

  function resetGame() {
    state.running = false;
    state.paused = false;
    cleanupActiveDrag();

    if (state.spawnTimer) {
      window.clearInterval(state.spawnTimer);
      state.spawnTimer = null;
    }
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
    setFeedback("Reset complete", "");
    persistSession();
  }

  function dumpSession() {
    var raw = localStorage.getItem("me:clio:sorting:mvp:latest");
    if (!raw) {
      setFeedback("No session in localStorage", "");
      return;
    }

    try {
      var data = JSON.parse(raw);
      console.log("[Clio MVP session]", data);
      setFeedback("Session dumped to DevTools console", "");
    } catch (e) {
      setFeedback("Session parse failed", "feedback-bad");
    }
  }

  function bindUI() {
    els.startBtn.addEventListener("click", startGame);
    els.pauseBtn.addEventListener("click", pauseGame);
    els.resetBtn.addEventListener("click", resetGame);
    els.dumpBtn.addEventListener("click", dumpSession);

    els.speedBar.addEventListener("input", function (ev) {
      var v = Number(ev.target.value);
      if (!Number.isFinite(v)) {
        return;
      }
      state.speedPxPerSec = v;
      els.speedValue.textContent = String(v);
      setFeedback("Speed: " + v + " px/s", "");
    });

    document.addEventListener("pointermove", handleGlobalPointerMove);
    document.addEventListener("pointerup", handleGlobalPointerUp);
    document.addEventListener("pointercancel", handleGlobalPointerUp);
  }

  bindUI();
  updateCounters();
  persistSession();
})();
