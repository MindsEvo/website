'use strict';

/**
 * Route Choice — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * The child picks one of several routes, then watches the walker go: blocked
 * stones stop it, puddles cost extra energy, fog hides a block until it is hit.
 * Nothing is judged before the walk; the outcome is the feedback, and the child
 * may choose again. Finishing passes; best on the first try earns a star.
 * The hidden confirm button is clicked by the board when a route is accepted
 * (same hook as energy-planner / learning/math/strategy).
 *
 * Metadata:  /metadata/mindseeds/route-choice.json
 * RootGene:  RG.STRATEGY.DECISION.PLANNING
 */
(function () {

  var MODULE_ID      = 'route-choice';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'route-choice';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.STRATEGY.DECISION.PLANNING'];

  // Mirrors route-choice.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 8;

  var UNIT_META = {
    K1: { icon: '🛣️', nameZh: 'K1 · 近路还是远路', nameEn: 'K1 · Near or Far', descZh: '近路有障碍，远路更安全，走走看。', descEn: 'The near road has an obstacle, the far one is safe — try it.' },
    K2: { icon: '🧭', nameZh: 'K2 · 省力的路', nameEn: 'K2 · The Easy Way', descZh: '水坑多花能量，哪条路最省力？', descEn: 'Puddles cost extra energy — which route is easiest?' },
    G1: { icon: '⭐', nameZh: 'G1 · 星星最多', nameEn: 'G1 · Most Stars', descZh: '能量有限，走哪条路拿到的星星最多？', descEn: 'Energy is limited — which route earns the most stars?' },
    G2: { icon: '🌫️', nameZh: 'G2 · 迷雾里的路', nameEn: 'G2 · Into the Fog', descZh: '看起来星星最多的路，一定最好吗？', descEn: 'The route with the most stars — is it always the best?' }
  };

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { route_count: 'two',   hazard_type: 'block',        goal_type: 'least_energy', information_state: 'complete' },
      K2: { route_count: 'three', hazard_type: 'costly',       goal_type: 'least_energy', information_state: 'complete' },
      G1: { route_count: 'three', hazard_type: 'block',        goal_type: 'most_stars',   information_state: 'complete' },
      G2: { route_count: 'three', hazard_type: 'mixed_hidden', goal_type: 'most_stars',   information_state: 'hidden' }
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
        descZh: m.descZh, descEn: m.descEn, questions: RC_GEN.generate(g, SESSION_SIZE) };
    });
  }

  var UNITS = buildUnits();

  window.RC_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) { if (u.id === unitId) { u.questions = RC_GEN.generate(unitId, SESSION_SIZE); } });
    }, 0);
  }

  var COLORS = ['#2563eb', '#16a34a', '#7c3aed'];

  (function injectStyles() {
    if (document.getElementById('rc-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'rc-shell-style';
    s.textContent = [
      '.s1-seq{text-align:center !important;letter-spacing:0 !important;}',
      '.rc-scene{display:flex;flex-direction:column;align-items:center;gap:10px;}',
      '.rc-goal{font-size:16px;font-weight:900;color:#075985;line-height:1.45;max-width:340px;background:#fff;border-radius:12px;padding:8px 12px;}',
      '.rc-map{background:#fff;border:2px solid #bae6fd;border-radius:14px;max-width:100%;height:auto;}',
      '.rc-bar{font-size:18px;font-weight:900;color:#075985;background:#e0f2fe;border:2px solid #7dd3fc;border-radius:12px;padding:5px 16px;}',
      '.rc-bar.low{color:#b91c1c;background:#fee2e2;border-color:#f87171;}',
      '.rc-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}',
      '.rc-btn{border:none;color:#fff;font-size:15px;font-weight:900;padding:8px 18px;border-radius:999px;cursor:pointer;font-family:inherit;}',
      '.rc-btn.hint{background:#0ea5e9;}',
      '.rc-btn.alt{background:#64748b;}',
      '.rc-msg{min-height:44px;max-width:340px;font-size:14px;font-weight:800;color:#0c4a6e;line-height:1.5;}',
      '.rc-opt{font-size:20px;font-weight:900;}',
      '.bolt{display:inline-block;width:1em;height:1em;vertical-align:-0.14em;background:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M13.5 1 4 13.5h6.2L8.8 23 20 9.6h-6.6z\' fill=\'%23dc2626\' stroke=\'%23991b1b\' stroke-width=\'1\' stroke-linejoin=\'round\'/%3E%3C/svg%3E") center/contain no-repeat;}'
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

  function goalText(q) {
    var th = q.theme, who = th[1] + '（' + th[0] + '）', whoEn = th[2] + ' (' + th[0] + ')';
    var goal = th[4] + '（' + th[3] + '）', goalEn = th[5] + ' (' + th[3] + ')', has = {};
    q.routes.forEach(function (r) { for (var k in r.hazards) { has[r.hazards[k] === 'fog' ? 'fog' : r.hazards[k]] = 1; } });
    var zh = who + '要走到' + goal + '那里。圆圈里的数字是走过去要花的能量（⚡）。', en = whoEn + ' wants to reach ' + goalEn + '. The number in each circle is the energy (⚡) it costs. ';
    if (has.puddle) { zh += '水坑（💧）要花 3 点。'; en += 'A puddle (💧) costs 3. '; }
    if (has.block) { zh += '路障（🚧）过不去。'; en += 'A barrier (🚧) cannot be passed. '; }
    if (q.energy !== null) { zh += '一共只有 ' + q.energy + ' 点能量。'; en += 'You have only ' + q.energy + ' energy. '; }
    zh += q.goalType === 'most_stars' ? '点一条路走走看，怎样得到的星星（⭐）最多？' : '点一条路走走看，选花能量最少的。';
    en += q.goalType === 'most_stars' ? 'Tap a route to try it. How do you earn the most stars (⭐)?' : 'Tap a route to try it. Pick the one that costs the least energy.';
    if (has.fog) { zh += '❓ 看不清的石头，走到才知道。'; en += ' A ❓ stone is hidden — you only find out when you reach it.'; }
    return { zh: zh, en: en };
  }

  // ── The map ───────────────────────────────────────────────────────────────
  var W = 320, H = 250, AMP = { 2: [-60, 60], 3: [-78, 0, 78] };
  function pos(q, i, j, n) {                     // j = 0 start .. n+1 goal
    var t = j / (n + 1), amp = AMP[q.routes.length][i] * Math.sin(Math.PI * t);
    return [30 + 260 * t, 125 + amp];
  }
  function T(x, y, size, body, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" text-anchor="middle" dominant-baseline="central" ' + (extra || '') + '>' + body + '</text>';
  }

  function mapSvg(q, st) {
    var th = q.theme, svg = '<svg class="rc-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">';
    q.routes.forEach(function (r, i) {
      var col = COLORS[i], pts = [], k, j, p, body = '';
      for (k = 0; k <= 16; k++) { p = pos(q, i, k / 16 * (r.n + 1), r.n); pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1)); }
      svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" opacity="' + (st.chosen === i || st.chosen === null ? '.85' : '.3') + '"/>';
      for (j = 1; j <= r.n; j++) {
        p = pos(q, i, j, r.n);
        var h = r.hazards[j - 1], known = st.revealed && st.revealed[i + ',' + (j - 1)];
        if (h === 'fog' && known) h = 'block';
        if (h === 'block') body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/>' + T(p[0], p[1], 19, '🚧');
        else if (h === 'puddle') body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#dbeafe" stroke="#3b82f6" stroke-width="3"/>' + T(p[0] - 2, p[1] - 1, 18, '💧') + T(p[0] + 11, p[1] + 12, 13, '3', 'font-weight="900" fill="#1d4ed8" stroke="#fff" stroke-width="3" paint-order="stroke"');
        else if (h === 'fog') body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#e2e8f0" stroke="#64748b" stroke-width="3"/>' + T(p[0], p[1], 19, '❓');
        else body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="#fff" stroke="' + col + '" stroke-width="3"/>' + T(p[0], p[1], 13, '1', 'font-weight="900" fill="' + col + '"');
      }
      var lab = pos(q, i, (r.n + 1) / 2, r.n), off = q.routes.length === 2 ? (i ? 30 : -30) : (i === 1 ? 0 : (i ? 30 : -30));
      svg += body;
      if (q.stars) svg += '<rect x="' + (lab[0] - 21) + '" y="' + (lab[1] + off - 12) + '" width="42" height="24" rx="12" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>' + T(lab[0], lab[1] + off, 13, '⭐' + r.stars, 'font-weight="900" fill="#92400e"');
      else svg += '<circle cx="' + lab[0] + '" cy="' + (lab[1] + off) + '" r="12" fill="' + col + '"/>' + T(lab[0], lab[1] + off, 14, 'ABC'.charAt(i), 'font-weight="900" fill="#fff"');
    });
    var a = pos(q, 0, 0, 1), b = pos(q, 0, 2, 1);
    var wx = a[0], wy = a[1];
    if (st.walker) { wx = st.walker[0]; wy = st.walker[1]; if (st.walker[2]) { wx -= 34; } }
    var ring = function (x, y, fill, stroke) { return '<circle cx="' + x + '" cy="' + y + '" r="23" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>'; };
    return svg + ring(b[0], b[1], '#dcfce7', '#16a34a') + T(b[0], b[1], 30, th[3]) +
      ring(wx, wy, '#e0f2fe', '#0284c7') + T(wx, wy, 30, th[0]) + '</svg>';
  }

  // ── The board ─────────────────────────────────────────────────────────────
  function playBoard(q, host) {
    var st = { chosen: null, walker: null, revealed: {} }, tries = 0, hints = 0, busy = false, done = false, timer = null;
    var HINTS = [
      ['先想一想：我想达到什么？', 'First: what do I want to achieve?'],
      ['再想一想：每条路上有什么？走完要花多少能量？', 'Next: what is on each route, and how much energy will it take?'],
      ['走走看，结果会告诉你。不满意可以再选一条。', 'Try it — the result will tell you. Not happy? Choose another.']
    ];

    function left0() { return q.energy; }
    function draw(msg) {
      var buttons = q.routes.map(function (r, i) {
        return '<button class="rc-btn" data-i="' + i + '" style="background:' + COLORS[i] + '">' + bi('走路线 ' + 'ABC'.charAt(i), 'Route ' + 'ABC'.charAt(i)) + '</button>';
      }).join('');
      host.innerHTML = (q.energy !== null ? '<div class="rc-bar' + (st.energyLeft !== undefined && st.energyLeft <= 1 ? ' low' : '') + '" id="rc-bar">' + bolt('⚡') + ' ' + (st.energyLeft === undefined ? q.energy : st.energyLeft) + ' / ' + q.energy + '</div>' : '') +
        mapSvg(q, st) + '<div class="rc-acts">' + buttons + '</div>' +
        '<div class="rc-acts"><button class="rc-btn hint" id="rc-hint">' + bi('💡 提示', '💡 Hint') + '</button></div><div class="rc-msg" id="rc-msg">' + (msg || '') + '</div>';
      host.querySelectorAll('.rc-acts [data-i]').forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-i')); }); });
      host.querySelector('#rc-hint').addEventListener('click', hint);
      applyLang(host);
    }
    function say(zh, en) { var m = host.querySelector('#rc-msg'); if (m) { m.innerHTML = bi(zh, en); applyLang(m); } }
    function hint() { if (done) { return; } hints++; var h = HINTS[Math.min(hints, 3) - 1]; say(h[0], h[1]); }

    function finish(tier, zh, en) {
      done = true;
      q.result = { tier: tier, tries: tries, hints: hints, zh: zh, en: en };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 1100);
    }

    function go(i) {
      if (done || busy) { return; }
      busy = true; tries++; st.chosen = i;
      var r = q.routes[i], used = 0, step = 0, energy = q.energy;
      st.energyLeft = energy === null ? undefined : energy;
      draw('');
      (function next() {
        if (step >= r.n) {                                   // reached the goal
          st.walker = pos(q, i, r.n + 1, r.n).concat([1]); draw('');
          return setTimeout(arrive, 350);
        }
        var h = r.hazards[step] || null, c = h === 'puddle' ? 3 : 1;
        st.walker = pos(q, i, step + 1, r.n);
        if (h === 'block' || h === 'fog') {
          if (h === 'fog' && q.persist) { st.revealed[i + ',' + step] = 1; }
          draw(''); return setTimeout(function () { stop('block', h === 'fog'); }, 300);
        }
        if (energy !== null && used + c > energy) { draw(''); return setTimeout(function () { stop('empty'); }, 300); }
        used += c; step++;
        if (energy !== null) { st.energyLeft = energy - used; }
        draw('');
        timer = setTimeout(next, 450);
      }());
      function stop(why, fog) {
        busy = false; st.walker = null; draw('');
        if (why === 'block') {
          say(fog ? '❓ 糟糕，那块石头后面是路障！走不通了。回到起点，再选一条路。' : '🚧 路障挡住了，走不过去。回到起点，再选一条路。',
              fog ? '❓ Oh no, a barrier was hiding there! Back to the start — choose another route.' : '🚧 A barrier blocks the way. Back to the start — choose another route.');
        } else {
          say('⚡ 能量用完了，走不到终点。想想哪条路更省力，再选一条。', '⚡ Out of energy before the goal. Which route is easier? Choose another.');
        }
      }
      function arrive() {
        busy = false;
        var res = RC_GEN.walk(r, energy);
        var isBest = i === q.best, first = tries === 1;
        var info = (q.stars ? '得到 ' + r.stars + ' 颗星，' : '') + '用了 ' + res.used + ' 点能量';
        var infoEn = (q.stars ? 'earned ' + r.stars + ' stars, ' : '') + 'used ' + res.used + ' energy';
        if (isBest) {
          say('🎉 到达！' + info + '。', '🎉 Arrived! ' + infoEn + '.');
          return finish(first && hints === 0 ? 'best' : first ? 'better' : 'good',
            (first && hints === 0 ? '⭐ ' : '') + info + (first ? '，一次就选对了' : '，换了 ' + (tries - 1) + ' 次路'),
            (first && hints === 0 ? '⭐ ' : '') + infoEn + (first ? ', right on the first try' : ', changed route ' + (tries - 1) + ' time(s)'));
        }
        draw('');
        say('到达了：' + info + '。有没有更好的路？再选一条试试，或者就这样。', 'Arrived: ' + infoEn + '. Is there a better route? Try another, or keep this one.');
        var acts = host.querySelectorAll('.rc-acts')[1], keep = document.createElement('button');
        keep.className = 'rc-btn alt'; keep.innerHTML = bi('就这样了', 'Keep it');
        keep.addEventListener('click', function () {
          if (done) { return; }
          finish('valid', info + '，还有更好的路', infoEn + ' — a better route existed');
        });
        acts.appendChild(keep); applyLang(acts);
      }
    }
    draw('');
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
        contentZh: '点一条路，看小动物走过去会发生什么：有路障会被挡住，水坑多花能量，能量用完走不到。不满意可以再选一条。',
        contentEn: 'Tap a route and watch what happens: a barrier blocks the way, a puddle costs extra energy, and running out of energy stops you. Not happy? Choose another route.'
      },
      video: { enabled: true, videoId: 'mindseeds-route-choice-intro-001' }
    },
    title:     { zh: '🛣️ 近路还是远路',           en: '🛣️ Near or Far' },
    subtitle:  { zh: '走走看，结果会告诉你', en: 'Try it — the result will tell you' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      var t = goalText(q);
      container.innerHTML = '<div class="rc-scene"><div class="rc-goal">' + bi(t.zh, t.en) + '</div><div id="rc-host" class="rc-scene"></div></div>';
      q.result = null;
      playBoard(q, container.querySelector('#rc-host'));
      applyLang(container);
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="rc-opt">✔</span>'; },

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
