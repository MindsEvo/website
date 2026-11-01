(function (root) {
  'use strict';
  var base = new URL('.', document.currentScript.src);
  var modules;
  var modes = { manual: 'manual', humanAi: 'human_ai', aiAi: 'ai_ai' };
  var results = {
    checkmate: '\u5c06\u6740', stalemate: '\u56f0\u6bd9\uff0c\u548c\u68cb',
    insufficient_material: '\u5b50\u529b\u4e0d\u8db3\uff0c\u548c\u68cb',
    threefold_repetition: '\u4e09\u6b21\u91cd\u590d\uff0c\u548c\u68cb',
    fifty_move: '\u4e94\u5341\u56de\u5408\uff0c\u548c\u68cb', draw: '\u548c\u68cb'
  };
  root.ChessAcademyDuel = {
    attach: async function (options) {
      var panel = options.panel;
      var host = panel.controls.manual.closest('[data-chess-controls]');
      var board = options.board;
      var active = false;
      var duel = null;
      var selected = null;
      var last = null;
      var generation = 0;
      var playerColor = 'w';
      var promotion = { value: 'q' };
      function report(error) {
        options.status('\u5bf9\u5f08\u4e0d\u53ef\u7528\uff1a' + error.message + '\u3002\u8bf7\u68c0\u67e5\u5f15\u64ce\u8d44\u6e90\u548c\u7f51\u7edc\uff0c\u91cd\u8bd5\u6216\u5207\u6362\u624b\u52a8\u6a21\u5f0f\u3002');
      }
      function refresh() {
        var available = !!options.getLessonPosition();
        Object.keys(modes).forEach(function (action) { panel.controls[action].disabled = !available; });
        panel.setState({ manual: !active || last?.mode === 'manual', humanAi: active && last?.mode === 'human_ai', aiAi: active && last?.mode === 'ai_ai' });
      }
      function highlights() {
        board.querySelectorAll('.square').forEach(function (square) {
          var name = String.fromCharCode(97 + Number(square.dataset.col)) + (8 - Number(square.dataset.row));
          square.classList.toggle('duel-origin', name === selected);
          square.classList.toggle('duel-target', !!selected && (last.legalSquares[selected] || []).includes(name));
        });
      }
      function snapshot(value) {
        if (!active) return;
        var previous = last;
        last = value;
        options.renderPosition(value.board, value);
        refresh();
        panel.setState({ play: value.playing });
        panel.controls.color.textContent = value.playerColor === 'w' ? '\u26aa' : '\u26ab';
        panel.controls.color.setAttribute('aria-label', value.playerColor === 'w' ? '\u6267\u767d' : '\u6267\u9ed1');
        highlights();
        var result = value.result && results[value.result.type];
        var text = result ? (value.result.winner ? (value.result.winner === 'w' ? '\u767d\u65b9\u80dc\uff1a' : '\u9ed1\u65b9\u80dc\uff1a') : '') + result
          : value.thinking ? 'AI\u601d\u8003\u4e2d' : (value.turn === 'w' ? '\u767d\u65b9' : '\u9ed1\u65b9') + '\u884c\u68cb' + (value.check ? '\uff0c\u5c06\u519b' : '');
        options.status(text);
        if (previous && value.history.length > previous.history.length && options.onMove) {
          options.onMove(value, {
            sound: panel.controls.sound.classList.contains('active'),
            narration: panel.controls.narration.classList.contains('active'),
            volume: Number(panel.controls.volume.value) / 100,
            resultText: result ? text : null
          });
        }
      }
      var engine;
      function lessonChanged() {
        generation++;
        active = false;
        if (duel) duel.pause();
        if (engine) {
          engine.resetWorker();
          engine = new modules[2].StockfishClient();
        }
        duel = null;
        last = null;
        selected = null;
        panel.setState({ play: false });
        board.querySelectorAll('.duel-origin, .duel-target').forEach(function (square) { square.classList.remove('duel-origin', 'duel-target'); });
        refresh();
      }
      function resumeLesson() {
        lessonChanged();
        options.stopLesson();
        root.speechSynthesis?.cancel();
        options.resumeLesson();
      }
      var api = {
        get active() { return active; },
        snapshot: function () { return duel ? duel.snapshot() : null; },
        lessonChanged: lessonChanged,
        refresh: refresh,
        resetLesson: function () { lessonChanged(); options.stopLesson(); options.resetLesson(); },
        resumeLesson: resumeLesson
      };
      host.chessAcademyDuel = api;
      refresh();
      var loaded;
      async function enter(mode) {
        var token = ++generation;
        options.stopLesson();
        root.speechSynthesis?.cancel();
        try {
          await loaded;
          if (token !== generation) return;
          if (!duel) {
            var lesson = options.getLessonPosition();
            if (!lesson) { options.status('\u8bf7\u5148\u9009\u62e9\u8bfe\u7a0b\u6216\u9898\u76ee'); return; }
            var chess = new modules[1].Chess(lesson.fen);
            lesson.moves.forEach(function (san) { chess.move(san); });
            var session = new modules[0].ChessDuel({
              fen: lesson.fen, onChange: snapshot,
              onStatus: function (status) { if (active && status.error) report(status.error); },
              analyze: function (fen, settings) { return engine.analyze(fen, Object.assign({}, settings, { skillLevel: 20 })); }
            });
            chess.history().forEach(function (san) {
              var move = session.snapshot().legalMoves.find(function (candidate) { return candidate.san === san; });
              if (!move) throw new Error('Invalid lesson SAN: ' + san);
              session.move(move.from, move.to, move.promotion);
            });
            if (session.snapshot().fen !== chess.fen()) throw new Error('Lesson FEN replay mismatch');
            duel = session;
          }
          active = true;
          selected = null;
          duel.setPlayerColor(playerColor);
          duel.setMode(mode);
        } catch (error) { report(error); }
      }
      host.addEventListener('click', function (event) {
        var button = event.target.closest('[data-chess-action]');
        if (!button) return;
        var action = button.dataset.chessAction;
        if (modes[action]) {
          event.stopImmediatePropagation();
          enter(modes[action]);
          return;
        }
        if (action === 'color') {
          event.stopImmediatePropagation();
          playerColor = playerColor === 'w' ? 'b' : 'w';
          if (duel) duel.setPlayerColor(playerColor);
          else button.textContent = playerColor === 'w' ? '\u26aa' : '\u26ab';
          return;
        }
        if (!active || !['reset', 'play', 'previous', 'next'].includes(action)) return;
        event.stopImmediatePropagation();
        selected = null;
        try {
          if (action === 'reset') duel.reset();
          if (action === 'previous') duel.undo();
          if (action === 'next') duel.step().catch(report);
          if (action === 'play') {
            if (last.mode === 'ai_ai') duel.togglePlay();
            else if (last.paused) duel.resume();
            else duel.pause();
          }
        } catch (error) { report(error); }
      }, true);
      board.addEventListener('click', function (event) {
        if (!active) return;
        event.stopImmediatePropagation();
        var square = event.target.closest('[data-row][data-col]');
        if (!square || last.thinking || last.playing || last.result || last.mode === 'human_ai' && last.turn !== last.playerColor) return;
        var name = String.fromCharCode(97 + Number(square.dataset.col)) + (8 - Number(square.dataset.row));
        if (selected && (last.legalSquares[selected] || []).includes(name)) {
          var origin = selected;
          selected = null;
          try { duel.move(origin, name, promotion.value); } catch (error) { report(error); }
        } else {
          selected = last.legalSquares[name] ? name : null;
          highlights();
        }
      }, true);
      loaded = Promise.all([import(new URL('./duel-runtime.js', base)), import(new URL('./vendor/chess.mjs', base)), import(new URL('./stockfish-client.js', base))])
        .then(function (imports) { modules = imports; engine = new imports[2].StockfishClient(); });
      try { await loaded; } catch (error) { report(error); }
      refresh();
      return api;
    }
  };
})(window);