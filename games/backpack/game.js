'use strict';

/**
 * Backpack — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * The child packs a bag for a trip: one item from each "must bring" group, plus
 * optional extras, under a weight limit. After "Go!" the outcome shows (does it
 * fit, what is left, how many stars); the child may repack. Finishing passes; an
 * optimal first try earns a star; repacks and hints go into the report.
 * The hidden confirm button is clicked by the board once a packing is accepted
 * (same hook as energy-planner / route-choice).
 *
 * Metadata:  /metadata/mindseeds/backpack.json
 * RootGene:  RG.STRATEGY.RESOURCE.TRADEOFF
 */
(function () {

  var MODULE_ID      = 'backpack';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'backpack';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.STRATEGY.RESOURCE.TRADEOFF'];

  // Mirrors backpack.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  var UNIT_META = {
    K1: { icon: '🎒', nameZh: 'K1 · 装得下吗', nameEn: 'K1 · Will It Fit', descZh: '每种必带的选一样，别让背包超重。', descEn: 'Pick one of each must-bring group without overloading the bag.' },
    K2: { icon: '🧺', nameZh: 'K2 · 再带点什么', nameEn: 'K2 · Room for More', descZh: '必带的选轻一点，才能多带几样喜欢的。', descEn: 'Choose lighter must-haves to fit more of what you like.' },
    G1: { icon: '⭐', nameZh: 'G1 · 带哪样最值', nameEn: 'G1 · Best to Bring', descZh: '重量有限，带哪几样得到的星星最多？', descEn: 'The weight is limited — which things earn the most stars?' },
    G2: { icon: '⚖️', nameZh: 'G2 · 轻重取舍', nameEn: 'G2 · Weigh It Up', descZh: '三类必带，最划算的不一定最好。', descEn: 'Three must-bring groups; the best-looking deal is not always the best.' }
  };

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { group_count: 'two',   extras: 'none', goal_type: 'fit_musts' },
      K2: { group_count: 'two',   extras: 'few',  goal_type: 'most_extras' },
      G1: { group_count: 'two',   extras: 'few',  goal_type: 'most_stars' },
      G2: { group_count: 'three', extras: 'many', goal_type: 'most_stars' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(function (v, i, a) { return v !== undefined && a.indexOf(v) === i; });
  }

  function buildRadarContext(gradeCode, extra) {
    var ctx = {
      moduleId: MODULE_ID, moduleType: MODULE_TYPE, levelId: gradeCode,
      gradeCode: LEVEL_GRADE[gradeCode] || null,
      difficultyAxis: difficultyAxisFor(gradeCode), sourceGameId: SOURCE_GAME_ID
    };
    return extra ? Object.assign(ctx, extra) : ctx;
  }

  function buildUnits() {
    return GRADE_ORDER.map(function (g) {
      var m = UNIT_META[g];
      return { id: g, gradeCode: LEVEL_GRADE[g] || null, icon: m.icon, nameZh: m.nameZh, nameEn: m.nameEn,
        descZh: m.descZh, descEn: m.descEn, questions: BP_GEN.generate(g, SESSION_SIZE) };
    });
  }

  var UNITS = buildUnits();

  window.BP_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) { if (u.id === unitId) { u.questions = BP_GEN.generate(unitId, SESSION_SIZE); } });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('bp-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'bp-shell-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.bp-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.bp-goal{font-size:16px;font-weight:900;color:#7c2d12;line-height:1.45;max-width:340px;background:#fff;border-radius:12px;padding:8px 12px;}',
      '.bp-bar{font-size:19px;font-weight:900;color:#1e3a8a;background:#fff;border:3px solid #3b82f6;border-radius:12px;padding:5px 16px;}',
      '.bp-bar.over{color:#b91c1c;border-color:#ef4444;background:#fee2e2;}',
      '.bp-group{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;}',
      '.bp-gname{font-size:13px;font-weight:900;color:#7c2d12;}',
      '.bp-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}',
      '.bp-item{position:relative;display:flex;flex-direction:column;align-items:center;gap:1px;font-family:inherit;cursor:pointer;touch-action:manipulation;',
        'background:#fff;border:3px solid #e2e8f0;border-radius:14px;padding:6px 8px;min-width:74px;}',
      '.bp-item.on{background:#dbeafe;border-color:#2563eb;}',
      '.bp-icon{font-size:30px;line-height:1.1;}',
      '.bp-name{font-size:12px;font-weight:800;color:#475569;}',
      '.bp-w{font-size:14px;font-weight:900;color:#1d4ed8;}',
      '.bp-star{font-size:14px;font-weight:900;color:#92400e;}',
      '.bp-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.bp-btn{border:none;background:#ea580c;color:#fff;font-size:15px;font-weight:900;padding:8px 20px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.bp-btn.alt{background:#64748b;}',
      '.bp-btn.hint{background:#0ea5e9;}',
      '.bp-msg{min-height:44px;max-width:340px;font-size:14px;font-weight:800;color:#7c2d12;line-height:1.5;}',
      '.bp-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }
  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }

  function goalText(q) {
    var t = q.trip, zh = '今天' + t[1] + '（' + t[0] + '）。背包最多装 ' + q.cap + ' 的重量。每一类必带的东西选一样，每样东西下面的数字是它的重量。',
      en = 'Today: ' + t[2] + ' (' + t[0] + '). The bag holds at most ' + q.cap + ' weight. Pick one item from each must-bring group; the number under each item is its weight. ';
    if (q.goalType === 'fit_musts') { zh += '背包不能超重。'; en += 'The bag must not be overweight.'; }
    else if (q.goalType === 'most_extras') { zh += '剩下的重量可以多带几样喜欢的东西，看看最多能带几样。'; en += 'Use the room left to bring as many extras as you can.'; }
    else { zh += '剩下的重量可以带喜欢的东西，每样有星星（⭐）。怎样带的星星最多？'; en += 'Use the room left for extras; each earns stars (⭐). How do you bring the most stars?'; }
    return { zh: zh, en: en };
  }

  // ── The board ─────────────────────────────────────────────────────────────
  function playBoard(q, host) {
    var maxi = q.goalType === 'most_stars', hasExtras = q.extras.length > 0;
    var pickMust = {}, pickExtra = {}, tries = 0, hints = 0, done = false;
    var HINTS = [
      ['先想一想：我想达到什么？', 'First: what do I want to achieve?'],
      ['再想一想：每类必带的哪样最轻？剩下的重量还能带什么？', 'Next: which must-have is the lightest, and what can the room left carry?'],
      ['装一装试试看，结果会告诉你。不满意可以重装。', 'Pack it and see — the result will tell you. Not happy? Repack.']
    ];

    function totals() {
      var w = 0, v = 0, n = 0, all = true;
      q.groups.forEach(function (g, gi) { if (pickMust[gi] === undefined) { all = false; } else { w += g.items[pickMust[gi]].w; } });
      q.extras.forEach(function (e, i) { if (pickExtra[i]) { w += e.w; v += maxi ? e.stars : 1; n++; } });
      return { w: w, v: v, n: n, all: all };
    }
    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, zh: zh, en: en };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 900);
    }
    function say(zh, en) { var m = host.querySelector('.bp-msg'); if (m) { m.innerHTML = bi(zh, en); applyLang(m); } }

    function draw(msgHtml) {
      var t = totals(), over = t.w > q.cap;
      host.innerHTML =
        '<div class="bp-bar' + (over ? ' over' : '') + '">🎒 ' + bi('重量 ', 'Weight ') + t.w + ' / ' + q.cap + (maxi && hasExtras ? '　⭐ ' + t.v : '') + '</div>' +
        q.groups.map(function (g, gi) {
          return '<div class="bp-group"><div class="bp-gname">' + bi('必带 · ' + g.zh + '（选一样）', 'Must bring · ' + g.en + ' (pick one)') + '</div><div class="bp-row">' +
            g.items.map(function (it, ii) {
              return '<button class="bp-item' + (pickMust[gi] === ii ? ' on' : '') + '" data-g="' + gi + '" data-i="' + ii + '"><span class="bp-icon">' + it.icon + '</span><span class="bp-name">' + bi(it.zh, it.en) + '</span><span class="bp-w">⚖ ' + it.w + '</span></button>';
            }).join('') + '</div></div>';
        }).join('') +
        (hasExtras ? '<div class="bp-group"><div class="bp-gname">' + bi('想带的东西（可以多选）', 'Extras you would like (pick any)') + '</div><div class="bp-row">' +
          q.extras.map(function (e, i) {
            return '<button class="bp-item' + (pickExtra[i] ? ' on' : '') + '" data-e="' + i + '"><span class="bp-icon">' + e.icon + '</span><span class="bp-name">' + bi(e.zh, e.en) + '</span><span class="bp-w">⚖ ' + e.w + '</span>' + (maxi ? '<span class="bp-star">⭐ ' + e.stars + '</span>' : '') + '</button>';
          }).join('') + '</div></div>' : '') +
        '<div class="bp-acts"><button class="bp-btn" id="bp-go">' + bi('✔ 出发！', '✔ Go!') + '</button><button class="bp-btn hint" id="bp-hint">' + bi('💡 提示', '💡 Hint') + '</button></div>' +
        '<div class="bp-msg">' + (msgHtml || '') + '</div>';
      host.querySelectorAll('[data-g]').forEach(function (b) {
        b.addEventListener('click', function () { if (done) { return; } pickMust[b.getAttribute('data-g')] = +b.getAttribute('data-i'); draw(); });
      });
      host.querySelectorAll('[data-e]').forEach(function (b) {
        b.addEventListener('click', function () { if (done) { return; } var i = +b.getAttribute('data-e'); pickExtra[i] = !pickExtra[i]; draw(); });
      });
      host.querySelector('#bp-go').addEventListener('click', submit);
      host.querySelector('#bp-hint').addEventListener('click', function () { if (done) { return; } hints++; var h = HINTS[Math.min(hints, 3) - 1]; say(h[0], h[1]); });
      applyLang(host);
    }

    function submit() {
      if (done) { return; }
      var t = totals();
      if (!t.all) { return say('每一类必带的东西，都要选一样。', 'Pick one item from every must-bring group.'); }
      tries++;
      if (t.w > q.cap) { return say('🎒 太重了：' + t.w + '，背包最多 ' + q.cap + '。想想换掉哪一样。', '🎒 Too heavy: ' + t.w + ', the bag holds ' + q.cap + '. What could you swap out?'); }
      var left = q.cap - t.w, first = tries === 1, ok = hasExtras ? t.v >= q.best : true;
      var info = '重量 ' + t.w + '，还剩 ' + left + (hasExtras ? (maxi ? '，得到 ' + t.v + ' 颗星' : '，带了 ' + t.n + ' 样喜欢的') : '');
      var infoEn = 'weight ' + t.w + ', ' + left + ' left' + (hasExtras ? (maxi ? ', ' + t.v + ' stars' : ', ' + t.n + ' extras') : '');
      if (ok) {
        draw(''); say('🎉 装好了！' + info + '。', '🎉 Packed! ' + infoEn + '.');
        return finish(first && hints === 0 ? 'best' : first ? 'better' : 'good',
          (first && hints === 0 ? '⭐ ' : '') + info + (first ? '，一次就装好了' : '，重装了 ' + (tries - 1) + ' 次'),
          (first && hints === 0 ? '⭐ ' : '') + infoEn + (first ? ', packed in one go' : ', repacked ' + (tries - 1) + ' time(s)'));
      }
      draw('');
      say('装得下：' + info + '。还能更好吗？重装一次，或者就这样。', 'It fits: ' + infoEn + '. Could it be better? Repack, or keep it.');
      var keep = document.createElement('button');
      keep.className = 'bp-btn alt'; keep.innerHTML = bi('就这样了', 'Keep it');
      keep.addEventListener('click', function () { if (!done) { finish('valid', info + '，还有更好的装法', infoEn + ' — a better packing existed'); } });
      host.querySelector('.bp-acts').appendChild(keep); applyLang(host);
    }
    draw('');
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#ea580c', primary2: '#9a3412' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: { music: { enabled: true, defaultOn: false }, sound: { enabled: true, defaultOn: true } },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '每类必带的东西选一样，再看剩下的重量还能带什么。装好后点出发，背包会告诉你结果。不满意可以重装。',
        contentEn: 'Pick one item from each must-bring group, then see what the remaining weight can carry. Press Go and the bag tells you the result. Not happy? Repack.'
      },
      video: { enabled: true, videoId: 'mindseeds-backpack-intro-001' }
    },
    title:     { zh: '🎒 背包装什么',          en: '🎒 Backpack' },
    subtitle:  { zh: '装一装，试试看', en: 'Pack it and see' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var t = goalText(q);
      container.innerHTML = '<div class="bp-scene"><div class="bp-goal">' + bi(t.zh, t.en) + '</div><div id="bp-host" class="bp-scene"></div></div>';
      q.result = null;
      playBoard(q, container.querySelector('#bp-host'));
      applyLang(container);
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="bp-opt">✔</span>'; },

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
      var unit = (ctx && ctx.unit) || {}, questions = unit.questions || [];
      var played = questions.filter(function (q) { return q.result; });
      var extra = { goalTypes: _unique(questions.map(function (q) { return q.goalType; })), geneIds: GENES.slice(), activityRuntime: 'puzzle' };
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
