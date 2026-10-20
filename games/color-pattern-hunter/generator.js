'use strict';

/**
 * Color Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * One item: a strip that repeats a unit (shape template filled with distinct
 * colors, or distinct color PAIRS at G2). Three task forms share that strip:
 *   fill     one element is blanked and the child fills it (补全)
 *   predict  the strip is complete and the child continues it (预测)
 *   spot     one element was swapped and the child finds it (识别)
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

  // Every question is played on a board (interactive): the child tries, the board
  // shows what the try leads to, and the child may try again. `answer`/`options`
  // only feed the shell; the real target lives in `target`/`full`.
  function wrap(q) {
    q.interactive = true;
    q.options = ['done'];
    q.answer = 'done';
    q.optionTypes = { done: 'color_pattern' };
    return q;
  }

  function lengthFor(cfg, u, rnd) {
    var len = cfg.length[0] + Math.floor(rnd() * (cfg.length[1] - cfg.length[0] + 1));
    return Math.max(len, cfg.blank === 'end' ? 2 * u + 1 : 2 * u);
  }

  function buildFill(gradeCode, rnd) {
    var cfg = CPH_DATA.gradeConfig[gradeCode];
    var shape = pick(cfg.shapes, rnd);
    var u = shape.length;
    var fill = fillShape(shape, cfg.element, rnd);
    var len = lengthFor(cfg, u, rnd);

    var seq = [];
    for (var i = 0; i < len; i++) { seq.push(fill.unit[i % u]); }
    var blankIdx = cfg.blank === 'end' ? len - 1 : Math.floor(rnd() * len);
    var answer = seq[blankIdx];
    var cells = seq.slice();
    cells[blankIdx] = null;

    var opt = cfg.element === 'pair'
      ? pairOptions(answer, fill, rnd)
      : singleOptions(answer, fill, cfg.optionCount, rnd);

    return wrap({
      gradeCode: gradeCode, form: 'fill', shape: shape, layout: cfg.element === 'pair' ? 'pair' : 'linear',
      unit: fill.unit, cells: cells, full: seq, blankIndex: blankIdx, target: answer,
      choices: opt.options, choiceTypes: opt.optionTypes
    });
  }

  function buildPredict(gradeCode, rnd) {
    var cfg = CPH_DATA.gradeConfig[gradeCode];
    var shape = pick(cfg.shapes, rnd);
    var u = shape.length;
    var fill = fillShape(shape, cfg.element, rnd);
    var shownLen = Math.max(cfg.length[0] + Math.floor(rnd() * (cfg.length[1] - cfg.length[0] + 1)), 2 * u + (cfg.element === 'pair' ? 0 : 1));
    var m = gradeCode === 'K1' || cfg.element === 'pair' ? 2 : 3;
    var full = [];
    for (var i = 0; i < shownLen + m; i++) { full.push(fill.unit[i % u]); }

    var choices;
    if (cfg.element === 'pair') {
      var ps = [], seen = {};
      fill.unit.forEach(function (p) { if (!seen[keyOf(p)]) { seen[keyOf(p)] = 1; ps.push(p); } });
      choices = ps.concat([[ps[0][1], ps[0][0]], [ps[0][0], fill.spare[0]]]).slice(0, 4);
    } else {
      choices = fill.used.concat(fill.spare).slice(0, Math.max(fill.used.length, cfg.optionCount));
    }
    return wrap({
      gradeCode: gradeCode, form: 'predict', shape: shape, layout: cfg.element === 'pair' ? 'pair' : 'linear',
      unit: fill.unit, cells: full.slice(0, shownLen), full: full, need: m, target: full.slice(shownLen),
      choices: shuffled(choices, rnd)
    });
  }

  // Three full repeats with exactly one element swapped: the other two repeats show the unit.
  function buildSpot(gradeCode, rnd) {
    var cfg = CPH_DATA.gradeConfig[gradeCode];
    var shape = pick(cfg.spotShapes, rnd);
    var u = shape.length;
    var fill = fillShape(shape, 'single', rnd);
    var full = [];
    for (var i = 0; i < 3 * u; i++) { full.push(fill.unit[i % u]); }
    var bad = Math.floor(rnd() * full.length);
    var pool = fill.used.concat(fill.spare.slice(0, 1)).filter(function (c) { return c !== full[bad]; });
    var cells = full.slice();
    cells[bad] = pick(pool, rnd);
    return wrap({
      gradeCode: gradeCode, form: 'spot', shape: shape, layout: 'linear',
      unit: fill.unit, cells: cells, full: full, badIndex: bad
    });
  }

  var MAKE = { fill: buildFill, predict: buildPredict, spot: buildSpot };

  function buildQuestion(gradeCode, rnd, form) {
    var cfg = CPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    return MAKE[form || 'fill'](gradeCode, rnd);
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var cfg = CPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return []; }
    var forms = [];
    Object.keys(cfg.forms).forEach(function (f) { for (var i = 0; i < cfg.forms[f]; i++) { forms.push(f); } });
    forms = shuffled(forms, rnd).slice(0, count);
    while (forms.length < count) { forms.push('fill'); }
    var out = [], seen = {};
    forms.forEach(function (f) {
      var q = null;
      for (var t = 0; t < 12; t++) {                       // avoid an identical strip twice in a session
        q = buildQuestion(gradeCode, rnd, f);
        var key = f + JSON.stringify(q.cells);
        if (!seen[key]) { seen[key] = 1; break; }
      }
      out.push(q);
    });
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor, keyOf: keyOf };
}());
