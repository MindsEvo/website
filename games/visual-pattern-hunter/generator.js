'use strict';

/**
 * Visual Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * shape     a repeating unit (AB / AAB / ABB / ABC) of distinct shapes, ≥ 2 full
 *           units before the end blank.
 * rotation  an arrow turning a constant step (±90° or ±45°) each item. With
 *           ≥ 2 visible consecutive steps the direction is fixed, so any blank
 *           has exactly one consistent angle.
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var VPH_GEN = (function () {

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

  function mod360(a) { return ((a % 360) + 360) % 360; }

  function shapeQuestion(cfg, rnd) {
    var shape = pick(cfg.shapes, rnd);
    var letters = shape.split('').filter(function (c, i, a) { return a.indexOf(c) === i; });
    var pool = shuffled(VPH_DATA.shapes, rnd);
    var map = {};
    letters.forEach(function (L, i) { map[L] = pool[i]; });
    var unit = shape.split('').map(function (L) { return map[L]; });
    var seq = [];
    for (var i = 0; i < cfg.length; i++) { seq.push(unit[i % unit.length]); }
    var blank = cfg.length - 1;
    var answer = seq[blank];

    var types = {};
    types[answer] = 'correct';
    var opts = [answer];
    pool.slice(0, letters.length).forEach(function (s) {
      if (s !== answer && opts.length < cfg.optionCount) { opts.push(s); types[s] = 'in_pattern'; }
    });
    pool.slice(letters.length).forEach(function (s) {
      if (opts.length < cfg.optionCount) { opts.push(s); types[s] = 'off_pattern'; }
    });
    return {
      shape: shape, sequence: seq, blank: blank, answer: answer,
      options: shuffled(opts, rnd), optionTypes: types,
      hintZh: '重复的是：' + unit.map(function (s) { return VPH_NAMES[s].zh; }).join('、'),
      hintEn: 'The repeating part: ' + unit.map(function (s) { return VPH_NAMES[s].en; }).join(', ')
    };
  }

  function rotationQuestion(cfg, rnd) {
    var dir = rnd() < 0.5 ? 1 : -1;
    var step = cfg.step * dir;
    var start = cfg.step * Math.floor(rnd() * (360 / cfg.step));
    var seq = [];
    for (var i = 0; i < cfg.length; i++) { seq.push(mod360(start + i * step)); }
    var blank = cfg.blank === 'end' ? cfg.length - 1 : Math.floor(rnd() * cfg.length);
    var answer = seq[blank];

    var types = {};
    types[answer] = 'correct';
    var back = mod360(answer - 2 * step);          // turned the wrong way
    var stay = mod360(answer - step);              // did not turn
    var opposite = mod360(answer + 180);           // flipped
    var cands = [[back, 'direction_reversed'], [stay, 'no_turn'], [opposite, 'flipped'],
                 [mod360(answer + step), 'over_turned']];
    var opts = [answer];
    cands.forEach(function (c) {
      if (opts.length < cfg.optionCount && opts.indexOf(c[0]) < 0) { opts.push(c[0]); types[c[0]] = c[1]; }
    });
    return {
      shape: dir > 0 ? 'clockwise' : 'counterclockwise',
      sequence: seq, blank: blank, answer: answer,
      options: shuffled(opts, rnd), optionTypes: types,
      hintZh: '箭头每次' + (dir > 0 ? '顺时针' : '逆时针') + '转 ' + cfg.step + ' 度。',
      hintEn: 'The arrow turns ' + cfg.step + '° ' + (dir > 0 ? 'clockwise' : 'counterclockwise') + ' each time.'
    };
  }

  var VPH_NAMES = {
    circle:   { zh: '圆形',   en: 'circle' },
    square:   { zh: '正方形', en: 'square' },
    triangle: { zh: '三角形', en: 'triangle' },
    star:     { zh: '星形',   en: 'star' },
    diamond:  { zh: '菱形',   en: 'diamond' }
  };

  function buildQuestion(gradeCode, rnd) {
    var cfg = VPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var b = cfg.change === 'shape' ? shapeQuestion(cfg, rnd) : rotationQuestion(cfg, rnd);
    var sequence = b.sequence.slice();
    sequence[b.blank] = '?';
    return {
      gradeCode:   gradeCode,
      change:      cfg.change,
      shape:       b.shape,
      sequence:    sequence,
      blankIndex:  b.blank,
      answer:      b.answer,
      options:     b.options,
      optionTypes: b.optionTypes,
      hintZh:      b.hintZh,
      hintEn:      b.hintEn
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
