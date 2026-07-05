(function () {
  "use strict";

  var DATA = window.WORD_CONNECTIONS_DATA;
  var ALLOWED_RELATIONS = {
    "antonym": true,
    "co-occurrence": true
  };

  var TEXT = {
    zh: {
      title: "连词工坊 Word Connections",
      subtitle: "观察词和词之间的多重关系，一个词可以连接多条线。",
      level: "难度",
      undo: "撤销一步",
      reset: "重置",
      dump: "导出会话 JSON",
      correct: "正确",
      wrong: "错误",
      duplicate: "重复",
      found: "已发现关系",
      left: "左列词",
      right: "右列词",
      antonym: "反义关系",
      co: "关联关系",
      lineHint: "提示：点击一条已画的线可删除它",
      pickFirst: "请先选择第一个词",
      pickSecond: "已选择 {0}，请再点另一个词",
      sameWord: "不能和自己连线",
      duplicateMsg: "这条关系已存在（不重复计分）",
      correctMsg: "连接成功：{0}（{1}）",
      wrongMsg: "这条线不在关系图中，可以重试",
      removedMsg: "已删除一条连线",
      noUndo: "没有可撤销的连线",
      resetMsg: "已重置本轮",
      dumped: "会话已输出到 DevTools 控制台",
      doneMsg: "太棒了！本关关系已全部发现"
    },
    en: {
      title: "Word Connections",
      subtitle: "Build multiple links between words. One word can connect to many words.",
      level: "Level",
      undo: "Undo",
      reset: "Reset",
      dump: "Dump Session JSON",
      correct: "Correct",
      wrong: "Wrong",
      duplicate: "Duplicate",
      found: "Found",
      left: "Left Words",
      right: "Right Words",
      antonym: "Antonym",
      co: "Co-occurrence",
      lineHint: "Tip: click an existing line to remove it",
      pickFirst: "Pick the first word",
      pickSecond: "Selected {0}, pick another word",
      sameWord: "Cannot connect a word to itself",
      duplicateMsg: "This edge already exists (not scored again)",
      correctMsg: "Good link: {0} ({1})",
      wrongMsg: "This edge is not in the graph. Try another one",
      removedMsg: "One link removed",
      noUndo: "Nothing to undo",
      resetMsg: "Round reset",
      dumped: "Session dumped to DevTools console",
      doneMsg: "Great! You found all edges in this level"
    }
  };

  var state = {
    lang: "zh",
    level: "L2",
    selected: null,
    attempts: 0,
    startPickAt: 0,
    eventSeq: 1,
    activeEdges: [],
    activeEdgeSet: new Set(),
    adjacencyCount: {},
    stats: { correct: 0, wrong: 0, duplicate: 0 },
    events: []
  };

  var runtimeCtrl = window.ClioRuntimeBridge
    ? window.ClioRuntimeBridge.createController("clio-word-connections-workshop")
    : null;

  var els = {
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    langBtn: document.getElementById("langBtn"),
    levelLabel: document.getElementById("levelLabel"),
    levelSelect: document.getElementById("levelSelect"),
    undoBtn: document.getElementById("undoBtn"),
    resetBtn: document.getElementById("resetBtn"),
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

  function t(key) {
    return TEXT[state.lang][key] || key;
  }

  function tf(key, valueA, valueB) {
    return t(key).replace("{0}", valueA || "").replace("{1}", valueB || "");
  }

  function canonicalKey(a, b) {
    return a < b ? (a + "|" + b) : (b + "|" + a);
  }

  function relationColor(type) {
    return type === "antonym" ? "#ef4444" : "#3b82f6";
  }

  function getLevel() {
    return DATA.levels[state.level];
  }

  function validateData() {
    Object.keys(DATA.levels).forEach(function (levelId) {
      var level = DATA.levels[levelId];
      level.edges.forEach(function (edge) {
        if (!ALLOWED_RELATIONS[edge.relation_type]) {
          throw new Error("Invalid relation_type in " + levelId + ": " + edge.relation_type);
        }
      });
    });
  }

  function buildEdgeMap(level) {
    var map = Object.create(null);
    level.edges.forEach(function (edge) {
      var key = canonicalKey(edge.from, edge.to);
      map[key] = edge.relation_type;
    });
    return map;
  }

  function levelWordsSplit(level) {
    var list = level.nodes.slice();
    var mid = Math.ceil(list.length / 2);
    return {
      left: list.slice(0, mid),
      right: list.slice(mid).sort(function () {
        return Math.random() - 0.5;
      })
    };
  }

  function labelOf(wordId) {
    var lex = DATA.lexicon[wordId];
    return lex ? lex.display[state.lang] : wordId;
  }

  function applyLocale() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    document.title = state.lang === "en" ? "Word Connections | Clio" : "连词工坊 Word Connections | Clio";
    els.titleText.textContent = t("title");
    els.subtitleText.textContent = t("subtitle");
    els.levelLabel.textContent = t("level");
    els.undoBtn.textContent = t("undo");
    els.resetBtn.textContent = t("reset");
    els.dumpBtn.textContent = t("dump");
    els.correctLabel.textContent = t("correct");
    els.wrongLabel.textContent = t("wrong");
    els.dupLabel.textContent = t("duplicate");
    els.foundLabel.textContent = t("found");
    els.leftTitle.textContent = t("left");
    els.rightTitle.textContent = t("right");
    els.legendAntonym.textContent = t("antonym");
    els.legendCo.textContent = t("co");
    els.lineHint.textContent = t("lineHint");
    els.langBtn.textContent = state.lang === "zh" ? "中文 / EN" : "EN / 中文";
    renderWordColumns();
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
    els.dupCount.textContent = String(state.stats.duplicate);
    els.foundCount.textContent = String(state.activeEdges.length);
    els.targetCount.textContent = String(level.target_edges || level.edges.length);
  }

  function createNodeButton(wordId, side) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "word-node";
    btn.dataset.wordId = wordId;
    btn.dataset.side = side;
    btn.textContent = labelOf(wordId);
    if (runtimeCtrl) {
      runtimeCtrl.bindTap(btn, function () {
        onWordClick(wordId, side, btn);
      });
    } else {
      btn.addEventListener("click", function () {
        onWordClick(wordId, side, btn);
      });
    }
    return btn;
  }

  function renderWordColumns() {
    var level = getLevel();
    var split = levelWordsSplit(level);
    els.leftList.innerHTML = "";
    els.rightList.innerHTML = "";
    split.left.forEach(function (id) {
      els.leftList.appendChild(createNodeButton(id, "left"));
    });
    split.right.forEach(function (id) {
      els.rightList.appendChild(createNodeButton(id, "right"));
    });
  }

  function clearSelectedVisual() {
    Array.prototype.forEach.call(document.querySelectorAll(".word-node.active"), function (node) {
      node.classList.remove("active");
    });
  }

  function getNodeElement(wordId, side) {
    return document.querySelector('.word-node[data-word-id="' + wordId + '"][data-side="' + side + '"]');
  }

  function lineEndpoint(wordId, side) {
    var node = getNodeElement(wordId, side);
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

  function renderLines() {
    var boardRect = els.board.getBoundingClientRect();
    els.linkCanvas.setAttribute("viewBox", "0 0 " + Math.round(boardRect.width) + " " + Math.round(boardRect.height));
    els.linkCanvas.innerHTML = "";

    state.activeEdges.forEach(function (edge, index) {
      var p1 = lineEndpoint(edge.word_a, edge.side_a);
      var p2 = lineEndpoint(edge.word_b, edge.side_b);
      if (!p1 || !p2) {
        return;
      }
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(p1.x));
      line.setAttribute("y1", String(p1.y));
      line.setAttribute("x2", String(p2.x));
      line.setAttribute("y2", String(p2.y));
      line.setAttribute("stroke", relationColor(edge.relation_type || "co-occurrence"));
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("class", "link-line");
      line.dataset.edgeIndex = String(index);
      line.addEventListener("click", function (ev) {
        ev.stopPropagation();
        removeEdgeByIndex(index);
      });
      els.linkCanvas.appendChild(line);
    });
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

  function edgeRelation(wordA, wordB) {
    var map = buildEdgeMap(getLevel());
    return map[canonicalKey(wordA, wordB)] || null;
  }

  function onWordClick(wordId, side, btn) {
    if (!state.selected) {
      state.selected = { wordId: wordId, side: side };
      state.startPickAt = performance.now();
      clearSelectedVisual();
      btn.classList.add("active");
      setFeedback(tf("pickSecond", labelOf(wordId)), "");
      return;
    }

    var first = state.selected;
    clearSelectedVisual();
    state.selected = null;

    if (first.wordId === wordId) {
      setFeedback(t("sameWord"), "bad");
      return;
    }

    var wordA = first.wordId;
    var wordB = wordId;
    var edgeKey = canonicalKey(wordA, wordB);
    var reaction = Math.max(1, Math.round(performance.now() - state.startPickAt));
    var relation = edgeRelation(wordA, wordB);
    var isDuplicate = state.activeEdgeSet.has(edgeKey);
    var isCorrect = relation !== null;

    var attempt = {
      attempt_id: "attempt_" + state.eventSeq,
      edge_key: edgeKey,
      word_a: wordA,
      word_b: wordB,
      relation_type: relation,
      is_correct: isCorrect,
      is_duplicate: isDuplicate,
      is_first_edge_for_word_a: !state.adjacencyCount[wordA],
      is_first_edge_for_word_b: !state.adjacencyCount[wordB],
      reaction_time_ms: reaction,
      difficulty_level: state.level,
      timestamp: new Date().toISOString()
    };
    state.eventSeq += 1;

    if (isDuplicate) {
      state.stats.duplicate += 1;
      setFeedback(t("duplicateMsg"), "dup");
      recordEvent(attempt);
      refreshHud();
      return;
    }

    if (!isCorrect) {
      state.stats.wrong += 1;
      setFeedback(t("wrongMsg"), "bad");
      recordEvent(attempt);
      refreshHud();
      return;
    }

    state.stats.correct += 1;
    state.activeEdgeSet.add(edgeKey);
    state.activeEdges.push({
      edge_key: edgeKey,
      word_a: wordA,
      word_b: wordB,
      side_a: first.side,
      side_b: side,
      relation_type: relation
    });
    state.adjacencyCount[wordA] = (state.adjacencyCount[wordA] || 0) + 1;
    state.adjacencyCount[wordB] = (state.adjacencyCount[wordB] || 0) + 1;
    setFeedback(tf("correctMsg", wordA + " - " + wordB, relation), "good");
    recordEvent(attempt);
    refreshHud();
    renderLines();

    var level = getLevel();
    if (state.activeEdges.length >= (level.target_edges || level.edges.length)) {
      setFeedback(t("doneMsg"), "good");
    }
  }

  function removeEdgeByIndex(index) {
    if (index < 0 || index >= state.activeEdges.length) {
      return;
    }
    var edge = state.activeEdges[index];
    state.activeEdges.splice(index, 1);
    state.activeEdgeSet.delete(edge.edge_key);
    state.adjacencyCount[edge.word_a] = Math.max(0, (state.adjacencyCount[edge.word_a] || 1) - 1);
    state.adjacencyCount[edge.word_b] = Math.max(0, (state.adjacencyCount[edge.word_b] || 1) - 1);
    setFeedback(t("removedMsg"), "");
    renderLines();
    refreshHud();
  }

  function undoLast() {
    if (!state.activeEdges.length) {
      setFeedback(t("noUndo"), "");
      return;
    }
    removeEdgeByIndex(state.activeEdges.length - 1);
  }

  function resetRound() {
    if (runtimeCtrl) {
      runtimeCtrl.resetSession();
      runtimeCtrl.clearTimers();
    }
    state.selected = null;
    state.startPickAt = 0;
    state.activeEdges = [];
    state.activeEdgeSet = new Set();
    state.adjacencyCount = {};
    state.stats = { correct: 0, wrong: 0, duplicate: 0 };
    state.events = [];
    clearSelectedVisual();
    renderWordColumns();
    renderLines();
    refreshHud();
    els.eventLog.innerHTML = "";
    setFeedback(t("resetMsg"), "");
  }

  function exportSession() {
    var payload = {
      game_id: "word-connections-workshop",
      content_version: DATA.content_version,
      main_rootgene: DATA.main_rootgene,
      secondary_rootgene: DATA.secondary_rootgene,
      reviewer: DATA.reviewer,
      reviewed_at: DATA.reviewed_at,
      difficulty_level: state.level,
      stats: state.stats,
      found_edges: state.activeEdges,
      events: state.events
    };
    localStorage.setItem("me:clio:word-connections:latest", JSON.stringify(payload));
    console.log("Word Connections Session:", payload);
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

    els.levelSelect.value = state.level;
    applyLocale();
    refreshHud();
    setFeedback(t("pickFirst"), "");

    var onLangTap = function () {
      state.lang = state.lang === "zh" ? "en" : "zh";
      localStorage.setItem("clio-games-lang", state.lang);
      applyLocale();
      setFeedback(t("pickFirst"), "");
    };

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.langBtn, onLangTap);
    } else {
      els.langBtn.addEventListener("click", onLangTap);
    }

    els.levelSelect.addEventListener("change", function () {
      state.level = els.levelSelect.value;
      resetRound();
    });

    if (runtimeCtrl) {
      runtimeCtrl.bindTap(els.undoBtn, undoLast);
      runtimeCtrl.bindTap(els.resetBtn, resetRound);
      runtimeCtrl.bindTap(els.dumpBtn, exportSession);
      runtimeCtrl.onLifecyclePause(function () {
        clearSelectedVisual();
        state.selected = null;
      });
    } else {
      els.undoBtn.addEventListener("click", undoLast);
      els.resetBtn.addEventListener("click", resetRound);
      els.dumpBtn.addEventListener("click", exportSession);
    }
    window.addEventListener("resize", renderLines);
  }

  bootstrap();
})();
