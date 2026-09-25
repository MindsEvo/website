'use strict';

/**
 * Number Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * One item: five terms of an arithmetic sequence with one blanked. With five
 * terms, any blank leaves two consecutive visible terms, so the step — and
 * therefore the answer — is fixed. Every term stays within 0..cfg.max.
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var NPH_GEN = (function () {

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

  function buildOptions(answer, step, cfg, rnd) {
    var types = {};
    types[answer] = 'correct';
    var opts = [answer];
    function add(v, t) {
      if (opts.length < cfg.optionCount && v >= 0 && v <= cfg.max && opts.indexOf(v) < 0) {
        opts.push(v); types[v] = t;
      }
    }
    add(answer + step, 'too_far');          // one step past
    add(answer - step, 'unchanged_step');   // repeated the neighbour
    add(answer + 1, 'off_by_one');
    add(answer - 1, 'off_by_one');
    add(answer + 2 * step, 'too_far');
    for (var v = 0; opts.length < cfg.optionCount && v <= cfg.max; v++) { add(v, 'random'); }
    return { options: shuffled(opts, rnd), optionTypes: types };
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = NPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var mag = pick(cfg.steps, rnd);
    var dir = pick(cfg.dirs, rnd);
    var step = mag * dir;
    var span = mag * (cfg.length - 1);
    // Skip counting by 5 and 10 starts on a multiple, the way children learn it.
    var align = (mag === 5 || mag === 10) ? mag : 1;
    var lo = gradeCode === 'K1' ? 1 : 0;
    var hiStart = cfg.max - span;
    var starts = [];
    for (var s = lo; s <= hiStart; s++) { if (s % align === 0) { starts.push(s); } }
    var first = pick(starts, rnd);
    var seq = [];
    for (var i = 0; i < cfg.length; i++) { seq.push(first + i * mag); }
    if (dir < 0) { seq.reverse(); }

    var blank = cfg.blank === 'end' ? cfg.length - 1 : Math.floor(rnd() * cfg.length);
    var answer = seq[blank];
    var shown = seq.slice();
    shown[blank] = '?';
    var opt = buildOptions(answer, step, cfg, rnd);
    return {
      gradeCode:   gradeCode,
      step:        step,
      seq:         shown,
      blankIndex:  blank,
      answer:      answer,
      options:     opt.options,
      optionTypes: opt.optionTypes,
      hintZh:      '每次' + (dir > 0 ? '加 ' : '减 ') + mag,
      hintEn:      (dir > 0 ? 'Add ' : 'Subtract ') + mag + ' each time'
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (q && last && q.seq.join() === last.seq.join()) { q = buildQuestion(gradeCode, rnd); }
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
