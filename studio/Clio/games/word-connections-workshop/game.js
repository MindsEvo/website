(function () {
  "use strict";

  var DATA = window.WORD_MATCH_DATA;

  var TEXT = {
    zh: {
      title: "连线组词 Word Match",
      subtitle: "连接左右完全相同的词，并排除只看位置的干扰策略。",
      subtitleSemantic: "连接意义明确的同义词或反义词配对。",
      level: "难度",
      undo: "撤销一步",
      reset: "重置",
      dump: "导出会话 JSON",
      correct: "正确",
      wrong: "错误",
      distractor: "干扰命中",
      found: "已完成配对",
      left: "一侧词",
      right: "另一侧词",
      legendMatch: "相同词正确连线",
      legendMatchSemantic: "同义词/反义词正确连线",
      legendDistractor: "同一侧的重复词用于位置干扰",
      legendNoDistractor: "语义关卡：无重复词干扰",
      lineHint: "提示：先点任意一个词，再点另一个完全相同的词；点击已画连线可撤销",
      lineHintSemantic: "提示：先点一个词，再点另一侧意义明确的同义词或反义词；点击已画连线可撤销",
      pickFirst: "请先选择任意一侧的词",
      pickOther: "已选择 {0}，请点另一个完全相同的词",
      pickOtherSemantic: "已选择 {0}，请点另一侧对应的同义词或反义词",
      wrongSide: "第二次需要点击另一侧的词",
      sameGroup: "同侧词不能互连",
      wrongMsg: "这两个词不完全相同，请再试一次",
      wrongSemanticMsg: "这两个词不是设定的同义词/反义词配对，请再试一次",
      correctMsg: "配对成功：{0} ↔ {1}",
      correctSemanticMsg: "语义配对成功：{0} ↔ {1}",
      removedMsg: "已撤销上一条配对",
      noUndo: "没有可撤销的配对",
      resetMsg: "已重新随机本轮词组",
      dumped: "会话已输出到 DevTools 控制台",
      doneMsg: "太棒了！本轮配对已全部完成",
      distractorHit: "已识别重复词干扰：{0} ↔ {1}"
    },
    en: {
      title: "Word Match",
      subtitle: "Match identical words across the two sides and resist position-only shortcuts.",
      subtitleSemantic: "Connect clear synonym or antonym pairs across the two sides.",
      level: "Level",
      undo: "Undo",
      reset: "Reset",
      dump: "Dump Session JSON",
      correct: "Correct",
      wrong: "Wrong",
      distractor: "Distractor Hits",
      found: "Matched",
      left: "One Side",
      right: "Other Side",
      legendMatch: "Correct identical-word line",
      legendMatchSemantic: "Correct synonym/antonym line",
      legendDistractor: "Repeated words on the same side act as position distractors",
      legendNoDistractor: "Semantic level: no repeated-word distractors",
      lineHint: "Tip: pick any word first, then pick another identical word; click a line to undo",
      lineHintSemantic: "Tip: pick a word, then pick its clear synonym or antonym on the other side; click a line to undo",
      pickFirst: "Pick a word on either side first",
      pickOther: "Selected {0}, now pick another identical word",
      pickOtherSemantic: "Selected {0}, now pick its synonym or antonym on the other side",
      wrongSide: "Your second pick must be on the other side",
      sameGroup: "Do not connect words on the same side",
      wrongMsg: "Those two words are not exactly the same. Try again",
      wrongSemanticMsg: "Those two words are not a configured synonym/antonym pair. Try again",
      correctMsg: "Matched: {0} <-> {1}",
      correctSemanticMsg: "Semantic match: {0} <-> {1}",
      removedMsg: "Last match removed",
      noUndo: "Nothing to undo",
      resetMsg: "Round reshuffled",
      dumped: "Session dumped to DevTools console",
      doneMsg: "Great! All matches are complete",
      distractorHit: "Repeated-word distractor handled: {0} <-> {1}"
    }
  };

  var state = {
    lang: "zh",
    level: "L1",
    selected: null,
    startPickAt: 0,
    eventSeq: 1,
    currentRound: null,
    activeMatches: [],
    stats: { correct: 0, wrong: 0, distractor: 0 },
    events: [],
    hintLinks: [],
    sfxEnabled: true,
    audioCtx: null,
    musicEnabled: true,
    musicTimer: null,
    musicNodes: []
  };

  var runtimeCtrl = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController("clio-word-match-workshop")
    : null;

  var els = {
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn: document.getElementById("langBtn"),
    levelLabel: document.getElementById("levelLabel"),
    levelSelect: document.getElementById("levelSelect"),
    undoBtn: document.getElementById("undoBtn"),
    resetBtn: document.getElementById("resetBtn"),
    musicBtn: document.getElementById("musicBtn"),
    sfxBtn: document.getElementById("sfxBtn"),
    dumpBtn: document.getElementById("dumpBtn"),
    correctLabel: document.getElementById("correctLabel"),
    wrongLabel: document.getElementById("wrongLabel"),
    dupLabel: document.getElementById("dupLabel"),
    foundLabel: document.getElementById("foundLabel"),
    correctCount: document.getElementById("correctCount"),
    wrongCount: document.getElementById("wrongCount"),
    dupCount: document.getElementById("dupCount"),
    foundCount: document.getElementById("foundCount"),
    targetCount: document.getElementById("targetCount"),
    feedback: document.getElementById("feedback"),
    leftTitle: document.getElementById("leftTitle"),
    rightTitle: document.getElementById("rightTitle"),
    legendAntonym: document.getElementById("legendAntonym"),
    legendCo: document.getElementById("legendCo"),
    lineHint: document.getElementById("lineHint"),
    leftList: document.getElementById("leftList"),
    rightList: document.getElementById("rightList"),
    board: document.getElementById("board"),
    linkCanvas: document.getElementById("linkCanvas"),
    eventLog: document.getElementById("eventLog")
  };

  function ensureAudio() {
    if (!state.audioCtx) {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) { return null; }
      state.audioCtx = new AudioContextCtor();
    }
    if (state.audioCtx.state === "suspended") { state.audioCtx.resume(); }
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

  function playMusic() {
    var ctx = ensureAudio();
    if (!ctx || !state.musicEnabled) { return; }
    stopMusic();
    var sequence = [261.63, 329.63, 392.0, 329.63, 440, 392.0];
    var idx = 0;
    state.musicTimer = window.setInterval(function () {
      if (!state.musicEnabled) { return; }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = sequence[idx % sequence.length];
      gain.gain.value = 0.022;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
      state.musicNodes.push(osc);
      idx += 1;
    }, 360);
  }

  function playTone(freqs, durations, type) {
    var ctx = ensureAudio();
    if (!ctx || !state.sfxEnabled) { return; }
    var startT = ctx.currentTime;
    freqs.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.18, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + durations[i]);
      osc.start(startT);
      osc.stop(startT + durations[i]);
      startT += durations[i] * 0.7;
    });
  }
  function sfxCorrect() { playTone([523, 659, 784], [0.12, 0.12, 0.18], "sine"); }
  function sfxWrong()   { playTone([220, 180], [0.12, 0.18], "sawtooth"); }
  function sfxDone()    { playTone([523, 659, 784, 1047], [0.12, 0.12, 0.12, 0.28], "sine"); }

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function tf(key, valueA, valueB) {
    return t(key).replace("{0}", valueA || "").replace("{1}", valueB || "");
  }

  function shuffle(list) {
    var arr = list.slice();
    var i;
    for (i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function sample(list, count) {
    return shuffle(list).slice(0, Math.min(count, list.length));
  }

  function validateData() {
    if (!Array.isArray(DATA.word_pool) || !DATA.word_pool.length) {
      throw new Error("word_pool is required for Word Match");
    }
  }

  function getLevel() {
    return DATA.levels[state.level];
  }

  function isSemanticLevel() {
    var level = getLevel();
    return !!(level && level.mode === "semantic");
  }

  function labelOf(wordId) {
    var lex = DATA.lexicon[wordId];
    return lex ? lex.display[state.lang] : wordId;
  }

  function createRound() {
    var level = getLevel();
    if (level.mode === "semantic") {
      var semanticPairs = sample(DATA.semantic_pairs || [], level.pair_count);
      var leftSemanticItems = semanticPairs.map(function (pair, index) {
        return {
          instanceId: "left-sem-" + index + "-" + pair.left,
          side: "left",
          wordId: pair.left,
          matchKey: "sem-" + index,
          relation: pair.relation,
          matched: false,
          isDuplicate: false
        };
      });
      var rightSemanticItems = semanticPairs.map(function (pair, index) {
        return {
          instanceId: "right-sem-" + index + "-" + pair.right,
          side: "right",
          wordId: pair.right,
          matchKey: "sem-" + index,
          relation: pair.relation,
          consumed: false,
          isDuplicate: false
        };
      });

      return {
        words: semanticPairs.map(function (pair) { return pair.left + ":" + pair.right; }),
        leftItems: shuffle(leftSemanticItems),
        rightItems: shuffle(rightSemanticItems),
        duplicateCounts: Object.create(null),
        distractorWords: [],
        layoutShape: DATA.layout_shape || "columns"
      };
    }

    var words = sample(DATA.word_pool, level.pair_count);
    var pairedSet = Object.create(null);
    words.forEach(function (wordId) {
      pairedSet[wordId] = true;
    });

    var distractorPool = DATA.word_pool.filter(function (wordId) {
      return !pairedSet[wordId];
    });
    var totalDistractorGroups = (level.duplicate_left_count || 0) + (level.duplicate_right_count || 0);
    var chosenDistractorWords = sample(distractorPool, totalDistractorGroups);
    var leftDistractorWords = chosenDistractorWords.slice(0, level.duplicate_left_count || 0);
    var rightDistractorWords = chosenDistractorWords.slice(level.duplicate_left_count || 0);

    var leftItems = words.map(function (wordId, index) {
      return {
        instanceId: "left-" + index + "-" + wordId,
        side: "left",
        wordId: wordId,
        matchKey: wordId,
        matched: false,
        isDuplicate: false
      };
    });
    var rightItems = words.map(function (wordId, index) {
      return {
        instanceId: "right-" + index + "-" + wordId,
        side: "right",
        wordId: wordId,
        matchKey: wordId,
        consumed: false,
        isDuplicate: false
      };
    });
    leftDistractorWords.forEach(function (wordId, index) {
      leftItems.push({
        instanceId: "left-dup-" + index + "-a-" + wordId,
        side: "left",
        wordId: wordId,
        matchKey: wordId,
        matched: false,
        isDuplicate: true
      });
      leftItems.push({
        instanceId: "left-dup-" + index + "-b-" + wordId,
        side: "left",
        wordId: wordId,
        matchKey: wordId,
        matched: false,
        isDuplicate: true
      });
    });

    rightDistractorWords.forEach(function (wordId, index) {
      rightItems.push({
        instanceId: "right-dup-" + index + "-a-" + wordId,
        side: "right",
        wordId: wordId,
        matchKey: wordId,
        consumed: false,
        isDuplicate: true
      });
      rightItems.push({
        instanceId: "right-dup-" + index + "-b-" + wordId,
        side: "right",
        wordId: wordId,
        matchKey: wordId,
        consumed: false,
        isDuplicate: true
      });
    });

    leftItems = shuffle(leftItems);
    rightItems = shuffle(rightItems);

    var duplicateCounts = Object.create(null);
    leftItems.concat(rightItems).forEach(function (item) {
      duplicateCounts[item.wordId] = (duplicateCounts[item.wordId] || 0) + 1;
    });

    return {
      words: words,
      leftItems: leftItems,
      rightItems: rightItems,
      duplicateCounts: duplicateCounts,
      distractorWords: chosenDistractorWords,
      layoutShape: DATA.layout_shape || "columns"
    };
  }

  function applyLocale() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    document.title = state.lang === "en" ? "Word Match | Clio" : "连线组词 Word Match | Clio";
    els.titleText.textContent = t("title");
    els.subtitleText.textContent = isSemanticLevel() ? t("subtitleSemantic") : t("subtitle");
    els.levelLabel.textContent = t("level");
    els.undoBtn.textContent = t("undo");
    els.resetBtn.textContent = t("reset");
    els.dumpBtn.textContent = t("dump");
    els.correctLabel.textContent = t("correct");
    els.wrongLabel.textContent = t("wrong");
    els.dupLabel.textContent = t("distractor");
    els.foundLabel.textContent = t("found");
    els.leftTitle.textContent = t("left");
    els.rightTitle.textContent = t("right");
    els.legendAntonym.textContent = isSemanticLevel() ? t("legendMatchSemantic") : t("legendMatch");
    els.legendCo.textContent = isSemanticLevel() ? t("legendNoDistractor") : t("legendDistractor");
    els.lineHint.textContent = isSemanticLevel() ? t("lineHintSemantic") : t("lineHint");
    els.langBtn.textContent = state.lang === "zh" ? "中文 / EN" : "EN / 中文";
    els.musicBtn.textContent = (state.lang === "zh" ? "音乐" : "Music") + ": " + (state.musicEnabled ? (state.lang === "zh" ? "开" : "On") : (state.lang === "zh" ? "关" : "Off"));
    els.sfxBtn.textContent = (state.lang === "zh" ? "音效" : "SFX") + ": " + (state.sfxEnabled ? (state.lang === "zh" ? "开" : "On") : (state.lang === "zh" ? "关" : "Off"));
    renderBoard();
    renderLines();
  }

  function setFeedback(text, cls) {
    els.feedback.className = cls || "";
    els.feedback.textContent = text;
  }

  function refreshHud() {
    var level = getLevel();
    els.correctCount.textContent = String(state.stats.correct);
    els.wrongCount.textContent = String(state.stats.wrong);
    els.dupCount.textContent = String(state.stats.distractor);
    els.foundCount.textContent = String(state.activeMatches.length);
    els.targetCount.textContent = String(level.pair_count);
  }

  function clearSelectedVisual() {
    Array.prototype.forEach.call(document.querySelectorAll(".word-node.active"), function (node) {
      node.classList.remove("active");
    });
  }

  function findItem(instanceId) {
    return state.currentRound.leftItems.concat(state.currentRound.rightItems).find(function (item) {
      return item.instanceId === instanceId;
    }) || null;
  }

  function getWordItems(side, wordId) {
    return state.currentRound[side === "left" ? "leftItems" : "rightItems"].filter(function (item) {
      return item.wordId === wordId;
    });
  }

  function getMatchItems(side, matchKey) {
    return state.currentRound[side === "left" ? "leftItems" : "rightItems"].filter(function (item) {
      return item.matchKey === matchKey;
    });
  }

  function getNodeElement(instanceId, side) {
    return document.querySelector('.word-node[data-item-id="' + instanceId + '"][data-side="' + side + '"]');
  }

  function lineEndpoint(instanceId, side) {
    var node = getNodeElement(instanceId, side);
    if (!node) {
      return null;
    }
    var boardRect = els.board.getBoundingClientRect();
    var rect = node.getBoundingClientRect();
    return {
      x: side === "left" ? rect.right - boardRect.left : rect.left - boardRect.left,
      y: rect.top - boardRect.top + rect.height / 2
    };
  }

  function appendLog(text) {
    var p = document.createElement("div");
    p.textContent = text;
    els.eventLog.prepend(p);
  }

  function recordEvent(payload) {
    state.events.push(payload);
    appendLog(JSON.stringify(payload));
  }

  // Color palette for match lines – one color per pair
  var LINE_COLORS = [
    "#10b981", "#f59e0b", "#6366f1", "#ef4444",
    "#0ea5e9", "#ec4899", "#14b8a6", "#f97316"
  ];

  function lineColor(index) {
    return LINE_COLORS[index % LINE_COLORS.length];
  }

  function createWordButton(item) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "word-node" +
      ((item.matched || item.consumed) ? " matched" : "") +
      (item.isDuplicate ? " distractor" : "");
    btn.dataset.itemId = item.instanceId;
    btn.dataset.side = item.side;
    btn.textContent = labelOf(item.wordId);
    btn.disabled = !!(item.matched || item.consumed);

    function onTap() {
      handleWordTap(item, btn);
    }

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(btn, onTap);
    } else {
      btn.addEventListener("click", onTap);
    }
    return btn;
  }

  function renderBoard() {
    if (!state.currentRound) {
      return;
    }
    els.leftList.innerHTML = "";
    els.rightList.innerHTML = "";
    state.currentRound.leftItems.forEach(function (item) {
      els.leftList.appendChild(createWordButton(item));
    });
    state.currentRound.rightItems.forEach(function (item) {
      els.rightList.appendChild(createWordButton(item));
    });
    layoutWordNodes();
  }

  function layoutWordNodes() {
    [els.leftList, els.rightList].forEach(function (listEl) {
      var nodes = Array.prototype.slice.call(listEl.querySelectorAll(".word-node"));
      if (!nodes.length) {
        return;
      }

      var listRect = listEl.getBoundingClientRect();
      var tileSize = 72;
      var centerX = listRect.width / 2;
      var centerY = listRect.height / 2;
      var radiusX = Math.max(24, centerX - tileSize / 2 - 14);
      var radiusY = Math.max(24, centerY - tileSize / 2 - 14);
      // Translate the whole arc toward the inner (center) edge without distorting shape
      var innerBias = listRect.width * 0.14;
      var isLeftSide = listEl === els.leftList;
      var n = nodes.length;

      // Uniform arc-length spacing: angles from -π/2 (top) to +π/2 (bottom)
      // Left side: bulge goes left  (x = cx - rx·cos θ)
      // Right side: bulge goes right (x = cx + rx·cos θ)
      // → perfectly mirrored semicircles, opening toward center
      nodes.forEach(function (node, index) {
        var angle = n === 1 ? 0 : (-Math.PI / 2) + (Math.PI / (n - 1)) * index;
        var x = centerX + (isLeftSide ? -1 : 1) * radiusX * Math.cos(angle) + (isLeftSide ? innerBias : -innerBias);
        var y = centerY + radiusY * Math.sin(angle);
        node.style.left = x + "px";
        node.style.top = y + "px";
        node.style.transform = "translate(-50%, -50%)";
      });
    });
  }

  function renderLines() {
    if (!state.currentRound) {
      return;
    }
    var boardRect = els.board.getBoundingClientRect();
    els.linkCanvas.setAttribute("viewBox", "0 0 " + Math.round(boardRect.width) + " " + Math.round(boardRect.height));
    els.linkCanvas.innerHTML = "";

    state.activeMatches.forEach(function (match, index) {
      var p1 = lineEndpoint(match.leftInstanceId, "left");
      var p2 = lineEndpoint(match.rightInstanceId, "right");
      if (!p1 || !p2) {
        return;
      }
      var color = lineColor(index);
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(p1.x));
      line.setAttribute("y1", String(p1.y));
      line.setAttribute("x2", String(p2.x));
      line.setAttribute("y2", String(p2.y));
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("class", "link-line");
      line.dataset.matchIndex = String(index);
      // Also tint the matched nodes with this line's color
      var leftNode = getNodeElement(match.leftInstanceId, "left");
      var rightNode = getNodeElement(match.rightInstanceId, "right");
      if (leftNode)  { leftNode.style.borderColor  = color; leftNode.style.boxShadow  = "0 0 0 2px " + color + "44"; }
      if (rightNode) { rightNode.style.borderColor = color; rightNode.style.boxShadow = "0 0 0 2px " + color + "44"; }
      line.addEventListener("click", function (ev) {
        ev.stopPropagation();
        removeMatchByIndex(index);
      });
      els.linkCanvas.appendChild(line);
    });

    state.hintLinks.forEach(function (hint) {
      var from = lineEndpoint(hint.fromInstanceId, hint.fromSide);
      var to = lineEndpoint(hint.toInstanceId, hint.toSide);
      if (!from || !to) {
        return;
      }
      var hintLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hintLine.setAttribute("x1", String(from.x));
      hintLine.setAttribute("y1", String(from.y));
      hintLine.setAttribute("x2", String(to.x));
      hintLine.setAttribute("y2", String(to.y));
      hintLine.setAttribute("stroke", "#3b82f6");
      hintLine.setAttribute("stroke-width", "3");
      hintLine.setAttribute("stroke-linecap", "round");
      hintLine.setAttribute("stroke-dasharray", "8 5");
      hintLine.setAttribute("class", "link-line hint-line");
      els.linkCanvas.appendChild(hintLine);
    });
  }

  function addHintLink(firstItem, secondItem) {
    state.hintLinks.push({
      fromInstanceId: firstItem.instanceId,
      fromSide: firstItem.side,
      toInstanceId: secondItem.instanceId,
      toSide: secondItem.side
    });
    layoutWordNodes();
    renderLines();
  }

  function handleWordTap(item, btn) {
    if (item.side === "left" && item.matched) {
      return;
    }
    if (item.side === "right" && item.consumed) {
      return;
    }

    if (!state.selected) {
      state.selected = item.instanceId;
      state.startPickAt = performance.now();
      clearSelectedVisual();
      btn.classList.add("active");
      setFeedback(tf(isSemanticLevel() ? "pickOtherSemantic" : "pickOther", labelOf(item.wordId)), "");
      return;
    }

    var firstItem = findItem(state.selected);
    clearSelectedVisual();
    state.selected = null;

    if (!firstItem) {
      setFeedback(t("pickFirst"), "bad");
      return;
    }

    if (firstItem.side === item.side) {
      if (firstItem.wordId === item.wordId) {
        addHintLink(firstItem, item);
      }
      state.selected = item.instanceId;
      state.startPickAt = performance.now();
      btn.classList.add("active");
      setFeedback(tf(isSemanticLevel() ? "pickOtherSemantic" : "pickOther", labelOf(item.wordId)), "");
      return;
    }

    var reaction = Math.max(1, Math.round(performance.now() - state.startPickAt));
    var isCorrect = firstItem.matchKey === item.matchKey;
    var duplicateCount = state.currentRound.duplicateCounts[item.wordId] || 1;
    var distractorInvolved = firstItem.isDuplicate || item.isDuplicate || duplicateCount > 2;
    var attempt = {
      attempt_id: "attempt_" + state.eventSeq,
      word_a: firstItem.wordId,
      word_b: item.wordId,
      is_correct_pair: isCorrect,
      is_distractor_involved: distractorInvolved,
      reaction_time_ms: reaction,
      difficulty_level: state.level,
      layout_shape: state.currentRound.layoutShape,
      timestamp: new Date().toISOString()
    };
    state.eventSeq += 1;

    if (!isCorrect) {
      state.stats.wrong += 1;
      if (distractorInvolved) {
        state.stats.distractor += 1;
      }
      sfxWrong();
      setFeedback(t(isSemanticLevel() ? "wrongSemanticMsg" : "wrongMsg"), "bad");
      recordEvent(attempt);
      refreshHud();
      return;
    }

    getMatchItems("left", item.matchKey).forEach(function (leftItem) {
      leftItem.matched = true;
    });
    getMatchItems("right", item.matchKey).forEach(function (rightItem) {
      rightItem.consumed = true;
    });

    state.activeMatches.push({
      leftInstanceId: firstItem.side === "left" ? firstItem.instanceId : item.instanceId,
      rightInstanceId: firstItem.side === "right" ? firstItem.instanceId : item.instanceId,
      matchKey: item.matchKey,
      wordId: item.wordId,
      distractorInvolved: distractorInvolved
    });
    state.stats.correct += 1;
    if (distractorInvolved) {
      state.stats.distractor += 1;
      setFeedback(tf("distractorHit", labelOf(firstItem.wordId), labelOf(item.wordId)), "dup");
    } else {
      setFeedback(tf(isSemanticLevel() ? "correctSemanticMsg" : "correctMsg", labelOf(firstItem.wordId), labelOf(item.wordId)), "good");
    }
    recordEvent(attempt);
    renderBoard();
    layoutWordNodes();
    renderLines();
    refreshHud();

    if (state.activeMatches.length >= getLevel().pair_count) {
      sfxDone();
      setFeedback(t("doneMsg"), "good");
    } else {
      sfxCorrect();
    }
  }

  function removeMatchByIndex(index) {
    if (index < 0 || index >= state.activeMatches.length) {
      return;
    }
    var match = state.activeMatches[index];
    getMatchItems("left", match.matchKey).forEach(function (leftItem) {
      leftItem.matched = false;
    });
    getMatchItems("right", match.matchKey).forEach(function (rightItem) {
      rightItem.consumed = false;
    });
    state.activeMatches.splice(index, 1);
    state.stats.correct = Math.max(0, state.stats.correct - 1);
    if (match.distractorInvolved) {
      state.stats.distractor = Math.max(0, state.stats.distractor - 1);
    }
    setFeedback(t("removedMsg"), "");
    renderBoard();
    layoutWordNodes();
    renderLines();
    refreshHud();
  }

  function undoLast() {
    if (!state.activeMatches.length) {
      setFeedback(t("noUndo"), "");
      return;
    }
    removeMatchByIndex(state.activeMatches.length - 1);
  }

  function resetRound() {
    if (runtimeCtrl) {
      runtimeCtrl.resetSession();
      runtimeCtrl.clearTimers();
    }
    state.selected = null;
    state.startPickAt = 0;
    state.activeMatches = [];
    state.stats = { correct: 0, wrong: 0, distractor: 0 };
    state.events = [];
    state.hintLinks = [];
    state.currentRound = createRound();
    clearSelectedVisual();
    renderBoard();
    layoutWordNodes();
    renderLines();
    refreshHud();
    els.eventLog.innerHTML = "";
    setFeedback(t("resetMsg"), "");
  }

  function exportSession() {
    var payload = {
      game_id: "clio-word-match-workshop",
      content_version: DATA.content_version,
      main_rootgene: DATA.main_rootgene,
      secondary_rootgene: DATA.secondary_rootgene,
      reviewer: DATA.reviewer,
      reviewed_at: DATA.reviewed_at,
      difficulty_level: state.level,
      layout_shape: state.currentRound ? state.currentRound.layoutShape : DATA.layout_shape,
      stats: state.stats,
      active_matches: state.activeMatches,
      events: state.events
    };
    localStorage.setItem("me:clio:word-match:latest", JSON.stringify(payload));
    console.log("Word Match Session:", payload);
    setFeedback(t("dumped"), "");
  }

  function bootstrap() {
    validateData();

    if (runtimeCtrl) {
      runtimeCtrl.resetSession();
    }

    var savedLang = localStorage.getItem("clio-games-lang");
    if (savedLang === "en" || savedLang === "zh") {
      state.lang = savedLang;
    }

    var savedSfx = localStorage.getItem("clio-word-match-sfx");
    if (savedSfx === "off") {
      state.sfxEnabled = false;
    } else {
      state.sfxEnabled = true;  // default On
    }

    var savedMusic = localStorage.getItem("clio-word-match-music");
    if (savedMusic === "off") {
      state.musicEnabled = false;
    } else {
      state.musicEnabled = true;  // default On
    }

    els.levelSelect.value = state.level;
    resetRound();
    applyLocale();
    refreshHud();
    setFeedback(t("pickFirst"), "");
    ensureAudio();
    playMusic();

    var onLangTap = function () {
      state.lang = state.lang === "zh" ? "en" : "zh";
      localStorage.setItem("clio-games-lang", state.lang);
      applyLocale();
      setFeedback(t("pickFirst"), "");
    };

    var onMusicTap = function () {
      state.musicEnabled = !state.musicEnabled;
      localStorage.setItem("clio-word-match-music", state.musicEnabled ? "on" : "off");
      applyLocale();
      if (state.musicEnabled) { playMusic(); } else { stopMusic(); }
    };

    var onSfxTap = function () {
      state.sfxEnabled = !state.sfxEnabled;
      localStorage.setItem("clio-word-match-sfx", state.sfxEnabled ? "on" : "off");
      applyLocale();
      if (state.sfxEnabled) { ensureAudio(); }
    };

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.musicBtn, onMusicTap);
      runtimeCtrl.bindTap(els.sfxBtn, onSfxTap);
      runtimeCtrl.bindTap(els.langBtn, onLangTap);
      runtimeCtrl.bindTap(els.undoBtn, undoLast);
      runtimeCtrl.bindTap(els.resetBtn, resetRound);
      runtimeCtrl.bindTap(els.dumpBtn, exportSession);
      runtimeCtrl.onLifecyclePause(function () {
        clearSelectedVisual();
        state.selected = null;
      });
    } else {
      els.musicBtn.addEventListener("click", onMusicTap);
      els.sfxBtn.addEventListener("click", onSfxTap);
      els.langBtn.addEventListener("click", onLangTap);
      els.undoBtn.addEventListener("click", undoLast);
      els.resetBtn.addEventListener("click", resetRound);
      els.dumpBtn.addEventListener("click", exportSession);
    }

    els.levelSelect.addEventListener("change", function () {
      state.level = els.levelSelect.value;
      resetRound();
      applyLocale();
    });

    window.addEventListener("resize", renderLines);
    window.addEventListener("resize", layoutWordNodes);
  }

  bootstrap();
})();
