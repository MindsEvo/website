'use strict';

/**
 * Temporal Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/temporal-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/temporal-pattern.json
 * RootGene:  RG.PATTERN.TEMPORAL.SEQUENCE
 */
(function () {

  var MODULE_ID      = 'temporal-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'temporal-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.TEMPORAL.SEQUENCE'];

  // Mirrors temporal-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { time_concept: 'event-order', cycle_length: 'none',
            blank_position: 'end', option_count: 'three' },
      K2: { time_concept: 'day-season',  cycle_length: 'four',
            blank_position: 'end', option_count: 'four' },
      G1: { time_concept: 'week',        cycle_length: 'seven',
            blank_position: 'any', option_count: 'four' },
      G2: { time_concept: 'clock',       cycle_length: 'twelve',
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
      var meta = TPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: PatternBoard.decorate(TPH_GEN.generate(g, SESSION_SIZE), PB_AD)
      };
    });
  }


  var PB_AD = {
    resolve: function (q) {
      if (q.layout === 'clock') { return { kind: 'num', mod: 12, num: function (t) { return t % 12; }, tok: function (n) { return n === 0 ? 12 : n; } }; }
      if (TPH_DATA.cycles[q.family]) { return { kind: 'sym', cycle: function (qq) { return TPH_DATA.cycles[qq.family]; } }; }
      return { kind: 'sym' };
    },
    full: function (q) { return q.cells.map(function (t, i) { return i === q.blankIndex ? q.answer : t; }); },
    blank: function (q) { return q.blankIndex; }, answer: function (q) { return q.answer; }, options: function (q) { return q.options; },
    render: function (t, s, q) { return q.layout === 'clock' ? clockCard(t) : card(t); },
    noun: function (q) { return q.layout === 'clock' ? { zh: '钟点', en: 'hours' } : { zh: '事情', en: 'events' }; }
  };
  var PB_HOOKS = PatternBoard.hooks();

  var UNITS = buildUnits();

  window.TPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = PatternBoard.decorate(TPH_GEN.generate(unitId, SESSION_SIZE), PB_AD); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  function card(item) {
    var c = TPH_DATA.cards[item] || { e: '▪', zh: item, en: item };
    return '<span class="s1-motion-card">' + c.e +
      '<small><span class="zh">' + c.zh + '</span><span class="en">' + c.en + '</span></small>' +
      '</span>';
  }

  function clockCard(h) {
    return '<span class="s1-motion-card" style="font-size:22px;font-weight:900">' +
      '<span class="zh">' + h + '点</span><span class="en">' + h + ':00</span></span>';
  }

  function render(cell, q) {
    if (cell === '?') { return '<span class="mystery">?</span>'; }
    return q.layout === 'clock' ? clockCard(cell) : card(cell);
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#8b5cf6', primary2: '#ec4899', bg: '#fdf4ff' },
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
        contentZh: '想一想事情的先后，或者时间是怎样一圈一圈循环的：夜晚之后是早上，周日之后是周一，12 点之后是 1 点。',
        contentEn: 'Think about the order things happen in, or how time goes round: after night comes morning, after Sunday comes Monday, after 12 comes 1.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-temporal-pattern-intro-001'
      }
    },
    title:     { zh: '⏰ 时间规律',              en: '⏰ Temporal Pattern' },
    subtitle:  { zh: '看懂时间的顺序，预测下一刻', en: 'Read time patterns, predict what comes next' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: PB_HOOKS.renderSequence,
    renderOption:   PB_HOOKS.renderOption,
    checkAnswer:    PB_HOOKS.checkAnswer,
    onAnswer:       PB_HOOKS.onAnswer,
    getVoiceText:   PB_HOOKS.getVoiceText,

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, PatternBoard.addProcess(questions, {
        families:        _unique(questions.map(function (q) { return q.family; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      }));
    }
  });
}());
