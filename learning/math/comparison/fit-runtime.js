'use strict';
/**
 * FitRuntime — situational drag-to-fit activity.
 * Classic: help the rabbit cross the river by choosing the right plank.
 * Instant world-responds feedback: board drops into place if it reaches, slides back if too short.
 *
 * Everything on screen is drawn against ONE shared ruler (see doc §6.6): the
 * river gap is gapPct% of it and every plank is lengthPct% of it, so "long
 * enough" is something the child can see instead of something only the code
 * knows. The planks are stacked in a single column with every left edge on the
 * near shore, and a dashed line marks the far shore: a plank fits exactly when
 * it crosses that line.
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
      '.ft-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px 20px;}',
      // One field, one ruler: the scene and the plank tray share this width, so
      // plank length and gap width are measured on the same scale.
      '.ft-field{position:relative;width:min(580px,100%);display:flex;flex-direction:column;gap:10px;}',
      '.ft-scene{display:flex;align-items:flex-end;width:100%;height:110px;position:relative;}',
      // Bank widths come from _layout(); the emoji sits at the water's edge so
      // the distance the child sees IS the gap that has to be spanned.
      '.ft-bank{flex:0 0 auto;background:linear-gradient(180deg,#a16207,#854d0e);border-radius:10px 10px 0 0;' +
        'display:flex;align-items:flex-start;justify-content:flex-end;padding:6px 6px 0 0;font-size:30px;line-height:1;}',
      '.ft-bank-r{flex:1 1 auto;background:linear-gradient(180deg,#a16207,#854d0e);border-radius:10px 10px 0 0;' +
        'display:flex;align-items:flex-start;justify-content:flex-start;padding:6px 0 0 6px;font-size:30px;line-height:1;}',
      '.ft-water{flex:0 0 auto;position:relative;display:flex;align-items:flex-end;justify-content:center;}',
      '.ft-river{width:100%;height:60px;border-radius:4px;display:flex;align-items:center;justify-content:center;gap:8px;}',
      '.ft-water-ripple{font-size:22px;opacity:0.6;}',
      '.ft-gap-num{font-size:14px;font-weight:900;color:#0c4a6e;}',
      // Generous drop target: the visible river stays true to scale, but the
      // pointer does not have to be precise for a 4-year-old to succeed.
      '.ft-drop-zone{position:absolute;left:-24px;right:-24px;top:-40px;bottom:-12px;}',
      // The plank actually laid down: left edge on the near shore, drawn on the
      // shared ruler, so a plank that is longer than needed really overhangs.
      '.ft-bridge{position:absolute;bottom:18px;left:0;height:16px;border-radius:999px;transform-origin:left center;' +
        'box-shadow:inset 0 -3px 0 rgba(0,0,0,.15);opacity:0;transition:opacity .2s;}',
      '.ft-bridge.ft-visible{opacity:1;}',
      // Far-shore line: "long enough" == crosses this line.
      '.ft-goal-line{position:absolute;top:0;bottom:0;width:0;border-left:2px dashed #64748b;opacity:.7;pointer-events:none;}',
      // tray: compact, centered
      '.ft-tray{display:flex;flex-direction:column;align-items:stretch;gap:8px;flex-shrink:0;}',
      '.ft-tray-lbl{font-size:12px;font-weight:700;color:#64748b;text-align:center;}',
      // Planks stacked in one column, every left edge on the near shore, so
      // plank-vs-plank and plank-vs-gap are both direct comparisons.
      '.ft-boards{display:flex;flex-direction:column;align-items:flex-start;gap:10px;width:100%;}',
      '.ft-board{display:flex;align-items:center;gap:8px;cursor:grab;touch-action:none;user-select:none;transition:opacity .15s;}',
      '.ft-board.ft-used{opacity:0.28;pointer-events:none;}',
      '.ft-board-bar{height:20px;border-radius:999px;min-width:24px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15);}',
      '.ft-board-lbl{font-size:12px;font-weight:800;color:#475569;}',
      // Feedback text
      '.ft-msg{text-align:center;font-size:14px;font-weight:700;padding:0 16px;flex-shrink:0;min-height:22px;}',
      '.ft-msg.ok{color:#16a34a;}',
      '.ft-msg.err{color:#dc2626;}',
      // Animations
      '@keyframes ft-slide-in{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
      '@keyframes ft-sink{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(28px) rotate(-7deg);opacity:0}}',
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
      done:       false,
      placed:     null, // the plank lying across the river, kept for re-layout
      // K1/K2 compare by eye only; from G1 the same picture also carries the
      // numbers, which is the bridge to numeric comparison.
      showNumbers: ['K1', 'K2'].indexOf(ctx.levelId) === -1,
      ruler:      0,
      bankL:      0,
      riverW:     0
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
        '<button class="ih-back" id="ft-back">⬅️</button>' +
        '<div class="ih-title">' +
          '<span class="zh">' + s.ctx.levelId + ' · 搭建桥</span>' +
          '<span class="en">' + s.ctx.levelId + ' · Build a Bridge</span>' +
        '</div>' +
        IH.controlsHtml('ft') +
      '</div>' +
      '<div class="ft-instr">' +
        '<span class="zh">找一块能搭到对岸的木板！</span>' +
        '<span class="en">Find a plank long enough to reach the other side!</span>' +
      '</div>' +
      '<div class="ft-body">' +
        '<div class="ft-field" id="ft-field">' +
          '<div class="ft-scene">' +
            '<div class="ft-bank" id="ft-bank-l">' + scene.leftEmoji + '</div>' +
            '<div class="ft-water" id="ft-water">' +
              '<div class="ft-river" style="background:' + scene.riverColor + ';">' +
                '<span class="ft-water-ripple">🌊🌊</span>' +
                (s.showNumbers ? '<span class="ft-gap-num">' + scene.gapPct + '</span>' : '') +
              '</div>' +
              '<div class="ft-bridge" id="ft-bridge"></div>' +
              '<div class="ft-drop-zone" id="ft-drop-zone"></div>' +
            '</div>' +
            '<div class="ft-bank-r">' + scene.rightEmoji + '</div>' +
          '</div>' +
          '<div class="ft-msg" id="ft-msg"></div>' +
          '<div class="ft-tray">' +
            '<div class="ft-tray-lbl">' +
              '<span class="zh">把木板拖到河上（要能越过虚线）</span>' +
              '<span class="en">Drag a plank onto the river — it must cross the dashed line</span>' +
            '</div>' +
            '<div class="ft-boards" id="ft-boards"></div>' +
          '</div>' +
          '<div class="ft-goal-line" id="ft-goal-line"></div>' +
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

    // Size the shared ruler, then build the boards against it.
    _layout();
    window.addEventListener('resize', _layout);

    document.addEventListener('shell:langchange', _applyLang);
  }

  /**
   * Establish the shared ruler and lay out everything that depends on it.
   * 100% of the ruler = the span from the near shore to just short of the
   * field's right edge, so even the longest plank (<=98%) still fits on screen.
   */
  function _layout() {
    var s = _st;
    if (!s) return;
    var field = document.getElementById('ft-field');
    var water = document.getElementById('ft-water');
    if (!field || !water) return;
    var w = field.clientWidth;
    if (!w) return;

    s.bankL  = Math.max(44, Math.min(70, Math.round(w * 0.12)));
    s.ruler  = w - s.bankL - 8;
    s.riverW = Math.max(40, Math.round(s.variant.scene.gapPct / 100 * s.ruler));

    document.getElementById('ft-bank-l').style.width   = s.bankL + 'px';
    water.style.width                                  = s.riverW + 'px';
    document.getElementById('ft-boards').style.paddingLeft = s.bankL + 'px';
    document.getElementById('ft-goal-line').style.left = (s.bankL + s.riverW) + 'px';

    _renderBoards();
    if (s.placed) _drawBridge(s.placed, false);
  }

  // A plank's on-screen length: the same percentage of the same ruler the gap
  // is measured against. This single line is what makes the task visual.
  function _boardPx(board) {
    return Math.max(12, Math.round(board.lengthPct / 100 * (_st ? _st.ruler : 400)));
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
        '<div class="ft-board-bar" style="width:' + _boardPx(board) + 'px;background:' + board.color + ';"></div>' +
        (s.showNumbers ? '<div class="ft-board-lbl">' + board.lengthPct + '</div>' : '');

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

  // Lay a plank across the river at true scale, left edge on the near shore.
  function _drawBridge(board, animate) {
    var el = document.getElementById('ft-bridge');
    if (!el) return;
    el.style.width      = _boardPx(board) + 'px';
    el.style.background = board.color;
    el.style.animation  = animate ? 'ft-slide-in .4s ease forwards' : 'none';
    el.classList.add('ft-visible');
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
    s.placed = board;
    s.usedBoards.push(board.id);
    _renderBoards();

    // Show the plank crossing the river — drawn at its own length, so a plank
    // that is longer than needed visibly overhangs the far bank.
    _drawBridge(board, true);

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
    // Lay the plank down for real: it starts at the near shore and stops short
    // of the dashed line, then sinks. The picture and the verdict now agree.
    _drawBridge(board, false);
    setTimeout(function () {
      var el = document.getElementById('ft-bridge');
      if (!el || !_st || _st.done) return;
      el.style.animation = 'ft-sink .5s ease forwards';
    }, 450);
    setTimeout(function () {
      var el = document.getElementById('ft-bridge');
      if (!el || !_st || _st.done) return;
      el.classList.remove('ft-visible');
      el.style.animation = '';
    }, 1000);

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
    _st.placed = null;
    // attempts is NOT cleared: like moves/corrections in the other runtimes it
    // counts everything the child did, so a reset cannot hide the struggle.
    var bridgeEl = document.getElementById('ft-bridge');
    if (bridgeEl) { bridgeEl.classList.remove('ft-visible'); bridgeEl.style.animation = ''; }
    _setMsg('', '', '');
    _renderBoards();
  }

  function _tearDown() {
    PointerDrag.unregisterAll();
    window.removeEventListener('resize', _layout);
    document.removeEventListener('shell:langchange', _applyLang);
    var root = document.getElementById('ft-root');
    if (root) root.remove();
    _st = null;
  }

  return { run: run };
}());
