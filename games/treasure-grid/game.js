'use strict';

/**
 * Treasure Grid — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/flash-cards/game.js. Cell numbers stay visible the whole
 * time; only the treasure marker flashes for q.exposureMs, then hides. The
 * options row (#s1-opts) stays invisible/unclickable through the exposure AND
 * the extra q.delayMs pause, so answering always requires holding the cell
 * number in mind rather than reading it off a still-visible marker.
 *
 * Metadata:  /metadata/mindseeds/treasure-grid.json
 * RootGene:  RG.MEMORY.SPATIAL.BASIC
 */
(function () {

  var MODULE_ID      = 'treasure-grid';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'treasure-grid';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.MEMORY.SPATIAL.BASIC'];

  // Mirrors treasure-grid.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { grid_size: 'two_by_two',   treasure_count: 'one', delay_ms: 'short' },
      K2: { grid_size: 'two_by_two',   treasure_count: 'one', delay_ms: 'medium' },
      G1: { grid_size: 'three_by_three', treasure_count: 'one', delay_ms: 'long' },
      G2: { grid_size: 'three_by_three', treasure_count: 'two', delay_ms: 'longest' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(function (v, i, a) { return v !== undefined && a.indexOf(v) === i; });
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
      var meta = TG_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: TG_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.TG_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = TG_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  (function injectTreasureGridStyles() {
    if (document.getElementById('tg-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'tg-shell-style';
    s.textContent = [
      '.tg-grid{display:grid;gap:8px;justify-content:center;}',
      '.tg-cell{position:relative;width:64px;height:64px;background:#fff;border:2px solid #bae6fd;border-radius:12px;',
        'display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,0.06);}',
      '.tg-num{position:absolute;top:2px;left:5px;font-size:11px;font-weight:800;color:#64748b;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function renderGrid(q, showTreasure) {
    var html = '<div class="tg-grid" style="grid-template-columns:repeat(' + q.gridSize + ',1fr);">';
    for (var n = 1; n <= q.total; n++) {
      var isTreasure = showTreasure && q.treasurePositions.indexOf(n) >= 0;
      html += '<div class="tg-cell"><span class="tg-num">' + n + '</span>' +
        (isTreasure ? TG_DATA.treasureIcon : '') + '</div>';
    }
    return html + '</div>';
  }

  var exposeTimer = null;
  var delayTimer  = null;

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#2dd4bf', primary2: '#0e7490' },
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
        contentZh: '宝藏会短暂出现在一格里，记住那一格的编号，藏起来后再从选项里选出编号。',
        contentEn: 'A treasure briefly appears in one cell — remember its number, then pick that number once it hides.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-treasure-grid-intro-001'
      }
    },
    title:     { zh: '🗺️ 宝藏格',          en: '🗺️ Treasure Grid' },
    subtitle:  { zh: '记住位置，找到宝藏',   en: 'Remember the spot, find the treasure' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      if (exposeTimer) { clearTimeout(exposeTimer); exposeTimer = null; }
      if (delayTimer)  { clearTimeout(delayTimer);  delayTimer = null; }
      var optsEl = document.getElementById('s1-opts');
      container.innerHTML = renderGrid(q, true);
      if (optsEl) { optsEl.style.visibility = 'hidden'; optsEl.style.pointerEvents = 'none'; }
      exposeTimer = setTimeout(function () {
        container.innerHTML = renderGrid(q, false);
        exposeTimer = null;
        delayTimer = setTimeout(function () {
          if (optsEl) { optsEl.style.visibility = ''; optsEl.style.pointerEvents = ''; }
          delayTimer = null;
        }, q.delayMs);
      }, q.exposureMs);
    },

    renderOption: function (opt) { return '<span class="tg-opt">' + opt + '</span>'; },

    checkAnswer: function (selected, q) {
      var answers = q.answers || [q.answer];
      return answers.indexOf(Number(selected)) >= 0;
    },

    onAnswer: function (selected, q, correct) {
      if (!q.result) { q.result = { tries: 0, tier: null }; }
      q.result.tries++;
      if (correct) {
        q.result.tier = q.result.tries === 1 ? 'best' : q.result.tries === 2 ? 'good' : 'valid';
      }
    },

    getVoiceText: function (q) {
      return shell.lang === 'zh'
        ? '记住宝藏藏在哪一格，等一等再选出它的编号。'
        : 'Remember which cell hid the treasure, then wait and pick its number.';
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      var played = questions.filter(function (q) { return q.result && q.result.tier; });
      var extra = {
        gridSizes: _unique(questions.map(function (q) { return q.gridSize; })),
        cognitiveChain: ['observation', 'retention', 'retrieval'],
        carrier: ['spatial'],
        taskMechanisms: ['location_recall'],
        workingMemory: false,
        geneIds: GENES.slice(),
        activityRuntime: 'puzzle'
      };
      if (played.length) {
        var tiers = { best: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers,
          optimalCount: tiers.best,
          retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
          hints: 0
        };
      }
      return buildRadarContext(unit.id, extra);
    }
  });
}());
