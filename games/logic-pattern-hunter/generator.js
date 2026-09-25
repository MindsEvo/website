'use strict';

/**
 * Logic Pattern Hunter — session GENERATOR (MindSeeds)
 * ─────────────────────────────────────────────────────────────────────────────
 * One item: n children in a hidden total order, n-1 premises "order[i] > order[i+1]"
 * (always in the relation's positive word), and one question. A chain of
 * adjacent pairs fixes the whole order, so every question has exactly one answer.
 *
 * `order[0]` is the most (tallest / fastest / oldest). Options are all n
 * children, so a wrong pick always names a real rank the child misread.
 *
 * Pass a `seed` for a reproducible draw; the game does not pass one.
 */

var LP_GEN = (function () {

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

  function fill(tpl, map) {
    return tpl.replace(/\{(\w+)\}/g, function (_, k) { return map[k]; });
  }

  function label(p, lang) { return p.e + p[lang]; }

  function buildQuestion(gradeCode, rnd, avoidRel) {
    var cfg = LP_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }
    var relIds = Object.keys(LP_DATA.relations).filter(function (r) { return r !== avoidRel; });
    var relId = pick(relIds, rnd);
    var rel = LP_DATA.relations[relId];
    var idx = shuffled(LP_DATA.people.map(function (_, i) { return i; }), rnd).slice(0, cfg.people);
    var order = idx.map(function (i) { return LP_DATA.people[i]; });
    var n = order.length;

    var premises = [];
    for (var i = 0; i < n - 1; i++) {
      premises.push({
        zh: fill(rel.premZh, { a: label(order[i], 'zh'), b: label(order[i + 1], 'zh') }),
        en: fill(rel.premEn, { a: label(order[i], 'en'), b: label(order[i + 1], 'en') })
      });
    }
    if (cfg.order === 'shuffled') {
      // Never leave the premises in chain order by accident: that is G1's shape.
      var s;
      do { s = shuffled(premises, rnd); } while (s.every(function (p, k) { return p === premises[k]; }));
      premises = s;
    }

    var polarity, text, rank; // rank is 0-based from the top of `order`
    if (cfg.form === 'same-word') {
      polarity = 'pos'; rank = 0;
      text = { zh: rel.pos.cmpZh, en: rel.pos.cmpEn };
    } else if (cfg.form === 'opposite-word') {
      polarity = 'neg'; rank = n - 1;
      text = { zh: rel.neg.cmpZh, en: rel.neg.cmpEn };
    } else if (cfg.form === 'extreme') {
      polarity = rnd() < 0.5 ? 'pos' : 'neg';
      rank = polarity === 'pos' ? 0 : n - 1;
      text = { zh: rel[polarity].supZh, en: rel[polarity].supEn };
    } else {
      polarity = rnd() < 0.5 ? 'pos' : 'neg';
      var k = pick([2, 3], rnd);
      var ord = LP_DATA.ordinals[k];
      rank = polarity === 'pos' ? k - 1 : n - k;
      text = { zh: fill(rel[polarity].rankZh, { n: ord.zh }), en: fill(rel[polarity].rankEn, { n: ord.en }) };
    }

    var options = [], optionDefs = {}, optionTypes = {};
    order.forEach(function (p, r) {
      var id = 'p' + idx[r];
      options.push(id);
      optionDefs[id] = { e: p.e, zh: p.zh, en: p.en };
      var dist = Math.abs(r - rank);
      optionTypes[id] = dist === 0 ? 'correct'
        : (r === 0 || r === n - 1) && dist === n - 1 ? 'wrong_end'
        : dist === 1 ? 'adjacent_rank' : 'middle_item';
    });

    return {
      gradeCode:   gradeCode,
      form:        cfg.form,
      relation:    relId,
      polarity:    polarity,
      premises:    premises,
      questionZh:  text.zh,
      questionEn:  text.en,
      answer:      'p' + idx[rank],
      options:     shuffled(options, rnd),
      optionDefs:  optionDefs,
      optionTypes: optionTypes,
      hintZh:      rel.orderZh + '：' + order.map(function (p) { return p.zh; }).join(' → '),
      hintEn:      rel.orderEn + ': ' + order.map(function (p) { return p.en; }).join(' → ')
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd, last && last.relation);
      if (!q) { return out; }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
