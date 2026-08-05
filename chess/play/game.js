(function () {
  "use strict";

  var PIECE_ASSET = {
    wk: "wK.svg", wq: "wQ.svg", wr: "wR.svg", wb: "wB.svg", wn: "wN.svg", wp: "wP.svg",
    bk: "bK.svg", bq: "bQ.svg", br: "bR.svg", bb: "bB.svg", bn: "bN.svg", bp: "bP.svg"
  };

  var FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  var RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
  var SPLIT_STORAGE_KEY = "mindsevo:chess:play:left-pane";
  var ENGINE_API_BASE = "http://localhost:8787";
  var DISPLAY_SETTINGS_KEY = "cognichess:display-settings";

  var PIECE_UNICODE = {
    wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
    bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
  };

  var BOARD_THEMES = {
    classic: { light: "#f1f1cf", dark: "#769656" },
    ocean: { light: "#d9ecff", dark: "#4f7fb3" },
    wood: { light: "#f6e5c9", dark: "#b9855a" }
  };

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
    autoplay: false,
    aiThinking: false,
    aiVsAiToken: 0,
    aiVsAiSessionStarted: false,
    castlingRights: null,
    enPassantTarget: null,
    lastMove: null,
    checkSquare: null,
    gameOver: false,
    gameResultText: "",
    humanAi: null,
    aiVsAi: {
      black: null,
      white: null
    },
    display: {
      boardTheme: "classic",
      pieceStyle: "svg"
    }
  };

  var elBoard = document.getElementById("board");
  var elTurnStatus = document.getElementById("turnStatus");
  var elNotationList = document.getElementById("notationList");
  var elLogConsole = document.getElementById("logConsole");
  var expandPanel = document.getElementById("expandPanel");
  var manualWorkspace = document.getElementById("manualWorkspace");
  var humanAiPanel = document.getElementById("humanAiPanel");
  var aiVsAiPanel = document.getElementById("aiVsAiPanel");
  var bankPanel = document.querySelector(".bank-panel");
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

  var soundManager = createSoundManager();
  var voiceManager = createVoiceManager();

  logger.setSink(function (record) {
    var line = document.createElement("div");
    line.className = "log-line " + record.level;
    var payloadText = record.payload ? " " + JSON.stringify(record.payload) : "";
    line.textContent = "#" + record.id + " [" + record.level.toUpperCase() + "] " + record.module + "." + record.event + payloadText;
    elLogConsole.appendChild(line);
    elLogConsole.scrollTop = elLogConsole.scrollHeight;
  });

  function createSoundManager() {
    var audioCtx = null;
    var assets = {
      move: createAudio("./assets/sounds/move.wav"),
      capture: createAudio("./assets/sounds/capture.wav"),
      check: createAudio("./assets/sounds/check.wav"),
      gameEnd: createAudio("./assets/sounds/game_over.wav")
    };

    function createAudio(src) {
      var audio = new Audio(src);
      audio.preload = "auto";
      return audio;
    }

    function cloneAndPlay(audio) {
      if (!audio || state.muted) {
        return;
      }
      try {
        var sound = audio.cloneNode();
        sound.volume = Number(volumeRange ? volumeRange.value : 80) / 100;
        sound.play().catch(function () {});
      } catch (error) {
        logger.warn("audio", "sound.play.failed", { message: String(error && error.message || error) });
      }
    }

    function beep() {
      if (state.muted) {
        return;
      }
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.value = 220;
        gain.gain.value = 0.035 * (Number(volumeRange ? volumeRange.value : 80) / 100);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch (error) {
        logger.warn("audio", "beep.failed", { message: String(error && error.message || error) });
      }
    }

    return {
      playMove: function (move) {
        if (!move) {
          return;
        }
        if (move.isCheckmate) {
          cloneAndPlay(assets.gameEnd);
          return;
        }
        if (move.isCheck) {
          cloneAndPlay(assets.check);
          return;
        }
        if (move.isCapture || move.isEnPassant) {
          cloneAndPlay(assets.capture);
          return;
        }
        cloneAndPlay(assets.move);
      },
      playIllegal: function () {
        beep();
      }
    };
  }

  function loadDisplaySettings() {
    try {
      var raw = localStorage.getItem(DISPLAY_SETTINGS_KEY);
      if (!raw) {
        return;
      }
      var parsed = JSON.parse(raw);
      if (parsed && parsed.boardTheme && parsed.pieceStyle) {
        state.display.boardTheme = parsed.boardTheme;
        state.display.pieceStyle = parsed.pieceStyle;
      }
    } catch (error) {
      logger.warn("display", "settings.parse.failed", { message: String(error && error.message || error) });
    }
  }

  function applyBoardThemeVariables() {
    var theme = BOARD_THEMES[state.display.boardTheme] || BOARD_THEMES.classic;
    document.documentElement.style.setProperty("--board-light", theme.light);
    document.documentElement.style.setProperty("--board-dark", theme.dark);
  }

  function buildPieceNode(piece) {
    if (!piece) {
      return null;
    }

    if (state.display.pieceStyle === "svg") {
      var pieceEl = document.createElement("img");
      pieceEl.className = "piece-svg";
      pieceEl.alt = piece;
      pieceEl.src = "./assets/pieces/" + PIECE_ASSET[piece];
      return pieceEl;
    }

    var txt = document.createElement("span");
    txt.className = state.display.pieceStyle === "unicode-min" ? "piece-text piece-text-min" : "piece-text";
    txt.textContent = PIECE_UNICODE[piece] || "";
    return txt;
  }

  function createVoiceManager() {
    var lastSpeakAt = 0;

    function stop() {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    function speak(text, opts) {
      if (!state.narrationOn || state.muted || !text || !window.speechSynthesis) {
        return;
      }

      var now = Date.now();
      if ((!opts || !opts.force) && now - lastSpeakAt < 350) {
        return;
      }
      lastSpeakAt = now;

      try {
        stop();
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 0.78 + (Number(speedRange ? speedRange.value : 5) - 5) * 0.04;
        utterance.pitch = 1;
        utterance.volume = Number(volumeRange ? volumeRange.value : 80) / 100;

        var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        if (voices && voices.length) {
          for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang === "zh-CN" || String(voices[i].lang || "").indexOf("zh") === 0) {
              utterance.voice = voices[i];
              break;
            }
          }
        }

        window.speechSynthesis.speak(utterance);
        logger.debug("voice", "speak", { text: text });
      } catch (error) {
        logger.warn("voice", "speak.failed", { message: String(error && error.message || error) });
      }
    }

    function pieceName(piece) {
      var kind = getKind(piece);
      if (kind === "k") return "王";
      if (kind === "q") return "后";
      if (kind === "r") return "车";
      if (kind === "b") return "象";
      if (kind === "n") return "马";
      if (kind === "p") return "兵";
      return "棋子";
    }

    function sideName(color) {
      return color === "w" ? "白方" : "黑方";
    }

    return {
      stop: stop,
      speak: speak,
      onSelect: function (piece, moveCount) {
        speak(sideName(getColor(piece)) + pieceName(piece) + "，可走" + moveCount + "步");
      },
      onIllegal: function () {
        speak("这步不能走");
      },
      onMove: function (piece, move, meta) {
        var text = sideName(getColor(piece)) + pieceName(piece);
        if (meta.isCastle) {
          text += "王车易位";
        } else {
          text += "走到" + toCellName(move.toRow, move.toCol);
          if (meta.isEnPassant) {
            text += "，吃过路兵";
          } else if (meta.isPromotion) {
            text += "，升变";
          } else if (meta.isCapture) {
            text += "，吃子";
          }
        }

        if (meta.isCheckmate) {
          text += "，将死";
        } else if (meta.isCheck) {
          text += "，将军";
        } else if (meta.isStalemate) {
          text += "，逼和";
        }

        speak(text, { force: true });
      },
      onReset: function () {
        speak("棋局已重置", { force: true });
      },
      onUndo: function () {
        speak("已悔棋", { force: true });
      }
    };
  }

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

  function createCastlingRights() {
    return {
      w: { kingside: true, queenside: true },
      b: { kingside: true, queenside: true }
    };
  }

  function cloneBoard(board) {
    return board.map(function (row) {
      return row.slice();
    });
  }

  function cloneCastlingRights(rights) {
    return {
      w: { kingside: !!rights.w.kingside, queenside: !!rights.w.queenside },
      b: { kingside: !!rights.b.kingside, queenside: !!rights.b.queenside }
    };
  }

  function cloneTarget(target) {
    if (!target) {
      return null;
    }
    return { row: target.row, col: target.col };
  }

  function snapshotState() {
    return {
      board: cloneBoard(state.board),
      turn: state.turn,
      castlingRights: cloneCastlingRights(state.castlingRights),
      enPassantTarget: cloneTarget(state.enPassantTarget),
      lastMove: state.lastMove ? Object.assign({}, state.lastMove) : null,
      checkSquare: cloneTarget(state.checkSquare),
      gameOver: state.gameOver,
      gameResultText: state.gameResultText
    };
  }

  function restoreSnapshot(snapshot) {
    state.board = cloneBoard(snapshot.board);
    state.turn = snapshot.turn;
    state.castlingRights = cloneCastlingRights(snapshot.castlingRights);
    state.enPassantTarget = cloneTarget(snapshot.enPassantTarget);
    state.lastMove = snapshot.lastMove ? Object.assign({}, snapshot.lastMove) : null;
    state.checkSquare = cloneTarget(snapshot.checkSquare);
    state.gameOver = !!snapshot.gameOver;
    state.gameResultText = snapshot.gameResultText || "";
    state.selected = null;
  }

  function resetEngineState() {
    state.board = createInitialBoard();
    state.turn = "w";
    state.selected = null;
    state.moveHistory = [];
    state.castlingRights = createCastlingRights();
    state.enPassantTarget = null;
    state.lastMove = null;
    state.checkSquare = null;
    state.gameOver = false;
    state.gameResultText = "";
  }

  function createAiMock(side) {
    return {
      side: side,
      score: side === "black" ? -0.8 : 0.8,
      depth: 0,
      nodes: 0,
      time: 0,
      pv: "等待分析...",
      eval: "等待分析...",
      level: "高级10: 特级大师 (2400)",
      preset: "advanced"
    };
  }

  function ensureAiMockData() {
    if (!state.humanAi) {
      state.humanAi = {
        score: 0.6,
        depth: 0,
        nodes: 0,
        time: 0,
        pv: "等待分析...",
        eval: "🎯 局面评估系统已就绪\n开始下棋后，AI将为您分析局面优势，提供专业的棋局建议。\n⚡ 后续将整合 LLM 和专家系统，提供更深入的分析。",
        level: "高级10: 特级大师 (2400)",
        maxRetries: 2
      };
    }
    if (!state.aiVsAi.black) {
      state.aiVsAi.black = createAiMock("black");
    }
    if (!state.aiVsAi.white) {
      state.aiVsAi.white = createAiMock("white");
    }
  }

  function formatNodes(nodes) {
    if (nodes >= 1000000) {
      return (nodes / 1000000).toFixed(1) + "M";
    }
    if (nodes >= 1000) {
      return (nodes / 1000).toFixed(1) + "K";
    }
    return String(nodes);
  }

  function updateAiMockTick() {
    ensureAiMockData();
    state.humanAi.depth = Math.min(24, state.humanAi.depth + 1);
    state.humanAi.nodes += 15000;
    state.humanAi.time += 220;
    state.humanAi.score = Math.max(-3.2, Math.min(3.2, state.humanAi.score + 0.05));
    state.humanAi.pv = "e2e4 e7e5 g1f3";
    state.humanAi.eval = state.humanAi.score >= 0
      ? "🎯 白方保持主动，建议继续发展子力并争夺中心。"
      : "🎯 黑方反击机会增加，建议谨慎处理王翼安全。";

    [state.aiVsAi.black, state.aiVsAi.white].forEach(function (item, index) {
      item.depth = Math.min(24, item.depth + 1 + index);
      item.nodes += 12000 + index * 3000;
      item.time += 180 + index * 40;
      item.score = Math.max(-3.2, Math.min(3.2, item.score + (index === 0 ? 0.08 : -0.06)));
      item.pv = index === 0 ? "e7e5 g8f6 d7d6" : "e2e4 g1f3 f1c4";
      item.eval = index === 0 ? "黑方保持稳固结构，等待中心反击。" : "白方空间略优，适合继续发展子力。";
    });
  }

  function getAiVsAiEngineSettings() {
    var speed = Number(speedRange ? speedRange.value : 5);
    speed = Number.isFinite(speed) ? Math.max(1, Math.min(10, speed)) : 5;

    return {
      speed: speed,
      skillLevel: Math.max(0, Math.min(20, Math.round(speed * 2))),
      movetime: 240 + speed * 120,
      depth: Math.max(8, Math.min(24, 6 + speed)),
      multiPv: speed >= 8 ? 3 : 2,
      levelText: "速度" + speed + "｜S" + Math.max(0, Math.min(20, Math.round(speed * 2))) + " D" + Math.max(8, Math.min(24, 6 + speed)) + " T" + (240 + speed * 120) + "ms"
    };
  }

  function getAiPresetConfig(preset) {
    if (preset === "beginner") return { skillLevel: 4, depth: 8, movetime: 420, multiPv: 1, label: "初学" };
    if (preset === "intermediate") return { skillLevel: 8, depth: 10, movetime: 650, multiPv: 2, label: "中级" };
    if (preset === "expert") return { skillLevel: 14, depth: 14, movetime: 1050, multiPv: 2, label: "专家" };
    if (preset === "master") return { skillLevel: 20, depth: 18, movetime: 1500, multiPv: 3, label: "大师" };
    return { skillLevel: 11, depth: 12, movetime: 820, multiPv: 2, label: "高级" };
  }

  function getAiVsAiSettingsForSide(side) {
    ensureAiMockData();
    var panel = side === "w" ? state.aiVsAi.white : state.aiVsAi.black;
    var preset = panel.preset || "advanced";
    var config = getAiPresetConfig(preset);
    return {
      skillLevel: config.skillLevel,
      depth: config.depth,
      movetime: config.movetime,
      multiPv: config.multiPv,
      levelText: config.label + "｜S" + config.skillLevel + " D" + config.depth + " T" + config.movetime + "ms",
      preset: preset
    };
  }

  function syncAiVsAiPresetsFromUI() {
    if (!aiVsAiPanel) return;
    ensureAiMockData();
    var cards = aiVsAiPanel.querySelectorAll(".engine-card");
    if (cards[0]) {
      var blackPreset = cards[0].querySelector('[data-role="preset"]');
      if (blackPreset) state.aiVsAi.black.preset = blackPreset.value || "advanced";
    }
    if (cards[1]) {
      var whitePreset = cards[1].querySelector('[data-role="preset"]');
      if (whitePreset) state.aiVsAi.white.preset = whitePreset.value || "advanced";
    }
  }

  function renderAiCard(root, data) {
    if (!root || !data) {
      return;
    }

    var whiteWidth = Math.max(10, Math.min(90, 50 + data.score * 10));
    var blackWidth = 100 - whiteWidth;
    var advWhite = root.querySelector('[data-role="adv-white"]');
    var advBlack = root.querySelector('[data-role="adv-black"]');
    var advText = root.querySelector('[data-role="adv-text"]');
    var depth = root.querySelector('[data-role="depth"]');
    var nodes = root.querySelector('[data-role="nodes"]');
    var time = root.querySelector('[data-role="time"]');
    var pv = root.querySelector('[data-role="pv"]');
    var evalBox = root.querySelector('[data-role="eval"]');
    var level = root.querySelector('[data-role="level"]');

    if (advWhite) advWhite.style.width = whiteWidth + "%";
    if (advBlack) advBlack.style.width = blackWidth + "%";
    if (advText) advText.textContent = "等价分析: " + (data.score > 0 ? "白方略优" : data.score < 0 ? "黑方略优" : "均势");
    if (depth) depth.textContent = "深度: " + data.depth + " 层";
    if (nodes) nodes.textContent = "节点: " + formatNodes(data.nodes);
    if (time) time.textContent = "时间: " + (data.time / 1000).toFixed(1) + "s";
    if (pv) pv.textContent = data.pv;
    if (evalBox) evalBox.textContent = data.eval;
    if (level) level.textContent = data.level;
  }

  function renderAiVsAiPanel() {
    if (!aiVsAiPanel) {
      return;
    }
    ensureAiMockData();
    var cards = aiVsAiPanel.querySelectorAll(".engine-card");
    if (cards[0]) renderAiCard(cards[0], state.aiVsAi.black);
    if (cards[1]) renderAiCard(cards[1], state.aiVsAi.white);
  }

  function renderHumanAiPanel() {
    if (!humanAiPanel) {
      return;
    }
    ensureAiMockData();
    var card = humanAiPanel.querySelector(".engine-card");
    if (card) {
      renderAiCard(card, state.humanAi);
    }
  }

  function updateAiVsAiFromResponse(side, payload, settings) {
    ensureAiMockData();
    var panelState = side === "w" ? state.aiVsAi.white : state.aiVsAi.black;
    var info = payload && payload.info ? payload.info : {};

    panelState.depth = Number.isFinite(info.depth) ? info.depth : panelState.depth;
    panelState.nodes = Number.isFinite(info.nodes) ? info.nodes : panelState.nodes;
    panelState.time = Number.isFinite(info.time) ? info.time : panelState.time;
    panelState.level = settings.levelText;
    if (info.score && Number.isFinite(info.score.value)) {
      panelState.score = info.score.type === "mate" ? (info.score.value > 0 ? 9 : -9) : info.score.value;
    }

    if (Array.isArray(payload && payload.multipv) && payload.multipv.length) {
      panelState.pv = payload.multipv.slice(0, Math.min(payload.multipv.length, settings.multiPv)).map(function (line, idx) {
        var pvText = Array.isArray(line.pv) && line.pv.length ? line.pv.slice(0, 8).join(" ") : "-";
        return (idx + 1) + ") " + pvText;
      }).join(" | ");
    } else {
      panelState.pv = Array.isArray(info.pv) && info.pv.length ? info.pv.join(" ") : "等待分析...";
    }

    panelState.eval = payload && payload.bestMove
      ? ((side === "w" ? "白方" : "黑方") + "建议: " + payload.bestMove)
      : "等待分析...";
    renderAiVsAiPanel();
  }

  function invalidateAiVsAiLoop() {
    state.aiVsAiToken += 1;
    state.aiThinking = false;
  }

  function stopAiVsAiPlayback() {
    if (state.mode === "ai_ai" || state.autoplay) {
      invalidateAiVsAiLoop();
    }
    state.autoplay = false;
  }

  function updateAiVsAiModeButton() {
    if (!btnAiAi) {
      return;
    }
    if (state.mode !== "ai_ai") {
      btnAiAi.textContent = "🤖";
      btnAiAi.title = "AI对战模式";
      return;
    }
    btnAiAi.textContent = state.autoplay ? "⏸🤖" : "▶🤖";
    btnAiAi.title = state.autoplay ? "暂停AI对战" : (state.aiVsAiSessionStarted ? "继续AI对战" : "开始AI对战");
  }

  function toggleAiVsAiByModeButton() {
    if (state.mode !== "ai_ai") {
      return;
    }

    if (state.autoplay) {
      stopAiVsAiPlayback();
      updateAiVsAiModeButton();
      voiceManager.speak("暂停AI对战", { force: true });
      logger.info("mode", "ai-vs-ai.paused.by-mode-button", {});
      renderAiVsAiPanel();
      return;
    }

    state.aiVsAiSessionStarted = true;
    state.autoplay = true;
    state.aiVsAiToken += 1;
    updateAiVsAiModeButton();
    voiceManager.speak("开始AI对战", { force: true });
    logger.info("mode", "ai-vs-ai.started.by-mode-button", {});
    requestAiVsAiTurn(0, state.aiVsAiToken);
    renderAiVsAiPanel();
  }

  function getHumanAiEngineSettings() {
    var speed = Number(speedRange ? speedRange.value : 5);
    speed = Number.isFinite(speed) ? Math.max(1, Math.min(10, speed)) : 5;

    var skillLevel = Math.max(0, Math.min(20, Math.round(speed * 2)));
    var movetime = 220 + speed * 120;
    var depth = Math.max(6, Math.min(24, 6 + speed));
    var multiPv = speed >= 8 ? 3 : 2;

    return {
      speed: speed,
      skillLevel: skillLevel,
      movetime: movetime,
      depth: depth,
      multiPv: multiPv,
      levelText: "速度" + speed + "｜S" + skillLevel + " D" + depth + " T" + movetime + "ms"
    };
  }

  function resolvePlayerColorCode() {
    return state.playerColor === "white" ? "w" : "b";
  }

  function toFen() {
    var rows = [];
    for (var row = 0; row < 8; row++) {
      var fenRow = "";
      var empty = 0;
      for (var col = 0; col < 8; col++) {
        var piece = getPiece(row, col);
        if (!piece) {
          empty += 1;
          continue;
        }
        if (empty > 0) {
          fenRow += String(empty);
          empty = 0;
        }
        var symbol = getKind(piece);
        fenRow += getColor(piece) === "w" ? symbol.toUpperCase() : symbol;
      }
      if (empty > 0) {
        fenRow += String(empty);
      }
      rows.push(fenRow);
    }

    var castling = "";
    if (state.castlingRights.w.kingside && getPiece(7, 4) === "wk" && getPiece(7, 7) === "wr") castling += "K";
    if (state.castlingRights.w.queenside && getPiece(7, 4) === "wk" && getPiece(7, 0) === "wr") castling += "Q";
    if (state.castlingRights.b.kingside && getPiece(0, 4) === "bk" && getPiece(0, 7) === "br") castling += "k";
    if (state.castlingRights.b.queenside && getPiece(0, 4) === "bk" && getPiece(0, 0) === "br") castling += "q";
    if (!castling) castling = "-";

    var ep = "-";
    if (state.enPassantTarget) {
      ep = FILES[state.enPassantTarget.col] + String(8 - state.enPassantTarget.row);
    }

    return rows.join("/") + " " + state.turn + " " + castling + " " + ep + " 0 1";
  }

  function parseUciMove(uci) {
    if (!uci || uci.length < 4) {
      return null;
    }

    var fromCol = FILES.indexOf(uci.charAt(0));
    var fromRow = 8 - Number(uci.charAt(1));
    var toCol = FILES.indexOf(uci.charAt(2));
    var toRow = 8 - Number(uci.charAt(3));

    if (fromCol < 0 || toCol < 0 || !inBounds(fromRow, fromCol) || !inBounds(toRow, toCol)) {
      return null;
    }

    return {
      fromRow: fromRow,
      fromCol: fromCol,
      toRow: toRow,
      toCol: toCol,
      promotionKind: uci.length >= 5 ? uci.charAt(4).toLowerCase() : null
    };
  }

  function updateHumanAiFromResponse(payload) {
    ensureAiMockData();
    var engineSettings = getHumanAiEngineSettings();
    var info = payload && payload.info ? payload.info : {};
    state.humanAi.depth = Number.isFinite(info.depth) ? info.depth : state.humanAi.depth;
    state.humanAi.nodes = Number.isFinite(info.nodes) ? info.nodes : state.humanAi.nodes;
    state.humanAi.time = Number.isFinite(info.time) ? info.time : state.humanAi.time;
    state.humanAi.level = engineSettings.levelText;
    if (info.score && Number.isFinite(info.score.value)) {
      state.humanAi.score = info.score.type === "mate" ? (info.score.value > 0 ? 9 : -9) : info.score.value;
    }

    if (Array.isArray(payload && payload.multipv) && payload.multipv.length) {
      var topPv = payload.multipv.slice(0, Math.min(payload.multipv.length, engineSettings.multiPv));
      state.humanAi.pv = topPv.map(function (line, idx) {
        var pvText = Array.isArray(line.pv) && line.pv.length ? line.pv.slice(0, 8).join(" ") : "-";
        var scoreText = "";
        if (line.score && Number.isFinite(line.score.value)) {
          scoreText = line.score.type === "mate" ? (" #" + line.score.value) : (line.score.value >= 0 ? " +" : " ") + line.score.value.toFixed(2);
        }
        return (idx + 1) + ") " + pvText + scoreText;
      }).join(" | ");
    } else {
      state.humanAi.pv = Array.isArray(info.pv) && info.pv.length ? info.pv.join(" ") : "等待分析...";
    }

    state.humanAi.eval = payload && payload.bestMove
      ? "AI 建议走法: " + payload.bestMove + "。当前评估已同步到面板。"
      : "等待分析...";
    renderHumanAiPanel();
  }

  async function requestHumanAiTurn(retryCount) {
    var retries = Number.isFinite(retryCount) ? retryCount : 0;
    if (state.mode !== "human_ai" || state.gameOver || state.aiThinking || state.turn === resolvePlayerColorCode()) {
      return;
    }

    ensureAiMockData();
    var engineSettings = getHumanAiEngineSettings();
    state.aiThinking = true;
    state.humanAi.level = engineSettings.levelText;
    state.humanAi.eval = "AI 正在分析当前局面...（第" + (retries + 1) + "次）";
    renderHumanAiPanel();

    try {
      var response = await fetch(ENGINE_API_BASE + "/api/v1/chess/engine/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: toFen(),
          movetime: engineSettings.movetime,
          depth: engineSettings.depth,
          skillLevel: engineSettings.skillLevel,
          multiPv: engineSettings.multiPv
        })
      });

      var payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.detail || payload.error || "Stockfish analyze failed");
      }

      updateHumanAiFromResponse(payload);

      var parsed = parseUciMove(payload.bestMove);
      if (!parsed) {
        throw new Error("Invalid bestmove returned: " + payload.bestMove);
      }

      var legalMoves = getLegalMoves(parsed.fromRow, parsed.fromCol);
      var aiMove = findMoveByTarget(legalMoves, parsed.toRow, parsed.toCol);
      if (!aiMove) {
        throw new Error("Bestmove is not legal in current local state: " + payload.bestMove);
      }
      if (parsed.promotionKind) {
        aiMove.promotionKind = parsed.promotionKind;
      }

      window.setTimeout(function () {
        state.aiThinking = false;
        executeMove(aiMove);
      }, 200);
      return;
    } catch (error) {
      state.aiThinking = false;
      ensureAiMockData();
      var detail = String(error && error.message ? error.message : error);
      if (retries < state.humanAi.maxRetries) {
        state.humanAi.eval = "引擎调用失败，正在重试...（" + (retries + 1) + "/" + state.humanAi.maxRetries + "）";
        renderHumanAiPanel();
        window.setTimeout(function () {
          requestHumanAiTurn(retries + 1);
        }, 320 * (retries + 1));
        logger.warn("human-ai.request.retry", { retry: retries + 1, detail: detail });
        return;
      }

      state.humanAi.eval = "引擎调用失败：" + detail + "。请先启动 web/server 下的 node src/server.js";
      renderHumanAiPanel();
      logger.error("human-ai.request.failed", { detail: detail });
    }
  }

  async function requestAiVsAiTurn(retryCount, token) {
    var retries = Number.isFinite(retryCount) ? retryCount : 0;
    var runToken = Number.isFinite(token) ? token : state.aiVsAiToken;
    if (runToken !== state.aiVsAiToken) {
      return;
    }

    if (state.mode !== "ai_ai" || !state.autoplay || state.gameOver || state.aiThinking) {
      return;
    }

    ensureAiMockData();
    var side = state.turn;
    var sideState = side === "w" ? state.aiVsAi.white : state.aiVsAi.black;
    syncAiVsAiPresetsFromUI();
    var settings = getAiVsAiSettingsForSide(side);
    state.aiThinking = true;
    sideState.level = settings.levelText;
    sideState.eval = (side === "w" ? "白方" : "黑方") + "正在分析...（第" + (retries + 1) + "次）";
    renderAiVsAiPanel();

    try {
      var response = await fetch(ENGINE_API_BASE + "/api/v1/chess/engine/duel/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: toFen(),
          side: side === "w" ? "white" : "black",
          settings: {
            movetime: settings.movetime,
            depth: settings.depth,
            skillLevel: settings.skillLevel,
            multiPv: settings.multiPv
          }
        })
      });

      var payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.detail || payload.error || "Stockfish analyze failed");
      }

      updateAiVsAiFromResponse(side, payload, settings);

      var parsed = parseUciMove(payload.bestMove);
      if (!parsed) {
        throw new Error("Invalid bestmove returned: " + payload.bestMove);
      }

      var legalMoves = getLegalMoves(parsed.fromRow, parsed.fromCol);
      var aiMove = findMoveByTarget(legalMoves, parsed.toRow, parsed.toCol);
      if (!aiMove) {
        throw new Error("Bestmove is not legal in current local state: " + payload.bestMove);
      }
      if (parsed.promotionKind) {
        aiMove.promotionKind = parsed.promotionKind;
      }

      if (runToken !== state.aiVsAiToken || state.mode !== "ai_ai" || !state.autoplay) {
        state.aiThinking = false;
        return;
      }

      window.setTimeout(function () {
        if (runToken !== state.aiVsAiToken || state.mode !== "ai_ai" || !state.autoplay) {
          state.aiThinking = false;
          return;
        }
        state.aiThinking = false;
        executeMove(aiMove);
      }, 120);
      return;
    } catch (error) {
      state.aiThinking = false;
      ensureAiMockData();
      var detail = String(error && error.message ? error.message : error);
      if (retries < 2 && runToken === state.aiVsAiToken && state.mode === "ai_ai" && state.autoplay) {
        sideState.eval = "引擎调用失败，正在重试...（" + (retries + 1) + "/2）";
        renderAiVsAiPanel();
        window.setTimeout(function () {
          requestAiVsAiTurn(retries + 1, runToken);
        }, 320 * (retries + 1));
        logger.warn("ai-vs-ai.request.retry", { retry: retries + 1, detail: detail });
        return;
      }

      sideState.eval = "引擎调用失败：" + detail;
      renderAiVsAiPanel();
      logger.error("ai-vs-ai.request.failed", { detail: detail });
    }
  }

  function setAiVsAiView(enabled) {
    if (manualWorkspace) {
      manualWorkspace.classList.toggle("hidden", enabled || state.mode === "human_ai");
    }
    if (humanAiPanel) {
      humanAiPanel.classList.toggle("hidden", state.mode !== "human_ai");
    }
    if (aiVsAiPanel) {
      aiVsAiPanel.classList.toggle("hidden", !enabled);
    }
    if (bankPanel) {
      bankPanel.classList.toggle("hidden", enabled || state.mode === "human_ai");
    }
    if (stageDivider) {
      stageDivider.style.display = enabled ? "none" : "";
    }
    if (btnAuto) {
      if (state.mode === "ai_ai") {
        btnAuto.textContent = "▶";
        btnAuto.title = "AI对战由🤖按钮控制";
      } else {
        btnAuto.textContent = state.autoplay ? "⏸" : "▶";
        btnAuto.title = "自动播放";
      }
    }
    updateAiVsAiModeButton();
  }

  function setupBoardCoords() {
    function fill(parentId, values) {
      var el = document.getElementById(parentId);
      if (!el) {
        return;
      }
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
          var pieceNode = buildPieceNode(piece);
          if (pieceNode) {
            square.appendChild(pieceNode);
          }
        }

        if (state.lastMove && state.lastMove.fromRow === row && state.lastMove.fromCol === col) {
          square.classList.add("last-from");
        }
        if (state.lastMove && state.lastMove.toRow === row && state.lastMove.toCol === col) {
          square.classList.add("last-to");
        }
        if (state.checkSquare && state.checkSquare.row === row && state.checkSquare.col === col) {
          square.classList.add("check");
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

    if (state.gameOver) {
      elTurnStatus.textContent = state.gameResultText;
    } else if (state.checkSquare) {
      elTurnStatus.textContent = "当前回合：" + (state.turn === "w" ? "白方" : "黑方") + "（被将军）";
    } else {
      elTurnStatus.textContent = "当前回合：" + (state.turn === "w" ? "白方" : "黑方");
    }
  }

  function getPiece(row, col, board) {
    var activeBoard = board || state.board;
    return activeBoard[row][col];
  }

  function setPiece(row, col, piece, board) {
    var activeBoard = board || state.board;
    activeBoard[row][col] = piece;
  }

  function getColor(piece) {
    return piece ? piece.charAt(0) : "";
  }

  function getKind(piece) {
    return piece ? piece.charAt(1) : "";
  }

  function opposite(color) {
    return color === "w" ? "b" : "w";
  }

  function toCellName(row, col) {
    return FILES[col] + String(8 - row);
  }

  function inBounds(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  function isEmpty(row, col, board) {
    return inBounds(row, col) && !getPiece(row, col, board);
  }

  function isEnemy(row, col, color, board) {
    var piece = getPiece(row, col, board);
    return !!piece && getColor(piece) !== color;
  }

  function isFriendly(row, col, color, board) {
    var piece = getPiece(row, col, board);
    return !!piece && getColor(piece) === color;
  }

  function findKing(board, color) {
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        if (getPiece(row, col, board) === color + "k") {
          return { row: row, col: col };
        }
      }
    }
    return null;
  }

  function isSlidingAttack(board, row, col, byColor, stepRow, stepCol, attackers) {
    var r = row + stepRow;
    var c = col + stepCol;
    while (inBounds(r, c)) {
      var piece = getPiece(r, c, board);
      if (piece) {
        return getColor(piece) === byColor && attackers.indexOf(getKind(piece)) !== -1;
      }
      r += stepRow;
      c += stepCol;
    }
    return false;
  }

  function isSquareAttacked(board, row, col, byColor) {
    var pawnDir = byColor === "w" ? -1 : 1;
    var pawnRow = row - pawnDir;
    if (inBounds(pawnRow, col - 1) && getPiece(pawnRow, col - 1, board) === byColor + "p") {
      return true;
    }
    if (inBounds(pawnRow, col + 1) && getPiece(pawnRow, col + 1, board) === byColor + "p") {
      return true;
    }

    var knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (var i = 0; i < knightMoves.length; i++) {
      var nr = row + knightMoves[i][0];
      var nc = col + knightMoves[i][1];
      if (inBounds(nr, nc) && getPiece(nr, nc, board) === byColor + "n") {
        return true;
      }
    }

    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        var kr = row + dr;
        var kc = col + dc;
        if (inBounds(kr, kc) && getPiece(kr, kc, board) === byColor + "k") {
          return true;
        }
      }
    }

    var rookDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var r = 0; r < rookDirs.length; r++) {
      if (isSlidingAttack(board, row, col, byColor, rookDirs[r][0], rookDirs[r][1], ["r", "q"])) {
        return true;
      }
    }

    var bishopDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (var b = 0; b < bishopDirs.length; b++) {
      if (isSlidingAttack(board, row, col, byColor, bishopDirs[b][0], bishopDirs[b][1], ["b", "q"])) {
        return true;
      }
    }

    return false;
  }

  function isInCheck(board, color) {
    var king = findKing(board, color);
    if (!king) {
      return false;
    }
    return isSquareAttacked(board, king.row, king.col, opposite(color));
  }

  function createMove(fromRow, fromCol, toRow, toCol, extras) {
    var move = {
      fromRow: fromRow,
      fromCol: fromCol,
      toRow: toRow,
      toCol: toCol,
      isCapture: false,
      isCastle: false,
      isEnPassant: false,
      isPromotion: false,
      promotionKind: null,
      castleSide: null
    };
    if (extras) {
      Object.assign(move, extras);
    }
    return move;
  }

  function canCastle(board, color, side, castlingRights) {
    var row = color === "w" ? 7 : 0;
    var rookCol = side === "kingside" ? 7 : 0;
    if (getPiece(row, rookCol, board) !== color + "r") {
      return false;
    }

    if (side === "kingside") {
      if (!isEmpty(row, 5, board) || !isEmpty(row, 6, board)) {
        return false;
      }
      if (isSquareAttacked(board, row, 4, opposite(color)) || isSquareAttacked(board, row, 5, opposite(color)) || isSquareAttacked(board, row, 6, opposite(color))) {
        return false;
      }
      return true;
    }

    if (!isEmpty(row, 1, board) || !isEmpty(row, 2, board) || !isEmpty(row, 3, board)) {
      return false;
    }
    if (isSquareAttacked(board, row, 4, opposite(color)) || isSquareAttacked(board, row, 3, opposite(color)) || isSquareAttacked(board, row, 2, opposite(color))) {
      return false;
    }
    return true;
  }

  function getPseudoMoves(board, row, col, piece, castlingRights, enPassantTarget) {
    var color = getColor(piece);
    var kind = getKind(piece);
    var moves = [];

    if (kind === "p") {
      var direction = color === "w" ? -1 : 1;
      var startRow = color === "w" ? 6 : 1;
      var oneForward = row + direction;
      if (isEmpty(oneForward, col, board)) {
        moves.push(createMove(row, col, oneForward, col, { isPromotion: oneForward === 0 || oneForward === 7 }));
        var twoForward = row + direction * 2;
        if (row === startRow && isEmpty(twoForward, col, board)) {
          moves.push(createMove(row, col, twoForward, col));
        }
      }

      for (var dcPawn = -1; dcPawn <= 1; dcPawn += 2) {
        var captureRow = row + direction;
        var captureCol = col + dcPawn;
        if (!inBounds(captureRow, captureCol)) {
          continue;
        }
        if (isEnemy(captureRow, captureCol, color, board)) {
          moves.push(createMove(row, col, captureRow, captureCol, {
            isCapture: true,
            isPromotion: captureRow === 0 || captureRow === 7
          }));
        }
      }

      if (enPassantTarget && Math.abs(enPassantTarget.col - col) === 1 && enPassantTarget.row === row + direction) {
        moves.push(createMove(row, col, enPassantTarget.row, enPassantTarget.col, {
          isCapture: true,
          isEnPassant: true
        }));
      }
      return moves;
    }

    if (kind === "n") {
      var knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      for (var n = 0; n < knightMoves.length; n++) {
        var knr = row + knightMoves[n][0];
        var knc = col + knightMoves[n][1];
        if (inBounds(knr, knc) && !isFriendly(knr, knc, color, board)) {
          moves.push(createMove(row, col, knr, knc, { isCapture: !!getPiece(knr, knc, board) }));
        }
      }
      return moves;
    }

    if (kind === "k") {
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) {
            continue;
          }
          var kr = row + dr;
          var kc = col + dc;
          if (inBounds(kr, kc) && !isFriendly(kr, kc, color, board)) {
            moves.push(createMove(row, col, kr, kc, { isCapture: !!getPiece(kr, kc, board) }));
          }
        }
      }

      var rights = castlingRights[color];
      if (rights && !isInCheck(board, color)) {
        if (rights.kingside && canCastle(board, color, "kingside", castlingRights)) {
          moves.push(createMove(row, col, row, col + 2, { isCastle: true, castleSide: "kingside" }));
        }
        if (rights.queenside && canCastle(board, color, "queenside", castlingRights)) {
          moves.push(createMove(row, col, row, col - 2, { isCastle: true, castleSide: "queenside" }));
        }
      }
      return moves;
    }

    var directions = [];
    if (kind === "r") {
      directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    } else if (kind === "b") {
      directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    } else if (kind === "q") {
      directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    }

    for (var d = 0; d < directions.length; d++) {
      var rStep = directions[d][0];
      var cStep = directions[d][1];
      var r = row + rStep;
      var c = col + cStep;
      while (inBounds(r, c)) {
        if (isFriendly(r, c, color, board)) {
          break;
        }
        var occupant = getPiece(r, c, board);
        moves.push(createMove(row, col, r, c, { isCapture: !!occupant }));
        if (occupant) {
          break;
        }
        r += rStep;
        c += cStep;
      }
    }

    return moves;
  }

  function applyMove(board, move, castlingRights) {
    var nextBoard = cloneBoard(board);
    var nextRights = cloneCastlingRights(castlingRights);
    var piece = getPiece(move.fromRow, move.fromCol, nextBoard);
    var color = getColor(piece);
    var kind = getKind(piece);
    var targetPiece = getPiece(move.toRow, move.toCol, nextBoard);
    var result = {
      board: nextBoard,
      castlingRights: nextRights,
      enPassantTarget: null,
      capturedPiece: targetPiece,
      movedPiece: piece,
      isCapture: !!targetPiece || move.isEnPassant,
      isCastle: !!move.isCastle,
      isEnPassant: !!move.isEnPassant,
      isPromotion: !!move.isPromotion,
      promotionKind: move.promotionKind || null
    };

    setPiece(move.fromRow, move.fromCol, "", nextBoard);

    if (move.isEnPassant) {
      setPiece(move.fromRow, move.toCol, "", nextBoard);
      result.capturedPiece = color === "w" ? "bp" : "wp";
    }

    if (move.isCastle) {
      setPiece(move.toRow, move.toCol, piece, nextBoard);
      if (move.castleSide === "kingside") {
        setPiece(move.toRow, 7, "", nextBoard);
        setPiece(move.toRow, 5, color + "r", nextBoard);
      } else {
        setPiece(move.toRow, 0, "", nextBoard);
        setPiece(move.toRow, 3, color + "r", nextBoard);
      }
    } else if (move.isPromotion) {
      var promotedKind = move.promotionKind || "q";
      setPiece(move.toRow, move.toCol, color + promotedKind, nextBoard);
      result.movedPiece = color + promotedKind;
      result.promotionKind = promotedKind;
    } else {
      setPiece(move.toRow, move.toCol, piece, nextBoard);
    }

    if (kind === "p" && Math.abs(move.toRow - move.fromRow) === 2) {
      result.enPassantTarget = {
        row: (move.toRow + move.fromRow) / 2,
        col: move.fromCol
      };
    }

    if (kind === "k") {
      nextRights[color].kingside = false;
      nextRights[color].queenside = false;
    }
    if (kind === "r") {
      if (move.fromCol === 0) {
        nextRights[color].queenside = false;
      }
      if (move.fromCol === 7) {
        nextRights[color].kingside = false;
      }
    }

    if (result.capturedPiece === "wr") {
      if (move.toRow === 7 && move.toCol === 0) {
        nextRights.w.queenside = false;
      }
      if (move.toRow === 7 && move.toCol === 7) {
        nextRights.w.kingside = false;
      }
    }
    if (result.capturedPiece === "br") {
      if (move.toRow === 0 && move.toCol === 0) {
        nextRights.b.queenside = false;
      }
      if (move.toRow === 0 && move.toCol === 7) {
        nextRights.b.kingside = false;
      }
    }

    return result;
  }

  function getLegalMoves(row, col) {
    var piece = getPiece(row, col);
    if (!piece || getColor(piece) !== state.turn) {
      return [];
    }

    var pseudoMoves = getPseudoMoves(state.board, row, col, piece, state.castlingRights, state.enPassantTarget);
    var legalMoves = [];

    for (var i = 0; i < pseudoMoves.length; i++) {
      var applied = applyMove(state.board, pseudoMoves[i], state.castlingRights);
      if (!isInCheck(applied.board, state.turn)) {
        legalMoves.push(pseudoMoves[i]);
      }
    }

    return legalMoves;
  }

  function hasAnyLegalMove(color) {
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var piece = getPiece(row, col);
        if (piece && getColor(piece) === color) {
          var pseudo = getPseudoMoves(state.board, row, col, piece, state.castlingRights, state.enPassantTarget);
          for (var i = 0; i < pseudo.length; i++) {
            var applied = applyMove(state.board, pseudo[i], state.castlingRights);
            if (!isInCheck(applied.board, color)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function findMoveByTarget(moves, row, col) {
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].toRow === row && moves[i].toCol === col) {
        return moves[i];
      }
    }
    return null;
  }

  function isTargetSquare(row, col) {
    if (!state.selected) {
      return false;
    }
    return !!findMoveByTarget(state.selected.targets, row, col);
  }

  function buildNotation(piece, move, meta) {
    if (move.isCastle) {
      return move.castleSide === "kingside" ? "O-O" : "O-O-O";
    }
    var colorText = getColor(piece) === "w" ? "白" : "黑";
    var text = colorText + " " + toCellName(move.fromRow, move.fromCol) + (meta.isCapture ? " x " : " - ") + toCellName(move.toRow, move.toCol);
    if (move.isPromotion) {
      text += "=" + String((move.promotionKind || "q")).toUpperCase();
    }
    if (meta.isCheckmate) {
      text += " #";
    } else if (meta.isCheck) {
      text += " +";
    }
    return text;
  }

  function pushNotation(text) {
    var li = document.createElement("li");
    li.textContent = text;
    elNotationList.appendChild(li);
  }

  function promptPromotionChoice() {
    var choice = window.prompt("兵升变：输入 Q / R / B / N", "Q");
    if (!choice) {
      return "q";
    }
    choice = choice.trim().toLowerCase();
    if (["q", "r", "b", "n"].indexOf(choice) === -1) {
      return "q";
    }
    return choice;
  }

  function executeMove(move) {
    if (state.gameOver) {
      return false;
    }

    var snapshotBefore = snapshotState();
    var piece = getPiece(move.fromRow, move.fromCol);
    if (move.isPromotion && !move.promotionKind) {
      move.promotionKind = promptPromotionChoice();
    }

    var applied = applyMove(state.board, move, state.castlingRights);
    state.board = applied.board;
    state.castlingRights = applied.castlingRights;
    state.enPassantTarget = cloneTarget(applied.enPassantTarget);
    state.turn = opposite(state.turn);
    state.checkSquare = null;
    state.gameOver = false;
    state.gameResultText = "";

    var opponentInCheck = isInCheck(state.board, state.turn);
    if (opponentInCheck) {
      state.checkSquare = findKing(state.board, state.turn);
    }
    var opponentCanMove = hasAnyLegalMove(state.turn);
    var isCheckmate = opponentInCheck && !opponentCanMove;
    var isStalemate = !opponentInCheck && !opponentCanMove;

    if (isCheckmate) {
      state.gameOver = true;
      state.gameResultText = (state.turn === "w" ? "黑方" : "白方") + "将死获胜";
    } else if (isStalemate) {
      state.gameOver = true;
      state.gameResultText = "逼和";
    }

    state.lastMove = {
      fromRow: move.fromRow,
      fromCol: move.fromCol,
      toRow: move.toRow,
      toCol: move.toCol,
      isCapture: applied.isCapture,
      isCastle: applied.isCastle,
      isEnPassant: applied.isEnPassant,
      isPromotion: applied.isPromotion,
      isCheck: opponentInCheck,
      isCheckmate: isCheckmate,
      isStalemate: isStalemate,
      promotionKind: move.promotionKind || null
    };

    var notation = buildNotation(piece, move, state.lastMove);
    state.moveHistory.push({
      snapshotBefore: snapshotBefore,
      notation: notation,
      move: Object.assign({}, state.lastMove)
    });
    pushNotation(notation);

    renderBoard();
    soundManager.playMove(state.lastMove);
    voiceManager.onMove(piece, move, state.lastMove);
    logger.info("game", "move.done", {
      piece: piece,
      from: toCellName(move.fromRow, move.fromCol),
      to: toCellName(move.toRow, move.toCol),
      capture: applied.isCapture,
      castle: applied.isCastle,
      enPassant: applied.isEnPassant,
      promotion: applied.isPromotion,
      check: opponentInCheck,
      checkmate: isCheckmate,
      stalemate: isStalemate
    });

    if (state.mode === "human_ai" && !state.gameOver && state.turn !== resolvePlayerColorCode()) {
      window.setTimeout(requestHumanAiTurn, 120);
    }
    if (state.mode === "ai_ai" && state.autoplay && !state.gameOver) {
      var token = state.aiVsAiToken;
      window.setTimeout(function () {
        requestAiVsAiTurn(0, token);
      }, 120);
    }

    return true;
  }

  function onSquareClick(e) {
    var row = Number(e.currentTarget.dataset.row);
    var col = Number(e.currentTarget.dataset.col);
    var piece = getPiece(row, col);

    if (state.gameOver) {
      logger.warn("game", "click.ignored.game-over", {});
      return;
    }

    if (state.mode === "human_ai" && (state.aiThinking || state.turn !== resolvePlayerColorCode())) {
      logger.debug("human-ai.click.ignored", { aiThinking: state.aiThinking, turn: state.turn, playerColor: state.playerColor });
      return;
    }
    if (state.mode === "ai_ai") {
      return;
    }

    if (!state.selected) {
      if (!piece || getColor(piece) !== state.turn) {
        return;
      }
      var targets = getLegalMoves(row, col);
      if (!targets.length) {
        return;
      }
      state.selected = { row: row, col: col, targets: targets };
      logger.debug("ui", "piece.selected", { cell: toCellName(row, col), targets: targets.length });
      voiceManager.onSelect(piece, targets.length);
      renderBoard();
      return;
    }

    if (state.selected.row === row && state.selected.col === col) {
      state.selected = null;
      renderBoard();
      logger.debug("ui", "piece.unselected", { cell: toCellName(row, col) });
      return;
    }

    if (piece && getColor(piece) === state.turn) {
      var alternateTargets = getLegalMoves(row, col);
      if (alternateTargets.length) {
        state.selected = { row: row, col: col, targets: alternateTargets };
        renderBoard();
        logger.debug("ui", "piece.reselected", { cell: toCellName(row, col), targets: alternateTargets.length });
      }
      return;
    }

    var move = findMoveByTarget(state.selected.targets, row, col);
    if (!move) {
      logger.warn("game", "move.rejected.rule", {
        from: toCellName(state.selected.row, state.selected.col),
        to: toCellName(row, col)
      });
      soundManager.playIllegal();
      voiceManager.onIllegal();
      state.selected = null;
      renderBoard();
      return;
    }

    state.selected = null;
    executeMove(move);
  }

  function resetGame() {
    if (state.mode === "ai_ai") {
      stopAiVsAiPlayback();
    }
    resetEngineState();
    elNotationList.innerHTML = "";
    renderBoard();
    if (state.mode === "human_ai") {
      ensureAiMockData();
      renderHumanAiPanel();
      if (state.turn !== resolvePlayerColorCode()) {
        window.setTimeout(requestHumanAiTurn, 150);
      }
    }
    voiceManager.onReset();
    logger.info("game", "game.reset", {});
  }

  function undoMove() {
    var last = state.moveHistory.pop();
    if (!last) {
      logger.warn("game", "undo.empty", {});
      return;
    }
    restoreSnapshot(last.snapshotBefore);
    if (elNotationList.lastElementChild) {
      elNotationList.removeChild(elNotationList.lastElementChild);
    }
    renderBoard();
    voiceManager.onUndo();
    logger.info("game", "undo.done", { notation: last.notation });
  }

  function bindTabs() {
    var tabs = document.querySelectorAll(".tab[data-target]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
        tab.classList.add("active");
        document.getElementById("panel-" + tab.dataset.target).classList.add("active");
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
      if (!dragging || window.innerWidth <= 1360) {
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
      localStorage.setItem(SPLIT_STORAGE_KEY, getComputedStyle(playPage).getPropertyValue("--left-pane").trim());
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
      playPage.style.setProperty("--left-pane", Math.max(38, Math.min(68, value)) + "%");
    } catch (error) {
      logger.warn("layout", "divider.restore.failed", { message: String(error && error.message || error) });
    }
  }

  function setMode(mode) {
    if (state.mode === "ai_ai" && mode !== "ai_ai") {
      stopAiVsAiPlayback();
    }
    state.mode = mode;
    if (btnManual) btnManual.style.background = mode === "manual" ? "#e8f0ff" : "#ffffff";
    if (btnHumanAi) btnHumanAi.style.background = mode === "human_ai" ? "#e8f0ff" : "#ffffff";
    if (btnAiAi) btnAiAi.style.background = mode === "ai_ai" ? "#e8f0ff" : "#ffffff";
    setAiVsAiView(mode === "ai_ai");
    if (mode === "human_ai") {
      ensureAiMockData();
      renderHumanAiPanel();
      if (state.turn !== resolvePlayerColorCode()) {
        window.setTimeout(requestHumanAiTurn, 150);
      }
    }
    if (mode === "ai_ai") {
      stopAiVsAiPlayback();
      state.aiVsAiSessionStarted = false;
      ensureAiMockData();
      syncAiVsAiPresetsFromUI();
      state.aiVsAi.white.level = getAiVsAiSettingsForSide("w").levelText;
      state.aiVsAi.black.level = getAiVsAiSettingsForSide("b").levelText;
      state.aiVsAi.white.eval = "等待开始 AI 对弈...";
      state.aiVsAi.black.eval = "等待开始 AI 对弈...";
      renderAiVsAiPanel();
    }
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
      if (state.mode === "ai_ai") {
        voiceManager.speak("AI对战请使用模式按钮", { force: true });
        logger.info("mode", "ai-vs-ai.ignore.auto-button", {});
        return;
      }
      state.autoplay = !state.autoplay;
      btnAuto.textContent = state.autoplay ? "⏸" : "▶";
      if (state.mode === "human_ai") {
        if (state.turn !== resolvePlayerColorCode()) {
          requestHumanAiTurn();
        } else {
          updateAiMockTick();
          renderHumanAiPanel();
        }
      }
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
      if (!state.narrationOn) {
        voiceManager.stop();
      } else {
        voiceManager.speak("中文语音已开启", { force: true });
      }
      logger.info("audio", "narration.toggled", { enabled: state.narrationOn });
    });
    bindIf(btnManual, "click", function () {
      if (state.mode === "ai_ai" && state.autoplay) {
        voiceManager.speak("要先暂停AI", { force: true });
        return;
      }
      setMode("manual");
    });
    bindIf(btnHumanAi, "click", function () {
      if (state.mode === "ai_ai" && state.autoplay) {
        voiceManager.speak("要先暂停AI", { force: true });
        return;
      }
      setMode("human_ai");
    });
    bindIf(btnAiAi, "click", function () {
      if (state.mode !== "ai_ai") {
        setMode("ai_ai");
        voiceManager.speak("AI对战准备模式", { force: true });
        return;
      }
      toggleAiVsAiByModeButton();
    });
    bindIf(btnColor, "click", function () {
      state.playerColor = state.playerColor === "white" ? "black" : "white";
      btnColor.textContent = state.playerColor === "white" ? "⚪" : "⚫";
      if (state.mode === "human_ai" && state.turn !== resolvePlayerColorCode()) {
        window.setTimeout(requestHumanAiTurn, 120);
      }
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

    if (aiVsAiPanel) {
      var cards = aiVsAiPanel.querySelectorAll(".engine-card");
      cards.forEach(function (card) {
        var preset = card.querySelector('[data-role="preset"]');
        if (preset) {
          preset.addEventListener("change", function () {
            syncAiVsAiPresetsFromUI();
            state.aiVsAi.black.level = getAiVsAiSettingsForSide("b").levelText;
            state.aiVsAi.white.level = getAiVsAiSettingsForSide("w").levelText;
            renderAiVsAiPanel();
          });
        }
      });
    }
  }

  function init() {
    loadDisplaySettings();
    applyBoardThemeVariables();
    restoreDividerSplit();
    setupBoardCoords();
    bindTabs();
    bindButtons();
    bindDivider();
    resetGame();
    ensureAiMockData();
    setMode("manual");
    if (btnHints) {
      btnHints.style.background = "#e8f0ff";
    }
    logger.info("app", "boot.completed", {
      mode: "manual",
      features: ["manual-play", "undo", "full-rules", "move-highlights", "sound-effects", "svg-pieces"]
    });
  }

  init();
})();
