'use strict';

/**
 * Spatial Pattern Hunter — Game Config + RADAR CONTRACT  (Shell-1, MindSeeds)
 * A trail of numbered footprints follows a movement rule on a grid. The child taps the
 * cell that comes next (predict), the cell that went missing (fill) or the misplaced
 * footprint (spot). A wrong try is not marked red: the trail that follows from the
 * choice is shown with the move of every step, the steps that break the rule outlined.
 * Finishing passes; right first with no hints earns a star; retries and hints go into
 * the report. The hidden confirm button is clicked by the board once the answer is found
 * (same hook as the Strategy Master games and games/pattern-board.js).
 *
 * LEVEL_GRADE, GENES, SESSION_SIZE and the `base` table in difficultyAxisFor() are
 * cross-checked against metadata/mindseeds/spatial-pattern.json by metadata/validate.html;
 * keep them literal declarations (the validator reads this file as text).
 *
 * Metadata:  /metadata/mindseeds/spatial-pattern.json
 * RootGene:  RG.PATTERN.SPATIAL.RELATION
 */
(function () {

  var MODULE_ID      = 'spatial-pattern';
  var MODULE_TYPE    = 'mindseeds';
  var SOURCE_GAME_ID = 'spatial-pattern-hunter';

  var LEVEL_GRADE = { K1: 'K1', K2: 'K2', G1: 'G1', G2: 'G2' };
  var GRADE_ORDER = ['K1', 'K2', 'G1', 'G2'];
  var GENES = ['RG.PATTERN.SPATIAL.RELATION'];

  // Mirrors spatial-pattern.json → sessionPolicy.maxItemsPerSession.
  var SESSION_SIZE = 6;

  function difficultyAxisFor(gradeCode) {
    var base = {
      K1: { space_dimension: 'line', motion_rule: 'hop',    path_length: 'short' },
      K2: { space_dimension: 'grid', motion_rule: 'hop',    path_length: 'medium' },
      G1: { space_dimension: 'grid', motion_rule: 'stair',  path_length: 'medium' },
      G2: { space_dimension: 'grid', motion_rule: 'bounce', path_length: 'long' }
    }[gradeCode];
    return base ? Object.assign({}, base) : null;
  }

  function _unique(values) {
    return (values || []).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
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
      var m = SP_DATA.units[g] || {};
      return { id: g, gradeCode: LEVEL_GRADE[g] || null, icon: m.icon, nameZh: m.nameZh, nameEn: m.nameEn,
        descZh: m.descZh, descEn: m.descEn, questions: SP_GEN.generate(g, SESSION_SIZE) };
    });
  }

  var UNITS = buildUnits();

  window.SP_CONTRACT = {
    MODULE_ID: MODULE_ID, SESSION_SIZE: SESSION_SIZE, GRADE_ORDER: GRADE_ORDER,
    GENES: GENES, LEVEL_GRADE: LEVEL_GRADE,
    difficultyAxisFor: difficultyAxisFor, buildRadarContext: buildRadarContext
  };

  // Deferred: the report must describe the questions just seen.
  function refillUnit(unitId) {
    setTimeout(function () {
      UNITS.forEach(function (u) { if (u.id === unitId) { u.questions = SP_GEN.generate(unitId, SESSION_SIZE); } });
    }, 0);
  }

  (function injectStyles() {
    if (document.getElementById('sp-shell-style')) { return; }
    var s = document.createElement('style');
    s.id = 'sp-shell-style';
    s.textContent = [
      '.sp-grid{display:grid;gap:4px;background:#fff;border:2px solid #bae6fd;border-radius:14px;padding:6px;}',
      '.sp-cell{position:relative;display:flex;align-items:center;justify-content:center;border-radius:10px;border:2px solid #e0f2fe;background:#f0f9ff;font-family:inherit;font-size:16px;font-weight:900;color:#0c4a6e;padding:0;cursor:pointer;touch-action:manipulation;}',
      '.sp-grid.pads .sp-cell{border-radius:50%;background:#dcfce7;border-color:#86efac;}',
      '.sp-cell.seen{background:#bae6fd;border-color:#38bdf8;}',
      '.sp-grid.pads .sp-cell.seen{background:#86efac;border-color:#16a34a;}',
      '.sp-cell.last{background:#7dd3fc;border-color:#0284c7;}',
      '.sp-cell.pick{background:#ffedd5;border-color:#ea580c;color:#9a3412;}',
      '.sp-cell.sel{background:#e0e7ff;border-color:#4f46e5;box-shadow:0 0 0 3px #4f46e5;}',
      '.sp-cell.bad{background:#fee2e2;border-color:#ef4444;color:#b91c1c;}',
      '.sp-cell .mv{position:absolute;top:-6px;right:-4px;font-size:14px;background:#fff;border-radius:50%;width:20px;height:20px;line-height:20px;text-align:center;box-shadow:0 0 0 1px #cbd5e1;}',
      '.sp-chips{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-top:6px;}',
      '.sp-chip{font-size:14px;font-weight:900;color:#0c4a6e;background:#e0f2fe;border-radius:8px;padding:2px 8px;}',
      '.sp-chip.x{color:#b91c1c;background:#fee2e2;}',
      '.sp-opt{font-size:20px;font-weight:900;}'
    ].join('');
    document.head.appendChild(s);
  }());

  function bi(zh, en) { return '<span class="zh">' + zh + '</span><span class="en">' + en + '</span>'; }
  function applyLang(root) {
    var zh = shell.lang === 'zh';
    root.querySelectorAll('.zh').forEach(function (n) { n.style.display = zh ? '' : 'none'; });
    root.querySelectorAll('.en').forEach(function (n) { n.style.display = zh ? 'none' : ''; });
  }
  function eq(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function k(c) { return c[0] + ',' + c[1]; }

  // A move as arrows: [dr, dc] -> "→2 ↓1"
  function moveText(d) {
    var o = [];
    if (d[1] > 0) { o.push('→' + d[1]); } else if (d[1] < 0) { o.push('←' + (-d[1])); }
    if (d[0] > 0) { o.push('↓' + d[0]); } else if (d[0] < 0) { o.push('↑' + (-d[0])); }
    return o.join(' ') || '·';
  }

  function ruleText(q) {
    var m = q.mover;
    if (q.kind === 'hop') { return { zh: m[1] + '（' + m[0] + '）每一步走的方向和格数都一样。', en: 'The ' + m[2].replace(/^the /, '') + ' (' + m[0] + ') makes the same move every step.' }; }
    if (q.kind === 'stair') { return { zh: m[1] + '（' + m[0] + '）像上楼梯：两种走法轮流来。', en: 'The ' + m[2].replace(/^the /, '') + ' (' + m[0] + ') climbs stairs: two different moves take turns.' }; }
    return { zh: m[1] + '（' + m[0] + '）斜着走，碰到边就反弹。', en: 'The ' + m[2].replace(/^the /, '') + ' (' + m[0] + ') moves diagonally and bounces off the edges.' };
  }

  function askText(q) {
    var r = ruleText(q), zh, en;
    if (q.form === 'predict') {
      zh = q.need === 1 ? '下一步（第 ' + (q.shown + 1) + ' 步）落在哪个格子？点它。' : '接下来的 ' + q.need + ' 步依次落在哪里？按顺序点格子。';
      en = q.need === 1 ? 'Where does step ' + (q.shown + 1) + ' land? Tap the cell.' : 'Where do the next ' + q.need + ' steps land? Tap the cells in order.';
    } else if (q.form === 'fill') {
      zh = '第 ' + (q.hide + 1) + ' 步的脚印不见了，它在哪个格子？点它。'; en = 'The footprint of step ' + (q.hide + 1) + ' is missing. Which cell is it? Tap it.';
    } else {
      zh = '有一个脚印放错了位置，找出来，点它的数字。'; en = 'One footprint is in the wrong place. Find it and tap its number.';
    }
    return { zh: r.zh + ' 每个数字是第几步到的地方。' + zh, en: r.en + ' Each number is the step that landed there. ' + en };
  }

  // ── The board ─────────────────────────────────────────────────────────────
  function playBoard(q, host) {
    var tries = 0, hints = 0, done = false, picks = [], overlay = null, spotSel = null;
    var need = q.form === 'predict' ? q.need : q.form === 'fill' ? 1 : 0;
    var shownList = [];                                       // {step, cell}
    if (q.form === 'predict') { for (var i = 0; i < q.shown; i++) { shownList.push({ step: i + 1, cell: q.seq[i] }); } }
    else if (q.form === 'fill') { q.seq.forEach(function (c, i) { if (i !== q.hide) { shownList.push({ step: i + 1, cell: c }); } }); }
    else { q.cells.forEach(function (c, i) { shownList.push({ step: i + 1, cell: c }); }); }
    var stepAt = {}; shownList.forEach(function (s) { stepAt[k(s.cell)] = s.step; });
    var lastStep = q.form === 'predict' ? q.shown : 0;
    var firstPick = q.form === 'predict' ? q.shown + 1 : q.hide + 1;

    function say(zh, en, extra) { var m = host.querySelector('.pb-msg'); if (m) { m.innerHTML = bi(zh, en) + (extra || ''); applyLang(m); } }
    function finish(first) {
      var f = first && hints === 0;
      done = true;
      q.result = { tier: f ? 'best' : first ? 'better' : tries <= 2 ? 'good' : 'valid', tries: tries, hints: hints,
        zh: (f ? '⭐ ' : '') + (first ? '一次就发现规律了' : '试了 ' + tries + ' 次'), en: (f ? '⭐ ' : '') + (first ? 'Found the pattern in one go' : 'Took ' + tries + ' tries') };
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.click(); } }, 1000);
    }

    function chips(cells) {
      if (q.kind === 'bounce') { return ''; }
      var h = '<div class="sp-chips">';
      for (var i = 0; i + 1 < cells.length && i + 1 < q.seq.length; i++) {
        var d = SP_GEN.diff(cells[i], cells[i + 1]), t = SP_GEN.diff(q.seq[i], q.seq[i + 1]);
        h += '<span class="sp-chip' + (eq(d, t) ? '' : ' x') + '">' + moveText(d) + '</span>';
      }
      return h + '</div>';
    }

    function gridHtml() {
      var h = '<div class="sp-grid' + (q.pads ? ' pads' : '') + '" style="grid-template-columns:repeat(' + q.C + ',' + q.cellPx + 'px);grid-auto-rows:' + q.cellPx + 'px">';
      for (var r = 0; r < q.R; r++) for (var c = 0; c < q.C; c++) {
        var key = r + ',' + c, step = stepAt[key], cls = 'sp-cell', inner = '';
        if (step !== undefined) { cls += step === lastStep ? ' seen last' : ' seen'; inner = step; if (q.form === 'spot' && spotSel === step) { cls += ' sel'; } }
        var pi = picks.findIndex(function (p) { return k(p) === key; });
        if (pi >= 0) { cls += ' pick'; inner = firstPick + pi; }
        if (overlay) {
          overlay.picks.forEach(function (p, j) { if (k(p) === key && j >= overlay.badFrom) { cls += ' bad'; inner = firstPick + j; } });
        }
        var mv = (step === lastStep && step !== 0 && !overlay) ? '<span class="mv">' + q.mover[0] + '</span>' : '';
        h += '<button class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + inner + mv + '</button>';
      }
      return h + '</div>';
    }

    var HINTS = [
      ['先看：每一步是从哪个格子走到哪个格子？', 'First: from which cell to which cell does each step go?'],
      ['比一比：每一步走的方向和格数，有什么一样或不一样？', 'Compare: what is the same or different about the direction and distance of each step?'],
      null
    ];
    function lastHint() {
      var r = q.rule;
      if (q.kind === 'hop') { return { zh: '每一步都是 ' + moveText(r.d) + '。', en: 'Every step is ' + moveText(r.d) + '.' }; }
      if (q.kind === 'stair') { return { zh: '两种走法轮流：' + moveText(r.d1) + ' 和 ' + moveText(r.d2) + '。', en: 'Two moves take turns: ' + moveText(r.d1) + ' and ' + moveText(r.d2) + '.' }; }
      return { zh: '一直斜着走，碰到边，那个方向就反过来。', en: 'Keep going diagonally; at an edge, that direction flips.' };
    }

    function draw(msgHtml) {
      var t = askText(q);
      host.innerHTML = '<div class="pb-ask">' + bi(t.zh, t.en) + '</div>' + gridHtml() +
        '<div class="pb-acts"><button class="pb-btn" id="sp-go">' + bi('✔ 就是它', '✔ This is it') + '</button>' +
        (need > 1 ? '<button class="pb-btn hint" id="sp-undo">' + bi('↶ 撤销', '↶ Undo') + '</button>' : '') +
        '<button class="pb-btn hint" id="sp-hint">' + bi('💡 提示', '💡 Hint') + '</button></div><div class="pb-msg">' + (msgHtml || '') + '</div>';
      host.querySelectorAll('.sp-cell').forEach(function (b) { b.addEventListener('click', function () { tap([+b.getAttribute('data-r'), +b.getAttribute('data-c')]); }); });
      host.querySelector('#sp-go').addEventListener('click', submit);
      var u = host.querySelector('#sp-undo'); if (u) { u.addEventListener('click', function () { if (!done) { picks.pop(); overlay = null; draw(); } }); }
      host.querySelector('#sp-hint').addEventListener('click', function () {
        if (done) { return; }
        hints++;
        if (hints <= 2) { return say(HINTS[hints - 1][0], HINTS[hints - 1][1]); }
        var h = lastHint(); say(h.zh, h.en);
      });
      applyLang(host);
    }

    function tap(cell) {
      if (done) { return; }
      var had = overlay; overlay = null;
      var step = stepAt[k(cell)];
      if (q.form === 'spot') { if (step !== undefined) { spotSel = step; } draw(had ? host.querySelector('.pb-msg').innerHTML : ''); return; }
      if (step !== undefined) { draw(''); return say('这里已经有脚印了，点一个空格子。', 'There is a footprint here already. Tap an empty cell.'); }
      var at = picks.findIndex(function (p) { return eq(p, cell); });
      if (at >= 0) { if (at === picks.length - 1) { picks.pop(); } }
      else if (picks.length < need) { picks.push(cell); }
      draw('');
    }

    function reveal(cells) {
      var r = lastHint();
      return bi(r.zh, r.en) + chips(cells);
    }

    function submit() {
      if (done) { return; }
      if (q.form === 'spot') {
        if (spotSel === null) { return say('先点一个你觉得放错的数字。', 'Tap the number you think is misplaced first.'); }
        tries++;
        if (spotSel === q.badIndex + 1) {
          q.cells = q.seq; stepAt = {}; shownList = q.seq.map(function (c, i) { return { step: i + 1, cell: c }; }); shownList.forEach(function (s) { stepAt[k(s.cell)] = s.step; });
          spotSel = null; draw(''); say('✅ 找到了！放回正确的位置，整串脚印就合上规律了。', '✅ Found it! Put it back and the whole trail follows the rule.', '');
          var m = host.querySelector('.pb-msg'); m.innerHTML += reveal(q.seq); applyLang(m);
          return finish(tries === 1);
        }
        var cellsNow = q.cells; spotSel = null; draw('');
        var mm = host.querySelector('.pb-msg');
        mm.innerHTML = bi('这一步其实没问题。看看每一步是怎么走的，红色的几步对不上：', 'That step is fine. See how each step moves - the red ones do not fit:') + chips(cellsNow);
        if (q.kind === 'bounce') { mm.innerHTML = bi('这一步其实没问题。想一想：球一直斜着走，碰到边才反弹。哪一步不是这样走的？', 'That step is fine. Think: the ball goes diagonally and only bounces at an edge. Which step does not move like that?'); }
        applyLang(mm);
        return;
      }
      if (picks.length < need) { return say(need === 1 ? '先点一个格子。' : '要点满 ' + need + ' 个格子。', need === 1 ? 'Tap a cell first.' : 'Tap all ' + need + ' cells.'); }
      tries++;
      var wrongAt = -1;
      for (var i = 0; i < need; i++) { if (!eq(picks[i], q.target[i])) { wrongAt = i; break; } }
      if (wrongAt < 0) {
        var full = q.form === 'predict' ? q.seq : q.seq;
        shownList = q.seq.map(function (c, ii) { return { step: ii + 1, cell: c }; }); stepAt = {}; shownList.forEach(function (s) { stepAt[k(s.cell)] = s.step; });
        picks = []; lastStep = 0; draw(''); say('✅ 对！', '✅ Yes!');
        var m2 = host.querySelector('.pb-msg'); m2.innerHTML += reveal(full); applyLang(m2);
        return finish(tries === 1);
      }
      overlay = { picks: picks.slice(), badFrom: wrongAt };
      var seqNow = q.form === 'predict' ? q.seq.slice(0, q.shown).concat(picks) : q.seq.map(function (c, ii) { return ii === q.hide ? picks[0] : c; });
      picks = picks.slice(0, wrongAt);
      draw('');
      var m3 = host.querySelector('.pb-msg');
      m3.innerHTML = q.kind === 'bounce'
        ? bi('按你的选择，小球这样走不对（红色的格子）。想一想：它在往哪个方向斜着走？这一步碰到边了吗？', 'With your choice the ball would not move like that (red cell). Think: which diagonal is it going? Did it reach an edge on this step?')
        : bi('按你的选择，这一步走成了红色格子。看看每一步怎么走的，红色的对不上：', 'With your choice the step lands on the red cell. See how each step moves - the red ones do not fit:') + chips(seqNow);
      applyLang(m3);
    }
    draw('');
  }

  shell.createGame({
    id:            SOURCE_GAME_ID,
    parallelUnits: true,
    theme:    { primary: '#0ea5e9', primary2: '#0284c7', bg: '#f0f9ff' },
    gui: {
      header: { show: true, showBack: true },
      language: { enabled: true, default: 'en' },
      audio: { music: { enabled: true, defaultOn: false }, sound: { enabled: true, defaultOn: true } },
      history: { enabled: true },
      help: {
        enabled: true,
        contentZh: '看脚印一步一步怎么走：方向和格数一样吗？还是两种走法轮流？碰到边会反弹吗？找到规律，再点出下一个位置。',
        contentEn: 'Watch how the footprints move: the same direction and distance each time, two moves in turns, or a bounce at an edge? Find the rule, then tap the right cell.'
      },
      video: { enabled: true, videoId: 'mindseeds-spatial-pattern-intro-001' }
    },
    title:     { zh: '🧭 空间关系', en: '🧭 Spatial Pattern' },
    subtitle:  { zh: '看脚印，发现位置变化的规律', en: 'Follow the footprints and find the rule' },
    passScore: Math.ceil(SESSION_SIZE * 0.75),
    units:     UNITS,

    renderSequence: function (q, container) {
      container.classList.add('pb-seq');
      container.innerHTML = '<div class="pb-scene" id="sp-host"></div>';
      q.result = null;
      playBoard(q, container.querySelector('#sp-host'));
      setTimeout(function () { var b = document.querySelector('.s1-opt'); if (b) { b.style.display = 'none'; } }, 0);
    },

    renderOption: function () { return '<span class="sp-opt">✔</span>'; },

    checkAnswer: function (selected, q) { return !!q.result; },

    onAnswer: function (selected, q, correct) {
      if (!correct || !q.result) { return; }
      setTimeout(function () {
        var fb = document.getElementById('s1-fb'); if (!fb) { return; }
        fb.innerHTML += '<div>' + bi(q.result.zh, q.result.en) + '</div>'; applyLang(fb);
      }, 0);
    },

    getVoiceText: function (q) {
      var t = askText(q);
      return (shell.lang === 'zh' ? t.zh : t.en).replace(/（[^）]*）/g, '').replace(/ \([^)]*\)/g, '');
    },

    registerRootGenes: function () { return GENES.slice(); },

    getReportContext: function (ctx) {
      var unit = (ctx && ctx.unit) || {}, questions = unit.questions || [];
      var extra = { rules: _unique(questions.map(function (q) { return q.kind; })), geneIds: GENES.slice(), activityRuntime: 'puzzle' };
      PatternBoard.addProcess(questions, extra);
      refillUnit(unit.id);
      return buildRadarContext(unit.id, extra);
    }
  });
}());
