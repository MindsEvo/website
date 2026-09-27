'use strict';

/**
 * Energy Planner — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Modelled on games/treasure-grid/game.js. K1-K2 goal is "stay in budget"
 * (fit_only): only one of 3 candidate plans has cost <= budget. G1-G2 goal
 * is "maximize reward" (maximize_reward): all 3 candidates fit the budget
 * but have distinct reward totals, so the highest is the unique answer.
 *
 * q.options holds full plan objects, not primitives — checkAnswer compares
 * by reference/mask instead of parsing a DOM string, since shell.js passes
 * the exact q.options entry into checkAnswer (see shell.js _answer/_render).
 *
 * Metadata:  /metadata/mindseeds/energy-planner.json
 * RootGene:  RG.STRATEGY.RESOURCE.TRADEOFF
 */
(function () {

  var MODULE_ID      = 'energy-planner';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'energy-planner';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.STRATEGY.RESOURCE.TRADEOFF'];

  // Mirrors energy-planner.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { task_count: 'two',   budget_tightness: 'loose',    goal_type: 'fit_only' },
      K2: { task_count: 'three', budget_tightness: 'medium',   goal_type: 'fit_only' },
      G1: { task_count: 'three', budget_tightness: 'tight',    goal_type: 'maximize_reward' },
      G2: { task_count: 'four',  budget_tightness: 'tightest', goal_type: 'maximize_reward' }
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
      var meta = EP_DATA.units[g] || {};
      return {
        id:        g,
        gradeCode: LEVEL_GRADE[g] || null,
        icon:      meta.icon,
        nameZh:    meta.nameZh, nameEn: meta.nameEn,
        descZh:    meta.descZh, descEn: meta.descEn,
        questions: EP_GEN.generate(g, SESSION_SIZE)
      };
    });
  }

  var UNITS = buildUnits();

  window.EP_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: shell calls onResult before getReportContext in the same pass,
  // so a synchronous refill would make the report describe unseen items.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) {
        if (u.id === unitId) { u.questions = EP_GEN.generate(unitId, SESSION_SIZE); }
      });
    }, 0);
  }

  (function injectEnergyPlannerStyles() {
    if (document.getElementById('ep-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'ep-shell-style';
    s.textContent = [
      '.ep-scene{display:flex;flex-direction:column;align-items:center;gap:12px;}',
      '.ep-budget{font-size:20px;font-weight:800;color:#92400e;background:#fef3c7;',
        'border:2px solid #fcd34d;border-radius:12px;padding:8px 16px;}',
      '.ep-goal{font-size:14px;font-weight:700;color:#64748b;}',
      '.ep-tasks{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}',
      '.ep-task{display:flex;flex-direction:column;align-items:center;gap:2px;',
        'background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:8px 10px;min-width:64px;}',
      '.ep-task-icon{font-size:26px;line-height:1;}',
      '.ep-task-name{font-size:11px;font-weight:700;color:#475569;}',
      '.ep-task-cost{font-size:12px;font-weight:800;color:#b45309;}',
      '.ep-task-reward{font-size:12px;font-weight:800;color:#0e7490;}',
      '.ep-plan{display:flex;align-items:center;gap:8px;justify-content:center;flex-wrap:wrap;}',
      '.ep-plan-items{font-size:22px;line-height:1;}',
      '.ep-plan-cost{font-size:13px;font-weight:800;color:#b45309;}',
      '.ep-plan-reward{font-size:13px;font-weight:800;color:#0e7490;}'
    ].join('');
    document.head.appendChild(s);
  }());

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#f59e0b', primary2: '#b45309' },
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
        contentZh: '每个方案要花掉不同的能量。先看清预算，再选出符合要求的方案：低年级选不超预算的，高年级要在预算内选收益最高的。',
        contentEn: 'Each plan costs a different amount of energy. Check the budget first, then pick the plan that fits: younger grades just need to stay in budget, older grades must find the highest reward within it.'
      },
      video: {
        enabled: true,
        videoId: 'mindseeds-energy-planner-intro-001'
      }
    },
    title:     { zh: '⚡ 能量分配',           en: '⚡ Energy Planner' },
    subtitle:  { zh: '算一算，选出最好的方案', en: 'Do the math, pick the best plan' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var showReward = q.goalType === 'maximize_reward';
      var budgetLabel = shell.lang === 'zh' ? '能量预算' : 'Energy Budget';
      var goalLabel = showReward
        ? (shell.lang === 'zh' ? '选出预算内收益最高的方案' : 'Pick the plan with the highest reward within budget')
        : (shell.lang === 'zh' ? '选出不超预算的方案' : 'Pick the plan that stays within budget');
      container.innerHTML =
        '<div class="ep-scene">' +
          '<div class="ep-budget">' + EP_DATA.energyIcon + ' ' + budgetLabel + ': ' + q.budget + '</div>' +
          '<div class="ep-goal">' + goalLabel + '</div>' +
          '<div class="ep-tasks">' +
            q.tasks.map(function (t) {
              var name = shell.lang === 'zh' ? t.nameZh : t.nameEn;
              return '<div class="ep-task">' +
                '<span class="ep-task-icon">' + t.icon + '</span>' +
                '<span class="ep-task-name">' + name + '</span>' +
                '<span class="ep-task-cost">' + EP_DATA.energyIcon + t.cost + '</span>' +
                (showReward ? '<span class="ep-task-reward">' + EP_DATA.rewardIcon + t.reward + '</span>' : '') +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
    },

    renderOption: function (opt, q) {
      var showReward = q.goalType === 'maximize_reward';
      var icons = opt.items.map(function (t) { return t.icon; }).join(' ');
      return '<div class="ep-plan">' +
        '<span class="ep-plan-items">' + icons + '</span>' +
        '<span class="ep-plan-cost">' + EP_DATA.energyIcon + opt.cost + '</span>' +
        (showReward ? '<span class="ep-plan-reward">' + EP_DATA.rewardIcon + opt.reward + '</span>' : '') +
      '</div>';
    },

    checkAnswer: function (selected, q) { return selected === q.answer; },

    getVoiceText: function (q) {
      return q.goalType === 'maximize_reward'
        ? (shell.lang === 'zh' ? '看看预算，选出收益最高的方案。' : 'Check the budget, then pick the plan with the highest reward.')
        : (shell.lang === 'zh' ? '看看预算，选出没有超支的方案。' : 'Check the budget, then pick the plan that does not go over.');
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      refillUnit(unit.id);
      return buildRadarContext(unit.id, {
        goalTypes:       _unique(questions.map(function (q) { return q.goalType; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      });
    }
  });
}());
