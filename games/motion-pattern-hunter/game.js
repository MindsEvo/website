'use strict';

/**
 * Motion Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/difference-scout/game.js. LEVEL_GRADE, GENES, SESSION_SIZE
 * and the `base` table in difficultyAxisFor() are cross-checked against
 * metadata/mindseeds/motion-pattern.json by metadata/validate.html (S2 / S3) —
 * keep them literal `var X = {` declarations, the validator reads this as text.
 *
 * Metadata:  /metadata/mindseeds/motion-pattern.json
 * RootGene:  RG.PATTERN.MOTION.SEQUENCE
 */
(function () {

  var MODULE_ID      = 'motion-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'motion-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.MOTION.SEQUENCE'];

  // Mirrors motion-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { motion_channel: 'direction', change_rule: 'alternate',
            option_count: 'three' },
      K2: { motion_channel: 'action',    change_rule: 'three-beat',
            option_count: 'four' },
      G1: { motion_channel: 'position',  change_rule: 'fixed-step',
            option_count: 'four' },
      G2: { motion_channel: 'position',  change_rule: 'growing-step',
            option_count: 'four' }
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
      var meta = MPH_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: MPH_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.MPH_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = MPH_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  // ── Presentation ───────────────────────────────────────────────────────────

  function dirCard(dir) {
    return '<span class="s1-motion-card">' + (MPH_DATA.dirs[dir] || dir) + '</span>';
  }

  function actCard(act) {
    var a = MPH_DATA.acts[act] || { zh: act, en: act, e: '▪' };
    return '<span class="s1-motion-card">' + a.e +
      '<small><span class="zh">' + a.zh + '</span><span class="en">' + a.en + '</span></small>' +
      '</span>';
  }

  function renderTrack(q, container) {
    container.parentElement.classList.add('s1-seq--track');
    var positions = q.positions;
    var lastPos   = positions[positions.length - 1];
    var stepNums  = ['①', '②', '③', '④', '⑤', '⑥'];
    var html = '<div class="s1-track">';
    for (var i = 1; i <= q.trackSize; i++) {
      var posIdx = positions.indexOf(i);
      var isStep = posIdx !== -1;
      var style  = isStep ? ' style="animation-delay:' + (posIdx * 0.38) + 's"' : '';
      var cls = 's1-track-cell';
      if (i === lastPos) { cls += ' s1-track-cur s1-track-reveal'; }
      else if (isStep)   { cls += ' s1-track-vis s1-track-reveal'; }
      html += '<div class="s1-track-cell-wrap"><div class="' + cls + '"' + style + '>' + i + '</div>';
      if (isStep) {
        var delay = ' style="animation-delay:' + (posIdx * 0.38 + 0.2) + 's"';
        html += '<div class="s1-track-badge"' + style + '>' + (stepNums[posIdx] || (posIdx + 1)) + '</div>';
        html += posIdx < positions.length - 1
          ? '<div class="s1-track-arrow"' + delay + '>→</div>'
          : '<div class="s1-track-arrow"' + delay + '>→<span class="mystery s1-track-q">?</span></div>';
      }
      html += '</div>';
    }
    container.innerHTML = html + '</div>';
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:         { primary: '#0ea5e9', primary2: '#7c3aed', bg: '#f0f9ff' },
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
        contentZh: '先找出方向或动作的重复规律，或者看每一跳跳了几格，再预测下一步。',
        contentEn: 'Find the repeating directions or actions, or how many cells each hop covers, then predict the next move.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-motion-pattern-intro-001'
      }
    },
    title:     { zh: '🏃 动作规律',              en: '🏃 Motion Pattern' },
    subtitle:  { zh: '看懂动作的节奏，预测下一步', en: 'Read the rhythm, predict the next move' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      if (q.layout === 'track') { renderTrack(q, container); return; }
      container.parentElement.classList.remove('s1-seq--track');
      container.innerHTML = q.cells.map(function (cell) {
        if (cell === '?') { return '<span class="mystery">?</span>'; }
        return q.layout === 'direction' ? dirCard(cell) : actCard(cell);
      }).join(' ');
    },

    renderOption: function (opt, q) {
      if (q.layout === 'track')     { return '<span class="s1-pos-badge">' + opt + '</span>'; }
      if (q.layout === 'direction') { return dirCard(opt); }
      return actCard(opt);
    },

    checkAnswer: function (selected, q) {
      return q.layout === 'track' ? Number(selected) === Number(q.answer) : selected === q.answer;
    },

    getVoiceText: function (q, idx) {
      if (q.layout === 'track') {
        return shell.lang === 'zh'
          ? '第' + (idx + 1) + '题，下一步跳到哪个格子？'
          : 'Question ' + (idx + 1) + ', which cell comes next?';
      }
      return shell.lang === 'zh'
        ? '第' + (idx + 1) + '题，下一个是什么？'
        : 'Question ' + (idx + 1) + ', what comes next?';
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
