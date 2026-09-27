'use strict';

/**
 * What's Next — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/energy-planner/game.js. K1-K2 show 2-3 rule cards
 * (action -> effect) and ask what a given action leads to (forward_predict).
 * G1 flips the question: given a wanted effect, which action causes it
 * (goal_directed). G2 chains two rule cards so the action's effect becomes
 * the next rule's trigger, asking for the final result (two_hop).
 *
 * q.options holds full node objects, not strings — checkAnswer compares by
 * reference, since shell.js passes the exact q.options entry into checkAnswer.
 *
 * Metadata:  /metadata/mindseeds/whats-next.json
 * RootGene:  RG.STRATEGY.PREDICT.CONSEQUENCE
 */
(function () {

  var MODULE_ID      = 'whats-next';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'whats-next';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.STRATEGY.PREDICT.CONSEQUENCE'];

  // Mirrors whats-next.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { rule_count: 'two',   direction: 'forward_predict', chain_depth: 'one_hop' },
      K2: { rule_count: 'three', direction: 'forward_predict', chain_depth: 'one_hop' },
      G1: { rule_count: 'three', direction: 'goal_directed',   chain_depth: 'one_hop' },
      G2: { rule_count: 'three', direction: 'forward_predict', chain_depth: 'two_hop' }
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
      var meta = WN_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: WN_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.WN_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = WN_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  (function injectWhatsNextStyles() {
    if (document.getElementById('wn-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'wn-shell-style';
    s.textContent = [
      '.wn-scene{display:flex;flex-direction:column;align-items:center;gap:14px;}',
      '.wn-rules{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}',
      '.wn-rule{display:flex;align-items:center;gap:6px;background:#fff;',
        'border:2px solid #e2e8f0;border-radius:12px;padding:8px 12px;font-size:26px;line-height:1;}',
      '.wn-rule-arrow{font-size:16px;color:#94a3b8;}',
      '.wn-question{display:flex;align-items:center;gap:10px;justify-content:center;',
        'flex-wrap:wrap;font-size:15px;font-weight:700;color:#334155;}',
      '.wn-question-icon{font-size:30px;line-height:1;}',
      '.wn-option{font-size:30px;line-height:1;}'
    ].join('');
    document.head.appendChild(s);
  }());

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#0ea5e9', primary2: '#0369a1' },
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
        contentZh: '每张规则卡是"做了什么 → 发生了什么"。先看清所有规则卡，再回答问题：低年级预测按下会怎样，G1 反过来找该按哪个，G2 要顺着规则推两步。',
        contentEn: 'Each rule card shows "action -> effect". Read every rule card first, then answer: younger grades predict the effect, G1 works backwards to find the action, G2 follows two rules to the final result.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-whats-next-intro-001'
      }
    },
    title:     { zh: '🔗 下一步会怎样',         en: '🔗 What\'s Next' },
    subtitle:  { zh: '看懂规则，想清楚结果',     en: 'Read the rules, think it through' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var promptIcon = q.promptNode.icon;
      var promptLabel;
      if (q.direction === 'goal_directed') {
        promptLabel = shell.lang === 'zh'
          ? '你想要这件事发生，该按哪一个？'
          : 'You want this to happen — which one do you press?';
      } else if (q.chainDepth === 'two_hop') {
        promptLabel = shell.lang === 'zh'
          ? '按下它，最终会发生什么？'
          : 'Press it — what happens in the end?';
      } else {
        promptLabel = shell.lang === 'zh'
          ? '按下它，会发生什么？'
          : 'Press it — what happens?';
      }
      container.innerHTML =
        '<div class="wn-scene">' +
          '<div class="wn-rules">' +
            q.rules.map(function (r) {
              return '<div class="wn-rule">' +
                '<span>' + r.action.icon + '</span>' +
                '<span class="wn-rule-arrow">→</span>' +
                '<span>' + r.effect.icon + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
          '<div class="wn-question">' +
            '<span class="wn-question-icon">' + promptIcon + '</span>' +
            '<span>' + promptLabel + '</span>' +
          '</div>' +
        '</div>';
    },

    renderOption: function (opt) {
      return '<span class="wn-option">' + opt.icon + '</span>';
    },

    checkAnswer: function (selected, q) { return selected === q.answer; },

    getVoiceText: function (q) {
      if (q.direction === 'goal_directed') {
        return shell.lang === 'zh' ? '你想要这件事发生，该按哪一个？' : 'You want this to happen. Which one do you press?';
      }
      if (q.chainDepth === 'two_hop') {
        return shell.lang === 'zh' ? '按下它，最终会发生什么？' : 'Press it. What happens in the end?';
      }
      return shell.lang === 'zh' ? '按下它，会发生什么？' : 'Press it. What happens?';
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
