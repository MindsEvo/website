'use strict';

/**
 * Mixed Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rules per dimension (each fixes the blank on its own):
 *   constant     one value throughout
 *   alternate    A B A B … — the blank's phase is visible elsewhere
 *   cycle3       A B C A B C — strip of 6 shows each phase twice
 *   progressive  size / quantity one step up or down; direction a quarter turn
 *
 * Every wrong option breaks at least one dimension's rule, so exactly one
 * option is consistent. Pass a `seed` for a reproducible draw.
 */

var MXP_GEN = (function () {

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

  var DIMS = ['color', 'size', 'quantity', 'direction'];

  function nm(v, lang) { var n = MXP_DATA.names[v]; return n ? n[lang] : String(v); }

  /** { seq, wrong(blank), zh, en } for one dimension under one rule. */
  function track(dim, rule, len, rnd) {
    var vals = MXP_DATA.values[dim];
    var seq = [], i, zh, en, wrong;
    if (rule === 'constant') {
      var v = pick(vals, rnd);
      for (i = 0; i < len; i++) { seq.push(v); }
      wrong = function () { return pick(vals.filter(function (x) { return x !== v; }), rnd); };
      zh = '一直是' + nm(v, 'zh'); en = 'always ' + nm(v, 'en');
    } else if (rule === 'alternate' || rule === 'cycle3') {
      var k = rule === 'alternate' ? 2 : 3;
      var unit = shuffled(vals, rnd).slice(0, k);
      for (i = 0; i < len; i++) { seq.push(unit[i % k]); }
      // Phase slip: the value one beat later — the realistic misread.
      wrong = function (b) { return unit[(b + 1) % k]; };
      zh = unit.map(function (x) { return nm(x, 'zh'); }).join('、') + (k === 2 ? '交替' : '循环');
      en = unit.map(function (x) { return nm(x, 'en'); }).join('-') + (k === 2 ? ' alternating' : ' cycle');
    } else { // progressive
      var dir = rnd() < 0.5 ? 1 : -1;
      if (dim === 'direction') {
        var s0 = Math.floor(rnd() * 4);
        for (i = 0; i < len; i++) { seq.push(vals[((s0 + dir * i) % 4 + 4) % 4]); }
        zh = (dir > 0 ? '顺时针' : '逆时针') + '每次转一格'; en = 'a quarter turn ' + (dir > 0 ? 'clockwise' : 'counterclockwise') + ' each time';
      } else {
        var startIdx = dir > 0 ? Math.floor(rnd() * (vals.length - len + 1)) : len - 1 + Math.floor(rnd() * (vals.length - len + 1));
        for (i = 0; i < len; i++) { seq.push(vals[startIdx + dir * i]); }
        zh = dim === 'size' ? (dir > 0 ? '越来越大' : '越来越小') : (dir > 0 ? '越来越多' : '越来越少');
        en = dim === 'size' ? (dir > 0 ? 'getting bigger' : 'getting smaller') : (dir > 0 ? 'getting more' : 'getting fewer');
      }
      // Unchanged step: repeat the neighbour instead of taking one more step.
      wrong = function (b) { return seq[b > 0 ? b - 1 : b + 1]; };
    }
    return { seq: seq, wrong: wrong, zh: zh, en: en };
  }

  function assignDims(cfg, rnd, avoidKey) {
    for (var t = 0; t < 20; t++) {
      var d1, d2;
      if (cfg.rules[1] === 'progressive') {
        d2 = pick(MXP_DATA.progressive, rnd);
        d1 = pick(DIMS.filter(function (d) { return d !== d2; }), rnd);
      } else {
        var two = shuffled(DIMS, rnd).slice(0, 2);
        d1 = two[0]; d2 = two[1];
      }
      var key = [d1, d2].sort().join('+');
      if (key !== avoidKey || t === 19) { return [d1, d2]; }
    }
  }

  function buildQuestion(gradeCode, rnd, avoidKey) {
    var cfg = MXP_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var dims = assignDims(cfg, rnd, avoidKey);
    var len = cfg.length;
    var t1 = track(dims[0], cfg.rules[0], len, rnd);
    var t2 = track(dims[1], cfg.rules[1], len, rnd);
    var blank = cfg.blank === 'end' ? len - 1 : Math.floor(rnd() * len);

    function cell(a, b) { var c = {}; c[dims[0]] = a; c[dims[1]] = b; return c; }
    var cells = [];
    for (var i = 0; i < len; i++) { cells.push(i === blank ? '?' : cell(t1.seq[i], t2.seq[i])); }

    var a1 = t1.seq[blank], a2 = t2.seq[blank];
    var w1 = t1.wrong(blank), w2 = t2.wrong(blank);
    var defs = {
      opt_a: cell(a1, a2), opt_b: cell(w1, a2),
      opt_c: cell(a1, w2), opt_d: cell(w1, w2)
    };
    var types = { opt_a: 'both_correct', opt_b: 'dim1_wrong', opt_c: 'dim2_wrong', opt_d: 'both_wrong' };
    var n1 = MXP_DATA.names[dims[0]], n2 = MXP_DATA.names[dims[1]];
    return {
      gradeCode:   gradeCode,
      dimensions:  dims,
      dimKey:      dims.slice().sort().join('+'),
      rules:       cfg.rules.slice(),
      cells:       cells,
      blankIndex:  blank,
      answer:      'opt_a',
      options:     shuffled(['opt_a', 'opt_b', 'opt_c', 'opt_d'], rnd),
      optionDefs:  defs,
      optionTypes: types,
      dim1Name:    n1, dim2Name: n2,
      dim1Rule:    { zh: t1.zh, en: t1.en },
      dim2Rule:    { zh: t2.zh, en: t2.en },
      hintZh:      n1.zh + '：' + t1.zh + '。' + n2.zh + '：' + t2.zh + '。',
      hintEn:      n1.en + ': ' + t1.en + '. ' + n2.en + ': ' + t2.en + '.'
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd, last && last.dimKey);
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
