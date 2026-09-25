'use strict';

/**
 * Quantity Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/quantity-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/quantity-pattern.json
 * RootGene:  RG.PATTERN.QUANTITY.RELATION
 */
(function () {

  var MODULE_ID      = 'quantity-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'quantity-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.QUANTITY.RELATION'];

  // Mirrors quantity-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { change_rule: 'alternate', step_size: 'none', count_range: 'small',
            blank_position: 'end', option_count: 'three' },
      K2: { change_rule: 'monotonic', step_size: 'one',  count_range: 'medium',
            blank_position: 'end', option_count: 'four' },
      G1: { change_rule: 'monotonic', step_size: 'two',  count_range: 'large',
            blank_position: 'any', option_count: 'four' },
      G2: { change_rule: 'cycle',     step_size: 'none', count_range: 'medium',
            blank_position: 'any', option_count: 'four' }
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
      var meta = QPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: QPH_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.QPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = QPH_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  (function ensureQuantityStyles() {
    if (document.getElementById('qph-style')) { return; }
    var css = '' +
      // Fixed 3-per-row grid so a count reads as a shape (subitizing), not a line to count.
      '.qph-pack{display:inline-grid;grid-template-columns:repeat(3,auto);align-items:center;justify-items:center;gap:2px;min-height:42px;min-width:60px;padding:4px 6px;border-radius:10px;background:#ffffff;}' +
      '.qph-item{font-size:20px;line-height:1;}' +
      '.qph-row{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;}' +
      '.qph-label{font-size:11px;color:#64748b;font-weight:800;}' +
      '.qph-opt-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;}' +
      '@media (max-width:520px){' +
        '.qph-pack{min-width:50px;min-height:36px;padding:3px 4px;}' +
        '.qph-item{font-size:16px;}' +
        '.qph-row{gap:5px;}' +
      '}';
    var el = document.createElement('style');
    el.id = 'qph-style';
    el.textContent = css;
    document.head.appendChild(el);
  }());

  function renderQuantity(count, assetKey) {
    var asset = QPH_DATA.assets[assetKey] || QPH_DATA.assets.apple;
    var html = '<span class="qph-pack">';
    for (var i = 0; i < count; i++) { html += '<span class="qph-item">' + asset.e + '</span>'; }
    return html + '</span>';
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme: { primary: '#16a34a', primary2: '#15803d', bg: '#f0fdf4' },
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
        contentZh: '先比较每一格比前一格多了还是少了、多少了多少，或者是不是在循环，再判断问号处。',
        contentEn: 'Compare each group with the one before — more or fewer, and by how much — or spot a repeating cycle, then infer the missing group.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-quantity-pattern-intro-001'
      }
    },
    title:     { zh: '🧮 数量规律', en: '🧮 Quantity Pattern' },
    subtitle:  { zh: '看懂数量的变化，预测下一步', en: 'Read quantity relationships and predict the next step' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div class="qph-row">' + q.sequence.map(function (item) {
        return item === '?' ? '<span class="mystery">?</span>' : renderQuantity(item, q.asset);
      }).join('') + '</div>';
    },

    renderOption: function (count, q) {
      var asset = QPH_DATA.assets[q.asset] || QPH_DATA.assets.apple;
      return '<span class="qph-opt-wrap">' + renderQuantity(count, q.asset) +
        '<span class="qph-label"><span class="zh">' + asset.zh + '</span><span class="en">' + asset.en + '</span></span></span>';
    },

    checkAnswer: function (selected, q) { return Number(selected) === Number(q.answer); },

    getVoiceText: function (q, idx) {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，问号处应该有多少个？'
        : 'Question ' + (idx + 1) + ', how many go in the gap?';
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, {
        directions:      _unique(questions.map(function (q) { return q.direction; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      });
    }
  });
}());
