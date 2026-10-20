'use strict';

/**
 * Visual Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/visual-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/visual-pattern.json
 * RootGene:  RG.PATTERN.VISUAL.SEQUENCE
 */
(function () {

  var MODULE_ID      = 'visual-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'visual-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.VISUAL.SEQUENCE'];

  // Mirrors visual-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { change_type: 'shape',    unit_length: 'two',
            blank_position: 'end', option_count: 'three' },
      K2: { change_type: 'shape',    unit_length: 'three',
            blank_position: 'end', option_count: 'four' },
      G1: { change_type: 'rotation', unit_length: 'four',
            blank_position: 'end', option_count: 'four' },
      G2: { change_type: 'rotation', unit_length: 'eight',
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
      var meta = VPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: PatternBoard.decorate(VPH_GEN.generate(g, SESSION_SIZE), PB_AD)
      };
    });
  }


  var PB_AD = {
    resolve: function (q) {
      return q.change === 'rotation'
        ? { kind: 'num', mod: 360, stepUnit: function () { return VPH_DATA.gradeConfig[q.gradeCode].step; } }
        : { kind: 'sym' };
    },
    full: function (q) { return q.sequence.map(function (t, i) { return i === q.blankIndex ? q.answer : t; }); },
    blank: function (q) { return q.blankIndex; }, answer: function (q) { return q.answer; }, options: function (q) { return q.options; },
    render: function (t, s, q) { return figure(t, q, s); },
    noun: function (q) { return q.change === 'rotation' ? { zh: '箭头', en: 'arrows' } : { zh: '图形', en: 'shapes' }; }
  };
  var PB_HOOKS = PatternBoard.hooks();

  var UNITS = buildUnits();

  window.VPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = PatternBoard.decorate(VPH_GEN.generate(unitId, SESSION_SIZE), PB_AD); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  // All shapes are drawn in a fixed 40×40 viewBox and scaled by width/height.
  function svgShape(type, size, rotation) {
    var color = '#06b6d4', stroke = 'stroke="#334155" stroke-width="2"';
    var body;
    switch (type) {
      case 'circle':   body = '<circle cx="20" cy="20" r="17" fill="' + color + '" ' + stroke + '/>'; break;
      case 'square':   body = '<rect x="4" y="4" width="32" height="32" fill="' + color + '" ' + stroke + '/>'; break;
      case 'triangle': body = '<polygon points="20,4 36,36 4,36" fill="' + color + '" ' + stroke + '/>'; break;
      case 'star':     body = '<polygon points="20,2 26,14 39,16 29,26 32,39 20,32 8,39 11,26 1,16 14,14" fill="' + color + '" ' + stroke + '/>'; break;
      case 'diamond':  body = '<polygon points="20,2 38,20 20,38 2,20" fill="' + color + '" ' + stroke + '/>'; break;
      default:         body = '<polygon points="20,3 30,16 24,16 24,37 16,37 16,16 10,16" fill="' + color + '" ' + stroke + '/>';
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" style="display:inline-block;vertical-align:middle;transform:rotate(' + (rotation || 0) + 'deg)">' + body + '</svg>';
  }

  function figure(item, q, size) {
    return q.change === 'rotation' ? svgShape('arrow', size, item) : svgShape(item, size, 0);
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#06b6d4', primary2: '#0891b2', bg: '#f0f9ff' },
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
        contentZh: '先找出重复的形状，或箭头每次转多少、往哪边转，再判断问号位置的图形。',
        contentEn: 'Find the repeating shapes, or how far and which way the arrow turns each time, then infer the missing figure.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-visual-pattern-intro-001'
      }
    },
    title:     { zh: '🎨 视觉规律',       en: '🎨 Visual Pattern Hunter' },
    subtitle:  { zh: '观察图形，发现规律', en: 'Observe shapes and find patterns' },
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
        shapes:          _unique(questions.map(function (q) { return q.shape; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      }));
    }
  });
}());
