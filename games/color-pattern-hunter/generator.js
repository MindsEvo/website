'use strict';

/**
 * Color Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * One item: a strip that repeats a unit (shape template filled with distinct
 * colors, or distinct color PAIRS at G2) with exactly one element blanked.
 *
 * The answer is unambiguous by construction: the strip is long enough that the
 * blank's phase inside the unit is visible elsewhere — ≥ 2 full units before an
 * end blank, ≥ 2 full units in total for a mid-strip blank — and every shape's
 * minimal period is its own length (no AB-within-ABAB collapse).
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var CPH_GEN = (function () {

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

  function keyOf(el) { return Array.isArray(el) ? el.join(',') : el; }

  function nameOf(el, lang) {
    var p = CPH_DATA.palette;
    if (Array.isArray(el)) {
      return lang === 'zh' ? '(' + p[el[0]].zh + p[el[1]].zh + ')'
                           : '(' + p[el[0]].en + '-' + p[el[1]].en + ')';
    }
    return p[el][lang];
  }

  /** Map each distinct letter of `shape` to a distinct element. */
  function fillShape(shape, element, rnd) {
    var letters = shape.split('').filter(function (c, i, a) { return a.indexOf(c) === i; });
    var colors = shuffled(Object.keys(CPH_DATA.palette), rnd);
    var map = {};
    letters.forEach(function (L, i) {
      map[L] = element === 'pair' ? [colors[2 * i], colors[2 * i + 1]] : colors[i];
    });
    return {
      unit: shape.split('').map(function (L) { return map[L]; }),
      used: element === 'pair' ? colors.slice(0, 2 * letters.length) : colors.slice(0, letters.length),
      spare: element === 'pair' ? colors.slice(2 * letters.length) : colors.slice(letters.length)
    };
  }

  function singleOptions(answer, fill, count, rnd) {
    var types = {};
    types[answer] = 'correct';
    var inPattern = fill.used.filter(function (c) { return c !== answer; });
    var opts = [answer];
    shuffled(inPattern, rnd).forEach(function (c) {
      if (opts.length < count) { opts.push(c); types[c] = 'in_pattern'; }
    });
    shuffled(fill.spare, rnd).forEach(function (c) {
      if (opts.length < count) { opts.push(c); types[c] = 'off_pattern'; }
    });
    return { options: shuffled(opts, rnd), optionTypes: types };
  }

  function pairOptions(answer, fill, rnd) {
    var other = fill.unit.filter(function (p) { return keyOf(p) !== keyOf(answer); })[0];
    var reversed = [answer[1], answer[0]];
    var halfWrong = [answer[0], pick(fill.spare, rnd)];
    var types = {};
    types[keyOf(answer)] = 'correct';
    types[keyOf(reversed)] = 'order_reversed';
    types[keyOf(other)] = 'rule_error';
    types[keyOf(halfWrong)] = 'half_wrong';
    return { options: shuffled([answer, reversed, other, halfWrong], rnd), optionTypes: types };
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = CPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    var shape = pick(cfg.shapes, rnd);
    var u = shape.length;
    var fill = fillShape(shape, cfg.element, rnd);

    var len = cfg.length[0] + Math.floor(rnd() * (cfg.length[1] - cfg.length[0] + 1));
    len = Math.max(len, cfg.blank === 'end' ? 2 * u + 1 : 2 * u);

    var seq = [];
    for (var i = 0; i < len; i++) { seq.push(fill.unit[i % u]); }
    var blankIdx = cfg.blank === 'end' ? len - 1 : Math.floor(rnd() * len);
    var answer = seq[blankIdx];

    var cells = seq.slice();
    cells[blankIdx] = null;

    var opt = cfg.element === 'pair'
      ? pairOptions(answer, fill, rnd)
      : singleOptions(answer, fill, cfg.optionCount, rnd);

    var unitZh = fill.unit.map(function (e) { return nameOf(e, 'zh'); }).join('');
    var unitEn = fill.unit.map(function (e) { return nameOf(e, 'en'); }).join('-');

    return {
      gradeCode:   gradeCode,
      shape:       shape,
      layout:      cfg.element === 'pair' ? 'pair' : 'linear',
      cells:       cells,
      blankIndex:  blankIdx,
      answer:      answer,
      options:     opt.options,
      optionTypes: opt.optionTypes,
      hintZh:      '重复单元是：' + unitZh,
      hintEn:      'Repeating unit: ' + unitEn
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], lastShape = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      // Re-draw once to avoid the same shape twice in a row when alternatives exist.
      if (q && q.shape === lastShape && CPH_DATA.gradeConfig[gradeCode].shapes.length > 1) {
        q = buildQuestion(gradeCode, rnd);
      }
      if (!q) { return out; }
      out.push(q);
      lastShape = q.shape;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor, keyOf: keyOf };
}());
