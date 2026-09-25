'use strict';

/**
 * Size Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rules, by construction unambiguous for the strips they produce:
 *   alternate  s1/s5 (either first) — period 2, ≥ 2 full periods before the end blank
 *   monotonic  one band per step, up or down — every blank is fixed by its neighbours
 *   cycle      a, a+1, a+2, a+1 — period 4, strip of 8 shows the whole wave twice
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var SPH_GEN = (function () {

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

  var S = function () { return SPH_DATA.sizes; };

  function sequenceFor(cfg, len, rnd) {
    var sizes = S();
    if (cfg.rule === 'alternate') {
      var pair = rnd() < 0.5 ? [0, 4] : [4, 0];
      var out = [];
      for (var i = 0; i < len; i++) { out.push(pair[i % 2]); }
      return { idx: out, direction: pair[0] === 0 ? 'small-first' : 'big-first' };
    }
    if (cfg.rule === 'monotonic') {
      var up = rnd() < 0.5;
      var start = up ? Math.floor(rnd() * (sizes.length - len + 1))
                     : (len - 1) + Math.floor(rnd() * (sizes.length - len + 1));
      var seq = [];
      for (var j = 0; j < len; j++) { seq.push(up ? start + j : start - j); }
      return { idx: seq, direction: up ? 'grow' : 'shrink' };
    }
    // cycle
    var a = Math.floor(rnd() * (sizes.length - 2));
    var wave = [a, a + 1, a + 2, a + 1];
    var off = Math.floor(rnd() * 4);
    var cyc = [];
    for (var k = 0; k < len; k++) { cyc.push(wave[(k + off) % 4]); }
    return { idx: cyc, direction: 'wave' };
  }

  function buildOptions(answerIdx, cfg, rnd) {
    var n = S().length;
    var types = {};
    var opts = [answerIdx];
    types[S()[answerIdx]] = 'correct';
    // Neighbouring bands first: they are the realistic misreads.
    var near = [answerIdx - 1, answerIdx + 1].filter(function (x) { return x >= 0 && x < n; });
    var far = [];
    for (var i = 0; i < n; i++) {
      if (i !== answerIdx && near.indexOf(i) < 0) { far.push(i); }
    }
    if (cfg.rule === 'alternate') {
      // K1: the other extreme and the middle band.
      opts = [answerIdx, answerIdx === 0 ? 4 : 0, 2];
      types[S()[opts[1]]] = 'pattern_misread';
      types[S()[2]] = 'random';
      return { options: shuffled(opts, rnd).map(function (x) { return S()[x]; }), optionTypes: types };
    }
    shuffled(near, rnd).forEach(function (x) {
      if (opts.length < cfg.optionCount) { opts.push(x); types[S()[x]] = 'adjacent_item'; }
    });
    shuffled(far, rnd).forEach(function (x) {
      if (opts.length < cfg.optionCount) { opts.push(x); types[S()[x]] = 'pattern_misread'; }
    });
    return { options: shuffled(opts, rnd).map(function (x) { return S()[x]; }), optionTypes: types };
  }

  var HINTS = {
    'small-first': { zh: '小、大、小、大……轮流出现。', en: 'Small, big, small, big… they take turns.' },
    'big-first':   { zh: '大、小、大、小……轮流出现。', en: 'Big, small, big, small… they take turns.' },
    grow:          { zh: '每次都变大一点。', en: 'Each one is a little bigger.' },
    shrink:        { zh: '每次都变小一点。', en: 'Each one is a little smaller.' },
    wave:          { zh: '小→中→大→中，再从头开始。', en: 'Small, medium, big, medium — then again.' }
  };

  function buildQuestion(gradeCode, rnd) {
    var cfg = SPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var len = cfg.length[0] + Math.floor(rnd() * (cfg.length[1] - cfg.length[0] + 1));
    var built = sequenceFor(cfg, len, rnd);
    var blank = cfg.blank === 'end' ? len - 1 : Math.floor(rnd() * len);
    var answerIdx = built.idx[blank];
    var sequence = built.idx.map(function (x) { return S()[x]; });
    sequence[blank] = '?';
    var opt = buildOptions(answerIdx, cfg, rnd);
    var hint = HINTS[built.direction];
    return {
      gradeCode:   gradeCode,
      rule:        cfg.rule,
      direction:   built.direction,
      sequence:    sequence,
      blankIndex:  blank,
      answer:      S()[answerIdx],
      options:     opt.options,
      optionTypes: opt.optionTypes,
      hintZh:      hint.zh,
      hintEn:      hint.en
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (q && last && q.sequence.join() === last.sequence.join()) { q = buildQuestion(gradeCode, rnd); }
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
