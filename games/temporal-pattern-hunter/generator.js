'use strict';

/**
 * Temporal Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * event-order  first three steps of a curated chain, predict the fourth.
 * day-season   five consecutive items of a 4-cycle starting anywhere, so the
 *              strip always wraps (…winter, spring…) — the point of the grade.
 * week         five consecutive days of the 7-cycle, blank anywhere.
 * clock        five hours on a 12-hour face, constant step, wrapping past 12.
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var TPH_GEN = (function () {

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

  function hour(h) { return ((h - 1) % 12 + 12) % 12 + 1; }

  function Options(cfg) { this.cfg = cfg; this.list = []; this.types = {}; }
  Options.prototype.add = function (v, t) {
    if (this.list.length < this.cfg.optionCount && this.list.indexOf(v) < 0) {
      this.list.push(v); this.types[v] = t;
    }
  };

  function eventQuestion(cfg, rnd, avoid) {
    var chains = TPH_DATA.chains.filter(function (c) { return c.id !== avoid; });
    var chain = pick(chains, rnd);
    var answer = chain.steps[3];
    var o = new Options(cfg);
    o.add(answer, 'correct');
    o.add(pick(chain.steps.slice(0, 2), rnd), 'wrong_order');
    var foreign = [];
    TPH_DATA.chains.forEach(function (c) {
      if (c.domain !== chain.domain) { foreign = foreign.concat(c.steps); }
    });
    shuffled(foreign, rnd).forEach(function (v) { o.add(v, 'irrelevant_event'); });
    return {
      layout: 'card', family: chain.id, cells: chain.steps.slice(0, 3).concat(['?']), blank: 3,
      answer: answer, o: o,
      hintZh: '先做了什么，又做了什么？接下来自然会发生什么？',
      hintEn: 'What happened first, then next? What naturally happens after that?'
    };
  }

  function cycleQuestion(cfg, rnd, avoid) {
    var names = cfg.cycles.length > 1 ? cfg.cycles.filter(function (c) { return c !== avoid; }) : cfg.cycles;
    var name = pick(names, rnd);
    var cyc = TPH_DATA.cycles[name];
    var n = cyc.length;
    var start = Math.floor(rnd() * n);
    var seq = [];
    for (var i = 0; i < cfg.shown; i++) { seq.push(cyc[(start + i) % n]); }
    var blank = cfg.blank === 'end' ? cfg.shown - 1 : Math.floor(rnd() * cfg.shown);
    var answer = seq[blank];
    var ai = cyc.indexOf(answer);
    var o = new Options(cfg);
    o.add(answer, 'correct');
    o.add(cyc[(ai + n - 1) % n], 'cycle_misalign');
    o.add(cyc[(ai + 1) % n], 'cycle_misalign');
    var other = Object.keys(TPH_DATA.cycles).filter(function (k) { return k !== name; });
    o.add(pick(TPH_DATA.cycles[pick(other, rnd)], rnd), 'category_confusion');
    var cells = seq.slice();
    cells[blank] = '?';
    return {
      layout: 'card', family: name, cells: cells, blank: blank, answer: answer, o: o,
      hintZh: name === 'week' ? '一星期七天，周日过后又是周一。' :
              name === 'season' ? '春夏秋冬，冬天过后又是春天。' : '早上、中午、傍晚、夜晚，夜晚过后又是早上。',
      hintEn: name === 'week' ? 'Seven days a week — after Sunday comes Monday again.' :
              name === 'season' ? 'Spring, summer, autumn, winter — after winter comes spring again.' :
              'Morning, noon, evening, night — after night comes morning again.'
    };
  }

  function clockQuestion(cfg, rnd) {
    var step = pick(cfg.steps, rnd);
    var start = 1 + Math.floor(rnd() * 12);
    var seq = [];
    for (var i = 0; i < cfg.shown; i++) { seq.push(hour(start + i * step)); }
    // Keep only strips that actually cross 12, the skill this grade adds.
    var wraps = seq.some(function (h, k) { return k > 0 && h < seq[k - 1]; });
    if (!wraps) { return null; }
    var blank = cfg.blank === 'end' ? cfg.shown - 1 : Math.floor(rnd() * cfg.shown);
    var answer = seq[blank];
    var o = new Options(cfg);
    o.add(answer, 'correct');
    o.add(hour(answer + 1), 'off_by_one');
    o.add(hour(answer - 1), 'off_by_one');
    o.add(hour(answer + step), 'overshoot');
    o.add(hour(answer - step), 'undershoot');
    var cells = seq.slice();
    cells[blank] = '?';
    return {
      layout: 'clock', family: 'step' + step, cells: cells, blank: blank, answer: answer, o: o,
      hintZh: '每次过 ' + step + ' 个小时，过了 12 点从 1 点接着数。',
      hintEn: step + ' hours pass each time; after 12, keep counting from 1.'
    };
  }

  function buildQuestion(gradeCode, rnd, avoid) {
    var cfg = TPH_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var b = null;
    for (var tries = 0; !b && tries < 50; tries++) {
      b = cfg.concept === 'event-order' ? eventQuestion(cfg, rnd, avoid)
        : cfg.concept === 'clock'       ? clockQuestion(cfg, rnd)
        : cycleQuestion(cfg, rnd, avoid);
    }
    if (!b) { return null; }
    return {
      gradeCode:   gradeCode,
      concept:     cfg.concept,
      layout:      b.layout,
      family:      b.family,
      cells:       b.cells,
      blankIndex:  b.blank,
      answer:      b.answer,
      options:     shuffled(b.o.list, rnd),
      optionTypes: b.o.types,
      hintZh:      b.hintZh,
      hintEn:      b.hintEn
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd, last && last.family);
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor, hour: hour };
}());
