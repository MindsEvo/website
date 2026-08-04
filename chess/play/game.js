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
    autoplay: false,
    castlingRights: null,
    enPassantTarget: null,
    lastMove: null,
    checkSquare: null,
    gameOver: false,
    gameResultText: ""
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
          var pieceEl = document.createElement("img");
          pieceEl.className = "piece-svg";
          pieceEl.alt = piece;
          pieceEl.src = "./assets/pieces/" + PIECE_ASSET[piece];
          square.appendChild(pieceEl);
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
    resetEngineState();
    elNotationList.innerHTML = "";
    renderBoard();
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
      if (!state.narrationOn) {
        voiceManager.stop();
      } else {
        voiceManager.speak("中文语音已开启", { force: true });
      }
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
