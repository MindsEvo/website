'use strict';

/**
 * Energy Planner — Generator
 * Builds a budget + a task list, then 3 candidate plans (subsets of the
 * task list) where exactly one satisfies the question's goal:
 *   - fit_only:        exactly 1 of 3 candidates has cost <= budget.
 *   - maximize_reward: all 3 candidates fit the budget but have 3 distinct
 *                       reward totals, so the highest is unambiguous.
 * Options are kept as full plan objects (not primitives) — shell.js passes
 * the exact q.options entry by reference into checkAnswer, so identity
 * comparison against q.answer is safe and avoids re-serializing plans.
 */
var EP_GEN = (function () {

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

  function pick(list, rnd) { return list[Math.floor(rnd() * list.length)]; }

  function subsetsOf(tasks) {
    var n = tasks.length;
    var out = [];
    for (var mask = 1; mask < (1 << n); mask++) {
      var cost = 0, reward = 0, items = [];
      for (var i = 0; i < n; i++) {
        if (mask & (1 << i)) { cost += tasks[i].cost; reward += tasks[i].reward; items.push(tasks[i]); }
      }
      out.push({ mask: mask, items: items, cost: cost, reward: reward });
    }
    return out;
  }

  // Picks a subset whose cost is the unique cheapest among all subsets (no
  // ties) and sets the budget to exactly that cost, so it is the only
  // feasible plan. Ratio-based budgets are too unreliable when there are
  // only a handful of subsets (e.g. taskCount=2 -> 3 subsets total).
  function buildFitOnly(subsets, rnd) {
    var candidates = subsets.filter(function (s) {
      var sameCost   = subsets.filter(function (x) { return x.cost === s.cost; }).length;
      var higherCost = subsets.filter(function (x) { return x.cost > s.cost; }).length;
      return sameCost === 1 && higherCost >= 2;
    });
    if (!candidates.length) { return null; }
    var correct = pick(candidates, rnd);
    var budget  = correct.cost;
    var infeasible = subsets.filter(function (s) { return s.cost > budget; });
    var wrongs = shuffled(infeasible, rnd).slice(0, 2);
    if (wrongs.length < 2) { return null; }
    return { correct: correct, budget: budget, candidates: [correct, wrongs[0], wrongs[1]] };
  }

  function buildMaximizeReward(subsets, budget, rnd) {
    var feasible = subsets.filter(function (s) { return s.cost <= budget; });
    var byReward = {};
    feasible.forEach(function (s) {
      if (!byReward[s.reward]) { byReward[s.reward] = s; }
    });
    var rewards = Object.keys(byReward).map(Number).sort(function (a, b) { return b - a; });
    if (rewards.length < 3) { return null; }
    var top = rewards.slice(0, 3).map(function (r) { return byReward[r]; });
    return { correct: top[0], candidates: top };
  }

  function buildQuestion(gradeCode, rnd) {
    var cfg = EP_DATA.gradeConfig[gradeCode];
    if (!cfg) { return null; }

    for (var attempt = 0; attempt < 50; attempt++) {
      var tasks = shuffled(EP_DATA.taskPool, rnd).slice(0, cfg.taskCount);
      var subsets = subsetsOf(tasks);

      var built, budget;
      if (cfg.goalType === 'maximize_reward') {
        var sumCost = tasks.reduce(function (s, t) { return s + t.cost; }, 0);
        budget = Math.max(1, Math.round(sumCost * cfg.budgetRatio));
        built = buildMaximizeReward(subsets, budget, rnd);
      } else {
        built = buildFitOnly(subsets, rnd);
        budget = built && built.budget;
      }
      if (!built) { continue; }

      var options = shuffled(built.candidates, rnd);
      var optionTypes = {};
      options.forEach(function (o) {
        optionTypes[o.mask] = (o === built.correct) ? 'correct_plan' : 'wrong_plan';
      });

      return {
        gradeCode:   gradeCode,
        goalType:    cfg.goalType,
        tasks:       tasks,
        budget:      budget,
        options:     options,
        answer:      built.correct,
        optionTypes: optionTypes,
        hintZh: cfg.goalType === 'maximize_reward'
          ? '算一算每个方案的总收益，别超过预算。'
          : '算一算每个方案要花多少能量，别超过预算。',
        hintEn: cfg.goalType === 'maximize_reward'
          ? "Add up each plan's total reward without going over budget."
          : "Add up each plan's energy cost and stay within budget."
      };
    }
    return null;
  }

  function generate(gradeCode, count, seed) {
    var rnd = rngFor(seed);
    var out = [], last = null;
    for (var i = 0; i < count; i++) {
      var q = buildQuestion(gradeCode, rnd);
      if (!q) { break; }
      if (last && q.answer.mask === last.answer.mask &&
          q.tasks.map(function (t) { return t.icon; }).join() === last.tasks.map(function (t) { return t.icon; }).join()) {
        q = buildQuestion(gradeCode, rnd) || q;
      }
      out.push(q);
      last = q;
    }
    return out;
  }

  return { generate: generate, buildQuestion: buildQuestion, rngFor: rngFor };
}());
