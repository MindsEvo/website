'use strict';

/**
 * Size Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/size-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/size-pattern.json
 * RootGene:  RG.PATTERN.VISUAL.SIZE
 */
(function () {

  var MODULE_ID      = 'size-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'size-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.VISUAL.SIZE'];

  // Mirrors size-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { change_rule: 'alternate', size_contrast: 'coarse',
            blank_position: 'end', option_count: 'three' },
      K2: { change_rule: 'monotonic', size_contrast: 'fine',
            blank_position: 'end', option_count: 'four' },
      G1: { change_rule: 'monotonic', size_contrast: 'fine',
            blank_position: 'any', option_count: 'four' },
      G2: { change_rule: 'cycle',     size_contrast: 'fine',
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
      var meta = SPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: SPH_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.SPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = SPH_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  (function ensureSizeStyles() {
    if (document.getElementById('sp-style')) { return; }
    var css = '' +
      '.sp-seq{display:flex;align-items:flex-end;justify-content:center;gap:10px;min-height:100px;padding-bottom:4px;flex-wrap:wrap;}' +
      '.sp-item{display:inline-flex;align-items:flex-end;justify-content:center;min-height:80px;min-width:56px;}' +
      '.sp-dot{display:inline-block;border-radius:50%;background:#f59e0b;border:2px solid rgba(120,53,15,.35);}' +
      '.sp-s1{width:16px;height:16px;}' +
      '.sp-s2{width:28px;height:28px;}' +
      '.sp-s3{width:40px;height:40px;}' +
      '.sp-s4{width:54px;height:54px;}' +
      '.sp-s5{width:70px;height:70px;}' +
      '.sp-mystery{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;width:44px;height:44px;border:2px dashed #cbd5e1;color:#64748b;background:#f8fafc;font-size:26px;font-weight:900;line-height:1;}' +
      '.s1-opt{background:#ffffff !important;}' +
      '.s1-opt.s1-correct,.s1-opt.s1-wrong{background:#ffffff !important;color:inherit !important;}' +
      '.s1-opt.s1-correct{border-color:#22c55e !important;}' +
      '.s1-opt.s1-wrong{border-color:#ef4444 !important;}' +
      '@media (max-width:520px){' +
        '.sp-seq{gap:6px;min-height:84px;}' +
        '.sp-item{min-height:64px;min-width:40px;}' +
        '.sp-s1{width:12px;height:12px;}' +
        '.sp-s2{width:21px;height:21px;}' +
        '.sp-s3{width:30px;height:30px;}' +
        '.sp-s4{width:40px;height:40px;}' +
        '.sp-s5{width:52px;height:52px;}' +
        '.sp-mystery{width:34px;height:34px;font-size:20px;}' +
      '}';
    var el = document.createElement('style');
    el.id = 'sp-style';
    el.textContent = css;
    document.head.appendChild(el);
  }());

  function sizeToken(level) {
    return '<span class="sp-item"><span class="sp-dot sp-' + level + '"></span></span>';
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme: { primary: '#f59e0b', primary2: '#ea580c', bg: '#fff7ed' },
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
        contentZh: '观察大小是交替、逐渐变大/变小，还是像波浪一样循环，再判断问号处的大小。',
        contentEn: 'Check whether sizes alternate, grow or shrink step by step, or repeat like a wave, then infer the missing size.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-size-pattern-intro-001'
      }
    },
    title:     { zh: '📏 大小规律', en: '📏 Size Pattern' },
    subtitle:  { zh: '看懂大小变化，预测下一步', en: 'Read size changes and predict the next step' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.innerHTML = '<div class="sp-seq">' + q.sequence.map(function (item) {
        return item === '?'
          ? '<span class="sp-item"><span class="sp-mystery">?</span></span>'
          : sizeToken(item);
      }).join('') + '</div>';
    },

    renderOption: function (opt) { return sizeToken(opt); },

    checkAnswer: function (selected, q) { return String(selected) === String(q.answer); },

    getVoiceText: function (q, idx) {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，问号的位置应该是多大？'
        : 'Question ' + (idx + 1) + ', what size goes in the gap?';
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
