'use strict';
/**
 * BuildTimeAdapter — "限时搭塔 / Build Under Time", the second Mini-game.
 *
 * Gameplay only: a pile of blocks of different widths sits at the bottom, and
 * the child stacks a tower by always taking the biggest block still in the pile
 * (or the smallest, when the template asks the question the other way round).
 * One placement is one round, so every move is a comparison across a shrinking
 * set — Quick Compare trains pairwise choice, this trains ordering under time.
 *
 * This file exists to prove the Adapter boundary is real: it reuses PointerDrag
 * (the Interaction layer's drag engine) for a completely different interaction
 * style, and still touches none of the lifecycle — no timer, no pause, no
 * scoring, no Attempt, no Cycle. Compare it with minigame-quick-compare.js:
 * everything the two games share lives in minigame-runtime.js and is written
 * once.
 *
 * Two input paths, both first-class:
 *   drag a block onto the tower  — the intended, physical interaction
 *   tap a block                  — same result, no fine motor skill required
 * Tapping is not a fallback for weak devices; it is there because a K1 child's
 * hand should not decide whether a comparison is scored as understood
 * (PATTERN-QUALITY-GATE.md §9.3).
 */
var BuildTimeAdapter = (function () {

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    var s = document.createElement('style');
    s.textContent = [
      '.bt{width:100%;display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.bt-ask{font-size:18px;font-weight:900;color:#1e3a8a;text-align:center;min-height:24px;}',
      '.bt-tower{width:min(420px,94%);min-height:96px;display:flex;flex-direction:column-reverse;' +
        'align-items:center;justify-content:flex-start;gap:3px;padding:8px 6px 6px;' +
        'border-bottom:6px solid #94a3b8;border-radius:6px;background:rgba(255,255,255,.55);}',
      '.bt-tower.bt-open{outline:3px dashed #93c5fd;outline-offset:3px;}',
      '.bt-slab{height:22px;border-radius:6px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.12);}',
      '.bt-slab.bt-new{animation:bt-drop .22s ease-out;}',
      '@keyframes bt-drop{from{transform:translateY(-18px);opacity:.4;}to{transform:none;opacity:1;}}',
      '.bt-pile{width:min(460px,96%);display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;' +
        'min-height:76px;}',
      '.bt-block{position:relative;height:30px;border-radius:8px;cursor:pointer;user-select:none;' +
        '-webkit-tap-highlight-color:transparent;touch-action:none;box-shadow:inset 0 -4px 0 rgba(0,0,0,.14);' +
        'transition:transform .12s,box-shadow .12s;}',
      '.bt-block:active{transform:scale(.96);}',
      '.bt-block.bt-hit{box-shadow:0 0 0 4px rgba(34,197,94,.35),inset 0 -4px 0 rgba(0,0,0,.14);}',
      '.bt-block.bt-miss{box-shadow:0 0 0 4px rgba(248,113,113,.35),inset 0 -4px 0 rgba(0,0,0,.14);}',
      '.bt-block.bt-show{outline:3px solid #22c55e;outline-offset:2px;}',
      '.bt-lock{pointer-events:none;}'
    ].join('');
    document.head.appendChild(s);
  }

  var _s = null;

  var ASK_TEXT = {
    size:   { pos: { zh: '拿剩下最大的那块', en: 'Take the biggest block left' },
              neg: { zh: '拿剩下最小的那块', en: 'Take the smallest block left' } },
    length: { pos: { zh: '拿剩下最长的那块', en: 'Take the longest block left' },
              neg: { zh: '拿剩下最短的那块', en: 'Take the shortest block left' } }
  };

  function _ask(round) {
    var t = ASK_TEXT[round.type] || ASK_TEXT.size;
    return round.askPositive ? t.pos : t.neg;
  }

  function mount(stageEl, ctx) {
    _injectStyles();
    _s = { ctx: ctx, rounds: (ctx.variant && ctx.variant.rounds) || [],
           round: null, lastPolarity: null, placedWidths: [] };

    var wrap = document.createElement('div');
    wrap.className = 'bt';
    wrap.id = 'bt-root';
    wrap.innerHTML =
      '<div class="bt-ask" id="bt-ask"></div>' +
      '<div class="bt-tower bt-open" id="bt-tower"></div>' +
      '<div class="bt-pile" id="bt-pile"></div>';
    stageEl.appendChild(wrap);

    PointerDrag.registerDropZone(document.getElementById('bt-tower'), 'tower');
  }

  function nextRound(roundIndex) {
    if (!_s) return null;
    return _s.rounds[roundIndex] || null;
  }

  function renderRound(round) {
    if (!_s) return;
    var fresh = !_s.round || _s.round.towerIndex !== round.towerIndex;
    _s.round = round;
    if (fresh) _s.placedWidths = [];        // a new tower starts on bare ground

    _renderTower();
    _renderPile(round);
    _renderAsk(round);

    // Speak once per tower and per rule change, not once per round: the
    // instruction is identical for every block in a tower.
    var polarity = round.type + ':' + (round.askPositive ? 'pos' : 'neg');
    if (polarity !== _s.lastPolarity) {
      _s.lastPolarity = polarity;
      var a = _ask(round);
      _s.ctx.speak(a.zh, a.en);
    }
  }

  function _renderAsk(round) {
    var el = document.getElementById('bt-ask');
    if (!el) return;
    var a = _ask(round);
    el.innerHTML = '<span class="zh">' + a.zh + '</span><span class="en">' + a.en + '</span>';
    _applyLangTo(el);
  }

  // The tower is drawn from the widths actually placed, so a wrong placement is
  // visible in the shape of the tower — the feedback is the picture, not a mark.
  function _renderTower(newestId) {
    var el = document.getElementById('bt-tower');
    if (!el) return;
    el.innerHTML = _s.placedWidths.map(function (b) {
      return '<div class="bt-slab' + (b.id === newestId ? ' bt-new' : '') +
             '" style="width:' + b.widthPct + '%;background:' + b.color + ';"></div>';
    }).join('');
  }

  function _renderPile(round) {
    var pileEl = document.getElementById('bt-pile');
    if (!pileEl) return;
    PointerDrag.unregisterAll();
    PointerDrag.registerDropZone(document.getElementById('bt-tower'), 'tower');
    pileEl.classList.remove('bt-lock');
    pileEl.innerHTML = '';

    (round.pile || []).forEach(function (block) {
      var el = document.createElement('div');
      el.className = 'bt-block';
      el.id = 'bt-b-' + block.id;
      el.dataset.blockId = block.id;
      // Widths are percentages of the tower area; the pile uses the same scale so
      // a block does not change size when it is picked up.
      el.style.width = Math.round(block.widthPct * 0.9) + '%';
      el.style.background = block.color;

      el.addEventListener('click', function () { _s.ctx.submit(block.id); });
      PointerDrag.makeDraggable(el, {
        onEnd: function (dragEl, zoneId) {
          // Dropping anywhere else is not an answer: an aborted drag must never
          // be scored (PATTERN-QUALITY-GATE.md §9.2).
          if (zoneId === 'tower') _s.ctx.submit(block.id);
        }
      });
      pileEl.appendChild(el);
    });
  }

  function judge(input, round) {
    if (input === round.answer) return { correct: true };
    var chosen = _block(round, input);
    var right  = _block(round, round.answer);
    if (!chosen || !right) return { correct: false, errorType: 'perception' };
    // Reaching for the extreme at the wrong end means the comparison itself was
    // fine and the question was inverted — a different lesson from misjudging
    // two blocks of similar width.
    var worst = (round.pile || []).reduce(function (acc, b) {
      if (!acc) return b;
      return (round.askPositive ? b.widthPct < acc.widthPct : b.widthPct > acc.widthPct) ? b : acc;
    }, null);
    if (worst && chosen.id === worst.id) return { correct: false, errorType: 'polarity_confusion' };
    return { correct: false, errorType: 'perception' };
  }

  function _block(round, id) {
    var hit = (round.pile || []).filter(function (b) { return b.id === id; });
    return hit[0] || null;
  }

  function showJudgement(correct, round, input) {
    var pileEl = document.getElementById('bt-pile');
    if (pileEl) pileEl.classList.add('bt-lock');

    var chosenEl = document.getElementById('bt-b-' + input);
    if (chosenEl) chosenEl.classList.add(correct ? 'bt-hit' : 'bt-miss');

    if (!correct) {
      var rightEl = document.getElementById('bt-b-' + round.answer);
      if (rightEl) rightEl.classList.add('bt-show');
    }

    // Either way the correct block is what goes onto the tower. The pre-generated
    // rounds assume correct play, and demonstrating the right block is how a
    // wrong round teaches instead of just deducting.
    var placed = _block(round, round.answer);
    if (placed) {
      _s.placedWidths.push(placed);
      _renderTower(placed.id);
    }

    // Last comparison of this tower: the single block left is not a comparison,
    // so it is dropped in as a reward rather than scored as a round.
    var next = _s.rounds[round.roundIndex + 1];
    var lastOfTower = !next || next.towerIndex !== round.towerIndex;
    if (lastOfTower && (round.pile || []).length === 2) {
      var leftover = (round.pile || []).filter(function (b) { return b.id !== round.answer; })[0];
      if (leftover) { _s.placedWidths.push(leftover); _renderTower(leftover.id); }
    }
  }

  function applyLang() {
    if (_s && _s.round) _renderAsk(_s.round);
  }

  function _applyLangTo(el) {
    var l = shell.lang || 'zh';
    el.querySelectorAll('.zh').forEach(function (n) { n.style.display = l === 'zh' ? '' : 'none'; });
    el.querySelectorAll('.en').forEach(function (n) { n.style.display = l === 'en' ? '' : 'none'; });
  }

  function unmount() {
    PointerDrag.unregisterAll();
    var root = document.getElementById('bt-root');
    if (root) root.remove();
    _s = null;
  }

  return {
    id: 'build_time',
    mount: mount,
    nextRound: nextRound,
    renderRound: renderRound,
    judge: judge,
    showJudgement: showJudgement,
    applyLang: applyLang,
    unmount: unmount
  };
}());

if (typeof MiniGameRuntime !== 'undefined') MiniGameRuntime.register(BuildTimeAdapter);
