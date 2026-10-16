'use strict';

/**
 * Rule Change — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * The walker has a plan (the best branch from the junction). Walking to the junction
 * announces a change (a branch is blocked, gets harder or easier, energy drops). The
 * child decides: keep the plan or change it. About half of the questions need no
 * change at all. Nothing is marked wrong; walking shows the result and the child may
 * choose again. Finishing passes; right first with no hints earns a star; retries,
 * hints and keep/change decisions go into the report.
 * The hidden confirm button is clicked by the board once the child accepts the result
 * (same hook as energy-planner / route-choice).
 *
 * Metadata:  /metadata/mindseeds/rule-change.json
 * RootGene:  RG.STRATEGY.DECISION.PLANNING
 */
(function () {

  var MODULE_ID      = 'rule-change';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'rule-change';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.STRATEGY.DECISION.PLANNING'];

  // Mirrors rule-change.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  var UNIT_META = {
    K1: { icon: '🚧', nameZh: 'K1 · 路被堵了', nameEn: 'K1 · The Road Is Blocked', descZh: '走到路口，看看原来的路还能不能走。', descEn: 'At the junction, see if the old road still works.' },
    K2: { icon: '🔄', nameZh: 'K2 · 要不要换', nameEn: 'K2 · Change or Keep', descZh: '路变难走或变好走，原计划还最省力吗？', descEn: 'A road gets harder or easier — is the plan still the easiest?' },
    G1: { icon: '⚡', nameZh: 'G1 · 能量少了', nameEn: 'G1 · Less Energy', descZh: '能量突然少了，还拿得到那么多星星吗？', descEn: 'Energy drops suddenly — can you still earn those stars?' },
    G2: { icon: '🌀', nameZh: 'G2 · 两件事一起变', nameEn: 'G2 · Two Changes', descZh: '两件事同时变了，重新想一想最好的路。', descEn: 'Two things change at once — think again about the best road.' }
  };

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { change_count: 'one', change_type: 'block',      goal_type: 'least_energy', plan_status: 'mixed' },
      K2: { change_count: 'one', change_type: 'cost_shift', goal_type: 'least_energy', plan_status: 'mixed' },
      G1: { change_count: 'one', change_type: 'energy_cut', goal_type: 'most_stars',   plan_status: 'mixed' },
      G2: { change_count: 'two', change_type: 'combined',   goal_type: 'most_stars',   plan_status: 'mixed' }
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
        descZh: m.descZh, descEn: m.descEn, questions: RC2_GEN.generate(g, SESSION_SIZE) };
    });
  }

  var UNITS = buildUnits();

  window.RC2_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) { if (u.id === unitId) { u.questions = RC2_GEN.generate(unitId, SESSION_SIZE); } });
    }, 0);
  }

  var COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#be185d'];
  var BOLT = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M13.5 1 4 13.5h6.2L8.8 23 20 9.6h-6.6z' fill='%23dc2626' stroke='%23991b1b' stroke-width='1' stroke-linejoin='round'/%3E%3C/svg%3E\")";

  (function injectStyles() {
    if (document.getElementById('rc2-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'rc2-shell-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.bolt{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;background:' + BOLT + ' center/contain no-repeat;}',
      '.rc2-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.rc2-goal{font-size:15px;font-weight:900;color:#075985;line-height:1.45;max-width:340px;background:#fff;border-radius:12px;padding:8px 12px;}',
      '.rc2-map{background:#fff;border:2px solid #bae6fd;border-radius:14px;max-width:100%;height:auto;}',
      '.rc2-bar{font-size:18px;font-weight:900;color:#075985;background:#fff;border:3px solid #38bdf8;border-radius:12px;padding:4px 16px;}',
      '.rc2-bar.cut{color:#b91c1c;border-color:#ef4444;background:#fee2e2;}',
      '.rc2-news{font-size:16px;font-weight:900;color:#7f1d1d;background:#fff;border:3px solid #ef4444;border-radius:12px;padding:8px 12px;max-width:340px;line-height:1.5;}',
      '.rc2-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:340px;}',
      '.rc2-chip{font-size:14px;font-weight:900;color:#1e293b;background:#fff;border:3px solid #cbd5e1;border-radius:12px;padding:4px 10px;}',
      '.rc2-chip.plan{border-style:dashed;}',
      '.rc2-chip.dead{opacity:.55;text-decoration:line-through;}',
      '.rc2-chip s{color:#94a3b8;font-weight:700;}',
      '.rc2-chip em{font-style:normal;color:#b91c1c;}',
      '.rc2-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.rc2-btn{border:none;color:#fff;font-size:15px;font-weight:900;padding:8px 18px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.rc2-btn.go{background:#0284c7;}',
      '.rc2-btn.hint{background:#0ea5e9;}',
      '.rc2-btn.alt{background:#64748b;}',
      '.rc2-msg{min-height:40px;max-width:340px;font-size:14px;font-weight:800;color:#0c4a6e;line-height:1.5;}',
      '.rc2-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bolt(s) { return String(s).replace(/⚡/g, '<span class="bolt"></span>'); }
  function bi(zh, en) { return '<span class="zh">' + bolt(zh) + '</span><span class="en">' + bolt(en) + '</span>'; }
  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }
  function L(i) { return 'ABCD'.charAt(i); }

  function goalText(q) {
    var th = q.theme, stars = q.goal === 'most_stars';
    var zh = th[1] + '（' + th[0] + '）要走到' + th[4] + '（' + th[3] + '）那里，先走到路口，再选一条路。每条路的数字是要花的能量（⚡）' + (stars ? '，⭐是能得到的星星' : '') + '。' +
      (q.energy !== null ? '一共有 ' + q.energy + ' 点能量。' : '') + (stars ? '目标：得到的星星最多。' : '目标：最省力。') + '到了路口，看看有没有变化。',
      en = th[2] + ' (' + th[0] + ') wants to reach ' + th[5] + ' (' + th[3] + '): first to the junction, then pick a road. The number on each road is its energy cost (⚡)' + (stars ? ', and ⭐ is the stars it earns' : '') + '. ' +
      (q.energy !== null ? 'You have ' + q.energy + ' energy. ' : '') + (stars ? 'Goal: earn the most stars. ' : 'Goal: the easiest road. ') + 'At the junction, check for changes.';
    return { zh: zh, en: en };
  }

  function newsText(q, st) {
    var zh = [], en = [];
    q.events.forEach(function (e) {
      var b = q.branches[e.i];
      if (e.t === 'block') { zh.push('📢 ' + L(e.i) + ' 路被路障（🚧）堵住了，过不去！'); en.push('📢 Road ' + L(e.i) + ' is blocked by a barrier (🚧) — no way through!'); }
      else if (e.t === 'up') { zh.push('📢 ' + L(e.i) + ' 路变难走了：能量 ' + b.c + ' → ' + (b.c + e.k) + '。'); en.push('📢 Road ' + L(e.i) + ' got harder: energy ' + b.c + ' → ' + (b.c + e.k) + '.'); }
      else if (e.t === 'down') { var nc = Math.max(1, b.c - e.k); zh.push('📢 ' + L(e.i) + ' 路变好走了：能量 ' + b.c + ' → ' + nc + '。'); en.push('📢 Road ' + L(e.i) + ' got easier: energy ' + b.c + ' → ' + nc + '.'); }
      else { zh.push('📢 走累了，能量少了 ' + e.k + ' 点：' + q.energy + ' → ' + st.energy + '。'); en.push('📢 Getting tired - ' + e.k + ' less energy: ' + q.energy + ' → ' + st.energy + '.'); }
    });
    return { zh: zh.join('<br>'), en: en.join('<br>') };
  }

  // ── The map ───────────────────────────────────────────────────────────────
  function T(x, y, size, body, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" dominant-baseline="central" ' + (extra || '') + '>' + body + '</text>';
  }
  function mapSvg(q, st, mode) {
    var n = q.branches.length, W = 320, H = 230, mx = 46, gx = 274, cy = 115, th = q.theme;
    var svg = '<svg class="rc2-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">';
    q.branches.forEach(function (b, i) {
      var amp = n === 1 ? 0 : -80 + 160 * i / (n - 1), pts = [], k, dead = mode === 'after' && !st.branches[i].ok;
      for (k = 0; k <= 16; k++) { pts.push((mx + (gx - mx) * k / 16).toFixed(1) + ',' + (cy + amp * Math.sin(Math.PI * k / 16)).toFixed(1)); }
      var isPlan = mode === 'before' && i === q.plan;
      svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + COLORS[i] + '" stroke-width="' + (isPlan ? 7 : 4) + '" stroke-linecap="round" opacity="' + (dead ? '.25' : '.9') + '"' + (isPlan ? '' : '') + '/>';
      var lx = (mx + gx) / 2, ly = cy + amp, blocked = mode === 'after' && st.branches[i].blocked;
      svg += '<circle cx="' + lx + '" cy="' + ly + '" r="14" fill="' + (blocked ? '#fee2e2' : COLORS[i]) + '" stroke="' + (blocked ? '#ef4444' : '#fff') + '" stroke-width="3"/>' +
        (blocked ? T(lx, ly, 18, '🚧') : T(lx, ly, 15, L(i), 'font-weight="900" fill="#fff"'));
    });
    var ring = function (x, y, f, s) { return '<circle cx="' + x + '" cy="' + y + '" r="22" fill="' + f + '" stroke="' + s + '" stroke-width="3"/>'; };
    return svg + ring(gx, cy, '#dcfce7', '#16a34a') + T(gx, cy, 28, th[3]) + ring(mx, cy, '#e0f2fe', '#0284c7') + T(mx, cy, 28, th[0]) + '</svg>';
  }

  function chipsHtml(q, st, mode) {
    var stars = q.goal === 'most_stars';
    return '<div class="rc2-chips">' + q.branches.map(function (b, i) {
      var a = st.branches[i], cost;
      if (mode === 'after' && a.c !== b.c) cost = '<s>' + b.c + '</s> ' + a.c; else cost = '' + b.c;
      var dead = mode === 'after' && a.blocked;
      return '<span class="rc2-chip' + (mode === 'before' && i === q.plan ? ' plan' : '') + (dead ? ' dead' : '') + '" style="border-color:' + COLORS[i] + '">' + L(i) + '　⚡' + (dead ? '<em>✖</em>' : cost) + (stars ? '　⭐' + b.s : '') +
        (mode === 'before' && i === q.plan ? '　' + bi('原计划', 'plan') : '') + '</span>';
    }).join('') + '</div>';
  }

  // ── The board ─────────────────────────────────────────────────────────────
  function playBoard(q, host) {
    var st = RC2_GEN.after(q), tries = 0, hints = 0, done = false, phase = 'before', decisions = { kept: 0, changed: 0 };
    var HINTS = [
      ['先想一想：我想达到什么？', 'First: what do I want to achieve?'],
      ['再想一想：发生了变化，原来的路现在怎么样了？别的路呢？', 'Next: after the change, how is the old road now? And the others?'],
      ['走走看，结果会告诉你。原来的路没有问题，就不用换。', 'Try it — the result will tell you. If the old road is fine, there is no need to change.']
    ];
    function say(zh, en) { var m = host.querySelector('.rc2-msg'); if (m) { m.innerHTML = bi(zh, en); applyLang(m); } }
    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, zh: zh, en: en, kept: decisions.kept, changed: decisions.changed };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 1100);
    }
    function hintBtn() {
      host.querySelector('#rc2-hint').addEventListener('click', function () { if (done) { return; } hints++; var h = HINTS[Math.min(hints, 3) - 1]; say(h[0], h[1]); });
    }

    function drawBefore() {
      phase = 'before';
      var plan = q.branches[q.plan], stars = q.goal === 'most_stars';
      host.innerHTML = (q.energy !== null ? '<div class="rc2-bar">⚡ ' + q.energy + '</div>' : '') +
        mapSvg(q, st, 'before') + chipsHtml(q, st, 'before') +
        '<div class="rc2-goal" style="font-size:14px">' + bi('原计划：走 ' + L(q.plan) + ' 路，它' + (stars ? '得到的星星最多。' : '最省力。'), 'The plan: take road ' + L(q.plan) + ' - it ' + (stars ? 'earns the most stars.' : 'is the easiest.')) + '</div>' +
        '<div class="rc2-acts"><button class="rc2-btn go" id="rc2-go">' + bi('▶ 走到路口', '▶ Walk to the junction') + '</button></div>';
      host.querySelector('#rc2-go').addEventListener('click', drawAfter);
      applyLang(host);
    }

    function drawAfter(msg) {
      phase = 'after';
      var news = newsText(q, st), cut = q.events.some(function (e) { return e.t === 'cut'; });
      host.innerHTML = (q.energy !== null ? '<div class="rc2-bar' + (cut ? ' cut' : '') + '">⚡ ' + st.energy + (cut ? ' <s style="font-size:13px">' + q.energy + '</s>' : '') + '</div>' : '') +
        '<div class="rc2-news">' + bi(news.zh, news.en) + '</div>' +
        mapSvg(q, st, 'after') + chipsHtml(q, st, 'after') +
        '<div class="rc2-acts">' + q.branches.map(function (b, i) {
          return '<button class="rc2-btn" data-i="' + i + '" style="background:' + COLORS[i] + '">' + bi((i === q.plan ? '照原计划走 ' : '换走 ') + L(i), (i === q.plan ? 'Keep the plan: ' : 'Switch to ') + L(i)) + '</button>';
        }).join('') + '</div>' +
        '<div class="rc2-acts"><button class="rc2-btn hint" id="rc2-hint">' + bi('💡 提示', '💡 Hint') + '</button></div><div class="rc2-msg">' + (typeof msg === 'string' ? msg : '') + '</div>';
      host.querySelectorAll('[data-i]').forEach(function (b) { b.addEventListener('click', function () { walk(+b.getAttribute('data-i')); }); });
      hintBtn(); applyLang(host);
    }

    function walk(i) {
      if (done) { return; }
      tries++;
      if (i === q.plan) { decisions.kept++; } else { decisions.changed++; }
      var a = st.branches[i], zhI = L(i) + ' 路';
      if (a.blocked) { return say('🚧 ' + zhI + '被堵住了，过不去。回到路口，再选一条。', '🚧 Road ' + L(i) + ' is blocked. Back to the junction — choose again.'); }
      if (st.energy !== null && a.c > st.energy) { return say('⚡ 走 ' + zhI + '要 ' + a.c + ' 点能量，只剩 ' + st.energy + ' 点，走不到。再选一条。', '⚡ Road ' + L(i) + ' needs ' + a.c + ' energy but only ' + st.energy + ' is left. Choose again.'); }
      var stars = q.goal === 'most_stars', first = tries === 1;
      var info = '走 ' + zhI + '，用了 ' + a.c + ' 点能量' + (stars ? '，得到 ' + a.s + ' 颗星' : ''), infoEn = 'road ' + L(i) + ', used ' + a.c + ' energy' + (stars ? ', earned ' + a.s + ' stars' : '');
      if (i === q.best) {
        var why = q.keep ? { zh: '变化没有影响原计划，坚持是对的。', en: 'The change did not touch the plan - keeping it was right.' } : { zh: '原计划行不通了，换路是对的。', en: 'The plan no longer worked - changing was right.' };
        say('🎉 到达！' + info + '。' + why.zh, '🎉 Arrived! ' + infoEn + '. ' + why.en);
        return finish(first && hints === 0 ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid',
          (first && hints === 0 ? '⭐ ' : '') + (q.keep ? '坚持原计划' : '及时换路') + (first ? '，一次就对了' : '，试了 ' + tries + ' 次'),
          (first && hints === 0 ? '⭐ ' : '') + (q.keep ? 'Kept the plan' : 'Changed in time') + (first ? ', right on the first try' : ', took ' + tries + ' tries'));
      }
      say('到达了：' + info + '。有没有更好的选择？回到路口再选，或者就这样。', 'Arrived: ' + infoEn + '. Is there a better choice? Go back and choose again, or keep this.');
      var acts = host.querySelectorAll('.rc2-acts')[1], keep = document.createElement('button');
      keep.className = 'rc2-btn alt'; keep.innerHTML = bi('就这样了', 'Keep it');
      keep.addEventListener('click', function () { if (!done) { finish('valid', info + '，还有更好的选择', infoEn + ' - a better choice existed'); } });
      acts.appendChild(keep); applyLang(acts);
    }
    drawBefore();
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#0ea5e9', primary2: '#0369a1' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: { music: { enabled: true, defaultOn: false }, sound: { enabled: true, defaultOn: true } },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '小动物先有一个原计划。走到路口，会宣布一个变化。想一想：原来的路现在还行吗？行就照原计划走，不行就换。有时候变化跟原计划没关系，不用换。',
        contentEn: 'The animal has a plan first. At the junction a change is announced. Think: is the old road still fine? If so keep the plan, if not switch. Sometimes the change has nothing to do with the plan, and there is no need to switch.'
      },
      video: { enabled: true, videoId: 'mindseeds-rule-change-intro-001' }
    },
    title:     { zh: '🔄 规则变了',          en: '🔄 Rule Change' },
    subtitle:  { zh: '计划好了，情况变了，怎么办？', en: 'The plan was good - then things changed' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var t = goalText(q);
      container.innerHTML = '<div class="rc2-scene"><div class="rc2-goal">' + bi(t.zh, t.en) + '</div><div id="rc2-host" class="rc2-scene"></div></div>';
      q.result = null;
      playBoard(q, container.querySelector('#rc2-host'));
      applyLang(container);
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="rc2-opt">✔</span>'; },

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
      var extra = { goalTypes: _unique(questions.map(function (q) { return q.goal; })), geneIds: GENES.slice(), activityRuntime: 'puzzle' };
      if (played.length) {
        var tiers = { best: 0, better: 0, good: 0, valid: 0 };
        played.forEach(function (q) { tiers[q.result.tier]++; });
        extra.process = {
          tiers: tiers, optimalCount: tiers.best,
          retries: played.reduce(function (n, q) { return n + Math.max(0, q.result.tries - 1); }, 0),
          hints: played.reduce(function (n, q) { return n + q.result.hints; }, 0),
          keptPlan: played.filter(function (q) { return q.keep; }).length,
          changedPlan: played.filter(function (q) { return !q.keep; }).length
        };
      }
      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
