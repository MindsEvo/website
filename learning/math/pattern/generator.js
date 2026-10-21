'use strict';

/**
 * Pattern generator — structure x carrier x task, per grade.
 *
 * GRADIENT RULE (the design principle of this module):
 *   grades differ by STRUCTURE / RULE COMPLEXITY / REPRESENTATION first; the
 *   number range only follows.
 *     K1  single attribute, short, no numerals: AB / AAB / ABB, colour-shape-
 *         size-object, continue / complete / discover.
 *     K2  whole unit: ABC / AABB / AABC, growing counts and sizes, repair.
 *     G1  two attributes at once, alternating states, position strip,
 *         shrinking counts, numbers within 20.
 *     G2  compound rules: +a/-b alternation, count growth + colour cycle,
 *         input->output, numbers within 100, blank at the start.
 *
 * Tokens (rendered by game.js tokHtml) are plain strings:
 *   'X'            an emoji / numeral
 *   'sz:X:n'       glyph X at size level n (1..5)
 *   'ct:X:n'       n copies of glyph X
 *   'ps:k:n:X'     glyph X in cell k of an n-cell strip
 *   'lt:X'         a letter / symbol tile
 *   'hd:X'         a table header cell (not tappable)
 *   'wd:n'         a weekday header (0 = Sunday), bilingual
 *   'st:RRB'       a stack of blocks, bottom first (R red B blue G green Y yellow)
 *
 * Question shape (consumed by game.js):
 *   { task: 'continue'|'complete'|'discover'|'repair',
 *     structure, carrier, ruleType, seq | groups | rows,
 *     answer, options, brokenIndex?, hintZh, hintEn }
 */
