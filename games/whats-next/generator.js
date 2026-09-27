'use strict';

/**
 * What's Next — Generator
 * Picks rule chains and builds forward-prediction / goal-directed /
 * two-hop-chain questions for MindSeeds · Strategy Master.
 *   - forward_predict (one_hop): "press action X, what happens?" -> effect.
 *   - goal_directed   (one_hop): "you want effect Y, which action?" -> action.
 *   - forward_predict (two_hop): "press action X, what happens in the end?"
 *     -> chases action -> mid -> final across two rule cards.
 * Options are the underlying node objects (not strings) — shell.js passes
 * the exact q.options entry by reference into checkAnswer.
 */
var WN_GEN = (function () {

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

  function dedupeByIcon(nodes) {
    var seen = {}, out = [];
    nodes.forEach(function (n) {
      if (!seen[n.icon]) { seen[n.icon] = true; out.push(n); }
    });
    return out;
  }

  // Tops up a wrong-answer pool with nodes plucked from chains outside the
  // ones already on screen, so K1's 2-rule board still finds 2 distractors.
  function topUpFromUnusedChains(wrongPool, usedChains, pickField, rnd, needed) {
    var unused = shuffled(WN_DATA.chains.filter(function (c) { return usedChains.indexOf(c) === -1; }), rnd);
    var i = 0;
    while (dedupeByIcon(wrongPool).length < needed && i < unused.length) {
      wrongPool.push(unused[i][pickField]);
      i++;
    }
    return wrongPool;
  }

  function buildOneHop(cfg, rnd) {
    var chains = shuffled(WN_DATA.chains, rnd).slice(0, cfg.ruleCount);
    if (chains.length < cfg.ruleCount) { return null; }

    var rules = chains.map(function (c) { return { action: c.action, effect: c.mid }; });
    var targetIdx = Math.floor(rnd() * chains.length);
    var target = chains[targetIdx];

    var pickField = cfg.direction === 'goal_directed' ? 'action' : 'mid';
    var correct = target[pickField];
    var wrongPool = chains.filter(function (_, i) { return i !== targetIdx; }).map(function (c) { return c[pickField]; });
    wrongPool = topUpFromUnusedChains(wrongPool, chains, pickField, rnd, 2);
    wrongPool = dedupeByIcon(wrongPool);
    if (wrongPool.length < 2) { return null; }
    var wrongs = shuffled(wrongPool, rnd).slice(0, 2);

    return {
      direction:  cfg.direction,
      chainDepth: 'one_hop',
      rules:      rules,
      promptNode: cfg.direction === 'goal_directed' ? target.mid : target.action,
      answer:     correct,
      options:    shuffled([correct, wrongs[0], wrongs[1]], rnd)
    };
  }

  function buildTwoHop(cfg, rnd) {
    var extraCount = Math.max(0, cfg.ruleCount - 2);
    var chains = shuffled(WN_DATA.chains, rnd).slice(0, 1 + extraCount);
    if (chains.length < 1 + extraCount) { return null; }
    var target = chains[0];
    var extras = chains.slice(1);

    var rules = [
      { action: target.action, effect: target.mid },
      { action: target.mid,    effect: target.final }
    ].concat(extras.map(function (c) { return { action: c.action, effect: c.mid }; }));

    var wrongPool = [target.mid].concat(
      extras.map(function (c) { return c.mid; }),
      extras.map(function (c) { return c.final; })
    );
    wrongPool = topUpFromUnusedChains(wrongPool, chains, 'final', rnd, 2);
    wrongPool = dedupeByIcon(wrongPool);
    if (wrongPool.length < 2) { return null; }
    var wrongs = shuffled(wrongPool, rnd).slice(0, 2);

    return {
      direction:  'forward_predict',
      chainDepth: 'two_hop',
      rules:      rules,
      promptNode: target.action,
      answer:     target.final,
      options:    shuffled([target.final, wrongs[0], wrongs[1]], rnd)
    };
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = WN_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    for (var attempt = 0; attempt < 50; attempt++) {
      var built = cfg.chainDepth === 'two_hop' ? buildTwoHop(cfg, rnd) : buildOneHop(cfg, rnd);
      if (!built) { continue; }

      var optionTypes = {};
      built.options.forEach(function (o) {
        optionTypes[o.icon] = (o === built.answer) ? 'correct' : 'wrong';
      });

      return Object.assign({
        gradeCode: gradeCode,
        optionTypes: optionTypes,
        hintZh: built.direction === 'goal_directed'
          ? '看看每条规则的结果，找到能达成目标的那个动作。'
          : (built.chainDepth === 'two_hop' ? '顺着规则一步一步推到最后。' : '找到这个动作对应的规则卡。'),
        hintEn: built.direction === 'goal_directed'
          ? 'Check what each rule leads to, then pick the action that reaches the goal.'
          : (built.chainDepth === 'two_hop' ? 'Follow the rules step by step to the final result.' : 'Find the rule card that matches this action.')
      }, built);
    }
    return null;
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (!q) { break; }
      if (last && q.answer.icon === last.answer.icon &&
          q.rules.map(function (r) { return r.action.icon; }).join() === last.rules.map(function (r) { return r.action.icon; }).join()) {
        q = buildQuestion(gradeCode, rnd) || q;
      }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
