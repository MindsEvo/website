'use strict';

/**
 * Quantity Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * alternate  two distinct counts taking turns, ≥ 2 full periods before the blank
 * monotonic  constant ±step; ≥ 3 visible items fix the step for any blank
 * cycle      three distinct counts (ABC), strip of 7 shows every phase twice
 *
 * Counts stay within 1..cfg.max (options included), so no item needs "empty".
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var QPH_GEN = (function () {

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

  function range(lo, hi) { var o = []; for (var i = lo; i <= hi; i++) { o.push(i); } return o; }

  function sequenceFor(cfg, len, rnd) {
    if (cfg.rule === 'alternate') {
      var pair = shuffled(range(1, cfg.max), rnd).slice(0, 2);
      var alt = [];
      for (var i = 0; i < len; i++) { alt.push(pair[i % 2]); }
      return { seq: alt, direction: pair[0] > pair[1] ? 'more-first' : 'fewer-first', inPattern: pair };
    }
    if (cfg.rule === 'monotonic') {
      var up = rnd() < 0.5;
      var span = cfg.step * (len - 1);
      // Leave one step of headroom so the "one step too far" distractor stays in range.
      var lo = 1 + cfg.step, hi = cfg.max - cfg.step - span;
      var start = lo <= hi ? lo + Math.floor(rnd() * (hi - lo + 1)) : 1;
      var mono = [];
      for (var j = 0; j < len; j++) { mono.push(start + j * cfg.step); }
      if (!up) { mono.reverse(); }
      return { seq: mono, direction: up ? 'grow' : 'shrink', inPattern: mono };
    }
    var trio = shuffled(range(1, cfg.max), rnd).slice(0, 3);
    var cyc = [];
    for (var k = 0; k < len; k++) { cyc.push(trio[k % 3]); }
    return { seq: cyc, direction: 'cycle', inPattern: trio };
  }

  function buildOptions(answer, built, cfg, rnd) {
    var types = {};
    types[answer] = 'correct';
    var opts = [answer];
    function add(v, t) {
      if (opts.length < cfg.optionCount && v >= 1 && v <= cfg.max && opts.indexOf(v) < 0) {
        opts.push(v); types[v] = t;
      }
    }
    if (cfg.rule === 'monotonic') {
      var d = built.seq[1] - built.seq[0];
      add(answer - d, 'unchanged_step');                  // repeated the previous count
      add(answer + d, 'too_far');                         // went one step too far
      add(answer + (d > 0 ? 1 : -1), 'step_misread');     // counted by one instead of by step
      add(answer - (d > 0 ? 1 : -1), 'step_misread');
    } else {
      built.inPattern.forEach(function (v) { add(v, 'in_pattern'); });
    }
    shuffled(range(1, cfg.max), rnd).forEach(function (v) { add(v, 'off_pattern'); });
    return { options: shuffled(opts, rnd), optionTypes: types };
  }

  var HINTS = {
    'more-first':  { zh: '多、少、多、少……轮流出现。', en: 'More, fewer, more, fewer… they take turns.' },
    'fewer-first': { zh: '少、多、少、多……轮流出现。', en: 'Fewer, more, fewer, more… they take turns.' },
    grow:          { zh: '每一步都多了同样的数量。', en: 'Each step adds the same amount.' },
    shrink:        { zh: '每一步都少了同样的数量。', en: 'Each step takes away the same amount.' },
    cycle:         { zh: '三种数量按顺序重复。', en: 'Three amounts repeat in order.' }
  };

  function buildQuestion(gradeCode, rnd, avoidAsset) {
    var cfg = QPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var len = cfg.length[0] + Math.floor(rnd() * (cfg.length[1] - cfg.length[0] + 1));
    var built = sequenceFor(cfg, len, rnd);
    var blank = cfg.blank === 'end' ? len - 1 : Math.floor(rnd() * len);
    var answer = built.seq[blank];
    var opt = buildOptions(answer, built, cfg, rnd);
    var assets = Object.keys(QPH_DATA.assets).filter(function (a) { return a !== avoidAsset; });
    var sequence = built.seq.slice();
    sequence[blank] = '?';
    var hint = HINTS[built.direction];
    return {
      gradeCode:   gradeCode,
      rule:        cfg.rule,
      direction:   built.direction,
      asset:       pick(assets, rnd),
      sequence:    sequence,
      blankIndex:  blank,
      answer:      answer,
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
      var q = buildQuestion(gradeCode, rnd, last && last.asset);
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
