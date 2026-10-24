'use strict';

/**
 * Flash Cards — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/number-pattern-hunter/game.js. Cards flash in #s1-seqin for
 * q.exposureMs, then hide; the options row (#s1-opts) is kept invisible and
 * unclickable for that same window so the child cannot just visually match the
 * shown cards against the buttons — they must recall after the cards are gone.
 *
 * Metadata:  /metadata/mindseeds/flash-cards.json
 * RootGene:  RG.MEMORY.VISUAL.RECOGNITION
 */
(function () {

  var MODULE_ID      = 'flash-cards';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'flash-cards';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.MEMORY.VISUAL.RECOGNITION'];

  // Mirrors flash-cards.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { item_count: 'two',   exposure_ms: 'long',   option_similarity: 'low' },
      K2: { item_count: 'three', exposure_ms: 'medium', option_similarity: 'low' },
      G1: { item_count: 'four',  exposure_ms: 'short',  option_similarity: 'mixed' },
      G2: { item_count: 'five',  exposure_ms: 'shortest', option_similarity: 'high' }
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
      var meta = FC_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: FC_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.FC_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = FC_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  (function injectFlashCardsStyles() {
    if (document.getElementById('fc-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'fc-shell-style';
    s.textContent = [
      '.fc-scene{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;}',
      '.fc-card{font-size:44px;line-height:1;width:72px;height:72px;display:flex;align-items:center;justify-content:center;',
        'background:#fff;border:2px solid #fde68a;border-radius:14px;box-shadow:0 2px 6px rgba(0,0,0,0.08);}',
      '.fc-card.fc-back{font-size:30px;color:#94a3b8;background:#f8fafc;border-color:#e2e8f0;}',
      '.fc-opt{font-size:30px;line-height:1;}'
    ].join('');
    document.head.appendChild(s);
  }());

  var flashTimer = null;

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#f6a04d', primary2: '#e8552b' },
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
        contentZh: '卡片闪过后会藏起来，仔细看，记住它们，再从选项里找出你看到的那张。',
        contentEn: 'The cards flash then hide — look closely, remember them, then pick the one you saw.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-flash-cards-intro-001'
      }
    },
    title:     { zh: '🃏 闪现卡片',        en: '🃏 Flash Cards' },
    subtitle:  { zh: '看一眼，记住它',      en: 'Look once, remember it' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
      var optsEl = document.getElementById('s1-opts');
      container.innerHTML = '<div class="fc-scene">' +
        q.shown.map(function (e) { return '<div class="fc-card">' + e + '</div>'; }).join('') +
        '</div>';
      if (optsEl) { optsEl.style.visibility = 'hidden'; optsEl.style.pointerEvents = 'none'; }
      flashTimer = setTimeout(function () {
        container.innerHTML = '<div class="fc-scene fc-hidden">' +
          q.shown.map(function () { return '<div class="fc-card fc-back">❓</div>'; }).join('') +
          '</div>';
        if (optsEl) { optsEl.style.visibility = ''; optsEl.style.pointerEvents = ''; }
        flashTimer = null;
      }, q.exposureMs);
    },

    renderOption: function (opt) { return '<span class="fc-opt">' + opt + '</span>'; },

    checkAnswer: function (selected, q) { return String(selected) === String(q.answer); },

    onAnswer: function (selected, q, correct) {
      if (!q.result) { q.result = { tries: 0, tier: null }; }
      q.result.tries++;
      if (correct) {
        q.result.tier = q.result.tries === 1 ? 'best' : q.result.tries === 2 ? 'good' : 'valid';
      }
    },

    getVoiceText: function (q) {
      return shell.lang === 'zh'
        ? '记住刚才看到的卡片，等它们藏起来后，找出你看到的那一张。'
        : 'Remember the cards you just saw, then find the one you saw once they hide.';
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      var played = questions.filter(function (q) { return q.result && q.result.tier; });
      var extra = {
        categories: _unique(questions.map(function (q) { return q.category; })),
        cognitiveChain: ['observation', 'retention', 'retrieval'],
        carrier: ['visual'],
        taskMechanisms: ['recognition'],
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
