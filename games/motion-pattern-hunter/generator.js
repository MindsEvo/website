'use strict';

/**
 * Motion Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * direction / action  a repeating unit of distinct symbols, ≥ 2 full units
 *                     before the end blank.
 * fixed-step          positions p, p+s, p+2s on a track; next is p+3s.
 * growing-step        positions p, p+1, p+3, p+6 (hops 1,2,3); next hop is 4.
 *
 * Every option is a real cell on the track. Pass a `seed` for a reproducible
 * draw; the game does not pass one.
 */

var MPH_GEN = (function () {

  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function pick(list, rnd) { return list[Math.floor(rnd() * list.length)]; }

  function shuffled(list, rnd) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function symbolQuestion(cfg, rnd) {
    var vocab = Object.keys(cfg.channel === 'direction' ? MPH_DATA.dirs : MPH_DATA.acts);
    var shape = pick(cfg.shapes, rnd);
    var letters = shape.split('').filter(function (c, i, a) { return a.indexOf(c) === i; });
    var pool = shuffled(vocab, rnd);
    var map = {};
    letters.forEach(function (L, i) { map[L] = pool[i]; });
    var unit = shape.split('').map(function (L) { return map[L]; });
    var len = cfg.length[0] + Math.floor(rnd() * (cfg.length[1] - cfg.length[0] + 1));
    var cells = [];
    for (var i = 0; i < len; i++) { cells.push(unit[i % unit.length]); }
    var answer = cells[len - 1];
    cells[len - 1] = '?';

    var types = {};
    types[answer] = 'correct';
    var opts = [answer];
    pool.slice(0, letters.length).forEach(function (v) {
      if (v !== answer && opts.length < cfg.optionCount) { opts.push(v); types[v] = 'in_pattern'; }
    });
    pool.slice(letters.length).forEach(function (v) {
      if (opts.length < cfg.optionCount) { opts.push(v); types[v] = 'off_pattern'; }
    });
    var names = unit.map(function (v) {
      return cfg.channel === 'direction' ? MPH_DATA.dirs[v] : MPH_DATA.acts[v].zh;
    });
    var namesEn = unit.map(function (v) {
      return cfg.channel === 'direction' ? MPH_DATA.dirs[v] : MPH_DATA.acts[v].en;
    });
    return {
      layout: cfg.channel, shape: shape, cells: cells, answer: answer,
      options: shuffled(opts, rnd), optionTypes: types,
      hintZh: '重复的是：' + names.join(' '), hintEn: 'The repeating part: ' + namesEn.join(' ')
    };
  }

  function trackQuestion(cfg, rnd) {
    var n = cfg.visible[0];
    var hops = [];
    var step = pick(cfg.steps, rnd);
    for (var h = 0; h < n; h++) { hops.push(cfg.rule === 'growing-step' ? h + 1 : step); }
    // hops[0..n-2] are shown, hops[n-1] is the hop to the answer.
    var span = hops.reduce(function (a, b) { return a + b; }, 0);
    // Headroom: overshoot distractor (answer + 1) must still be on the track.
    var maxStart = cfg.trackSize - span - 1;
    var start = 1 + Math.floor(rnd() * Math.max(1, maxStart));
    var positions = [start];
    for (var k = 0; k < n - 1; k++) { positions.push(positions[k] + hops[k]); }
    var answer = positions[positions.length - 1] + hops[n - 1];
    var lastHop = hops[n - 2];

    var types = {};
    types[answer] = 'correct';
    var opts = [answer];
    function add(v, t) {
      if (opts.length < cfg.optionCount && v >= 1 && v <= cfg.trackSize && opts.indexOf(v) < 0 &&
          positions.indexOf(v) < 0) {
        opts.push(v); types[v] = t;
      }
    }
    if (cfg.rule === 'growing-step') { add(positions[positions.length - 1] + lastHop, 'unchanged_step'); }
    add(answer + 1, 'overshoot');
    add(answer - 1, 'undershoot');
    add(positions[positions.length - 1] + 1, 'one_step');
    for (var v = 1; opts.length < cfg.optionCount && v <= cfg.trackSize; v++) { add(v, 'random'); }

    return {
      layout: 'track', shape: cfg.rule === 'growing-step' ? 'grow+1' : 'step' + step,
      trackSize: cfg.trackSize, positions: positions, answer: answer,
      options: shuffled(opts, rnd), optionTypes: types,
      hintZh: cfg.rule === 'growing-step' ? '每一跳都比上一跳多 1 格。' : '每次都跳 ' + step + ' 格。',
      hintEn: cfg.rule === 'growing-step' ? 'Each hop is one cell longer than the last.' : 'Hop ' + step + ' cells each time.'
    };
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = MPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var q = cfg.channel === 'position' ? trackQuestion(cfg, rnd) : symbolQuestion(cfg, rnd);
    q.gradeCode = gradeCode;
    q.rule = cfg.rule;
    return q;
  }

  function signature(q) { return q.layout === 'track' ? q.positions.join() : q.cells.join(); }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (q && last && signature(q) === signature(last)) { q = buildQuestion(gradeCode, rnd); }
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
