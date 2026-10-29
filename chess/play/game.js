(function () {
  "use strict";

  var PIECE_ASSET = {
    wk: "wK.svg", wq: "wQ.svg", wr: "wR.svg", wb: "wB.svg", wn: "wN.svg", wp: "wP.svg",
    bk: "bK.svg", bq: "bQ.svg", br: "bR.svg", bb: "bB.svg", bn: "bN.svg", bp: "bP.svg"
  };

  var FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
  var RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
  var SPLIT_STORAGE_KEY = "mindsevo:chess:play:left-pane";
  var DISPLAY_SETTINGS_KEY = "cognichess:display-settings";

  // ── Local in-browser chess engine (Stockfish 19 lite, single-threaded WASM) ──
  // Runs entirely client-side via a Web Worker, so AI play works identically on
  // localhost and on static hosts like GitHub Pages (no web/server backend needed).
  var ENGINE_WORKER_PATH = "./assets/engine/stockfish-19-lite-single.js";
  var engineWorker = null;
  var engineReadyPromise = null;
  var engineAppliedConfig = { skillLevel: null, multiPv: null, wdl: false };
  var engineQueue = Promise.resolve();
  var insightRequestId = 0;
  var insightState = { fen: null, status: "走棋后分析", payload: null };

  function clampEngineNumber(value, min, max, fallback) {
    var n = Number(value);
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function parseEngineInfoLine(line) {
    var parts = String(line || "").trim().split(/\s+/);
    var info = { raw: line };
    for (var i = 0; i < parts.length; i += 1) {
      var token = parts[i];
      if (token === "depth" && parts[i + 1]) { info.depth = Number(parts[i + 1]); i += 1; continue; }
      if (token === "nodes" && parts[i + 1]) { info.nodes = Number(parts[i + 1]); i += 1; continue; }
      if (token === "time" && parts[i + 1]) { info.time = Number(parts[i + 1]); i += 1; continue; }
      if (token === "multipv" && parts[i + 1]) { info.multipvIndex = Number(parts[i + 1]); i += 1; continue; }
      if (token === "wdl" && parts[i + 3]) { info.wdl = parts.slice(i + 1, i + 4).map(Number); i += 3; continue; }
      if (token === "score" && parts[i + 2]) {
        var scoreType = parts[i + 1];
        var scoreValue = parts[i + 2];
        info.score = { type: scoreType, value: scoreType === "mate" ? Number(scoreValue) : Number(scoreValue) / 100 };
        i += 2;
        continue;
      }
      if (token === "pv") { info.pv = parts.slice(i + 1); break; }
    }
    return info;
  }

  function getEngineWorker() {
    if (!engineWorker) {
      engineWorker = new Worker(ENGINE_WORKER_PATH);
    }
    return engineWorker;
  }

  function sendEngineCommand(command) {
    getEngineWorker().postMessage(command);
  }

  function waitForEngineLine(predicate, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var worker = getEngineWorker();
      var timer = window.setTimeout(function () {
        worker.removeEventListener("message", onMessage);
        reject(new Error("engine wait timeout"));
      }, timeoutMs);
      function onMessage(e) {
        var line = typeof e.data === "string" ? e.data : "";
        if (predicate(line)) {
          window.clearTimeout(timer);
          worker.removeEventListener("message", onMessage);
          resolve(line);
        }
      }
      worker.addEventListener("message", onMessage);
    });
  }

  function ensureEngineReady() {
    if (!engineReadyPromise) {
      engineReadyPromise = new Promise(function (resolve, reject) {
        var worker;
        try {
          worker = getEngineWorker();
        } catch (error) {
          reject(error);
          return;
        }
        worker.onerror = function (err) {
          reject(new Error("engine worker failed to load: " + (err && err.message ? err.message : err)));
        };
        sendEngineCommand("uci");
        waitForEngineLine(function (l) { return l === "uciok"; }, 10000)
          .then(function () {
            sendEngineCommand("isready");
            return waitForEngineLine(function (l) { return l === "readyok"; }, 10000);
          })
          .then(resolve, reject);
      }).catch(function (error) {
        engineReadyPromise = null; // allow retrying on the next call
        throw error;
      });
    }
    return engineReadyPromise;
  }

  async function configureEngine(settings) {
    await ensureEngineReady();
    if (window.ChessEngineSettings) {
      window.ChessEngineSettings.commands(settings).forEach(function (command) {
        var option = command.split(' value ')[0];
        if (engineAppliedConfig[option] !== command) {
          sendEngineCommand(command);
          engineAppliedConfig[option] = command;
        }
      });
      var pendingReady = waitForEngineLine(function (line) { return line === 'readyok'; }, 10000);
      sendEngineCommand('isready');
      await pendingReady;
      return settings.multiPv;
    }
    var skillLevel = clampEngineNumber(settings.skillLevel, 0, 20, 10);
    var multiPv = clampEngineNumber(settings.multiPv, 1, 5, 1);
    if (skillLevel !== engineAppliedConfig.skillLevel) {
      sendEngineCommand("setoption name Skill Level value " + skillLevel);
      engineAppliedConfig.skillLevel = skillLevel;
    }
    if (multiPv !== engineAppliedConfig.multiPv) {
      sendEngineCommand("setoption name MultiPV value " + multiPv);
      engineAppliedConfig.multiPv = multiPv;
    }
    if (!engineAppliedConfig.wdl) {
      sendEngineCommand("setoption name UCI_ShowWDL value true");
      engineAppliedConfig.wdl = true;
    }
    sendEngineCommand("isready");
    await waitForEngineLine(function (l) { return l === "readyok"; }, 10000);
    return multiPv;
  }

  function analyzeOnce(options) {
    var fen = options.fen;
    var movetime = clampEngineNumber(options.movetime, 100, 10000, 1200);
    var depth = clampEngineNumber(options.depth, 1, 30, null);

    var tablebaseProbe = window.ChessTablebase ? window.ChessTablebase.probe(fen) : Promise.resolve(null);
    return tablebaseProbe.then(function (tablebaseResult) {
      if (tablebaseResult) return tablebaseResult;
      return configureEngine(options).then(function (multiPv) {
        var worker = getEngineWorker();
        return new Promise(function (resolve, reject) {
          var infoLines = [];
          var timeoutMs = Math.max(6000, movetime + 6000);
          var timer = window.setTimeout(function () {
            worker.removeEventListener("message", onMessage);
            reject(new Error("engine analyze timeout"));
          }, timeoutMs);

          function onMessage(e) {
            var line = typeof e.data === "string" ? e.data : "";
            if (line.indexOf("info ") === 0 && line.indexOf(" pv ") !== -1) {
              infoLines.push(parseEngineInfoLine(line));
            } else if (line.indexOf("bestmove") === 0) {
              window.clearTimeout(timer);
              worker.removeEventListener("message", onMessage);
              var bestMove = line.split(/\s+/)[1] || null;
              var topInfo = infoLines.filter(function (item) { return item.multipvIndex === 1; });
              var finalInfo = topInfo.slice(-1)[0] || infoLines[infoLines.length - 1] || {};
              var scoreByDepth = [];
              topInfo.forEach(function (item) {
                if (!item.score || item.score.type !== "cp" || !Number.isFinite(item.depth)) return;
                var existing = scoreByDepth.findIndex(function (entry) { return entry.depth === item.depth; });
                if (existing >= 0) scoreByDepth[existing] = item;
                else scoreByDepth.push(item);
              });
              var scoreHistory = scoreByDepth.slice(-3);
              var scoreValues = scoreHistory.map(function (item) { return item.score.value; });
              var stableScores = scoreValues.length === 3 && Math.max.apply(null, scoreValues) - Math.min.apply(null, scoreValues) <= 0.35;
              var finalLines = infoLines.slice(-multiPv).sort(function (left, right) {
                return (left.multipvIndex || 1) - (right.multipvIndex || 1);
              });
              resolve({
                ok: true,
                fen: fen,
                bestMove: bestMove === "(none)" ? null : bestMove,
                info: finalInfo,
                multipv: finalLines,
                scoreHistory: scoreHistory,
                wdlReliable: Number.isFinite(finalInfo.depth) && finalInfo.depth >= 16 && stableScores && Array.isArray(finalInfo.wdl)
              });
            }
          }
          worker.addEventListener("message", onMessage);

          sendEngineCommand("position fen " + fen);
          sendEngineCommand("go movetime " + movetime + (depth ? " depth " + depth : ""));
        });
      });
    });
  }

  // Serialize all engine calls (human-ai / ai-vs-ai never run concurrently, but this
  // also protects against overlapping calls from rapid mode switches or retries).
  function analyzeWithLocalEngine(options) {
    var result = engineQueue.then(function () { return analyzeOnce(options); });
    engineQueue = result.catch(function () {}); // keep the queue alive even after a failure
    return result;
  }

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
    halfmoveClock: 0,
    positionCounts: {},
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
        if (move.isCheckmate || move.isThreefold || move.isFiftyMove || move.isInsufficientMaterial) {
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

    // speed=5 is native rate (1.0); 1..5 ramps down to 0.55, 5..10 ramps up to 1.6 — matches academy lesson pages.
    function speedToRate(speed) {
      var s = Math.min(10, Math.max(1, Number(speed) || 5));
      if (s <= 5) return 0.55 + (s - 1) * (1.0 - 0.55) / 4;
      return 1.0 + (s - 5) * (1.6 - 1.0) / 5;
    }

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
        utterance.rate = speedToRate(speedRange ? speedRange.value : 5);
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
      gameResultText: state.gameResultText,
      halfmoveClock: state.halfmoveClock,
      positionCounts: Object.assign({}, state.positionCounts)
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
    state.halfmoveClock = snapshot.halfmoveClock || 0;
    state.positionCounts = Object.assign({}, snapshot.positionCounts);
    state.selected = null;
  }

  function reducedPositionKey() {
    return toFen().split(" ").slice(0, 4).join(" ");
  }

  var selectedBankPosition = null;
  var selectedBankQuestionId = null;
  var practiceActivityId = null;
  var practiceStartedAt = Date.now();

  window.addEventListener('chess-records-session', function (event) {
    practiceActivityId = event.detail.id;
    practiceStartedAt = Date.now();
    if (event.detail.switchUser) {
      stopAiVsAiPlayback();
      setMode('manual');
      resetGame();
    }
  });

  function saveLearningSession(saved, explanation, initialFen) {
    if (!window.ChessRecords) return;
    try {
      var recordsData = window.ChessRecords.read();
      var existingActivity = recordsData.activities.find(function (activity) { return activity.id === practiceActivityId; });
      if (existingActivity && existingActivity.userId !== recordsData.activeUser) practiceActivityId = null;
      if (!practiceActivityId) {
        practiceActivityId = window.ChessRecords.begin(selectedBankQuestionId, initialFen || toFen());
        practiceStartedAt = Date.now();
      }
      var patch = {
        completed: state.gameOver,
        timeSpent: Math.max(0, Math.floor((Date.now() - practiceStartedAt) / 1000)),
        moves: state.moveHistory.map(function (entry) { return { notation: entry.notation, move: entry.move }; })
      };
      if (saved) patch.saved = true;
      if (explanation != null) patch.explanation = explanation;
      window.ChessRecords.update(practiceActivityId, patch);
      if (saved) document.getElementById('bankStatus').textContent = '练习记录已保存';
    } catch (error) {
      document.getElementById('bankStatus').textContent = '记录保存失败：' + error.message;
    }
  }

  function parseBankFen(fen) {
    var fields = String(fen || "").trim().split(/\s+/);
    var ranks = fields[0].split("/");
    if (ranks.length !== 8 || !/^[wb]$/.test(fields[1])) throw new Error("FEN 格式不正确");
    var board = ranks.map(function (rank) {
      var squares = [];
      rank.split("").forEach(function (symbol) {
        if (/^[1-8]$/.test(symbol)) {
          for (var count = 0; count < Number(symbol); count++) squares.push("");
        } else if (/^[kqrbnpKQRBNP]$/.test(symbol)) {
          squares.push((symbol === symbol.toUpperCase() ? "w" : "b") + symbol.toLowerCase());
        } else throw new Error("FEN 包含无效棋子");
      });
      if (squares.length !== 8) throw new Error("FEN 每行必须有八格");
      return squares;
    });
    var rights = fields[2] || "-";
    var ep = fields[3] || "-";
    if (!/^(?:-|K?Q?k?q?)$/.test(rights) || !/^(?:-|[a-h][36])$/.test(ep)) throw new Error("FEN 特殊走法字段不正确");
    return {
      board: board, turn: fields[1],
      castlingRights: {
        w: { kingside: rights.includes("K"), queenside: rights.includes("Q") },
        b: { kingside: rights.includes("k"), queenside: rights.includes("q") }
      },
      enPassantTarget: ep === "-" ? null : { row: 8 - Number(ep[1]), col: FILES.indexOf(ep[0]) },
      halfmoveClock: Number(fields[4]) || 0
    };
  }

  window.addEventListener("chess-bank-select", function (event) {
    var question = event.detail;
    try {
      var position = parseBankFen(question.fen);
      stopAiVsAiPlayback();
      practiceActivityId = null;
      selectedBankPosition = position;
      selectedBankQuestionId = question.questionId || null;
      setMode("manual");
      resetGame();
      question.loaded = true;
    } catch (error) {
      question.error = error.message;
    }
  });

  function resetEngineState() {
    state.board = selectedBankPosition ? selectedBankPosition.board.map(function (rank) { return rank.slice(); }) : createInitialBoard();
    state.turn = selectedBankPosition ? selectedBankPosition.turn : "w";
    state.selected = null;
    state.moveHistory = [];
    state.castlingRights = selectedBankPosition ? JSON.parse(JSON.stringify(selectedBankPosition.castlingRights)) : createCastlingRights();
    state.enPassantTarget = selectedBankPosition && selectedBankPosition.enPassantTarget ? Object.assign({}, selectedBankPosition.enPassantTarget) : null;
    state.lastMove = null;
    state.checkSquare = null;
    state.gameOver = false;
    state.gameResultText = "";
    state.halfmoveClock = selectedBankPosition ? selectedBankPosition.halfmoveClock : 0;
    state.positionCounts = {};
    state.positionCounts[reducedPositionKey()] = 1;
  }

  function createAiMock(side) {
    return {
      side: side,
      status: "等待开始",
      level: "中级",
      preset: "intermediate"
    };
  }

  function ensureAiMockData() {
    if (!state.humanAi) {
      state.humanAi = {
        status: "选择执棋方并开始对弈",
        level: "中级",
        preset: "intermediate",
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

  function getAiPresetConfig(preset) {
    if (preset === "beginner") return { skillLevel: 0, depth: 5, movetime: 500, multiPv: 1, label: "初学" };
    if (preset === "intermediate") return { skillLevel: 4, depth: 8, movetime: 800, multiPv: 1, label: "中级" };
    if (preset === "advanced") return { skillLevel: 8, depth: 12, movetime: 1500, multiPv: 1, label: "高级" };
    if (preset === "expert") return { skillLevel: 15, depth: 18, movetime: 2000, multiPv: 1, label: "专家" };
    if (preset === "master") return { skillLevel: 20, depth: 25, movetime: 3000, multiPv: 1, label: "大师" };
    return { skillLevel: 4, depth: 8, movetime: 800, multiPv: 1, label: "中级" };
  }

  function getPresetLabel(preset) {
    var labels = { beginner: "初学", intermediate: "中级", advanced: "高级", expert: "专家", master: "大师", settings: "自定义" };
    return labels[preset] || labels.intermediate;
  }

  function getAiVsAiSettingsForSide(side) {
    ensureAiMockData();
    var panel = side === "w" ? state.aiVsAi.white : state.aiVsAi.black;
    var preset = panel.preset || "intermediate";
    if (window.ChessEngineSettings) return window.ChessEngineSettings.resolve(side === 'w' ? 'white' : 'black', preset);
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
      if (blackPreset) state.aiVsAi.black.preset = blackPreset.value || "intermediate";
    }
    if (cards[1]) {
      var whitePreset = cards[1].querySelector('[data-role="preset"]');
      if (whitePreset) state.aiVsAi.white.preset = whitePreset.value || "intermediate";
    }
  }

  function renderAiCard(root, data) {
    if (!root || !data) {
      return;
    }
    var status = root.querySelector('[data-role="status"]');
    var level = root.querySelector('[data-role="preset"]');
    if (status) status.textContent = data.status;
    if (level) level.value = data.preset || "intermediate";
    syncCustomLevelControl(root, root.dataset.engineRole || "human");
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

  function getLanguageIsEnglish() {
    return !!(window.ChessI18n && window.ChessI18n.getLanguage() === "en");
  }

  function formatUciMove(uci) {
    var parsed = parseUciMove(uci);
    if (!parsed) return "--";
    var move = toCellName(parsed.fromRow, parsed.fromCol) + " → " + toCellName(parsed.toRow, parsed.toCol);
    return parsed.promotionKind ? move + "=" + parsed.promotionKind.toUpperCase() : move;
  }

  function formatPvLine(pv) {
    return (Array.isArray(pv) ? pv : []).slice(0, 4).map(formatUciMove).filter(function (move) { return move !== "--"; }).join("  ");
  }

  function scoreForWhite(score, fen) {
    if (!score || !Number.isFinite(score.value)) return null;
    var sideToMove = String(fen || "").split(/\s+/)[1];
    var sign = sideToMove === "b" ? -1 : 1;
    return { type: score.type, value: score.value * sign };
  }

  function formatEngineScore(score, fen) {
    var whiteScore = scoreForWhite(score, fen);
    if (!whiteScore) return "--";
    if (whiteScore.type === "mate") return whiteScore.value > 0 ? "#" + whiteScore.value : "-#" + Math.abs(whiteScore.value);
    return (whiteScore.value > 0 ? "+" : "") + whiteScore.value.toFixed(2);
  }

  function describeAdvantage(score, fen) {
    var whiteScore = scoreForWhite(score, fen);
    if (!whiteScore) return getLanguageIsEnglish() ? "Insufficient data" : "数据不足";
    if (whiteScore.type === "mate") return whiteScore.value > 0 ? (getLanguageIsEnglish() ? "White has a forced mate" : "白方有强制将杀") : (getLanguageIsEnglish() ? "Black has a forced mate" : "黑方有强制将杀");
    var value = whiteScore.value;
    var white = value > 0;
    var magnitude = Math.abs(value);
    if (magnitude < 0.2) return getLanguageIsEnglish() ? "Roughly equal" : "大致均势";
    if (magnitude < 0.6) return white ? (getLanguageIsEnglish() ? "White has a slight edge" : "白方略优") : (getLanguageIsEnglish() ? "Black has a slight edge" : "黑方略优");
    if (magnitude < 1.5) return white ? (getLanguageIsEnglish() ? "White has an advantage" : "白方占优") : (getLanguageIsEnglish() ? "Black has an advantage" : "黑方占优");
    return white ? (getLanguageIsEnglish() ? "White has a clear advantage" : "白方明显优势") : (getLanguageIsEnglish() ? "Black has a clear advantage" : "黑方明显优势");
  }

  function renderCandidateLines(container, payload, fen) {
    var list = container.querySelector('[data-role="candidates"]');
    if (!list) return;
    list.replaceChildren();
    var lines = Array.isArray(payload && payload.multipv) ? payload.multipv.slice(0, 3) : [];
    if (!lines.length && payload && payload.bestMove) lines = [{ pv: [payload.bestMove], score: payload.info && payload.info.score }];
    lines.forEach(function (line, index) {
      var item = document.createElement("li");
      var rank = document.createElement("span");
      var variation = document.createElement("span");
      var evaluation = document.createElement("strong");
      rank.className = "candidate-rank";
      variation.className = "candidate-variation";
      evaluation.className = "candidate-evaluation";
      rank.textContent = String(index + 1);
      variation.textContent = line.tablebase && line.san ? line.san : formatPvLine(line.pv);
      evaluation.textContent = line.tablebase
        ? (Number.isFinite(line.tablebase.dtz) ? "DTZ " + line.tablebase.dtz : "表库")
        : formatEngineScore(line.score, fen);
      item.append(rank, variation, evaluation);
      list.appendChild(item);
    });
  }

  function renderInsight(container) {
    if (!container) return;
    var status = container.querySelector('[data-role="insight-source"]');
    var advantage = container.querySelector('[data-role="advantage"]');
    var engineScore = container.querySelector('[data-role="engine-score"]');
    var engineDepth = container.querySelector('[data-role="engine-depth"]');
    var candidateSide = container.querySelector('[data-role="candidate-side"]');
    var whiteWin = container.querySelector('[data-role="white-win"]');
    var draw = container.querySelector('[data-role="draw"]');
    var blackWin = container.querySelector('[data-role="black-win"]');
    var exactResult = container.querySelector('[data-role="insight-exact"]');
    var note = container.querySelector('[data-role="insight-note"]');
    var payload = insightState.payload;
    var info = payload && payload.info ? payload.info : {};
    var isTablebase = payload && payload.source === "tablebase";
    var sideToMove = String(insightState.fen || "").split(/\s+/)[1];
    container.classList.toggle("insight-tablebase", !!isTablebase);
    if (status) status.textContent = insightState.status;
    if (candidateSide) candidateSide.textContent = sideToMove === "b" ? (getLanguageIsEnglish() ? "Black to move" : "黑方行棋") : (getLanguageIsEnglish() ? "White to move" : "白方行棋");
    renderCandidateLines(container, payload, insightState.fen);
    if (advantage) advantage.textContent = payload ? (isTablebase ? (getLanguageIsEnglish() ? "Exact tablebase result" : "残局库精确结论") : describeAdvantage(info.score, insightState.fen)) : (getLanguageIsEnglish() ? "Waiting for analysis" : "等待评估");
    if (engineScore) engineScore.textContent = payload ? (isTablebase ? "Tablebase" : formatEngineScore(info.score, insightState.fen)) : "--";
    if (engineDepth) engineDepth.textContent = isTablebase ? "Exact" : (Number.isFinite(info.depth) ? String(info.depth) : "--");
    if (whiteWin) whiteWin.textContent = "--";
    if (draw) draw.textContent = "--";
    if (blackWin) blackWin.textContent = "--";
    if (exactResult) { exactResult.hidden = !isTablebase; exactResult.textContent = ""; }
    var wdlRow = container.querySelector('[data-role="insight-wdl"]');
    var reliableWdl = !isTablebase && payload && payload.wdlReliable === true && Array.isArray(info.wdl) && info.wdl.length === 3;
    if (wdlRow) wdlRow.hidden = !reliableWdl;

    if (isTablebase && payload.tablebase && payload.tablebase.category) {
      var category = payload.tablebase.category;
      var sideToMove = String(insightState.fen || "").split(/\s+/)[1];
      var isDraw = category === "draw" || category === "cursed-win" || category === "blessed-loss";
      var isLoss = category === "loss";
      var whiteWins = (sideToMove === "b") === isLoss;
      var exact = isDraw ? (getLanguageIsEnglish() ? "Draw" : "和棋")
        : category === "win" || isLoss ? (whiteWins ? (getLanguageIsEnglish() ? "White is winning" : "白方必胜") : (getLanguageIsEnglish() ? "Black is winning" : "黑方必胜"))
        : (getLanguageIsEnglish() ? "Exact tablebase result" : "残局库精确结论");
      if (exactResult) exactResult.textContent = exact;
      if (note) note.textContent = getLanguageIsEnglish() ? "Exact tablebase result." : "残局库精确结论。";
      return;
    }

    var wdl = reliableWdl ? info.wdl.slice() : null;
    if (wdl) {
      if (String(insightState.fen || "").split(/\s+/)[1] === "b") wdl = [wdl[2], wdl[1], wdl[0]];
      var total = wdl.reduce(function (sum, value) { return sum + value; }, 0);
      if (total > 0) {
        if (whiteWin) whiteWin.textContent = (wdl[0] / total * 100).toFixed(1) + "%";
        if (draw) draw.textContent = (wdl[1] / total * 100).toFixed(1) + "%";
        if (blackWin) blackWin.textContent = (wdl[2] / total * 100).toFixed(1) + "%";
      }
    }
    if (note) note.textContent = wdl
      ? (getLanguageIsEnglish() ? "Deep, stable engine WDL estimate; not a human-game win probability." : "深度稳定后的引擎 WDL 估算，并非真人实战胜率。")
      : (getLanguageIsEnglish() ? "Qualitative engine estimate; WDL percentages are hidden until the search is deep and stable." : "浅层或评估波动时隐藏胜率百分比；倾向仅作训练参考。");
  }

  function renderAllInsights() {
    document.querySelectorAll('[data-role="insight"]').forEach(renderInsight);
  }

  function setInsightPending(fen, message) {
    insightRequestId += 1;
    insightState = { fen: fen, status: message || "正在评估", payload: null };
    renderAllInsights();
    return insightRequestId;
  }

  function applyInsight(payload, fen, requestId) {
    if (requestId !== insightRequestId || fen !== toFen() || state.gameOver) return false;
    insightState = {
      fen: fen,
      status: payload.source === "tablebase" ? "残局库" : "Stockfish",
      payload: payload
    };
    renderAllInsights();
    return true;
  }

  async function requestPositionInsight(settings, mode) {
    if (state.gameOver || state.mode !== mode) return;
    var fen = toFen();
    var requestId = setInsightPending(fen, "正在评估");
    try {
      var payload = await analyzeWithLocalEngine(Object.assign({}, settings, {
        fen: fen,
        showWdl: true,
        multiPv: 3
      }));
      applyInsight(payload, fen, requestId);
    } catch (error) {
      if (requestId === insightRequestId && fen === toFen()) {
        insightState = { fen: fen, status: "暂不可用", payload: null };
        renderAllInsights();
      }
      logger.warn("ai-insight.request.failed", { detail: String(error && error.message || error) });
    }
  }

  function refreshCurrentPositionInsight() {
    if (state.mode === "human_ai" && state.turn === resolvePlayerColorCode()) {
      requestPositionInsight(getHumanAiEngineSettings(), "human_ai");
    } else if (state.mode === "ai_ai" && !state.autoplay) {
      var side = state.turn;
      requestPositionInsight(getAiVsAiSettingsForSide(side), "ai_ai");
    }
  }

  function syncCustomLevelControl(card, side) {
    if (!card || !window.ChessEngineSettings) return;
    var preset = card.querySelector('[data-role="preset"]');
    var controls = card.querySelector('[data-role="custom-controls"]');
    var slider = card.querySelector('[data-role="custom-level"]');
    var output = card.querySelector('[data-role="custom-level-value"]');
    if (!preset || !controls || !slider || !output) return;
    var custom = preset.value === "settings";
    controls.hidden = !custom;
    if (!custom) return;
    var level = window.ChessEngineSettings.read()[side].level;
    slider.value = String(level);
    output.textContent = window.ChessEngineSettings.levels[level][0];
  }

  function saveCustomLevel(card, side) {
    if (!card || !window.ChessEngineSettings) return;
    var slider = card.querySelector('[data-role="custom-level"]');
    var output = card.querySelector('[data-role="custom-level-value"]');
    var level = Number(slider && slider.value);
    if (!Number.isInteger(level) || !window.ChessEngineSettings.levels[level]) return;
    var draft = window.ChessEngineSettings.read();
    draft[side].level = level;
    window.ChessEngineSettings.save(draft);
    if (output) output.textContent = window.ChessEngineSettings.levels[level][0];
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
      state.aiVsAi.black.status = "已暂停";
      state.aiVsAi.white.status = "已暂停";
      updateAiVsAiModeButton();
      voiceManager.speak("暂停AI对战", { force: true });
      logger.info("mode", "ai-vs-ai.paused.by-mode-button", {});
      renderAiVsAiPanel();
      return;
    }

    state.aiVsAiSessionStarted = true;
    state.autoplay = true;
    state.aiVsAi.black.status = "等待开始";
    state.aiVsAi.white.status = "等待开始";
    state.aiVsAiToken += 1;
    updateAiVsAiModeButton();
    voiceManager.speak("开始AI对战", { force: true });
    logger.info("mode", "ai-vs-ai.started.by-mode-button", {});
    requestAiVsAiTurn(0, state.aiVsAiToken);
    renderAiVsAiPanel();
  }

  function getHumanAiEngineSettings() {
    ensureAiMockData();
    var preset = state.humanAi.preset || "intermediate";
    if (window.ChessEngineSettings) return window.ChessEngineSettings.resolve('human', preset);
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

  async function requestHumanAiTurn(retryCount) {
    var retries = Number.isFinite(retryCount) ? retryCount : 0;
    if (state.mode !== "human_ai" || state.gameOver || state.aiThinking || state.turn === resolvePlayerColorCode()) {
      return;
    }

    ensureAiMockData();
    var engineSettings = getHumanAiEngineSettings();
    var fen = toFen();
    var insightId = setInsightPending(fen, "正在评估");
    state.aiThinking = true;
    state.humanAi.level = state.humanAi.preset === "settings"
      ? window.ChessEngineSettings.levels[engineSettings.level][0]
      : getPresetLabel(state.humanAi.preset);
    state.humanAi.status = "AI 正在思考";
    renderHumanAiPanel();

    try {
      var payload = await analyzeWithLocalEngine(Object.assign({}, engineSettings, {
        fen: fen,
        movetime: engineSettings.movetime,
        depth: engineSettings.depth,
        skillLevel: engineSettings.skillLevel,
        multiPv: 3,
        showWdl: true
      }));
      if (!payload.ok) {
        throw new Error("Stockfish analyze failed");
      }
      applyInsight(payload, fen, insightId);
      state.humanAi.status = "AI 已选定候选，准备走棋";
      renderHumanAiPanel();

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
      }, 800);
      return;
    } catch (error) {
      state.aiThinking = false;
      ensureAiMockData();
      var detail = String(error && error.message ? error.message : error);
      if (retries < state.humanAi.maxRetries) {
        state.humanAi.status = "连接失败，正在重试";
        renderHumanAiPanel();
        window.setTimeout(function () {
          requestHumanAiTurn(retries + 1);
        }, 320 * (retries + 1));
        logger.warn("human-ai.request.retry", { retry: retries + 1, detail: detail });
        return;
      }

      state.humanAi.status = "AI 暂不可用";
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
    var fen = toFen();
    var insightId = setInsightPending(fen, "正在评估");
    state.aiThinking = true;
    sideState.level = sideState.preset === "settings"
      ? window.ChessEngineSettings.levels[settings.level][0]
      : getPresetLabel(sideState.preset);
    sideState.status = "正在思考";
    renderAiVsAiPanel();

    try {
      var payload = await analyzeWithLocalEngine(Object.assign({}, settings, {
        fen: fen,
        movetime: settings.movetime,
        depth: settings.depth,
        skillLevel: settings.skillLevel,
        multiPv: 3,
        showWdl: true
      }));
      if (!payload.ok) {
        throw new Error("Stockfish analyze failed");
      }
      if (runToken !== state.aiVsAiToken || state.mode !== "ai_ai" || !state.autoplay) return;
      applyInsight(payload, fen, insightId);

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

      sideState.status = "候选已就绪";
      renderAiVsAiPanel();

      window.setTimeout(function () {
        if (runToken !== state.aiVsAiToken || state.mode !== "ai_ai" || !state.autoplay) {
          state.aiThinking = false;
          return;
        }
        state.aiThinking = false;
        executeMove(aiMove);
      }, 800);
      return;
    } catch (error) {
      state.aiThinking = false;
      ensureAiMockData();
      var detail = String(error && error.message ? error.message : error);
      if (retries < 2 && runToken === state.aiVsAiToken && state.mode === "ai_ai" && state.autoplay) {
        sideState.status = "连接失败，正在重试";
        renderAiVsAiPanel();
        window.setTimeout(function () {
          requestAiVsAiTurn(retries + 1, runToken);
        }, 320 * (retries + 1));
        logger.warn("ai-vs-ai.request.retry", { retry: retries + 1, detail: detail });
        return;
      }

      sideState.status = "暂不可用";
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

  function isInsufficientMaterialPosition(board) {
    var minors = [];
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 8; col++) {
        var piece = getPiece(row, col, board);
        if (!piece || getKind(piece) === 'k') continue;
        var kind = getKind(piece);
        if (kind !== 'b' && kind !== 'n') return false;
        minors.push({ kind: kind, squareColor: (row + col) % 2 });
      }
    }
    if (minors.length < 2) return true;
    return minors.every(function (minor) { return minor.kind === 'b' && minor.squareColor === minors[0].squareColor; });
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
    var sessionInitialFen = !practiceActivityId ? toFen() : null;
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

    var isPawnMove = getKind(piece) === "p";
    state.halfmoveClock = (applied.isCapture || applied.isEnPassant || isPawnMove) ? 0 : state.halfmoveClock + 1;
    var posKey = reducedPositionKey();
    state.positionCounts[posKey] = (state.positionCounts[posKey] || 0) + 1;
    var isThreefold = state.positionCounts[posKey] >= 3;
    var isFiftyMove = state.halfmoveClock >= 100;
    var isMaterialDraw = isInsufficientMaterialPosition(state.board);

    if (isCheckmate) {
      state.gameOver = true;
      state.gameResultText = (state.turn === "w" ? "黑方" : "白方") + "将死获胜";
    } else if (isStalemate) {
      state.gameOver = true;
      state.gameResultText = "逼和";
    } else if (isMaterialDraw) {
      state.gameOver = true;
      state.gameResultText = "子力不足，和棋";
    } else if (isThreefold) {
      state.gameOver = true;
      state.gameResultText = "三次重复局面，和棋";
    } else if (isFiftyMove) {
      state.gameOver = true;
      state.gameResultText = "五十步无吃子无兵移动，和棋";
    }

    if (state.gameOver) {
      voiceManager.speak(state.gameResultText, { force: true });
      insightRequestId += 1;
      insightState = { fen: toFen(), status: "棋局已结束", payload: null };
      renderAllInsights();
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
      isInsufficientMaterial: isMaterialDraw,
      isThreefold: isThreefold,
      isFiftyMove: isFiftyMove,
      promotionKind: move.promotionKind || null
    };

    var notation = buildNotation(piece, move, state.lastMove);
    state.moveHistory.push({
      snapshotBefore: snapshotBefore,
      notation: notation,
      move: Object.assign({}, state.lastMove)
    });
    pushNotation(notation);

    saveLearningSession(false, null, sessionInitialFen);

    renderBoard();
    if (!state.gameOver && (state.mode === "human_ai" || state.mode === "ai_ai")) {
      setInsightPending(toFen(), "正在评估");
    }
    if (state.mode === "human_ai") {
      state.humanAi.status = state.gameOver ? state.gameResultText : (state.turn === resolvePlayerColorCode() ? "轮到你" : "AI 即将走棋");
      renderHumanAiPanel();
    } else if (state.mode === "ai_ai") {
      var nextAi = state.turn === "w" ? state.aiVsAi.white : state.aiVsAi.black;
      var waitingAi = state.turn === "w" ? state.aiVsAi.black : state.aiVsAi.white;
      nextAi.status = state.gameOver ? state.gameResultText : (state.autoplay ? "即将走棋" : "已暂停");
      waitingAi.status = state.gameOver ? state.gameResultText : "等待对方走棋";
      renderAiVsAiPanel();
    }
    soundManager.playMove(state.lastMove);
    // Per-move voice narration removed — was too disruptive across manual/human-vs-AI/AI-vs-AI modes.
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
    } else if (state.mode === "human_ai" && !state.gameOver) {
      window.setTimeout(function () { requestPositionInsight(getHumanAiEngineSettings(), "human_ai"); }, 120);
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
    setInsightPending(toFen(), "走棋后分析");
    ensureAiMockData();
    if (state.mode === "human_ai") state.humanAi.status = state.turn === resolvePlayerColorCode() ? "轮到你" : "AI 即将走棋";
    if (state.mode === "ai_ai") {
      state.aiVsAi.black.status = "等待开始";
      state.aiVsAi.white.status = "等待开始";
      renderAiVsAiPanel();
    }
    elNotationList.innerHTML = "";
    renderBoard();
    if (state.mode === "human_ai") {
      renderHumanAiPanel();
      if (state.turn !== resolvePlayerColorCode()) {
        window.setTimeout(requestHumanAiTurn, 150);
      } else {
        requestPositionInsight(getHumanAiEngineSettings(), "human_ai");
      }
    }
    voiceManager.onReset();
    if (practiceActivityId && selectedBankPosition) saveLearningSession(false);
    if (!selectedBankPosition) practiceActivityId = null;
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
    if (state.mode === "human_ai") {
      state.humanAi.status = state.gameOver ? state.gameResultText : (state.turn === resolvePlayerColorCode() ? "轮到你" : "AI 即将走棋");
      renderHumanAiPanel();
      if (!state.gameOver && state.turn === resolvePlayerColorCode()) requestPositionInsight(getHumanAiEngineSettings(), "human_ai");
    }
    voiceManager.onUndo();
    if (practiceActivityId) saveLearningSession(false);
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
      state.humanAi.status = state.gameOver ? state.gameResultText : (state.turn === resolvePlayerColorCode() ? "轮到你" : "AI 即将走棋");
      renderHumanAiPanel();
      if (state.turn !== resolvePlayerColorCode()) {
        window.setTimeout(requestHumanAiTurn, 150);
      } else {
        requestPositionInsight(getHumanAiEngineSettings(), "human_ai");
      }
    }
    if (mode === "ai_ai") {
      stopAiVsAiPlayback();
      state.aiVsAiSessionStarted = false;
      ensureAiMockData();
      syncAiVsAiPresetsFromUI();
      state.aiVsAi.white.status = "等待开始";
      state.aiVsAi.black.status = "等待开始";
      renderAiVsAiPanel();
      setInsightPending(toFen(), "开始后分析");
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
          state.humanAi.status = "等待你的走棋";
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
      if (selectedBankPosition) {
        window.dispatchEvent(new Event("chess-bank-explain"));
        return;
      }
      if (expandPanel) {
        expandPanel.innerHTML = "<div class='expand-placeholder'>解说区：后续接入教程与题库解释输出。</div>";
      }
      logger.info("panel", "explain.clicked", {});
    });
    bindIf(btnSaveExplain, "click", function () {
      saveLearningSession(true, expandPanel ? expandPanel.textContent : '');
      logger.info("panel", "explain.saved", {});
    });
    bindIf(btnSaveNote, "click", function () {
      saveLearningSession(true);
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

    if (humanAiPanel) {
      var humanPreset = humanAiPanel.querySelector('[data-role="preset"]');
      if (humanPreset) {
        humanPreset.addEventListener("change", function () {
          ensureAiMockData();
          state.humanAi.preset = humanPreset.value || "intermediate";
          var card = humanAiPanel.querySelector(".engine-card");
          syncCustomLevelControl(card, "human");
          state.humanAi.level = state.humanAi.preset === "settings"
            ? window.ChessEngineSettings.levels[window.ChessEngineSettings.read().human.level][0]
            : getPresetLabel(state.humanAi.preset);
          renderHumanAiPanel();
          refreshCurrentPositionInsight();
        });
      }
      var humanCard = humanAiPanel.querySelector(".engine-card");
      var humanSlider = humanAiPanel.querySelector('[data-role="custom-level"]');
      if (humanSlider) {
        humanSlider.addEventListener("input", function () {
          var level = Number(humanSlider.value);
          humanAiPanel.querySelector('[data-role="custom-level-value"]').textContent = window.ChessEngineSettings.levels[level][0];
        });
        humanSlider.addEventListener("change", function () {
          saveCustomLevel(humanCard, "human");
          state.humanAi.level = window.ChessEngineSettings.levels[Number(humanSlider.value)][0];
          refreshCurrentPositionInsight();
        });
      }
    }

    if (aiVsAiPanel) {
      var cards = aiVsAiPanel.querySelectorAll(".engine-card");
      cards.forEach(function (card) {
        var preset = card.querySelector('[data-role="preset"]');
        if (preset) {
          preset.addEventListener("change", function () {
            syncAiVsAiPresetsFromUI();
            syncCustomLevelControl(cards[0], "black");
            syncCustomLevelControl(cards[1], "white");
            state.aiVsAi.black.level = getPresetLabel(state.aiVsAi.black.preset);
            state.aiVsAi.white.level = getPresetLabel(state.aiVsAi.white.preset);
            renderAiVsAiPanel();
            refreshCurrentPositionInsight();
          });
        }
        var side = card.dataset.engineRole;
        var slider = card.querySelector('[data-role="custom-level"]');
        if (slider) {
          slider.addEventListener("input", function () {
            var level = Number(slider.value);
            card.querySelector('[data-role="custom-level-value"]').textContent = window.ChessEngineSettings.levels[level][0];
          });
          slider.addEventListener("change", function () {
            saveCustomLevel(card, side);
            refreshCurrentPositionInsight();
          });
        }
      });
    }
  }

  function init() {
    if (window.ChessEngineSettings) {
      ensureAiMockData();
    }
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
