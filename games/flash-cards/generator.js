'use strict';

/**
 * Flash Cards — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * One item: itemCount emoji cards from one category flash, then hide. The
 * child is asked whether they saw one particular card. Distractors come from
 * a different category (similarity: low, easy) or the same category
 * (similarity: high, hard); 'mixed' draws each distractor from either.
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var FC_GEN = (function () {

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

  function otherCategory(catNames, exclude, rnd) {
    var choices = catNames.filter(function (c) { return c !== exclude; });
    return pick(choices, rnd);
  }

  function buildOptions(shown, target, category, cfg, rnd) {
    var catNames = Object.keys(FC_DATA.categories);
    var types = {};
    types[target] = 'seen';
    var opts = [target];

    function addFrom(cat, tag) {
      var pool = FC_DATA.categories[cat].filter(function (e) { return opts.indexOf(e) < 0; });
      var candidate = pick(pool, rnd);
      if (candidate && opts.indexOf(candidate) < 0) { opts.push(candidate); types[candidate] = tag; }
    }

    while (opts.length < cfg.optionCount) {
      var useSame = cfg.similarity === 'high' ? true :
        cfg.similarity === 'low' ? false :
        rnd() < 0.5; // mixed
      var before = opts.length;
      if (useSame) { addFrom(category, 'same_category'); }
      else { addFrom(otherCategory(catNames, category, rnd), 'other_category'); }
      if (opts.length === before) { break; } // pool exhausted, avoid infinite loop
    }
    return { options: shuffled(opts, rnd), optionTypes: types };
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = FC_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var catNames = Object.keys(FC_DATA.categories);
    var category = pick(catNames, rnd);
    var shown = shuffled(FC_DATA.categories[category], rnd).slice(0, cfg.itemCount);
    var target = pick(shown, rnd);
    var opt = buildOptions(shown, target, category, cfg, rnd);
    return {
      gradeCode:   gradeCode,
      category:    category,
      shown:       shown,
      target:      target,
      exposureMs:  cfg.exposureMs,
      options:     opt.options,
      answer:      target,
      optionTypes: opt.optionTypes,
      hintZh:      '记住刚才闪过的卡片',
      hintEn:      'Remember the cards that just flashed'
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (q && last && q.shown.join() === last.shown.join() && q.target === last.target) {
        q = buildQuestion(gradeCode, rnd);
      }
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
