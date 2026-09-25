'use strict';

/**
 * Color Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/color-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/color-pattern.json
 * RootGene:  RG.PATTERN.VISUAL.COLOR
 */
(function () {

  var MODULE_ID      = 'color-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'color-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.VISUAL.COLOR'];

  // Mirrors color-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { unit_length: 'two',   blank_position: 'end',
            element_type: 'single', option_count: 'three' },
      K2: { unit_length: 'three', blank_position: 'end',
            element_type: 'single', option_count: 'four' },
      G1: { unit_length: 'four',  blank_position: 'any',
            element_type: 'single', option_count: 'four' },
      G2: { unit_length: 'three', blank_position: 'any',
            element_type: 'pair',   option_count: 'four' }
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
      var meta = CPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: CPH_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.CPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = CPH_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  function cDot(color, size) {
    var hex = (CPH_DATA.palette[color] || {}).hex || '#94a3b8';
    return '<span class="s1-cdot" style="background:' + hex + ';width:' + size + 'px;height:' + size + 'px"></span>';
  }

  function cCapsule(pair) {
    return '<span class="s1-ccapsule">' + cDot(pair[0], 30) + cDot(pair[1], 30) + '</span>';
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#f97316', primary2: '#dc2626', bg: '#fff7ed' },
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
        contentZh: '先找出重复的那一段颜色，再判断问号位置应该是什么。越往后重复段越长，空格也可能在中间；G2 要把两个颜色看成一组。',
        contentEn: 'Find the repeating run of colors first, then infer the missing one. Later grades use longer runs and the gap may be in the middle; at G2 two colors form one unit.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-color-pattern-intro-001'
      }
    },
    title:     { zh: '🎨 颜色规律',       en: '🎨 Color Pattern' },
    subtitle:  { zh: '发现颜色变化的规律', en: 'Discover the color pattern' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var mystery = '<span class="mystery">?</span>';
      var size = q.cells.length > 6 ? 40 : 48;
      container.innerHTML = q.cells.map(function (cell) {
        if (cell === null) { return mystery; }
        return q.layout === 'pair' ? cCapsule(cell) : cDot(cell, size);
      }).join(' ');
    },

    renderOption: function (opt) {
      return Array.isArray(opt) ? cCapsule(opt) : cDot(opt, 52);
    },

    checkAnswer: function (selected, q) {
      return CPH_GEN.keyOf(selected) === CPH_GEN.keyOf(q.answer);
    },

    getVoiceText: function (q, idx) {
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，问号的位置是什么颜色？'
        : 'Question ' + (idx + 1) + ', what color goes in the gap?';
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, {
        shapes:          _unique(questions.map(function (q) { return q.shape; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      });
    }
  });
}());
