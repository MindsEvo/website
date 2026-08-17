'use strict';
/**
 * FitRuntime — situational drag-to-fit activity.
 * Classic: help the rabbit cross the river by choosing the right plank.
 * Instant world-responds feedback: board drops into place if it reaches, slides back if too short.
 */
var FitRuntime = (function () {

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    IH.injectStyles();
    var s = document.createElement('style');
    s.textContent = [
      '.ft{position:fixed;inset:0;background:var(--s1-bg,#eff6ff);z-index:500;display:flex;flex-direction:column;font-family:inherit;}',
      '.ft-instr{text-align:center;font-size:16px;font-weight:900;color:#1e3a8a;padding:10px 16px 4px;flex-shrink:0;}',
      // centered body keeps scene from stretching full screen width
      '.ft-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:14px 20px;}',
      '.ft-scene{display:flex;align-items:flex-end;width:min(580px,100%);height:110px;position:relative;}',
      '.ft-bank{width:80px;flex-shrink:0;background:linear-gradient(180deg,#a16207,#854d0e);border-radius:10px 10px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-size:30px;line-height:1;}',
      '.ft-bank-r{width:80px;flex-shrink:0;background:linear-gradient(180deg,#a16207,#854d0e);border-radius:10px 10px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:6px;font-size:30px;line-height:1;}',
      '.ft-water{flex:1;position:relative;display:flex;align-items:flex-end;justify-content:center;}',
      '.ft-river{width:100%;height:60px;border-radius:4px;display:flex;align-items:center;justify-content:center;}',
      '.ft-water-ripple{font-size:22px;opacity:0.6;}',
      '.ft-drop-zone{position:absolute;inset:0;}',
      '.ft-bridge{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);height:14px;border-radius:999px;opacity:0;transition:opacity .3s;}',
      '.ft-bridge.ft-visible{opacity:1;}',
      // tray: compact, centered
      '.ft-tray{display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}',
      '.ft-tray-lbl{font-size:12px;font-weight:700;color:#64748b;}',
      '.ft-boards{display:flex;gap:12px;align-items:center;justify-content:center;width:100%;}',
      '.ft-board{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:grab;touch-action:none;user-select:none;transition:opacity .15s;}',
      '.ft-board.ft-used{opacity:0.28;pointer-events:none;}',
      '.ft-board-bar{height:18px;border-radius:999px;min-width:24px;}',
      '.ft-board-lbl{font-size:10px;font-weight:700;color:#64748b;}',
      // Feedback text
      '.ft-msg{text-align:center;font-size:14px;font-weight:700;padding:4px 16px;flex-shrink:0;min-height:24px;}',
      '.ft-msg.ok{color:#16a34a;}',
      '.ft-msg.err{color:#dc2626;}',
      // Animations
      '@keyframes ft-slide-in{from{transform:translateX(-50%) scaleX(0)}to{transform:translateX(-50%) scaleX(1)}}',
      '@keyframes ft-bounce{0%,100%{transform:translateX(0)}30%{transform:translateX(60%)}70%{transform:translateX(100%)}}'
    ].join('');
    document.head.appendChild(s);
  }

  var _st = null;

  function run(template, variant, ctx) {
    _injectStyles();
    PointerDrag.unregisterAll();
    _st = {
      template:   template,
      variant:    variant,
      ctx:        ctx,
      usedBoards: [],  // ids of boards already tried (correctly used ones removed)
      attempts:   0,
      startTime:  Date.now(),
      done:       false
    };
    _buildUI();
  }

  function _buildUI() {
    var s = _st;
    var v = s.variant;
    var scene = v.scene;

    var root = document.createElement('div');
    root.className = 'ft';
    root.id = 'ft-root';
    root.innerHTML =
      '<div class="ih-hdr">' +
        '<button class="ih-back" id="ft-back">\u2b05\ufe0f</button>' +
        '<div class="ih-title">' +
          '<span class="zh">' + s.ctx.levelId + ' \u00b7 \u641e\u5efa\u6865</span>' +
          '<span class="en">' + s.ctx.levelId + ' \u00b7 Build a Bridge</span>' +
        '</div>' +
        IH.controlsHtml('ft') +
      '</div>' +
      '<div class="ft-instr">' +
        '<span class="zh">\u627e\u4e00\u5757\u80fd\u641e\u5230\u5bf9\u5cb8\u7684\u6728\u677f\uff01</span>' +
        '<span class="en">Find a plank long enough to reach the other side!</span>' +
      '</div>' +
      '<div class="ft-body">' +
        '<div class="ft-scene">' +
          '<div class="ft-bank" id="ft-bank-l">' + scene.leftEmoji + '</div>' +
          '<div class="ft-water">' +
            '<div class="ft-river" style="background:' + scene.riverColor + ';">' +
              '<span class="ft-water-ripple">\ud83c\udf0a\ud83c\udf0a</span>' +
            '</div>' +
            '<div class="ft-bridge" id="ft-bridge"></div>' +
            '<div class="ft-drop-zone" id="ft-drop-zone"></div>' +
          '</div>' +
          '<div class="ft-bank-r">' + scene.rightEmoji + '</div>' +
        '</div>' +
        '<div class="ft-msg" id="ft-msg"></div>' +
        '<div class="ft-tray">' +
          '<div class="ft-tray-lbl"><span class="zh">\u9009\u4e00\u5757\u6728\u677f\u62d6\u5230\u6cb3\u4e0a</span><span class="en">Drag a plank onto the river</span></div>' +
          '<div class="ft-boards" id="ft-boards"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    IH.wire('ft', { onReset: _reset });
    _applyLang();

    document.getElementById('ft-back').addEventListener('click', function () {
      var onBack = _st && _st.ctx.onBack;
      _tearDown();
      if (onBack) onBack();
    });

    // Register river as drop zone
    PointerDrag.registerDropZone(document.getElementById('ft-drop-zone'), 'river');

    // Build boards
    _renderBoards();

    document.addEventListener('shell:langchange', _applyLang);
  }

  function _renderBoards() {
    var s = _st;
    var boardsEl = document.getElementById('ft-boards');
    if (!boardsEl) return;
    boardsEl.innerHTML = '';

    s.variant.boards.forEach(function (board) {
      var used = s.usedBoards.indexOf(board.id) !== -1;
      var el = document.createElement('div');
      el.className = 'ft-board' + (used ? ' ft-used' : '');
      el.dataset.boardId = board.id;
      el.innerHTML =
        '<div class="ft-board-bar" style="width:' + board.lengthPct * 0.9 + 'px;max-width:140px;background:' + board.color + ';"></div>' +
        '<div class="ft-board-lbl">' + board.lengthPct + '%</div>';

      if (!used) {
        PointerDrag.makeDraggable(el, {
          onEnd: function (dragEl, zoneId) {
            if (zoneId === 'river') _tryBoard(board);
          }
        });
      }
      boardsEl.appendChild(el);
    });
  }

  // Three outcomes, not two:
  //   too short           → wrong, "too short" feedback, child keeps trying
  //   long enough + best  → correct, "a perfect fit" feedback
  //   long enough + extra → correct, but told the plank is longer than needed
  // Any plank that spans the gap really does carry the character across, so it
  // counts as correct; process.optimal records whether it was the shortest fit.
  function _tryBoard(board) {
    var s = _st;
    if (s.done) return;
    s.attempts++;

    var scene = s.variant.scene;
    var fits  = board.lengthPct >= scene.gapPct;

    if (!fits) { _tooShort(board); return; }

    var optimal = board.id === s.variant.correctBoardId;

    s.done = true;
    s.usedBoards.push(board.id);
    _renderBoards();

    // Show bridge crossing the river
    var bridgeEl = document.getElementById('ft-bridge');
    if (bridgeEl) {
      var riverEl = document.querySelector('#ft-root .ft-river');
      var riverW  = riverEl ? riverEl.offsetWidth : 200;
      bridgeEl.style.width  = (riverW + 20) + 'px';
      bridgeEl.style.background = board.color;
      bridgeEl.style.animation  = 'ft-slide-in .4s ease forwards';
      bridgeEl.classList.add('ft-visible');
    }

    if (optimal) {
      _setMsg('刚好搭到对岸了！' + scene.leftEmoji + '跳过去了🎉',
              'A perfect fit! ' + scene.leftEmoji + ' crosses! 🎉', 'ok');
      if (shell.audio) shell.audio.sfx('win');
      shell.speak(shell.lang === 'zh' ? '刚好！' + scene.leftEmoji + '过河了！' : 'A perfect fit! It crosses!');
    } else {
      _setMsg('有点长，不过能过河！' + scene.leftEmoji + '跳过去了🎉',
              'A bit long, but it works! ' + scene.leftEmoji + ' crosses! 🎉', 'ok');
      if (shell.audio) shell.audio.sfx('correct');
      shell.speak(shell.lang === 'zh' ? '有点长，不过能过河！' : 'A bit long, but it works!');
    }

    var attempt = {
      templateId: s.template.id, variantId: s.variant.variantId || '',
      mode: 'fit', result: 'correct', responseMs: Date.now() - s.startTime,
      process: {
        attempts:       s.attempts,
        boardId:        board.id,       // the plank the child actually used
        optimal:        optimal,        // was it the shortest plank that fits?
        boardLengthPct: board.lengthPct,
        gapPct:         scene.gapPct
      }
    };
    var onComplete = s.ctx.onComplete;
    setTimeout(function () { _tearDown(); onComplete(attempt); }, 1400);
  }

  function _tooShort(board) {
    var s = _st;
    s.usedBoards.push(board.id);
    _renderBoards();
    _setMsg('木板太短了，试试长一点的', 'Too short — try a longer plank', 'err');
    if (shell.audio) shell.audio.sfx('bump');
    shell.speak(shell.lang === 'zh' ? '太短了，试试长一点的！' : 'Too short, try a longer one!');
    // Let the child keep trying. If every plank has been tried without success
    // (only reachable if the generator produced no fitting plank) restore the
    // tray so the activity can never dead-end.
    var allUsed = s.variant.boards.every(function (b) { return s.usedBoards.indexOf(b.id) !== -1; });
    if (allUsed) {
      setTimeout(function () {
        if (!_st || _st.done) return;
        _st.usedBoards = [];
        _setMsg('', '', '');
        _renderBoards();
      }, 1000);
    }
  }

  function _setMsg(zh, en, cls) {
    var el = document.getElementById('ft-msg');
    if (!el) return;
    el.className = 'ft-msg' + (cls ? ' ' + cls : '');
    el.innerHTML = '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>';
    _applyLang(el);
  }

  function _applyLang(el) {
    if (!el || el.type) el = null;
    var root = el || document.getElementById('ft-root');
    if (!root || !root.querySelectorAll) return;
    var l = shell.lang || 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
  }

  function _reset() {
    if (!_st || _st.done) return;
    _st.usedBoards = [];
    // attempts is NOT cleared: like moves/corrections in the other runtimes it
    // counts everything the child did, so a reset cannot hide the struggle.
    var bridgeEl = document.getElementById('ft-bridge');
    if (bridgeEl) { bridgeEl.classList.remove('ft-visible'); bridgeEl.style.animation = ''; }
    _setMsg('', '', '');
    _renderBoards();
  }

  function _tearDown() {
    PointerDrag.unregisterAll();
    document.removeEventListener('shell:langchange', _applyLang);
    var root = document.getElementById('ft-root');
    if (root) root.remove();
    _st = null;
  }

  return { run: run };
}());
