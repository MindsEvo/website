'use strict';

/**
 * Number Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/number-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/number-pattern.json
 * RootGene:  RG.PATTERN.SEQUENCE.BASIC
 */
(function () {

  var MODULE_ID      = 'number-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'number-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.SEQUENCE.BASIC'];

  // Mirrors number-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { step_type: 'count-on',   number_range: 'ten',
            blank_position: 'end', option_count: 'three' },
      K2: { step_type: 'count-both', number_range: 'twenty',
            blank_position: 'any', option_count: 'four' },
      G1: { step_type: 'skip-count', number_range: 'hundred',
            blank_position: 'any', option_count: 'four' },
      G2: { step_type: 'any-step',   number_range: 'hundred',
            blank_position: 'any', option_count: 'four' }
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
      var meta = NPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: NPH_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.NPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = NPH_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#667eea', primary2: '#764ba2' },
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
        contentZh: '先看相邻两个数差了多少、是变大还是变小，再判断问号位置。',
        contentEn: 'Check how far apart neighbouring numbers are and whether they go up or down, then infer the missing value.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-number-pattern-intro-001'
      }
    },
    title:     { zh: '🎯 找规律',              en: '🎯 Pattern Hunter' },
    subtitle:  { zh: '循序渐进，掌握数字规律', en: 'Master number patterns step by step' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = q.seq.map(function (n) {
        return n === '?' ? '<span class="mystery">?</span>' : '<span>' + n + '</span>';
      }).join(' ');
    },

    renderOption: function (opt) { return String(opt); },

    checkAnswer: function (selected, q) { return Number(selected) === q.answer; },

    getVoiceText: function (q) {
      var items = q.seq.map(function (n) {
        return n === '?' ? (shell.lang === 'zh' ? '问号' : 'blank') : String(n);
      });
      return shell.lang === 'zh'
        ? items.join('，') + '，问号是几？'
        : items.join(', ') + '. What is the blank?';
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, {
        steps:           _unique(questions.map(function (q) { return q.step; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      });
    }
  });
}());
