'use strict';

/**
 * Remember & Act — Generator (MindSeeds · Memory Guardian)
 *
 * The instruction is visible only during exposure. The child then performs it
 * from memory. K1-K2 preserve the shown order, G1 reverses it, and G2 applies
 * a rule update after the original sequence has disappeared.
 */
var RA_GEN = (function () {
  var ACTIONS = [
    { id: 'clap', icon: '👏', zh: '拍手', en: 'Clap' },
    { id: 'jump', icon: '🦘', zh: '跳一下', en: 'Jump' },
    { id: 'turn', icon: '🔄', zh: '转一圈', en: 'Turn' },
    { id: 'wave', icon: '👋', zh: '挥手', en: 'Wave' },
    { id: 'stomp', icon: '👣', zh: '跺脚', en: 'Stomp' },
    { id: 'touch', icon: '👃', zh: '摸鼻子', en: 'Touch nose' },
    { id: 'nod', icon: '🙂', zh: '点点头', en: 'Nod' },
    { id: 'squat', icon: '🧎', zh: '蹲一下', en: 'Squat' }
  ];

  var CFG = {
    K1: { count: 1, exposureMs: 2600, mode: 'copy', optionCount: 3 },
    K2: { count: 2, exposureMs: 3000, mode: 'copy', optionCount: 4 },
    G1: { count: 3, exposureMs: 3400, mode: 'reverse', optionCount: 5 },
    G2: { count: 3, exposureMs: 3600, mode: 'update', optionCount: 5 }
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
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = CFG[gradeCode];
    if (!cfg) { return null; }

    var shown = shuffled(ACTIONS, rnd).slice(0, cfg.count);
    var expected = shown.map(function (a) { return a.id; });
    var update = null;

    if (cfg.mode === 'reverse') {
      expected.reverse();
    } else if (cfg.mode === 'update') {
      var index = Math.floor(rnd() * shown.length);
      var unused = ACTIONS.filter(function (a) {
        return shown.every(function (s) { return s.id !== a.id; });
      });
      var replacement = shuffled(unused, rnd)[0];
      update = {
        index: index,
        oldId: shown[index].id,
        newId: replacement.id,
        oldAction: shown[index],
        newAction: replacement
      };
      expected[index] = replacement.id;
    }

    var optionIds = expected.slice();
    shuffled(ACTIONS, rnd).forEach(function (a) {
      if (optionIds.length < cfg.optionCount && optionIds.indexOf(a.id) < 0) {
        optionIds.push(a.id);
      }
    });

    return {
      gradeCode: gradeCode,
      mode: cfg.mode,
      shown: shown,
      expected: expected,
      update: update,
      exposureMs: cfg.exposureMs,
      choices: shuffled(optionIds, rnd),
      actions: ACTIONS,
      options: ['done'],
      answer: 'done',
      optionTypes: { done: 'working_memory' },
      key: gradeCode + ':' + shown.map(function (a) { return a.id; }).join(',') +
        ':' + expected.join(',')
    };
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], seen = {}, guard = 0;
    while (out.length < count && guard++ < count * 40) {
      var q = buildQuestion(gradeCode, rnd);
      if (!q || seen[q.key]) { continue; }
      seen[q.key] = true;
      out.push(q);
    }
    return out;
  }

  return {
    ACTIONS: ACTIONS,
    CFG: CFG,
    generate: generate,
    buildQuestion: buildQuestion,
    rngFor: rngFor
  };
}());
