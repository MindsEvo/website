'use strict';

/**
 * Magic Sequence — Generator (MindSeeds · Memory Guardian)
 *
 * A sequence appears one item at a time and then disappears. The child rebuilds
 * it from memory. Higher grades add longer retention, interference and one
 * position update without turning the task into pattern prediction.
 */
var MS_GEN = (function () {
  var ITEMS = [
    { id: 'star', icon: '⭐', zh: '星星', en: 'Star' },
    { id: 'moon', icon: '🌙', zh: '月亮', en: 'Moon' },
    { id: 'sun', icon: '☀️', zh: '太阳', en: 'Sun' },
    { id: 'cloud', icon: '☁️', zh: '云朵', en: 'Cloud' },
    { id: 'rainbow', icon: '🌈', zh: '彩虹', en: 'Rainbow' },
    { id: 'heart', icon: '❤️', zh: '爱心', en: 'Heart' },
    { id: 'flower', icon: '🌸', zh: '花朵', en: 'Flower' },
    { id: 'leaf', icon: '🍃', zh: '叶子', en: 'Leaf' }
  ];

  var CFG = {
    K1: {
      count: 2,
      exposureMs: 900,
      gapMs: 180,
      retentionMs: 250,
      optionCount: 3,
      mode: 'rebuild'
    },
    K2: {
      count: 3,
      exposureMs: 800,
      gapMs: 180,
      retentionMs: 500,
      optionCount: 4,
      mode: 'rebuild'
    },
    G1: {
      count: 4,
      exposureMs: 700,
      gapMs: 150,
      retentionMs: 850,
      optionCount: 5,
      mode: 'rebuild'
    },
    G2: {
      count: 4,
      exposureMs: 650,
      gapMs: 140,
      retentionMs: 1100,
      optionCount: 5,
      mode: 'update'
    }
  };

  function rngFor(seed) {
    if (seed === undefined || seed === null) { return Math.random; }
    var s = (Number(seed) >>> 0) || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shuffled(list, rnd) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = CFG[gradeCode];
    if (!cfg) { return null; }

    var shown = shuffled(ITEMS, rnd).slice(0, cfg.count);
    var expected = shown.map(function (item) { return item.id; });
    var update = null;

    if (cfg.mode === 'update') {
      var index = Math.floor(rnd() * shown.length);
      var unused = ITEMS.filter(function (item) {
        return expected.indexOf(item.id) < 0;
      });
      var replacement = shuffled(unused, rnd)[0];
      update = {
        index: index,
        oldId: expected[index],
        newId: replacement.id,
        oldItem: shown[index],
        newItem: replacement
      };
      expected[index] = replacement.id;
    }

    var choices = expected.slice();
    shuffled(ITEMS, rnd).forEach(function (item) {
      if (choices.length < cfg.optionCount && choices.indexOf(item.id) < 0) {
        choices.push(item.id);
      }
    });

    return {
      gradeCode: gradeCode,
      mode: cfg.mode,
      shown: shown,
      expected: expected,
      update: update,
      exposureMs: cfg.exposureMs,
      gapMs: cfg.gapMs,
      retentionMs: cfg.retentionMs,
      choices: shuffled(choices, rnd),
      items: ITEMS,
      options: ['done'],
      answer: 'done',
      optionTypes: { done: 'sequential_recall' },
      key: gradeCode + ':' + shown.map(function (item) {
        return item.id;
      }).join(',') + ':' + expected.join(',')
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [];
    var seen = {};
    var guard = 0;

    while (out.length < count && guard++ < count * 50) {
      var question = buildQuestion(gradeCode, rnd);
      if (!question || seen[question.key]) { continue; }
      seen[question.key] = true;
      out.push(question);
    }
    return out;
  }

  return {
    ITEMS: ITEMS,
    CFG: CFG,
    generate: generate,
    buildQuestion: buildQuestion,
    rngFor: rngFor
  };
}());
