'use strict';
/**
 * QuickCompareAdapter — "快速比较 / Quick Compare", the first Mini-game.
 *
 * Gameplay only: two cards appear, the child taps the one that is bigger /
 * smaller / has more / has fewer, and the next pair appears immediately. One
 * round is one tap, so the child stays in a continuous observe → judge → act
 * loop instead of a single question-and-answer.
 *
 * Everything that is not gameplay — the header, timer, pause, stars, exit,
 * scoring, the Attempt, the Cycle hand-back — belongs to MiniGameRuntime and is
 * deliberately absent from this file. Round data comes pre-generated in
 * variant.rounds (Generators.miniRound), so the same rounds a child plays can
 * be validated headlessly in test.html.
 */
var QuickCompareAdapter = (function () {

  var _styled = false;
  function _injectStyles() {
    if (_styled) return;
    _styled = true;
    var s = document.createElement('style');
    s.textContent = [
      '.qc{width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;}',
      '.qc-ask{font-size:19px;font-weight:900;color:#1e3a8a;text-align:center;min-height:26px;}',
      '.qc-cards{display:flex;gap:14px;align-items:stretch;justify-content:center;width:min(560px,100%);}',
      '.qc-card{flex:1;min-height:132px;background:#fff;border:3px solid #bfdbfe;border-radius:18px;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 8px;' +
        'cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;' +
        'transition:transform .12s,border-color .12s,box-shadow .12s;}',
      '.qc-card:active{transform:scale(.97);}',
      '.qc-card.qc-hit{border-color:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.22);}',
      '.qc-card.qc-miss{border-color:#f87171;box-shadow:0 0 0 4px rgba(248,113,113,.2);}',
      '.qc-card.qc-show{border-color:#22c55e;background:#f0fdf4;}',
      '.qc-emoji{line-height:1;}',
      '.qc-num{font-size:52px;font-weight:900;color:#1d4ed8;line-height:1;}',
      '.qc-dots{display:flex;flex-wrap:wrap;gap:3px;align-items:center;justify-content:center;max-width:190px;}',
      '.qc-dot{font-size:22px;line-height:1;}',
      '.qc-count{font-size:15px;font-weight:900;color:#475569;}',
      '.qc-bar-wrap{width:92%;display:flex;justify-content:flex-start;}',
      '.qc-bar{height:26px;border-radius:13px;background:linear-gradient(90deg,#60a5fa,#2563eb);min-width:8px;}',
      '.qc-lock{pointer-events:none;}'
    ].join('');
    document.head.appendChild(s);
  }

  var _s = null;

  // Prompt text per dimension. `positive` = asking for the bigger/greater side.
  var ASK_TEXT = {
    size:     { pos: { zh: '哪个更大？',   en: 'Which is bigger?' },
                neg: { zh: '哪个更小？',   en: 'Which is smaller?' } },
    quantity: { pos: { zh: '哪边更多？',   en: 'Which side has more?' },
                neg: { zh: '哪边更少？',   en: 'Which side has fewer?' } },
    number:   { pos: { zh: '哪个数更大？', en: 'Which number is bigger?' },
                neg: { zh: '哪个数更小？', en: 'Which number is smaller?' } },
    length:   { pos: { zh: '哪个更长？',   en: 'Which is longer?' },
                neg: { zh: '哪个更短？',   en: 'Which is shorter?' } }
  };

  function _ask(round) {
    var t = ASK_TEXT[round.type] || ASK_TEXT.size;
    return round.askPositive ? t.pos : t.neg;
  }

  function mount(stageEl, ctx) {
    _injectStyles();
    _s = { ctx: ctx, rounds: (ctx.variant && ctx.variant.rounds) || [], round: null, lastPolarity: null };

    var wrap = document.createElement('div');
    wrap.className = 'qc';
    wrap.id = 'qc-root';
    wrap.innerHTML =
      '<div class="qc-ask" id="qc-ask"></div>' +
      '<div class="qc-cards" id="qc-cards">' +
        '<div class="qc-card" id="qc-left"  data-side="left"></div>' +
        '<div class="qc-card" id="qc-right" data-side="right"></div>' +
      '</div>';
    stageEl.appendChild(wrap);

    ['left', 'right'].forEach(function (side) {
      document.getElementById('qc-' + side).addEventListener('click', function () {
        // The Runtime owns the round lock, so a double tap cannot double-score.
        _s.ctx.submit(side);
      });
    });
  }

  // Rounds are pre-generated, so the adapter only walks the list. Returning
  // null tells the Runtime the pool is exhausted and the game should end.
  function nextRound(roundIndex) {
    if (!_s) return null;
    return _s.rounds[roundIndex] || null;
  }

  function renderRound(round) {
    if (!_s) return;
    _s.round = round;

    var cards = document.getElementById('qc-cards');
    if (cards) cards.classList.remove('qc-lock');
    ['left', 'right'].forEach(function (side) {
      var el = document.getElementById('qc-' + side);
      if (!el) return;
      el.className = 'qc-card';
      el.innerHTML = _sideHtml(round, side);
    });

    _renderAsk(round);

    // Speak the task only when it actually changes: reading it aloud every
    // round would fall behind a child who is answering every 1.5 s.
    var polarity = round.type + ':' + (round.askPositive ? 'pos' : 'neg');
    if (polarity !== _s.lastPolarity) {
      _s.lastPolarity = polarity;
      var a = _ask(round);
      _s.ctx.speak(a.zh, a.en);
    }
  }

  function _renderAsk(round) {
    var el = document.getElementById('qc-ask');
    if (!el) return;
    var a = _ask(round);
    el.innerHTML = '<span class="zh">' + a.zh + '</span><span class="en">' + a.en + '</span>';
    _applyLangTo(el);
  }

  function _sideHtml(round, side) {
    if (round.type === 'number') {
      var n = side === 'left' ? round.leftNum : round.rightNum;
      return '<div class="qc-num">' + n + '</div>';
    }

    if (round.type === 'quantity') {
      var count = side === 'left' ? round.leftCount : round.rightCount;
      var emoji = round.objEmoji || '🍎';
      var dots = '';
      for (var i = 0; i < count; i++) dots += '<span class="qc-dot">' + emoji + '</span>';
      return '<div class="qc-dots">' + dots + '</div>' +
        (round.showNumbers ? '<div class="qc-count">' + count + '</div>' : '');
    }

    if (round.type === 'length') {
      // Bars share one width scale, so the pair reads as two lengths side by
      // side rather than two independently-scaled pictures.
      var pct = side === 'left' ? round.leftPct : round.rightPct;
      return '<div class="qc-bar-wrap"><div class="qc-bar" style="width:' + pct + '%"></div></div>';
    }

    // size (and any future rank-based dimension): scale from the pair itself
    // rather than from an absolute rank table, so the gap is always visible
    // no matter which two objects the generator picked.
    var mine  = side === 'left' ? round.leftSizeRank  : round.rightSizeRank;
    var other = side === 'left' ? round.rightSizeRank : round.leftSizeRank;
    var em    = side === 'left' ? round.leftEmoji     : round.rightEmoji;
    var big   = Math.max(mine, other) || 1;
    var ratio = mine >= other ? 1 : Math.min(0.72, Math.max(0.42, (mine || 1) / big));
    return '<div class="qc-emoji" style="font-size:' + Math.round(76 * ratio) + 'px">' + (em || '❓') + '</div>';
  }

  function judge(input, round) {
    var correct = input === round.answer;
    if (correct) return { correct: true };
    // With two cards a wrong tap is always the other side, so the interesting
    // question is WHICH mistake it was. Picking the bigger object when asked
    // for the smaller one is an inverted-question error, not a perceptual one —
    // the child compared correctly and answered the wrong question.
    return { correct: false, errorType: round.askPositive ? 'perception' : 'polarity_confusion' };
  }

  function showJudgement(correct, round, input) {
    var cards = document.getElementById('qc-cards');
    if (cards) cards.classList.add('qc-lock');   // no taps during feedback
    var chosen = document.getElementById('qc-' + input);
    if (chosen) chosen.classList.add(correct ? 'qc-hit' : 'qc-miss');
    if (!correct) {
      // Show the answer instead of only marking the mistake: the child gets one
      // more look at the pair, which is the only way a wrong round teaches.
      var right = document.getElementById('qc-' + round.answer);
      if (right) right.classList.add('qc-show');
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
    var root = document.getElementById('qc-root');
    if (root) root.remove();
    _s = null;
  }

  return {
    id: 'quick_compare',
    mount: mount,
    nextRound: nextRound,
    renderRound: renderRound,
    judge: judge,
    showJudgement: showJudgement,
    applyLang: applyLang,
    unmount: unmount
  };
}());

if (typeof MiniGameRuntime !== 'undefined') MiniGameRuntime.register(QuickCompareAdapter);
