'use strict';

/**
 * Logic Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/logic-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/logic-pattern.json
 * RootGene:  RG.LOGIC.REASONING.BASIC
 */
(function () {

  var MODULE_ID      = 'logic-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'logic-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.LOGIC.REASONING.BASIC'];

  // Mirrors logic-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 5;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { premise_count: 'one',   question_form: 'same-word',
            premise_order: 'chained',  option_count: 'two' },
      K2: { premise_count: 'one',   question_form: 'opposite-word',
            premise_order: 'chained',  option_count: 'two' },
      G1: { premise_count: 'two',   question_form: 'extreme',
            premise_order: 'chained',  option_count: 'three' },
      G2: { premise_count: 'three', question_form: 'rank',
            premise_order: 'shuffled', option_count: 'four' }
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
      var meta = LP_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: LP_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.LP_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = LP_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  (function injectLogicStyles() {
    if (document.getElementById('lph-style')) { return; }
    var s = document.createElement('style');
    s.id = 'lph-style';
    s.textContent = [
      '.lph-wrap{display:grid;gap:10px;text-align:left;width:100%;}',
      '.lph-premise{display:flex;gap:8px;align-items:flex-start;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;}',
      '.lph-num{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#ede9fe;color:#6d28d9;font-size:12px;font-weight:900;flex-shrink:0;margin-top:1px;}',
      '.lph-text{color:#334155;font-size:15px;line-height:1.55;font-weight:700;}',
      '.lph-q{background:#faf5ff;border:1px solid #ddd6fe;border-radius:10px;padding:10px 12px;color:#3b0764;font-size:16px;font-weight:900;line-height:1.5;}',
      '.lph-opt{display:grid;justify-items:center;gap:2px;}',
      '.lph-opt-e{font-size:28px;line-height:1;}',
      '.lph-opt-n{font-size:14px;font-weight:800;}'
    ].join('');
    document.head.appendChild(s);
  }());

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:     { primary: '#7c3aed', primary2: '#6d28d9', bg: '#f5f3ff' },
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
        contentZh: '先读清每一条线索，把小朋友从高到矮（或从快到慢、从大到小）排好队，再回答问题。注意问题问的是哪一头。',
        contentEn: 'Read every clue and line the children up from tallest to shortest (or fastest to slowest, oldest to youngest), then answer. Check which end the question asks about.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-logic-pattern-intro-001'
      }
    },
    title:     { zh: '🧠 逻辑推理', en: '🧠 Logic Pattern' },
    subtitle:  { zh: '读懂条件，推导结论', en: 'Read the clues and find the answer' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var premiseHtml = q.premises.map(function (p, i) {
        return '<div class="lph-premise"><span class="lph-num">' + (i + 1) + '</span>' +
          '<span class="lph-text"><span class="zh">' + p.zh + '</span><span class="en">' + p.en + '</span></span></div>';
      }).join('');
      container.innerHTML = '<div class="lph-wrap">' + premiseHtml +
        '<div class="lph-q"><span class="zh">' + q.questionZh + '</span><span class="en">' + q.questionEn + '</span></div>' +
        '</div>';
    },

    renderOption: function (opt, q) {
      var d = q.optionDefs[opt];
      return '<span class="lph-opt"><span class="lph-opt-e">' + d.e + '</span>' +
        '<span class="lph-opt-n"><span class="zh">' + d.zh + '</span><span class="en">' + d.en + '</span></span></span>';
    },

    checkAnswer: function (selected, q) { return selected === q.answer; },

    // Emoji are dropped from the spoken text; names carry the meaning.
    getVoiceText: function (q) {
      var zh = shell.lang === 'zh';
      var strip = function (t) { return t.replace(/[\u{1F300}-\u{1FAFF}]/gu, ''); };
      var parts = q.premises.map(function (p) { return strip(zh ? p.zh : p.en); });
      return parts.join(zh ? '，' : '. ') + (zh ? '。' : '. ') + (zh ? q.questionZh : q.questionEn);
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, {
        relations:       _unique(questions.map(function (q) { return q.relation; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      });
    }
  });
}());
