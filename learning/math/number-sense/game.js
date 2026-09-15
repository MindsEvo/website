'use strict';

/**
 * Learning Math Number Sense — Shell-1 wiring.
 *
 * Radar contract: LEVEL_GRADE, NUMBER_SENSE_TYPE_OF and the `base` table
 * inside difficultyAxisFor() are read as literal text by
 * metadata/validate.js (S2/S3/S4) against metadata/metathinking/number-sense.json.
 * Keep them as flat, literal object declarations — do not compute them.
 */
(function () {
  'use strict';

  var MODULE_ID = 'number-sense';
  var MODULE_TYPE = 'metathinking';
  var SOURCE_GAME_ID = 'learning-math-number-sense';

  // NS_DATA's own unit ids (L1-L4) are legacy numbering from the skeleton
  // this module replaces — the grade code has to be declared, not derived.
  var LEVEL_GRADE = { L1: 'K1', L2: 'K2', L3: 'G1', L4: 'G2' };

  // question.type -> number-sense.json typeTree id. Identity today; kept as
  // an explicit table because the validator reads this name as text.
  var NUMBER_SENSE_TYPE_OF = {
    quantity: 'quantity',
    part_whole: 'part_whole',
    composition: 'composition'
  };

  // question.type -> the single rootGene it trains (number-sense.json's
  // geneReporting rule: each type reports its own gene, never all three).
  var TYPE_GENES = {
    quantity: 'RG.MATH.NUMBER_SENSE.QUANTITY',
    part_whole: 'RG.MATH.NUMBER_SENSE.PART_WHOLE',
    composition: 'RG.MATH.NUMBER_SENSE.COMPOSITION'
  };

  function injectNumberSenseStyles() {
    if (document.getElementById('ns-shell-style')) return;
    var s = document.createElement('style');
    s.id = 'ns-shell-style';
    s.textContent = [
      '.ns-wrap{display:grid;gap:12px;justify-items:center;}',
      '.ns-chip{font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;}',
      '.ns-q{font-size:20px;font-weight:900;color:#92400e;line-height:1.35;text-align:center;}',
      '.ns-sub{font-size:14px;font-weight:700;color:#64748b;text-align:center;}',
      '.ns-expr{font-size:34px;font-weight:900;color:#1e293b;letter-spacing:1px;}',
      '.ns-flash-zone{transition:visibility 0s;}',
      '.ns-flash-hidden{visibility:hidden;}',
      '.ns-flash-pair{display:flex;gap:28px;align-items:center;justify-content:center;}',
      '.ns-dot-group{padding:8px;border-radius:12px;background:#fffbeb;border:1px dashed #fcd34d;}',
      '.ns-dots{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:190px;}',
      '.ns-dot-rows{display:flex;flex-direction:column;gap:6px;align-items:center;}',
      '.ns-dot-rows .ns-dots{flex-wrap:nowrap;max-width:none;}',
      '.ns-dot{width:16px;height:16px;border-radius:50%;background:#d97706;}',
      '.ns-opt{display:grid;gap:8px;justify-items:center;align-content:center;min-height:68px;}',
      '.ns-opt-val{font-size:28px;font-weight:900;color:#0f172a;line-height:1;}',
      '.ns-pair{font-size:24px;font-weight:900;color:#1e293b;}',
      '.s1-opt{min-height:90px !important;}'
    ].join('');
    document.head.appendChild(s);
  }
  injectNumberSenseStyles();

  /**
   * The five difficulty axes declared in number-sense.json, per level.
   * Composition's transfer_complexity steps up to 'strategy' at G1/G2,
   * where the module shifts from sensing a quantity to actively generating
   * and verifying its splits (see number-sense.json levelMap L3/L4).
   */
  function difficultyAxisFor(levelId, type) {
    var base = {
      L1: { object_complexity: 'concrete', dimension_complexity: 'single',
            relation_complexity: 'direct', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      L2: { object_complexity: 'pictorial', dimension_complexity: 'single',
            relation_complexity: 'direct', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      L3: { object_complexity: 'pictorial', dimension_complexity: 'dual',
            relation_complexity: 'indirect', language_complexity: 'question',
            transfer_complexity: 'within-domain' },
      L4: { object_complexity: 'symbolic', dimension_complexity: 'dual',
            relation_complexity: 'indirect', language_complexity: 'question',
            transfer_complexity: 'within-domain' }
    };
    var row = base[levelId];
    if (!row) return null;

    var axis = Object.assign({}, row);
    if (type === 'composition' && (levelId === 'L3' || levelId === 'L4')) {
      axis.transfer_complexity = 'strategy';
    }
    return axis;
  }

  function buildRadarContext(levelId, type, extra) {
    var ctx = {
      moduleId: MODULE_ID,
      moduleType: MODULE_TYPE,
      levelId: levelId,
      gradeCode: LEVEL_GRADE[levelId] || null,
      numberSenseType: NUMBER_SENSE_TYPE_OF[type] || null,
      difficultyAxis: difficultyAxisFor(levelId, type),
      sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  // A unit mixes all three types in varying proportion by grade. The
  // dominant one (by question count, ties broken quantity > part_whole >
  // composition) stands in for the whole session in getReportContext();
  // registerRootGenes() instead reports every gene actually touched.
  function _dominantType(unit) {
    var counts = {};
    (unit.questions || []).forEach(function (q) {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    var best = null;
    var bestCount = -1;
    ['quantity', 'part_whole', 'composition'].forEach(function (t) {
      var c = counts[t] || 0;
      if (c > bestCount) { best = t; bestCount = c; }
    });
    return best;
  }

  function genesFor(unit) {
    var seen = [];
    (unit.questions || []).forEach(function (q) {
      var gene = TYPE_GENES[q.type];
      if (gene && seen.indexOf(gene) === -1) seen.push(gene);
    });
    return seen;
  }

  // Static content is hand-authored, so correct answers cluster at
  // predictable positions (mostly index 1). Shuffle each question's
  // options once at load so children judge the content, not the button.
  function _shuffleWithAnswer(options, answerIndex) {
    var order = options.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    return {
      options: order.map(function (i) { return options[i]; }),
      answer: order.indexOf(answerIndex)
    };
  }

  function buildUnits(units) {
    return (units || []).map(function (unit) {
      var out = Object.assign({}, unit);
      out.questions = (unit.questions || []).map(function (q) {
        var shuffled = _shuffleWithAnswer(q.options, q.answer);
        return Object.assign({}, q, { options: shuffled.options, answer: shuffled.answer });
      });
      return out;
    });
  }

  // Beyond ~6, a single glance can no longer size a dot cluster reliably, so
  // quantities above that are laid out as regular rows instead of a scatter:
  // two equal rows (+ a lone tail dot if n is odd) while that row size stays
  // <=6, then three equal(-ish) rows once a two-row split would need a row
  // bigger than 6. n<=6 is untouched — subitizing range needs no structure.
  function _rowCounts(n) {
    if (n <= 6) return [n];
    var half = Math.floor(n / 2);
    if (half <= 6) {
      var rows = [half, half];
      var tail = n - half * 2;
      if (tail > 0) rows.push(tail);
      return rows;
    }
    var base = Math.floor(n / 3);
    var rem = n - base * 3;
    var rows3 = [base, base, base];
    for (var i = 0; i < rem; i++) rows3[rows3.length - 1 - i] += 1;
    return rows3;
  }

  function _dotRow(count) {
    var out = '';
    for (var i = 0; i < count; i++) out += '<span class="ns-dot"></span>';
    return '<div class="ns-dots">' + out + '</div>';
  }

  function _dotsHtml(n) {
    var rows = _rowCounts(n);
    if (rows.length === 1) return _dotRow(n);
    return '<div class="ns-dot-rows">' + rows.map(_dotRow).join('') + '</div>';
  }

  function _renderQuantity(q, container) {
    var chip = '<span class="ns-chip"><span class="zh">数量感知</span><span class="en">Quantity</span></span>';
    var flashHtml, promptHtml;
    if (q.mode === 'estimate') {
      flashHtml = '<div class="ns-flash-zone">' + _dotsHtml(q.dots) + '</div>';
      promptHtml = '<div class="ns-q"><span class="zh">刚才大概有多少个？</span><span class="en">About how many were there?</span></div>';
    } else {
      flashHtml = '<div class="ns-flash-zone ns-flash-pair">' +
        '<div class="ns-dot-group">' + _dotsHtml(q.leftDots) + '</div>' +
        '<div class="ns-dot-group">' + _dotsHtml(q.rightDots) + '</div>' +
        '</div>';
      promptHtml = '<div class="ns-q"><span class="zh">哪边更多？</span><span class="en">Which side had more?</span></div>';
    }
    container.innerHTML = '<div class="ns-wrap">' + chip + flashHtml + promptHtml + '</div>';

    var zone = container.querySelector('.ns-flash-zone');
    if (zone && q.flashMs) {
      setTimeout(function () {
        if (zone && zone.parentNode) zone.classList.add('ns-flash-hidden');
      }, q.flashMs);
    }
  }

  function _renderPartWhole(q, container) {
    var chip = '<span class="ns-chip"><span class="zh">部分与整体</span><span class="en">Part-Whole</span></span>';
    var body;
    if (q.mode === 'find_pair') {
      body = '<div class="ns-expr">' + q.whole + '</div>' +
        '<div class="ns-sub"><span class="zh">哪一对加起来正好是整体？</span><span class="en">Which pair adds up to the whole?</span></div>';
    } else {
      body = '<div class="ns-expr">' + q.whole + ' = ' + q.partA + ' + __</div>' +
        '<div class="ns-sub"><span class="zh">另一份是多少？</span><span class="en">What is the other part?</span></div>';
    }
    container.innerHTML = '<div class="ns-wrap">' + chip + body + '</div>';
  }

  function _renderComposition(q, container) {
    var chip = '<span class="ns-chip"><span class="zh">组合拆分</span><span class="en">Composition</span></span>';
    var body;
    if (q.mode === 'count_ways') {
      body = '<div class="ns-expr">' + q.number + '</div>' +
        '<div class="ns-sub"><span class="zh">拆成两份，一共有几种拆法？</span><span class="en">Split into two parts — how many different ways?</span></div>';
    } else {
      body = '<div class="ns-expr">' + q.number + '</div>' +
        '<div class="ns-sub"><span class="zh">哪一对不等于它？</span><span class="en">Which pair does not add up to it?</span></div>';
    }
    container.innerHTML = '<div class="ns-wrap">' + chip + body + '</div>';
  }

  shell.createGame({
    id: 'learning-math-number-sense',
    theme: { primary: '#d97706', primary2: '#f59e0b', bg: '#fffbeb' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: {
        music: { enabled: true, defaultOn: false },
        sound: { enabled: true, defaultOn: true }
      },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '不用心算，凭感觑判断数量的多少、整体和部分的关系，以及一个数可以怎样拆开。',
        contentEn: 'Judge quantity, whole-part relations, and the ways a number splits by feel — not by calculating.'
      }
    },
    title: { zh: '🔢 数感', en: '🔢 Number Sense' },
    subtitle: { zh: '数量感知 · 部分整体 · 组合拆分', en: 'Quantity · Part-Whole · Composition' },
    passScore: 6,
    units: buildUnits(NS_DATA.units),

    renderSequence: function (q, container) {
      if (q.type === 'quantity') return _renderQuantity(q, container);
      if (q.type === 'part_whole') return _renderPartWhole(q, container);
      return _renderComposition(q, container);
    },

    renderOption: function (opt, q) {
      if (q.type === 'quantity' && q.mode === 'compare') {
        var isLeft = opt === 'left';
        return '<div class="ns-opt"><div class="ns-opt-val">' +
          '<span class="zh">' + (isLeft ? '左边' : '右边') + '</span>' +
          '<span class="en">' + (isLeft ? 'Left' : 'Right') + '</span>' +
          '</div></div>';
      }
      if (Array.isArray(opt)) {
        return '<div class="ns-opt"><div class="ns-pair">' + opt[0] + ' + ' + opt[1] + '</div></div>';
      }
      return '<div class="ns-opt"><div class="ns-opt-val">' + String(opt) + '</div></div>';
    },

    checkAnswer: function (selected, q) {
      return q.options.indexOf(selected) === q.answer;
    },

    getVoiceText: function (q) {
      var zh = shell.lang === 'zh';
      if (q.type === 'quantity') {
        if (q.mode === 'estimate') return zh ? '刚才大概有多少个？' : 'About how many were there?';
        return zh ? '哪边更多？' : 'Which side had more?';
      }
      if (q.type === 'part_whole') {
        if (q.mode === 'find_pair') return zh ? (q.whole + ' 可以由哪一对组成？') : ('Which pair makes ' + q.whole + '?');
        return zh ? '另一份是多少？' : 'What is the other part?';
      }
      if (q.mode === 'count_ways') return zh ? ('把 ' + q.number + ' 拆成两份，有几种拆法？') : ('Split ' + q.number + ' into two parts — how many ways?');
      return zh ? ('哪一对加起来不等于 ' + q.number + '？') : ('Which pair does not add up to ' + q.number + '?');
    },

    registerRootGenes: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      return genesFor(unit);
    },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var levelId = String(unit.id || 'L1');
      var type = _dominantType(unit) || 'quantity';
      return buildRadarContext(levelId, type, {});
    }
  });
}());
