'use strict';

/**
 * Energy Planner — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Each question is a small plan the child builds by tapping tasks, then submits
 * and sees the outcome (energy left, stars earned) before deciding to rethink.
 * Finishing passes; an optimal first try earns best, retries are recorded.
 * The hidden confirm button is clicked by the board once the child accepts a plan
 * (same hook as learning/math/strategy). Nothing about the answer is printed.
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
      K1: { task_count: 'three', budget_tightness: 'loose',    goal_type: 'fit_only' },
      K2: { task_count: 'four',  budget_tightness: 'medium',   goal_type: 'fit_only' },
      G1: { task_count: 'four',  budget_tightness: 'tight',    goal_type: 'maximize_reward' },
      G2: { task_count: 'five',  budget_tightness: 'tightest', goal_type: 'maximize_reward' }
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
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.ep-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.ep-goal{font-size:16px;font-weight:900;color:#92400e;line-height:1.45;max-width:340px;background:#fff;border-radius:12px;padding:8px 12px;}',
      '.ep-budget{font-size:20px;font-weight:900;color:#92400e;background:#fff;border:2px solid #f59e0b;border-radius:12px;padding:6px 16px;}',
      '.ep-budget.over{color:#b91c1c;background:#fee2e2;border-color:#f87171;}',
      '.ep-tasks{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}',
      '.ep-task{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;font-family:inherit;cursor:pointer;touch-action:manipulation;',
        'background:#fff;border:3px solid #e2e8f0;border-radius:14px;padding:8px 10px;min-width:72px;}',
      '.ep-task.on{background:#dbeafe;border-color:#3b82f6;}',
      '.ep-task-icon{font-size:30px;line-height:1.1;}',
      '.ep-task-name{font-size:12px;font-weight:800;color:#475569;}',
      '.ep-task-cost{font-size:14px;font-weight:900;color:#b45309;}',
      '.ep-task-reward{font-size:14px;font-weight:900;color:#0e7490;}',
      '.ep-must{position:absolute;top:-9px;right:-6px;background:#dc2626;color:#fff;font-size:11px;font-weight:900;border-radius:999px;padding:1px 7px;}',
      '.ep-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.ep-btn{border:none;background:#f59e0b;color:#fff;font-size:15px;font-weight:900;padding:8px 20px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.ep-btn.alt{background:#64748b;}',
      '.ep-btn.hint{background:#0ea5e9;}',
      '.ep-msg{min-height:44px;max-width:340px;font-size:14px;font-weight:800;color:#78350f;line-height:1.5;}',
      '.ep-opt{font-size:20px;font-weight:900;}',
      '.bolt{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M13.5 1 4 13.5h6.2L8.8 23 20 9.6h-6.6z\' fill=\'%23dc2626\' stroke=\'%23991b1b\' stroke-width=\'1\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") center/contain no-repeat;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bolt(s) { return String(s).replace(/⚡/g, '<span class="bolt"></span>'); }
  function bi(zh, en) { return '<span class="zh">' + bolt(zh) + '</span><span class="en">' + bolt(en) + '</span>'; }
  function say(host, zh, en) {
    var n = host.querySelector('.ep-msg'); if (n) { n.innerHTML = bi(zh, en); }
  }

  // ── The planning board ────────────────────────────────────────────────────
  function playBoard(q, host) {
    var maxi = q.goalType === 'maximize_reward';
    var picked = {}, tries = 0, hints = 0, done = false, shown = false;

    function totals() {
      var c = 0, v = 0, n = 0;
      q.tasks.forEach(function (t, i) { if (picked[i]) { c += t.cost; v += maxi ? t.reward : 1; n++; } });
      return { cost: c, value: v, count: n };
    }
    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, zh: zh, en: en };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 900);
    }

    function draw(keepMsg) {
      var t = totals(), over = t.cost > q.budget, left = q.budget - t.cost;
      var msgHtml = keepMsg ? host.querySelector('.ep-msg').innerHTML : '';
      host.innerHTML =
        '<div class="ep-budget' + (over ? ' over' : '') + '">' + EP_DATA.energyIcon + ' ' + bi('剩 ', 'Left ') + left + bi(' / 共 ', ' of ') + q.budget +
          (maxi ? '　' + EP_DATA.rewardIcon + ' ' + t.value : '') + '</div>' +
        '<div class="ep-tasks">' + q.tasks.map(function (k, i) {
          return '<button class="ep-task' + (picked[i] ? ' on' : '') + '" data-i="' + i + '">' +
            (k.must ? '<span class="ep-must">' + bi('必做', 'Must') + '</span>' : '') +
            '<span class="ep-task-icon">' + k.icon + '</span>' +
            '<span class="ep-task-name">' + bi(k.nameZh, k.nameEn) + '</span>' +
            '<span class="ep-task-cost">' + EP_DATA.energyIcon + k.cost + '</span>' +
            (maxi ? '<span class="ep-task-reward">' + EP_DATA.rewardIcon + k.reward + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="ep-acts"><button class="ep-btn" id="ep-go">' + bi('✔ 就这样做', '✔ Go with this') + '</button>' +
          '<button class="ep-btn hint" id="ep-hint">' + bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="ep-msg">' + msgHtml + '</div>';
      host.querySelectorAll('.ep-task').forEach(function (b) {
        b.addEventListener('click', function () {
          if (done) { return; }
          var i = +b.getAttribute('data-i'); picked[i] = !picked[i]; shown = false; draw();
        });
      });
      host.querySelector('#ep-hint').addEventListener('click', hint);
      host.querySelector('#ep-go').addEventListener('click', submit);
      applyLang(host);
    }

    function hint() {
      if (done) { return; }
      hints++;
      var i = Math.min(hints, 3) - 1;
      say(host, q.hintZh[i], q.hintEn[i]); applyLang(host);
    }

    function submit() {
      if (done) { return; }
      var t = totals();
      if (!t.count) { say(host, '先点几件事放进计划里。', 'Tap some tasks into your plan first.'); return applyLang(host); }
      var mustMissing = q.tasks.some(function (k, i) { return k.must && !picked[i]; });
      if (mustMissing) { tries++; say(host, '⚠ 有一件事是必做的（红色「必做」），计划里要有它。', '⚠ One task is a must-do (the red tag). Your plan needs it.'); return applyLang(host); }
      if (t.cost > q.budget) { tries++; say(host, '⚡ 能量不够啦：要 ' + t.cost + '，只有 ' + q.budget + '。想想拿掉哪一件。', '⚡ Not enough energy: needs ' + t.cost + ', only ' + q.budget + '. Which one could you drop?'); return applyLang(host); }
      var left = q.budget - t.cost;
      if (t.value >= q.best) {
        tries++;
        say(host, '🎉 计划成功！剩下 ' + left + ' 点能量' + (maxi ? '，得到 ' + t.value + ' 颗星' : '，做了 ' + t.count + ' 件事') + '。', '🎉 It works! ' + left + ' energy left' + (maxi ? ', ' + t.value + ' stars earned' : ', ' + t.count + ' tasks done') + '.');
        applyLang(host);
        var first = tries === 1;
        return finish(first && hints === 0 ? 'best' : first ? 'better' : 'good',
          (first && hints === 0 ? '⭐ ' : '') + (maxi ? t.value + ' 颗星' : t.count + ' 件事') + (first ? '，一次就想好了' : '，重新想了 ' + (tries - 1) + ' 次'),
          (first && hints === 0 ? '⭐ ' : '') + (maxi ? t.value + ' stars' : t.count + ' tasks') + (first ? ', planned in one go' : ', rethought ' + (tries - 1) + ' time(s)'));
      }
      tries++;
      shown = true;
      var zh = '计划可行：剩 ' + left + ' 点能量' + (maxi ? '，得到 ' + t.value + ' 颗星' : '，做了 ' + t.count + ' 件事') + '。还能更好吗？再想一次，或者就这样。';
      var en = 'It works: ' + left + ' energy left' + (maxi ? ', ' + t.value + ' stars' : ', ' + t.count + ' tasks') + '. Could it be better? Rethink, or keep it.';
      draw(false); say(host, zh, en);
      var acts = host.querySelector('.ep-acts');
      var keep = document.createElement('button');
      keep.className = 'ep-btn alt'; keep.innerHTML = bi('就这样了', 'Keep it');
      keep.addEventListener('click', function () {
        if (done) { return; }
        finish('valid', (maxi ? t.value + ' 颗星' : t.count + ' 件事') + '，还有更好的方案', (maxi ? t.value + ' stars' : t.count + ' tasks') + ' — a better plan existed');
      });
      acts.appendChild(keep); applyLang(host);
    }

    draw();
  }

  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }

  function goalText(q) {
    return q.goalType === 'maximize_reward'
      ? { zh: '能量只有 ' + q.budget + ' 点（⚡）。点选想做的事放进计划，每件事花能量、换星星（⭐）。怎样得到的星星最多？',
          en: 'You have only ' + q.budget + ' energy (⚡). Tap the tasks for your plan; each costs energy and earns stars (⭐). How do you earn the most stars?' }
      : { zh: '能量只有 ' + q.budget + ' 点（⚡）。点选想做的事放进计划，每件事要花能量。' + (q.tasks.some(function (t) { return t.must; }) ? '有一件事「必做」，其余的尽量多做几件。' : '尽量多做几件事。'),
          en: 'You have only ' + q.budget + ' energy (⚡). Tap the tasks for your plan; each one costs energy. ' + (q.tasks.some(function (t) { return t.must; }) ? 'One task is a must-do; fit in as many others as you can.' : 'Do as many tasks as you can.') };
  }

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
    title:     { zh: '🔋 能量分配',           en: '🔋 Energy Planner' },
    subtitle:  { zh: '算一算，选出最好的方案', en: 'Do the math, pick the best plan' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var t = goalText(q);
      container.innerHTML = '<div class="ep-scene"><div class="ep-goal">' + bi(t.zh, t.en) + '</div><div id="ep-host" class="ep-scene"></div></div>';
      q.result = null;
      playBoard(q, container.querySelector('#ep-host'));
      applyLang(container);
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="ep-opt">✔</span>'; },

    checkAnswer: function (selected, q) { return !!q.result; },

    onAnswer: function (selected, q, correct) {
      if (!correct || !q.result) { return; }
      setTimeout(function () {
        var fb = document.getElementById('s1-fb'); if (!fb) { return; }
        fb.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>';
        applyLang(fb);
      }, 0);
    },

    getVoiceText: function (q) {
      var t = goalText(q);
      return (shell.lang === 'zh' ? t.zh : t.en).replace(/（[^）]*）/g, '').replace(/ \([^)]*\)/g, '');
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {};
      var questions = unit.questions || [];
      var played = questions.filter(function (q) { return q.result; });
      var extra = {
        goalTypes:       _unique(questions.map(function (q) { return q.goalType; })),
        geneIds:         GENES.slice(),
        activityRuntime: 'puzzle'
      };
      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers, optimalCount: tiers.best,
          retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
          hints: played.reduce(function (n, q) { return n + q.result.hints; }, 0)
        };
      }
      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