var PT_GEN = (function () {

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[ri(0, a.length - 1)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = ri(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function same(a, b) { return String(a) === String(b); }

  // ── palettes (single attribute carriers) ──────────────────────────────────
  var PAL = {
    color:    { carrier: 'color',    pool: ['🔴', '🔵', '🟢', '🟣', '⚫', '⚪'], zh: '颜色', en: 'colour' },
    shape:    { carrier: 'shape',    pool: ['💙', '💚', '💜', '🍀', '🦋', '🐳'], zh: '图形', en: 'shape' },
    object:   { carrier: 'object',   pool: ['🐸', '🐳', '🦋', '🍇', '🐬', '🐢'], zh: '图案', en: 'picture' },
    temporal: { carrier: 'temporal', pool: ['🌅', '☀️', '🌙'], zh: '时间', en: 'time' },
    letter:   { carrier: 'letter',   pool: ['lt:A', 'lt:B', 'lt:C', 'lt:D', 'lt:E', 'lt:F'], zh: '字母', en: 'letter' },
    symbol:   { carrier: 'letter',   pool: ['lt:+', 'lt:−', 'lt:×', 'lt:÷', 'lt:=', 'lt:<'], zh: '符号', en: 'symbol' },
    action:   { carrier: 'action',   pool: ['🦘', '🛑', '🏃', '🚴', '🏊', '🤸'], zh: '动作', en: 'action' }
  };
  // natural cycles: the order is given by the world, the child finds the loop
  var NATURAL = {
    K1: [['☀️', '🌙']],
    K2: [['🌅', '☀️', '🌙'], ['🌞', '🌙']],
    G1: [['🌸', '☀️', '🍂', '❄️'], ['⏰', '🏫', '🏠', '🛏️'], ['🌅', '☀️', '🌇', '🌙']],
    G2: [['🌸', '☀️', '🍂', '❄️'], ['⏰', '🏫', '🏠', '🛏️']]
  };
  var BLOCK = { R: 'R', B: 'B', G: 'G', P: 'P' };
  var STATE = [
    { carrier: 'direction', pair: ['⬆️', '⬇️'], zh: '方向', en: 'direction' },
    { carrier: 'direction', pair: ['⬅️', '➡️'], zh: '方向', en: 'direction' },
    { carrier: 'temporal',  pair: ['☀️', '🌙'], zh: '昼夜', en: 'day and night' },
    { carrier: 'object',    pair: ['🐸', '🐳'], zh: '状态', en: 'state' }
  ];
  var CIRCLES = ['🔴', '🔵', '🟢', '🟣'];
  var SQUARES = ['🟥', '🟦', '🟩', '🟪'];

  // letters like 'AABC' -> tokens from a pool, distinct letters get distinct tokens
  function unitTokens(shape, pool) {
    var letters = uniq(shape.split(''));
    var chosen = shuffle(pool).slice(0, letters.length);
    return shape.split('').map(function (l) { return chosen[letters.indexOf(l)]; });
  }
  function tile(unit, len) { var o = []; for (var i = 0; i < len; i++) o.push(unit[i % unit.length]); return o; }
  function periodic(seq, p) { for (var i = 0; i + p < seq.length; i++) if (!same(seq[i], seq[i + p])) return false; return true; }
  function withBlank(seq, i) { var c = seq.slice(); c[i] = '?'; return c; }

  // answer + (n-1) distractors, distractors taken from `pool` in random order
  function optionsOf(answer, pool, n) {
    var wrong = shuffle(uniq(pool).filter(function (x) { return !same(x, answer); })).slice(0, n - 1);
    return shuffle([answer].concat(wrong));
  }
  function base(task, structure, carrier, ruleType, hintZh, hintEn) {
    return { task: task, structure: structure, carrier: carrier, ruleType: ruleType, hintZh: hintZh, hintEn: hintEn };
  }

  // ── repetition / alternating: a cycle of tokens ───────────────────────────
  var CYCLE_HINT = {
    AB:   ['两个两个轮流出现', 'Two things take turns'],
    AAB:  ['看一组一组地重复，每组是 3 个', 'Look for the group of 3 that repeats'],
    ABB:  ['看一组一组地重复，每组是 3 个', 'Look for the group of 3 that repeats'],
    ABC:  ['三个一组，轮着出现', 'A group of 3 repeats in turn'],
    AABB: ['两个两个重复，每组 4 个', 'Pairs repeat — a group of 4 repeats'],
    AABC: ['四个一组，整组重复', 'A group of 4 repeats as a whole'],
    ABAC: ['四个一组，整组重复', 'A group of 4 repeats as a whole']
  };

  function cycleSource(g, shape, forced) {
    var p = PAL[forced || pick(g === 'K1' ? ['color', 'shape', 'object'] : ['color', 'shape', 'object', 'action'])];
    if (shape.length > p.pool.length) p = PAL.color;
    return p;
  }

  function cycle(g, shape, task, forced) {
    var pal = cycleSource(g, shape, forced);
    var unit = unitTokens(shape, pal.pool);
    var p = shape.length;
    var h = CYCLE_HINT[shape] || CYCLE_HINT.AB;
    var q = base(task, 'repetition', pal.carrier, 'cycle', h[0], h[1]);
    var full;
    if (task === 'discover') {
      var len = p * 3;
      full = tile(unit, len);
      var groups = [full];
      var guard = 0;
      while (groups.length < 4 && guard++ < 60) {
        var d = full.slice();
        var at = ri(p, len - 1);
        d[at] = pick(pal.pool.filter(function (x) { return !same(x, full[at]); }));
        if (!periodic(d, p) && !groups.some(function (x) { return x.join() === d.join(); })) groups.push(d);
      }
      var order = shuffle(groups.map(function (x, i) { return i; }));
      q.groups = order.map(function (i) { return { seq: groups[i] }; });
      q.answer = order.indexOf(0) + 1;
      q.options = [1, 2, 3, 4];
      return q;
    }
    if (task === 'repair') {
      full = tile(unit, p * 3);
      for (var tries = 0; tries < 40; tries++) {
        var bi = ri(1, full.length - 1);
        var wrongTok = pick(pal.pool.filter(function (x) { return !same(x, full[bi]); }));
        var bad = full.slice(); bad[bi] = wrongTok;
        var fixes = 0;
        for (var i = 0; i < bad.length; i++) pal.pool.forEach(function (v) {
          var c = bad.slice(); c[i] = v;
          if (!same(v, bad[i]) && periodic(c, p)) fixes++;
        });
        if (fixes === 1) {
          q.seq = bad; q.brokenIndex = bi; q.answer = full[bi];
          q.options = optionsOf(full[bi], unit.concat(pal.pool), g === 'K1' ? 3 : 4);
          q.hintZh = '找出打乱规律的那一个，再把它改对'; q.hintEn = 'Find the one that breaks the pattern, then fix it';
          return q;
        }
      }
      return cycle(g, shape, 'complete', forced);
    }
    var n = p * 2 + 1 + (p === 2 && Math.random() < 0.5 ? 1 : 0);
    full = tile(unit, n);
    var idx = task === 'continue' ? n - 1 : ri(1, n - 2);
    q.seq = withBlank(full, idx);
    q.answer = full[idx];
    q.options = optionsOf(full[idx], unit.concat(pal.pool), g === 'K1' ? 3 : 4);
    return q;
  }

  // sizes: small / big alternate (K1)
  function sizeAB(g, task) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐸']);
    var a = ri(1, 2), b = a + ri(2, 3);
    var unit = ['sz:' + glyph + ':' + a, 'sz:' + glyph + ':' + b];
    var n = 5 + ri(0, 1);
    var full = tile(unit, n);
    var q = base(task, 'repetition', 'size', 'cycle', '一个大、一个小，轮流出现', 'Big and small take turns');
    var idx = task === 'continue' ? n - 1 : ri(1, n - 2);
    q.seq = withBlank(full, idx); q.answer = full[idx];
    q.options = optionsOf(full[idx], unit.concat(['sz:' + glyph + ':' + (b + 1)]), 3);
    return q;
  }

  // state alternation on a direction / day-night carrier (G1)
  function stateAlt(g, task) {
    var s = pick(STATE);
    var pair = shuffle(s.pair);
    var pool = s.pair.concat(s.carrier === 'direction' ? ['⬆️', '⬇️', '⬅️', '➡️'] : ['☁️', '🌈']);
    var q = base(task, 'alternating', s.carrier, 'state_alternate', '两种状态轮流出现', 'Two states take turns');
    var full;
    if (task === 'discover') {
      full = tile(pair, 6);
      var groups = [full], guard = 0;
      while (groups.length < 4 && guard++ < 60) {
        var d = full.slice(), at = ri(2, 5);
        d[at] = full[at] === pair[0] ? pair[1] : pair[0];
        if (!periodic(d, 2) && !groups.some(function (x) { return x.join() === d.join(); })) groups.push(d);
      }
      var order = shuffle(groups.map(function (x, i) { return i; }));
      q.groups = order.map(function (i) { return { seq: groups[i] }; });
      q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
      q.hintZh = '看哪一组从头到尾都轮流'; q.hintEn = 'Find the group that takes turns all the way through';
      return q;
    }
    if (task === 'repair') {
      full = tile(pair, 8);
      for (var t = 0; t < 40; t++) {
        var bi = ri(1, 7);
        var bad = full.slice(); bad[bi] = full[bi] === pair[0] ? pair[1] : pair[0];
        var fixes = 0;
        for (var i = 0; i < bad.length; i++) pair.forEach(function (v) {
          var c = bad.slice(); c[i] = v;
          if (!same(v, bad[i]) && periodic(c, 2)) fixes++;
        });
        if (fixes === 1) {
          q.seq = bad; q.brokenIndex = bi; q.answer = full[bi];
          q.options = optionsOf(full[bi], pool, 4);
          q.hintZh = '找出打乱交替的那一个，再改对'; q.hintEn = 'Find the one that breaks the alternation, then fix it';
          return q;
        }
      }
    }
    var n = 7;
    full = tile(pair, n);
    var idx = task === 'continue' ? n - 1 : ri(1, n - 2);
    q.task = task === 'repair' ? 'complete' : task;
    q.seq = withBlank(full, idx); q.answer = full[idx];
    q.options = optionsOf(full[idx], pool, 4);
    return q;
  }

  // two attributes at once: colour alternates, shape switches every two (G1)
  function dualAttr(g, task) {
    var ci = shuffle([0, 1, 2, 3]).slice(0, 2);
    var unit = [CIRCLES[ci[0]], CIRCLES[ci[1]], SQUARES[ci[0]], SQUARES[ci[1]]];
    var q = base(task, 'repetition', 'color', 'dual_attr', '颜色在轮换，形状也在变，两件事一起看', 'Colour takes turns and shape changes too — watch both');
    q.dual = true;
    if (task === 'discover') {
      var full = tile(unit, 8), groups = [full], guard = 0;
      while (groups.length < 4 && guard++ < 60) {
        var d = full.slice(), at = ri(4, 7);
        d[at] = pick(CIRCLES.concat(SQUARES).filter(function (x) { return !same(x, full[at]); }));
        if (!periodic(d, 4) && !groups.some(function (x) { return x.join() === d.join(); })) groups.push(d);
      }
      var order = shuffle(groups.map(function (x, i) { return i; }));
      q.groups = order.map(function (i) { return { seq: groups[i] }; });
      q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
      return q;
    }
    var n = 9, f = tile(unit, n);
    var idx = task === 'continue' ? n - 1 : ri(1, n - 2);
    q.seq = withBlank(f, idx); q.answer = f[idx];
    var a = f[idx];
    var wrongColour = a === unit[0] ? unit[1] : a === unit[1] ? unit[0] : a === unit[2] ? unit[3] : unit[2];
    var wrongShape = a === unit[0] ? unit[2] : a === unit[1] ? unit[3] : a === unit[2] ? unit[0] : unit[1];
    q.options = shuffle([a, wrongColour, wrongShape, a === unit[0] ? unit[3] : a === unit[1] ? unit[2] : a === unit[2] ? unit[1] : unit[0]]);
    return q;
  }

  // ── growth ────────────────────────────────────────────────────────────────
  function countOpts(ans, lo, hi) {
    var c = uniq([ans, ans - 1, ans + 1, ans + 2, ans - 2].filter(function (v) { return v >= lo && v <= hi; }));
    return shuffle([ans].concat(shuffle(c.filter(function (v) { return v !== ans; })).slice(0, 3)));
  }
  function growCount(g, task, down) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐟', '🍇']);
    var len = 5, start, d = down ? -1 : 1;
    start = down ? ri(6, 8) : ri(1, 3);
    var vals = []; for (var i = 0; i < len; i++) vals.push(start + d * i);
    var idx = task === 'continue' ? len - 1 : ri(1, len - 2);
    var q = base(task, 'growth', 'count', 'growth_count', down ? '每一格都少一个' : '每一格都多一个', down ? 'One fewer each time' : 'One more each time');
    q.seq = vals.map(function (v, i) { return i === idx ? '?' : 'ct:' + glyph + ':' + v; });
    q.answer = 'ct:' + glyph + ':' + vals[idx];
    q.options = countOpts(vals[idx], 1, 9).map(function (v) { return 'ct:' + glyph + ':' + v; });
    return q;
  }
  function growSize(g, task) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐸']);
    var start = ri(1, 2), len = 4;
    var vals = []; for (var i = 0; i < len; i++) vals.push(start + i);
    var idx = task === 'continue' ? len - 1 : ri(1, len - 2);
    var q = base(task, 'growth', 'size', 'growth_size', '一个比一个大', 'Each one is bigger');
    q.seq = vals.map(function (v, i) { return i === idx ? '?' : 'sz:' + glyph + ':' + v; });
    q.answer = 'sz:' + glyph + ':' + vals[idx];
    q.options = countOpts(vals[idx], 1, 5).slice(0, 3).map(function (v) { return 'sz:' + glyph + ':' + v; });
    if (q.options.indexOf(q.answer) < 0) q.options[0] = q.answer;
    return q;
  }
  // count grows while the colour of the group alternates (G2, compound)
  function growCycle(g, task) {
    var glyphs = shuffle(['🔴', '🔵', '🟢', '🟣']).slice(0, 2);
    var start = ri(1, 2), len = 5;
    var vals = [], toks = [];
    for (var i = 0; i < len; i++) { vals.push(start + i); toks.push('ct:' + glyphs[i % 2] + ':' + (start + i)); }
    var idx = task === 'continue' ? len - 1 : ri(1, len - 2);
    var q = base(task, 'growth', 'count', 'growth_cycle', '个数在增加，颜色在轮换，两件事一起看', 'The count grows and the colour takes turns — watch both');
    q.seq = withBlank(toks, idx); q.answer = toks[idx];
    var v = vals[idx], gl = glyphs[idx % 2], other = glyphs[(idx + 1) % 2];
    q.options = shuffle([toks[idx], 'ct:' + other + ':' + v, 'ct:' + gl + ':' + (v + 1), 'ct:' + other + ':' + (v - 1 < 1 ? v + 2 : v - 1)]);
    return q;
  }

  // ── spatial: a glyph moving along a position strip (G1) ───────────────────
  function spatial(g, task) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐸']);
    var kind = pick(['lr', 'sweep', 'move']);
    var n, vals, hz, he;
    if (kind === 'lr') { n = 3; vals = tile([0, 2], 6); hz = '左边、右边轮流'; he = 'Left and right take turns'; }
    else if (kind === 'sweep') { n = 3; vals = tile([0, 1, 2], 7); hz = '从左到右走一遍，再回到左边'; he = 'Left to right, then back to the start'; }
    else { n = 5; vals = [0, 1, 2, 3, 4]; hz = '每次向右移动一格'; he = 'One step to the right each time'; }
    var len = vals.length;
    var idx = task === 'continue' ? len - 1 : ri(1, len - 2);
    var tok = function (k) { return 'ps:' + k + ':' + n + ':' + glyph; };
    var q = base(task, 'spatial', 'position', 'spatial_strip', hz, he);
    q.seq = vals.map(function (k, i) { return i === idx ? '?' : tok(k); });
    q.answer = tok(vals[idx]);
    var cells = []; for (var c = 0; c < n; c++) cells.push(c);
    q.options = optionsOf(q.answer, cells.map(tok), 3);
    return q;
  }

  // ── numeric progressions (numerical) ──────────────────────────────────────
  function numOpts(ans, step, lo, hi) {
    var cand = uniq([ans, ans + step, ans - step, ans + 1, ans - 1, ans + 2 * step].filter(function (v) { return v >= lo && v <= hi; }));
    return shuffle([ans].concat(shuffle(cand.filter(function (v) { return v !== ans; })).slice(0, 3)));
  }
  function numProg(g, task) {
    var vals, hint, hintEn, step;
    if (g === 'G1') {
      step = pick([1, 2, 3, 5]);
      var start = ri(0, 4);
      if (step * 4 + start > 20) start = 0;
      vals = [0, 1, 2, 3, 4].map(function (i) { return start + step * i; });
      hint = '每次加 ' + step; hintEn = 'Add ' + step + ' each time';
    } else {
      var mode = pick(['down', 'up', 'double']);
      if (mode === 'double') {
        var s0 = ri(1, 3); vals = [0, 1, 2, 3, 4].map(function (i) { return s0 * Math.pow(2, i); });
        step = vals[1] - vals[0]; hint = '每次乘 2'; hintEn = 'Double each time';
      } else if (mode === 'up') {
        step = pick([4, 6, 7, 8, 9, 10]); var s1 = ri(0, 20);
        vals = [0, 1, 2, 3, 4].map(function (i) { return s1 + step * i; });
        hint = '每次加 ' + step; hintEn = 'Add ' + step + ' each time';
      } else {
        step = pick([3, 4, 5, 6, 10]); var s2 = step * 4 + ri(0, 30);
        vals = [0, 1, 2, 3, 4].map(function (i) { return s2 - step * i; });
        hint = '每次减 ' + step; hintEn = 'Subtract ' + step + ' each time'; step = -step;
      }
    }
    var idx = task === 'continue' ? 4 : (g === 'G2' && Math.random() < 0.4 ? 0 : ri(1, 3));
    var q = base(task, 'numerical', 'numeral', 'num_progress', hint, hintEn);
    q.seq = vals.map(function (v, i) { return i === idx ? '?' : v; });
    q.answer = vals[idx];
    q.options = numOpts(vals[idx], Math.abs(step), 0, g === 'G1' ? 20 : 100);
    return q;
  }
  function numRepair(g) {
    var step = pick([3, 4, 5, 6, 10]), s = ri(0, 20);
    var vals = [0, 1, 2, 3, 4, 5].map(function (i) { return s + step * i; });
    var bi = ri(1, 4), bad = vals.slice();
    bad[bi] = vals[bi] + pick([1, 2, -1, -2]);
    var q = base('repair', 'numerical', 'numeral', 'num_progress', '找出打乱规律的数，再改对', 'Find the number that breaks the rule, then fix it');
    q.seq = bad; q.brokenIndex = bi; q.answer = vals[bi];
    q.options = numOpts(vals[bi], 1, 0, 100);
    return q;
  }

  // ── alternating: +a, -b (G2) ──────────────────────────────────────────────
  function altDiff(g, task) {
    var a = ri(2, 5), b = ri(1, a - 1), s = ri(3, 12), len = 6;
    var vals = [s];
    for (var i = 1; i < len; i++) vals.push(vals[i - 1] + (i % 2 === 1 ? a : -b));
    var idx = task === 'continue' ? len - 1 : ri(2, len - 2);
    var q = base(task, 'alternating', 'numeral', 'alt_diff', '先加 ' + a + '，再减 ' + b + '，轮流进行', 'Add ' + a + ', then subtract ' + b + ', in turn');
    q.seq = vals.map(function (v, i) { return i === idx ? '?' : v; });
    q.answer = vals[idx];
    q.options = numOpts(vals[idx], 1, 0, 100);
    return q;
  }

  // ── relational: input -> output (G2) ──────────────────────────────────────
  function ioRule(g) {
    for (var t = 0; t < 40; t++) {
      var kind = pick(['mul', 'add', 'sub']);
      var k = kind === 'mul' ? pick([2, 3, 5]) : ri(3, 15);
      var f = kind === 'mul' ? function (x) { return x * k; } : kind === 'add' ? function (x) { return x + k; } : function (x) { return x - k; };
      var xs = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]).filter(function (x) { return kind !== 'sub' || x > k; }).slice(0, 4);
      if (xs.length < 4) continue;
      var rows = xs.map(function (x) { return [x, f(x)]; });
      if (rows.some(function (r) { return r[1] < 0 || r[1] > 100; })) continue;
      var examples = rows.slice(0, 3), qx = rows[3][0], ans = rows[3][1];
      var preds = {};
      for (var d = 1; d <= 20; d++) {
        if (examples.every(function (r) { return r[0] + d === r[1]; })) preds[qx + d] = 1;
        if (examples.every(function (r) { return r[0] - d === r[1]; })) preds[qx - d] = 1;
      }
      for (var m = 2; m <= 6; m++) if (examples.every(function (r) { return r[0] * m === r[1]; })) preds[qx * m] = 1;
      if (Object.keys(preds).length !== 1 || !preds[ans]) continue;
      var q = base('complete', 'relational', 'numeral', 'io_rule',
        kind === 'mul' ? '每一行右边都是左边的 ' + k + ' 倍' : kind === 'add' ? '每一行右边都比左边多 ' + k : '每一行右边都比左边少 ' + k,
        kind === 'mul' ? 'The right side is always ' + k + ' times the left' : kind === 'add' ? 'The right side is always ' + k + ' more' : 'The right side is always ' + k + ' less');
      q.rows = examples.concat([[qx, '?']]);
      q.answer = ans;
      q.options = numOpts(ans, kind === 'mul' ? qx : k, 0, 100);
      return q;
    }
    return numProg('G2', 'complete');
  }


  // ── generic periodic helpers (repair / discover over a repeating unit) ────
  function periodicRepair(q, unit, alphabet, g, nOpts, hz, he) {
    var p = unit.length, full = tile(unit, p * 3);
    for (var t = 0; t < 60; t++) {
      var bi = ri(1, full.length - 1);
      var wrong = pick(alphabet.filter(function (x) { return !same(x, full[bi]); }));
      var bad = full.slice(); bad[bi] = wrong;
      var fixes = 0;
      for (var i = 0; i < bad.length; i++) alphabet.forEach(function (v) {
        var c = bad.slice(); c[i] = v;
        if (!same(v, bad[i]) && periodic(c, p)) fixes++;
      });
      if (fixes === 1) {
        q.task = 'repair'; q.seq = bad; q.brokenIndex = bi; q.answer = full[bi];
        q.options = optionsOf(full[bi], unit.concat(alphabet), nOpts);
        q.hintZh = hz || '找出打乱规律的那一个，再改对'; q.hintEn = he || 'Find the one that breaks the pattern, then fix it';
        return q;
      }
    }
    return null;
  }
  function periodicDiscover(q, unit, alphabet, reps) {
    var p = unit.length, full = tile(unit, p * reps), groups = [full], guard = 0;
    while (groups.length < 4 && guard++ < 80) {
      var d = full.slice(), at = ri(p, full.length - 1);
      d[at] = pick(alphabet.filter(function (x) { return !same(x, full[at]); }));
      if (!periodic(d, p) && !groups.some(function (x) { return x.join() === d.join(); })) groups.push(d);
    }
    var order = shuffle(groups.map(function (x, i) { return i; }));
    q.task = 'discover'; q.groups = order.map(function (i) { return { seq: groups[i] }; });
    q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
    return q;
  }
  function periodicBlank(q, unit, alphabet, task, nOpts) {
    var p = unit.length, n = p * 2 + 1, full = tile(unit, n);
    var idx = task === 'continue' ? n - 1 : ri(1, n - 2);
    q.task = task; q.seq = withBlank(full, idx); q.answer = full[idx];
    q.options = optionsOf(full[idx], unit.concat(alphabet), nOpts);
    return q;
  }

  // ── temporal: a natural loop (day/night, seasons, a day's routine) ────────
  function timeCycle(g, task) {
    var unit = pick(NATURAL[g]);
    var alpha = unit.concat(['☁️', '🌈', '🌊']);
    var q = base(task, 'repetition', 'temporal', 'cycle', '时间一圈一圈地重复', 'Time goes round and round');
    if (task === 'repair') { var r = periodicRepair(q, unit, alpha, g, 4); if (r) return r; task = 'complete'; }
    if (task === 'discover') return periodicDiscover(q, unit, alpha, 3);
    return periodicBlank(q, unit, alpha, task, 3);
  }

  // ── spatial extras: discover / repair on a position strip ─────────────────
  function spatialLoop(g, task) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐸']);
    var kind = pick(['lr', 'sweep']);
    var unit = (kind === 'lr' ? [0, 2] : [0, 1, 2]).map(function (k) { return 'ps:' + k + ':3:' + glyph; });
    var alpha = [0, 1, 2].map(function (k) { return 'ps:' + k + ':3:' + glyph; });
    var q = base(task, 'spatial', 'position', 'spatial_strip',
      kind === 'lr' ? '左边、右边轮流' : '从左到右走一遍，再回到左边',
      kind === 'lr' ? 'Left and right take turns' : 'Left to right, then back to the start');
    if (task === 'discover') return periodicDiscover(q, unit, alpha, kind === 'lr' ? 3 : 2);
    var r = periodicRepair(q, unit, alpha, g, 3); if (r) return r;
    return spatial(g, 'complete');
  }

  // ── growth repair (G1) ────────────────────────────────────────────────────
  function growRepair(g) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐟']), len = 5, start = ri(1, 3);
    var vals = []; for (var i = 0; i < len; i++) vals.push(start + i);
    var bi = ri(1, len - 2), bad = vals.slice();
    bad[bi] = pick([vals[bi] + 2, vals[bi] - 1, vals[bi] + 1].filter(function (v) { return v >= 1 && v <= 9 && vals.indexOf(v) < 0 || v === vals[bi] + 2; })) ;
    var q = base('repair', 'growth', 'count', 'growth_count', '每一格都多一个，找出数错的那格', 'One more each time — find the wrong one');
    q.seq = bad.map(function (v) { return 'ct:' + glyph + ':' + v; });
    q.brokenIndex = bi; q.answer = 'ct:' + glyph + ':' + vals[bi];
    q.options = countOpts(vals[bi], 1, 9).map(function (v) { return 'ct:' + glyph + ':' + v; });
    return q;
  }

  // ── growth discover (G1): which run really grows by one each step ────────
  function growDiscover(g) {
    var glyph = pick(['🔵', '🟢', '🟣', '🐟']), down = Math.random() < 0.4, d = down ? -1 : 1;
    var start = down ? ri(5, 7) : ri(1, 3), len = 4, good = [];
    for (var i = 0; i < len; i++) good.push(start + d * i);
    var groups = [good], guard = 0;
    while (groups.length < 4 && guard++ < 80) {
      var bad = good.slice(), at = ri(1, len - 1);
      bad[at] = pick([good[at] + 1, good[at] - 1, good[at] + 2].filter(function (v) { return v >= 1 && v <= 9 && v !== good[at]; }));
      var ok = false; for (var k = 1; k < len; k++) if (bad[k] - bad[k - 1] !== d) ok = true;
      if (ok && !groups.some(function (x) { return x.join() === bad.join(); })) groups.push(bad);
    }
    var order = shuffle(groups.map(function (x, i) { return i; }));
    var q = base('discover', 'growth', 'count', 'growth_count', down ? '看哪一组一格比一格少一个' : '看哪一组一格比一格多一个', down ? 'Find the run with one fewer each time' : 'Find the run with one more each time');
    q.groups = order.map(function (i) { return { seq: groups[i].map(function (v) { return 'ct:' + glyph + ':' + v; }) }; });
    q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
    return q;
  }

  // ── transformation: a stack of blocks changes by a fixed move ─────────────
  function stacks(rule) {
    var c = shuffle(['R', 'B', 'G', 'P']), c1 = c[0], c2 = c[1], out = [], base0, i;
    var rep = function (x, n) { var o = ''; for (var k = 0; k < n; k++) o += x; return o; };
    if (rule === 'add_top') {
      base0 = rep(c1, ri(1, 2));
      for (i = 0; i < 5; i++) out.push(base0 + rep(c2, i));
      return { seq: out, hz: '每次在最上面加一块' , he: 'Add one block on top each time' };
    }
    if (rule === 'remove_top') {
      base0 = rep(c1, 2) + rep(c2, 4);
      for (i = 0; i < 5; i++) out.push(base0.slice(0, base0.length - i));
      return { seq: out, hz: '每次拿走最上面一块', he: 'Take off the top block each time' };
    }
    if (rule === 'add_alt') {
      var cur = c1; out.push(cur);
      for (i = 1; i < 6; i++) { cur += (i % 2 === 1 ? c2 : c1); out.push(cur); }
      return { seq: out, hz: '每次加一块，颜色轮流', he: 'Add one block each time, the colour takes turns' };
    }
    // add_two
    cur = c1; out.push(cur);
    for (i = 1; i < 5; i++) { cur += rep(c2, 2); out.push(cur); }
    return { seq: out, hz: '每次加两块', he: 'Add two blocks each time' };
  }
  function stackWrongs(ans, c) {
    var last = ans[ans.length - 1], other = 'RBGP'.replace(last, '').split('').filter(function (x) { return ans.indexOf(x) < 0 || x !== last; });
    var cands = [ans.slice(0, -1) + pick('RBGP'.split('').filter(function (x) { return x !== last; })), ans + last, ans.slice(0, -1)];
    return uniq(cands.filter(function (x) { return x && x !== ans; }));
  }
  function transform(g, task, rule) {
    var st = stacks(rule), seq = st.seq, len = seq.length;
    var compound = rule === 'add_alt' || rule === 'add_two';
    var q = base(task, 'transformation', 'object', compound ? 'transform_compound' : 'transform_parts', st.hz, st.he);
    var tok = function (x) { return 'st:' + x; };
    if (task === 'discover') {
      var groups = [seq.slice(0, 4)], guard = 0, full = seq.slice(0, 4);
      while (groups.length < 4 && guard++ < 60) {
        var d = full.slice(), at = ri(1, 3);
        var w = stackWrongs(full[at]); if (!w.length) continue;
        d[at] = pick(w);
        if (!groups.some(function (x) { return x.join() === d.join(); })) groups.push(d);
      }
      var order = shuffle(groups.map(function (x, i) { return i; }));
      q.groups = order.map(function (i) { return { seq: groups[i].map(tok) }; });
      q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
      return q;
    }
    if (task === 'repair') {
      var bi = ri(1, len - 2), w2 = stackWrongs(seq[bi]);
      q.seq = seq.map(function (x, i) { return tok(i === bi ? pick(w2) : x); });
      q.brokenIndex = bi; q.answer = tok(seq[bi]);
      q.options = shuffle([q.answer].concat(shuffle(stackWrongs(seq[bi])).slice(0, 3)).map(function (x) { return x.indexOf('st:') === 0 ? x : tok(x); }));
      q.hintZh = '找出变错的那一个，再改对'; q.hintEn = 'Find the one that changed the wrong way, then fix it';
      return q;
    }
    var idx = task === 'continue' ? len - 1 : ri(1, len - 2);
    q.seq = seq.map(function (x, i) { return i === idx ? '?' : tok(x); });
    q.answer = tok(seq[idx]);
    q.options = shuffle([q.answer].concat(shuffle(stackWrongs(seq[idx])).slice(0, 3).map(tok)));
    return q;
  }


  // ── numerical discover (G1) ───────────────────────────────────────────────
  function numDiscover(g) {
    var step = pick([1, 2, 3, 5]), start = ri(0, 3), len = 5, good = [];
    for (var i = 0; i < len; i++) good.push(start + step * i);
    var groups = [good], guard = 0;
    while (groups.length < 4 && guard++ < 80) {
      var bad = good.slice(), at = ri(1, len - 1);
      bad[at] = pick([good[at] + 1, good[at] - 1, good[at] + 2].filter(function (v) { return v >= 0 && v <= 20 && v !== good[at]; }));
      var arith = true; for (var k = 2; k < len; k++) if (bad[k] - bad[k - 1] !== bad[1] - bad[0]) arith = false;
      if (!arith && !groups.some(function (x) { return x.join() === bad.join(); })) groups.push(bad);
    }
    var order = shuffle(groups.map(function (x, i) { return i; }));
    var q = base('discover', 'numerical', 'numeral', 'num_progress', '看哪一组每次加的数都一样', 'Find the run that adds the same number every time');
    q.groups = order.map(function (i) { return { seq: groups[i] }; });
    q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
    return q;
  }

  // ── relational discover / repair (G2): rows of input -> output ────────────
  function ioRuleSpec() {
    var kind = pick(['mul', 'add', 'sub']);
    var k = kind === 'mul' ? pick([2, 3, 5]) : ri(3, 15);
    var f = kind === 'mul' ? function (x) { return x * k; } : kind === 'add' ? function (x) { return x + k; } : function (x) { return x - k; };
    return { kind: kind, k: k, f: f, ok: function (x) { var y = f(x); return y >= 0 && y <= 100 && (kind !== 'sub' || x > k); } };
  }
  function ioRows(spec, n) {
    var xs = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]).filter(spec.ok).slice(0, n);
    return xs.length < n ? null : xs.map(function (x) { return [x, spec.f(x)]; });
  }
  function rowTok(r) { return r[0] + '→' + r[1]; }
  function ioDiscover(g) {
    for (var t = 0; t < 40; t++) {
      var spec = ioRuleSpec(), rows = ioRows(spec, 3); if (!rows) continue;
      var groups = [rows], guard = 0;
      while (groups.length < 4 && guard++ < 80) {
        var bad = rows.map(function (r) { return r.slice(); }), at = ri(0, 2);
        bad[at][1] = pick([bad[at][1] + 1, bad[at][1] + 2, bad[at][1] - 1].filter(function (v) { return v >= 0 && v <= 100; }));
        if (!groups.some(function (x) { return x.join() === bad.join(); })) groups.push(bad);
      }
      var order = shuffle(groups.map(function (x, i) { return i; }));
      var q = base('discover', 'relational', 'numeral', 'io_rule', '看哪一组的每一行都按同一个规则变', 'Find the group where every row follows the same rule');
      q.groups = order.map(function (i) { return { seq: groups[i].map(rowTok) }; });
      q.answer = order.indexOf(0) + 1; q.options = [1, 2, 3, 4];
      return q;
    }
    return numProg('G2', 'complete');
  }
  function ioRepair(g) {
    for (var t = 0; t < 40; t++) {
      var spec = ioRuleSpec(), rows = ioRows(spec, 4); if (!rows) continue;
      var bi = ri(0, 3), good = rows[bi].slice(), bad = rows.map(function (r) { return r.slice(); });
      bad[bi][1] = pick([good[1] + 1, good[1] + 2, good[1] - 1].filter(function (v) { return v >= 0 && v <= 100; }));
      var q = base('repair', 'relational', 'numeral', 'io_rule', '其中一行没按规则变，找出来再改对', 'One row breaks the rule — find it and fix it');
      q.seq = bad.map(rowTok); q.brokenIndex = bi; q.answer = rowTok(good);
      var opts = [rowTok(good), rowTok([good[0], good[1] + 1]), rowTok([good[0], good[1] - 1]), rowTok([good[0], good[1] + 2])];
      q.options = shuffle(uniq(opts.filter(function (o) { return o === rowTok(good) || o !== q.seq[bi]; }))).slice(0, 4);
      if (q.options.indexOf(q.answer) < 0) q.options[0] = q.answer;
      return q;
    }
    return numRepair('G2');
  }


  // ── explain (G2): which sentence states the rule? ────────────────────────
  // Not a seventh task: the item is a `discover`-style judgement whose
  // language_complexity is `explain`. Options are bilingual sentences keyed
  // 'r0'.. ; q.optText maps key -> [zh, en]; q.answer is a key.
  function explainPack(q, correct, wrongs) {
    var texts = uniq([correct].concat(wrongs).map(function (x) { return x.join('|'); })).map(function (x) { return x.split('|'); });
    var wrongOnly = texts.filter(function (t) { return t.join('|') !== correct.join('|'); });
    var all = shuffle([correct].concat(shuffle(wrongOnly).slice(0, 3)));
    q.explain = true; q.task = 'discover';
    q.optText = {}; q.options = all.map(function (t, i) { q.optText['r' + i] = t; return 'r' + i; });
    q.answer = q.options.filter(function (k) { return q.optText[k].join('|') === correct.join('|'); })[0];
    q.hintZh = '先看哪里在重复或在变化，再选说得对的那句话'; q.hintEn = 'Look at what repeats or changes, then pick the sentence that says it';
    return q;
  }
  function explainCycle() {
    var shape = pick(['AAB', 'ABB', 'ABC', 'AABB', 'AABC']);
    var pal = PAL[pick(['color', 'shape', 'object'])], unit = unitTokens(shape, pal.pool), p = unit.length;
    var seq = tile(unit, p * 3 - (p > 3 ? 0 : 0));
    var q = base('discover', 'repetition', pal.carrier, 'cycle', '', '');
    q.seq = seq;
    var wrongs = [], guard = 0;
    while (wrongs.length < 6 && guard++ < 80) {
      var shp = pick(['AB', 'AAB', 'ABB', 'ABC', 'AABB', 'AABC', 'ABAC']);
      var u2 = unitTokens(shp, pal.pool);
      if (u2.join() === unit.join()) continue;
      var t2 = tile(u2, seq.length);
      if (t2.join() === seq.join()) continue;
      wrongs.push([u2.join(''), u2.join('')]);
    }
    return explainPack(q, [unit.join(''), unit.join('')], wrongs);
  }
  function explainAlt() {
    var a = ri(2, 5), b = ri(1, a - 1), s0 = ri(3, 12), vals = [s0];
    for (var i = 1; i < 6; i++) vals.push(vals[i - 1] + (i % 2 === 1 ? a : -b));
    var q = base('discover', 'alternating', 'numeral', 'alt_diff', '', ''); q.seq = vals;
    return explainPack(q, ['先加 ' + a + '，再减 ' + b + '，轮流进行', 'Add ' + a + ', then subtract ' + b + ', in turn'], [
      ['每次都加 ' + a, 'Add ' + a + ' every time'],
      ['先加 ' + b + '，再减 ' + a + '，轮流进行', 'Add ' + b + ', then subtract ' + a + ', in turn'],
      ['每次都加 ' + (a - b), 'Add ' + (a - b) + ' every time'],
      ['每次都减 ' + b, 'Subtract ' + b + ' every time']]);
  }
  function explainGrow() {
    var glyph = pick(['🔵', '🟢', '🟣']), d = pick([1, 2]), s0 = ri(1, 2), seq = [];
    for (var i = 0; i < 4; i++) seq.push('ct:' + glyph + ':' + (s0 + d * i));
    var q = base('discover', 'growth', 'count', 'growth_count', '', ''); q.seq = seq;
    var wrong = [1, 2, 3].filter(function (x) { return x !== d; }).map(function (x) { return ['每次多 ' + x + ' 个', 'Each has ' + x + ' more']; });
    wrong.push(['一会儿多、一会儿少', 'Sometimes more, sometimes fewer']);
    return explainPack(q, ['每次多 ' + d + ' 个', 'Each has ' + d + ' more'], wrong);
  }
  function explainNum() {
    var kind = pick(['add', 'sub', 'double']), vals = [], correct, wrongs;
    if (kind === 'double') {
      var s0 = ri(1, 3); vals = [0, 1, 2, 3, 4].map(function (i) { return s0 * Math.pow(2, i); });
      var d1 = vals[1] - vals[0];
      correct = ['每次乘 2', 'Double each time'];
      wrongs = [['每次加 ' + d1, 'Add ' + d1 + ' each time'], ['每次乘 3', 'Multiply by 3 each time'], ['每次加 ' + (d1 + 1), 'Add ' + (d1 + 1) + ' each time']];
    } else if (kind === 'add') {
      var st = pick([3, 4, 5, 6, 10]), s1 = ri(0, 20); vals = [0, 1, 2, 3, 4].map(function (i) { return s1 + st * i; });
      correct = ['每次加 ' + st, 'Add ' + st + ' each time'];
      wrongs = [['每次加 ' + (st + 1), 'Add ' + (st + 1) + ' each time'], ['每次加 ' + (st - 1), 'Add ' + (st - 1) + ' each time'], ['每次减 ' + st, 'Subtract ' + st + ' each time'], ['每次乘 2', 'Double each time']];
    } else {
      var sd = pick([3, 4, 5, 6, 10]), s2 = sd * 4 + ri(0, 30); vals = [0, 1, 2, 3, 4].map(function (i) { return s2 - sd * i; });
      correct = ['每次减 ' + sd, 'Subtract ' + sd + ' each time'];
      wrongs = [['每次减 ' + (sd + 1), 'Subtract ' + (sd + 1) + ' each time'], ['每次减 ' + (sd - 1), 'Subtract ' + (sd - 1) + ' each time'], ['每次加 ' + sd, 'Add ' + sd + ' each time'], ['每次除以 2', 'Halve each time']];
    }
    var q = base('discover', 'numerical', 'numeral', 'num_progress', '', ''); q.seq = vals;
    return explainPack(q, correct, wrongs);
  }
  function explainIo() {
    for (var t = 0; t < 40; t++) {
      var spec = ioRuleSpec(), rows = ioRows(spec, 3); if (!rows) continue;
      var cands = [];
      [2, 3, 5].forEach(function (m) { cands.push({ zh: '右边是左边的 ' + m + ' 倍', en: 'The right is ' + m + ' times the left', f: function (x) { return x * m; } }); });
      for (var k = 1; k <= 15; k++) {
        cands.push({ zh: '右边比左边多 ' + k, en: 'The right is ' + k + ' more than the left', f: (function (k) { return function (x) { return x + k; }; })(k) });
        cands.push({ zh: '右边比左边少 ' + k, en: 'The right is ' + k + ' less than the left', f: (function (k) { return function (x) { return x - k; }; })(k) });
      }
      var holds = cands.filter(function (c) { return rows.every(function (r) { return c.f(r[0]) === r[1]; }); });
      if (holds.length !== 1) continue;
      var fails = cands.filter(function (c) { return !rows.every(function (r) { return c.f(r[0]) === r[1]; }); });
      var near = shuffle(fails.filter(function (c) { return rows.some(function (r) { return Math.abs(c.f(r[0]) - r[1]) <= 3; }); }));
      var pool = near.length >= 3 ? near : shuffle(fails);
      var q = base('discover', 'relational', 'numeral', 'io_rule', '', '');
      q.rows = rows;
      return explainPack(q, [holds[0].zh, holds[0].en], pool.slice(0, 5).map(function (c) { return [c.zh, c.en]; }));
    }
    return explainNum();
  }
  function explainStack() {
    var rules = ['add_top', 'remove_top', 'add_alt', 'add_two'], rule = pick(rules);
    var st = stacks(rule);
    var q = base('discover', 'transformation', 'object', rule === 'add_alt' || rule === 'add_two' ? 'transform_compound' : 'transform_parts', '', '');
    q.seq = st.seq.slice(0, 4).map(function (x) { return 'st:' + x; });
    var wrongs = rules.filter(function (r) { return r !== rule; }).map(function (r) { var o = stacks(r); return [o.hz, o.he]; });
    return explainPack(q, [st.hz, st.he], wrongs);
  }


  // ── letter / symbol carriers ──────────────────────────────────────────────
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function alphaRun(g, task) {
    var step = pick([1, 1, 2]), len = 5, start = ri(0, 25 - step * (len - 1));
    var vals = []; for (var i = 0; i < len; i++) vals.push(start + step * i);
    var idx = task === 'continue' ? len - 1 : ri(1, len - 2), tok = function (v) { return 'lt:' + ABC.charAt(v); };
    var q = base(task, 'numerical', 'letter', 'num_progress',
      step === 1 ? '字母表里，每次往后走 1 个' : '字母表里，每次隔一个往后走',
      step === 1 ? 'Move one letter along the alphabet each time' : 'Skip one letter along the alphabet each time');
    q.seq = vals.map(function (v, i) { return i === idx ? '?' : tok(v); });
    q.answer = tok(vals[idx]);
    var cand = uniq([vals[idx] + 1, vals[idx] - 1, vals[idx] + step, vals[idx] - step, vals[idx] + 2, vals[idx] - 2, vals[idx] + 3, vals[idx] - 3].filter(function (v) { return v >= 0 && v <= 25 && v !== vals[idx]; }));
    q.options = shuffle([q.answer].concat(shuffle(cand).slice(0, 3).map(tok)));
    return q;
  }

  // ── tables & calendar (spatial structure, carrier `table`) ────────────────
  function tblOpts(ans, sc, sr, cap) {
    var c = uniq([ans + sc, ans - sc, ans + sr, ans - sr, ans + 1, ans - 1].filter(function (v) { return v >= 0 && v <= cap && v !== ans; }));
    return shuffle([ans].concat(shuffle(c).slice(0, 3)));
  }
  function gridQ(task, ruleType, cells, cols, blankOk, ans, sc, sr, cap, hz, he) {
    var q = base(task, 'spatial', 'table', ruleType, hz, he);
    q.grid = { cols: cols };
    if (task === 'repair') {
      var bi = pick(blankOk), bad = cells.slice(), real = cells[bi];
      bad[bi] = pick([real + 1, real + 2, real - 1, real - 2].filter(function (v) { return v >= 0 && v <= cap && v !== real; }));
      q.seq = bad; q.brokenIndex = bi; q.answer = cells[bi];
      q.options = tblOpts(cells[bi], sc, sr, cap);
      q.hintZh = '横着看、竖着看，找出数错的那一格，再改对'; q.hintEn = 'Read across and down — find the wrong cell, then fix it';
      return q;
    }
    var bl = pick(blankOk);
    q.seq = cells.map(function (v, i) { return i === bl ? '?' : v; });
    q.answer = cells[bl]; q.options = tblOpts(cells[bl], sc, sr, cap);
    return q;
  }
  function tableRC(g, task) {
    var cap = g === 'G1' ? 20 : 100, cols, rows, sc, sr, st, ok = false;
    for (var t = 0; t < 80 && !ok; t++) {
      if (g === 'G1') { cols = pick([3, 4]); rows = 3; sc = pick([1, 2]); sr = pick([3, 4, 5, 6]); st = ri(0, 3); }
      else { cols = pick([4, 5]); rows = pick([3, 4]); sc = pick([1, 2, 5]); sr = pick([10, 20]); st = ri(1, 9); }
      ok = st + (rows - 1) * sr + (cols - 1) * sc <= cap;
    }
    var cells = [], idxs = [];
    for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) { cells.push(st + i * sr + j * sc); idxs.push(i * cols + j); }
    var q = gridQ(task, 'table_rc', cells, cols, idxs, 0, sc, sr, cap, '', '');
    q.hintZh = q.hintZh || '横着每次加 ' + sc + '，竖着每次加 ' + sr;
    q.hintEn = q.hintEn || 'Across: add ' + sc + ' each step. Down: add ' + sr + ' each step';
    return q;
  }
  function tableAdd(g, task) {
    var a0 = ri(1, 5), ac = pick([1, 2]), cols = 3, rows = pick([3, 4]), b0 = pick([10, 20]), bc = 10, cells = ['hd:+'], body = [], i, j;
    for (j = 0; j < cols; j++) cells.push('hd:' + (a0 + ac * j));
    for (i = 0; i < rows; i++) { cells.push('hd:' + (b0 + bc * i)); for (j = 0; j < cols; j++) cells.push(a0 + ac * j + b0 + bc * i); }
    for (i = 0; i < rows; i++) for (j = 0; j < cols; j++) body.push((i + 1) * (cols + 1) + j + 1);
    var q = gridQ(task, 'table_add', cells, cols + 1, body, 0, ac, bc, 100, '', '');
    q.hintZh = '每个格子 = 左边的数 + 上面的数'; q.hintEn = 'Each cell = the number on its left + the number above it';
    return q;
  }
  function calendar(g, task) {
    var s0 = pick([1, 8]), cells = [], body = [], r, c;
    for (c = 0; c < 7; c++) cells.push('wd:' + c);
    for (r = 0; r < 3; r++) for (c = 0; c < 7; c++) { body.push(cells.length); cells.push(s0 + r * 7 + c); }
    var q = gridQ(task, 'calendar', cells, 7, body, 0, 1, 7, 31, '', '');
    q.hintZh = '往右每格多 1，往下每格多 7（一周有 7 天）'; q.hintEn = 'Across: 1 more. Down: 7 more (a week has 7 days)';
    return q;
  }

  // ── per-grade slots (easy -> hard, each name draws fresh content) ─────────
  var MAKERS = {
    cycAB_cont:   function (g) { return cycle(g, 'AB', 'continue'); },
    cycAB_comp:   function (g) { return cycle(g, 'AB', 'complete'); },
    cycAAB_cont:  function (g) { return cycle(g, pick(['AAB', 'ABB']), 'continue'); },
    cycAAB_comp:  function (g) { return cycle(g, pick(['AAB', 'ABB']), 'complete'); },
    cycAB_disc:   function (g) { return cycle(g, 'AB', 'discover'); },
    sizeAB:       function (g) { return sizeAB(g, pick(['continue', 'complete'])); },
    cycABC_cont:  function (g) { return cycle(g, 'ABC', 'continue'); },
    cycABC_comp:  function (g) { return cycle(g, 'ABC', 'complete'); },
    cycAABB_cont: function (g) { return cycle(g, pick(['AABB', 'AABC']), 'continue'); },
    cycAABC_comp: function (g) { return cycle(g, pick(['AABB', 'AABC']), 'complete'); },
    cycAB_repair: function (g) { return cycle(g, pick(['AB', 'ABC']), 'repair'); },
    growCount_c:  function (g) { return growCount(g, 'continue', false); },
    growCount_m:  function (g) { return growCount(g, 'complete', false); },
    growSize:     function (g) { return growSize(g, pick(['continue', 'complete'])); },
    dual_cont:    function (g) { return dualAttr(g, 'continue'); },
    dual_comp:    function (g) { return dualAttr(g, 'complete'); },
    dual_disc:    function (g) { return dualAttr(g, 'discover'); },
    state_comp:   function (g) { return stateAlt(g, 'complete'); },
    state_repair: function (g) { return stateAlt(g, 'repair'); },
    state_disc:   function (g) { return stateAlt(g, 'discover'); },
    spatial_c:    function (g) { return spatial(g, 'continue'); },
    spatial_m:    function (g) { return spatial(g, 'complete'); },
    shrink:       function (g) { return growCount(g, pick(['continue', 'complete']), true); },
    num_cont:     function (g) { return numProg(g, 'continue'); },
    num_comp:     function (g) { return numProg(g, 'complete'); },
    num_repair:   function (g) { return numRepair(g); },
    alt_cont:     function (g) { return altDiff(g, 'continue'); },
    alt_comp:     function (g) { return altDiff(g, 'complete'); },
    grow_cyc_c:   function (g) { return growCycle(g, 'continue'); },
    grow_cyc_m:   function (g) { return growCycle(g, 'complete'); },
    io:           function (g) { return ioRule(g); },
    actionAB:     function (g) { return cycle(g, 'AB', pick(['continue', 'complete']), 'action'); },
    actionAAB:    function (g) { return cycle(g, pick(['AAB', 'ABB']), pick(['continue', 'complete']), 'action'); },
    actionABC:    function (g) { return cycle(g, 'ABC', 'continue', 'action'); },
    cycAAB_disc:  function (g) { return cycle(g, pick(['AAB', 'ABB']), 'discover'); },
    cycABC_disc:  function (g) { return cycle(g, 'ABC', 'discover'); },
    time_c:       function (g) { return timeCycle(g, pick(['continue', 'complete'])); },
    time_repair:  function (g) { return timeCycle(g, 'repair'); },
    growRepair:   function (g) { return growRepair(g); },
    growDisc:     function (g) { return growDiscover(g); },
    letterCyc:    function (g) { return cycle(g, pick(['AB', 'AAB', 'ABC']), pick(['continue', 'complete']), 'letter'); },
    symCyc:       function (g) { return cycle(g, pick(['AB', 'ABB', 'ABC']), 'continue', 'symbol'); },
    letterDisc:   function (g) { return cycle(g, 'ABC', 'discover', 'letter'); },
    letterRepair: function (g) { return cycle(g, pick(['AB', 'ABC']), 'repair', 'letter'); },
    alphaRun:     function (g) { return alphaRun(g, pick(['continue', 'complete'])); },
    tbl_c:        function (g) { return tableRC(g, 'complete'); },
    tbl_r:        function (g) { return tableRC(g, 'repair'); },
    tbl_add:      function (g) { return tableAdd(g, 'complete'); },
    cal_c:        function (g) { return calendar(g, 'complete'); },
    cal_r:        function (g) { return calendar(g, 'repair'); },
    ex_cycle:     function (g) { return explainCycle(); },
    ex_alt:       function (g) { return explainAlt(); },
    ex_grow:      function (g) { return explainGrow(); },
    ex_num:       function (g) { return explainNum(); },
    ex_io:        function (g) { return explainIo(); },
    ex_stack:     function (g) { return explainStack(); },
    num_disc:     function (g) { return numDiscover(g); },
    io_disc:      function (g) { return ioDiscover(g); },
    io_repair:    function (g) { return ioRepair(g); },
    spatial_disc: function (g) { return spatialLoop(g, 'discover'); },
    spatial_rep:  function (g) { return spatialLoop(g, 'repair'); },
    tr_add:       function (g) { return transform(g, 'continue', 'add_top'); },
    tr_remove:    function (g) { return transform(g, 'continue', 'remove_top'); },
    tr_disc:      function (g) { return transform(g, 'discover', pick(['add_top', 'remove_top'])); },
    tr_alt_m:     function (g) { return transform(g, 'complete', 'add_alt'); },
    tr_two_m:     function (g) { return transform(g, 'complete', 'add_two'); },
    tr_repair:    function (g) { return transform(g, 'repair', pick(['add_alt', 'add_two'])); }
  };

  // Themed units per grade (what the grade page lists). A unit draws 8 fresh
  // questions from its own slots each sitting; slots shorter than 8 repeat with
  // new content. unit id = '<grade>-<key>'.
  var GRADE_UNITS = {
    K1: [
      { key: 'repeat', icon: '🔁', zh: '看见重复', en: 'Seeing Repeats', dzh: '红蓝红蓝…下一个是什么？AB / AAB / ABB。', den: 'Red blue red blue… what comes next? AB / AAB / ABB.',
        slots: ['cycAB_cont', 'cycAB_comp', 'cycAB_cont', 'cycAAB_cont', 'cycAB_comp', 'cycAAB_comp', 'cycAAB_cont', 'cycAAB_comp'] },
      { key: 'find', icon: '🔍', zh: '找规律', en: 'Spot the Pattern', dzh: '几组里只有一组真的有规律，找出它。', den: 'Only one group follows a pattern — find it.',
        slots: ['cycAB_disc', 'cycAB_disc', 'cycAAB_disc', 'cycAB_disc', 'cycAAB_disc', 'cycAAB_disc', 'cycAB_disc', 'cycAAB_disc'] },
      { key: 'carrier', icon: '🎨', zh: '大小·动作·时间', en: 'Size, Action, Time', dzh: '规律藏在大小、动作和昼夜里。', den: 'Patterns hide in size, actions and day and night.',
        slots: ['sizeAB', 'actionAB', 'time_c', 'sizeAB', 'actionAAB', 'time_c', 'actionAB', 'actionAAB'] }
    ],
    K2: [
      { key: 'unit', icon: '🧩', zh: '整组重复', en: 'Whole-Unit Repeats', dzh: 'ABC / AABB / AABC，整组整组地重复。', den: 'ABC / AABB / AABC — a whole group repeats.',
        slots: ['cycABC_cont', 'cycAABB_cont', 'cycABC_comp', 'cycAABC_comp', 'cycABC_cont', 'cycAABB_cont', 'cycABC_comp', 'cycAABC_comp'] },
      { key: 'grow', icon: '📈', zh: '越来越多越来越大', en: 'Growing', dzh: '一个比一个多、一个比一个大。', den: 'Each one has more, each one is bigger.',
        slots: ['growCount_c', 'growSize', 'growCount_m', 'growCount_c', 'growSize', 'growCount_m', 'growSize', 'growCount_c'] },
      { key: 'letter', icon: '🔤', zh: '字母与符号', en: 'Letters and Symbols', dzh: 'A B A B… 和 + − + −…，字母符号也有规律。', den: 'A B A B… and + − + −… — letters and symbols repeat too.',
        slots: ['letterCyc', 'symCyc', 'letterCyc', 'symCyc', 'letterDisc', 'letterCyc', 'letterRepair', 'letterDisc'] },
      { key: 'fix', icon: '🛠️', zh: '找错与发现', en: 'Spot and Fix', dzh: '找出打乱规律的那一个，或挑出真规律。', den: 'Find the item that breaks the pattern, or pick the real one.',
        slots: ['cycAB_repair', 'cycABC_disc', 'cycAB_repair', 'cycABC_disc', 'actionABC', 'time_c', 'cycAB_repair', 'cycABC_disc'] }
    ],
    G1: [
      { key: 'two', icon: '🎭', zh: '两件事一起变', en: 'Two Things at Once', dzh: '颜色与形状同时变；两种状态轮流。', den: 'Colour and shape change together; two states take turns.',
        slots: ['dual_cont', 'state_comp', 'dual_comp', 'state_disc', 'dual_cont', 'state_repair', 'dual_comp', 'state_comp'] },
      { key: 'space', icon: '📍', zh: '位置的规律', en: 'Position Patterns', dzh: '左右、扫一遍、一格一格地移动。', den: 'Left-right, sweeping across, moving a step at a time.',
        slots: ['spatial_c', 'spatial_m', 'spatial_c', 'spatial_disc', 'spatial_m', 'spatial_c', 'spatial_disc', 'spatial_m'] },
      { key: 'change', icon: '🧱', zh: '增减与变换', en: 'More, Fewer, Changing', dzh: '越来越少、方块堆加一块拿一块。', den: 'Fewer and fewer; block stacks gaining or losing a block.',
        slots: ['shrink', 'tr_add', 'tr_remove', 'growRepair', 'growDisc', 'tr_disc', 'shrink', 'tr_add'] },
      { key: 'table', icon: '🔡', zh: '数表与字母', en: 'Tables and Letters', dzh: '横着看、竖着看，补出表里缺的数；字母表里数一数。', den: 'Read across and down to fill the table; count along the alphabet.',
        slots: ['tbl_c', 'alphaRun', 'tbl_c', 'tbl_r', 'alphaRun', 'tbl_c', 'tbl_r', 'alphaRun'] },
      { key: 'num', icon: '🔢', zh: '数的规律', en: 'Number Patterns', dzh: '20 以内的数列，以及时间的循环。', den: 'Number runs within 20, and loops of time.',
        slots: ['num_cont', 'num_comp', 'num_disc', 'time_c', 'num_cont', 'num_comp', 'num_disc', 'time_c'] }
    ],
    G2: [
      { key: 'compound', icon: '🧬', zh: '复合规律', en: 'Compound Rules', dzh: '先加后减；个数增长同时颜色轮换。', den: 'Add then subtract; the count grows while the colour cycles.',
        slots: ['alt_cont', 'grow_cyc_c', 'alt_comp', 'grow_cyc_m', 'dual_disc', 'alt_cont', 'grow_cyc_c', 'alt_comp'] },
      { key: 'change', icon: '🏗️', zh: '变换与位置', en: 'Transformations', dzh: '方块堆的复合变化，位置条带纠错。', den: 'Compound block-stack changes; fixing position strips.',
        slots: ['tr_alt_m', 'tr_two_m', 'spatial_rep', 'tr_repair', 'tr_alt_m', 'tr_two_m', 'spatial_rep', 'tr_repair'] },
      { key: 'io', icon: '🔀', zh: '输入→输出', en: 'Input to Output', dzh: '从例子里推出规则，再用它。', den: 'Work out the rule from examples, then use it.',
        slots: ['io', 'io_disc', 'io_repair', 'io', 'io_disc', 'io_repair', 'io', 'io_repair'] },
      { key: 'table', icon: '🗓️', zh: '数表与日历', en: 'Tables and Calendars', dzh: '加法表、100 以内的数表和日历里的规律。', den: 'Rules in addition tables, number tables and calendars.',
        slots: ['tbl_add', 'cal_c', 'tbl_c', 'cal_r', 'tbl_add', 'tbl_r', 'cal_c', 'cal_r'] },
      { key: 'explain', icon: '💬', zh: '说出规律', en: 'Say the Rule', dzh: '看一排，选出说对规律的那句话。', den: 'Look at a row and pick the sentence that states its rule.',
        slots: ['ex_cycle', 'ex_num', 'ex_grow', 'ex_alt', 'ex_stack', 'ex_io', 'ex_cycle', 'ex_num'] },
      { key: 'num', icon: '🔢', zh: '100 以内的数列', en: 'Number Runs to 100', dzh: '递减、倍增、空格在开头，纠错与时间。', den: 'Decreasing, doubling, blank at the start; repair and time.',
        slots: ['num_comp', 'num_repair', 'num_comp', 'time_repair', 'num_repair', 'num_comp', 'time_repair', 'num_repair'] }
    ]
  };

  function generate(grade, count, unitKey) {
    var units = GRADE_UNITS[grade] || GRADE_UNITS.K1;
    var u = units.filter(function (x) { return x.key === unitKey; })[0] || units[0];
    var out = [];
    for (var i = 0; i < count; i++) {
      var q = MAKERS[u.slots[i % u.slots.length]](grade);
      q.grade = grade;
      out.push(q);
    }
    return out;
  }

  return { generate: generate, GRADE_UNITS: GRADE_UNITS, MAKERS: MAKERS };
})();
