(function () {
  "use strict";

  var PIECE_ASSET = {
    wk: "wK.svg", wq: "wQ.svg", wr: "wR.svg", wb: "wB.svg", wn: "wN.svg", wp: "wP.svg",
    bk: "bK.svg", bq: "bQ.svg", br: "bR.svg", bb: "bB.svg", bn: "bN.svg", bp: "bP.svg"
  };

  var FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  var RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
  var SPLIT_STORAGE_KEY = "mindsevo:chess:play:left-pane";

  var logger = ChessLogger.createLogger({ level: "debug", maxRecords: 3000 });

  var state = {
    board: [],
    turn: "w",
    selected: null,
    hintsEnabled: true,
    moveHistory: [],
    mode: "manual",
    playerColor: "white",
    muted: false,
    narrationOn: true,
    autoplay: false
  };

  var elBoard = document.getElementById("board");
  var elTurnStatus = document.getElementById("turnStatus");
  var elNotationList = document.getElementById("notationList");
  var elLogConsole = document.getElementById("logConsole");
  var expandPanel = document.getElementById("expandPanel");
  var playPage = document.querySelector(".play-page");
  var stageDivider = document.getElementById("stageDivider");

  var btnReset = document.getElementById("btnReset");
  var btnAuto = document.getElementById("btnAuto");
  var btnUndo = document.getElementById("btnUndo");
  var btnNext = document.getElementById("btnNext");
  var btnSound = document.getElementById("btnSound");
  var btnNarration = document.getElementById("btnNarration");
  var btnManual = document.getElementById("btnManual");
  var btnHumanAi = document.getElementById("btnHumanAi");
  var btnAiAi = document.getElementById("btnAiAi");
  var btnColor = document.getElementById("btnColor");
  var btnHints = document.getElementById("btnHints");
  var btnExportLogs = document.getElementById("btnExportLogs");
  var btnExplain = document.getElementById("btnExplain");
  var btnSaveExplain = document.getElementById("btnSaveExplain");
  var btnSaveNote = document.getElementById("btnSaveNote");

  var volumeRange = document.getElementById("volumeRange");
  var speedRange = document.getElementById("speedRange");
  var volumeValue = document.getElementById("volumeValue");
  var speedValue = document.getElementById("speedValue");

  logger.setSink(function (record) {
    var line = document.createElement("div");
    line.className = "log-line " + record.level;
    var payloadText = record.payload ? " " + JSON.stringify(record.payload) : "";
    line.textContent = "#" + record.id + " [" + record.level.toUpperCase() + "] " + record.module + "." + record.event + payloadText;
    elLogConsole.appendChild(line);
    elLogConsole.scrollTop = elLogConsole.scrollHeight;
  });

  function createInitialBoard() {
    return [
      ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
      ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
      ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"]
    ];
  }

  function setupBoardCoords() {
    function fill(parentId, values) {
      var el = document.getElementById(parentId);
      el.innerHTML = "";
      values.forEach(function (v) {
        var span = document.createElement("span");
        span.textContent = v;
        el.appendChild(span);
      });
    }

    fill("fileBottom", FILES);
    fill("rankLeft", RANKS);
  }

  function renderBoard() {
    elBoard.innerHTML = "";

    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var square = document.createElement("div");
        square.className = "square " + (((row + col) % 2 === 0) ? "light" : "dark");
        square.dataset.row = String(row);
        square.dataset.col = String(col);

        var piece = state.board[row][col];
        if (piece) {
          var pieceEl = document.createElement("img");
          pieceEl.className = "piece-svg";
          pieceEl.alt = piece;
          pieceEl.src = "./assets/pieces/" + PIECE_ASSET[piece];
          square.appendChild(pieceEl);
        }

        if (state.selected && state.selected.row === row && state.selected.col === col) {
          square.classList.add("selected");
        }

        if (state.hintsEnabled && state.selected && isTargetSquare(row, col)) {
          square.classList.add("target");
        }

        square.addEventListener("click", onSquareClick);
        elBoard.appendChild(square);
      }
    }

    elTurnStatus.textContent = "当前回合：" + (state.turn === "w" ? "白方" : "黑方");
  }

  function getPiece(row, col) {
    return state.board[row][col];
  }

  function setPiece(row, col, piece) {
    state.board[row][col] = piece;
  }

  function getColor(piece) {
    return piece ? piece.charAt(0) : "";
  }

  function toCellName(row, col) {
    return FILES[col] + String(8 - row);
  }

  function inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  function isPathClear(fromRow, fromCol, toRow, toCol) {
    var rowStep = toRow === fromRow ? 0 : (toRow > fromRow ? 1 : -1);
    var colStep = toCol === fromCol ? 0 : (toCol > fromCol ? 1 : -1);

    var r = fromRow + rowStep;
    var c = fromCol + colStep;

    while (r !== toRow || c !== toCol) {
      if (getPiece(r, c)) return false;
      r += rowStep;
      c += colStep;
    }

    return true;
  }

  function canMoveBasic(piece, fromRow, fromCol, toRow, toCol) {
    if (!piece) return false;
    if (!inBounds(toRow, toCol)) return false;
    if (fromRow === toRow && fromCol === toCol) return false;

    var target = getPiece(toRow, toCol);
    if (target && getColor(target) === getColor(piece)) return false;

    var kind = piece.charAt(1);
    var color = getColor(piece);
    var dr = toRow - fromRow;
    var dc = toCol - fromCol;
    var absDr = Math.abs(dr);
    var absDc = Math.abs(dc);

    if (kind === "p") {
      var dir = color === "w" ? -1 : 1;
      var startRow = color === "w" ? 6 : 1;
      if (dc === 0 && !target) {
        if (dr === dir) return true;
        if (fromRow === startRow && dr === 2 * dir && !getPiece(fromRow + dir, fromCol)) return true;
      }
      if (absDc === 1 && dr === dir && target && getColor(target) !== color) return true;
      return false;
    }

    if (kind === "r") {
      if (dr !== 0 && dc !== 0) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);
    }

    if (kind === "b") {
      if (absDr !== absDc) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);
    }

    if (kind === "q") {
      var isLine = dr === 0 || dc === 0;
      var isDiag = absDr === absDc;
      if (!isLine && !isDiag) return false;
      return isPathClear(fromRow, fromCol, toRow, toCol);
    }

    if (kind === "n") {
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }

    if (kind === "k") {
      return absDr <= 1 && absDc <= 1;
    }

    return false;
  }

  function getLegalTargets(row, col) {
    var piece = getPiece(row, col);
    if (!piece) return [];

    var targets = [];
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (canMoveBasic(piece, row, col, r, c)) {
          targets.push({ row: r, col: c });
        }
      }
    }
    return targets;
  }

  function isTargetSquare(row, col) {
    if (!state.selected) return false;
    return state.selected.targets.some(function (t) {
      return t.row === row && t.col === col;
    });
  }

  function pushNotation(piece, fromRow, fromCol, toRow, toCol, captured) {
    var color = getColor(piece) === "w" ? "白" : "黑";
    var display = color + " " + toCellName(fromRow, fromCol) + (captured ? " x " : " - ") + toCellName(toRow, toCol);
    var li = document.createElement("li");
    li.textContent = display;
    elNotationList.appendChild(li);
  }

  function tryMove(fromRow, fromCol, toRow, toCol) {
    var piece = getPiece(fromRow, fromCol);
    if (!piece) return false;

    if (getColor(piece) !== state.turn) {
      logger.warn("game", "move.rejected.turn", { piece: piece, turn: state.turn });
      return false;
    }

    if (!canMoveBasic(piece, fromRow, fromCol, toRow, toCol)) {
      logger.warn("game", "move.rejected.rule", {
        from: toCellName(fromRow, fromCol),
        to: toCellName(toRow, toCol),
        piece: piece
      });
      return false;
    }

    var target = getPiece(toRow, toCol);
    state.moveHistory.push({
      fromRow: fromRow,
      fromCol: fromCol,
      toRow: toRow,
      toCol: toCol,
      piece: piece,
      captured: target || ""
    });

    setPiece(fromRow, fromCol, "");
    setPiece(toRow, toCol, piece);

    pushNotation(piece, fromRow, fromCol, toRow, toCol, !!target);

    logger.info("game", "move.done", {
      piece: piece,
      from: toCellName(fromRow, fromCol),
      to: toCellName(toRow, toCol),
      captured: target || null
    });

    state.turn = state.turn === "w" ? "b" : "w";
    return true;
  }

  function onSquareClick(e) {
    var row = Number(e.currentTarget.dataset.row);
    var col = Number(e.currentTarget.dataset.col);
    var piece = getPiece(row, col);

    if (!state.selected) {
      if (!piece) return;
      if (getColor(piece) !== state.turn) {
        logger.debug("ui", "select.ignored", { cell: toCellName(row, col), reason: "not-your-turn" });
        return;
      }

      var targets = getLegalTargets(row, col);
      state.selected = { row: row, col: col, targets: targets };
      logger.debug("ui", "piece.selected", { cell: toCellName(row, col), targets: targets.length });
      renderBoard();
      return;
    }

    if (state.selected.row === row && state.selected.col === col) {
      state.selected = null;
      logger.debug("ui", "piece.unselected", { cell: toCellName(row, col) });
      renderBoard();
      return;
    }

    var from = state.selected;
    var moved = tryMove(from.row, from.col, row, col);
    state.selected = null;

    renderBoard();

    if (!moved && piece && getColor(piece) === state.turn) {
      state.selected = { row: row, col: col, targets: getLegalTargets(row, col) };
      renderBoard();
    }
  }

  function resetGame() {
    state.board = createInitialBoard();
    state.turn = "w";
    state.selected = null;
    state.moveHistory = [];
    elNotationList.innerHTML = "";
    renderBoard();
    logger.info("game", "game.reset", {});
  }

  function undoMove() {
    var m = state.moveHistory.pop();
    if (!m) {
      logger.warn("game", "undo.empty", {});
      return;
    }

    setPiece(m.fromRow, m.fromCol, m.piece);
    setPiece(m.toRow, m.toCol, m.captured || "");
    state.turn = getColor(m.piece);
    state.selected = null;

    if (elNotationList.lastElementChild) {
      elNotationList.removeChild(elNotationList.lastElementChild);
    }

    renderBoard();
    logger.info("game", "undo.done", {
      from: toCellName(m.toRow, m.toCol),
      to: toCellName(m.fromRow, m.fromCol),
      piece: m.piece
    });
  }

  function bindTabs() {
    var tabs = document.querySelectorAll(".tab[data-target]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });

        tab.classList.add("active");
        var target = tab.dataset.target;
        document.getElementById("panel-" + target).classList.add("active");
      });
    });
  }

  function bindIf(el, event, handler) {
    if (el) {
      el.addEventListener(event, handler);
    }
  }

  function bindDivider() {
    if (!playPage || !stageDivider) {
      return;
    }

    var dragging = false;

    function onPointerMove(event) {
      if (!dragging) {
        return;
      }

      if (window.innerWidth <= 1360) {
        return;
      }

      var rect = playPage.getBoundingClientRect();
      var relative = ((event.clientX - rect.left) / rect.width) * 100;
      var clamped = Math.max(38, Math.min(68, relative));
      playPage.style.setProperty("--left-pane", clamped + "%");
    }

    function stopDragging() {
      if (!dragging) {
        return;
      }
      dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      persistDividerSplit();
      logger.info("layout", "divider.drag.end", {
        split: getComputedStyle(playPage).getPropertyValue("--left-pane").trim()
      });
    }

    stageDivider.addEventListener("pointerdown", function (event) {
      if (window.innerWidth <= 1360) {
        return;
      }
      dragging = true;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      stageDivider.setPointerCapture(event.pointerId);
      logger.info("layout", "divider.drag.start", {});
    });

    stageDivider.addEventListener("pointermove", onPointerMove);
    stageDivider.addEventListener("pointerup", stopDragging);
    stageDivider.addEventListener("pointercancel", stopDragging);
    window.addEventListener("pointerup", stopDragging);
  }

  function persistDividerSplit() {
    if (!playPage || window.innerWidth <= 1360) {
      return;
    }

    try {
      var split = getComputedStyle(playPage).getPropertyValue("--left-pane").trim();
      localStorage.setItem(SPLIT_STORAGE_KEY, split);
    } catch (error) {
      logger.warn("layout", "divider.persist.failed", { message: String(error && error.message || error) });
    }
  }

  function restoreDividerSplit() {
    if (!playPage || window.innerWidth <= 1360) {
      return;
    }

    try {
      var saved = localStorage.getItem(SPLIT_STORAGE_KEY);
      if (!saved) {
        return;
      }

      var value = parseFloat(saved);
      if (!Number.isFinite(value)) {
        return;
      }

      var clamped = Math.max(38, Math.min(68, value));
      playPage.style.setProperty("--left-pane", clamped + "%");
      logger.info("layout", "divider.restored", { split: clamped + "%" });
    } catch (error) {
      logger.warn("layout", "divider.restore.failed", { message: String(error && error.message || error) });
    }
  }

  function setMode(mode) {
    state.mode = mode;
    if (btnManual) btnManual.style.background = mode === "manual" ? "#e8f0ff" : "#ffffff";
    if (btnHumanAi) btnHumanAi.style.background = mode === "human_ai" ? "#e8f0ff" : "#ffffff";
    if (btnAiAi) btnAiAi.style.background = mode === "ai_ai" ? "#e8f0ff" : "#ffffff";
    logger.info("mode", "game-mode.changed", { mode: mode });
  }

  function bindButtons() {
    bindIf(btnReset, "click", resetGame);
    bindIf(btnUndo, "click", undoMove);

    bindIf(btnExportLogs, "click", function () {
      logger.exportJson();
      logger.info("logger", "logs.exported", { count: logger.getRecords().length });
    });

    bindIf(btnHints, "click", function () {
      state.hintsEnabled = !state.hintsEnabled;
      btnHints.style.background = state.hintsEnabled ? "#e8f0ff" : "#ffffff";
      renderBoard();
      logger.info("ui", "hints.toggled", { enabled: state.hintsEnabled });
    });

    bindIf(btnAuto, "click", function () {
      state.autoplay = !state.autoplay;
      btnAuto.textContent = state.autoplay ? "⏸" : "▶";
      logger.info("mode", "autoplay.toggled", { enabled: state.autoplay });
    });

    bindIf(btnNext, "click", function () {
      logger.info("game", "next.clicked", {});
    });

    bindIf(btnSound, "click", function () {
      state.muted = !state.muted;
      btnSound.textContent = state.muted ? "🔇" : "🔊";
      logger.info("audio", "sound.toggled", { muted: state.muted });
    });

    bindIf(btnNarration, "click", function () {
      state.narrationOn = !state.narrationOn;
      btnNarration.textContent = state.narrationOn ? "🎤" : "⏸";
      logger.info("audio", "narration.toggled", { enabled: state.narrationOn });
    });

    bindIf(btnManual, "click", function () { setMode("manual"); });
    bindIf(btnHumanAi, "click", function () { setMode("human_ai"); });
    bindIf(btnAiAi, "click", function () { setMode("ai_ai"); });

    bindIf(btnColor, "click", function () {
      state.playerColor = state.playerColor === "white" ? "black" : "white";
      btnColor.textContent = state.playerColor === "white" ? "⚪" : "⚫";
      logger.info("mode", "player-color.changed", { color: state.playerColor });
    });

    bindIf(btnExplain, "click", function () {
      if (expandPanel) {
        expandPanel.innerHTML = "<div class='expand-placeholder'>解说区：后续接入教程与题库解释输出。</div>";
      }
      logger.info("panel", "explain.clicked", {});
    });

    bindIf(btnSaveExplain, "click", function () {
      logger.info("panel", "explain.saved", {});
    });

    bindIf(btnSaveNote, "click", function () {
      logger.info("panel", "note.saved", { moveCount: state.moveHistory.length });
    });

    bindIf(volumeRange, "input", function () {
      volumeValue.textContent = volumeRange.value;
      logger.debug("ui", "volume.changed", { value: Number(volumeRange.value) });
    });

    bindIf(speedRange, "input", function () {
      speedValue.textContent = speedRange.value;
      logger.debug("ui", "speed.changed", { value: Number(speedRange.value) });
    });
  }

  function init() {
    restoreDividerSplit();
    setupBoardCoords();
    bindTabs();
    bindButtons();
    bindDivider();
    resetGame();
    setMode("manual");
    if (btnHints) btnHints.style.background = "#e8f0ff";
    logger.info("app", "boot.completed", {
      mode: "manual",
      features: ["manual-play", "undo", "reset", "log-export", "svg-pieces"]
    });
  }

  init();
})();
