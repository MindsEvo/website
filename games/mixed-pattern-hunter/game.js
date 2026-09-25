'use strict';

/**
 * Mixed Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/mixed-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/mixed-pattern.json
 * RootGene:  RG.PATTERN.INTEGRATION.MULTI_DIMENSION
 */
(function () {

  var MODULE_ID      = 'mixed-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'mixed-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.INTEGRATION.MULTI_DIMENSION'];

  // Mirrors mixed-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 5;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { changing_dimensions: 'one', rule_relation: 'single',
            blank_position: 'end' },
      K2: { changing_dimensions: 'two', rule_relation: 'synced',
            blank_position: 'end' },
      G1: { changing_dimensions: 'two', rule_relation: 'independent',
            blank_position: 'end' },
      G2: { changing_dimensions: 'two', rule_relation: 'offset-period',
            blank_position: 'any' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(Boolean).filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
  }

  function buildRadarContext(gradeCode, extra) {
    var ctx = {
      moduleId:       MODULE_ID,
      moduleType:     MODULE_TYPE,
      levelId:        gradeCode,
      gradeCode:      LEVEL_GRADE[gradeCode] || null,
      difficultyAxis: difficultyAxisFor(gradeCode),
      sourceGameId:   SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function buildUnits() {
    return GRADE_ORDER.map(function (g) {
      var meta = MXP_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: MXP_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.MXP_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = MXP_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  var COLORS = { red: '#ef4444', blue: '#3b82f6', yellow: '#eab308', green: '#22c55e', purple: '#a855f7', orange: '#f97316' };
  var ARROWS = { left: '←', right: '→', up: '↑', down: '↓' };
  var DOT_PX = { s1: 14, s2: 22, s3: 32, s4: 44, s5: 58 };
  var ARROW_PX = { s1: 18, s2: 26, s3: 36, s4: 48, s5: 62 };

  (function ensureMxStyles() {
    if (document.getElementById('mx-style')) { return; }
    var css = '' +
      '.mx-card{display:inline-flex;align-items:center;justify-content:center;flex-wrap:wrap;min-width:52px;min-height:56px;max-width:84px;gap:3px;padding:3px;vertical-align:middle;}' +
      '.mx-arrow{font-weight:900;line-height:1;font-style:normal;}' +
      '.mx-reveal{background:#fdf4ff;border:1.5px solid #e9d5ff;border-radius:12px;padding:10px 14px;margin-bottom:8px;width:100%;box-sizing:border-box;text-align:left;}' +
      '.mx-reveal-title{font-size:12px;font-weight:900;color:#7e22ce;margin-bottom:5px;letter-spacing:.4px;text-transform:uppercase;}' +
      '.mx-reveal-dim{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#374151;margin:3px 0;}' +
      '.mx-check{color:#16a34a;font-size:15px;flex-shrink:0;}' +
      '.mx-thinking{margin-top:12px;background:#fffbeb;border:1.5px solid #fcd34d;border-radius:12px;padding:14px 18px;}' +
      '.mx-thinking-title{font-size:13px;font-weight:900;color:#92400e;margin-bottom:10px;text-align:center;letter-spacing:.5px;}' +
      '.mx-bar-row{display:flex;align-items:center;gap:8px;margin:6px 0;}' +
      '.mx-bar-label{min-width:80px;font-size:13px;font-weight:700;color:#78350f;}' +
      '.mx-bar-track{flex:1;height:10px;background:#fef3c7;border-radius:6px;overflow:hidden;}' +
      '.mx-bar-fill{height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:6px;transition:width .6s ease;}' +
      '.mx-bar-pct{min-width:36px;font-size:13px;font-weight:800;color:#92400e;text-align:right;}' +
      '@media (max-width:520px){.mx-card{min-width:40px;min-height:44px;max-width:64px;}}';
    var el = document.createElement('style');
    el.id = 'mx-style';
    el.textContent = css;
    document.head.appendChild(el);
  }());

  // One renderer for every pair: absent dimensions fall back to a neutral default.
  function renderCard(d) {
    if (d === '?') { return '<span class="mystery">?</span>'; }
    var hex = COLORS[d.color] || '#f59e0b';
    var count = d.quantity || 1;
    var small = count > 1;
    var one;
    if (d.direction) {
      var px = d.size ? ARROW_PX[d.size] : (small ? 22 : 34);
      one = '<span class="mx-arrow" style="font-size:' + px + 'px;color:' + (d.color ? hex : '#7c3aed') + ';">' + ARROWS[d.direction] + '</span>';
    } else {
      var dp = d.size ? DOT_PX[d.size] : (small ? 16 : 34);
      one = '<span class="s1-cdot" style="background:' + hex + ';width:' + dp + 'px;height:' + dp + 'px;flex-shrink:0;"></span>';
    }
    var inner = '';
    for (var i = 0; i < count; i++) { inner += one; }
    return '<span class="mx-card">' + inner + '</span>';
  }

  // First-attempt results for the current run. Kept apart from unit.questions,
  // which refillUnit() replaces before the result screen is drawn.
  var _run = { qs: [], res: [], finished: false };

  function track(selected, q) {
    if (_run.qs.indexOf(q) >= 0) { return; }
    var ot = q.optionTypes[selected];
    _run.qs.push(q);
    _run.res.push({
      dim1: ot === 'both_correct' || ot === 'dim2_wrong',
      dim2: ot === 'both_correct' || ot === 'dim1_wrong',
      integration: ot === 'both_correct'
    });
  }

  function scores() {
    var obsOk = 0, intOk = 0, n = _run.res.length;
    _run.res.forEach(function (t) {
      obsOk += (t.dim1 ? 1 : 0) + (t.dim2 ? 1 : 0);
      intOk += t.integration ? 1 : 0;
    });
    return {
      obs: n ? Math.round(obsOk / (2 * n) * 100) : 0,
      int: n ? Math.round(intOk / n * 100) : 0
    };
  }

  function bar(label, pct) {
    return '<div class="mx-bar-row"><span class="mx-bar-label">' + label + '</span>' +
      '<div class="mx-bar-track"><div class="mx-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="mx-bar-pct">' + pct + '%</span></div>';
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#ec4899', primary2: '#be185d', bg: '#fdf2f8' },
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
        contentZh: '每张卡片有两样东西在变（颜色、大小、数量、方向中的两样）。分别找出每一样的规律，再选出两样都对的那张。',
        contentEn: 'Each card has two things that can change (two of color, size, quantity, direction). Find each one\'s rule separately, then pick the card where both are right.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-mixed-pattern-intro-001'
      }
    },
    title:     { zh: '🎯 综合规律',     en: '🎯 Mixed Pattern' },
    subtitle:  { zh: '同时看懂两种规律', en: 'Two Patterns, One Mind' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      if (_run.finished) { _run = { qs: [], res: [], finished: false }; }
      container.innerHTML = q.cells.map(renderCard).join(' ');
    },

    renderOption: function (opt, q) { return renderCard(q.optionDefs[opt]); },

    checkAnswer: function (selected, q) { return selected === q.answer; },

    onAnswer: function (selected, q) { track(selected, q); },

    onCorrect: function (q, actsEl) {
      var zh = shell.lang === 'zh';
      var reveal = document.createElement('div');
      reveal.className = 'mx-reveal';
      reveal.innerHTML =
        '<div class="mx-reveal-title"><span class="zh">🔍 发现的规律</span><span class="en">🔍 Patterns Detected</span></div>' +
        '<div class="mx-reveal-dim"><span class="mx-check">✓</span><span>' + (zh ? q.dim1Name.zh : q.dim1Name.en) +
          ' — <em>' + (zh ? q.dim1Rule.zh : q.dim1Rule.en) + '</em></span></div>' +
        '<div class="mx-reveal-dim"><span class="mx-check">✓</span><span>' + (zh ? q.dim2Name.zh : q.dim2Name.en) +
          ' — <em>' + (zh ? q.dim2Rule.zh : q.dim2Rule.en) + '</em></span></div>';
      actsEl.appendChild(reveal);
    },

    onResult: function (stats, rmsgEl) {
      // The shell redraws the result screen (e.g. on language switch), so replace, never append.
      var old = rmsgEl.parentNode.querySelector('.mx-thinking');
      if (old) { old.parentNode.removeChild(old); }
      var s = scores();
      var zh = shell.lang === 'zh';
      var card = document.createElement('div');
      card.className = 'mx-thinking';
      card.innerHTML = '<div class="mx-thinking-title">' + (zh ? '🧠 思维评分' : '🧠 Thinking Score') + '</div>' +
        bar(zh ? '观察力' : 'Observation', s.obs) + bar(zh ? '综合力' : 'Integration', s.int);
      rmsgEl.insertAdjacentElement('afterend', card);
      _run.finished = true;
    },

    getVoiceText: function (q, idx) {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，' + q.dim1Name.zh + '和' + q.dim2Name.zh + '各有什么规律？'
        : 'Question ' + (idx + 1) + '. What is the rule for ' + q.dim1Name.en.toLowerCase() + ' and for ' + q.dim2Name.en.toLowerCase() + '?';
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, {
        dimensionPairs:  _unique(questions.map(function (q) { return q.dimKey; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      });
    }
  });
}());
